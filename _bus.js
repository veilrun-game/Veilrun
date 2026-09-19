/* VEILRUN — shared event bus harness (VR-204)

   WHAT THIS IS. `games/_engine/bus.js` is the synchronous, ordered publish/
   subscribe bus that replaces hand-threaded call sites like the one
   `_exec.js` (VR-172) caught: a miss path that had to remember to call each
   observable itself, and called none of them. This harness proves two
   different things and keeps them in two different sections —

     1 · THE MODULE ITSELF. Construction, the named/enumerable event set,
         publish/subscribe/unsubscribe, synchronous emit-order, and that an
         unknown event name is refused rather than silently swallowed.
     2 · THE FIRST REAL WIRE. `games/proving-ground/index.html` builds
         `HITBUS = new VE.Bus(["hit-landed"])` and moves `damageEnemy()`'s
         three effects (a floating number, two particle bursts, an AU cue)
         onto it. Section 2 does not re-run the game — it LIFTS the real
         `HITBUS` construction, the real `damageEnemy()` body and every real
         `HITBUS.on(...)` registration out of the HTML, the `_exec.js`
         contract: exit 2 loudly if an anchor goes missing, never fall back
         to a retyped copy.

   WHY "EVERY EVENT HAS A SUBSCRIBER" IS A TEXT CHECK, NOT AN EXECUTION ONE.
   Running `damageEnemy()` for real needs THREE.js, a scene graph and a live
   enemy — the same reason `_exec.js` stubs rather than boots the renderer.
   The claim this card actually needs proven is structural — "nothing was
   declared and left silent" — and a source-level count answers that exactly,
   the same way `_exec.js` reads AU's method names out of the file instead of
   invoking the audio graph.

   PHASE 3 is a short mutation pass on the module itself (the `_clock.js`
   contract: a bar that cannot fail is not a bar) — the unknown-event guard
   removed, and unsubscribe turned into a no-op.

   Dependency-free. Run:  node _bus.js
   --------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path"), vm = require("vm");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

var BUS_PATH = path.join(__dirname, "games", "_engine", "bus.js");
var SRC = fs.readFileSync(BUS_PATH, "utf8");
var Bus = require(BUS_PATH).Bus;

/* =========================================================================
   1 · THE MODULE — shape, publish/subscribe/unsubscribe, ordering
   ========================================================================= */
{
  ok("module exports a Bus constructor", typeof Bus === "function");

  var b = new Bus(["a", "b"]);
  ok("names() returns exactly the declared event set", JSON.stringify(b.names()) === JSON.stringify(["a", "b"]), b.names());
  ok("subscriberCount starts at 0 for a declared event", b.subscriberCount("a") === 0);

  ok("subscriberCount throws on an unknown event", (function () {
    try { b.subscriberCount("nope"); return false; } catch (e) { return true; }
  })());
  ok("on() throws on an unknown event", (function () {
    try { b.on("nope", function () {}); return false; } catch (e) { return true; }
  })());
  ok("emit() throws on an unknown event", (function () {
    try { b.emit("nope", {}); return false; } catch (e) { return true; }
  })());
  ok("off() throws on an unknown event", (function () {
    try { b.off("nope", function () {}); return false; } catch (e) { return true; }
  })());
  ok("clear() throws on an unknown event name", (function () {
    try { b.clear("nope"); return false; } catch (e) { return true; }
  })());
  ok("on() throws when the listener is not a function", (function () {
    try { b.on("a", "not a function"); return false; } catch (e) { return true; }
  })());

  // -- publish / subscribe, and payload passthrough --------------------------
  var seenA = [];
  b.on("a", function (p) { seenA.push(p); });
  b.emit("a", { n: 1 });
  ok("a subscriber is called on emit", seenA.length === 1);
  ok("the payload is passed through unchanged", seenA[0].n === 1, JSON.stringify(seenA[0]));
  ok("subscriberCount reflects the registration", b.subscriberCount("a") === 1);
  ok("an event with no subscribers is not an error", (function () {
    try { b.emit("b", {}); return true; } catch (e) { return false; }
  })());

  // -- registration order === emit order --------------------------------------
  var order = [];
  var b2 = new Bus(["x"]);
  b2.on("x", function () { order.push(1); });
  b2.on("x", function () { order.push(2); });
  b2.on("x", function () { order.push(3); });
  b2.emit("x", null);
  ok("listeners fire in registration order", order.join(",") === "1,2,3", order.join(","));

  // -- emit is synchronous: every listener has run before emit() returns -----
  var ranSync = false;
  var b3 = new Bus(["y"]);
  b3.on("y", function () { ranSync = true; });
  b3.emit("y", null);
  ok("emit() is synchronous — the listener already ran by the time emit() returns", ranSync === true);

  // -- unsubscribe: the returned fn removes exactly that listener ------------
  var calls4 = 0;
  var b4 = new Bus(["z"]);
  var un = b4.on("z", function () { calls4++; });
  b4.emit("z", null);
  un();
  b4.emit("z", null);
  ok("the returned unsubscribe function stops future delivery", calls4 === 1, calls4);
  ok("subscriberCount drops to 0 after unsubscribe", b4.subscriberCount("z") === 0);

  ok("calling the unsubscribe function twice is a harmless no-op", (function () {
    try { un(); un(); return true; } catch (e) { return false; }
  })());

  // -- off() removes by reference, and only that reference --------------------
  var calls5a = 0, calls5b = 0;
  var b5 = new Bus(["w"]);
  function fn5a() { calls5a++; }
  function fn5b() { calls5b++; }
  b5.on("w", fn5a); b5.on("w", fn5b);
  b5.off("w", fn5a);
  b5.emit("w", null);
  ok("off() removes only the named listener", calls5a === 0 && calls5b === 1, calls5a + "/" + calls5b);
  ok("off() on a listener not subscribed is a silent no-op", (function () {
    try { b5.off("w", fn5a); return true; } catch (e) { return false; }
  })());

  // -- clear(): one event, then every event ------------------------------------
  var b6 = new Bus(["p", "q"]);
  b6.on("p", function () {}); b6.on("p", function () {});
  b6.on("q", function () {});
  b6.clear("p");
  ok("clear(name) empties only that event", b6.subscriberCount("p") === 0 && b6.subscriberCount("q") === 1);
  b6.clear();
  ok("clear() with no argument empties every declared event", b6.subscriberCount("p") === 0 && b6.subscriberCount("q") === 0);

  // -- mid-emit unsubscribe/subscribe affects the NEXT emit, not the current one
  var b7 = new Bus(["m"]);
  var seenLate = false, log7 = [];
  var unSelf = b7.on("m", function () {
    log7.push("first");
    unSelf();                                    // unsubscribe self, mid-emit
    b7.on("m", function () { seenLate = true; }); // subscribe a new one, mid-emit
  });
  b7.on("m", function () { log7.push("second"); });
  b7.emit("m", null);
  ok("a listener that unsubscribes itself mid-emit does not skip its neighbour",
     log7.join(",") === "first,second", log7.join(","));
  ok("a listener added mid-emit does not fire during the emit already in progress", seenLate === false);
  b7.emit("m", null);
  ok("...but it DOES fire on the next emit", seenLate === true);
  ok("the self-unsubscribed listener stayed gone on the next emit",
     log7.join(",") === "first,second,second", log7.join(","));
}

/* =========================================================================
   2 · THE FIRST REAL WIRE — proving-ground/index.html, lifted, not retyped
   ========================================================================= */
var GAME_PATH = path.join(__dirname, "games", "proving-ground", "index.html");
var html = fs.readFileSync(GAME_PATH, "utf8");

function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    fails.push("ANCHOR LOST — could not lift `" + label + "` out of proving-ground/index.html. " +
      "This bar will not fall back to a copy; fix the anchor in _bus.js.");
    return null;
  }
  return m;
}

{
  ok("bus.js is loaded by proving-ground/index.html",
     /<script src="\.\.\/_engine\/bus\.js">/.test(html));

  var ctorM = lift("HITBUS = new VE.Bus([...])", /var HITBUS = new VE\.Bus\((\[[^\]]*\])\);/);
  var declared = [];
  if (ctorM) {
    // The literal array text, e.g. ["hit-landed"] — parsed as JSON after
    // normalising single quotes, so this reads what the file actually says
    // rather than a name typed by hand into this harness.
    try { declared = JSON.parse(ctorM[1].replace(/'/g, '"')); }
    catch (e) { fails.push("could not parse the declared event array: " + ctorM[1]); }
    ok("at least one event is declared on HITBUS", declared.length > 0, declared);
  }

  if (declared.length) {
    declared.forEach(function (name) {
      // Every `HITBUS.on("<name>", ...)` registration anywhere in the file —
      // deliberately global, not anchored to one function, so a subscriber
      // registered anywhere still counts.
      var re = new RegExp("HITBUS\\.on\\(\\s*[\"']" + name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "[\"']", "g");
      var hits = (html.match(re) || []).length;
      ok("declared event '" + name + "' has at least one subscriber in the file", hits >= 1, hits + " subscriber(s)");
    });
  }

  var dmgM = lift("damageEnemy()", /\nfunction damageEnemy\([^)]*\) \{[\s\S]*?\n\}/);
  if (dmgM) {
    var dmgBody = dmgM[0];
    ok("damageEnemy() emits hit-landed", /HITBUS\.emit\(\s*["']hit-landed["']/.test(dmgBody));
    ok("damageEnemy() no longer calls floatNumber() directly", !/floatNumber\(/.test(dmgBody));
    ok("damageEnemy() no longer calls burst() directly", !/burst\(/.test(dmgBody));
    ok("damageEnemy() no longer calls AU.hit()/AU.hitHeavy() directly", !/AU\.hit(Heavy)?\(\)/.test(dmgBody));
  }

  // The three moved effects still exist somewhere as HITBUS subscribers —
  // proving this is a MOVE, not a deletion.
  ok("a hit-landed subscriber still calls floatNumber()",
     /HITBUS\.on\(\s*["']hit-landed["'][\s\S]{0,400}?floatNumber\(/.test(html));
  ok("a hit-landed subscriber still calls burst()",
     /HITBUS\.on\(\s*["']hit-landed["'][\s\S]{0,600}?burst\(/.test(html));
  ok("a hit-landed subscriber still calls AU.hit()/AU.hitHeavy()",
     /HITBUS\.on\(\s*["']hit-landed["'][\s\S]{0,400}?AU\.hit(Heavy)?\(\)/.test(html));
}

/* =========================================================================
   3 · MUTATION PASS — "a bar that cannot fail is not a bar"
   ========================================================================= */
function mutant(find, replace, label) {
  if (SRC.indexOf(find) === -1) {
    fails.push("mutation anchor lost for \"" + label + "\" — bus.js no longer contains: " + find);
    return null;
  }
  var src = SRC.split(find).join(replace);
  var sandbox = { module: { exports: {} }, console: console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "bus.js#" + label });
  return sandbox.module.exports.Bus;
}

{
  // -- A: emit() stops asserting the event is known, and silently swallows a
  //       typo'd name instead — the exact free-form-bus failure this module
  //       exists to remove (a stray string finds zero listeners and nobody
  //       is told). Mirrors emit()'s own shape rather than deleting the
  //       guard method wholesale, so the mutation is one the real bug would
  //       actually look like.
  var MutA = mutant(
    "Bus.prototype.emit = function (name, payload) {\n    this._assertKnown(name, \"emit\");\n    var arr = this._listeners[name].slice();\n    for (var i = 0; i < arr.length; i++) arr[i](payload);\n  };",
    "Bus.prototype.emit = function (name, payload) {\n    var arr = (this._listeners[name] || []).slice();\n    for (var i = 0; i < arr.length; i++) arr[i](payload);\n  };",
    "unknown-event-silently-swallowed"
  );
  if (MutA) {
    var realThrows = (function () { try { new Bus(["a"]).emit("nope", {}); return false; } catch (e) { return true; } })();
    var mutThrows  = (function () { try { new MutA(["a"]).emit("nope", {}); return false; } catch (e) { return true; } })();
    ok("mutant A (unknown event silently swallowed) diverges from the real module",
       realThrows === true && mutThrows === false, "real throws=" + realThrows + " mutant throws=" + mutThrows);
  }

  // -- B: unsubscribe turned into a no-op ------------------------------------
  var MutB = mutant(
    "self.off(name, fn);",
    "/* off skipped */",
    "unsubscribe-is-noop"
  );
  if (MutB) {
    var realB = new Bus(["e"]); var nReal = 0;
    var offReal = realB.on("e", function () { nReal++; });
    offReal(); realB.emit("e", null);

    var mutB = new MutB(["e"]); var nMut = 0;
    var offMut = mutB.on("e", function () { nMut++; });
    offMut(); mutB.emit("e", null);

    ok("mutant B (unsubscribe is a no-op) diverges from the real module",
       nReal === 0 && nMut === 1, "real calls=" + nReal + " mutant calls=" + nMut);
  }
}

console.log((fails.length ? "FAIL" : "PASS") + " — shared event bus: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
