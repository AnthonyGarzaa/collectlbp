"""Cut out sun.png background, then clear white pixels touching the outer outline.

Strategy:
  - Flood-fill background (light + already-transparent) from edges.
  - Then flood-fill near-white pixels starting from the transparent region,
    treating dark outline pixels as walls. This eats the white halo wedged
    between transparency and the black outline, but cannot cross the outline,
    so interior whites (eye sclera, highlights) survive.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "sun.png"
DST = SRC.with_name("sun_transparent.png")
BG_THRESHOLD = 235          # initial background seed: min(r,g,b) >= this
HALO_THRESHOLD = 200        # near-white halo: min(r,g,b) >= this
OUTLINE_THRESHOLD = 90      # outline wall: max(r,g,b) <= this counts as black


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3].copy()

    light = rgb.min(axis=2) >= BG_THRESHOLD
    transparent = alpha == 0

    # Pass 1: flood-fill background (white or already-transparent) from edges.
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    def seed(y, x):
        if (light[y, x] or transparent[y, x]) and not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))

    for x in range(w):
        seed(0, x); seed(h - 1, x)
    for y in range(h):
        seed(y, 0); seed(y, w - 1)

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if light[ny, nx] or transparent[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
    alpha[visited] = 0

    # Pass 2: flood-fill near-white pixels from the transparent region,
    # walled off by dark outline pixels.
    near_white = rgb.min(axis=2) >= HALO_THRESHOLD
    outline = rgb.max(axis=2) <= OUTLINE_THRESHOLD
    transparent2 = alpha == 0

    halo = np.zeros((h, w), dtype=bool)
    q2 = deque()
    # Seed with near-white pixels that touch a transparent pixel.
    trans_neighbor = np.zeros_like(transparent2)
    trans_neighbor[1:]    |= transparent2[:-1]
    trans_neighbor[:-1]   |= transparent2[1:]
    trans_neighbor[:, 1:] |= transparent2[:, :-1]
    trans_neighbor[:, :-1]|= transparent2[:, 1:]
    seeds = near_white & ~transparent2 & ~outline & trans_neighbor
    ys, xs = np.where(seeds)
    for y, x in zip(ys, xs):
        halo[y, x] = True
        q2.append((y, x))

    while q2:
        y, x = q2.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1),
                       (-1, -1), (-1, 1), (1, -1), (1, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not halo[ny, nx]:
                if near_white[ny, nx] and not outline[ny, nx] and alpha[ny, nx] != 0:
                    halo[ny, nx] = True
                    q2.append((ny, nx))

    alpha[halo] = 0

    arr[..., 3] = alpha
    Image.fromarray(arr, "RGBA").save(DST)
    cleared = int((arr[..., 3] == 0).sum())
    print(f"wrote {DST.name}: {cleared} transparent px of {h*w}; peeled {int(halo.sum())} outline-adjacent white px")


if __name__ == "__main__":
    main()
