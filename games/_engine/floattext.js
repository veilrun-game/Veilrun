/* ============================================================================
 * VEILRUN — Shared floating combat text: a pooled, fixed-size readout (VR-201)
 * ----------------------------------------------------------------------------
 * Proving Ground answers "did my hit land" with a number on screen, and the
 * five other shipped games answer it with nothing — a hit's magnitude is
 * invisible everywhere else. This is the first shared version, so a second
 * genre reads a number instead of reinventing `floatNumber()`.
 *
 * WHAT THIS OWNS: the POOL — fixed size, a `.live` flag per slot, the same
 * shape as Proving Ground's own `ENEMIES[]`/`TELE[]` rather than a growable
 * array of DOM nodes. `spawn()` never grows the pool: once every slot is
 * live, the next spawn reuses the OLDEST live slot rather than allocating a
 * new one, so a burst larger than the cap cannot make the pool bigger than
 * the cap. `reset()` clears every slot synchronously — no `setTimeout` is
 * outstanding when it returns, so a game's own `resetRun()` can call it and
 * trust nothing outlives the call.
 *
 * WHAT THIS DOES NOT OWN: rendering. A slot is data — x/y/z, text, crit, age
 * — and `riseOf()`/`alphaOf()` hand back a rise offset and an opacity curve
 * for the caller to apply however its genre draws things: a DOM element
 * positioned by a 3D projection (Proving Ground) or a `ctx.fillText()` in
 * world space (a 2D game). Same split motion.js draws between `Impulse`
 * (data) and `shake()` (per-game render) — the lesson from that card was
 * keep the two separate, not fold rendering into the shared file.
 *
 * THE CURVE MATCHES THE SHIPPED `.fnum` KEYFRAME, ON PURPOSE. `LIFE`/`RISE`/
 * `FADE_IN` are the same 720ms / 46px / 18%-fade-in numbers already live in
 * `proving-ground/index.html`'s CSS, so wiring Proving Ground onto this pool
 * changes nothing on screen — DONE WHEN #2 on the card. They are exported as
 * constants rather than hidden inside the curve functions, so a harness (or
 * a second game) can read them instead of retyping them.
 *
 * CRIT IS NOT A COLOUR-ONLY CUE. That distinction is drawn where the caller
 * renders text (Proving Ground's `.fnum.crit` is 1.5rem against `.fnum`'s
 * 1rem — 50% larger, a size cue that survives colour removal); this module
 * only carries the `crit` flag through so a renderer has something to key
 * off besides a colour.
 *
 * UMD-lite, same contract as `bus.js`/`motion.js`: `<script
 * src="../_engine/floattext.js">` sets `window.VE.FloatText`;
 * `require("../_engine/floattext.js")` in Node returns `{ FloatText: FloatText }`
 * so a harness drives the real pool directly — no DOM, no game state, nothing
 * to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.FloatText = mod.FloatText; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  var LIFE = 0.72;      // seconds — matches the shipped `.fnum` keyframe (.7s + the old 720ms setTimeout)
  var RISE = 46;         // px risen over LIFE — matches the shipped keyframe's translateY(-46px)
  var FADE_IN = 0.18;     // fraction of LIFE spent fading in — matches the shipped keyframe's 18% stop

  function FloatText(cap) {
    if (!(cap > 0)) throw new Error("VE.FloatText: cap must be a positive number, got " + cap);
    this.cap = cap;
    this.slots = [];
    for (var i = 0; i < cap; i++) {
      this.slots.push({ live: false, x: 0, y: 0, z: 0, text: "", crit: false, age: 0, seq: 0 });
    }
    this._seq = 0;
  }

  FloatText.prototype.spawn = function (x, y, z, text, crit) {
    var slot = null;
    for (var i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].live) { slot = this.slots[i]; break; }
    }
    if (!slot) {
      // Every slot is live — reuse the OLDEST one. The pool's length never
      // changes; a burst bigger than `cap` just recycles faster.
      slot = this.slots[0];
      for (var j = 1; j < this.slots.length; j++) {
        if (this.slots[j].seq < slot.seq) slot = this.slots[j];
      }
    }
    slot.live = true;
    slot.x = x; slot.y = y; slot.z = z;
    slot.text = String(text);
    slot.crit = !!crit;
    slot.age = 0;
    slot.seq = ++this._seq;
    return slot;
  };

  FloatText.prototype.tick = function (dt) {
    for (var i = 0; i < this.slots.length; i++) {
      var s = this.slots[i];
      if (!s.live) continue;
      s.age += dt;
      if (s.age >= LIFE) s.live = false;
    }
  };

  FloatText.prototype.live = function () {
    var out = [];
    for (var i = 0; i < this.slots.length; i++) if (this.slots[i].live) out.push(this.slots[i]);
    return out;
  };

  // Synchronous and total — nothing is left "still counting down" for a
  // caller's own timer to clean up later.
  FloatText.prototype.reset = function () {
    for (var i = 0; i < this.slots.length; i++) this.slots[i].live = false;
  };

  FloatText.prototype.riseOf = function (slot) {
    return Math.min(1, slot.age / LIFE) * RISE;
  };

  FloatText.prototype.alphaOf = function (slot) {
    var p = Math.min(1, slot.age / LIFE);
    if (p < FADE_IN) return p / FADE_IN;
    return 1 - (p - FADE_IN) / (1 - FADE_IN);
  };

  FloatText.LIFE = LIFE;
  FloatText.RISE = RISE;
  FloatText.FADE_IN = FADE_IN;

  return { FloatText: FloatText };
});
