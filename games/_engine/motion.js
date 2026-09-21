/* ============================================================================
 * VEILRUN — Shared motion bus: reduced-motion scales + a camera impulse (VR-199)
 * ----------------------------------------------------------------------------
 * Lifted out of Proving Ground, which had it right and kept it to itself:
 * `MOTION_FULL` / `MOTION_RED` / `MOTION_KEYS` (VR-103) lived as literals in
 * one game's file, and `shake()` hand-rolled its own decay timer on `cam`.
 * Both move here so a second game gets the reduced-motion switch and the
 * camera-impulse decay for free instead of reinventing them.
 *
 * WHAT THIS OWNS: the MOTION_FULL/MOTION_RED scale data, and `Impulse` — a
 * decaying camera-shake channel with a magnitude, a fixed decay window and a
 * hard cap. WHAT IT DOES NOT OWN: fovKick(), bladeFlash(), ghost() and
 * banner() stay separate named functions in each game, per VR-103's own rule
 * ("give it a function, then multiply here, not at the call site") — this
 * card's own note says to keep that separation when lifting, so only the
 * DATA (MOTION_FULL/RED/KEYS) and the SHAKE channel move; the other four
 * channels keep reading `MOTION.<key>` as a plain scale multiplier wherever
 * they already live.
 *
 * THE CAP IS A LATCH, NOT A SUM. `raise(mag)` takes the MAX of whatever is
 * still decaying — it never adds to it. Two hits landing three frames apart
 * must not average into a WORSE shake than either hit alone, which is what
 * summing would do. `cap` is a second, harder ceiling on top of that: no
 * single raise, however large, can push the channel past it. Proving
 * Ground's own call sites top out at 0.5 (the wall break); the default cap
 * here is 1.0, twice that, so a future call site cannot exceed it by
 * accident and silently double what "as far as this can shake" has meant.
 *
 * UMD-lite: a `<script src="../_engine/motion.js">` sets `window.VE.Motion`;
 * `require("../_engine/motion.js")` in Node returns the same object for a
 * harness to read the real MOTION_FULL/MOTION_RED data and drive a real
 * Impulse — no DOM, no game state, nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Motion = mod; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* Reduced-motion channel scales, 0..1. MOTION_RED is not zeros across the
     board on purpose: `flash` floors the hit vignette at a still, readable
     tint rather than deleting it, and `fov` keeps a trace of the lens pull
     because it is how a player tells an Execute landing from a strike
     landing. `shake` and `ghost` and `banner` go fully to zero — screen
     jitter, afterimages and banner pops carry no information a damped
     player would be worse off without. */
  var MOTION_FULL = { shake: 1, fov: 1,    flash: 1,    ghost: 1, banner: 1 };
  var MOTION_RED  = { shake: 0, fov: 0.25, flash: 0.34, ghost: 0, banner: 0 };
  var MOTION_KEYS = ["shake", "fov", "flash", "ghost", "banner"];

  /* A camera-impulse channel. `raise(mag, scale)` latches to the max of what
     is already ticking down (never sums), clamps to `cap`, and does nothing
     at all once damped to zero — never starting a decay that then has to
     run down to nothing. `update(dt)` advances the decay and returns the
     CURRENT effective magnitude, using the post-decrement remaining time —
     call it once per rendered frame regardless of whether anything is
     active; it is a no-op return of 0 when nothing is decaying. */
  function Impulse(duration, cap) {
    this.duration = duration != null ? duration : 0.22;
    this.cap = cap != null ? cap : 1.0;
    this.time = 0;
    this.mag = 0;
  }
  Impulse.prototype.raise = function (mag, scale) {
    var m = mag * (typeof scale === "number" ? scale : 1);
    if (m <= 0) return;
    m = Math.min(m, this.cap);
    this.time = Math.max(this.time, this.duration);
    this.mag = Math.max(this.mag, m);
  };
  Impulse.prototype.update = function (dt) {
    if (this.time <= 0) return 0;
    this.time -= dt;
    var v = this.mag * clamp(this.time / this.duration, 0, 1);
    if (this.time <= 0) this.mag = 0;
    return v;
  };

  return { MOTION_FULL: MOTION_FULL, MOTION_RED: MOTION_RED, MOTION_KEYS: MOTION_KEYS, Impulse: Impulse };
});
