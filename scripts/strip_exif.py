"""Strip identifying metadata (camera model, phone build, timestamps) from images.

Losslessly: the encoded image data is copied verbatim and never re-compressed,
so scans keep their exact original quality. Only container metadata is dropped.

Kept on purpose: ICC colour profiles, JFIF/Adobe markers, PNG gamma/sRGB chunks.
Dropping those would shift colours.

Usage:
    python strip_exif.py                  # dry run over the whole project
    python strip_exif.py --apply          # actually rewrite the files
    python strip_exif.py --apply some.jpg "Parappa Site/Promo"
"""
import sys
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # a few archive scans are very large; they are ours

ROOT = Path(__file__).resolve().parent.parent
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SKIP_DIRS = {".git", ".claude", "node_modules"}

# JPEG segments to drop. APP1=Exif/XMP, APP13=Photoshop/IPTC (author, caption),
# APP12=Ducky. COM=free-text comment. APP0/APP2/APP14 are kept (JFIF, ICC, Adobe).
JPEG_DROP = {0xE1, 0xEC, 0xED, 0xFE}
# PNG ancillary chunks holding metadata. iCCP/gAMA/cHRM/sRGB are kept.
PNG_DROP = {b"tEXt", b"zTXt", b"iTXt", b"eXIf", b"tIME"}


def strip_jpeg(data):
    """Rewrite a JPEG without metadata segments. Entropy-coded scan is untouched."""
    if not data.startswith(b"\xff\xd8"):
        return None, []
    out = bytearray(b"\xff\xd8")
    dropped = []
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            return None, []  # not where a marker should be; leave the file alone
        marker = data[i + 1]
        if marker == 0xD9:  # EOI
            out += data[i:]
            return bytes(out), dropped
        if marker == 0xDA:  # SOS - scan data runs to the end, copy it all verbatim
            out += data[i:]
            return bytes(out), dropped
        if marker in (0x01, 0xD8) or 0xD0 <= marker <= 0xD7:
            out += data[i:i + 2]  # standalone marker, no payload
            i += 2
            continue
        length = int.from_bytes(data[i + 2:i + 4], "big")
        if length < 2:
            return None, []
        end = i + 2 + length
        if marker in JPEG_DROP:
            dropped.append("APP%d" % (marker - 0xE0) if marker != 0xFE else "COM")
        else:
            out += data[i:end]
        i = end
    return None, []


def strip_png(data):
    """Rewrite a PNG without metadata chunks. Chunks are copied with their CRCs."""
    sig = b"\x89PNG\r\n\x1a\n"
    if not data.startswith(sig):
        return None, []
    out = bytearray(sig)
    dropped = []
    i = len(sig)
    while i + 8 <= len(data):
        length = int.from_bytes(data[i:i + 4], "big")
        ctype = data[i + 4:i + 8]
        end = i + 12 + length  # length + type + data + crc
        if end > len(data):
            return None, []
        if ctype in PNG_DROP:
            dropped.append(ctype.decode("ascii", "replace"))
        else:
            out += data[i:end]
        i = end
        if ctype == b"IEND":
            break
    return bytes(out), dropped


def strip_webp(data):
    """Rewrite a WebP without EXIF/XMP chunks, clearing the VP8X flag bits."""
    if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
        return None, []
    body = bytearray()
    dropped = []
    i = 12
    while i + 8 <= len(data):
        fourcc = data[i:i + 4]
        size = int.from_bytes(data[i + 4:i + 8], "little")
        end = i + 8 + size + (size & 1)  # chunks are padded to even length
        if end > len(data):
            return None, []
        if fourcc in (b"EXIF", b"XMP "):
            dropped.append(fourcc.decode("ascii", "replace").strip())
        else:
            chunk = bytearray(data[i:end])
            if fourcc == b"VP8X" and size >= 1:
                chunk[8] &= ~0x0C & 0xFF  # clear the EXIF (0x08) and XMP (0x04) flags
            body += chunk
        i = end
    if not dropped:
        return None, []
    out = b"RIFF" + (len(body) + 4).to_bytes(4, "little") + b"WEBP" + bytes(body)
    return out, dropped


STRIPPERS = {".jpg": strip_jpeg, ".jpeg": strip_jpeg, ".png": strip_png, ".webp": strip_webp}


def probe(path):
    """Original dimensions and mode, used to confirm the rewrite stayed valid."""
    with Image.open(path) as im:
        return im.size, im.mode


def process(path, apply):
    ext = path.suffix.lower()
    try:
        data = path.read_bytes()
        new, dropped = STRIPPERS[ext](data)
    except Exception as exc:
        print(f"  skip  {path}  ({exc})")
        return False
    if not new or not dropped:
        return False

    saved = len(data) - len(new)
    print(f"  {path.relative_to(ROOT)}  -{saved:,} bytes  [{', '.join(sorted(set(dropped)))}]")
    if not apply:
        return True

    before = probe(path)
    tmp = path.with_suffix(path.suffix + ".stripping")
    tmp.write_bytes(new)
    try:
        if probe(tmp) != before:
            raise ValueError("dimensions or mode changed")
        with Image.open(tmp) as im:
            im.verify()
    except Exception as exc:
        tmp.unlink(missing_ok=True)
        print(f"    !! left untouched, rewrite failed verification: {exc}")
        return False
    tmp.replace(path)
    return True


def walk(targets):
    for target in targets:
        if target.is_file():
            if target.suffix.lower() in EXTS:
                yield target
            continue
        for p in sorted(target.rglob("*")):
            if p.suffix.lower() in EXTS and not any(d in SKIP_DIRS for d in p.parts):
                yield p


args = [a for a in sys.argv[1:] if a != "--apply"]
apply = "--apply" in sys.argv[1:]
targets = [Path(a) if Path(a).is_absolute() else ROOT / a for a in args] or [ROOT]

print("stripping metadata" if apply else "dry run - nothing will be written")
changed = sum(process(p, apply) for p in walk(targets))
if not changed:
    print("no metadata found")
elif apply:
    print(f"\nstripped {changed} file(s)")
else:
    print(f"\n{changed} file(s) would be stripped - re-run with --apply")
