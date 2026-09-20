/* ============================================================================
 * VEILRUN — Shared action registry + per-genre profiles (VR-191)
 * ----------------------------------------------------------------------------
 * VR-46 §5 (8/9, `_Archive/2026-08-09 VR-46 first drafts/Reference Survey…`)
 * first ADOPTED one universal eight-action vocabulary — `VE.Controller`'s —
 * as the system-wide input contract for every surface, arena and narrative
 * included. No code ever followed that: Proving Ground shipped its own six
 * actions (strike/execute/veilstep/stalk/camera/pause) and Rook Signal its
 * own three (choose/open/close), independently, before this card existed.
 * This module writes down what actually happened as the intended shape — a
 * REGISTRY of PROFILES, one per genre, rather than one list every genre has
 * to fit — reversing VR-46 §5's "one vocabulary" call into "one resolver,
 * three vocabularies." Full record: `_Project Knowledge/Action Registry &
 * Per-Genre Profiles (VR-191).md` (Claude Access, never this repo — §1).
 *
 * WHAT THIS OWNS: the three profiles' action names, labels and glyphs, and
 * `promptFor(action, profile)` — the resolver VR-46 §5 asked for and no
 * surface ever got. WHAT IT DOES NOT OWN: input devices, rebinding, or
 * last-used-device tracking (VR-190) — those consume this, they are not it.
 *
 * `promptFor` returns `null` for an action a profile does not carry, rather
 * than a made-up label. A genre's kit is exactly its profile's keys, no more
 * — the same discipline `VE.Motion.Impulse` applies to a scale it was never
 * given (VR-199): say nothing instead of guessing.
 *
 * UMD-lite: a `<script src="../_engine/actions.js">` sets `window.VE.Actions`;
 * `require("../_engine/actions.js")` in Node returns the same object for a
 * harness to read the real profiles and drive the real resolver — no DOM, no
 * game state, nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Actions = mod; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  /* 2D pair track — VE.Controller's eight, unchanged, lifted to system level
     rather than retyped: move/jump are the stick, the rest are the six-button
     row every v2 game already relabels per character. */
  var PLATFORMER = {
    move:      { label: "Move",      glyph: null },
    jump:      { label: "Jump",      glyph: null },
    primary:   { label: "Primary",   glyph: null },
    secondary: { label: "Secondary", glyph: null },
    signature: { label: "Signature", glyph: null },
    interact:  { label: "Interact",  glyph: null },
    switch:    { label: "Switch",    glyph: null },
    reset:     { label: "Reset",     glyph: null }
  };

  /* 3D arena — Proving Ground's six. Glyphs name the real icon-sprite ids
     already in games/proving-ground/index.html (`#i-strike` etc.) rather
     than inventing a second icon set; camera and pause draw their own chrome
     and carry no sprite id today. */
  var ARENA = {
    strike:   { label: "Strike",   glyph: "i-strike" },
    execute:  { label: "Execute",  glyph: "i-exec" },
    veilstep: { label: "Veilstep", glyph: "i-step" },
    stalk:    { label: "Stalk",    glyph: "i-stalk" },
    camera:   { label: "Camera",   glyph: null },
    pause:    { label: "Pause",    glyph: null }
  };

  /* Narrative — Rook Signal's three. Smallest profile on purpose: a branching
     story has a fraction of an arena's verbs and forcing it onto a bigger
     vocabulary is exactly the REJECT VR-46 §5 already made ("per-game control
     schemes"), just aimed the other direction — a genre padded with unbound
     actions it will never call. */
  var NARRATIVE = {
    choose: { label: "Choose", glyph: null },
    open:   { label: "Open",   glyph: null },
    close:  { label: "Close",  glyph: null }
  };

  var PROFILES = { "2d-platformer": PLATFORMER, "3d-arena": ARENA, "narrative": NARRATIVE };

  function promptFor(action, profile) {
    var p = PROFILES[profile];
    if (!p || !Object.prototype.hasOwnProperty.call(p, action)) return null;
    return p[action];
  }

  return { PROFILES: PROFILES, promptFor: promptFor };
});
