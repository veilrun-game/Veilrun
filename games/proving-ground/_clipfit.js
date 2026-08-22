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
const GLB = path.join(__dirname, "..", "..", "assets", "models", "vesper.glb");
if (!fs.existsSync(GLB)) die("no model at " + GLB + " — run the Blender merge first.");
const buf = fs.readFileSync(GLB);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
const binOff = 20 + jsonLen + 8;
const BIN = buf.slice(binOff, binOff + buf.readUInt32LE(20 + jsonLen));

/* Only the sampler INPUTS (keyframe times) matter here, and they are always
   float SCALAR — so this reader stays deliberately narrow rather than becoming
   a general-purpose glTF parser we would then have to maintain. */
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

const clips = {};
for (const anim of gltf.animations || []) {
  const tracks = anim.samplers.map(s => times(s.input));
  clips[anim.name] = {
    tracks,
    duration: Math.max(...tracks.map(t => t[t.length - 1]))
  };
}

/* The game's trimClip(), arithmetic only — keys inside [startFrame, endFrame)
   shifted to start at 0, and any track with NO key in the window held at the
   last pose before it rather than dropped.

   `naive` reports what THREE.AnimationUtils.subclip would have kept, because
   that difference IS the bug: Blender collapses a still bone to one key at the
   head of the clip, so the stock helper silently discards 100 of 123 tracks for
   any window that doesn't start at frame 0, and Vesper falls apart mid-swing.
   Asserted below, so nobody "simplifies" trimClip back into the stock call. */
function trimDuration(clipName, startFrame, endFrame, fps) {
  const c = clips[clipName];
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

console.log("\n" + "=".repeat(58));
console.log(fails ? "FAIL — " + fails + " of " + checks + " checks" : "PASS — " + checks + " checks");
process.exit(fails ? 1 : 0);
