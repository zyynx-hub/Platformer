"""Generate pixel art sprites for tutorial level entities."""
from PIL import Image
import os

OUT = os.path.dirname(__file__)
SPRITES = os.path.join(OUT, "sprites")
os.makedirs(SPRITES, exist_ok=True)

def px(img, x, y, color):
    """Set a pixel with bounds check."""
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), color)

def rect(img, x1, y1, x2, y2, color):
    """Fill a rectangle."""
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1):
            px(img, x, y, color)

def outline_rect(img, x1, y1, x2, y2, color):
    """Draw rectangle outline."""
    for x in range(x1, x2 + 1):
        px(img, x, y1, color)
        px(img, x, y2, color)
    for y in range(y1, y2 + 1):
        px(img, x1, y, color)
        px(img, x2, y, color)

# =============================================================================
# FIGHTER — 16x16 armored humanoid with sword (red/brown palette)
# =============================================================================
def make_fighter():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))

    # Colors
    helmet = (180, 60, 60, 255)      # dark red
    helmet_hi = (220, 90, 70, 255)   # highlight
    visor = (40, 30, 30, 255)        # dark visor slit
    armor = (160, 70, 50, 255)       # body armor
    armor_hi = (200, 100, 70, 255)   # armor highlight
    armor_dk = (120, 50, 35, 255)    # armor shadow
    skin = (220, 180, 140, 255)      # skin tone
    sword = (200, 200, 210, 255)     # blade
    sword_hi = (240, 240, 255, 255)  # blade highlight
    hilt = (140, 100, 50, 255)       # sword hilt
    boot = (80, 50, 40, 255)        # boots

    # Helmet (rows 1-4, centered)
    rect(img, 5, 1, 10, 1, helmet)        # top
    rect(img, 4, 2, 11, 2, helmet)        # wider
    rect(img, 4, 3, 11, 3, helmet)
    px(img, 6, 2, helmet_hi)              # highlight
    px(img, 7, 2, helmet_hi)
    # Visor slit
    rect(img, 5, 4, 10, 4, helmet)
    px(img, 6, 4, visor)
    px(img, 7, 4, visor)
    px(img, 9, 4, visor)

    # Neck
    px(img, 7, 5, skin)
    px(img, 8, 5, skin)

    # Shoulders + armor body (rows 6-10)
    rect(img, 3, 6, 12, 6, armor)         # shoulders
    px(img, 3, 6, armor_hi)
    rect(img, 4, 7, 11, 7, armor)
    rect(img, 5, 8, 10, 8, armor)
    rect(img, 5, 9, 10, 9, armor_dk)
    rect(img, 5, 10, 10, 10, armor)
    # Belt
    rect(img, 5, 10, 10, 10, hilt)

    # Armor chest highlight
    px(img, 6, 7, armor_hi)
    px(img, 7, 7, armor_hi)
    px(img, 6, 8, armor_hi)

    # Sword (right side, rows 3-11)
    px(img, 13, 3, sword_hi)              # blade tip
    px(img, 13, 4, sword)
    px(img, 13, 5, sword)
    px(img, 13, 6, sword)
    px(img, 13, 7, sword)
    px(img, 13, 8, sword_hi)
    px(img, 12, 9, hilt)                  # crossguard
    px(img, 13, 9, hilt)
    px(img, 14, 9, hilt)
    px(img, 13, 10, hilt)                 # grip

    # Arms
    px(img, 3, 7, skin)
    px(img, 3, 8, skin)
    px(img, 12, 7, skin)
    px(img, 12, 8, skin)

    # Legs (rows 11-13)
    rect(img, 5, 11, 7, 13, armor_dk)     # left leg
    rect(img, 8, 11, 10, 13, armor_dk)    # right leg

    # Boots
    rect(img, 5, 14, 7, 14, boot)
    rect(img, 8, 14, 10, 14, boot)
    px(img, 4, 14, boot)                  # boot edges
    px(img, 11, 14, boot)

    # Shield (left side)
    rect(img, 1, 6, 3, 10, (100, 100, 120, 255))
    px(img, 2, 7, (130, 130, 150, 255))   # shield highlight
    px(img, 2, 8, (130, 130, 150, 255))
    outline_rect(img, 1, 6, 3, 10, (70, 70, 85, 255))

    img.save(os.path.join(SPRITES, "fighter.png"))
    print("  fighter.png (16x16)")

# =============================================================================
# WORM — 16x12 segmented worm creature (green/yellow palette)
# =============================================================================
def make_worm():
    img = Image.new("RGBA", (16, 12), (0, 0, 0, 0))

    # Colors
    body = (100, 160, 50, 255)       # green body
    body_hi = (140, 200, 70, 255)    # highlight
    body_dk = (70, 120, 35, 255)     # shadow
    belly = (170, 200, 90, 255)      # underbelly
    eye_w = (255, 255, 255, 255)     # eye white
    eye_p = (20, 20, 20, 255)        # pupil
    segment = (80, 140, 40, 255)     # segment lines

    # Body curve (wider in front, tapers to tail)
    # Head (rows 2-6, cols 10-15)
    rect(img, 11, 2, 14, 3, body)
    rect(img, 10, 4, 15, 6, body)
    rect(img, 11, 7, 14, 7, body)
    px(img, 12, 3, body_hi)
    px(img, 13, 3, body_hi)
    px(img, 12, 5, body_hi)

    # Eyes
    px(img, 13, 4, eye_w)
    px(img, 14, 4, eye_p)
    px(img, 13, 5, eye_w)  # second eye slightly lower for depth

    # Mouth
    px(img, 15, 5, (180, 60, 60, 255))
    px(img, 15, 6, (180, 60, 60, 255))

    # Mid-body segments (cols 4-10)
    rect(img, 5, 4, 10, 7, body)
    rect(img, 6, 3, 9, 3, body)
    # Belly
    rect(img, 6, 7, 10, 7, belly)
    rect(img, 12, 7, 13, 7, belly)

    # Segment lines
    px(img, 8, 3, segment)
    px(img, 8, 4, segment)
    px(img, 8, 5, segment)
    px(img, 8, 6, segment)
    px(img, 8, 7, segment)

    px(img, 11, 3, segment)
    px(img, 11, 4, segment)
    px(img, 11, 5, segment)
    px(img, 11, 6, segment)
    px(img, 11, 7, segment)

    # Highlights on segments
    px(img, 6, 4, body_hi)
    px(img, 7, 4, body_hi)
    px(img, 9, 4, body_hi)
    px(img, 10, 4, body_hi)

    # Tail (cols 1-5)
    rect(img, 2, 5, 5, 7, body)
    rect(img, 3, 4, 4, 4, body)
    px(img, 1, 6, body_dk)            # tail tip
    px(img, 2, 5, body_dk)

    # Segment line on tail
    px(img, 5, 4, segment)
    px(img, 5, 5, segment)
    px(img, 5, 6, segment)
    px(img, 5, 7, segment)

    # Shadow underneath
    for x in range(3, 14):
        px(img, x, 8, (50, 80, 30, 100))

    img.save(os.path.join(SPRITES, "worm.png"))
    print("  worm.png (16x12)")

# =============================================================================
# THIEF — 16x16 cloaked rogue with dagger (purple/dark palette)
# =============================================================================
def make_thief():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))

    # Colors
    cloak = (80, 40, 100, 255)       # dark purple cloak
    cloak_hi = (110, 60, 140, 255)   # cloak highlight
    cloak_dk = (55, 25, 70, 255)     # cloak shadow
    hood = (70, 35, 90, 255)         # hood
    hood_hi = (100, 55, 130, 255)
    skin = (200, 170, 130, 255)      # skin
    eye = (220, 220, 100, 255)       # glowing yellow eyes
    dagger = (190, 200, 210, 255)    # blade
    dagger_hi = (230, 235, 245, 255)
    hilt = (120, 80, 40, 255)
    boot = (50, 30, 40, 255)

    # Hood (rows 1-5)
    rect(img, 5, 1, 10, 1, hood)
    rect(img, 4, 2, 11, 2, hood)
    rect(img, 4, 3, 11, 4, hood)
    px(img, 6, 2, hood_hi)
    px(img, 7, 2, hood_hi)

    # Face under hood (shadowed, just eyes visible)
    rect(img, 5, 5, 10, 5, cloak_dk)
    px(img, 6, 5, eye)                # left eye
    px(img, 9, 5, eye)                # right eye

    # Cloak body (rows 6-12, wider flowing shape)
    rect(img, 3, 6, 12, 6, cloak)
    rect(img, 3, 7, 12, 7, cloak)
    rect(img, 2, 8, 13, 8, cloak)     # wider
    rect(img, 2, 9, 13, 9, cloak)
    rect(img, 2, 10, 13, 10, cloak)
    rect(img, 3, 11, 12, 11, cloak)
    rect(img, 3, 12, 12, 12, cloak_dk)

    # Cloak highlight (left side catches light)
    px(img, 4, 7, cloak_hi)
    px(img, 4, 8, cloak_hi)
    px(img, 3, 9, cloak_hi)
    px(img, 3, 10, cloak_hi)
    px(img, 4, 11, cloak_hi)

    # Cloak shadow (right side)
    px(img, 11, 7, cloak_dk)
    px(img, 12, 8, cloak_dk)
    px(img, 12, 9, cloak_dk)
    px(img, 12, 10, cloak_dk)
    px(img, 11, 11, cloak_dk)

    # Cloak hem detail
    px(img, 3, 12, cloak)
    px(img, 5, 12, cloak)
    px(img, 7, 12, cloak)
    px(img, 9, 12, cloak)
    px(img, 11, 12, cloak)

    # Dagger (right hand, poking out of cloak)
    px(img, 13, 7, skin)              # hand
    px(img, 14, 6, dagger_hi)         # blade
    px(img, 14, 5, dagger)
    px(img, 14, 4, dagger)
    px(img, 14, 3, dagger_hi)         # tip
    px(img, 14, 7, hilt)              # hilt

    # Legs peeking below cloak
    rect(img, 5, 13, 6, 14, cloak_dk)
    rect(img, 9, 13, 10, 14, cloak_dk)

    # Boots
    px(img, 4, 14, boot)
    px(img, 5, 14, boot)
    px(img, 6, 14, boot)
    px(img, 7, 14, boot)
    px(img, 8, 14, boot)
    px(img, 9, 14, boot)
    px(img, 10, 14, boot)
    px(img, 11, 14, boot)

    img.save(os.path.join(SPRITES, "thief.png"))
    print("  thief.png (16x16)")

# =============================================================================
# DOOR — 12x32 wooden door with planks and iron bands
# =============================================================================
def make_door():
    img = Image.new("RGBA", (12, 32), (0, 0, 0, 0))

    # Colors
    wood = (140, 90, 50, 255)
    wood_hi = (170, 115, 65, 255)
    wood_dk = (100, 65, 35, 255)
    iron = (80, 85, 95, 255)
    iron_hi = (110, 115, 125, 255)

    # Fill with wood base
    rect(img, 0, 0, 11, 31, wood)

    # Plank lines (vertical)
    for y in range(32):
        px(img, 4, y, wood_dk)
        px(img, 8, y, wood_dk)

    # Plank highlights
    for y in range(32):
        px(img, 2, y, wood_hi)
        px(img, 6, y, wood_hi)
        px(img, 10, y, wood_hi)

    # Iron bands (horizontal)
    for band_y in [3, 15, 27]:
        rect(img, 0, band_y, 11, band_y + 1, iron)
        px(img, 1, band_y, iron_hi)
        px(img, 5, band_y, iron_hi)
        px(img, 9, band_y, iron_hi)

    # Iron rivets on bands
    for band_y in [3, 15, 27]:
        px(img, 2, band_y, (60, 65, 75, 255))
        px(img, 6, band_y, (60, 65, 75, 255))
        px(img, 10, band_y, (60, 65, 75, 255))

    # Door handle (right side, middle)
    px(img, 10, 16, iron_hi)
    px(img, 10, 17, iron)

    # Edges (darker frame)
    for y in range(32):
        px(img, 0, y, wood_dk)
        px(img, 11, y, wood_dk)
    for x in range(12):
        px(img, x, 0, wood_dk)
        px(img, x, 31, wood_dk)

    img.save(os.path.join(SPRITES, "door.png"))
    print("  door.png (12x32)")

# =============================================================================
# BUTTON — 10x10 wall-mounted switch
# =============================================================================
def make_button():
    img = Image.new("RGBA", (10, 10), (0, 0, 0, 0))

    plate = (100, 100, 110, 255)     # metal plate
    plate_hi = (140, 140, 155, 255)
    btn_off = (180, 40, 40, 255)     # red button (unpressed)
    btn_hi = (220, 70, 60, 255)
    frame = (60, 60, 70, 255)

    # Plate background
    rect(img, 1, 1, 8, 8, plate)
    outline_rect(img, 0, 0, 9, 9, frame)

    # Highlight on plate
    px(img, 2, 2, plate_hi)
    px(img, 3, 2, plate_hi)

    # Button (center circle-ish)
    rect(img, 3, 3, 6, 6, btn_off)
    px(img, 4, 4, btn_hi)
    px(img, 5, 4, btn_hi)

    img.save(os.path.join(SPRITES, "button.png"))
    print("  button.png (10x10)")

# =============================================================================
# KEY — 10x16 golden key
# =============================================================================
def make_key():
    img = Image.new("RGBA", (10, 16), (0, 0, 0, 0))

    gold = (230, 190, 50, 255)
    gold_hi = (255, 220, 90, 255)
    gold_dk = (180, 140, 30, 255)

    # Ring (top, rows 1-5)
    rect(img, 3, 1, 6, 1, gold)
    px(img, 2, 2, gold)
    px(img, 7, 2, gold)
    px(img, 2, 3, gold)
    px(img, 7, 3, gold)
    px(img, 2, 4, gold)
    px(img, 7, 4, gold)
    rect(img, 3, 5, 6, 5, gold)
    # Ring interior
    px(img, 4, 2, gold_hi)
    px(img, 5, 2, gold_hi)
    px(img, 4, 3, (0, 0, 0, 0))  # hollow
    px(img, 5, 3, (0, 0, 0, 0))
    px(img, 4, 4, (0, 0, 0, 0))
    px(img, 5, 4, (0, 0, 0, 0))
    # Ring highlight
    px(img, 3, 2, gold_hi)
    px(img, 3, 3, gold_hi)

    # Shaft (rows 6-12)
    for y in range(6, 13):
        px(img, 4, y, gold)
        px(img, 5, y, gold_dk)
    px(img, 4, 6, gold_hi)

    # Teeth (rows 10-12, right side)
    px(img, 6, 10, gold)
    px(img, 7, 10, gold_dk)
    px(img, 6, 12, gold)
    px(img, 7, 12, gold)
    px(img, 8, 12, gold_dk)

    # Bottom tooth
    px(img, 4, 13, gold)
    px(img, 5, 13, gold)
    px(img, 6, 13, gold)
    px(img, 7, 13, gold_dk)

    img.save(os.path.join(SPRITES, "key.png"))
    print("  key.png (10x16)")

# =============================================================================
# TELEPORTER — 16x16 blue swirling pad
# =============================================================================
def make_teleporter():
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))

    outer = (30, 60, 180, 200)
    mid = (60, 100, 220, 220)
    inner = (100, 160, 255, 240)
    core = (180, 220, 255, 255)
    spark = (220, 240, 255, 255)

    # Outer ring
    ring_pixels = [
        (5,1),(6,1),(7,1),(8,1),(9,1),(10,1),
        (3,2),(4,2),(11,2),(12,2),
        (2,3),(13,3),
        (2,4),(13,4),
        (1,5),(14,5),
        (1,6),(14,6),
        (1,7),(14,7),
        (1,8),(14,8),
        (1,9),(14,9),
        (1,10),(14,10),
        (2,11),(13,11),
        (2,12),(13,12),
        (3,13),(4,13),(11,13),(12,13),
        (5,14),(6,14),(7,14),(8,14),(9,14),(10,14),
    ]
    for x, y in ring_pixels:
        px(img, x, y, outer)

    # Mid ring fill
    mid_pixels = [
        (5,2),(6,2),(7,2),(8,2),(9,2),(10,2),
        (3,3),(4,3),(5,3),(10,3),(11,3),(12,3),
        (3,4),(4,4),(11,4),(12,4),
        (2,5),(3,5),(12,5),(13,5),
        (2,6),(3,6),(12,6),(13,6),
        (2,7),(3,7),(12,7),(13,7),
        (2,8),(3,8),(12,8),(13,8),
        (2,9),(3,9),(12,9),(13,9),
        (2,10),(3,10),(12,10),(13,10),
        (3,11),(4,11),(11,11),(12,11),
        (3,12),(4,12),(5,12),(10,12),(11,12),(12,12),
        (5,13),(6,13),(7,13),(8,13),(9,13),(10,13),
    ]
    for x, y in mid_pixels:
        px(img, x, y, mid)

    # Inner area
    for y in range(4, 12):
        for x in range(4, 12):
            if img.getpixel((x, y))[3] == 0:
                px(img, x, y, inner)

    # Core glow
    rect(img, 6, 6, 9, 9, core)
    px(img, 7, 7, spark)
    px(img, 8, 8, spark)

    # Swirl sparkles
    px(img, 5, 5, spark)
    px(img, 10, 6, spark)
    px(img, 4, 8, spark)
    px(img, 11, 10, spark)
    px(img, 6, 11, spark)

    img.save(os.path.join(SPRITES, "teleporter.png"))
    print("  teleporter.png (16x16)")

if __name__ == "__main__":
    print("Generating tutorial sprites...")
    make_fighter()
    make_worm()
    make_thief()
    make_door()
    make_button()
    make_key()
    make_teleporter()
    print("Done! Sprites saved to:", SPRITES)
