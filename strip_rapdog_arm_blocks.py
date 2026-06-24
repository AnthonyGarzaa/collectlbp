"""Find small disconnected near-white components in rapdog.png and erase them.

Keeps only the largest near-white component (PaRappa's body/face/arms/hands).
Small isolated blocks of leftover background near the arms get cleared.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "rapdog.png"
DST = SRC.with_name("rapdog_clean.png")
NEAR_WHITE = 200
MAIN_KEEP_FRACTION = 0.5  # any near-white component smaller than this fraction of the largest gets erased


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
                            ny, nxt_x = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nxt_x < w and mask[ny, nxt_x] and labels[ny, nxt_x] == 0:
                                labels[ny, nxt_x] = nxt
                                q.append((ny, nxt_x))
                sizes.append(count)
                nxt += 1
    return labels, np.array(sizes, dtype=np.int64)


img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape
rgb = arr[..., :3]
alpha = arr[..., 3].copy()

near_white_opaque = (rgb.min(axis=2) >= NEAR_WHITE) & (alpha > 0)
labels, sizes = label_8conn(near_white_opaque)
n = len(sizes) - 1

if n > 0:
    sizes[0] = 0
    largest = int(sizes.argmax())
    largest_size = int(sizes[largest])
    threshold = largest_size * MAIN_KEEP_FRACTION
    small_labels = np.where((sizes < threshold) & (sizes > 0))[0]
    to_erase = np.isin(labels, small_labels)
    alpha[to_erase] = 0
    print(f"found {n} near-white components; kept largest ({largest_size} px); erased {int(to_erase.sum())} px in smaller blocks")
else:
    print("no near-white opaque components found")

arr[..., 3] = alpha
Image.fromarray(arr, "RGBA").save(DST)
