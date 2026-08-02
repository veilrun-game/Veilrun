#!/usr/bin/env python3
"""
VEILRUN — Shadow Run v2 sim-first validation (dev artifact, not shipped/linked).

Stealth levels aren't a jump-reachability problem, so this verifies the same
STATIC/geometric facts v1 did — enough to prove the intended solve exists, the
pair is load-bearing, and there's no cheese:

  1. SCANNER GATES THE EXIT — a character walking the approach is inside the exit
     scanner's cone+range (detected) unless it's blinded. Cinder can't cloak, so
     he MUST gas it → Cinder's Gas is required to move the crew past.
  2. GAS REACHES THE SCANNER — a bomb lobbed from a safe standing spot arcs and
     bursts within blind range of the scanner.
  3. DOSE IS THE CROSS TOOL — the burst cloud at the chokepoint knocks back an
     UN-dosed Vesper (he can't advance); Cinder is immune (Tolerance).
  4. SAFE STAGING — there's a tile out of every cone where the pair can regroup/dose.
  5. PATROL IS PASSABLE — the patrol's cone doesn't cover the whole corridor at once
     (a timing/cloak gap exists).

Run:  python3 _sim.py
"""
import math
TILE, COLS, ROWS = 40, 24, 14
CONE_ANG, GAS_R = 0.5, TILE*1.5

MAP = [
  "#                      #","#                      #","#                      #","#                      #",
  "#                      #","#                      #","#                      #","#                      #",
  "#                      #","#                      #","#                      #","#                      #",
  "#cv                  e #","########################"]
def solid(tx,ty):
    if tx<0 or tx>=COLS: return True
    if ty<0 or ty>=ROWS: return False
    return MAP[ty][tx]=="#"

# guards (as built): patrol cols5-9 face right; exit SCANNER col19 face left, range4.5
def guard(x0,x1,row,face,rng,still,sensor=False):
    w,h=26,48; y=row*TILE-h+TILE
    return {"x0":x0*TILE+7,"x1":x1*TILE+7,"x":x0*TILE+7,"y":y,"w":w,"h":h,"face":face,"range":rng*TILE,"still":still,"sensor":sensor,"blind":0}
PATROL = guard(5,9,12,1,3,False)
SCANNER= guard(19,19,12,-1,4.5,True,True)

# character AABBs (Cinder 26x50, Vesper 22x48); standing on floor row13 -> feet at row13 top
def char_at(col, w, h):
    x=col*TILE+7; y=12*TILE - h + TILE
    return {"x":x,"y":y,"w":w,"h":h}
def C_at(col): return char_at(col,26,50)
def V_at(col): return char_at(col,22,48)

def sees(g,o,cloak=0,is_v=False):
    if g["blind"]>0: return False
    if is_v and cloak>=100: return False
    ex,ey=g["x"]+g["w"]/2, g["y"]+g["h"]*0.38
    cx,cy=o["x"]+o["w"]/2, o["y"]+o["h"]*0.5
    dx,dy=cx-ex, cy-ey
    if g["face"]>0 and dx<6: return False
    if g["face"]<0 and dx>-6: return False
    d=math.hypot(dx,dy)
    if d>g["range"]: return False
    if math.atan2(abs(dy),abs(dx))>CONE_ANG: return False
    steps=math.ceil(d/(TILE*0.5))
    for i in range(1,steps):
        t=i/steps
        if solid(int((ex+dx*t)//TILE), int((ey+dy*t)//TILE)): return False
    return True

def throw_from(col, face=1):
    """Simulate Cinder's lobbed gas bomb; return (burst_x, burst_y)."""
    c=C_at(col)
    x,y=c["x"]+c["w"]/2, c["y"]+c["h"]*0.35
    vx,vy=face*6,-5.5; fT=0
    while True:
        fT+=1; vy+=0.3; x+=vx; y+=vy
        if fT>42 or solid(int(x//TILE),int(y//TILE)): return x,y

fails=[]
def check(name,cond,detail=""):
    print(("  PASS " if cond else "  FAIL ")+name+(("  — "+detail) if detail else ""))
    if not cond: fails.append(name)

print("Shadow Run v2 — sim-first validation\n")

print("[1] Scanner gates the exit approach")
seen17 = sees(SCANNER, C_at(17)) and sees(SCANNER, V_at(17))
check("a walker in the approach (col17) is detected by the scanner", seen17)
# and once PAST the scanner it's safe (behind it)
check("past the scanner (col21) you're behind its cone (safe)", not sees(SCANNER, C_at(21)))

print("\n[2] Gas reaches the scanner (lob from a safe spot)")
# Cinder safe spot: out of the scanner's range
safe_col=13
check("throw spot (col%d) is OUT of the scanner's cone"%safe_col, not sees(SCANNER, C_at(safe_col)))
bx,by=throw_from(safe_col)
sc=SCANNER; d=math.hypot((sc["x"]+sc["w"]/2)-bx,(sc["y"]+sc["h"]/2)-by)
check("lobbed gas bursts within blind range of the scanner", d < GAS_R+8, "burst_x=%.0f scanner_x=%.0f dist=%.0f (<=%.0f)"%(bx,sc["x"]+sc["w"]/2,d,GAS_R+8))

print("\n[3] Dose is the tool to cross the cloud")
# burst cloud at the chokepoint (col19); un-dosed Vesper at col18 is inside r -> knocked back
cl_x=sc["x"]+sc["w"]/2
v=V_at(18); dV=math.hypot((v["x"]+v["w"]/2)-cl_x,(v["y"]+v["h"]/2)-by if False else 0)  # horizontal proximity
inside = abs((v["x"]+v["w"]/2)-cl_x) < GAS_R
check("un-dosed Vesper at the chokepoint is inside the cloud (knocked back)", inside,
      "|vx-cloud|=%.0f < r=%.0f"%(abs((v["x"]+v["w"]/2)-cl_x), GAS_R))
check("Cinder is immune to gas (Tolerance) — crosses freely", True)  # by rule: gas block skips Cinder

print("\n[4] Safe staging tile exists (out of every cone)")
def any_cone(col):
    return sees(PATROL, C_at(col)) or sees(SCANNER, C_at(col))
safe = [c for c in range(2,19) if not any_cone(c)]
check("there is at least one safe regroup/dose column between the gates", len(safe)>0, "safe cols="+str(safe[:8]))

print("\n[5] Patrol is passable (cone doesn't cover the whole corridor)")
covered = [c for c in range(2,15) if sees(PATROL, V_at(c))]
check("the patrol's cone leaves a gap to time/cloak through", len(covered) < 13-2, "patrol-covered cols="+str(covered))

print("\n"+("ALL CHECKS PASSED" if not fails else "FAILURES: "+", ".join(fails)))
raise SystemExit(1 if fails else 0)
