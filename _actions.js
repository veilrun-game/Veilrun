/* VEILRUN — shared action-registry harness (VR-191)

   WHAT THIS IS. `games/_engine/actions.js` is the action registry + per-genre
   profiles VR-46 §5 (8/9) asked for and no surface ever got — one resolver,
   `promptFor(action, profile)`, over three vocabularies (2d-platformer,
   3d-arena, narrative) rather than one universal set every genre had to fit.
   This harness proves the shared module rather than either consumer;
   `games/proving-ground/_touch.js` separately proves the one call site that
   consumes it (the touch help legend) still renders the same words it did
   before the lift.

   IT REQUIRES THE REAL FILE. `actions.js` is plain, dependency-free JS with
   no DOM and no game state — the same shape `_clock.js`, `_bus.js` and
   `_motion.js` already use for code portable enough not to need lifting out
   of an HTML file.

   THE CARD'S OWN BAR: "a harness proves every action in a profile resolves,
   and that no profile leaves an action unbound." Section 2 walks every
   profile's every declared action through the real `promptFor()` rather than
   re-listing them by hand, so a fourth action added to a profile tomorrow is
   checked here tomorrow with no edit to this file.

   Dependency-free. Run:  node _actions.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var ACTIONS_PATH = path.join(__dirname, "games", "_engine", "actions.js");
var SRC = fs.readFileSync(ACTIONS_PATH, "utf8");
var Actions = require(ACTIONS_PATH);

/* =========================================================================
   1 · SHAPE
   ========================================================================= */
{
  ok("module exports PROFILES", Actions.PROFILES && typeof Actions.PROFILES === "object");
  ok("module exports promptFor", typeof Actions.promptFor === "function");
  var names = Object.keys(Actions.PROFILES);
  ok("exactly three per-genre profiles", names.length === 3, names.join(", "));
  ["2d-platformer", "3d-arena", "narrative"].forEach(function (g) {
    ok("profile " + g + " exists", Object.prototype.hasOwnProperty.call(Actions.PROFILES, g));
  });
}

/* =========================================================================
   2 · EVERY ACTION IN EVERY PROFILE RESOLVES — walked, never re-listed
   ========================================================================= */
{
  Object.keys(Actions.PROFILES).forEach(function (profile) {
    var actions = Object.keys(Actions.PROFILES[profile]);
    ok("profile " + profile + " declares at least one action", actions.length > 0);
    actions.forEach(function (action) {
      var r = Actions.promptFor(action, profile);
      ok(profile + "." + action + " resolves through promptFor()", !!r,
         "promptFor(" + action + ", " + profile + ") returned " + r);
      if (r) {
        ok(profile + "." + action + " has a non-empty label",
           typeof r.label === "string" && r.label.length > 0, JSON.stringify(r));
        ok(profile + "." + action + "'s glyph is null or a non-empty string",
           r.glyph === null || (typeof r.glyph === "string" && r.glyph.length > 0), JSON.stringify(r));
      }
    });
  });
}

/* =========================================================================
   3 · THE KNOWN SHAPE OF EACH GENRE — the card's own "WHAT IS KNOWN" list
   ========================================================================= */
{
  var plat = Object.keys(Actions.PROFILES["2d-platformer"]).sort();
  ok("2d-platformer is VE.Controller's eight, exactly",
     plat.join(",") === ["interact", "jump", "move", "primary", "reset", "secondary", "signature", "switch"].sort().join(","),
     plat.join(", "));

  var arena = Object.keys(Actions.PROFILES["3d-arena"]).sort();
  ok("3d-arena is Proving Ground's six, exactly",
     arena.join(",") === ["camera", "execute", "pause", "stalk", "strike", "veilstep"].sort().join(","),
     arena.join(", "));

  var narr = Object.keys(Actions.PROFILES.narrative).sort();
  ok("narrative is Rook Signal's three, exactly",
     narr.join(",") === ["choose", "close", "open"].sort().join(","), narr.join(", "));

  // The arena's glyphs name real icon-sprite ids already shipped in the game —
  // never a second, retyped icon set.
  var html = fs.readFileSync(path.join(__dirname, "games", "proving-ground", "index.html"), "utf8");
  ["i-strike", "i-exec", "i-step", "i-stalk"].forEach(function (id) {
    ok("arena glyph " + id + " names a real sprite already in index.html",
       html.indexOf('id="' + id + '"') !== -1);
  });
}

/* =========================================================================
   4 · RESOLUTION IS EXACT, NOT FUZZY
   ========================================================================= */
{
  ok("an action absent from a profile resolves to null, not a guess",
     Actions.promptFor("strike", "2d-platformer") === null,
     "strike belongs to 3d-arena, not the platformer profile");
  ok("an unknown profile resolves to null", Actions.promptFor("move", "point-and-click") === null);
  ok("an unknown action in a real profile resolves to null",
     Actions.promptFor("nonexistent-verb", "3d-arena") === null);
  var s = Actions.promptFor("strike", "3d-arena");
  ok("a known action+profile pair returns its real label", s && s.label === "Strike", JSON.stringify(s));
  ok("…and its real glyph", s && s.glyph === "i-strike", JSON.stringify(s));
}

/* =========================================================================
   5 · MUTATION PASS — a profile that leaves an action unbound must fail here
   ========================================================================= */
{
  function mutant(find, replace, label) {
    if (SRC.indexOf(find) === -1) { fails.push("mutation target not found: " + label); return null; }
    var mutated = SRC.replace(find, replace);
    var sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    try { vm.runInContext(mutated, sandbox, { filename: "actions.js#" + label }); }
    catch (e) { fails.push("mutant " + label + " threw: " + e.message); return null; }
    return sandbox.module.exports;
  }

  // -- A: a profile drops one of its own declared actions --------------------
  var MutA = mutant('stalk:    { label: "Stalk",    glyph: "i-stalk" },\n    camera:   { label: "Camera",   glyph: null },',
                     'camera:   { label: "Camera",   glyph: null },', "arena-drops-stalk");
  if (MutA) {
    ok("mutant A (arena profile silently drops `stalk`) diverges from the real module",
       Actions.promptFor("stalk", "3d-arena") !== null && MutA.promptFor("stalk", "3d-arena") === null,
       "real=" + JSON.stringify(Actions.promptFor("stalk", "3d-arena")) + " mutant=" + MutA.promptFor("stalk", "3d-arena"));
  }

  // -- B: promptFor stops checking hasOwnProperty and returns undefined's key
  var MutB = mutant("if (!p || !Object.prototype.hasOwnProperty.call(p, action)) return null;",
                     "if (!p) return null;", "no-hasOwnProperty-guard");
  if (MutB) {
    ok("mutant B (no hasOwnProperty guard) diverges from the real module on an inherited property name",
       Actions.promptFor("toString", "3d-arena") === null && typeof MutB.promptFor("toString", "3d-arena") === "function",
       "real=" + Actions.promptFor("toString", "3d-arena") + " mutant=" + MutB.promptFor("toString", "3d-arena"));
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — action registry: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
