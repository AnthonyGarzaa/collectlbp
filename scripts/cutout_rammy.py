"""Neutralise every stray colour in LammyStuff/Renders/rammy.png.

Rammy is meant to be a pure black / grey / white character, but the source art
carries some colour artifacts: a thin saturated yellow line dotted along the
guitar's black outline, a warm brown anti-alias fringe wherever grey meets
black, and a reddish outline on the mallet. Two passes clean this up:

  1. The bright yellow guitar dashes are repainted with the guitar body's dark
     grey so that outline reads as a clean grey->black step (rather than the
     lighter grey a plain desaturation would give).
  2. Everything else is desaturated to its luminance-equivalent grey, which
     merges the remaining brown fringe and red mallet outline into neutral tones
     while leaving already-grey pixels (and pure black/white) untouched.
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "LammyStuff" / "Renders" / "rammy.png"
DST = SRC
BODY_GREY = (64, 64, 64)     # the guitar body colour the yellow merges into
DILATE = 3                   # how far the fringe may sit from a strong seed
# bounding boxes of the guitar body and neck (y0, y1, x0, x1) -- safely away
# from the face, so any leftover yellow fringe inside them can be merged.
# (Neutral grey/black anti-alias never matches the yellow test, so the hand and
#  fingers overlapping the neck box are unaffected.)
GUITAR_BOXES = [
    (805, 1045, 460, 895),   # body
    (795, 890, 150, 465),    # neck / fretboard toward the hand
]


def dilate(mask, iters):
    out = mask.copy()
    for _ in range(iters):
        nbr = out.copy()
        nbr[1:]  |= out[:-1]
        nbr[:-1] |= out[1:]
        nbr[:, 1:]  |= out[:, :-1]
        nbr[:, :-1] |= out[:, 1:]
        out = nbr
    return out


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3].astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    a = arr[..., 3]

    yellowness = np.minimum(r, g) - b
    opaque = a > 0

    # strong, unambiguous yellow -- only present on the guitar outline
    strong = (g > 140) & (b < 110) & (yellowness > 60) & (r > 120) & opaque
    # broader yellowish, catches the anti-aliased edge toward grey/black
    weak = (yellowness > 35) & (np.abs(r - g) < 45) & (g > 90) & opaque

    # inside the guitar boxes, every yellowish pixel is the outline -> merge all
    box = np.zeros(weak.shape, dtype=bool)
    for y0, y1, x0, x1 in GUITAR_BOXES:
        box[y0:y1, x0:x1] = True

    keep = weak & (dilate(strong, DILATE) | box)

    arr[keep, 0] = BODY_GREY[0]
    arr[keep, 1] = BODY_GREY[1]
    arr[keep, 2] = BODY_GREY[2]

    # Pass 2: desaturate the whole image to remove every remaining colour. Each
    # pixel becomes its Rec.601 luminance grey; neutral pixels are unchanged.
    rgb2 = arr[..., :3].astype(np.float32)
    lum = (0.299 * rgb2[..., 0] + 0.587 * rgb2[..., 1] + 0.114 * rgb2[..., 2])
    grey = np.clip(lum, 0, 255).astype(np.uint8)
    mx = arr[..., :3].max(axis=2).astype(np.int16)
    mn = arr[..., :3].min(axis=2).astype(np.int16)
    coloured = int(((mx - mn) > 10).sum())
    arr[..., 0] = grey
    arr[..., 1] = grey
    arr[..., 2] = grey

    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: repainted {int(keep.sum())} yellow px "
          f"({int(strong.sum())} strong seeds), desaturated {coloured} coloured px")


if __name__ == "__main__":
    main()
