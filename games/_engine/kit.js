/* ============================================================================
 * VEILRUN — Character kit schema (VR-185)
 * ----------------------------------------------------------------------------
 * One engine-neutral shape for a crew member's kit: verbs, costs, charges,
 * cones, ranges and clip names — so a second genre reads a character instead
 * of reimplementing it. Full write-up with Vesper as the worked example lives
 * in `_Project Knowledge/Character Kit Schema (VR-185).md` (Claude Access,
 * never this repo — CLAUDE.md §1); this file is the shape that doc describes.
 *
 * WHAT IT OWNS: the shape of a kit object and the rules that make one valid.
 * WHAT IT DOES NOT OWN: any character's actual numbers. Vesper's numbers stay
 * in `games/proving-ground/index.html`'s BALANCE/CLIPFIT blocks — those are
 * read by `_sim.js`, `_strike.js` and `_clipfit.js` today, and remain the
 * source `_kit.js` builds a kit object FROM, never a second place the same
 * number is retyped.
 *
 * A verb is either a single stage (range/arc/dmg/clip at the top level) or a
 * `stages` array for a chain like Vesper's 3-hit strike — each stage is
 * validated the same way. `clip` is the LITERAL animation name a game's GLB
 * must contain (e.g. "attack", not the engine's per-stage key "attack0");
 * `null` means the verb has no character animation (Veilstep and Shroud both
 * ship as VFX/audio only, see `games/proving-ground/index.html`).
 *
 * "No unaffordable cost" is read literally: every cost/timing number must be
 * finite and >= 0 (charges >= 1, paired with a rechargeSec > 0). An Infinity,
 * NaN or negative value is a verb that can never be paid, which is what makes
 * it unreachable — this schema has no notion of input bindings yet (VR-190),
 * so reachability is checked at the level of "can this ever fire," not
 * "is there a button for it."
 *
 * UMD-lite, same contract as `clock.js`/`bus.js`: `<script src="../_engine/kit.js">`
 * sets `window.VE.Kit`; `require("../_engine/kit.js")` in Node returns
 * `{ VERB_KINDS, validateKit }` so a harness drives the real functions
 * directly — no DOM, no game state, nothing to stub.
 * ==========================================================================*/
(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) { module.exports = mod; }
  if (root) { root.VE = root.VE || {}; root.VE.Kit = mod; }
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this), function () {
  "use strict";

  var VERB_KINDS = ["strike-chain", "dash", "execute", "passive-emerge"];

  function isFiniteNonNeg(n) {
    return typeof n === "number" && isFinite(n) && n >= 0;
  }

  function validateStage(stage, clipNames, errors, where) {
    if (!stage || typeof stage !== "object") { errors.push(where + ": missing"); return; }
    if (!isFiniteNonNeg(stage.range)) errors.push(where + ": range must be a finite number >= 0");
    if (!(typeof stage.arc === "number" && isFinite(stage.arc) && stage.arc >= 0 && stage.arc <= 360)) {
      errors.push(where + ": arc must be a finite number between 0 and 360");
    }
    if (!isFiniteNonNeg(stage.dmg)) errors.push(where + ": dmg must be a finite number >= 0");
    if (stage.clip !== null && stage.clip !== undefined) {
      if (clipNames.indexOf(stage.clip) === -1) {
        errors.push(where + ": clip '" + stage.clip + "' is not an animation in the GLB");
      }
    }
  }

  function validateCost(cost, where, errors) {
    if (cost === undefined || cost === null) return;
    if (cost.cooldownSec !== undefined && !isFiniteNonNeg(cost.cooldownSec)) {
      errors.push(where + ": cost.cooldownSec must be a finite number >= 0");
    }
    if (cost.charges !== undefined) {
      if (!(Number.isInteger(cost.charges) && cost.charges >= 1)) {
        errors.push(where + ": cost.charges must be an integer >= 1");
      }
      if (!(typeof cost.rechargeSec === "number" && isFinite(cost.rechargeSec) && cost.rechargeSec > 0)) {
        errors.push(where + ": a verb with charges needs a cost.rechargeSec > 0");
      }
    }
  }

  /* Returns an array of violation strings — empty means the kit is valid.
     `clipNames` is the set of animation names actually present in the
     character's GLB (see `_kit.js` for how Vesper's are read); pass [] to
     skip clip-existence checking (e.g. before an asset is merged). */
  function validateKit(kit, clipNames) {
    var errors = [];
    clipNames = clipNames || [];

    if (!kit || typeof kit.id !== "string" || !kit.id) {
      errors.push("kit.id must be a non-empty string");
      return errors;
    }
    if (!Array.isArray(kit.verbs) || kit.verbs.length === 0) {
      errors.push("kit.verbs must be a non-empty array");
      return errors;
    }

    var seen = {};
    kit.verbs.forEach(function (verb) {
      var label = (verb && verb.id) || "?";
      var where = "verb '" + label + "'";
      if (!verb || !verb.id) { errors.push("a verb is missing an id"); return; }
      if (seen[verb.id]) errors.push(where + ": duplicate verb id");
      seen[verb.id] = true;

      if (VERB_KINDS.indexOf(verb.kind) === -1) {
        errors.push(where + ": kind '" + verb.kind + "' is not one of " + VERB_KINDS.join(", "));
      }
      validateCost(verb.cost, where, errors);

      if (Array.isArray(verb.stages)) {
        if (verb.stages.length === 0) errors.push(where + ": stages must not be empty");
        verb.stages.forEach(function (stage, i) {
          validateStage(stage, clipNames, errors, where + " stage " + i);
        });
      } else {
        validateStage(verb, clipNames, errors, where);
      }
    });

    return errors;
  }

  return { VERB_KINDS: VERB_KINDS, validateKit: validateKit };
});
