#!/usr/bin/env python3
"""VEILRUN VR-91 — programmatic placeholder sprites, generated TO THE CONTRACT.

Emits loose 1024x1024 RGBA PNGs named <char>_<state>_f<0-7>.png, exactly the
shape Jordan will deliver, so the billboard plumbing is provable before a single
Midjourney generation exists.

Contract (see 'Art & Assets/VEILRUN — Proving Ground Sprite Asset Contract (VR-91).md'):
  canvas 1024x1024 | floor line y=960 | anchor (512,960) | standing height 864
  binary alpha | no baked shadow/glow | 8px empty border
"""
import os, sys, math
from PIL import Image, ImageDraw

PX, FLOOR, TOP, BORDER = 1024, 960, 96, 8
STAND = FLOOR - TOP  # 864

CHARS = {
    #                body      accent    build  weapon
    "vesper":  dict(col=(58,44,92),   acc=(150,90,230),  build=0.86, weapon="blade"),
    "anvil":   dict(col=(62,60,68),   acc=(196,72,60),   build=1.34, weapon="fist"),
    "citrine": dict(col=(60,56,40),   acc=(232,206,64),  build=0.94, weapon="coil"),
    "husk":    dict(col=(46,40,58),   acc=(214,92,220),  build=0.92, weapon=None),
}
STATES = ["idle", "move", "attack", "hurt", "down"]
HUSK_STATES = ["move", "attack", "hurt", "down"]

# per-state: height scale, forward lean (px at head), arm angle deg, stance width mult
POSE = {
    "idle":   dict(h=1.00, lean=0,   arm=-72, stance=1.00),
    "move":   dict(h=1.00, lean=34,  arm=-30, stance=1.28),
    "attack": dict(h=1.00, lean=52,  arm=  8, stance=1.42),
    "hurt":   dict(h=0.93, lean=-46, arm=-98, stance=1.10),
    "down":   dict(h=0.58, lean=-14, arm=-118, stance=1.46),
}

FACINGS = 4

def facing_geom(f):
    """f0 faces camera; one step per 360/FACINGS degrees, turning to their left."""
    a = math.radians(f * (360.0 / FACINGS))
    # how much of the body's width we see (1 = front/back, ~0.34 = profile)
    width = 0.34 + 0.66 * abs(math.cos(a))
    facing_cam = math.cos(a)          # +1 front, -1 back
    side = math.sin(a)                # +1 turned one way, -1 the other
    return width, facing_cam, side

def draw_one(name, state, f):
    c = CHARS[name]
    P = POSE[state]
    img = Image.new("RGBA", (PX, PX), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    width, facing_cam, side = facing_geom(f)

    h = STAND * P["h"]
    top = FLOOR - h
    cx = PX // 2
    build = c["build"]
    bw = 118 * build * width          # half body width
    lean = P["lean"]

    head_r = 62 * build
    head_cy = top + head_r + 10
    hip_y = FLOOR - h * 0.46
    sh_y = top + head_r * 2 + 34

    def lean_at(y):
        t = (FLOOR - y) / max(h, 1)
        return lean * t * t

    col, acc = c["col"] + (255,), c["acc"] + (255,)

    # legs
    lw = 30 * build
    spread = 46 * build * P["stance"] * max(width, 0.42)
    for sgn in (-1, 1):
        fx = cx + sgn * spread + lean_at(FLOOR) * 0.25
        d.polygon([(cx + sgn * spread * 0.55 + lean_at(hip_y), hip_y),
                   (cx + sgn * spread * 0.55 + lw + lean_at(hip_y), hip_y),
                   (fx + lw, FLOOR), (fx, FLOOR)], fill=col)

    # torso
    d.polygon([(cx - bw * 0.80 + lean_at(sh_y), sh_y),
               (cx + bw * 0.80 + lean_at(sh_y), sh_y),
               (cx + bw * 0.58 + lean_at(hip_y), hip_y),
               (cx - bw * 0.58 + lean_at(hip_y), hip_y)], fill=col)

    # arms — the near arm swaps side as the character turns
    aa = math.radians(P["arm"])
    alen = 210 * build
    near = 1 if side >= 0 else -1
    for sgn in (near, -near):
        ax = cx + sgn * bw * 0.86 + lean_at(sh_y)
        ex = ax + math.cos(aa) * alen * sgn * (1.0 if sgn == near else 0.72)
        ey = sh_y - math.sin(aa) * alen
        d.line([(ax, sh_y), (ex, ey)], fill=col, width=int(26 * build))
        if sgn == near and c["weapon"] and state != "down":
            wl = {"blade": 300, "fist": 90, "coil": 150}[c["weapon"]]
            d.line([(ex, ey), (ex + math.cos(aa) * wl * sgn, ey - math.sin(aa) * wl)],
                   fill=acc, width=int({"blade": 14, "fist": 40, "coil": 20}[c["weapon"]] * build))

    # head
    d.ellipse([cx - head_r * width * 1.25 + lean_at(head_cy), head_cy - head_r,
               cx + head_r * width * 1.25 + lean_at(head_cy), head_cy + head_r], fill=col)

    # face: eyes only when we can actually see the front. THIS is the facing tell.
    if facing_cam > 0.05:
        ex_off = head_r * 0.42 * width
        eye_r = max(7, 13 * build * (0.5 + 0.5 * facing_cam))
        base = cx + lean_at(head_cy) + side * head_r * 0.46
        for sgn in (-1, 1):
            if width < 0.55 and sgn * side < 0:
                continue  # far eye occluded in profile
            d.ellipse([base + sgn * ex_off - eye_r, head_cy - eye_r * 0.4,
                       base + sgn * ex_off + eye_r, head_cy + eye_r * 1.2], fill=acc)

    # accent chest band — reads as "front" and disappears round the back
    if facing_cam > -0.2:
        by = sh_y + (hip_y - sh_y) * 0.34
        d.rectangle([cx - bw * 0.5 + lean_at(by), by - 12 * build,
                     cx + bw * 0.5 + lean_at(by), by + 12 * build], fill=acc)

    # floor-anchor tick: 2px, sits exactly ON the contract line (debug aid, removed for art)
    d.rectangle([cx - 40, FLOOR - 2, cx + 40, FLOOR - 1], fill=acc)

    # nothing below the floor line — a blade tip or cloak hem under y=960 would
    # sink into the ground once the quad is anchored.
    ImageDraw.Draw(img).rectangle([0, FLOOR, PX, PX], fill=(0, 0, 0, 0))

    # force BINARY alpha — the contract's strictest clause
    a = img.split()[3].point(lambda v: 255 if v >= 128 else 0)
    img.putalpha(a)

    # clear the bleed guard
    d2 = ImageDraw.Draw(img)
    for box in [(0, 0, PX, BORDER), (0, PX - BORDER, PX, PX),
                (0, 0, BORDER, PX), (PX - BORDER, 0, PX, PX)]:
        d2.rectangle(box, fill=(0, 0, 0, 0))
    return img

def main(out):
    os.makedirs(out, exist_ok=True)
    n = 0
    for name in CHARS:
        states = HUSK_STATES if name == "husk" else STATES
        for st in states:
            for f in range(FACINGS):
                draw_one(name, st, f).save(os.path.join(out, f"{name}_{st}_f{f}.png"))
                n += 1
    print(f"{n} placeholder PNGs -> {out}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "_placeholder_src")
