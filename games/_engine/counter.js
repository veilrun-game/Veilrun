/* ============================================================================
 * VEILRUN — Shared easing counter: a number that ticks instead of snapping (VR-206)
 * ----------------------------------------------------------------------------
 * Every number on the site currently writes its final value straight into the
 * DOM — the run-over score, kills and executes, the leaderboard, the Game
 * Reference stat line, contribution points. Jordan, 9/13: "moments of
 * delight… they can even be little things that are just super satisfying for
 * users." A number that jumps reads as a total; one that ticks reads as a
 * reward. This is the one shared utility any readout can use instead of
 * hand-rolling its own tween.
 *
 * WHAT THIS OWNS: `from`/`to`/`duration`/`onDone`, the easing curve, and
 * landing EXACTLY on the target — never `99.999`, because `update()` always
 * writes `this.value = this.to` on the frame it finishes rather than trusting
 * float accumulation to arrive there on its own. WHAT IT DOES NOT OWN: the
 * DOM. A Counter is a number; the caller reads `.value` and writes it however
 * its own readout is built (a `textContent`, a bar's width, a canvas draw) —
 * same split `VE.Motion.Impulse` draws between the decay math and the render.
 *
 * DRIVEN BY WALL TIME, NOT SIM TIME, ON PURPOSE. The moment this exists to
 * animate — a run-over screen — is exactly when a game's own sim may be
 * frozen (hitstop, a pause). `update(dt)` takes whatever `dt` the caller
 * passes; it is the caller's job to pass real elapsed time for a readout that
 * must keep moving through a freeze, and never sim time for one that should not.
 *
 * A RETARGET DOES NOT FIGHT THE TWEEN ALREADY RUNNING. `animateTo()` always
 * takes the counter's CURRENT animated value as the new start — never the
 * value it was thinking of when the old tween began — so a target that
 * changes mid-count redirects smoothly instead of snapping back and re-tweening
 * from scratch. Two calls to `animateTo()` three frames apart must look like
 * one smooth correction, not two tweens racing each other.
 *
 * REDUCED MOTION IS "INSTANT AND CORRECT", NEVER "NO NUMBER". This module
 * does not read a reduced-motion flag itself — same discipline `Impulse`
 * follows for its own scale — the caller decides and reaches for `skip()`,
 * the hard skip-to-final DONE WHEN #1 asks for, which lands the value and
 * fires `onDone` on the same tick rather than leaving a reader wondering
 * whether the animation merely hasn't started.
 *
 * UMD-lite, same contract as `motion.js`/`bus.js`: `<script
 * src="../_engine/counter.js">` sets `window.VE.Counter`;
 * `require("../_engine/counter.js")` in Node returns `{ Counter: Counter }`
 * so a harness drives the real class directly — no DOM, no game state,
 * nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Counter = mod.Counter; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  function Counter(initial) {
    this.value = initial || 0;
    this.from = this.value;
    this.to = this.value;
    this.t = 0;
    this.duration = 0;
    this.active = false;
    this.onDone = null;
  }

  /* Starts (or RETARGETS) a tween toward `target`. `opts.duration` defaults
     to 0.6s. `opts.onDone` replaces any pending callback from an in-flight
     tween — the old one never fires, because the count it was waiting for
     was superseded, not completed. A target equal to the current value (or a
     duration of 0) resolves immediately, synchronously, same tick. */
  Counter.prototype.animateTo = function (target, opts) {
    opts = opts || {};
    var duration = opts.duration != null ? opts.duration : 0.6;
    this.from = this.value;      // always the CURRENT value — this is the retarget guarantee
    this.to = target;
    this.t = 0;
    this.duration = duration;
    this.onDone = opts.onDone || null;
    if (duration <= 0 || this.to === this.from) {
      this._land();
    } else {
      this.active = true;
    }
  };

  /* Advances the tween by `dt` seconds of WALL time and returns the current
     value. A no-op returning the settled value once nothing is animating —
     safe to call every frame regardless of whether a tween is in flight. */
  Counter.prototype.update = function (dt) {
    if (!this.active) return this.value;
    this.t += dt;
    if (this.t >= this.duration) { this._land(); return this.value; }
    var p = this.duration > 0 ? this.t / this.duration : 1;
    this.value = this.from + (this.to - this.from) * easeOutCubic(p);
    return this.value;
  };

  /* The hard skip-to-final. Lands on `to` and fires `onDone` immediately —
     the reduced-motion path, and any place a screen closes mid-count and the
     final total still has to be correct on screen. A no-op (returns the
     settled value) when nothing is animating. */
  Counter.prototype.skip = function () {
    if (!this.active) return this.value;
    return this._land();
  };

  Counter.prototype._land = function () {
    this.value = this.to;
    this.from = this.to;
    this.t = this.duration;
    this.active = false;
    var cb = this.onDone;
    this.onDone = null;
    if (cb) cb(this.value);
    return this.value;
  };

  Counter.ease = easeOutCubic;

  return { Counter: Counter };
});
