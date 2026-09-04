/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · ARENA LAYOUT JUDGE   (VR-148)

   WHAT THIS IS. `_sim.js` proves the BALANCE numbers; this proves the SHAPE OF
   THE GROUND. It is the external bar VR-154's generator will be scored against,
   and the reason VR-121 can add walls without anyone having to eyeball whether
   the result is playable.

   THE SIX CRITERIA, per layout:
     1  reach     every walkable region is one connected space
     2  wedge     no husk gets permanently stuck on geometry
     3  shroud    a line of sight can be broken inside Shroud's window
     4  cheese    there is no spot a husk can never reach you in
     5  blink     `stepDist` cannot put you outside the arena
     6  converge  two players can plausibly find each other

   ⚠️ IT JUDGES ITSELF ON EVERY RUN. Phase B feeds the judge layouts that are
   deliberately broken, one per criterion, and FAILS if any of them is passed.
   A judge that never rejects anything is two agents agreeing with each other
   (VR-148), and VR-154 will hand it a thousand layouts a day.

   NOTHING HERE IS A RETYPED COPY. The bounds clamp, the pillar push-out, the
   line-of-sight test and the shipped layouts are all lifted out of index.html
   and executed — the same source the game runs. If an anchor stops matching,
   this exits 2 loudly rather than quietly judging a stale copy.

   THE MUTATION PASS, and every one of these was run rather than reasoned about.
   Six mutants, six kills:
     M1  put back clampToArena's first-axis `return`      -> blink fails on all four shipped maps
     M2  put back the dead-centre push-out guard          -> blink fails on Open Ground
     M3  rename lineBlocked() in the game                 -> exit 2, anchor lost, no silent copy
     M4  waive a criterion that currently passes          -> stale waiver fails
     M5  waive a criterion with no reason given           -> bare waiver fails
     M6  drop the Shroud bar from 50% to 20%              -> the gate catches the coverless map passing
   M1 and M2 are the interesting ones: both are bugs this harness FOUND in the
   game on its first run, and both are now held shut by it.

   Dependency-free. Usage:  node _arena.js  [--verbose]
                            node _arena.js --judge layout.json
   --------------------------------------------------------------------------- */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

const VERBOSE = process.argv.includes("--verbose");
const JUDGE_ONE = (function () {
  const i = process.argv.indexOf("--judge");
  return i > 0 ? process.argv[i + 1] : null;
})();
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}
function note(s) { if (VERBOSE) console.log("        " + s); }

/* =========================================================================
   1 · LIFT THE GAME'S OWN SOURCE
   ========================================================================= */
function lift(label, re) {
  const m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("The judge will not fall back to a copy. Fix the anchor in _arena.js.\n");
    process.exit(2);
  }
  return m[0];
}

const srcBalance   = lift("BALANCE block",     /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/);
const balBody      = html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
const srcClamp     = lift("clamp()",           /\nvar clamp = function \([\s\S]*?\};/);
const srcMaps      = lift("MAPS layouts",      /\nvar MAPS = \[[\s\S]*?\n\];/);
const srcClampArena= lift("clampToArena()",    /\nfunction clampToArena\(o\) \{[\s\S]*?\n\}/);
const srcPushOut   = lift("pushOutOfPillars()",/\nfunction pushOutOfPillars\(o, radius\) \{[\s\S]*?\n\}/);
const srcLine      = lift("lineBlocked()",     /\nfunction lineBlocked\(ax, az, bx, bz\) \{[\s\S]*?\n\}/);

const sandbox = { Math: Math, console: console, module: { exports: {} }, PILLARS: [], A: 0 };
vm.createContext(sandbox);
new vm.Script(balBody, { filename: "index.html#BALANCE" }).runInContext(sandbox);
const BAL = sandbox.module.exports, C = BAL.C;
new vm.Script([srcClamp, srcMaps, srcClampArena, srcPushOut, srcLine].join("\n"),
              { filename: "index.html#ARENA" }).runInContext(sandbox);

const MAPS           = sandbox.MAPS;
const clampToArena   = sandbox.clampToArena;
const pushOutOfPillars = sandbox.pushOutOfPillars;
const lineBlocked    = sandbox.lineBlocked;
const LIVE           = sandbox.PILLARS;          // identity kept, exactly as the game does
function loadLayout(layout) {
  LIVE.length = 0;
  (layout.pillars || []).forEach(function (p) { LIVE.push(p); });
  sandbox.A = (layout.half == null ? C.arena : layout.half);
  return sandbox.A;
}

/* =========================================================================
   2 · THE NUMBERS THE JUDGE STANDS ON
   ========================================================================= */
/* Body radii are literals inside the game's call sites rather than in BALANCE,
   so they are cross-checked against the file instead of trusted. If someone
   retunes a hitbox, this goes red rather than judging with the old number. */
const PLAYER_R = 0.45, HUSK_R = 0.42;

/* Grid resolutions, in world units at today's 20u arena — and capped by a cell
   COUNT so a 180u arena is judged in the same wall-clock as a 20u one. Fine for
   the geometric criteria, nav for anything that needs a shortest path, coarse
   for the density field. */
const FINE = 0.30, NAV = 0.50, COARSE = 1.00;
const CAP = { 0.3: 220, 0.5: 110, 1: 90 };    // max cells per side, per role
function stepFor(half, base) { return Math.max(base, (2 * half) / CAP[base]); }

/* ---- calibrated thresholds ------------------------------------------------
   Every one of these is a judgement call, so each is named, defaulted from the
   shipped layouts, and reported in --verbose so it can be moved on evidence
   rather than argued about. */
const TH = {
  shroudViable   : 0.50,  // fraction of engagements that must offer a Shroud-viable break.
                          // Calibrated on the shipped maps: Pit 71%, Colonnade 66%, Keep 54%,
                          // Open Ground 41% — and Open Ground's own note says "almost no cover".
  convergeMedian : 2.5,   // median time-to-contact, in arena traversals
  convergeP90    : 4.0,   // 90th percentile, same units
  convergeMax    : 8.0,   // no trial may exceed this, ever
  convergeMissRate: 0.02, // fraction of hunts allowed to run past the cap without meeting.
                          // Not zero: one unlucky hunt in a hundred is a stealth game working,
                          // and a zero-tolerance bar turns criterion 6 into a coin toss.
  convergeP90Abs : 35,    // SECONDS. The relative bars scale with the arena, so on their own
                          // they would bless an arena of any size at all. VR-151 rules the
                          // span by TIME (~8-10s to cross), which puts the relative p90 bar of
                          // 4 traversals at about 36s. The reference arena at the ruled size
                          // sits at 27s, so this leaves real headroom and still catches an
                          // arena half again too big — which fails on the clock, not the shape.
  contactRange   : 12.0,  // units at which two players see each other, LOS permitting.
                          // Working figure until VR-151 pins the 1v1 draw distance.
  hotspotContrast: 1.60   // top-hotspot density over median density. Below this the
                          // husk field is FLAT and there is nothing to converge on.
};

/* Deterministic. A judge that gives a different verdict on the same layout is
   not a bar, it is a coin. */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* =========================================================================
   3 · GRID + GRAPH HELPERS
   ========================================================================= */
function Heap() { this.a = []; }
Heap.prototype.push = function (k, v) {
  const a = this.a; a.push([k, v]); let i = a.length - 1;
  while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; const t = a[p]; a[p] = a[i]; a[i] = t; i = p; }
};
Heap.prototype.pop = function () {
  const a = this.a, top = a[0], last = a.pop();
  if (a.length) {
    a[0] = last; let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let m = i;
      if (l < a.length && a[l][0] < a[m][0]) m = l;
      if (r < a.length && a[r][0] < a[m][0]) m = r;
      if (m === i) break;
      const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
    }
  }
  return top;
};

function inPillar(P, x, z, r) {
  for (let k = 0; k < P.length; k++) {
    const p = P[k], dx = x - p.x, dz = z - p.z, rr = p.r + r;
    if (dx * dx + dz * dz < rr * rr) return true;
  }
  return false;
}

function makeGrid(layout, base, bodyR) {
  const half = (layout.half == null ? C.arena : layout.half);
  const step = stepFor(half, base);
  const lim = half - PLAYER_R;               // clampToArena's own limit
  const n = Math.max(6, Math.round((lim * 2) / step));
  const s = (lim * 2) / n;
  const P = layout.pillars || [];
  const walk = new Uint8Array(n * n);
  const xs = new Float64Array(n), zs = new Float64Array(n);
  for (let i = 0; i < n; i++) { xs[i] = -lim + (i + 0.5) * s; zs[i] = -lim + (i + 0.5) * s; }
  let count = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    if (!inPillar(P, xs[i], zs[j], bodyR)) { walk[j * n + i] = 1; count++; }
  }
  return { n: n, s: s, lim: lim, half: half, walk: walk, xs: xs, zs: zs, count: count, P: P };
}

const N8 = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];

/* Diagonals only where both orthogonals are open — a 0.45-radius body cannot
   squeeze through a corner-to-corner pinch, and a graph that says it can makes
   dead regions look connected. */
function neighbours(g, i, j, out) {
  let c = 0;
  for (let k = 0; k < N8.length; k++) {
    const di = N8[k][0], dj = N8[k][1], ii = i + di, jj = j + dj;
    if (ii < 0 || jj < 0 || ii >= g.n || jj >= g.n) continue;
    if (!g.walk[jj * g.n + ii]) continue;
    if (di && dj && (!g.walk[j * g.n + ii] || !g.walk[jj * g.n + i])) continue;
    out[c++] = jj * g.n + ii; out[c++] = N8[k][2];
  }
  return c;
}

function components(g) {
  const lab = new Int32Array(g.n * g.n).fill(-1);
  const sizes = [], stack = [], nb = new Array(16);
  for (let j = 0; j < g.n; j++) for (let i = 0; i < g.n; i++) {
    const id = j * g.n + i;
    if (!g.walk[id] || lab[id] >= 0) continue;
    const c = sizes.length; let size = 0;
    lab[id] = c; stack.push(id);
    while (stack.length) {
      const cur = stack.pop(); size++;
      const ci = cur % g.n, cj = (cur - ci) / g.n, m = neighbours(g, ci, cj, nb);
      for (let k = 0; k < m; k += 2) if (lab[nb[k]] < 0) { lab[nb[k]] = c; stack.push(nb[k]); }
    }
    sizes.push(size);
  }
  return { lab: lab, sizes: sizes };
}

function dijkstra(g, srcId, maxDist) {
  const cap = maxDist == null ? Infinity : maxDist;
  const dist = new Float64Array(g.n * g.n).fill(Infinity);
  const h = new Heap(), nb = new Array(16);
  dist[srcId] = 0; h.push(0, srcId);
  while (h.a.length) {
    const top = h.pop(), d = top[0], id = top[1];
    if (d > dist[id] || d > cap) continue;
    const ci = id % g.n, cj = (id - ci) / g.n, m = neighbours(g, ci, cj, nb);
    for (let k = 0; k < m; k += 2) {
      const nd = d + nb[k + 1] * g.s;
      if (nd < dist[nb[k]]) { dist[nb[k]] = nd; h.push(nd, nb[k]); }
    }
  }
  return dist;
}

function cellOf(g, x, z) {
  const i = Math.min(g.n - 1, Math.max(0, Math.round((x + g.lim) / g.s - 0.5)));
  const j = Math.min(g.n - 1, Math.max(0, Math.round((z + g.lim) / g.s - 0.5)));
  return j * g.n + i;
}
function nearestWalkable(g, x, z) {
  const id = cellOf(g, x, z);
  if (g.walk[id]) return id;
  let best = -1, bd = Infinity;
  for (let k = 0; k < g.n * g.n; k++) {
    if (!g.walk[k]) continue;
    const i = k % g.n, j = (k - i) / g.n, dx = g.xs[i] - x, dz = g.zs[j] - z, d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
function walkableIds(g) {
  const out = [];
  for (let k = 0; k < g.n * g.n; k++) if (g.walk[k]) out.push(k);
  return out;
}
function sample(list, k, rng) {
  if (list.length <= k) return list.slice();
  const out = [], seen = new Set();
  while (out.length < k) {
    const idx = (rng() * list.length) | 0;
    if (seen.has(idx)) continue;
    seen.add(idx); out.push(list[idx]);
  }
  return out;
}
const pct = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };

/* Husk spawn ring — exactly where spawnEnemy() puts them: an edge point, 0.8
   in from the seam. Lifted as a shape, not as a number pulled from thin air. */
function spawnRing(half, k, rng) {
  const A = half, out = [];
  for (let n = 0; n < k; n++) {
    const side = n % 4, t = -A + 1.2 + rng() * (2 * A - 2.4);
    if (side === 0) out.push({ x: t, z: -A + 0.8 });
    else if (side === 1) out.push({ x: t, z: A - 0.8 });
    else if (side === 2) out.push({ x: -A + 0.8, z: t });
    else out.push({ x: A - 0.8, z: t });
  }
  return out;
}

/* The husk's real locomotion: steer straight at the target, then be pushed out
   of whatever it walked into. There is no pathfinder in the game, which is
   precisely why concave geometry is dangerous and why this is simulated rather
   than assumed. */
function huskWalk(spawn, target, maxT) {
  /* maxT is passed in scaled to the arena — a 70u map takes a husk 23s just to
     cross it, and a fixed 40s budget would read that as "never arrived". */
  const dt = 1 / 60, e = { x: spawn.x, z: spawn.z };
  let t = 0, best = Infinity, sinceGain = 0, lastX = e.x, lastZ = e.z, still = 0;
  while (t < maxT) {
    const dx = target.x - e.x, dz = target.z - e.z, d = Math.hypot(dx, dz);
    /* Reach AND see. The game's hurtPlayer() does not test the line, so a husk
       can technically swing through a thin stone — but "no spot you cannot be
       reached in" means reached, not clipped through cover, and counting the
       through-wall hit is how a judge blesses a safe corner. (That the game
       allows the hit at all is a separate finding, noted in the hand-off.) */
    if (d <= C.enemyReach && !lineBlocked(e.x, e.z, target.x, target.z))
      return { reached: true, wedged: false, t: t };
    e.x += (dx / d) * C.enemySpeed * dt; e.z += (dz / d) * C.enemySpeed * dt;
    clampToArena(e); pushOutOfPillars(e, HUSK_R);
    const moved = Math.hypot(e.x - lastX, e.z - lastZ);
    still = moved < C.enemySpeed * dt * 0.08 ? still + dt : 0;
    lastX = e.x; lastZ = e.z;
    if (d < best - 0.05) { best = d; sinceGain = 0; } else sinceGain += dt;
    if (still > 1.0) return { reached: false, wedged: true, t: t, stuckAt: { x: e.x, z: e.z }, gap: d };
    /* The game's husks abandon a hunt after huskSearchGiveUp seconds of getting
       no closer. Modelling that here is not just a speed-up: a husk that
       circles forever is not "reaching" you in any sense the player would
       recognise, and pretending otherwise would bless a spot you can kite in. */
    if (sinceGain > C.huskSearchGiveUp) return { reached: false, wedged: false, t: t, gap: d };
    t += dt;
  }
  return { reached: false, wedged: sinceGain > maxT * 0.6, t: t, gap: Math.hypot(target.x - e.x, target.z - e.z) };
}

/* =========================================================================
   4 · THE SIX CRITERIA
   Each returns { pass, why, stat } — `why` is the named failure VR-148 asks
   the loop to hand back to the builder, so it has to read like an instruction.
   ========================================================================= */
const CRITERIA = ["reach", "wedge", "shroud", "cheese", "blink", "converge"];

function c_reach(L) {
  const g = makeGrid(L, FINE, PLAYER_R);
  const comp = components(g);
  const total = comp.sizes.reduce((a, b) => a + b, 0);
  const big = Math.max.apply(null, comp.sizes.length ? comp.sizes : [0]);
  const orphan = total - big;
  return {
    pass: comp.sizes.length === 1 && total > 0,
    why: comp.sizes.length > 1
      ? "the floor is in " + comp.sizes.length + " pieces — " + orphan + " cells (" +
        (100 * orphan / total).toFixed(1) + "% of the arena) cannot be walked to from the main space"
      : "no walkable floor at all",
    stat: comp.sizes.length + " region" + (comp.sizes.length === 1 ? "" : "s") + ", " + total + " cells"
  };
}

function c_wedgeAndCheese(L) {
  const g = makeGrid(L, NAV, PLAYER_R);
  const rng = mulberry32(0x5EED01);
  const ids = walkableIds(g);
  const comp = components(g);
  const mainLabel = comp.sizes.indexOf(Math.max.apply(null, comp.sizes));
  /* Targets come from EVERY walkable region, not just the main one, and every
     region gets a floor of samples however small it is. A pocket you can only
     Veilstep into is exactly the Arcline pillar-walk cheese — and it is small
     by nature, so a flat random sample over the whole arena walks straight
     past it. Stratifying by region is what makes the criterion bite. */
  const byComp = new Map();
  for (const id of ids) {
    const c = comp.lab[id];
    if (!byComp.has(c)) byComp.set(c, []);
    byComp.get(c).push(id);
  }
  let targets = [];
  for (const [c, list] of byComp) {
    const want = Math.max(10, Math.round(180 * list.length / ids.length));
    targets = targets.concat(sample(list, want, rng));
  }
  const spawns = spawnRing(g.half, 8, mulberry32(0x5EED02));
  const walkT = 20 + (4 * g.half) / C.enemySpeed;
  let wedges = 0, firstWedge = null, unreachable = 0, firstUnreach = null;
  for (const id of targets) {
    const i = id % g.n, j = (id - i) / g.n, tgt = { x: g.xs[i], z: g.zs[j] };
    const inMain = comp.lab[id] === mainLabel;
    let reached = false;
    for (const sp of spawns) {
      const r = huskWalk(sp, tgt, walkT);
      /* A husk pointed exactly radially at a single round pillar deadlocks:
         the steer in and the push-out cancel. That is a knife edge, not a
         wedge — a real player moves and it resolves. So a wedge only counts
         if it survives a nudge off the axis. */
      if (r.wedged && inMain && nudgedStillWedged(r.stuckAt, tgt)) {
        wedges++;
        if (!firstWedge) firstWedge = { at: r.stuckAt, gap: r.gap };
      }
      if (r.reached) { reached = true; break; }
    }
    if (!reached) { unreachable++; if (!firstUnreach) firstUnreach = tgt; }
  }
  /* Restart FROM THE STUCK POINT, a step to each side. A husk aimed dead at the
     axis of one round pillar deadlocks — the steer in and the push-out cancel —
     and a real player moving by a hand's width breaks it. A vice does not
     break: both sidesteps wedge again. Nudging the spawn instead of the stuck
     point does not work, because the walk converges back onto the same axis. */
  function nudgedStillWedged(at, tgt) {
    if (!at) return true;
    const dx = tgt.x - at.x, dz = tgt.z - at.z, d = Math.hypot(dx, dz) || 1;
    const nx = -dz / d, nz = dx / d;
    for (const off of [0.6, -0.6]) {
      const r = huskWalk({ x: at.x + nx * off, z: at.z + nz * off }, tgt, walkT);
      if (!r.wedged) return false;
    }
    return true;
  }
  const wedge = {
    pass: wedges === 0,
    why: "husks wedge on the geometry — " + wedges + " walks stopped dead and stayed dead when nudged" +
         (firstWedge ? " (first at " + firstWedge.at.x.toFixed(1) + "," + firstWedge.at.z.toFixed(1) +
          ", still " + firstWedge.gap.toFixed(1) + "u short)" : ""),
    stat: targets.length + " targets x " + spawns.length + " spawns, 0 wedged"
  };
  const cheese = {
    pass: unreachable === 0,
    why: "there are spots no husk can reach you in — " + unreachable + " of " + targets.length +
         " sampled positions were never attacked" +
         (firstUnreach ? " (e.g. " + firstUnreach.x.toFixed(1) + "," + firstUnreach.z.toFixed(1) + ")" : ""),
    stat: "every one of " + targets.length + " sampled positions is attackable"
  };
  return { wedge: wedge, cheese: cheese };
}

/* --- Shroud ---------------------------------------------------------------
   Not "is there cover" — "can you break a line and HOLD it broken long enough
   for the veil to take you". Shroud needs shroudDelay of unseen stillness, and
   the husk does not stop walking while you wait. So the test is: reach a hidden
   cell inside a tactical reposition, then hold it while the husk keeps closing
   on where it last saw you. A single thin pillar in an open room passes the
   first half and fails the second, which is exactly the distinction the card
   is asking for. */
const SHROUD_MOVE_T = 2.0;   // sec — a reposition, not a marathon across the map
const SHROUD_STEP   = 0.10;  // sec — resolution of the hold test

function c_shroud(L) {
  const g = makeGrid(L, NAV, PLAYER_R);
  const rng = mulberry32(0x5EED03);
  const ids = walkableIds(g);
  if (!ids.length) return { pass: false, why: "no floor to hide on", stat: "-" };
  const players = sample(ids, 80, rng);
  let pairs = 0, viable = 0;
  for (const pid of players) {
    const pi = pid % g.n, pj = (pid - pi) / g.n, px = g.xs[pi], pz = g.zs[pj];
    const reachCap = SHROUD_MOVE_T * C.moveSpeed;
    const dist = dijkstra(g, pid, reachCap);
    const obs = [];
    for (let tries = 0; tries < 300 && obs.length < 8; tries++) {
      const oid = ids[(rng() * ids.length) | 0];
      const oi = oid % g.n, oj = (oid - oi) / g.n, ox = g.xs[oi], oz = g.zs[oj];
      const d = Math.hypot(ox - px, oz - pz);
      if (d < 5 || d > 14) continue;
      if (lineBlocked(ox, oz, px, pz)) continue;
      obs.push({ x: ox, z: oz, d: d });
    }
    for (const o of obs) {
      pairs++;
      const closeT = Math.max(0, (o.d - C.enemyReach) / C.enemySpeed);
      const budget = Math.min(SHROUD_MOVE_T, Math.max(0, closeT - C.shroudDelay));
      const reach = budget * C.moveSpeed;
      /* candidates: hidden from the observer today, and inside the reposition */
      const cand = [];
      const span = Math.ceil(reach / g.s);
      for (let jj = Math.max(0, pj - span); jj <= Math.min(g.n - 1, pj + span); jj++) {
        for (let ii = Math.max(0, pi - span); ii <= Math.min(g.n - 1, pi + span); ii++) {
          const qid = jj * g.n + ii, dq = dist[qid];
          if (!(dq <= reach)) continue;
          if (lineBlocked(o.x, o.z, g.xs[ii], g.zs[jj])) cand.push([dq, g.xs[ii], g.zs[jj]]);
        }
      }
      cand.sort((u, v) => u[0] - v[0]);
      for (let k = 0; k < Math.min(cand.length, 14); k++) {
        if (holds(o, px, pz, cand[k][1], cand[k][2], cand[k][0])) { viable++; break; }
      }
    }
  }
  /* the husk keeps walking to where it last saw you; the veil needs the whole
     window with the line still broken */
  function holds(o, px, pz, qx, qz, moved) {
    const dx = px - o.x, dz = pz - o.z, d = Math.hypot(dx, dz) || 1;
    const ux = dx / d, uz = dz / d;
    let walked = moved / C.moveSpeed * C.enemySpeed;   // it closed while you ran
    for (let t = 0; t <= C.shroudDelay + 1e-9; t += SHROUD_STEP) {
      const travel = Math.min(d, walked + t * C.enemySpeed);
      if (!lineBlocked(o.x + ux * travel, o.z + uz * travel, qx, qz)) return false;
    }
    return true;
  }
  const frac = pairs ? viable / pairs : 0;
  return {
    pass: pairs > 0 && frac >= TH.shroudViable,
    why: pairs === 0
      ? "no engagement at all could be sampled — the layout has no usable sightlines"
      : "only " + (100 * frac).toFixed(0) + "% of engagements offer a line you can break and HOLD for Shroud's " +
        C.shroudDelay + "s (needs " + (100 * TH.shroudViable).toFixed(0) + "%)",
    stat: (100 * frac).toFixed(0) + "% of " + pairs + " engagements are Shroud-viable"
  };
}

function c_blink(L) {
  const g = makeGrid(L, FINE, PLAYER_R);
  const P = g.P;
  let out = 0, into = 0, worstOut = 0, firstOut = null;
  const H = 16;
  for (let k = 0; k < g.n * g.n; k++) {
    if (!g.walk[k]) continue;
    const i = k % g.n, j = (k - i) / g.n;
    for (let a = 0; a < H; a++) {
      const th = a * 2 * Math.PI / H, dx = Math.cos(th), dz = Math.sin(th);
      const o = { x: g.xs[i] + dx * C.stepDist, z: g.zs[j] + dz * C.stepDist };
      clampToArena(o); pushOutOfPillars(o, PLAYER_R);
      const over = Math.max(Math.abs(o.x), Math.abs(o.z)) - g.lim;
      if (over > 1e-6) {
        out++; if (over > worstOut) { worstOut = over; firstOut = { from: [g.xs[i], g.zs[j]], to: [o.x, o.z] }; }
      }
      if (inPillar(P, o.x, o.z, PLAYER_R - 1e-3)) into++;
    }
  }
  return {
    pass: out === 0 && into === 0,
    why: out
      ? "a " + C.stepDist + "u blink puts you outside the arena — cover within " +
        (PLAYER_R * 2).toFixed(2) + "u of the seam lets the push-out shove a clamped landing " +
        "straight through it (keep |centre| + r + " + (PLAYER_R * 2).toFixed(2) +
        " inside the half-extent) — " + out + " landings, worst by " +
        worstOut.toFixed(2) + "u" + (firstOut ? " (from " + firstOut.from.map(v => v.toFixed(1)).join(",") +
        " to " + firstOut.to.map(v => v.toFixed(1)).join(",") + ")" : "")
      : "a blink lands inside geometry — " + into + " landings ended inside a pillar",
    stat: "every blink from every cell lands inside the seam and clear of cover"
  };
}

/* --- convergence ---------------------------------------------------------
   The assertion VR-151 added, and it is not "can husks path". A big stealth
   arena fails by being EMPTY: nothing draws two players to the same place, so
   they wander past each other for minutes.

   The density field is built the way the game actually populates the arena —
   husks enter on the seam and walk to patrol points — so a layout that funnels
   them (Colonnade) reads as lumpy and an open plate reads as flat. Players are
   modelled as hunting the lumps, because the husks are the reason to converge.
   With no lump above the contrast bar they have nothing to hunt and wander. */
function c_converge(L) {
  const g = makeGrid(L, COARSE, PLAYER_R);
  const ids = walkableIds(g);
  if (ids.length < 9) return { pass: false, why: "arena too small to measure convergence", stat: "-" };
  const rng = mulberry32(0x5EED04);
  const comp = components(g);
  const mainLabel = comp.sizes.indexOf(Math.max.apply(null, comp.sizes));
  const main = ids.filter(id => comp.lab[id] === mainLabel);

  /* husk density: seam entry -> patrol point, accumulated along the walk */
  const dens = new Float64Array(g.n * g.n);
  const seams = L.seams && L.seams.length ? L.seams : spawnRing(g.half, 24, mulberry32(0x5EED05));
  const cache = new Map();
  const distFrom = id => { let d = cache.get(id); if (!d) { d = dijkstra(g, id); cache.set(id, d); } return d; };
  for (let n = 0; n < 220; n++) {
    const s = seams[(rng() * seams.length) | 0];
    const sid = nearestWalkable(g, s.x, s.z);
    if (comp.lab[sid] !== mainLabel) continue;
    const tid = main[(rng() * main.length) | 0];
    const d = distFrom(sid);
    if (!isFinite(d[tid])) continue;
    /* walk the gradient back from the patrol point to the seam */
    let cur = tid, guard = 0;
    const nb = new Array(16);
    while (cur !== sid && guard++ < 4000) {
      dens[cur] += 1;
      const ci = cur % g.n, cj = (cur - ci) / g.n, m = neighbours(g, ci, cj, nb);
      let best = cur, bd = d[cur];
      for (let k = 0; k < m; k += 2) if (d[nb[k]] < bd) { bd = d[nb[k]]; best = nb[k]; }
      if (best === cur) break;
      cur = best;
    }
    dens[sid] += 1;
  }
  /* A husk occupies a place, not a line. Accumulating raw shortest paths puts
     every route through the exact same centre cell and invents a hotspot on a
     bare plate, so the field is blurred to a husk-sized footprint first. This
     is the difference between "the middle of an empty field" and "a doorway":
     one survives the blur as a lump, the other flattens into a dome. */
  const blur = new Float64Array(g.n * g.n);
  const kr = Math.max(1, Math.round(2.5 / g.s));
  for (const id of main) {
    const i = id % g.n, j = (id - i) / g.n;
    let sum = 0, cnt = 0;
    for (let jj = Math.max(0, j - kr); jj <= Math.min(g.n - 1, j + kr); jj++)
      for (let ii = Math.max(0, i - kr); ii <= Math.min(g.n - 1, i + kr); ii++)
        if (g.walk[jj * g.n + ii]) { sum += dens[jj * g.n + ii]; cnt++; }
    blur[id] = cnt ? sum / cnt : 0;
  }
  for (const id of main) dens[id] = blur[id];
  /* CONCENTRATION, not a bare peak: how much heavier the busiest twentieth of
     the floor is than the floor as a whole. A smooth dome scores near 1; a
     network of doorways scores several times that. */
  const vals = main.map(id => dens[id]).sort((a, b) => a - b);
  const median = vals[Math.floor(vals.length / 2)] || 0;
  const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const topN = Math.max(1, Math.round(vals.length * 0.05));
  const topMean = vals.slice(vals.length - topN).reduce((a, b) => a + b, 0) / topN;
  const contrast = mean > 0 ? topMean / mean : 0;

  /* hotspots: local maxima of the density field, kept apart */
  const sep = Math.max(3, Math.round(g.half / 3 / g.s));
  const ranked = main.slice().sort((a, b) => dens[b] - dens[a]);
  const hots = [];
  for (const id of ranked) {
    if (dens[id] < mean * TH.hotspotContrast) break;
    const i = id % g.n, j = (id - i) / g.n;
    if (hots.every(h => Math.abs(h.i - i) + Math.abs(h.j - j) > sep)) hots.push({ id: id, i: i, j: j });
    if (hots.length >= 6) break;
  }

  /* two independent hunters, far apart, no coordination */
  const traversal = (2 * g.half) / C.moveSpeed;
  const cap = TH.convergeMax * traversal;
  const times = [];
  let missed = 0;
  for (let trial = 0; trial < 120; trial++) {
    let a = main[(rng() * main.length) | 0], b = main[(rng() * main.length) | 0], guard = 0;
    /* spawn them far apart, VR-151 §4.6 — straight-line is enough to pick the
       pair and costs nothing, and the graph distance can only be longer */
    const ai = a % g.n, aj = (a - ai) / g.n;
    while (guard++ < 400) {
      const bi = b % g.n, bj = (b - bi) / g.n;
      if (Math.hypot(g.xs[ai] - g.xs[bi], g.zs[aj] - g.zs[bj]) >= g.half) break;
      b = main[(rng() * main.length) | 0];
    }
    const t = hunt(a, b);
    if (t == null) { missed++; times.push(cap); } else times.push(t);
  }

  /* A hunter sweeps: it heads for the nearest lump it has not looked at yet,
     and starts the tour over when it runs out. Two players who both do that
     will cross paths; two players picking lumps at random sometimes never do,
     which is a fact about the model rather than about the arena. If there are
     no lumps above the contrast bar there is nothing to sweep, and they fall
     back to wandering — which is exactly what makes an empty plain fail. */
  function pickGoal(from, rnd, seenSet) {
    if (!hots.length) return main[(rnd() * main.length) | 0];
    if (seenSet.size >= hots.length) seenSet.clear();
    /* distance is symmetric on this graph, so ask each hotspot how far away the
       hunter is rather than running a fresh search from the hunter — the
       hotspot fields are already cached and there are only a handful of them */
    let best = null, bd = Infinity;
    for (const h of hots) {
      if (seenSet.has(h.id)) continue;
      const dd = distFrom(h.id)[from];
      if (isFinite(dd) && dd < bd) { bd = dd; best = h.id; }
    }
    if (best == null) { seenSet.clear(); best = hots[(rnd() * hots.length) | 0].id; }
    seenSet.add(best);
    return best;
  }
  function hunt(a, b) {
    const rA = mulberry32(0x1000 + (a * 7919 | 0)), rB = mulberry32(0x2000 + (b * 6271 | 0));
    const sA = new Set(), sB = new Set();
    let t = 0, pa = a, pb = b, ga = pickGoal(a, rA, sA), gb = pickGoal(b, rB, sB);
    let dA = distFrom(ga), dB = distFrom(gb);
    const nb = new Array(16), stepT = g.s / C.moveSpeed;
    while (t < cap) {
      const ai = pa % g.n, aj = (pa - ai) / g.n, bi = pb % g.n, bj = (pb - bi) / g.n;
      const ax = g.xs[ai], az = g.zs[aj], bx = g.xs[bi], bz = g.zs[bj];
      if (Math.hypot(ax - bx, az - bz) <= TH.contactRange && !lineBlocked(ax, az, bx, bz)) return t;
      pa = advance(pa, dA, nb); pb = advance(pb, dB, nb);
      if (pa === ga) { ga = pickGoal(pa, rA, sA); dA = distFrom(ga); }
      if (pb === gb) { gb = pickGoal(pb, rB, sB); dB = distFrom(gb); }
      t += stepT;
    }
    return null;
  }
  function advance(cur, d, nb) {
    const ci = cur % g.n, cj = (cur - ci) / g.n, m = neighbours(g, ci, cj, nb);
    let best = cur, bd = d[cur];
    for (let k = 0; k < m; k += 2) if (d[nb[k]] < bd) { bd = d[nb[k]]; best = nb[k]; }
    return best;
  }

  const med = pct(times, 0.5) / traversal, p90 = pct(times, 0.9) / traversal, mx = Math.max.apply(null, times) / traversal;
  const flat = contrast < TH.hotspotContrast;
  const p90Abs = pct(times, 0.9);
  const pass = med <= TH.convergeMedian && p90 <= TH.convergeP90 && mx <= TH.convergeMax &&
               (missed / times.length) <= TH.convergeMissRate && p90Abs <= TH.convergeP90Abs;
  return {
    pass: pass,
    why: (flat ? "husk density is flat — there is nothing to converge on, so " : "") +
      "two players take " + med.toFixed(1) + " traversals to find each other at the median, " +
      p90.toFixed(1) + " at p90, " + mx.toFixed(1) + " worst" +
      (missed ? " and " + missed + " of " + times.length + " hunts never met at all (ceiling " +
        (100 * TH.convergeMissRate).toFixed(0) + "%)" : "") +
      " — that is " + p90Abs.toFixed(0) + "s at p90 in real time" +
      (p90Abs > TH.convergeP90Abs ? ", past the " + TH.convergeP90Abs + "s ceiling: the arena is simply too big" : "") +
      " (bars: " + TH.convergeMedian + " / " + TH.convergeP90 + " / " + TH.convergeMax + " traversals, " +
      TH.convergeP90Abs + "s absolute)",
    stat: "median " + med.toFixed(1) + " traversals, p90 " + p90.toFixed(1) + " (" + p90Abs.toFixed(0) + "s), worst " + mx.toFixed(1) +
      " · density contrast " + (isFinite(contrast) ? contrast.toFixed(1) : "inf") + "x · " + hots.length + " hotspots",
    extra: { traversal: traversal, contrast: contrast, hotspots: hots.length, median: med, p90: p90, max: mx }
  };
}

function judge(L) {
  loadLayout(L);
  const t0 = Date.now(); const r = {};
  r.reach = c_reach(L);
  const wc = c_wedgeAndCheese(L);
  r.wedge = wc.wedge; r.cheese = wc.cheese;
  r.shroud = c_shroud(L);
  r.blink = c_blink(L);
  r.converge = c_converge(L);
  r.pass = CRITERIA.every(k => r[k].pass);
  r.failed = CRITERIA.filter(k => !r[k].pass);
  r.ms = Date.now() - t0;
  return r;
}

/* =========================================================================
   5 · WAIVERS — and they police themselves
   A hand-authored map may opt out of a criterion, but only with a reason, and
   only while it genuinely fails. A stale waiver is a failure: an exemption you
   can add without saying why is a mute button, not a decision (CLAUDE.md §4).
   ========================================================================= */
/* Waivers are keyed by SHIPPED layout id and live here rather than in the game,
   the way _docscheck.js keeps NO_DOCS_NEEDED beside the check rather than in the
   thing being checked. A generated layout can never carry one: VR-154 does not
   get to write its own exemptions. */
const WAIVERS = {
  open: {
    shroud: "Open Ground is the control map. Its own note in index.html reads \"almost no cover — " +
            "nowhere to hide\", and it exists to show what the arena feels like with the sightlines " +
            "left unbroken. Failing the Shroud criterion is the point of the map, not a defect in it."
  }
};

function applyWaivers(L, r) {
  const w = WAIVERS[L.id] || null;
  const notes = [];
  if (!w) return { failed: r.failed, notes: notes, bad: [] };
  const bad = [];
  const failed = r.failed.slice();
  for (const key of Object.keys(w)) {
    if (CRITERIA.indexOf(key) < 0) { bad.push("waives `" + key + "`, which is not a criterion"); continue; }
    const why = w[key];
    if (typeof why !== "string" || why.trim().length < 12) { bad.push("waives `" + key + "` with no reason"); continue; }
    const at = failed.indexOf(key);
    if (at < 0) { bad.push("waives `" + key + "` but that criterion now passes — stale waiver, delete it"); continue; }
    failed.splice(at, 1);
    notes.push("waived `" + key + "` — " + why);
  }
  return { failed: failed, notes: notes, bad: bad };
}

/* =========================================================================
   5b · SCORING ONE LAYOUT — the entry point the gauntlet loop calls
   `node _arena.js --judge candidate.json` prints the six verdicts and exits
   non-zero on any failure, so a generator can be scored without this file
   knowing anything about how the layout was produced.
   Layout shape: { id, name, half?, pillars: [ {x, z, r, h} ], seams?: [{x,z}] }
   ========================================================================= */
if (JUDGE_ONE) {
  const L = JSON.parse(fs.readFileSync(JUDGE_ONE, "utf8"));
  const r = judge(L);
  console.log("\n" + (L.id || JUDGE_ONE) + " — " + (L.pillars || []).length + " pillars, half " +
              (L.half == null ? C.arena : L.half));
  for (const k of CRITERIA) console.log("  " + (r[k].pass ? "ok   " : "FAIL ") + k.padEnd(9) + (r[k].pass ? r[k].stat : r[k].why));
  console.log(r.pass ? "\nPASS" : "\nFAIL — " + r.failed.join(", "));
  process.exit(r.pass ? 0 : 1);
}

/* =========================================================================
   6 · PHASE A — the layouts the game actually ships
   ========================================================================= */
console.log("\nVEILRUN · Proving Ground — ARENA LAYOUT JUDGE (VR-148)\n" + "=".repeat(66));

console.log("\n[the judge is reading the game, not a copy]");
ok("BALANCE lifted and executed", typeof C.stepDist === "number", "stepDist " + C.stepDist + ", arena half " + C.arena);
ok("the game's own bounds clamp is under test", typeof clampToArena === "function");
ok("the game's own pillar push-out is under test", typeof pushOutOfPillars === "function");
ok("the game's own line-of-sight test is under test", typeof lineBlocked === "function");
ok("the shipped layouts are lifted, not retyped", Array.isArray(MAPS) && MAPS.length > 0, MAPS.map(m => m.id).join(", "));
ok("player radius matches the game's call site", /pushOutOfPillars\(player, 0\.45\)/.test(html), "0.45");
ok("husk radius matches the game's call site", /pushOutOfPillars\(e, 0\.42\)/.test(html), "0.42");
ok("the bounds limit matches the game's clamp", /var lim = A - 0\.45[,;]/.test(html), "A - 0.45");
ok("Veilstep still blinks by stepDist", /player\.x \+= dx \* C\.stepDist/.test(html));

console.log("\n[shipped layouts]");
for (const L of MAPS) {
  const r = judge(L);
  const w = applyWaivers(L, r);
  for (const b of w.bad) ok(L.id + " · waiver is honest", false, b);
  if (w.bad.length === 0 && WAIVERS[L.id]) { checks++; console.log("  ok    " + L.id + " · waiver is honest and still earned"); }
  ok(L.id + " (" + L.name + ") passes all six", w.failed.length === 0,
     w.failed.length ? w.failed.map(k => k + ": " + r[k].why).join(" | ") : "reach · wedge · shroud · cheese · blink · converge");
  for (const n of w.notes) console.log("        waived — " + n);
  if (VERBOSE) { note("judged in " + r.ms + "ms"); for (const k of CRITERIA) note(k.padEnd(9) + (r[k].pass ? "ok   " : "FAIL ") + r[k].stat); }
}

/* =========================================================================
   7 · PHASE B — THE GATE.  The judge must reject these.
   One layout per criterion, each broken on purpose, each naming the criterion
   it is supposed to trip. If any of them passes, this harness goes red — that
   is the whole point of the card.
   ========================================================================= */
function ring(cx, cz, R, n, r, h) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = i * 2 * Math.PI / n;
    out.push({ x: cx + Math.cos(th) * R, z: cz + Math.sin(th) * R, r: r, h: h || 4.0 });
  }
  return out;
}

const BAD = [
  { id: "bad-dead-region", name: "Sealed vault", expect: "reach",
    note: "a ring of touching pillars seals the middle — floor nobody can walk to",
    pillars: ring(0, 0, 3.0, 16, 0.75, 4.5) },

  /* The Arcline pillar-walk shape, in the vocabulary the game has today: a
     sealed cell in open ground, wide enough to fight in and close enough to
     Veilstep into. You can get there; no husk ever can.

     ⚠️ IT TRIPS `reach` TOO, and that is honest rather than sloppy. With
     nothing but round pillars and a husk BODY SMALLER THAN THE PLAYER'S, a
     pocket you can walk into is a pocket a husk can walk into — the two
     questions only come apart once VR-121 lands walls and an alcove can face
     away from the approach. `cheese` is the criterion that will catch that
     one, and this fixture keeps it honest until then.

     It also has to sit INBOARD of the seam: the husk spawn ring runs 0.8u
     inside the wall, so a pocket built against the wall is one husks spawn
     into. That cost a debugging pass and is exactly the kind of thing a
     generator will do by accident. */
  { id: "bad-safe-corner", name: "Safe cell", expect: "cheese",
    note: "a sealed cell you can only blink into — no husk ever gets its reach in",
    pillars: ring(4.5, 4.5, 3.0, 16, 0.75, 4.5).concat([
      { x: -4.6, z: -3.4, r: 0.85, h: 3.6 }, { x: 4.9, z: -4.6, r: 0.7, h: 4.4 },
      { x: -5.6, z: 4.9, r: 0.75, h: 3.0 }, { x: -0.9, z: 7.0, r: 0.65, h: 3.2 },
      { x: 0.4, z: -7.2, r: 0.6, h: 2.6 }, { x: -7.0, z: 0.5, r: 0.8, h: 3.4 } ]) },

  { id: "bad-wedge", name: "The vice", expect: "wedge",
    note: "a funnel of paired pillars that narrows to nothing — a husk walks in and stays",
    pillars: [
      { x: -1.02, z: 0, r: 1.0, h: 4.2 }, { x: 1.02, z: 0, r: 1.0, h: 4.2 },
      { x: -2.2, z: -1.6, r: 1.0, h: 4.2 }, { x: 2.2, z: -1.6, r: 1.0, h: 4.2 },
      { x: -3.6, z: -3.0, r: 1.0, h: 4.2 }, { x: 3.6, z: -3.0, r: 1.0, h: 4.2 },
      { x: -5.2, z: -4.2, r: 1.0, h: 4.2 }, { x: 5.2, z: -4.2, r: 1.0, h: 4.2 },
      { x: 4.0, z: 5.0, r: 0.9, h: 3.6 }, { x: -4.0, z: 5.0, r: 0.9, h: 3.6 },
      { x: 0, z: 6.5, r: 0.9, h: 3.6 } ] },

  { id: "bad-blink-out", name: "Corner stone", expect: "blink",
    note: "a stone overlapping the corner — clamp puts the blink in the corner, push-out shoves it back through the seam",
    pillars: [
      { x: 8.6, z: 8.6, r: 2.0, h: 4.5 },
      { x: -4.6, z: -3.4, r: 0.85, h: 3.6 }, { x: 4.9, z: -4.6, r: 0.7, h: 4.4 },
      { x: -5.6, z: 4.9, r: 0.75, h: 3.0 }, { x: 3.6, z: 4.2, r: 0.95, h: 3.9 } ] },

  { id: "bad-empty-plain", name: "The empty plain", expect: "shroud",
    note: "80 units of nothing — not one line of sight in the whole arena can be broken",
    half: 40.0, pillars: [] },

  /* "A map so big two players never meet", stated as size rather than as
     shape. Every relative bar scales with the arena, so a 180u map with tidy
     rooms clears all of them — and takes the best part of two minutes to find
     anyone in. The absolute ceiling is what catches it, and it is the reason
     that ceiling exists. */
  { id: "bad-vast", name: "The long walk", expect: "converge",
    note: "the reference arena's own rooms at 120u — nothing wrong with it except the size",
    half: refArena(60, 0xC0FFEE, "rooms").half,
    pillars: refArena(60, 0xC0FFEE, "rooms").pillars },

  { id: "bad-no-cover", name: "Billiard table", expect: "shroud",
    note: "one small stone in a 20u room — a line you can break but never hold",
    pillars: [{ x: 0, z: 0, r: 0.5, h: 3.0 }] }
];

/* =========================================================================
   6b · IS THE BAR SATISFIABLE?
   A judge nothing can pass is exactly as useless as one everything passes, and
   VR-154 will be generating at VR-151's ruled size (~60-80 units, 8-10s to
   cross) rather than at today's 20. So the harness carries ONE hand-built
   arena at that size and asserts it clears all six. If a threshold is ever
   tightened past the point of being reachable, this is what says so.
   ========================================================================= */
/* A layout builder, deterministic from a seed, in the two shapes the ruling is
   actually about: ROOMS (cross-walls with doorways) and a FIELD (the same cover
   scattered over open ground). Both are built to the rules the judge itself
   discovered while this card was being written, and those rules are the useful
   output for VR-154:
     · no two pillars may overlap once inflated by the player radius — the
       game's push-out resolves one pillar at a time, so overlapping cover
       squeezes a body through and leaves it standing inside stone;
     · cover must clear the seam by r + 2 x PLAYER_R or a clamped blink is
       pushed back out through the wall;
     · and it must clear the husk spawn ring, 0.8u in from the seam, or husks
       spawn inside it and deadlock. */
function refArena(half, seed, mode) {
  const rng = mulberry32(seed), P = [], CLR = 1.30, EDGE = 2.2;
  function fits(x, z, r) {
    if (Math.abs(x) > half - r - EDGE || Math.abs(z) > half - r - EDGE) return false;
    for (const p of P) if (Math.hypot(x - p.x, z - p.z) < p.r + r + CLR) return false;
    return true;
  }
  function put(x, z, r, h) { if (fits(x, z, r)) { P.push({ x: x, z: z, r: r, h: h }); return true; } return false; }
  function row(axis, fixed, from, to, gaps, r, gap) {
    for (let t = from; t <= to + 1e-9; t += 2 * r + gap) {
      if (gaps.some(gp => t > gp[0] && t < gp[1])) continue;
      if (axis === "x") put(t, fixed, r, 4.4); else put(fixed, t, r, 4.4);
    }
  }
  const d = half / 3;
  if (mode === "rooms") {
    const doors = [[-d - 3, -d + 3], [-3, 3], [d - 3, d + 3]];
    for (const f of [-d, d]) {
      row("x", f, -half + 3, half - 3, doors, 1.5, 0.5);
      row("z", f, -half + 3, half - 3, doors, 1.5, 0.5);
    }
  }
  if (mode === "rooms") {
    /* loose cover inside each chamber, so the middle of a room is not a
       billiard table — this is the half of the layout Shroud reads */
    const centres = [-2 * half / 3, 0, 2 * half / 3];
    for (const cx of centres) for (const cz of centres) {
      let n = 0, tries = 0;
      while (n < 6 && tries++ < 400) {
        if (put(cx + (rng() * 2 - 1) * d * 0.72, cz + (rng() * 2 - 1) * d * 0.72,
                0.7 + rng() * 0.8, 3 + rng() * 1.8)) n++;
      }
    }
  } else {
    /* the SAME amount of cover, spread evenly over open ground */
    let n = 0, tries = 0;
    while (n < 56 && tries++ < 40000) {
      if (put((rng() * 2 - 1) * half, (rng() * 2 - 1) * half, 0.6 + rng() * 1.1, 3 + rng() * 1.8)) n++;
    }
  }
  return { id: "ref-" + mode, name: mode === "rooms" ? "Nine chambers" : "The wide field",
           half: half, pillars: P };
}

const REF = refArena(35, 0xC0FFEE, "rooms");

console.log("\n[the bar is satisfiable at VR-151's ruled arena size]");
{
  const r = judge(REF);
  ok("a 70u arena can clear all six (" + (2 * REF.half) + "u, " +
     ((2 * REF.half) / C.moveSpeed).toFixed(1) + "s to cross)", r.pass,
     r.pass ? "reach · wedge · shroud · cheese · blink · converge"
            : r.failed.map(k => k + ": " + r[k].why).join(" | "));
  note("judged in " + r.ms + "ms");
  for (const k of CRITERIA) note(k.padEnd(9) + (r[k].pass ? "ok   " : "FAIL ") + r[k].stat);
}

console.log("\n[the gate — deliberately bad layouts the judge must reject]");
let gateFails = 0;
for (const L of BAD) {
  const r = judge(L);
  const caught = !r[L.expect].pass;
  ok(L.id + " is rejected on `" + L.expect + "`", caught,
     caught ? r[L.expect].why : "THE JUDGE PASSED IT — " + L.note);
  if (!caught) gateFails++;
  if (VERBOSE) { note("judged in " + r.ms + "ms"); for (const k of CRITERIA) note(k.padEnd(9) + (r[k].pass ? "ok   " : "FAIL ") + r[k].stat); }
}
ok("every criterion has a layout that trips it", new Set(BAD.map(b => b.expect)).size === CRITERIA.length,
   CRITERIA.filter(k => !BAD.some(b => b.expect === k)).join(", ") || "all six covered");

console.log("\n" + "=".repeat(66));
if (gateFails) console.log("⚠  THE GATE FAILED — a judge that passes a broken layout is worse than no judge.");
console.log(fails === 0 ? "PASS — " + checks + " checks" : "FAIL — " + fails + " of " + checks + " checks");
process.exit(fails === 0 ? 0 : 1);
