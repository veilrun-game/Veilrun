/* =====================================================================
   _shroud.js — proof for the Shroud reveal (VR-130)

   The shroud shader was the one piece of Vesper nothing could check. The
   other harnesses read the file as TEXT: they can prove the word uGhost is
   present, not that the GLSL compiles, and certainly not that the thing on
   screen reads as "the dissolve uncovered the glass" rather than "a dissolve,
   and then a hologram".

   So this one actually RUNS it. It lifts DISSOLVE_HEAD / DISSOLVE_BODY and
   the sweep constant straight out of index.html — no retyped copy, or the
   harness would drift the moment the shader changed — drops the body into a
   minimal WebGL2 rig with the same varyings Three.js gives it, renders a
   sphere across the whole veil, and reads the pixels back.

   THE PROPERTY IT EXISTS TO PROVE, in one line:
   mid-sweep, SKIN and GLASS and the LIT TEAR are all on screen AT ONCE.
   Two-phase code cannot do that — during its first phase there is no glass
   anywhere, and during its second there is no skin anywhere. That is exactly
   what made the old version read as two effects bolted together.

   Contact sheet lands in _shroud.png.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, why) {
  if (cond) { pass++; console.log("  ok    " + name + (why ? "  — " + why : "")); }
  else { fail++; console.log("  FAIL  " + name + (why ? "  — " + why : "")); }
}

/* ---- lift the real shader out of the game ------------------------------ */
function arrayLiteral(varName) {
  const i = HTML.indexOf("var " + varName + " = [");
  if (i < 0) throw new Error("could not find " + varName + " in index.html");
  const start = HTML.indexOf("[", i);
  let d = 0, end = -1;
  for (let j = start; j < HTML.length; j++) {
    if (HTML[j] === "[") d++;
    else if (HTML[j] === "]") { d--; if (!d) { end = j; break; } }
  }
  // the literal holds only strings and // comments — safe to evaluate
  return eval(HTML.slice(start, end + 1)).join("\n");
}
const HEAD = arrayLiteral("DISSOLVE_HEAD");
const BODY = arrayLiteral("DISSOLVE_BODY");
const SWEEP = parseFloat(/var VEIL_SWEEP = ([\d.]+)/.exec(HTML)[1]);

console.log("[extracted from index.html]");
ok("shader head lifted", /uniform float uDissolve/.test(HEAD) && /vr_noise/.test(HEAD));
ok("shader body lifted", /vrG/.test(BODY) && /discard/.test(BODY));
ok("sweep constant lifted", SWEEP > 1, "the front must overshoot 1 or the last skin never goes  — " + SWEEP);

ok("the harness drives the same curve the game does",
   /uDissolve\.value = front/.test(HTML) && /t <= 0\.88 \? 0 :/.test(HTML),
   "front = t * VEIL_SWEEP, and the backstop waits until 0.88");
ok("the reveal is not gated on the backstop", /vrG = max\(vrG, uGhost\)/.test(HTML),
   "uGhost can only ever ADD glass the front already put there");

/* ---- the render pass is optional ---------------------------------------
   Everything above is dependency-free like the rest of this repo's harnesses.
   Everything below needs a real GL context, which means Playwright, which is
   the only npm install anywhere in this project. So it SKIPS rather than
   fails when that isn't there: a machine without it still gets the text
   checks and a green run, and _shroud.png in this folder is the picture from
   a machine that did have it.
       npm i -D playwright && npx playwright install chromium
   ---------------------------------------------------------------------- */
let chromium = null;
try { chromium = require("playwright").chromium; } catch (e) { /* optional */ }
if (!chromium) {
  console.log("\n[render pass]");
  console.log("  ~ SKIP  the shader is not compiled or rendered on this machine");
  console.log("          npm i -D playwright && npx playwright install chromium");
  console.log("          — see _shroud.png for the sheet from a run that did");
  console.log("\n==========================================================");
  console.log((fail ? "FAIL — " + fail + " failed, " : "PASS — ") + pass +
              " checks, render pass skipped");
  process.exit(fail ? 1 : 0);
}

/* ---- the rig ----------------------------------------------------------- */
const FRAG = `#version 100
precision highp float;
varying vec2  vUv;
varying vec3  normal;
varying vec3  vViewPosition;
uniform vec3  uSkin;
${HEAD}
void main() {
  // stand-in for everything Three.js has already resolved by <dithering_fragment>:
  // a lit, opaque surface. The block under test only ever edits this.
  float lam = max(dot(normalize(normal), normalize(vec3(0.4, 0.8, 0.5))), 0.0);
  gl_FragColor = vec4(uSkin * (0.35 + 0.65 * lam), 1.0);
${BODY}
}`;

const VERT = `#version 100
precision highp float;
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aUv;
uniform mat4 uProj, uView;
varying vec2  vUv;
varying vec3  normal;
varying vec3  vViewPosition;
void main() {
  vUv = aUv;
  normal = aNor;
  vec4 mv = uView * vec4(aPos, 1.0);
  vViewPosition = -mv.xyz;
  gl_Position = uProj * mv;
}`;

const STEPS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0];
const W = 220, H = 260;

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: W * STEPS.length, height: H } });

  const result = await page.evaluate(({ VERT, FRAG, STEPS, SWEEP, W, H }) => {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return { err: "no webgl context" };

    function sh(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src.replace("#version 100\n", ""));
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        return { err: gl.getShaderInfoLog(s) };
      return s;
    }
    const vs = sh(gl.VERTEX_SHADER, VERT); if (vs.err) return { err: "vertex: " + vs.err };
    const fsr = sh(gl.FRAGMENT_SHADER, FRAG); if (fsr.err) return { err: "fragment: " + fsr.err };
    const pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fsr); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return { err: "link: " + gl.getProgramInfoLog(pr) };
    gl.useProgram(pr);

    // sphere — enough curvature for the fresnel rim to have something to do
    const SEG = 64, pos = [], nor = [], uv = [], idx = [];
    for (let y = 0; y <= SEG; y++) for (let x = 0; x <= SEG; x++) {
      const u = x / SEG, v = y / SEG, ph = v * Math.PI, th = u * Math.PI * 2;
      const nx = Math.sin(ph) * Math.cos(th), ny = Math.cos(ph), nz = Math.sin(ph) * Math.sin(th);
      pos.push(nx, ny, nz); nor.push(nx, ny, nz); uv.push(u, v);
    }
    for (let y = 0; y < SEG; y++) for (let x = 0; x < SEG; x++) {
      const a = y * (SEG + 1) + x, b = a + SEG + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    function buf(data, loc, size) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const l = gl.getAttribLocation(pr, loc);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
    }
    buf(pos, "aPos", 3); buf(nor, "aNor", 3); buf(uv, "aUv", 2);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    const f = 2.4, ar = W / H, near = 0.1, far = 20;
    gl.uniformMatrix4fv(gl.getUniformLocation(pr, "uProj"), false, new Float32Array([
      f / ar, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1,
      0, 0, 2 * far * near / (near - far), 0]));
    gl.uniformMatrix4fv(gl.getUniformLocation(pr, "uView"), false, new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -3.2, 1]));
    gl.uniform3f(gl.getUniformLocation(pr, "uSkin"), 0.72, 0.70, 0.76);

    const U = n => gl.getUniformLocation(pr, n);
    gl.uniform3f(U("uEdge"), 0x98 / 255, 0x1A / 255, 0xFF / 255);
    gl.uniform3f(U("uGlass"), 0x63 / 255, 0x28 / 255, 0x9F / 255);
    gl.uniform3f(U("uRim"), 0x27 / 255, 0x85 / 255, 0xDD / 255);
    gl.uniform1f(U("uGlassLift"), 1.10);
    gl.uniform1f(U("uAMin"), 0.16);
    gl.uniform1f(U("uAMax"), 0.66);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const sheet = document.createElement("canvas");
    sheet.width = W * STEPS.length; sheet.height = H;
    const ctx = sheet.getContext("2d");
    ctx.fillStyle = "#0b0710"; ctx.fillRect(0, 0, sheet.width, sheet.height);

    const stats = [];
    STEPS.forEach((t, i) => {
      const front = t * SWEEP, ghost = t <= 0.88 ? 0 : (t - 0.88) / 0.12;
      gl.uniform1f(U("uDissolve"), front);
      gl.uniform1f(U("uGhost"), ghost);
      gl.clearColor(11 / 255, 7 / 255, 16 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

      const px = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      // classify only inside the silhouette — a pixel is one of:
      //   skin  pale and bright (untouched surface)
      //   glass violet/blue and dim (the shell under the skin)
      //   burn  the hot edge colour
      //   hole  background showing through the tear
      let skin = 0, glass = 0, burn = 0, hole = 0, body = 0;
      const cx = W / 2, cy = H / 2, R = (f * (H / 2)) / 3.2 * 0.97; // projected radius
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > R * R * 0.62) continue;   // stay well inside the rim
        body++;
        const o = (y * W + x) * 4, r = px[o], g = px[o + 1], b = px[o + 2];
        /* Classify by RATIO, not by difference. Face-on glass is deliberately
           near-invisible (uAMin 0.16), so it arrives as a very dark pixel that
           is still unmistakably violet — b is ~2.5x g — while skin is pale and
           near-neutral. A difference test called that dim glass "skin", which
           is the harness being wrong about the picture, not the picture. */
        if (r < 15 && g < 11 && b < 21) { hole++; continue; }   // background through the tear
        if (!(b > g * 1.35)) { skin++; continue; }
        if (r > 110 && b > 190) burn++;
        else glass++;
      }
      stats.push({ t, front: +front.toFixed(3), ghost: +ghost.toFixed(2),
                   skin: skin / body, glass: glass / body, burn: burn / body, hole: hole / body });

      ctx.drawImage(cv, i * W, 0);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "13px ui-monospace, monospace";
      ctx.fillText("t=" + t.toFixed(2), i * W + 10, 20);
    });
    /* ---- second rig: a flat, camera-facing patch of UV -------------------
       The sphere is the picture; it is a bad ruler. Its UVs bunch at the
       poles and only a slice of them ever faces the lens, so counting screen
       pixels on it measures the sphere's mapping as much as the shader's
       front. A quad spanning uv 0..1 with the camera square on it counts the
       noise field itself, which is what "the front covers him evenly" is a
       claim about. */
    const qpos = [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0];
    const qnor = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    const quv = [0, 0, 1, 0, 0, 1, 1, 1];
    buf(qpos, "aPos", 3); buf(qnor, "aNor", 3); buf(quv, "aUv", 2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 3, 2]), gl.STATIC_DRAW);
    gl.uniformMatrix4fv(gl.getUniformLocation(pr, "uView"), false, new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1.05, 1]));
    gl.uniform1f(U("uGhost"), 0);

    const sweepCurve = [];
    for (let f = 0.1; f <= 1.0001; f += 0.1) {
      gl.uniform1f(U("uDissolve"), f);
      gl.clearColor(11 / 255, 7 / 255, 16 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      const px = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let taken = 0, n = 0;
      for (let y = H * 0.15 | 0; y < H * 0.85; y++) for (let x = W * 0.15 | 0; x < W * 0.85; x++) {
        const o = (y * W + x) * 4, r = px[o], g = px[o + 1], b = px[o + 2];
        n++;
        // anything the front has reached is violet or gone; untouched skin is pale
        if ((r < 15 && g < 11 && b < 21) || b > g * 1.35) taken++;
      }
      sweepCurve.push({ f: +f.toFixed(1), covered: taken / n });
    }

    return { stats, sweepCurve, png: sheet.toDataURL("image/png") };
  }, { VERT, FRAG, STEPS, SWEEP, W, H });

  await browser.close();

  console.log("\n[the shader compiles and runs]");
  ok("GLSL compiles and links", !result.err, result.err || "no compile or link errors");
  if (result.err) { console.log("\nFAILED — " + result.err); process.exit(1); }

  fs.writeFileSync(path.join(__dirname, "_shroud.png"),
    Buffer.from(result.png.split(",")[1], "base64"));

  const S = result.stats;
  console.log("\n[what is on screen, by fraction of the body]");
  console.log("   t     front  ghost   skin   glass   burn   hole");
  S.forEach(s => console.log(
    "  " + s.t.toFixed(2) + "   " + s.front.toFixed(2) + "   " + s.ghost.toFixed(2) +
    "   " + (s.skin * 100).toFixed(0).padStart(4) + "%  " + (s.glass * 100).toFixed(0).padStart(4) +
    "%  " + (s.burn * 100).toFixed(0).padStart(4) + "%  " + (s.hole * 100).toFixed(0).padStart(4) + "%"));

  const at = t => S.find(s => Math.abs(s.t - t) < 1e-6);

  console.log("\n[the ends]");
  ok("he starts as himself", at(0).skin > 0.95 && at(0).glass < 0.01 && at(0).hole < 0.01,
     "nothing of the veil is visible at rest");
  ok("he ends as glass, whole", at(1).glass > 0.95 && at(1).skin < 0.02,
     "the sweep finishes — no patch of skin survives it");
  ok("the settled state is not perforated", at(1).hole < 0.005,
     "uGhost closes the tear; a veiled Vesper full of holes reads as a rendering bug");
  ok("the settled state has stopped burning", at(1).burn < 0.02,
     "the burn belongs to the transition, not to the state");

  console.log("\n[the property this file exists for]");
  const mid = S.filter(s => s.t > 0 && s.t < 1);
  const together = mid.filter(s => s.skin > 0.05 && s.glass > 0.05);
  ok("skin and glass share the body mid-sweep", together.length >= 3,
     together.length + " of " + mid.length + " sampled moments — two-phase code cannot produce ONE");
  ok("the tear is lit wherever they meet", together.every(s => s.burn > 0.002),
     "the seam is an edge, not a colour change");
  ok("the tear is a thin front, not an eaten body", mid.every(s => s.hole < 0.22),
     "max hole coverage " + (Math.max(...mid.map(s => s.hole)) * 100).toFixed(0) + "% — it moves, it does not accumulate");

  console.log("\n[the direction of travel]");
  const glassSeq = S.map(s => s.glass), skinSeq = S.map(s => s.skin);
  ok("glass only ever gains", glassSeq.every((v, i) => i === 0 || v >= glassSeq[i - 1] - 0.02),
     "monotonic — no moment where the reveal goes backwards");
  ok("skin only ever loses", skinSeq.every((v, i) => i === 0 || v <= skinSeq[i - 1] + 0.02),
     "the front never re-covers him");
  ok("the reveal is underway well before uGhost exists",
     at(0.6).glass > 0.2 && at(0.6).ghost === 0,
     "at t=0.60 the body is " + (at(0.6).glass * 100).toFixed(0) +
     "% glass with the backstop still at zero — the DISSOLVE uncovered it");
  ok("the backstop only ever mops up", at(0.75).ghost === 0 && at(0.75).skin < 0.45,
     "most of him is already taken before uGhost is anything but zero");

  /* What matters here is the RATE, not the offset. The reading runs ahead of
     the front by a fixed amount because the burn glow reaches VR_GLOW past it
     and a glowing pixel is already a changed pixel — that lead is the effect
     working, not an error. A stall or a cliff would show up as an uneven step
     between readings, and that is what gets asserted. */
  console.log("\n[is a steady front a steady sweep? — measured on flat UV]");
  const C = result.sweepCurve;
  console.log("   front   touched   step");
  C.forEach((c, i) => console.log("   " + c.f.toFixed(1) + "     " +
    (c.covered * 100).toFixed(0).padStart(4) + "%   " +
    (i ? ("+" + ((c.covered - C[i - 1].covered) * 100).toFixed(0)).padStart(5) : "    -")));
  const steps = C.filter(c => c.covered < 0.985)
                 .map((c, i, a) => i ? c.covered - a[i - 1].covered : null).filter(v => v !== null);
  const lo = Math.min(...steps), hi = Math.max(...steps);
  ok("no stalls and no cliffs", lo > 0.05 && hi < 0.14,
     "every tenth of the shroud takes " + (lo * 100).toFixed(0) + "–" + (hi * 100).toFixed(0) +
     "% of him — raw value noise ran 0% then 24% in the same span, and looked it");
  ok("the sweep finishes on its own", C[C.length - 2].covered > 0.98,
     "the front is done before the backstop is asked for anything");

  console.log("\n==========================================================");
  console.log((fail ? "FAIL — " + fail + " failed, " : "PASS — ") + pass + " checks");
  console.log("contact sheet: _shroud.png");
  process.exit(fail ? 1 : 0);
})();
