"""Cut out the red background of LammyStuff/ressources/poofu.png.

Flood-fills red pixels starting from the image edges, stopping at the black
outline so the red drops inside the design are preserved.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "LammyStuff" / "ressources" / "poofu.png"
DST = SRC
RED_MIN = 150            # red channel must be at least this
GB_MAX = 120             # green/blue channels must be below this
EDGE_FEATHER = 1


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    red = (r >= RED_MIN) & (g <= GB_MAX) & (b <= GB_MAX) & (r - np.maximum(g, b) >= 60)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if red[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if red[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and red[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

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
        redness = (r - np.maximum(g, b)).astype(np.float32)
        redness = np.clip((redness - 30) / 60.0, 0.0, 1.0)
        new_alpha = (alpha.astype(np.float32) * (1.0 - redness)).astype(np.uint8)
        alpha = np.where(edge, new_alpha, alpha)

    arr[..., 3] = alpha
    Image.fromarray(arr, "RGBA").save(DST)
    print(f"wrote {DST.name}: removed {int(visited.sum())} bg px of {h*w}")


if __name__ == "__main__":
    main()
