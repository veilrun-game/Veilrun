#!/usr/bin/env python3
"""
VEILRUN — Uplift v2 sim-first validation (dev artifact, not shipped/linked).

Faithful port of the v2 engine physics (TILE=40, gravity 0.55, fall cap 14) over
the Rook+Wren slice (v1 L1 geometry). Proves:

  1. SOLVABLE   — Rook launches Wren; steered, she lands on the node ledge and
                  (standing there) overlaps the current-node; charging it makes
                  the bridge solid; Rook then walks across to the exit.
  2. REQUIRED   — Wren CAN'T reach the ledge by jumping alone (needs the launch);
                  Rook CAN'T cross the bridge gap until the node is charged
                  (he can't jump at all).
  3. NO CHEESE  — uncharged, Rook walking right falls into the pit before the exit.

Run:  python3 _sim.py
"""
TILE, COLS, ROWS = 40, 24, 14
GRAV, MAXFALL = 0.55, 14
R_W, R_H, R_SPD = 30, 40, 1.9         # Rook (jump=0)
W_W, W_H, W_SPD, W_JUMP = 22, 42, 3.2, 10.5
LAUNCH_VY = 17

MAP = [
  "#                      #","#                      #","#                      #","#                      #",
  "#                      #","#                      #",
  "#      N               #",
  "#   #######            #",
  "#                      #","#                      #","#                      #","#                      #",
  "#rw                 e  #",
  "########BBBB############"]
def solid(tx,ty,charged):
    if tx<0 or tx>=COLS: return True
    if ty<0 or ty>=ROWS: return False
    c=MAP[ty][tx]
    if c=="#": return True
    if c=="B": return charged        # bridge solid only once charged
    return False

def resolve(o,axis,charged):
    x0,x1=int(o["x"]//TILE),int((o["x"]+o["w"]-1)//TILE)
    y0,y1=int(o["y"]//TILE),int((o["y"]+o["h"]-1)//TILE)
    for ty in range(y0,y1+1):
        for tx in range(x0,x1+1):
            if not solid(tx,ty,charged): continue
            px,py=tx*TILE,ty*TILE
            if not (o["x"]<px+TILE and o["x"]+o["w"]>px and o["y"]<py+TILE and o["y"]+o["h"]>py): continue
            if axis=="x":
                if o["vx"]>0: o["x"]=px-o["w"]
                elif o["vx"]<0: o["x"]=px+TILE
                o["vx"]=0
            else:
                if o["vy"]>0: o["y"]=py-o["h"]; o["vy"]=0
                elif o["vy"]<0: o["y"]=py+TILE; o["vy"]=0
def step(o,charged):
    o["x"]+=o["vx"]; resolve(o,"x",charged)
    o["vy"]+=GRAV
    if o["vy"]>MAXFALL: o["vy"]=MAXFALL
    o["y"]+=o["vy"]; resolve(o,"y",charged)
def on_ground(o,charged):
    y=int((o["y"]+o["h"]+1)//TILE); x0=int((o["x"]+3)//TILE); x1=int((o["x"]+o["w"]-3)//TILE)
    return any(solid(tx,y,charged) for tx in range(x0,x1+1))

def W_at(col): return {"x":col*TILE+9,"y":12*TILE-W_H+TILE,"w":W_W,"h":W_H,"vx":0.0,"vy":0.0}
def R_at(col): return {"x":col*TILE+7,"y":12*TILE-R_H+TILE,"w":R_W,"h":R_H,"vx":0.0,"vy":0.0}
def overlaps_tile(o,tx,ty):
    px,py=tx*TILE,ty*TILE
    return o["x"]<px+TILE and o["x"]+o["w"]>px and o["y"]<py+TILE and o["y"]+o["h"]>py

LEDGE_COLS=range(4,11); LEDGE_TOP=7*TILE     # ledge solid row7
NODE=(7,6)                                    # node tile

fails=[]
def check(name,cond,detail=""):
    print(("  PASS " if cond else "  FAIL ")+name+(("  — "+detail) if detail else ""))
    if not cond: fails.append(name)

print("Uplift v2 — sim-first validation\n")

print("[1] Solvable — launch lands Wren on the node ledge (steered)")
def launched_lands_on_ledge():
    # search over 'hold right for N frames then release' — the player steers her
    for rel in range(0,46):
        o=W_at(2); o["vy"]=-LAUNCH_VY
        for f in range(160):
            o["vx"]= W_SPD if f<rel else 0.0
            step(o,False)
            if o["y"]>ROWS*TILE+80: break
            if o["vy"]>=0 and on_ground(o,False):
                feet=o["y"]+o["h"]; cx=o["x"]+o["w"]/2
                if abs(feet-LEDGE_TOP)<2 and (min(LEDGE_COLS)*TILE)<=cx<=((max(LEDGE_COLS)+1)*TILE):
                    return rel
                break
    return None
rel=launched_lands_on_ledge()
check("a steer exists that lands launched Wren on the ledge", rel is not None, ("hold-right %d frames"%rel) if rel is not None else "no landing found")

print("\n[2] Standing on the ledge, Wren overlaps the node")
o=W_at(7); o["y"]=LEDGE_TOP-W_H            # standing on the ledge at col7
check("Wren on the ledge overlaps the current-node tile", overlaps_tile(o,NODE[0],NODE[1]),
      "node=%s"%(NODE,))

print("\n[3] REQUIRED — Wren can't reach the ledge by jumping alone")
apex = (W_JUMP*W_JUMP)/(2*GRAV)            # px risen at apex
need = 12*TILE - LEDGE_TOP                 # feet must rise this much to reach the ledge
check("Wren's jump apex is short of the ledge (needs the launch)", apex < need,
      "apex=%.0fpx need=%.0fpx"%(apex,need))

print("\n[4] REQUIRED + NO CHEESE — Rook can't cross the gap until charged")
def rook_walk(charged):
    o=R_at(1)
    for f in range(400):
        o["vx"]=R_SPD; step(o,charged)
        if o["y"]>ROWS*TILE+80: return "fell"
        if o["x"]+o["w"]/2 > 20*TILE: return "exit"     # reached the exit column
    return "stuck"
check("uncharged: Rook walking right FALLS into the pit (no jump, no bridge)", rook_walk(False)=="fell", "result="+rook_walk(False))
check("charged: Rook walks across the bridge to the exit", rook_walk(True)=="exit", "result="+rook_walk(True))

print("\n"+("ALL CHECKS PASSED" if not fails else "FAILURES: "+", ".join(fails)))
raise SystemExit(1 if fails else 0)
