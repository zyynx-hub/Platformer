#!/usr/bin/env python3
"""Generate a pixel-art rocket flame sprite sheet (4 frames, horizontal strip).

Output: assets/sprites/items/rocket_flame_4.png
Format: 48x14 (4 frames of 12x14), RGBA, transparent background
"""

from PIL import Image
import os
import random

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "sprites", "items")

FW, FH = 12, 14  # frame size
FRAMES = 4

# Pixel-art fire color ramp (RGBA)
CORE = (255, 255, 180, 255)       # bright yellow-white
INNER = (255, 210, 60, 255)       # yellow
MIDDLE = (255, 140, 35, 255)      # orange
OUTER = (240, 65, 20, 255)        # red-orange
TIP = (160, 30, 10, 220)          # dark red, slightly transparent
TRANSPARENT = (0, 0, 0, 0)


def make_frame(seed_val):
    """Generate one flame frame — two small flames (one per boot)."""
    random.seed(seed_val)
    img = Image.new("RGBA", (FW, FH), TRANSPARENT)

    # Two boot flames at x-centers 3 and 8
    for boot_cx in [3, 8]:
        flame_h = random.randint(9, 12)
        for row in range(flame_h):
            progress = row / max(flame_h - 1, 1)  # 0=top (boot sole), 1=bottom (tip)
            half_w = max(1, int((1.0 - progress * 0.65) * 2.0 + random.random() * 0.5))

            for dx in range(-half_w, half_w + 1):
                px = boot_cx + dx
                if px < 0 or px >= FW:
                    continue

                dist = abs(dx) / max(half_w, 1)

                # Color based on vertical progress and distance from center
                if progress < 0.15:
                    color = CORE if dist < 0.4 else INNER
                elif progress < 0.35:
                    color = INNER if dist < 0.3 else MIDDLE
                elif progress < 0.6:
                    color = MIDDLE if dist < 0.35 else OUTER
                else:
                    color = OUTER if dist < 0.4 else TIP

                # Random pixel dropout for flicker (more toward tips)
                if random.random() < 0.12 * progress:
                    continue

                img.putpixel((px, row), color)

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    strip = Image.new("RGBA", (FW * FRAMES, FH), TRANSPARENT)
    for i in range(FRAMES):
        frame = make_frame(42 + i * 13)
        strip.paste(frame, (i * FW, 0))

    path = os.path.join(OUTPUT_DIR, "rocket_flame_4.png")
    strip.save(path)
    print(f"Written: {path}")


if __name__ == "__main__":
    main()
