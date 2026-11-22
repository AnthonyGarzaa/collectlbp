"""Build the curved "The Hip Hop Hero" tagline markup in the PaRappa-mode header.

The tagline curves downward (ends up, middle dipping CURVE px, like a smile)
under the arched title. Each letter is its own span, moved down and tilted
along the curve with two CSS variables (--dy, --r) that parappa.css turns
into a transform; each span also carries its letter in data-ch so its yellow
shadow copy (.tl-ch::before) follows the curve with it. Spaces stay plain
text between the spans.

    python scripts/build_tagline.py --apply
"""
import glob
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = 'The Hip Hop Hero'
CURVE = 7          # px the middle of the tagline dips below its ends
HALF_WIDTH = 101.5 # px, half the tagline's rendered width (203px)


def build():
    n = len(TEXT)
    mid = (n - 1) / 2
    parts = []
    for i, ch in enumerate(TEXT):
        if ch == ' ':
            parts.append(' ')
            continue
        t = (i - mid) / mid                       # -1 at the left end, 1 at the right
        dy = CURVE * (1 - t * t)                  # 0 at the ends, CURVE in the middle
        rot = math.degrees(math.atan(-2 * CURVE * t / HALF_WIDTH))
        parts.append('<span class="tl-ch" data-ch="%s" style="--dy:%.2fpx;--r:%.2fdeg">%s</span>'
                     % (ch, dy, rot, ch))
    return ('<div class="tagline" id="siteTagline"><span class="tagline-text" aria-label="%s">%s</span></div>'
            % (TEXT, ''.join(parts)))


PATTERN = re.compile(r'<div class="tagline" id="siteTagline">.*?</span></div>')

if __name__ == '__main__':
    html = build()
    if '--apply' not in sys.argv:
        print(html)
        sys.exit()
    n = 0
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        s = open(f, encoding='utf-8', newline='').read()
        t = PATTERN.sub(lambda m: html, s, count=1)
        if t != s:
            open(f, 'w', encoding='utf-8', newline='').write(t)
            n += 1
    print('updated %d pages' % n)
