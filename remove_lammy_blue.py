"""Strip the white background and pale-blue halo from a sticker-style PNG,
preserving the white sticker outline and any blues trapped inside brown
outlines.

Usage: python remove_lammy_blue.py [<image-path>]
       defaults to LammyStuff/LammyArt/lammystanding.png
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

DEFAULT = Path(__file__).parent / "LammyStuff" / "LammyArt" / "lammystanding.png"
WHITE_THRESHOLD = 235  # min(r,g,b) >= this counts as white


def neighbors_of(region: np.ndarray) -> np.ndarray:
    """Pixels 4-adjacent to any True in `region` (region itself excluded)."""
    out = np.zeros_like(region)
    out[1:]  |= region[:-1]
    out[:-1] |= region[1:]
    out[:, 1:]  |= region[:, :-1]
    out[:, :-1] |= region[:, 1:]
    return out & ~region


def flood(mask: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    """Return the subset of `mask` reachable from any True in `seeds` via 4-connectivity."""
    h, w = mask.shape
    visited = seeds & mask
    q = deque(zip(*np.where(visited)))
    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    return visited


def main(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    rgb = arr[..., :3].astype(np.int16)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # Step 1: flood-fill white from the image edges to clear the outside background.
    is_white = rgb.min(axis=2) >= WHITE_THRESHOLD
    edge = np.zeros_like(is_white)
    edge[0] = edge[-1] = True
    edge[:, 0] = edge[:, -1] = True
    outside_white = flood(is_white, edge & is_white)
    arr[..., 3][outside_white] = 0

    # Step 2: flood-fill pale-blue halo starting from blue pixels touching the
    # new transparent region. This preserves blue islands inside brown outlines.
    is_blue = (b >= 235) & (b >= g) & (g >= r) & (b - r >= 10) & (r >= 180)
    halo = flood(is_blue, neighbors_of(arr[..., 3] == 0) & is_blue)
    arr[..., 3][halo] = 0

    # Step 3: flood-fill the white sticker outline from the new transparent
    # region. White islands inside brown outlines (eyes, shirt highlights) stay.
    outline = flood(is_white, neighbors_of(arr[..., 3] == 0) & is_white)
    arr[..., 3][outline] = 0

    Image.fromarray(arr, "RGBA").save(path)
    print(f"{path.name}: cleared {int(outside_white.sum())} outside-white px, "
          f"{int(halo.sum())} halo-blue px, {int(outline.sum())} outline-white px")


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    main(target)
