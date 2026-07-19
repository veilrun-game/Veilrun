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
      const loadScene = (sc) => { imgOver.src = sc.over; imgUnder.src = sc.under; };
      loadScene(SEAM_SCENES[0]);

      // Scene tabs — swap the paired art, keep the drag position.
      root.querySelectorAll(".ss-tab").forEach(btn => {
        btn.addEventListener("click", () => {
          const sc = SEAM_SCENES.find(s => s.id === btn.dataset.scene);
          if (!sc) return;
          root.querySelectorAll(".ss-tab").forEach(b => b.classList.toggle("on", b === btn));
          loadScene(sc);
        });
      });

      // ---- Seam shrapnel: glowing shards fling off the seam as it's dragged. ----
      const canvas = root.querySelector("#ss-fx");
      const ctx = canvas.getContext("2d");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let parts = [], raf = null, lastX = null;
      const sizeCanvas = () => {
        const r = slider.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = r.width * dpr; canvas.height = r.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return r;
      };
      const spawn = (xPct, dir, r) => {
        if (reduce) return;
        const x = (xPct / 100) * r.width;
        const n = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
          const up = Math.random() < 0.5 ? -1 : 1;
          parts.push({
            x, y: Math.random() * r.height,
            vx: dir * (0.6 + Math.random() * 2.6) + (Math.random() - 0.5),
            vy: up * (0.4 + Math.random() * 2.2),
            life: 1, decay: 0.018 + Math.random() * 0.03,
            size: 1.2 + Math.random() * 2.6,
            hue: Math.random() < 0.35 ? 0 : 288 + Math.random() * 22 // white flecks + violet/magenta
          });
        }
      };
      const tick = () => {
        const r = { width: canvas.width / (Math.min(window.devicePixelRatio || 1, 2)), height: canvas.height / (Math.min(window.devicePixelRatio || 1, 2)) };
        ctx.clearRect(0, 0, r.width, r.height);
        ctx.globalCompositeOperation = "lighter";
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.985; p.life -= p.decay;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          const a = p.life, s = p.size * p.life;
          const col = p.hue === 0 ? `rgba(255,255,255,${a})` : `hsla(${p.hue},90%,68%,${a})`;
          ctx.shadowBlur = 10; ctx.shadowColor = col; ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.2, s), 0, 6.283); ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
        if (parts.length) { raf = requestAnimationFrame(tick); } else { raf = null; }
      };

      let dragging = false, curR = null;
      const setPos = (clientX) => {
        curR = slider.getBoundingClientRect();
        let pct = Math.max(0, Math.min(100, ((clientX - curR.left) / curR.width) * 100));
        const prev = parseFloat(slider.style.getPropertyValue("--pos")) || 50;
        slider.style.setProperty("--pos", pct + "%");
        if (dragging && Math.abs(pct - prev) > 0.15) {
          const r = sizeCanvas();
          spawn(pct, pct >= prev ? 1 : -1, r);
          if (!raf) raf = requestAnimationFrame(tick);
        }
      };
      const down = e => { dragging = true; sizeCanvas(); setPos(e.clientX); e.preventDefault(); };
      const move = e => { if (dragging) setPos(e.clientX); };
      const up = () => { dragging = false; };
      slider.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      sliderBound = { move, up };
      fx = () => { if (raf) cancelAnimationFrame(raf); raf = null; parts = []; };
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
    if (sliderBound) { window.removeEventListener("pointermove", sliderBound.move); window.removeEventListener("pointerup", sliderBound.up); sliderBound = null; }
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
