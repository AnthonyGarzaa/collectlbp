"""Build parappa-search-index.js for the PaRappa section's Search page.

Every section of the PaRappa site is its own HTML page, so the Search page
can't read the other pages' text out of the DOM the way it did when the whole
site was one file. This script reads each page, pulls out the visible English
and Japanese text of its content block, counts the unique images and videos,
and writes it all to parappa-search-index.js (loaded only by search.html).

Re-run it after editing any page's content so search results stay current:

    python scripts/build_search_index.py
"""
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "parappa-search-index.js"

# Pages under the HOME menu are not counted as "content pages" (same rule as
# the old in-page counter) but Search still looks through them.
HOME_PAGES = {"welcome", "search", "donate", "contact"}

VOID = {"img", "br", "source", "input", "meta", "link", "hr", "wbr", "area", "col", "embed", "param", "track"}


class PageParser(HTMLParser):
    """Collects, for the <div id="page-…" class="page …"> block of a file,
    the text as seen in English and in Japanese (dropping the other
    language's .en/.ja/.block-en/.block-ja spans and any <script>/<style>),
    the section title in both languages, and unique image / video sources
    (the way the old in-page counter did: data-full or src for images,
    ignoring YouTube thumbnails inside .yt-facade; file or YouTube id for
    videos)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # one flag-set per open non-void element
        self.page_level = None   # stack length at which the page div sits
        self.page_id = None
        self.done = False
        self.text = {"en": [], "ja": []}
        self.title = {"en": [], "ja": []}
        self.saw_title = False
        self.imgs = set()
        self.vids = set()
        self.video_src = None

    @staticmethod
    def classes(a):
        return set((a.get("class") or "").split())

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = self.classes(a)
        inside = self.page_level is not None and not self.done
        if not inside:
            if tag == "div" and (a.get("id") or "").startswith("page-") and "page" in cls and self.page_id is None:
                self.page_id = a["id"][len("page-"):]
                self.page_level = len(self.stack)
                self.stack.append(set())
            elif tag not in VOID:
                self.stack.append(set())
            return
        parent = self.stack[-1]
        flags = set(parent)
        if tag in ("script", "style"):
            flags.add("skip")
        if cls & {"en", "block-en"}:
            flags.add("en-only")
        if cls & {"ja", "block-ja"}:
            flags.add("ja-only")
        if "yt-facade" in cls:
            flags.add("facade")
            if a.get("data-video-id"):
                self.vids.add("yt:" + a["data-video-id"])
        if "section-title" in cls and not self.saw_title:
            self.saw_title = True
            flags.add("title")
        if "title" in flags:
            if "en" in cls:
                flags.add("title-en")
            if "ja" in cls:
                flags.add("title-ja")
        if tag == "video":
            flags.add("video")
            self.video_src = a.get("src")
        if tag == "img" and "facade" not in flags:
            src = a.get("data-full") or a.get("src")
            if src:
                self.imgs.add(src)
        if tag == "source" and "video" in flags and not self.video_src and a.get("src"):
            self.video_src = a["src"]
        if tag not in VOID:
            self.stack.append(flags)

    def handle_endtag(self, tag):
        if tag in VOID or not self.stack:
            return
        flags = self.stack.pop()
        if self.page_level is None or self.done:
            return
        if tag == "video" and "video" in flags and "video" not in (self.stack[-1] if self.stack else set()):
            if self.video_src:
                self.vids.add("file:" + self.video_src)
            self.video_src = None
        if len(self.stack) == self.page_level:
            self.done = True

    def handle_data(self, data):
        if self.page_level is None or self.done or not self.stack:
            return
        flags = self.stack[-1]
        if "skip" in flags:
            return
        if "title-en" in flags:
            self.title["en"].append(data)
        if "title-ja" in flags:
            self.title["ja"].append(data)
        if "ja-only" not in flags:
            self.text["en"].append(data)
        if "en-only" not in flags:
            self.text["ja"].append(data)


def squash(parts):
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def parse_page(path):
    p = PageParser()
    p.feed(path.read_text(encoding="utf-8"))
    if not p.page_id:
        return None
    en = squash(p.title["en"])
    ja = squash(p.title["ja"])
    return {
        "id": p.page_id,
        "en": en or p.page_id,
        "ja": ja or en or p.page_id,
        "textEn": squash(p.text["en"]),
        "textJa": squash(p.text["ja"]),
        "_imgs": p.imgs,
        "_vids": p.vids,
    }


def main():
    pages = []
    imgs, vids = set(), set()
    for path in sorted(ROOT.glob("*.html")):
        data = parse_page(path)
        if not data:
            continue  # not a PaRappa-section page (e.g. the Vib-Ribbon pages)
        page_imgs, page_vids = data.pop("_imgs"), data.pop("_vids")
        if data["id"] not in HOME_PAGES:
            imgs |= page_imgs
            vids |= page_vids
        pages.append(data)
    pages.sort(key=lambda d: d["id"])
    index = {
        "pages": pages,
        "totalPages": sum(1 for d in pages if d["id"] not in HOME_PAGES),
        "imageCount": len(imgs),
        "videoCount": len(vids),
    }
    body = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "// Generated by scripts/build_search_index.py - do not edit by hand.\n"
        "// Re-run that script after editing any page so Search stays current.\n"
        "window.PARAPPA_SEARCH_INDEX = " + body + ";\n",
        encoding="utf-8", newline="\n",
    )
    print("indexed %d pages (%d content pages), %d images, %d videos -> %s" % (
        len(pages), index["totalPages"], index["imageCount"], index["videoCount"], OUT.name))


if __name__ == "__main__":
    main()
