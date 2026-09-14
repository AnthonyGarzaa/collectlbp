"""Strip extras from each nav PNG (keep largest opaque component), then autocrop.

For rapdog.png and thesun.png the original scans have text labels that survived
the white-background flood-fill. Removing them via keep-largest + autocrop puts
each figure's feet at the image's bottom edge so they share a baseline.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FILES = ["thebear_.png", "thekat.png", "thesun.png", "rapdog.png"]
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


def keep_largest(path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    alpha = arr[..., 3].copy()
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
        Image.fromarray(arr, "RGBA").save(path)
        print(f"{path.name}: erased {int(erase.sum())} px in non-largest components")


def autocrop(path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    alpha = arr[..., 3]
    opaque = alpha > 0
    if not opaque.any():
        return
    ys, xs = np.where(opaque)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    cropped = arr[y0:y1, x0:x1]
    Image.fromarray(cropped, "RGBA").save(path)
    print(f"{path.name}: cropped to {cropped.shape[1]}x{cropped.shape[0]}")


for name in FILES:
    p = ROOT / name
    keep_largest(p)
    autocrop(p)
