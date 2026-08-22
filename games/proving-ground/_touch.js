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

/* Four buttons since VR-112 — the pad is 2x2 and holds only gameplay verbs.
   Pause and Settings are #sysfabs now and are asserted structurally in §5b. */
const buttons = ["exec", "step", "strike", "stalk"].map(k => {
  const b = makeEl("vb-" + k); b._attrs.k = k; b.getAttribute = n => (n === "data-k" ? k : undefined); return b;
});
const els = {};
["vpad", "vstick", "vknob", "vf-exec", "vf-step0", "vf-step1"].forEach(id => els[id] = makeEl(id));
/* #vb-stalk and the .vbtn whose class gets toggled are ONE element in the real
   DOM — the stub has to reflect that or the latch appears not to light up. */
["step", "exec", "stalk", "strike"].forEach(k => els["vb-" + k] = buttons.find(b => b.getAttribute("data-k") === k));
els.vpad.querySelectorAll = () => buttons;

/* The REAL balance numbers, not a copy: execFill()/stepFill() divide by execCd
   and stepRecharge, so a harness carrying its own constants would keep passing
   after a balance change moved the very thing it is asserting. */
const balSrc = (html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/) || [])[1];
const balBox = { module: { exports: {} }, Math, console };
vm.createContext(balBox);
new vm.Script(balSrc, { filename: "index.html#BALANCE" }).runInContext(balBox);
const C = balBox.module.exports.C;

// live game state the module reads
const state = {
  keys: Object.create(null),
  mouse: { yaw: 0, pitch: -0.12, locked: false, l: false, r: false },
  pressed: { strike: false, exec: false, step: false },
  game: { running: true, over: false, paused: false },
  player: { stepCharges: 2, stepTimer: 0, execCd: 0 },
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
  C,
  helpOpen: () => state.helpOpenFlag,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  setPaused: p => state.paused.push(p),
  TUNE: { toggle() { state.tuneToggled = true; } },
  LOOK: { sens: 0.0055 },
  renderer: { domElement: makeEl("canvas") },
  Math, console
};
vm.createContext(sandbox);

/* The pad's fill maths is not reimplemented here. The SHIPPED execFill /
   stepFill / pulseRefund are lifted out of index.html and run in this same
   sandbox, so §5c exercises the real functions rather than a paraphrase of
   them — which is the only way "the pad and the HUD pips agree" is provable
   instead of asserted. */
const shared = ["function execFill\\(\\)[\\s\\S]*?\\n}", "function stepFill\\(i\\)[\\s\\S]*?\\n}",
                "var execPrev = 0;[\\s\\S]*?function pulseRefund\\(el\\)[\\s\\S]*?\\n}"]
  .map(re => (html.match(new RegExp(re)) || [""])[0]);
new vm.Script(shared.join("\n"), { filename: "index.html#SHARED" }).runInContext(sandbox);
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

/* ======================================================================
   5a. The pad is 2x2, and the cells are bigger than they were (VR-112)
   ====================================================================== */
console.log("\n[2x2 geometry]");
/* A 2x2 pad with a 3x2 harness is worse than no harness, so the shape is
   asserted from the stylesheet, not assumed from the markup. */
const padCss = (html.match(/#vpad \.vgrid\{[\s\S]*?\}/) || [""])[0];
ok("the grid is two columns", /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(padCss), padCss.slice(0, 60) + "…");
ok("the grid is two rows", /grid-template-rows:repeat\(2,minmax\(44px,1fr\)\)/.test(padCss));
ok("only gameplay verbs are in the pad",
   buttons.length === 4 && !buttons.some(b => ["pause", "tune"].includes(b.getAttribute("data-k"))),
   "a system verb in the pad is a system verb behind the inert-when-not-live gate");
const padKeys = (html.match(/<div class="vgrid">[\s\S]*?<\/div>/) || [""])[0].match(/data-k="(\w+)"/g) || [];
ok("markup and harness agree on the four verbs",
   padKeys.length === 4 && ["exec", "step", "strike", "stalk"].every(k => padKeys.includes('data-k="' + k + '"')),
   padKeys.join(" "));

/* Bigger targets were the whole point of dropping to four (Jordan, 8/17), and
   they are bigger structurally, not by eye: two columns instead of three across
   the same width, the old 360px cap gone so the grid takes everything the stick
   isn't using, and a row floor tied to the stick's diameter rather than to
   content height. If any of those three regress, the cells silently shrink back. */
ok("the grid is no longer capped at the old 360px", !/max-width:360px/.test(padCss),
   "that cap is what kept the cells narrow when there were three of them");
ok("the grid claims the stick's full height", /min-height:var\(--stickw\)/.test(padCss),
   "otherwise the rows are content-sized and the pad wastes the space it already owns");
ok("--stickw drives both the stick and the grid",
   /#vpad\{--stickw:clamp\(/.test(html) && /#vpad \.vstick\{[^}]*width:var\(--stickw\)/.test(html),
   "one number, so they can't drift apart");
const btnCss = (html.match(/#vpad \.vbtn\{[\s\S]*?\}/) || [""])[0];
ok("every cell clears the 44px touch floor", /min-height:44px/.test(btnCss));

/* ======================================================================
   5b. System chrome moved up and is thumb-sized
   ====================================================================== */
console.log("\n[system chrome]");
const fabRow = (html.match(/<div id="sysfabs">[\s\S]*?<\/div>/) || [""])[0];
ok("there is a system fab cluster", !!fabRow);
ok("help, pause and settings are all in it",
   /id="helpfab"/.test(fabRow) && /id="pausefab"/.test(fabRow) && /id="tunefab"/.test(fabRow));
ok("source order is screen order", fabRow.indexOf("helpfab") < fabRow.indexOf("pausefab") &&
   fabRow.indexOf("pausefab") < fabRow.indexOf("tunefab"),
   "the cluster is a flex row, so there are no hand-computed right: offsets to re-derive");
ok("the VR-113 camera slot is placed but not half-wired",
   /id="camfab"[^>]*hidden/.test(fabRow) && !/camfab.*addEventListener/.test(html),
   "a button that looks live and does nothing is worse than no button");
/* 38x38 shipped with VR-79 and is under the 44x44 minimum every touch guideline
   agrees on. This is the assertion that stops it drifting back. */
const touchQ = (html.match(/@media \(hover:none\),\(pointer:coarse\)\{[\s\S]*?\n\}/) || [""])[0];
ok("fabs are at least 44x44 on touch", /\.sysfab\{width:44px;height:44px/.test(touchQ),
   "they shipped at 38px, which is under the floor");
ok("no 38px fab sizing survives anywhere", !/\.(helpfab|sysfab)\{[^}]*38px/.test(html) && !/#tunefab\{[^}]*38px/.test(html));
/* Pause is deliberately NOT inside the TOUCH block: it must work on a desktop
   too, and system verbs must not sit behind the pad's live() gate. */
ok("pause is wired outside the pad's live() gate",
   /\$\("pausefab"\)\.addEventListener\("click", function \(\) \{\s*if \(game\.running && !game\.over\) setPaused/.test(html));
ok("pause and help light up with the run",
   /\$\("pausefab"\)\.classList\.add\("on"\)/.test(html) && /\$\("pausefab"\)\.classList\.remove\("on"\)/.test(html));
/* Found by rendering VR-112 at 390px, not by reading it: a 44px cluster is wide
   enough to sit on top of the HP number, so both HUD corners drop below it. */
ok("the HUD corners clear the fab row on touch",
   /\.hud-tl\{top:64px/.test(touchQ) && /\.hud-tr\{top:64px\}/.test(touchQ),
   "at 44px the cluster overlaps a 270px-wide hud-tl");
/* The pips and the pad are the same two abilities with the same fill. On a phone
   the pips also label themselves "Shift" and "RMB", which are not on the device. */
ok("the bottom pip row is hidden on touch", /\.hud-b\{display:none\}/.test(touchQ),
   "showing pad AND pips is the second visual language this card removes");

/* ======================================================================
   5c. The cooldown IS the button
   ====================================================================== */
console.log("\n[in-button fill]");
const fStep = [els["vf-step0"], els["vf-step1"]], fExec = els["vf-exec"];
const sy = el => el.style.transform;

state.player.stepCharges = 2; state.player.stepTimer = 0; state.player.execCd = 0;
TPAD.refresh();
ok("both veilstep segments are full at two charges", sy(fStep[0]) === "scaleY(1)" && sy(fStep[1]) === "scaleY(1)");
ok("execute reads full when it is ready", sy(fExec) === "scaleY(1)",
   "fill means READINESS and grows upward — it used to be the inverse");

state.player.stepCharges = 1; state.player.stepTimer = C.stepRecharge / 2;
TPAD.refresh();
ok("the banked charge stays full", sy(fStep[0]) === "scaleY(1)");
ok("the recharging charge shows the timer, in the same button", sy(fStep[1]) === "scaleY(0.5)",
   "stock AND recharge in one control — the two corner dots could only say stock");

state.player.stepCharges = 0; state.player.stepTimer = 0;
TPAD.refresh();
ok("spent veilstep is empty, not merely faded",
   sy(fStep[0]) === "scaleY(0)" && sy(fStep[1]) === "scaleY(0)" && els["vb-step"].classList.contains("vdim"));

state.player.execCd = C.execCd;
TPAD.refresh();
ok("execute empties the moment it is spent", sy(fExec) === "scaleY(0)" && els["vb-exec"].classList.contains("vdim"));
state.player.execCd = C.execCd / 2;
TPAD.refresh();
ok("execute fills as the cooldown runs", sy(fExec) === "scaleY(0.5)");

/* The chain-kill refund is the flow loop Execute exists to reward. Without a
   pulse the fill just jumps, which reads as a rendering glitch. */
els["vb-exec"].classList.remove("refund");
state.player.execCd = C.execCd / 2 - C.execKillCdRefund;
TPAD.refresh();
ok("a chain-kill refund pulses the button", els["vb-exec"].classList.contains("refund"),
   "execCd dropped by execKillCdRefund " + C.execKillCdRefund + "s outside normal decay");
els["vb-exec"].classList.remove("refund");
state.player.execCd -= 0.016;
TPAD.refresh();
ok("ordinary per-frame decay does not pulse", !els["vb-exec"].classList.contains("refund"),
   "or it would strobe for the whole cooldown");
state.player.execCd = 0; state.player.stepCharges = 2; state.player.stepTimer = 0;
TPAD.refresh();

/* The card's actual requirement: the pad must not become a second visual
   language. It cannot, if both surfaces call the same two functions. */
ok("the pad and the HUD pips share one readiness vocabulary",
   /fExec\.style\.transform = "scaleY\(" \+ execFill\(\)/.test(m[1]) &&
   /HUD\.fillExec\.style\.transform = "scaleY\(" \+ execFill\(\)/.test(html) &&
   /stepFill\(i\)/.test(m[1]) && /HUD\.fillStep\[i\]\.style\.transform = "scaleY\(" \+ stepFill\(i\)/.test(html),
   "one definition of 'how ready is this', called from both");
ok("the corner charge dots are gone from both surfaces",
   !/class="chgs"/.test(html) && !/id="chg0"/.test(html) && !/HUD\.chg/.test(html),
   "two fill segments say everything the dots said, plus the timer");

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

/* Settings must stay reachable regardless — it's how you change camera on touch.
   Since VR-112 that is structural rather than behavioural: ⚙ is a #sysfabs
   button with a plain click listener, so there is no live() gate in front of it
   at all. The gate only exists inside the pad, and the pad no longer holds it. */
ok("settings sits outside the gate entirely",
   /\$\("tunefab"\)\.addEventListener\("click", function \(\) \{ TUNE\.toggle\(\); \}\)/.test(html) &&
   !/TUNE\.toggle/.test(m[1]),
   "it's the only way to change camera view on a phone, so it can't be run-gated");
ok("settings is not a run-only fab", !/id="tunefab"[^>]*runonly/.test(html));

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
