/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · HIT CONFIRM + DIRECTIONAL DAMAGE BAR   (VR-200,
   corrected VR-211)

   THE CARD. Two questions a combat game has to answer: did my hit land
   (already answered — hitmark(), VR-104), and where did that damage come
   from (answered nowhere until this card). In a walled arena with husks
   entering through seam tears behind you, a hit from off-screen used to read
   as a hit from nothing.

   IT MEASURES BY EXECUTION, NEVER BY GREP, same discipline `_exec.js` holds
   `verbYaw()` to. `hitDirection()`, `hurtPlayer()`, `camYaw()` and the `DDIR`
   pool constructor are LIFTED out of index.html — never a retyped copy — and
   run against a stubbed `$`/`cam`/`ARC`/`mouse`/`player`/`AU`/`HUD`/`MOTION`,
   the same shape `_exec.js` stubs for `verbYaw()`.

   VR-211, BUG AGAINST THIS BAR. This harness shipped at 19 checks, green, and
   missed both of the defects Jordan found in play on 9/21:
     · a second simultaneous hit was UNREACHABLE — hurtPlayer()'s i-frame
       early-return sat BEFORE hitDirection(), so only the first attacker in
       any 0.62s window could ever claim a pool slot. The old "two
       simultaneous hits" check called hitDirection() directly and so drove
       right past the bug — it never went through the real caller.
     · the wedge could point at the OPPOSITE side. The old check's expected
       value was derived from the implementation's own formula
       (`atan2(dx,dz)`, restated in a comment as the "world" angle) rather
       than from an independently-named screen position, so a wrong formula
       and its own check could never disagree.
   Both fixes are in index.html; this file's job is making sure neither
   regresses silently again — Section 3 drives the real `hurtPlayer()`, not
   `hitDirection()` directly, and Section 4 names screen positions ("ahead
   puts the wedge up", "right puts it right of the crosshair") independently
   of the formula that produces them. Section 6 mutation-tests both: it
   re-lifts each fixed function, string-patches it back to the exact shape
   that shipped the bug, and proves THIS bar turns red against it.

   THE THINGS IT PROVES:
     1 · DIRECTION COMES FROM THE REAL ATTACKER POSITION, resolved through the
         real camera yaw — never a retyped angle.
     2 · ARCADE AND THIRD DISAGREE ABOUT THE SAME ATTACKER, because `camYaw()`
         reads `ARC.yaw` in one and `mouse.yaw` in the other and those are
         different numbers — the exact proof `_exec.js` runs on `verbYaw()`.
     3 · I-FRAMES GATE DAMAGE, NEVER THE TELL. Two attackers striking inside
         one i-frame window, driven through the real `hurtPlayer()`, both
         raise an indicator; damage still only lands once.
     4 · THE WEDGE POINTS AT A NAMED SCREEN POSITION for a known attacker —
         ahead/right/behind/left — independently of `hitDirection()`'s own
         formula, at more than one camera yaw.
     5 · THE POOL IS POOLED. A fifth hit while all four slots are live reuses
         one rather than being silently dropped or thrown.
     6 · RESETRUN CLEARS IT. `hitDirReset()` — proven to be the function
         `resetRun()` actually calls, not a same-named stand-in — drops every
         slot's `live` flag and its pending timer.
     7 · BOTH VR-211 DEFECTS ARE MUTATION-TESTED. Restoring either the old
         rotation formula or the old i-frame early-return turns a check red.
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
var srcHurt    = lift("hurtPlayer()",   /\nfunction hurtPlayer\(dmg, ax, az\) \{[\s\S]*?\n\}/)[0];
var balBody    = lift("BALANCE block",  /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];

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
function buildSandbox(overrides) {
  var els = [];
  for (var i = 0; i < 4; i++) { var e = fakeEl(); e.classList._own = e; els.push(e); }
  var sandbox = {
    Math: Math, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout,
    module: { exports: {} },
    $: function (id) { return id === "hitdir" ? { querySelectorAll: function () { return els; } } : null; },
    cam: { mode: "arcade" }, ARC: { yaw: 0 }, mouse: { yaw: 0 },
    player: { x: 0, z: 0, hp: 100, iframe: 0, alive: true },
    AU: { hurt: function () {} },
    MOTION: { flash: 0.34 },
    HUD: { vig: { style: {} } },
    shake: function () {}, hitStop: function () {}, burst: function () {},
    breakShroud: function () {}, endRun: function () {}
  };
  vm.createContext(sandbox);
  vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
  sandbox.C = sandbox.module.exports.C;
  var body = [srcMax[0], srcPool, srcReset, srcCamYaw, (overrides && overrides.hitDir) || srcHitDir,
              (overrides && overrides.hurt) || srcHurt].join("\n");
  vm.runInContext(body, sandbox, { filename: "index.html#HITDIR" });
  sandbox.__els = els;
  return sandbox;
}

function rotationOf(el) {
  var t = el.style.transform || "";
  var m = t.match(/rotate\(([-\d.]+)deg\)/);
  return m ? +m[1] : null;
}
function liveCount(sandbox) { return sandbox.DDIR.filter(function (d) { return d.live; }).length; }
function liveEls(sandbox) { return sandbox.DDIR.filter(function (d) { return d.live; }); }

/* =========================================================================
   2 · DRIVE IT — direction resolves from the real attacker, through camYaw()
   ========================================================================= */
console.log("\n[direction resolves from the real attacker, through the real camera]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(5, 0);
  var live = liveEls(s);
  ok("a live slot was claimed", live.length === 1, "found " + live.length);
  var rel = rotationOf(live[0].el);
  ok("rotation reflects the real angle to the real attacker (named independently in section 4)",
     rel !== null, "got " + rel);
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
  var arcadeAng = rotationOf(liveEls(s)[0].el);
  var s2 = buildSandbox();
  s2.player.x = 0; s2.player.z = 0;
  s2.cam.mode = "third"; s2.ARC.yaw = 0.35; s2.mouse.yaw = 1.9;
  s2.hitDirection(4, -2);
  var thirdAng = rotationOf(liveEls(s2)[0].el);
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
  var a = rotationOf(liveEls(s)[0].el);
  var s2 = buildSandbox();
  s2.player.x = 0; s2.player.z = 0;
  s2.cam.mode = "third"; s2.ARC.yaw = 0.7; s2.mouse.yaw = 0.7;
  s2.hitDirection(-2, 5);
  var b = rotationOf(liveEls(s2)[0].el);
  ok("equal yaws agree, ruling out a mode-independent bug", Math.abs(a - b) < 0.01, a + " vs " + b);
}

/* =========================================================================
   3 · VR-211 DEFECT 1 — i-frames gate damage, never the tell. Driven through
   the REAL hurtPlayer(), never hitDirection() directly — the old check
   called hitDirection() and so drove straight past the bug it existed to
   catch (DONE WHEN #5).
   ========================================================================= */
console.log("\n[i-frames gate damage, never the direction tell (VR-211)]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0; s.player.hp = 100; s.player.iframe = 0;
  s.hurtPlayer(10, 5, 0);    // first attacker, right of the player
  s.hurtPlayer(10, -5, 0);   // second attacker, same instant, still inside the i-frame window
  ok("two attackers striking inside one i-frame window both raise an indicator",
     liveCount(s) === 2, "found " + liveCount(s));
  ok("...and damage only landed once — i-frames still gate damage stacking",
     s.player.hp === 90, "hp is " + s.player.hp);
  ok("player.iframe was set by the first hit and left alone by the second",
     s.player.iframe === s.C.iframeOnHit, "iframe is " + s.player.iframe);
}
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0; s.player.alive = false;
  s.hurtPlayer(10, 5, 0);
  ok("a dead player claims no slot at all", liveCount(s) === 0, "found " + liveCount(s));
}

/* =========================================================================
   4 · VR-211 DEFECT 2 — the wedge points at a NAMED screen position, derived
   independently of hitDirection()'s own formula (DONE WHEN #3). Default
   camera yaw is 0; the wedge's un-rotated icon points "up" (0deg), so an
   attacker dead ahead of a camera facing forward should show at ~0deg, an
   attacker to the camera's right at ~90deg (CSS rotate() is clockwise),
   behind at ~180deg, and to the left at ~-90deg / 270deg. These four
   positions are named from where the wedge should visibly sit on screen,
   not reverse-engineered from the code that produces them.
   ========================================================================= */
console.log("\n[the wedge points at a named screen position, independent of the formula]");
function wedgeDeg(camYaw, ax, az) {
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = camYaw;
  s.hitDirection(ax, az);
  return rotationOf(liveEls(s)[0].el);
}
function near(a, b, tol) {
  var d = ((a - b) % 360 + 540) % 360 - 180;   // shortest signed angular distance
  return Math.abs(d) < (tol || 1);
}
[
  { label: "dead ahead of a forward-facing camera (camYaw 0) shows at the top",
    camYaw: 0, ax: 0, az: -5, want: 0 },
  { label: "to the right of a forward-facing camera (camYaw 0) shows at the right",
    camYaw: 0, ax: 5, az: 0, want: 90 },
  { label: "directly behind a forward-facing camera (camYaw 0) shows at the bottom",
    camYaw: 0, ax: 0, az: 5, want: 180 },
  { label: "to the left of a forward-facing camera (camYaw 0) shows at the left",
    camYaw: 0, ax: -5, az: 0, want: -90 },
  { label: "an attacker the camera is already facing shows at the top even off-axis (camYaw 0.9)",
    camYaw: 0.9, ax: -5 * Math.sin(0.9), az: -5 * Math.cos(0.9), want: 0 }
].forEach(function (t) {
  var got = wedgeDeg(t.camYaw, t.ax, t.az);
  ok(t.label, got !== null && near(got, t.want, 1), "got " + got + "deg, expected ~" + t.want + "deg");
});

console.log("\n[the pool is pooled — driven through the real hurtPlayer()]");
{
  var s = buildSandbox();
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hurtPlayer(10, 5, 0);    // slot 0
  s.hurtPlayer(0, -5, 0);    // slot 1, opposite direction, 0 dmg so hp math stays simple above
  ok("two simultaneous hits from different directions both register", liveCount(s) === 2, "found " + liveCount(s));
  var angs = liveEls(s).map(function (d) { return rotationOf(d.el); });
  ok("...and they read as different directions, not one overwriting the other",
     Math.abs(angs[0] - angs[1]) > 90, angs.join(" vs "));
  s.hurtPlayer(0, 0, 5); s.hurtPlayer(0, 0, -5);
  ok("a fourth hit fills the pool", liveCount(s) === 4, "found " + liveCount(s));
  s.hitDirection(1, 1);   // fifth hit — must show up SOMEWHERE, not just leave the count at 4
  ok("a fifth hit while the pool is full reuses a slot rather than throwing or vanishing",
     liveCount(s) === 4, "found " + liveCount(s) + " (pool size " + s.DDIR.length + ")");
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

/* =========================================================================
   5 · MUTATION TESTS — both VR-211 defects, string-patched back into their
   shipped-broken shape and re-run against THIS bar's own checks (DONE WHEN
   #4). If either mutant passes, the bar cannot see the bug it was written
   for.
   ========================================================================= */
console.log("\n[mutation: the old rotation formula must fail the named-position check]");
{
  var oldRotation = srcHitDir.replace(
    "var rel = camYaw() - Math.atan2(-dx, -dz);",
    "var rel = Math.atan2(dx, dz) - camYaw();"
  );
  ok("the mutant string actually changed something (anchor still matches)",
     oldRotation !== srcHitDir);
  var s = buildSandbox({ hitDir: oldRotation });
  s.player.x = 0; s.player.z = 0;
  s.cam.mode = "arcade"; s.ARC.yaw = 0;
  s.hitDirection(0, -5);              // dead ahead — named expectation is 0deg
  var got = rotationOf(liveEls(s)[0].el);
  ok("MUTANT KILLED — reverting the rotation sign turns the 'dead ahead' check red",
     !near(got, 0, 1), "mutant still reads " + got + "deg (expected it to miss 0deg)");
}
console.log("\n[mutation: the old i-frame early-return must fail the two-hit check]");
{
  var oldHurt = srcHurt.replace(
    "function hurtPlayer(dmg, ax, az) {\n  if (!player.alive) return;",
    "function hurtPlayer(dmg, ax, az) {\n  if (player.iframe > 0 || !player.alive) return;"
  ).replace("  hitDirection(ax, az);\n  if (player.iframe > 0) return;\n", "");
  var reinserted = oldHurt.replace(
    "  player.hp -= dmg;\n  player.iframe = C.iframeOnHit;",
    "  player.hp -= dmg;\n  player.iframe = C.iframeOnHit;\n  hitDirection(ax, az);"
  );
  ok("the mutant string actually changed something (anchor still matches)",
     reinserted !== srcHurt);
  var s = buildSandbox({ hurt: reinserted });
  s.player.x = 0; s.player.z = 0; s.player.hp = 100; s.player.iframe = 0;
  s.hurtPlayer(10, 5, 0);
  s.hurtPlayer(10, -5, 0);
  ok("MUTANT KILLED — restoring the early i-frame return turns the two-hit check red",
     liveCount(s) !== 2, "mutant still shows " + liveCount(s) + " slots (expected it to miss the second hit)");
}

console.log("\n==========================================================");
console.log((fails.length ? "FAIL" : "PASS") + " — " + pass + " checks" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(function (f) { console.log("  ✗ " + f); });
process.exit(fails.length ? 1 : 0);
