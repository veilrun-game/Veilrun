/* VEILRUN — shared floating combat text harness (VR-201)

   WHAT THIS IS. `games/_engine/floattext.js` is the pooled, fixed-size
   floating-text component: spawn, rise, fade, recycle, a hard cap on live
   instances, cleared by a single `reset()` call. This harness proves four
   things, in four sections —

     1 · THE MODULE ITSELF — construction, spawn/tick/live/reset, the
         rise/alpha curves.
     2 · THE BURST GUARANTEE — the card's own words: the pool never grows
         past its cap under a burst, and nothing survives a reset.
     3 · PROVING GROUND'S WIRE — lifted out of the HTML, never retyped:
         the script tag, the pool constructed at a named cap, `floatNumber()`
         drawing from it instead of creating/removing a DOM node per hit,
         and `resetRun()` clearing it.
     4 · A SECOND GENRE — `pair-level-v2/index.html` raises one, proving this
         is a shared module and not a Proving-Ground-only rename.
     5 · CRIT WITHOUT COLOUR, AND A MINIMUM SIZE — read out of the shipped
         `.fnum`/`.fnum.crit` CSS rather than a retyped copy, so "crit reads
         with colour vision removed" and "not as small as the HUD's smallest
         text" are asserted, not chosen by eye.

   PHASE 6 is a short mutation pass on the pool itself (the `_clock.js`/
   `_motion.js` contract: a bar that cannot fail is not a bar) — the cap
   guard removed, and `reset()` turned into a no-op.

   Dependency-free. Run:  node _floattext.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var FT_PATH = path.join(__dirname, "games", "_engine", "floattext.js");
var SRC = fs.readFileSync(FT_PATH, "utf8");
var FloatText = require(FT_PATH).FloatText;

/* =========================================================================
   1 · THE MODULE — construction, spawn, tick, live, reset, curves
   ========================================================================= */
{
  ok("module exports a FloatText constructor", typeof FloatText === "function");
  ok("throws on a non-positive cap", (function () {
    try { new FloatText(0); return false; } catch (e) { return true; }
  })());

  var p = new FloatText(4);
  ok("starts with cap slots, none live", p.slots.length === 4 && p.live().length === 0);

  var s1 = p.spawn(1, 2, 3, "10", false);
  ok("spawn() returns the slot it filled, marked live", s1.live === true);
  ok("spawn() carries position/text/crit through unchanged",
     s1.x === 1 && s1.y === 2 && s1.z === 3 && s1.text === "10" && s1.crit === false);
  ok("live() reflects the one spawned slot", p.live().length === 1);

  var s2 = p.spawn(0, 0, 0, "20", true);
  ok("spawn() coerces text to a string", typeof s2.text === "string" && s2.text === "20");
  ok("spawn() coerces crit to a boolean", s2.crit === true);

  ok("tick(0) does not kill a freshly spawned slot", (p.tick(0), p.live().length === 2));
  ok("tick() past LIFE kills a slot", (function () {
    var q = new FloatText(1); q.spawn(0, 0, 0, "x", false);
    q.tick(FloatText.LIFE + 0.01);
    return q.live().length === 0;
  })());
  ok("tick() just short of LIFE keeps a slot alive", (function () {
    var q = new FloatText(1); q.spawn(0, 0, 0, "x", false);
    q.tick(FloatText.LIFE - 0.01);
    return q.live().length === 1;
  })());

  // -- rise / alpha curves --------------------------------------------------
  var c = new FloatText(1);
  var s = c.spawn(0, 0, 0, "x", false);
  ok("riseOf() is 0 at age 0", c.riseOf(s) === 0);
  s.age = FloatText.LIFE;
  ok("riseOf() reaches RISE by the end of LIFE", Math.abs(c.riseOf(s) - FloatText.RISE) < 1e-9, c.riseOf(s));
  s.age = FloatText.LIFE * 2;
  ok("riseOf() never exceeds RISE past the end of LIFE", c.riseOf(s) === FloatText.RISE);

  var a = new FloatText(1);
  var sa = a.spawn(0, 0, 0, "x", false);
  ok("alphaOf() starts at 0", a.alphaOf(sa) === 0);
  sa.age = FloatText.LIFE * FloatText.FADE_IN;
  ok("alphaOf() reaches 1 at the fade-in boundary", Math.abs(a.alphaOf(sa) - 1) < 1e-9, a.alphaOf(sa));
  sa.age = FloatText.LIFE;
  ok("alphaOf() reaches 0 by the end of LIFE", Math.abs(a.alphaOf(sa) - 0) < 1e-9, a.alphaOf(sa));

  ok("LIFE/RISE/FADE_IN are exposed as constants", typeof FloatText.LIFE === "number" &&
     typeof FloatText.RISE === "number" && typeof FloatText.FADE_IN === "number");
}

/* =========================================================================
   2 · THE BURST GUARANTEE — the card's own two claims
   ========================================================================= */
{
  var cap = 6;
  var p = new FloatText(cap);
  for (var i = 0; i < cap * 5; i++) p.spawn(i, 0, 0, String(i), false);
  ok("the pool never grows past its cap under a burst far larger than it",
     p.slots.length === cap && p.live().length <= cap, p.slots.length + "/" + p.live().length);

  // A burst that never lets a slot die still recycles the OLDEST one, not a
  // random one — proven by seq order, not by re-describing the loop.
  var p2 = new FloatText(3);
  var a1 = p2.spawn(0, 0, 0, "a", false);
  var a2 = p2.spawn(0, 0, 0, "b", false);
  var a3 = p2.spawn(0, 0, 0, "c", false);
  var a4 = p2.spawn(0, 0, 0, "d", false);   // pool full — must reuse a1 (the oldest)
  ok("a spawn past the cap reuses the OLDEST live slot", a4 === a1, "reused seq " + a4.seq);
  ok("the two untouched slots are unaffected by the recycle",
     a2.text === "b" && a3.text === "c");

  // Nothing survives a reset.
  var p3 = new FloatText(5);
  for (var j = 0; j < 5; j++) p3.spawn(j, 0, 0, String(j), j % 2 === 0);
  ok("before reset, every slot is live", p3.live().length === 5);
  p3.reset();
  ok("reset() leaves nothing live", p3.live().length === 0);
  ok("reset() is synchronous — no timer is pending after it returns",
     (p3.tick(0), p3.live().length === 0));
}

/* =========================================================================
   3 · PROVING GROUND'S WIRE — lifted, not retyped
   ========================================================================= */
var PG_PATH = path.join(__dirname, "games", "proving-ground", "index.html");
var pgHtml = fs.readFileSync(PG_PATH, "utf8");

function lift(html, label, re, bag) {
  var m = html.match(re);
  if (!m) {
    bag.push("ANCHOR LOST — could not lift `" + label + "` out of " + path.basename(path.dirname(PG_PATH)) +
      "/index.html. This bar will not fall back to a copy; fix the anchor in _floattext.js.");
    return null;
  }
  return m;
}

{
  ok("floattext.js is loaded by proving-ground/index.html",
     /<script src="\.\.\/_engine\/floattext\.js">/.test(pgHtml));

  var capM = lift(pgHtml, "FTMAX", /var FTMAX = (\d+);/, fails);
  var ctorM = lift(pgHtml, "FLOATTEXT = new VE.FloatText(...)", /var FLOATTEXT = new VE\.FloatText\(FTMAX\);/, fails);
  ok("FLOATTEXT is constructed at the declared FTMAX cap", !!(capM && ctorM));
  if (capM) ok("FTMAX is a sane positive cap", Number(capM[1]) > 0, capM[1]);

  var fnM = lift(pgHtml, "floatNumber()", /\nfunction floatNumber\([^)]*\) \{[\s\S]*?\n\}/, fails);
  if (fnM) {
    var body = fnM[0];
    ok("floatNumber() spawns from the pool", /FLOATTEXT\.spawn\(/.test(body));
    ok("floatNumber() no longer creates a DOM node per call",
       !/document\.createElement/.test(body));
    ok("floatNumber() no longer removes itself with setTimeout",
       !/setTimeout/.test(body));
  }

  var updM = lift(pgHtml, "updateFloatText()", /\nfunction updateFloatText\([^)]*\) \{[\s\S]*?\n\}/, fails);
  if (updM) {
    ok("updateFloatText() ticks the pool", /FLOATTEXT\.tick\(/.test(updM[0]));
  }
  ok("updateFloatText() is called from the frame loop",
     /updateFloatText\(raw\)/.test(pgHtml));

  var resetM = lift(pgHtml, "resetRun()", /\nfunction resetRun\(\) \{[\s\S]*?\n\}/, fails);
  if (resetM) {
    ok("resetRun() clears FLOATTEXT", /FLOATTEXT\.reset\(\)/.test(resetM[0]));
  }
}

/* =========================================================================
   4 · A SECOND GENRE — pair-level-v2 raises one
   ========================================================================= */
var PL2_PATH = path.join(__dirname, "games", "pair-level-v2", "index.html");
var pl2Html = fs.readFileSync(PL2_PATH, "utf8");
{
  ok("floattext.js is loaded by pair-level-v2/index.html",
     /<script src="\.\.\/_engine\/floattext\.js">/.test(pl2Html));
  ok("pair-level-v2 constructs a VE.FloatText pool",
     /new VE\.FloatText\(\d+\)/.test(pl2Html));
  ok("pair-level-v2 spawns from it at a real gameplay event (not just constructs it)",
     /FLOATTEXT\.spawn\(/.test(pl2Html));
  ok("pair-level-v2 ticks the pool every frame",
     /FLOATTEXT\.tick\(/.test(pl2Html));
  ok("pair-level-v2 reads FLOATTEXT.alphaOf/riseOf to render rather than re-deriving the curve",
     /FLOATTEXT\.alphaOf\(/.test(pl2Html) && /FLOATTEXT\.riseOf\(/.test(pl2Html));
}

/* =========================================================================
   5 · CRIT WITHOUT COLOUR, AND A MINIMUM SIZE — read from the shipped CSS
   ========================================================================= */
{
  var baseM = lift(pgHtml, ".fnum base rule", /\.fnum\{[^}]*font-size:([\d.]+)rem/, fails);
  var critM = lift(pgHtml, ".fnum.crit rule", /\.fnum\.crit\{[^}]*font-size:([\d.]+)rem/, fails);
  if (baseM && critM) {
    var baseRem = Number(baseM[1]), critRem = Number(critM[1]);
    // The Reference Survey measured the HUD's smallest text at ~0.62rem and
    // the card says explicitly: don't add a new layer at that size.
    ok("base floating-text size clears the HUD's smallest-text floor (0.62rem)",
       baseRem > 0.62, baseRem + "rem");
    ok("crit is distinguishable from a normal hit with colour removed — it is a different SIZE",
       critRem > baseRem, "base " + baseRem + "rem vs crit " + critRem + "rem");
    ok("the crit size step is not a rounding accident — at least 25% larger",
       critRem >= baseRem * 1.25, "base " + baseRem + "rem vs crit " + critRem + "rem");
  }
  var shadowM = pgHtml.match(/\.fnum\{[^}]*text-shadow:([^;]+);/);
  ok("floating text carries a contrast aid (a text-shadow) rather than flat colour on a variable background",
     !!shadowM, shadowM && shadowM[1]);
}

/* =========================================================================
   6 · MUTATION PASS — a bar that cannot fail is not a bar
   ========================================================================= */
function mutant(find, replace, label) {
  if (SRC.indexOf(find) === -1) {
    fails.push("mutation anchor lost for \"" + label + "\" — floattext.js no longer contains: " + find);
    return null;
  }
  var src = SRC.split(find).join(replace);
  var sandbox = { module: { exports: {} }, console: console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "floattext.js#" + label });
  return sandbox.module.exports.FloatText;
}

{
  // -- A: the cap guard removed — spawn just pushes a new slot instead of
  //       recycling the oldest one once every slot is live.
  var MutA = mutant(
    "    if (!slot) {\n      // Every slot is live — reuse the OLDEST one. The pool's length never\n      // changes; a burst bigger than `cap` just recycles faster.\n      slot = this.slots[0];\n      for (var j = 1; j < this.slots.length; j++) {\n        if (this.slots[j].seq < slot.seq) slot = this.slots[j];\n      }\n    }",
    "    if (!slot) {\n      slot = { live: false, x: 0, y: 0, z: 0, text: \"\", crit: false, age: 0, seq: 0 };\n      this.slots.push(slot);\n    }",
    "cap-guard-removed"
  );
  if (MutA) {
    var real = new FloatText(2);
    real.spawn(0, 0, 0, "a", false); real.spawn(0, 0, 0, "b", false); real.spawn(0, 0, 0, "c", false);
    var mut = new MutA(2);
    mut.spawn(0, 0, 0, "a", false); mut.spawn(0, 0, 0, "b", false); mut.spawn(0, 0, 0, "c", false);
    ok("mutant A (cap guard removed) diverges from the real module",
       real.slots.length === 2 && mut.slots.length > 2,
       "real=" + real.slots.length + " mutant=" + mut.slots.length);
  }

  // -- B: reset() turned into a no-op ---------------------------------------
  var MutB = mutant(
    "FloatText.prototype.reset = function () {\n    for (var i = 0; i < this.slots.length; i++) this.slots[i].live = false;\n  };",
    "FloatText.prototype.reset = function () {};",
    "reset-is-noop"
  );
  if (MutB) {
    var realR = new FloatText(2); realR.spawn(0, 0, 0, "a", false); realR.reset();
    var mutR = new MutB(2); mutR.spawn(0, 0, 0, "a", false); mutR.reset();
    ok("mutant B (reset is a no-op) diverges from the real module",
       realR.live().length === 0 && mutR.live().length === 1,
       "real=" + realR.live().length + " mutant=" + mutR.live().length);
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — floating combat text: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
