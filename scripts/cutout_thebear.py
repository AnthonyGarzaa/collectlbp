"""Cut out thebear.png background (PJ Berri figure) so it's transparent."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "thebear.png"
DST = SRC.with_name("thebear_transparent.png")
BG_THRESHOLD = 235
HALO_THRESHOLD = 140
OUTLINE_THRESHOLD = 90


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3].copy()

    light = rgb.min(axis=2) >= BG_THRESHOLD
    transparent = alpha == 0

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

    near_white = rgb.min(axis=2) >= HALO_THRESHOLD
    outline = rgb.max(axis=2) <= OUTLINE_THRESHOLD
    transparent2 = alpha == 0

    halo = np.zeros((h, w), dtype=bool)
    q2 = deque()
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
