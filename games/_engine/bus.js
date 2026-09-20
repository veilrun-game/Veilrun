/* ============================================================================
 * VEILRUN — Shared synchronous event bus (VR-204)
 * ----------------------------------------------------------------------------
 * This is the structural fix for the failure `_exec.js` (VR-172) found by
 * hand: a missed Execute wrote nothing because the miss path had to remember
 * to call each observable ITSELF — hitStop, shake, the audio cue, the score
 * — and it called none of them. A verb that forgets one call site is a bug
 * that ships quietly. An event nobody forgot to publish removes the class of
 * bug, not just this one instance of it: `damageEnemy()` in Proving Ground
 * touches floating text, particle bursts and audio through three separate
 * call sites today; after this it makes ONE call — `emit("hit-landed", …)` —
 * and whichever systems care are subscribed, not threaded through by hand.
 *
 * WHAT IT OWNS: publish, subscribe, unsubscribe, and a fixed, named,
 * enumerable event set. WHAT IT DOES NOT OWN: it does not decide what an
 * event MEANS or who should listen — that is every consumer's own call, made
 * where the bus is instantiated with the event names it will carry.
 *
 * ⚠️ SYNCHRONOUS AND ORDERED, ON PURPOSE. `emit()` calls every subscriber
 * in registration order, in the same tick, before returning — never a
 * microtask, never a `setTimeout(0)`. Proving Ground runs a fixed-timestep
 * sim (`../_engine/clock.js`, VR-189); an async bus would let a hit's sound
 * or a hit's number land on a LATER frame than the hit itself, which is a
 * worse bug than the coupling this is meant to remove.
 *
 * ⚠️ THE EVENT SET IS NAMED, NOT FREE-FORM. A bus constructed with
 * `new Bus(["hit-landed"])` throws on `on()`/`emit()`/`off()` for anything
 * else. That is deliberate: a typo'd event string in a free-form bus fails
 * silently (the emit finds zero subscribers and nobody notices); here it
 * throws at the call site that got it wrong. It is also what makes the
 * event set ENUMERABLE — `bus.names()` — so a harness can walk every
 * declared event and assert it has at least one subscriber, the same way
 * `_exec.js` reads AU's method names out of the file instead of listing
 * them by hand. An event nobody listens to is a call site somebody forgot
 * to move, same as a mute AU method was audio nobody wired up.
 *
 * UNSUBSCRIBE IS SYMMETRIC. `on()` returns an unsubscribe function; calling
 * it (or `off(name, fn)` with the original reference) removes exactly that
 * listener and no other. `emit()` snapshots the subscriber list before
 * calling any of them, so a listener that unsubscribes ITSELF (or another
 * listener) mid-emit does not skip or double-fire a neighbour. `clear()`
 * drops every listener for one event, or every event if called with no
 * argument — the tool a game's `resetRun()` reaches for if it ever needs to
 * detach run-scoped listeners rather than the page-lifetime ones Proving
 * Ground uses today.
 *
 * UMD-lite, same contract as `clock.js`: `<script src="../_engine/bus.js">`
 * sets `window.VE.Bus`; `require("../_engine/bus.js")` in Node returns
 * `{ Bus: Bus }` so a harness drives the real class directly — no DOM, no
 * game state, nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Bus = mod.Bus; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  function Bus(eventNames) {
    this._listeners = {};
    var names = eventNames || [];
    for (var i = 0; i < names.length; i++) this._listeners[names[i]] = [];
  }

  Bus.prototype._known = function (name) {
    return Object.prototype.hasOwnProperty.call(this._listeners, name);
  };

  Bus.prototype._assertKnown = function (name, who) {
    if (!this._known(name)) {
      throw new Error("VE.Bus: '" + name + "' is not a declared event (" + who + "). " +
        "Declared: " + this.names().join(", "));
    }
  };

  /* The full, fixed event set this bus was constructed with. */
  Bus.prototype.names = function () {
    return Object.keys(this._listeners);
  };

  /* How many listeners a declared event currently has. Throws on an unknown
     name, same as on()/emit()/off() — there is no quiet way to ask about an
     event that was never declared. */
  Bus.prototype.subscriberCount = function (name) {
    this._assertKnown(name, "subscriberCount");
    return this._listeners[name].length;
  };

  /* Subscribe. Returns an unsubscribe function — call it (no arguments) to
     remove exactly this listener. Registration order is emit order. */
  Bus.prototype.on = function (name, fn) {
    this._assertKnown(name, "on");
    if (typeof fn !== "function") throw new Error("VE.Bus.on('" + name + "'): listener must be a function");
    this._listeners[name].push(fn);
    var self = this;
    var off = false;
    return function unsubscribe() {
      if (off) return;   // idempotent — calling it twice is a no-op, not a double-remove
      off = true;
      self.off(name, fn);
    };
  };

  /* Remove one listener by reference. A listener not currently subscribed
     is a silent no-op — the same tolerance the returned unsubscribe()
     function needs to stay idempotent. */
  Bus.prototype.off = function (name, fn) {
    this._assertKnown(name, "off");
    var arr = this._listeners[name];
    var i = arr.indexOf(fn);
    if (i !== -1) arr.splice(i, 1);
  };

  /* Publish. Every current listener for `name` is called once, synchronously,
     in subscription order, with `payload`. The listener list is snapshotted
     first, so a listener that subscribes or unsubscribes mid-emit affects
     only the NEXT emit, never this one in progress. */
  Bus.prototype.emit = function (name, payload) {
    this._assertKnown(name, "emit");
    var arr = this._listeners[name].slice();
    for (var i = 0; i < arr.length; i++) arr[i](payload);
  };

  /* Drop every listener for `name`, or for every declared event when called
     with no argument. What a run boundary (e.g. resetRun()) reaches for if
     it ever registers run-scoped listeners rather than page-lifetime ones. */
  Bus.prototype.clear = function (name) {
    if (name !== undefined) {
      this._assertKnown(name, "clear");
      this._listeners[name].length = 0;
    } else {
      for (var k in this._listeners) this._listeners[k].length = 0;
    }
  };

  return { Bus: Bus };
});
