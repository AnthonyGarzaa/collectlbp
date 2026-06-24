"""Remove only the far-left outer navy outline of drumhead.png.

Background is transparent; a navy outline (~9,24,55) rings the drum. Flood-fill
inward from the edges through transparent/black AND blue pixels (gray/white/
purple/red are walls). Blue reached this way is the outer outline; blue enclosed
inside the drum is never reached and is preserved. Of the outer outline, clear
only the far-left strip (x < LEFT_CUT) so the rest of the rim stays intact.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "LammyStuff" / "resources" / "drumhead.png"
DST = SRC.with_name("drumhead_outlineblue.png")
BLACK_MAX = 40
R_MARGIN = 30
G_MARGIN = 10
LEFT_FRAC = 0.15


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3]

    black = (rgb.max(axis=2) < BLACK_MAX) | (alpha == 0)
    blue = (rgb[..., 2] > rgb[..., 0] + R_MARGIN) & (rgb[..., 2] > rgb[..., 1] + G_MARGIN)
    passable = black | blue

    region = np.zeros((h, w), dtype=bool)
    q = deque()

    def seed(y, x):
        if passable[y, x] and not region[y, x]:
            region[y, x] = True
            q.append((y, x))

    for x in range(w):
        seed(0, x); seed(h - 1, x)
    for y in range(h):
        seed(y, 0); seed(y, w - 1)

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not region[ny, nx] and passable[ny, nx]:
                region[ny, nx] = True
                q.append((ny, nx))

    left_cut = int(w * LEFT_FRAC)
    left = np.zeros((h, w), dtype=bool)
    left[:, :left_cut] = True

    target = region & blue & left
    arr[..., 3][target] = 0
    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: cleared {int(target.sum())} far-left outer-outline blue px "
          f"(x < {left_cut}); kept all interior + right-side blue")


if __name__ == "__main__":
    main()
