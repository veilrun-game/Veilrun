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
ok("arcade never grabs pointer lock", /cam\.mode !== "arcade"[\s\S]{0,80}requestPointerLock|requestPointerLock[\s\S]{0,40}cam\.mode !== "arcade"/.test(html),
   "pointer lock is what made v0 desktop-only");
ok("WASD resolves against the fixed camera", /basis = \(cam\.mode === "arcade"\) \? ARC\.yaw/.test(html));
ok("you face where you move", /cam\.mode === "arcade" && \(mx \|\| mz\)\) mouse\.yaw = Math\.atan2/.test(html));
ok("pixel grid on by default", /var PIXEL = 4;/.test(html));
ok("antialias off while pixelated", /antialias: PIXEL <= 1/.test(html), "smoothing at low res kills the effect");
ok("sprites switch to NearestFilter", /NearestFilter/.test(html));

console.log("\n[yaw convention]");
ok("one documented convention", /YAW CONVENTION/.test(html) && /var MESH_PI/.test(html));
ok("player mesh is offset by MESH_PI", /player\.g\.rotation\.y = player\.yaw \+ MESH_PI/.test(html),
   "meshes are modelled facing +z; forward is -z");
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
ok("model shares the sprite state machine", /MODEL\.play\(playerModelState\(speed\), dt, speed\)/.test(html),
   "one source of truth for what the character is doing");
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
ok("destruction is the transition, glass is the state", /GHOST_AT = 0\.70/.test(html) &&
   /holes = \(1 - k\) \* 0\.82/.test(html), "holes recede as the glass comes in");
ok("glass lets the far side through", /depthWrite = ghost < 0\.5/.test(html));
ok("veil colours are tunable in one place", /VEIL_BURN/.test(html) && /VEIL_A_MIN/.test(html));
ok("glass has a rim gradient", /vrT = mix\(uGlass, uRim, vrF \* vrF\)/.test(html),
   "deep violet through the body, pink only where he turns away");
ok("execute has its own clip with a fallback", /\["execute","\[|\["execute",\s*\["assassin"/.test(html) &&
   /st === "execute" && !MODEL\.hasClip\("execute"\)/.test(html));
ok("glass is not the seam's magenta", !/uGlass = \{ value: new THREE\.Color\(0xD65CDC\)/.test(html),
   "magenta belongs to the world tearing, not to Vesper");
ok("eaten edges are lit", /uEdge/.test(html) && /smoothstep\(uDissolve/.test(html));
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

console.log("\n[dom sanity]");
{
  const ids = [...html.matchAll(/<[^>]*\sid="([^"]+)"/g)].map(m => m[1]);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  ok("no duplicate element ids", dupes.length === 0,
     dupes.length ? dupes.join(", ") + " — getElementById silently returns the first, so the second element's listeners never attach" : ids.length + " ids, all unique");
}
ok("pause has its own button", /id="btn-unpause"/.test(html) && /\$\("btn-unpause"\)\.addEventListener/.test(html));
ok("arcade starts unpaused", /setPaused\(cam\.mode !== "arcade"\)/.test(html),
   "it never requests a lock, so it must not wait for one");
ok("arcade never pauses on lost pointer lock", /cam\.mode !== "arcade"\) setPaused\(!mouse\.locked\)/.test(html),
   "this is what left the run stuck on the pause screen");

/* ---- the sim must not have been touched ---- */
console.log("\n[separation of concerns]");
const bal = html.match(/BALANCE:BEGIN[\s\S]*?BALANCE:END/);
ok("BALANCE block still present", !!bal);
ok("sprite layer never touches BALANCE", bal && !/SPR\.|playerSprite|huskSprites/.test(bal[0]),
   "the sim stays authoritative");

console.log("\n" + "=".repeat(58));
console.log(fails ? `FAIL — ${fails} of ${checks}` : `PASS — ${checks} checks`);
process.exit(fails ? 1 : 0);
