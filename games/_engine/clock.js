/* ============================================================================
 * VEILRUN — Shared fixed-timestep clock (VR-189)
 * ----------------------------------------------------------------------------
 * Lifted out of Proving Ground, which had it right and kept it to itself:
 * `proving-ground/index.html` ran a fixed `STEP = 1/60` sim with an
 * accumulator, a max-steps clamp, and render decoupled from sim, while every
 * 2D pair-level v2 game just called its physics straight off
 * `requestAnimationFrame` — frame-rate dependent by construction, faster on a
 * 144Hz display than on a 60Hz one. This is that good version, generalised so
 * both tracks drive their simulation from ONE clock instead of two
 * (accidentally different) ideas of what a frame is.
 *
 * WHAT IT OWNS: the fixed step, the accumulator, the max-steps clamp, a
 * true-delta passthrough, and a `scale` input (0 frozen -> 1 normal) that a
 * consumer's hit-stop or slow-motion sets. WHAT IT DOES NOT OWN: hit-stop,
 * pause, and replay are each a CONSUMER of this clock, not a feature of it —
 * out of scope on purpose (VR-189's card). A game decides what freezes the
 * sim; this only decides how many fixed steps a frame is owed once told how
 * much of it counts.
 *
 * THE TRUE-DELTA / CLAMP SPLIT IS LOAD-BEARING (VR-117). `tick()` returns
 * `trueDt` — the UNCLAMPED wall-clock delta — before it computes the clamped
 * `raw` that feeds the accumulator. A perf sampler wants the frame the player
 * actually got; feeding it the clamped value would quietly record a 900ms
 * hitch as 250ms. Keep the two separate or the split lies.
 *
 * `rec: 0.20` costs THIRTEEN frames at this STEP, not twelve — twelve
 * 1/60s accumulate to 0.19999999999999998. That is exactly why this clock
 * runs `accumulate()` as a real while-loop against `this.STEP`, never a
 * `Math.ceil(seconds / STEP)` shortcut: the shortcut is arithmetic, this is
 * the game's own floating-point clock.
 *
 * UMD-lite: a `<script src="../_engine/clock.js">` sets `window.VE.Clock`;
 * `require("../_engine/clock.js")` in Node returns `{ Clock: Clock }` for a
 * harness to instantiate and drive directly — no DOM, no game state, nothing
 * to stub, so a harness runs the REAL class rather than lifting a copy out of
 * an HTML file the way `_strike.js` has to for code that isn't this portable.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Clock = mod.Clock; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  function Clock(opts) {
    opts = opts || {};
    this.STEP     = opts.step     != null ? opts.step     : 1 / 60;
    this.MAXSTEPS = opts.maxSteps != null ? opts.maxSteps : 5;
    this.CLAMP    = opts.clamp    != null ? opts.clamp    : 0.25;
    this.scale    = opts.scale    != null ? opts.scale    : 1;
    this.acc = 0;
    this.gameTime = 0;
    this.last = null;
  }

  /* One call per rendered frame. `now` is a performance.now()-style ms
     timestamp. Never touches the accumulator — call accumulate() with the
     `raw` this returns (or a policy-adjusted value) to actually step the sim.
     Safe to call every frame regardless of pause/hit-stop state: `last`
     tracks real time continuously so nothing teleports when a freeze ends. */
  Clock.prototype.tick = function (now) {
    if (this.last === null) this.last = now;
    var trueMs = now - this.last;
    this.last = now;
    var trueDt = trueMs / 1000;
    var raw = trueDt < this.CLAMP ? trueDt : this.CLAMP;
    return { trueDt: trueDt, raw: raw };
  };

  /* Feed `dt` seconds (normally `tick().raw`) into the accumulator, scaled by
     `this.scale`, and run `stepFn(this.STEP)` once per whole fixed step owed,
     advancing `this.gameTime` by exactly `this.STEP` each time. Capped at
     MAXSTEPS per call — past that the remainder is discarded, not carried,
     so a stall is a skip rather than a spiral of catch-up steps. Returns the
     number of steps actually run. `scale === 0` runs zero steps and leaves
     `acc` untouched, so a frozen frame costs the sim nothing and resumes
     clean the instant scale returns to 1. */
  Clock.prototype.accumulate = function (dt, stepFn) {
    var n = 0;
    this.acc += dt * this.scale;
    while (this.acc >= this.STEP && n < this.MAXSTEPS) {
      if (stepFn) stepFn(this.STEP);
      this.gameTime += this.STEP;
      this.acc -= this.STEP;
      n++;
    }
    if (n === this.MAXSTEPS) this.acc = 0;
    return n;
  };

  return { Clock: Clock };
});
