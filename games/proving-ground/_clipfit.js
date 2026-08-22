/* ---------------------------------------------------------------------------
   Proving Ground — combat clip-fit harness (VR-111).
   Usage: node _clipfit.js   (run from games/proving-ground/)

   WHY THIS EXISTS. VR-111 was a silent bug: the `attack` clip ran 2-3 seconds
   against a 0.36s mechanical strike, so you saw the first sixth of a swing and
   then it cut. Nothing failed. No harness noticed, because `_sim.js` only ever
   sees the BALANCE block and the animation lives in a binary nobody parses.
   The bug could not be caught by anything we owned — which is the actual defect.

   So this harness reads BOTH SIDES and proves they still line up:
     · the real clip durations out of assets/models/vesper.glb (GLB accessors)
     · the CLIPFIT windows and BALANCE strike timings out of index.html

   It re-implements three.js AnimationUtils.subclip's arithmetic rather than
   trusting the recorded numbers, so a re-merge that shortens or lengthens a
   source clip fails HERE instead of in someone's eyes three weeks later.

   The two ways this bug comes back, both covered below:
     1. someone swaps a source clip and the frame windows now point at the
        wrong motion, or off the end of the clip
     2. someone edits a strike window in BALANCE and the animation silently
        stops matching it
   --------------------------------------------------------------------------- */
const fs = require("fs"), path = require("path"), vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}
function die(msg) { console.error(msg); process.exit(1); }

/* ------------------------- side A: what the game says ------------------- */
const balM = html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/);
if (!balM) die("could not find the BALANCE block in index.html");
const balBox = { module: { exports: {} }, Math, console };
vm.createContext(balBox);
new vm.Script(balM[1], { filename: "index.html#BALANCE" }).runInContext(balBox);
const C = balBox.module.exports.C;

const fitM = html.match(/CLIPFIT:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* CLIPFIT:END/);
if (!fitM) die("could not find the CLIPFIT block in index.html");
const fitBox = { console };
vm.createContext(fitBox);
new vm.Script(fitM[1] + "\n;module_exports = CLIPFIT;", { filename: "index.html#CLIPFIT" }).runInContext(fitBox);
const FIT = fitBox.module_exports;

// the two on-screen windows that are feel, not balance, so live outside both blocks
function literal(name) {
  const m = html.match(new RegExp("var\\s+" + name + "\\s*=\\s*([0-9.]+)\\s*;"));
  if (!m) die("could not find " + name + " in index.html");
  return parseFloat(m[1]);
}
const EXEC_LUNGE_T = literal("EXEC_LUNGE_T");
const HURT_SHOW_T  = literal("HURT_SHOW_T");

/* -------------------- side B: what is actually in the GLB --------------- */
const MODELS = path.join(__dirname, "..", "..", "assets", "models");

/* Only the sampler INPUTS (keyframe times) matter here, and they are always
   float SCALAR — so this reader stays deliberately narrow rather than becoming
   a general-purpose glTF parser we would then have to maintain.

   VR-117 made it take a path: the husks are a second skinned model with a
   second fit table, and a harness that can only see one character would have
   let the husk clips drift exactly the way Vesper's did. */
function readGLB(file) {
  if (!fs.existsSync(file)) die("no model at " + file + " — run the Blender merge first.");
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  const binOff = 20 + jsonLen + 8;
  const BIN = buf.slice(binOff, binOff + buf.readUInt32LE(20 + jsonLen));
  function times(accIdx) {
    const a = gltf.accessors[accIdx];
    if (a.type !== "SCALAR" || a.componentType !== 5126) die("unexpected sampler input format");
    const bv = gltf.bufferViews[a.bufferView];
    const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const stride = bv.byteStride || 4;
    const out = new Array(a.count);
    for (let i = 0; i < a.count; i++) out[i] = BIN.readFloatLE(base + i * stride);
    return out;
  }
  const out = {};
  for (const anim of gltf.animations || []) {
    const tracks = anim.samplers.map(s => times(s.input));
    out[anim.name] = { tracks, duration: Math.max(...tracks.map(t => t[t.length - 1])) };
  }
  return out;
}

const clips = readGLB(path.join(MODELS, "vesper.glb"));

/* The bind-pose height of a model, straight off the POSITION accessor bounds.
   VR-117 added this because a merge shipped a husk 112x too big and NOTHING we
   own noticed: the clips were right, the windows were right, the skeleton was
   right, and the character was a grey wall. Mixamo's FBX lands with the armature
   at scale 0.01 on some download presets and 1.0 on others, and the merge script
   used to ASSIGN the new scale rather than multiply it — so the 0.01 was thrown
   away. A size is a number in a binary; this is the only place that can read it. */
function bindHeight(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  let h = 0;
  for (const m of gltf.meshes || []) {
    for (const p of m.primitives || []) {
      const a = gltf.accessors[p.attributes.POSITION];
      if (a && a.min && a.max) h = Math.max(h, a.max[1] - a.min[1]);
    }
  }
  return h;
}
function declaredHeight(name) {
  const m = html.match(new RegExp(name + "\\s*:\\s*\\{\\s*h:\\s*([0-9.]+)"));
  return m ? parseFloat(m[1]) : NaN;
}

/* The game's trimClip(), arithmetic only — keys inside [startFrame, endFrame)
   shifted to start at 0, and any track with NO key in the window held at the
   last pose before it rather than dropped.

   `naive` reports what THREE.AnimationUtils.subclip would have kept, because
   that difference IS the bug: Blender collapses a still bone to one key at the
   head of the clip, so the stock helper silently discards 100 of 123 tracks for
   any window that doesn't start at frame 0, and Vesper falls apart mid-swing.
   Asserted below, so nobody "simplifies" trimClip back into the stock call. */
function trimDuration(clipName, startFrame, endFrame, fps, set) {
  const c = (set || clips)[clipName];
  if (!c) return null;
  const t0 = startFrame / fps, t1 = endFrame / fps;
  let maxT = 0, kept = 0, naive = 0;
  for (const t of c.tracks) {
    let hi = -Infinity, n = 0;
    for (const v of t) {
      if (v < t0 || v >= t1) continue;
      n++; if (v > hi) hi = v;
    }
    kept++;                                   // trimClip never drops a track
    if (n) { naive++; if (hi - t0 > maxT) maxT = hi - t0; }
  }
  return { tracks: kept, naive, duration: maxT };
}

console.log("\nVEILRUN · Proving Ground — combat clip fit (VR-111)\n" + "=".repeat(58));

/* ------------------------------ the source ------------------------------ */
console.log("\n[source clips in vesper.glb]");
for (const n of Object.keys(clips).sort()) {
  console.log("        %s".replace("%s", n.padEnd(9) + clips[n].duration.toFixed(2) + "s"));
}
ok("the model carries every clip a fit points at",
   Object.keys(FIT.win).every(n => clips[srcOf(n)]),
   Object.keys(FIT.win).map(srcOf).filter((v, i, a) => a.indexOf(v) === i).join(", "));

function srcOf(name) { return name.replace(/^attack\d$/, "attack"); }

/* ------------------------- mechanical windows --------------------------- */
/* The denominator of every fit. Sourced from BALANCE so that editing a strike
   window there is what moves the animation — the entire point of the card. */
function mechFor(name) {
  const m = name.match(/^attack(\d)$/);
  if (m) { const s = C.strike[+m[1]]; return s.wind + s.active + s.rec; }
  if (name === "execute") return EXEC_LUNGE_T;
  if (name === "hurt")    return HURT_SHOW_T;
  return null;
}

console.log("\n[fit]");
ok("every strike stage in BALANCE has a window",
   C.strike.every((_, i) => FIT.win["attack" + i]),
   C.strike.length + " stages, " + C.strike.map((_, i) => "attack" + i).filter(n => FIT.win[n]).length + " windows");

const scale = {};
let anyNaiveLoss = false;
for (const name of Object.keys(FIT.win)) {
  const w = FIT.win[name];
  const cut = trimDuration(srcOf(name), w[0], w[1], FIT.fps);
  const mech = mechFor(name);

  if (!cut) { ok("window '" + name + "' has a source clip", false, "no clip '" + srcOf(name) + "'"); continue; }
  if (mech === null) { ok("window '" + name + "' maps to a mechanical duration", false); continue; }

  ok("window '" + name + "' selects real motion", cut.tracks > 0 && cut.duration > 0.02,
     cut.tracks + " tracks, " + cut.duration.toFixed(3) + "s");

  // every bone keeps a track, whether or not it moves inside the window
  const src0 = clips[srcOf(name)];
  ok("window '" + name + "' keeps every bone",
     cut.tracks === src0.tracks.length,
     cut.tracks + " of " + src0.tracks.length);
  if (cut.naive < src0.tracks.length) anyNaiveLoss = true;

  // A window running off the end of the clip is the exact failure a re-merge
  // causes, and it does NOT throw at runtime — it just plays less than asked.
  const src = clips[srcOf(name)];
  ok("window '" + name + "' fits inside the clip",
     src && w[1] / FIT.fps <= src.duration + 1e-6,
     "ends at " + (w[1] / FIT.fps).toFixed(2) + "s of " + (src ? src.duration.toFixed(2) : "?") + "s");

  const s = cut.duration / mech;
  scale[name] = s;
  ok("'" + name + "' plays inside the clamp band",
     s >= FIT.minScale && s <= FIT.maxScale,
     cut.duration.toFixed(2) + "s / " + mech.toFixed(2) + "s = " + s.toFixed(2) + "x" +
     " (band " + FIT.minScale + "–" + FIT.maxScale + ")");
}

/* ------------------------ the rule about stage 3 ------------------------ */
/* "Stage 3 is the spin finisher and is SUPPOSED to be slower — don't flatten
   all three." That was a sentence on a card, which is where design rules go to
   be forgotten. Here it is an assertion. */
console.log("\n[the finisher reads heavier]");
if (scale.attack0 && scale.attack1 && scale.attack2) {
  ok("stage 3 plays slower than the openers",
     scale.attack2 < scale.attack0 && scale.attack2 < scale.attack1,
     "stages " + [scale.attack0, scale.attack1, scale.attack2].map(v => v.toFixed(2) + "x").join(" / "));
  ok("the difference is visible, not a rounding error",
     Math.min(scale.attack0, scale.attack1) / scale.attack2 >= 1.25,
     (Math.min(scale.attack0, scale.attack1) / scale.attack2).toFixed(2) + "x apart");
}

/* --------------------- the bug this card was filed for ------------------ */
/* Before VR-111 every non-locomotion clip got a flat timeScale of 1. Prove
   that would still be wrong, so nobody "simplifies" the fit back out. */
console.log("\n[the original bug stays caught]");
for (const name of ["attack0", "execute"]) {
  const w = FIT.win[name], cut = trimDuration(srcOf(name), w[0], w[1], FIT.fps);
  const mech = mechFor(name);
  if (!cut || mech === null) continue;
  const seen = Math.min(1, mech / clips[srcOf(name)].duration);
  ok("'" + name + "' at timeScale 1 would show only a fraction of the clip",
     seen < 0.5,
     "you would see " + (seen * 100).toFixed(0) + "% of the " +
     clips[srcOf(name)].duration.toFixed(2) + "s source in " + mech.toFixed(2) + "s");
}

/* ----------------------------- the wiring ------------------------------- */
/* Everything above proves the NUMBERS line up. None of it notices if someone
   deletes the division and goes back to a flat timeScale of 1 — which is the
   original bug, and which a mutation test caught this harness missing. The
   table being right is worthless if nothing reads it. */
console.log("\n[wiring — the table is actually used]");
// anchored to the start of a line so a commented-out call does not pass
ok("the trimmed clips get built",
   /\n\s*fitClips\(\);/.test(html) && /function fitClips\(\)/.test(html));
ok("one-shot clips are time-scaled from their mechanical window",
   /setEffectiveTimeScale\(mech > 0 \? scaleFor\(name, mech\) : 1\)/.test(html),
   "not a flat 1 — that was VR-111");
ok("the scale is duration over mechanical duration",
   /var s = dur \/ mech;/.test(html));
ok("out-of-band scales are clamped AND warned",
   /warned\[name\] = 1;/.test(html) && /console\.warn\("\[VR-111\] '" \+ name/.test(html) &&
   /s = clamp\(s, CLIPFIT\.minScale, CLIPFIT\.maxScale\)/.test(html),
   "a future clip swap has to fail loudly, not play at 20x");
ok("each strike stage selects its own sub-clip",
   /"attack" \+ \(player\.atkStage >= 0 \? player\.atkStage : 0\)/.test(html),
   "otherwise all three stages are one picture again");
ok("the execute and hurt windows are named, not literals",
   /player\.execLunge = EXEC_LUNGE_T;/.test(html) &&
   /C\.iframeOnHit - HURT_SHOW_T/.test(html),
   "the harness reads the same constants the game does");

/* ------------- why trimClip exists instead of the stock helper ---------- */
console.log("\n[the stock subclip would still break this]");
ok("AnimationUtils.subclip would drop bones on this asset", anyNaiveLoss,
   "keeping only keys inside the window loses every still bone — that is why " +
   "MODEL.trimClip holds them instead");
ok("index.html does not call AnimationUtils.subclip",
   !/AnimationUtils\s*\.\s*subclip/.test(html));

/* ======================================================================== */
/* THE HUSKS (VR-117) — the same proof, on the second skinned model.

   The husks stopped being billboards when the grey Y Bot was ruled to BE the
   Thinned. That put 13 more clips and a second fit table in the game, and the
   VR-111 failure mode transfers wholesale: a window pointing at the wrong
   motion does not throw, it just looks wrong.

   One of them was live before it shipped, and it is the reason this section
   exists rather than a note on the card: the "Dying" clip STANDS STILL for its
   first 86 frames. Played untrimmed against a 0.5s dissolve you would watch a
   husk come apart while standing perfectly upright, and every harness we own
   would have said PASS.                                                      */
console.log("\n" + "=".repeat(58));
console.log("\nVEILRUN · Proving Ground — husk clip fit (VR-117)");

const hFitM = html.match(/HUSKFIT:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* HUSKFIT:END/);
if (!hFitM) die("could not find the HUSKFIT block in index.html");
const hBox = { console };
vm.createContext(hBox);
new vm.Script(hFitM[1] + "\n;module_exports = HUSKFIT;", { filename: "index.html#HUSKFIT" }).runInContext(hBox);
const HFIT = hBox.module_exports;
const HUSK_DIE_T = literal("HUSK_DIE_T");

const husk = readGLB(path.join(MODELS, "husk.glb"));

console.log("\n[source clips in husk.glb]");
for (const n of Object.keys(husk).sort()) {
  console.log("        " + n.padEnd(11) + husk[n].duration.toFixed(2) + "s");
}

/* All thirteen, not just the four this card wires. VR-118 (seam load-in) and
   VR-119 (SEARCH state) are blocked on this file, and a re-merge that quietly
   drops `float` or `getup` would unblock them onto a model that cannot do what
   their cards describe. */
const WAVE1 = ["run", "walk", "scan", "dizzy", "attack", "hurt", "down",
               "dodge", "dodgeback", "fall", "getup", "float", "land"];
ok("husk.glb carries the whole ybot wave", WAVE1.every(n => husk[n]),
   WAVE1.filter(n => !husk[n]).length ? "missing: " + WAVE1.filter(n => !husk[n]).join(", ")
                                      : WAVE1.length + " clips");
ok("the merge did not let Falling steal the death slot",
   husk.down && husk.fall && Math.abs(husk.down.duration - husk.fall.duration) > 0.2,
   "down " + (husk.down ? husk.down.duration.toFixed(2) : "?") + "s, fall " +
   (husk.fall ? husk.fall.duration.toFixed(2) : "?") + "s — the bug the exclusion list fixes");
ok("Dodging and Dodging Back are two different clips",
   husk.dodge && husk.dodgeback && Math.abs(husk.dodge.duration - husk.dodgeback.duration) > 0.05,
   "the substring collision that already cost a move slot once");

function hMech(name) {
  if (name === "attack") return C.enemyWind + C.enemyActive + C.enemyRec;
  if (name === "hurt")   return C.enemyStagger;
  if (name === "down")   return HUSK_DIE_T;
  return null;
}

console.log("\n[fit]");
for (const name of Object.keys(HFIT.win)) {
  const w = HFIT.win[name], mech = hMech(name);
  const cut = trimDuration(name, w[0], w[1], HFIT.fps, husk);
  if (!cut) { ok("husk window '" + name + "' has a source clip", false); continue; }
  if (mech === null) { ok("husk window '" + name + "' maps to a mechanical duration", false); continue; }

  ok("husk window '" + name + "' selects real motion", cut.tracks > 0 && cut.duration > 0.02,
     cut.tracks + " tracks, " + cut.duration.toFixed(3) + "s");
  ok("husk window '" + name + "' keeps every bone",
     cut.tracks === husk[name].tracks.length, cut.tracks + " of " + husk[name].tracks.length);
  ok("husk window '" + name + "' fits inside the clip",
     w[1] / HFIT.fps <= husk[name].duration + 1e-6,
     "ends at " + (w[1] / HFIT.fps).toFixed(2) + "s of " + husk[name].duration.toFixed(2) + "s");

  const s = cut.duration / mech;
  ok("husk '" + name + "' plays inside the clamp band",
     s >= HFIT.minScale && s <= HFIT.maxScale,
     cut.duration.toFixed(2) + "s / " + mech.toFixed(2) + "s = " + s.toFixed(2) + "x" +
     " (band " + HFIT.minScale + "–" + HFIT.maxScale + ")");
}

/* The bug that was live, stated as an assertion so it cannot come back by
   someone deleting a window they think is redundant. */
console.log("\n[the standing-corpse bug stays caught]");
{
  const w = HFIT.win.down;
  const preRoll = w[0] / HFIT.fps;
  ok("the Dying clip really does stand still first", preRoll > HUSK_DIE_T,
     preRoll.toFixed(2) + "s of pre-roll against a " + HUSK_DIE_T.toFixed(2) +
     "s dissolve — untrimmed, you would never see it fall");
  ok("the death window is inside the clip's collapse, not its head",
     w[0] > 0 && w[1] > w[0], "frames " + w[0] + "–" + w[1]);
}

console.log("\n[the model is the size the game thinks it is]");
for (const who of ["vesper", "husk"]) {
  const declared = declaredHeight(who);
  const actual = bindHeight(path.join(MODELS, who + ".glb"));
  ok(who + ".glb is built at its declared worldHeight",
     Math.abs(actual - declared) / declared < 0.06,
     actual.toFixed(2) + "m in the file vs " + declared.toFixed(2) + "m in SPR.DEF");
}
ok("the merge script multiplies the import scale instead of assigning it",
   /base_arm\.scale = tuple\(v \* s for v in base_arm\.scale\)/.test(
     fs.readFileSync(path.join(__dirname, "_tools", "blender", "veilrun_merge_anims.py"), "utf8")),
   "assigning threw away Mixamo's 0.01 and shipped a 112x character");

console.log("\n[wiring — the husk table is actually used]");
ok("the ember looks the chest bone up by its SANITISED name",
   /c\.bones\["mixamorigSpine2"\]/.test(html),
   "GLTFLoader strips the colon from mixamorig:Spine2 — the file's spelling misses");
ok("the husks reuse MODEL.trimClip rather than a second copy",
   /MODEL\.trimClip\(raw\[name\], name, w\[0\], w\[1\], HUSKFIT\.fps\)/.test(html) &&
   /trimClip: trimClip,/.test(html));
ok("husk playback rate is duration over mechanical duration",
   /var s = dur \/ mech;[\s\S]{0,400}HUSKFIT\.minScale/.test(html));
ok("out-of-band husk scales are clamped AND warned",
   /console\.warn\("\[VR-117\] husk '"/.test(html) &&
   /s = clamp\(s, HUSKFIT\.minScale, HUSKFIT\.maxScale\)/.test(html));
ok("the husk state machine matches the billboard one",
   /function clipFor\(e\)/.test(html) && /e\.state === "wind" \|\| e\.state === "strike"/.test(html),
   "otherwise the LOD swap becomes visible, which is the whole premise");
ok("a missing husk.glb falls back to billboards instead of throwing",
   /no model at " \+ URL \+ " — husks stay billboards/.test(html));
ok("the sprite layer stands aside for a rigged husk",
   /if \(HUSKMODEL\.rigged\(e\)\) \{/.test(html));
ok("rigged husks still get a contact shadow",
   /HUSKMODEL\.rigged\(e\)[\s\S]{0,260}SHADOWS\.drop/.test(html),
   "they cast no shadow map on purpose — the decal is the shadow");
ok("every clone is rebound to its own skeleton",
   /dm\.bind\(new THREE\.Skeleton\(bones, sm\.skeleton\.boneInverses\), sm\.bindMatrix\)/.test(html),
   "sharing one skeleton is 26 husks moving in lockstep");
ok("r128 skinning is switched on explicitly",
   /mat\.skinning = true;/.test(html), "without it the mesh renders in its bind pose");

console.log("\n[the gate — the measurement cannot lie]");
ok("the LOD budget exists and is capped at liveCap",
   /HUSKLOD\.max/.test(html) && HFITmaxOK(),
   "max " + huskLodMax() + " vs liveCap " + C.liveCap);
ok("the sampler poisons itself when the tab is hidden or unfocused",
   /if \(document\.hidden\) taint\(/.test(html) && /"blur", function \(\) \{\s*taint\(/.test(html),
   "every previous frame-rate reading came from a throttled tab");
ok("auto-LOD refuses to decide on a tainted sample",
   /if \(PERF\.tainted\(\) \|\| PERF\.count\(\) < 60\) return;/.test(html));
ok("the benchmark samples the UNCLAMPED frame time",
   /var trueMs = now - last;/.test(html) && /PERF\.push\(trueMs\);/.test(html),
   "clamping first would record a 900ms hitch as 250ms");
ok("the benchmark pins the budget to max for the measured pass",
   /HUSKLOD\.mode = \(pass === 0\) \? HUSKLOD\.max : 0;/.test(html),
   "and to zero for the billboard pass, so the delta IS the cost of the models");
ok("an invalidated pass reports NO CALL rather than a number",
   /NO CALL — a pass was invalidated/.test(html));

function huskLodMax() {
  const m = html.match(/max:\s*(\d+),\s*\/\/ never above BAL\.C\.liveCap/);
  return m ? +m[1] : NaN;
}
function HFITmaxOK() { return huskLodMax() <= C.liveCap; }

console.log("\n" + "=".repeat(58));
console.log(fails ? "FAIL — " + fails + " of " + checks + " checks" : "PASS — " + checks + " checks");
process.exit(fails ? 1 : 0);
