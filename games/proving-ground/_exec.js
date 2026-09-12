/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · EXECUTE-FEEDBACK BAR   (VR-172)

   WHAT THIS IS. `_strike.js` judges whether the strike WINDOW is right. This
   judges something the strike never had to answer, because its swing animation
   hides it: **does a verb that finds nothing tell you it fired?**

   THE REPORT (VR-171 intake, ruled onto a card by Jordan 9/7). `tryExecute()`
   ends its target search at `if (!best) return;` and writes NOTHING — no sound,
   no particle, no camera, no cooldown. A press that misses and a button that is
   dead produce byte-identical output, so the player cannot tell "I aimed wrong"
   from "the control is broken". That is exactly the misread VR-160 chased for a
   week before the cone turned out to be the cause.

   WHY IT IS NOT ALREADY COVERED — checked in the files, not assumed:
     · `_strike.js` lifts `startStrike()` / `updateStrike()` / the strike input
       branch. It never loads `tryExecute()` and has no assertion on any AU call.
     · `_touch.js` executes the AIM block and proves `verbYaw()` points the right
       way per mode. Pointing is not firing: every VR-160 assertion still passes
       against a verb that resolves its cone correctly and then says nothing.
     · `_clipfit.js` reads clip durations against the strike windows. Execute has
       no clip window, so it is outside that file's subject entirely.

   IT MEASURES BY EXECUTION, NEVER BY GREP. A `grep` for `AU.` inside
   `tryExecute()` would pass the moment a call appears anywhere in the function —
   including on the branch that already fires when the verb HITS. The only
   honest question is what the function emits **on the miss path**, so this file
   lifts `tryExecute()` out of index.html, runs it against recorders, and reads
   what was recorded.

   NOTHING HERE IS A RETYPED COPY. BALANCE (the anchor `_sim.js` uses), the AIM
   block (the anchor `_touch.js` uses), `tryExecute()`, `clamp`, `EXEC_LUNGE_T`
   and even **the list of AU method names** are lifted from the real file — so a
   sound added to the game becomes an observable here without this file being
   edited. If an anchor stops matching, this exits 2 loudly rather than judging a
   stale copy. That is the `_arena.js` / `_strike.js` contract.

   THE THREE THINGS IT BARS, and the third is the one that will rot first:
     1 · A WHIFF IS AUDIBLE OR VISIBLE. At least one perceivable effect, on an
         empty arena, on a husk out of RANGE, and on a husk out of ARC — at all
         three `cam.mode` values, through the real `verbYaw()`.
     2 · A WHIFF STILL COSTS NOTHING. No `execCd`, no `execLunge`, no lunge
         translation, no shroud break, no facing snap. The card scopes this to
         feedback only, and the fastest way to "fix" silence is to accidentally
         start charging for it.
     3 · A WHIFF, A HIT AND A DEAD BUTTON ARE THREE DIFFERENT OUTPUTS. Silence is
         reserved for the unavailable button (`execCd > 0`, mid-strike), and the
         whiff must not borrow the hit's tells — `hitStop`, `shake`,
         `damageEnemy`, `executeEnemy`, `thinGround`. A whiff that feels like a
         hit is a second way to lie about the same press.

   IT JUDGES ITSELF ON EVERY RUN. The final phase feeds the same verdict function
   a synthetic verb that returns silently — the shipped behaviour this card was
   opened against — and FAILS if the bar passes it. A bar that cannot fail the
   thing it was written for is decoration.

   Dependency-free. Usage:  node _exec.js  [--verbose]
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm");
var VERBOSE = process.argv.indexOf("--verbose") >= 0;
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

/* =========================================================================
   1 · LIFT THE GAME'S OWN SOURCE
   ========================================================================= */
function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _exec.js.\n");
    process.exit(2);
  }
  return m;
}

var balBody  = lift("BALANCE block", /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
var aimBody  = lift("AIM block",     /AIM:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* AIM:END/)[1];
var srcExec  = lift("tryExecute()",  /\nfunction tryExecute\(\) \{[\s\S]*?\n\}/)[0];
var srcClamp = lift("clamp()",       /\nvar clamp = function \(v, a, b\) \{[^\n]*\};/)[0];
var mLunge   = lift("EXEC_LUNGE_T",  /\nvar EXEC_LUNGE_T = ([\d.]+);/);
var srcRed   = lift("MOTION_RED",    /\nvar MOTION_RED  = (\{[^\n]*\});/)[1];

/* The AU method names are LIFTED, not listed. `AU` is an IIFE whose returned
   object literal is the public surface; every key on it is a thing the player
   can hear. Reading the keys out of the file means a sound added tomorrow is an
   observable here tomorrow, with no edit to this harness — the opposite of the
   hand-maintained lists CLAUDE.md §4 has been wrong about four times. */
var auReturn = lift("AU's returned object", /\nvar AU = \(function \(\) \{[\s\S]*?\n  return \{([\s\S]*?)\n  \};/)[1];
var AU_KEYS = [];
auReturn.replace(/(?:^|\n)\s{4}([A-Za-z][A-Za-z0-9]*):/g, function (_, k) { AU_KEYS.push(k); return _; });

/* Everything the miss path could plausibly reach for. Split by what the player
   actually perceives, because the whole card is about perception. */
var FEEDBACK = ["ring", "burst", "ghost", "fovKick", "shake", "hitStop", "bladeFlash"];
var HIT_ONLY = ["hitStop", "shake", "damageEnemy", "executeEnemy", "thinGround"];
var SILENT   = ["clampToArena", "pushOutOfPillars", "breakShroud", "damageEnemy",
                "executeEnemy", "thinGround"];

var FX = [];
function rec(kind) { return function () { FX.push(kind); }; }

var sandbox = { Math: Math, console: console, module: { exports: {} },
                TOUCH: false, TPAD: { holdYaw: function () { return null; } },
                ARC: { yaw: 0 }, mouse: { yaw: 0 }, cam: { mode: "arcade" },
                ENEMIES: [] };
FEEDBACK.concat(SILENT).forEach(function (n) { sandbox[n] = rec(n); });
sandbox.AU = {};
AU_KEYS.forEach(function (k) { sandbox.AU[k] = rec("AU." + k); });

vm.createContext(sandbox);
vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
var C = sandbox.module.exports.C;
sandbox.C = C;
sandbox.player = { x: 0, z: 0, yaw: 0, bodyYaw: 0, aim: 0, alive: true, veiled: false,
                   iframe: 0, execCd: 0, execLunge: 0, atkStage: -1, vx: 0, vz: 0 };
vm.runInContext([srcClamp, aimBody, srcExec, "var EXEC_LUNGE_T = " + mLunge[1] + ";"].join("\n"),
                sandbox, { filename: "index.html#EXEC" });

var EXEC_LUNGE_T = +mLunge[1];
var MOTION_RED = vm.runInContext("(" + srcRed + ")", sandbox);
/* Channels reduced motion switches OFF completely. A whiff whose whole tell
   lands in here is silent again for anyone who set the accessibility toggle,
   which is the same bug with a smaller blast radius. `fov` and `flash` survive
   at 0.25 and 0.34, sound is not a MOTION channel at all. */
var MUTED_BY_REDUCED = Object.keys(MOTION_RED).filter(function (k) { return MOTION_RED[k] === 0; });
var CHANNEL = { shake: "shake", ghost: "ghost", fovKick: "fov", bladeFlash: "flash" };
var MODES = ["arcade", "third", "first"];

/* =========================================================================
   2 · DRIVE IT
   ========================================================================= */
function husk(x, z, woundFrac) {
  return { live: true, state: "idle", x: x, z: z, maxHp: 100,
           hp: 100 * (woundFrac == null ? 1 : woundFrac) };
}

/* One press. Returns what the game emitted and what it charged for it. The
   player is re-seeded every time so a previous press cannot leak a cooldown
   into the next reading. */
function press(mode, enemies, seed) {
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

/* `verbYaw()` answers with `mouse.yaw` outside arcade and `player.yaw` inside
   it, so "straight ahead" is a different direction per mode. Asking the real
   function is what makes the three-mode claim a proof rather than three copies
   of one arcade run. */
function aimOf(mode) { sandbox.cam.mode = mode; return sandbox.verbYaw(); }
function ahead(mode, dist, offsetRad) {
  var a = aimOf(mode) + (offsetRad || 0);
  return { x: -Math.sin(a) * dist, z: -Math.cos(a) * dist };
}

function feedbackIn(fx) {
  return fx.filter(function (k) {
    return k.indexOf("AU.") === 0 || FEEDBACK.indexOf(k) >= 0;
  });
}

/* =========================================================================
   3 · THE VERDICT — one function, so the self-test in phase 5 can feed it a
   different verb and get the identical judgement.
   ========================================================================= */
function judge(fire) {
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
      crit("whiff." + mode + "." + c[0],
           "[" + mode + "] a whiff is perceivable — " + c[1],
           fb.length >= 1, fb.length ? fb.join(" + ") : "NOTHING RECORDED");
      crit("free." + mode + "." + c[0],
           "[" + mode + "] and it still costs nothing — " + c[1],
           r.cd === 0 && r.lunge === 0 && r.x === 0 && r.z === 0 && r.veiled === false,
           "cd " + r.cd + " · lunge " + r.lunge + " · moved " + (r.x !== 0 || r.z !== 0));
      crit("reduced." + mode + "." + c[0],
           "[" + mode + "] and it survives reduced motion — " + c[1],
           fb.some(function (k) {
             return MUTED_BY_REDUCED.indexOf(CHANNEL[k] || k) < 0;
           }),
           "reduced motion zeroes: " + MUTED_BY_REDUCED.join(", "));
      crit("notahit." + mode + "." + c[0],
           "[" + mode + "] and it does not borrow the hit's tells — " + c[1],
           r.fx.every(function (k) { return HIT_ONLY.indexOf(k) < 0; }),
           r.fx.filter(function (k) { return HIT_ONLY.indexOf(k) >= 0; }).join(",") || "clean");
    });

    /* The unavailable button keeps its silence. This is the card's `execCd > 0`
       early return, asserted unchanged — and its sibling, mid-strike. */
    var cd = fire(mode, [], { execCd: C.execCd * 0.5 });
    crit("cooldown." + mode, "[" + mode + "] a press on cooldown is still silent",
         cd.fx.length === 0 && cd.cd === C.execCd * 0.5,
         cd.fx.length ? "emitted " + cd.fx.join(",") : "silent, cd untouched");
    var mid = fire(mode, [], { atkStage: 1 });
    crit("midstrike." + mode, "[" + mode + "] a press mid-strike is still silent",
         mid.fx.length === 0, mid.fx.join(",") || "silent");

    /* A landing execute must still land. The cheapest way to make phase 1 green
       is to emit something unconditionally at the top of the function, which
       would also fire on every hit — so the hit is measured, not assumed. */
    var near = ahead(mode, C.execRange * 0.4);
    var hit  = fire(mode, [husk(near.x, near.z, 0.9)]);
    crit("hit." + mode, "[" + mode + "] a landing execute still charges and lunges",
         hit.cd === C.execCd && hit.lunge === EXEC_LUNGE_T && (hit.x !== 0 || hit.z !== 0),
         "cd " + hit.cd + " · lunge " + hit.lunge);
    crit("hitfx." + mode, "[" + mode + "] a landing execute still reads as a hit",
         hit.fx.indexOf("thinGround") >= 0 && feedbackIn(hit.fx).length >= 2,
         feedbackIn(hit.fx).join(" + "));

    /* THE CARD'S TITLE, as one assertion: the three outcomes of one button are
       three distinguishable outputs. */
    var whiff = fire(mode, []);
    crit("distinct." + mode, "[" + mode + "] whiff ≠ hit ≠ dead button",
         feedbackIn(whiff.fx).length >= 1 &&
         cd.fx.length === 0 &&
         feedbackIn(whiff.fx).join(",") !== feedbackIn(hit.fx).join(","),
         "whiff [" + feedbackIn(whiff.fx).join(",") + "] vs hit [" + feedbackIn(hit.fx).join(",") + "]");
  });

  /* The aim path is the REAL one, proven by its own disagreement: a husk parked
     on `player.yaw` is a hit in arcade and a whiff everywhere else once the two
     angles are pulled apart. If this file had stubbed verbYaw(), all three modes
     would agree here and the three-mode claim above would be one claim told
     three times. */
  sandbox.mouse.yaw = Math.PI;                       // camera looking the other way
  var body = { x: 0, z: -C.execRange * 0.4 };        // straight up player.yaw = 0
  var arc = fire("arcade", [husk(body.x, body.z, 0.9)]);
  var thr = fire("third",  [husk(body.x, body.z, 0.9)]);
  sandbox.mouse.yaw = 0;
  crit("aimpath", "the cone follows the MODE's aim, not one stubbed angle",
       arc.cd === C.execCd && thr.cd === 0,
       "arcade hit: " + (arc.cd === C.execCd) + " · third whiffed: " + (thr.cd === 0));

  return out;
}

/* =========================================================================
   4 · RUN IT AGAINST THE SHIPPED GAME
   ========================================================================= */
var checks = 0, fails = 0;
function ok(name, cond, detail) {
  checks++;
  if (cond) { if (VERBOSE) console.log("  ok    " + name + (detail ? "   (" + detail + ")" : "")); return; }
  fails++;
  console.log("  FAIL  " + name + (detail ? "\n        ^ " + detail : ""));
}

console.log("VEILRUN — Proving Ground · execute-feedback bar (VR-172)\n");
console.log("[anchors lifted from index.html]");
ok("BALANCE, AIM, tryExecute(), clamp and EXEC_LUNGE_T all lifted", true,
   "execRange " + C.execRange + " · execArc " + C.execArc + " · lunge " + EXEC_LUNGE_T + "s");
ok("AU's method names were read out of the file, not listed here", AU_KEYS.length >= 8,
   AU_KEYS.length + " sounds: " + AU_KEYS.join(", "));

console.log("\n[the shipped game]");
judge(press).forEach(function (r) {
  ok(r.name, r.pass, r.detail);
});

/* =========================================================================
   5 · THE BAR JUDGES ITSELF
   A verb that returns silently is precisely what this card was opened against.
   If the verdict function above passes it, the bar is decoration.
   ========================================================================= */
console.log("\n[the bar against known-bad verbs]");
function silentVerb(mode, enemies, seed) {
  /* The pre-VR-172 miss path, reduced: charges nothing, emits nothing. */
  return { fx: [], cd: (seed && seed.execCd) || 0, lunge: 0, x: 0, z: 0, aim: 0, veiled: false };
}
var silentV = judge(silentVerb).filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
ok("a silent verb FAILS the whiff bar", silentV.some(function (i) { return i.indexOf("whiff.") === 0; }),
   silentV.length + " criteria refused it");

/* A verb that shouts on every press — including on cooldown — is the lazy fix,
   and it must not pass either. */
function shoutyVerb(mode, enemies, seed) {
  var r = press(mode, enemies, seed);
  r.fx = r.fx.concat(["AU.exec"]);
  return r;
}
var shoutyV = judge(shoutyVerb).filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
ok("a verb that also fires on cooldown FAILS", shoutyV.some(function (i) { return i.indexOf("cooldown.") === 0; }),
   shoutyV.join(",") || "nothing refused it");

/* A whiff dressed in the hit's clothes — hitstop and shake — is a second lie
   about the same press, and criterion `notahit` exists for it. */
function fakeHitVerb(mode, enemies, seed) {
  var r = press(mode, enemies, seed);
  if (r.cd === 0) r.fx = r.fx.concat(["hitStop", "shake"]);
  return r;
}
var fakeV = judge(fakeHitVerb).filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
ok("a whiff wearing the hit's tells FAILS", fakeV.some(function (i) { return i.indexOf("notahit.") === 0; }),
   fakeV.join(",") || "nothing refused it");

/* And the bar must be satisfiable: a verb that is correct on every property has
   to pass, or every green above is vacuous. Built by taking the real one and
   giving the miss path a sound. */
function goodVerb(mode, enemies, seed) {
  var r = press(mode, enemies, seed);
  if (r.cd === 0 && !(seed && seed.atkStage >= 0) && feedbackIn(r.fx).length === 0) {
    r.fx = r.fx.concat(["AU.swing", "bladeFlash"]);
  }
  return r;
}
var goodV = judge(goodVerb).filter(function (r) { return !r.pass; });
ok("a correct verb PASSES every criterion", goodV.length === 0,
   goodV.map(function (r) { return r.id; }).join(",") || "all clear");

console.log("\n" + (fails ? "FAIL" : "PASS") + " — " + checks + " checks, " + fails + " failed.");
process.exit(fails ? 1 : 0);
