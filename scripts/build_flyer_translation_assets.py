"""Build the images for the flyer-styled Lammy NOW! flyer translation
(the "Click Here For The Translation!" document on ujlnow-prize.html).

Writes into LammyStuff/UJLNow!/GiveawayCampaign/FlyerTranslation/:
  namco.png       LammyStuff/UJLNow!/GiveawayCampaign/logo.png cropped to the wordmark
  tambourine.png  prize B's tambourine, cut out of the flyer scan (LammyNowFlyer.png)
  guitar.png      prize C's light-up guitar, cut out of the flyer scan
  *.png/*.webp    downsized copies of the large site images the translation shows

    python scripts/build_flyer_translation_assets.py
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "LammyStuff/UJLNow!/GiveawayCampaign/FlyerTranslation"
OUT.mkdir(parents=True, exist_ok=True)

def web_copy(src, name, width):
    im = Image.open(ROOT / src).convert("RGBA")
    im = im.crop(im.getbbox()) if im.getbbox() else im
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if name.endswith(".webp"):
        im.save(OUT / name, quality=86, method=6)
    else:
        im.save(OUT / name, optimize=True)



# ── Cut-outs from the flyer scan ──
FLYER = Image.open(ROOT / "LammyStuff/UJLNow!/GiveawayCampaign/LammyNowFlyer.png").convert("RGB")
_med = np.asarray(FLYER.filter(ImageFilter.MedianFilter(5))).astype(int)   # smooths the print texture
_R, _G, _B = _med[..., 0], _med[..., 1], _med[..., 2]
YELLOW = (_R > 200) & (_G > 185) & (_B < 140) & (_R - _B > 110)          # prize B band
ORANGE = (_R > 215) & (_G > 120) & (_G < 205) & (_B < 120) & (_R - _G > 35)  # prize C band
GREEN = (_G > 120) & (_R < 150) & (_B < 150) & (_G - _R > 30)            # dotted divider
DIVIDER_Y = 1126   # the green dotted line between the B and C bands


def _flood(passable, h, w):
    """Pixels of `passable` reachable from the crop's border."""
    seen = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if passable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if passable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def flyer_cutout(box, background, name, keep_min=None, clear=None, close=9):
    """Cut the object inside `box` out of the flyer.

    `background` marks the band colour around it; it is flood-filled from the crop's
    edges, so matching colours enclosed by the object are kept. The largest piece is
    closed by `close` px and hole-filled, sealing thin rims (the guitar's START bezel
    and flame decal) the fill would otherwise leak through. Other pieces of at least
    `keep_min` px (the guitar's yellow glow lines) are kept; `clear(ys, xs)` marks
    flyer areas to drop outright, such as neighbouring text.
    """
    x0, y0, x1, y1 = box
    rgba = np.asarray(FLYER.crop(box).convert("RGBA")).copy()
    h, w = rgba.shape[:2]
    bg = background[y0:y1, x0:x1].copy()
    if clear is not None:
        ys, xs = np.mgrid[y0:y1, x0:x1]
        bg |= clear(ys, xs)
    fg = ~_flood(bg, h, w)

    # label the foreground's 8-connected pieces
    lab = np.zeros((h, w), int)
    sizes = [0]
    for sy, sx in zip(*np.nonzero(fg)):
        if lab[sy, sx]:
            continue
        n = len(sizes)
        lab[sy, sx] = n
        q, count = deque([(sy, sx)]), 0
        while q:
            y, x = q.popleft()
            count += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        q.append((ny, nx))
        sizes.append(count)
    main = int(np.argmax(sizes))

    closed = Image.fromarray(((lab == main) * 255).astype(np.uint8))
    closed = closed.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    solid = ~_flood(np.asarray(closed) < 128, h, w)
    extras = np.isin(lab, [i for i in range(1, len(sizes))
                           if i != main and keep_min is not None and sizes[i] >= keep_min])

    alpha = Image.fromarray(((solid | extras) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    rgba[..., 3] = np.asarray(alpha)
    im = Image.fromarray(rgba, "RGBA")
    im.crop(im.getbbox()).save(OUT / name, optimize=True)


flyer_cutout((132, 888, 298, 1020), YELLOW, "tambourine.png")

guitar_bg = np.zeros(YELLOW.shape, bool)                 # the headstock reaches up into band B
guitar_bg[:DIVIDER_Y - 4] = YELLOW[:DIVIDER_Y - 4]
guitar_bg[DIVIDER_Y - 4:DIVIDER_Y + 6] = (YELLOW | ORANGE | GREEN)[DIVIDER_Y - 4:DIVIDER_Y + 6]
guitar_bg[DIVIDER_Y + 6:] = ORANGE[DIVIDER_Y + 6:]
flyer_cutout((138, 1098, 366, 1387), guitar_bg, "guitar.png", keep_min=40,
             # the C heading text to the right of the neck, and the B postcard above the body
             clear=lambda ys, xs: ((xs > 346) & (ys > 1172)) | ((xs < 334) & (ys < 1116)))

web_copy("LammyStuff/UJLNow!/GiveawayCampaign/logo.png", "namco.png", 520)
web_copy("LammyStuff/Renders/logoujl.png", "logoujl.png", 760)
web_copy("LammyStuff/ressources/NOW!_bleu_clair_contour.png", "now.png", 260)
web_copy("LammyStuff/ressources/parappa.png", "parappa.png", 360)
web_copy("LammyStuff/ressources/lammy.png", "lammy.webp", 620)
web_copy("LammyStuff/UJLNow!/UJLN_final_cabinet.png", "cabinet.webp", 420)
web_copy("LammyStuff/UJLNow!/GiveawayCampaign/Lammy_Parappa_Sticker.png", "sticker.webp", 340)
web_copy("LammyStuff/UJLNow!/GiveawayCampaign/MessyLammyWithAmp.png", "postcard.webp", 300)
for p in sorted(OUT.iterdir()):
    with Image.open(p) as im:
        print(f"{p.name:14s} {im.size[0]}x{im.size[1]}  {p.stat().st_size // 1024} KB")
