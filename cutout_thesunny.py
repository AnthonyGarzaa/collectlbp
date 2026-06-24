"""Cut out thesunny.png: flood-fill bg + halo strip + keep-largest + autocrop."""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "thesunny.png"
BG_THRESHOLD = 235
HALO_THRESHOLD = 140
OUTLINE_THRESHOLD = 90
ERODE = 0


def erode(mask, r):
    out = mask.copy()
    for _ in range(r):
        nbr_clear = np.zeros_like(out)
        nbr_clear[1:]    |= ~out[:-1]
        nbr_clear[:-1]   |= ~out[1:]
        nbr_clear[:, 1:] |= ~out[:, :-1]
        nbr_clear[:, :-1]|= ~out[:, 1:]
        out = out & ~nbr_clear
    return out


def dilate(mask, r):
    out = mask.copy()
    for _ in range(r):
        nbr = np.zeros_like(out)
        nbr[1:]    |= out[:-1]
        nbr[:-1]   |= out[1:]
        nbr[:, 1:] |= out[:, :-1]
        nbr[:, :-1]|= out[:, 1:]
        out = out | nbr
    return out


def label_8conn(mask):
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    sizes = [0]
    nxt = 1
    for y in range(h):
        for x in range(w):
            if mask[y, x] and labels[y, x] == 0:
                q = deque([(y, x)])
                labels[y, x] = nxt
                count = 0
                while q:
                    cy, cx = q.popleft()
                    count += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx2 = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx2 < w and mask[ny, nx2] and labels[ny, nx2] == 0:
                                labels[ny, nx2] = nxt
                                q.append((ny, nx2))
                sizes.append(count)
                nxt += 1
    return labels, np.array(sizes, dtype=np.int64)


img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape
rgb = arr[..., :3].astype(np.int16)
alpha = arr[..., 3].copy()

# Pass 1: flood-fill background from edges
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
        ny, nx2 = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx2 < w and not visited[ny, nx2]:
            if light[ny, nx2] or transparent[ny, nx2]:
                visited[ny, nx2] = True
                q.append((ny, nx2))
alpha[visited] = 0

# Pass 2: halo strip along outline
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
        ny, nx2 = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx2 < w and not halo[ny, nx2]:
            if near_white[ny, nx2] and not outline[ny, nx2] and alpha[ny, nx2] != 0:
                halo[ny, nx2] = True
                q2.append((ny, nx2))
alpha[halo] = 0
print(f"halo: peeled {int(halo.sum())} outline-adjacent white px")

# Pass 3: keep largest opaque component (drops side text, logos, etc.)
arr[..., 3] = alpha
opaque = alpha > 0
eroded = erode(opaque, ERODE)
labels, sizes = label_8conn(eroded)
if len(sizes) > 1:
    sizes[0] = 0
    largest = int(sizes.argmax())
    kept_eroded = labels == largest
    kept = dilate(kept_eroded, ERODE) & opaque
    erase = opaque & ~kept
    alpha[erase] = 0
    arr[..., 3] = alpha
    print(f"keep-largest: erased {int(erase.sum())} px in other components ({len(sizes)-1} total)")

# Pass 4: autocrop to opaque bounding box
opaque = alpha > 0
if opaque.any():
    ys, xs = np.where(opaque)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    arr = arr[y0:y1, x0:x1]
    print(f"autocrop: {h}x{w} -> {arr.shape[0]}x{arr.shape[1]}")

Image.fromarray(arr, "RGBA").save(SRC)
print(f"wrote {SRC.name}")
