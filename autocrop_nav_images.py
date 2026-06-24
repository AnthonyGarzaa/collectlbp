"""Trim transparent padding around the 4 nav decorations so gap looks uniform."""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
FILES = ["thebear_.png", "thekat.png", "thesun.png", "rapdog.png"]


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
    print(f"{path.name}: {arr.shape[1]}x{arr.shape[0]} -> {cropped.shape[1]}x{cropped.shape[0]}")


for name in FILES:
    autocrop(ROOT / name)
