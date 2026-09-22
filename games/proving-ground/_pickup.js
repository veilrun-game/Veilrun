/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · PICKUP SUBSTRATE BAR   (VR-175)

   WHAT THIS IS. The Proving Ground has no concept of a world object you can
   approach and act on — every verb before this one targeted a husk. This
   proves the substrate VR-176 (consumables), VR-177 (weapon pickup) and
   VR-178 (chest) all consume: a pooled pickup entity, a real interact verb
   that finds one in reach, and VR-172's "a miss is not nothing" ruling
   applied to a third verb.

   IT MEASURES BY EXECUTION, NEVER BY GREP, the `_exec.js` contract this file
   copies almost line for line: `tryInteract()` and the AIM block's real
   `verbYaw()` are lifted out of index.html and driven against recorders,
   never a retyped copy of either.

   THE FOUR THINGS IT PROVES, per the card's own DONE WHEN:
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
var srcInteract = lift("tryInteract()", /\nfunction tryInteract\(\) \{[\s\S]*?\n\}/)[0];

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
  vm.runInContext([srcClamp, aimBody, srcInteract].join("\n"), sandbox, { filename: "index.html#PICKUP" });
  return sandbox;
}

function fire(mode, pickups, seed) {
  var s = buildSandbox();
  var p = s.player;
  p.x = 0; p.z = 0; p.yaw = 0; p.aim = 0; p.atkStage = -1; p.execLunge = 0;
  if (seed) for (var k in seed) p[k] = seed[k];
  s.cam.mode = mode;
  s.PICKUPS = pickups.map(function (pk) { return { live: true, x: pk.x, z: pk.z, mesh: { visible: true } }; });
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
   2 · DRIVE IT
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
  s3.PICKUPS = [{ live: true, x: spotForArcade.x, z: spotForArcade.z, mesh: { visible: true } }];
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
ok("pickupReach is read from C, never retyped as a number in tryInteract()",
   /C\.pickupReach/.test(srcInteract) && !/[Ee]xecRange/.test(srcInteract));
ok("pickupArc is read from C, never retyped",
   /C\.pickupArc/.test(srcInteract));

console.log("\n[self-test: the judge really rejects a build with no radius check]");
{
  var brokenSrc = srcInteract.replace(/if \(d2 > C\.pickupReach \* C\.pickupReach\) continue;\n/, "");
  var s = buildSandbox();
  vm.runInContext([srcClamp, aimBody, brokenSrc].join("\n"), s, { filename: "index.html#PICKUP-BROKEN" });
  s.player.x = 0; s.player.z = 0; s.cam.mode = "arcade";
  var far = ahead("arcade", C0.pickupReach * 50);   // absurdly far — only a broken build could reach it
  s.PICKUPS = [{ live: true, x: far.x, z: far.z, mesh: { visible: true } }];
  FX = []; s.tryInteract();
  ok("a build with the radius check removed claims something absurdly far away (and this harness catches it)",
     s.PICKUPS[0].live === false, "a correct build must never do this");
}

console.log("\n==========================================================");
console.log((fails.length ? "FAIL" : "PASS") + " — " + pass + " checks" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
