"""Inspect rapdog.png: composite on magenta, plus mask remaining near-white pixels."""
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "rapdog.png"
img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape

# composite on magenta to see what's still opaque
bg = np.full((h, w, 3), (255, 0, 255), dtype=np.uint8)
alpha = arr[..., 3:4].astype(np.float32) / 255.0
out = (arr[..., :3].astype(np.float32) * alpha + bg.astype(np.float32) * (1 - alpha)).astype(np.uint8)
Image.fromarray(out, "RGB").save(SRC.with_name("debug_rapdog_magenta.png"))

# highlight remaining near-white opaque pixels (min RGB >= 200, alpha > 0)
near_white = arr[..., :3].min(axis=2) >= 200
opaque = arr[..., 3] > 0
hit = near_white & opaque

vis = np.full((h, w, 3), (40, 40, 40), dtype=np.uint8)
vis[hit] = (255, 255, 0)  # yellow = remaining near-white opaque
Image.fromarray(vis, "RGB").save(SRC.with_name("debug_rapdog_white_mask.png"))
print(f"remaining near-white opaque pixels: {int(hit.sum())}")
