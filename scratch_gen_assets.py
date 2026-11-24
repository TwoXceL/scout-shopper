import os
from PIL import Image, ImageDraw, ImageFont

assets_dir = os.path.join(os.getcwd(), 'assets')
os.makedirs(assets_dir, exist_ok=True)

# 1. Generate icon-background.png (1024x1024, Solid Obsidian Black #000000)
bg_img = Image.new('RGBA', (1024, 1024), (0, 0, 0, 255))
bg_img.save(os.path.join(assets_dir, 'icon-background.png'))
print('Generated assets/icon-background.png')

# 2. Generate icon-foreground.png (1024x1024, Transparent, Centered Gold 'S' and Emerald '$')
fg_img = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg_draw = ImageDraw.Draw(fg_img)

# Try loading standard truetype font or fallback
font_gold = None
font_green = None
for font_name in ["arialbd.ttf", "segoeui.ttf", "calibrib.ttf", "arial.ttf"]:
    try:
        font_gold = ImageFont.truetype(font_name, 520)
        font_green = ImageFont.truetype(font_name, 520)
        break
    except Exception:
        pass

if not font_gold:
    font_gold = ImageFont.load_default()
    font_green = ImageFont.load_default()

# Inner badge container on foreground
pad = 140
fg_draw.rounded_rectangle([(pad, pad), (1024 - pad, 1024 - pad)], radius=220, fill='#111111', outline='#333333', width=16)
fg_draw.rounded_rectangle([(pad + 20, pad + 20), (1024 - pad - 20, 1024 - pad - 20)], radius=200, outline='#F59E0B', width=12)

# Draw Gold 'S' and Emerald '$'
# S at left center, $ at right center
fg_draw.text((260, 240), 'S', font=font_gold, fill='#F59E0B')
fg_draw.text((540, 240), '$', font=font_green, fill='#10B981')

fg_img.save(os.path.join(assets_dir, 'icon-foreground.png'))
print('Generated assets/icon-foreground.png')

# 3. Generate icon-only.png (1024x1024)
icon_only = Image.alpha_composite(bg_img, fg_img)
icon_only.save(os.path.join(assets_dir, 'icon-only.png'))
icon_only.save(os.path.join(assets_dir, 'icon.png'))
icon_only.save(os.path.join(assets_dir, 'logo.png'))
print('Generated assets/icon-only.png')

# 4. Generate splash.png & splash-dark.png (2732x2732, Obsidian Background with Centered Brand Badge)
splash_img = Image.new('RGBA', (2732, 2732), (0, 0, 0, 255))
splash_draw = ImageDraw.Draw(splash_img)

# Scale badge down to 680x680 in the dead center
center_x = 2732 // 2
center_y = 2732 // 2
badge_w = 680
badge_pad = badge_w // 2

b_x0 = center_x - badge_pad
b_y0 = center_y - badge_pad
b_x1 = center_x + badge_pad
b_y1 = center_y + badge_pad

splash_draw.rounded_rectangle([(b_x0, b_y0), (b_x1, b_y1)], radius=140, fill='#111111', outline='#333333', width=12)
splash_draw.rounded_rectangle([(b_x0 + 14, b_y0 + 14), (b_x1 - 14, b_y1 - 14)], radius=126, outline='#F59E0B', width=8)

# Text inside splash badge
for font_name in ["arialbd.ttf", "segoeui.ttf", "calibrib.ttf", "arial.ttf"]:
    try:
        splash_font = ImageFont.truetype(font_name, 350)
        break
    except Exception:
        pass

splash_draw.text((b_x0 + 80, b_y0 + 160), 'S', font=splash_font, fill='#F59E0B')
splash_draw.text((b_x0 + 360, b_y0 + 160), '$', font=splash_font, fill='#10B981')

# Add subtitle below badge: "Scout $hopper"
try:
    sub_font = ImageFont.truetype("arialbd.ttf", 96)
except Exception:
    sub_font = splash_font

sub_text = "Scout $hopper"
splash_draw.text((center_x - 300, b_y1 + 80), sub_text, font=sub_font, fill='#FFFFFF')

splash_img.save(os.path.join(assets_dir, 'splash.png'))
splash_img.save(os.path.join(assets_dir, 'splash-dark.png'))
print('Generated assets/splash.png and splash-dark.png')
