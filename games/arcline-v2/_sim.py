#!/usr/bin/env python3
"""
VEILRUN — Arcline v2 sim-first validation (dev artifact, not shipped/linked).

Faithful port of the v2 throw/spark geometry over the Temper+Citrine slice
(v1 L1). Proves:

  1. REQUIRED — Citrine standing at the closest spot left of the gate CANNOT spark
     the trigger directly (it's out of SPARK_RANGE). She needs a relay.
  2. SOLVABLE — a Temper blade thrown at the gate PLANTS in the bridging zone:
     within SPARK_RANGE of Citrine AND within CONDUCT_RANGE of the trigger, so the
     spark hops Citrine -> blade -> trigger and opens the gate.
  3. NO CHEESE — the trigger sits behind the (closed) gate wall: no character can
     walk to it to 'Force' it while the gate is shut, so the spark relay is the
     only way in.

Run:  python3 _sim.py
"""
import math
TILE, COLS, ROWS = 40, 24, 14
SPARK_RANGE, CONDUCT_RANGE, THROW_VX = 120, 160, 8
T_W, T_H, C_W, C_H = 24, 46, 24, 46
MAP = [
  "#                      #","#                      #","#                      #","#                      #",
  "#                      #","#                      #","#                      #","#                      #",
  "#                      #",
  "#            GG        #",
  "#            GG        #",
  "#            GG X      #",
  "#tc          GG     e  #",
  "########################"]
def cell(tx,ty):
    if tx<0 or tx>=COLS or ty<0 or ty>=ROWS: return "#"
    return MAP[ty][tx]
def solid(tx,ty,gate_open):
    c=cell(tx,ty)
    if c=="#": return True
    if c=="G": return not gate_open
    return False

# trigger at col16,row11 (gate occupies cols13-14)
TRIG=(16*TILE+TILE/2, 11*TILE+TILE/2)

def spark_pt(col):
    # Citrine standing on the floor (row13 solid), feet at row12 top
    x=col*TILE+8; y=12*TILE-C_H+TILE
    return (x+C_W/2, y+C_H*0.45)

def throw_and_plant(col):
    """Temper throws right from `col` on the ground; return the planted blade (x,y)."""
    x=col*TILE+8; ty0=12*TILE-T_H+TILE
    fx=x+T_W-4; fy=ty0+14; vx=THROW_VX; vy=-5; life=80
    while True:
        vy+=0.55; fx+=vx; fy+=vy; life-=1
        tx=int(fx//TILE); tyy=int(fy//TILE)
        if life<=0 or tx<=0 or tx>=COLS-1 or solid(tx,tyy,False):
            if solid(tx,tyy,False): fx-=vx; fy-=vy
            return (fx,fy)

fails=[]
def check(name,cond,detail=""):
    print(("  PASS " if cond else "  FAIL ")+name+(("  — "+detail) if detail else ""))
    if not cond: fails.append(name)

print("Arcline v2 — sim-first validation\n")

print("[1] REQUIRED — Citrine can't spark the trigger alone")
cpt=spark_pt(11)                                   # as close to the gate as she can stand
d=math.hypot(cpt[0]-TRIG[0], cpt[1]-TRIG[1])
check("Citrine (col11) is OUT of spark range of the trigger", d>SPARK_RANGE, "dist=%.0f > SPARK_RANGE=%d"%(d,SPARK_RANGE))

print("\n[2] SOLVABLE — a thrown blade bridges the arc")
blade=throw_and_plant(10)
dCB=math.hypot(cpt[0]-blade[0], cpt[1]-blade[1])
dBT=math.hypot(blade[0]-TRIG[0], blade[1]-TRIG[1])
check("thrown blade plants within SPARK_RANGE of Citrine", dCB<SPARK_RANGE, "blade=(%.0f,%.0f) dCitrine=%.0f"%(blade[0],blade[1],dCB))
check("...and within CONDUCT_RANGE of the trigger", dBT<CONDUCT_RANGE, "dTrigger=%.0f < %d"%(dBT,CONDUCT_RANGE))
check("=> spark relays Citrine -> blade -> trigger (gate opens)", dCB<SPARK_RANGE and dBT<CONDUCT_RANGE)

print("\n[3] NO CHEESE — the trigger is walled off while the gate is shut")
# a character can only stand where the floor (row13) is solid and the tile is open; to reach col15 (right
# of the gate) from spawn (col1) you must pass cols12-13 which are gate (solid) at body rows while closed.
gate_cols_block = all(solid(13,r,False) and solid(14,r,False) for r in (10,11,12))
check("gate cols13-14 are solid at body height while closed (blocks walking through)", gate_cols_block)
# and the trigger (col16) sits right of the closed gate — can't be reached on foot to 'Force' it
check("trigger is right of the closed gate — unreachable on foot until sparked", 16>14 and gate_cols_block)

print("\n"+("ALL CHECKS PASSED" if not fails else "FAILURES: "+", ".join(fails)))
raise SystemExit(1 if fails else 0)
