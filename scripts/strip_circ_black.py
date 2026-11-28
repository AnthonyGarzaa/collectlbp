from PIL import Image
from collections import deque
from pathlib import Path

# Repo root (this script lives in scripts/), so image paths work from anywhere.
ROOT = Path(__file__).resolve().parent.parent

# Make the connected black border around each circular render transparent.
# Flood-fill from the edges so only the outer black region is removed,
# leaving any dark pixels inside the artwork untouched.

THRESHOLD = 60  # max R/G/B value to count as "black"

def is_black(px):
    r, g, b = px[0], px[1], px[2]
    return r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD

def strip(path):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()

    visited = [[False] * w for _ in range(h)]
    q = deque()

    # seed with all border pixels that are black
    for x in range(w):
        for y in (0, h - 1):
            if not visited[y][x] and is_black(px[x, y]):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_black(px[x, y]):
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_black(px[nx, ny]):
                visited[ny][nx] = True
                q.append((nx, ny))

    img.save(path)
    print(f"done: {path}")

for p in (
    "LammyStuff/Renders/ressources/lamcirc.PNG",
    "LammyStuff/Renders/ressources/ramcirc.PNG",
):
    strip(ROOT / p)
