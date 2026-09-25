/* VEILRUN — shared hit-stop harness (VR-198)

   WHAT THIS PROTECTS. `games/_engine/hitstop.js` is the budgeted freeze channel
   both the 3D arena (Proving Ground) and one 2D v2 game (`pair-level-v2`) now
   drive their shared clock's `scale` from, instead of Proving Ground hand-
   rolling its own bare `game.hitStop` bypass and the 2D track having nothing
   like it at all — a turret hit there used to be a floating "HIT" and a
   camera shake with no held frame, the confirmation Proving Ground's own hits
   have always carried.

   IT REQUIRES THE REAL MODULE. `hitstop.js` is plain, dependency-free JS with
   no DOM and no game state — a straight `require()` runs the actual class,
   the `_clock.js`/`_motion.js`/`_bus.js` shape, never a retyped copy.

   SECTION 4 LIFTS THE REAL CONSUMER WIRING out of both HTML files, the
   `_floattext.js` Section 4 shape — never asserted from a comment, always
   from the actual source text that ships.

   SECTION 5 IS THE MUTATION PASS. Three one-line mutations against the
   module's own source — the latch turned into a sum, the cap removed, the
   countdown left unclamped below zero — evaled in their own sandbox, each
   proven to diverge from the real class on a scenario the real class gets
   right. A bar that cannot fail is not a bar.

   Dependency-free. Run:  node _hitstop.js
   ---------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");

var checks = 0, fails = [];
function ok(name, cond, detail) {
  checks++;
  if (!cond) fails.push(name + (detail ? "  — " + detail : ""));
}

console.log("\nVEILRUN · shared hit-stop harness (VR-198)\n" + "=".repeat(58));

var MODPATH = path.join(__dirname, "games", "_engine", "hitstop.js");
var SRC = fs.readFileSync(MODPATH, "utf8");
var HitStop = require(MODPATH).HitStop;

/* =========================================================================
   1 · SHAPE & DEFAULTS
   ========================================================================= */
console.log("\n[shape & defaults]");
ok("module exports a HitStop constructor", typeof HitStop === "function");
{
  var h = new HitStop();
  ok("default cap is 0.44s (twice the largest real call site, 220ms)", h.cap === 0.44, h.cap);
  ok("time starts at 0 (not active)", h.time === 0, h.time);
  ok("active() is false with no time on the clock", h.active() === false);

  var h2 = new HitStop(0.1);
  ok("opts override cap", h2.cap === 0.1, h2.cap);
}

/* =========================================================================
   2 · raise() — LATCH, NOT A SUM, AND A HARD CAP
   ========================================================================= */
console.log("\n[raise() — latch, not a sum]");
{
  var h = new HitStop();
  h.raise(70);
  ok("raise(70) sets time to 0.07s", Math.abs(h.time - 0.07) < 1e-9, h.time);

  h.raise(46);
  ok("a SMALLER raise never shortens an active freeze (max, not overwrite)",
     Math.abs(h.time - 0.07) < 1e-9, h.time);

  h.raise(90);
  ok("a LARGER raise extends it — still the max, never the sum (0.07+0.09 would be 0.16)",
     Math.abs(h.time - 0.09) < 1e-9, h.time);

  var h2 = new HitStop();
  h2.raise(1000);
  ok("a raise past the cap is clamped to the cap, not honoured in full",
     Math.abs(h2.time - h2.cap) < 1e-9, h2.time);

  var h3 = new HitStop();
  h3.raise(0);
  ok("raise(0) is a no-op", h3.time === 0, h3.time);
  h3.raise(-50);
  ok("a negative raise is a no-op, not a negative latch", h3.time === 0, h3.time);
}

/* =========================================================================
   3 · update() — REAL TIME ONLY, NEVER BELOW ZERO
   ========================================================================= */
console.log("\n[update() — real time, floors at zero]");
{
  var h = new HitStop();
  h.raise(100);           // 0.1s
  h.update(0.04);
  ok("update(dt) decrements by real dt", Math.abs(h.time - 0.06) < 1e-9, h.time);
  ok("still active with time remaining", h.active() === true);

  h.update(0.10);         // overshoots the remainder
  ok("update() never goes negative — floors at exactly 0", h.time === 0, h.time);
  ok("no longer active once the countdown reaches 0", h.active() === false);

  var h2 = new HitStop();
  ok("update() with nothing active does not throw and stays at 0",
     (function () { try { h2.update(0.5); return h2.time === 0; } catch (e) { return false; } })());
}

/* =========================================================================
   4 · reset()
   ========================================================================= */
console.log("\n[reset()]");
{
  var h = new HitStop();
  h.raise(200);
  h.reset();
  ok("reset() drops any live countdown immediately", h.time === 0 && h.active() === false);
}

/* =========================================================================
   5 · THE CONSUMERS — lifted out of the real HTML, never a retyped copy
   ========================================================================= */
console.log("\n[Proving Ground wires the real module]");
var PG_PATH = path.join(__dirname, "games", "proving-ground", "index.html");
var pgHtml = fs.readFileSync(PG_PATH, "utf8");
{
  ok("hitstop.js is loaded by proving-ground/index.html",
     /<script src="\.\.\/_engine\/hitstop\.js"><\/script>/.test(pgHtml));
  ok("Proving Ground constructs a VE.HitStop channel",
     /var HITSTOP = new VE\.HitStop\(\);/.test(pgHtml));
  ok("hitStop(ms) delegates to it rather than a hand-rolled bypass",
     /function hitStop\(ms\) \{ HITSTOP\.raise\(ms\); \}/.test(pgHtml));
  ok("the frame loop drives CLOCK.scale from HITSTOP.active(), never a bare game.hitStop check",
     /CLOCK\.scale = HITSTOP\.active\(\) \? 0 : 1;/.test(pgHtml));
  ok("the dead game.hitStop field is gone from game state, not left stale beside the real channel",
     !/hitStop:\s*0/.test(pgHtml));
  ok("resetRun() clears the channel via the real reset(), not a hand-rolled zero",
     /HITSTOP\.reset\(\);/.test(pgHtml));
  ok("the strike call site still calls hitStop(ms) unchanged (78 heavy / 46 light)",
     /hitStop\(player\.atkStage === 2 \? 78 : 46\);/.test(pgHtml));
  ok("every other real call site still calls hitStop(ms) unchanged (90 execute, 130 exec-kill, 55 kill, 70 hurt, 220 death)",
     [90, 130, 55, 70, 220].every(function (ms) {
       return new RegExp("hitStop\\(" + ms + "\\)").test(pgHtml);
     }));
}

console.log("\n[pair-level-v2 raises one on a real gameplay event]");
var PL2_PATH = path.join(__dirname, "games", "pair-level-v2", "index.html");
var pl2Html = fs.readFileSync(PL2_PATH, "utf8");
{
  ok("hitstop.js is loaded by pair-level-v2/index.html",
     /<script src="\.\.\/_engine\/hitstop\.js"><\/script>/.test(pl2Html));
  ok("pair-level-v2 constructs a VE.HitStop channel",
     /var HITSTOP=new VE\.HitStop\(\);/.test(pl2Html));
  /* VR-198, second pass (9/24). This used to assert the literal text
     `HITSTOP.raise(90); softReset();` — which is the bug, written down as the
     bar. The freeze was raised and the level was reset on the same line, so
     the held frame showed Latch back at his spawn and Jordan saw nothing. A
     check that pins the call proves the call; it cannot see the picture. */
  var hitLine = (pl2Html.match(/if\(L\.world===s\.world && L\.x<s\.x[^\n]*/) || [""])[0];
  ok("the turret-hit call site hands off to caught() (not just constructs the channel)",
     /\{ s\.dead=true; caught\(s\); \}/.test(hitLine), hitLine.slice(0, 90));
  ok("the turret-hit call site never resets the level on the same line it raises the hold",
     hitLine !== "" && !/softReset\(\)/.test(hitLine) && !/HITSTOP\.raise/.test(hitLine));
  ok("pair-level-v2's frame loop settles a catch AFTER ticking the channel and BEFORE deciding the clock's scale",
     /HITSTOP\.update\(clk\.raw\);\s*settleCaught\(\);[^\n]*\n\s*CLOCK\.scale=HITSTOP\.active\(\)\?0:1;/.test(pl2Html));
  ok("pair-level-v2 ticks HITSTOP every frame, not only while state===\"play\"",
     /HITSTOP\.update\(clk\.raw\);/.test(pl2Html) &&
     pl2Html.indexOf("HITSTOP.update(clk.raw);") < pl2Html.indexOf('if(state==="play"){\n      CLOCK.accumulate'));
  ok("reset() clears a pending catch and the channel, so R mid-hold never resets twice",
     /caughtPending=false; HITSTOP\.reset\(\);/.test(pl2Html));
  /* Found by the release-steward review, 9/24: input was gated only on
     state==="play", so a Flip pressed as a dodge reflex inside the 220ms teleported
     Latch while the frame was held — the held picture stopped being the impact. */
  ok("no input reaches the game during the hold (isPlay is false while a catch is pending)",
     /isPlay:function\(\)\{ return state==="play" && !caughtPending; \}/.test(pl2Html));
  ok("catch-up steps owed in the same frame as the hit do not run past it",
     /function simStep\(\)\{\n\s*if\(caughtPending\) return;/.test(pl2Html));
  ok("a win cannot be recorded behind a pending catch",
     /if\(bothInExit\(\) && !caughtPending\) win\(\);/.test(pl2Html));
}

/* 5b · EXECUTED, NOT READ. caught() and settleCaught() are lifted out of the
   real HTML by name — never a retyped copy — and driven frame by frame at
   1/60s against the REAL HitStop class. softReset() is a stub that records
   WHEN it ran and WHERE Latch was standing at that moment, which is exactly
   the question the first build got wrong: what is on screen while the world
   holds still. */
console.log("\n[pair-level-v2 — the held frame is the impact, driven by execution]");
function liftFn(src, name) {
  var at = src.indexOf("function " + name + "(");
  if (at < 0) return null;
  var i = src.indexOf("{", at), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return null;
}
var holdDecl = (pl2Html.match(/var CAUGHT_HOLD_MS=(\d+), caughtPending=false;/) || [])[1];
var caughtSrc = liftFn(pl2Html, "caught"), settleSrc = liftFn(pl2Html, "settleCaught");
ok("caught() and settleCaught() both lift out of the real file", !!(caughtSrc && settleSrc && holdDecl));

/* Proving Ground's largest real call site IS the death freeze. A shot in Seam
   Gate ends the attempt, so it must hold at least that long — read off PG's
   own source, never a number typed here (the Bar Builder's provenance rule). */
var pgCalls = (pgHtml.match(/hitStop\((\d+)\)/g) || []).map(function (m) { return +m.replace(/\D/g, ""); });
var pgDeath = Math.max.apply(null, pgCalls.length ? pgCalls : [0]);
ok("a caught Latch holds as long as a Proving Ground death (" + pgDeath + "ms, read from PG's source)",
   +holdDecl === pgDeath && pgDeath > 0, "CAUGHT_HOLD_MS=" + holdDecl);

function runCatch(caughtFn, settleFn) {
  var box = {
    HITSTOP: new HitStop(), L: { x: 480, y: 400, w: 22, h: 44, world: 1 }, sparks: [],
    spawned: 0, resets: [],
    FLOATTEXT: { spawn: function () { box.spawned++; } },
    SHAKE: { raise: function () {} }, MOTION_SHAKE: 1
  };
  box.softReset = function () {
    box.resets.push({ activeAtReset: box.HITSTOP.active(), x: box.L.x, frame: box.frame });
    box.L.x = 48;                                        // the spawn — what the first build showed
  };
  vm.createContext(box);
  vm.runInContext("var caughtPending=false, CAUGHT_HOLD_MS=" + (+holdDecl || 220) + ";\n" +
                  caughtFn + "\n" + settleFn, box, { filename: "pair-level-v2#caught" });
  var shot = { x: 490, y: 420, world: 1 };
  box.frame = 0;
  vm.runInContext("caught(shot)", Object.assign(box, { shot: shot }));
  var heldAt = [];
  for (var f = 1; f <= 40; f++) {
    box.frame = f;
    box.HITSTOP.update(1 / 60);
    vm.runInContext("settleCaught()", box);
    if (box.HITSTOP.active()) heldAt.push(box.L.x);
  }
  var resetsAfterHold = box.resets.length;
  vm.runInContext("caught(shot); caught(shot)", box);    // a double hit inside one beat
  return { box: box, heldAt: heldAt, resetsAfterHold: resetsAfterHold, doubleTime: box.HITSTOP.time };
}
if (caughtSrc && settleSrc) {
  var R = runCatch(caughtSrc, settleSrc);
  ok("the hold is live the instant Latch is caught", R.heldAt.length > 0);
  ok("every held frame shows Latch where the shot landed, never at the spawn",
     R.heldAt.length > 0 && R.heldAt.every(function (x) { return x === 480; }), JSON.stringify(R.heldAt.slice(0, 3)));
  ok("the level resets exactly once per catch", R.resetsAfterHold === 1, "resets " + R.resetsAfterHold);
  ok("the reset waits for the hold to run out — never while the world is frozen",
     R.box.resets.every(function (r) { return r.activeAtReset === false; }));
  var expectFrames = Math.ceil((+holdDecl / 1000) * 60 - 1e-9);
  ok("the reset lands on the first frame after the hold (" + expectFrames + " frames at 60Hz), not before and not late",
     R.box.resets[0] && Math.abs(R.box.resets[0].frame - expectFrames) <= 1, R.box.resets[0] && R.box.resets[0].frame);
  ok("a second shot inside the same beat neither extends the hold nor raises a second HIT",
     Math.abs(R.doubleTime - (+holdDecl / 1000)) < 1e-9 && R.box.spawned === 2,
     "time " + R.doubleTime + ", HIT spawns " + R.box.spawned);
  ok("impact sparks are left at the shot's position for the held frame",
     R.box.sparks.length >= 1 && R.box.sparks.every(function (k) { return k.x === 490 && k.world === 1; }));

  /* Mutant D — the first build's ordering, put back: reset inside caught(). */
  var mutD = caughtSrc.replace("HITSTOP.raise(CAUGHT_HOLD_MS);", "HITSTOP.raise(CAUGHT_HOLD_MS); softReset();");
  ok("mutant D source actually changed (anchor still matches)", mutD !== caughtSrc);
  var RD = runCatch(mutD, settleSrc);
  ok("MUTANT KILLED — resetting on the raise line holds the SPAWN on screen, the 9/24 bug",
     RD.heldAt.length > 0 && RD.heldAt.every(function (x) { return x === 48; }) &&
     RD.box.resets.some(function (r) { return r.activeAtReset === true; }));
}

/* =========================================================================
   6 · NEVER SCALED BY THE MOTION GROUP — the `:3763` ruling, by construction
   ========================================================================= */
console.log("\n[never scaled by the motion group]");
ok("hitstop.js itself never reads MOTION — the freeze cannot be an accessibility edit",
   !/\bMOTION\b/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, "")));
ok("no real call site multiplies a hitStop(...) argument by a MOTION channel (Proving Ground)",
   !/hitStop\([^)]*MOTION/.test(pgHtml));
ok("no real call site multiplies a HITSTOP.raise(...) argument by a MOTION channel (pair-level-v2)",
   !/HITSTOP\.raise\([^)]*MOTION/.test(pl2Html));

/* =========================================================================
   7 · MUTATION PASS — three one-line breaks, each proven to diverge
   ========================================================================= */
console.log("\n[mutation pass — a bar that cannot fail is not a bar]");

function evalMutant(mutatedSrc) {
  var sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(mutatedSrc, sandbox, { filename: "hitstop.js#mutant" });
  return sandbox.module.exports.HitStop;
}

{
  // Mutant A: the latch becomes a SUM.
  var srcSum = SRC.replace(
    "this.time = Math.max(this.time, s);",
    "this.time = this.time + s;"
  );
  ok("mutant A source actually changed (anchor still matches)", srcSum !== SRC);
  var HitStopSum = evalMutant(srcSum);
  var hs = new HitStopSum();
  hs.raise(70); hs.raise(46);
  ok("MUTANT KILLED — summing instead of latching turns two close hits into a longer freeze than either",
     Math.abs(hs.time - 0.116) < 1e-9, "mutant time " + hs.time + " (real class holds at 0.07)");
}
{
  // Mutant B: the cap is removed.
  var srcNoCap = SRC.replace(
    "s = Math.min(s, this.cap);",
    "// cap removed"
  );
  ok("mutant B source actually changed (anchor still matches)", srcNoCap !== SRC);
  var HitStopNoCap = evalMutant(srcNoCap);
  var hn = new HitStopNoCap();
  hn.raise(1000);
  ok("MUTANT KILLED — removing the cap lets a single raise freeze the game for a full second",
     hn.time === 1, "mutant time " + hn.time + " (real class caps at " + new HitStop().cap + ")");
}
{
  // Mutant C: update() no longer floors at zero.
  var srcNoFloor = SRC.replace(
    "this.time -= dt;\n    if (this.time < 0) this.time = 0;",
    "this.time -= dt;"
  );
  ok("mutant C source actually changed (anchor still matches)", srcNoFloor !== SRC);
  var HitStopNoFloor = evalMutant(srcNoFloor);
  var hf = new HitStopNoFloor();
  hf.raise(10);            // 0.01s
  hf.update(0.5);
  ok("MUTANT KILLED — with no floor, a big dt drives time negative and active() never reports done",
     hf.time < 0, "mutant time " + hf.time + " (real class floors at 0)");
}

console.log("\n" + "=".repeat(58));
if (fails.length) {
  console.log("FAILED (" + fails.length + "):");
  fails.forEach(function (f) { console.log("  ✗ " + f); });
  console.log("\nFAIL — " + checks + " checks, " + fails.length + " failed.");
  process.exit(1);
}
console.log("PASS — " + checks + " checks");
