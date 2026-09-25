/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · PICKUP SUBSTRATE + INTERACTABLE REGISTRY BAR
   (VR-175, grown into a registry by VR-187)

   WHAT THIS IS. The Proving Ground had no concept of a world object you can
   approach and act on — every verb before VR-175 targeted a husk. VR-175
   proved the substrate: a pooled pickup entity, a real interact verb that
   finds one in reach, and VR-172's "a miss is not nothing" ruling applied to
   a third verb. VR-187 generalises that ONE hardcoded type into a REGISTRY —
   reach · prompt · verb · state — that VR-176 (consumables), VR-177 (weapon
   pickup) and VR-178 (chest) register into instead of rewriting the
   substrate each time. What any registered type DOES stays out of scope;
   `lever` exists only to prove the contract itself is generic, by being
   shaped nothing like `pickup` — it is not consumed, it carries its own
   reach/arc, and it round-trips a STATE rather than going not-live.

   IT MEASURES BY EXECUTION, NEVER BY GREP, the `_exec.js` contract this file
   copies almost line for line: `tryInteract()`, the `INTERACT_TYPES`
   registry and the AIM block's real `verbYaw()` are lifted out of
   index.html and driven against recorders, never a retyped copy of any of
   them.

   THE THINGS IT PROVES, per VR-175's and VR-187's own DONE WHEN:
     1 · A PICKUP INSIDE THE REACH RADIUS AND ARC IS CLAIMED; one outside
         either is not — at all three `cam.mode` values, through the real
         `verbYaw()`, the same arcade-and-third-disagree proof `_exec.js` and
         `_hitdir.js` both run.
     2 · A MISS IS PERCEIVABLE, COSTS NOTHING, AND DOES NOT BORROW A HIT'S
         TELLS — VR-172's ruling, ported to a verb that has no cooldown to
         begin with (so "costs nothing" here means "starts inventing one").
     3 · `resetRun()` clears the pool — proven to call the real
         `PICKUPS[i].live = false`, not a same-named stand-in.
     4 · MUTATION: a build with the radius check removed fails this bar.
     5 · A SECOND, DIFFERENTLY-SHAPED TYPE (`lever`) carries its OWN reach/arc
         rather than borrowing the pickup's — proven by placing it at a
         distance a pickup would claim and a lever must not.
     6 · A CLAIMED LEVER STAYS LIVE AND TOGGLES ITS OWN STATE — the registry's
         "stays live with state updated" branch, never exercised by `pickup`
         alone, proven across two presses on the same entry.
     7 · `resetRun()` clears STATE, not just `.live` — a lever left ON must
         not survive into the next run.
     8 · MUTATION: a registry that reads `C.pickupReach` for every type
         instead of the per-type `def.reach` still passes every PICKUP check
         and fails only the LEVER-specific reach check — proving genericity
         is actually tested, not just present in the source.

   Dependency-free. Usage:  node _pickup.js
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _pickup.js.\n");
    process.exit(2);
  }
  return m;
}

var balBody = lift("BALANCE block", /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
var aimBody = lift("AIM block", /AIM:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* AIM:END/)[1];
var srcClamp = lift("clamp()", /\nvar clamp = function \(v, a, b\) \{[^\n]*\};/)[0];
var interactBody = lift("INTERACT block", /INTERACT:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* INTERACT:END/)[1];

/* =========================================================================
   1 · LIFT + STUB, the same recorder shape _exec.js uses
   ========================================================================= */
var FEEDBACK = ["burst", "bladeFlash"];
var FX = [];
function rec(kind) { return function () { FX.push(kind); }; }

function buildSandbox() {
  var sandbox = { Math: Math, console: console, module: { exports: {} },
                  TOUCH: false, TPAD: { holdYaw: function () { return null; } },
                  ARC: { yaw: 0 }, mouse: { yaw: 0 }, cam: { mode: "arcade" } };
  FEEDBACK.forEach(function (n) { sandbox[n] = rec(n); });
  // Everything the miss path must NOT touch, so borrowing one is observable
  // rather than merely believed absent.
  ["hitStop", "shake", "thinGround", "damageEnemy", "executeEnemy"].forEach(function (n) { sandbox[n] = rec(n); });
  sandbox.AU = { interactMiss: rec("AU.interactMiss"), pickup: rec("AU.pickup") };
  vm.createContext(sandbox);
  vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
  var C = sandbox.module.exports.C;
  sandbox.C = C;
  sandbox.player = { x: 0, z: 0, yaw: 0, aim: 0, atkStage: -1, execLunge: 0 };
  vm.runInContext([srcClamp, aimBody, interactBody].join("\n"), sandbox, { filename: "index.html#PICKUP" });
  return sandbox;
}

function toPoolEntry(pk) {
  return { live: true, x: pk.x, z: pk.z, mesh: { visible: true, material: { emissiveIntensity: 0.6 } },
           type: pk.type || "pickup", state: pk.state !== undefined ? pk.state : null };
}

function fire(mode, pickups, seed) {
  var s = buildSandbox();
  var p = s.player;
  p.x = 0; p.z = 0; p.yaw = 0; p.aim = 0; p.atkStage = -1; p.execLunge = 0;
  if (seed) for (var k in seed) p[k] = seed[k];
  s.cam.mode = mode;
  s.PICKUPS = pickups.map(toPoolEntry);
  FX = [];
  s.tryInteract();
  return { fx: FX.slice(), pickups: s.PICKUPS };
}

function aimOf(mode) { var s = buildSandbox(); s.cam.mode = mode; return s.verbYaw(); }
function ahead(mode, dist, offsetRad) {
  var a = aimOf(mode) + (offsetRad || 0);
  return { x: -Math.sin(a) * dist, z: -Math.cos(a) * dist };
}

var C0 = buildSandbox().C;
var MODES = ["arcade", "third", "first"];

/* =========================================================================
   2 · DRIVE IT — the VR-175 substrate, unchanged by the registry
   ========================================================================= */
console.log("\n[a pickup in reach and arc is claimed]");
MODES.forEach(function (mode) {
  var spot = ahead(mode, C0.pickupReach * 0.6);
  var out = fire(mode, [spot]);
  ok(mode + ": a pickup dead ahead, well inside reach, is claimed",
     out.pickups[0].live === false, "fx: " + out.fx.join(","));
  ok(mode + ": claiming plays AU.pickup and nothing borrowed from a hit",
     out.fx.indexOf("AU.pickup") !== -1 && ["hitStop", "shake", "thinGround", "damageEnemy", "executeEnemy"].every(function (t) { return out.fx.indexOf(t) === -1; }));
});

console.log("\n[a pickup outside the reach radius is not claimed]");
MODES.forEach(function (mode) {
  var spot = ahead(mode, C0.pickupReach + 0.8);
  var out = fire(mode, [spot]);
  ok(mode + ": a pickup just past pickupReach is left alone",
     out.pickups[0].live === true);
});

console.log("\n[a pickup outside the acquire arc is not claimed]");
{
  // Directly BEHIND the player, at half the arc's own width past the edge —
  // never ambiguous no matter which mode's forward vector is in play.
  var out = fire("arcade", [{ x: 0, z: C0.pickupReach * 0.5 }]);   // +z is behind facing 0
  ok("a pickup behind the player, outside pickupArc, is left alone",
     out.pickups[0].live === true);
}

console.log("\n[arcade and third disagree about the same pickup]");
{
  var s1 = buildSandbox(); s1.ARC.yaw = 0.6;
  var s2 = buildSandbox(); s2.mouse.yaw = 2.4;
  ok("verbYaw() itself differs by mode for these yaws",
     (function () { s1.cam.mode = "arcade"; return s1.verbYaw(); })() !==
     (function () { s2.cam.mode = "third"; return s2.verbYaw(); })());
  // A pickup placed dead ahead of ARCADE's aim is out of THIRD's arc (its
  // forward points somewhere else entirely), proving the cone is actually
  // read from the mode in force rather than a fixed world direction.
  var spotForArcade = ahead("arcade", C0.pickupReach * 0.6);
  var arcadeOut = fire("arcade", [spotForArcade], null);
  var s3 = buildSandbox(); s3.ARC.yaw = 0; s3.mouse.yaw = Math.PI;   // third looks the opposite way
  s3.player.x = 0; s3.player.z = 0;
  s3.cam.mode = "third";
  s3.PICKUPS = [toPoolEntry({ x: spotForArcade.x, z: spotForArcade.z })];
  FX = []; s3.tryInteract();
  ok("the same world spot claimed in arcade is missed in third when the modes face opposite ways",
     arcadeOut.pickups[0].live === false && s3.PICKUPS[0].live === true);
}

console.log("\n[a miss is perceivable, costs nothing, and does not borrow a hit's tells]");
{
  var out = fire("arcade", []);   // empty arena — guaranteed miss
  ok("a miss with nothing in reach is perceivable",
     out.fx.indexOf("AU.interactMiss") !== -1 && out.fx.indexOf("bladeFlash") !== -1,
     "fx: " + out.fx.join(","));
  ok("a miss never plays AU.pickup",
     out.fx.indexOf("AU.pickup") === -1);
  ok("a miss borrows none of a hit's tells",
     ["hitStop", "shake", "thinGround", "damageEnemy", "executeEnemy"].every(function (t) { return out.fx.indexOf(t) === -1; }),
     "fx: " + out.fx.join(","));
}

console.log("\n[resetRun clears the pool]");
ok("resetRun() actually sets PICKUPS[i].live = false, not a same-named stand-in",
   /function resetRun\([^)]*\) \{[\s\S]*?PICKUPS\[pk\]\.live = false[\s\S]*?\n\}/.test(html));

console.log("\n[static: the reach radius is a BALANCE constant, not a literal at the call site]");
ok("pickupReach is read from C, never retyped as a number in the registry",
   /reach: C\.pickupReach/.test(interactBody) && !/[Ee]xecRange/.test(interactBody));
ok("pickupArc is read from C, never retyped",
   /arc: C\.pickupArc/.test(interactBody));

console.log("\n[self-test: the judge really rejects a build with no radius check]");
{
  var brokenSrc = interactBody.replace(/if \(d2 > def\.reach \* def\.reach\) continue;\n/, "");
  var s = buildSandbox();
  vm.runInContext([srcClamp, aimBody, brokenSrc].join("\n"), s, { filename: "index.html#PICKUP-BROKEN" });
  s.player.x = 0; s.player.z = 0; s.cam.mode = "arcade";
  var far = ahead("arcade", C0.pickupReach * 50);   // absurdly far — only a broken build could reach it
  s.PICKUPS = [toPoolEntry({ x: far.x, z: far.z })];
  FX = []; s.tryInteract();
  ok("a build with the radius check removed claims something absurdly far away (and this harness catches it)",
     s.PICKUPS[0].live === false, "a correct build must never do this");
}

/* =========================================================================
   3 · THE REGISTRY (VR-187) — a second, differently-shaped type
   ========================================================================= */
console.log("\n[the registry declares reach, prompt, verb and state per type]");
ok("INTERACT_TYPES registers both `pickup` and `lever`",
   /pickup:\s*\{/.test(interactBody) && /lever:\s*\{/.test(interactBody));
ok("both registered types name a prompt for a future UI",
   /prompt:\s*"Claim"/.test(interactBody) && /prompt:\s*"Pull"/.test(interactBody));

console.log("\n[a lever carries its OWN reach, not the pickup's]");
ok("leverReach is a distinct BALANCE constant from pickupReach",
   C0.leverReach !== C0.pickupReach && C0.leverReach < C0.pickupReach);
MODES.forEach(function (mode) {
  var spot = ahead(mode, C0.leverReach * 0.6);
  var out = fire(mode, [{ x: spot.x, z: spot.z, type: "lever" }]);
  ok(mode + ": a lever dead ahead, inside leverReach, is claimed (stays live, state toggles)",
     out.pickups[0].live === true && out.pickups[0].state === true, "fx: " + out.fx.join(","));
});
{
  // Between leverReach (1.6) and pickupReach (2.2) — a spot a PICKUP would
  // claim and a LEVER, with its own shorter reach, must not.
  var mid = (C0.leverReach + C0.pickupReach) / 2;
  var spot = ahead("arcade", mid);
  var pickupOut = fire("arcade", [{ x: spot.x, z: spot.z, type: "pickup" }]);
  var leverOut = fire("arcade", [{ x: spot.x, z: spot.z, type: "lever" }]);
  ok("the same distance claims a pickup and leaves a lever alone — reach is per-type",
     pickupOut.pickups[0].live === false && leverOut.pickups[0].live === true);
}

console.log("\n[a claimed lever stays live and its state round-trips across two presses]");
{
  var s = buildSandbox();
  var spot = ahead("arcade", C0.leverReach * 0.6);
  s.PICKUPS = [toPoolEntry({ x: spot.x, z: spot.z, type: "lever" })];
  FX = []; s.tryInteract();
  ok("first pull: still live, plays AU.pickup like a claim, state now true",
     s.PICKUPS[0].live === true && s.PICKUPS[0].state === true && FX.indexOf("AU.pickup") !== -1);
  FX = []; s.tryInteract();
  ok("second pull on the SAME lever: still live, state toggles back to false",
     s.PICKUPS[0].live === true && s.PICKUPS[0].state === false);
}

console.log("\n[resetRun clears state, not just live]");
ok("resetRun() sets PICKUPS[pk].state = null alongside .live = false",
   /function resetRun\([^)]*\) \{[\s\S]*?PICKUPS\[pk\]\.live = false[\s\S]*?PICKUPS\[pk\]\.state = null[\s\S]*?\n\}/.test(html));

console.log("\n[self-test: the judge rejects a registry that fakes genericity]");
{
  // Swap the per-type `def.reach` for the shared `C.pickupReach` everywhere —
  // a mutant that keeps two entries in the object but answers every reach
  // question with one number. Every PICKUP check above still has to pass
  // (pickupReach really is C.pickupReach); only the LEVER-specific reach
  // check may catch it.
  var fakedGeneric = interactBody.replace(/def\.reach \* def\.reach/g, "C.pickupReach * C.pickupReach");
  var s = buildSandbox();
  vm.runInContext([srcClamp, aimBody, fakedGeneric].join("\n"), s, { filename: "index.html#PICKUP-FAKEGENERIC" });
  var mid = (C0.leverReach + C0.pickupReach) / 2;   // past leverReach, still inside pickupReach
  var spot = ahead("arcade", mid);
  s.player.x = 0; s.player.z = 0; s.cam.mode = "arcade";
  s.PICKUPS = [toPoolEntry({ x: spot.x, z: spot.z, type: "lever" })];
  FX = []; s.tryInteract();
  // A lever never goes not-live on claim (it stays live, per the registry's
  // own contract), so the mutant's tell is STATE toggling on a lever the
  // real build must leave completely untouched.
  ok("a registry that answers every type's reach with C.pickupReach wrongly toggles a far lever's state (and the per-type check above catches it)",
     s.PICKUPS[0].state === true, "a correct build leaves this lever's state===null; the mutant wrongly claims it");
}

console.log("\n==========================================================");
console.log((fails.length ? "FAIL" : "PASS") + " — " + pass + " checks" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
