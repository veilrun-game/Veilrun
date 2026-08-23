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
ok("help, pause, camera and settings are all in it",
   /id="helpfab"/.test(fabRow) && /id="pausefab"/.test(fabRow) &&
   /id="camfab"/.test(fabRow) && /id="tunefab"/.test(fabRow));
ok("source order is screen order", fabRow.indexOf("helpfab") < fabRow.indexOf("pausefab") &&
   fabRow.indexOf("pausefab") < fabRow.indexOf("camfab") &&
   fabRow.indexOf("camfab") < fabRow.indexOf("tunefab"),
   "the cluster is a flex row, so there are no hand-computed right: offsets to re-derive");
/* VR-112 held this slot open and asserted it was NOT wired, so that nothing
   shipped a button that looks live and does nothing. VR-113 landed it, so the
   assertion inverts: the slot is now proven live rather than proven inert. */
ok("the camera slot is landed, not hidden",
   /id="camfab"/.test(fabRow) && !/id="camfab"[^>]*hidden/.test(fabRow));
ok("the camera fab is wired",
   /\$\("camfab"\)\.addEventListener\("click", function \(\) \{ cycleCam\(\); \}\)/.test(html));
/* The whole point of routing the fab through cycleCam: a second implementation
   of "change the camera" is how the key and the button start disagreeing about
   pointer lock, which is invisible until somebody plays on a desktop. */
ok("the V key runs the same verb the fab does",
   /if \(k === "v"\) cycleCam\(\);/.test(html),
   "one verb, two triggers");
ok("the camera is not a run-only fab", !/id="camfab"[^>]*runonly/.test(html),
   "picking arcade before you start is exactly when a phone player wants to");
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

/* ======================================================================
   10. The settings sheet meets WCAG 2.1 AA  (VR-114)
   ======================================================================
   The commit message for this card could have said "now conforms to WCAG AA"
   and nobody could have checked it. This section is that claim turned into
   something that fails.

   Three things get proven rather than declared:
     a) TARGET SIZE, resolved through the real cascade — not "the source
        mentions 44px somewhere", which passes happily while one control is
        still 22px tall.
     b) CONTRAST, recomputed from the palette's own hex values, so a palette
        tweak that drops a border under 3:1 fails here instead of shipping.
     c) THE FOCUS CONTRACT, by executing the shipped SHEET block against a stub
        DOM and actually tabbing around inside it.
   ====================================================================== */
console.log("\n[settings sheet — structure]");

const sheetHtml = (html.match(/<div id="tune"[\s\S]*?\n<\/div>\n/) || [""])[0];
ok("the sheet markup is findable", !!sheetHtml && sheetHtml.length > 2000);

/* --- 4.1.2 Name, Role, Value: the dialog itself ---------------------------- */
const dlgOpen = (sheetHtml.match(/<div id="tune"[^>]*>/) || [""])[0];
ok('role="dialog"', /role="dialog"/.test(dlgOpen), dlgOpen.slice(0, 96));
ok('aria-modal="true"', /aria-modal="true"/.test(dlgOpen));
const labelledBy = (dlgOpen.match(/aria-labelledby="([^"]+)"/) || [])[1];
ok("the dialog is named by an element that exists and has text",
   !!labelledBy && new RegExp('id="' + labelledBy + '"[^>]*>\\s*\\S').test(sheetHtml),
   labelledBy ? "#" + labelledBy : "no aria-labelledby");
ok("aria-hidden is toggled, not left to the transform",
   /aria-hidden="true"/.test(dlgOpen) &&
   /setAttribute\("aria-hidden", "false"\)/.test(html) &&
   /setAttribute\("aria-hidden", "true"\)/.test(html),
   "a translated panel is still in the accessibility tree");
/* aria-modal is a promise about the pointer as well as the keyboard. */
ok("a scrim makes aria-modal true for a thumb as well",
   /<div id="tunescrim">/.test(html) && /#tunescrim\{[^}]*pointer-events:none/.test(html) &&
   /#tunescrim\.on\{[^}]*pointer-events:auto/.test(html) &&
   /\$\("tunescrim"\)\.addEventListener\("click", close\)/.test(html));

/* --- 1.3.1 / 4.1.2: every control has a programmatic name ------------------ */
const sheetBody = (sheetHtml.match(/<div id="tunebody">[\s\S]*/) || [""])[0];
const labelFors = (sheetBody.match(/<label for="([^"]+)"/g) || []).map(s => s.slice(12, -1));
const bareLabels = (sheetBody.match(/<label(?! for=)/g) || []).length;
ok("no <label> in the sheet is free-floating", bareLabels === 0,
   bareLabels + " label(s) with no for= — the control beside them has no name at all");
const missingTargets = labelFors.filter(id => !new RegExp('id="' + id + '"').test(sheetBody));
ok("every label points at a control that exists", missingTargets.length === 0, missingTargets.join(" "));

/* Every focusable control in the sheet is named by a label, an aria-label, or
   its own text. Enumerated from the markup, so a control added later without a
   name fails here rather than being discovered by someone using a screen reader. */
const controls = (sheetBody.match(/<(select|input|button)\b[^>]*>/g) || [])
  .concat((sheetHtml.match(/<button[^>]*class="ticon[^>]*>/g) || []));
const unnamed = controls.filter(tag => {
  const id = (tag.match(/id="([^"]+)"/) || [])[1];
  if (/aria-label="/.test(tag)) return false;
  if (id && labelFors.includes(id)) return false;
  // a <button> with its own text content is named by that text
  if (/^<button/.test(tag) && new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\S").test(sheetHtml)) return false;
  return true;
});
ok("every control in the sheet has an accessible name", unnamed.length === 0, unnamed.join(" | "));

/* --- 1.4.1 Use of Colour: the three swatches ------------------------------- */
const swatches = (sheetBody.match(/<input type="color" id="t-(\w+)"/g) || []).map(s => s.slice(-5, -1).replace(/"/g, ""));
ok("each colour swatch carries its value as text too",
   ["glass", "rim", "burn"].every(k => new RegExp('id="t-' + k + 'v"').test(sheetBody)) &&
   /out\.textContent = el\.value/.test(html),
   "three swatches differing only by colour are three grey boxes to a colourblind player");

/* --- 2.3.3 / prefers-reduced-motion ---------------------------------------- */
ok("the sheet transition respects the OS motion flag",
   /@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?#tune[^}]*transition:visibility 0s/.test(html),
   "the panel still appears — what goes is the travel");
/* VR-103 ruled that an explicit choice on this device outranks the system flag.
   A media query alone cannot honour that, so the panel's own Reduce all motion
   button has to reach the panel — which is the one piece of motion you are
   certainly looking at at the moment you press it. */
ok("and the panel's own Reduce all motion button reaches the panel",
   /#tune\.noanim,#tune\.noanim\.on\{transition:visibility 0s\}/.test(html) &&
   /classList\.toggle\("noanim", isReduced\(\)\)/.test(html));
ok("that stillness is derived, not stored",
   /toggle\("noanim", isReduced\(\)\)[\s\S]{0,400}?function isReduced\(\)/.test(html) ||
   /function isReduced\(\)[\s\S]*?toggle\("noanim", isReduced\(\)\)/.test(html),
   "same predicate the button's own label comes from, so the two can't disagree");

/* --- 2.4.7 Focus Visible --------------------------------------------------- */
ok("there is a :focus-visible style", /:focus-visible\{outline:2px solid/.test(html));
ok("nothing in the sheet kills the outline",
   !/outline:\s*none/.test(html.slice(html.indexOf("#tune{"), html.indexOf("#bench{"))),
   "outline:none with no replacement is the single most common 2.4.7 failure");

/* ======================================================================
   10b. Target size, resolved through the cascade (WCAG 2.5.5)
   ======================================================================
   Not `/44px/.test(html)`. That regex passes while one control is still 22px
   tall, which is exactly the state this card found the panel in. Instead the
   stylesheet is parsed into rules, the touch media query is applied on top of
   the base rules the way a browser would, and each control's declared box is
   resolved from the rules that actually match it.
   ====================================================================== */
console.log("\n[settings sheet — target size (WCAG 2.5.5)]");

const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ["", ""])[1];
const TAP = 44;
const tapVar = +(css.match(/--tap:(\d+)px/) || [])[1];
ok("the 44px floor is a token, not twenty literals", tapVar === TAP, "--tap:" + tapVar + "px");

/* A deliberately small rule reader: selector + declarations, plus whether the
   rule sits inside the touch media query. Enough to model a cascade over a
   hand-written stylesheet with no nesting beyond @media, which is what this
   file is; anything more would be a CSS engine, and a CSS engine in a harness
   is a second thing that can be wrong. */
function readRules(text, inTouch) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let r;
  while ((r = re.exec(text))) {
    const sel = r[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!sel || sel.startsWith("@") || sel.startsWith("0%") || /^\d+%/.test(sel)) continue;
    out.push({ sel, decl: r[2], inTouch });
  }
  return out;
}
const touchBlock = (css.match(/@media \(hover:none\),\(pointer:coarse\)\{([\s\S]*?)\n\}/) || ["", ""])[1];
const rules = readRules(css.replace(touchBlock, ""), false).concat(readRules(touchBlock, true));

function decls(selectors, touch) {
  const acc = {};
  rules.forEach(r => {
    if (!selectors.includes(r.sel)) return;
    if (r.inTouch && !touch) return;
    (r.decl.match(/[-\w]+\s*:\s*[^;]+/g) || []).forEach(d => {
      const i = d.indexOf(":");
      acc[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    });
  });
  return acc;
}
function px(v) {
  if (v === undefined) return null;
  if (/var\(--tap\)/.test(v)) return tapVar;
  if (/^100%$/.test(v)) return Infinity;      // fills its row — bigger than any floor
  const n = v.match(/^(\d+(?:\.\d+)?)px$/);
  return n ? +n[1] : null;
}
/* Every interactive thing the sheet contains, with the selectors that size it.
   The list is checked against the markup below, so a control type added without
   an entry here fails rather than quietly skipping the assertion. */
const SIZED = {
  "select":            [".trow select"],
  "input[type=range]": [".trow input[type=range]"],
  "input[type=color]": [".trow input[type=color]"],
  "button.btn":        [".btn", "#tune .btn"],
  "button.ticon":      [".ticon", "#t-grab"]
};
[false, true].forEach(touch => {
  const where = touch ? "touch sheet" : "desktop drawer";
  Object.keys(SIZED).forEach(name => {
    const d = decls(SIZED[name], touch);
    const h = Math.max(px(d.height) || 0, px(d["min-height"]) || 0);
    const w = Math.max(px(d.width) || 0, px(d["min-width"]) || 0);
    ok(where + ": " + name + " is at least " + TAP + " tall", h >= TAP,
       (h || "unset") + "px");
    ok(where + ": " + name + " is at least " + TAP + " wide", w >= TAP,
       (w === Infinity ? "fills the row" : (w || "unset") + "px"));
  });
});
/* The regression that put this card on the board: a control sized in single
   digits. Anything in the sheet's own rules declaring a box under the floor is
   a failure regardless of which property it used. */
const sheetRules = rules.filter(r => /^(#tune|\.trow|\.ticon|#t-grab|#tunehead|#tunebody|\.tval|\.thex)/.test(r.sel));
const undersized = [];
sheetRules.forEach(r => {
  (r.decl.match(/(?:min-)?(?:width|height)\s*:\s*(\d+(?:\.\d+)?)px/g) || []).forEach(d => {
    const n = +d.match(/(\d+(?:\.\d+)?)px/)[1];
    /* Pseudo-elements are paint, not targets: the slider thumb, the grip bar and
       the scroll fade are all marks drawn inside or over a control, and the
       control around them is what a thumb actually hits. .tval / .thex are the
       readouts beside the sliders and are not interactive at all. */
    if (/::/.test(r.sel) || /^\.tval|^\.thex/.test(r.sel)) return;
    /* The one legitimate 1x1: a label clipped out of sight but kept in the
       accessibility tree, which is a NAME rather than a target — the control it
       names is the target, and it is measured above. Matched on the clip itself
       rather than on the selector, so only the visually-hidden pattern gets the
       exemption and a genuinely shrunken label still fails. */
    if (/clip-path:inset\(50%\)/.test(r.decl)) return;
    if (n < TAP) undersized.push(r.sel + " { " + d + " }");
  });
});
ok("no control in the sheet declares a box under the floor", undersized.length === 0,
   undersized.join("  ·  ") || "nothing under " + TAP + "px");

/* Desktop is not regressed to fix mobile: the drawer is still a drawer. */
console.log("\n[settings sheet — bottom sheet on touch, drawer on desktop]");
ok("desktop still slides in from the right",
   /#tune\{[\s\S]*?transform:translateX\(100%\)/.test(css) && /#tune\.on\{transform:translateX\(0\)/.test(css));
ok("touch slides up from the bottom instead",
   /transform:translateY\(100%\)/.test(touchBlock) && /#tune\.on\{transform:translateY\(0\)/.test(touchBlock));
ok("the sheet is anchored to the bottom edge on touch",
   /top:auto;left:0;right:0;bottom:0/.test(touchBlock));
ok("it opens at a detent, not full screen",
   /--sheeth:\d+vh/.test(touchBlock) && /#tune\.tall\{--sheeth:\d+vh\}/.test(touchBlock),
   "half these controls are judged by watching the arena change behind them");
ok("there is a scroll affordance at the edge",
   /#tune::after\{/.test(touchBlock) && /#tune\.atend::after\{opacity:0\}/.test(touchBlock),
   "twenty rows and nothing saying so");
ok("the grab handle is a real button, not a decorative bar",
   /<button class="ticon touchonly" id="t-grab"[^>]*aria-label=/.test(html) &&
   /aria-expanded/.test(html),
   "a drag gesture is not an affordance an assistive technology can reach");
/* The invariant from §1, restated for the sheet: CSS decides where the sheet
   comes from, JS never does. If the sheet ever gets a JS branch on device type,
   that branch and this media query are the next thing to fall out of step. */
ok("no second media query decides where the sheet comes from",
   (css.match(/@media \(hover:none\),\(pointer:coarse\)/g) || []).length === 1);

/* ======================================================================
   10c. Contrast, recomputed (WCAG 1.4.3 / 1.4.11)
   ====================================================================== */
console.log("\n[settings sheet — contrast]");
const hex = h => [1, 3, 5].map(i => parseInt(h.replace("#", "").substr(i - 1, 2), 16));
const lum = c => {
  const s = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const tok = n => hex((css.match(new RegExp("--" + n + ":(#[0-9A-Fa-f]{6})")) || [])[1] || "#000000");
/* The sheet's own ground, composited the way the browser does it, rather than a
   number typed in from a screenshot. */
const panelRgba = (css.match(/#tune\{[\s\S]*?background:rgba\((\d+),(\d+),(\d+),([\d.]+)\)/) || []).slice(1).map(Number);
const inkC = tok("ink");
const ground = panelRgba.length === 4
  ? [0, 1, 2].map(i => Math.round(panelRgba[i] * panelRgba[3] + inkC[i] * (1 - panelRgba[3])))
  : inkC;
const cr = n => ratio(tok(n), ground);
ok("body text (--white) clears 4.5:1 on the sheet", cr("white") >= 4.5, cr("white").toFixed(2) + ":1");
ok("secondary text (--mute) clears 4.5:1", cr("mute") >= 4.5, cr("mute").toFixed(2) + ":1  — the notes and the section heads");
ok("the numeric readout (--violet-lt) clears 4.5:1", cr("violet-lt") >= 4.5, cr("violet-lt").toFixed(2) + ":1");
ok("control borders (--line-hi) clear 3:1", cr("line-hi") >= 3,
   cr("line-hi").toFixed(2) + ":1  — 1.4.11, the border IS the control's boundary");
/* The reason --line-hi had to exist. Kept as an assertion so nobody "tidies"
   the two tokens back into one and silently reverts the fix. */
ok("--line is still the decorative hairline it always was", cr("line") < 3,
   cr("line").toFixed(2) + ":1 — fine for a divider, which is why it stays");
const borderUsers = sheetRules.filter(r => /border(?!-radius)[^;]*:[^;]*var\(--line\)(?!-hi)/.test(r.decl) &&
                                           /(select|input|\.ticon|#t-grab)/.test(r.sel));
ok("no control in the sheet still draws its edge with --line", borderUsers.length === 0,
   borderUsers.map(r => r.sel).join(" ") || "all control edges use --line-hi");
ok("the focus ring itself clears 3:1", ratio(tok("violet-lt"), ground) >= 3,
   "a focus indicator nobody can see is 2.4.7 twice over");

/* ======================================================================
   10d. The focus contract, executed  (WCAG 2.4.3 / 2.1.2 / 2.4.7)
   ======================================================================
   A focus trap is the part of a dialog that reads correct in a diff and is
   wrong in a browser. So the shipped SHEET block is extracted and RUN here,
   the same way the TOUCH block is in §3, and the assertions below are the
   result of actually tabbing around inside it.
   ====================================================================== */
console.log("\n[settings sheet — focus contract, executed]");
const sm = html.match(/SHEET:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* SHEET:END/);
ok("the SHEET block is marked and findable", !!sm);
if (!sm) { console.log("\n" + "=".repeat(58) + "\nFAIL — " + fails + " of " + checks); process.exit(1); }

const doc = { activeElement: null, pointerLockElement: null, exitPointerLock() { doc.pointerLockElement = null; } };
function dlgEl(id, opts) {
  const el = makeEl(id);
  el._attrsSet = {};
  el.setAttribute = (k, v) => { el._attrsSet[k] = v; };
  el.getAttribute = k => el._attrsSet[k];
  el.focus = () => { doc.activeElement = el; };
  el.disabled = false;
  el.offsetParent = {};              // visible unless a test says otherwise
  el.scrollTop = 0; el.scrollHeight = 900; el.clientHeight = 400;
  Object.assign(el, opts || {});
  return el;
}
const d = {
  tune: dlgEl("tune"), tunescrim: dlgEl("tunescrim"), tunebody: dlgEl("tunebody"),
  "t-close": dlgEl("t-close"), "t-grab": dlgEl("t-grab"), tunefab: dlgEl("tunefab"),
  "t-back": dlgEl("t-back"), tunetitle: dlgEl("tunetitle"),
  "btn-pausetune": dlgEl("btn-pausetune")
};
d.tunetitle.textContent = "Settings";
/* Three controls standing in for the twenty: first, middle, last is all a trap
   can be wrong about. The middle one goes hidden later to prove the trap skips
   the .touchonly rows that the other device never shows. */
const inner = [dlgEl("c-first"), dlgEl("c-mid"), dlgEl("c-last")];
d.tune.querySelectorAll = () => inner;

let dropped = 0, frozen = [];
const win = { addEventListener() {} };
/* Enough of document.createElement for the list stage to build itself. The list
   is GENERATED from the rows, so a stub that cannot make a node cannot see the
   half of this feature most likely to be wrong. */
doc.createElement = tag => {
  const n = dlgEl("");
  n.tagName = tag.toUpperCase();
  n.className = ""; n.textContent = ""; n.children = [];
  n.appendChild = c => { n.children.push(c); c.parentNode = n; return c; };
  n.insertBefore = (c, before) => { n.children.splice(Math.max(0, n.children.indexOf(before)), 0, c); c.parentNode = n; return c; };
  n.querySelector = sel => n.children.find(c => c._matches && c._matches(sel)) || null;
  return n;
};
const sheetBox = {
  $: id => d[id],
  document: doc, window: win,
  STAGED: true,
  dropHeldInput: () => { dropped++; },
  freezeArena: on => { frozen.push(on); },
  console, Math
};
vm.createContext(sheetBox);
let sheetClean = true, sheetErr = "";
try { new vm.Script(sm[1], { filename: "index.html#SHEET" }).runInContext(sheetBox); }
catch (e) { sheetClean = false; sheetErr = e.message; }
ok("the sheet module boots against a stub DOM", sheetClean, sheetErr || "no missing refs, no typo'd ids");
if (!sheetClean) { console.log("\n" + "=".repeat(58) + "\nFAIL — " + fails + " of " + checks); process.exit(1); }

sheetBox.wireDialog();
ok("closed is closed", sheetBox.isOpen() === false);

/* --- open ------------------------------------------------------------- */
doc.pointerLockElement = {};
doc.activeElement = d.tunefab;
sheetBox.open(d.tunefab);
ok("opening shows the dialog", sheetBox.isOpen() === true &&
   d.tune.getAttribute("aria-hidden") === "false" && d.tunescrim.classList.contains("on"));
ok("opening releases the pointer lock", doc.pointerLockElement === null,
   "the panel is a mouse surface");
ok("opening drops whatever the pad is holding", dropped === 1,
   "the VR-112 gotcha: a thumb still on the stick leaves you walking behind the panel");
ok("opening freezes the arena behind it", frozen[frozen.length - 1] === true,
   "the detail stage shows a live arena, and a live arena keeps swinging while both thumbs are on a slider");
ok("focus moves into the dialog", doc.activeElement === inner[0],
   "2.4.3 — otherwise the next Tab starts from the top of the document, behind the modal");

/* --- trap ------------------------------------------------------------- */
const key = (k, shift) => d.tune.fire("keydown", { key: k, shiftKey: !!shift, stopPropagation() {} });
doc.activeElement = inner[2];
key("Tab");
ok("Tab wraps from the last control to the first", doc.activeElement === inner[0]);
doc.activeElement = inner[0];
key("Tab", true);
ok("Shift+Tab wraps from the first back to the last", doc.activeElement === inner[2]);
doc.activeElement = inner[1];
key("Tab");
ok("Tab in the middle is left alone", doc.activeElement === inner[1],
   "the trap only intervenes at the two ends, or arrowing a slider stops working");
/* Hide the LAST control — a .touchonly row on a desktop, or a desktop-only row
   on a phone. The one before it is now the end of the cycle, so Tab from there
   has to wrap. If the trap counted the hidden control instead, Tab would do
   nothing and focus would sit on a control nobody can see. */
inner[2].offsetParent = null;
doc.activeElement = inner[1];
key("Tab");
ok("the trap skips controls the other device hides", doc.activeElement === inner[0],
   "cycling through invisible controls is a trap that feels broken");
inner[2].offsetParent = {};

/* --- escape and focus restore ----------------------------------------- */
let propagationStopped = false;
d.tune.fire("keydown", { key: "Escape", stopPropagation() { propagationStopped = true; } });
ok("Escape closes the dialog", sheetBox.isOpen() === false &&
   d.tune.getAttribute("aria-hidden") === "true" && !d.tunescrim.classList.contains("on"));
ok("Escape does not also reach the game underneath", propagationStopped,
   "or closing settings would pause the run at the same time");
ok("focus goes back to whatever opened it", doc.activeElement === d.tunefab,
   "2.4.3 — dropping focus on <body> restarts tabbing at the touch pad");
ok("closing lets the arena run again", frozen[frozen.length - 1] === false);

/* The opener is per-open, which is the whole reason the pause button can exist. */
sheetBox.open(d["btn-pausetune"]);
d["t-close"].fire("click", {});
ok("the close button restores focus to the pause button, not the corner fab",
   sheetBox.isOpen() === false && doc.activeElement === d["btn-pausetune"],
   "the ⚙ fab is on the far side of the screen and, on touch, under the sheet");
sheetBox.open(d.tunefab);
d.tunescrim.fire("click", {});
ok("tapping outside closes it too", sheetBox.isOpen() === false);

/* --- detents ---------------------------------------------------------- */
sheetBox.open(d.tunefab);
d["t-grab"].fire("click", {});
ok("the handle expands the sheet", d.tune.classList.contains("tall") &&
   d["t-grab"].getAttribute("aria-expanded") === "true");
ok("and renames itself so it isn't lying", d["t-grab"].getAttribute("aria-label") === "Collapse settings");
d["t-grab"].fire("click", {});
ok("and collapses it again", !d.tune.classList.contains("tall") &&
   d["t-grab"].getAttribute("aria-expanded") === "false");
d["t-grab"].fire("pointerdown", { pointerId: 1, clientY: 400 });
d["t-grab"].fire("pointermove", { pointerId: 1, clientY: 300 });
d["t-grab"].fire("pointerup", { pointerId: 1 });
ok("dragging the handle up expands it as well", d.tune.classList.contains("tall"),
   "the drag is the gesture a thumb expects; the click is the one a keyboard can reach");
d["t-grab"].fire("pointerdown", { pointerId: 2, clientY: 300 });
d["t-grab"].fire("pointermove", { pointerId: 2, clientY: 400 });
d["t-grab"].fire("pointerup", { pointerId: 2 });
ok("dragging it down collapses it", !d.tune.classList.contains("tall"));
d["t-grab"].fire("pointerdown", { pointerId: 3, clientY: 300 });
d["t-grab"].fire("pointermove", { pointerId: 3, clientY: 420 });
d["t-grab"].fire("pointerup", { pointerId: 3 });
ok("dragging a collapsed sheet further down dismisses it", sheetBox.isOpen() === false);
ok("closing resets the detent", !d.tune.classList.contains("tall"),
   "or it reopens at 92vh having been asked for 62 last time");

/* --- the scroll affordance tells the truth ---------------------------- */
sheetBox.open(d.tunefab);
d.tunebody.scrollTop = 0;
d.tunebody.fire("scroll", {});
ok("the edge fade is on while there is more below", !d.tune.classList.contains("atend"));
d.tunebody.scrollTop = 500;   // 900 scrollHeight - 400 clientHeight
d.tunebody.fire("scroll", {});
ok("and off at the end of the scroll", d.tune.classList.contains("atend"),
   "a fade that never clears is claiming there is more when there isn't");
sheetBox.close();

/* ======================================================================
   10e. Settings from inside pause  (Jordan, 8/17)
   ====================================================================== */
console.log("\n[settings from pause]");
const pauseScreen = (html.match(/<div class="screen" id="s-paused">[\s\S]*?\n<\/div>/) || [""])[0];
ok("the pause screen has a Settings button", /id="btn-pausetune"/.test(pauseScreen));
ok("Resume is still the primary verb beside it",
   pauseScreen.indexOf("btn-unpause") < pauseScreen.indexOf("btn-pausetune") &&
   /id="btn-pausetune"[^>]*>|class="btn ghost" id="btn-pausetune"/.test(pauseScreen));
ok("it opens rather than toggles",
   /\$\("btn-pausetune"\)\.addEventListener\("click", function \(\) \{ TUNE\.open\(\$\("btn-pausetune"\)\); \}\)/.test(html),
   "toggle() on a second tap would close a sheet you just asked for");
ok("it does not unpause",
   !/btn-pausetune[\s\S]{0,200}setPaused/.test(html),
   "settings is a thing you do while frozen, not a second way to unfreeze");
/* THE GOTCHA THIS CARD WAS WARNED ABOUT. One fix, and every surface that covers
   the arena has to call it — a third panel added without this line is a failing
   harness rather than a mystery on a phone. */
ok("the held-input fix is a function with one definition",
   /function dropHeldInput\(\) \{ keys = Object\.create\(null\); mouse\.l = mouse\.r = false; TPAD\.release\(\); \}/.test(html));
ok("pause calls it", /if \(game\.paused\) dropHeldInput\(\);/.test(html));
ok("opening settings calls it too", /dropHeldInput\(\);/.test(sm[1]),
   "opening settings mid-run used to leave the stick latched — same bug, different panel");
/* A modal that leaves the game's single-letter hotkeys live is a modal in name
   only: V swaps the camera behind it, H opens a second overlay under it. */
ok("game hotkeys stop at the dialog",
   /if \(TUNE\.isOpen\(\)\) \{ if \(k === "escape"\) TUNE\.close\(\); return; \}/.test(html),
   "V would swap the camera behind the panel and H would open a modal under a modal");
ok("the ⚙ fab still opens it the way it always did",
   /\$\("tunefab"\)\.addEventListener\("click", function \(\) \{ TUNE\.toggle\(\); \}\)/.test(html));

/* ======================================================================
   10f. Two stages: the list, then one control  (Jordan, 8/22)
   ======================================================================
   "The setting should be selected first, and then the slider appears along with
   the full view on the window, so you can see the change you're making as you
   make it."

   The list is GENERATED from the rows rather than written out a second time, so
   the thing worth proving is that the generation is faithful: one entry per row,
   pointing at that row, showing that row's current value. A list entry wired to
   the wrong control looks exactly like one that works.
   ====================================================================== */
console.log("\n[two-stage sheet — list, then one control]");

/* A stub row: a label, a control, a value readout — the three things the list
   reads — plus the sibling note that belongs to it. */
function stubRow(name, kind, value) {
  const row = dlgEl("row-" + name);
  row.className = "trow";
  const label = dlgEl("l-" + name); label.tagName = "LABEL"; label.textContent = name;
  const out = dlgEl("o-" + name); out.tagName = "OUTPUT"; out.textContent = value;
  const ctl = dlgEl("c-" + name);
  ctl.tagName = kind === "select" ? "SELECT" : "INPUT";
  if (kind === "select") { ctl.options = [{ text: value }]; ctl.selectedIndex = 0; }
  row.querySelector = sel => {
    if (sel === "label") return label;
    if (sel === "select,input") return ctl;
    if (sel === "output") return out;
    return null;
  };
  row._ctl = ctl; row._out = out;
  row.parentNode = { insertBefore(node) { inserted.push(node); } };
  row.nextElementSibling = null;
  return row;
}
const inserted = [];
const rangeRow = stubRow("Angle", "range", "32°");
const noteEl = dlgEl("note-angle"); noteEl.className = "tnote"; noteEl._cls.add("tnote");
rangeRow.nextElementSibling = noteEl;
const selectRow = stubRow("View", "select", "Arcade (fixed)");
const colourRow = stubRow("Rim", "color", "#B79CED");
const rows = [rangeRow, selectRow, colourRow];
d.tunebody.querySelectorAll = () => rows;

sheetBox.buildStage();
ok("the list stage turns itself on for touch", d.tune.classList.contains("staged"));
ok("one list entry per row, and no more", inserted.length === rows.length, inserted.length + " entries for " + rows.length + " rows");
ok("each entry is a real button", inserted.every(b => b.tagName === "BUTTON" && b.type === "button"),
   "not a div with a click handler — it has to be reachable by keyboard and announced as a control");
ok("each entry carries its setting's name and current value",
   inserted[0].children[0].textContent === "Angle" && inserted[0].children[1].textContent === "32°" &&
   inserted[1].children[1].textContent === "Arcade (fixed)" &&
   inserted[2].children[1].textContent === "#B79CED",
   "a select reads its selected option, a slider and a swatch read their output");
ok("the chevron is decorative and says so",
   inserted[0].children[2].getAttribute("aria-hidden") === "true",
   "or every row announces a stray '›' after its value");
ok("the note under a row is tied to that row",
   noteEl.classList.contains("tnote-row"),
   "the sentence explaining a control belongs with the control, which is the detail stage");
ok("rows remember their own name for the detail title",
   rangeRow.getAttribute("data-name") === "Angle");

/* --- into the detail stage ------------------------------------------------ */
sheetBox.open(d.tunefab);
ok("opening lands on the list, not wherever it was left",
   !d.tune.classList.contains("detail") && d.tunetitle.textContent === "Settings",
   "reopening into somebody's last slider is a panel that has lost its place");
inserted[0].fire("click", {});
ok("picking a setting drops to the detail stage", d.tune.classList.contains("detail"));
ok("exactly one row is shown, and it is the one picked",
   rows.filter(r => r.classList.contains("tfocus")).length === 1 && rangeRow.classList.contains("tfocus"));
ok("its note comes with it", noteEl.classList.contains("tfocus-note"));
ok("the title becomes the setting's name", d.tunetitle.textContent === "Angle");
ok("focus moves to the control itself", doc.activeElement === rangeRow._ctl,
   "the point of the stage is that one control; landing anywhere else costs a tab");
ok("the scrim stops dimming the arena", d.tunescrim.classList.contains("clear"),
   "you came here to look at the arena — but it still catches the tap, so aria-modal holds");
ok("back is offered and the drag handle stands down",
   d["t-back"].hidden === false && d["t-grab"].hidden === true);
ok("the detail stage is never the tall detent", !d.tune.classList.contains("tall"),
   "a 92vh sheet showing one slider is the blind-tuning problem again");

/* --- and back ------------------------------------------------------------- */
rangeRow._out.textContent = "41°";     // as though the slider had been dragged
d.tunebody.fire("input", {});
ok("moving the control updates the list behind it", inserted[0].children[1].textContent === "41°",
   "one delegated listener, so a binder can't forget to call back and leave a row lying");
d.tune.fire("keydown", { key: "Escape", stopPropagation() {} });
ok("Escape goes back to the list rather than out of the panel",
   sheetBox.isOpen() === true && !d.tune.classList.contains("detail"),
   "dumping you out of the panel because you wanted out of one slider is how people stop pressing Escape");
ok("the list stage is restored whole",
   d.tunetitle.textContent === "Settings" && d["t-back"].hidden === true &&
   d["t-grab"].hidden === false && !d.tunescrim.classList.contains("clear") &&
   rows.every(r => !r.classList.contains("tfocus")));
ok("focus returns to the row you came from", doc.activeElement === inserted[0],
   "2.4.3 again, one level down — otherwise you tab from the top of the list every time");
d.tune.fire("keydown", { key: "Escape", stopPropagation() {} });
ok("a second Escape does close it", sheetBox.isOpen() === false);

/* --- the desktop drawer is not staged ------------------------------------- */
sheetBox.STAGED = false;
d.tune.classList.remove("staged");
inserted.length = 0;
sheetBox.buildStage();
ok("the desktop drawer stays one flat list",
   inserted.length === 0 && !d.tune.classList.contains("staged"),
   "twenty rows beside an arena it never covered — staging it is two taps to do what one drag already does");
sheetBox.STAGED = true;

/* --- and the stage split is CSS over one control tree, not two ------------- */
console.log("\n[two-stage sheet — one control tree]");
ok("the list hides the rows and the detail hides the list",
   /#tune\.staged #tunebody \.trow,#tune\.staged #tunebody \.tnote-row\{display:none\}/.test(css) &&
   /#tune\.staged \.tpick\{display:flex\}/.test(css) &&
   /#tune\.staged\.detail \.tpick\{display:none\}/.test(css) &&
   /#tune\.staged\.detail #tunebody \.trow\.tfocus\{display:flex\}/.test(css));
ok("the detail stage shows the SAME control the list hides",
   !/id="t-pitch"[\s\S]*id="t-pitch"/.test(sheetHtml),
   "nothing is cloned — a duplicate control is how a setting ends up dead in one stage");
ok("staging is gated on the same TOUCH constant as everything else",
   /var STAGED = TOUCH;/.test(html) && /if \(!STAGED\) return;/.test(sm[1]),
   "a third reading of 'is this a phone' is a third thing that can fall out of step");
ok("the peek detent is content-height and capped",
   /#tune\.detail\{height:auto;max-height:\d+vh\}/.test(touchBlock),
   "as much arena above it as the one control leaves");
/* The freeze, and the reason the pause panel is withheld rather than the pause. */
console.log("\n[the quiet freeze]");
ok("the run freezes while the sheet is over it",
   /function freezeArena\(on\) \{[\s\S]*?setPaused\(true\)/.test(html));
ok("the pause panel is withheld, not the pause",
   /\$\("s-paused"\)\.classList\.toggle\("on", game\.paused && !\(TUNE && TUNE\.isOpen\(\)\)\)/.test(html),
   "the pause panel would cover the exact arena the detail stage exists to show");
ok("closing does not un-pause a run the sheet did not pause",
   /frozenByPanel = false; setPaused\(false\);/.test(html) &&
   /if \(game\.running && !game\.over && !game\.paused\) frozenByPanel = true;/.test(html),
   "opening settings from the pause screen must not resume the run on the way out");
/* Found by walking the OTHER entry point: opening from pause leaves the pause
   panel already on screen, and nothing re-evaluates its visibility unless
   setPaused runs again. A sheet with the pause panel behind it shows no arena
   at all, which is the whole feature gone. */
ok("opening from an already-paused run re-runs the panel decision",
   /if \(game\.running && !game\.over\) setPaused\(true\);/.test(html),
   "otherwise the pause panel sits behind the sheet covering the arena");
ok("and closing back into a run we did not freeze puts its panel back",
   /setPaused\(game\.paused\);   \/\/ already frozen when we arrived/.test(html));
ok("rendering is untouched by the freeze",
   /if \(game\.paused\) \{ acc = 0; \}/.test(html),
   "fog, the pixel grid and the three Shroud colours have to keep changing under your thumb");

/* ======================================================================
   11. The camera toggle, and the three ways it could strand you  (VR-113)
   ======================================================================
   A mode switch is not a camera position. `wantsLock()` reads cam.mode, so
   changing the mode changes whether the page should be holding a pointer lock
   at all — and getting that wrong leaves a desktop player in a free-look camera
   with a mouse that does nothing, which reads as "the game froze".
   ====================================================================== */
console.log("\n[camera toggle — leaving a mode]");
const toggleFn = (html.match(/function toggleCam\(\) \{[\s\S]*?\n\}/) || [""])[0];
const cycleFn  = (html.match(/function cycleCam\(\) \{[\s\S]*?\n\}/) || [""])[0];
const settleFn = (html.match(/function settleCam\(\) \{[\s\S]*?\n\}/) || [""])[0];
ok("there is one mechanism and one verb", !!toggleFn && !!cycleFn && !!settleFn);
/* toggleCam also runs at boot and from the settings panel, and a page may not
   request a pointer lock outside a user gesture. So the lock work has to live in
   the verb, not the mechanism — this is the assertion that stops it drifting
   back down into toggleCam where it would fire on page load. */
ok("the mechanism never touches pointer lock acquisition",
   !/requestPointerLock/.test(toggleFn),
   "toggleCam runs at boot; a boot that asks for pointer lock is a boot that throws");
ok("the verb settles the lock after the mode moves",
   /toggleCam\(\);/.test(cycleFn) && /settleCam\(\);/.test(cycleFn));
ok("settling acquires a lock the new mode wants",
   /if \(wantsLock\(\)\)/.test(settleFn) && /requestPointerLock/.test(settleFn),
   "arcade → third with no lock is a free-look camera and a dead mouse");
ok("and drops one the new mode does not",
   /else if \(document\.pointerLockElement\) document\.exitPointerLock\(\)/.test(settleFn));
ok("a refused re-lock cannot become an unhandled rejection",
   /p\["catch"\]/.test(settleFn) || /\.catch\(/.test(settleFn),
   "Chrome throttles a re-lock for about a second after an exit");
ok("it does not grab a lock while the run is paused or over",
   /if \(!game\.running \|\| game\.over \|\| game\.paused\) return;/.test(settleFn),
   "resuming is the pause button's job, and stealing the cursor back is not");
/* The narrow-vs-wide call this card had to make. A drag-to-look in flight
   belonged to a camera that no longer exists — and in arcade a stale drag keeps
   writing mouse.yaw, which is the character's FACING there, so the player spins.
   But release() would also drop the Stalk latch, and changing the camera is no
   reason to disarm an ability somebody armed. */
ok("a mode change ends an in-flight look drag", /TPAD\.endLook\(\)/.test(settleFn));
ok("but does not disarm Stalk", !/dropHeldInput\(\)/.test(settleFn) && !/TPAD\.release\(\)/.test(settleFn),
   "release() would take the latch with it — a camera change is not an ability cancel");
ok("endLook is narrower than release", /api\.endLook = function \(\) \{ lookId = null; \};/.test(html) &&
   /api\.release = function \(\) \{[\s\S]*?stalk = false;/.test(html));
/* --padh: checked rather than assumed. It is measured off #vpad's height, and
   #vpad is the same size in all three modes, so a mode change moves nothing. */
ok("--padh does not depend on the camera mode",
   !/cam\.mode/.test((html.match(/function applyPixelScale\(\)[\s\S]*?\n}/) || [""])[0]),
   "the pad is the same size in arcade, third and first");

console.log("\n[the toggle says which mode you are in]");
ok("the fab is rewritten from cam.mode, not from whoever changed it",
   /function syncCamUI\(\) \{[\s\S]*?CAM_GLYPH\[cam\.mode\][\s\S]*?CAM_LABEL\[cam\.mode\]/.test(html),
   "three entry points — V, the fab, the View row — and one readout");
ok("syncCamUI runs from the mechanism, so every entry point gets it",
   /syncCamUI\(\);\n\}/.test(toggleFn) || /syncCamUI\(\);/.test(toggleFn));
ok("each mode has its own glyph", (() => {
  const g = (html.match(/var CAM_GLYPH = \{([^}]*)\}/) || ["", ""])[1];
  const vals = (g.match(/"[^"]+"/g) || []).map(s => s.slice(1, -1));
  return vals.length === 3 && new Set(vals).size === 3;
})(), "a toggle with one glyph is a button you press three times to read");
ok("the accessible name carries the mode in words",
   /setAttribute\("aria-label", "Camera view — " \+ CAM_LABEL\[cam\.mode\]/.test(html),
   "a glyph is not a name, and 44px holds one character");
/* The tag stopped being a permanent label and became a toast, which also fixes
   the [ key leaving "pixel grid 1:4" in the corner for the rest of the run. */
ok("the corner readout is a toast with one writer",
   /function toast\(msg, ms\)/.test(html) &&
   (html.match(/\$\("camtag"\)\.textContent/g) || []).length === 0,
   "nothing may write the tag except toast(), or a stale sentence sits there all run");
ok("it is announced, not just drawn",
   /<div id="camtag" role="status" aria-live="polite">/.test(html),
   "the camera changing under you is what a sighted player sees and a blind one does not");
ok("nothing pins the toast open for the whole run",
   !/\$\("camtag"\)\.classList\.add\("on"\)/.test(html));

console.log("\n[the saved camera survives a boot]");
/* The bug this card found rather than caused: build() applied the saved V.cam
   and then the last line of the file forced arcade, so a saved camera was
   thrown away on every boot and the panel said one thing while the arena did
   another. */
ok("boot lands on the saved mode instead of forcing arcade",
   /var camWant = TUNE\.camMode\(\);/.test(html) && !/cam\.mode = "first"; toggleCam\(\)/.test(html));
ok("boot still initialises the rig through toggleCam",
   /cam\.mode = CAM_MODES\[\(CAM_MODES\.indexOf\(camWant\)[\s\S]{0,80}toggleCam\(\);/.test(html),
   "toggleCam is what sets player.g / vmBlade visibility and the fab glyph");
ok("the fab writes the change back so it persists",
   /if \(TUNE && TUNE\.setCam\) TUNE\.setCam\(cam\.mode\);/.test(cycleFn));
/* localStorage is untrusted input the moment anything can write a settings blob
   into it, and `while (cam.mode !== V.cam)` on a V.cam that is not a mode is an
   infinite loop at boot with no console open. */
ok("applying a camera mode is bounded",
   !/while \(cam\.mode !== V\.cam\) toggleCam\(\)/.test(html) &&
   /for \(var ci = 0; ci < CAM_MODES\.length && cam\.mode !== V\.cam; ci\+\+\) toggleCam\(\);/.test(html),
   "a corrupt saved mode used to hang the boot");
ok("and falls back rather than trusting it",
   /if \(CAM_MODES\.indexOf\(V\.cam\) < 0\) \{\s*\n\s*V\.cam = DEF\.cam;/.test(html));
/* Found by feeding a hostile blob to a real browser, not by reading: a <select>
   given a value none of its options carry goes to "", so a corrupt saved mode
   left the View row BLANK while the arena ran in arcade. Same
   panel-disagrees-with-the-game bug, arriving from the other direction. */
ok("the correction reaches the control, not just V",
   /V\.cam = DEF\.cam;\s*\n\s*var ce = \$\("t-cam"\); if \(ce\) ce\.value = V\.cam;/.test(html));

/* ======================================================================
   12. Presets — the codec, executed against hostile input  (VR-113)
   ======================================================================
   A preset is the first thing in this project a player can hand to another
   player, so the block that parses one is run here rather than read. Two
   untrusted sources, not one: a pasted code, and localStorage — which is a text
   file anyone with a console open can rewrite.
   ====================================================================== */
console.log("\n[preset codec]");
const pm = html.match(/PRESET:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* PRESET:END/);
ok("the PRESET block is marked and findable", !!pm);
if (!pm) { console.log("\n" + "=".repeat(58) + "\nFAIL — " + fails + " of " + checks); process.exit(1); }
const pBox = { module: { exports: {} }, Math, JSON, console, isFinite, Object, Array, String };
vm.createContext(pBox);
let pClean = true, pErr = "";
try { new vm.Script(pm[1], { filename: "index.html#PRESET" }).runInContext(pBox); }
catch (e) { pClean = false; pErr = e.message; }
ok("it is pure enough to run with no DOM at all", pClean, pErr || "no window, no document, no THREE");
if (!pClean) { console.log("\n" + "=".repeat(58) + "\nFAIL — " + fails + " of " + checks); process.exit(1); }
const P = pBox.module.exports.PRESETS;

/* A stand-in spec with one of each kind. The SHIPPED spec is asserted
   structurally below — it is built from the panel's own controls, so it cannot
   be reproduced here without a DOM, and reproducing it is exactly the duplicate
   that would go stale. */
const SPEC = {
  pitch: { t: "num", min: 10, max: 70 },
  fog:   { t: "num", min: 0, max: 0.08 },
  pixel: { t: "pick", of: ["1", "2", "4"] },
  glass: { t: "hex" }
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* --- the round trip ------------------------------------------------------ */
const src = { pitch: 34, fog: 0.03, pixel: "4", glass: "#8844ff" };
const wire = P.encode(src, SPEC);
ok("a preset round-trips losslessly", eq(P.decode(wire, SPEC), src), wire);
ok("encoding is canonical", P.encode({ glass: "#8844ff", pixel: "4", fog: 0.03, pitch: 34 }, SPEC) === wire,
   "same tuning, same string, whatever order the keys arrived in");
ok("a decoded preset re-encodes to the same string", P.encode(P.decode(wire, SPEC), SPEC) === wire);

/* --- hostile and malformed input ----------------------------------------- */
console.log("\n[a bad preset changes nothing and breaks nothing]");
const hostile = [
  ["not JSON at all", "{"],
  ["empty string", ""],
  ["null", null],
  ["a number", 42],
  ["an array", "[1,2,3]"],
  ["a bare array payload", JSON.stringify({ v: 1, s: [1, 2, 3] })],
  ["no version", JSON.stringify({ s: { pitch: 34 } })],
  ["a version from the future", JSON.stringify({ v: 9, s: { pitch: 34 } })],
  ["nothing this build knows", JSON.stringify({ v: 1, s: { nonsense: 1 } })],
  ["a null payload", JSON.stringify({ v: 1, s: null })],
  ["longer than the cap", JSON.stringify({ v: 1, s: { pitch: 34 } }) + " ".repeat(P.MAXLEN)]
];
let hostileClean = true, hostileWhy = "";
hostile.forEach(([name, s]) => {
  let r;
  try { r = P.decode(s, SPEC); } catch (e) { hostileClean = false; hostileWhy = name + " threw: " + e.message; return; }
  if (r !== null) { hostileClean = false; hostileWhy = name + " decoded to " + JSON.stringify(r); }
});
ok("every malformed preset is rejected, and none of them throws", hostileClean, hostileWhy ||
   hostile.length + " shapes, all null");

/* Out-of-range is CLAMPED rather than rejected — a preset from a build with a
   wider slider is still a usable preset — but NaN and Infinity are rejected,
   because both arrive from JSON looking like numbers and both render as a blank
   slider rather than as an error. */
ok("out of range is clamped to the panel's own bound",
   P.decode(JSON.stringify({ v: 1, s: { pitch: 9999 } }), SPEC).pitch === 70 &&
   P.decode(JSON.stringify({ v: 1, s: { pitch: -9999 } }), SPEC).pitch === 10);
ok("a value that is not a number is dropped, not coerced",
   P.coerce({ t: "num", min: 0, max: 1 }, "banana") === undefined &&
   P.coerce({ t: "num", min: 0, max: 1 }, NaN) === undefined &&
   P.coerce({ t: "num", min: 0, max: 1 }, Infinity) === undefined &&
   P.coerce({ t: "num", min: 0, max: 1 }, null) === undefined,
   "a silently coerced value is how a bad preset half-applies");
ok("a pick outside the panel's own options is dropped",
   P.coerce({ t: "pick", of: ["1", "2"] }, "9") === undefined &&
   P.coerce({ t: "pick", of: ["1", "2"] }, 1) === "1");
ok("a colour that is not six hex digits is dropped",
   P.coerce({ t: "hex" }, "#fff") === undefined &&
   P.coerce({ t: "hex" }, "javascript:alert(1)") === undefined &&
   P.coerce({ t: "hex" }, "#AABBCC") === "#aabbcc");

/* --- the guardrail this card exists not to break -------------------------- */
console.log("\n[a preset cannot reach BALANCE]");
const balKeys = Object.keys(C);
const smuggle = {};
balKeys.forEach(k => { smuggle[k] = 1; });
smuggle.strike = 999; smuggle.enemyHp = 1;
const got = P.sanitize(smuggle, SPEC);
ok("no balance key survives sanitising", Object.keys(got.value).length === 0,
   "VR-91's rule, enforced by the allow-list rather than by review: " + balKeys.length + " keys in, 0 out");
ok("the copy is driven by the spec's keys, not the payload's",
   /for \(k in SPEC\)/.test(pm[1]) && !/for \(k in raw\) \{[\s\S]{0,40}v\[k\]/.test(pm[1]),
   "iterating the payload is how an unknown key gets copied");
ok("a prototype-polluting payload writes nothing",
   (() => {
     const r = P.decode('{"v":1,"s":{"__proto__":{"polluted":1},"pitch":34}}', SPEC);
     return r && r.pitch === 34 && ({}).polluted === undefined &&
            !Object.prototype.hasOwnProperty.call(r, "__proto__");
   })(),
   "JSON.parse makes __proto__ an OWN property, so 'we never read it' is true and not the thing to rely on");
ok("dropped keys are reported rather than swallowed",
   P.sanitize({ pitch: 34, enemyHp: 9 }, SPEC).dropped.indexOf("enemyHp") >= 0,
   "so the panel can say what it ignored instead of pretending it loaded cleanly");

/* --- the shipped spec ----------------------------------------------------- */
console.log("\n[the shipped spec is the panel]");
const specFn = (html.match(/function buildSpec\(\) \{[\s\S]*?\n  \}/) || [""])[0];
ok("the spec builder exists", !!specFn);
ok("numeric bounds are read off the control, not typed twice",
   /var lo = \+el\.min, hi = \+el\.max;/.test(specFn),
   "a second hand-typed copy of min=10 max=70 goes stale in silence");
ok("pick options are read off the control too",
   /el\.options\[j\]\.value/.test(specFn));
ok("an unbounded row is not presettable", /if \(!isFinite\(lo\) \|\| !isFinite\(hi\) \|\| hi <= lo\) return;/.test(specFn),
   "a spec entry with no real bound is a validator that validates nothing");
/* PLACE, not look and feel. This is the recommendation the card asked for, in
   the only form that can't drift: the keys simply are not in the spec. */
ok("the spec carries no map and no camera mode",
   !/num\("map"|pick\("map"|S\.map/.test(specFn) && !/num\("cam"|pick\("cam"|S\.cam/.test(specFn),
   "a preset that yanks you into first person on somebody else's arena is one you undo before you can judge it");
ok("and no mset", !/mset/.test(specFn),
   "mset records that a human on THIS device expressed a motion preference — not a thing somebody else's preset asserts for them");
ok("loading applies the look-and-feel groups only",
   /apply\("arc"\); apply\("touch"\); apply\("pixel"\); apply\("fog"\);/.test(html) &&
   /function applyPreset\(p\) \{[\s\S]*?\n  \}/.test(html) &&
   !/function applyPreset\(p\) \{[\s\S]*?apply\("map"\)/.test(html),
   "a bare apply() would re-run the map branch and rebuild the arena under a live run");
ok("stored presets are re-sanitised on the way OUT as well as in",
   /PRESETS\.decode\(r\.s, SPEC\)/.test(html),
   "bytes in localStorage are older than this build — a slider's range may have moved since");
ok("the panel pushes a loaded preset back into every control",
   /function syncControls\(\) \{[\s\S]*?bound\[i\]\(\);[\s\S]*?refreshPicks\(\);/.test(html) &&
   /syncControls\(\);/.test((html.match(/function applyPreset\(p\) \{[\s\S]*?\n  \}/) || [""])[0]),
   "fourteen values change at once; a panel still showing the old ones is a panel nobody trusts");
/* The existing feedback loop is a different job from a save slot: one restores,
   the other reports. Removing it would take the only channel tuning currently
   reaches the project through. */
ok("the copy-to-clipboard loop is still there",
   /id="t-copy"/.test(html) && /Paste these to Claude and they become the new defaults\./.test(html));

console.log("\n[the preset rows are controls like any other]");
const presetRows = (html.match(/<h3>Presets<\/h3>[\s\S]*?<h3>Report back<\/h3>/) || [""])[0];
ok("the preset section is in the sheet", !!presetRows);
ok("every field is labelled",
   /<label for="t-preset">/.test(presetRows) && /<label for="t-pname">/.test(presetRows),
   "4.1.2 — the rest of this panel was fixed by VR-114 and new rows do not get to regress it");
ok("the name row carries an output so the list stage can show it",
   /id="t-pnamev"/.test(presetRows),
   "valueOf() reads a row's <output>; without one the list entry shows an empty value");
ok("the outcome of save / load / delete is announced",
   /id="t-pstatus"[^>]*role="status"/.test(presetRows),
   "all three are changes with no visible consequence on this screen");
ok("the status line is separate from the explanation",
   /id="t-pnote"/.test(presetRows) && /\$\("t-pstatus"\)/.test(html) && !/\$\("t-pnote"\)\.textContent = msg/.test(html),
   "overwriting the note spends the sentence that explains presets on a confirmation");
ok("the name field clears the touch floor like everything else",
   /\.trow input\[type=text\]\{[^}]*min-height:var\(--tap\)/.test(html));
ok("the three verbs are hidden in the detail stage with the other buttons",
   /#tune\.staged\.detail #tunebody \.tbtnrow/.test(html),
   "a stray button row over one slider is the second visual language the stage removes");
/* A name can arrive from another player's device the day tier two lands. */
ok("a preset name never becomes markup",
   /o\.textContent = slots\[i\]\.n;/.test(html) && !/innerHTML[^\n]*slots/.test(html),
   "the dropdown is the one place a shared string would otherwise be parsed as HTML");
ok("names are cleaned and length-capped at the door",
   P.clean("  a b  ").length > 0 && P.clean("x".repeat(400)).length === P.NAMEMAX &&
   P.clean(null) === "" && P.clean({}) === "");

console.log("\n" + "=".repeat(58));
console.log((fails ? "FAIL — " + fails + " of " : "PASS — ") + checks + " checks\n");
process.exit(fails ? 1 : 0);
