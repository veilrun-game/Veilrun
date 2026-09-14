/* VEILRUN — shared clock harness (VR-189)

   WHAT THIS IS. `games/_engine/clock.js` is the fixed-timestep clock both the
   3D track (Proving Ground) and one 2D v2 game (`pair-level-v2`) now drive
   their simulation from, instead of each hand-rolling its own accumulator (or,
   for the 2D track before this card, having no accumulator at all — physics
   ran once per `requestAnimationFrame`, faster on a 144Hz display than a 60Hz
   one). This harness proves the shared module rather than either consumer.

   IT REQUIRES THE REAL FILE. `clock.js` is plain, dependency-free JS with no
   DOM and no game state, so there is nothing to stub and no reason to lift a
   copy the way `_strike.js` has to for code trapped inside an HTML file — a
   straight `require()` runs the actual class.

   PHASE 3 IS THE MUTATION PASS THE CARD ASKS FOR ("fails with the clamp
   removed"), run rather than reasoned about. It reads the module's own source
   text, applies four targeted one-line mutations — the MAXSTEPS cap gone, the
   wall-clock CLAMP gone, the VR-117 true-delta/clamp split collapsed, `scale`
   ignored — evals each mutant in its own sandbox, and asserts a scenario that
   is well-behaved against the real class comes out WRONG against every one of
   them. A bar that cannot fail is not a bar.

   Dependency-free. Run:  node _clock.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var CLOCK_PATH = path.join(__dirname, "games", "_engine", "clock.js");
var SRC = fs.readFileSync(CLOCK_PATH, "utf8");
var Clock = require(CLOCK_PATH).Clock;

/* =========================================================================
   1 · SHAPE & DEFAULTS
   ========================================================================= */
{
  ok("module exports a Clock constructor", typeof Clock === "function");
  var c = new Clock();
  ok("default STEP is 1/60", c.STEP === 1 / 60, c.STEP);
  ok("default MAXSTEPS is 5", c.MAXSTEPS === 5, c.MAXSTEPS);
  ok("default CLAMP is 0.25", c.CLAMP === 0.25, c.CLAMP);
  ok("default scale is 1 (normal speed)", c.scale === 1, c.scale);
  ok("acc starts at 0", c.acc === 0, c.acc);
  ok("gameTime starts at 0", c.gameTime === 0, c.gameTime);
  ok("last starts null (no frame seen yet)", c.last === null, c.last);

  var o = new Clock({ step: 1 / 30, maxSteps: 8, clamp: 0.5, scale: 0.5 });
  ok("opts override STEP", o.STEP === 1 / 30, o.STEP);
  ok("opts override MAXSTEPS", o.MAXSTEPS === 8, o.MAXSTEPS);
  ok("opts override CLAMP", o.CLAMP === 0.5, o.CLAMP);
  ok("opts override scale", o.scale === 0.5, o.scale);
}

/* =========================================================================
   2 · tick() — the VR-117 true-delta / clamp split
   ========================================================================= */
{
  var c = new Clock();
  var t1 = c.tick(1000);
  ok("first tick reports zero elapsed (nothing to measure against yet)",
     t1.trueDt === 0 && t1.raw === 0, JSON.stringify(t1));

  var t2 = c.tick(1016.6666666666667);           // one real 60Hz frame later
  ok("normal frame: raw equals trueDt (below the clamp)",
     Math.abs(t2.raw - t2.trueDt) < 1e-12, JSON.stringify(t2));
  ok("normal frame: trueDt matches the real gap", Math.abs(t2.trueDt - 1 / 60) < 1e-9, t2.trueDt);

  var t3 = c.tick(11016.6666666666667);          // a 10-second stall (tab switch)
  ok("stall: trueDt reports the FULL unclamped gap", Math.abs(t3.trueDt - 10) < 1e-6, t3.trueDt);
  ok("stall: raw is clamped to CLAMP", t3.raw === 0.25, t3.raw);
  ok("stall: trueDt and raw genuinely differ (the split is not a no-op)",
     t3.trueDt !== t3.raw);

  var t4 = c.tick(11116.6666666666667);          // next frame after the stall
  ok("last tracks real time through a stall (no teleport on the frame after)",
     Math.abs(t4.trueDt - 0.1) < 1e-6, t4.trueDt);
}

/* =========================================================================
   3 · accumulate() — fixed step, MAXSTEPS cap, scale
   ========================================================================= */
{
  var STEP = 1 / 60;

  var c = new Clock();
  var n0 = c.accumulate(STEP * 0.4, function () {});
  ok("a fraction of a STEP runs zero steps", n0 === 0, n0);
  ok("...and the remainder sits in acc", Math.abs(c.acc - STEP * 0.4) < 1e-12, c.acc);

  var c1 = new Clock();
  var seen = [];
  var n1 = c1.accumulate(STEP, function (dt) { seen.push(dt); });
  ok("exactly one STEP runs exactly one step", n1 === 1, n1);
  ok("stepFn is called with STEP itself", seen[0] === STEP, seen[0]);
  ok("acc rolls back to ~0 after consuming exactly one STEP", Math.abs(c1.acc) < 1e-12, c1.acc);
  ok("gameTime advances by exactly one STEP", Math.abs(c1.gameTime - STEP) < 1e-12, c1.gameTime);

  var c2 = new Clock();
  var n2count = 0;
  var n2 = c2.accumulate(STEP * 3.5, function () { n2count++; });
  ok("three and a half STEPs runs three steps, keeps the half", n2 === 3 && n2count === 3, n2);
  ok("...and half a STEP remains in acc", Math.abs(c2.acc - STEP * 0.5) < 1e-9, c2.acc);

  var c3 = new Clock();
  var n3 = c3.accumulate(1.0, function () {});    // 60 STEPs owed, far past MAXSTEPS=5
  ok("a huge debt is capped at MAXSTEPS", n3 === 5, n3);
  ok("...and the remainder past MAXSTEPS is DISCARDED, not carried", c3.acc === 0, c3.acc);

  var c4 = new Clock();
  c4.accumulate(STEP * 0.5, function () {});
  var n4 = c4.accumulate(STEP * 0.5, function () {});
  ok("acc carries a sub-STEP remainder across separate accumulate() calls", n4 === 1, n4);

  var c5 = new Clock();
  ok("accumulate with no stepFn does not throw", (function () {
    try { c5.accumulate(STEP, undefined); return true; } catch (e) { return false; }
  })());

  var c6 = new Clock(); c6.scale = 0;
  var n6 = c6.accumulate(1.0, function () {});
  ok("scale 0 (frozen — hit-stop) runs zero steps regardless of dt", n6 === 0, n6);
  ok("scale 0 leaves acc untouched (a frozen frame costs the sim nothing)", c6.acc === 0, c6.acc);

  /* dt kept small ON PURPOSE. A 1.0s dt at scale 0.5 owes thirty steps, hits
     MAXSTEPS and resets acc to 0 by design — so the original form of this
     assertion was measuring the CAP while claiming to measure the scale, and
     failed against a module that was behaving correctly. 0.04s at scale 0.5
     owes exactly one step and leaves a measurable remainder. */
  var c7 = new Clock(); c7.scale = 0.5;
  var n7 = c7.accumulate(0.04, function () {});
  ok("scale 0.5 (slow-motion) adds dt*scale to acc, not dt",
     n7 === 1 && Math.abs(c7.acc - (0.02 - STEP)) < 1e-12, c7.acc);

  var c7b = new Clock(); c7b.scale = 0.5;
  var n7b = c7b.accumulate(1.0, function () {});
  ok("a scaled dt still obeys MAXSTEPS, and the overflow is DISCARDED not carried",
     n7b === 5 && c7b.acc === 0, n7b + " steps, acc " + c7b.acc);

  /* The exact fact CLAUDE.md §4 cites `_strike.js` for: `rec: 0.20` costs 13
     frames at this STEP, not 12, because twelve 1/60s do not sum to 0.20 in
     floating point. Proven here by SUMMING the module's own STEP the same
     number of times a real accumulate() loop would, not by asserting the
     textbook arithmetic. */
  var twelve = 0; for (var i = 0; i < 12; i++) twelve += STEP;
  ok("twelve STEPs sum to just under 0.20s (the floating-point fact _strike.js relies on)",
     twelve < 0.20, twelve);
  /* the 13-FRAME FACT BELONGS TO A COUNTDOWN, NOT TO THIS ACCUMULATOR, and
     conflating the two is what the original assertion here got wrong.
     `_strike.js` DECREMENTS a timer by STEP and asks when it reaches zero:
     twelve STEPs sum to 0.19999999999999998, so a 0.20s window costs a
     THIRTEENTH frame. accumulate() instead DRAINS a debt while `acc >= STEP`,
     so the same 0.20s runs TWELVE steps and carries ~4.9e-17 into the next
     frame. Same floating-point fact, opposite ends — so assert each in the
     shape it actually takes, and never assert one of the module doing the
     other. */
  var cd = 0.20, cdFrames = 0;
  while (cd > 0) { cd -= STEP; cdFrames++; }
  ok("a 0.20s countdown costs 13 frames, not 12 (the fact _strike.js relies on)",
     cdFrames === 13, cdFrames);

  var c8 = new Clock({ maxSteps: 100 });
  var n8 = c8.accumulate(0.20, function () {});
  ok("accumulate() drains that same 0.20s in 12 steps and CARRIES the remainder",
     n8 === 12 && c8.acc > 0 && c8.acc < 1e-15, n8 + " steps, acc " + c8.acc);
}

/* =========================================================================
   4 · MUTATION PASS — "fails with the clamp removed" (the card's own words)
   ========================================================================= */
function mutant(find, replace, label) {
  if (SRC.indexOf(find) === -1) {
    fails.push("mutation anchor lost for \"" + label + "\" — clock.js no longer contains: " + find);
    return null;
  }
  var src = SRC.split(find).join(replace);
  var sandbox = { module: { exports: {} }, console: console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "clock.js#" + label });
  return sandbox.module.exports.Clock;
}

{
  var STEP = 1 / 60;
  var Real = Clock;

  // -- A: remove the MAXSTEPS cap from the accumulator loop -----------------
  var MutA = mutant(
    "while (this.acc >= this.STEP && n < this.MAXSTEPS) {",
    "while (this.acc >= this.STEP) {",
    "maxsteps-cap-removed"
  );
  if (MutA) {
    var realA = new Real().accumulate(1.0, function () {});
    var mutA = new MutA().accumulate(1.0, function () {});
    ok("mutant A (MAXSTEPS cap removed) diverges from the real module",
       realA === 5 && mutA > 5, "real=" + realA + " mutant=" + mutA);
  }

  // -- B: remove the wall-clock CLAMP in tick() ------------------------------
  var MutB = mutant(
    "var raw = trueDt < this.CLAMP ? trueDt : this.CLAMP;",
    "var raw = trueDt;",
    "clamp-removed"
  );
  if (MutB) {
    var realC = new Real(); realC.tick(0); var realT = realC.tick(10000);
    var mutC = new MutB(); mutC.tick(0); var mutT = mutC.tick(10000);
    ok("mutant B (wall-clock CLAMP removed) diverges from the real module",
       realT.raw === 0.25 && mutT.raw > 9, "real.raw=" + realT.raw + " mutant.raw=" + mutT.raw);
  }

  // -- C: collapse the VR-117 true-delta / clamp split -----------------------
  var MutC = mutant(
    "return { trueDt: trueDt, raw: raw };",
    "return { trueDt: raw, raw: raw };",
    "true-delta-split-collapsed"
  );
  if (MutC) {
    var realD = new Real(); realD.tick(0); var rD = realD.tick(10000);
    var mutD = new MutC(); mutD.tick(0); var mD = mutD.tick(10000);
    ok("mutant C (true-delta/clamp split collapsed) diverges from the real module",
       rD.trueDt !== rD.raw && mD.trueDt === mD.raw,
       "real: trueDt=" + rD.trueDt + " raw=" + rD.raw + " | mutant: trueDt=" + mD.trueDt + " raw=" + mD.raw);
  }

  // -- D: ignore `scale` in the accumulator ----------------------------------
  var MutD = mutant(
    "this.acc += dt * this.scale;",
    "this.acc += dt;",
    "scale-ignored"
  );
  if (MutD) {
    var realE = new Real(); realE.scale = 0;
    var nE = realE.accumulate(1.0, function () {});
    var mutE = new MutD(); mutE.scale = 0;
    var nF = mutE.accumulate(1.0, function () {});
    ok("mutant D (scale ignored) diverges from the real module",
       nE === 0 && nF > 0, "real steps=" + nE + " mutant steps=" + nF);
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — shared clock: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
