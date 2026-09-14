"""Remove the white pixels enclosed between Sunny Funny's legs at the bottom.

Seeds flood-fills at white pixels in the bottom-center band so only the leg-gap
region is erased — eyes / teeth / other enclosed highlights are untouched.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "thesunnyfunny.png"
BG_THRESHOLD = 235

img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape
rgb = arr[..., :3].astype(np.int16)
alpha = arr[..., 3].copy()

light = rgb.min(axis=2) >= BG_THRESHOLD
opaque = alpha > 0
candidate = light & opaque

# Restrict seeds to the bottom band of the image (below the dress hem)
y0 = int(h * 0.78)
y1 = h
x0 = int(w * 0.30)
x1 = int(w * 0.70)

visited = np.zeros((h, w), dtype=bool)
q = deque()
ys, xs = np.where(candidate[y0:y1, x0:x1])
for y, x in zip(ys, xs):
    Y, X = y + y0, x + x0
    if not visited[Y, X]:
        visited[Y, X] = True
        q.append((Y, X))

while q:
    y, x = q.popleft()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx2 = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx2 < w and not visited[ny, nx2] and candidate[ny, nx2]:
            visited[ny, nx2] = True
            q.append((ny, nx2))

erased = int(visited.sum())
alpha[visited] = 0
arr[..., 3] = alpha

Image.fromarray(arr, "RGBA").save(SRC)
print(f"erased {erased} white px between legs; wrote {SRC.name}")
