/* VEILRUN — Landing page (WIREFRAME). Structure + working interactions with placeholder art.
   view() returns HTML; init() wires scroll parallax, the seam-tear, and the Seam Slider drag.
   Real renders replace the .fill-* / .slot placeholders later. */
window.VLanding = (function () {
  let scrollBound = null, io = null, sliderBound = null;

  function slot(tag) { return `<div class="slot"><span class="slot-tag">${tag}</span></div>`; }

  function view() {
    const sils = Array.from({ length: 9 }, (_, i) =>
      `<div class="sil slot"><span class="slot-tag">SIL ${i + 1}</span></div>`).join("");
    return `
    <div id="landing">
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
          <div class="ss-layer ss-under fill-underweft"><span class="ss-tag">Underweft</span><span class="ss-slot">ASSET: paired scene — Underweft render</span></div>
          <div class="ss-layer ss-over fill-overcity"><span class="ss-tag">Overcity</span><span class="ss-slot">ASSET: paired scene — Overcity render (identical framing)</span></div>
          <div class="ss-divider"></div>
          <div class="ss-handle" id="ss-handle"></div>
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
          const shift = p * 55;
          if (hL) hL.style.transform = `translateX(${-shift}%)`;
          if (hR) hR.style.transform = `translateX(${shift}%)`;
          if (hS) hS.style.opacity = String(Math.min(1, p * 2));
        }
        ticking = false;
      });
    }
    scrollBound = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const slider = root.querySelector("#seam-slider");
    if (slider) {
      let dragging = false;
      const setPos = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        slider.style.setProperty("--pos", Math.max(0, Math.min(100, pct)) + "%");
      };
      const down = e => { dragging = true; setPos(e.clientX); e.preventDefault(); };
      const move = e => { if (dragging) setPos(e.clientX); };
      const up = () => { dragging = false; };
      slider.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      sliderBound = { move, up };
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
    if (io) { io.disconnect(); io = null; }
  }

  return { view, init, teardown };
})();
