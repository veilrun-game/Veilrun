/* ---------------------------------------------------------------------------
   VEILRUN — _kit.js (VR-185)
   Usage: node _kit.js

   WHAT THIS PROTECTS. `games/_engine/kit.js` is the one engine-neutral shape
   a character kit must fit — verbs, costs, charges, cones, ranges and clip
   names — so a second genre can read a character instead of reimplementing
   it. This harness builds Vesper's kit and proves two things at once: that
   the shared schema's rules actually catch a bad kit (the synthetic cases
   below), and that a REAL kit built from Vesper's shipped numbers passes
   clean with nothing retyped.

   Vesper's numbers are never retyped here. The BALANCE and CLIPFIT blocks
   are extracted out of `games/proving-ground/index.html` the same way
   `_sim.js`, `_strike.js` and `_clipfit.js` already do, and the kit object
   is built directly from the extracted values — so a strike window changed
   in BALANCE changes what this harness checks, instead of drifting from it.
   The clip names come from the same read `_clipfit.js` does on the GLB, kept
   to the minimum this harness needs (animation names, not keyframe timing).
   ---------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");

var Kit = require(path.join(__dirname, "games", "_engine", "kit.js"));

var checks = 0, fails = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}
function die(msg) { console.error(msg); process.exit(1); }

console.log("\nVEILRUN · _kit.js — character kit schema\n" + "=".repeat(58));

/* ------------------------- side A: the schema itself --------------------- */
console.log("\n-- the shared schema, exercised against synthetic cases --");

ok("VERB_KINDS is a fixed, non-empty list", Array.isArray(Kit.VERB_KINDS) && Kit.VERB_KINDS.length > 0);

var badArc = Kit.validateKit({ id: "x", verbs: [{ id: "v", kind: "dash", range: 1, arc: 400, dmg: 0 }] });
ok("an arc outside 0-360 is rejected", badArc.some(function (e) { return /arc/.test(e); }), badArc.join(" | "));

var badClip = Kit.validateKit(
  { id: "x", verbs: [{ id: "v", kind: "dash", range: 1, arc: 10, dmg: 0, clip: "nonexistent" }] },
  ["attack", "execute", "hurt"]
);
ok("a clip absent from the GLB is rejected", badClip.some(function (e) { return /clip/.test(e); }), badClip.join(" | "));

var badCost = Kit.validateKit({ id: "x", verbs: [{ id: "v", kind: "execute", range: 1, arc: 10, dmg: 0, cost: { cooldownSec: Infinity } }] });
ok("an unpayable (infinite) cost is rejected", badCost.some(function (e) { return /cooldownSec/.test(e); }), badCost.join(" | "));

var badCharges = Kit.validateKit({ id: "x", verbs: [{ id: "v", kind: "dash", range: 1, arc: 0, dmg: 0, cost: { charges: 2 } }] });
ok("charges with no rechargeSec is rejected", badCharges.some(function (e) { return /rechargeSec/.test(e); }), badCharges.join(" | "));

var dupe = Kit.validateKit({ id: "x", verbs: [
  { id: "v", kind: "dash", range: 1, arc: 0, dmg: 0 },
  { id: "v", kind: "dash", range: 1, arc: 0, dmg: 0 }
] });
ok("a duplicate verb id is rejected", dupe.some(function (e) { return /duplicate/.test(e); }), dupe.join(" | "));

var empty = Kit.validateKit({ id: "x", verbs: [] });
ok("a kit with no verbs is rejected", empty.length > 0);

var clean = Kit.validateKit({ id: "x", verbs: [{ id: "v", kind: "dash", range: 1, arc: 90, dmg: 0, clip: null }] });
ok("a well-formed minimal kit passes with zero violations", clean.length === 0, clean.join(" | "));

/* ------------------------- side B: Vesper's real kit ---------------------- */
console.log("\n-- Vesper's kit, built from BALANCE/CLIPFIT, never retyped --");

var htmlPath = path.join(__dirname, "games", "proving-ground", "index.html");
var html = fs.readFileSync(htmlPath, "utf8");

var balM = html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/);
if (!balM) die("could not find the BALANCE block in " + htmlPath);
var balBox = { module: { exports: {} }, Math: Math, console: console };
vm.createContext(balBox);
new vm.Script(balM[1], { filename: "index.html#BALANCE" }).runInContext(balBox);
var C = balBox.module.exports.C;

var fitM = html.match(/CLIPFIT:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* CLIPFIT:END/);
if (!fitM) die("could not find the CLIPFIT block in " + htmlPath);
var fitBox = { console: console };
vm.createContext(fitBox);
new vm.Script(fitM[1] + "\n;module_exports = CLIPFIT;", { filename: "index.html#CLIPFIT" }).runInContext(fitBox);
var FIT = fitBox.module_exports;

/* Only the animation NAMES matter here — the timing arithmetic already has an
   owner (`_clipfit.js`), so this reader stays deliberately narrower than that
   one rather than duplicating it. */
function readGLBClipNames(file) {
  if (!fs.existsSync(file)) die("no model at " + file + " — run the Blender merge first.");
  var buf = fs.readFileSync(file);
  var jsonLen = buf.readUInt32LE(12);
  var gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  return (gltf.animations || []).map(function (a) { return a.name; });
}
var glbPath = path.join(__dirname, "assets", "models", "vesper.glb");
var clipNames = readGLBClipNames(glbPath);
ok("vesper.glb has at least one animation to check against", clipNames.length > 0, clipNames.join(", "));

// CLIPFIT's per-stage keys (attack0/attack1/attack2) all trim the SAME source
// clip; the kit only ever needs to know the source clip name, never the key.
var STRIKE_CLIP = "attack";

var vesperKit = {
  id: "vesper",
  genre: "3d-arena",
  model: "assets/models/vesper.glb",
  verbs: [
    {
      id: "strike", kind: "strike-chain", cost: {},
      stages: C.strike.map(function (s) {
        return {
          range: s.range, arc: s.arc, dmg: s.dmg, knock: s.knock,
          windows: { wind: s.wind, active: s.active, rec: s.rec },
          clip: STRIKE_CLIP
        };
      })
    },
    {
      id: "veilstep", kind: "dash",
      range: C.stepDist, arc: 0, dmg: 0,
      cost: { charges: C.stepCharges, rechargeSec: C.stepRecharge },
      clip: null   // afterimages + a tone, no character animation
    },
    {
      id: "execute", kind: "execute",
      range: C.execRange, arc: C.execArc, dmg: C.execDmg,
      cost: { cooldownSec: C.execCd },
      clip: "execute"
    },
    {
      id: "shroud", kind: "passive-emerge",
      range: 0, arc: 0, dmg: 0,
      cost: {},
      clip: null   // no button, no character animation — emerges from stillness
    }
  ]
};

var kitErrors = Kit.validateKit(vesperKit, clipNames);
ok("Vesper's kit has zero schema violations", kitErrors.length === 0, kitErrors.join(" | "));
ok("every Vesper verb's cost is payable (no unaffordable cost)",
   vesperKit.verbs.every(function (v) {
     var c = v.cost || {};
     return (c.cooldownSec === undefined || (isFinite(c.cooldownSec) && c.cooldownSec >= 0)) &&
            (c.charges === undefined || (Number.isInteger(c.charges) && c.charges >= 1 && c.rechargeSec > 0));
   }));
ok("every Vesper cone sits within 0-360",
   vesperKit.verbs.every(function (v) {
     var stages = v.stages || [v];
     return stages.every(function (s) { return s.arc >= 0 && s.arc <= 360; });
   }));
ok("every Vesper clip that is named resolves in vesper.glb",
   vesperKit.verbs.every(function (v) {
     var stages = v.stages || [v];
     return stages.every(function (s) { return s.clip === null || clipNames.indexOf(s.clip) !== -1; });
   }));

// Round-trip: the kit's numbers are the SAME OBJECTS' values as BALANCE's,
// never a second copy that could drift from it.
ok("strike stage 0 range round-trips from BALANCE", vesperKit.verbs[0].stages[0].range === C.strike[0].range);
ok("strike stage 2 arc round-trips from BALANCE (the spin finisher)", vesperKit.verbs[0].stages[2].arc === C.strike[2].arc);
ok("strike stage 1 dmg round-trips from BALANCE", vesperKit.verbs[0].stages[1].dmg === C.strike[1].dmg);
ok("veilstep charges round-trip from BALANCE", vesperKit.verbs[1].cost.charges === C.stepCharges);
ok("veilstep recharge round-trips from BALANCE", vesperKit.verbs[1].cost.rechargeSec === C.stepRecharge);
ok("execute cooldown round-trips from BALANCE", vesperKit.verbs[2].cost.cooldownSec === C.execCd);
ok("execute range round-trips from BALANCE", vesperKit.verbs[2].range === C.execRange);
ok("execute arc round-trips from BALANCE", vesperKit.verbs[2].arc === C.execArc);

console.log("\n" + (fails ? "FAIL — " + fails + " of " : "PASS — ") + checks + " checks");
process.exit(fails ? 1 : 0);
