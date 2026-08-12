/* VEILRUN — Updates page / weekly hero harness (VR-97)
   Renders views.updates() against the real app.js in a DOM stub for every state the
   weekly summary can be in, and asserts the one rule the feature lives or dies by:

     when VEILRUN.weekly is missing, malformed or stale, the page falls back to
     EXACTLY the page it rendered before this feature existed.

   That baseline isn't hand-written here — it's rendered from the last committed
   js/app.js via `git show HEAD:js/app.js` and diffed. Hand-copied baselines rot the
   moment someone edits the view, and then the check quietly proves nothing.
   (No git, or the file is already committed? The baseline checks skip loudly rather
   than passing silently — see the SKIP lines in the output.)

   Run from the repo root:  node _updatescheck.js                                    */

const fs = require("fs"), vm = require("vm"), path = require("path"), cp = require("child_process");
let pass = 0; const fails = [], skips = [];
const ok = (name, cond, detail) => { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); };

/* A live weekly object, dated relative to "now" so the suite never expires. */
const dstr = (daysAgo) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
const FRESH = () => ({
  weekStart: dstr(6), weekEnding: dstr(0),
  headline: "Two new kinds of game",
  blurb: "A blurb that says what the week amounted to.",
  metrics: [{ label: "new kinds of game", value: "2" }, { label: "updates shipped", value: 7 }],
  image: { src: "assets/world/gameplay-views/04.webp", alt: "Underweft street", why: "matches what shipped" },
  highlights: [{ label: "Play Rook Signal", href: "#games/story-cyoa" }]
});

function build(appSource) {
  const ctx = {
    console,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    location: { hash: "#updates" },
    matchMedia: () => ({ matches: false }),
    document: {
      getElementById: () => null, querySelectorAll: () => [], querySelector: () => null,
      addEventListener: () => {},
      createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } })
    },
    setTimeout, clearTimeout, Promise, Date, Math, JSON, RegExp, String, Number, Array, Object
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["js/data.js", "js/galleries.js", "js/components.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), ctx, { filename: f });
  }
  vm.runInContext(appSource !== undefined ? appSource : fs.readFileSync(path.join(__dirname, "js/app.js"), "utf8"),
    ctx, { filename: "js/app.js" });
  return ctx;
}

/* Mutate VEILRUN.weekly in place — app.js captured the same object reference as D. */
function renderWith(weekly, appSource) {
  const ctx = build(appSource);
  if (!ctx.VApp || typeof ctx.VApp.__renderUpdates !== "function") {
    throw new Error("VApp.__renderUpdates missing — the test hook was removed from app.js");
  }
  if (weekly === undefined) delete ctx.VEILRUN.weekly; else ctx.VEILRUN.weekly = weekly;
  return ctx.VApp.__renderUpdates();
}
const heroOf = (html) => (html.match(/<section class="wk"[\s\S]*?<\/section>/) || [""])[0];
const norm = (s) => s.replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------ 1. weekly present */
{
  const w = FRESH();
  const html = renderWith(w);
  const hero = heroOf(html);
  ok("present: hero renders", !!hero);
  ok("present: hero is above the stats strip", html.indexOf('class="wk"') < html.indexOf("dash-stats"));
  ok("present: headline shown", hero.indexOf(w.headline) > -1);
  ok("present: blurb shown", hero.indexOf(w.blurb) > -1);
  ok("present: both metrics shown", (hero.match(/class="wk-metric"/g) || []).length === 2);
  ok("present: numeric metric value survives", /<span class="wk-n">7<\/span>/.test(hero));
  ok("present: image shown with alt", hero.indexOf(w.image.src) > -1 && hero.indexOf(w.image.alt) > -1);
  ok("present: highlight link shown", /href="#games\/story-cyoa"/.test(hero));
  ok("present: skip control exists", /class="wk-skip"/.test(hero));
  ok("present: skip target id exists", /id="upd-log"/.test(html));
  ok("present: log still renders in full",
    (html.match(/class="kit-row"/g) || []).length === build().VEILRUN.updates.length);
  ok("present: no undefined leaked", !/undefined|\[object Object\]|NaN/.test(html));
  ok("present: skip is not an href (would hijack the router)", !/wk-skip"[^>]*href/.test(hero));
  // Casing rule: controls are sentence case. Uppercase is CSS's job on titling only.
  ok("present: controls are sentence case",
    !/>[A-Z][A-Z ]{3,}</.test(hero.replace(/class="eyebrow"[\s\S]*?<\/p>/, "")));
}

/* -------------------------------------------- 2-4. the three fallback states */
const BAD = {
  absent: undefined,
  "not an object": "last week was good",
  "array, not an object": [{ headline: "x" }],
  "no headline": Object.assign(FRESH(), { headline: "" }),
  "no blurb": Object.assign(FRESH(), { blurb: "   " }),
  "headline is not a string": Object.assign(FRESH(), { headline: 42 }),
  "no weekEnding": Object.assign(FRESH(), { weekEnding: undefined }),
  "weekEnding not a date": Object.assign(FRESH(), { weekEnding: "last friday" }),
  "weekEnding impossible": Object.assign(FRESH(), { weekEnding: "2026-02-31" }),
  "stale by 15 days": Object.assign(FRESH(), { weekStart: dstr(21), weekEnding: dstr(15) }),
  "stale by a year": Object.assign(FRESH(), { weekStart: dstr(372), weekEnding: dstr(365) }),
  "dated far in the future": Object.assign(FRESH(), { weekStart: dstr(-30), weekEnding: dstr(-24) })
};
const fallbackRenders = {};
Object.keys(BAD).forEach(name => {
  const html = renderWith(BAD[name]);
  fallbackRenders[name] = html;
  ok("fallback (" + name + "): no hero", !/class="wk"/.test(html));
  ok("fallback (" + name + "): no undefined leaked", !/undefined|\[object Object\]|NaN/.test(html));
  ok("fallback (" + name + "): no orphan skip target", !/id="upd-log"/.test(html));
  ok("fallback (" + name + "): log intact",
    (html.match(/class="kit-row"/g) || []).length === build().VEILRUN.updates.length);
  ok("fallback (" + name + "): stats strip intact", /updates shipped so far/.test(html));
  ok("fallback (" + name + "): resolved panel intact", /You asked, we listened/.test(html));
});

/* Every failure mode must produce the SAME page, not merely a page without a hero. */
{
  const names = Object.keys(fallbackRenders);
  const first = fallbackRenders[names[0]];
  names.slice(1).forEach(n => ok("fallback (" + n + "): identical to absent", fallbackRenders[n] === first));
}

/* --------------------------- 5. edge of the staleness cliff, from both sides */
{
  ok("day 13: still renders", /class="wk"/.test(renderWith(Object.assign(FRESH(), { weekStart: dstr(19), weekEnding: dstr(13) }))));
  ok("day 14: still renders (boundary is inclusive)", /class="wk"/.test(renderWith(Object.assign(FRESH(), { weekStart: dstr(20), weekEnding: dstr(14) }))));
  ok("day 15: gone", !/class="wk"/.test(renderWith(Object.assign(FRESH(), { weekStart: dstr(21), weekEnding: dstr(15) }))));
  // A Friday-evening regeneration in a westward timezone can look a day early. It must
  // not blank the hero — only a nonsense future date should.
  ok("tomorrow: tolerated", /class="wk"/.test(renderWith(Object.assign(FRESH(), { weekStart: dstr(5), weekEnding: dstr(-1) }))));
}

/* ------------------------------------- 6. missing OPTIONAL fields degrade, not fail */
{
  const cases = {
    "no metrics": { metrics: undefined },
    "metrics not an array": { metrics: "2 games" },
    "metrics empty": { metrics: [] },
    "metric missing a label": { metrics: [{ value: "2" }] },
    "metric missing a value": { metrics: [{ label: "new kinds of game" }] },
    "metric value is null": { metrics: [{ label: "x", value: null }] },
    "metric value is zero": { metrics: [{ label: "quiet week", value: 0 }] },
    "no image": { image: undefined },
    "image with no src": { image: { alt: "nothing" } },
    "image src is blank": { image: { src: "  " } },
    "image with no alt": { image: { src: "assets/img/cover.webp" } },
    "no highlights": { highlights: undefined },
    "highlights not an array": { highlights: "#games" },
    "highlight missing href": { highlights: [{ label: "Play it" }] },
    "highlight missing label": { highlights: [{ href: "#games" }] },
    "no weekStart": { weekStart: undefined },
    "weekStart after weekEnding": { weekStart: dstr(-3) }
  };
  Object.keys(cases).forEach(name => {
    const html = renderWith(Object.assign(FRESH(), cases[name]));
    ok("partial (" + name + "): hero still renders", /class="wk"/.test(html));
    ok("partial (" + name + "): no undefined leaked", !/undefined|\[object Object\]|NaN/.test(html));
    ok("partial (" + name + "): log intact", /class="kit-row"/.test(html));
  });
  // The specific leaks worth naming, because they're what a half-written object produces.
  const noAlt = heroOf(renderWith(Object.assign(FRESH(), { image: { src: "assets/img/cover.webp" } })));
  ok("partial: missing alt falls back to the headline, never empty", /alt="Two new kinds of game"/.test(noAlt));
  const noImg = heroOf(renderWith(Object.assign(FRESH(), { image: undefined })));
  ok("partial: no image means no <figure> at all", !/<figure/.test(noImg) && !/<img/.test(noImg));
  const badMetric = heroOf(renderWith(Object.assign(FRESH(), { metrics: [{ value: "2" }, { label: "ok", value: "3" }] })));
  ok("partial: unlabelled metric is dropped, labelled one kept",
    (badMetric.match(/class="wk-metric"/g) || []).length === 1);
  const zero = heroOf(renderWith(Object.assign(FRESH(), { metrics: [{ label: "quiet week", value: 0 }] })));
  ok("partial: a zero metric is shown, not swallowed as falsy", /<span class="wk-n">0<\/span>/.test(zero));
  const emptyM = heroOf(renderWith(Object.assign(FRESH(), { metrics: [] })));
  ok("partial: empty metrics means no empty <ul>", !/wk-metrics/.test(emptyM));
  const emptyH = heroOf(renderWith(Object.assign(FRESH(), { highlights: [] })));
  ok("partial: empty highlights means no empty link row", !/wk-links/.test(emptyH));
}

/* ------------------------------------------------- 7. caps and escaping hold */
{
  const html = renderWith(Object.assign(FRESH(), {
    headline: 'A "quoted" & <script>alert(1)</script> week',
    metrics: new Array(9).fill(0).map((_, i) => ({ label: "m" + i, value: i })),
    highlights: new Array(9).fill(0).map((_, i) => ({ label: "h" + i, href: "#games" }))
  }));
  const hero = heroOf(html);
  ok("escaping: no raw script tag reaches the markup", !/<script>/.test(hero));
  ok("escaping: entities encoded", /&quot;quoted&quot;/.test(hero) && /&amp;/.test(hero));
  ok("cap: metrics capped at 4", (hero.match(/class="wk-metric"/g) || []).length === 4);
  ok("cap: highlights capped at 4", (hero.match(/class="btn ghost wk-link"/g) || []).length === 4);
}

/* -------------------- 8. the real seeded object in data.js actually renders */
{
  const ctx = build();
  const w = ctx.VEILRUN.weekly;
  ok("seed: VEILRUN.weekly exists", !!w && typeof w === "object");
  if (w) {
    ok("seed: renders today", !!ctx.VApp.__weeklyHero());
    ok("seed: image file exists on disk",
      !w.image || !w.image.src || fs.existsSync(path.join(__dirname, w.image.src)), w.image && w.image.src);
    ok("seed: is a flat object the Friday task can overwrite whole",
      Object.keys(w).every(k => ["weekStart", "weekEnding", "headline", "blurb", "metrics", "image", "highlights"].indexOf(k) > -1),
      Object.keys(w).join(","));
    (w.highlights || []).forEach(h => {
      const isRoute = /^#/.test(h.href), onDisk = fs.existsSync(path.join(__dirname, h.href.split("#")[0] || "."));
      ok("seed: highlight resolves — " + h.label, isRoute || onDisk, h.href);
    });
    // A route like #games/arena-3d must name a real game in the manifest.
    (w.highlights || []).filter(h => /^#games\//.test(h.href)).forEach(h => {
      const id = h.href.split("/")[1];
      ok("seed: highlight points at a real game — " + id, (ctx.VEILRUN.games || []).some(g => g.id === id));
    });
    ok("seed: blurb is 40-140 words", (w.blurb.trim().split(/\s+/).length >= 40 && w.blurb.trim().split(/\s+/).length <= 140),
      w.blurb.trim().split(/\s+/).length + " words");
  }
}

/* --------- 9. the baseline: fallback === the committed page, byte for byte --------- */
{
  let committed = null;
  try { committed = cp.execSync("git show HEAD:js/app.js", { cwd: __dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch (e) { committed = null; }
  if (!committed) {
    skips.push("baseline diff — could not read HEAD:js/app.js via git");
  } else if (/__renderUpdates/.test(committed)) {
    skips.push("baseline diff — HEAD already contains the hero, so there is no 'before' to compare against");
  } else {
    // Render the committed view through the same stub. It has no __renderUpdates hook,
    // so reach it the way the old harness would have: re-run with a shim appended.
    const shimmed = committed.replace(/return \{ init, route,/, "return { __renderUpdates: () => views.updates(), init, route,");
    const before = renderWith(undefined, shimmed);
    Object.keys(fallbackRenders).forEach(name => {
      ok("baseline: fallback (" + name + ") is byte-identical to the committed page",
        fallbackRenders[name] === before,
        fallbackRenders[name] === before ? "" : "differs by " + Math.abs(fallbackRenders[name].length - before.length) + " chars");
    });
    const withHero = renderWith(FRESH());
    ok("baseline: the hero is purely additive",
      norm(withHero.replace(/<section class="wk"[\s\S]*?<\/section>/, "").replace(/ id="upd-log"/, "")) === norm(before));
  }
}

skips.forEach(s => console.log("  ~ SKIP " + s));
console.log((fails.length ? "FAIL" : "PASS") + " — updates hero: " + pass + " checks passed" +
  (fails.length ? ", " + fails.length + " failed" : "") + (skips.length ? ", " + skips.length + " skipped" : ""));
fails.forEach(f => console.log("  ✗ " + f));
process.exit(fails.length ? 1 : 0);
