/* VEILRUN — App shell: soft-gate check, hash router, view renderers. */
window.VApp = (function () {
  const D = window.VEILRUN, C = window.VC;
  // Split an update into a short title + blurb: use an explicit u.title, else the first sentence/colon.
  function updParts(u) {
    if (u.title) return { title: u.title, body: u.text || "" };
    const t = String(u.text || "");
    const m = t.match(/^([\s\S]{6,90}?[.:!])\s+([\s\S]+)$/);
    return m ? { title: m[1].replace(/[.:!]$/, ""), body: m[2] } : { title: t, body: "" };
  }
  const view = () => document.getElementById("view");

  function requireGate() {
    if (sessionStorage.getItem("vr_ok") === "1") return true;
    // A signed-in account is real auth — let them into any tab (e.g. opening a game link in a new tab)
    // and remember it for this tab, instead of bouncing back through the passphrase gate.
    if (localStorage.getItem("vr_account")) { sessionStorage.setItem("vr_ok", "1"); return true; }
    window.location.href = "index.html"; return false;
  }

  // Crew view mode persists
  const getCrewView = () => localStorage.getItem("vr_crewview") || "tiles";
  function setCrewView(v) { localStorage.setItem("vr_crewview", v); views_render_crew(); }

  /* ---------------------------------------------------------------- weekly digest hero
     VR-97. Renders VEILRUN.weekly at the top of the Updates page — 107 entries in
     reverse-chronological order is a log, not a summary, and nobody catching up reads it.

     THE WHOLE DESIGN IS THE FALLBACK. A Friday task overwrites VEILRUN.weekly and one
     week it will quietly stop doing that. So this returns "" — not a stub, not an empty
     frame, not "no summary this week" — whenever the object is absent, missing anything
     required, or gone stale, and views.updates() then renders exactly the page it
     rendered before this feature existed. A stale summary is worse than none: it tells
     the crew a confident, wrong story about where the project is.
     Optional fields degrade one at a time rather than sinking the hero with them, and
     every one is filtered on truthiness before it reaches the markup, so a half-written
     object can't leak `undefined` into the page.
     Every state is proven headlessly in _updatescheck.js. */
  const WEEKLY_MAX_AGE_DAYS = 14;
  // Local-midnight parse of a YYYY-MM-DD string; null if it isn't one. Matches the date
  // handling already used for updates[] — never `new Date(str)`, which reads as UTC and
  // can shift the day either side of the staleness cliff depending on the reader's zone.
  function weeklyDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) ? dt : null;
  }
  const weeklyStr = (v) => (typeof v === "string" && v.trim()) ? v.trim() : "";

  function weeklyAgeDays(w, now) {
    const end = weeklyDate(w && w.weekEnding);
    if (!end) return null;
    const today = new Date((now || new Date()).getFullYear(), (now || new Date()).getMonth(), (now || new Date()).getDate());
    return Math.round((today - end) / 864e5);
  }

  function weeklyHero(now) {
    const w = D.weekly;
    if (!w || typeof w !== "object" || Array.isArray(w)) return "";
    const headline = weeklyStr(w.headline), blurb = weeklyStr(w.blurb);
    if (!headline || !blurb) return "";
    const age = weeklyAgeDays(w, now);
    if (age === null) return "";
    if (age > WEEKLY_MAX_AGE_DAYS) return "";
    // A weekEnding well in the future means the generator wrote a bad date, not that we
    // are early. Small skew is tolerated so a timezone can't blank the hero on a Friday.
    if (age < -7) return "";

    const start = weeklyDate(w.weekStart), end = weeklyDate(w.weekEnding);
    const dm = { month: "short", day: "numeric" };
    const range = (start && start < end)
      ? start.toLocaleDateString(undefined, dm) + " – " + end.toLocaleDateString(undefined, dm)
      : "Week to " + end.toLocaleDateString(undefined, dm);

    const metrics = (Array.isArray(w.metrics) ? w.metrics : [])
      .filter(m => m && weeklyStr(m.label) && (weeklyStr(m.value) || typeof m.value === "number"))
      .slice(0, 4)
      .map(m => `<li class="wk-metric"><span class="wk-n">${C.esc(String(m.value))}</span><span class="mute">${C.esc(m.label)}</span></li>`)
      .join("");

    const links = (Array.isArray(w.highlights) ? w.highlights : [])
      .filter(h => h && weeklyStr(h.label) && weeklyStr(h.href))
      .slice(0, 4)
      .map(h => `<a class="btn ghost wk-link" href="${C.esc(h.href.trim())}">${C.esc(h.label.trim())}</a>`)
      .join("");

    const imgSrc = w.image && weeklyStr(w.image.src);
    const art = imgSrc
      ? `<figure class="wk-art"><img src="${C.esc(imgSrc)}" alt="${C.esc((w.image && weeklyStr(w.image.alt)) || headline)}" loading="lazy" /></figure>`
      : "";

    return `<section class="wk" aria-labelledby="wk-h">
          <div class="wk-main">
            ${art}
            <div class="wk-txt">
              <p class="eyebrow">This week · ${C.esc(range)}</p>
              <h2 class="wk-head" id="wk-h">${C.esc(headline)}</h2>
              <p class="wk-blurb">${C.esc(blurb)}</p>
              ${links ? `<div class="wk-links">${links}</div>` : ""}
            </div>
          </div>
          ${metrics ? `<ul class="wk-metrics">${metrics}</ul>` : ""}
          <button type="button" class="wk-skip" onclick="VApp.wkSkip()">Skip to the full log ↓</button>
        </section>`;
  }

  const views = {
    /* The personalised hub (VR-86). Renders three user states from hubData; see the
       HUB block above for how that's derived. Falls back to hubV0() — the original
       one-size-fits-all hub, kept rather than deleted — via ?v0 or #hub/v0. */
    hub() {
      if (location.hash.indexOf("/v0") > -1 || localStorage.getItem("vr_hub_v0") === "1") return views.hubV0();

      const h = hubData || { type: hubUserType(), lastSeen: null, unseen: null, waiting: [] };
      const isNew = h.type === "new", isCrew = h.type === "crew";
      const unseen = isNew ? null : (h.unseen || []);
      const caughtUp = unseen !== null && unseen.length === 0;
      const latest = D.updates[0];
      const cover = D.cover || "assets/img/cover.webp";
      const heroImg = isNew ? cover : ((latest && latest.img) || cover);
      const top = (h.waiting && h.waiting[0]) || null;
      const fmtD = s => { const [y, m, d] = String(s).split("-").map(Number);
        return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };

      /* ---- hero ---------------------------------------------------------------- */
      let eyebrow, title, sub, ctaL, ctaH, altL, altH;
      if (isNew) {
        eyebrow = "First time here";
        title = "Ten friends are building a game. This is where it's up to.";
        sub = "Nothing here needs an account and nothing is finished. Have a look around, play one thing, and tell us what didn't make sense — that's genuinely the job.";
        ctaL = "Show me around ↓"; ctaH = "#hub"; altL = "Just let me play"; altH = "#games";
      } else if (isCrew && top) {
        eyebrow = "Waiting on you";
        title = top.campaign + " — " + top.note;
        sub = caughtUp ? "You're all caught up on updates — but this still needs you."
          : unseen.length + " thing" + (unseen.length > 1 ? "s" : "") + " landed while you were away, below.";
        ctaL = "Take a look →"; ctaH = top.href; altL = "Not now"; altH = "#updates";
      } else if (caughtUp) {
        eyebrow = "You're all caught up";
        title = "Nothing new since you were last here.";
        sub = latest ? "The last thing that landed was “" + updParts(latest).title + "” on " + fmtD(latest.date) + "." : "";
        ctaL = "Vote on a lieutenant →"; ctaH = "#threats"; altL = "Play a level"; altH = "#games";
      } else {
        eyebrow = "What's new";
        title = latest ? updParts(latest).title : "Welcome back";
        sub = latest ? fmtD(latest.date) + " · " + unseen.length + " update" + (unseen.length > 1 ? "s" : "") + " since you were last here." : "";
        ctaL = (latest && latest.cta && latest.cta.label) || "Read it →";
        ctaH = (latest && latest.cta && latest.cta.href) || "#updates";
        altL = "See everything"; altH = "#updates";
      }
      const heroZone = `
        <section class="hcard z-hero">
          <div>
            <p class="eyebrow">${C.esc(eyebrow)}</p>
            <h2>${C.esc(title)}</h2>
            <p class="hero-sub">${C.esc(sub)}</p>
            <div class="hero-btns">
              <a class="btn" href="${C.esc(ctaH)}">${C.esc(ctaL)}</a>
              <a class="btn ghost" href="${C.esc(altH)}">${C.esc(altL)}</a>
            </div>
          </div>
          <div class="hero-art"><img src="${C.esc(heroImg)}" alt="" loading="lazy" /></div>
        </section>`;

      /* ---- since you last signed in (never rendered on a first visit) ----------- */
      let bandZone = "";
      if (!isNew) {
        if (caughtUp) {
          bandZone = `
            <section class="hcard z-band">
              <div class="band-head"><div>
                <p class="eyebrow">Since you last signed in</p>
                <h3 class="zone caught"><span class="tick">✓</span> You're all caught up</h3>
              </div></div>
              <p class="hmore mute">${isCrew && top ? "Nothing new landed — so here's what still needs you, above."
                : "Last update was “" + C.esc(updParts(latest).title) + "”, " + C.esc(fmtD(latest.date)) + "."}</p>
            </section>`;
        } else {
          const rows = unseen.slice(0, HUB_CAP).map(u => {
            const p = updParts(u), g = (u.games || [])[0];
            return `<li><span class="hdot"></span>
              <span><span class="f-title">${C.esc(p.title)}</span><br>
              <span class="f-meta">${C.esc(fmtD(u.date))}${g ? " · " + C.esc(g) : ""}</span></span>
              <a class="f-jump" href="${g ? "#games/" + C.esc(g) : "#updates"}">Jump →</a></li>`;
          }).join("");
          bandZone = `
            <section class="hcard z-band">
              <div class="band-head">
                <div><p class="eyebrow">Since you last signed in</p>
                <h3 class="zone">You missed ${unseen.length} thing${unseen.length > 1 ? "s" : ""}${unseen.length > HUB_CAP ? " — here's the shape of it" : ""}</h3></div>
                <div class="band-n">${unseen.length}</div>
              </div>
              <ul class="hfeed">${rows}</ul>
              <p class="hmore mute">${unseen.length > HUB_CAP
                ? `<a href="#updates">See all ${unseen.length} →</a> · capped at ${HUB_CAP} so the page stays readable`
                : "That's everything."}</p>
            </section>`;
        }
      }

      /* ---- waiting on you (crew only), grouped by campaign ---------------------- */
      let waitZone = "";
      if (isCrew && h.waiting && h.waiting.length > 1) {
        waitZone = `<section class="hcard z-wait"><h3 class="zone">Also waiting on you</h3>
          ${h.waiting.slice(1).map(c => `<div class="campaign">
            <p class="eyebrow">${C.esc(c.campaign)}</p>
            <ul class="htodo">${c.items.map(i =>
              `<li><span>${C.esc(i.label)} <span class="htag ${C.esc(c.tag)}">${C.esc(c.tag)}</span></span><a href="${C.esc(i.href)}">Open →</a></li>`).join("")}</ul>
          </div>`).join("")}</section>`;
      }

      /* ---- get started (extensions only) --------------------------------------- */
      const startZone = (!isCrew && !isNew) ? `
        <section class="hcard z-start">
          <p class="eyebrow">One thing you could do</p>
          <h3 class="zone">Pick something small</h3>
          <ul class="htodo">
            <li><span>React to the newest art <span class="htag">30 sec</span></span><a href="#gallery">Open →</a></li>
            <li><span>Vote on a lieutenant <span class="htag vote">1 min</span></span><a href="#threats">Vote →</a></li>
            <li><span>Play one level <span class="htag play">3 min</span></span><a href="#games">Play →</a></li>
          </ul>
          <p class="hmore mute">No pressure and nothing to keep up with — dip in whenever.</p>
        </section>` : "";

      /* ---- orientation + gallery (first visit only) ----------------------------- */
      let orientZone = "", galZone = "";
      if (isNew) {
        const nLevels = (() => { let n = 0; const walk = x => { if (Array.isArray(x)) return x.forEach(walk);
          if (!x || typeof x !== "object") return; if (Array.isArray(x.levels)) n += x.levels.length; Object.values(x).forEach(walk); };
          walk(D.games || []); return n; })();
        orientZone = `
          <section class="hcard z-orient">
            <p class="eyebrow">Where the project is right now</p>
            <h3 class="zone">There's already a lot to look at</h3>
            <div class="statstrip">
              <div class="hstat"><b>${(D.crew || []).length}</b><span>crew, one each</span></div>
              <div class="hstat"><b>${(D.games || []).length}</b><span>kinds of game</span></div>
              <div class="hstat"><b>${nLevels}</b><span>levels playable</span></div>
              <div class="hstat"><b>${(D.updates || []).length}</b><span>updates shipped</span></div>
            </div>
            <p class="orient-p">Veilrun is a game Jordan and nine friends are building in the open. Everyone has a character based on them — their kit, their look, their name in the lore.</p>
            <p class="orient-p">They're a crew, and they fight like one. The rule the whole thing is built on is that <strong>nobody is dead weight</strong>: every character can carry a situation on their own, so teaming up is a choice rather than a crutch. Put the right two together and you get something neither of them has alone — and it costs you, because the bigger the combination, the more it drains the world around it.</p>
            <p class="orient-p">Three sorts of game exist so far — <strong>2D pair levels</strong> built around those combinations, a branching <strong>story chapter</strong>, and a <strong>3D wave arena</strong>. All of it is prototype-grade and all of it is meant to be argued with.</p>
            <ol class="hpath">
              <li><span>Meet the crew<span class="why">Ten characters, ten people. Start with whoever you know.</span></span><a class="go" href="#crew">Open →</a></li>
              <li><span>Play one level<span class="why">Three minutes, and it shows you how the pairing works immediately.</span></span><a class="go" href="#games">Play →</a></li>
              <li><span>Tell us what didn't make sense<span class="why">Genuinely the most useful thing you can do — whole releases have come from notes like that.</span></span><a class="go" href="#feedback">Leave a note →</a></li>
            </ol>
          </section>`;
        const art = hubTopArt(4);
        galZone = `
          <section class="hcard z-gallery">
            <p class="eyebrow">The art so far</p>
            <h3 class="zone">Most-liked right now</h3>
            <div class="galgrid">${art.map(a =>
              `<figure><img loading="lazy" src="${C.esc(a.src)}" alt="${C.esc(a.who)}" /><figcaption>${C.esc(a.who)}</figcaption></figure>`).join("")}</div>
            <p class="hmore mute">Hundreds more across the ten galleries — every image is likeable.</p>
          </section>`;
      }

      /* ---- crew ---------------------------------------------------------------- */
      const crewZone = isNew
        ? `<section class="hcard z-crew"><h3 class="zone">Who you're looking at</h3>
             <p class="mute" style="font-size:.9rem">Every character is one of the ten. Tap any of them to meet the person behind it.</p>
             <div class="roster">${(D.crew || []).map(c =>
               `<a class="pip" style="background:${C.esc(c.accent || "var(--violet)")}" href="#crew/${C.esc(c.id)}" title="${C.esc(c.name)}">${C.esc(c.name[0])}</a>`).join("")}</div>
           </section>`
        : `<section class="hcard z-crew"><h3 class="zone">The crew</h3>
             <p class="mute" style="font-size:.9rem">Ten characters, ten of us. See where everyone stands.</p>
             <div class="roster">${(D.crew || []).map(c =>
               `<a class="pip" style="background:${C.esc(c.accent || "var(--violet)")}" href="#crew/${C.esc(c.id)}" title="${C.esc(c.name)}">${C.esc(c.name[0])}</a>`).join("")}</div>
             <p class="hmore"><a href="#leaderboard">Open the leaderboard →</a></p>
           </section>`;

      const jumpSet = isNew
        ? [["#crew", "Start with the crew", "Who everyone is"], ["#games", "Play something", "No sign-up needed"],
           ["#gallery", "Browse the art", "Hundreds of pieces"], ["#world", "Read the world", "What the Veil is"],
           ["#updates", "See what's shipped", "The build log"], ["#feedback", "Ask a question", "We answer"]]
        : [["#crew", "Crew", "10 characters"], ["#world", "World", "Overcity & Underweft"], ["#games", "Games", "3 to play"],
           ["#lab", "Lab", "Ideas & votes"], ["#updates", "Updates", (D.updates || []).length + " shipped"], ["#board", "The Board", "What's next"]];
      const jumpZone = `<section class="hcard z-jump"><h3 class="zone">Jump</h3>
        <div class="jumpgrid">${jumpSet.map(([h2, k, d2]) =>
          `<a href="${h2}">${C.esc(k)}<span>${C.esc(d2)}</span></a>`).join("")}</div></section>`;

      /* Column split. Mobile dissolves these wrappers (display:contents) so source order
         stays the priority order; desktop makes each an independent flex stack. */
      return `<div class="wrap section">
        ${C.sectionHeader("Home base", isNew ? "Welcome to Veilrun" : "Welcome back")}
        <div class="hub2" style="margin-top:1.5rem">
          <div class="hcol">${heroZone}${orientZone}${bandZone}</div>
          <div class="hcol">${galZone}${waitZone}${startZone}${crewZone}</div>
          ${jumpZone}
        </div>
      </div>`;
    },

    hubV0() {
      const jumps = [
        ["#world","The World","The two layers, the Sundering, the factions."],
        ["#crew","The Last Fluent","The nine fluent in both. Kits, codenames, synergies."],
        ["#threats","Threats","The Severant and the roster."],
        ["#synergy","Synergy","The matrix + combo builder."],
        ["#gallery","Gallery","Every concept image, by category."],
        ["#games","Games","Everything playable — versions, levels, leaderboards."],
        ["#lab","The Lab","Game ideas, votes, and experiments."]
      ].map(([h,k,d]) => `<a href="${h}"><div class="k">${k}</div><div class="d">${C.esc(d)}</div></a>`).join("");
      const latest = D.updates[0];
      const parseD = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
      const dayN = d => Math.round(d.getTime() / 864e5);
      // Bucket relative to the NEWEST entry in the log (not wall-clock) so "recent" never goes stale to 0.
      const newestN = D.updates.reduce((mx, u) => Math.max(mx, dayN(parseD(u.date))), -Infinity);
      const daysBack = u => newestN - dayN(parseD(u.date)); // 0 = newest day
      const upd24 = D.updates.filter(u => daysBack(u) <= 0);        // the latest drop
      const updWeek = D.updates.filter(u => daysBack(u) < 7);       // within a week of it
      const updWeekOnly = updWeek.filter(u => daysBack(u) > 0);     // earlier that week
      const newestLabel = (() => { const d = D.updates.map(u => parseD(u.date)).sort((a, b) => b - a)[0];
        return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""; })();
      const uRow = u => { const p = updParts(u); return `<div class="kit-row"><span class="mute" style="font-size:.8rem">${C.esc(u.date)}</span><div><strong style="color:var(--white)">${C.esc(p.title)}</strong>${p.body ? `<br><span class="mute">${C.esc(p.body)}</span>` : ""}</div></div>`; };
      // Per-update call-to-action: each update can carry its own most-relevant CTA (e.g. play the new
      // game, meet a new character). Falls back to "Meet the crew" when an update sets none.
      const cta = latest && latest.cta;
      const ctaBtn = cta
        ? `<a class="btn" href="${C.esc(cta.href)}"${String(cta.href).startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>${C.esc(cta.label)}</a>`
        : `<a class="btn" href="#crew">Meet the crew</a>`;
      return `
        <section class="hub-hero wrap">
          ${C.sectionHeader("Home base","Welcome back, crew")}
          <div class="latest">
            ${D.cover ? `<img src="${C.esc(D.cover)}" alt="Veilrun" loading="lazy" />` : ""}
            <div class="l-body">
              <p class="eyebrow">Latest update · ${C.esc(latest.date)}</p>
              <h2 style="margin:.4rem 0">${C.esc(updParts(latest).title)}</h2>
              ${updParts(latest).body ? `<p class="mute" style="margin:.2rem 0 .6rem">${C.esc(updParts(latest).body)}</p>` : ""}
              <p class="mute">Dig in below, and react to anything — it only works if it's ours.</p>
              <div class="hero-btns">${ctaBtn} <button class="btn ghost" onclick="VApp.feedback('General thought','idea')">＋ Share a thought</button></div>
            </div>
          </div>
        </section>
        <div class="wrap">
          <div class="jump">${jumps}</div>
          ${C.seam()}
          <div class="dash-head"><h2 style="margin:0">Recently</h2><a class="btn ghost" href="#updates">See all updates →</a></div>
          <div class="dash-stats">
            <div class="dash-stat"><div class="dash-n">${upd24.length}</div><div class="mute">in the latest drop${newestLabel ? " · " + newestLabel : ""}</div></div>
            <div class="dash-stat"><div class="dash-n">${updWeek.length}</div><div class="mute">in the last week of changes</div></div>
          </div>
          <div class="panel" style="margin-top:1rem">
            <div class="eyebrow">Latest${newestLabel ? " · " + newestLabel : ""}</div>
            ${upd24.slice(0, 8).map(uRow).join("")}
            ${updWeekOnly.length ? `<hr class="seam" /><div class="eyebrow">Earlier this week</div>${updWeekOnly.slice(0, 6).map(uRow).join("")}` : ""}
          </div>
          <div class="panel" style="margin-top:1.5rem;border-color:var(--violet)">
            <div class="eyebrow">See what's next</div>
            <h3 style="margin:.3rem 0">The Board</h3>
            <p class="mute">A live look at what's in progress, up next, and done — where Veilrun is heading and what's coming. Have a look and tell us what to prioritize.</p>
            <div style="margin-top:.8rem"><a class="btn" href="#board">Open the board →</a></div>
          </div>
        </div>`;
    },

    characters() {
      const crew = D.crew || [], threats = D.threats || [];
      const villain = (D.world && D.world.villain) || null;
      const cover = D.cover || "assets/img/cover.webp";
      const threatBg = (threats[0] && threats[0].img) || cover;
      const crewCards = crew.map(c => `
        <a class="cp-card" href="#crew/${c.id}">
          <div class="cp-img" style="background-image:url('${C.esc(c.img)}')"></div>
          <div class="cp-meta"><div class="cp-name">${C.esc(c.name)}</div><div class="cp-role mute">${C.esc(c.role || "")}</div></div>
        </a>`).join("");
      const threatCards = threats.slice(0, 8).map(t => `
        <a class="cp-card" href="#threats/${t.id}">
          <div class="cp-img" style="background-image:url('${C.esc(t.img || cover)}')"></div>
          <div class="cp-meta"><div class="cp-name">${C.esc(t.name)}</div><div class="cp-role mute">${C.esc(t.tier || "")}</div></div>
        </a>`).join("");
      return `<div class="wrap section chars-page">
        ${C.sectionHeader("The cast","Characters")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">The people you play — and the forces against them. Meet the crew fluent in both worlds, and the threats trying to finish the split.</p>
        <div class="chero-split">
          <a class="chero-panel" href="#crew" style="background-image:linear-gradient(180deg,rgba(11,8,24,.25),rgba(11,8,24,.9)),url('${C.esc(cover)}')">
            <div><div class="eyebrow">The Last Fluent</div><div class="chero-cta">The nine playable crew →</div></div>
          </a>
          <a class="chero-panel" href="#threats" style="background-image:linear-gradient(180deg,rgba(11,8,24,.25),rgba(11,8,24,.9)),url('${C.esc(threatBg)}')">
            <div><div class="eyebrow">The Threats</div><div class="chero-cta">${villain ? C.esc(villain.name) + " &amp; the roster →" : "The roster →"}</div></div>
          </a>
        </div>

        ${C.seam()}
        <section class="chars-block">
          <div class="chars-block-head"><h2>The Last Fluent</h2><a class="btn ghost" href="#crew">Meet the full crew →</a></div>
          <p class="mute" style="max-width:62ch">Nine friends, each fluent in both realms — every one a distinct kit and codename. Tap anyone to dive in.</p>
          <div class="cp-grid">${crewCards}</div>
        </section>

        ${C.seam()}
        <section class="chars-block">
          <div class="chars-block-head"><h2>The Threats</h2><a class="btn ghost" href="#threats">See all threats →</a></div>
          ${villain ? `<div class="panel" style="border-color:var(--violet);margin:0 0 1rem"><div class="eyebrow">The Villain</div><h3 style="margin:.2rem 0">${C.esc(villain.name)}</h3><p class="mute">${C.esc(villain.text)}</p></div>` : ""}
          <div class="cp-grid">${threatCards}</div>
        </section>

        ${C.seam()}
        <section class="chars-block">
          <div class="chars-block-head"><h2>Synergy</h2><a class="btn ghost" href="#synergy">Explore the matrix →</a></div>
          <p class="mute" style="max-width:62ch">How the crew combine — pairs, auras, and the hive-mind. See who amplifies whom.</p>
        </section>
      </div>`;
    },

    world() {
      const w = D.world;
      const force = w.force.map(f => `<div class="panel"><div class="eyebrow">${C.esc(f.side)}</div><h3>${C.esc(f.name)}</h3><p class="mute">${C.esc(f.text)}</p></div>`).join("");
      const worldItems = (window.VEILRUN.galleryItems || []).filter(i => i.cat === "World");
      const layers = w.layers.map(l => {
        const slug = l.name.toLowerCase().replace("the ", "").replace(/\s+/g, "");
        // The layer's gallery already starts with the hero frame (…/01.webp is byte-identical to
        // l.img), so use the gallery when present and only fall back to l.img if there's no set —
        // otherwise the hero showed twice in the lightbox.
        const g = worldItems.filter(w => w.name === l.name).map(w => w.src);
        const imgs = (g.length ? g : (l.img ? [l.img] : [])).filter((v, i, a) => v && a.indexOf(v) === i);
        registerSet("world_" + slug, imgs.map(s => ({ src: s, name: l.name })));
        return `
        <div class="wlayer" style="--accent:var(--violet)" onclick="VApp.lbOpen('world_${slug}', 0)">
          ${l.img ? `<img src="${C.esc(l.img)}" alt="${C.esc(l.name)}" loading="lazy" />` : ""}
          <div class="wl-body">
            <div class="accent-bar"></div>
            <h3>${C.esc(l.name)}</h3>
            <div class="role">${C.esc(l.tag)}</div>
            <p class="mute">${C.esc(l.text)}</p>
            <span class="wl-count">${imgs.length} image${imgs.length === 1 ? "" : "s"} →</span>
          </div>
        </div>`;
      }).join("");
      const factions = w.factions.map(f => `<div class="kit-row"><span class="name">${C.esc(f.name)}</span> <span class="mute">${C.esc(f.text)}</span></div>`).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("Part One","The World")}
        <p class="mute" style="max-width:65ch;margin-top:1rem">${C.esc(w.premise)}</p>
        ${C.seam()}
        <h2>What it runs on</h2>
        <div class="grid cols-3" style="margin-top:1rem">${force}</div>
        ${C.seam()}
        <h2>The two layers</h2>
        <p class="mute" style="margin-top:.3rem">Tap a layer to page through its concept art.</p>
        <div class="grid cols-2" style="margin-top:1rem">${layers}</div>
        ${C.seam()}
        <h2>The Sundering</h2>
        <div class="panel" style="margin-top:1rem"><p class="mute">${C.esc(w.sundering)}</p></div>
        <div class="panel" style="margin-top:1rem;border-color:var(--violet)"><div class="eyebrow">The Villain</div><h3>${C.esc(w.villain.name)}</h3><p class="mute">${C.esc(w.villain.text)}</p></div>
        ${C.seam()}
        <h2>Factions</h2>
        <div class="panel" style="margin-top:1rem">${factions}</div>
        ${worldStrip()}
      </div>`;
    },

    crew() {
      const mode = getCrewView();
      const toggle = `<div class="view-toggle">
        <button class="${mode==='tiles'?'active':''}" onclick="VApp.crewView('tiles')">Tiles</button>
        <button class="${mode==='full'?'active':''}" onclick="VApp.crewView('full')">Full</button>
        <button class="${mode==='list'?'active':''}" onclick="VApp.crewView('list')">List</button>
      </div>`;
      let body;
      if (mode === "list") body = `<div class="crew-list">${D.crew.map(C.characterListRow).join("")}</div>`;
      else if (mode === "full") body = `<div style="margin-top:1.25rem">${D.crew.map(crewFullRow).join("")}</div>`;
      else body = `<div class="grid cols-4" style="margin-top:1.25rem">${D.crew.map(C.characterCard).join("")}</div>`;
      return `<div class="wrap section" id="crew-root">
        ${C.sectionHeader("Part Two","The Last Fluent")}
        <div class="toolbar"><p class="mute" style="margin:0">The crew — the last nine fluent in both realms. Tap a member for kit, codenames, and every synergy they're in.</p>${toggle}</div>
        ${body}
      </div>`;
    },

    character(id) {
      const ch = D.crew.find(c => c.id === id);
      if (!ch) return views.crew();
      const actives = ch.kit.actives.map(a => C.kitRow("active", a)).join("");
      const ult = ch.kit.ult ? C.kitRow("ult", ch.kit.ult) : "";
      const chips = ch.codenames.map(c => C.codenameChip(c, ch.pick)).join("");
      const pickNote = ch.pick ? `<p class="mute" style="font-size:.85rem;margin-top:.4rem">Current lean: <strong style="color:${ch.accent}">${C.esc(ch.pick)}</strong></p>` : "";
      const g = orderedGallery(ch.id);
      const raw = g.length ? g : (ch.img ? [ch.img] : []);
      // If the crew member set a custom order in their profile, respect it; otherwise float favorites up.
      const imgs = hasImgOrder(ch.id) ? raw : [...raw].sort((a, b) => (isGroupFav(b) ? 1 : 0) - (isGroupFav(a) ? 1 : 0));
      synGalleryState = { id: ch.id, imgs, i: 0 };
      // Structured synergies with the partner emphasized (same cards as the explorer)
      const S = D.synergy;
      const sUni = S.universal.filter(u => u.member === ch.id).map(cardUni);
      const sAura = S.auras.filter(a => a.members.includes(ch.id)).map(cardAura);
      const sPair = S.pairs.filter(p => p.a === ch.id || p.b === ch.id).map(p => cardPair(p, p.a === ch.id ? p.b : p.a));
      const sTrio = S.trios.filter(t => t.members.includes(ch.id)).map(cardTrio);
      let syn = "";
      if (sUni.length) syn += subhead("Field — helps everyone nearby") + sUni.join("");
      if (sAura.length) syn += subhead("Always-on bonds") + sAura.join("");
      syn += subhead("Paired techniques") + sPair.join("");
      if (sTrio.length) syn += subhead("Trios they anchor") + sTrio.join("");
      return `<div class="wrap section" style="--accent:${ch.accent}">
        <a href="#crew" class="mute" style="font-size:.85rem">← All crew</a>
        <div class="char-hero" style="margin:1rem 0">
          <div>${galleryViewer(ch)}</div>
          <div>
            <div class="eyebrow" style="color:${ch.accent}">${C.esc(ch.role)}</div>
            <h1 class="display" style="font-size:var(--fs-h1)">${C.esc(ch.name)}</h1>
            <p class="mute">"${C.esc(ch.alias)}" · ${C.esc(ch.player)}</p>
            <p style="max-width:52ch;margin-top:.8rem">${C.esc(ch.lore)}</p>
            <p class="mute" style="font-size:.8rem;margin-top:.8rem">${imgs.length} concept renders — flip through and ♥ the ones you like.</p>
            <div style="margin-top:1rem">${C.feedbackButton("Character: " + ch.name)}</div>
          </div>
        </div>
        ${C.seam()}
        <h2>Codenames</h2>
        <div style="margin:1rem 0">${chips}${pickNote}</div>
        <h2>Kit</h2>
        <div class="panel" style="margin:1rem 0">${C.kitRow("passive", ch.kit.passive)}${actives}${ult}</div>
        <h2>Synergies</h2>
        <div style="margin:1rem 0">${syn}</div>
      </div>`;
    },

    threats() {
      (D.threats || []).forEach(t => registerSet("threat_" + t.id, (t.gallery || []).map(s => ({ src: s, name: t.name }))));
      const mode = threatsState.view;
      const toggle = `<div class="view-toggle">
        <button class="${mode === 'tiles' ? 'active' : ''}" onclick="VApp.threatsView('tiles')">Tiles</button>
        <button class="${mode === 'full' ? 'active' : ''}" onclick="VApp.threatsView('full')">Full</button>
        <button class="${mode === 'list' ? 'active' : ''}" onclick="VApp.threatsView('list')">List</button>
      </div>`;
      let body;
      if (mode === "list") body = `<div class="crew-list">${D.threats.map(threatListRow).join("")}</div>`;
      else if (mode === "tiles") body = `<div class="grid cols-4" style="margin-top:1.25rem">${D.threats.map(threatCard).join("")}</div>`;
      else body = `<div style="margin-top:1.25rem">${D.threats.map(threatFullRow).join("")}</div>`;
      return `<div class="wrap section">
        ${C.sectionHeader("Part Three","Threats")}
        <div class="toolbar"><p class="mute" style="margin:0">The opposition — early concept art, leaning red so they read as other. Abilities aren't defined yet; drop ideas via feedback.</p>${toggle}</div>
        ${body}
      </div>`;
    },

    threat(id, sub) {
      const t = (D.threats || []).find(x => x.id === id);
      if (!t) return views.threats();
      const members = (D.threatMembers || {})[id] || [];
      // A member sub-page (#threats/<group>/<member>).
      if (sub) { const m = members.find(x => x.id === sub); if (m) return threatMemberPage(t, m); }
      registerSet("threat_" + t.id, (t.gallery || []).map(s => ({ src: s, name: t.name })));
      const thumbs = (t.gallery || []).map((s, idx) => `<img src="${C.esc(s)}" onclick="VApp.lbOpen('threat_${t.id}', ${idx})" alt="${C.esc(t.name)}" loading="lazy" />`).join("");
      const counter = (id === "lieutenants" && D.counters) ? counterVoteSection() : "";
      const hasRoster = members.length > 0;
      const roster = hasRoster ? `
        <div class="panel" style="margin-top:1rem">
          <div class="eyebrow">In this group — ${members.length}</div>
          <p class="mute" style="font-size:.85rem;margin:.3rem 0 .8rem">Each has its own page to build out. Tap in to read the concept and pitch its kit.</p>
          <div class="threat-roster">${members.map(m => threatMemberCard(t.id, m)).join("")}</div>
        </div>` : "";
      const ideas = `
        <div class="panel" style="margin-top:1rem;border-color:var(--magenta)">
          <div class="eyebrow">${hasRoster ? "Ideas for the group" : "Ideas for this enemy"}</div>
          <p class="mute" style="font-size:.85rem;margin:.3rem 0 0">${hasRoster ? "Speak to the collection as a whole — kit direction for the group, or pitch a brand-new member." : "This enemy's kit hasn't been designed yet — vote up what should stick."}</p>
          <div id="ideas-${t.id}" class="idea-list"><p class="mute" style="font-size:.85rem;margin:.5rem 0 0">Loading…</p></div>
          <div style="margin-top:.8rem">${C.feedbackButton("Enemy idea: " + t.name)}</div>
        </div>`;
      return `<div class="wrap section" style="--accent:var(--magenta)">
        <a href="#threats" class="mute" style="font-size:.85rem">← All threats</a>
        <div class="char-hero" style="margin:1rem 0">
          <div>${t.img ? `<img src="${C.esc(t.img)}" alt="${C.esc(t.name)}" style="border-radius:var(--radius);border:1px solid var(--line);cursor:zoom-in" onclick="VApp.lbOpen('threat_${t.id}', 0)" />` : ""}</div>
          <div>
            <div class="eyebrow">${C.esc(t.tier)}</div>
            <h1 class="display" style="font-size:var(--fs-h1)">${C.esc(t.name)}</h1>
            <p class="mute" style="margin-top:.3rem">Palette: ${C.esc(t.palette)}</p>
            <p style="max-width:52ch;margin-top:.8rem">${C.esc(t.desc)}</p>
          </div>
        </div>
        ${counter}
        ${roster}
        ${ideas}
        ${thumbs ? `<div class="gallery-strip" style="margin-top:1.5rem">${thumbs}</div>` : ""}
      </div>`;
    },

    synergy() {
      const mode = synState.mode;
      const tabs = `<div class="mode-tabs">
        <button class="${mode==='explore'?'active':''}" onclick="VApp.synMode('explore')">Explore one</button>
        <button class="${mode==='build'?'active':''}" onclick="VApp.synMode('build')">Build a combo</button>
      </div>`;
      const avatars = `<div class="avatars">${D.crew.map(ch => {
        const on = synState.sel.includes(ch.id);
        const img = ch.img ? `<img src="${C.esc(ch.img)}" alt="${C.esc(ch.name)}">` : "";
        return `<div class="avatar ${on?'on':''}" style="--accent:${ch.accent}" onclick="VApp.synPick('${ch.id}')"><div class="ring">${img}</div><div class="nm">${C.esc(ch.name)}</div></div>`;
      }).join("")}</div>`;
      const intro = mode==='explore'
        ? "Tap a crew member to see everyone they connect with — their bonds and paired techniques."
        : "Tap two or more to see what they unlock together — paired techniques, bonds, trios, and the full crew's convergence.";
      return `<div class="wrap section">
        ${C.sectionHeader("The System","Synergy")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">Everyone draws on the same current, so abilities chain — one person's output is another's input. ${C.esc(intro)}</p>
        ${tabs}
        ${avatars}
        <div class="syn-result" id="syn-result">${renderSynResult()}</div>
        <div style="margin-top:1.5rem" class="mute" style="font-size:.8rem">Big synergies drain the area thin, and the Weave remembers. Power has a price.</div>
      </div>`;
    },

    gallery() {
      const items = galleryAll();
      const f = galState.filters, sort = galState.sort;
      let filtered = f.size ? items.filter(i => f.has(i.cat)) : items;
      if (galState.favMode === "mine") filtered = filtered.filter(i => isLiked(i.src));
      else if (galState.favMode === "all") filtered = filtered.filter(i => likeAll.has(i.src));
      filtered = [...filtered];
      if (sort === "fav") filtered.sort((a, b) => (likeCount(b.src) - likeCount(a.src)) || (isLiked(b.src) ? 1 : 0) - (isLiked(a.src) ? 1 : 0) || catRank(a.cat) - catRank(b.cat));
      else filtered.sort((a, b) => catRank(a.cat) - catRank(b.cat)); // 'char' — grouped, A–Z
      registerSet("gallery", filtered.map(i => ({ src: i.src, name: i.name })));
      galState._filtered = filtered;
      const shown = filtered.slice(0, galState.limit);
      const hasMore = filtered.length > galState.limit;
      const cats = galCats();
      const count = f.size;
      const dd = `<div class="dropdown ${galState.dropdownOpen ? 'open' : ''}">
        <button class="dd-btn" onclick="VApp.galDropdown()">Filter${count ? ` · ${count}` : ""} ▾</button>
        <div class="dd-panel">
          <button class="dd-all" onclick="VApp.galSetAll()">Show all</button>
          ${cats.map(c => `<label class="dd-opt"><input type="checkbox" ${f.has(c) ? "checked" : ""} onchange="VApp.galToggleFilter('${C.esc(c)}')"> ${C.esc(c)}</label>`).join("")}
        </div>
      </div>`;
      const sortSel = `<select class="dd-sort" onchange="VApp.galSort(this.value)">
        <option value="char" ${sort === "char" ? "selected" : ""}>Sort: Character (A–Z)</option>
        <option value="fav" ${sort === "fav" ? "selected" : ""}>Sort: Favorites first</option>
      </select>`;
      const favMine = `<button class="dd-btn favtoggle ${galState.favMode === "mine" ? "active" : ""}" onclick="VApp.galFavMode('mine')" title="Only images you've liked">♥ My likes</button>`;
      const favAll = `<button class="dd-btn favtoggle ${galState.favMode === "all" ? "active" : ""}" onclick="VApp.galFavMode('all')" title="Images anyone in the group has liked">★ Liked by anyone</button>`;
      const emptyMsg = galState.favMode === "mine"
        ? "You haven't liked any images yet — tap ♥ on any image and they'll collect here."
        : galState.favMode === "all"
        ? "No likes from the group yet — be the first to ♥ something."
        : "No images match this filter.";
      const grid = shown.length
        ? shown.map((it, idx) => galItemHTML(it, idx, `VApp.lbOpen('gallery', ${idx})`)).join("")
        : `<p class="hint" style="grid-column:1/-1">${emptyMsg}</p>`;
      const more = hasMore ? `<div id="gal-more"><div id="gal-sentinel" style="height:1px"></div><div style="text-align:center;margin-top:1rem"><button class="btn ghost" onclick="VApp.galMore()">Load more</button></div></div>` : "";
      return `<div class="wrap section">
        ${C.sectionHeader("Part Three","Gallery")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">${items.length} renders, grouped by character. Filter to anyone, choose a sort, then narrow to <strong>♥ My likes</strong> or <strong>★ Liked by anyone</strong>. Tap any image for the big view — then <strong>▦ All</strong> for a resizable grid.</p>
        <div class="filters">${dd}${sortSel}${favMine}${favAll}</div>
        <div class="masonry" id="masonry">${grid}</div>
        ${more}
        <p class="mute" id="gal-count" style="text-align:center;margin-top:.8rem;font-size:.8rem">Showing ${shown.length} of ${filtered.length}</p>
      </div>`;
    },

    lab() {
      const ideas = D.modes || [];
      /* VR-94: the Lab is the ideas board again. Everything playable moved to #games,
         and the Lab keeps ONE compact section pointing at it — a summary and a button,
         not a second copy of the game cards. */
      const nPlay = (D.games || []).length;
      const nLevels = (D.games || []).reduce((n, g) =>
        n + g.versions.reduce((m, v) => m + v.combos.reduce((k, c) => k + c.levels.length, 0), 0), 0);
      /* VR-98: the top band is two panels side by side on desktop, stacked on mobile.
         Flex, not grid — css/hub.css records that grid couples panel heights and cost
         VR-86 three attempts. Each panel sizes itself. */
      const playSection = `
        <div class="lab-band">
          ${nPlay ? `<div class="panel lab-band-card">
            <div class="eyebrow">Playable now</div>
            <h3>${nPlay} game${nPlay === 1 ? "" : "s"}, ${nLevels} levels, live leaderboards</h3>
            <p class="mute">The prototypes have their own home — pick a game to get its versions, levels, controls and board in one place.</p>
            <a class="btn" href="#games">View playable games →</a>
          </div>` : ""}
          <div class="panel lab-band-card">
            <div class="eyebrow">Game reference</div>
            <h3>What we play, and what makes us stop</h3>
            <p class="mute">The games the crew actually plays — what we love about them, and the thing that makes us put them down. The second half is the one that shapes what we build.</p>
            <a class="btn" href="#reference">Open the reference →</a>
          </div>
        </div>`;
      const cta = `<div class="panel cta-card" onclick="VApp.feedback('New mode idea','idea')">
        <div class="eyebrow">Your turn</div>
        <h3 style="margin:.3rem 0">＋ Pitch a game mode</h3>
        <p class="mute">Got an idea for how Veilrun could play? Add it to the list.</p>
      </div>`;
      const cards = ideas.map(C.modeCard).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("The Lab","Game ideas, votes & experiments")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">This is the idea board: every concept for how Veilrun could play. Vote the ones you want, react, and pitch your own.</p>
        ${playSection}
        <div class="dash-head" style="margin-top:2rem"><h2 style="margin:0">Ideas &amp; experiments</h2><span class="mute" style="font-size:.85rem">${ideas.length} concepts</span></div>
        <div class="grid cols-3" style="margin-top:1rem">${cta}${cards}</div>
      </div>`;
    },

    /* ---- Game reference: what the crew plays, and what stops them (VR-98) ---- */
    reference() {
      const sorts = [["takes", "Most takes"], ["new", "Newest"], ["gripes", "Most gripes"]];
      return `<div class="wrap section">
        ${C.sectionHeader("The Lab", "Game reference")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">The games we actually play — and, more usefully, the things that take us out of them. No game is perfect; naming what makes a good one take a hit is what turns taste into design decisions. <span id="gref-stats" class="gr-stats"></span></p>
        <div id="gref-loom"></div>
        <div class="panel cta-card" onclick="VApp.grefOpen()" style="margin-top:1.5rem">
          <div class="eyebrow">Your turn</div>
          <h3 style="margin:.3rem 0">＋ Add a game</h3>
          <p class="mute">One you actually play. What you love, and what makes you put it down.</p>
        </div>
        <div class="filters" style="margin-top:1.5rem">
          <select class="gb-sel" onchange="VApp.grefSort(this.value)" aria-label="Sort games">
            ${sorts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
          </select>
        </div>
        <div id="gref-list" class="gr-list"><p class="mute">Loading…</p></div>
      </div>`;
    },

    /* ---- Games index: high-level browse of everything playable (VR-94) ----
       Every card carries Play as well as Open (VR-129). Browsing and playing are
       two different intents and the index was only serving the first: to actually
       start a game you had to open its page, scroll past the leaderboard and find
       the button at the bottom. Play here launches the game's DEFAULT run — the
       same target the game page opens on, i.e. versions[0] · first line-up ·
       level 1 — so the index can never offer a run the game page wouldn't. */
    games() {
      const cards = (D.games || []).map(g => {
        const levels = g.versions.reduce((m, v) => m + v.combos.reduce((k, c) => k + c.levels.length, 0), 0);
        const combos = g.versions[0].combos.length;
        const vers = g.versions.length;
        const bits = [`${combos} ${combos === 1 ? "line-up" : "line-ups"}`, `${levels} ${levels === 1 ? "level" : "levels"}`];
        if (vers > 1) bits.push(`${vers} versions`);
        const run = defaultRun(g);
        // No playable path in the manifest → no button at all, rather than a dead one.
        const play = run.href ? `<a class="btn gamecard-play" href="${C.esc(run.href)}"
            onclick="event.stopPropagation()" aria-label="Play ${C.esc(g.name)} — ${C.esc(run.label)}">▶ Play</a>` : "";
        return `<div class="panel gamecard" onclick="location.hash='#games/${C.esc(g.id)}'">
          ${g.art ? `<img class="gamecard-img" src="${C.esc(g.art)}" alt="${C.esc(g.name)}" loading="lazy" />` : ""}
          <div class="gamecard-body">
            <div class="gamecard-top">${C.statusPill(g.status)}<span class="mute gamecard-meta">${C.esc(bits.join(" · "))}</span></div>
            <h3>${C.esc(g.name)}</h3>
            <p class="mute gamecard-desc">${C.esc(g.short || g.text)}</p>
            <div class="gamecard-act">
              ${play}
              <span class="gamecard-go">Open ${C.esc(g.name.split(" (")[0])} →</span>
            </div>
            ${run.href ? `<p class="mute gamecard-run">Play opens ${C.esc(run.label)}</p>` : ""}
          </div>
        </div>`;
      }).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("Playable","Games")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">Everything you can actually play right now. Hit Play to drop straight in, or open one for its versions, levels, controls, leaderboard and changelog. Ideas that aren't built yet live in <a href="#lab">the Lab</a>.</p>
        <div class="grid cols-3" style="margin-top:1.5rem">${cards}</div>
      </div>`;
    },

    /* ---- One game: choose a run + board up top, then art, rules, controls, log ---- */
    game(id) {
      const g = gameOf(id);
      if (!g) return stub("Games", "That game isn't in the manifest.");
      const changelog = (D.updates || []).filter(u => (u.games || []).indexOf(g.id) > -1);
      const logRows = changelog.map(u => { const p = updParts(u); return `<div class="kit-row"><span class="mute" style="font-size:.8rem">${C.esc(u.date)}</span><div><strong style="color:var(--white)">${C.esc(p.title)}</strong>${p.body ? `<br><span class="mute">${C.esc(p.body)}</span>` : ""}</div></div>`; }).join("");
      const how = (g.howToPlay || []).map(t => `<li style="margin-bottom:.55rem">${C.esc(t)}</li>`).join("");
      return `<div class="wrap section">
        <p class="eyebrow"><a href="#games" style="color:inherit">← Games</a></p>
        <h1 class="display">${C.esc(g.name)}</h1>
        <p class="mute" style="max-width:64ch;margin-top:1rem">${C.esc(g.text)}</p>
        ${playCard(g)}
        <div class="grid cols-2" style="margin-top:2rem;align-items:start">
          <div class="panel">
            <div class="eyebrow">How to play</div>
            <ol class="mute" style="margin:.8rem 0 0;padding-left:1.1rem">${how || "<li>Coming soon.</li>"}</ol>
          </div>
          <div class="panel">
            <div class="eyebrow">Controls</div>
            <div id="gbcontrols-${C.esc(g.id)}" style="margin-top:.6rem">${controlsRows(g, g.versions[0])}</div>
          </div>
        </div>
        ${g.art ? `<div class="panel" style="margin-top:1.5rem;padding:0;overflow:hidden">
          <img src="${C.esc(g.art)}" alt="${C.esc(g.name)} key art" loading="lazy" style="display:block;width:100%;height:auto" />
        </div>` : ""}
        <div class="dash-head" style="margin-top:2rem"><h2 style="margin:0">Changelog</h2><span class="mute" style="font-size:.85rem">${changelog.length} update${changelog.length === 1 ? "" : "s"}</span></div>
        <div class="panel" style="margin-top:1rem">${logRows || `<p class="mute" style="font-size:.85rem;margin:0">Nothing logged for this one yet.</p>`}</div>
      </div>`;
    },

    updates() {
      const total = D.updates.length;
      const hero = weeklyHero();
      const dayCounts = {};
      D.updates.forEach(u => {
        const [y, m, d] = String(u.date).split("-").map(Number);
        const day = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, { weekday: "long" });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const busiest = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
      const list = D.updates.map(u => { const p = updParts(u); return `<div class="kit-row"><span class="mute" style="font-size:.8rem">${C.esc(u.date)}</span><div><strong style="color:var(--white)">${C.esc(p.title)}</strong>${p.body ? `<br><span class="mute">${C.esc(p.body)}</span>` : ""}</div></div>`; }).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("Log","Updates")}${hero}
        <div class="dash-stats cols-3" style="margin-top:1.5rem">
          <div class="dash-stat"><div class="dash-n">${total}</div><div class="mute">updates shipped so far</div></div>
          <div class="dash-stat"><div class="dash-n" style="font-size:1.7rem">${busiest ? C.esc(busiest[0]) : "—"}</div><div class="mute">${busiest ? busiest[1] + " updates — the busiest day of the week" : "not enough data yet"}</div></div>
          <div class="dash-stat"><div class="dash-n" id="upd-resolved-n">—</div><div class="mute">feedback items resolved</div></div>
        </div>
        <div class="panel" style="margin-top:1.5rem;border-color:var(--magenta)">
          <div class="dash-head" style="margin-top:0">
            <div>
              <div class="eyebrow">You asked, we listened</div>
              <p class="mute" style="font-size:.85rem;margin:.3rem 0 0">The 5 most recent — feedback the crew sent in that's since been acted on.</p>
            </div>
            <a class="btn ghost" href="#feedback">See all feedback →</a>
          </div>
          <div id="resolved-list" class="idea-list" style="margin-top:.8rem"><p class="mute" style="font-size:.85rem;margin:.5rem 0 0">Loading…</p></div>
        </div>
        <div class="panel"${hero ? ` id="upd-log"` : ""} style="margin-top:1.5rem">${list}</div>
      </div>`;
    },

    feedback() {
      return `<div class="wrap section">
        ${C.sectionHeader("Log","Feedback")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">Everything the crew has sent in, open and resolved. Up-vote anything still open to help it rise to the top.</p>
        <div id="fb-stats" class="dash-stats cols-4" style="margin-top:1.5rem"><div class="dash-stat"><p class="mute">Loading…</p></div></div>
        <div class="panel" style="margin-top:1.5rem;border-color:var(--magenta)">
          <div class="eyebrow">Open / in progress</div>
          <div id="fb-open-list" class="idea-list" style="margin-top:.8rem"><p class="mute" style="font-size:.85rem">Loading…</p></div>
        </div>
        <div class="panel" style="margin-top:1.5rem">
          <div class="eyebrow">Resolved</div>
          <div id="fb-resolved-list" class="idea-list" style="margin-top:.8rem"><p class="mute" style="font-size:.85rem">Loading…</p></div>
        </div>
      </div>`;
    },

    leaderboard() {
      return `<div class="wrap section">
        ${C.sectionHeader("The crew","Leaderboard")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">Who's shaping Veilrun the most. Points for contributing — <strong>feedback and <a href="#reference">game-reference takes</a> both count triple</strong>, plus likes, votes, and <strong>playing the prototypes</strong>: you earn points the first time you try a level, the first time you clear it, the first time you beat your own best on it, and any time you take #1 on a game's board. Each of those is a one-time award per level, and a reference take counts once per game however often you edit it — so the board measures what you've contributed rather than how many times you've replayed. Crew-only for now.</p>
        <div id="lb-board" style="margin-top:1.5rem"><p class="mute">Loading…</p></div>
      </div>`;
    },

    profile() {
      const name = localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || "";
      const ch = myCharacter();
      const provider = localStorage.getItem("vr_auth_provider");
      const avatar = ch
        ? `<div class="pf-avatar" style="background-image:url('${C.esc(ch.img)}')"></div>`
        : `<div class="pf-avatar pf-initial">${C.esc((name[0] || "?").toUpperCase())}</div>`;
      const imgTiles = ch ? pfImgTilesHTML(ch, pfDraftFor(ch.id)) : "";
      const archTiles = ch ? pfArchiveHTML(ch, pfDraft.hidden) : "";
      return `<div class="wrap section">
        <div class="pf-head">
          ${avatar}
          <div class="pf-head-txt">
            <p class="eyebrow">Your profile</p>
            <div class="pf-name-wrap">
              <h1 class="display pf-name-display" style="font-size:var(--fs-h1);margin:0 0 var(--s-2)">${C.esc(name || "Signed in")}<button class="pf-edit-btn" onclick="VApp.pfToggleNameEdit()" aria-label="Edit gaming name" title="Edit gaming name">✎</button></h1>
              <div class="pf-name-edit pf-name-row" id="pf-name-edit" style="display:none">
                <input id="pf-name" class="fld-in" value="${C.esc(name)}" maxlength="24" placeholder="Your gaming name" />
                <button class="btn" onclick="VApp.profileSaveName()">Save</button>
                <button class="btn ghost" onclick="VApp.pfToggleNameEdit()">Cancel</button>
              </div>
            </div>
            <p class="mute" style="margin:0">${ch ? "Playing as " + C.esc(ch.name) : "Crew account"}</p>
          </div>
          <button class="btn ghost pf-signout" onclick="VApp.signOut()">Sign out</button>
        </div>

        <div id="pf-stats" class="dash-stats cols-4" style="margin-top:1.5rem"><div class="dash-stat"><p class="mute">Loading…</p></div></div>

        ${C.seam()}
        <div class="panel">
          <div class="eyebrow">Your identity</div>
          <p class="mute" style="font-size:.85rem;margin:0 0 .8rem">Your gaming name is a fun handle — it's what shows on the leaderboard and your feedback (edit it with the ✎ above). Character, actual name, and nickname come from the crew roster.</p>
          <div class="pf-id-grid">
            <div class="pf-id-field"><span class="mute">Character</span><div>${ch ? C.esc(ch.name) : "Not linked yet"}</div></div>
            <div class="pf-id-field"><span class="mute">Gaming name</span><div>${C.esc(name || "—")}</div></div>
            <div class="pf-id-field"><span class="mute">Actual name</span><div>${ch && ch.actualName ? C.esc(ch.actualName) : "—"}</div></div>
            <div class="pf-id-field"><span class="mute">Nickname</span><div>${ch && ch.nickname ? C.esc(ch.nickname) : "—"}</div></div>
          </div>
          ${!ch ? `<p class="mute" style="font-size:.8rem;margin-top:.8rem">We couldn't match your gaming name to a crew character — set it above to your codename/handle and this fills in.</p>` : ""}
          ${provider !== "google" ? `
          <div style="margin-top:1rem;border-top:1px solid var(--line);padding-top:1rem">
            <button class="btn ghost" onclick="VApp.pfTogglePwEdit()">Change password</button>
            <div id="pf-pw-edit" class="pf-name-row" style="display:none;margin-top:.6rem">
              <input id="pf-pw-new" type="password" class="fld-in" placeholder="New password (min 6 characters)" />
              <button class="btn" onclick="VApp.pfChangePassword()">Save password</button>
            </div>
          </div>` : `<p class="mute" style="font-size:.8rem;margin-top:1rem">Signed in with Google — no Veilrun password needed.</p>`}
        </div>

        ${ch ? `
        <div class="panel" style="margin-top:1.5rem">
          <div class="eyebrow">Your images — ${C.esc(ch.name)}</div>
          <p class="mute" style="font-size:.85rem;margin:0 0 var(--s-4)">Reorder how ${C.esc(ch.name)}'s concept art appears on the character page, for everyone. #1 shows first — drag the ⠿ handle, type a position, or use the arrows. Tap ⊘ to archive a shot (it drops off the page but stays below to restore). ♥ shows likes.</p>
          <div id="pf-savebar" class="pf-savebar${pfDirty && pfDraft && pfDraft.charId === ch.id ? " show" : ""}">
            <span class="mute" style="font-size:.82rem">Unsaved changes</span>
            <div class="pf-savebar-btns">
              <button class="btn" onclick="VApp.pfSaveOrder('${ch.id}')">Save order</button>
              <button class="btn ghost" onclick="VApp.pfDiscardOrder('${ch.id}')">Discard</button>
            </div>
          </div>
          <div id="pf-img-grid" class="pf-img-grid">${imgTiles}</div>
          <div id="pf-archive" class="pf-archive">${archTiles}</div>
        </div>` : `
        <div class="panel" style="margin-top:1.5rem">
          <p class="mute" style="margin:0">We couldn't match your name to a crew character, so there's nothing to reorder yet. Set your display name to your codename or handle and it'll link up.</p>
        </div>`}
      </div>`;
    },

    board() {
      const b = window.VEILRUN.board;
      if (!b) return stub("Board", "The roadmap board is loading.");
      const priClass = p => p === "P1" ? "p1" : p === "P2" ? "p2" : "p3";
      const f = boardState.filter;
      const match = c => f === "all" || (f === "jordan" ? (c.who === "Jordan" || c.who === "Both") : (c.who === "Claude" || c.who === "Both"));
      const cols = b.columns.map(col => {
        const cards = col.cards.filter(match);
        if (!cards.length) return "";
        return `<div class="bcol">
          <div class="bcol-h">${C.esc(col.name)} <span class="mute">${cards.length}</span></div>
          ${cards.map(c => `<div class="bcard">
            <div class="bcard-t">${C.esc(c.t)}</div>
            <div class="bcard-m"><span class="bid">${C.esc(c.id)}</span> ${c.pri ? `<span class="bpri ${priClass(c.pri)}">${C.esc(c.pri)}</span>` : ""} <span class="mute">${C.esc(c.who)}</span></div>
          </div>`).join("")}
        </div>`;
      }).join("");
      const fBtn = (v, label) => `<button class="dd-btn favtoggle ${f === v ? "active" : ""}" onclick="VApp.boardFilter('${v}')">${label}</button>`;
      const filters = `<div class="filters" style="margin-top:1rem">${fBtn("all", "Everything")}${fBtn("jordan", "On me")}${fBtn("claude", "On Claude")}</div>`;
      return `<div class="wrap section">
        ${C.sectionHeader("The plan","Board")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">Where things stand — updated ${C.esc(b.updated)}. Tap <strong>On me</strong> to see just your plate. This mirrors our working board so everyone can see progress and what's coming.</p>
        ${filters}
        <div class="board" style="margin-top:1.5rem">${cols}</div>
        <div style="margin-top:1.2rem">${C.feedbackButton("Board / priorities")}</div>
      </div>`;
    },

    design() {
      const colorTokens = [
        ["--ink","Ink base"],["--ink-2","Panel"],["--violet","Violet / Weave"],["--magenta","Magenta / Seam"],
        ["--steel","Steel / Current"],["--amber","Amber"],["--cyan","Cyan"],["--white","Text"]
      ].map(([v,l]) => `<div class="swatch"><div class="chip-color" style="background:var(${v})"></div><div class="lbl">${C.esc(l)}<br><code>var(${v})</code></div></div>`).join("");
      const charColors = D.crew.map(c => `<div class="swatch"><div class="chip-color" style="background:${c.accent}"></div><div class="lbl">${C.esc(c.name)}<br><code>${C.esc(c.accent)}</code></div></div>`).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("Foundations","Design system")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">The living style guide — every token and component in one place. This is where the whole look is controlled (edit <code>css/tokens.css</code>) and where a future theme switcher will plug in. It doubles as a showcase of the web components (and, later, in-game UI).</p>
        ${C.seam()}
        <h2>Core colors</h2>
        <div class="swatches" style="margin-top:1rem">${colorTokens}</div>
        <h2 style="margin-top:2rem">Character accents</h2>
        <div class="swatches" style="margin-top:1rem">${charColors}</div>
        ${C.seam()}
        <h2>Type</h2>
        <div class="panel" style="margin-top:1rem">
          <h1 class="display">Display heading — Oswald</h1>
          <h2>Secondary heading</h2>
          <p class="eyebrow">Eyebrow label (caps, used sparingly)</p>
          <p class="mute">Body copy is Inter. Sentence case everywhere; all-caps is reserved for tiny labels and the wordmark only.</p>
        </div>
        ${C.seam()}
        <h2>Components</h2>
        <div class="grid cols-2" style="margin-top:1rem">
          <div class="panel">
            <p class="mute" style="font-size:.8rem">Kit pills</p>
            <div style="margin:.5rem 0">${C.kitRow("passive",{name:"Passive example",text:"An always-on trait."})}${C.kitRow("active",{name:"Active example",text:"A spendable ability."})}${C.kitRow("ult",{name:"Ultimate example",text:"The big one."})}</div>
          </div>
          <div class="panel">
            <p class="mute" style="font-size:.8rem">Codename chips (with pick)</p>
            <div style="margin:.5rem 0">${["Cinder","Saffron","Marrow"].map(c=>C.codenameChip(c,"Cinder")).join("")}</div>
            <p class="mute" style="font-size:.8rem;margin-top:1rem">Seam divider</p>${C.seam()}
            <p class="mute" style="font-size:.8rem">Feedback button</p><div>${C.feedbackButton("Design system")}</div>
          </div>
        </div>
        <h2 style="margin-top:2rem">Card + synergy</h2>
        <div class="grid cols-3" style="margin-top:1rem">
          <div style="pointer-events:none" aria-hidden="true">${C.characterCard(D.crew[0])}</div>
          <div>${C.synItem({name:"Example synergy",text:"How two characters combine."}, D.crew[0].accent)}${C.synItem({name:"Another pairing",text:"A second combined effect."}, D.crew[4].accent)}</div>
        </div>
        <p class="mute" style="margin-top:2rem;font-size:.85rem">Note: a fuller brand pass (via Claude Design) can elevate this — see the packaged prompt in the docs (VEILRUN Claude Design Brief).</p>
      </div>`;
    }
  };

  // Shared "full" profile row — same component as Threats. Tile-click elsewhere; this view gets a button + image row.
  function crewFullRow(ch) {
    const gg = orderedGallery(ch.id);
    const imgs = gg.length ? gg : (ch.img ? [ch.img] : []);
    registerSet("cfull_" + ch.id, imgs.map(s => ({ src: s, name: ch.name })));
    const mini = imgs.slice(0, 6).map((s, idx) => `<img src="${C.esc(s)}" alt="${C.esc(ch.name)}" loading="lazy" onclick="VApp.lbOpen('cfull_${ch.id}', ${idx})" />`).join("");
    return `<div class="threat" style="--accent:${ch.accent}">
      ${ch.img ? `<img class="t-img" src="${C.esc(ch.img)}" alt="${C.esc(ch.name)}" loading="lazy" onclick="location.hash='#crew/${ch.id}'" />` : ""}
      <div class="t-body">
        <div class="accent-bar"></div>
        <div class="eyebrow" style="color:${ch.accent}">${C.esc(ch.role)}</div>
        <h3 style="margin:.2rem 0">${C.esc(ch.name)}</h3>
        <p class="mute">"${C.esc(ch.alias)}" · ${C.esc(ch.player)}</p>
        <p class="mute" style="margin-top:.3rem">${C.esc(ch.tagline)}</p>
        ${mini ? `<div class="mini-grid">${mini}</div>` : ""}
        <a class="btn" href="#crew/${ch.id}">Open character →</a>
      </div>
    </div>`;
  }

  // ---- Threats views (mirror Crew: Tiles / Full / List) ----
  const threatsState = { view: "full" };
  function threatsView(v) { threatsState.view = v; view().innerHTML = views.threats(); window.scrollTo(0, 0); }
  function threatCard(t) {
    return `<div class="card" style="--accent:var(--magenta)" onclick="location.hash='#threats/${t.id}'">
      ${t.img ? `<img class="card-img" src="${C.esc(t.img)}" alt="${C.esc(t.name)}" loading="lazy" />` : ""}
      <div class="body"><div class="accent-bar"></div><h3>${C.esc(t.name)}</h3><div class="role">${C.esc(t.tier)}</div></div>
    </div>`;
  }
  function threatListRow(t) {
    return `<div class="row" style="--accent:var(--magenta)" onclick="location.hash='#threats/${t.id}'">
      ${t.img ? `<img src="${C.esc(t.img)}" alt="${C.esc(t.name)}" loading="lazy" />` : `<span class="accent-dot"></span>`}
      <div><div class="nm">${C.esc(t.name)}</div><div class="rl">${C.esc(t.tier)}</div></div>
      <span class="accent-dot"></span>
    </div>`;
  }
  function threatFullRow(t) {
    return `<div class="threat">
      ${t.img ? `<img class="t-img" src="${C.esc(t.img)}" alt="${C.esc(t.name)}" loading="lazy" onclick="VApp.lbOpen('threat_${t.id}', 0)" />` : ""}
      <div class="t-body">
        <div class="eyebrow">${C.esc(t.tier)}</div>
        <h3 style="margin:.3rem 0">${C.esc(t.name)}</h3>
        <p class="mute">${C.esc(t.desc)}</p>
        <p class="mute" style="font-size:.78rem;margin-top:.5rem">Palette: ${C.esc(t.palette)}</p>
        ${t.gallery && t.gallery.length > 1 ? `<div class="t-strip">${t.gallery.map((s, idx) => `<img src="${C.esc(s)}" onclick="VApp.lbOpen('threat_${t.id}', ${idx})" alt="${C.esc(t.name)}" loading="lazy" />`).join("")}</div>` : ""}
        <p class="mute" style="font-size:.82rem;margin-top:.7rem;font-style:italic">Abilities not yet defined — got ideas for what this enemy should do?</p>
        <div style="display:flex;gap:var(--s-3);flex-wrap:wrap;align-items:center;margin-top:.4rem">${C.feedbackButton("Enemy idea: " + t.name)}<a class="btn ghost" href="#threats/${t.id}">Open${((D.threatMembers || {})[t.id] || []).length ? " · " + (D.threatMembers[t.id]).length + " inside" : ""} →</a></div>
      </div>
    </div>`;
  }
  // Resolve a member's image set: an explicit gallery, or a folder (dir + count), or none.
  function memGallery(m) {
    let arr;
    if (m.gallery && m.gallery.length) arr = m.gallery.slice();
    else if (m.dir && m.count) arr = Array.from({ length: m.count }, (_, i) => m.dir + "/" + String(i + 1).padStart(2, "0") + ".webp");
    else return [];
    // Prioritize enemy art by community likes — most-liked first, so the hero + strip
    // reflect what people are gravitating to. Stable for ties, so natural order holds.
    return arr.map((s, i) => [s, i]).sort((a, b) => (likeCount(b[0]) - likeCount(a[0])) || (a[1] - b[1])).map(x => x[0]);
  }
  // Counter-concept voting block for the Lieutenants page: 3 takes per crew member, pick one.
  function counterVoteSection() {
    const c = D.counters; if (!c) return "";
    const slots = c.slots.map(s => {
      const accent = (chById(s.crew) || {}).accent || "var(--magenta)";
      const polls = s.opts.map(o => "ctr_" + s.crew + "_" + o.k);
      const groupStr = polls.join(",");
      const opts = s.opts.map((o, i) => {
        const poll = polls[i];
        return `<div class="ctr-opt ${iVoted(poll) ? "picked" : ""}" id="ctropt_${poll}">
          <div class="ctr-opt-h"><span class="ctr-tag">${C.esc(o.tag)}</span> <strong>${C.esc(o.name)}</strong></div>
          <p class="mute" style="font-size:.82rem;margin:.35rem 0 .6rem">${C.esc(o.blurb)}</p>
          <button class="votebtn ctr-vote ${iVoted(poll) ? "on" : ""}" data-poll="${poll}" onclick="VApp.counterVote('${poll}','${groupStr}')"><span class="vlabel">Vote</span> <span class="vc">${voteCount(poll)}</span></button>
        </div>`;
      }).join("");
      return `<div class="ctr-slot">
        <div class="ctr-slot-h">Counter to <strong style="color:${accent}">${C.esc(s.hero)}</strong> <span class="mute">— ${C.esc(s.does)}</span></div>
        <div class="ctr-opts">${opts}</div>
        <div style="margin-top:.6rem">${C.feedbackButton("Counter — " + s.hero)}</div>
      </div>`;
    }).join("");
    return `<div class="panel" style="margin-top:1rem;border-color:var(--magenta)">
      <div class="eyebrow">Vote the counters</div>
      <p class="mute" style="font-size:.85rem;margin:.3rem 0 1rem;max-width:64ch">${C.esc(c.intro)}</p>
      ${slots}
    </div>`;
  }
  function counterVote(poll, groupStr) {
    const group = (groupStr || "").split(",").filter(Boolean);
    const now = !iVoted(poll);
    if (now) group.forEach(p => { if (p !== poll && iVoted(p)) { applyVoteLocal(p, false); if (window.VBackend) window.VBackend.toggleVote(p); } });
    applyVoteLocal(poll, now);
    if (window.VBackend) window.VBackend.toggleVote(poll);
    refreshVotes();
    group.forEach(p => { const el = document.getElementById("ctropt_" + p); if (el) el.classList.toggle("picked", iVoted(p)); });
  }
  // A member card on a group page — links to its own sub-page (#threats/<group>/<member>).
  function threatMemberCard(groupId, m) {
    const mirror = m.mirrors ? `<span class="lb-tag">mirrors ${C.esc(m.mirrors)}</span>` : (m.role ? `<span class="lb-tag">${C.esc(m.role)}</span>` : "");
    const hero = memGallery(m)[0] || m.img;
    const art = hero ? `<img src="${C.esc(hero)}" alt="${C.esc(m.name)}" loading="lazy" />` : `<div class="threat-tbd">Art<br>TBD</div>`;
    const badge = m.proposed ? `<span class="threat-badge">Proposed</span>` : "";
    return `<a class="threat-mem" href="#threats/${groupId}/${m.id}">
      <div class="threat-mem-art">${art}${badge}</div>
      <div class="threat-mem-body">
        <div class="threat-mem-name">${C.esc(m.name)} ${mirror}</div>
        <p class="mute">${C.esc(m.desc)}</p>
      </div>
    </a>`;
  }
  // A member's own build-out page: hero + gallery + its own ideas/feedback thread.
  function threatMemberPage(t, m) {
    const imgs = memGallery(m);
    const setId = "threatmem_" + t.id + "_" + m.id;
    if (imgs.length) registerSet(setId, imgs.map(s => ({ src: s, name: m.name })));
    const badge = m.proposed ? `<span class="threat-badge">Proposed concept</span>` : "";
    const art = imgs.length
      ? `<img src="${C.esc(imgs[0])}" alt="${C.esc(m.name)}" style="border-radius:var(--radius);border:1px solid var(--line);cursor:zoom-in" onclick="VApp.lbOpen('${setId}', 0)" />`
      : `<div class="threat-tbd threat-tbd-lg">Art TBD<span>queue it in Midjourney</span></div>`;
    const strip = imgs.length > 1
      ? `<div class="gallery-strip" style="margin-top:1.5rem">${imgs.map((s, idx) => `<img src="${C.esc(s)}" onclick="VApp.lbOpen('${setId}', ${idx})" alt="${C.esc(m.name)}" loading="lazy" />`).join("")}</div>`
      : "";
    return `<div class="wrap section" style="--accent:var(--magenta)">
      <a href="#threats/${t.id}" class="mute" style="font-size:.85rem">← ${C.esc(t.name)}</a>
      <div class="char-hero" style="margin:1rem 0">
        <div>${art}</div>
        <div>
          <div class="eyebrow">${C.esc(t.name)}${m.role ? " · " + C.esc(m.role) : ""}</div>
          <h1 class="display" style="font-size:var(--fs-h1)">${C.esc(m.name)} ${badge}</h1>
          ${m.mirrors ? `<p class="mute" style="margin-top:.3rem">Mirrors <strong style="color:var(--white)">${C.esc(m.mirrors)}</strong> — their virtue, turned to a vice.</p>` : ""}
          ${m.palette ? `<p class="mute" style="margin-top:.2rem">Palette: ${C.esc(m.palette)}</p>` : ""}
          <p style="max-width:52ch;margin-top:.8rem">${C.esc(m.desc)}</p>
        </div>
      </div>
      <div class="panel" style="margin-top:1rem;border-color:var(--magenta)">
        <div class="eyebrow">Kit &amp; ideas for ${C.esc(m.name)}</div>
        <p class="mute" style="font-size:.85rem;margin:.3rem 0 0">Abilities aren't locked — pitch a kit, a signature move, or a twist, and vote up what should stick.</p>
        <div id="ideas-${t.id}-${m.id}" class="idea-list"><p class="mute" style="font-size:.85rem;margin:.5rem 0 0">Loading…</p></div>
        <div style="margin-top:.8rem">${C.feedbackButton("Threat member: " + t.name + " — " + m.name)}</div>
      </div>
      ${strip}
    </div>`;
  }

  function worldStrip() {
    const w = (window.VEILRUN.galleryItems || []).filter(i => i.cat === "World");
    if (!w.length) return "";
    registerSet("world", w.map(i => ({ src: i.src, name: i.name })));
    const imgs = w.map((it, idx) => `<img src="${C.esc(it.src)}" alt="${C.esc(it.name)}" loading="lazy" onclick="VApp.lbOpen('world', ${idx})" />`).join("");
    return `${C.seam()}<h2>Environments</h2><p class="mute" style="margin-top:.3rem">More concept shots of the layers — tap to enlarge.</p><div class="gallery-strip" style="margin-top:1rem">${imgs}</div>`;
  }

  function stub(title, text) {
    return `<div class="wrap section">${C.sectionHeader("Coming together", title)}
      <div class="panel" style="margin-top:1.5rem"><p class="mute">${C.esc(text)}</p><div style="margin-top:1rem">${C.feedbackButton(title)}</div></div></div>`;
  }

  // re-render crew section in place (for view toggle)
  function views_render_crew() { view().innerHTML = views.crew(); }
  function crewView(v) { localStorage.setItem("vr_crewview", v); views_render_crew(); }

  // ---- Character gallery flip-through ----
  let synGalleryState = { id: null, imgs: [], i: 0 };
  // Like state hydrated from Supabase on load: mine (this person), all (group), counts (for sorting).
  let likeMine = new Set(), likeAll = new Set(), likeCounts = {};
  // All art moved from PNG to WebP; likes/orders saved before that were keyed to the old
  // .png paths. Normalize on load so historical group data still maps onto the live images.
  const toWebp = (s) => String(s || "").replace(/\.png$/i, ".webp");
  const myWho = () => localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || "anon";

  /* ==================================================================================
     HUB (VR-86) — the personalised home base.
     ----------------------------------------------------------------------------------
     Three user states, and the difference between the last two is the whole feature:
       "new"  — no previous session. There is NOTHING to diff, so the "since you last
                signed in" band does not render at all. unseen is NULL, not 0 —
                collapsing them prints "You're all caught up" on a first ever visit.
       "ext"  — signed in but not crew (close friends/family). No waiting-on-you list
                will ever be meaningful for them, so "get started" is their permanent
                primary experience, not a fallback.
       "crew" — signed in and resolves to a crew member.

     Last-seen comes from the EXISTING `logins` table — no migration, no new column.
     The trap: logLogin() inserts this session's row during init, so a naive
     max(created_at) returns *now* and the band is permanently empty. We therefore take
     the newest row older than a settling window, which is race-free (no dependence on
     whether the insert has landed) and stays device-independent.

     Measured 8/10 against live data: waiting-on-you is BURSTY, not steady — it is one
     finite vote campaign at a time plus a trickle of resolved-feedback notifications.
     So items group by campaign and the zone must look right at ten items and at zero.
     ================================================================================== */
  const HUB_SETTLE_MS = 5 * 60 * 1000;   // rows newer than this count as "this visit"
  const HUB_CAP = 5;                     // items shown in the band before "see all"
  const HUB_CACHE = "vr_hub_cache_v1";
  let hubData = readHubCache();

  function readHubCache() {
    // Stale-while-revalidate: render from the last known values instantly, refresh behind.
    try {
      const raw = localStorage.getItem(HUB_CACHE);
      if (!raw) return null;
      const c = JSON.parse(raw);
      return c && c.who === myWho() ? c : null;
    } catch (e) { return null; }
  }

  const HUB_ANON_SEEN = "vr_hub_anon_seen";   // device-level last-seen for signed-out visitors

  function hubUserType() {
    // Signed out: we have no logins row, so fall back to a device marker. Without this a
    // returning signed-out visitor would be greeted with "First time here" on every visit,
    // which is the same null-vs-zero mistake in a different disguise.
    if (!localStorage.getItem("vr_account")) return localStorage.getItem(HUB_ANON_SEEN) ? "ext" : "new";
    return identityFor(myWho()).charName ? "crew" : "ext";
  }

  async function hydrateHub() {
    const me = myWho(), meId = identityFor(me).key, type = hubUserType();
    const cutoff = Date.now() - HUB_SETTLE_MS;
    const parseDate = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1).getTime(); };

    // Signed-out path: no account means no logins row to diff against, so use the device
    // marker. Runs with no backend at all, which also keeps the hub working offline.
    if (!localStorage.getItem("vr_account")) {
      const prev = Number(localStorage.getItem(HUB_ANON_SEEN)) || null;
      const unseenAnon = prev == null ? null : (D.updates || []).filter(u => parseDate(u.date) > prev);
      hubData = { who: me, type, lastSeen: prev, unseen: unseenAnon, waiting: [], at: Date.now() };
      try {
        localStorage.setItem(HUB_ANON_SEEN, String(Date.now()));
        localStorage.setItem(HUB_CACHE, JSON.stringify(hubData));
      } catch (e) {}
      return;
    }
    if (!window.VBackend) return;

    const logins = window.VBackend.loadLogins ? await window.VBackend.loadLogins() : [];
    const mineEarlier = logins
      .filter(r => identityFor(r.who).key === meId && new Date(r.created_at).getTime() < cutoff)
      .map(r => new Date(r.created_at).getTime())
      .sort((a, b) => b - a);
    // null (never been here) is deliberately distinct from a date with nothing after it.
    const lastSeen = mineEarlier.length ? mineEarlier[0] : null;

    const unseen = lastSeen == null ? null : (D.updates || []).filter(u => parseDate(u.date) > lastSeen);

    let waiting = [];
    if (type === "crew") {
      const [votes, doneFb] = await Promise.all([
        window.VBackend.loadVotes ? window.VBackend.loadVotes() : [],
        window.VBackend.loadResolvedFeedback ? window.VBackend.loadResolvedFeedback(200) : []
      ]);
      const mineVotes = new Set(votes.filter(v => identityFor(v.who).key === meId).map(v => v.poll));
      // A "campaign" is one decision per crew member's counter group — you either voted
      // in that group or you didn't. Measured: this column is 10 or 0, never in between.
      const openGroups = ((D.counters && D.counters.slots) || [])
        .filter(s => s.crew && Array.isArray(s.opts))
        .filter(s => !s.opts.some(o => mineVotes.has("ctr_" + s.crew + "_" + o.k)));
      if (openGroups.length) waiting.push({
        campaign: "Lieutenant counters",
        tag: "vote", href: "#threats",
        note: openGroups.length + " still need your vote",
        items: openGroups.slice(0, 3).map(s => ({ label: "Who really counters " + s.hero + "?", href: "#threats" }))
      });
      const mineResolved = doneFb.filter(f => identityFor(f.who).key === meId);
      if (mineResolved.length) waiting.push({
        campaign: "You asked, we fixed",
        tag: "note", href: "#feedback",
        note: mineResolved.length + " of your notes " + (mineResolved.length === 1 ? "has" : "have") + " shipped",
        items: mineResolved.slice(0, 3).map(f => ({ label: f.context || "Your feedback", href: "#feedback" }))
      });
    }

    hubData = { who: me, type, lastSeen, unseen, waiting, at: Date.now() };
    try { localStorage.setItem(HUB_CACHE, JSON.stringify(hubData)); } catch (e) {}
  }

  /* Most-liked art for the first-visit gallery tile. Sorts the EXISTING image_likes
     counts — no new table, no new query (hydrateLikes already ran). Spreads across
     characters so the tile doesn't show four near-identical variants of one person,
     and falls back to each gallery's opening image before any likes exist. */
  function hubTopArt(n) {
    const galleries = D.galleries || {};
    const nameOf = src => {
      const m = String(src).match(/assets\/gallery\/([a-z]+)\//) || String(src).match(/assets\/img\/([a-z]+)\./);
      const c = m && (D.crew || []).find(x => x.id === m[1]);
      return c ? c.name : "Veilrun";
    };
    const liked = Object.keys(likeCounts || {})
      .filter(s => likeCounts[s] > 0)
      .sort((a, b) => likeCounts[b] - likeCounts[a]);
    const out = [], seen = new Set();
    for (const src of liked) {                      // one per character first, for variety
      const who = nameOf(src);
      if (seen.has(who)) continue;
      seen.add(who); out.push({ src, who });
      if (out.length >= n) return out;
    }
    for (const src of liked) {                      // then backfill with the rest
      if (out.some(o => o.src === src)) continue;
      out.push({ src, who: nameOf(src) });
      if (out.length >= n) return out;
    }
    for (const id of Object.keys(galleries)) {      // cold start: no likes yet
      const first = (galleries[id] || [])[1] || (galleries[id] || [])[0];
      if (!first || out.some(o => o.src === first)) continue;
      out.push({ src: first, who: nameOf(first) });
      if (out.length >= n) break;
    }
    return out;
  }

  const likeKey = (src) => "vr_like:" + src;
  const isLiked = (src) => likeMine.has(src) || localStorage.getItem(likeKey(src)) === "1";
  const isGroupFav = (src) => likeAll.has(src) || isLiked(src);
  const likeCount = (src) => likeCounts[src] || 0;
  async function hydrateLikes() {
    if (!window.VBackend) return;
    const rows = await window.VBackend.loadLikes();
    likeMine = new Set(); likeAll = new Set(); likeCounts = {};
    const who = myWho();
    rows.forEach(r => {
      const src = toWebp(r.image_src);
      likeAll.add(src);
      likeCounts[src] = (likeCounts[src] || 0) + 1;
      if (r.who === who) likeMine.add(src);
    });
  }
  function applyLikeLocal(src, liked) {
    if (liked) { likeMine.add(src); likeAll.add(src); likeCounts[src] = (likeCounts[src] || 0) + 1; localStorage.setItem(likeKey(src), "1"); }
    else { likeMine.delete(src); likeCounts[src] = Math.max(0, (likeCounts[src] || 0) - 1); if (!likeCounts[src]) likeAll.delete(src); localStorage.removeItem(likeKey(src)); }
  }

  /* ---- Lab votes (one up-vote per person per idea, counted group-wide) ---- */
  let voteMine = new Set(), voteCounts = {};
  const voteKey = (poll) => "vr_vote:" + poll;
  const iVoted = (poll) => voteMine.has(poll) || localStorage.getItem(voteKey(poll)) === "1";
  const voteCount = (poll) => voteCounts[poll] || 0;
  async function hydrateVotes() {
    if (!window.VBackend) return;
    const rows = await window.VBackend.loadVotes();
    voteMine = new Set(); voteCounts = {};
    const who = myWho();
    rows.forEach(r => { voteCounts[r.poll] = (voteCounts[r.poll] || 0) + 1; if (r.who === who) voteMine.add(r.poll); });
  }
  function applyVoteLocal(poll, voted) {
    if (voted) { voteMine.add(poll); voteCounts[poll] = (voteCounts[poll] || 0) + 1; localStorage.setItem(voteKey(poll), "1"); }
    else { voteMine.delete(poll); voteCounts[poll] = Math.max(0, (voteCounts[poll] || 0) - 1); localStorage.removeItem(voteKey(poll)); }
  }
  function refreshVotes() {
    document.querySelectorAll(".votebtn").forEach(b => {
      const poll = b.getAttribute("data-poll");
      b.classList.toggle("on", iVoted(poll));
      const c = b.querySelector(".vc"); if (c) c.textContent = voteCount(poll);
    });
  }
  function fmtTime(ms) { const s = (ms || 0) / 1000, m = Math.floor(s / 60), r = s - m * 60; return m + ":" + (r < 10 ? "0" : "") + r.toFixed(1); }
  // Some game modes score by points (higher = better), not time (lower = better).
  // The value is still stored in the game_scores.time_ms column; only the ranking/format differs.
  function scoreKindOf(gameId) {
    for (const g of (D.games || [])) {
      for (const v of g.versions) for (const c of v.combos) for (const l of c.levels) if (l.id === gameId) return g.scoreKind || "time";
      if (g.id === gameId) return g.scoreKind || "time";
    }
    return "time";
  }
  // Load one leaderboard (best run per person) for a game_id into a container.
  // gameId (the manifest id) is optional: when present we also fill that card's "where you stand" line,
  // which is the whole point of the level picker — knowing if this is one worth re-running.
  async function loadBoardInto(containerId, levelId, gameId) {
    if (!window.VBackend || !window.VBackend.loadGameScores) return;
    const el = document.getElementById(containerId); if (!el) return;
    const kind = scoreKindOf(levelId);
    const rows = await window.VBackend.loadGameScores(levelId);
    const better = (a, b) => kind === "points" ? a > b : a < b; // keep the "better" value per person
    const best = {}; (rows || []).forEach(r => { if (best[r.who] == null || better(r.time_ms, best[r.who])) best[r.who] = r.time_ms; });
    const board = Object.entries(best).map(([who, ms]) => ({ who, ms })).sort((a, b) => kind === "points" ? b.ms - a.ms : a.ms - b.ms);
    const me = myWho();
    const fmt = v => kind === "points" ? `${Math.round(v)} pts` : fmtTime(v);
    if (!board.length) { const empty = kind === "points" ? "No runs on this one yet — be the first to post a score." : "No runs on this one yet — be the first to post a time."; el.innerHTML = `<p class="mute" style="font-size:.85rem">${empty}</p>`; return; }
    // Your row is the highlight, so it also carries the one thing the ranking alone
    // doesn't answer: how far off the lead you are — i.e. is this worth another run.
    const gapFor = (s, i) => {
      if (s.who !== me || i === 0) return "";
      const d = kind === "points" ? board[0].ms - s.ms : s.ms - board[0].ms;
      return `<span class="gb-gap">${kind === "points" ? Math.round(d) + " pts off" : (d / 1000).toFixed(1) + "s off"}</span>`;
    };
    el.innerHTML = board.slice(0, 8).map((s, i) => `<div class="gb-row${s.who === me ? " me" : ""}"><span>${i + 1}. ${C.esc(s.who)}${s.who === me ? " (you)" : ""}${gapFor(s, i)}</span><span class="gb-t">${fmt(s.ms)}</span></div>`).join("");
  }
  // ---- Leaderboard nav: Version → Combo → Level (dependent dropdowns) ----
  // Reads VEILRUN.games — the single manifest (VR-94). `versions` is what used to be
  // `boardTree`; the combo now carries its own play path and levels, stated once.
  const gameOf = (id) => (D.games || []).find(x => x.id === id);
  function boardTreeOf(gameId) { const g = gameOf(gameId); return g && g.versions; }
  // Controls are per-version (v2 rebound everything). A version without its own list
  // inherits the first version that has one — v0 legacy plays like v1.
  function controlsFor(g, ver) {
    if (ver && ver.controls) return ver.controls;
    const withControls = (g.versions || []).find(v => v.controls);
    return (withControls && withControls.controls) || [];
  }
  /* The selection is passed INTO the game by URL param (VR-94): the site owns the
     choice, the game reads it and skips its own picker. Games that haven't been
     migrated yet ignore these and fall back to their internal picker, which is what
     makes a one-game-at-a-time migration safe. */
  function playHref(ver, combo, level) {
    if (!combo || !combo.play) return "";
    const q = [];
    if (combo.char) q.push("char=" + encodeURIComponent(combo.char));
    if (combo.crew && combo.crew.length) q.push("crew=" + encodeURIComponent(combo.crew.join(",")));
    if (level) q.push("level=" + encodeURIComponent(level.id));
    if (ver) q.push("v=" + encodeURIComponent(ver.id));
    return combo.play + (q.length ? "?" + q.join("&") : "");
  }
  /* A game's default run: versions[0] · first line-up · level 1 — the manifest's
     stated default, and precisely what the game page's Play points at before you
     touch a dropdown. The games index (VR-129) reads this so the two surfaces can
     never disagree about what "Play" means. Returns "" href when a combo has no
     play path, which is the caller's cue to render no button. */
  function defaultRun(g) {
    const ver = (g && g.versions || [])[0];
    const combo = ver && ver.combos && ver.combos[0];
    const level = combo && combo.levels && combo.levels[0];
    if (!combo) return { href: "", label: "" };
    const multiLvl = combo.levels && combo.levels.length > 1;
    const bits = [(combo.label || "").split(" · ")[0]];
    if (multiLvl && level) bits.push(level.label);
    if ((g.versions || []).length > 1) bits.push(ver.label);
    return { href: playHref(ver, combo, multiLvl ? level : null), label: bits.filter(Boolean).join(" · ") };
  }
  function gbIdx(id) { const el = document.getElementById(id); return el ? el.selectedIndex : 0; }
  // The card's current (version, combo, level) selection — the one source of truth
  // that the board, the "where you stand" line, and the Play button all read from.
  function gbSelection(gameId) {
    const tree = boardTreeOf(gameId); if (!tree) return null;
    const v = tree[gbIdx("gbver-" + gameId)]; if (!v) return null;
    const c = v.combos[gbIdx("gbcombo-" + gameId)]; if (!c) return null;
    const ls = document.getElementById("gblvl-" + gameId);
    const lvlId = ls && ls.value ? ls.value : (c.levels[0] && c.levels[0].id);
    const l = c.levels.find(x => x.id === lvlId) || c.levels[0];
    return { ver: v, combo: c, level: l };
  }
  // Point the Play button + its caption at whatever is currently selected, so the card
  // never claims one thing and launches another (visibility of system status).
  function syncPlay(gameId) {
    const sel = gbSelection(gameId); if (!sel) return;
    const btn = document.getElementById("gbplay-" + gameId);
    const cap = document.getElementById("gblaunch-" + gameId);
    const scope = document.getElementById("gbscope-" + gameId);
    const tree = boardTreeOf(gameId) || [];
    const href = playHref(sel.ver, sel.combo, sel.combo.levels.length > 1 ? sel.level : null);
    if (btn) {
      if (href) { btn.setAttribute("href", href); btn.classList.remove("disabled"); btn.removeAttribute("aria-disabled"); }
      else { btn.setAttribute("href", "#"); btn.classList.add("disabled"); btn.setAttribute("aria-disabled", "true"); }
      btn.textContent = "▶ Play " + (sel.combo.label || "").split(" · ")[0];
    }
    if (cap) {
      const bits = [];
      if (tree.length > 1) bits.push(sel.ver.label);
      if (sel.level && sel.combo.levels.length > 1) bits.push(sel.level.label);
      cap.textContent = bits.length ? "Launching " + bits.join(" · ") : "";
    }
    if (scope) scope.textContent = sel.level ? sel.level.label : "";
  }
  function fillLevelSel(gameId) {
    const tree = boardTreeOf(gameId); if (!tree) return;
    const v = tree[gbIdx("gbver-" + gameId)]; if (!v) return;
    const c = v.combos[gbIdx("gbcombo-" + gameId)]; if (!c) return;
    const ls = document.getElementById("gblvl-" + gameId);
    if (ls) {
      ls.innerHTML = c.levels.map(l => `<option value="${C.esc(l.id)}">${C.esc(l.label)}</option>`).join("");
      const f = ls.closest(".pc-field"); if (f) f.classList.toggle("solo", c.levels.length < 2);
    }
    syncPlay(gameId);
    loadBoardInto("gboard-" + gameId, c.levels[0].id, gameId);
  }
  function fillComboSel(gameId) {
    const tree = boardTreeOf(gameId); if (!tree) return;
    const v = tree[gbIdx("gbver-" + gameId)]; if (!v) return;
    const cs = document.getElementById("gbcombo-" + gameId);
    if (cs) {
      cs.innerHTML = v.combos.map((c, i) => `<option value="${i}">${C.esc(c.label)}</option>`).join("");
      const f = cs.closest(".pc-field"); if (f) f.classList.toggle("solo", v.combos.length < 2);
    }
    fillLevelSel(gameId);
  }
  function gameBoardVer(gameId) { fillComboSel(gameId); syncControls(gameId); } // version → rebuild combo + level + controls
  function gameBoardCombo(gameId) { fillLevelSel(gameId); }      // combo changed → rebuild level
  function gameBoardLevel(gameId, levelId) { syncPlay(gameId); loadBoardInto("gboard-" + gameId, levelId, gameId); }
  // The controls list belongs to the selected version, so it has to follow the dropdown.
  function syncControls(gameId) {
    const el = document.getElementById("gbcontrols-" + gameId); if (!el) return;
    const g = gameOf(gameId); const tree = boardTreeOf(gameId) || [];
    const ver = tree[gbIdx("gbver-" + gameId)];
    el.innerHTML = controlsRows(g, ver);
  }
  const controlsRows = (g, ver) => controlsFor(g, ver).map(([keys, does]) =>
    `<div class="kit-row"><span class="name" style="min-width:11rem;display:inline-block">${C.esc(keys)}</span><div class="mute">${C.esc(does)}</div></div>`).join("");

  /* Full-width play card. One card = one game. The three selects are its single
     control surface: changing any of them re-scopes BOTH the leaderboard and the
     Play button, so the card can never claim one thing and launch another.

     VR-129 reordered it: pick a run → Play → then where you stand. It used to run
     board-first with Play in a footer under it, on the reasoning that the last
     thing you read is the thing you press. That reads well for someone comparing
     times; it reads badly for someone who came to play, because on a phone the
     selects sat under the board and the button under those — the primary action
     was two screens below the title. The board loses nothing by moving down: it
     is a thing you read, not a thing you act on.

     Lifted out of the Lab in VR-94 so the game page and the Lab share one
     implementation rather than two that drift. */
  function playCard(g) {
    const tree = g.versions || [];
    const v0 = tree[0], c0 = v0 && v0.combos[0];
    const verOpts = tree.map((v, i) => `<option value="${i}">${C.esc(v.label)}</option>`).join("");
    const comboOpts = v0 ? v0.combos.map((c, i) => `<option value="${i}">${C.esc(c.label)}</option>`).join("") : "";
    const lvlOpts = c0 ? c0.levels.map(l => `<option value="${C.esc(l.id)}">${C.esc(l.label)}</option>`).join("") : "";
    const multiVer = tree.length > 1, multiCombo = v0 && v0.combos.length > 1, multiLvl = c0 && c0.levels.length > 1;
    const id = C.esc(g.id);
    return `
      <div class="panel play-full" id="playcard-${id}" style="margin-top:1.5rem">
        <div class="pc-head">
          <div class="pc-title"><div class="eyebrow" style="margin:0">Choose your run</div></div>
          <div class="pc-head-act">${C.feedbackButton("Game: " + g.name)}</div>
        </div>
        <div class="pc-run">
          <div class="pc-run-grid">
            ${tree.length ? `
              <label class="pc-field${multiVer ? "" : " solo"}"><span>Version</span>
                <select class="gb-sel" id="gbver-${id}" onchange="VApp.gameBoardVer('${id}')">${verOpts}</select></label>
              <label class="pc-field${multiCombo ? "" : " solo"}"><span>Characters</span>
                <select class="gb-sel" id="gbcombo-${id}" onchange="VApp.gameBoardCombo('${id}')">${comboOpts}</select></label>
              <label class="pc-field${multiLvl ? "" : " solo"}"><span>Level</span>
                <select class="gb-sel" id="gblvl-${id}" onchange="VApp.gameBoardLevel('${id}', this.value)">${lvlOpts}</select></label>` : ""}
            <div class="pc-run-act">
              <a class="btn pc-play" id="gbplay-${id}" href="#">▶ Play</a>
              <p class="mute pc-launch" id="gblaunch-${id}"></p>
            </div>
          </div>
        </div>
        <div class="pc-body">
          <div class="pc-board">
            <div class="play-board-head">
              <div class="eyebrow" style="margin:0">${g.scoreKind === "points" ? "Best scores · the crew" : "Best times · the crew"}</div>
              <span class="pc-scope mute" id="gbscope-${id}"></span>
            </div>
            <div id="gboard-${id}" class="pc-rows"><p class="mute" style="font-size:.85rem">Loading…</p></div>
          </div>
        </div>
      </div>`;
  }
  // Fill a playable game's default board + Play target once its card is in the DOM.
  async function renderGameBoards(only) {
    const list = only ? [gameOf(only)].filter(Boolean) : (D.games || []);
    for (const g of list) {
      const first = (g.versions[0] && g.versions[0].combos[0] && g.versions[0].combos[0].levels[0] || {}).id || g.id;
      syncPlay(g.id);
      loadBoardInto("gboard-" + g.id, first, g.id);
    }
  }
  function labVote(poll) {
    const now = !iVoted(poll);
    applyVoteLocal(poll, now);
    if (window.VBackend) window.VBackend.toggleVote(poll);
    refreshVotes();
  }

  /* ---- Per-section idea lists (Threats, etc) — same vote mechanism as the Lab, ----
     just a read view that pulls live feedback for a given context tag. */
  let feedbackCache = null;
  async function allFeedback() {
    if (feedbackCache) return feedbackCache;
    if (!window.VBackend || !window.VBackend.loadFeedbackFull) return [];
    feedbackCache = await window.VBackend.loadFeedbackFull();
    return feedbackCache;
  }
  const ideaRow = (f, opts) => {
    opts = opts || {};
    return `
    <div class="idea-row">
      <button class="votebtn idea-vote" data-poll="${C.esc(f.id)}" onclick="VApp.labVote('${C.esc(f.id)}')" title="Up-vote" aria-label="Up-vote">▲ <span class="vc">0</span></button>
      <div class="idea-body">
        <p>${C.esc(f.note)}</p>
        <p class="mute idea-meta">${C.esc(lbName(canonicalWho(f.who)))}${opts.showContext && f.context ? " · " + C.esc(f.context) : ""}${f.type ? " · " + C.esc(f.type) : ""}</p>
      </div>
    </div>`;
  };
  async function loadIdeas(context, elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const rows = (await allFeedback()).filter(f => f.context === context);
    if (!rows.length) { el.innerHTML = `<p class="mute" style="font-size:.85rem;margin:.5rem 0 0">No ideas submitted yet — be the first.</p>`; return; }
    rows.sort((a, b) => voteCount(b.id) - voteCount(a.id));
    el.innerHTML = rows.map(f => ideaRow(f)).join("");
    refreshVotes();
  }

  /* ---- "You asked, we listened" (Updates preview + full Feedback page) ---- */
  const resolvedRow = (f) => `
    <div class="idea-row">
      <span class="idea-vote resolved-check" title="Resolved" aria-hidden="true">✓</span>
      <div class="idea-body">
        <p>${C.esc(f.note)}</p>
        <p class="mute idea-meta">${C.esc(lbName(canonicalWho(f.who)))}${f.context ? " · " + C.esc(f.context) : ""}</p>
      </div>
    </div>`;
  async function loadResolved(elId, limit) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!window.VBackend || !window.VBackend.loadResolvedFeedback) { el.innerHTML = `<p class="mute" style="font-size:.85rem;margin:.5rem 0 0">Needs the backend connected.</p>`; return; }
    const rows = await window.VBackend.loadResolvedFeedback(limit);
    if (!rows.length) { el.innerHTML = `<p class="mute" style="font-size:.85rem;margin:.5rem 0 0">Nothing marked resolved yet — it'll show up here once feedback gets acted on.</p>`; return; }
    el.innerHTML = rows.map(resolvedRow).join("");
  }
  // Full Feedback page: stats header + everything open (with votes) + everything resolved.
  async function loadFeedbackPage() {
    const statsEl = document.getElementById("fb-stats");
    const openEl = document.getElementById("fb-open-list");
    const resolvedEl = document.getElementById("fb-resolved-list");
    if (!window.VBackend) {
      if (statsEl) statsEl.innerHTML = "";
      if (openEl) openEl.innerHTML = `<p class="mute" style="font-size:.85rem">Needs the backend connected.</p>`;
      return;
    }
    const [stats, open] = await Promise.all([
      window.VBackend.loadFeedbackStats ? window.VBackend.loadFeedbackStats() : { total: 0, resolved: 0, open: 0, avgDays: null },
      allFeedback()
    ]);
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="dash-stat"><div class="dash-n">${stats.total}</div><div class="mute">submitted total</div></div>
        <div class="dash-stat"><div class="dash-n">${stats.resolved}</div><div class="mute">resolved / acted on</div></div>
        <div class="dash-stat"><div class="dash-n">${stats.open}</div><div class="mute">still open</div></div>
        <div class="dash-stat"><div class="dash-n">${stats.avgDays != null ? stats.avgDays.toFixed(1) : "—"}</div><div class="mute">${stats.avgDays != null ? "avg days to resolve" : "not enough data yet"}</div></div>`;
    }
    if (openEl) {
      const rows = open.slice().sort((a, b) => voteCount(b.id) - voteCount(a.id));
      openEl.innerHTML = rows.length ? rows.map(f => ideaRow(f, { showContext: true })).join("") : `<p class="mute" style="font-size:.85rem">Nothing open right now.</p>`;
      refreshVotes();
    }
    if (resolvedEl) loadResolved("fb-resolved-list");
  }
  async function loadUpdatesResolvedStat() {
    const el = document.getElementById("upd-resolved-n");
    if (!el || !window.VBackend || !window.VBackend.loadFeedbackStats) return;
    const stats = await window.VBackend.loadFeedbackStats();
    el.textContent = stats.resolved;
  }

  /* ---- Leaderboard (contribution ranking from feedback + likes + votes) ---- */
  const lbName = (w) => !w || w === "anon" ? "Anonymous" : w;
  // Which crew member (if any) a raw display-name string belongs to — same matching as myCharacter().
  // Every field a raw display-name string might match against for a given crew member.
  function crewMatchFields(ch) {
    return [ch.name, ch.alias, ch.player, ch.id, ch.gamingName, ch.actualName, ch.nickname, ...(ch.aliases || [])];
  }
  function findCrewByWho(who) {
    const w = String(who || "").toLowerCase();
    if (!w) return null;
    return (D.crew || []).find(ch => crewMatchFields(ch).some(v => v && String(v).toLowerCase() === w)) || null;
  }
  function identityFor(who) {
    const w = String(who || "").toLowerCase();
    if (!w) return { key: "anon", charName: null };
    const c = findCrewByWho(w);
    return c ? { key: c.id, charName: c.name } : { key: w, charName: null };
  }
  // Collapse display-name variants (Toddlez / BipolarCrayons, jkrazy / Latch, etc) onto one crew
  // identity for scoring. Display prefers the crew member's authoritative gaming name when we have
  // one on file; otherwise falls back to whichever raw name they've used most recently.
  function canonicalWho(who) { const { key, charName } = identityFor(who); return charName || who || "anon"; }
  // Shared aggregation (feedback + likes + votes → per-person contribution totals). Used by both the
  // Leaderboard and the Profile page's own-stats panel, so the numbers always agree.
  async function computeContributions() {
    if (!window.VBackend) return null;
    const [fb, likes, votes, gpts, refNotes] = await Promise.all([
      window.VBackend.loadFeedback ? window.VBackend.loadFeedback() : [],
      window.VBackend.loadLikes(),
      window.VBackend.loadVotes(),
      window.VBackend.loadGamePoints ? window.VBackend.loadGamePoints() : [],
      window.VBackend.loadGameRefNotes ? window.VBackend.loadGameRefNotes() : []
    ]);
    const weekAgo = Date.now() - 7 * 864e5;
    const P = {};
    const ensure = (key) => (P[key] = P[key] || { key, charName: null, gamingName: null, lastWho: null, lastAt: 0, fb: 0, likes: 0, votes: 0, game: 0, refs: 0, week: 0 });
    const bump = (r, field) => {
      const c = findCrewByWho(r.who);
      const key = c ? c.id : (String(r.who || "").toLowerCase() || "anon");
      const o = ensure(key);
      if (c) { o.charName = c.name; o.gamingName = c.gamingName || null; }
      o[field]++;
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      if (t >= o.lastAt) { o.lastAt = t; if (r.who) o.lastWho = r.who; }
      return o;
    };
    fb.forEach(r => { const o = bump(r, "fb"); if (r.created_at && new Date(r.created_at).getTime() >= weekAgo) o.week++; });
    likes.forEach(r => bump(r, "likes"));
    votes.forEach(r => bump(r, "votes"));
    // Game-reference takes (VR-98). Counting ROWS, and `unique (slug, who)` means one row
    // per person per game — so editing your take can't farm points. Nothing to store.
    refNotes.forEach(r => { const o = bump(r, "refs"); if (r.created_at && new Date(r.created_at).getTime() >= weekAgo) o.week++; });
    // Game points add their `points` value (not a +1 count) to the same person.
    gpts.forEach(r => {
      const c = findCrewByWho(r.who);
      const key = c ? c.id : (String(r.who || "").toLowerCase() || "anon");
      const o = ensure(key); if (c) { o.charName = c.name; o.gamingName = o.gamingName || c.gamingName || null; }
      o.game += (r.points || 0);
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      if (t >= o.lastAt) { o.lastAt = t; if (r.who) o.lastWho = r.who; }
      if (r.created_at && t >= weekAgo) o.week++;
    });
    const rows = Object.values(P);
    // A reference take is a written contribution with two paragraphs of thought in it —
    // the same class of act as feedback, so it carries the same weight.
    rows.forEach(o => { o.points = o.fb * 3 + o.refs * 3 + o.likes + o.votes + o.game; o.displayName = o.gamingName || o.lastWho || o.key; });
    return rows;
  }
  async function loadLeaderboard() {
    const el = document.getElementById("lb-board");
    if (!el) return;
    if (!window.VBackend) { el.innerHTML = `<div class="panel"><p class="mute">The leaderboard needs the backend connected. It's live once feedback is saving to the database.</p></div>`; return; }
    const all = (await computeContributions()) || [];
    const anon = all.find(o => o.key === "anon");           // unattributed shared-code feedback
    const rows = all.filter(o => o.key !== "anon");         // real people fill the ranked spots
    rows.sort((a, b) => b.points - a.points || b.fb - a.fb);
    if (!rows.length && !(anon && anon.points > 0)) { el.innerHTML = `<div class="panel"><p class="mute">No contributions yet — be the first to leave feedback and top the board.</p></div>`; return; }
    const weekTop = rows.filter(o => o.week > 0).sort((a, b) => b.week - a.week || b.points - a.points)[0];
    const medal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `<span class="lb-rank">${i + 1}</span>`;
    const highlight = weekTop ? `
      <div class="panel lb-weekly">
        <div class="eyebrow">Most active this week</div>
        <div class="lb-weekly-name">${C.esc(lbName(weekTop.displayName))}${weekTop.charName ? `<span class="lb-tag">${C.esc(weekTop.charName)}</span>` : ""}</div>
        <p class="mute" style="margin:.2rem 0 0">${weekTop.week} contribution${weekTop.week === 1 ? "" : "s"} in the last 7 days (feedback + game play). 🔥</p>
      </div>` : "";
    const list = rows.map((o, i) => `
      <div class="lb-row${i < 3 ? " lb-top" : ""}">
        <div class="lb-pos">${medal(i)}</div>
        <div class="lb-who">${C.esc(lbName(o.displayName))}${o.charName ? `<span class="lb-tag">${C.esc(o.charName)}</span>` : ""}</div>
        <div class="lb-detail mute">${o.fb} feedback · ${o.likes} likes · ${o.votes} votes${o.game ? ` · ${o.game} game pts` : ""}</div>
        <div class="lb-pts">${o.points}<span class="mute"> pts</span></div>
      </div>`).join("");
    // Unattributed feedback (no name) lands in one shared bucket — show it, but off the ranked
    // ladder (no medal/rank, de-emphasized) so it can't hold a top spot.
    const anonRow = (anon && anon.points > 0) ? `
      <div class="lb-row lb-anon">
        <div class="lb-pos" aria-hidden="true">·</div>
        <div class="lb-who">Anonymous<span class="lb-tag">shared code</span></div>
        <div class="lb-detail mute">${anon.fb} feedback · ${anon.likes} likes · ${anon.votes} votes</div>
        <div class="lb-pts">${anon.points}<span class="mute"> pts</span></div>
      </div>` : "";
    el.innerHTML = highlight + `<div class="lb-list panel">${list}${anonRow}</div>`;
  }

  function galleryViewer(ch) {
    const g = synGalleryState;
    if (!g.imgs.length) return ch.img ? `<img src="${C.esc(ch.img)}" alt="${C.esc(ch.name)}" />` : "";
    registerSet("char_" + ch.id, g.imgs.map(s => ({ src: s, name: ch.name })));
    const src = g.imgs[g.i];
    const liked = isGroupFav(src);
    const thumbs = g.imgs.map((s, idx) =>
      `<img src="${C.esc(s)}" class="${idx === g.i ? 'on' : ''}" onclick="VApp.galGo(${idx})" alt="${C.esc(ch.name)} ${idx + 1}" loading="lazy" />`).join("");
    return `
      <div class="viewer" style="--accent:${ch.accent}">
        <img src="${C.esc(src)}" alt="${C.esc(ch.name)}" onclick="VApp.lbOpen('char_${ch.id}', ${g.i})" />
        ${g.imgs.length > 1 ? `<button class="arrow prev" onclick="VApp.galStep(-1)" aria-label="Previous">‹</button>
        <button class="arrow next" onclick="VApp.galStep(1)" aria-label="Next">›</button>` : ""}
        <span class="count">${g.i + 1} / ${g.imgs.length}</span>
        <button class="like ${liked ? 'on' : ''}" onclick="VApp.galLike()">${liked ? ('♥ ' + (likeCount(src) || 1)) : '♡ Like'}</button>
      </div>
      ${g.imgs.length > 1 ? `<div class="thumbs" style="--accent:${ch.accent}">${thumbs}</div>` : ""}`;
  }

  function rerenderViewer() {
    const ch = chById(synGalleryState.id);
    const host = document.querySelector(".char-hero > div:first-child");
    if (host && ch) {
      host.innerHTML = galleryViewer(ch);
      const on = host.querySelector(".thumbs img.on");
      if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }
  function galStep(d) {
    const n = synGalleryState.imgs.length; if (!n) return;
    synGalleryState.i = (synGalleryState.i + d + n) % n; rerenderViewer();
  }
  function galGo(idx) { synGalleryState.i = idx; rerenderViewer(); }
  function galLike() {
    const g = synGalleryState, src = g.imgs[g.i];
    const nowLiked = !isLiked(src);
    applyLikeLocal(src, nowLiked);
    if (window.VBackend) window.VBackend.toggleLike(src);
    rerenderViewer();
  }

  // ---- Synergy explorer state + rendering ----
  const synState = { mode: "explore", sel: [] };
  const chById = (id) => D.crew.find(c => c.id === id);
  const nameTag = (id) => { const c = chById(id); return `<span class="pair-with"><span class="dot" style="background:${c.accent}"></span>${C.esc(c.name)}</span>`; };
  const subhead = (t) => `<h3 style="margin:1.2rem 0 .6rem">${C.esc(t)}</h3>`;

  const cardPair = (p, otherId) => {
    const oc = chById(otherId);
    return `<div class="syn" style="--accent:${oc.accent}"><div class="syn-name">${C.esc(p.name)}</div><div class="pair-with" style="margin:.2rem 0">with ${nameTag(otherId)}</div><div class="mute">${C.esc(p.effect)}</div></div>`;
  };
  const cardPairBoth = (p) =>
    `<div class="syn" style="--accent:${chById(p.a).accent}"><div class="syn-name">${C.esc(p.name)}</div><div class="pair-with" style="margin:.2rem 0">${nameTag(p.a)} + ${nameTag(p.b)}</div><div class="mute">${C.esc(p.effect)}</div></div>`;
  const cardAura = (a) =>
    `<div class="syn" style="--accent:${chById(a.members[0]).accent}"><div class="syn-name">${C.esc(a.name)} <span class="syn-tag">aura · ${C.esc(a.rel)}</span></div><div class="pair-with" style="margin:.2rem 0">${a.members.map(nameTag).join(" + ")}</div><div class="mute">${C.esc(a.effect)}</div></div>`;
  const cardUni = (u) =>
    `<div class="syn" style="--accent:${chById(u.member).accent}"><div class="syn-name">${C.esc(u.name)} <span class="syn-tag">field · all allies</span></div><div class="pair-with" style="margin:.2rem 0">${nameTag(u.member)}</div><div class="mute">${C.esc(u.effect)}</div></div>`;
  const cardTrio = (t) =>
    `<div class="syn" style="--accent:var(--magenta)"><div class="syn-name">${C.esc(t.name)} <span class="syn-tag">trio</span></div><div class="pair-with" style="margin:.2rem 0">${t.members.map(nameTag).join(" + ")}</div><div class="mute">${C.esc(t.effect)}</div></div>`;

  function renderSynResult() {
    const S = D.synergy, sel = synState.sel;
    if (synState.mode === "explore") {
      if (!sel.length) return `<p class="hint">Pick a crew member above.</p>`;
      const id = sel[0], ch = chById(id);
      const uni = S.universal.filter(u => u.member === id);
      const auras = S.auras.filter(a => a.members.includes(id));
      const pairs = S.pairs.filter(p => p.a === id || p.b === id);
      const trios = S.trios.filter(t => t.members.includes(id));
      let out = `<h2 style="color:${ch.accent}">${C.esc(ch.name)}'s connections</h2>`;
      if (uni.length) out += subhead("Field (helps everyone nearby)") + uni.map(cardUni).join("");
      if (auras.length) out += subhead("Always-on bonds") + auras.map(cardAura).join("");
      out += subhead("Paired techniques") + pairs.map(p => cardPair(p, p.a === id ? p.b : p.a)).join("");
      if (trios.length) out += subhead("Trios they anchor") + trios.map(cardTrio).join("");
      return out;
    }
    // build mode
    if (sel.length < 2) return `<p class="hint">Pick two or more crew members to combine.</p>`;
    const set = new Set(sel);
    const pairs = S.pairs.filter(p => set.has(p.a) && set.has(p.b));
    const auras = S.auras.filter(a => a.members.every(m => set.has(m)));
    const uni = S.universal.filter(u => set.has(u.member));
    const trios = S.trios.filter(t => t.members.every(m => set.has(m)));
    const chorus = sel.length === (D.crew || []).length;
    let out = `<h2>${sel.map(id => chById(id).name).join(" + ")}</h2>`;
    if (chorus) out += `<div class="panel" style="border-color:var(--magenta);margin:1rem 0"><div class="eyebrow">Full Chorus</div><p class="mute">${C.esc(S.fullChorus)}</p></div>`;
    if (trios.length) out += subhead("Trio convergence") + trios.map(cardTrio).join("");
    if (auras.length) out += subhead("Bonds active") + auras.map(cardAura).join("");
    if (uni.length) out += subhead("Fields active") + uni.map(cardUni).join("");
    if (pairs.length) out += subhead("Paired techniques") + pairs.map(cardPairBoth).join("");
    if (!pairs.length && !auras.length && !trios.length && !uni.length)
      out += `<p class="hint">No direct combo between these yet — try adding Latch (he amplifies everyone) or a bonded pair.</p>`;
    return out;
  }

  function renderSyn() { view().innerHTML = views.synergy(); }
  function synMode(m) { synState.mode = m; if (m === "explore" && synState.sel.length > 1) synState.sel = [synState.sel[0]]; renderSyn(); }
  function synPick(id) {
    if (synState.mode === "explore") synState.sel = (synState.sel[0] === id) ? [] : [id];
    else { const i = synState.sel.indexOf(id); if (i >= 0) synState.sel.splice(i, 1); else synState.sel.push(id); }
    renderSyn();
  }

  // ---- Gallery + lightbox (registry-based, swipeable) ----
  const galState = { filters: new Set(), sort: "char", dropdownOpen: false, limit: 24, _filtered: [], favMode: "off" };
  const boardState = { filter: "all" };
  function boardFilter(v) { boardState.filter = v; const el = view(); if (el) el.innerHTML = views.board(); }
  let galObserver = null;
  let lbState = { list: [], i: 0, mode: "single", zoom: 1, panX: 0, panY: 0 };
  function lbResetZoom() { lbState.zoom = 1; lbState.panX = 0; lbState.panY = 0; }
  function applyLbTransform() {
    const img = document.querySelector("#lightbox .lb-img");
    if (!img) return;
    img.style.transform = `translate(${lbState.panX}px, ${lbState.panY}px) scale(${lbState.zoom})`;
    img.style.cursor = lbState.zoom > 1 ? "grab" : "zoom-in";
  }
  const lbSets = {};
  function registerSet(key, arr) { lbSets[key] = arr; }
  function galleryAll() {
    const out = [], G = window.VEILRUN.galleries || {};
    D.crew.forEach(ch => (G[ch.id] || []).forEach(src => out.push({ src, cat: ch.name, name: ch.name })));
    (window.VEILRUN.galleryItems || []).forEach(it => out.push(it));
    return out;
  }
  function galItemHTML(it, idx, opener) {
    const c = likeCount(it.src);
    const badge = c >= 1 ? `<span class="likebadge">♥ ${c}</span>` : "";
    return `<div class="gitem ${isGroupFav(it.src) ? 'liked' : ''}"><img src="${C.esc(it.src)}" alt="${C.esc(it.name)}" loading="lazy" onclick="${opener}" />${badge}</div>`;
  }
  const crewNames = () => D.crew.map(c => c.name);
  function galCats() { return [...crewNames(), "World", "Enemy"]; }
  function catRank(cat) { const cn = crewNames().slice().sort(); const i = cn.indexOf(cat); if (i >= 0) return i; return cat === "World" ? 100 : 101; }
  function galRender() { view().innerHTML = views.gallery(); setupGalleryLazy(); }
  function galDropdown() { galState.dropdownOpen = !galState.dropdownOpen; galRender(); }
  function galSetAll() { galState.filters.clear(); galState.limit = 24; galRender(); }
  function galToggleFilter(cat) { const f = galState.filters; if (f.has(cat)) f.delete(cat); else f.add(cat); galState.limit = 24; galRender(); }
  function galSort(v) { galState.sort = v; galState.limit = 24; galRender(); }
  function galFavMode(m) { galState.favMode = (galState.favMode === m) ? "off" : m; galState.limit = 24; galRender(); }
  function setupGalleryLazy() {
    if (galObserver) { galObserver.disconnect(); galObserver = null; }
    const s = document.getElementById("gal-sentinel"); if (!s) return;
    galObserver = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) galLoadMore(); }, { rootMargin: "800px" });
    galObserver.observe(s);
  }
  function galLoadMore() {
    const f = galState._filtered || []; const start = galState.limit;
    if (start >= f.length) return;
    galState.limit = Math.min(f.length, start + 24);
    const m = document.getElementById("masonry");
    if (!m) { galRender(); return; }
    for (let idx = start; idx < galState.limit; idx++) {
      const it = f[idx];
      const wrap = document.createElement("div");
      wrap.className = "gitem" + (isGroupFav(it.src) ? " liked" : "");
      const img = document.createElement("img");
      img.src = it.src; img.loading = "lazy"; img.alt = it.name;
      const j = idx;
      img.addEventListener("click", () => lbOpen("gallery", j));
      wrap.appendChild(img);
      const c = likeCount(it.src);
      if (c >= 1) { const b = document.createElement("span"); b.className = "likebadge"; b.textContent = "♥ " + c; wrap.appendChild(b); }
      m.appendChild(wrap);
    }
    const cnt = document.getElementById("gal-count"); if (cnt) cnt.textContent = "Showing " + galState.limit + " of " + f.length;
    if (galState.limit >= f.length) { const mo = document.getElementById("gal-more"); if (mo) mo.remove(); if (galObserver) galObserver.disconnect(); }
  }
  function lbOpen(key, idx) {
    const list = lbSets[key] || [];
    if (!list.length) return;
    lbState = { list, i: idx || 0, mode: "single", zoom: 1, panX: 0, panY: 0 };
    const el = document.getElementById("lightbox");
    el.classList.add("open"); el.classList.remove("grid");
    renderLightbox();
  }
  function renderLightbox() {
    const el = document.getElementById("lightbox"); if (!el) return;
    el.classList.toggle("grid", lbState.mode === "grid");
    const modeBtn = el.querySelector("#lb-mode");
    if (modeBtn) modeBtn.textContent = lbState.mode === "grid" ? "◻ Single" : "▦ All";
    if (lbState.mode === "grid") {
      const g = el.querySelector("#lb-grid");
      g.innerHTML = lbState.list.map((it, idx) => galItemHTML(it, idx, `VApp.lbPick(${idx})`)).join("");
    } else {
      const it = lbState.list[lbState.i];
      el.querySelector(".lb-img").src = it.src;
      el.querySelector(".lb-cap").textContent = it.name + " · " + (lbState.i + 1) + " / " + lbState.list.length;
      const lk = el.querySelector(".lb-like");
      if (lk) { const on = isGroupFav(it.src); lk.classList.toggle("on", on); lk.textContent = on ? ("♥ " + (likeCount(it.src) || 1)) : "♡ Like"; }
      applyLbTransform();
    }
  }
  function lbToggleMode() { lbState.mode = lbState.mode === "grid" ? "single" : "grid"; renderLightbox(); }
  function lbPick(idx) { lbState.i = idx; lbState.mode = "single"; lbResetZoom(); renderLightbox(); }
  function lbSize(v) { const g = document.getElementById("lb-grid"); if (g) g.style.setProperty("--lb-size", v + "px"); }
  function lbLike() {
    const src = lbState.list[lbState.i] && lbState.list[lbState.i].src; if (!src) return;
    const nowLiked = !isLiked(src);
    applyLikeLocal(src, nowLiked);
    if (window.VBackend) window.VBackend.toggleLike(src);
    renderLightbox();
  }
  function lbStep(d) { const n = lbState.list.length; if (!n) return; lbState.i = (lbState.i + d + n) % n; lbResetZoom(); renderLightbox(); }
  function lbClose() { const el = document.getElementById("lightbox"); if (el) el.classList.remove("open"); }
  function lbIsOpen() { const el = document.getElementById("lightbox"); return el && el.classList.contains("open"); }

  /* ======================================================================
     GAME REFERENCE (VR-98)
     ----------------------------------------------------------------------
     Supabase holds what the crew supplied; VEILRUN.gameRefs holds what we know
     about each game. A game present in both renders a complete card; a game in
     Supabase only renders a "context coming" stub, which IS the authoring queue.
     ==================================================================== */
  let grefCache = null;               // { refs, notes } — cleared on submit
  const grefTags = () => (D.gameRefTags || { love: [], gripe: [] });

  // Slug is the join key to BOTH tables. Renaming one orphans every take on it.
  const grefBare = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function grefSlug(name) {
    const raw = grefBare(name);
    return (D.gameRefAliases || {})[raw] || raw;
  }
  // A game's DISPLAY NAME doesn't have to normalise to its key — "Marvel's Spider-Man 2"
  // bares to `marvelsspiderman2` while the key is `spiderman2`, and "Orcs Must Die! (series)"
  // carries a suffix the key doesn't. Since the catalogue is the autocomplete source, a crew
  // member picks the display name verbatim — so without this index, choosing a game from the
  // list would file the take under a brand-new slug and silently create a duplicate card.
  function grefNameIndex(known) {
    const idx = {};
    Object.keys(known).forEach(s => { const b = grefBare(known[s]); if (b && !idx[b]) idx[b] = s; });
    return idx;
  }
  // Levenshtein, capped — only ever run against a list of ~50, so the naive version is fine.
  function grefDist(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 9;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let last = prev[0]; prev[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = prev[j];
        prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
        last = tmp;
      }
    }
    return prev[b.length];
  }
  // Every slug we know about: the seeded catalogue plus anything already submitted.
  function grefKnown(refs) {
    const out = {};
    Object.keys(D.gameRefs || {}).forEach(s => { out[s] = (D.gameRefs[s] || {}).name || s; });
    (refs || []).forEach(r => { if (r.slug && !out[r.slug]) out[r.slug] = r.name || r.slug; });
    return out;
  }
  // Exact slug hit merges silently (Jordan's rule). A NEAR hit never auto-merges — it asks,
  // because silently folding two different games together is the one failure that loses data.
  function grefMatch(typed, refs) {
    const slug = grefSlug(typed);
    if (!slug) return { kind: "empty" };
    const known = grefKnown(refs);
    if (known[slug]) return { kind: "exact", slug, name: known[slug] };
    // Typed the display name rather than the key — still an exact hit.
    const byName = grefNameIndex(known)[grefBare(typed)];
    if (byName) return { kind: "exact", slug: byName, name: known[byName] };
    const near = Object.keys(known)
      .map(s => ({ slug: s, name: known[s], d: grefDist(slug, s) }))
      .filter(o => o.d <= 2 || (o.slug.length > 3 && slug.length > 3 && (o.slug.indexOf(slug) === 0 || slug.indexOf(o.slug) === 0)))
      .sort((a, b) => a.d - b.d)[0];
    if (near) return { kind: "near", slug: near.slug, name: near.name };
    return { kind: "new", slug, name: String(typed).trim() };
  }

  // A game's card data: seeded context if we have it, otherwise a stub that says so.
  function grefCard(slug, refs) {
    const ctx = (D.gameRefs || {})[slug];
    if (ctx) return Object.assign({ slug, pending: false }, ctx);
    const r = (refs || []).find(x => x.slug === slug);
    return { slug, pending: true, name: (r && r.name) || slug, blurb: "", platforms: [], mechanics: [] };
  }

  // Aggregate the tag chips across every take, ordered by how many people picked each.
  function grefTagRoll(notes, field) {
    const n = {};
    notes.forEach(t => (t[field] || []).forEach(x => { n[x] = (n[x] || 0) + 1; }));
    return Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b)).map(t => ({ tag: t, n: n[t] }));
  }

  // Quotes for one side of a card. Two shown, the rest behind a disclosure — a card has to
  // survive ten takes without becoming a wall.
  function grefQuotes(notes, field, slug, side) {
    const rows = notes.filter(t => (t[field] || "").trim());
    if (!rows.length) return `<p class="gr-none">Nobody's said yet.</p>`;
    /* A long take is clamped to four lines with a Read more (VR-120).
       This is the fourth and last thing on this page that hides something, and it's the
       only one that caps a SINGLE PERSON rather than a collection. The other three cap
       counts — how many games, how many halves, how many quotes — and none of them can do
       anything about one person writing four paragraphs. Jordan, who did: "I put a big ole
       paragraph in there, so it's looking big right now."
       That's the failure the other caps can't reach: one long take sets the height of the
       column for everybody in it, so the person who wrote the most buries the nine people
       who wrote a sentence. Clamping is deliberately NOT truncation — the full text is in
       the DOM, so find-in-page and screen readers get all of it, and expanding is one tap.
       The threshold is a character count rather than a measured height on purpose: it can
       be asserted headlessly, which a layout measurement cannot. It's generous enough
       (~5 lines of copy against a 4-line clamp) that a quote which trips it is essentially
       always actually clamped, so the button rarely appears over nothing. */
    const CLAMP_AT = 220;
    const one = t => {
      const txt = t[field].trim();
      const long = txt.length > CLAMP_AT;
      return `<li${long ? ` class="gr-long"` : ""}><span class="gr-who">${C.esc(canonicalWho(t.who))}</span><span class="gr-quote">${C.esc(txt)}</span>${
        long ? `<button type="button" class="gr-readmore" onclick="VApp.grefExpand(this)">Read more</button>` : ""}</li>`;
    };
    // One constant, used twice — these two slices MUST agree or the card either hides a
    // quote with no disclosure or claims more are hidden than there are.
    const SHOWN = 2;
    const head = rows.slice(0, SHOWN).map(one).join("");
    const rest = rows.slice(SHOWN);
    if (!rest.length) return `<ul class="gr-quotes">${head}</ul>`;
    const id = "grmore-" + slug + "-" + side;
    return `<ul class="gr-quotes">${head}</ul>
      <ul class="gr-quotes gr-hidden" id="${id}">${rest.map(one).join("")}</ul>
      <button class="gr-more" onclick="VApp.grefMore('${C.esc(id)}',this)">+${rest.length} more</button>`;
  }

  /* One half of an open card — its own disclosure (VR-110).
     There are now THREE levels of hiding on this page and each caps a different thing:
       · the card       caps the LIST      (fifteen games shouldn't be fifteen essays)
       · the half       caps the CARD      (open a game, get its shape, not both arguments)
       · "+n more"      caps the HALF      (ten people on one side isn't a column of ten)
     Jordan's note is what added the middle one: compressing the list alone just moved the
     wall from the page into the card. Opening a game now answers "what is this and roughly
     what do people think", and reading either argument in full is a separate, opt-in act.

     The TAG ROLL stays visible whenever the card is open, and that's the load-bearing
     choice — it's the aggregate, it's one line, and it's what makes the closed half
     informative rather than a mystery box. Hiding the tags too would make the half a
     button with no reason to press it. */
  function grefHalfHtml(slug, side, label, notes, field, tagField, tags) {
    const rows = notes.filter(t => (t[field] || "").trim());
    const roll = tags.length
      ? `<div class="gr-tagroll">${tags.map(t => `<span class="gr-tag">${C.esc(t.tag)}${t.n > 1 ? ` <b>${t.n}</b>` : ""}</span>`).join("")}</div>` : "";
    // Nothing written on this side: say so in place. A disclosure over an empty panel is a
    // button that punishes you for pressing it.
    if (!rows.length) {
      return `<section class="gr-side gr-${side}">
        <div class="gr-side-head gr-side-flat"><span>${label}</span><span class="mute">0</span></div>
        ${roll}<p class="gr-none">Nobody's said yet.</p>
      </section>`;
    }
    const open = grefState.halves.has(slug + "|" + side);
    const panelId = "grhalf-" + slug + "-" + side;
    return `<section class="gr-side gr-${side}${open ? " open" : ""}" id="grhalfsec-${C.esc(slug)}-${side}">
      <button type="button" class="gr-side-head" aria-expanded="${open}" aria-controls="${panelId}"
              onclick="VApp.grefHalf('${C.esc(slug)}','${side}')">
        <span class="gr-side-label">${label}</span>
        <span class="gr-side-n">${rows.length}</span>
        <span class="gr-caret gr-caret-sm" aria-hidden="true"></span>
      </button>
      ${roll}
      <div class="gr-quotewrap" id="${panelId}"${open ? "" : " hidden"}>
        ${grefQuotes(notes, field, slug, side)}
      </div>
    </section>`;
  }

  /* Cover art, three tiers, every one of which is allowed to fail (VR-107):
       1. `assets/gameref/<slug>.webp` — a local file ALWAYS wins, so the VR-98 rule
          "drop a file in the folder and the card picks it up, no data.js edit" survives.
       2. Steam's capsule for a game carrying `steam: <appid>` — derived, so it costs no
          download, no API key and no bytes in the repo. 460×215, which is the size the
          folder README already asks local covers to be, so the two tiers crop identically.
       3. The typographic tile underneath, which is always rendered and never removed.
     Tier 1 is tried first even when we have no reason to think the file is there: one
     conditional request per card is cheaper than an `art: true` flag in data.js, which is
     exactly the edit the derived-path convention exists to avoid. A miss falls through
     silently — CLAUDE.md's every-asset-falls-back rule, applied twice in a row. */
  const STEAM_CAPSULE = "https://cdn.cloudflare.steamstatic.com/steam/apps/";
  function grefArtChain(slug, g) {
    const local = g.art || (g.pending ? "" : "assets/gameref/" + slug + ".webp");
    const remote = g.steam ? STEAM_CAPSULE + g.steam + "/header.jpg" : "";
    return { src: local || remote, next: local && remote ? remote : "" };
  }
  // Called by the <img>'s onerror. Steps to the next tier once, then gets out of the way
  // and lets the tile show through.
  function grefArtFail(img) {
    if (!img) return;
    const next = img.getAttribute && img.getAttribute("data-next");
    if (next) { img.removeAttribute("data-next"); img.src = next; return; }
    img.remove();
  }

  function grefCardHtml(slug, notes, refs) {
    const g = grefCard(slug, refs);
    const loveTags = grefTagRoll(notes, "tags"), gripeTags = grefTagRoll(notes, "gripe_tags");
    const nLove = notes.filter(t => (t.loves || "").trim()).length;
    const nGripe = notes.filter(t => (t.gripes || "").trim()).length;

    // "Also submitted as" — derived from raw_name, so the merge log costs no extra table.
    const aliases = [...new Set((notes || []).map(t => (t.raw_name || "").trim())
      .filter(v => v && v.toLowerCase() !== String(g.name).toLowerCase()))];

    // The convergence line is the payload: it's what turns opinions into a finding.
    const conv = [...loveTags, ...gripeTags].filter(t => t.n >= 3).sort((a, b) => b.n - a.n)[0];
    const convLine = conv
      ? `<span class="gr-conv">⟳ ${conv.n} of ${notes.length} say <strong>${C.esc(conv.tag)}</strong></span>`
      : `<span class="gr-conv mute">${notes.length} take${notes.length === 1 ? "" : "s"}</span>`;

    /* The stat pair on the collapsed face (VR-110): how many spoke on each side, and the
       tag that side agreed on most. Counts alone say how BUSY a card is; the tag says what
       KIND of game it is to this crew, which is the thing worth scanning for.
       The top tag is dropped when it's the same tag the convergence line is already
       naming — otherwise the row reads "⚑ 4 grindy … 4 of 4 say grindy", and a face this
       small can't afford to say anything twice. */
    const statHtml = (side, icon, n, top) => {
      const tag = top && (!conv || top.tag !== conv.tag) ? top.tag : "";
      return `<span class="gr-stat gr-stat-${side}"><span class="gr-stat-i" aria-hidden="true">${icon}</span>${n}${
        tag ? `<span class="gr-stat-tag">${C.esc(tag)}</span>` : ""}<span class="sr-only"> ${side === "love" ? "loved" : "gripes"}</span></span>`;
    };
    const stats = `${statHtml("love", "♥", nLove, loveTags[0])}${statHtml("gripe", "⚑", nGripe, gripeTags[0])}`;

    const meta = [g.dimension, (g.platforms || []).join(" · ")].filter(Boolean)
      .map(m => `<span class="gr-chip">${C.esc(m)}</span>`).join("");
    const gone = g.status === "gone" ? `<span class="gr-gone">⚠ no longer running</span>` : "";
    // Art is LAYERED over the typographic tile, never swapped with it. The tile always
    // renders; the image sits on top and steps down the fallback chain if it 404s. So the
    // path is derived, every card lights up the moment a file lands in assets/gameref/ —
    // no data.js edit — and a missing cover is a designed state, not a gap.
    const chain = grefArtChain(slug, g);
    const art = `<span class="gr-art gr-art-fallback"><span class="gr-art-word">${C.esc(g.name)}</span>${
      chain.src ? `<img src="${C.esc(chain.src)}" alt="" loading="lazy" decoding="async"${
        chain.next ? ` data-next="${C.esc(chain.next)}"` : ""} onerror="VApp.grefArtFail(this)" />` : ""}</span>`;
    const blurb = g.pending
      ? `<p class="gr-blurb gr-pending">Context coming — nobody's written this one up yet.</p>`
      : `<p class="gr-blurb">${C.esc(g.blurb || "")}</p>`;

    const mine = grefMyNote(slug, notes);
    // COLLAPSED, a card is a summary row and nothing else: cover, name, and the convergence
    // line — the finding, which is the only part worth interrupting a scan for. Context,
    // both halves, every quote and the tag rolls live in the detail and are not in the
    // layout until asked for.
    //
    // This is a reversal of the VR-98 card and the reason is that the page got USED. At one
    // take per game the always-open card was right; at fifteen it is several screens of prose
    // before you reach the second game, and the page's whole job is getting ten people to read
    // each other. `grefQuotes`'s two-shown disclosure still applies INSIDE the detail — it caps
    // one card, this caps the list, and both are needed.
    //
    // Multiple cards may be open at once (not a one-at-a-time accordion): comparing two games'
    // gripes is the reason someone is on this page, and auto-closing would fight that.
    const open = grefState.open.has(slug);
    const detailId = "grdetail-" + slug;
    return `<article class="panel gr-card${open ? " open" : ""}" id="grcard-${C.esc(slug)}">
      <h3 class="gr-h">
        <button type="button" class="gr-summary" aria-expanded="${open}" aria-controls="${detailId}"
                onclick="VApp.grefToggle('${C.esc(slug)}')">
          ${art}
          <span class="gr-sum">
            <span class="gr-sum-name">${C.esc(g.name)}</span>
            <span class="gr-sum-stats">${stats}${gone}</span>
            <span class="gr-sum-line">${convLine}</span>
          </span>
          <span class="gr-caret" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="gr-detail" id="${detailId}"${open ? "" : " hidden"}>
        <div class="gr-body">
          <div class="gr-meta">${meta}</div>
          ${blurb}
          ${aliases.length ? `<p class="gr-alias">Also submitted as: ${C.esc(aliases.join(", "))}</p>` : ""}
          <div class="gr-split">
            ${grefHalfHtml(slug, "love", "♥ Loved", notes, "loves", "tags", loveTags)}
            ${grefHalfHtml(slug, "gripe", "⚑ Takes a hit", notes, "gripes", "gripe_tags", gripeTags)}
          </div>
          <div class="gr-foot">
            <button class="btn ghost gr-add" onclick="VApp.grefOpen('${C.esc(g.name)}')">${mine ? "Update your take" : "+ Add your take"}</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  // Who the current visitor is, for the "have I already said something?" check.
  function grefMe() { return localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || ""; }
  function grefMyNote(slug, notes) {
    const me = grefMe().toLowerCase();
    if (!me) return null;
    return (notes || []).find(t => String(t.who || "").toLowerCase() === me) || null;
  }

  // Un-clamp one long take. One-way on purpose: someone who asked to read it has read it,
  // and a Show less would re-collapse text under a cursor that is now below it.
  function grefExpand(btn) {
    if (!btn) return;
    const li = btn.parentNode;
    if (li && li.classList) li.classList.remove("gr-long");
    btn.remove();
  }

  function grefMore(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("gr-hidden");
    if (btn) btn.remove();
  }
  function grefSort(v) { grefState.sort = v; renderReference(); }
  // `open` is held here rather than read off the DOM because renderReference() rebuilds the
  // whole list with innerHTML — re-sorting would otherwise slam every open card shut, which
  // is exactly when someone is comparing two of them.
  // `halves` is keyed "<slug>|love" / "<slug>|gripe" for the same reason `open` exists: a
  // re-sort rebuilds the list, and someone who opened one game's gripes to read them should
  // not lose them because they changed the sort.
  let grefState = { sort: "takes", open: new Set(), halves: new Set() };

  // Open or close one half of one card. Deliberately independent of every other half —
  // reading a game's gripes should not also unfold its loves, and it should not touch the
  // neighbouring card at all.
  function grefHalf(slug, side) {
    const key = slug + "|" + side;
    const sec = document.getElementById("grhalfsec-" + slug + "-" + side);
    const panel = document.getElementById("grhalf-" + slug + "-" + side);
    if (!sec || !panel) return;
    const open = !grefState.halves.has(key);
    if (open) grefState.halves.add(key); else grefState.halves.delete(key);
    panel.hidden = !open;
    if (sec.classList) sec.classList.toggle("open", open);
    const btn = sec.querySelector ? sec.querySelector(".gr-side-head") : null;
    if (btn && btn.setAttribute) btn.setAttribute("aria-expanded", String(open));
  }

  function grefToggle(slug) {
    const card = document.getElementById("grcard-" + slug);
    const detail = document.getElementById("grdetail-" + slug);
    if (!card || !detail) return;
    const open = !grefState.open.has(slug);
    if (open) grefState.open.add(slug); else grefState.open.delete(slug);
    // Toggle the DOM in place instead of re-rendering: a re-render would drop any "+n more"
    // disclosures the reader has already opened inside this card.
    detail.hidden = !open;
    if (card.classList) card.classList.toggle("open", open);
    const btn = card.querySelector ? card.querySelector(".gr-summary") : null;
    if (btn && btn.setAttribute) btn.setAttribute("aria-expanded", String(open));
  }

  // The Loom (VR-99) isn't built yet. Its empty state ships now on purpose: it's the one
  // panel here allowed to render before it has data, because it explains a feature that
  // doesn't exist and names the exact thing that switches it on. That's a recruitment
  // surface on a page whose whole job is getting dormant crew to contribute once.
  function loomPanel(notes) {
    const takes = (notes || []).length;
    const people = new Set((notes || []).map(t => String(t.who || "").toLowerCase()).filter(Boolean)).size;
    if (takes >= 8 && people >= 3) return "";   // VR-99 fills this slot
    return `<div class="panel loom loom-empty">
      <div class="eyebrow">The Loom</div>
      <h3>Nothing woven yet</h3>
      <p class="mute">Each week, The Loom reads everything the crew has said about the games they play and hands back <strong>three game ideas for the Veilrun world</strong> — built from what you love, designed around what you told us takes you out of a game.</p>
      <p class="loom-gate">It needs a bit more to work with first: <strong>8 takes from at least 3 people</strong>. <span class="mute">(currently ${takes} from ${people})</span></p>
    </div>`;
  }

  function renderReference() {
    const el = document.getElementById("gref-list");
    if (!el || !grefCache) return;
    const { refs, notes } = grefCache;
    const bySlug = {};
    notes.forEach(t => { (bySlug[t.slug] = bySlug[t.slug] || []).push(t); });
    let slugs = Object.keys(bySlug);           // only games somebody has actually spoken about
    const s = grefState.sort;
    slugs.sort((a, b) => {
      if (s === "gripes") return bySlug[b].filter(t => (t.gripes || "").trim()).length - bySlug[a].filter(t => (t.gripes || "").trim()).length;
      if (s === "new") {
        const at = x => Math.max(...bySlug[x].map(t => new Date(t.updated_at || t.created_at || 0).getTime()));
        return at(b) - at(a);
      }
      return bySlug[b].length - bySlug[a].length || grefCard(a, refs).name.localeCompare(grefCard(b, refs).name);
    });
    const loom = document.getElementById("gref-loom");
    if (loom) loom.innerHTML = loomPanel(notes);
    const stats = document.getElementById("gref-stats");
    if (stats) {
      const nGripes = notes.filter(t => (t.gripes || "").trim()).length;
      stats.textContent = slugs.length
        ? `${slugs.length} game${slugs.length === 1 ? "" : "s"} · ${notes.length} take${notes.length === 1 ? "" : "s"} · ${nGripes} gripe${nGripes === 1 ? "" : "s"} worth reading`
        : "";
    }
    el.innerHTML = slugs.length
      ? slugs.map(sl => grefCardHtml(sl, bySlug[sl], refs)).join("")
      : `<div class="panel gr-empty">
           <h3>Nothing here yet — this page is blank on purpose.</h3>
           <p class="mute">Add a game you actually play. Not one you think we should copy — one you open on a Tuesday. Tell us the thing you love about it, and the thing that makes you put it down. <strong>The second one is the one we need.</strong></p>
           <button class="btn" onclick="VApp.grefOpen()">+ Add the first game</button>
         </div>`;
  }

  async function loadReference() {
    const el = document.getElementById("gref-list");
    if (!el) return;
    if (!window.VBackend) {
      el.innerHTML = `<div class="panel"><p class="mute">The game reference needs the backend connected. It's live once the site is talking to the database.</p></div>`;
      return;
    }
    if (!grefCache) {
      const [refs, notes] = await Promise.all([
        window.VBackend.loadGameRefs ? window.VBackend.loadGameRefs() : [],
        window.VBackend.loadGameRefNotes ? window.VBackend.loadGameRefNotes() : []
      ]);
      grefCache = { refs, notes };
    }
    renderReference();
  }

  /* ---- Submit / update modal ---- */
  let grefCtx = { slug: null, rawName: "", matchKind: "new", editing: false };

  function grefOpen(prefill) {
    const el = document.getElementById("grefmodal");
    if (!el) return;
    grefCtx = { slug: null, rawName: "", matchKind: "new", editing: false };
    const nameIn = el.querySelector("#gref-name");
    nameIn.value = prefill || "";
    nameIn.disabled = !!prefill;
    el.querySelector("#gref-loves").value = "";
    el.querySelector("#gref-gripes").value = "";
    el.querySelector("#gref-suggest").innerHTML = "";
    el.querySelector("#gref-err").textContent = "";
    grefRenderTags(el);

    const sel = el.querySelector("#gref-who");
    const acct = localStorage.getItem("vr_account");
    if (acct) {
      if (![...sel.options].some(o => o.value === acct)) sel.add(new Option(acct, acct), 1);
      sel.value = acct; sel.disabled = true;
    } else {
      sel.disabled = false;
      sel.value = localStorage.getItem("vr_who") || "";
    }
    if (prefill) grefNameChange();           // resolves the slug + pre-fills an existing take
    el.classList.add("open");
    setTimeout(() => (prefill ? el.querySelector("#gref-loves") : nameIn).focus(), 50);
  }

  function grefRenderTags(el, love, gripe) {
    const T = grefTags();
    const row = (list, on, kind) => list.map(t =>
      `<button type="button" class="gr-pick${(on || []).includes(t) ? " on" : ""}" data-kind="${kind}" data-tag="${C.esc(t)}" onclick="this.classList.toggle('on')">${C.esc(t)}</button>`).join("");
    el.querySelector("#gref-love-tags").innerHTML = row(T.love, love, "love");
    el.querySelector("#gref-gripe-tags").innerHTML = row(T.gripe, gripe, "gripe");
  }

  // Runs on blur/change of the game name. Resolves the slug, asks about a near match,
  // and — if you already have a take on this game — turns the whole modal into an edit.
  function grefNameChange() {
    const el = document.getElementById("grefmodal");
    if (!el) return;
    const typed = el.querySelector("#gref-name").value.trim();
    const box = el.querySelector("#gref-suggest");
    const refs = (grefCache && grefCache.refs) || [];
    if (!typed) { box.innerHTML = ""; return; }
    const m = grefMatch(typed, refs);
    grefCtx.rawName = typed;
    if (m.kind === "near") {
      // Never auto-merge a near hit — ask.
      box.innerHTML = `<div class="gr-didyou">Did you mean <strong>${C.esc(m.name)}</strong>?
        <button type="button" class="btn ghost" onclick="VApp.grefPick('${C.esc(m.slug)}','${C.esc(m.name)}')">Yes, that's it</button>
        <button type="button" class="btn ghost" onclick="VApp.grefPick('','')">No, different game</button></div>`;
      return;
    }
    grefPick(m.slug, m.name, m.kind);
  }

  function grefPick(slug, name, kind) {
    const el = document.getElementById("grefmodal");
    if (!el) return;
    const box = el.querySelector("#gref-suggest");
    if (!slug) {                                  // "No, different game" — take them at their word
      const typed = el.querySelector("#gref-name").value.trim();
      grefCtx.slug = grefSlug(typed); grefCtx.matchKind = "new"; grefCtx.editing = false;
      box.innerHTML = `<p class="gr-hint">Adding <strong>${C.esc(typed)}</strong> as a new game.</p>`;
      return;
    }
    grefCtx.slug = slug;
    grefCtx.matchKind = kind || "confirmed";
    const notes = ((grefCache && grefCache.notes) || []).filter(t => t.slug === slug);
    const mine = grefMyNote(slug, notes);
    grefCtx.editing = !!mine;
    if (mine) {
      // Editing: pre-fill, and the required-both rule relaxes to at-least-one.
      el.querySelector("#gref-loves").value = mine.loves || "";
      el.querySelector("#gref-gripes").value = mine.gripes || "";
      grefRenderTags(el, mine.tags || [], mine.gripe_tags || []);
      el.querySelector("#gref-title").textContent = "Update your take";
      box.innerHTML = `<p class="gr-hint">You've already got a take on <strong>${C.esc(name)}</strong> — this updates it. Change one side or both; leave at least one.</p>`;
    } else {
      el.querySelector("#gref-title").textContent = "Add your take";
      const typed = el.querySelector("#gref-name").value.trim();
      const merged = typed && typed.toLowerCase() !== String(name).toLowerCase();
      box.innerHTML = merged
        ? `<p class="gr-hint">Added to <strong>${C.esc(name)}</strong> — you typed "${C.esc(typed)}".</p>`
        : `<p class="gr-hint">${C.esc(name)} — tell us both sides.</p>`;
    }
  }

  async function grefSubmit() {
    const el = document.getElementById("grefmodal");
    const errEl = el.querySelector("#gref-err");
    errEl.textContent = "";
    let who = el.querySelector("#gref-who").value;
    if (who === "__other__") who = (el.querySelector("#gref-who-other").value || "").trim();
    if (!who) { errEl.textContent = "Pick your name first."; return; }
    const typed = el.querySelector("#gref-name").value.trim();
    if (!typed) { errEl.textContent = "Which game?"; return; }
    if (!grefCtx.slug) grefNameChange();
    if (!grefCtx.slug) { errEl.textContent = "Pick whether that's an existing game or a new one."; return; }

    const loves = el.querySelector("#gref-loves").value.trim();
    const gripes = el.querySelector("#gref-gripes").value.trim();
    // Both required on a FIRST take — optional gripes means no gripes, and the gripes are
    // the reason this page exists. Relaxes to at-least-one once you already have a take.
    if (grefCtx.editing) {
      if (!loves && !gripes) { errEl.textContent = "Leave at least one — a love or a gripe."; return; }
    } else if (!loves || !gripes) {
      errEl.textContent = "First time on a game, we need both — what you love and what takes you out of it.";
      return;
    }
    const picked = kind => [...el.querySelectorAll(`.gr-pick.on[data-kind="${kind}"]`)].map(b => b.dataset.tag);

    localStorage.setItem("vr_who", who);
    const btn = el.querySelector("#gref-send");
    btn.disabled = true; btn.textContent = "Saving…";

    const known = grefKnown((grefCache && grefCache.refs) || []);
    if (!known[grefCtx.slug]) await window.VBackend.createGameRef(grefCtx.slug, typed, who);
    const res = await window.VBackend.upsertGameRefNote({
      slug: grefCtx.slug, who, loves, gripes,
      tags: picked("love"), gripeTags: picked("gripe"),
      rawName: typed, matchKind: grefCtx.matchKind
    });
    btn.disabled = false; btn.textContent = "Save";
    if (!res.ok) { errEl.textContent = res.message; return; }
    grefCache = null;
    grefClose();
    toast(grefCtx.editing ? "Updated — thanks." : "Added. Thanks — that's the useful half.");
    loadReference();
  }
  function grefClose() { const el = document.getElementById("grefmodal"); if (el) el.classList.remove("open"); }
  function grefWhoChange() {
    const el = document.getElementById("grefmodal");
    const other = el.querySelector("#gref-who").value === "__other__";
    el.querySelector("#gref-who-other").style.display = other ? "block" : "none";
  }

  // ---- Feedback modal ----
  let fbCtx = { context: "", type: "idea" };
  function feedback(context, type) {
    // Global nav button passes no context — auto-tag with the page you're on.
    if (!context) {
      const r = (location.hash || "#hub").slice(1).split("/")[0];
      const map = { world: "The World", crew: "The Crew", threats: "Threats", synergy: "Synergy",
        gallery: "Gallery", lab: "The Lab", games: "Games", updates: "Updates", feedback: "Feedback page", board: "Board / priorities", design: "Design system" };
      // On a game page, tag the feedback with which game you were looking at.
      const gid = (location.hash || "").slice(1).split("/")[1];
      const g = r === "games" && gid && gameOf(gid);
      context = g ? "Game: " + g.name : (map[r] || "");
    }
    fbCtx = { context: context || "", type: type || "idea" };
    const el = document.getElementById("fbmodal"); if (!el) return;
    const title = context && context.indexOf("mode idea") > -1 ? "Pitch a game mode"
      : context && context.indexOf("General") > -1 ? "Share a thought"
      : context ? "Share feedback" : "Share a thought";
    el.querySelector("#fb-title").textContent = title;
    el.querySelector("#fb-context").textContent = context ? "About: " + context : "General — anything on your mind.";
    el.querySelector("#fb-type").value = fbCtx.type;
    el.querySelector("#fb-note").value = "";
    const sel = el.querySelector("#fb-who");
    const acct = localStorage.getItem("vr_account");
    if (acct) {
      // Signed in — lock attribution to the account so the leaderboard stays honest.
      if (![...sel.options].some(o => o.value === acct)) sel.add(new Option(acct, acct), 1);
      sel.value = acct; sel.disabled = true;
      el.querySelector("#fb-who-other").style.display = "none";
    } else {
      sel.disabled = false;
      sel.value = localStorage.getItem("vr_who") || "";
      fbWhoChange();
    }
    el.classList.add("open");
    setTimeout(() => el.querySelector("#fb-note").focus(), 50);
  }
  function fbWhoChange() {
    const el = document.getElementById("fbmodal");
    const other = el.querySelector("#fb-who").value === "__other__";
    el.querySelector("#fb-who-other").style.display = other ? "block" : "none";
  }
  function fbClose() { const el = document.getElementById("fbmodal"); if (el) el.classList.remove("open"); }
  function fbSubmit() {
    const el = document.getElementById("fbmodal");
    let who = el.querySelector("#fb-who").value;
    if (who === "__other__") who = el.querySelector("#fb-who-other").value.trim() || "someone";
    if (!who) { el.querySelector("#fb-who").focus(); return; }
    const type = el.querySelector("#fb-type").value;
    const note = el.querySelector("#fb-note").value.trim();
    if (!note) { el.querySelector("#fb-note").focus(); return; }
    localStorage.setItem("vr_who", who);
    const log = JSON.parse(localStorage.getItem("vr_feedback") || "[]");
    log.push({ who, context: fbCtx.context, note, type, at: new Date().toISOString() });
    localStorage.setItem("vr_feedback", JSON.stringify(log));
    if (window.VBackend) window.VBackend.submitFeedback(fbCtx.context, note, type);
    feedbackCache = null;
    fbClose();
    toast(window.VBackend ? "Thanks — sent!" : "Saved locally (backend offline).");
  }
  function toast(msg) {
    let t = document.getElementById("vtoast");
    if (!t) { t = document.createElement("div"); t.id = "vtoast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }

  const isAccount = () => !!localStorage.getItem("vr_account");
  let lastRouteName = null;
  function route() {
    if (!requireGate()) return;
    const hash = (location.hash || "#hub").slice(1);
    const [name, arg, sub] = hash.split("/");
    // Leaving the Profile page with an unsaved image order? Confirm first (Save/Discard handle clearing pfDirty).
    if (pfDirty && lastRouteName === "profile" && name !== "profile") {
      if (!confirm("You have unsaved image order changes. Leave without saving?")) { location.hash = "#profile"; return; }
      pfDirty = false;
    }
    lastRouteName = name;
    // Landing + Leaderboard are for signed-in accounts only; guests get bounced to the Hub.
    if ((name === "landing" || name === "leaderboard" || name === "profile") && !isAccount()) { location.hash = "#hub"; return; }
    if (name === "gallery") galState.limit = 24; // reset paging before render
    if (window.VLanding) VLanding.teardown(); // clean any landing listeners before leaving/re-render
    let html;
    if (name === "crew" && arg) html = views.character(arg);
    else if (name === "games" && arg) html = views.game(arg);
    else if (name === "threats" && arg) html = views.threat(arg, sub);
    else if (name === "landing" && window.VLanding) {
      registerSet("silhouettes", (D.crew || []).map(c => ({ src: "assets/landing/silhouettes/" + c.id + ".webp", name: c.name })));
      html = VLanding.view();
    }
    else if (views[name]) html = views[name]();
    else html = views.hub();
    view().innerHTML = html;
    if (name === "gallery") setupGalleryLazy();
    if (name === "lab") refreshVotes();
    if (name === "games" && arg) renderGameBoards(arg);
    if (name === "threats") refreshVotes();
    if (name === "leaderboard") loadLeaderboard();
    if (name === "threats" && arg) {
      const t = (D.threats || []).find(x => x.id === arg);
      if (t) {
        const members = (D.threatMembers || {})[arg] || [];
        const m = sub && members.find(x => x.id === sub);
        if (m) loadIdeas("Threat member: " + t.name + " — " + m.name, "ideas-" + arg + "-" + sub);
        else loadIdeas("Enemy idea: " + t.name, "ideas-" + arg);
      }
    }
    if (name === "reference") loadReference();
    if (name === "updates") { loadResolved("resolved-list", 5); loadUpdatesResolvedStat(); }
    if (name === "feedback") loadFeedbackPage();
    if (name === "profile") loadProfileStats("pf-stats");
    if (name === "landing" && window.VLanding) VLanding.init();
    document.querySelectorAll(".nav a[data-route]").forEach(a =>
      a.classList.toggle("active", a.getAttribute("href") === "#" + name));
    const cdrop = document.getElementById("navdrop-characters");
    if (cdrop) cdrop.classList.toggle("active", ["characters", "crew", "threats", "synergy"].includes(name));
    const hdrop = document.getElementById("navdrop-hub");
    if (hdrop) hdrop.classList.toggle("active", ["hub", "leaderboard", "updates"].includes(name));
    const ldrop = document.getElementById("navdrop-lab");
    if (ldrop) ldrop.classList.toggle("active", ["lab", "games", "reference"].includes(name));
    document.querySelectorAll(".navdrop.open").forEach(d => d.classList.remove("open"));
    closeMenu();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  function toggleMenu(force) {
    const links = document.getElementById("navlinks");
    const back = document.getElementById("nav-backdrop");
    const btn = document.getElementById("menu-btn");
    const open = force === undefined ? !links.classList.contains("open") : force;
    links.classList.toggle("open", open);
    back?.classList.toggle("show", open);
    btn?.classList.toggle("open", open);
  }
  function closeMenu() { toggleMenu(false); }

  async function signOut() {
    if (!window.confirm("Sign out?")) return;
    localStorage.removeItem("vr_account");
    sessionStorage.removeItem("vr_ok");
    if (window.VBackend && window.VBackend.signOut) { try { await window.VBackend.signOut(); } catch (e) {} }
    window.location.href = "index.html";
  }
  function profileSaveName() {
    const el = document.getElementById("pf-name");
    const v = (el && el.value.trim()) || "";
    if (!v) { if (el) el.focus(); return; }
    localStorage.setItem("vr_who", v);
    localStorage.setItem("vr_account", v);
    if (window.VBackend && window.VBackend.updateDisplayName) window.VBackend.updateDisplayName(v);
    const chip = document.getElementById("nav-profile");
    if (chip) { chip.textContent = v[0].toUpperCase(); chip.title = "Signed in as " + v; }
    toast("Gaming name saved");
    route();
  }
  function pfToggleNameEdit() {
    const disp = document.querySelector(".pf-name-display");
    const edit = document.getElementById("pf-name-edit");
    if (!disp || !edit) return;
    const show = edit.style.display === "none";
    edit.style.display = show ? "flex" : "none";
    disp.style.display = show ? "none" : "";
    if (show) { const inp = document.getElementById("pf-name"); if (inp) { inp.focus(); inp.select(); } }
  }
  function pfTogglePwEdit() {
    const el = document.getElementById("pf-pw-edit");
    if (!el) return;
    el.style.display = el.style.display === "none" ? "flex" : "none";
  }
  async function pfChangePassword() {
    const inp = document.getElementById("pf-pw-new");
    const v = (inp && inp.value || "").trim();
    if (v.length < 6) { toast("Password needs at least 6 characters"); if (inp) inp.focus(); return; }
    if (!window.VBackend || !window.VBackend.updatePassword) { toast("Backend not connected"); return; }
    const res = await window.VBackend.updatePassword(v);
    toast(res.ok ? "Password updated" : (res.message || "Couldn't update password"));
    if (res.ok && inp) inp.value = "";
  }
  // Profile page's own-stats strip — logins + this person's slice of computeContributions().
  async function loadProfileStats(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!window.VBackend) { el.innerHTML = ""; return; }
    const myWhoRaw = localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || "";
    const mine0 = identityFor(myWhoRaw);
    const [rows, logins] = await Promise.all([
      computeContributions(),
      window.VBackend.loadLogins ? window.VBackend.loadLogins() : []
    ]);
    const mine = (rows || []).find(o => o.key === mine0.key) || { fb: 0, likes: 0, votes: 0 };
    const loginCount = (logins || []).filter(r => identityFor(r.who).key === mine0.key).length;
    el.innerHTML = `
      <div class="dash-stat"><div class="dash-n">${loginCount}</div><div class="mute">logins</div></div>
      <div class="dash-stat"><div class="dash-n">${mine.fb}</div><div class="mute">feedback shared</div></div>
      <div class="dash-stat"><div class="dash-n">${mine.likes}</div><div class="mute">likes given</div></div>
      <div class="dash-stat"><div class="dash-n">${mine.votes}</div><div class="mute">votes cast</div></div>`;
  }
  // Effective image order for a character — shared/group-wide (from Supabase) first, falling back to
  // this browser's local copy (pre-save-button data, or offline), else the default gallery.
  let imgOrderShared = {}, imgHiddenShared = {};
  async function hydrateImageOrder() {
    if (!window.VBackend || !window.VBackend.loadImageOrder) return;
    const rows = await window.VBackend.loadImageOrder();
    imgOrderShared = {}; imgHiddenShared = {};
    rows.forEach(r => {
      if (!r.char_id) return;
      const oj = r.order_json;
      if (Array.isArray(oj)) { if (oj.length) imgOrderShared[r.char_id] = oj.map(toWebp); }   // legacy: bare order array
      else if (oj && typeof oj === "object") {
        if (Array.isArray(oj.order) && oj.order.length) imgOrderShared[r.char_id] = oj.order.map(toWebp);
        if (Array.isArray(oj.hidden) && oj.hidden.length) imgHiddenShared[r.char_id] = oj.hidden.map(toWebp);
      }
    });
  }
  function hiddenFor(charId) {
    let h = imgHiddenShared[charId];
    if (!h) { try { h = JSON.parse(localStorage.getItem("vr_imghidden_" + charId) || "null"); } catch (e) {} }
    return Array.isArray(h) ? h : [];
  }
  function orderedGallery(charId) {
    const base = (window.VEILRUN.galleries && window.VEILRUN.galleries[charId]) || [];
    const hidden = hiddenFor(charId);
    const vis = base.filter(s => !hidden.includes(s));   // archived shots drop off the character page
    let saved = imgOrderShared[charId];
    if (!saved) { try { saved = JSON.parse(localStorage.getItem("vr_imgorder_" + charId) || "null"); } catch (e) {} }
    if (!saved || !saved.length) return vis.slice();
    const inSaved = saved.filter(s => vis.includes(s));
    const rest = vis.filter(s => !inSaved.includes(s));
    return [...inSaved, ...rest];
  }
  function hasImgOrder(charId) {
    if (imgOrderShared[charId] && imgOrderShared[charId].length) return true;
    try { const s = JSON.parse(localStorage.getItem("vr_imgorder_" + charId) || "null"); return !!(s && s.length); }
    catch (e) { return false; }
  }
  // Map the signed-in account to a crew character (by name / alias / player / id).
  function myCharacter() {
    const who = localStorage.getItem("vr_account") || localStorage.getItem("vr_who") || "";
    return findCrewByWho(who);
  }

  /* ---- Profile image reorder — a draft buffer, only committed (localStorage + Supabase, group-wide)
     on explicit Save. Arrow/type/drag edits mutate the draft and re-render just the grid. ---- */
  let pfDraft = null; // { charId, order: [src, ...] }
  let pfDirty = false;
  function pfDraftFor(charId) {
    if (!pfDraft || pfDraft.charId !== charId) pfDraft = { charId, order: orderedGallery(charId).slice(), hidden: hiddenFor(charId).slice() };
    return pfDraft.order;
  }
  function pfMarkDirty() {
    pfDirty = true;
    const bar = document.getElementById("pf-savebar");
    if (bar) bar.classList.add("show");
  }
  function pfImgTilesHTML(ch, order) {
    return order.map((s, i) => `
      <div class="pf-img" data-idx="${i}">
        <div class="pf-img-thumb" style="background-image:url('${C.esc(s)}')">
          <span class="pf-img-rank">${i + 1}</span>
          <button class="pf-img-handle" onpointerdown="VApp.pfDragStart(event,'${ch.id}')" aria-label="Drag to reorder" title="Drag to reorder"><span class="grip">⠿</span></button>
          <button class="pf-img-hide" onclick="VApp.pfHideImg('${ch.id}',${i})" aria-label="Archive this image" title="Hide from the page (archive)">⊘</button>
          ${likeCount(s) > 0 ? `<span class="pf-img-likes">♥ ${likeCount(s)}</span>` : ""}
        </div>
        <div class="pf-img-ctrls">
          <button ${i === 0 ? "disabled" : ""} onclick="VApp.profileMoveImg('${ch.id}',${i},-1)" aria-label="Move up">↑</button>
          <input class="pf-img-pos" type="number" min="1" max="${order.length}" value="${i + 1}" inputmode="numeric" aria-label="Move to position" onchange="VApp.profileMoveImgTo('${ch.id}',${i},this.value)" />
          <button ${i === order.length - 1 ? "disabled" : ""} onclick="VApp.profileMoveImg('${ch.id}',${i},1)" aria-label="Move down">↓</button>
        </div>
      </div>`).join("");
  }
  function pfArchiveHTML(ch, hidden) {
    if (!hidden || !hidden.length) return "";
    return `<div class="pf-arch-head">Archived · ${hidden.length} <span class="mute" style="font-weight:400;text-transform:none;letter-spacing:0">— hidden from ${C.esc(ch.name)}'s page</span></div>
      <div class="pf-arch-grid">${hidden.map((s, i) => `
        <div class="pf-arch">
          <div class="pf-arch-thumb" style="background-image:url('${C.esc(s)}')">${likeCount(s) > 0 ? `<span class="pf-img-likes">♥ ${likeCount(s)}</span>` : ""}</div>
          <button class="pf-restore" onclick="VApp.pfRestoreImg('${ch.id}',${i})">↩ Restore</button>
        </div>`).join("")}</div>`;
  }
  function renderPfGrid(charId) {
    const grid = document.getElementById("pf-img-grid");
    const ch = (D.crew || []).find(c => c.id === charId);
    if (!grid || !ch) return;
    pfDraftFor(charId);
    grid.innerHTML = pfImgTilesHTML(ch, pfDraft.order);
    const arch = document.getElementById("pf-archive");
    if (arch) arch.innerHTML = pfArchiveHTML(ch, pfDraft.hidden);
  }
  function pfHideImg(charId, index) {
    pfDraftFor(charId);
    const [s] = pfDraft.order.splice(index, 1);
    if (s) pfDraft.hidden.push(s);
    pfMarkDirty(); renderPfGrid(charId);
  }
  function pfRestoreImg(charId, index) {
    pfDraftFor(charId);
    const [s] = pfDraft.hidden.splice(index, 1);
    if (s) pfDraft.order.push(s);
    pfMarkDirty(); renderPfGrid(charId);
  }
  function profileMoveImg(charId, index, dir) {
    const arr = pfDraftFor(charId);
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    const t = arr[index]; arr[index] = arr[j]; arr[j] = t;
    pfMarkDirty();
    renderPfGrid(charId);
  }
  // Move image at fromIndex to a 1-based target position (typed in the pf-img-pos field, or dropped via drag).
  function profileMoveImgTo(charId, fromIndex, toPos) {
    const arr = pfDraftFor(charId);
    let to = Math.round(Number(toPos)) - 1;
    if (isNaN(to)) { renderPfGrid(charId); return; }
    to = Math.max(0, Math.min(arr.length - 1, to));
    if (to === fromIndex) { renderPfGrid(charId); return; }
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(to, 0, moved);
    pfMarkDirty();
    renderPfGrid(charId);
  }
  async function pfSaveOrder(charId) {
    pfDraftFor(charId);
    const order = pfDraft.order.slice(), hidden = pfDraft.hidden.slice();
    imgOrderShared[charId] = order; imgHiddenShared[charId] = hidden;
    localStorage.setItem("vr_imgorder_" + charId, JSON.stringify(order));
    localStorage.setItem("vr_imghidden_" + charId, JSON.stringify(hidden));
    pfDirty = false;
    const bar = document.getElementById("pf-savebar"); if (bar) bar.classList.remove("show");
    if (window.VBackend && window.VBackend.saveImageOrder) {
      const ok = await window.VBackend.saveImageOrder(charId, order, hidden);
      toast(ok ? "Saved — everyone will see this" : "Saved on this device (couldn't reach the server)");
    } else {
      toast("Saved on this device");
    }
  }
  function pfDiscardOrder(charId) {
    pfDraft = { charId, order: orderedGallery(charId).slice(), hidden: hiddenFor(charId).slice() };
    pfDirty = false;
    const bar = document.getElementById("pf-savebar"); if (bar) bar.classList.remove("show");
    renderPfGrid(charId);
  }
  // Pointer-based drag reorder (mouse + touch) for the profile image grid, with a ghost tile that
  // follows the cursor. Started from the ⠿ handle so it doesn't fight with page-scroll on mobile.
  function pfDragStart(e, charId) {
    e.preventDefault();
    const handle = e.currentTarget;
    const tile = handle.closest(".pf-img");
    const container = tile.parentElement;
    if (!tile || !container) return;
    const fromIdx = Number(tile.dataset.idx);
    let hoverIdx = fromIdx;
    tile.classList.add("dragging");
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    const thumb = tile.querySelector(".pf-img-thumb");
    const rect = tile.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "pf-img-ghost";
    if (thumb) ghost.style.backgroundImage = thumb.style.backgroundImage;
    ghost.style.width = rect.width + "px";
    ghost.style.height = (rect.height + (thumb ? 0 : 0)) + "px";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    document.body.appendChild(ghost);
    const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
    const tileAt = (x, y) => {
      const tiles = [...container.querySelectorAll(".pf-img")];
      return tiles.find(t => {
        const r = t.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
    };
    const onMove = (ev) => {
      ghost.style.left = (ev.clientX - offX) + "px";
      ghost.style.top = (ev.clientY - offY) + "px";
      const t = tileAt(ev.clientX, ev.clientY);
      container.querySelectorAll(".pf-img").forEach(x => x.classList.remove("drop-target"));
      if (t) { hoverIdx = Number(t.dataset.idx); t.classList.add("drop-target"); }
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      ghost.remove();
      tile.classList.remove("dragging");
      container.querySelectorAll(".pf-img").forEach(x => x.classList.remove("drop-target"));
      if (hoverIdx !== fromIdx) profileMoveImgTo(charId, fromIdx, hoverIdx + 1);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function toggleDrop(e) {
    e.stopPropagation();
    const d = e.currentTarget.closest(".navdrop");
    const open = !d.classList.contains("open");
    document.querySelectorAll(".navdrop.open").forEach(x => x.classList.remove("open"));
    d.classList.toggle("open", open);
  }

  function initLightboxGestures() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;
    let sx = 0, sy = 0;
    lb.addEventListener("touchstart", e => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (lbState.zoom > 1) return; // panning/pinched — don't also treat as a page-swipe
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) lbStep(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener("keydown", e => {
      if (!lbIsOpen()) return;
      if (e.key === "ArrowRight") lbStep(1);
      else if (e.key === "ArrowLeft") lbStep(-1);
      else if (e.key === "Escape") lbClose();
    });
    initLightboxZoom();
  }
  // Double-click/double-tap to zoom, scroll to zoom, drag to pan when zoomed in.
  function initLightboxZoom() {
    const img = document.querySelector("#lightbox .lb-img");
    if (!img) return;
    img.style.transition = "transform .15s ease";
    img.style.touchAction = "none";
    const zoomAt = (clientX, clientY, z) => {
      const rect = img.getBoundingClientRect();
      img.style.transformOrigin = (((clientX - rect.left) / rect.width) * 100) + "% " + (((clientY - rect.top) / rect.height) * 100) + "%";
      lbState.zoom = z;
      if (z === 1) { lbState.panX = 0; lbState.panY = 0; }
      applyLbTransform();
    };
    img.addEventListener("wheel", e => {
      if (!lbIsOpen() || lbState.mode !== "single") return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.min(4, Math.max(1, +(lbState.zoom + (e.deltaY < 0 ? 0.3 : -0.3)).toFixed(2))));
    }, { passive: false });
    img.addEventListener("dblclick", e => zoomAt(e.clientX, e.clientY, lbState.zoom > 1 ? 1 : 2.5));
    let panStart = null;
    img.addEventListener("pointerdown", e => {
      if (lbState.zoom <= 1) return;
      panStart = { x: e.clientX, y: e.clientY, panX: lbState.panX, panY: lbState.panY };
      try { img.setPointerCapture(e.pointerId); } catch (err) {}
      img.style.transition = "none";
    });
    img.addEventListener("pointermove", e => {
      if (!panStart) return;
      lbState.panX = panStart.panX + (e.clientX - panStart.x);
      lbState.panY = panStart.panY + (e.clientY - panStart.y);
      applyLbTransform();
    });
    const endPan = () => { if (panStart) { panStart = null; img.style.transition = "transform .15s ease"; } };
    img.addEventListener("pointerup", endPan);
    img.addEventListener("pointercancel", endPan);
  }

  function init() {
    if (!requireGate()) return;
    const sel = document.getElementById("fb-who");
    if (sel) sel.innerHTML = '<option value="">— pick your name —</option>'
      + D.crew.map(c => `<option value="${C.esc(c.name)}">${C.esc(c.name)} (${C.esc(c.player)})</option>`).join("")
      + '<option value="__other__">Someone else…</option>';
    const gsel = document.getElementById("gref-who");
    if (gsel) gsel.innerHTML = '<option value="">— pick your name —</option>'
      + D.crew.map(c => `<option value="${C.esc(c.name)}">${C.esc(c.name)} (${C.esc(c.player)})</option>`).join("")
      + '<option value="__other__">Someone else…</option>';
    // The seeded catalogue is the autocomplete source — recognition beats recall, and it
    // means almost nobody types a raw name, so dedupe is near-perfect from day one.
    const cat = document.getElementById("gref-catalogue");
    if (cat) cat.innerHTML = Object.keys(D.gameRefs || {})
      .map(s => `<option value="${C.esc((D.gameRefs[s] || {}).name || s)}"></option>`).join("");
    window.addEventListener("hashchange", route); initLightboxGestures();
    window.addEventListener("beforeunload", e => { if (pfDirty) { e.preventDefault(); e.returnValue = ""; } });
    document.addEventListener("click", e => {
      if (!e.target.closest(".navdrop")) document.querySelectorAll(".navdrop.open").forEach(d => d.classList.remove("open"));
    });
    // Mobile: a dropdown header (Hub / Characters) toggles its submenu as an accordion —
    // opening one closes the other, so the bottom sheet stays short. Desktop keeps hover + navigation.
    document.querySelectorAll(".navdrop-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        if (!window.matchMedia("(max-width: 639px)").matches) return;
        e.preventDefault();
        const d = btn.closest(".navdrop");
        const willOpen = !d.classList.contains("open");
        document.querySelectorAll(".navdrop.open").forEach(x => x.classList.remove("open"));
        if (willOpen) d.classList.add("open");
      });
    });
    const acct = localStorage.getItem("vr_account");
    const chip = document.getElementById("nav-profile");
    if (chip) {
      if (acct) { chip.textContent = acct.trim()[0].toUpperCase(); chip.style.display = "flex"; chip.title = "Signed in as " + acct + " — click to sign out"; }
      else chip.style.display = "none";
    }
    // Reveal account-only nav items (Landing, Leaderboard) for signed-in accounts.
    document.querySelectorAll("[data-account]").forEach(el => { el.style.display = acct ? "" : "none"; });
    // Log one login per browser session (not per page-view) for the profile stats.
    if (acct && window.VBackend && window.VBackend.logLogin && !sessionStorage.getItem("vr_login_logged")) {
      sessionStorage.setItem("vr_login_logged", "1");
      window.VBackend.logLogin();
    }
    route();
    // Load group likes + lab votes, then re-render so hearts/favorites/vote counts show.
    // Hub is stale-while-revalidate: it renders from cache above, then refreshes here.
    Promise.all([hydrateLikes(), hydrateVotes(), hydrateImageOrder(), hydrateHub()]).then(() => route());
  }

  const galMore = galLoadMore;
  // Test seam for _hubcheck.js — lets the harness render every hub user state headlessly
  // without a network or a signed-in account. Not used by the site itself.
  const __renderHub = (state) => { hubData = state; return views.hub(); };
  const __hubType = () => hubUserType();
  // Test seam for _updatescheck.js. The harness mutates VEILRUN.weekly in place (D holds
  // the same object reference) and re-renders; `now` lets it age the summary past the
  // 14-day cliff without touching the clock.
  const __renderUpdates = () => views.updates();
  const __weeklyHero = (now) => weeklyHero(now);

  // Scroll past the weekly hero to the log itself. The hero sits above 107 entries on a
  // phone, so there has to be one tap out of it — and it can't be an href, because every
  // hash on this site is a route and "#upd-log" would navigate instead of scrolling.
  function wkSkip() {
    const el = document.getElementById("upd-log");
    if (!el || !el.scrollIntoView) return;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  }
  // Test seams for _grefcheck.js — let the harness drive slug resolution, matching and card
  // rendering headlessly, with no network and no signed-in account.
  const __grefSlug = grefSlug;
  const __grefMatch = grefMatch;
  const __grefCard = (slug, notes, refs) => grefCardHtml(slug, notes, refs || []);
  const __loomPanel = loomPanel;

  return { init, route, toggleMenu, toggleDrop, signOut, __renderHub, __hubType, __renderUpdates, __weeklyHero, wkSkip,
    __grefSlug, __grefMatch, __grefCard, __loomPanel,
    grefOpen, grefClose, grefSubmit, grefWhoChange, grefNameChange, grefPick, grefMore, grefSort, grefToggle, grefHalf, grefExpand, grefArtFail, profileSaveName, pfToggleNameEdit, pfTogglePwEdit, pfChangePassword, profileMoveImg, profileMoveImgTo, pfDragStart, pfSaveOrder, pfDiscardOrder, pfHideImg, pfRestoreImg, feedback, fbClose, fbSubmit, fbWhoChange, crewView, synMode, synPick, galStep, galGo, galLike, galDropdown, galSetAll, galToggleFilter, galSort, galFavMode, galMore, lbOpen, lbStep, lbClose, lbLike, lbToggleMode, lbPick, lbSize, threatsView, labVote, boardFilter, counterVote, gameBoardVer, gameBoardCombo, gameBoardLevel };
})();
document.addEventListener("DOMContentLoaded", VApp.init);
