"""Keep only the main figure in thekat_transparent.png by:
   1. Eroding opaque mask 2 px to break thin bridges to extras
   2. Labeling components, keeping the largest (the cat figure)
   3. Dilating the kept region back 2 px
   4. Erasing original alpha for pixels not in the kept region.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "thekat_transparent.png"
DST = SRC.with_name("thekat_clean.png")
ERODE = 2


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
alpha = arr[..., 3].copy()
opaque = alpha > 0

eroded = erode(opaque, ERODE)
labels, sizes = label_8conn(eroded)
n = len(sizes) - 1
if n > 0:
    sizes[0] = 0
    largest = int(sizes.argmax())
    kept_eroded = labels == largest
    kept = dilate(kept_eroded, ERODE) & opaque
    erase = opaque & ~kept
    alpha[erase] = 0
    print(f"{n} components after erode; kept largest ({int(sizes[largest])} px); erased {int(erase.sum())} px in extras")
else:
    print("no components after erode")

arr[..., 3] = alpha
Image.fromarray(arr, "RGBA").save(DST)
