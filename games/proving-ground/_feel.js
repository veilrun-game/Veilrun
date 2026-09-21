/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · NO VERB MAY PRODUCE NOTHING   (VR-195)

   WHAT THIS IS. `_exec.js` (VR-172) proved one rule for one verb: a press that
   cannot connect must still be PERCEIVABLE, must still COST NOTHING extra, and
   must NOT BORROW THE HIT'S TELLS. That ruling is currently enforced for
   Execute alone. This file generalises it — it DISCOVERS the arena's verbs
   from the real registry (`../_engine/actions.js`'s `"3d-arena"` profile,
   VR-191) rather than typing a list here, and runs the same three-part test
   against every one of them that the test actually applies to.

   THE VERB SET IS READ, NOT WRITTEN. `Object.keys(VE.Actions.PROFILES["3d-arena"])`
   is the authority on "what verbs does this arena have" — a verb added to that
   profile tomorrow becomes a name this file has to account for tomorrow, with
   no edit here, the same property `_exec.js` already gives the AU method list.

   NOT EVERY DISCOVERED VERB HAS A MISS. `strike`, `execute` and `veilstep` are
   AIMED OR GATED — they can fail to connect or fail to be available, and a
   silent failure there is exactly the VR-172 bug. `camera`, `pause` and
   `stalk` are TOGGLES OR CONTINUOUS MECHANICS — camera and pause always do the
   thing they are pressed for, and Stalk is not a discrete press at all (it is
   `updateShroud()` reading stillness over time, no button, no miss). Asserting
   "perceivable / costs nothing / no borrowed tells" against a toggle is not a
   weaker version of the test, it is a CATEGORY ERROR — there is no miss to be
   silent about. Those three are reported as EXEMPT, by name, every run, so a
   verb never silently drops out of the discovered set.

   TWO ARE JUDGED FOR REAL, BY EXECUTION:
     · EXECUTE — must reproduce `_exec.js`'s own verdict EXACTLY. This file
       spawns the real `_exec.js` as a subprocess and diffs its own internal
       judgement of the same verb against that subprocess's printed check/fail
       counts. If they disagree, THIS FILE is wrong, not `_exec.js` — it is the
       newer, generalised copy of an already-proven rule.
     · VEILSTEP — never checked this way before. `veilstep()` opens with
       `if (player.stepCharges <= 0 || player.stepLock > 0) return;` and that
       return is exactly as silent as pre-VR-172 Execute: no sound, no denial
       cue, nothing. THIS CARD DOES NOT FIX IT (out of scope, by its own DONE
       WHEN) — VR-210 is the follow-up card, and the finding is recorded as an
       ALLOWED failure, the same fourth-state mechanism `_strike.js` uses for
       VR-169's four defects: printed in full, never folded into a pass, and
       self-policing — an entry with no card reference fails, and an entry
       whose criterion has started passing fails as STALE.

   Dependency-free. Usage:  node _feel.js  [--verbose]
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
var VERBOSE = process.argv.indexOf("--verbose") >= 0;
var GAME_DIR = __dirname;
var html = fs.readFileSync(path.join(GAME_DIR, "index.html"), "utf8");

/* =========================================================================
   1 · DISCOVER THE VERB SET — read, not typed
   ========================================================================= */
var Actions = require(path.join(GAME_DIR, "..", "_engine", "actions.js"));
var ARENA_VERBS = Object.keys(Actions.PROFILES["3d-arena"]);

var TESTABLE = { execute: true, veilstep: true };
var EXEMPT = {
  strike: "a swing always plays its full wind/active/rec regardless of whether it connects — " +
          "there is no target requirement to fail. Its OWN silent gap — a press mid-wind/mid-" +
          "active is dropped by the input branch, not by startStrike() — is already found, ruled " +
          "and tracked in _strike.js's ALLOWED list (buf-wind/buf-active, VR-169, ruled 9/6); " +
          "re-asserting it here would be a second copy of one finding.",
  camera: "a toggle — pressing it always changes the mode. No target, no miss, nothing to be silent about.",
  pause:  "a toggle — pressing it always changes the pause state. Same reasoning as camera.",
  stalk:  "not a discrete press at all: it is updateShroud() reading stillness over time, no " +
          "button and no miss to be silent about."
};

/* =========================================================================
   2 · LIFT THE GAME'S OWN SOURCE — never a retyped copy
   ========================================================================= */
function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _feel.js.\n");
    process.exit(2);
  }
  return m;
}

var balBody  = lift("BALANCE block", /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
var aimBody  = lift("AIM block",     /AIM:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* AIM:END/)[1];
var srcExec  = lift("tryExecute()",  /\nfunction tryExecute\(\) \{[\s\S]*?\n\}/)[0];
var srcClamp = lift("clamp()",       /\nvar clamp = function \(v, a, b\) \{[^\n]*\};/)[0];
var mLunge   = lift("EXEC_LUNGE_T",  /\nvar EXEC_LUNGE_T = ([\d.]+);/);
var srcStep  = lift("veilstep()",    /\nfunction veilstep\(\) \{[\s\S]*?\n\}/)[0];
var Motion   = require(path.join(GAME_DIR, "..", "_engine", "motion.js"));

var auReturn = lift("AU's returned object", /\nvar AU = \(function \(\) \{[\s\S]*?\n  return \{([\s\S]*?)\n  \};/)[1];
var AU_KEYS = [];
auReturn.replace(/(?:^|\n)\s{4}([A-Za-z][A-Za-z0-9]*):/g, function (_, k) { AU_KEYS.push(k); return _; });

var FEEDBACK = ["ring", "burst", "ghost", "fovKick", "shake", "hitStop", "bladeFlash"];
var HIT_ONLY = ["hitStop", "shake", "damageEnemy", "executeEnemy", "thinGround"];
var SILENT   = ["clampToArena", "pushOutOfPillars", "breakShroud", "damageEnemy",
                "executeEnemy", "thinGround"];

var FX = [];
function rec(kind) { return function () { FX.push(kind); }; }

var sandbox = { Math: Math, console: console, module: { exports: {} },
                TOUCH: false, TPAD: { holdYaw: function () { return null; } },
                ARC: { yaw: 0 }, mouse: { yaw: 0 }, cam: { mode: "arcade" },
                ENEMIES: [], keys: { w: false, s: false, a: false, d: false },
                VESPER: 0x9C7FE8 };   // veilstep()'s afterimage tint — a colour constant, not behaviour
FEEDBACK.concat(SILENT).forEach(function (n) { sandbox[n] = rec(n); });
sandbox.AU = {};
AU_KEYS.forEach(function (k) { sandbox.AU[k] = rec("AU." + k); });

vm.createContext(sandbox);
vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
var C = sandbox.module.exports.C;
sandbox.C = C;
sandbox.player = { x: 0, z: 0, yaw: 0, bodyYaw: 0, aim: 0, alive: true, veiled: false,
                   iframe: 0, execCd: 0, execLunge: 0, atkStage: -1, vx: 0, vz: 0,
                   stepCharges: C.stepCharges, stepLock: 0 };
vm.runInContext([srcClamp, aimBody, srcExec, srcStep, "var EXEC_LUNGE_T = " + mLunge[1] + ";"].join("\n"),
                sandbox, { filename: "index.html#FEEL" });

var EXEC_LUNGE_T = +mLunge[1];
var MOTION_RED = Motion.MOTION_RED;
var MUTED_BY_REDUCED = Object.keys(MOTION_RED).filter(function (k) { return MOTION_RED[k] === 0; });
var CHANNEL = { shake: "shake", ghost: "ghost", fovKick: "fov", bladeFlash: "flash" };
var MODES = ["arcade", "third", "first"];

function feedbackIn(fx) {
  return fx.filter(function (k) { return k.indexOf("AU.") === 0 || FEEDBACK.indexOf(k) >= 0; });
}

/* =========================================================================
   3 · EXECUTE — the proven verb, reproduced exactly
   ========================================================================= */
function husk(x, z, woundFrac) {
  return { live: true, state: "idle", x: x, z: z, maxHp: 100,
           hp: 100 * (woundFrac == null ? 1 : woundFrac) };
}
function pressExecute(mode, enemies, seed) {
  var p = sandbox.player;
  p.x = 0; p.z = 0; p.yaw = 0; p.bodyYaw = 0; p.aim = 0; p.alive = true;
  p.veiled = false; p.iframe = 0; p.execCd = 0; p.execLunge = 0; p.atkStage = -1;
  if (seed) for (var k in seed) p[k] = seed[k];
  sandbox.cam.mode = mode;
  sandbox.ENEMIES = enemies || [];
  FX = [];
  sandbox.tryExecute();
  return { fx: FX.slice(),
           cd: p.execCd, lunge: p.execLunge, x: p.x, z: p.z, aim: p.aim, veiled: p.veiled };
}
function aimOf(mode) { sandbox.cam.mode = mode; return sandbox.verbYaw(); }
function ahead(mode, dist, offsetRad) {
  var a = aimOf(mode) + (offsetRad || 0);
  return { x: -Math.sin(a) * dist, z: -Math.cos(a) * dist };
}

/* One judge kernel, driven by whichever `fire` function is handed in — so the
   self-test in section 6 can feed it a synthetic verb and get the identical
   verdict, the same contract `_exec.js` itself proves against. */
function judgeExecute(fire) {
  var out = [];
  function crit(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail }); }

  MODES.forEach(function (mode) {
    var far  = ahead(mode, C.execRange * 1.6);
    var wide = ahead(mode, C.execRange * 0.5, (C.execArc / 2 + 25) * Math.PI / 180);
    var cases = [
      ["empty", "nothing in the arena at all", []],
      ["range", "a husk past execRange",       [husk(far.x, far.z)]],
      ["arc",   "a husk inside range, outside execArc", [husk(wide.x, wide.z)]]
    ];
    cases.forEach(function (c) {
      var r = fire(mode, c[2]);
      var fb = feedbackIn(r.fx);
      crit("whiff." + mode + "." + c[0], "[" + mode + "] a whiff is perceivable — " + c[1],
           fb.length >= 1, fb.length ? fb.join(" + ") : "NOTHING RECORDED");
      crit("free." + mode + "." + c[0], "[" + mode + "] and it still costs nothing — " + c[1],
           r.cd === 0 && r.lunge === 0 && r.x === 0 && r.z === 0 && r.veiled === false,
           "cd " + r.cd + " · lunge " + r.lunge + " · moved " + (r.x !== 0 || r.z !== 0));
      crit("reduced." + mode + "." + c[0], "[" + mode + "] and it survives reduced motion — " + c[1],
           fb.some(function (k) { return MUTED_BY_REDUCED.indexOf(CHANNEL[k] || k) < 0; }),
           "reduced motion zeroes: " + MUTED_BY_REDUCED.join(", "));
      crit("notahit." + mode + "." + c[0], "[" + mode + "] and it does not borrow the hit's tells — " + c[1],
           r.fx.every(function (k) { return HIT_ONLY.indexOf(k) < 0; }),
           r.fx.filter(function (k) { return HIT_ONLY.indexOf(k) >= 0; }).join(",") || "clean");
    });

    var cd = fire(mode, [], { execCd: C.execCd * 0.5 });
    crit("cooldown." + mode, "[" + mode + "] a press on cooldown is still silent",
         cd.fx.length === 0 && cd.cd === C.execCd * 0.5,
         cd.fx.length ? "emitted " + cd.fx.join(",") : "silent, cd untouched");
    var mid = fire(mode, [], { atkStage: 1 });
    crit("midstrike." + mode, "[" + mode + "] a press mid-strike is still silent",
         mid.fx.length === 0, mid.fx.join(",") || "silent");

    var near = ahead(mode, C.execRange * 0.4);
    var hit  = fire(mode, [husk(near.x, near.z, 0.9)]);
    crit("hit." + mode, "[" + mode + "] a landing execute still charges and lunges",
         hit.cd === C.execCd && hit.lunge === EXEC_LUNGE_T && (hit.x !== 0 || hit.z !== 0),
         "cd " + hit.cd + " · lunge " + hit.lunge);
    crit("hitfx." + mode, "[" + mode + "] a landing execute still reads as a hit",
         hit.fx.indexOf("thinGround") >= 0 && feedbackIn(hit.fx).length >= 2,
         feedbackIn(hit.fx).join(" + "));

    var whiff = fire(mode, []);
    crit("distinct." + mode, "[" + mode + "] whiff ≠ hit ≠ dead button",
         feedbackIn(whiff.fx).length >= 1 && cd.fx.length === 0 &&
         feedbackIn(whiff.fx).join(",") !== feedbackIn(hit.fx).join(","),
         "whiff [" + feedbackIn(whiff.fx).join(",") + "] vs hit [" + feedbackIn(hit.fx).join(",") + "]");
  });

  sandbox.mouse.yaw = Math.PI;
  var body = { x: 0, z: -C.execRange * 0.4 };
  var arc = fire("arcade", [husk(body.x, body.z, 0.9)]);
  var thr = fire("third",  [husk(body.x, body.z, 0.9)]);
  sandbox.mouse.yaw = 0;
  out.push({ id: "aimpath", name: "the cone follows the MODE's aim, not one stubbed angle",
             pass: arc.cd === C.execCd && thr.cd === 0,
             detail: "arcade hit: " + (arc.cd === C.execCd) + " · third whiffed: " + (thr.cd === 0) });

  return out;
}

/* =========================================================================
   4 · VEILSTEP — never checked this way before
   ========================================================================= */
function pressStep(seed) {
  var p = sandbox.player;
  p.x = 0; p.z = 0; p.bodyYaw = 0; p.vx = 0; p.vz = 0; p.yaw = 0;
  p.stepCharges = C.stepCharges; p.stepLock = 0;
  if (seed) for (var k in seed) p[k] = seed[k];
  sandbox.cam.mode = "arcade";
  sandbox.keys = { w: false, s: false, a: false, d: false };
  FX = [];
  sandbox.veilstep();
  return { fx: FX.slice(), charges: p.stepCharges, lock: p.stepLock, x: p.x, z: p.z };
}

function judgeVeilstep() {
  var out = [];
  function crit(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail }); }

  // A normal, available press must still land — the sanity check that keeps
  // the blocked-case assertions below honest (a bar that only ever fails
  // could not tell "blocked" from "broken").
  var ok = pressStep({ stepCharges: 2, stepLock: 0 });
  crit("veilstep.available", "an available Veilstep still fires and still moves",
       feedbackIn(ok.fx).length >= 1 && (ok.x !== 0 || ok.z !== 0) && ok.charges === 1,
       "fx " + feedbackIn(ok.fx).join(",") + " · moved " + (ok.x !== 0 || ok.z !== 0));

  [
    ["charges", "no charges left", { stepCharges: 0, stepLock: 0 }],
    ["lock",    "still in its own lockout window", { stepCharges: 2, stepLock: 0.2 }]
  ].forEach(function (c) {
    var id = c[0], label = c[1], seed = c[2];
    var r = pressStep(seed);
    crit("veilstep.blocked." + id, "a blocked press (" + label + ") is perceivable",
         feedbackIn(r.fx).length >= 1, feedbackIn(r.fx).length ? feedbackIn(r.fx).join(",") : "NOTHING RECORDED");
    crit("veilstep.blocked." + id + ".free", "a blocked press (" + label + ") still costs nothing extra",
         r.charges === seed.stepCharges && r.lock === seed.stepLock && r.x === 0 && r.z === 0,
         "charges " + r.charges + " · lock " + r.lock + " · moved " + (r.x !== 0 || r.z !== 0));
    crit("veilstep.blocked." + id + ".notahit", "a blocked press (" + label + ") does not borrow the hit's tells",
         r.fx.every(function (k) { return HIT_ONLY.indexOf(k) < 0; }),
         r.fx.filter(function (k) { return HIT_ONLY.indexOf(k) >= 0; }).join(",") || "clean");
  });

  return out;
}

/* =========================================================================
   5 · ALLOWED — the _strike.js fourth-state mechanism, reused
   ========================================================================= */
var ALLOWED = {
  "veilstep.blocked.charges": "VR-210 — a blocked Veilstep (no charges) returns before emitting " +
    "anything at all. Found here, not fixed here — see VR-210 for the fix.",
  "veilstep.blocked.lock": "VR-210 — same defect, the lockout branch of the same early return. " +
    "Asserted separately on purpose, so fixing one branch cannot silently leave the other broken."
};

function ok(name, cond, detail) {
  checks++;
  if (cond) { if (VERBOSE) console.log("  ok    " + name + (detail ? "   (" + detail + ")" : "")); return true; }
  fails++;
  console.log("  FAIL  " + name + (detail ? "\n        ^ " + detail : ""));
  return false;
}

var checks = 0, fails = 0, allowed = 0;
function report(results) {
  results.forEach(function (r) {
    var reason = ALLOWED[r.id];
    checks++;
    if (r.pass) {
      if (reason) { fails++; console.log("  FAIL  " + r.name + "  — STALE ALLOWANCE: this now passes; " +
                    "remove it from ALLOWED (" + r.id + ")."); }
      else if (VERBOSE) console.log("  ok    " + r.name + (r.detail ? "   (" + r.detail + ")" : ""));
      return;
    }
    if (reason) {
      allowed++;
      console.log("  ~ ALLOWED  " + r.name + "\n             ^ " + r.detail + "\n             — " + reason);
    } else {
      fails++;
      console.log("  FAIL  " + r.name + (r.detail ? "\n        ^ " + r.detail : ""));
    }
  });
}

/* =========================================================================
   6 · RUN IT
   ========================================================================= */
console.log("VEILRUN — Proving Ground · no verb may produce nothing (VR-195)\n");

console.log("[verb discovery — read from ../_engine/actions.js, not typed here]");
ok("the 3d-arena profile is non-empty", ARENA_VERBS.length > 0, ARENA_VERBS.join(", "));
ARENA_VERBS.forEach(function (v) {
  if (TESTABLE[v]) { ok("discovered verb '" + v + "' is judged for real, by execution", true); return; }
  if (EXEMPT[v]) { ok("discovered verb '" + v + "' is EXEMPT — " + EXEMPT[v], true); return; }
  fails++; checks++;
  console.log("  FAIL  discovered verb '" + v + "' is neither judged nor documented as exempt — " +
              "add it to TESTABLE or EXEMPT in _feel.js");
});

console.log("\n[execute — reproducing _exec.js's own verdict]");
var localExec = judgeExecute(pressExecute);
var localFails = localExec.filter(function (r) { return !r.pass; }).length;
report(localExec);

var execPath = path.join(GAME_DIR, "_exec.js");
var proc = cp.spawnSync("node", [execPath], { encoding: "utf8", cwd: GAME_DIR });
var procOut = (proc.stdout || "") + (proc.stderr || "");
var summary = procOut.match(/(PASS|FAIL) — (\d+) checks, (\d+) failed\./);
ok("_exec.js ran and printed a summary this file can parse", !!summary, summary ? summary[0] : procOut.slice(-200));
if (summary) {
  var realChecks = +summary[2], realFails = +summary[3];
  // `_exec.js`'s own 58 is judge()'s 52 PLUS 6 checks that live outside judge()
  // in that file and are not duplicated here: 2 header assertions ("anchors
  // lifted", "AU keys read not listed") and 4 from its own phase-5 self-test
  // against synthetic verbs. This file has the equivalent self-test in its own
  // section 7 instead of re-running _exec.js's copy — so the shared, comparable
  // surface is judge()'s scenario space, not the two files' total line counts.
  var EXEC_META_CHECKS = 6;
  ok("this file's own execute-verb judgement covers the SAME scenario space _exec.js's judge() does",
     localExec.length === realChecks - EXEC_META_CHECKS,
     "here " + localExec.length + " vs _exec.js's judge() " + (realChecks - EXEC_META_CHECKS) +
     " (its total " + realChecks + " minus " + EXEC_META_CHECKS + " checks outside judge())");
  ok("this file's own execute-verb judgement PASSES exactly where _exec.js does",
     localFails === realFails, "here " + localFails + " failed vs _exec.js " + realFails + " failed");
}

console.log("\n[veilstep — never checked this way before]");
report(judgeVeilstep());

/* =========================================================================
   7 · THE BAR JUDGES ITSELF — a verb that returns silently must fail it
   ========================================================================= */
console.log("\n[the bar against a known-bad synthetic verb]");
function silentExecute() { return { fx: [], cd: 0, lunge: 0, x: 0, z: 0, aim: 0, veiled: false }; }
var silentV = judgeExecute(silentExecute).filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
ok("a silent execute-shaped verb FAILS the whiff bar", silentV.some(function (i) { return i.indexOf("whiff.") === 0; }),
   silentV.length + " criteria refused it");

function silentStepAlways() { return { fx: [], charges: C.stepCharges, lock: 0, x: 0, z: 0 }; }
var oldPressStep = pressStep;
pressStep = function () { return silentStepAlways(); };
var silentStepResults = judgeVeilstep().filter(function (r) { return !r.pass && !ALLOWED[r.id]; });
pressStep = oldPressStep;
ok("a verb that is ALWAYS silent — including when available — fails a criterion ALLOWED cannot excuse",
   silentStepResults.length > 0, silentStepResults.map(function (r) { return r.id; }).join(",") || "nothing caught it");

console.log("\n" + (fails ? "FAIL" : "PASS") + " — " + checks + " checks, " + allowed + " allowed, " + fails + " failed.");
process.exit(fails ? 1 : 0);
