/* ---------------------------------------------------------------------------
   Proving Ground — touch input harness (VR-79 mobile pass).

   `_sim.js` proves the balance and `_billboard.js` proves the sprite math. This
   proves the INPUT LAYER, which is the third thing that can be silently wrong:
   a deadzone that's slightly too small makes the Shroud unreachable and reads as
   a bug in the Shroud; a Stalk latch that survives a run start makes the next
   run mysteriously slow. Neither fails loudly and neither is visible in a
   screenshot, so both get asserted here.

   The renderer can't be simmed, but a d-pad can. The TOUCH block in index.html
   is extracted and EXECUTED against a hand-rolled DOM stub — dependency-free,
   like every other harness in this repo (no jsdom, on purpose).

   Usage: node _touch.js   (run from games/proving-ground/)
   --------------------------------------------------------------------------- */
const fs = require("fs"), path = require("path"), vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let fails = 0, checks = 0;
const ok = (n, c, d) => {
  checks++;
  if (!c) { fails++; console.log("  FAIL  " + n + (d ? "  — " + d : "")); }
  else console.log("  ok    " + n + (d ? "  — " + d : ""));
};

console.log("\nVEILRUN · Proving Ground — touch harness\n" + "=".repeat(58));

/* ======================================================================
   1. The invariant that silently breaks everything
   ====================================================================== */
console.log("\n[css and js agree on what a touch device is]");
/* The stylesheet decides whether the pad is ON SCREEN and the script decides
   whether it is WIRED. If those two disagree you get either a dead pad or an
   invisible one, and both look like "mobile doesn't work" rather than like a
   one-character mismatch. This is the single highest-value assertion in the
   file, because nothing else in the build would ever catch it. */
const jsQuery = (html.match(/matchMedia\("([^"]+)"\)\.matches/) || [])[1];
const cssQuery = (html.match(/@media \(hover:none\),\(pointer:coarse\)/) || [])[0];
ok("js reads a media query", !!jsQuery, jsQuery || "none found");
ok("css gates the pad on one", !!cssQuery);
ok("the two queries are identical",
   !!jsQuery && !!cssQuery && cssQuery.replace("@media ", "").replace(/\s/g, "") === jsQuery.replace(/\s/g, ""),
   jsQuery + "  vs  " + (cssQuery || "").replace("@media ", ""));

/* ======================================================================
   2. Nothing still measures the window
   ====================================================================== */
console.log("\n[the canvas is the stage, not the window]");
const sizingFn = (html.match(/function applyPixelScale\(\)[\s\S]*?\n}/) || [""])[0];
ok("renderer sizes off the stage", /var w = viewW\(\), h = viewH\(\)/.test(sizingFn));
ok("nothing in sizing reads innerWidth", !/window\.innerWidth/.test(sizingFn),
   "the pad's height would be rendered into and then cropped away");
const floatFn = (html.match(/function floatNumber\([\s\S]*?\n}/) || [""])[0];
ok("damage numbers project onto the stage",
   /viewW\(\)/.test(floatFn) && /viewH\(\)/.test(floatFn) && !/window\.inner/.test(floatFn),
   "otherwise every number lands low and belongs to nobody");
ok("camera aspect comes from the stage", /new THREE\.PerspectiveCamera\(62, viewW\(\) \/ viewH\(\)/.test(html));
ok("the HUD is told where the pad starts",
   /setProperty\("--padh"/.test(html) && /#hud\{bottom:var\(--padh\)\}/.test(html),
   "pips and the Shroud label would render behind the buttons");

/* ======================================================================
   3. Execute the touch module against a DOM stub
   ====================================================================== */
console.log("\n[touch module runs]");
const m = html.match(/TOUCH:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* TOUCH:END/);
if (!m) { console.error("could not find the TOUCH block in index.html"); process.exit(1); }

/* --- the smallest DOM that the module actually touches --- */
function makeEl(id) {
  const el = {
    id,
    _cls: new Set(),
    style: {},
    listeners: {},
    classList: {
      add: c => el._cls.add(c),
      remove: c => el._cls.delete(c),
      contains: c => el._cls.has(c),
      toggle: (c, on) => { if (on === undefined) on = !el._cls.has(c); on ? el._cls.add(c) : el._cls.delete(c); return on; }
    },
    getAttribute: k => el._attrs[k],
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    addEventListener(type, fn) { (el.listeners[type] = el.listeners[type] || []).push(fn); },
    fire(type, ev) { (el.listeners[type] || []).forEach(fn => fn(Object.assign({ preventDefault() {} }, ev))); },
    _attrs: {}
  };
  return el;
}

const buttons = ["strike", "exec", "step", "stalk", "pause", "tune"].map(k => {
  const b = makeEl("vb-" + k); b._attrs.k = k; b.getAttribute = n => (n === "data-k" ? k : undefined); return b;
});
const els = {};
["vpad", "vstick", "vknob", "vchg0", "vchg1"].forEach(id => els[id] = makeEl(id));
/* #vb-stalk and the .vbtn whose class gets toggled are ONE element in the real
   DOM — the stub has to reflect that or the latch appears not to light up. */
["step", "exec", "stalk"].forEach(k => els["vb-" + k] = buttons.find(b => b.getAttribute("data-k") === k));
els.vpad.querySelectorAll = () => buttons;

// live game state the module reads
const state = {
  keys: Object.create(null),
  mouse: { yaw: 0, pitch: -0.12, locked: false, l: false, r: false },
  pressed: { strike: false, exec: false, step: false },
  game: { running: true, over: false, paused: false },
  player: { stepCharges: 2, execCd: 0 },
  cam: { mode: "arcade" },
  helpOpenFlag: false,
  paused: []
};

const sandbox = {
  TOUCH: true,
  $: id => els[id],
  keys: state.keys,
  mouse: state.mouse,
  pressed: state.pressed,
  game: state.game,
  player: state.player,
  cam: state.cam,
  helpOpen: () => state.helpOpenFlag,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  setPaused: p => state.paused.push(p),
  TUNE: { toggle() { state.tuneToggled = true; } },
  LOOK: { sens: 0.0055 },
  renderer: { domElement: makeEl("canvas") },
  Math, console
};
vm.createContext(sandbox);
let ranClean = true, runErr = "";
try { new vm.Script(m[1], { filename: "index.html#TOUCH" }).runInContext(sandbox); }
catch (e) { ranClean = false; runErr = e.message; }
ok("the module boots against a stub DOM", ranClean, runErr || "no missing refs, no typo'd ids");
if (!ranClean) { console.log("\n" + "=".repeat(58) + "\nFAIL — " + fails + " of " + checks); process.exit(1); }

const TPAD = sandbox.TPAD;
const stick = els.vstick;
const btn = k => buttons.find(b => b.getAttribute("data-k") === k);

/* ======================================================================
   4. The stick
   ====================================================================== */
console.log("\n[stick]");
/* Rect is 100x100 so centre is (50,50), radius 50, deadzone 30% = 15px. */
stick.fire("pointerdown", { pointerId: 1, clientX: 50, clientY: 10 });
ok("push up = forward", state.keys.w === true && state.keys.s === false);
stick.fire("pointermove", { pointerId: 1, clientX: 90, clientY: 50 });
ok("push right = right, and releases forward", state.keys.d === true && state.keys.w === false);
stick.fire("pointermove", { pointerId: 1, clientX: 10, clientY: 90 });
ok("diagonals hold two keys at once", state.keys.a === true && state.keys.s === true);

/* The deadzone is load-bearing for the Shroud, not just comfort: the veil only
   takes you below shroudBreakSpeed, so a thumb resting a few pixels off centre
   must NOT register as movement or Shroud becomes unreachable and looks broken. */
stick.fire("pointermove", { pointerId: 1, clientX: 60, clientY: 57 });
ok("inside the deadzone is standing still",
   !state.keys.w && !state.keys.a && !state.keys.s && !state.keys.d,
   "10px off centre — the Shroud has to survive a resting thumb");
stick.fire("pointermove", { pointerId: 1, clientX: 68, clientY: 50 });
ok("just outside it does move", state.keys.d === true, "18px off centre");

stick.fire("pointerup", { pointerId: 1 });
ok("release stops all movement",
   !state.keys.w && !state.keys.a && !state.keys.s && !state.keys.d);
stick.fire("pointerdown", { pointerId: 2, clientX: 50, clientY: 10 });
stick.fire("pointermove", { pointerId: 99, clientX: 90, clientY: 50 });
ok("a second finger can't steer the stick", state.keys.w === true && state.keys.d === false,
   "pointer ids are matched, so the strike thumb doesn't move you");
stick.fire("pointerup", { pointerId: 2 });

/* ======================================================================
   5. The buttons
   ====================================================================== */
console.log("\n[buttons]");
btn("strike").fire("pointerdown", { pointerId: 3 });
ok("strike sets both the press and the hold",
   state.pressed.strike === true && state.mouse.l === true,
   "mouse.l is what chains the 3-hit combo — same branch the desktop LMB uses");
btn("strike").fire("pointerup", { pointerId: 3 });
ok("lifting off ends the hold", state.mouse.l === false);

state.pressed.exec = false; state.pressed.step = false;
btn("exec").fire("pointerdown", { pointerId: 4 });
btn("step").fire("pointerdown", { pointerId: 5 });
ok("execute and veilstep fire once per press", state.pressed.exec === true && state.pressed.step === true);

ok("stalk starts off", TPAD.stalking() === false);
btn("stalk").fire("pointerdown", { pointerId: 6 });
ok("stalk latches on", TPAD.stalking() === true && els["vb-stalk"].classList.contains("on"));
btn("stalk").fire("pointerdown", { pointerId: 7 });
ok("stalk latches off again", TPAD.stalking() === false);

state.paused.length = 0;
btn("pause").fire("pointerdown", { pointerId: 8 });
ok("pause toggles the run", state.paused.length === 1 && state.paused[0] === true);
btn("tune").fire("pointerdown", { pointerId: 9 });
ok("settings opens the panel", sandbox.state === undefined ? state.tuneToggled === true : true);

/* ======================================================================
   6. Inert when it should be
   ====================================================================== */
console.log("\n[inert when the run isn't live]");
/* The start and pause screens cover the pad, but the ? overlay does NOT — a
   strike thrown from behind the help panel is a hit you never saw land. */
state.pressed.strike = false; state.mouse.l = false;
state.helpOpenFlag = true;
btn("strike").fire("pointerdown", { pointerId: 10 });
ok("no strike through the help overlay", state.pressed.strike === false && state.mouse.l === false);
state.helpOpenFlag = false;

state.game.paused = true;
state.pressed.step = false;
btn("step").fire("pointerdown", { pointerId: 11 });
ok("no veilstep while paused", state.pressed.step === false);
state.keys.w = false;
stick.fire("pointerdown", { pointerId: 12, clientX: 50, clientY: 10 });
ok("the stick is dead while paused", state.keys.w === false);
state.game.paused = false;

state.game.over = true;
state.pressed.exec = false;
btn("exec").fire("pointerdown", { pointerId: 13 });
ok("no execute after death", state.pressed.exec === false);
state.game.over = false;

/* Settings must stay reachable regardless — it's how you change camera on touch */
state.tuneToggled = false;
state.game.running = false;
btn("tune").fire("pointerdown", { pointerId: 14 });
ok("settings still opens outside a run", state.tuneToggled === true,
   "it's the only way to change camera view on a phone");
state.game.running = true;

/* ======================================================================
   7. release() — the latch must not outlive the run
   ====================================================================== */
console.log("\n[release]");
btn("stalk").fire("pointerdown", { pointerId: 15 });
stick.fire("pointerdown", { pointerId: 16, clientX: 50, clientY: 10 });
btn("strike").fire("pointerdown", { pointerId: 17 });
TPAD.release();
ok("release drops the stalk latch", TPAD.stalking() === false,
   "a latch surviving resetRun makes the next run mysteriously slow");
ok("release drops movement", !state.keys.w && !state.keys.a && !state.keys.s && !state.keys.d);
ok("release drops the strike hold", state.mouse.l === false);
ok("release is wired into resetRun and setPaused",
   /TPAD\.release\(\);\s*\/\/ a latched Stalk/.test(html) && /TPAD\.release\(\); \}/.test(html));

/* ======================================================================
   8. Drag-to-look
   ====================================================================== */
console.log("\n[drag to look]");
const cv = sandbox.renderer.domElement;
state.cam.mode = "arcade";
const yaw0 = state.mouse.yaw;
cv.fire("pointerdown", { pointerId: 20, clientX: 100, clientY: 100 });
cv.fire("pointermove", { pointerId: 20, clientX: 200, clientY: 100 });
ok("arcade ignores drag entirely", state.mouse.yaw === yaw0,
   "its fixed angle is what lets the atlas ship 4 facings instead of 8");

state.cam.mode = "third";
cv.fire("pointerdown", { pointerId: 21, clientX: 100, clientY: 100 });
cv.fire("pointermove", { pointerId: 21, clientX: 200, clientY: 100 });
ok("third person turns with a drag", state.mouse.yaw !== yaw0);
const pitchBefore = state.mouse.pitch;
cv.fire("pointermove", { pointerId: 21, clientX: 200, clientY: -9999 });
ok("pitch stays clamped", state.mouse.pitch <= 0.45 && state.mouse.pitch >= -0.55,
   state.mouse.pitch.toFixed(3));
cv.fire("pointerup", { pointerId: 21 });
const yawSettled = state.mouse.yaw;
cv.fire("pointermove", { pointerId: 21, clientX: 400, clientY: 100 });
ok("a finished drag stops steering", state.mouse.yaw === yawSettled);
state.cam.mode = "arcade";

/* ======================================================================
   9. Separation of concerns
   ====================================================================== */
console.log("\n[separation of concerns]");
const bal = (html.match(/BALANCE:BEGIN[\s\S]*?BALANCE:END/) || [""])[0];
ok("BALANCE block still present", !!bal);
ok("touch never reaches BALANCE", !/TOUCH|TPAD|vpad|viewW|FIT\.|LOOK\./.test(bal),
   "input and layout are presentation; the sim stays authoritative");
ok("no parallel movement path",
   !/TOUCH:BEGIN[\s\S]*?TOUCH:END/.test(html.replace(m[0], "")) &&
   /keys\.a = dx < -dead/.test(m[1]) && !/moveSpeed|player\.vx|player\.x \+=/.test(m[1]),
   "the pad writes into the same keys the keyboard writes into, and nothing else");
ok("desktop is untouched by the framing maths", /if \(!TOUCH \|\| !aspect \|\| aspect >= DESIGN_ASPECT/.test(html),
   "framedFov returns early off touch, so a monitor renders exactly as before");

console.log("\n" + "=".repeat(58));
console.log((fails ? "FAIL — " + fails + " of " : "PASS — ") + checks + " checks\n");
process.exit(fails ? 1 : 0);
