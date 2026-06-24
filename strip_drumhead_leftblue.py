"""Make blue pixels on the LEFT half of drumhead.png transparent.

The rim outline is dark navy (~9,24,55): blue channel dominates red. The
purple "M" (100,45,109) has red ~= blue, so the B > R margin spares it.
Only pixels left of the horizontal midpoint are cleared.
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "LammyStuff" / "resources" / "drumhead.png"
DST = SRC.with_name("drumhead_leftblue.png")
R_MARGIN = 30
G_MARGIN = 10


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)

    blue = (rgb[..., 2] > rgb[..., 0] + R_MARGIN) & (rgb[..., 2] > rgb[..., 1] + G_MARGIN)
    left = np.zeros((h, w), dtype=bool)
    left[:, : w // 2] = True

    target = blue & left
    arr[..., 3][target] = 0
    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: cleared {int(target.sum())} left-side blue px of {h*w}")


if __name__ == "__main__":
    main()
