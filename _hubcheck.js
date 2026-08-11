/* VEILRUN — hub state harness (VR-86)
   Renders views.hub() for every user state against the real app.js in a DOM stub and
   asserts the rules that matter. The one that has bitten twice: a first-time visitor
   must never see diff language, because they have nothing to diff against.
   Run from the repo root:  node _hubcheck.js                                        */

const fs = require("fs"), vm = require("vm"), path = require("path");
let pass = 0; const fails = [];
const ok = (name, cond, detail) => { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); };

function build(state) {
  const store = Object.assign({}, state.ls);
  const ctx = {
    console,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    location: { hash: state.hash || "#hub" },
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } })
    },
    setTimeout, clearTimeout, Promise, Date, Math, JSON, RegExp, String, Number, Array, Object
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["js/data.js", "js/galleries.js", "js/components.js", "js/app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), ctx, { filename: f });
  }
  return ctx;
}

// Reach into the module closure by rendering through the public route; instead we call
// the view directly via a tiny shim the IIFE exposes for tests.
function renderFor(state) {
  const ctx = build(state);
  if (!ctx.VApp || typeof ctx.VApp.__renderHub !== "function") {
    throw new Error("VApp.__renderHub missing — the test hook was removed from app.js");
  }
  return ctx.VApp.__renderHub(state.hub);
}

const D_UPDATES_TOP = (() => {
  const ctx = build({ ls: {} });
  return ctx.VEILRUN.updates[0];
})();

/* ---------------------------------------------------------------- 1. first visit */
{
  const html = renderFor({ ls: {}, hub: { type: "new", lastSeen: null, unseen: null, waiting: [] } });
  ok("new: no diff language", !/since you last signed in|you missed|caught up/i.test(html),
    (html.match(/since you last signed in|you missed|caught up/i) || [])[0]);
  ok("new: has orientation", /Where the project is right now/.test(html));
  ok("new: has gallery tile", /The art so far/.test(html));
  ok("new: has numbered path", (html.match(/class="go"/g) || []).length === 3);
  ok("new: no waiting zone", !/Also waiting on you/.test(html));
  ok("new: no get-started zone", !/One thing you could do/.test(html));
  ok("new: crew-rule copy is crew-first", /nobody is dead weight/.test(html) && /crew, and they fight like one/.test(html));
  ok("new: no lone-wolf phrasing", !/works alone|neither has by themselves/i.test(html));
  ok("new: welcome heading", /Welcome to Veilrun/.test(html));
}

/* ------------------------------------------------------------ 2. crew with unseen */
{
  const waiting = [
    { campaign: "Lieutenant counters", tag: "vote", href: "#threats", note: "3 still need your vote",
      items: [{ label: "Who really counters Cinder?", href: "#threats" }] },
    { campaign: "You asked, we fixed", tag: "note", href: "#feedback", note: "2 of your notes have shipped",
      items: [{ label: "Leaderboard farm", href: "#feedback" }] }
  ];
  const unseen = new Array(14).fill(0).map((_, i) => ({ date: "2026-08-0" + ((i % 9) + 1), title: "Update " + i, text: "x", games: ["arena-3d"] }));
  const html = renderFor({ ls: { vr_account: "BipolarCrayons" }, hub: { type: "crew", lastSeen: 1, unseen, waiting } });
  ok("crew: band renders", /Since you last signed in/.test(html));
  ok("crew: cap respected", (html.match(/class="hdot"/g) || []).length === 5,
    "rendered " + (html.match(/class="hdot"/g) || []).length);
  ok("crew: see-all link", /See all 14/.test(html));
  ok("crew: hero leads with waiting", /Waiting on you/.test(html));
  ok("crew: campaign grouping", (html.match(/class="campaign"/g) || []).length === 1);
  ok("crew: no get-started zone", !/One thing you could do/.test(html));
  ok("crew: no orientation", !/Where the project is right now/.test(html));
}

/* ------------------------------------------------------------- 3. crew caught up */
{
  const waiting = [{ campaign: "Lieutenant counters", tag: "vote", href: "#threats", note: "3 still need your vote", items: [] }];
  const html = renderFor({ ls: { vr_account: "BipolarCrayons" }, hub: { type: "crew", lastSeen: 1, unseen: [], waiting } });
  ok("crew caught-up: says so", /You're all caught up/.test(html));
  ok("crew caught-up: pivots to waiting", /Waiting on you/.test(html));
  ok("crew caught-up: no feed rows", !/class="hdot"/.test(html));
}

/* ------------------------------------------------------------------ 4. extension */
{
  const unseen = [{ date: "2026-08-09", title: "A thing", text: "x", games: ["arena-3d"] }];
  const html = renderFor({ ls: { vr_account: "Big Papa" }, hub: { type: "ext", lastSeen: 1, unseen, waiting: [] } });
  ok("ext: get-started zone", /One thing you could do/.test(html));
  ok("ext: no waiting zone", !/Also waiting on you/.test(html));
  ok("ext: no orientation", !/Where the project is right now/.test(html));
  ok("ext: band renders", /Since you last signed in/.test(html));
  ok("ext: singular copy", /You missed 1 thing[^s]/.test(html));
}

/* ---------------------------------------------------------- 5. extension caught up */
{
  const html = renderFor({ ls: { vr_account: "Big Papa" }, hub: { type: "ext", lastSeen: 1, unseen: [], waiting: [] } });
  ok("ext caught-up: says so", /You're all caught up/.test(html));
  ok("ext caught-up: names last update", html.indexOf(D_UPDATES_TOP.title.slice(0, 24)) > -1);
}

/* ------------------------------------- 6. signed out: first time vs returning device */
{
  const first = build({ ls: {} });
  ok("signed-out, no marker: type is new", first.VApp.__hubType() === "new", first.VApp.__hubType());
  const back = build({ ls: { vr_hub_anon_seen: String(Date.now() - 864e5) } });
  ok("signed-out, marker present: type is ext", back.VApp.__hubType() === "ext", back.VApp.__hubType());
  // The bug this guards: a returning signed-out visitor greeted with "First time here"
  // on every single visit — the same null-vs-zero mistake wearing a different hat.
  const html = renderFor({ ls: { vr_hub_anon_seen: String(Date.now() - 864e5) },
    hub: { type: "ext", lastSeen: Date.now() - 864e5, unseen: [{ date: "2026-08-09", title: "A thing", text: "x" }], waiting: [] } });
  ok("returning signed-out: not greeted as brand new", !/First time here/.test(html));
}

/* ------------------------------------------------------------------- 7. v0 escape */
{
  const html = renderFor({ ls: {}, hash: "#hub/v0", hub: { type: "new", lastSeen: null, unseen: null, waiting: [] } });
  ok("v0 fallback still reachable", /Home base/.test(html) && !/Where the project is right now/.test(html));
}

/* ------------------------------------------------------- 7. structure sanity, all */
["new", "ext", "crew"].forEach(type => {
  const html = renderFor({ ls: type === "new" ? {} : { vr_account: "x" },
    hub: { type, lastSeen: type === "new" ? null : 1, unseen: type === "new" ? null : [], waiting: [] } });
  ok(type + ": two columns + jump", (html.match(/class="hcol"/g) || []).length === 2 && /z-jump/.test(html));
  ok(type + ": no undefined leaked", !/undefined|\[object Object\]/.test(html));
  ok(type + ": hero art present", /class="hero-art"/.test(html));
  ok(type + ": jump has 6 links", (html.match(/class="jumpgrid"[\s\S]*?<\/div>/)[0].match(/<a /g) || []).length === 6);
});

console.log((fails.length ? "FAIL" : "PASS") + " — hub states: " + pass + " checks passed" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(f => console.log("  ✗ " + f));
process.exit(fails.length ? 1 : 0);
