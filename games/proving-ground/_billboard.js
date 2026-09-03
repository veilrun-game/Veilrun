/* VEILRUN — VR-91 billboard harness.
   The sim proves the balance; this proves the SPRITE MATH, the half that can
   silently look wrong instead of failing loudly. Asserts the facing selector,
   the atlas UV mapping and the plane geometry against the asset contract, and
   cross-checks the constants actually present in index.html so the two can't drift.
   Usage: node _billboard.js   (run from games/proving-ground/) */
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let fails = 0, checks = 0;
const ok = (n, c, d) => { checks++; if (!c) { fails++; console.log("  FAIL  " + n + (d ? "  — " + d : "")); } else console.log("  ok    " + n + (d ? "  — " + d : "")); };

/* ---- contract constants, mirrored from the doc ---- */
const PXC = 1024, FLOOR_PX = 960, STAND_PX = 864, COLS = 4, ROWS = 1, FACINGS = 4;

console.log("\nVEILRUN · Proving Ground v1 — billboard harness\n" + "=".repeat(58));

console.log("\n[constants match the contract]");
ok("canvas 1024",      /PXC\s*=\s*1024/.test(html));
ok("floor line 960",   /FLOOR_PX\s*=\s*960/.test(html));
ok("standing box 864", /STAND_PX\s*=\s*864/.test(html));
ok("atlas is 4x1",     /COLS\s*=\s*4,\s*ROWS\s*=\s*1/.test(html));
ok("4 facings (arcade camera)", /FACINGS\s*=\s*4/.test(html));
ok("alphaTest, never blended", /alphaTest:\s*0\.5/.test(html) && /transparent:\s*false/.test(html),
   "26 husks can overlap without sort-fighting");
ok("mipmaps off (atlas cells would bleed)", /generateMipmaps\s*=\s*false/.test(html));

/* ---- plane geometry ---- */
console.log("\n[plane geometry]");
const size = h => h * PXC / STAND_PX;
const centreY = h => h * (PXC / 2 - (PXC - FLOOR_PX)) / STAND_PX;
const near = (a, b, t) => Math.abs(a - b) < (t || 1e-3);
ok("Vesper plane 2.133", near(size(1.80), 2.1333, 1e-3), size(1.80).toFixed(4));
ok("Vesper centre 0.933", near(centreY(1.80), 0.9333, 1e-3), centreY(1.80).toFixed(4));
ok("Anvil is the tallest", size(2.20) > size(1.80) && size(2.20) > size(1.76));
// the point of the anchor: the bottom of the quad sits the same fraction below the floor
const foot = h => centreY(h) - size(h) / 2;
ok("every character's feet land on y=0", [1.80, 2.20, 1.76, 1.78].every(h =>
   near(foot(h) + (PXC - FLOOR_PX) * h / STAND_PX, 0, 1e-9)),
   "quad bottom sits exactly one 64px margin below the floor line");

/* ---- facing selector ---- */
console.log("\n[facing selector]");
const TAU = Math.PI * 2, STEP8 = TAU / FACINGS;
function facingFor(cx, cz, x, z, yaw, dir) {
  const toCam = Math.atan2(-(cx - x), -(cz - z));
  let rel = (toCam - yaw) * (dir === undefined ? 1 : dir);
  rel = ((rel % TAU) + TAU) % TAU;
  return Math.round(rel / STEP8) % FACINGS;
}
// camera due south of a character at the origin; character's forward is (-sin yaw, -cos yaw)
const DIR = parseInt((html.match(/FACING_DIR\s*=\s*(-?1)/) || [])[1], 10);
ok("FACING_DIR is declared in the game", DIR === 1 || DIR === -1, "FACING_DIR = " + DIR);
const CX = 0, CZ = 10;
ok("facing the camera -> f0", facingFor(CX, CZ, 0, 0, Math.atan2(-0, -1, DIR) + Math.PI) === 0 ||
   facingFor(CX, CZ, 0, 0, Math.PI, DIR) === 0, "f" + facingFor(CX, CZ, 0, 0, Math.PI, DIR));
ok("facing away -> f2", facingFor(CX, CZ, 0, 0, 0, DIR) === 2, "f" + facingFor(CX, CZ, 0, 0, 0, DIR));
ok("quarter turn -> f1", facingFor(CX, CZ, 0, 0, Math.PI + Math.PI / 2, DIR) === 1,
   "f" + facingFor(CX, CZ, 0, 0, Math.PI + Math.PI / 2, DIR));
ok("the other quarter -> f3", facingFor(CX, CZ, 0, 0, Math.PI - Math.PI / 2, DIR) === 3,
   "f" + facingFor(CX, CZ, 0, 0, Math.PI - Math.PI / 2, DIR));
let all = new Set();
for (let i = 0; i < FACINGS; i++) all.add(facingFor(CX, CZ, 0, 0, Math.PI + i * STEP8, DIR));
ok("a full turn visits all 4 exactly once", all.size === FACINGS);
let mono = true;
for (let i = 0; i < FACINGS; i++) if (facingFor(CX, CZ, 0, 0, Math.PI + i * STEP8, DIR) !== i) mono = false;
ok("and in order f0..f3", mono, "if a delivered set turns the other way, flip FACING_DIR");


/* ---- atlas UVs ---- */
console.log("\n[atlas UVs]");
const DU = 1 / COLS, DV = 1 / ROWS;
function cell(fi) {
  const col = fi % COLS, row = (fi / COLS) | 0;
  return { u0: col * DU, v0: 1 - (row + 1) * DV };
}
ok("f0 is the left-most cell", cell(0).u0 === 0 && cell(0).v0 === 0);
ok("f3 is the right-most cell", near(cell(3).u0, 0.75) && cell(3).v0 === 0);


let inside = true;
for (let i = 0; i < FACINGS; i++) { const c = cell(i); if (c.u0 < 0 || c.u0 + DU > 1.0001 || c.v0 < 0 || c.v0 + DV > 1.0001) inside = false; }
ok("every cell lies inside the sheet", inside);

console.log("\n[arcade camera + pixel grid]");
ok("arcade is a camera mode", /CAM_MODES\s*=\s*\["arcade"/.test(html), "and the v1 default");
/* VR-79 mobile pass: the four scattered `cam.mode !== "arcade"` pointer-lock
   conditions became one wantsLock() predicate, so these checks now assert the
   RULE rather than its old spelling — and assert the touch half too, which is
   the same trap arriving from the other direction (a mode that never asks for a
   lock vs. a device that can never grant one). */
ok("pointer lock goes through one predicate", /function wantsLock\(\)\s*\{\s*return\s*!TOUCH\s*&&\s*cam\.mode !== "arcade";\s*\}/.test(html),
   "arcade never grabs it, and neither does a touch device");
{
  /* Every call site must be gated by that predicate — checked by proximity, not
     by matching one line, because resumeFromPause() guards with an early return
     rather than an inline condition and a line-literal assertion would call that
     a failure. 160 chars back covers an inline guard or the line above it. */
  const sites = [...html.matchAll(/requestPointerLock\(\)/g)];
  const ungated = sites.filter(m => !/wantsLock\(\)/.test(html.slice(Math.max(0, m.index - 160), m.index)));
  ok("every lock request is gated by it", sites.length > 0 && ungated.length === 0,
     ungated.length ? ungated.length + " ungated call site(s)" : sites.length + " call sites, all gated");
  ok("no stale cam.mode guard survives", !/cam\.mode !== "arcade"[\s\S]{0,60}requestPointerLock/.test(html),
     "a condition left behind here is a touch device asking for a lock it can't have");
}
/* VR-124 moved both of these behind two named functions. The CLAIMS are
   unchanged — arcade resolves the sticks against the fixed rig, and in arcade you
   face where you move — but they are no longer two inline expressions, so
   matching the old text would fail on a build that still does exactly the right
   thing. The behavioural proof now lives in _touch.js, which extracts the AIM
   block and executes it; what belongs HERE, with the rest of the arcade-camera
   contract, is that the arcade rig is still what the sticks resolve against and
   that facing no longer travels through the camera's yaw. */
/* VR-156 widened moveBasis into a branch (arcade / latched "free" / camera),
   so pinning its one-line text no longer works. What this file is responsible
   for is unchanged and is what is asserted: ARCADE still resolves against the
   fixed rig, ahead of every other branch, and both call sites share the one
   definition. The behaviour of the other branches is _touch.js's, executed. */
ok("WASD resolves against the fixed camera",
   /function moveBasis\(moving\) \{\s*if \(cam\.mode === "arcade"\) return ARC\.yaw;/.test(html) &&
   (html.match(/var basis = moveBasis\(!!\(mx \|\| mz\)\);/g) || []).length === 2,
   "one definition, used by walking and by veilstep — and arcade answers first");
ok("you face where you move",
   /player\.aim = aimFor\(!!\(mx \|\| mz\), tvx, tvz\);/.test(html) &&
   /return moving \? Math\.atan2\(-tvx, -tvz\) : player\.aim;/.test(html),
   "same maths as VR-91, writing to player.aim instead of to the camera");
ok("facing never rides the camera's yaw again",
   !/mouse\.yaw = Math\.atan2/.test(html),
   "the old arcade line is gone rather than living beside the new one");
ok("pixel grid on by default", /var PIXEL = 4;/.test(html));
ok("antialias off while pixelated", /antialias: PIXEL <= 1/.test(html), "smoothing at low res kills the effect");
ok("sprites switch to NearestFilter", /NearestFilter/.test(html));

console.log("\n[yaw convention]");
ok("one documented convention", /YAW CONVENTION/.test(html) && /var MESH_PI/.test(html));
/* VR-157 split the facing in two: player.yaw is what the VERBS use, and
   player.bodyYaw is what is DRAWN. The convention this section polices is
   about drawing, so it follows the drawn angle. */
ok("player mesh is offset by MESH_PI", /player\.g\.rotation\.y = player\.bodyYaw \+ MESH_PI/.test(html),
   "meshes are modelled facing +z; forward is -z");
ok("and the mesh is drawn from bodyYaw, never from the verb facing",
   !/player\.g\.rotation\.y = player\.yaw/.test(html) &&
   /SPR\.place\(s, player\.x, player\.g\.position\.y, player\.z, player\.bodyYaw, 1\)/.test(html) &&
   !/ghost\(player\.x, player\.z, player\.yaw\)/.test(html),
   "model, sprite and afterimages are three pictures of one body — a mixture is a character whose ghost faces elsewhere");
ok("husk meshes too", !/e\.g\.rotation\.y = e\.yaw;/.test(html) && /e\.g\.rotation\.y = e\.yaw \+ MESH_PI/.test(html));
ok("husks face the player on the same convention", !/Math\.atan2\(sx, sz\)/.test(html) && /Math\.atan2\(-sx, -sz\)/.test(html));
ok("so the lunge goes TOWARD you", /var lx = -Math\.sin\(e\.yaw\), lz = -Math\.cos\(e\.yaw\)/.test(html) && /Math\.atan2\(-dx, -dz\)/.test(html),
   "telegraph and lunge finally agree");
ok("telegraph ring sits in front", /tele\.position\.set\(e\.x - Math\.sin\(e\.yaw\) \* 0\.9/.test(html));

console.log("\n[player model]");
ok("GLTFLoader is loaded", /examples\/js\/loaders\/GLTFLoader\.js/.test(html),
   "cdnjs hosts r128's core but not its loaders");
ok("model falls back to primitives", /keeping the primitive rig/.test(html),
   "a missing asset must never break the game");
ok("model does NOT cancel MESH_PI", /root\.rotation\.y = 0;/.test(html) &&
   !/root\.rotation\.y = -MESH_PI/.test(html),
   "Blender -Y exports to glTF +Z, so the model faces the same way as the primitives");
/* VR-111 split the call so the strike stage can pick its own sub-clip, so this
   can no longer pin the literal. The property that matters is unchanged and is
   what's asserted: playerModelState() is still the ONLY thing that decides what
   Vesper is doing, and combatClip() may only refine `attack` into a stage —
   never invent a state of its own. */
ok("model shares the sprite state machine",
   /var st = playerModelState\(speed\);/.test(html) &&
   /MODEL\.play\(combatClip\(st\), dt, speed, combatWindow\(st\)\)/.test(html),
   "one source of truth for what the character is doing");
ok("combatClip only refines the attack state",
   /function combatClip\(st\) \{\s*\n\s*if \(st !== "attack"\) return st;/.test(html),
   "every other state passes through untouched");
ok("combat animation speed is driven from BALANCE",
   /function combatWindow\(st\)/.test(html) && /s\.wind \+ s\.active \+ s\.rec/.test(html),
   "VR-111: the balance numbers decide how fast Vesper looks");
ok("mixer is ticked on the render clock", /updatePlayerModel\(raw\)/.test(html));

ok("render precedence is explicit", /MODEL > SPRITE > PRIMITIVES/.test(html) &&
   /if \(modelReady\(\)\) return false;/.test(html),
   "the model owns the player; the sprite layer stood down");
ok("player.g re-shown for the model", /player\.g\.visible = \(cam\.mode !== "first"\)/.test(html),
   "the model is a CHILD of player.g and inherits its visibility");

console.log("\n[shroud + locomotion]");
ok("shroud is a dissolve, not a fade", /uDissolve/.test(html) && /discard;/.test(html),
   "discard-based, so no transparency sorting to go wrong");
ok("dissolve resolves into a glass ghost", /uGhost/.test(html) && /vrF = pow\(1\.0 - abs\(dot/.test(html),
   "fresnel shell: near-invisible face-on, bright where the surface turns away");
ok("the dissolve UNCOVERS the glass, it does not precede it",
   /vrG = max\(vrG, uGhost\)/.test(html) && /VR_TEAR/.test(html),
   "VR-130: one front — skin ahead of it, a lit tear at it, glass behind it");
ok("the tear moves rather than accumulating", /vrN < uDissolve && vrN > vrBack\) discard;/.test(html),
   "a gap that opens ahead of the glass and closes behind it, so nothing stays perforated");
ok("uGhost is a backstop, not the effect", /uGhost < 0\.999/.test(html) &&
   /t <= 0\.88 \? 0 :/.test(html), "it only settles stragglers the sweep never reached");
ok("glass lets the far side through", /depthWrite = veilT < 0\.8/.test(html));
ok("veil colours are tunable in one place", /VEIL_BURN/.test(html) && /VEIL_A_MIN/.test(html));
ok("glass has a rim gradient", /vrT = mix\(uGlass, uRim, vrF \* vrF\)/.test(html),
   "deep violet through the body, pink only where he turns away");
ok("execute has its own clip with a fallback", /\["execute","\[|\["execute",\s*\["assassin"/.test(html) &&
   /st === "execute" && !MODEL\.hasClip\("execute"\)/.test(html));
ok("glass is not the seam's magenta", !/uGlass = \{ value: new THREE\.Color\(0xD65CDC\)/.test(html),
   "magenta belongs to the world tearing, not to Vesper");
ok("eaten edges are lit", /uEdge/.test(html) &&
   /vrE = 1\.0 - smoothstep\(0\.0, VR_GLOW/.test(html),
   "the burn is applied last, so the seam lights on skin and glass alike");
ok("locomotion is speed-matched", /setEffectiveTimeScale\(clamp\(\(speed \|\| 0\) \/ REF/.test(html),
   "feet skate when stride rate doesn't match actual velocity");
ok("run blends in by speed when it exists", /MODEL\.hasClip\("run"\)/.test(html) &&
   /var RUN_AT = 4\.2/.test(html), "and falls back to walk when it doesn't");
ok("blend times differ by intent", /fadeFor/.test(html), "combat snaps, locomotion carries weight");
ok("motes belong to the coming-apart phase", /player\.shroud < 0\.92/.test(html),
   "glass does not shed dust");

console.log("\n[tuning panel + maps]");
ok("maps are data, not baked geometry", /var MAPS = \[/.test(html) && /function buildMap\(id\)/.test(html));
ok("there are several layouts", (html.match(/id: "(pit|colonnade|open|keep)"/g) || []).length >= 4);
ok("PILLARS keeps its identity on a map swap", /PILLARS\.length = 0;/.test(html) &&
   /m\.pillars\.forEach\(function \(p\) \{ PILLARS\.push\(p\); \}\)/.test(html),
   "collision and line-of-sight hold a reference to it");
ok("old pillar meshes are disposed", /c\.geometry\.dispose\(\)/.test(html), "no leak on repeated swaps");
ok("panel persists across reloads", /localStorage\.setItem\(LSK/.test(html));
ok("settings can be copied out", /Copy settings to clipboard/.test(html) && /VEIL_GLASS_LIFT/.test(html),
   "tuning becomes a paste-able answer instead of a description");
ok("panel never touches BALANCE", !/TUNE[\s\S]{0,4000}?BAL\.C\./.test(html),
   "feel is tunable, balance is sim-proven");

console.log("\n[hud layout]");
/* Fixed/absolute UI anchored to the same corner silently stacks. The ? button
   sat on top of the score since v0 and nobody noticed until a third element
   joined them. Cheap to assert, so assert it.

   VR-79 narrowed the net, and the reason is worth keeping: this only ever meant
   to catch elements anchored to the SCREEN corner, but it was matching any
   absolutely-positioned rule anywhere — so the touch pad's per-button charge
   dots (`#vpad .vbtn .chgs`) tripped it against the HUD's `.charges`, two
   elements in different containers that cannot collide by construction. The
   discriminator is the selector shape: a single-token rule is anchored to
   whatever positioning context it lands in and is a genuine corner risk, while
   a descendant selector is scoped to a stated parent. Matching now requires the
   token to start the selector, which keeps every original catch — `.hud-tr` and
   `.helpfab`, the pair this was written for, are both single-token.

   VR-112 made this cheaper to satisfy rather than harder: the three corner fabs
   are now children of one `#sysfabs` flex row, so there is exactly one anchored
   element up there instead of a set of hand-computed `right:` offsets that could
   collide. (The `.chgs` / `.charges` pair described above no longer exists —
   both were replaced by segmented fills — but the discriminator still stands and
   the next descendant selector will need it.) */
{
  const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  const anchors = {};
  const re = /(?:^|[},])\s*([#.][\w-]+)\{[^}]*position:\s*(fixed|absolute)[^}]*?top:\s*(-?[\d.]+)px[^}]*?right:\s*(-?[\d.]+)px/gm;
  let m, clashes = [];
  while ((m = re.exec(style))) {
    const key = m[3] + "," + m[4];
    if (anchors[key]) clashes.push(anchors[key] + " / " + m[1] + " both at top:" + m[3] + " right:" + m[4]);
    else anchors[key] = m[1];
  }
  ok("no two top-right elements share an anchor", clashes.length === 0,
     clashes.length ? clashes.join("; ") : Object.keys(anchors).length + " distinct top/right anchors");
}
/* The gear moved into #sysfabs with VR-112, so this asserts the CLUSTER clears
   the score rather than one fab's own coordinates. Asserting the container is
   also what makes VR-113's camera button free: a fourth fab joins the row and
   this check still means what it says. */
ok("the system fab cluster sits clear of the score",
   /#sysfabs\{position:fixed;top:14px;right:16px/.test(html) &&
   /\.hud-tr\{position:absolute;top:58px/.test(html));
ok("every corner fab is inside that cluster",
   !/^\s*(\.helpfab|#tunefab|#pausefab|#camfab)\{[^}]*position:fixed/m.test(html),
   "a fab positioning itself again is how the ? button ended up on top of the score");

console.log("\n[dom sanity]");
{
  const ids = [...html.matchAll(/<[^>]*\sid="([^"]+)"/g)].map(m => m[1]);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  ok("no duplicate element ids", dupes.length === 0,
     dupes.length ? dupes.join(", ") + " — getElementById silently returns the first, so the second element's listeners never attach" : ids.length + " ids, all unique");
}
ok("pause has its own button", /id="btn-unpause"/.test(html) && /\$\("btn-unpause"\)\.addEventListener/.test(html));
ok("a run that can't lock starts unpaused", /setPaused\(wantsLock\(\)\)/.test(html),
   "arcade and touch never request a lock, so neither must wait for one");
ok("never pauses on a lock that was never asked for", /wantsLock\(\)\) setPaused\(!mouse\.locked\)/.test(html),
   "this is what left the run stuck on the pause screen");

/* ---- reduced motion (VR-103) ---- */
console.log("\n[reduced motion]");
/* Read the axis list out of the game rather than restating it, so a sixth
   motion scale added to MOTION_KEYS is asserted by every check below on the
   day it is added — including, and this is the point, the ones that prove it
   cannot reach the sim. A harness that has to be updated to stay honest is a
   harness that eventually isn't. */
const MK = ((html.match(/var MOTION_KEYS = \[([^\]]*)\]/) || [])[1] || "")
  .split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
ok("MOTION_KEYS is declared in the game", MK.length >= 5, MK.join(", ") || "none found");
/* Anchored INSIDE the PREFERS_REDUCED initialiser, not merely present in the
   file: the live-change listener also names the media query, so a loose test
   here stays green while the boot-time seed is gutted. (Found by the mutation
   pass — it was the one mutant that survived.) */
ok("the OS preference is read at boot, not assumed",
   /var PREFERS_REDUCED = \(function \(\) \{[\s\S]{0,260}?matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/.test(html),
   "seeds the defaults");
ok("and followed live afterwards",
   /addEventListener\("change", onMQ\)/.test(html) && /addListener\(onMQ\)/.test(html),
   "both spellings — Safari only grew the modern one recently");
ok("it seeds the defaults rather than overriding them",
   /mshake: MOTION\.shake/.test(html) && /var src = PREFERS_REDUCED \? MOTION_RED : MOTION_FULL;/.test(html),
   "the panel can always disagree with the system");
ok("an explicit choice here outranks a later OS change",
   /if \(V\.mset\) return;/.test(html) && /V\.mset = true;/.test(html));
const presetLine = n => (html.match(new RegExp("var MOTION_" + n + "\\s*=[^\\n]*")) || [""])[0];
ok("every axis has a full and a reduced value",
   MK.length > 0 && ["FULL", "RED"].every(n =>
     MK.every(k => new RegExp("\\b" + k + ":\\s*[\\d.]+").test(presetLine(n)))),
   "a scale with no reduced value is an effect the setting silently misses");
ok("MOTION has exactly one writer", (html.match(/MOTION\[MOTION_KEYS\[\w+\]\] =/g) || []).length === 2,
   "the seed and the apply() branch — nothing else assigns a scale");

/* Each damped primitive must actually consult its scale. Checked by name so a
   primitive that gets rewritten and silently drops the multiply fails here. */
ok("shake() reads MOTION.shake", /function shake\(mag\) \{[\s\S]{0,200}?mag \*= MOTION\.shake;/.test(html));
ok("fovKick() reads MOTION.fov", /function fovKick\(v\) \{[\s\S]{0,260}?v \* MOTION\.fov;/.test(html));
ok("ghost() reads MOTION.ghost", /function ghost\(x, z, yaw\) \{[\s\S]{0,300}?MOTION\.ghost <= 0\) return;/.test(html));
ok("banner() reads MOTION.banner", /classList\.toggle\("still", MOTION\.banner <= 0\.5\)/.test(html));
ok("floatNumber() reads MOTION.banner", /MOTION\.banner <= 0\.5 \? " still" : ""/.test(html));
ok("the hit vignette reads MOTION.flash", /Math\.max\(MOTION\.flash, 0\.34\)/.test(html),
   "and floors: damping must never cost a player the only sign they were hit");
ok("the still variants keep the same durations",
   /bannerstill 2\.4s/.test(html) && /#banner\.play\{animation:bannerpop 2\.4s/.test(html) &&
   /fnumstill \.7s/.test(html) && /animation:fnum \.7s/.test(html),
   "reduced motion must not become reduced pacing");

/* THE JUDGEMENT CALL, asserted so VR-104 inherits it rather than rediscovers
   it. hitStop pauses simulation time — a motion scale reaching it would let an
   accessibility control change how long a strike window really lasts, which is
   the TUNE-reaches-BALANCE failure this file exists to catch, arriving through
   a door nobody was watching. */
ok("hitStop is not scaled by any motion axis",
   /function hitStop\(ms\) \{ game\.hitStop = Math\.max\(game\.hitStop, ms \/ 1000\); \}/.test(html),
   "it freezes simulation time — scaling it from the panel would be a balance edit");
{
  const hurt = (html.match(/function hurtPlayer\(dmg\)[\s\S]*?\n\}/) || [""])[0];
  ok("and no call site scales it either",
     !/hitStop\([^)]*MOTION/.test(html) && /hitStop\(70\);/.test(hurt),
     "the freeze is what carries the impact once shake is damped to nothing");
}

/* ---- the sim must not have been touched ---- */
console.log("\n[separation of concerns]");
const bal = html.match(/BALANCE:BEGIN[\s\S]*?BALANCE:END/);
ok("BALANCE block still present", !!bal);
ok("sprite layer never touches BALANCE", bal && !/SPR\.|playerSprite|huskSprites/.test(bal[0]),
   "the sim stays authoritative");
/* VR-103 — the same assertion pointed at the accessibility keys. This is the
   one that makes the feature safe to extend: whatever a11y option lands next,
   it is a name in MOTION_KEYS, and a name in MOTION_KEYS may not appear in the
   block the sim reads. */
ok("no motion axis name appears inside BALANCE",
   bal && MK.length > 0 && MK.every(k => !new RegExp("\\bm?" + k + "\\b").test(bal[0])),
   MK.length ? "checked " + MK.length + " axes" : "MOTION_KEYS not found — cannot vouch for this");
ok("BALANCE never reads MOTION or PREFERS_REDUCED",
   bal && !/MOTION|PREFERS_REDUCED|matchMedia|prefers-reduced/.test(bal[0]),
   "feel is tunable, balance is sim-proven");
/* Comments stripped first: the block's own header says "may not touch THREE,
   window or document", and a check that its own rule trips is a check that
   gets deleted rather than fixed. */
/* The BEGIN marker lives INSIDE the banner comment, so the captured text opens
   mid-comment with no `/*` to match on — drop through the first `*​/` before
   stripping the rest, or the block's own header survives as "code". */
const balCode = bal
  ? bal[0].slice(bal[0].indexOf("*/") + 2)
          .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
  : "";
ok("BALANCE is still DOM-free", !!bal && !/document\.|window\.|localStorage|THREE\./.test(balCode),
   "an accessibility key is a display concern and cannot become a mechanical one");

/* ---- damage-DEALING feedback (VR-104) ----------------------------------
   VR-103 gave this file the reduced-motion contract; VR-104 added four more
   effects to the DEALING side and every one of them had a way to go wrong
   that reading the diff would not catch. Each check below names the failure
   it exists to prevent rather than restating the code. */
console.log("\n[damage feedback — VR-104]");

ok("the hit confirm is its own element",
   /<div id="hitmark">(<i><\/i>){4}<\/div>/.test(html) && /#hitmark\{/.test(html),
   "sharing #crosshair would put a confirm and a prediction on one element");
ok("and the crosshair keeps ONLY the prediction",
   /#crosshair\.hot\{transform:scale\(2\.1\);background:var\(--magenta\)\}/.test(html) &&
   !/#crosshair\.(hit|mark|confirm)/.test(html),
   ".hot is on screen before you press anything — it cannot double as a confirm");
ok("it is wired into the HUD map", /hitmark: \$\("hitmark"\)/.test(html));

{
  const hm = (html.match(/function hitmark\(heavy\)[\s\S]*?\n\}/) || [""])[0];
  ok("hitmark() reads MOTION.flash inside the function",
     /MOTION\.flash/.test(hm) && !/hitmark\([^)]*MOTION/.test(html),
     "the VR-103 rule: multiply at the primitive, never at the call site");
  ok("and floors it, so the confirm survives full damping",
     /0\.34 \+ 0\.66 \* MOTION\.flash/.test(hm),
     "a hit confirm is information; damping must not cost a player the answer");
  ok("the animation restarts mid-flight",
     /classList\.remove\("on"\)[\s\S]{0,120}offsetWidth[\s\S]{0,80}classList\.add\("on"\)/.test(hm),
     "two fast hits must read as two marks, not as one that never replayed");
  ok("--hmpop scales the POP and never the opacity",
     /0%\{opacity:1;transform:scale\(calc\(1 - \.30 \* var\(--hmpop\)\)\)\}/.test(html) &&
     /100%\{opacity:0;transform:scale\(calc\(1 \+ \.55 \* var\(--hmpop\)\)\)\}/.test(html),
     "opacity is the information channel; only the travel is motion");
}

{
  const bf = (html.match(/function bladeFlash\(v\) \{[^\n]*/) || [""])[0];
  ok("bladeFlash() reads MOTION.flash inside the function",
     /bladeGlow = Math\.max\(bladeGlow, v \* MOTION\.flash\)/.test(bf),
     "and raises only — an assignment here would let a weak hit dim a strong one");
  ok("the glow is consumed on the line that OWNS the blade's brightness",
     /pBladeMat\.emissiveIntensity = 0\.35 \+ player\.shroud \* 1\.5 \+ bladeGlow;/.test(html),
     "that line rewrites emissive every frame — a bloom set anywhere else is erased unseen");
  ok("and decayed in the same place it is consumed",
     /bladeGlow = Math\.max\(0, bladeGlow - dt \* [\d.]+\);[\s\S]{0,320}?\+ bladeGlow;/.test(html),
     "a glow raised with no decay is a blade that stays lit");
}

{
  const sh = (html.match(/function strikeHits\(\)[\s\S]*?\n\}/) || [""])[0];
  ok("a connect fires the confirm whether or not you were veiled",
     /hitmark\(player\.atkStage === 2\);/.test(sh));
  ok("BUT the connect lens kick is skipped when veiled",
     /if \(!veiled\) fovKick\(/.test(sh),
     "a veiled strike already ran executeEnemy's fovKick(-9); fovKick ASSIGNS the target, so kicking again would overwrite the Execute's pull with a smaller one");
  /* Pull the magnitudes out of the call itself rather than restating them, so
     a future re-tune is measured against Execute instead of against a number
     typed in this file a month ago. */
  /* Anchored to the guarded call, not to any fovKick in the function — the
     comment above it NAMES fovKick(-9) to explain why the guard exists, and a
     loose match reads the prose and passes on the wrong number. (Found here,
     first run: it reported 9.) */
  const kickCall = (sh.match(/if \(!veiled\) fovKick\(([^)]*)\)/) || ["", ""])[1];
  const kicks = (kickCall.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).map(Math.abs);
  ok("and every connect kick stays well under Execute's 9",
     kicks.length > 0 && kicks.every(k => k > 0 && k <= 5) && /fovKick\(-9\)/.test(html),
     "the cue is amplitude now, not presence — equal numbers make the axis say nothing; found " +
       (kicks.join(", ") || "none"));
}

{
  ok("the contact bloom fires at the enemy, not only on the blade",
     /burst\(e\.x, 1\.25, e\.z, heavy \? 5 : 3, 0xFFF3FF/.test(html),
     "pBladeMat is worn by the primitive rig and the first-person view model; the GLB is weaponless, so a blade-only bloom is invisible in third person");
}

/* ---- the blade trail must agree with the hitbox (VR-104) ---- */
console.log("\n[trail arc — VR-104]");
ok("one fan per strike stage, built from the BALANCE arcs",
   /for \(var ti = 0; ti < C\.strike\.length; ti\+\+\)/.test(html) &&
   /var a = C\.strike\[ti\]\.arc \* Math\.PI \/ 180;/.test(html),
   "a retyped angle is a trail that stops following BALANCE the first time an arc moves");
ok("the fan drawn is the stage's own",
   /trail\.geometry = TRAIL_GEO\[player\.atkStage\];/.test(html),
   "one shared 97-degree ring understated the 290-degree finisher three to one");
ok("and it is CENTRED on facing, where strikeHits actually tests",
   /trail\.rotation\.z = -player\.yaw - st\.arc \* Math\.PI \/ 360;/.test(html) &&
   !/-player\.yaw \+ \(player\.atkStage === 2 \? 0/.test(html),
   "stage 1 used to be drawn at +0.85 — a picture of the swing somewhere the damage is not");
ok("handedness comes from the decay sweep, not from an offset fan",
   /trail\.rotation\.z \+= trailSpin \* dt \* 9;/.test(html) &&
   /trailSpin = \(player\.atkStage === 1\) \? 1 : -1;/.test(html));
{
  const geo = (html.match(/var TRAIL_GEO = \(function \(\)[\s\S]*?\}\)\(\);/) || [""])[0];
  ok("the trail layer never reaches into BALANCE to write",
     !/C\.strike\[\w+\]\.arc\s*=/.test(geo) && /RingGeometry/.test(geo),
     "reading the arc is the contract; writing one would be a balance edit from the display layer");
}

/* ---- the husk SEARCH state machine (VR-119) -----------------------------
   The BALANCE relationships are _sim.js's and the clip fit is _clipfit.js's.
   What belongs HERE is the wiring between the state and the three surfaces
   that draw a husk — model, primitive rig and billboard — because this file
   is where "a husk must read the same however it happens to be rendered"
   already lives. */
console.log("\n[husk SEARCH — VR-119]");

const upd = (html.match(/function updateEnemies\(dt\)[\s\S]*?\n\}/) || [""])[0];
ok("losing you is a STATE, not a drifting target",
   /e\.state = "search";/.test(upd) && !/e\.wander -= dt;/.test(upd),
   "the old code kept RUNNING at a randomised point in the run clip — the room barely changed");
ok("it takes a grace window to enter, and sight to leave",
   /e\.lostT >= C\.huskLoseT/.test(upd) &&
   /e\.state === "search" && canSee/.test(upd),
   "a pillar clipping the line for two frames must not flip the whole room");
ok("the search heads for where they last SAW you",
   /e\.patrolX = e\.seekX; e\.patrolZ = e\.seekZ;/.test(upd),
   "seeding from player.x would be a search that secretly knows the answer");
ok("a searching husk cannot attack",
   !/e\.state === "search"[\s\S]{0,600}e\.state = "wind"/.test(upd) &&
   /if \(pAlive && canSee && dist < C\.enemyReach[\s\S]{0,80}e\.state = "wind"/.test(upd),
   "the wind-up is reachable only from seek, which requires canSee — they must find you first");
ok("the three beats cycle, and only their durations are random",
   /e\.beat = \(e\.beat === "walk"\) \?/.test(upd) &&
   /* BOTH assignments, not either: the mutation pass changed only the one
      inside the cycle and this check stayed green off the one at entry. */
   (upd.match(/e\.beatT = rand\(C\.huskBeatMin, C\.huskBeatMax\)/g) || []).length === 2,
   "a room of husks all dizzy on the same frame reads as choreography, not as losing you");
ok("scanning and reeling do not translate",
   /e\.yaw \+= \(e\.beat === "dizzy" \? 2\.1 : 0\.7\) \* dt;/.test(upd),
   "a husk that drifts while scanning is still hunting you, just slowly");
ok("arriving at the guess ends the beat instead of marking time",
   /e\.beatT = Math\.min\(e\.beatT, 0\.35\);/.test(upd),
   "a husk standing on the spot playing a walk cycle is the moonwalk in a different costume");
ok("giving up widens the guess to the whole arena",
   /e\.searchT >= C\.huskSearchGiveUp[\s\S]{0,140}rand\(-A \+ 1\.5, A - 1\.5\)/.test(upd),
   "otherwise they orbit your last position forever and the arena stops mattering");

/* The LOD contract: three renderers, one read. */
ok("the model names the beat as its clip",
   /if \(e\.state === "search"\) return e\.beat;/.test(html));
ok("the PRIMITIVE rig carries the read too",
   /else if \(e\.state === "search"\) \{[\s\S]{0,900}e\.beat === "walk"/.test(html),
   "husk models are LOD-budgeted — if SEARCH lived only in the clips, the mechanic would come and go with the budget");
ok("and the billboard's gap is STATED rather than hidden",
   /the billboard atlas has FOUR husk states/.test(html) &&
   /husk:\s*\{ h: 1\.78, states: \["move", "attack", "hurt", "down"\] \}/.test(html),
   "no idle frame exists, so a scanning husk reads as `move` at the far LOD — written down, not discovered later");
ok("the state machine READS its timings and never writes them",
   /C\.huskLoseT/.test(html) && /C\.huskBeatMin/.test(html) && /C\.huskSearchSpeed/.test(html) &&
   !/C\.husk\w+\s*=[^=]/.test(html),
   "a feel state that can edit BALANCE is the TUNE-reaches-BALANCE failure arriving through the enemy loop");
ok("and the timings are named in BALANCE rather than typed into the loop",
   !!bal && /huskLoseT:/.test(bal[0]) && /huskBeatMin:/.test(bal[0]) &&
   /huskSearchSpeed:/.test(bal[0]) && /huskSearchGiveUp:/.test(bal[0]) &&
   !/e\.state = "search"/.test(bal[0]),
   "the numbers belong to the sim; the machine that spends them does not");

console.log("\n" + "=".repeat(58));
console.log(fails ? `FAIL — ${fails} of ${checks}` : `PASS — ${checks} checks`);
process.exit(fails ? 1 : 0);
