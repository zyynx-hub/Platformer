#!/usr/bin/env python3
from PIL import Image
import os

# Load the sprite sheet
img = Image.open(r'C:\Users\Robin\Desktop\codex\godot_port\assets\sprites\player\2BjgJIH.png')

# Convert to RGBA to support transparency
img = img.convert('RGBA')

width, height = img.size

# Calculate row height (divide image into 5 equal rows)
row_height = height // 5

# Define output directory
output_dir = r'C:\Users\Robin\Desktop\codex\godot_port\assets\sprites\player'
os.makedirs(output_dir, exist_ok=True)

# State names in order from top to bottom
states = ['attack', 'death', 'hurt', 'idle', 'walk']

# Get the background color from the top-left corner (should be the background)
background_color = img.getpixel((0, 0))

# Crop and save each state with transparency
for i, state in enumerate(states):
    top = i * row_height
    bottom = (i + 1) * row_height

    # Crop the row
    cropped = img.crop((0, top, width, bottom))

    # Remove text area (fixed amount from left to remove all text labels)
    # Text labels take up approximately 180 pixels
    crop_left = 180
    sprites_only = cropped.crop((crop_left, 0, cropped.width, cropped.height))

    # Convert background color to transparent
    data = sprites_only.getdata()
    new_data = []
    for item in data:
        if item[:3] == background_color[:3]:  # Compare RGB values
            new_data.append((255, 255, 255, 0))  # Fully transparent
        else:
            new_data.append(item)

    sprites_only.putdata(new_data)

    # Save as PNG with transparency
    output_path = os.path.join(output_dir, f'player_{state}.png')
    sprites_only.save(output_path, 'PNG')
    print(f'Saved: {output_path}')

print('Done! Sprite sheets split with transparent backgrounds.')
