"""Build the PaRappa-mode header title ("PARAPPA THE RAPPER") as SVG paths.

The title used to be SVG <text> with a 6px black stroke under a coloured fill.
At 31px the holes inside P, A and R (about 3-8px across) are narrower than
that stroke, so it filled them solid black. Drawing the letters from the
font's own outlines lets each layer use only the contours it should:

  1. the thick 6px black outline around the OUTSIDE contours only,
  2. a black line around the holes (HOLE_LINE on the big P and R, with half
     of it hidden under the fill; HOLE_LINE_SMALL on the half-height letters,
     and a thinner HOLE_LINE_SMALL_A on the small A so its tiny hole stays
     open),
  3. the coloured letter fill, with real holes (the white pill shows through).

The title is set like small caps: the capital P, R, T and R are full size
and every other letter is a half-height capital on the same baseline, with
no gaps between words (PaRappaTheRapper). Letters are kerned by shape (see
layout()): each sits KERN_GAP px from its neighbour at their closest point,
so the small letters tuck under the capitals' overhangs. Run it to print
the new <svg> markup, or with --apply to swap it into every page. The title
is arched (ARCH px higher in the middle than at the ends), each letter
turned to follow the curve.

    python scripts/build_logo_svg.py --apply
"""
import glob
import os
import sys

from fontTools.pens.areaPen import AreaPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'RodneyWriteBold.ttf')
SIZE = 62            # px, letter size (double the old 31px .logo font-size)
BASELINE = 50
HEIGHT = 66
LETTER_SPACING = 0
WORD_GAP = 0         # px for each space between words (the font's space is ~12px at 62px)
KERN_GAP = 1.0       # px between neighbouring letters at their closest point
# Per-pair overrides: {index of the letter (0 = first P): px from the letter before it}
PAIR_GAP = {1: 4.0, 2: 5.0, 3: 5.0, 4: 5.0, 6: 4.0, 7: 6.0, 8: 5.0, 9: 5.0, 10: 5.0, 11: 5.0, 12: 3.0, 15: 5.0}  # P-a, a-R, R-a, a-p, p-a, a-T, T-h, h-e, e-R, R-a, a-p (Rapper) and e-r
ARCH = 18            # px the middle of the title rises above its ends (0 = straight)
TILT = -4            # degrees the whole title is turned (negative = counter-clockwise)
SMALL = 0.5          # half-height letters
OUTLINE = 8          # thick outer outline around each letter
HOLE_LINE = 6        # line around the big letters' holes (P, R): 3px of it shows
HOLE_LINE_SMALL = 3  # same on the half-height letters (1.5px shows)
HOLE_LINE_SMALL_A = 1.5  # except the small A, whose hole is tiny (0.75px shows, so it stays open)

# The title, one entry per letter: lowercase here = drawn as a half-height
# capital. Spaces are word gaps. Colours follow the old <tspan> runs.
TITLE = 'PaRappa The Rapper'
COLOURS = ['#FFB347'] * 2 + ['#1098AD'] * 5 + ['#5CB85C'] * 3 + ['#ED686B'] * 6

OLD_SVG = ('<svg class="logo-svg fit-text" width="367" height="33" role="img" '
           'aria-label="PaRappa the Rapper" focusable="false"><text x="0" y="25">'
           '<tspan fill="#FFB347">PA</tspan><tspan fill="#1098AD">RAPPA</tspan> '
           '<tspan fill="#5CB85C">THE</tspan> <tspan fill="#F07A8E">RAPPER</tspan>'
           '</text></svg>')


def num(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def contours(font, ch, scale=1.0):
    """The glyph's contours as SVG path data (origin at the baseline, y down),
    split into outer contours and holes by winding direction."""
    gs = font.getGlyphSet()
    rec = RecordingPen()
    gs[font.getBestCmap()[ord(ch)]].draw(rec)
    k = SIZE * scale / font['head'].unitsPerEm
    pt = lambda p: num(p[0] * k) + ' ' + num(-p[1] * k)
    outer, holes, cur, area = [], [], [], AreaPen()
    for op, args in rec.value:
        getattr(area, op)(*args)
        if op == 'moveTo':
            cur.append('M' + pt(args[0]))
        elif op == 'lineTo':
            cur.append('L' + pt(args[0]))
        elif op == 'qCurveTo':
            # TrueType quadratic run: split the implied on-curve midpoints.
            pts = list(args)
            *offs, end = pts
            for i, c in enumerate(offs):
                if i < len(offs) - 1:
                    n = offs[i + 1]
                    on = ((c[0] + n[0]) / 2, (c[1] + n[1]) / 2)
                else:
                    on = end
                cur.append('Q' + pt(c) + ' ' + pt(on))
        elif op == 'curveTo':
            cur.append('C' + ' '.join(pt(p) for p in args))
        elif op in ('closePath', 'endPath'):
            cur.append('Z')
            # TrueType outer contours run clockwise: negative area here.
            (outer if area.value < 0 else holes).append(''.join(cur))
            cur, area = [], AreaPen()
    return ''.join(outer), ''.join(holes)


def profile(font, ch, scale, step=0.5):
    """{row: [min x, max x]} of the glyph's ink, rows every `step` px up from
    the baseline, from its contours flattened to short line segments."""
    gs = font.getGlyphSet()
    rec = RecordingPen()
    gs[font.getBestCmap()[ord(ch)]].draw(rec)
    k = SIZE * scale / font['head'].unitsPerEm
    segs, cur, start = [], None, None
    for op, args in rec.value:
        if op == 'moveTo':
            cur = start = args[0]
        elif op == 'lineTo':
            segs.append((cur, args[0]))
            cur = args[0]
        elif op == 'qCurveTo':
            *offs, end = args
            for i, c in enumerate(offs):
                on = ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2) if i < len(offs) - 1 else end
                p0 = cur
                for j in range(1, 13):
                    t = j / 12
                    q = ((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * on[0],
                         (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * on[1])
                    segs.append((cur, q))
                    cur = q
        elif op in ('closePath', 'endPath'):
            if cur != start:
                segs.append((cur, start))
            cur = start
    rows = {}
    for (x0, y0), (x1, y1) in segs:
        x0, y0, x1, y1 = x0 * k, y0 * k, x1 * k, y1 * k
        if y0 == y1:
            continue
        lo, hi = min(y0, y1), max(y0, y1)
        r = int(lo / step)
        while r * step <= hi:
            yy = r * step
            if yy >= lo:
                xx = x0 + (x1 - x0) * (yy - y0) / (y1 - y0)
                row = rows.setdefault(r, [1e9, -1e9])
                row[0], row[1] = min(row[0], xx), max(row[1], xx)
            r += 1
    return rows


def layout(font):
    """[(letter, scale, x)] for the title's letters, and the total width.

    Letters are kerned by shape: each one slides in until it is KERN_GAP px
    from the letter before it at their closest point, measured row by row
    (and KERN_GAP rows up and down, so a letter tucked under an overhang
    like P's bowl or T's crossbar keeps the same clearance above it). Small
    letters therefore tuck under the big capitals' overhangs."""
    cmap, hmtx = font.getBestCmap(), font['hmtx']
    k = SIZE / font['head'].unitsPerEm
    out, prev, x = [], None, 0.0
    for ch in TITLE:
        scale = SMALL if ch.islower() else 1.0
        up = ch.upper()
        if up == ' ':
            x += WORD_GAP
            continue
        prof = profile(font, up, scale)
        if prev is not None:
            px, pprof = prev
            gap = PAIR_GAP.get(len(out), KERN_GAP)
            reach = int(round(gap / 0.5))
            need = -1e9
            for r, (lo, _) in prof.items():
                for d in range(-reach, reach + 1):
                    if r + d in pprof:
                        need = max(need, px + pprof[r + d][1] + gap - lo)
            x = max(need, px) if need > -1e9 else x
        out.append((up, scale, x))
        prev = (x, prof)
    last_ch, last_sc, last_x = out[-1]
    width = last_x + hmtx[cmap[ord(last_ch)]][0] * k * last_sc
    return out, width


def arch(font, letters, width):
    """Place each letter on an arc that rises ARCH px toward the middle of
    the title (like an "Arch Up" text effect). Every letter keeps its spot
    along the baseline and is turned to follow the curve around its own
    baseline centre. Returns per-letter transforms and the bounding box of
    the turned letters (outline included)."""
    import math
    cmap, hmtx = font.getBestCmap(), font['hmtx']
    gs = font.getGlyphSet()
    from fontTools.pens.boundsPen import BoundsPen
    k = SIZE / font['head'].unitsPerEm
    radius = (width * width / 4 + ARCH * ARCH) / (2 * ARCH) if ARCH else None
    out, xs, ys = [], [], []
    for ch, sc, x in letters:
        adv = hmtx[cmap[ord(ch)]][0] * k * sc
        mid = x + adv / 2                       # baseline centre of the letter
        if radius:
            t = (mid - width / 2) / radius      # angle along the arc
            cx = width / 2 + radius * math.sin(t)
            cy = BASELINE + radius * (1 - math.cos(t))
        else:
            t, cx, cy = 0.0, mid, BASELINE
        out.append('translate(%s %s) rotate(%s) translate(%s 0)'
                   % (num(cx), num(cy), num(math.degrees(t)), num(-adv / 2)))
        bp = BoundsPen(gs)
        gs[cmap[ord(ch)]].draw(bp)
        x0, y0, x1, y1 = (v * k * sc for v in bp.bounds)
        for gx, gy in ((x0, -y0), (x1, -y0), (x0, -y1), (x1, -y1)):
            lx, ly = gx - adv / 2, gy
            xs.append(cx + lx * math.cos(t) - ly * math.sin(t))
            ys.append(cy + lx * math.sin(t) + ly * math.cos(t))
    # The whole title is then turned TILT degrees about its centre.
    ca, sa = math.cos(math.radians(TILT)), math.sin(math.radians(TILT))
    ox, oy = width / 2, BASELINE
    pts = [(ox + (px - ox) * ca - (py - oy) * sa, oy + (px - ox) * sa + (py - oy) * ca)
           for px, py in zip(xs, ys)]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    m = OUTLINE / 2 + 1
    return out, (min(xs) - m, min(ys) - m, max(xs) + m, max(ys) + m)


def build():
    font = TTFont(FONT)
    letters, width = layout(font)
    defs, has_hole, seen = [], {}, set()
    for ch, scale, _ in letters:
        key = ch + ('' if scale == 1 else 's')
        if key in seen:
            continue
        seen.add(key)
        o, h = contours(font, ch, scale)
        defs.append('<path id="lg-%s-o" d="%s"/>' % (key, o))
        if h:
            defs.append('<path id="lg-%s-h" d="%s"/>' % (key, h))
        defs.append('<path id="lg-%s" d="%s"/>' % (key, o + h))
        has_hole[key] = bool(h)
    moves, (bx0, by0, bx1, by1) = arch(font, letters, width)
    keyed = [(ch + ('' if sc == 1 else 's'), mv) for (ch, sc, _), mv in zip(letters, moves)]
    use = lambda ref, mv, extra='': '<use href="#%s" transform="%s"%s/>' % (ref, mv, extra)
    layer1 = ''.join(use('lg-%s-o' % key, mv) for key, mv in keyed)
    # Hole edges scale with the letter, so the half-height letters' tiny holes
    # stay open (the thick outer outline stays the same on every letter).
    layer2 = ''.join(use('lg-%s-h' % key, mv) for key, mv in keyed if has_hole[key] and not key.endswith('s'))
    layer2s = ''.join(use('lg-%s-h' % key, mv) for key, mv in keyed if has_hole[key] and key.endswith('s') and key != 'As')
    layer2a = ''.join(use('lg-%s-h' % key, mv) for key, mv in keyed if has_hole[key] and key == 'As')
    layer3 = ''.join(use('lg-' + key, mv, ' fill="%s"' % col) for (key, mv), col in zip(keyed, COLOURS))
    # The SVG box hugs the turned letters (outline included), so the pill
    # around it fits the arched title.
    vx, vy = int(bx0 // 1), int(by0 // 1)
    w, h = int(-(-(bx1 - vx) // 1)), int(-(-(by1 - vy) // 1))
    return ('<svg class="logo-svg" width="%d" height="%d" viewBox="%d %d %d %d" role="img" '
            'aria-label="PaRappa the Rapper" focusable="false">'
            '<defs>%s</defs><g transform="rotate(%s %s %s)">'
            '<g fill="none" stroke="#000" stroke-width="%d" stroke-linejoin="round">%s</g>'
            '<g fill="none" stroke="#000" stroke-width="%s" stroke-linejoin="round">%s</g>'
            '<g fill="none" stroke="#000" stroke-width="%s" stroke-linejoin="round">%s</g>'
            '<g fill="none" stroke="#000" stroke-width="%s" stroke-linejoin="round">%s</g>'
            '<g>%s</g></g></svg>'
            % (w, h, vx, vy, w, h, ''.join(defs), num(TILT), num(width / 2), BASELINE, OUTLINE, layer1,
               num(HOLE_LINE), layer2, num(HOLE_LINE_SMALL), layer2s,
               num(HOLE_LINE_SMALL_A), layer2a, layer3))


if __name__ == '__main__':
    svg = build()
    if '--apply' not in sys.argv:
        print(svg)
        sys.exit()
    # Replaces the original <text> title, or any title this script built
    # before (an <svg class="logo-svg" ...> using the lg-* letter paths).
    import re
    built = re.compile(r'<svg class="logo-svg" [^>]*><defs><path id="lg-.*?</svg>')
    n = 0
    for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        s = open(f, encoding='utf-8', newline='').read()
        t = s.replace(OLD_SVG, svg) if OLD_SVG in s else built.sub(lambda m: svg, s, count=1)
        if t != s:
            open(f, 'w', encoding='utf-8', newline='').write(t)
            n += 1
    print('updated %d pages (%d bytes of title markup each)' % (n, len(svg)))
