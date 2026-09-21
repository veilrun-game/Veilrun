/* VEILRUN — shared easing-counter harness (VR-206)

   WHAT THIS IS. `games/_engine/counter.js` is the fifth shared module in the
   `_clock.js` family — a REAL SHARED MODULE, `require`d directly, never
   lifted. It replaces the site's habit of writing a final value straight into
   the DOM (the run-over score, the leaderboard) with a number that ticks.
   This harness proves three things, in three sections —

     1 · THE MODULE ITSELF — construction, animateTo/update/skip, landing
         EXACTLY on the target (never `99.999`), and a retarget mid-tween
         redirecting smoothly rather than fighting the tween already running.
     2 · PROVING GROUND'S WIRE — lifted out of the HTML, never retyped: the
         script tag, `SCORE_COUNTER` built from the real class, `endRun()`
         starting a tween to the real score and calling `skip()` under the
         same `MOTION.banner<=0.5` reduced-motion test the rest of the file
         already uses, and the frame loop actually ticking it.
     3 · THE LEADERBOARD'S WIRE — lifted out of `js/app.js`: a points-kind
         score renders a `data-pts` placeholder instead of the final number,
         and `animateBoardCounters()` drives it through the real class with
         the same reduced-motion contract.

   THE THREE CARD-NAMED GUARANTEES, proven by execution against the real
   class: exact landing, reduced motion is INSTANT (not merely faster), and a
   retarget takes the counter's CURRENT value as its new start rather than
   restarting from the original `from` — two calls three frames apart must
   look like one smooth correction, not two tweens racing each other.

   Dependency-free. Run:  node _counter.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var COUNTER_PATH = path.join(__dirname, "games", "_engine", "counter.js");
var SRC = fs.readFileSync(COUNTER_PATH, "utf8");
var Counter = require(COUNTER_PATH).Counter;

/* =========================================================================
   1 · THE MODULE — construction, animateTo, update, skip, exact landing
   ========================================================================= */
{
  ok("module exports a Counter constructor", typeof Counter === "function");

  var c0 = new Counter();
  ok("with no argument, starts at 0 and is not active", c0.value === 0 && c0.active === false);
  var c1 = new Counter(42);
  ok("an initial value is honoured", c1.value === 42 && c1.from === 42 && c1.to === 42);

  var c = new Counter(0);
  c.animateTo(100, { duration: 1 });
  ok("animateTo() marks the counter active when target differs from current", c.active === true);
  ok("animateTo() does not jump the value immediately", c.value === 0);

  var mid = c.update(0.5);
  ok("update() partway through returns a value strictly between from and to",
     mid > 0 && mid < 100, mid);
  ok("update() is still active partway through", c.active === true);

  var landed = c.update(0.5);
  ok("update() reaching the full duration LANDS EXACTLY on the target — never 99.999",
     landed === 100, landed);
  ok("the counter goes inactive the instant it lands", c.active === false);
  ok("further update() calls after landing are a no-op returning the settled value",
     c.update(1) === 100);

  // Overshooting dt in one call must still land exactly, not overshoot past `to`.
  var c2 = new Counter(0);
  c2.animateTo(50, { duration: 0.2 });
  var over = c2.update(999);
  ok("a dt far larger than duration still lands exactly on target, never past it",
     over === 50, over);

  // Zero-duration / already-there resolve synchronously.
  var c3 = new Counter(0);
  var doneCalled3 = false;
  c3.animateTo(10, { duration: 0, onDone: function () { doneCalled3 = true; } });
  ok("a duration of 0 resolves immediately, synchronously", c3.value === 10 && c3.active === false);
  ok("onDone fires synchronously for a zero-duration animateTo", doneCalled3 === true);

  var c4 = new Counter(7);
  var doneCalled4 = false;
  c4.animateTo(7, { onDone: function () { doneCalled4 = true; } });
  ok("animateTo() to the CURRENT value resolves immediately rather than tweening a no-op",
     c4.active === false);
  ok("onDone still fires when the target equals the current value", doneCalled4 === true);

  // onDone fires exactly once, with the final value.
  var c5 = new Counter(0), doneArg = null, doneCount = 0;
  c5.animateTo(20, { duration: 0.1, onDone: function (v) { doneCount++; doneArg = v; } });
  c5.update(0.05); c5.update(0.05); c5.update(0.05);
  ok("onDone fires exactly once even if update() keeps being called after landing", doneCount === 1);
  ok("onDone receives the final landed value", doneArg === 20, doneArg);

  // skip(): the hard skip-to-final for reduced motion.
  var c6 = new Counter(0);
  var skipDone = false;
  c6.animateTo(30, { duration: 5, onDone: function () { skipDone = true; } });
  var skipped = c6.skip();
  ok("skip() lands on the target immediately, mid-tween", skipped === 30 && c6.value === 30);
  ok("skip() deactivates the counter", c6.active === false);
  ok("skip() fires onDone", skipDone === true);
  ok("skip() on an already-settled counter is a harmless no-op", c6.skip() === 30);

  // Retarget mid-tween: the NEW tween must start from the CURRENT animated
  // value, not the original `from` — the card's own "does not fight itself".
  var c7 = new Counter(0);
  c7.animateTo(100, { duration: 1 });
  var partway = c7.update(0.5);              // ~50-ish, eased
  c7.animateTo(0, { duration: 1 });           // retarget while still in flight
  ok("a retarget mid-tween starts from the CURRENT value, not the original `from`",
     c7.from === partway, "retarget from " + c7.from + " vs value-at-retarget " + partway);
  ok("a retarget does not jump the visible value at the moment it happens",
     c7.value === partway, c7.value);
  var afterRetarget = c7.update(0.001);
  ok("immediately after a retarget, the value moves toward the NEW target, not the old one",
     afterRetarget < partway, afterRetarget + " vs " + partway);

  // A retarget replaces any pending onDone rather than firing the old one late.
  var c8 = new Counter(0), oldDone = false, newDone = false;
  c8.animateTo(10, { duration: 1, onDone: function () { oldDone = true; } });
  c8.update(0.1);
  c8.animateTo(20, { duration: 0.1, onDone: function () { newDone = true; } });
  c8.update(0.2);
  ok("retargeting replaces the pending onDone — the superseded callback never fires",
     oldDone === false && newDone === true, "old=" + oldDone + " new=" + newDone);

  ok("Counter.ease is exposed as the eased curve function", typeof Counter.ease === "function");
  ok("Counter.ease(0) is 0 and Counter.ease(1) is 1 (a valid easing curve)",
     Counter.ease(0) === 0 && Math.abs(Counter.ease(1) - 1) < 1e-9);
}

/* =========================================================================
   2 · PROVING GROUND'S WIRE — lifted, not retyped
   ========================================================================= */
var PG_PATH = path.join(__dirname, "games", "proving-ground", "index.html");
var pgHtml = fs.readFileSync(PG_PATH, "utf8");

function lift(html, label, re, file) {
  var m = html.match(re);
  if (!m) {
    fails.push("ANCHOR LOST — could not lift `" + label + "` out of " + file +
      ". This bar will not fall back to a copy; fix the anchor in _counter.js.");
    return null;
  }
  return m;
}

{
  ok("counter.js is loaded by proving-ground/index.html",
     /<script src="\.\.\/_engine\/counter\.js">/.test(pgHtml));
  ok("SCORE_COUNTER is constructed from the real class",
     /var SCORE_COUNTER = new VE\.Counter\(/.test(pgHtml));

  var updM = lift(pgHtml, "updateScoreCounter()", /\nfunction updateScoreCounter\([^)]*\) \{[\s\S]*?\n\}/, "proving-ground/index.html");
  if (updM) {
    ok("updateScoreCounter() calls SCORE_COUNTER.update()", /SCORE_COUNTER\.update\(/.test(updM[0]));
  }
  ok("updateScoreCounter() is called from the real frame loop, on wall time (raw)",
     /updateScoreCounter\(raw\)/.test(pgHtml));

  var endM = lift(pgHtml, "endRun()", /\nfunction endRun\(\) \{[\s\S]*?\n\}/, "proving-ground/index.html");
  if (endM) {
    var body = endM[0];
    ok("endRun() starts a tween to the real score via animateTo()",
       /SCORE_COUNTER\.animateTo\(score,/.test(body));
    ok("endRun() calls skip() under the SAME reduced-motion test the rest of the file uses",
       /MOTION\.banner <= 0\.5\) SCORE_COUNTER\.skip\(\)/.test(body));
    ok("endRun() no longer writes the score straight into the DOM unanimated",
       !/\$\("o-score"\)\.textContent = score;/.test(body));
  }
}

/* =========================================================================
   3 · THE LEADERBOARD'S WIRE — lifted out of js/app.js
   ========================================================================= */
var APP_PATH = path.join(__dirname, "js", "app.js");
var appJs = fs.readFileSync(APP_PATH, "utf8");
var appHtml = fs.readFileSync(path.join(__dirname, "app.html"), "utf8");

{
  ok("counter.js is loaded by app.html",
     /<script src="games\/_engine\/counter\.js">/.test(appHtml));

  var animM = lift(appJs, "animateBoardCounters()", /\n  function animateBoardCounters\([^)]*\) \{[\s\S]*?\n  \}/, "js/app.js");
  if (animM) {
    var ab = animM[0];
    ok("animateBoardCounters() drives the real VE.Counter class", /new VE\.Counter\(/.test(ab));
    ok("animateBoardCounters() reads a reduced-motion preference and calls skip()",
       /matchMedia/.test(ab) && /\.skip\(\)/.test(ab));
    ok("animateBoardCounters() calls update() on the real counters, not a re-derived curve",
       /\.counter\.update\(/.test(ab));
  }

  var loadM = lift(appJs, "loadBoardInto()", /\n  async function loadBoardInto\([^)]*\) \{[\s\S]*?\n  \}/, "js/app.js");
  if (loadM) {
    var lb = loadM[0];
    ok("loadBoardInto() renders a points score as a data-pts placeholder, not the final text",
       /data-pts="\$\{Math\.round\(s\.ms\)\}"/.test(lb) || /data-pts=/.test(lb));
    ok("loadBoardInto() calls animateBoardCounters() after rendering", /animateBoardCounters\(el\)/.test(lb));
    ok("a TIME-kind score is left alone — fmt() output goes straight in, unchanged",
       /fmt\(s\.ms\)/.test(lb));
  }
}

/* =========================================================================
   4 · MUTATION PASS — a bar that cannot fail is not a bar
   ========================================================================= */
function mutant(find, replace, label) {
  if (SRC.indexOf(find) === -1) {
    fails.push("mutation anchor lost for \"" + label + "\" — counter.js no longer contains: " + find);
    return null;
  }
  var src = SRC.split(find).join(replace);
  var sandbox = { module: { exports: {} }, Math: Math, console: console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "counter.js#" + label });
  return sandbox.module.exports.Counter;
}

{
  // -- A: landing no longer forces the exact target — float drift could ship "99.999"
  var MutA = mutant(
    "  Counter.prototype._land = function () {\n    this.value = this.to;",
    "  Counter.prototype._land = function () {\n    /* value left as whatever update() last computed */",
    "landing-not-exact"
  );
  if (MutA) {
    var realC = new Counter(0); realC.animateTo(1, { duration: 0.3 });
    realC.update(0.1); realC.update(0.1); realC.update(0.1);
    var mutC = new MutA(0); mutC.animateTo(1, { duration: 0.3 });
    mutC.update(0.1); mutC.update(0.1); mutC.update(0.1);
    ok("mutant A (landing not forced exact) diverges from the real module",
       realC.value === 1 && mutC.value !== 1,
       "real=" + realC.value + " mutant=" + mutC.value);
  }

  // -- B: retarget uses the ORIGINAL from instead of the current value --------
  var MutB = mutant(
    "    this.from = this.value;      // always the CURRENT value — this is the retarget guarantee",
    "    /* from left unchanged — the retarget bug this mutant recreates */",
    "retarget-uses-stale-from"
  );
  if (MutB) {
    var realR = new Counter(0);
    realR.animateTo(100, { duration: 1 });
    realR.update(0.5);
    var beforeRetarget = realR.value;
    realR.animateTo(0, { duration: 1 });
    var mutR = new MutB(0);
    mutR.animateTo(100, { duration: 1 });
    mutR.update(0.5);
    mutR.animateTo(0, { duration: 1 });
    ok("mutant B (retarget keeps the stale `from`) diverges from the real module",
       realR.from === beforeRetarget && mutR.from !== beforeRetarget,
       "real.from=" + realR.from + " mutant.from=" + mutR.from + " (value at retarget was " + beforeRetarget + ")");
  }

  // -- C: skip() stops firing onDone -----------------------------------------
  var MutC = mutant(
    "  Counter.prototype.skip = function () {\n    if (!this.active) return this.value;\n    return this._land();\n  };",
    "  Counter.prototype.skip = function () {\n    if (!this.active) return this.value;\n    this.value = this.to; this.active = false; return this.value;\n  };",
    "skip-does-not-fire-onDone"
  );
  if (MutC) {
    var realDone = false, mutDone = false;
    var realS = new Counter(0); realS.animateTo(5, { duration: 1, onDone: function () { realDone = true; } }); realS.skip();
    var mutS = new MutC(0); mutS.animateTo(5, { duration: 1, onDone: function () { mutDone = true; } }); mutS.skip();
    ok("mutant C (skip stops firing onDone) diverges from the real module",
       realDone === true && mutDone === false, "real=" + realDone + " mutant=" + mutDone);
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — easing counter: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
