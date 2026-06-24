"""Recolor doggo.png with clean.png's palette using per-region HSV classification.

For each opaque pixel in doggo.png, classify it by HSV into a color "role"
(outline, head, hat, hat-band, shirt, pants, shoes, white) and replace it with
the corresponding flat color sampled from clean.png. Lightness within the role
is preserved by blending the target color toward black/white based on the
source pixel's value, so shading isn't fully flattened.
"""
from pathlib import Path
import numpy as np
from PIL import Image
import colorsys

ROOT = Path(__file__).parent
DOGGO = ROOT / "doggo.png"

# Target palette (sampled from clean.png)
BLACK      = np.array([  0,   0,   0], dtype=np.float32)
WHITE      = np.array([255, 255, 255], dtype=np.float32)
HAT_ORANGE = np.array([253,  86,   1], dtype=np.float32)  # #FD5601
HAT_BAND   = np.array([170,  56,   1], dtype=np.float32)  # #AA3801
CREAM      = np.array([252, 249, 143], dtype=np.float32)  # #FCF98F
SHIRT_BLUE = np.array([ 51, 103, 201], dtype=np.float32)  # #3367C9
NAVY       = np.array([ 10,  24,  64], dtype=np.float32)  # #0A1840
SHOES_RED  = np.array([216,  38,  29], dtype=np.float32)  # #D8261D

img = np.array(Image.open(DOGGO).convert("RGBA"))
h, w, _ = img.shape
rgb = img[..., :3]
alpha = img[..., 3]
opaque = alpha > 0

# Per-pixel HSV in normalized [0,1] ranges
r = rgb[..., 0] / 255.0
g = rgb[..., 1] / 255.0
b = rgb[..., 2] / 255.0
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
v = mx
delta = mx - mn
s = np.where(mx > 0, delta / np.where(mx == 0, 1, mx), 0)
# hue in degrees [0, 360)
hh = np.zeros_like(mx)
mask_r = (mx == r) & (delta > 0)
mask_g = (mx == g) & (delta > 0)
mask_b = (mx == b) & (delta > 0)
hh[mask_r] = ((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6
hh[mask_g] = (b[mask_g] - r[mask_g]) / delta[mask_g] + 2
hh[mask_b] = (r[mask_b] - g[mask_b]) / delta[mask_b] + 4
hh *= 60.0
hh = hh % 360.0

# --- classify into roles ---
role = np.zeros((h, w), dtype=np.int8)  # 0 = leave unchanged
BG = 0  # transparent → unchanged
OUTLINE = 1
WHITE_R = 2
NAVY_R = 3
SHIRT_R = 4
HAT_R = 5
SHOES_R = 6
BAND_R = 7
CREAM_R = 8

red_band = (hh <= 30) | (hh >= 330)

role[(opaque) & (v < 0.20)] = OUTLINE
role[(opaque) & (role == 0) & (s < 0.10) & (v > 0.90)] = WHITE_R
role[(opaque) & (role == 0) & (hh >= 200) & (hh <= 260) & (s > 0.40)] = NAVY_R
role[(opaque) & (role == 0) & (hh >= 80) & (hh <= 180) & (s > 0.30)] = SHIRT_R
# Yellow (hat diamond logo) -> hat band color
role[(opaque) & (role == 0) & (hh >= 40) & (hh <= 70) & (s > 0.45)] = BAND_R
# Reds, split by V into hat top / shoes / band
role[(opaque) & (role == 0) & red_band & (v >= 0.70) & (s >= 0.50)] = HAT_R
role[(opaque) & (role == 0) & red_band & (v >= 0.40)] = SHOES_R
role[(opaque) & (role == 0) & red_band] = BAND_R
# Pale / desaturated remainder -> head cream
role[(opaque) & (role == 0) & (s < 0.45) & (v > 0.45)] = CREAM_R
# Anything still unclassified -> cream (head/face fallback rather than black)
role[(opaque) & (role == 0)] = CREAM_R

target = {
    OUTLINE: BLACK,
    WHITE_R: WHITE,
    NAVY_R:  NAVY,
    SHIRT_R: SHIRT_BLUE,
    HAT_R:   HAT_ORANGE,
    SHOES_R: SHOES_RED,
    BAND_R:  HAT_BAND,
    CREAM_R: CREAM,
}

# Typical V for each region in doggo, used to derive a shading factor that
# darkens or lightens the target color (preserves highlights / shadows).
ref_v = {
    OUTLINE: 0.12,
    WHITE_R: 0.97,
    NAVY_R:  0.38,
    SHIRT_R: 0.40,
    HAT_R:   0.90,
    SHOES_R: 0.55,
    BAND_R:  0.30,
    CREAM_R: 0.78,
}

out = rgb.astype(np.float32).copy()
for rid, color in target.items():
    mask = role == rid
    if not mask.any():
        continue
    # Shading factor: how much darker/lighter the source pixel is than the
    # region's reference V. Map V deviation to a multiplicative factor in
    # [0.65, 1.20] so shadows stay readable and highlights brighten.
    vv = v[mask]
    factor = 0.65 + (vv / max(ref_v[rid], 0.05)).clip(0, 1.8) * 0.35
    factor = factor[..., None]  # broadcast over RGB
    base = color[None, :]
    shaded = base * factor
    # Blend toward white for very bright source pixels (preserve highlights)
    highlight = (vv > 0.92).astype(np.float32)[..., None]
    shaded = shaded * (1 - 0.6 * highlight) + 255 * 0.6 * highlight
    out[mask] = np.clip(shaded, 0, 255)

result = img.copy()
result[..., :3] = out.astype(np.uint8)
result[..., 3] = alpha
Image.fromarray(result, "RGBA").save(DOGGO)

# Report role counts
print("role pixel counts:")
for rid, name in [(OUTLINE,"outline"),(WHITE_R,"white"),(NAVY_R,"navy"),
                  (SHIRT_R,"shirt"),(HAT_R,"hat"),(SHOES_R,"shoes"),
                  (BAND_R,"band"),(CREAM_R,"cream")]:
    print(f"  {name:8s} {int((role==rid).sum())}")
print(f"wrote {DOGGO.name}")
