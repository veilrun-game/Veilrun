#!/usr/bin/env python3
"""VEILRUN VR-91 — raw art -> contract canvas.

Midjourney gives you a figure somewhere in a square. The contract wants it on a
1024x1024 canvas with the feet on y=960 at a known height. Doing that by hand
152 times is where a pipeline dies, so this does it.

  python3 _tools/_fit.py <in_dir> <out_dir>

Input : transparent PNGs, any size, named <char>_<state>_f<0-3>.png
Output: 1024x1024 contract-compliant PNGs, ready for _sprites.py

Height rule — this is the bit that matters:
  Every image is scaled to an ABSOLUTE target height for its state. Midjourney
  hands back figures at whatever size it likes, so a per-character scale factor
  is meaningless — each image has to be normalised on its own.

    idle / move / attack   864px   (the rigid standing box; guarantees the
                                    contract's +/-2% agreement, exactly)
    hurt                   803px   (0.93 — recoiling, knees bent)
    down                   501px   (0.58 — collapsed)

  So: DRAW THE POSE, IGNORE THE SCALE. The tool sets the size. What you must
  still get right is the pose itself — a `down` frame drawn standing upright
  will be shrunk into a tiny standing figure, not turned into a collapse.
"""
import os, sys, json, math
from PIL import Image

PX, FLOOR, STAND, BORDER = 1024, 960, 864, 8
ALPHA_CUT = 128
# absolute target figure height per state, as a fraction of the 864px standing box
STATE_H = {"idle": 1.00, "move": 1.00, "attack": 1.00, "hurt": 0.93, "down": 0.58}

def load_rgba(p):
    im = Image.open(p).convert("RGBA")
    if im.split()[3].getbbox() is None:
        raise ValueError("fully transparent — was the background knocked out?")
    return im

def opaque_bbox(im):
    a = im.split()[3].point(lambda v: 255 if v >= ALPHA_CUT else 0)
    return a.getbbox()

def fit_one(im, scale):
    """scale = output px per source px. Places feet at (512, FLOOR)."""
    bb = opaque_bbox(im)
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    crop = im.crop(bb).resize((nw, nh), Image.LANCZOS)

    out = Image.new("RGBA", (PX, PX), (0, 0, 0, 0))
    # horizontal: centre the FEET (bottom 12% of the figure), not the whole bbox —
    # a blade held out to one side must not drag the body off the anchor.
    fa = crop.split()[3].point(lambda v: 255 if v >= ALPHA_CUT else 0)
    band = fa.crop((0, max(0, nh - max(4, int(nh * 0.12))), nw, nh)).getbbox()
    feet_cx = ((band[0] + band[2]) / 2.0) if band else nw / 2.0
    out.paste(crop, (int(round(PX / 2 - feet_cx)), FLOOR - nh), crop)

    a = out.split()[3].point(lambda v: 255 if v >= ALPHA_CUT else 0)   # binary alpha
    out.putalpha(a)
    px = out.load()
    for y in range(FLOOR, PX):                       # nothing below the floor line
        for x in range(PX): px[x, y] = (0, 0, 0, 0)
    for y in range(PX):                              # bleed guard
        for x in list(range(BORDER)) + list(range(PX - BORDER, PX)): px[x, y] = (0, 0, 0, 0)
    for y in list(range(BORDER)) + list(range(PX - BORDER, PX)):
        for x in range(PX): px[x, y] = (0, 0, 0, 0)
    return out

def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    files = sorted(f for f in os.listdir(src) if f.lower().endswith(".png"))
    if not files: print("no PNGs in " + src); sys.exit(1)
    print("\nVEILRUN . VR-91 fit to contract canvas\n" + "=" * 58)

    n, bad = 0, 0
    for fn in files:
        try:
            char, state, fac = fn[:-4].rsplit("_", 2)
            if state not in STATE_H:
                raise ValueError("unknown state '%s' (expected %s)" % (state, "/".join(STATE_H)))
            im = load_rgba(os.path.join(src, fn))
            bb = opaque_bbox(im)
            src_h = bb[3] - bb[1]
            target = STAND * STATE_H[state]
            sc = target / float(src_h)
            fit_one(im, sc).save(os.path.join(dst, fn))
            print("  ok    %-26s %4dpx -> %3dpx  (x%.3f)" % (fn, src_h, int(target), sc))
            n += 1
        except Exception as ex:
            print("  FAIL  %s - %s" % (fn, ex)); bad += 1
    print("\n%d fitted, %d failed -> %s" % (n, bad, dst))
    print("next: python3 _tools/_sprites.py " + dst + " --pack")

if __name__ == "__main__": main()
