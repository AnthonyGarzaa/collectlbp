"""Extract individual Vibri renders from the CHARA sprite sheets.

The CHARA0N.TIF sheets are white vector line-art of Vibri on pure black. That
makes them a clean luminance key: alpha = brightness, colour = white, so the
antialiased edges survive pixel-for-pixel with no black halo.

Each sheet holds several poses (plus a small italic "CharaNN" corner label and,
on one sheet, a tiny evolution-scale diagram). We find each pose by dilating a
downscaled mask, labelling 8-connected components, dropping the tiny label/noise
blobs, then tight-cropping the full-resolution RGBA for each kept box.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
SRC_DIR = ROOT / "vib"
OUT_DIR = ROOT / "vib" / "renders"
SHEETS = ["CHARA00", "CHARA01", "CHARA02", "CHARA03", "CHARA04"]

LUMA_THRESHOLD = 32      # brightness above this counts as ink
DOWNSCALE = 8            # downsample factor for component finding
DILATE_ITERS = 5         # merge a pose's separate strokes into one blob
MIN_AREA_SMALL = 500     # min component area (downsampled px) to keep a pose
CORNER_FRAC = 0.16       # ignore blobs whose box sits fully in the top-right corner


def dilate(mask: np.ndarray, iters: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(iters):
        up = np.zeros_like(out); up[:-1] = out[1:]
        dn = np.zeros_like(out); dn[1:] = out[:-1]
        lt = np.zeros_like(out); lt[:, :-1] = out[:, 1:]
        rt = np.zeros_like(out); rt[:, 1:] = out[:, :-1]
        out = out | up | dn | lt | rt
    return out


def label_components(mask: np.ndarray):
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    next_label = 0
    neigh = [(-1, -1), (-1, 0), (-1, 1),
             (0, -1),           (0, 1),
             (1, -1),  (1, 0),  (1, 1)]
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or labels[y, x]:
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


def rgba_from_sheet(gray: np.ndarray) -> Image.Image:
    """White colour everywhere, alpha = luminance -> transparent black bg."""
    h, w = gray.shape
    rgba = np.empty((h, w, 4), dtype=np.uint8)
    rgba[..., 0] = 255
    rgba[..., 1] = 255
    rgba[..., 2] = 255
    rgba[..., 3] = gray
    return Image.fromarray(rgba, "RGBA")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    counter = 0
    manifest = []
    for sheet in SHEETS:
        gray = np.array(Image.open(SRC_DIR / f"{sheet}.TIF").convert("L"))
        H, W = gray.shape
        rgba = rgba_from_sheet(gray)

        mask = gray[::DOWNSCALE, ::DOWNSCALE] > LUMA_THRESHOLD
        mask = dilate(mask, DILATE_ITERS)
        labels, n = label_components(mask)
        sh, sw = mask.shape

        kept = []
        for lbl in range(1, n + 1):
            ys, xs = np.where(labels == lbl)
            if ys.size < MIN_AREA_SMALL:
                continue
            y0, y1 = ys.min(), ys.max() + 1
            x0, x1 = xs.min(), xs.max() + 1
            # skip a small blob pinned to the very top-right corner (the label)
            box_w, box_h = x1 - x0, y1 - y0
            small = box_w < CORNER_FRAC * sw and box_h < CORNER_FRAC * sh
            in_corner = y1 < CORNER_FRAC * sh and x0 > (1 - CORNER_FRAC) * sw
            if small and in_corner:
                continue
            kept.append((y0, y1, x0, x1))

        # order top-to-bottom, then left-to-right within a row band
        kept.sort(key=lambda b: b[0])
        median_h = sorted(b[1] - b[0] for b in kept)[len(kept) // 2] if kept else 0
        row_tol = max(1, median_h // 2)
        rows = []
        for box in kept:
            for row in rows:
                if abs(row[0][0] - box[0]) < row_tol:
                    row.append(box); break
            else:
                rows.append([box])
        rows.sort(key=lambda r: min(b[0] for b in r))
        ordered = [b for row in rows for b in sorted(row, key=lambda b: b[2])]

        print(f"{sheet}: {W}x{H} -> {len(ordered)} poses")
        for (y0, y1, x0, x1) in ordered:
            # rough box back to full res, then tight-crop on real ink
            fy0, fy1 = y0 * DOWNSCALE, min(y1 * DOWNSCALE, H)
            fx0, fx1 = x0 * DOWNSCALE, min(x1 * DOWNSCALE, W)
            sub = gray[fy0:fy1, fx0:fx1]
            iy, ix = np.where(sub > LUMA_THRESHOLD)
            ty0, ty1 = fy0 + iy.min(), fy0 + iy.max() + 1
            tx0, tx1 = fx0 + ix.min(), fx0 + ix.max() + 1
            crop = rgba.crop((tx0, ty0, tx1, ty1))
            counter += 1
            name = f"vibri_{counter:02d}.png"
            crop.save(OUT_DIR / name)
            manifest.append((name, sheet, crop.width, crop.height))
            print(f"  {name}: {crop.width}x{crop.height}")

    print(f"\nTotal: {counter} renders -> {OUT_DIR}")
    return manifest


if __name__ == "__main__":
    main()
