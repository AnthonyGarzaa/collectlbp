from PIL import Image
from collections import deque
from pathlib import Path

# Repo root (this script lives in scripts/), so image paths work from anywhere.
ROOT = Path(__file__).resolve().parent.parent

# Remove the orange/brown ring around each circular render by flood-filling
# inward from the (already transparent) edges. A pixel is "removable" if it is
# transparent or a warm dark-orange ring pixel (low blue, red>=green>=blue).

def removable(px):
    r, g, b, a = px
    if a == 0:
        return True
    return b <= 70 and r >= g and g >= b

def strip(path):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()

    visited = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not visited[y][x]:
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x]:
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if not removable(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                visited[ny][nx] = True
                q.append((nx, ny))

    img.save(path)
    print(f"done: {path}")

for p in (
    "LammyStuff/ressources/lamcirc.PNG",
    "LammyStuff/ressources/ramcirc.PNG",
):
    strip(ROOT / p)
