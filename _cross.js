/* VEILRUN — the two-world crossing harness (VR-214)

   WHAT THIS PROTECTS. `VE.World.cross()` in `games/_engine/engine.js` is the one
   place "land safely and carry the crew" lives for the whole 2D pair track.
   Until VR-214 a caller that passed no `mateDX` got the mate dropped at the
   crosser's exact x — so in Seam Gate v2 every Flip stacked Anvil on top of
   Latch, and because Anvil's body blocks shots, every Flip also handed Latch a
   free bulwark. Jordan found it in play on 9/24: "the characters should remain
   in their general locations relative to each other when switching worlds."

   IT RUNS THE REAL ENGINE against the REAL level. engine.js is evaluated in a
   sandbox (no DOM needed for VE.World), and Seam Gate v2's two maps and both
   characters' body sizes are lifted out of pair-level-v2/index.html — never a
   retyped copy — so a map edit that changes where a flip can land is judged
   here the day it happens.

   THE LAST SECTION IS THE MUTATION PASS: the pre-VR-214 default put back, and
   the kept spot accepted without checking the ground, each proven to fail a
   check the real engine passes. A bar that cannot fail is not a bar.

   Dependency-free. Run:  node _cross.js
   ---------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");

var checks = 0, fails = [];
function ok(name, cond, detail) { checks++; if (!cond) fails.push(name + (detail != null ? "  — " + detail : "")); }

console.log("\nVEILRUN · two-world crossing harness (VR-214)\n" + "=".repeat(58));

var ENGINE = path.join(__dirname, "games", "_engine", "engine.js");
var ENG_SRC = fs.readFileSync(ENGINE, "utf8");
var PL2 = fs.readFileSync(path.join(__dirname, "games", "pair-level-v2", "index.html"), "utf8");

function loadEngine(src) {
  var box = {}; vm.createContext(box);
  vm.runInContext(src, box, { filename: "engine.js" });
  return box.VE;
}

/* ---- the real level and the real bodies, lifted -------------------------- */
var lvSrc = (PL2.match(/var LEVELS=(\[[\s\S]*?\n  \]);/) || [])[1];
ok("Seam Gate v2's LEVELS lift out of the real file", !!lvSrc);
var LEVELS = lvSrc ? vm.runInNewContext("(" + lvSrc + ")") : [{ worlds: [[], []] }];
var bodyA = PL2.match(/var A=\{[^}]*?w:(\d+), h:(\d+)/), bodyL = PL2.match(/var L=\{[^}]*?w:(\d+), h:(\d+)/);
ok("Anvil's and Latch's body sizes lift out of the real file", !!(bodyA && bodyL));
ok("Seam Gate v2's Flip still calls the shared crossing with no mateDX (the case VR-214 fixes)",
   /VE\.World\.cross\(L, A, tw, \{ base:base, blocks:blocks, carry:true \}\)/.test(PL2));

function world(VE, src) {
  var TILE = VE.util.TILE, ROWS = VE.util.ROWS, COLS = VE.util.COLS;
  var base = LEVELS[0].worlds.map(function (rows) {
    var g = [];
    for (var y = 0; y < ROWS; y++) { g[y] = []; var r = rows[y] || "";
      for (var x = 0; x < COLS; x++) { var c = r[x] || " "; g[y][x] = c === "#" ? "solid" : c === "K" ? "break" : "empty"; } }
    return g;
  });
  return { TILE: TILE, base: base, blocks: function (t) { return t === "solid" || t === "break"; } };
}
function mk(VE, W, tileX, feetRow, wH, face, worldIdx) {
  var w = +wH[1], h = +wH[2];
  return { x: tileX * W.TILE + 6, y: feetRow * W.TILE - h, w: w, h: h, face: face || 1, world: worldIdx || 0, vx: 0, vy: 0 };
}
function overlap(a, b) { return a.world === b.world && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

function suite(VE, label) {
  var W = world(VE, label), R = {};
  var cross = function (o, m, tw, extra) {
    var opts = { base: W.base, blocks: W.blocks, carry: true };
    for (var k in extra || {}) opts[k] = extra[k];
    return VE.World.cross(o, m, tw, opts);
  };

  /* 1 · the spawn formation — Anvil two tiles behind Latch on the start ledge */
  var L = mk(VE, W, 4, 12, bodyL, 1, 0), A = mk(VE, W, 2, 12, bodyA, 1, 0);
  var dx0 = A.x - L.x, ay0 = A.y;
  R.flipOk = cross(L, A, 1);
  R.keptDx = A.x - L.x; R.dx0 = dx0; R.keptY = A.y === ay0; R.sameWorld = A.world === 1 && L.world === 1;
  R.stacked = overlap(A, L);
  R.standable1 = VE.World.standable(W.base, 1, A.x, A.y, A.w, A.h, W.blocks);

  /* 2 · Anvil AHEAD of Latch keeps the lead */
  var L2 = mk(VE, W, 3, 12, bodyL, 1, 0), A2 = mk(VE, W, 5, 12, bodyA, 1, 0);
  var d2 = A2.x - L2.x; cross(L2, A2, 1);
  R.aheadKept = (A2.x - L2.x) === d2 && d2 > 0;

  /* 3 · a round trip over solid ground is a no-op on the formation */
  var L3 = mk(VE, W, 20, 12, bodyL, 1, 1), A3 = mk(VE, W, 18, 12, bodyA, 1, 1);
  var d3 = A3.x - L3.x; cross(L3, A3, 0); var mid = A3.x - L3.x; cross(L3, A3, 1);
  R.roundTrip = mid === d3 && (A3.x - L3.x) === d3;

  /* 4 · the kept spot is over the Overcity chasm — Anvil must not fall in,
         must stay on his own (left) side, and must not land on Latch */
  var L4 = mk(VE, W, 19, 12, bodyL, 1, 1), A4 = mk(VE, W, 15, 12, bodyA, 1, 1);
  cross(L4, A4, 0);
  R.chasmStandable = VE.World.standable(W.base, 0, A4.x, A4.y, A4.w, A4.h, W.blocks);
  R.chasmSide = (A4.x + A4.w / 2) < (L4.x + L4.w / 2);
  R.chasmStacked = overlap(A4, L4);
  R.chasmFeet = (A4.y + A4.h) === (L4.y + L4.h);

  /* 5 · an authored door (Runeway's rune column) is untouched: atX + mateDX */
  var o5 = mk(VE, W, 6, 12, bodyL, 1, 0), m5 = mk(VE, W, 1, 12, bodyA, 1, 0);
  cross(o5, m5, 1, { atX: 400, mateDX: 22 });
  R.doorX = m5.x === 422; R.doorY = m5.y === o5.y;
  return R;
}

console.log("\n[the real engine, the real level]");
var VE = loadEngine(ENG_SRC);
ok("VE.World.cross and VE.World.keepFormation exist", VE && VE.World && typeof VE.World.cross === "function" && typeof VE.World.keepFormation === "function");
var R = suite(VE, "real");
ok("a Flip from the spawn formation succeeds", R.flipOk === true);
ok("Anvil keeps his exact offset from Latch across the Flip", R.keptDx === R.dx0, "dx " + R.dx0 + " → " + R.keptDx);
ok("Anvil keeps his own feet line when the kept spot is standable", R.keptY === true);
ok("both land in the target world", R.sameWorld === true);
ok("Anvil is NOT stacked on Latch after the Flip — the 9/24 bug", R.stacked === false);
ok("where Anvil lands is standable in the Underweft", R.standable1 === true);
ok("an Anvil who was AHEAD of Latch stays ahead, by the same distance", R.aheadKept === true);
ok("a round trip over solid ground leaves the formation exactly as it was", R.roundTrip === true);
ok("a kept spot over the chasm is refused — Anvil lands on footing", R.chasmStandable === true);
ok("…on his own side of Latch", R.chasmSide === true);
ok("…not on top of Latch", R.chasmStacked === false);
ok("…with his feet on Latch's line", R.chasmFeet === true);
ok("an authored door (atX + mateDX) lands the mate exactly where it always did", R.doorX && R.doorY);

console.log("\n[mutation pass — a bar that cannot fail is not a bar]");
{
  var mA = ENG_SRC.replace("else World.keepFormation(o, mate, mate.x - ox0, tw, base, blocks);",
                           "else { mate.world = tw; mate.x = nx; mate.y = o.y; mate.vx = 0; mate.vy = 0; }");
  ok("mutant A source actually changed (the pre-VR-214 default put back)", mA !== ENG_SRC);
  var RA = suite(loadEngine(mA), "mutA");
  ok("MUTANT KILLED — the old default stacks Anvil on Latch", RA.stacked === true && RA.keptDx !== RA.dx0);
}
{
  var mB = ENG_SRC.replace("if ((t.any || ownSide(t.x)) && World.standable(base, tw, t.x, t.y, mate.w, mate.h, blocks)) pick = t;",
                           "if (t.any || (ownSide(t.x) && World.standable(base, tw, t.x, t.y, mate.w, mate.h, blocks))) pick = t;");
  ok("mutant B source actually changed (kept spot accepted without checking the ground)", mB !== ENG_SRC);
  var RB = suite(loadEngine(mB), "mutB");
  ok("MUTANT KILLED — trusting the kept spot drops Anvil into the chasm", RB.chasmStandable === false);
}

console.log("\n" + "=".repeat(58));
if (fails.length) {
  console.log("FAILED (" + fails.length + "):"); fails.forEach(function (f) { console.log("  ✗ " + f); });
  console.log("\nFAIL — " + checks + " checks, " + fails.length + " failed."); process.exit(1);
}
console.log("PASS — " + checks + " checks");
