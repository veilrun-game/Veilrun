/* VEILRUN — shared motion-bus harness (VR-199)

   WHAT THIS IS. `games/_engine/motion.js` is the shared reduced-motion scale
   data (`MOTION_FULL` / `MOTION_RED` / `MOTION_KEYS`, lifted out of Proving
   Ground where VR-103 first built them) plus `Impulse` — a decaying
   camera-shake channel any game can instantiate instead of hand-rolling its
   own timer on a `cam` object the way Proving Ground did before this card.
   This harness proves the shared module rather than either consumer;
   `games/proving-ground/_billboard.js` and `_exec.js` separately prove that
   the Proving Ground's own `shake()` still calls into it correctly.

   IT REQUIRES THE REAL FILE. `motion.js` is plain, dependency-free JS with no
   DOM and no game state, so there is nothing to stub — the same shape
   `_clock.js` and `_bus.js` already use for code portable enough not to need
   lifting out of an HTML file.

   THE CAP IS A LATCH, NOT A SUM, AND THAT IS THE PROPERTY THIS FILE MOST
   CARES ABOUT — a bus that summed two hits landing three frames apart would
   turn a burst into a WORSE shake than either hit alone, which is exactly
   the nausea the card was written to prevent. Section 2 proves the latch
   behaviour directly; Section 3 mutates the real source to prove the harness
   would actually catch it if the latch ever became a sum.

   Dependency-free. Run:  node _motion.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var MOTION_PATH = path.join(__dirname, "games", "_engine", "motion.js");
var SRC = fs.readFileSync(MOTION_PATH, "utf8");
var Motion = require(MOTION_PATH);

/* =========================================================================
   1 · SHAPE & DATA — MOTION_FULL / MOTION_RED / MOTION_KEYS
   ========================================================================= */
{
  ok("module exports MOTION_FULL", Motion.MOTION_FULL && typeof Motion.MOTION_FULL === "object");
  ok("module exports MOTION_RED", Motion.MOTION_RED && typeof Motion.MOTION_RED === "object");
  ok("module exports MOTION_KEYS", Array.isArray(Motion.MOTION_KEYS));
  ok("module exports the Impulse constructor", typeof Motion.Impulse === "function");

  var KEYS = Motion.MOTION_KEYS;
  ok("five named channels", KEYS.length === 5, KEYS.join(", "));
  ["shake", "fov", "flash", "ghost", "banner"].forEach(function (k) {
    ok("MOTION_KEYS names " + k, KEYS.indexOf(k) !== -1);
  });
  KEYS.forEach(function (k) {
    ok("MOTION_FULL." + k + " is a number in 0..1", typeof Motion.MOTION_FULL[k] === "number" &&
       Motion.MOTION_FULL[k] >= 0 && Motion.MOTION_FULL[k] <= 1);
    ok("MOTION_RED." + k + " is a number in 0..1", typeof Motion.MOTION_RED[k] === "number" &&
       Motion.MOTION_RED[k] >= 0 && Motion.MOTION_RED[k] <= 1);
  });
  ok("MOTION_FULL is full effect on every channel", KEYS.every(function (k) { return Motion.MOTION_FULL[k] === 1; }));

  // The two properties the card's DONE WHEN names by name.
  ok("reduced motion zeroes shake", Motion.MOTION_RED.shake === 0);
  ok("the hit vignette (flash) keeps a floor rather than going to zero",
     Motion.MOTION_RED.flash > 0, Motion.MOTION_RED.flash);
}

/* =========================================================================
   2 · THE IMPULSE CHANNEL — magnitude, decay, the cap
   ========================================================================= */
{
  var i = new Motion.Impulse();
  ok("default duration is 0.22s", i.duration === 0.22, i.duration);
  ok("default cap is 1.0", i.cap === 1.0, i.cap);
  ok("starts fully decayed", i.update(0) === 0);

  var j = new Motion.Impulse(0.5, 2);
  ok("opts override duration", j.duration === 0.5, j.duration);
  ok("opts override cap", j.cap === 2, j.cap);

  // damped to nothing never starts a decay
  var k = new Motion.Impulse();
  k.raise(0.5, 0);
  ok("a raise scaled to zero never starts a decay", k.update(0.001) === 0);
  var k2 = new Motion.Impulse();
  k2.raise(0, 1);
  ok("a zero-magnitude raise never starts a decay", k2.update(0.001) === 0);

  // decay curve: raise(1) at duration 0.22, tick in 0.02s steps, value should
  // ease from ~1 toward 0 and hit exactly 0 once the duration has elapsed.
  var d = new Motion.Impulse(0.22, 10);
  d.raise(1, 1);
  var v0 = d.update(0);                       // first tick: nothing has elapsed yet
  ok("immediately after raise, effective magnitude is (still) the full magnitude",
     Math.abs(v0 - 1) < 1e-9, v0);
  var last = v0;
  for (var t = 0; t < 10; t++) { var v = d.update(0.02); ok("decay step " + t + " never rises", v <= last + 1e-9, v + " vs " + last); last = v; }
  ok("fully decayed by the end of the duration", d.update(1) === 0);
  ok("stays at zero once decayed, not just at the instant it crossed", d.update(0.02) === 0 && d.update(0.02) === 0);

  // the cap
  var c = new Motion.Impulse(0.22, 1.0);
  c.raise(5, 1);
  ok("a single raise past the cap is clamped to the cap", c.update(0) === 1.0, c.update(0));

  // THE LATCH: max, never sum — a burst of raises never exceeds the largest one
  var latch = new Motion.Impulse(0.22, 10);
  latch.raise(0.1, 1); latch.raise(0.1, 1); latch.raise(0.1, 1);
  ok("three small raises in the same tick take the MAX, not the sum",
     Math.abs(latch.update(0) - 0.1) < 1e-9, latch.update(0));
  var latch2 = new Motion.Impulse(0.22, 10);
  latch2.raise(0.05, 1); latch2.raise(0.3, 1); latch2.raise(0.05, 1);
  ok("a burst of impulses stays under the largest single raise, whatever order they land in",
     Math.abs(latch2.update(0) - 0.3) < 1e-9, latch2.update(0));

  // a raise while already decaying re-latches to the max of old and new
  var re = new Motion.Impulse(0.22, 10);
  re.raise(0.3, 1);
  re.update(0.1);                              // partway through the decay
  re.raise(0.1, 1);                            // smaller — must not pull it down
  ok("a smaller raise mid-decay does not cut the existing shake short",
     re.time > 0.1 - 1e-9);
  var re2 = new Motion.Impulse(0.22, 10);
  re2.raise(0.1, 1);
  re2.raise(0.5, 1);                           // larger — must win, and restart the window
  ok("a larger raise mid-decay wins outright and restarts the decay window",
     re2.mag === 0.5 && re2.time === 0.22);
}

/* =========================================================================
   3 · MUTATION PASS — a bar that cannot fail is not a bar
   ========================================================================= */
{
  function mutant(find, replace, label) {
    if (SRC.indexOf(find) === -1) { fails.push("mutation target not found: " + label); return null; }
    var mutated = SRC.replace(find, replace);
    var sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    try { vm.runInContext(mutated, sandbox, { filename: "motion.js#" + label }); }
    catch (e) { fails.push("mutant " + label + " threw: " + e.message); return null; }
    return sandbox.module.exports;
  }

  // -- A: the latch summed instead of maxed --------------------------------
  var MutA = mutant("this.mag = Math.max(this.mag, m);", "this.mag = this.mag + m;", "latch-sums");
  if (MutA) {
    var realI = new Motion.Impulse(0.22, 10);
    realI.raise(0.1, 1); realI.raise(0.1, 1);
    var mutI = new MutA.Impulse(0.22, 10);
    mutI.raise(0.1, 1); mutI.raise(0.1, 1);
    ok("mutant A (latch sums instead of maxing) diverges from the real module",
       realI.update(0) === 0.1 && mutI.update(0) > 0.1,
       "real=" + realI.update(0) + " mutant=" + mutI.update(0));
  }

  // -- B: the cap removed ----------------------------------------------------
  var MutB = mutant("m = Math.min(m, this.cap);", "", "cap-removed");
  if (MutB) {
    var realC = new Motion.Impulse(0.22, 1.0); realC.raise(5, 1);
    var mutC = new MutB.Impulse(0.22, 1.0); mutC.raise(5, 1);
    ok("mutant B (cap removed) diverges from the real module",
       realC.update(0) === 1.0 && mutC.update(0) === 5,
       "real=" + realC.update(0) + " mutant=" + mutC.update(0));
  }

  // -- C: reduced motion no longer zeroes shake ------------------------------
  var MutC = mutant("var MOTION_RED  = { shake: 0, fov: 0.25, flash: 0.34, ghost: 0, banner: 0 };",
                     "var MOTION_RED  = { shake: 1, fov: 0.25, flash: 0.34, ghost: 0, banner: 0 };",
                     "reduced-shake-not-zeroed");
  if (MutC) {
    ok("mutant C (reduced motion no longer zeroes shake) diverges from the real module",
       Motion.MOTION_RED.shake === 0 && MutC.MOTION_RED.shake === 1,
       "real=" + Motion.MOTION_RED.shake + " mutant=" + MutC.MOTION_RED.shake);
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — shared motion bus: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
