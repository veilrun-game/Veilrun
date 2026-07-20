/* VEILRUN — Landing page (WIREFRAME). Structure + working interactions with placeholder art.
   view() returns HTML; init() wires scroll parallax, the seam-tear, and the Seam Slider drag.
   Real renders replace the .fill-* / .slot placeholders later. */
window.VLanding = (function () {
  let scrollBound = null, io = null, sliderBound = null, fx = null;

  // Paired scenes for the Seam Slider. Each is the SAME location in both worlds.
  // Market has real art; the others fall back to gradient placeholders until their renders land.
  const SEAM_SCENES = [
    { id: "market",    name: "Market Row",    over: "assets/landing/seam/market/overcity.png",    under: "assets/landing/seam/market/underweft.png" },
    { id: "boulevard", name: "The Grand Mile", over: "assets/landing/seam/boulevard/overcity.png", under: "assets/landing/seam/boulevard/underweft.png" },
    { id: "foundry",   name: "Foundry Row",   over: "assets/landing/seam/foundry/overcity.png",   under: "assets/landing/seam/foundry/underweft.png" }
  ];

  function slot(tag) { return `<div class="slot"><span class="slot-tag">${tag}</span></div>`; }

  function view() {
    const sils = Array.from({ length: 9 }, (_, i) =>
      `<div class="sil slot"><span class="slot-tag">SIL ${i + 1}</span></div>`).join("");
    return `
    <div id="landing">
      <div class="wf-note" id="wf-note">
        <div class="wf-note-card">
          <div class="wf-note-eyebrow">Concept preview</div>
          <h3>This page is a wireframe</h3>
          <p>You're looking at the structure and the interactions. The real art, animation, and copy will follow — this is here so we can shape the experience first.</p>
          <button class="btn" onclick="VLanding.dismissNote()">Got it — take a look</button>
        </div>
      </div>
      <div class="wf-banner">Landing · wireframe — interactions are live, art slots are labeled placeholders</div>

      <section class="hero">
        <div class="hero-layer hero-far"  data-speed="0.12"></div>
        <div class="hero-layer hero-mid"  data-speed="0.28"></div>
        <div class="hero-layer hero-city" data-speed="0.5"><div class="skyline"></div></div>
        <div class="hero-content">
          <p class="eyebrow">Concept preview</p>
          <h1 class="wordmark">VEIL<b>RUN</b></h1>
          <p class="hook">Two worlds are drifting apart. Nine are fluent in both.</p>
          <div class="hero-btns">
            <button class="btn" onclick="location.hash='#hub'">Enter</button>
            <button class="btn ghost" onclick="VApp.feedback('Landing page')">Request access</button>
          </div>
        </div>
        <div class="scrollcue">⌄</div>
      </section>

      <section class="tear" id="tear">
        <div class="tear-sticky">
          <div class="tear-half tear-left fill-overcity"><span class="tear-label">Overcity</span></div>
          <div class="tear-half tear-right fill-underweft"><span class="tear-label">Underweft</span></div>
          <div class="tear-seam"></div>
        </div>
      </section>

      <section class="lsection"><div class="lwrap">
        <p class="eyebrow">The premise</p>
        <p class="premise">Reality has two halves. If they finish splitting, the world we see <span class="mag">dies</span>. The crew are the only ones fluent in both.</p>
      </div></section>

      <section class="lsection"><div class="lwrap">
        <p class="eyebrow">One place, both worlds</p>
        <h2>The Seam Slider</h2>
        <div class="seam-slider" id="seam-slider">
          <div class="ss-layer ss-under fill-underweft">
            <img class="ss-real" id="ss-img-under" alt="" />
            <span class="ss-tag">Underweft</span>
          </div>
          <div class="ss-layer ss-over fill-overcity">
            <img class="ss-real" id="ss-img-over" alt="" />
            <span class="ss-tag">Overcity</span>
          </div>
          <canvas class="ss-fx" id="ss-fx"></canvas>
          <div class="ss-divider"></div>
          <div class="ss-handle" id="ss-handle"></div>
        </div>
        <div class="ss-tabs" id="ss-tabs" role="tablist">
          ${SEAM_SCENES.map((s, i) =>
            `<button class="ss-tab${i === 0 ? " on" : ""}" data-scene="${s.id}" role="tab">${s.name}</button>`).join("")}
        </div>
        <p class="ss-hint">Drag the seam — same location, wiped between the two worlds.</p>
      </div></section>

      <section class="lsection"><div class="lwrap">
        <p class="eyebrow">The Last Fluent</p>
        <h2>Nine, fluent in both</h2>
        <div class="crew-row" id="crew-row">${sils}</div>
      </div></section>

      <section class="lcta"><div class="lwrap">
        <p class="eyebrow">Built in the open</p>
        <h2>Come help shape it.</h2>
        <div class="hero-btns">
          <button class="btn" onclick="location.hash='#hub'">Sign in</button>
          <button class="btn ghost" onclick="VApp.feedback('Landing page')">Share a thought</button>
        </div>
      </div></section>
    </div>`;
  }

  function init() {
    teardown();
    const root = document.getElementById("landing");
    if (!root) return;
    // One-time-per-session wireframe notice.
    const note = root.querySelector("#wf-note");
    if (note && !sessionStorage.getItem("vr_wf_note")) note.classList.add("show");
    const layers = [...root.querySelectorAll(".hero-layer")];
    const tear = root.querySelector("#tear");
    const hL = root.querySelector(".tear-left"), hR = root.querySelector(".tear-right"), hS = root.querySelector(".tear-seam");
    let ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        layers.forEach(l => { const s = parseFloat(l.dataset.speed || "0"); l.style.transform = `translateY(${y * s}px)`; });
        if (tear) {
          const r = tear.getBoundingClientRect();
          const denom = (r.height - window.innerHeight) || 1;
          const p = Math.min(1, Math.max(0, -r.top / denom));
          const eased = p * p * (3 - 2 * p); // smoothstep for a less linear feel
          const shift = eased * 58;
          if (hL) hL.style.transform = `translateX(${-shift}%)`;
          if (hR) hR.style.transform = `translateX(${shift}%)`;
          if (hS) {
            // The seam widens and glows brighter as the worlds pull apart.
            hS.style.opacity = String(Math.min(1, eased * 2.2));
            hS.style.width = (3 + eased * 15) + "px";
            hS.style.boxShadow = `0 0 ${20 + eased * 46}px ${2 + eased * 7}px rgba(214,92,220,${0.45 + eased * 0.45})`;
          }
        }
        ticking = false;
      });
    }
    scrollBound = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const slider = root.querySelector("#seam-slider");
    if (slider) {
      const imgOver = root.querySelector("#ss-img-over");
      const imgUnder = root.querySelector("#ss-img-under");
      // Load a scene's paired art. Missing files fall back to the gradient placeholder
      // (hide the <img> instead of removing it, so tab-switching can re-point src later).
      const bindImg = (el) => {
        el.onload = () => el.classList.remove("ss-missing");
        el.onerror = () => el.classList.add("ss-missing");
      };
      bindImg(imgOver); bindImg(imgUnder);
      // Scene load with a soft crossfade (fade current out, swap src, fade new in).
      let swapTimer = null;
      const loadScene = (sc, initial) => {
        const apply = () => { imgOver.src = sc.over; imgUnder.src = sc.under; slider.classList.remove("ss-swapping"); };
        if (initial) { apply(); return; }
        slider.classList.add("ss-swapping");
        clearTimeout(swapTimer);
        swapTimer = setTimeout(apply, 180);
      };
      loadScene(SEAM_SCENES[0], true);

      // Scene tabs — crossfade to the paired art, keep the drag position.
      root.querySelectorAll(".ss-tab").forEach(btn => {
        btn.addEventListener("click", () => {
          const sc = SEAM_SCENES.find(s => s.id === btn.dataset.scene);
          if (!sc || btn.classList.contains("on")) return;
          root.querySelectorAll(".ss-tab").forEach(b => b.classList.toggle("on", b === btn));
          loadScene(sc);
        });
      });

      // ---- Seam energy: while held, the line stays alive — pulses + throws sparks. ----
      const canvas = root.querySelector("#ss-fx");
      const ctx = canvas.getContext("2d");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      let parts = [], raf = null, rect = null, active = false, curPct = 50;
      const sizeCanvas = () => {
        rect = slider.getBoundingClientRect();
        canvas.width = rect.width * DPR; canvas.height = rect.height * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      };
      // Pre-render glow once as sprites — stamping them with drawImage is far cheaper
      // than setting ctx.shadowBlur on every particle every frame (that was the stutter).
      const makeGlow = (r, g, b) => {
        const c = document.createElement("canvas"); c.width = c.height = 32;
        const gx = c.getContext("2d"), grd = gx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grd.addColorStop(0, `rgba(${r},${g},${b},0.9)`); grd.addColorStop(0.4, `rgba(${r},${g},${b},0.32)`); grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        gx.fillStyle = grd; gx.fillRect(0, 0, 32, 32); return c;
      };
      // Veilrun palette: white, violet, magenta, teal — each a glow sprite + a bright core.
      const PAL = [
        { glow: makeGlow(255, 255, 255), core: "255,255,255" },
        { glow: makeGlow(180, 130, 255), core: "210,175,255" },
        { glow: makeGlow(232, 110, 222), core: "244,155,236" },
        { glow: makeGlow(90, 220, 210),  core: "158,242,228" }
      ];
      const pick = () => { const r = Math.random(); return r < 0.32 ? PAL[0] : r < 0.56 ? PAL[1] : r < 0.78 ? PAL[2] : PAL[3]; };
      const shard = (x, big) => ({
        x: x + (Math.random() - 0.5) * (big ? 4 : 6),
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * (big ? 3.0 : 4.4),
        vy: (Math.random() - 0.5) * (big ? 4.6 : 6.0),
        life: 1,
        decay: (big ? 0.02 : 0.045) + Math.random() * 0.02,
        size: big ? 1.2 + Math.random() * 2.0 : 0.4 + Math.random() * 0.8,
        pal: pick(),
        jit: big ? 0.3 : 0.55   // gentle erratic wander
      });
      const emit = (xPct, count, bigRatio) => {
        if (reduce || !rect || parts.length > 220) return;
        const x = (xPct / 100) * rect.width;
        for (let i = 0; i < count; i++) parts.push(shard(x, Math.random() < bigRatio));
      };
      const loop = () => {
        if (!rect) { raf = null; return; }
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (active) emit(curPct, 3, 0.62);   // steady trickle while held — alive even when stationary
        ctx.globalCompositeOperation = "lighter";
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.vx += (Math.random() - 0.5) * p.jit; p.vy += (Math.random() - 0.5) * p.jit;
          p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.vx *= 0.95; p.life -= p.decay;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          const a = Math.min(1, p.life * 1.4), s = Math.max(0.4, p.size * p.life);
          const sp = Math.hypot(p.vx, p.vy), len = s * 2 + sp * 3; // longer when moving faster
          const gd = (len + s * 3) * 1.7;            // glow sprite size
          ctx.globalAlpha = a * 0.8;
          ctx.drawImage(p.pal.glow, p.x - gd / 2, p.y - gd / 2, gd, gd);
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgba(${p.pal.core},1)`;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(-s * 0.8, s * 0.8); ctx.lineTo(-s * 0.8, -s * 0.8); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        raf = (active || parts.length) ? requestAnimationFrame(loop) : null;
      };
      const setPos = (clientX) => {
        if (!rect) sizeCanvas();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const d = Math.abs(pct - curPct);
        curPct = pct;
        slider.style.setProperty("--pos", pct + "%");
        if (active && d > 0.4) emit(pct, 3 + Math.min(9, d * 1.4 | 0), 0.78); // burst scales with drag speed
      };
      const down = e => {
        active = true; slider.classList.add("ss-live"); sizeCanvas();
        curPct = parseFloat(slider.style.getPropertyValue("--pos")) || 50;
        setPos(e.clientX); if (!raf) raf = requestAnimationFrame(loop); e.preventDefault();
      };
      const move = e => { if (active) setPos(e.clientX); };
      const up = () => { active = false; slider.classList.remove("ss-live"); };
      const onResize = () => { rect = null; }; // re-measure lazily on next drag
      slider.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("resize", onResize);
      sliderBound = { move, up, resize: onResize };
      fx = () => { if (raf) cancelAnimationFrame(raf); raf = null; parts = []; active = false; slider.classList.remove("ss-live"); clearTimeout(swapTimer); };
    }

    const sils = root.querySelectorAll(".sil");
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.2 });
      sils.forEach((s, i) => { s.style.transitionDelay = (i * 60) + "ms"; io.observe(s); });
    } else { sils.forEach(s => s.classList.add("in")); }
  }

  function teardown() {
    if (scrollBound) { window.removeEventListener("scroll", scrollBound); scrollBound = null; }
    if (sliderBound) { window.removeEventListener("pointermove", sliderBound.move); window.removeEventListener("pointerup", sliderBound.up); window.removeEventListener("resize", sliderBound.resize); sliderBound = null; }
    if (fx) { fx(); fx = null; }
    if (io) { io.disconnect(); io = null; }
  }

  function dismissNote() {
    const n = document.getElementById("wf-note");
    if (n) n.classList.remove("show");
    try { sessionStorage.setItem("vr_wf_note", "1"); } catch (e) {}
  }

  return { view, init, teardown, dismissNote };
})();
