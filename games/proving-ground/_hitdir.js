/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · HIT CONFIRM + DIRECTIONAL DAMAGE BAR   (VR-200)

   THE CARD. Two questions a combat game has to answer: did my hit land
   (already answered — hitmark(), VR-104), and where did that damage come
   from (answered nowhere until this card). In a walled arena with husks
   entering through seam tears behind you, a hit from off-screen used to read
   as a hit from nothing.

   IT MEASURES BY EXECUTION, NEVER BY GREP, same discipline `_exec.js` holds
   `verbYaw()` to. `hitDirection()`, `camYaw()` and the `DDIR` pool
   constructor are LIFTED out of index.html — never a retyped copy — and run
   against a stubbed `$`/`cam`/`ARC`/`mouse`/`player`, the same shape
   `_exec.js` stubs `ARC`/`mouse`/`cam` for `verbYaw()`.

   THE FOUR THINGS IT PROVES:
     1 · DIRECTION COMES FROM THE REAL ATTACKER POSITION, resolved through the
         real camera yaw — never a retyped angle.
     2 · ARCADE AND THIRD DISAGREE ABOUT THE SAME ATTACKER, because `camYaw()`
         reads `ARC.yaw` in one and `mouse.yaw` in the other and those are
         different numbers — the exact proof `_exec.js` runs on `verbYaw()`.
     3 · THE POOL IS POOLED. Two simultaneous hits from different directions
         both register in distinct slots; a fifth hit while all four are
         still live reuses one rather than being silently dropped or thrown.
     4 · RESETRUN CLEARS IT. `hitDirReset()` — proven to be the function
         `resetRun()` actually calls, not a same-named stand-in — drops every
         slot's `live` flag and its pending timer.
   Plus two static, anchored facts that don't need execution:
     · `hurtPlayer()`'s sole call site passes the attacker's real `e.x, e.z`.
     · The indicator is a SHAPE (a CSS border-triangle), not only a colour —
       the A11Y bar applied at creation, not retrofitted.

   Dependency-free. Usage:  node _hitdir.js
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm");
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
var pass = 0; var fails = [];
function ok(name, cond, detail) { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); }

function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _hitdir.js.\n");
    process.exit(2);
  }
  return m;
}

var srcPool    = lift("DDIR pool",      /\nvar DDIR = \(function \(\) \{[\s\S]*?\n\}\)\(\);/)[0];
var srcMax     = lift("DDIR_MAX",       /\nvar DDIR_MAX = (\d+);/);
var srcReset   = lift("hitDirReset()",  /\nfunction hitDirReset\(\) \{[\s\S]*?\n\}/)[0];
var srcCamYaw  = lift("camYaw()",       /\nfunction camYaw\(\) \{[\s\S]*?\n\}/)[0];
var srcHitDir  = lift("hitDirection()", /\nfunction hitDirection\(ax, az\) \{[\s\S]*?\n\}/)[0];

/* =========================================================================
   1 · BUILD A STUBBED DOM + WORLD, THE SAME SHAPE _exec.js STUBS FOR verbYaw()
   ========================================================================= */
function fakeEl() {
  return { style: {}, _classes: {}, offsetWidth: 0,
           classList: {
             add: function (c) { this._own._classes[c] = true; },
             remove: function (c) { delete this._own._classes[c]; }
           } };
}
function buildSandbox() {
  var els = [];
  for (var i = 0; i < 4; i++) { var e = fakeEl(); e.classList._own = e; els.push(e); }
  var sandbox = {
    Math: Math, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout,
    $: function (id) { return id === "hitdir" ? { querySelectorAll: function () { return els; } } : null; },
    cam: { mode: "arcade" }, ARC: { yaw: 0 }, mouse: { yaw: 0 },
    player: { x: 0, z: 0 }
  };
  vm.createContext(sandbox);
  vm.runInContext([srcMax[0], srcPool, srcReset, srcCamYaw, srcHitDir].join("\n"),
                   sandbox, { filename: "index.html#HITDIR" });
  sandbox.__els = els;
  return sandbox;
}

function rotationOf(el) {
  var t = el.style.transform || "";
  var m = t.match(/rotate\(([-\d.]+)deg\)/);
  return m ? +m[1] : null;
}
function liveCount(sandbox) { return sandbox.DDIR.filter(function (d) { return d.live; }).length; }

/* =========================================================================
   2 · DRIVE IT
   ========================================================================= */
console.log("\n[direction resolves from the real attacker, through the real camera]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(5, 0);                 // attacker straight out along +x, world atan2(dx,dz)=atan2(5,0)=90deg
  var live = s.DDIR.filter(function (d) { return d.live; });
  ok("a live slot was claimed", live.length === 1, "found " + live.length);
  var rel = rotationOf(live[0].el);
  ok("rotation reflects the real angle to the real attacker",
     rel !== null && Math.abs(rel - 90) < 0.5, "got " + rel + "deg, expected ~90deg");
}
{
  var s = buildSandbox();
  s.player.x = 3; s.player.z = 3;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(3, 3);                 // attacker on top of the player — no direction to show
  ok("an attacker with no offset claims nothing", liveCount(s) === 0, "found " + liveCount(s));
}

console.log("\n[arcade and third disagree about the same attacker]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0.35; s.mouse.yaw = 1.9;   // deliberately different
  s.hitDirection(4, -2);
  var arcadeAng = rotationOf(s.DDIR.filter(function (d) { return d.live; })[0].el);
  var s2 = buildSandbox();
  s2.player.x = 0; s2.player.z = 0;
  s2.cam.mode = "third"; s2.ARC.yaw = 0.35; s2.mouse.yaw = 1.9;
  s2.hitDirection(4, -2);
  var thirdAng = rotationOf(s2.DDIR.filter(function (d) { return d.live; })[0].el);
  ok("camYaw() itself differs by mode for the same yaws",
     s.camYaw() !== s2.camYaw(), "arcade " + s.camYaw() + " vs third " + s2.camYaw());
  ok("the same attacker resolves to a different screen angle per mode",
     Math.abs(arcadeAng - thirdAng) > 1, "arcade " + arcadeAng + "deg vs third " + thirdAng + "deg");
}
{
  // Same yaw in both modes (ARC.yaw === mouse.yaw) — the two must then AGREE,
  // which is what proves the difference above is the mode and not a bug.
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0.7; s.mouse.yaw = 0.7;
  s.hitDirection(-2, 5);
  var a = rotationOf(s.DDIR.filter(function (d) { return d.live; })[0].el);
  var s2 = buildSandbox();
  s2.player.x = 0; s2.player.z = 0;
  s2.cam.mode = "third"; s2.ARC.yaw = 0.7; s2.mouse.yaw = 0.7;
  s2.hitDirection(-2, 5);
  var b = rotationOf(s2.DDIR.filter(function (d) { return d.live; })[0].el);
  ok("equal yaws agree, ruling out a mode-independent bug", Math.abs(a - b) < 0.01, a + " vs " + b);
}

console.log("\n[the pool is pooled]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(5, 0);   // slot 0
  s.hitDirection(-5, 0);  // slot 1, opposite direction
  ok("two simultaneous hits from different directions both register", liveCount(s) === 2, "found " + liveCount(s));
  var slots = s.DDIR.filter(function (d) { return d.live; });
  var angs = slots.map(function (d) { return rotationOf(d.el); });
  ok("...and they read as different directions, not one overwriting the other",
     Math.abs(angs[0] - angs[1]) > 90, angs.join(" vs "));
  s.hitDirection(0, 5); s.hitDirection(0, -5);
  ok("a fourth hit fills the pool", liveCount(s) === 4, "found " + liveCount(s));
  s.hitDirection(1, 1);   // atan2(1,1) - 0 = 45deg — must show up SOMEWHERE, not just leave the count at 4
  ok("a fifth hit while the pool is full reuses a slot rather than throwing or vanishing",
     liveCount(s) === 4, "found " + liveCount(s) + " (pool size " + s.DDIR.length + ")");
  var got45 = s.DDIR.some(function (d) { return Math.abs(rotationOf(d.el) - 45) < 0.5; });
  ok("...and the fifth hit's own direction actually lands on a slot, not silently dropped",
     got45, "no slot reads ~45deg — " + s.DDIR.map(function (d) { return rotationOf(d.el); }).join(", "));
}

console.log("\n[resetRun clears it]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(5, 0); s.hitDirection(-5, 0);
  ok("setup: pool has live entries before reset", liveCount(s) === 2, "found " + liveCount(s));
  s.hitDirReset();
  ok("hitDirReset() drops every slot's live flag", liveCount(s) === 0, "found " + liveCount(s));
  ok("hitDirReset() clears the 'on' class too",
     s.__els.every(function (e) { return !e._classes.on; }));
}
ok("resetRun() actually calls hitDirReset(), not a same-named stand-in",
   /function resetRun\([^)]*\) \{[\s\S]*?hitDirReset\(\);[\s\S]*?\n\}/.test(html));

console.log("\n[static, anchored facts]");
ok("hurtPlayer()'s sole call site passes the attacker's real position",
   /hurtPlayer\(C\.enemyDmg, e\.x, e\.z\)/.test(html));
ok("hurtPlayer() forwards it into hitDirection(), not into a copy of the logic",
   /function hurtPlayer\([^)]*\)[\s\S]*?hitDirection\(ax, az\)/.test(html));
ok("the indicator is a SHAPE (a border-triangle), not colour alone",
   /#hitdir \.hd-i\{[^}]*border-left:\d+px solid transparent[^}]*border-right:\d+px solid transparent[^}]*border-top:\d+px solid/.test(html));
ok("the markup pool size matches DDIR_MAX",
   (html.match(/<div id="hitdir">((?:<i class="hd-i"><\/i>)+)<\/div>/) || ["", ""])[1].split("hd-i").length - 1 === +srcMax[1],
   "markup vs DDIR_MAX=" + srcMax[1]);

console.log("\n==========================================================");
console.log((fails.length ? "FAIL" : "PASS") + " — " + pass + " checks" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
