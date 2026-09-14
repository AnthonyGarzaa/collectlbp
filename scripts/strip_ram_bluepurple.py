"""Strip blue and purple pixels from ram.png by making them transparent.

Blue and purple pixels share a signature: the blue channel dominates the
green channel by a wide margin. White, black, and the dark brown outlines
all have B ~= G, so they survive.
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "ressources" / "ram.png"
DST = SRC.with_name("ram_transparent.png")
BG_DOMINANCE = 40


def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3].astype(np.int16)
    blueish = (rgb[..., 2] - rgb[..., 1]) > BG_DOMINANCE
    arr[..., 3][blueish] = 0
    Image.fromarray(arr, "RGBA").save(DST)
    cleared = int(blueish.sum())
    print(f"wrote {DST.name}: cleared {cleared} blue/purple px of {arr.shape[0]*arr.shape[1]}")


if __name__ == "__main__":
    main()
