"""Remove all white pixels in thesunnyfunny.png except those enclosed inside the image.

Flood-fills white/transparent regions starting from the image edges. Any white pixel
reachable from the border becomes transparent; white pixels enclosed by non-white
content are preserved.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "thesunnyfunny.png"
BG_THRESHOLD = 235  # min channel value to count as "white-ish"

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
    seed(0, x)
    seed(h - 1, x)
for y in range(h):
    seed(y, 0)
    seed(y, w - 1)

while q:
    y, x = q.popleft()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx2 = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx2 < w and not visited[ny, nx2]:
            if light[ny, nx2] or transparent[ny, nx2]:
                visited[ny, nx2] = True
                q.append((ny, nx2))

erased = int((visited & (alpha > 0)).sum())
alpha[visited] = 0
arr[..., 3] = alpha

Image.fromarray(arr, "RGBA").save(SRC)
print(f"erased {erased} edge-reachable white px; wrote {SRC.name}")
