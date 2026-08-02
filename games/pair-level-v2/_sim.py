#!/usr/bin/env python3
"""
VEILRUN — Seam Gate v2 (pair-level) sim-first validation (dev artifact).

Faithful port of the v2 engine physics over the Anvil+Latch two-world slice. Proves:

  1. SOLVABLE — Latch flips the crew into the Underweft, Anvil charges through the
     breakable wall, Latch flips back onto the Overcity exit ledge.
  2. REQUIRED — remove Latch's flip -> the Overcity chasm can't be crossed;
     remove Anvil's charge -> the Underweft wall can't be passed.
  3. NO CHEESE — from the start ledge the chasm isn't jumpable; the 3-tall
     breakable wall isn't jumpable (must be plowed).
  4. HAZARD — the Underweft turret fires at Latch's body height on the crossing.

Run:  python3 _sim.py
"""
TILE, COLS, ROWS = 40, 24, 14
GRAV, MAXFALL = 0.55, 14
L_W, L_H, L_SPD, L_JUMP = 22, 44, 2.9, 9.8    # Latch (agile-est; if he can't jump it, nobody can)

WORLDS = {
 0: [ "#                      #","#                      #","#                      #","#                      #",
      "#                      #","#                      #","#                      #","#                      #",
      "#                      #","#                      #","#                      #",
      "# a l                e #",
      "#######          #######",
      "#                      #" ],
 1: [ "#                      #","#                      #","#                      #","#                      #",
      "#                      #","#                      #","#                      #","#                      #",
      "#                      #","#               K      #",
      "#               K      #",
      "#            T  K      #",
      "########################",
      "#                      #" ],
}
def solid(world, tx, ty, plowed):
    if tx<0 or tx>=COLS: return True
    if ty<0 or ty>=ROWS: return False
    c=WORLDS[world][ty][tx]
    if c=="#": return True
    if c=="K": return not plowed        # breakable wall — solid until Anvil charges it
    return False

def resolve(o,axis,world,plowed):
    x0,x1=int(o["x"]//TILE),int((o["x"]+o["w"]-1)//TILE)
    y0,y1=int(o["y"]//TILE),int((o["y"]+o["h"]-1)//TILE)
    for ty in range(y0,y1+1):
        for tx in range(x0,x1+1):
            if not solid(world,tx,ty,plowed): continue
            px,py=tx*TILE,ty*TILE
            if not (o["x"]<px+TILE and o["x"]+o["w"]>px and o["y"]<py+TILE and o["y"]+o["h"]>py): continue
            if axis=="x":
                if o["vx"]>0: o["x"]=px-o["w"]
                elif o["vx"]<0: o["x"]=px+TILE
                o["vx"]=0
            else:
                if o["vy"]>0: o["y"]=py-o["h"]; o["vy"]=0
                elif o["vy"]<0: o["y"]=py+TILE; o["vy"]=0
def step(o,world,plowed):
    o["x"]+=o["vx"]; resolve(o,"x",world,plowed)
    o["vy"]+=GRAV
    if o["vy"]>MAXFALL: o["vy"]=MAXFALL
    o["y"]+=o["vy"]; resolve(o,"y",world,plowed)
def on_ground(o,world,plowed):
    y=int((o["y"]+o["h"]+1)//TILE); x0=int((o["x"]+3)//TILE); x1=int((o["x"]+o["w"]-3)//TILE)
    return any(solid(tx,y,world,plowed) if False else solid(world,tx,y,plowed) for tx in range(x0,x1+1))

FOOT = {
 "F0_start": (0, 12*TILE, 1, 6),
 "F0_exit":  (0, 12*TILE, 17, 22),
 "F1_left":  (1, 12*TILE, 1, 15),
 "F1_right": (1, 12*TILE, 17, 22),
}
def classify(world,o,plowed):
    if not on_ground(o,world,plowed): return None
    feet=o["y"]+o["h"]; cx=o["x"]+o["w"]/2
    for fid,(fw,ty,cmin,cmax) in FOOT.items():
        if fw==world and abs(feet-ty)<2 and (cmin*TILE)<=cx<=((cmax+1)*TILE): return fid
    return None
def jump_edges(from_fid, plowed=False):
    fw,ty,cmin,cmax=FOOT[from_fid]; reached=set(); x=cmin*TILE+11
    while x<=cmax*TILE+11:
        for d in (-1,0,1):
            for jmp in (True,False):
                o={"x":x-L_W/2,"y":ty-L_H,"w":L_W,"h":L_H,"vx":0.0,"vy":(-L_JUMP if jmp else 0.0)}
                for _ in range(170):
                    o["vx"]=d*L_SPD; step(o,fw,plowed)
                    if o["y"]>ROWS*TILE+80: break
                    if o["vy"]>=0 and on_ground(o,fw,plowed):
                        fid=classify(fw,o,plowed)
                        if fid and fid!=from_fid: reached.add(fid)
                        break
        x+=6
    return reached
def build(flip=True, charge=True):
    e={f:set() for f in FOOT}
    for f in FOOT: e[f]|=jump_edges(f, plowed=charge)
    if flip:   e["F0_start"].add("F1_left"); e["F1_right"].add("F0_exit")
    if charge: e["F1_left"].add("F1_right")   # Anvil plows the wall
    return e
def reach(e,start="F0_start"):
    seen,st={start},[start]
    while st:
        n=st.pop()
        for m in e[n]:
            if m not in seen: seen.add(m); st.append(m)
    return seen

fails=[]
def check(name,cond,detail=""):
    print(("  PASS " if cond else "  FAIL ")+name+(("  — "+detail) if detail else ""));
    if not cond: fails.append(name)

print("Seam Gate v2 (Anvil + Latch) — sim-first validation\n")
print("[1] Solvable")
check("exit reachable with Flip + Charge", "F0_exit" in reach(build()))
print("\n[2] Each is REQUIRED")
check("remove Latch's Flip  -> exit UNreachable", "F0_exit" not in reach(build(flip=False)))
check("remove Anvil's Charge -> exit UNreachable", "F0_exit" not in reach(build(charge=False)))
print("\n[3] No cheese")
js=jump_edges("F0_start", plowed=False)
check("Overcity start: chasm NOT jump-reachable", js==set(), "jumped-to="+(",".join(sorted(js)) or "none"))
jl=jump_edges("F1_left", plowed=False)
check("Underweft: 3-tall wall NOT jumpable (F1_right unreachable unplowed)", "F1_right" not in jl, "jumped-to="+(",".join(sorted(jl)) or "none"))
print("\n[4] Hazard geometry")
shot_y=11*TILE+TILE/2; body_top,body_bot=12*TILE-L_H,12*TILE
check("turret shot hits Latch at body height on the crossing", body_top<=shot_y<=body_bot, "shot_y=%.0f body=[%.0f,%.0f]"%(shot_y,body_top,body_bot))

print("\n"+("ALL CHECKS PASSED" if not fails else "FAILURES: "+", ".join(fails)))
raise SystemExit(1 if fails else 0)
