/* ============================================================================
 * VEILRUN — Shared hit-stop channel (VR-198)
 * ----------------------------------------------------------------------------
 * Lifted out of Proving Ground, which had it right and kept it to itself:
 * `game.hitStop` was a bare number the frame loop special-cased around
 * (`if (game.hitStop > 0) { game.hitStop -= raw; } else { CLOCK.accumulate
 * (...) }`), and the 2D v2 games had nothing like it — a turret hit there
 * registers as a floating "HIT" and a camera shake, never a held frame.
 *
 * WHAT THIS OWNS: a budgeted freeze with LATCH semantics — `raise(ms)` takes
 * the max of whatever is still counting down, never sums, so two hits
 * landing three frames apart cannot stack into a freeze the player reads as
 * a hang (VR-198 DONE WHEN #1). `cap` is a second, harder ceiling on top of
 * that: no single raise, however large, can push the channel past it —
 * Proving Ground's own call sites top out at 220ms (the death freeze); the
 * default cap here is 440ms, twice that, the same "twice the largest call
 * site" margin `Impulse` (../_engine/motion.js) uses for the same reason.
 *
 * WHAT THIS DELIBERATELY DOES NOT OWN: which clock it drives. `update(dt)`
 * takes real, UNSCALED time and returns nothing; a consumer reads `.active()`
 * afterward and sets ITS OWN clock's `scale` to 0 while active — this module
 * has no idea a `VE.Clock` (VR-189) exists. That split is why `update(dt)`
 * must be called with the raw per-frame delta, never a value already scaled
 * by the freeze it is about to decide: feeding it a pre-scaled dt would let
 * an active freeze prevent its own countdown from ever reaching zero.
 *
 * NEVER SCALED BY THE MOTION GROUP, AND THAT IS THE WHOLE POINT (`:3763`'s
 * ruling, now enforced by construction rather than commented). hitStop
 * freezes SIMULATION time; MOTION_FULL/MOTION_RED (`../_engine/motion.js`)
 * scale how much a channel MOVES. Reading MOTION into a hit-stop duration
 * would let an accessibility control change how long a strike window
 * actually lasts — the exact TUNE-reaches-BALANCE hazard `_billboard.js` was
 * written to catch. This file does not import, require or reference
 * `motion.js` at all, which is the property `_hitstop.js` greps for
 * directly rather than trusting a comment to stay true.
 *
 * UMD-lite: a `<script src="../_engine/hitstop.js">` sets `window.VE.HitStop`;
 * `require("../_engine/hitstop.js")` in Node returns `{ HitStop: HitStop }`
 * for a harness to instantiate and drive directly — no DOM, no game state,
 * nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.HitStop = mod.HitStop; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  function HitStop(cap) {
    this.cap = cap != null ? cap : 0.44;
    this.time = 0;
  }

  /* `ms` is milliseconds, matching every existing hitStop(ms) call site —
     converted to seconds once, here, so nothing downstream has to remember
     the unit. A non-positive raise is a no-op rather than a negative latch. */
  HitStop.prototype.raise = function (ms) {
    var s = ms / 1000;
    if (s <= 0) return;
    s = Math.min(s, this.cap);
    this.time = Math.max(this.time, s);
  };

  /* Real time only. Call once per rendered frame regardless of whether
     anything is active — a no-op when `time` is already 0. */
  HitStop.prototype.update = function (dt) {
    if (this.time <= 0) { this.time = 0; return; }
    this.time -= dt;
    if (this.time < 0) this.time = 0;
  };

  HitStop.prototype.active = function () { return this.time > 0; };

  HitStop.prototype.reset = function () { this.time = 0; };

  return { HitStop: HitStop };
});
