#!/usr/bin/env python3
"""
VEILRUN — Runeway v2 sim-first validation (dev artifact, not shipped/linked).

Faithful port of the v2 engine physics (TILE=40, gravity 0.55, fall cap 14,
jump 9.8, speed 2.7, char 24x46) over the LIGHT cross-world slice. Proves,
before the level is wired anywhere:

  1. SOLVABLE   — cross into the Underweft, ride the tram, cross back -> both
                  reach the Overcity exit.
  2. REQUIRED   — remove Babel's crossing-over  -> unsolvable
                  remove the tram (Babel powers) -> unsolvable
                  remove Babel's crossing-back    -> unsolvable
  3. NO CHEESE  — from the Overcity start, no jump/walk reaches ANY other
                  foothold (the chasm can't be cleared); in the Underweft the
                  gap can't be jumped (the tram is mandatory).
  4. HAZARD     — the turret's shot travels at character body height.

Run:  python3 _sim.py
"""

TILE, COLS, ROWS = 40, 24, 14
GRAV, MAXFALL, JUMP, SPEED = 0.55, 14, 9.8, 2.7
CW, CH = 24, 46

WORLDS = {
 0: [ "#                      #",   # THE OVERCITY
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "# m b R            e   #",
      "#######          #######",
      "#                      #" ],
 1: [ "#                      #",   # THE UNDERWEFT
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#                      #",
      "#              T R     #",
      "#########       ########",
      "#                      #" ],
}
for w in WORLDS.values():
    assert len(w) == ROWS and all(len(r) == COLS for r in w)

def solid(world, tx, ty):
    if tx < 0 or tx >= COLS: return True
    if ty < 0 or ty >= ROWS: return False
    return WORLDS[world][ty][tx] == "#"

# ---- physics (ported 1:1 from engine.js) ----
def resolve_axis(o, axis, world):
    x0, x1 = int(o["x"]//TILE), int((o["x"]+CW-1)//TILE)
    y0, y1 = int(o["y"]//TILE), int((o["y"]+CH-1)//TILE)
    for ty in range(y0, y1+1):
        for tx in range(x0, x1+1):
            if not solid(world, tx, ty): continue
            px, py = tx*TILE, ty*TILE
            if not (o["x"] < px+TILE and o["x"]+CW > px and o["y"] < py+TILE and o["y"]+CH > py): continue
            if axis == "x":
                if o["vx"] > 0: o["x"] = px-CW
                elif o["vx"] < 0: o["x"] = px+TILE
                o["vx"] = 0
            else:
                if o["vy"] > 0: o["y"] = py-CH; o["vy"] = 0
                elif o["vy"] < 0: o["y"] = py+TILE; o["vy"] = 0

def on_ground(o, world):
    y = int((o["y"]+CH+1)//TILE)
    x0, x1 = int((o["x"]+3)//TILE), int((o["x"]+CW-3)//TILE)
    return any(solid(world, tx, y) for tx in range(x0, x1+1))

def step(o, world):
    o["x"] += o["vx"]; resolve_axis(o, "x", world)
    o["vy"] += GRAV
    if o["vy"] > MAXFALL: o["vy"] = MAXFALL
    o["y"] += o["vy"]; resolve_axis(o, "y", world)

# ---- footholds (world, top_y, col_min, col_max) ----
FOOT = {
    "F0_start": (0, 12*TILE, 1, 6),    # Overcity start ledge
    "F0_exit":  (0, 12*TILE, 17, 22),  # Overcity exit ledge (exit @col19)
    "F1_left":  (1, 12*TILE, 1, 8),    # Underweft left floor
    "F1_right": (1, 12*TILE, 16, 22),  # Underweft right floor
}
def classify(world, o):
    if not on_ground(o, world): return None
    feet, cx = o["y"]+CH, o["x"]+CW/2
    for fid,(fw,ty,cmin,cmax) in FOOT.items():
        if fw == world and abs(feet-ty) < 2 and (cmin*TILE) <= cx <= (cmax*TILE+TILE):
            return fid
    return None

def jump_edges(from_fid):
    fw, ty, cmin, cmax = FOOT[from_fid]
    reached = set()
    x = cmin*TILE+20
    while x <= cmax*TILE+20:
        for d in (-1, 0, 1):
            for do_jump in (True, False):
                o = {"x": x-CW/2, "y": ty-CH, "vx": 0.0, "vy": 0.0}
                if do_jump: o["vy"] = -JUMP
                for _ in range(170):
                    o["vx"] = d*SPEED
                    step(o, fw)
                    if o["y"] > ROWS*TILE+80: break
                    if o["vy"] >= 0 and on_ground(o, fw):
                        fid = classify(fw, o)
                        if fid and fid != from_fid: reached.add(fid)
                        break
        x += 6
    return reached

def build_graph(cross_over=True, tram=True, cross_back=True):
    edges = {fid: set() for fid in FOOT}
    for fid in FOOT: edges[fid] |= jump_edges(fid)
    if cross_over: edges["F0_start"].add("F1_left")   # Babel reads seam rune @col6 -> Underweft left floor
    if tram:       edges["F1_left"].add("F1_right")    # Babel powers tram; ride across the gap
    if cross_back: edges["F1_right"].add("F0_exit")    # Babel reads return rune @col17 -> Overcity exit ledge
    return edges

def reachable(edges, start="F0_start"):
    seen, stack = {start}, [start]
    while stack:
        n = stack.pop()
        for m in edges[n]:
            if m not in seen: seen.add(m); stack.append(m)
    return seen

fails = []
def check(name, cond, detail=""):
    print(("  PASS " if cond else "  FAIL ") + name + (("  — "+detail) if detail else ""))
    if not cond: fails.append(name)

print("Runeway v2 (light) — sim-first validation\n")

print("[1] Solvable")
check("exit reachable with cross-over + tram + cross-back", "F0_exit" in reachable(build_graph()))

print("\n[2] Every step is REQUIRED")
check("remove cross-over -> UNreachable", "F0_exit" not in reachable(build_graph(cross_over=False)))
check("remove tram       -> UNreachable", "F0_exit" not in reachable(build_graph(tram=False)))
check("remove cross-back -> UNreachable", "F0_exit" not in reachable(build_graph(cross_back=False)))

print("\n[3] No cheese (pure movement)")
js = jump_edges("F0_start")
check("Overcity start: chasm/exit NOT jump-reachable", js == set(), "jumped-to="+(",".join(sorted(js)) or "none"))
jl = jump_edges("F1_left")
check("Underweft: gap NOT jump-reachable (tram mandatory)", "F1_right" not in jl, "jumped-to="+(",".join(sorted(jl)) or "none"))
bare = reachable(build_graph(cross_over=False, tram=False, cross_back=False))
check("no crossings/tram -> only the start ledge reachable", bare == {"F0_start"}, "reached="+",".join(sorted(bare)))

print("\n[4] Hazard geometry")
shot_y = 11*TILE + TILE/2
body_top, body_bot = 12*TILE-CH, 12*TILE
check("turret shot hits at body height on the ride", body_top <= shot_y <= body_bot,
      "shot_y=%.0f body=[%.0f,%.0f]" % (shot_y, body_top, body_bot))

print("\n[5] Safe landing on every crossing (crew lands on ground, never the chasm)")
# crossing rune -> (col, target_world). The crew is placed AT this column on cross,
# so the target world MUST have solid ground under that column (and the +22px Magpie offset).
CROSSINGS = [("over rune @Overcity col6 -> Underweft", 6, 1),
             ("return rune @Underweft col17 -> Overcity", 17, 0)]
for name, col, tw in CROSSINGS:
    def lands(c):
        o = {"x": c*TILE+8, "y": 11*TILE-CH+TILE, "vx": 0.0, "vy": 0.0}
        for _ in range(40):
            step(o, tw)
            if o["y"] > ROWS*TILE+80: return False   # fell into a chasm
        return on_ground(o, tw)
    check(name, lands(col) and lands(col) and lands(col+0.55), "Babel col %d + Magpie col ~%.1f land on ground" % (col, col+0.55))

print("\n" + ("ALL CHECKS PASSED" if not fails else "FAILURES: " + ", ".join(fails)))
raise SystemExit(1 if fails else 0)
