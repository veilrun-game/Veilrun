/* VEILRUN — VR-140 zoom harness.
   Zoom is the first control in this game that means a DIFFERENT QUANTITY in
   each camera mode — metres of dolly in arcade and third, degrees of lens in
   first — and that is exactly the shape of thing that looks fine in one mode
   and is silently dead in the other two. This harness proves the three ends
   agree: the ZOOM table, the settings rows it points at, and the persisted
   defaults underneath.

   It also holds the line that made the feature possible at all — baseFov() as
   the ONE answer to "what lens does this mode want". The per-frame damp pulls
   cam.fovTarget back to that value every single frame, so the moment a second
   copy of the conditional reappears, a tuned first-person lens starts being
   thrown away 60 times a second with nothing in the console to say why.

   Usage: node _zoom.js   (run from games/proving-ground/) */
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let fails = 0, checks = 0;
const ok = (n, c, d) => { checks++; if (!c) { fails++; console.log("  FAIL  " + n + (d ? "  — " + d : "")); } else console.log("  ok    " + n + (d ? "  — " + d : "")); };

console.log("\nVEILRUN · Proving Ground — zoom harness (VR-140)\n" + "=".repeat(58));

/* ---------------- the rows the wheel writes through ---------------- */
console.log("\n[the panel is the source of the bounds]");
function row(id) {
  const re = new RegExp('<input[^>]*id="' + id + '"[^>]*>');
  const m = html.match(re);
  if (!m) return null;
  const g = a => { const x = m[0].match(new RegExp(a + '="([^"]+)"')); return x ? +x[1] : NaN; };
  return { min: g("min"), max: g("max"), step: g("step") };
}
const ROWS = { "t-dist": row("t-dist"), "t-tpdist": row("t-tpdist"), "t-fpfov": row("t-fpfov") };
for (const id in ROWS) {
  const r = ROWS[id];
  ok(id + " exists and is bounded",
     !!r && isFinite(r.min) && isFinite(r.max) && r.max > r.min && r.step > 0,
     r ? r.min + "–" + r.max + " step " + r.step : "MISSING");
}
ok("every zoom row has an <output> the put can write",
   ["t-dist", "t-tpdist", "t-fpfov"].every(id => html.includes('id="' + id + 'v"')),
   "bindRange looks for id+'v' — without it the toast is the only readout");
ok("every zoom row has a <label for>",
   ["t-dist", "t-tpdist", "t-fpfov"].every(id => html.includes('<label for="' + id + '"')),
   "4.1.2 — VR-114 fixed this panel once and new rows do not get to regress it");

/* ---------------- the table ---------------- */
console.log("\n[the ZOOM table covers every mode, exactly once]");
const tbl = html.match(/var ZOOM = \{([\s\S]*?)\n  \};/);
ok("ZOOM table is present", !!tbl);
const entries = tbl ? [...tbl[1].matchAll(/(\w+):\s*\{\s*key:\s*"(\w+)",\s*id:\s*"([\w-]+)",\s*group:\s*"(\w+)",\s*mult:\s*([\d.]+)/g)]
                          .map(m => ({ mode: m[1], key: m[2], id: m[3], group: m[4], mult: +m[5] })) : [];
const MODES = (html.match(/var CAM_MODES = \[([^\]]+)\]/) || [, ""])[1]
  .split(",").map(s => s.trim().replace(/"/g, "")).filter(Boolean);
ok("CAM_MODES reads as three modes", MODES.length === 3, MODES.join(", "));
ok("ZOOM has an entry for every camera mode", MODES.every(m => entries.some(e => e.mode === m)),
   "a mode with no entry is a wheel that silently does nothing — the bug this card exists to fix");
ok("and no entry for a mode that does not exist", entries.every(e => MODES.indexOf(e.mode) >= 0));
ok("every entry points at a real row", entries.every(e => ROWS[e.id]),
   entries.map(e => e.mode + "→" + e.id).join("  "));
ok("no two modes write the same value", new Set(entries.map(e => e.key)).size === entries.length,
   "three quantities, three keys — sharing one is the conversion this table exists to avoid");
ok("every entry carries a say() for the toast", entries.every(e =>
   new RegExp(e.mode + ":[\\s\\S]{0,220}?say:\\s*function").test(tbl[1])),
   "the toast IS the readout when the panel is shut");

/* ---------------- defaults, bindings and the preset spec ---------------- */
console.log("\n[each zoom key is wired the whole way down]");
for (const e of entries) {
  ok(e.key + " has a persisted default",
     new RegExp("\\b" + e.key + ":\\s*[^,\\n]+").test(html.slice(html.indexOf("var DEF = {"))),
     "zoom(0) resets to DEF[key] — a missing one resets to undefined");
  ok(e.key + " is bound to its row",
     new RegExp('bindRange\\("' + e.id + '",\\s*"' + e.key + '",\\s*"' + e.group + '"').test(html),
     "the wheel reuses the row's registered put — an unbound key has none");
  ok(e.key + " is in the preset spec",
     new RegExp('num\\("' + e.key + '",\\s*"' + e.id + '"\\)').test(html),
     "camera framing is a LOOK, and a look travels in a preset");
}
ok("bindRange registers puts by key", /puts\[key\] = put/.test(html),
   "without the registry zoom() would hand-write the row's formatting a second time");
ok("apply() has the rig branch the two new keys write through",
   /what === "rig"/.test(html) && /TP_OFF\.z =/.test(html) && /FP\.fov =/.test(html));
/* The "does it survive a corrupt blob" question lives in its own section below.
   It used to be asserted here as `clamp(+V.tpdist, ...)`, which passed while the
   bug was still live: clamping on the way OUT protects the rig and leaves the
   corrupt value in V, the row and localStorage. A green check on the wrong
   half is worse than no check. */

/* ---------------- baseFov is the one answer ---------------- */
console.log("\n[baseFov() — one answer, and only one]");
ok("baseFov() exists", /function baseFov\(\)/.test(html));
ok("toggleCam reads it", /cam\.fovTarget = baseFov\(\);/.test(html));
ok("fovKick reads it", /cam\.fovTarget = baseFov\(\) \+ v \* MOTION\.fov/.test(html));
ok("the per-frame damp reads it", /damp\(cam\.fovTarget, baseFov\(\)/.test(html));
const strayFov = [...html.matchAll(/cam\.mode === "third" \? \d+ : \d+/g)].length
               + [...html.matchAll(/first \? \d+ : \d+/g)].length;
ok("no hard-coded per-mode fov conditional survives", strayFov === 0,
   strayFov ? strayFov + " left — the damp would throw a tuned lens away every frame" : "all three sites route through baseFov()");
ok("FP.fov is a variable, not a literal", /var FP = \{ fov: \d+ \}/.test(html));
const fpRow = ROWS["t-fpfov"], fpDef = +(html.match(/fpfov:\s*FP\.fov/) ? (html.match(/var FP = \{ fov: (\d+)/) || [, NaN])[1] : NaN);
ok("the first-person default sits inside its own slider's range",
   fpRow && fpDef >= fpRow.min && fpDef <= fpRow.max, fpDef + " in " + (fpRow ? fpRow.min + "–" + fpRow.max : "?"));
const tpRow = ROWS["t-tpdist"], tpDef = +((html.match(/var TP_OFF = \{ x: [\d.]+, y: [\d.]+, z: ([\d.]+) \}/) || [, NaN])[1]);
ok("the third-person default sits inside its own slider's range",
   tpRow && tpDef >= tpRow.min && tpDef <= tpRow.max, tpDef + " in " + (tpRow ? tpRow.min + "–" + tpRow.max : "?"));
ok("the third-person floor is short enough to be a real over-the-shoulder seam",
   tpRow.min <= 2.5, "boom " + tpRow.min + " — the comment promises the shoulder; a floor of 5 would be a promise the range does not keep");
ok("nothing clamps to a hand-typed copy of the row's window",
   !/TP_Z_MIN|TP_Z_MAX/.test(html),
   "a second copy of min/max is the staleness buildSpec() and zoom() both exist to avoid");

/* ---------------- the corrupt-blob path ---------------- */
/* Found in a real browser, not here: a hostile localStorage blob left the rows
   reading `NaN` and `99999°` over an arena running on clamped values, and — far
   worse — left zoom() stepping from a NaN, so the wheel went silently dead. The
   assertions below are the ones that would have caught it. */
console.log("\n[a corrupt blob corrects V, not just the rig]");
ok("pinNum() exists", /function pinNum\(key, id\)/.test(html));
ok("it reads the window off the control", /var lo = \+el\.min, hi = \+el\.max;/.test(html.slice(html.indexOf("function pinNum"))),
   "the same rule buildSpec() and zoom() follow — one window, read from one place");
ok("it writes the correction back to V", /V\[key\] = v;/.test(html.slice(html.indexOf("function pinNum"))));
ok("and pushes it to the row", /if \(puts\[key\]\) puts\[key\]\(\); else el\.value = v;/.test(html));
ok("and persists it", /V\[key\] = v;[\s\S]{0,400}?save\(\);/.test(html.slice(html.indexOf("function pinNum"))),
   "leaving the bad bytes on disk means the correction has to be re-made every boot");
for (const [key, id] of [["pitch","t-pitch"],["dist","t-dist"],["fov","t-fov"],["tpdist","t-tpdist"],["fpfov","t-fpfov"]]) {
  ok(key + " is pinned before it is read",
     new RegExp('pinNum\\("' + key + '",\\s*"' + id + '"\\)').test(html),
     key === "tpdist" || key === "fpfov" ? "new with this card" : "carried the bug since VR-113 fixed its <select> equivalent");
}
ok("the rig branch pins rather than clamping in place",
   /pinNum\("tpdist"[\s\S]{0,120}?TP_OFF\.z = \+V\.tpdist/.test(html),
   "clamping on the way out is what left the corrupt value sitting in V");
ok("zoom() does not trust V either",
   /var cur = \+V\[z\.key\]; if \(!isFinite\(cur\)\) cur = DEF\[z\.key\];/.test(html),
   "zoom() is reachable from an input event — it cannot assume apply() already ran");
ok("and steps from that value, not from V again",
   /next === cur\) return false;/.test(html),
   "re-reading V here would reintroduce the NaN the line above just stepped around");

/* ---------------- the stepping itself ---------------- */
console.log("\n[stepping, clamping and snapping]");
/* zoom()'s arithmetic, lifted verbatim so the assertions below are about the
   game's rule and not about a paraphrase of it. */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function step(row, cur, dir, mult, def) {
  const { min: lo, max: hi, step: st } = row;
  let next = dir ? cur + dir * st * mult : def;
  next = clamp(+(Math.round(next / st) * st).toFixed(4), lo, hi);
  return next;
}
const tp = ROWS["t-tpdist"], tpMult = (entries.find(e => e.key === "tpdist") || {}).mult;
ok("in is smaller, out is bigger", step(tp, 6.4, -1, tpMult) < 6.4 && step(tp, 6.4, 1, tpMult) > 6.4,
   "one sign has to mean 'in' in all three modes or the wheel reverses when you change view");
ok("floats stay clean across a long pull", (() => {
  let v = tpDef;
  for (let i = 0; i < 40; i++) v = step(tp, v, -1, tpMult);
  for (let i = 0; i < 40; i++) v = step(tp, v, 1, tpMult);
  return String(v).length <= 5;
})(), "0.2-sized steps accumulate into 6.400000000000001 and the <output> prints float noise");
ok("winding all the way in stops at the floor", (() => {
  let v = tpDef; for (let i = 0; i < 200; i++) v = step(tp, v, -1, tpMult); return v === tp.min;
})(), "boom " + tp.min + " — the shoulder, and the seam a later card can hand off to first person from");
ok("winding all the way out stops at the ceiling", (() => {
  let v = tpDef; for (let i = 0; i < 200; i++) v = step(tp, v, 1, tpMult); return v === tp.max;
})());
ok("every landing value is on the step grid", (() => {
  let v = tpDef;
  for (let i = 0; i < 60; i++) { v = step(tp, v, -1, tpMult); if (Math.abs(Math.round(v / tp.step) - v / tp.step) > 1e-6) return false; }
  return true;
})(), "a value off the grid leaves the range input showing the nearest one instead — panel and game disagree");
ok("reset returns exactly the default", step(tp, tp.min, 0, tpMult, tpDef) === tpDef);
const fp = ROWS["t-fpfov"], fpMult = (entries.find(e => e.key === "fpfov") || {}).mult;
ok("the lens clamps at both ends too",
   step(fp, fp.min, -1, fpMult) === fp.min && step(fp, fp.max, 1, fpMult) === fp.max);
ok("a notch is a comparable bite in every mode", entries.every(e => {
  const r = ROWS[e.id], span = r.max - r.min, bite = (r.step * e.mult) / span;
  return bite > 0.01 && bite < 0.09;
}), entries.map(e => { const r = ROWS[e.id]; return e.mode + " " + ((r.step * e.mult) / (r.max - r.min) * 100).toFixed(1) + "%"; }).join("  "));

/* ---------------- input: what it must not break ---------------- */
console.log("\n[the input never takes something that was already spoken for]");
/* Everything BEFORE the VR-140 block, so this reads "was it already taken"
   rather than "did we take it" — which is what the question actually is. */
const beforeZoom = html.slice(0, html.indexOf("zoom input, wheel and keys (VR-140)"));
ok("the VR-140 input block is where this expects it", beforeZoom.length > 0 && beforeZoom.length < html.length);
const HOTKEYS = [...beforeZoom.matchAll(/k === "([^"]+)"/g)].map(m => m[1])
  .concat([...beforeZoom.matchAll(/e\.key !== "([^"]+)"/g)].map(m => m[1]))
  .concat([...beforeZoom.matchAll(/e\.key === "([^"]+)"/g)].map(m => m[1]));
ok("- _ = + 0 were claimed by nothing already",
   !["-", "=", "0", "_", "+"].some(k => HOTKEYS.includes(k)),
   "already spoken for: " + [...new Set(HOTKEYS)].join(" "));
ok("the wheel and the keys share one setter",
   /TUNE\.zoom\(e\.deltaY < 0 \? -1 : 1\)/.test(html) && /TUNE\.zoom\(1\)/.test(html) && /TUNE\.zoom\(-1\)/.test(html) && /TUNE\.zoom\(0\)/.test(html),
   "two paths into the rigs is how the panel and the camera start disagreeing");
ok("zoom is exported from TUNE", /zoom: zoom \}/.test(html));
ok("the wheel yields to anything scrollable", /function zoomBlocked/.test(html) && /#tune, #s-help, #tunescrim/.test(html),
   "the settings drawer is a long list on a short window — a wheel over it must scroll it");
ok("the key path yields to focused controls inside a dialog",
   /if \(t && t !== document\.body && zoomBlocked\(t\)\)/.test(html),
   "a range input's own arrow keys and a text field's minus sign both outrank this");
ok("modified presses are left to the browser", /if \(e\.ctrlKey \|\| e\.metaKey \|\| e\.altKey\) return;/.test(html),
   "Cmd/Ctrl +/- is page zoom and belongs to the player, not to us");
ok("the wheel listener is not passive", /\{ passive: false \}/.test(html),
   "preventDefault is a no-op on a passive listener and the page overscrolls instead");
ok("magnitude is never read", !/deltaY \*/.test(html) && !/deltaY \/ /.test(html),
   "a trackpad flick delivers a hundred events — reading magnitude crosses the whole range in one gesture");

/* ---------------- the legend and the note ---------------- */
console.log("\n[a control nobody can find is not a control]");
ok("the start-screen legend names it", /<b>Scroll[^<]*<\/b>/.test(html),
   "#help-keys is mirrored from this list, so one edit reaches both");
ok("the Camera section explains the three-quantity part", /whichever of these three the view you are in uses/.test(html));
ok("and that note is hidden where there is no wheel", /class="tnote mouseonly"/.test(html),
   "on a phone that sentence describes hardware that is not there");
ok(".mouseonly is defined and inverted in the coarse-pointer block",
   /\.mouseonly\{display:block\}/.test(html) && /\.mouseonly\{display:none\}/.test(html));

console.log("\n" + "=".repeat(58));
console.log(fails ? "FAIL — " + fails + " of " + checks + " checks" : "PASS — " + checks + " checks");
process.exit(fails ? 1 : 0);
