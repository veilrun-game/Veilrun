#!/usr/bin/env python3
"""VEILRUN VR-91 — sprite acceptance check + sheet packer.

  python3 _tools/_sprites.py <src_dir>            # validate only
  python3 _tools/_sprites.py <src_dir> --pack     # validate, then write sheets

Validates every delivered PNG against the asset contract and refuses to pack a
failing set. Named failures point at the pixel that failed so a re-render is
targeted instead of a whole re-run.
"""
import os, sys, math, collections
from PIL import Image

PX, FLOOR, BORDER = 1024, 960, 8
FLOOR_TOL, CENTRE_TOL, HEIGHT_TOL = 4, 24, 0.02
FEET_BAND = 60   # rows above the floor line that count as "the feet"
CENTRE_TOL_DOWN = 72   # a collapsed body sprawls; its contact patch is wider and off-centre
BINARY_MIN = 0.98
RIGID = ("idle", "move", "attack")          # heights must agree across these
TIERS = {"@2": 512, "@1": 256}
GRID = (4, 1)                                # 4 facings in one row
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(REPO, "assets", "sprites", "proving-ground")

def bbox_opaque(img):
    a = img.split()[3]
    return a.getbbox(), a

def check(path, state=None):
    """-> (errs, meta) for one file."""
    e, name = [], os.path.basename(path)
    img = Image.open(path).convert("RGBA")
    if img.size != (PX, PX):
        e.append(f"size {img.size[0]}x{img.size[1]}, contract says {PX}x{PX}")
        return e, None
    bb, alpha = bbox_opaque(img)
    if bb is None:
        e.append("fully transparent — nothing drawn")
        return e, None
    x0, y0, x1, y1 = bb

    hist = alpha.histogram()
    binary = (hist[0] + hist[255]) / float(PX * PX)
    if binary < BINARY_MIN:
        e.append(f"alpha only {binary*100:.1f}% binary (need >={BINARY_MIN*100:.0f}%) "
                 f"— soft edge, glow or shadow baked in")

    if abs((y1 - 1) - FLOOR) > FLOOR_TOL:
        e.append(f"floor line at y={y1-1}, contract says y={FLOOR} (+/-{FLOOR_TOL})")

    # Centre the FEET, not the bbox: a blade or a coil may legitimately reach into
    # the side margins, and judging the bbox would fail a perfectly good sprite.
    feet = alpha.crop((0, max(0, y1 - FEET_BAND), PX, y1)).getbbox()
    if feet is None:
        e.append("no opaque pixels in the bottom {}px — figure isn't standing on the floor line".format(FEET_BAND))
    else:
        fcx = (feet[0] + feet[2]) / 2.0
        tol = CENTRE_TOL_DOWN if state == "down" else CENTRE_TOL
        if abs(fcx - PX / 2) > tol:
            e.append(f"feet centred at x={fcx:.0f}, contract says {PX//2} (+/-{tol})")

    below = alpha.crop((0, FLOOR + 1, PX, PX)).getbbox()
    if below is not None:
        e.append(f"pixels below the floor line (down to y={FLOOR + 1 + below[3]}) "
                 f"— they'd sink into the ground")

    for bx, label in [((0, 0, PX, BORDER), "top"), ((0, PX - BORDER, PX, PX), "bottom"),
                      ((0, 0, BORDER, PX), "left"), ((PX - BORDER, 0, PX, PX), "right")]:
        if alpha.crop(bx).getbbox() is not None:
            e.append(f"pixels in the {label} {BORDER}px bleed guard")

    if (x1 - x0) > PX * 0.985 and (y1 - y0) > PX * 0.985:
        e.append("opaque edge-to-edge — background not knocked out")

    return e, dict(h=y1 - y0, img=img)

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    src, do_pack = sys.argv[1], "--pack" in sys.argv
    stub = "--stub" in sys.argv   # one image stands in for all 4 facings
    files = sorted(f for f in os.listdir(src) if f.lower().endswith(".png"))
    if not files:
        print(f"no PNGs in {src}"); sys.exit(1)

    print("\nVEILRUN · VR-91 sprite acceptance\n" + "=" * 58)
    sets, fails, meta = collections.defaultdict(dict), 0, {}
    for fn in files:
        stem = fn[:-4]
        try:
            char, state, fac = stem.rsplit("_", 2)
            fi = int(fac[1:]); assert fac[0] == "f" and 0 <= fi <= 3
        except Exception:
            print(f"  FAIL  {fn} — name must be <char>_<state>_f<0-3>.png"); fails += 1; continue
        errs, m = check(os.path.join(src, fn), state)
        for x in errs:
            print(f"  FAIL  {fn} — {x}")
        fails += len(errs)
        if m and not errs:
            sets[(char, state)][fi] = m["img"]
            meta[(char, state, fi)] = m["h"]

    # --stub: replicate whatever facings exist across all 4, so a SINGLE image
    # can be dropped into the running game to judge the look before committing
    # to a full set. Never use this for a real delivery.
    if stub:
        for key, got in sets.items():
            if got:
                have = sorted(got)
                for fi in range(4):
                    if fi not in got: got[fi] = got[have[fi % len(have)]]
        print("  NOTE  --stub: missing facings filled from the ones supplied (look-test only)\n")

    # completeness: 4 facings per state
    for (char, state), got in sorted(sets.items()):
        if len(got) != 4:
            print(f"  FAIL  {char}/{state} — {len(got)}/4 facings "
                  f"(missing {sorted(set(range(4)) - set(got))})"); fails += 1

    # height agreement across the rigid states
    for char in sorted({c for c, _ in sets}):
        hs = [h for (c, s, _), h in meta.items() if c == char and s in RIGID]
        if hs:
            lo, hi = min(hs), max(hs)
            if lo and (hi - lo) / float(lo) > HEIGHT_TOL:
                print(f"  FAIL  {char} — standing height varies {lo}..{hi}px "
                      f"({(hi-lo)/lo*100:.1f}%, max {HEIGHT_TOL*100:.0f}%)"); fails += 1
            else:
                print(f"  ok    {char} — standing height stable ({lo}-{hi}px across {', '.join(RIGID)})")

    print(f"\n{len(files)} files · {len(sets)} sheets · {fails} failure(s)")
    if fails:
        print("NOT packing a failing set."); sys.exit(1)
    if not do_pack:
        print("validation only — pass --pack to write sheets."); return

    print("\n[packing]")
    total = 0
    for (char, state), got in sorted(sets.items()):
        d = os.path.join(OUT, char); os.makedirs(d, exist_ok=True)
        for tier, cell in TIERS.items():
            sheet = Image.new("RGBA", (cell * GRID[0], cell * GRID[1]), (0, 0, 0, 0))
            for fi in range(4):
                c = got[fi].resize((cell, cell), Image.LANCZOS)
                a = c.split()[3].point(lambda v: 255 if v >= 128 else 0)   # keep alpha binary
                c.putalpha(a)
                sheet.paste(c, ((fi % GRID[0]) * cell, (fi // GRID[0]) * cell))
            p = os.path.join(d, f"{state}{tier}.webp")
            sheet.save(p, "WEBP", quality=82, method=6, exact=True)
            total += os.path.getsize(p)
            print(f"  {os.path.relpath(p, REPO)}  {sheet.size[0]}x{sheet.size[1]}  "
                  f"{os.path.getsize(p)/1024:.0f} KB")
    print(f"\ntotal {total/1024/1024:.2f} MB across all characters and tiers")

if __name__ == "__main__":
    main()
