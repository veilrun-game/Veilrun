/* VEILRUN — Reusable render helpers. Return HTML strings. Presentation only. */
window.VC = (function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));

  const seam = () => `<hr class="seam" />`;
  const sectionHeader = (eyebrow, title) =>
    `<p class="eyebrow">${esc(eyebrow)}</p><h1 class="display">${esc(title)}</h1>`;
  const feedbackButton = (context) =>
    `<button class="fb" onclick="VApp.feedback('${esc(context)}')">＋ Feedback${context ? ": " + esc(context) : ""}</button>`;

  const codenameChip = (c, pick) =>
    `<span class="chip${pick && c === pick ? " pick" : ""}">${esc(c)}${pick && c === pick ? " ✓" : ""}</span>`;

  const kitRow = (type, k) =>
    `<div class="kit-row"><span class="pill ${type}">${type}</span> <span class="name">${esc(k.name)}</span><div class="mute">${esc(k.text)}</div></div>`;
  const synItem = (s, accent) =>
    `<div class="syn" style="--accent:${accent}"><div class="syn-name">${esc(s.name)}</div><div class="mute">${esc(s.text)}</div></div>`;

  const imgTag = (src, alt) => src ? `<img class="card-img" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" />` : "";

  const characterCard = (ch) => `
    <div class="card" style="--accent:${ch.accent}" onclick="location.hash='#crew/${ch.id}'">
      ${imgTag(ch.img, ch.name)}
      <div class="body">
        <div class="accent-bar"></div>
        <h3>${esc(ch.name)}</h3>
        <div class="role">${esc(ch.role)} · ${esc(ch.player)}</div>
      </div>
    </div>`;

  const characterListRow = (ch) => `
    <div class="row" style="--accent:${ch.accent}" onclick="location.hash='#crew/${ch.id}'">
      ${ch.img ? `<img src="${esc(ch.img)}" alt="${esc(ch.name)}" loading="lazy" />` : `<span class="accent-dot"></span>`}
      <div><div class="nm">${esc(ch.name)}</div><div class="rl">${esc(ch.role)} · ${esc(ch.player)}</div></div>
      <span class="accent-dot"></span>
    </div>`;

  // status → {class, icon(svg), label}
  const ICONS = {
    prototyping: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>',
    idea:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
    direction:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    "default":   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>'
  };
  const statusPill = (status) => {
    const key = ICONS[status] ? status : "default";
    return `<span class="status ${key}">${ICONS[key]}${esc(status)}</span>`;
  };

  const modeCard = (m) => `
    <div class="panel modecard">
      ${statusPill(m.status)}
      <h3 style="margin:.7rem 0 .35rem">${esc(m.name)}</h3>
      <p class="mute">${esc(m.text)}</p>
      <p class="mute" style="font-size:.8rem;margin-top:.6rem">Characters: ${esc(m.chars)}</p>
      <div style="margin-top:.7rem">${feedbackButton("Mode: " + m.name)}</div>
    </div>`;

  return { esc, seam, sectionHeader, feedbackButton, codenameChip, kitRow, synItem, characterCard, characterListRow, modeCard, statusPill };
})();
