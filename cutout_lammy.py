"""Cut out the white background of LammyStuff/LammyArt/lammystanding.png.

Flood-fills from every edge pixel that looks like the background, so white
regions enclosed by the character outline (e.g. shirt highlights) are kept.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "LammyStuff" / "LammyArt" / "lammystanding.png"
DST = SRC.with_name("lammystanding_transparent.png")
BG_THRESHOLD = 235          # pixels with min(r,g,b) >= this are candidate background
EDGE_FEATHER = 1            # feather radius for anti-aliased edge softening


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)

    # candidate background = light pixels (near white)
    light = rgb.min(axis=2) >= BG_THRESHOLD

    # flood fill from any edge pixel that is light
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if light[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if light[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # also soften edges: pixels adjacent to the cutout that are near-white
    # get a partial alpha based on how light they are
    alpha = arr[..., 3].copy()
    alpha[visited] = 0

    if EDGE_FEATHER:
        # for one ring of pixels around the cutout, scale alpha by how non-white they are
        bg = visited
        neighbor_bg = np.zeros_like(bg)
        neighbor_bg[1:]  |= bg[:-1]
        neighbor_bg[:-1] |= bg[1:]
        neighbor_bg[:, 1:]  |= bg[:, :-1]
        neighbor_bg[:, :-1] |= bg[:, 1:]
        edge = neighbor_bg & ~bg
        # whiteness in [0,1]: 1 = pure white, 0 = saturated color
        whiteness = (rgb.min(axis=2).astype(np.float32) - 200) / (255 - 200)
        whiteness = np.clip(whiteness, 0.0, 1.0)
        new_alpha = (alpha.astype(np.float32) * (1.0 - whiteness)).astype(np.uint8)
        alpha = np.where(edge, new_alpha, alpha)

    arr[..., 3] = alpha
    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: removed {int(visited.sum())} bg px of {h*w}")


if __name__ == "__main__":
    main()
