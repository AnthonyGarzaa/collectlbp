"""Split LammyStuff/therenders.png into one PNG per character icon.

Uses alpha-channel connected-components on a downsampled mask to find each
icon's bounding box, then crops the full-resolution source for each box.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "LammyStuff" / "therenders.png"
OUT_DIR = Path(__file__).parent / "LammyStuff" / "Renders"
DOWNSCALE = 8           # downsample factor for component finding
ALPHA_THRESHOLD = 16    # treat pixels with alpha > this as foreground
MIN_AREA_SMALL = 400    # min component area at downsampled scale (pixels)
DILATE_ITERS = 3        # close small gaps inside characters


def dilate(mask: np.ndarray, iters: int) -> np.ndarray:
    """Binary dilation using numpy shifts (4-neighborhood)."""
    out = mask.copy()
    for _ in range(iters):
        up = np.zeros_like(out); up[:-1] = out[1:]
        dn = np.zeros_like(out); dn[1:] = out[:-1]
        lt = np.zeros_like(out); lt[:, :-1] = out[:, 1:]
        rt = np.zeros_like(out); rt[:, 1:] = out[:, :-1]
        out = out | up | dn | lt | rt
    return out


def label_components(mask: np.ndarray):
    """Iterative 8-connected flood fill labeling. Returns (labels, num)."""
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    next_label = 0
    neigh = [(-1, -1), (-1, 0), (-1, 1),
             (0, -1),           (0, 1),
             (1, -1),  (1, 0),  (1, 1)]
    for y in range(h):
        row_mask = mask[y]
        for x in range(w):
            if not row_mask[x] or labels[y, x]:
                continue
            next_label += 1
            stack = deque([(y, x)])
            labels[y, x] = next_label
            while stack:
                cy, cx = stack.pop()
                for dy, dx in neigh:
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = next_label
                        stack.append((ny, nx))
    return labels, next_label


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")
    W, H = img.size
    print(f"source: {W}x{H}")

    alpha = np.array(img.split()[-1])
    small = alpha[::DOWNSCALE, ::DOWNSCALE] > ALPHA_THRESHOLD
    small = dilate(small, DILATE_ITERS)
    print(f"downsampled mask: {small.shape}, fg pixels: {small.sum()}")

    labels, n = label_components(small)
    print(f"found {n} raw components")

    boxes = []
    for lbl in range(1, n + 1):
        ys, xs = np.where(labels == lbl)
        if ys.size < MIN_AREA_SMALL:
            continue
        y0, y1 = ys.min(), ys.max() + 1
        x0, x1 = xs.min(), xs.max() + 1
        boxes.append((y0, y1, x0, x1, ys.size))

    # scale boxes back up, sort top-to-bottom then left-to-right with row tolerance
    full_boxes = []
    for y0, y1, x0, x1, area in boxes:
        full_boxes.append((
            y0 * DOWNSCALE, min(y1 * DOWNSCALE, H),
            x0 * DOWNSCALE, min(x1 * DOWNSCALE, W),
            area * DOWNSCALE * DOWNSCALE,
        ))

    # sort by row bands (group anything within ~half-an-icon vertically)
    full_boxes.sort(key=lambda b: b[0])
    if full_boxes:
        median_h = sorted(b[1] - b[0] for b in full_boxes)[len(full_boxes) // 2]
        row_tol = median_h // 2
        rows = []
        for box in full_boxes:
            placed = False
            for row in rows:
                if abs(row[0][0] - box[0]) < row_tol:
                    row.append(box); placed = True; break
            if not placed:
                rows.append([box])
        rows.sort(key=lambda r: min(b[0] for b in r))
        ordered = []
        for row in rows:
            row.sort(key=lambda b: b[2])
            ordered.extend(row)
    else:
        ordered = []

    print(f"after filtering: {len(ordered)} icons")

    for i, (y0, y1, x0, x1, area) in enumerate(ordered, start=1):
        # tight crop using full-res alpha within the rough box
        sub_alpha = alpha[y0:y1, x0:x1]
        ys, xs = np.where(sub_alpha > ALPHA_THRESHOLD)
        if ys.size:
            ty0, ty1 = ys.min(), ys.max() + 1
            tx0, tx1 = xs.min(), xs.max() + 1
            crop_box = (x0 + tx0, y0 + ty0, x0 + tx1, y0 + ty1)
        else:
            crop_box = (x0, y0, x1, y1)
        crop = img.crop(crop_box)
        out = OUT_DIR / f"render_{i:02d}.png"
        crop.save(out)
        print(f"  {out.name}: {crop.size}, area~{area}")


if __name__ == "__main__":
    main()
