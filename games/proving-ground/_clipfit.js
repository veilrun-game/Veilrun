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
/* The biggest translation any animation channel asks for, in metres.

   VR-117 shipped a husk whose `run` clip drove the hips between -10.6 and +1.6
   on a 1.78m character: the body rendered eleven units under the floor while
   its contact shadow stayed at its feet, so on screen an enemy was a shadow and
   nothing else. Every check we owned passed. The BIND pose was correct (the
   mesh measured 1.78m), the clips were all present, the frame windows all
   pointed at real motion — because `bindHeight` reads the mesh and the clip
   readers above read only keyframe TIMES. Nobody read a keyframe VALUE.

   Cause: Blender's `transform_apply` bakes an object's scale into the bone REST
   data and leaves the location F-curves in the actions untouched, so a merge
   that applies a scale silently leaves the animation in the old unit system.

   The check is deliberately blunt and unit-free: no joint may be asked to move
   further than the character is tall. Real motion never comes close; a unit
   mismatch misses by two orders of magnitude. */
function maxTranslation(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  const binOff = 20 + jsonLen + 8;
  const BIN = buf.slice(binOff, binOff + buf.readUInt32LE(20 + jsonLen));
  let worst = 0, where = "";
  for (const anim of gltf.animations || []) {
    for (const ch of anim.channels) {
      if (ch.target.path !== "translation") continue;
      const a = gltf.accessors[anim.samplers[ch.sampler].output];
      if (a.type !== "VEC3" || a.componentType !== 5126) continue;
      const bv = gltf.bufferViews[a.bufferView];
      const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
      const stride = bv.byteStride || 12;
      for (let i = 0; i < a.count; i++) {
        for (let c = 0; c < 3; c++) {
          const v = Math.abs(BIN.readFloatLE(base + i * stride + c * 4));
          if (v > worst) { worst = v; where = anim.name + "/" + (gltf.nodes[ch.target.node].name || "?"); }
        }
      }
    }
  }
  return { worst, where };
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
for (const who of ["vesper", "husk"]) {
  const declared = declaredHeight(who);
  const t = maxTranslation(path.join(MODELS, who + ".glb"));
  ok(who + ".glb's ANIMATION is in the same units as its mesh",
     t.worst < declared * 2,
     "largest joint translation " + t.worst.toFixed(2) + "m (" + t.where +
     ") against a " + declared.toFixed(2) + "m character");
}
ok("the merge script scales the location f-curves when it scales the armature",
   /_fc\.data_path\.endswith\("\.location"\)/.test(
     fs.readFileSync(path.join(__dirname, "_tools", "blender", "veilrun_merge_anims.py"), "utf8")),
   "transform_apply bakes the rest pose and leaves the actions in the old units");
ok("the merge script multiplies the import scale instead of assigning it",
   /applied = tuple\(v \* s for v in base_arm\.scale\)/.test(
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
ok("a rig is SILENCED when it changes hands, not just marked stale",
   /function silence\(rig\) \{\s*for \(var n in rig\.actions\) rig\.actions\[n\]\.stop\(\);/.test(html) &&
   /rig\.e = e; e\.rig = rig;\s*silence\(rig\);/.test(html) &&
   /rig\.e = null; silence\(rig\);/.test(html),
   "clampWhenFinished keeps a finished one-shot fully weighted, so clearing " +
   "rig.current alone strands a corpse pose under the next husk's run — measured at 47 degrees off vertical");
ok("nothing clears rig.current without stopping the actions",
   (html.match(/rig\.current = "";/g) || []).length === 1,
   "the single occurrence must be the one inside silence()");
ok("every action is pre-bound at rig construction",
   /for \(var pb in actions\) actions\[pb\]\.play\(\);/.test(html) &&
   /for \(var pb2 in actions\) actions\[pb2\]\.stop\(\);/.test(html),
   "three binds a PropertyMixer per track on FIRST activation — 26 husks all " +
   "swinging on one frame is the 212ms hitch in the 8/22 uncapped reading");
ok("rig construction is amortised across frames",
   /built < HUSKLOD\.buildPerFrame/.test(html) && /buildPerFrame: 2/.test(html),
   "26 rigs built inside one frame is a stall whoever asked for it");
ok("the benchmark prewarms the pool instead of measuring the ramp",
   /HUSKMODEL\.prewarm\(HUSKLOD\.max\);/.test(html));
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
ok("the benchmark pins the budget per pass, and one pass is an EMPTY arena",
   /HUSKLOD\.mode = \(P\.budget === "max"\) \? HUSKLOD\.max : P\.budget;/.test(html) &&
   /key: "base",\s+label: "empty arena",\s+husks: 0/.test(html),
   "without a baseline, a 30Hz display cap is indistinguishable from free models");
ok("an invalidated pass reports NO CALL rather than a number",
   /NO CALL — a pass was invalidated/.test(html));

/* Both of these are regressions that ALREADY HAPPENED, on the first real
   reading off a phone (8/22). They are assertions rather than notes for
   exactly that reason. */
ok("the cap test runs BEFORE any verdict about the models",
   /CAPPED AT ~/.test(html) &&
   html.indexOf("var capped = tight(rigs)") > 0 &&
   html.indexOf("var capped = tight(rigs)") < html.indexOf("if (cost <= 2.0)"),
   "both loaded passes pinned to 33ms is a display cap, not a result");
ok("the DELTA decides before any absolute threshold",
   html.indexOf("if (cost <= 2.0)") > 0 &&
   html.indexOf("if (cost <= 2.0)") < html.indexOf("rigs.p95 <= 20.0"),
   "keying off p95 alone told us to bin models that measured free");
ok("the frame time is sampled exactly ONCE per frame",
   (html.match(/PERF\.push\(/g) || []).length === 1,
   "a second push inside BENCH.tick doubled the reported frame count");

function huskLodMax() {
  const m = html.match(/max:\s*(\d+),\s*\/\/ never above BAL\.C\.liveCap/);
  return m ? +m[1] : NaN;
}
function HFITmaxOK() { return huskLodMax() <= C.liveCap; }

/* ---------------- the verdict itself, EXECUTED (VR-117, 8/22) ------------
   Everything above proves the benchmark's source says the right things. None
   of it proves the function DECIDES the right things — and on 8/22 it did not:
   the first real reading off a phone came back with 26 skinned husks and 26
   billboards both pinned at 34ms p95, a delta of exactly 0.0ms, and the
   verdict said "BILLBOARDS — the models cost more than they are worth."
   It had keyed off the absolute p95 and never looked at the delta it had just
   printed one line above.

   So the decision function is lifted out of index.html and run against real
   readings, the same way `_touch.js` executes the TOUCH block instead of
   describing it. The 8/22 numbers are in here verbatim as a regression case. */
console.log("\n[the verdict decides correctly — run against real readings]");
{
  const a = html.indexOf("  function tight(r)");
  const b = html.indexOf("  function finish()");
  if (a < 0 || b < 0 || b <= a) die("could not extract the verdict from index.html");
  const box = { Math, console };
  vm.createContext(box);
  new vm.Script(html.slice(a, b) + "\n;module_exports = verdict;",
                { filename: "index.html#BENCH.verdict" }).runInContext(box);
  const V = box.module_exports;

  const R = (p50, p95, p99, tris, calls) =>
    ({ p50, p95, p99, worst: p99 + 2, tris, calls, bad: false, why: "", rigs: 0, n: 300 });
  // ...and one that sets the tail explicitly, because the tail is a finding
  const T = (p50, p95, p99, worst, tris, calls) =>
    ({ p50, p95, p99, worst, tris, calls, bad: false, why: "", rigs: 0, n: 300 });

  // 8/22, Jordan's iPhone, pixel grid off. Both loaded passes pinned to 34ms.
  const v1 = V(R(33, 34, 34, 1460556, 104), R(33, 34, 35, 21152, 42), R(33, 34, 34, 8000, 30));
  ok("a display cap is reported as a cap, not as a verdict on the models",
     /CAPPED AT ~30Hz/.test(v1) && /FREE/.test(v1) && !/BILLBOARDS/.test(v1),
     "the 8/22 regression: same numbers used to return BILLBOARDS");
  ok("the capped verdict still says to ship them", /SHIP THEM/.test(v1));
  ok("the capped verdict admits what it did NOT measure",
     /NOT measured/.test(v1), "headroom under the cap is unknown, and saying so is the point");

  // same device, cap lifted: empty arena is fast, husks still cost nothing
  const v2 = V(R(16, 17, 18, 1460556, 104), R(16, 17, 18, 21152, 42), R(8, 9, 10, 8000, 30));
  ok("free models on an uncapped device are shipped, not budgeted",
     /FREE/.test(v2) && /HUSKLOD\.mode 26/.test(v2) && !/CAPPED/.test(v2));

  // a device where the models genuinely cost something
  const v3 = V(R(30, 34, 40, 1460556, 104), R(15, 17, 20, 21152, 42), R(8, 9, 11, 8000, 30));
  ok("models that genuinely cost the frame rate are sent back to billboards",
     /BILLBOARDS/.test(v3), "cost 17.0ms and p95 past 28");

  // costly but still comfortably playable -> the LOD, not a retreat
  const v4 = V(R(20, 22, 25, 1460556, 104), R(14, 15, 17, 21152, 42), R(8, 9, 11, 8000, 30));
  ok("a middling cost picks the LOD rather than either extreme",
     /LOD —/.test(v4));

  /* 8/22 again, Low Power Mode OFF — the reading that exposed the third bug.
     p50/p95/p99 all look fine and the models measure nearly free, and the pass
     still dropped a single 212ms frame. Every percentile in the report is blind
     to it; only `worst` saw it, and nothing was reading `worst`. */
  const v5 = V(T(17, 19, 25, 212, 1460188, 98),
               T(17, 17, 17,  30,   21172, 44),
               T( 9,  9, 10,  20,    8000, 30));
  ok("a 212ms outlier is reported even when p95 says the models are free",
     /FREE/.test(v5) && /HITCH/.test(v5),
     "the steady state and the tail are two different findings");
  ok("the hitch points at construction, not at the frame budget",
     /being BUILT mid-fight/.test(v5));
  ok("breaking a locked 60 is named rather than filed under FREE",
     /no longer locked/.test(v5), "+2ms sounds free; losing vsync does not feel free");
  ok("a clean tail is reported as clean",
     /tail        clean/.test(V(T(17, 19, 25, 28, 1460188, 98),
                                T(17, 17, 17, 26, 21172, 44),
                                T(9, 9, 10, 20, 8000, 30))));

  // a tainted pass must never produce a number
  const bad = R(16, 17, 18, 100, 10); bad.bad = true; bad.why = "the tab was hidden";
  ok("one invalidated pass invalidates the whole call",
     /NO CALL/.test(V(bad, R(16, 17, 18, 100, 10), R(8, 9, 10, 100, 10))));
}

/* ---- the SEARCH clips (VR-119) ----------------------------------------
   This file already proved husk.glb CARRIES walk/scan/dizzy — VR-117 merged
   them and they sat unused for a fortnight. What is new is that they are now
   played, so what needs proving is the FIT: that they loop, that the walk is
   velocity-driven against its own reference, and that neither is trimmed by a
   window that does not exist. */
console.log("\n[husk SEARCH clips — VR-119]");
{
  const bal = html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/);
  const bBox = { module: { exports: {} }, Math, console };
  vm.createContext(bBox);
  new vm.Script(bal[1], { filename: "index.html#BALANCE" }).runInContext(bBox);
  const CC = bBox.module.exports.C;

  ok("walk, scan and dizzy are used, not merely present",
     /if \(e\.state === "search"\) return e\.beat;/.test(html),
     "VR-117 merged them; until VR-119 nothing ever asked for them");
  ok("all four locomotion-ish clips loop",
     /var HUSK_LOOPS = \{ run: 1, walk: 1, scan: 1, dizzy: 1 \};/.test(html) &&
     /if \(!HUSK_LOOPS\[name\]\) a\.setLoop\(THREE\.LoopOnce, 1\);/.test(html),
     "a 2-5s beat played as a one-shot freezes mid-turn, which reads as the animation failing");
  ok("none of them is window-trimmed",
     !["walk", "scan", "dizzy"].some(n => HFIT.win[n]),
     "a window here would cut a loop into a stutter; only the one-shots are fitted");

  // the walk must sit inside the same clamp the run does, across the whole curve
  const lo = CC.enemySpeed * CC.huskSearchSpeed;                 // wave 1
  const hi = CC.enemySpeed * 1.9 * CC.huskSearchSpeed;           // late-wave spdMult
  ok("the walk has its own reference, not the run's",
     typeof HFIT.walkRef === "number" && HFIT.walkRef !== HFIT.runRef,
     "walkRef " + HFIT.walkRef + " vs runRef " + HFIT.runRef + " — different gaits, different speeds");
  ok("and the search band lands inside the timescale clamp",
     lo / HFIT.walkRef >= 0.55 && hi / HFIT.walkRef <= 1.9,
     "search runs " + lo.toFixed(2) + "-" + hi.toFixed(2) + " u/s → " +
       (lo / HFIT.walkRef).toFixed(2) + "-" + (hi / HFIT.walkRef).toFixed(2) +
       "x; outside [0.55,1.9] the clamp bites and the feet slide");
  ok("scan and dizzy play at their own pace",
     /a\.setEffectiveTimeScale\(1\);\s+\/\/ a beat plays at its own pace/.test(html),
     "rate-scaling a look-around against a ground speed of zero is a division by nothing");
  ok("the search walk is driven by the SEARCH speed, not the seek speed",
     /name === "walk" \? C\.huskSearchSpeed : 1/.test(html),
     "scaling the walk clip by the run speed is a husk moonwalking at a third of its stride");
}

/* ---- the locomotion anchors against the REAL clips (VR-158) -------------
   _billboard.js proves the blend maths. What belongs here is the half that
   needs the GLB open: an anchor is a claim that a clip LOOKS RIGHT at a given
   ground speed, and that is only checkable against the clip's real duration.
   A stride length that comes out absurd means the anchor is wrong, and a wrong
   anchor is a blend that slides at exactly the speeds you play at most. */
console.log("\n[locomotion anchors — VR-158]");
{
  const A = FIT.loco;
  ok("vesper.glb carries all three locomotion clips",
     !!(clips.idle && clips.move && clips.run),
     "the blend degrades safely without them, but it is a blend of one until they exist");
  ok("the anchors ascend", A.idle < A.move && A.move < A.run,
     `idle ${A.idle} < move ${A.move} < run ${A.run} u/s`);
  ok("the run anchor is below top speed, not above it",
     A.run < C.moveSpeed,
     `run anchor ${A.run} against moveSpeed ${C.moveSpeed} — an anchor past the fastest you can go is a clip that never plays clean`);
  ok("and not so far below that the sprint is pure run for most of the band",
     A.run > C.moveSpeed * 0.6,
     "if run were anchored at walking pace the blend would sit pinned at the top and stop blending");

  // stride = how far one full cycle of the clip covers at its own anchor speed
  const strideWalk = clips.move.duration * A.move;
  const strideRun  = clips.run.duration * A.run;
  ok("the walk's stride is a plausible human one",
     strideWalk > 0.8 && strideWalk < 6,
     `${strideWalk.toFixed(2)}m per cycle (${clips.move.duration.toFixed(2)}s x ${A.move} u/s)`);
  ok("the run's stride is longer than the walk's",
     strideRun > strideWalk,
     `run ${strideRun.toFixed(2)}m vs walk ${strideWalk.toFixed(2)}m — if this inverts, the phase blend speeds UP as you slow down`);
  ok("neither is more than double the other",
     Math.max(strideRun, strideWalk) / Math.min(strideRun, strideWalk) < 2.2,
     "a shared phase across wildly different strides is the foot-fight the blend exists to remove");
  ok("the stalk reference is well below the walk anchor",
     FIT.stalkRef < A.move && FIT.stalkRef > 0,
     `stalk ${FIT.stalkRef} u/s — it is a separate gait, and BALANCE's stalkSpeed is ${C.stalkSpeed}`);
  ok("and it is near the speed a stalk actually moves at",
     Math.abs(FIT.stalkRef - C.stalkSpeed) < 0.35,
     "the one place the old velocity-scaling survives, so its reference has to match the mechanic");
  ok("the blend-in is short enough to hand the body back inside a chain window",
     FIT.blendIn > 0 && FIT.blendIn < C.chainWindow,
     `${FIT.blendIn}s against a chain window of ${C.chainWindow}s`);
}

console.log("\n" + "=".repeat(58));
console.log(fails ? "FAIL — " + fails + " of " + checks + " checks" : "PASS — " + checks + " checks");
process.exit(fails ? 1 : 0);
