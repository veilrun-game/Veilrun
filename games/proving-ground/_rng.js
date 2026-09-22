/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · SEEDED RNG BAR   (VR-203)

   THE CARD. `_arena.js` has been fully deterministic since VR-148 — its own
   `mulberry32(0x5EED01)` and friends reproduce a layout exactly. The GAME
   the judge judges was not: `index.html` called `Math.random` 11 times, so
   the arena a player actually got could never be reproduced, replayed, or
   handed over as a seed string. This bar proves the fix from two directions:
   the shared module itself, and the real game code that now has to use it.

   PART 1 requires `games/_engine/rng.js` DIRECTLY — a real shared module,
   never lifted — the same contract `_clock.js`/`_bus.js`/`_motion.js`/
   `_actions.js` hold: no DOM, no game state, nothing to stub.

   PART 2 lifts the real `spawnEnemy()` out of `index.html` — never a
   retyped copy — and drives it against a stubbed THREE.js enemy pool, the
   same "stub the rendering, execute the logic" contract `_exec.js` uses for
   `tryExecute()`. This is the answer to "does the GAME actually stop calling
   Math.random", not just "does a module exist that could answer it".

   PART 3 is a grep-style assertion, run last so it can only fail on a
   REGRESSION into something Parts 1-2 already proved works correctly: no
   shipped game file calls `Math.random` directly. Harness/tooling files
   (`_*.js`) are exempt — they are Node-side test scripts that never run
   inside a player's game, which is the whole distinction this card draws.

   Dependency-free. Usage:  node _rng.js
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var ROOT = path.join(__dirname, "..", "..");
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _rng.js.\n");
    process.exit(2);
  }
  return m;
}

/* =========================================================================
   PART 1 · THE SHARED MODULE ITSELF, REQUIRED DIRECTLY
   ========================================================================= */
console.log("\n[the shared module: mulberry32 + named streams]");
var Rng = require(path.join(__dirname, "..", "_engine", "rng.js")).Rng;
var mulberry32 = require(path.join(__dirname, "..", "_engine", "rng.js")).mulberry32;

function drawN(gen, n) { var out = []; for (var i = 0; i < n; i++) out.push(gen()); return out; }

{
  var a = new Rng(12345), b = new Rng(12345);
  ok("the same seed reproduces the same stream sequence",
     JSON.stringify(drawN(a.stream("spawn"), 20)) === JSON.stringify(drawN(b.stream("spawn"), 20)));
}
{
  var a = new Rng(12345), b = new Rng(54321);
  ok("a different seed produces a different sequence",
     JSON.stringify(drawN(a.stream("spawn"), 20)) !== JSON.stringify(drawN(b.stream("spawn"), 20)));
}
{
  var r = new Rng(999);
  var spawnSeq1 = drawN(r.stream("spawn"), 10);
  var enemySeq = drawN(r.stream("enemy"), 5);        // a different system draws in between
  var spawnSeq2 = drawN(r.stream("spawn"), 10);
  var rClean = new Rng(999);
  var spawnUninterrupted = drawN(rClean.stream("spawn"), 20);
  ok("one system's draws cannot shift another's — 'spawn' is unaffected by 'enemy' drawing in between",
     JSON.stringify(spawnSeq1.concat(spawnSeq2)) === JSON.stringify(spawnUninterrupted));
}
{
  var r = new Rng(1);
  var spawn = drawN(r.stream("spawn"), 5), enemy = drawN(r.stream("enemy"), 5);
  ok("two named streams on the same seed are independent sequences, not the same one twice",
     JSON.stringify(spawn) !== JSON.stringify(enemy));
}
{
  var r = new Rng(7);
  drawN(r.stream("fx"), 50);                          // burn through some draws
  var before = drawN(r.stream("fx"), 3);
  r.reseed(7);
  var after = drawN(r.stream("fx"), 3);
  ok("reseed() actually resets — a stream drawn from before reseed does not carry state after",
     JSON.stringify(before) !== JSON.stringify(after) && JSON.stringify(after) === JSON.stringify(drawN(new Rng(7).stream("fx"), 3)));
}
ok("mulberry32 is exported unchanged — the same function _arena.js already trusted",
   typeof mulberry32(1) === "function");

/* =========================================================================
   PART 2 · THE REAL GAME CODE, LIFTED AND EXECUTED
   ========================================================================= */
console.log("\n[the real spawnEnemy(), lifted and driven]");

var balBody = lift("BALANCE block", /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
var srcRand = lift("rand()", /\nvar rand = function \(a, b, stream\) \{[^\n]*\};/)[0];
var srcSpawn = lift("spawnEnemy()", /\nfunction spawnEnemy\(spec\) \{[\s\S]*?\n\}/)[0];
var mEntryH = lift("ENTRY_H", /\nvar ENTRY_H = ([\d.]+);/);
var mEntryThrow = lift("ENTRY_THROW", /\nvar ENTRY_THROW = ([\d.]+);/);

function fakeEnemy() {
  return {
    live: false, mat: { color: { setHex: function () {} }, transparent: false, opacity: 1 },
    eyeMat: { color: { setHex: function () {} } },
    g: { position: { set: function () {} }, rotation: { set: function () {} },
         scale: { setScalar: function () {} }, visible: false }
  };
}

function buildSandbox(seed) {
  var sandbox = {
    Math: Math, console: console, module: { exports: {} },
    RNG: new Rng(seed),
    player: { x: 0, z: 0 },
    setPhase: function () {}, tearAt: function () {},
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    MESH_PI: Math.PI, HUSK_COL: 0x9c9ab2
  };
  vm.createContext(sandbox);
  vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
  var C = sandbox.module.exports.C;
  sandbox.C = C;
  sandbox.A = C.arena;
  vm.runInContext([srcRand, "var ENTRY_H = " + mEntryH[1] + ";", "var ENTRY_THROW = " + mEntryThrow[1] + ";", srcSpawn].join("\n"),
                   sandbox, { filename: "index.html#SPAWN" });
  return sandbox;
}

function runSpawns(seed, n) {
  var s = buildSandbox(seed);
  var ENEMIES = []; for (var i = 0; i < n; i++) ENEMIES.push(fakeEnemy());
  s.ENEMIES = ENEMIES;
  var out = [];
  for (var i = 0; i < n; i++) {
    s.spawnEnemy({ hpMult: 1, spdMult: 1, milestone: null });
    var e = ENEMIES[i];
    out.push({ x: +e.x.toFixed(6), z: +e.z.toFixed(6), entry: e.entry, entryX: +e.entryX.toFixed(6), entryZ: +e.entryZ.toFixed(6) });
  }
  return out;
}

var BAL_ARENA = buildSandbox(1).C.arena;
{
  var run1 = runSpawns(4242, 12);
  var run2 = runSpawns(4242, 12);
  ok("the same seed reproduces the same spawn sequence through the real spawnEnemy()",
     JSON.stringify(run1) === JSON.stringify(run2));
  var run3 = runSpawns(9999, 12);
  ok("a different seed produces a different spawn sequence through the real spawnEnemy()",
     JSON.stringify(run1) !== JSON.stringify(run3));
  var variety = {}; run1.concat(run3).forEach(function (r) { variety[r.entry] = true; });
  ok("both entrance flavours are actually reachable (the crash odds still resolve from RNG, not a stuck value)",
     Object.keys(variety).length === 2, "saw: " + Object.keys(variety).join(", "));
  // Which of the arena's four edges a spawn lands on is read straight off x/z
  // (side 0/1 pin z near +-(A-0.8), side 2/3 pin x there instead) rather than
  // recorded separately, so a mutant that hardcodes `side` still gets caught
  // here even though it leaves the seed-reproducibility checks above green.
  var sides = {};
  run1.forEach(function (r) {
    sides[Math.abs(r.z + (BAL_ARENA - 0.8)) < 0.01 ? "z-" : Math.abs(r.z - (BAL_ARENA - 0.8)) < 0.01 ? "z+"
      : Math.abs(r.x + (BAL_ARENA - 0.8)) < 0.01 ? "x-" : "x+"] = true;
  });
  ok("more than one arena edge is actually reached across a 12-enemy run",
     Object.keys(sides).length > 1, "saw: " + Object.keys(sides).join(", "));
}

/* =========================================================================
   PART 3 · NO SHIPPED GAME FILE CALLS Math.random DIRECTLY
   ========================================================================= */
console.log("\n[static: no shipped game file calls Math.random directly]");
{
  var GAMES_DIR = path.join(ROOT, "games");
  var offenders = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (ent) {
      var p = path.join(dir, ent.name);
      if (ent.isDirectory()) { walk(p); return; }
      // Harness/tooling files (this repo's own convention: an underscore-
      // prefixed .js beside a game) are Node-side test scripts that never
      // run inside a player's game — exempt by design, not by oversight.
      if (ent.name.startsWith("_")) return;
      if (!/\.(html|js)$/.test(ent.name)) return;
      if (/\/versions\//.test(p)) return;   // archived builds, not the live game
      var src = fs.readFileSync(p, "utf8");
      if (/Math\.random\s*\(/.test(src)) offenders.push(path.relative(ROOT, p));
    });
  })(GAMES_DIR);

  /* SCOPED TO THIS CARD'S ACTUAL DONE WHEN, which is the Proving Ground
     (items 1-3 name it explicitly; the card's own "WHAT IS KNOWN" claims
     "the 2D v2 games... call it zero times" — checked here, not assumed,
     and it turned out to be WRONG). Widening the assertion to every game
     file would fail on a pre-existing call this card never touched and was
     not asked to fix — that is the exact "waive with no reason" failure
     `_strike.js`'s own ALLOWED list exists to refuse, run in reverse. */
  var inScope = offenders.filter(function (f) { return f.indexOf("proving-ground") === 0; });
  var outOfScope = offenders.filter(function (f) { return f.indexOf("proving-ground") !== 0; });
  ok("no Proving Ground file (html or non-underscore .js) calls Math.random",
     inScope.length === 0, inScope.join(", "));
  if (outOfScope.length) {
    console.log("  ~ FOUND, NOT FIXED (out of scope for VR-203, card names Proving Ground only): "
      + outOfScope.join(", ") + " — the card's own claim that the 2D v2 games call Math.random zero"
      + " times is false for at least this one file. Reported as debt for a future card, not failed here.");
  }
}

console.log("\n==========================================================");
console.log((fails.length ? "FAIL" : "PASS") + " — " + pass + " checks" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
