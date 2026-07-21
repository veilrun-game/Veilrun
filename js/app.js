/* VEILRUN — App shell: soft-gate check, hash router, view renderers. */
window.VApp = (function () {
  const D = window.VEILRUN, C = window.VC;
  const view = () => document.getElementById("view");

  function requireGate() {
    if (sessionStorage.getItem("vr_ok") !== "1") { window.location.href = "index.html"; return false; }
    return true;
  }

  // Crew view mode persists
  const getCrewView = () => localStorage.getItem("vr_crewview") || "tiles";
  function setCrewView(v) { localStorage.setItem("vr_crewview", v); views_render_crew(); }

  const views = {
    hub() {
      const jumps = [
        ["#world","The World","The two layers, the Sundering, the factions."],
        ["#crew","The Last Fluent","The nine fluent in both. Kits, codenames, synergies."],
        ["#threats","Threats","The Severant and the roster."],
        ["#synergy","Synergy","The matrix + combo builder."],
        ["#gallery","Gallery","Every concept image, by category."],
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
      const uRow = u => `<div class="kit-row"><span class="mute" style="font-size:.8rem">${C.esc(u.date)}</span><div>${C.esc(u.text)}</div></div>`;
      return `
        <section class="hub-hero wrap">
          ${C.sectionHeader("Home base","Welcome back, crew")}
          <div class="latest">
            ${D.cover ? `<img src="${C.esc(D.cover)}" alt="Veilrun" loading="lazy" />` : ""}
            <div class="l-body">
              <p class="eyebrow">Latest update · ${C.esc(latest.date)}</p>
              <h2 style="margin:.4rem 0">${C.esc(latest.text)}</h2>
              <p class="mute">Dig in below, and react to anything — it only works if it's ours.</p>
              <div class="hero-btns"><a class="btn" href="#crew">Meet the crew</a> <button class="btn ghost" onclick="VApp.feedback('General thought','idea')">＋ Share a thought</button></div>
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
      const cover = D.cover || "assets/img/cover.png";
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
        const imgs = [l.img, ...worldItems.filter(w => w.name === l.name).map(w => w.src)].filter((v, i, a) => v && a.indexOf(v) === i);
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
      if (galState.favOnly) filtered = filtered.filter(i => isGroupFav(i.src));
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
      const favBtn = `<button class="dd-btn favtoggle ${galState.favOnly ? "active" : ""}" onclick="VApp.galFavOnly()">${galState.favOnly ? "★" : "☆"} Favorites only</button>`;
      const grid = shown.length
        ? shown.map((it, idx) => galItemHTML(it, idx, `VApp.lbOpen('gallery', ${idx})`)).join("")
        : `<p class="hint" style="grid-column:1/-1">No favorites yet — ♥ images and they'll collect here.</p>`;
      const more = hasMore ? `<div id="gal-more"><div id="gal-sentinel" style="height:1px"></div><div style="text-align:center;margin-top:1rem"><button class="btn ghost" onclick="VApp.galMore()">Load more</button></div></div>` : "";
      return `<div class="wrap section">
        ${C.sectionHeader("Part Three","Gallery")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">${items.length} renders, grouped by character. Filter to anyone, choose a sort, ♥ favorites glow. Tap any image for the big view — then <strong>▦ All</strong> for a resizable grid.</p>
        <div class="filters">${dd}${sortSel}${favBtn}</div>
        <div class="masonry" id="masonry">${grid}</div>
        ${more}
        <p class="mute" id="gal-count" style="text-align:center;margin-top:.8rem;font-size:.8rem">Showing ${shown.length} of ${filtered.length}</p>
      </div>`;
    },

    lab() {
      const cta = `<div class="panel cta-card" onclick="VApp.feedback('New mode idea','idea')">
        <div class="eyebrow">Your turn</div>
        <h3 style="margin:.3rem 0">＋ Pitch a game mode</h3>
        <p class="mute">Got an idea for how Veilrun could play? Add it to the list.</p>
      </div>`;
      const cards = D.modes.map(C.modeCard).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("The Lab","Game ideas, votes & experiments")}
        <p class="mute" style="max-width:62ch;margin-top:1rem">Every concept on the table — vote, react, and (soon) play prototypes in place. Naming votes and ballots fold in here.</p>
        <div class="grid cols-3" style="margin-top:1.5rem">${cta}${cards}</div>
      </div>`;
    },

    updates() {
      const total = D.updates.length;
      const dayCounts = {};
      D.updates.forEach(u => {
        const [y, m, d] = String(u.date).split("-").map(Number);
        const day = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, { weekday: "long" });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const busiest = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
      const list = D.updates.map(u => `<div class="kit-row"><span class="mute" style="font-size:.8rem">${C.esc(u.date)}</span><div>${C.esc(u.text)}</div></div>`).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("Log","Updates")}
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
        <div class="panel" style="margin-top:1.5rem">${list}</div>
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
        <p class="mute" style="max-width:62ch;margin-top:1rem">Who's shaping Veilrun the most. Points for contributing — <strong>feedback counts triple</strong>, likes and votes count too. Crew-only for now; once logins are in, activity will factor in as well.</p>
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
          <p class="mute" style="font-size:.85rem;margin:0 0 var(--s-4)">Reorder how ${C.esc(ch.name)}'s concept art appears on the character page, for everyone. #1 shows first — drag the ⠿ handle, type a position, or use the arrows. ♥ shows how many likes that shot has.</p>
          <div id="pf-savebar" class="pf-savebar${pfDirty && pfDraft && pfDraft.charId === ch.id ? " show" : ""}">
            <span class="mute" style="font-size:.82rem">Unsaved changes</span>
            <div class="pf-savebar-btns">
              <button class="btn" onclick="VApp.pfSaveOrder('${ch.id}')">Save order</button>
              <button class="btn ghost" onclick="VApp.pfDiscardOrder('${ch.id}')">Discard</button>
            </div>
          </div>
          <div id="pf-img-grid" class="pf-img-grid">${imgTiles}</div>
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
      const cols = b.columns.map(col => `
        <div class="bcol">
          <div class="bcol-h">${C.esc(col.name)} <span class="mute">${col.cards.length}</span></div>
          ${col.cards.map(c => `<div class="bcard">
            <div class="bcard-t">${C.esc(c.t)}</div>
            <div class="bcard-m"><span class="bid">${C.esc(c.id)}</span> ${c.pri ? `<span class="bpri ${priClass(c.pri)}">${C.esc(c.pri)}</span>` : ""} <span class="mute">${C.esc(c.who)}</span></div>
          </div>`).join("")}
        </div>`).join("");
      return `<div class="wrap section">
        ${C.sectionHeader("The plan","Board")}
        <p class="mute" style="max-width:64ch;margin-top:1rem">Where things stand — updated ${C.esc(b.updated)}. This mirrors our working board so everyone can see progress and what's coming.</p>
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
          ${C.characterCard(D.crew[0])}
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
    if (m.gallery && m.gallery.length) return m.gallery;
    if (m.dir && m.count) return Array.from({ length: m.count }, (_, i) => m.dir + "/" + String(i + 1).padStart(2, "0") + ".png");
    return [];
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
  const myWho = () => localStorage.getItem("vr_who") || "anon";
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
      likeAll.add(r.image_src);
      likeCounts[r.image_src] = (likeCounts[r.image_src] || 0) + 1;
      if (r.who === who) likeMine.add(r.image_src);
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
    const [fb, likes, votes] = await Promise.all([
      window.VBackend.loadFeedback ? window.VBackend.loadFeedback() : [],
      window.VBackend.loadLikes(),
      window.VBackend.loadVotes()
    ]);
    const weekAgo = Date.now() - 7 * 864e5;
    const P = {};
    const ensure = (key) => (P[key] = P[key] || { key, charName: null, gamingName: null, lastWho: null, lastAt: 0, fb: 0, likes: 0, votes: 0, week: 0 });
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
    const rows = Object.values(P);
    rows.forEach(o => { o.points = o.fb * 3 + o.likes + o.votes; o.displayName = o.gamingName || o.lastWho || o.key; });
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
        <p class="mute" style="margin:.2rem 0 0">${weekTop.week} piece${weekTop.week === 1 ? "" : "s"} of feedback in the last 7 days. 🔥</p>
      </div>` : "";
    const list = rows.map((o, i) => `
      <div class="lb-row${i < 3 ? " lb-top" : ""}">
        <div class="lb-pos">${medal(i)}</div>
        <div class="lb-who">${C.esc(lbName(o.displayName))}${o.charName ? `<span class="lb-tag">${C.esc(o.charName)}</span>` : ""}</div>
        <div class="lb-detail mute">${o.fb} feedback · ${o.likes} likes · ${o.votes} votes</div>
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
    const chorus = sel.length === 9;
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
  const galState = { filters: new Set(), sort: "char", dropdownOpen: false, limit: 24, _filtered: [], favOnly: false };
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
    const badge = c > 1 ? `<span class="likebadge">♥ ${c}</span>` : "";
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
  function galFavOnly() { galState.favOnly = !galState.favOnly; galState.limit = 24; galRender(); }
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
      if (c > 1) { const b = document.createElement("span"); b.className = "likebadge"; b.textContent = "♥ " + c; wrap.appendChild(b); }
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

  // ---- Feedback modal ----
  let fbCtx = { context: "", type: "idea" };
  function feedback(context, type) {
    // Global nav button passes no context — auto-tag with the page you're on.
    if (!context) {
      const r = (location.hash || "#hub").slice(1).split("/")[0];
      const map = { world: "The World", crew: "The Crew", threats: "Threats", synergy: "Synergy",
        gallery: "Gallery", lab: "The Lab", updates: "Updates", feedback: "Feedback page", board: "Board / priorities", design: "Design system" };
      context = map[r] || "";
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
    else if (name === "threats" && arg) html = views.threat(arg, sub);
    else if (name === "landing" && window.VLanding) html = VLanding.view();
    else if (views[name]) html = views[name]();
    else html = views.hub();
    view().innerHTML = html;
    if (name === "gallery") setupGalleryLazy();
    if (name === "lab") refreshVotes();
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
  let imgOrderShared = {};
  async function hydrateImageOrder() {
    if (!window.VBackend || !window.VBackend.loadImageOrder) return;
    const rows = await window.VBackend.loadImageOrder();
    imgOrderShared = {};
    rows.forEach(r => { if (r.char_id && Array.isArray(r.order_json) && r.order_json.length) imgOrderShared[r.char_id] = r.order_json; });
  }
  function orderedGallery(charId) {
    const base = (window.VEILRUN.galleries && window.VEILRUN.galleries[charId]) || [];
    let saved = imgOrderShared[charId];
    if (!saved) { try { saved = JSON.parse(localStorage.getItem("vr_imgorder_" + charId) || "null"); } catch (e) {} }
    if (!saved || !saved.length) return base.slice();
    const inSaved = saved.filter(s => base.includes(s));
    const rest = base.filter(s => !inSaved.includes(s));
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
    if (!pfDraft || pfDraft.charId !== charId) pfDraft = { charId, order: orderedGallery(charId).slice() };
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
          <button class="pf-img-handle" onpointerdown="VApp.pfDragStart(event,'${ch.id}')" aria-label="Drag to reorder" title="Drag to reorder">⠿</button>
          ${likeCount(s) > 0 ? `<span class="pf-img-likes">♥ ${likeCount(s)}</span>` : ""}
        </div>
        <div class="pf-img-ctrls">
          <button ${i === 0 ? "disabled" : ""} onclick="VApp.profileMoveImg('${ch.id}',${i},-1)" aria-label="Move up">↑</button>
          <input class="pf-img-pos" type="number" min="1" max="${order.length}" value="${i + 1}" inputmode="numeric" aria-label="Move to position" onchange="VApp.profileMoveImgTo('${ch.id}',${i},this.value)" />
          <button ${i === order.length - 1 ? "disabled" : ""} onclick="VApp.profileMoveImg('${ch.id}',${i},1)" aria-label="Move down">↓</button>
        </div>
      </div>`).join("");
  }
  function renderPfGrid(charId) {
    const grid = document.getElementById("pf-img-grid");
    const ch = (D.crew || []).find(c => c.id === charId);
    if (!grid || !ch) return;
    grid.innerHTML = pfImgTilesHTML(ch, pfDraftFor(charId));
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
    const order = pfDraftFor(charId).slice();
    imgOrderShared[charId] = order;
    localStorage.setItem("vr_imgorder_" + charId, JSON.stringify(order));
    pfDirty = false;
    const bar = document.getElementById("pf-savebar"); if (bar) bar.classList.remove("show");
    if (window.VBackend && window.VBackend.saveImageOrder) {
      const ok = await window.VBackend.saveImageOrder(charId, order);
      toast(ok ? "Saved — everyone will see this order" : "Saved on this device (couldn't reach the server)");
    } else {
      toast("Saved on this device");
    }
  }
  function pfDiscardOrder(charId) {
    pfDraft = { charId, order: orderedGallery(charId).slice() };
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
    Promise.all([hydrateLikes(), hydrateVotes(), hydrateImageOrder()]).then(() => route());
  }

  const galMore = galLoadMore;
  return { init, route, toggleMenu, toggleDrop, signOut, profileSaveName, pfToggleNameEdit, pfTogglePwEdit, pfChangePassword, profileMoveImg, profileMoveImgTo, pfDragStart, pfSaveOrder, pfDiscardOrder, feedback, fbClose, fbSubmit, fbWhoChange, crewView, synMode, synPick, galStep, galGo, galLike, galDropdown, galSetAll, galToggleFilter, galSort, galFavOnly, galMore, lbOpen, lbStep, lbClose, lbLike, lbToggleMode, lbPick, lbSize, threatsView, labVote };
})();
document.addEventListener("DOMContentLoaded", VApp.init);
