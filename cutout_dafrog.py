"""Remove everything outside the black outline in dafrog.png.

Flood-fills from the image edges; the fill is blocked by dark (outline) pixels.
Anything reached becomes transparent; the outline and its interior survive.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "dafrog.png"
OUTLINE_THRESHOLD = 90  # max channel value to count as "black outline"

img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape
rgb = arr[..., :3].astype(np.int16)
alpha = arr[..., 3].copy()

is_outline = rgb.max(axis=2) <= OUTLINE_THRESHOLD
visited = np.zeros((h, w), dtype=bool)
q = deque()


def seed(y, x):
    if not is_outline[y, x] and not visited[y, x]:
        visited[y, x] = True
        q.append((y, x))


for x in range(w):
    seed(0, x)
    seed(h - 1, x)
for y in range(h):
    seed(y, 0)
    seed(y, w - 1)

while q:
    y, x = q.popleft()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx2 = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx2 < w and not visited[ny, nx2] and not is_outline[ny, nx2]:
            visited[ny, nx2] = True
            q.append((ny, nx2))

erased = int((visited & (alpha > 0)).sum())
alpha[visited] = 0
arr[..., 3] = alpha

# Autocrop to remaining opaque content
opaque = alpha > 0
if opaque.any():
    ys, xs = np.where(opaque)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    arr = arr[y0:y1, x0:x1]
    print(f"autocrop: {h}x{w} -> {arr.shape[0]}x{arr.shape[1]}")

Image.fromarray(arr, "RGBA").save(SRC)
print(f"erased {erased} px outside outline; wrote {SRC.name}")
