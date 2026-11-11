"""Builds the site's pictures, spray-edged shapes and js/data.js.

    uv run --with pillow --with numpy tools/build.py                                  # data.js + shapes
    uv run --with pillow --with numpy tools/build.py --src ~/scratch/hayve-research   # pictures too

The originals (hayve's posts and cover art) are not kept in this repo. With
--src the covers named in data/catalog.json and the photos listed below are
cropped, toned and compressed into art/ and img/.
"""
import argparse, json, pathlib

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--src", help="folder holding the original pictures (img/ and img_ig/ inside it)")
args = ap.parse_args()

catalog = json.loads((ROOT / "data" / "catalog.json").read_text())
mark = json.loads((ROOT / "data" / "mark.json").read_text())


def report(path, im=None):
    size = f"{im.width}x{im.height}  " if im else ""
    print(f"{path.relative_to(ROOT)}  {size}{path.stat().st_size // 1024} KB")


def save(im, path, q=80):
    path.parent.mkdir(exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=q, optimize=True, progressive=True)
    report(path, im)


def frac_crop(im, box):
    """Crop by fractions of the picture: (left, top, right, bottom)."""
    w, h = im.size
    return im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))


def fit(im, width):
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def mono(im, contrast=1.12, lift=0):
    """hayve's press pictures are black and white; bring the colour ones to the same look."""
    g = ImageOps.grayscale(im)
    g = ImageEnhance.Contrast(g).enhance(contrast)
    if lift:
        g = g.point(lambda v: min(255, round(v + lift * (255 - v) / 255)))
    return g.convert("RGB")


# ---------- the owl mark (traced from hayve's own profile picture) ----------
x0, y0, x1, y1 = mark["bbox"]
box = f"{x0 - 2:.0f} {y0 - 2:.0f} {x1 - x0 + 4:.0f} {y1 - y0 + 4:.0f}"
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}"><path fill="#fff" d="{mark["d"]}"/></svg>\n'
(ROOT / "img").mkdir(exist_ok=True)
(ROOT / "img" / "mark.svg").write_text(svg)
report(ROOT / "img" / "mark.svg")


# ---------- spray-edged shapes (the moons) ----------
def spray(w, h, discs, edge=0.04, seed=1, grain=2):
    """A white shape with a stippled, sprayed edge, as an alpha mask.
    discs: (cx, cy, r) in units of the height. The shape is their union."""
    rng = np.random.default_rng(seed)
    nw, nh = w // grain, h // grain
    y, x = np.mgrid[0:nh, 0:nw] / nh
    d = np.full((nh, nw), 9.0)
    for i, (cx, cy, r) in enumerate(discs):
        ang = np.arctan2(y - cy, x - cx)
        wob = 1 + 0.014 * np.sin(3 * ang + seed + i) + 0.009 * np.sin(7 * ang + 2.3 * seed) + 0.006 * np.sin(13 * ang + seed)
        d = np.minimum(d, (np.hypot(x - cx, y - cy) - r * wob))
    t = np.clip(-d / edge + 0.45, 0, 1)          # 0 a little outside the outline, 1 just inside
    p = t * t * (3 - 2 * t)
    a = (rng.random((nh, nw)) < p ** 1.15).astype(np.uint8) * 255
    im = Image.fromarray(a, "L").resize((w, h), Image.NEAREST)
    out = Image.new("LA", (w, h), 255)
    out.putalpha(im)
    return out


for name, w, h, discs, seed in (
    ("blob-a", 1400, 1400, [(0.5, 0.5, 0.465)], 3),
    ("blob-b", 1200, 1200, [(0.5, 0.5, 0.465)], 11),
    ("blob-duo", 1680, 1120, [(0.5, 0.52, 0.455), (1.0, 0.48, 0.455)], 7),
):
    p = ROOT / "img" / f"{name}.png"
    spray(w, h, discs, seed=seed).save(p, optimize=True)
    report(p)

# ---------- paper grain: dark and light specks on a clear tile ----------
rng = np.random.default_rng(5)
n = 360
g = np.zeros((n, n, 4), np.uint8)
r = rng.random((n, n))
dark = r < 0.11
light = r > 0.965
g[dark] = (0, 0, 0, 0)
g[..., 3][dark] = (rng.random(dark.sum()) * 70 + 14).astype(np.uint8)
g[light] = (255, 255, 255, 0)
g[..., 3][light] = (rng.random(light.sum()) * 60 + 20).astype(np.uint8)
p = ROOT / "img" / "grain.png"
Image.fromarray(g, "RGBA").save(p, optimize=True)
report(p)

# ---------- pictures ----------
if args.src:
    SRC = pathlib.Path(args.src).expanduser()
    for r in catalog:
        im = Image.open(SRC / "img" / r["src"]).convert("RGB")
        s = min(im.size)
        im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
        save(im.resize((480, 480), Image.LANCZOS), ROOT / "art" / f"{r['id']}.jpg", 78)
    # the new single, large, for the "out now" card
    im = Image.open(SRC / "img" / "cat_see-u-bounce.jpg").convert("RGB")
    save(fit(im, 900), ROOT / "art" / "see-u-bounce-large.jpg", 82)

    IG = SRC / "img_ig"
    # (file, crop, width, black-and-white?, name)
    for src, crop, width, bw, name in (
        ("igc_DbMM5gXDfUR_01.jpg", (0.02, 0.10, 0.92, 0.775), 1100, True, "alley"),        # the two of them, brick alley
        ("igc_DMlN5GXsUMK_01.jpg", (0.14, 0.0, 0.98, 1.0), 1300, True, "tomorrowland"),   # the crowd at Tomorrowland 2025
    ):
        im = frac_crop(Image.open(IG / src).convert("RGB"), crop)
        im = fit(im, width)
        save(mono(im) if bw else im, ROOT / "img" / f"{name}.jpg", 74)

    # link preview card
    im = Image.open(ROOT / "img" / "alley.jpg").convert("RGB")
    w, h = im.size
    card = im.crop((0, round(h * 0.06), w, round(h * 0.06) + round(w * 630 / 1200))).resize((1200, 630), Image.LANCZOS)
    save(card, ROOT / "img" / "card.jpg", 82)

# ---------- js/data.js ----------
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
rows = []
for r in catalog:
    y, m, d = r["date"].split("-")
    row = {
        "id": r["id"], "title": r["title"], "with": r.get("with", []), "feat": r.get("feat"),
        "year": int(y), "day": f"{int(d)} {MONTHS[int(m) - 1]} {y}", "label": r.get("label", ""),
        "kind": r.get("kind", "single"), "note": r.get("note"), "art": f"art/{r['id']}.jpg",
        "soundcloud": r.get("soundcloud"), "spotify": r.get("spotify"), "apple": r.get("apple"),
        "seconds": r.get("seconds", 0), "embed": r.get("embed", True),
    }
    rows.append({k: v for k, v in row.items() if v not in (None, "", [])})
out = ROOT / "js" / "data.js"
def part_box(d):
    import re
    pts = [(float(a), float(b)) for a, b in re.findall(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", d)]
    return [min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)]


# the mark goes along so the page can draw it on the owls; its two crescents are the eyes
eyes = sorted((part_box(d) for d in mark["parts"][1:]), key=lambda b: b[0])
mark_js = {"box": [x0, y0, round(x1 - x0, 1), round(y1 - y0, 1)], "d": mark["d"], "eyes": eyes}
out.write_text("// Made by tools/build.py from data/catalog.json and data/mark.json. Edit those, not this file.\n"
               "window.HAYVE = " + json.dumps({"records": rows, "mark": mark_js}, ensure_ascii=False, indent=1) + ";\n")
report(out)
print(len(rows), "records")
