/* ============================================================================
 * VEILRUN — shared seeded RNG (VR-203)
 * ----------------------------------------------------------------------------
 * `mulberry32` already existed, and it was already fully deterministic — it
 * just lived in `games/proving-ground/_arena.js` for the judge's own use,
 * while the game the judge judges called `Math.random` 11 times. So the
 * judge could reproduce a layout exactly and the arena a player actually got
 * could not be reproduced at all. This file is that same function, moved out
 * to where a game can reach it, so there is exactly one mulberry32 rather
 * than a second one written for the game side.
 *
 * NAMED STREAMS, NOT ONE SHARED GENERATOR. A single global generator would
 * make every system's draw count part of every other system's sequence — add
 * one more particle burst and every enemy spawn after it silently reseeds.
 * `Rng.stream(name)` lazily builds one mulberry32 per name, its seed derived
 * from the run seed XORed with a stable hash of the name, so streams can
 * never collide and are reproducible from the run seed alone: the SAME named
 * stream on the SAME run seed always produces the SAME sequence, and one
 * system's draws cannot shift another's.
 *
 * `Rng.pick(name)` is `stream(name)()` — the one-off convenience most call
 * sites want. `rand(a, b, stream)` in a game becomes
 * `a + rng.pick(stream) * (b - a)`.
 *
 * UMD-lite: a `<script src="../_engine/rng.js">` sets `window.VE.Rng`;
 * `require("../_engine/rng.js")` in Node returns the same object so a
 * harness can drive a real Rng and a real mulberry32 — no DOM, no game
 * state, nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Rng = mod.Rng; root.VE.mulberry32 = mod.mulberry32; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  /* Lifted verbatim from `_arena.js` — never a second copy. Deterministic: a
     judge (or a game) that gives a different sequence from the same seed is
     not seeded, it is a coin. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // A short, stable string hash — not cryptographic, just enough that two
  // different stream names almost never collide and the same name always
  // maps to the same offset.
  function hashName(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(h, 31) + name.charCodeAt(i)) | 0;
    return h;
  }

  function Rng(seed) {
    this.seed = seed >>> 0;
    this._streams = {};
  }
  Rng.prototype.stream = function (name) {
    var key = name || "default";
    if (!this._streams[key]) {
      this._streams[key] = mulberry32((this.seed ^ hashName(key)) >>> 0);
    }
    return this._streams[key];
  };
  Rng.prototype.pick = function (name) { return this.stream(name)(); };
  // Re-seed in place — a run restarting reseeds its RNG rather than
  // allocating a new one, and dropping the cached streams is what makes the
  // reseed actually take: a cached stream would otherwise keep drawing from
  // its old sequence forever.
  Rng.prototype.reseed = function (seed) { this.seed = seed >>> 0; this._streams = {}; return this; };

  return { mulberry32: mulberry32, Rng: Rng };
});
