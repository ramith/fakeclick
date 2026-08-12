from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "icons")
OUT = os.path.join(ROOT, "store")
os.makedirs(OUT, exist_ok=True)

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"

BG = (247, 247, 250)
INK = (24, 24, 27)
MUTED = (100, 102, 110)
INDIGO = (79, 70, 229)


def centered_text(d, cx, y, text, font, fill):
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    d.text((cx - w / 2, y), text, font=font, fill=fill)
    return bbox[3] - bbox[1]


def make_screenshot_promo():
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    icon = Image.open(os.path.join(ICONS, "icon-on-128.png")).convert("RGBA")
    icon = icon.resize((160, 160), Image.LANCZOS)
    img.paste(icon, (W // 2 - 80, 90), icon)

    title_font = ImageFont.truetype(BOLD, 64)
    tagline_font = ImageFont.truetype(REGULAR, 30)
    small_font = ImageFont.truetype(REGULAR, 24)

    centered_text(d, W // 2, 270, "FakeClick", title_font, INK)
    centered_text(
        d, W // 2, 350,
        "Ad popunder clicks \"close\" → a new tab tries to open.",
        tagline_font, MUTED,
    )
    centered_text(
        d, W // 2, 390,
        "FakeClick makes it look like it worked. Nothing opens.",
        tagline_font, MUTED,
    )

    # before/after row
    off_icon = Image.open(os.path.join(ICONS, "icon-off-128.png")).convert("RGBA").resize((96, 96), Image.LANCZOS)
    on_icon = Image.open(os.path.join(ICONS, "icon-on-128.png")).convert("RGBA").resize((96, 96), Image.LANCZOS)

    row_y = 480
    gap = 260
    left_x = W // 2 - gap
    right_x = W // 2 + gap - 96

    img.paste(off_icon, (left_x, row_y), off_icon)
    img.paste(on_icon, (right_x, row_y), on_icon)

    centered_text(d, left_x + 48, row_y + 110, "Off by default", small_font, MUTED)
    centered_text(d, right_x + 48, row_y + 110, "Click to enable per site", small_font, MUTED)

    arrow_font = ImageFont.truetype(BOLD, 40)
    centered_text(d, W // 2, row_y + 28, "→", arrow_font, INDIGO)

    footer_font = ImageFont.truetype(REGULAR, 22)
    centered_text(d, W // 2, 700, "No account. No tracking. Nothing sent anywhere.", footer_font, MUTED)

    img.save(os.path.join(OUT, "promo-1280x800.png"))


def make_small_tile():
    W, H = 440, 280
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    icon = Image.open(os.path.join(ICONS, "icon-on-128.png")).convert("RGBA").resize((100, 100), Image.LANCZOS)
    img.paste(icon, (W // 2 - 50, 40), icon)

    title_font = ImageFont.truetype(BOLD, 36)
    tagline_font = ImageFont.truetype(REGULAR, 18)

    centered_text(d, W // 2, 155, "FakeClick", title_font, INK)
    centered_text(d, W // 2, 205, "Defuses ad popunders", tagline_font, MUTED)
    centered_text(d, W // 2, 230, "per site, on click", tagline_font, MUTED)

    img.save(os.path.join(OUT, "small-tile-440x280.png"))


make_screenshot_promo()
make_small_tile()
print("done:", os.listdir(OUT))
