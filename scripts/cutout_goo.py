"""Cut out the white background of LammyStuff/Renders/goo.png.

Flood-fills white pixels starting from the image edges, stopping at the pink
body so the white swirl decorations inside the design are preserved.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "LammyStuff" / "Renders" / "goo.png"
DST = SRC
WHITE_MIN = 205          # every channel must be at least this to count as white
WHITE_SPREAD = 15        # max-min channel gap; keeps the tinted light-pink outline
EDGE_FEATHER = 1


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    spread = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    white = (r >= WHITE_MIN) & (g >= WHITE_MIN) & (b >= WHITE_MIN) & (spread <= WHITE_SPREAD)
    transparent = arr[..., 3] == 0
    # "outside" is anything the exterior can reach through: the already-transparent
    # border plus the white halo. Interior white swirls are walled off by pink.
    passable = white | transparent

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if passable[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if passable[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # only actually erase the white halo, not the transparent border we walked through
    visited &= white

    alpha = arr[..., 3].copy()
    alpha[visited] = 0

    if EDGE_FEATHER:
        bg = visited
        neighbor_bg = np.zeros_like(bg)
        neighbor_bg[1:]  |= bg[:-1]
        neighbor_bg[:-1] |= bg[1:]
        neighbor_bg[:, 1:]  |= bg[:, :-1]
        neighbor_bg[:, :-1] |= bg[:, 1:]
        edge = neighbor_bg & ~bg
        whiteness = np.minimum(np.minimum(r, g), b).astype(np.float32)
        whiteness = np.clip((whiteness - 170) / 60.0, 0.0, 1.0)
        new_alpha = (alpha.astype(np.float32) * (1.0 - whiteness)).astype(np.uint8)
        alpha = np.where(edge, new_alpha, alpha)

    arr[..., 3] = alpha
    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: removed {int(visited.sum())} bg px of {h*w}")


if __name__ == "__main__":
    main()
