/* VEILRUN — shared hit-stop harness (VR-198)

   WHAT THIS PROTECTS. `games/_engine/hitstop.js` is the budgeted freeze channel
   both the 3D arena (Proving Ground) and one 2D v2 game (`pair-level-v2`) now
   drive their shared clock's `scale` from, instead of Proving Ground hand-
   rolling its own bare `game.hitStop` bypass and the 2D track having nothing
   like it at all — a turret hit there used to be a floating "HIT" and a
   camera shake with no held frame, the confirmation Proving Ground's own hits
   have always carried.

   IT REQUIRES THE REAL MODULE. `hitstop.js` is plain, dependency-free JS with
   no DOM and no game state — a straight `require()` runs the actual class,
   the `_clock.js`/`_motion.js`/`_bus.js` shape, never a retyped copy.

   SECTION 4 LIFTS THE REAL CONSUMER WIRING out of both HTML files, the
   `_floattext.js` Section 4 shape — never asserted from a comment, always
   from the actual source text that ships.

   SECTION 5 IS THE MUTATION PASS. Three one-line mutations against the
   module's own source — the latch turned into a sum, the cap removed, the
   countdown left unclamped below zero — evaled in their own sandbox, each
   proven to diverge from the real class on a scenario the real class gets
   right. A bar that cannot fail is not a bar.

   Dependency-free. Run:  node _hitstop.js
   ---------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");

var checks = 0, fails = [];
function ok(name, cond, detail) {
  checks++;
  if (!cond) fails.push(name + (detail ? "  — " + detail : ""));
}

console.log("\nVEILRUN · shared hit-stop harness (VR-198)\n" + "=".repeat(58));

var MODPATH = path.join(__dirname, "games", "_engine", "hitstop.js");
var SRC = fs.readFileSync(MODPATH, "utf8");
var HitStop = require(MODPATH).HitStop;

/* =========================================================================
   1 · SHAPE & DEFAULTS
   ========================================================================= */
console.log("\n[shape & defaults]");
ok("module exports a HitStop constructor", typeof HitStop === "function");
{
  var h = new HitStop();
  ok("default cap is 0.44s (twice the largest real call site, 220ms)", h.cap === 0.44, h.cap);
  ok("time starts at 0 (not active)", h.time === 0, h.time);
  ok("active() is false with no time on the clock", h.active() === false);

  var h2 = new HitStop(0.1);
  ok("opts override cap", h2.cap === 0.1, h2.cap);
}

/* =========================================================================
   2 · raise() — LATCH, NOT A SUM, AND A HARD CAP
   ========================================================================= */
console.log("\n[raise() — latch, not a sum]");
{
  var h = new HitStop();
  h.raise(70);
  ok("raise(70) sets time to 0.07s", Math.abs(h.time - 0.07) < 1e-9, h.time);

  h.raise(46);
  ok("a SMALLER raise never shortens an active freeze (max, not overwrite)",
     Math.abs(h.time - 0.07) < 1e-9, h.time);

  h.raise(90);
  ok("a LARGER raise extends it — still the max, never the sum (0.07+0.09 would be 0.16)",
     Math.abs(h.time - 0.09) < 1e-9, h.time);

  var h2 = new HitStop();
  h2.raise(1000);
  ok("a raise past the cap is clamped to the cap, not honoured in full",
     Math.abs(h2.time - h2.cap) < 1e-9, h2.time);

  var h3 = new HitStop();
  h3.raise(0);
  ok("raise(0) is a no-op", h3.time === 0, h3.time);
  h3.raise(-50);
  ok("a negative raise is a no-op, not a negative latch", h3.time === 0, h3.time);
}

/* =========================================================================
   3 · update() — REAL TIME ONLY, NEVER BELOW ZERO
   ========================================================================= */
console.log("\n[update() — real time, floors at zero]");
{
  var h = new HitStop();
  h.raise(100);           // 0.1s
  h.update(0.04);
  ok("update(dt) decrements by real dt", Math.abs(h.time - 0.06) < 1e-9, h.time);
  ok("still active with time remaining", h.active() === true);

  h.update(0.10);         // overshoots the remainder
  ok("update() never goes negative — floors at exactly 0", h.time === 0, h.time);
  ok("no longer active once the countdown reaches 0", h.active() === false);

  var h2 = new HitStop();
  ok("update() with nothing active does not throw and stays at 0",
     (function () { try { h2.update(0.5); return h2.time === 0; } catch (e) { return false; } })());
}

/* =========================================================================
   4 · reset()
   ========================================================================= */
console.log("\n[reset()]");
{
  var h = new HitStop();
  h.raise(200);
  h.reset();
  ok("reset() drops any live countdown immediately", h.time === 0 && h.active() === false);
}

/* =========================================================================
   5 · THE CONSUMERS — lifted out of the real HTML, never a retyped copy
   ========================================================================= */
console.log("\n[Proving Ground wires the real module]");
var PG_PATH = path.join(__dirname, "games", "proving-ground", "index.html");
var pgHtml = fs.readFileSync(PG_PATH, "utf8");
{
  ok("hitstop.js is loaded by proving-ground/index.html",
     /<script src="\.\.\/_engine\/hitstop\.js"><\/script>/.test(pgHtml));
  ok("Proving Ground constructs a VE.HitStop channel",
     /var HITSTOP = new VE\.HitStop\(\);/.test(pgHtml));
  ok("hitStop(ms) delegates to it rather than a hand-rolled bypass",
     /function hitStop\(ms\) \{ HITSTOP\.raise\(ms\); \}/.test(pgHtml));
  ok("the frame loop drives CLOCK.scale from HITSTOP.active(), never a bare game.hitStop check",
     /CLOCK\.scale = HITSTOP\.active\(\) \? 0 : 1;/.test(pgHtml));
  ok("the dead game.hitStop field is gone from game state, not left stale beside the real channel",
     !/hitStop:\s*0/.test(pgHtml));
  ok("resetRun() clears the channel via the real reset(), not a hand-rolled zero",
     /HITSTOP\.reset\(\);/.test(pgHtml));
  ok("the strike call site still calls hitStop(ms) unchanged (78 heavy / 46 light)",
     /hitStop\(player\.atkStage === 2 \? 78 : 46\);/.test(pgHtml));
  ok("every other real call site still calls hitStop(ms) unchanged (90 execute, 130 exec-kill, 55 kill, 70 hurt, 220 death)",
     [90, 130, 55, 70, 220].every(function (ms) {
       return new RegExp("hitStop\\(" + ms + "\\)").test(pgHtml);
     }));
}

console.log("\n[pair-level-v2 raises one on a real gameplay event]");
var PL2_PATH = path.join(__dirname, "games", "pair-level-v2", "index.html");
var pl2Html = fs.readFileSync(PL2_PATH, "utf8");
{
  ok("hitstop.js is loaded by pair-level-v2/index.html",
     /<script src="\.\.\/_engine\/hitstop\.js"><\/script>/.test(pl2Html));
  ok("pair-level-v2 constructs a VE.HitStop channel",
     /var HITSTOP=new VE\.HitStop\(\);/.test(pl2Html));
  ok("pair-level-v2 raises it at the turret-hit call site (not just constructs it)",
     /HITSTOP\.raise\(90\); softReset\(\);/.test(pl2Html));
  ok("pair-level-v2's frame loop drives CLOCK.scale from HITSTOP.active(), the same contract as Proving Ground",
     /CLOCK\.scale=HITSTOP\.active\(\)\?0:1;/.test(pl2Html));
  ok("pair-level-v2 ticks HITSTOP every frame, not only while state===\"play\"",
     /HITSTOP\.update\(clk\.raw\);/.test(pl2Html));
}

/* =========================================================================
   6 · NEVER SCALED BY THE MOTION GROUP — the `:3763` ruling, by construction
   ========================================================================= */
console.log("\n[never scaled by the motion group]");
ok("hitstop.js itself never reads MOTION — the freeze cannot be an accessibility edit",
   !/\bMOTION\b/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, "")));
ok("no real call site multiplies a hitStop(...) argument by a MOTION channel (Proving Ground)",
   !/hitStop\([^)]*MOTION/.test(pgHtml));
ok("no real call site multiplies a HITSTOP.raise(...) argument by a MOTION channel (pair-level-v2)",
   !/HITSTOP\.raise\([^)]*MOTION/.test(pl2Html));

/* =========================================================================
   7 · MUTATION PASS — three one-line breaks, each proven to diverge
   ========================================================================= */
console.log("\n[mutation pass — a bar that cannot fail is not a bar]");

function evalMutant(mutatedSrc) {
  var sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(mutatedSrc, sandbox, { filename: "hitstop.js#mutant" });
  return sandbox.module.exports.HitStop;
}

{
  // Mutant A: the latch becomes a SUM.
  var srcSum = SRC.replace(
    "this.time = Math.max(this.time, s);",
    "this.time = this.time + s;"
  );
  ok("mutant A source actually changed (anchor still matches)", srcSum !== SRC);
  var HitStopSum = evalMutant(srcSum);
  var hs = new HitStopSum();
  hs.raise(70); hs.raise(46);
  ok("MUTANT KILLED — summing instead of latching turns two close hits into a longer freeze than either",
     Math.abs(hs.time - 0.116) < 1e-9, "mutant time " + hs.time + " (real class holds at 0.07)");
}
{
  // Mutant B: the cap is removed.
  var srcNoCap = SRC.replace(
    "s = Math.min(s, this.cap);",
    "// cap removed"
  );
  ok("mutant B source actually changed (anchor still matches)", srcNoCap !== SRC);
  var HitStopNoCap = evalMutant(srcNoCap);
  var hn = new HitStopNoCap();
  hn.raise(1000);
  ok("MUTANT KILLED — removing the cap lets a single raise freeze the game for a full second",
     hn.time === 1, "mutant time " + hn.time + " (real class caps at " + new HitStop().cap + ")");
}
{
  // Mutant C: update() no longer floors at zero.
  var srcNoFloor = SRC.replace(
    "this.time -= dt;\n    if (this.time < 0) this.time = 0;",
    "this.time -= dt;"
  );
  ok("mutant C source actually changed (anchor still matches)", srcNoFloor !== SRC);
  var HitStopNoFloor = evalMutant(srcNoFloor);
  var hf = new HitStopNoFloor();
  hf.raise(10);            // 0.01s
  hf.update(0.5);
  ok("MUTANT KILLED — with no floor, a big dt drives time negative and active() never reports done",
     hf.time < 0, "mutant time " + hf.time + " (real class floors at 0)");
}

console.log("\n" + "=".repeat(58));
if (fails.length) {
  console.log("FAILED (" + fails.length + "):");
  fails.forEach(function (f) { console.log("  ✗ " + f); });
  console.log("\nFAIL — " + checks + " checks, " + fails.length + " failed.");
  process.exit(1);
}
console.log("PASS — " + checks + " checks");
