from PIL import Image, ImageDraw
import math, os

OUT = "/Users/ramith/code/fakeclick/icons"
os.makedirs(OUT, exist_ok=True)

CANVAS = 512

def draw_base(window_color, ring_color, titlebar_color, dot_color, alpha=255):
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = CANVAS / 2

    # --- popup window shape ---
    win_w, win_h = 300, 220
    win_left = cx - win_w / 2
    win_top = cy - win_h / 2 + 10
    win_right = win_left + win_w
    win_bottom = win_top + win_h
    radius = 22

    def a(c):
        return (c[0], c[1], c[2], alpha)

    # window body
    d.rounded_rectangle(
        [win_left, win_top, win_right, win_bottom],
        radius=radius,
        fill=a(window_color),
    )
    # title bar
    bar_h = 46
    d.rounded_rectangle(
        [win_left, win_top, win_right, win_top + bar_h],
        radius=radius,
        fill=a(titlebar_color),
    )
    # square off the bottom corners of the title bar rounding
    d.rectangle([win_left, win_top + bar_h - radius, win_right, win_top + bar_h], fill=a(titlebar_color))
    # window control dots
    dot_r = 9
    dot_y = win_top + bar_h / 2
    for i, dx in enumerate([34, 62, 90]):
        d.ellipse(
            [win_left + dx - dot_r, dot_y - dot_r, win_left + dx + dot_r, dot_y + dot_r],
            fill=a(dot_color),
        )

    # --- prohibition ring + slash ---
    ring_r = 235
    ring_w = 34
    d.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=a(ring_color),
        width=ring_w,
    )
    ang = math.radians(45)
    inner = ring_r - ring_w / 2 + 2
    x1 = cx - inner * math.cos(ang)
    y1 = cy - inner * math.sin(ang)
    x2 = cx + inner * math.cos(ang)
    y2 = cy + inner * math.sin(ang)
    d.line([x1, y1, x2, y2], fill=a(ring_color), width=ring_w)
    # round the slash ends to match the ring's rounded look
    for x, y in [(x1, y1), (x2, y2)]:
        d.ellipse([x - ring_w/2, y - ring_w/2, x + ring_w/2, y + ring_w/2], fill=a(ring_color))

    return img

SIZES = [16, 19, 32, 38, 48, 128]

# Active (blocking on): indigo window, red "no" ring
active = draw_base(
    window_color=(79, 70, 229),    # indigo-600
    ring_color=(220, 38, 38),      # red-600
    titlebar_color=(55, 48, 163),  # indigo-800
    dot_color=(199, 210, 254),     # indigo-200
)

# Inactive (blocking off): flat greys, lower contrast
inactive = draw_base(
    window_color=(148, 155, 168),
    ring_color=(120, 126, 138),
    titlebar_color=(110, 116, 128),
    dot_color=(200, 204, 212),
    alpha=235,
)

for size in SIZES:
    active.resize((size, size), Image.LANCZOS).save(f"{OUT}/icon-on-{size}.png")
    inactive.resize((size, size), Image.LANCZOS).save(f"{OUT}/icon-off-{size}.png")

print("done", os.listdir(OUT))
