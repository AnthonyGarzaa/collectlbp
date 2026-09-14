"""Split LammyStuff/resources/guits.png (4 guitars in a row) into 4 separate
tightly-cropped transparent PNGs."""
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "LammyStuff" / "resources" / "guits.png"
NAMES = ["guit_blue", "guit_green", "guit_yellow", "guit_black"]
ALPHA_T = 16          # alpha above this counts as "content"
MIN_RUN = 10          # ignore content runs narrower than this (stray specks)
GAP = 6               # bridge empty gaps shorter than this (keep guitar whole)

im = Image.open(SRC).convert("RGBA")
a = np.asarray(im)[:, :, 3]
col_has = (a > ALPHA_T).any(axis=0)

# Find runs of content columns, bridging tiny gaps within a guitar.
runs = []
start = None
gap_run = 0
for x, on in enumerate(col_has):
    if on:
        if start is None:
            start = x
        gap_run = 0
    else:
        if start is not None:
            gap_run += 1
            if gap_run > GAP:
                runs.append((start, x - gap_run + 1))
                start = None
                gap_run = 0
if start is not None:
    runs.append((start, len(col_has) - gap_run))

runs = [(s, e) for (s, e) in runs if e - s >= MIN_RUN]
print(f"detected {len(runs)} guitar column-runs: {runs}")
assert len(runs) == 4, "expected 4 guitars"

for (x0, x1), name in zip(runs, NAMES):
    crop = im.crop((x0, 0, x1, im.height))
    bbox = crop.getbbox()        # trim transparent top/bottom too
    crop = crop.crop(bbox)
    out = SRC.with_name(name + ".png")
    crop.save(out)
    print(f"{out.name}: {crop.size}")
