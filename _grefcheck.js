/* VEILRUN — game reference harness (VR-98).
 *
 * The reference page has three things that are cheap to get wrong and expensive to
 * discover in production:
 *   1. THE SLUG is the join key to both Supabase tables. A slug that normalises
 *      differently on two paths orphans every take on that game, silently.
 *   2. DEDUPE decides whether two submissions become one card. An exact hit must
 *      merge; a near hit must ASK. Auto-merging a near hit loses data with no trace.
 *   3. THE CARD has to survive 1 take and 10 takes, with either half empty.
 *
 * So this renders the real view functions headlessly — no network, no account, no
 * browser — against fixture data, and asserts on the actual HTML.
 *
 * Run from the repo root:  node _grefcheck.js
 */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = __dirname;
var pass = 0, fails = [];
function ok(cond, msg) { if (cond) pass++; else fails.push(msg); }
function has(hay, needle, msg) { ok(String(hay).indexOf(needle) !== -1, msg + "  [missing: " + needle + "]"); }
function hasnt(hay, needle, msg) { ok(String(hay).indexOf(needle) === -1, msg + "  [unexpected: " + needle + "]"); }

/* ---- headless DOM: just enough for app.js to load and render ------------- */
var els = {};
function stubEl() {
  return {
    innerHTML: "", textContent: "", value: "", style: {}, classList: {
      add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; }
    },
    querySelector: function () { return stubEl(); }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, appendChild: function () {}, remove: function () {},
    options: [], add: function () {}, focus: function () {}, dataset: {},
    // The accordion (VR-109) toggles the DOM in place rather than re-rendering, so the
    // stub needs `hidden` and the attribute setters it drives.
    hidden: false, attrs: {},
    setAttribute: function (k, v) { this.attrs[k] = String(v); },
    getAttribute: function (k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    removeAttribute: function (k) { delete this.attrs[k]; }
  };
}
var ctx = vm.createContext({});
ctx.window = ctx; ctx.globalThis = ctx;
ctx.console = console;
ctx.setTimeout = function () {}; ctx.clearTimeout = function () {};
ctx.localStorage = { _d: {}, getItem: function (k) { return this._d[k] || null; },
  setItem: function (k, v) { this._d[k] = String(v); }, removeItem: function (k) { delete this._d[k]; } };
ctx.sessionStorage = ctx.localStorage;
ctx.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
ctx.location = { hash: "#reference" };
ctx.document = {
  getElementById: function (id) { return els[id] || (els[id] = stubEl()); },
  querySelector: function () { return stubEl(); },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}, createElement: function () { return stubEl(); },
  body: stubEl()
};
ctx.VBackend = null;   // offline on purpose — the page must degrade, not throw

function load(f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f }); }
load("js/data.js");
load("js/galleries.js");
load("js/media.js");
load("js/board.js");
load("js/components.js");
load("js/app.js");

var D = ctx.VEILRUN, A = ctx.VApp;
ok(!!A && typeof A.__grefSlug === "function", "app.js exposes the game-reference test seams");

/* ---- 1. data.js shape --------------------------------------------------- */
var refs = D.gameRefs || {}, aliases = D.gameRefAliases || {}, tags = D.gameRefTags || {};
Object.keys(refs).forEach(function (slug) {
  ok(/^[a-z0-9]+$/.test(slug), "gameRefs key is a clean slug: " + slug);
  var g = refs[slug];
  ok(!!g.name, slug + ": has a name");
  ok(!!g.blurb, slug + ": has a blurb — a seeded card must never render empty context");
  ok(["2D", "2.5D", "3D", undefined].indexOf(g.dimension) !== -1, slug + ": dimension is 2D|2.5D|3D");
  if (g.art) ok(fs.existsSync(path.join(ROOT, g.art)), slug + ": art file exists at " + g.art);
  // A Steam appid is interpolated straight into a CDN URL, so it must be a bare positive
  // integer — a string here would still "work" and would quietly permit a path fragment.
  if (g.steam !== undefined) {
    ok(typeof g.steam === "number" && Number.isInteger(g.steam) && g.steam > 0,
      slug + ": steam appid is a positive integer, not a string (" + g.steam + ")");
  }
});
// Two games sharing an appid means one of them borrowed the other's cover — the exact
// failure that made hand-guessed ids unsafe, caught structurally instead of by eye.
var bySteam = {};
Object.keys(refs).forEach(function (slug) {
  var id = refs[slug].steam;
  if (!id) return;
  ok(!bySteam[id], "no two games share a Steam appid (" + slug +
     (bySteam[id] ? " collides with " + bySteam[id] : "") + ")");
  bySteam[id] = slug;
});
// An alias pointing at nothing is a silent dead end — the typo resolves to a slug
// that no card and no Supabase row will ever match.
Object.keys(aliases).forEach(function (a) {
  ok(/^[a-z0-9]+$/.test(a), "alias key is a clean slug: " + a);
  ok(/^[a-z0-9]+$/.test(aliases[a]), "alias target is a clean slug: " + a + " -> " + aliases[a]);
  ok(a !== aliases[a], "alias does not point at itself: " + a);
  ok(!aliases[aliases[a]], "alias target is not itself an alias (no chains): " + a);
});
ok((tags.love || []).length > 0 && (tags.gripe || []).length > 0, "both tag rows are populated");
ok(new Set(tags.love).size === (tags.love || []).length, "no duplicate love tags");
ok(new Set(tags.gripe).size === (tags.gripe || []).length, "no duplicate gripe tags");

/* ---- 2. slug normalisation --------------------------------------------- */
var S = A.__grefSlug;
ok(S("Helldivers 2") === "helldivers2", "spaces stripped");
ok(S("HELLDIVERS 2") === "helldivers2", "case folded");
ok(S("Helldivers 2") === S("helldivers  2"), "repeat whitespace collapses to the same slug");
ok(S("Baldur's Gate 3") === "baldursgate3", "apostrophes stripped");
ok(S("Call of Duty: Zombies") === "callofdutyzombies", "punctuation stripped");
ok(S("  Uno  ") === "uno", "surrounding whitespace ignored");
ok(S("") === "", "empty stays empty");
ok(S("COD") === "callofduty", "alias resolves (cod -> callofduty)");
ok(S("cod") === S("COD"), "alias resolution is case-insensitive");
ok(S("HD2") === "helldivers2", "alias resolves (hd2 -> helldivers2)");
// The property that actually matters: normalising twice must not move.
Object.keys(refs).concat(["Some New Game", "hd2", "Uno"]).forEach(function (n) {
  ok(S(S(n)) === S(n) || !!aliases[S(n)], "slug is stable under re-normalisation: " + n);
});

/* ---- 3. dedupe: exact merges, near ASKS --------------------------------- */
var M = A.__grefMatch;
var fixtureRefs = [
  { slug: "helldivers2", name: "Helldivers 2" },
  { slug: "seaofthieves", name: "Sea of Thieves" }
];
ok(M("Helldivers 2", fixtureRefs).kind === "exact", "exact name -> exact match");
ok(M("helldivers 2", fixtureRefs).kind === "exact", "case variation -> exact match");
ok(M("HD2", fixtureRefs).kind === "exact", "alias -> exact match (merges silently, per the rule)");
var near = M("Helldivrs 2", fixtureRefs);
ok(near.kind === "near", "typo -> NEAR, not exact");
ok(near.slug === "helldivers2", "near match points at the right game");
// Must be a name that is neither seeded nor near anything seeded — `grefKnown` merges the
// real catalogue in, so a real game title here would (correctly) come back as `exact`.
ok(M("Zzyzx Quantum Bowling", fixtureRefs).kind === "new", "unrelated name -> new game");
ok(M("", fixtureRefs).kind === "empty", "empty input -> empty, never a bogus slug");
// The load-bearing assertion: a near miss must NEVER come back as exact, because the
// caller merges an exact hit without asking.
["Helldivrs 2", "Sea of Thiefs", "helldiver 2"].forEach(function (t) {
  ok(M(t, fixtureRefs).kind !== "exact", "near miss is never silently merged: " + t);
});

/* ---- 3b. the seeded catalogue resolves cleanly --------------------------
   The seed is the autocomplete source, so a crew member picks a name from it verbatim.
   Every one of those names MUST come back `exact` and point at its own slug — if a title
   resolves to a neighbour instead, picking it from the list files the take on the wrong
   card, silently. `eldenring` vs `eldenringnightreign` is a live prefix collision, so
   this is not hypothetical. */
var seeded = Object.keys(refs);
ok(seeded.length > 0, "the catalogue is seeded (autocomplete has something to offer)");
seeded.forEach(function (slug) {
  var m = M(refs[slug].name, []);
  ok(m.kind === "exact", "seed resolves exactly: " + refs[slug].name);
  ok(m.slug === slug, "seed resolves to ITSELF, not a neighbour: " + refs[slug].name + " -> " + m.slug);
});
// Alias targets should be real catalogue entries, otherwise the shorthand resolves to a
// slug no card will ever match.
Object.keys(aliases).forEach(function (a) {
  ok(!!refs[aliases[a]], "alias '" + a + "' points at a seeded game (" + aliases[a] + ")");
});
// A seeded name must never be reachable as an alias key too — the alias would shadow it.
Object.keys(aliases).forEach(function (a) {
  ok(!refs[a], "alias key '" + a + "' does not shadow a real catalogue slug");
});
// Two games whose display names normalise identically are unresolvable by definition: the
// name index can only point one way, so picking one from autocomplete lands on the other.
// Nothing in the data model prevents this, so it has to be asserted.
var byBare = {};
seeded.forEach(function (slug) {
  var bare = String(refs[slug].name).toLowerCase().replace(/[^a-z0-9]/g, "");
  ok(!byBare[bare], "no two games share a normalised display name (" + refs[slug].name +
     (byBare[bare] ? " collides with " + refs[byBare[bare]].name : "") + ")");
  byBare[bare] = slug;
});
// And an alias must not collide with a display name either, since the alias wins first.
Object.keys(aliases).forEach(function (a) {
  ok(!byBare[a] || byBare[a] === aliases[a],
     "alias '" + a + "' does not hijack the display name of a different game (" + (byBare[a] || "") + ")");
});

/* ---- 4. card rendering at 1, 3 and 10 takes ----------------------------- */
var CARD = A.__grefCard;
function note(who, loves, gripes, tags_, gtags, raw) {
  return { slug: "helldivers2", who: who, loves: loves, gripes: gripes,
    tags: tags_ || [], gripe_tags: gtags || [], raw_name: raw || "Helldivers 2",
    created_at: "2026-08-15T10:00:00Z", updated_at: "2026-08-15T10:00:00Z" };
}
var one = [note("Todd", "the drop-in drop-out", "the grind between missions", ["multiplayer / playing with friends"], ["grindy"])];
var html1 = CARD("helldivers2", one, fixtureRefs);
// Attribution runs through the site's existing identity collapse, so a take is credited to
// the same identity as its author's leaderboard row no matter which handle they typed.
// "Todd" is Temper's player, so the card says Temper.
has(html1, "Temper", "1 take: the author is named, collapsed to their crew identity");
["Todd", "Toddlez", "BipolarCrayons"].forEach(function (handle) {
  has(CARD("helldivers2", [note(handle, "x", "y")], fixtureRefs), "Temper",
    "identity: '" + handle + "' attributes to the same person as every other handle");
});
has(CARD("helldivers2", [note("SomeGuest", "x", "y")], fixtureRefs), "SomeGuest",
  "identity: a non-crew name is shown as typed rather than dropped");
has(html1, "drop-in drop-out", "1 take: the love quote renders");
has(html1, "grind between missions", "1 take: the gripe quote renders");
// Matched on the "+n more" shape rather than the bare substring "more</button>": VR-120
// added a **Read more</button>** for long takes, and the loose match would have called a
// single long take a hidden-quote disclosure. Found by mutation-testing VR-120, not by
// reading — the two buttons only collide when one take is both alone and long.
ok(!/\+\d+ more<\/button>/.test(html1), "1 take: no disclosure button when there's nothing hidden");
has(html1, "1 take", "1 take: singular, not '1 takes'");

var three = [
  note("Todd", "drop-in drop-out", "the grind", ["multiplayer / playing with friends"], ["grindy"]),
  note("Jordan", "the friendly fire", "menus, so many menus", ["multiplayer / playing with friends"], ["grindy", "clunky menus & controls"]),
  note("Ali", "you feel strong without being safe", "same three missions", ["multiplayer / playing with friends"], ["grindy"])
];
var html3 = CARD("helldivers2", three, fixtureRefs);
has(html3, "+1 more", "3 takes: the third quote goes behind a disclosure");
has(html3, "⟳ 3 of 3", "3 takes: convergence line fires at 3 agreeing");
has(html3, "grindy", "3 takes: aggregated gripe tag renders");
ok((html3.match(/gr-quotes/g) || []).length >= 3, "3 takes: both sides render quote lists plus the hidden one");

var ten = [];
for (var i = 0; i < 10; i++) ten.push(note("Person" + i, "love " + i, "gripe " + i, ["the movement"], ["repetitive"]));
var html10 = CARD("helldivers2", ten, fixtureRefs);
has(html10, "+8 more", "10 takes: 2 shown, 8 disclosed — the card cannot become a wall");
has(html10, "10 of 10", "10 takes: convergence counts everyone");
// The shown count and the hidden count are two slices of one list and must agree — if they
// drift, the card either swallows a quote or advertises quotes that aren't there.
[one, three, ten].forEach(function (fixture) {
  var html = CARD("helldivers2", fixture, fixtureRefs);
  var quoted = (html.match(/gr-quote">/g) || []).length;          // both halves, shown + hidden
  var claimed = (html.match(/\+(\d+) more/g) || [])
    .reduce(function (n, m) { return n + parseInt(m.slice(1), 10); }, 0);
  var written = fixture.filter(function (t) { return (t.loves || "").trim(); }).length
              + fixture.filter(function (t) { return (t.gripes || "").trim(); }).length;
  ok(quoted === written, "every written take is rendered somewhere (" + fixture.length + " takes: " + quoted + " of " + written + ")");
  var shownOnly = quoted - claimed;
  ok(shownOnly <= 4 && shownOnly >= 0, "at most 2 quotes per side are shown up front (" + fixture.length + " takes)");
});

// Convergence is a FINDING, not a tally — it must not fire below three people agreeing,
// or the card starts calling two people's coincidence a pattern.
var twoAgree = [
  note("Todd", "a", "b", ["the movement"], ["grindy"]),
  note("Jordan", "c", "d", ["the movement"], ["grindy"]),
  note("Ali", "e", "f", ["the music"], ["punishing"])
];
hasnt(CARD("helldivers2", twoAgree, fixtureRefs), "⟳", "convergence stays silent when only 2 of 3 agree");
has(CARD("helldivers2", twoAgree, fixtureRefs), "3 takes", "…and falls back to a plain take count instead");

/* ---- 5. the halves are independent (the edit rule, rendered) ------------- */
var loveOnly = [note("Todd", "the drop-in drop-out", "")];
var h = CARD("helldivers2", loveOnly, fixtureRefs);
has(h, "drop-in drop-out", "loves-only take: the love still renders");
has(h, "Nobody's said yet", "loves-only take: the empty gripe side says so rather than collapsing");
var gripeOnly = [note("Todd", "", "the grind")];
h = CARD("helldivers2", gripeOnly, fixtureRefs);
has(h, "the grind", "gripes-only take: the gripe still renders");
has(h, "Nobody's said yet", "gripes-only take: the empty love side says so");

/* ---- 6. the merge log surfaces prior names ------------------------------ */
var aliased = [note("Todd", "a", "b", [], [], "HD2"), note("Jordan", "c", "d", [], [], "helldiver 2")];
h = CARD("helldivers2", aliased, fixtureRefs);
has(h, "Also submitted as", "merge log: prior names are surfaced on the card");
has(h, "HD2", "merge log: lists the raw name that was typed");
var clean = [note("Todd", "a", "b", [], [], "Helldivers 2")];
hasnt(CARD("helldivers2", clean, fixtureRefs), "Also submitted as", "merge log: hidden when every submission used the canonical name");

/* ---- 7. an unseeded game degrades to the visible authoring queue -------- */
h = CARD("somegamenobodywroteup", [note("Todd", "a", "b")], [{ slug: "somegamenobodywroteup", name: "Some Game" }]);
has(h, "Context coming", "unseeded game: renders the 'context coming' stub");
has(h, "Some Game", "unseeded game: still shows the submitted name");
has(h, "a", "unseeded game: the take still renders — a missing blurb never hides a contribution");

/* ---- 8. XSS: every field is crew-supplied free text --------------------- */
var nasty = [note("<img src=x onerror=alert(1)>", "<script>alert(2)</script>", "\" onmouseover=\"alert(3)")];
h = CARD("helldivers2", nasty, fixtureRefs);
hasnt(h, "<script>", "escaping: a script tag in a take never reaches the DOM raw");
hasnt(h, "<img src=x", "escaping: an img tag in a name never reaches the DOM raw");
has(h, "&lt;script&gt;", "escaping: it's rendered as visible text instead");

/* ---- 9. THE LOOM (VR-99) ------------------------------------------------
   Four states, a citation floor and three vote thresholds — none of which a person
   can see going wrong. The gate opens on live data, so a regression here reads on the
   page as "the ideas panel is just gone this week" and nobody files that as a bug.

   Every check pins `now`, so the batch in js/data.js ageing out on its own 21-day
   cliff can never turn this harness red. */
var L = A.__loomPanel;
var LV = A.__loomVotes, LC = A.__loomConsts();
var FRESH = new Date(2026, 7, 30);          // 2 days after the shipped batch's weekOf

// --- 9a. state 1: below the gate, the panel RENDERS. It recruits, so it must not hide.
has(L([]), "Nothing woven yet", "loom: empty state renders (it recruits, so it must not hide)");
has(L([]), "8 takes from at least 3 people", "loom: the empty state names the exact gate");
has(L([]), "currently 0 from 0", "loom: shows live progress toward the gate");
var nineOnePerson = [];
for (var j = 0; j < 9; j++) nineOnePerson.push(note("Todd", "l" + j, "g" + j));
has(L(nineOnePerson), "Nothing woven yet", "loom: 9 takes from ONE person does not open the gate");
has(L(nineOnePerson), "currently 9 from 1", "loom: and it says which half of the gate is short");
// The gate is a property of the INPUT, not of the batch — a batch sitting in data.js must
// not be able to render the panel under a gate that is closed.
has(L(three), "Nothing woven yet", "loom: 3 takes can't open the gate even with a batch loaded");
// The gate numbers on the page and the numbers in the code are the same numbers.
ok(LC.GATE.takes === 8 && LC.GATE.people === 3, "loom: the gate is 8 takes across 3 people");

// --- 9b. state 2: live. The gate is open on real data, so this is what actually ships.
LV({}, {});                                  // no votes anywhere
var live = L(ten, FRESH);
ok(live !== "", "loom: with the gate open and a fresh batch, the panel renders");
has(live, "The Loom", "loom live: the panel names itself");
has(live, "loom-ideas", "loom live: the idea list renders");
ok((live.match(/loom-idea\b/g) || []).length === 3, "loom live: all three ideas render — three candidates, not one compromise");
has(live, "The Thinning Line", "loom live: idea 1 renders from js/data.js");
has(live, "Two Hands", "loom live: idea 2 renders");
has(live, "Last Call", "loom live: idea 3 renders");
has(live, "Built from", "loom live: the citation block is labelled");
has(live, "Avoids", "loom live: the gripes it's designed around are labelled");
has(live, "Fits", "loom live: the crew fit is labelled");

// THE CITATION REQUIREMENT IS THE WHOLE FEATURE. Names and verbatim quotes, on the page.
// Names, run through the SAME identity collapse the cards below use. Asserted as the
// resolved crew name rather than the raw handle on purpose: citing one person under two
// spellings would read as two people agreeing, which inflates the consensus the panel
// claims to have found. jkrazy→Latch · BipolarCrayons→Temper · Ramos The Wise→Vesper ·
// Soviet→Cinder, and the raw handles must NOT leak through beside them.
[["jkrazy", "Latch"], ["BipolarCrayons", "Temper"], ["Ramos The Wise", "Vesper"], ["Soviet", "Cinder"]]
  .forEach(function (pair) {
    has(live, ">" + pair[1], "loom live: " + pair[0] + " is quoted BY NAME as " + pair[1] +
      " — an idea nobody can be seen in is slop");
    hasnt(live, ">" + pair[0], "loom live: the raw handle '" + pair[0] +
      "' does not leak — one person must not read as two sources");
  });
has(live, "Gets boring once you have everything upgraded and unlocked",
  "loom live: the quote is verbatim, not a tidied paraphrase");
has(live, "the ability to control 2 characters simultaniously",
  "loom live: a typo in a real take survives — tidying it turns a citation into a paraphrase");
// Every rendered idea must carry at least three of them. Counted per idea, not in total,
// or two well-cited ideas would cover for a third that cites nothing.
var perIdea = live.split('<li class="loom-idea').slice(1);
ok(perIdea.length === 3, "loom live: three idea blocks to count citations in");
perIdea.forEach(function (chunk, n) {
  ok((chunk.match(/loom-cite\b/g) || []).length >= LC.MIN_CITATIONS,
    "loom live: idea " + (n + 1) + " cites at least " + LC.MIN_CITATIONS + " real takes");
});

// --- 9c. THE FLOOR: an idea that cannot cite is DROPPED, never published thin.
var realLoom = D.loom;
D.loom = { weekOf: "2026-08-28", ideas: [
  { title: "Cites three", pitch: "p", builtFrom: [
    { who: "A", quote: "q1" }, { who: "B", quote: "q2" }, { who: "C", quote: "q3" }] },
  { title: "Cites two only", pitch: "p", builtFrom: [{ who: "A", quote: "q1" }, { who: "B", quote: "q2" }] },
  { title: "Cites three but one is hollow", pitch: "p", builtFrom: [
    { who: "A", quote: "q1" }, { who: "B", quote: "q2" }, { who: "C", quote: "   " }] }
] };
var floor = L(ten, FRESH);
has(floor, "Cites three", "floor: an idea with three real citations ships");
hasnt(floor, "Cites two only", "floor: an idea with two citations is DROPPED, not published thin");
hasnt(floor, "Cites three but one is hollow",
  "floor: a blank quote doesn't count toward the floor — three entries is not three citations");
// If nothing can cite, the panel says nothing at all rather than rendering an empty frame.
D.loom = { weekOf: "2026-08-28", ideas: [{ title: "T", pitch: "p", builtFrom: [{ who: "A", quote: "q" }] }] };
ok(L(ten, FRESH) === "", "floor: when NO idea can cite, the panel renders nothing — never an empty frame");
D.loom = { weekOf: "2026-08-28", ideas: [{ title: "", pitch: "p", builtFrom: [
  { who: "A", quote: "q1" }, { who: "B", quote: "q2" }, { who: "C", quote: "q3" }] }] };
ok(L(ten, FRESH) === "", "floor: a titleless idea is dropped too — a well-cited blank is still blank");

// --- 9d. state 4: staleness and malformed batches remove the panel entirely.
D.loom = realLoom;
ok(L(ten, new Date(2026, 8, 17)) !== "", "ageing: at 20 days the batch is still current");
ok(L(ten, new Date(2026, 8, 19)) === "", "ageing: past 21 days the panel REMOVES ITSELF — same rule as the weekly hero");
ok(LC.MAX_AGE === 21, "ageing: the cliff is 21 days");
ok(L(ten, new Date(2026, 6, 1)) === "", "ageing: a weekOf far in the FUTURE is a bad date, not an early week");
[null, undefined, {}, [], { weekOf: "2026-08-28" }, { weekOf: "not-a-date", ideas: realLoom.ideas },
 { weekOf: "2026-08-28", ideas: [] }, { weekOf: "2026-08-28", ideas: "three of them" }].forEach(function (bad, n) {
  D.loom = bad;
  ok(L(ten, FRESH) === "", "malformed batch #" + n + ": renders nothing rather than half a panel");
});
D.loom = realLoom;

// --- 9e. the three thresholds. +3 / −3 / −5, and the gap between the last two is the point.
ok(LC.THRESHOLDS.promote === 3 && LC.THRESHOLDS.deprioritise === -3 && LC.THRESHOLDS.archive === -5,
  "thresholds: +3 promotes, −3 deprioritises, −5 archives");
var p1 = "loom-2026-08-28-1", p2 = "loom-2026-08-28-2", p3 = "loom-2026-08-28-3";
// −3 dims but never hides: still on the page, still readable, still votable.
LV({}, (function () { var d = {}; d[p2] = 3; return d; })());
var dimmed = L(ten, FRESH);
has(dimmed, "Two Hands", "−3: a deprioritised idea is STILL ON THE PAGE — dimming is not hiding");
has(dimmed, "loom-dim", "−3: it's dimmed");
has(dimmed, "Deprioritised", "−3: and it says so, rather than looking like a rendering bug");
ok(dimmed.indexOf("Two Hands") > dimmed.indexOf("Last Call"),
  "−3: it sinks below the live ideas instead of holding its slot");
ok((dimmed.match(/VApp\.loomVote\('loom-2026-08-28-2','up'/g) || []).length === 1,
  "−3 IS REVERSIBLE: the up-vote that pulls it back is still on the page");
// One short of the threshold changes nothing — an off-by-one here silently dims a live idea.
LV({}, (function () { var d = {}; d[p2] = 2; return d; })());
hasnt(L(ten, FRESH), "loom-dim", "−2 is not −3: two down-votes leave an idea completely alone");
// −5 leaves the panel. Recorded, never deleted — and the panel says so.
LV({}, (function () { var d = {}; d[p2] = 5; return d; })());
var archived = L(ten, FRESH);
hasnt(archived, "Two Hands", "−5: an archived idea leaves the panel");
has(archived, "Last Call", "−5: the others are untouched");
has(archived, "1 archived this week", "−5: the panel accounts for it rather than quietly shrinking");
has(archived, "Archived never means deleted", "−5: and states the recovery rule on the page");
// Up-votes net against down-votes — otherwise a popular idea could be archived by 5 people
// while 20 wanted it.
LV((function () { var u = {}; u[p2] = 4; return u; })(), (function () { var d = {}; d[p2] = 5; return d; })());
has(L(ten, FRESH), "Two Hands", "net: 4 up against 5 down is −1, which archives nothing");
LV({}, {});

// --- 9f. state 3: a promoted idea HOLDS ITS SLOT, restyled rather than removed.
// Deliberately promotes the MIDDLE idea, not the first. Promoting idea 1 makes
// "holds its slot" and "sorted to the front" indistinguishable, and a reordering bug
// would sail straight through — which is exactly what mutation-testing this caught.
D.loom = JSON.parse(JSON.stringify(realLoom));
D.loom.ideas[1].promoted = { label: "Warded Sanctum", href: "#lab" };
var promoted = L(ten, FRESH);
has(promoted, "IN THE LAB", "promoted: carries the badge");
has(promoted, "Two Hands", "promoted: STAYS in the panel — seeing your vote land is the reward loop");
has(promoted, "#lab", "promoted: its vote row is replaced by the way into the Lab");
ok(promoted.indexOf("The Thinning Line") < promoted.indexOf("Two Hands") &&
   promoted.indexOf("Two Hands") < promoted.indexOf("Last Call"),
  "promoted: it holds the slot it was woven into — not floated to the top, not sunk");
ok((promoted.match(/data-loom="loom-2026-08-28-2"/g) || []).length === 0,
  "promoted: the ▲/▼ row is gone — the vote already resolved");
ok((promoted.match(/data-loom="loom-2026-08-28-1"/g) || []).length === 2,
  "promoted: the OTHER ideas keep both their buttons");
// A promoted idea is immune to the thresholds: it is already in the Lab, and pulling it off
// the page on late down-votes would strand a live Lab card with no visible origin.
LV({}, (function () { var d = {}; d[p2] = 9; return d; })());
var late = L(ten, FRESH);
has(late, "Two Hands", "promoted: survives even a −9, because it already shipped");
hasnt(late, "loom-dim", "promoted: −9 doesn't dim it either");
hasnt(late, "archived this week", "promoted: and it is never COUNTED as archived — the tally must agree with the page");
LV({}, {});
D.loom = realLoom;

// --- 9g. XSS. Every field here is generated text that quotes CREW-SUPPLIED free text.
D.loom = { weekOf: "2026-08-28", ideas: [{
  title: "<script>alert(1)</script>", pitch: "\" onmouseover=\"alert(2)",
  builtFrom: [{ who: "<img src=x onerror=alert(3)>", game: "<b>g</b>", quote: "<script>alert(4)</script>" },
              { who: "B", quote: "q2" }, { who: "C", quote: "q3" }],
  avoids: ["<script>alert(5)</script>"], fits: "<script>alert(6)</script>",
  promoted: { label: "<script>alert(7)</script>", href: "javascript:alert(8)" } }] };
var nasty = L(ten, FRESH);
hasnt(nasty, "<script>", "loom escaping: a script tag never reaches the DOM raw");
hasnt(nasty, "<img src=x", "loom escaping: nor an img tag in a cited name");
has(nasty, "&lt;script&gt;", "loom escaping: it renders as visible text instead");
D.loom = realLoom;

// --- 9h. the vote handler is actually wired, and the poll ids match the spec.
ok(typeof A.loomVote === "function", "loomVote is exported for the ▲/▼ buttons");
LV({}, {});
has(L(ten, FRESH), "loom-2026-08-28-1", "poll ids follow the spec's loom-<week>-<n> shape");
has(L(ten, FRESH), "'up'", "vote buttons pass a direction — the votes table's `choice` column, no new SQL");
has(L(ten, FRESH), "'down'", "…both directions");

/* ---- 9b. the card is COLLAPSED by default (VR-109) -----------------------
   The whole point of the change is that a fresh page render is a list of summary rows.
   If a card ever ships expanded by default the compression is gone, and it would go
   unnoticed for exactly as long as nobody scrolled. */
var fresh = CARD("helldivers2", three, fixtureRefs);
has(fresh, 'aria-expanded="false"', "collapsed by default: the summary reports itself closed");
has(fresh, "gr-detail", "collapsed by default: the detail panel is still in the DOM (findable, printable)");
ok(/<div class="gr-detail" id="grdetail-helldivers2" hidden>/.test(fresh),
  "collapsed by default: the detail carries the `hidden` attribute");
hasnt(fresh, 'class="panel gr-card open"', "collapsed by default: no card renders pre-opened");
// The summary must carry the finding and the name. Everything else may hide; these may not,
// because they are the only things a scanner sees.
has(fresh, "gr-sum-name", "summary: the game name is on the collapsed face");
has(fresh, "⟳ 3 of 3", "summary: the convergence line survives compression");
has(fresh, 'aria-controls="grdetail-helldivers2"', "summary: button is wired to the panel it opens");
// The quotes must be RENDERED inside the hidden panel rather than deferred — otherwise
// browser find-in-page and screen readers lose them entirely.
has(fresh, "drop-in drop-out", "collapsed: quotes exist in the DOM, just not in the layout");

// A `gone` game has to stay legible while collapsed — it's the most useful card on the
// page (liked by the crew, dead anyway) and burying the warning defeats it.
var goneCard = A.__grefCard("spellbreak", [note("Todd", "the gauntlets", "no players")], []);
if (refs.spellbreak) has(goneCard, "no longer running", "a `gone` game flags itself on the collapsed summary");

/* ---- 9c. cover art: three tiers, each allowed to fail -------------------- */
var withSteam = null;
Object.keys(refs).forEach(function (s) { if (!withSteam && refs[s].steam) withSteam = s; });
ok(!!withSteam, "at least one catalogue entry carries a verified Steam appid");
if (withSteam) {
  var artCard = A.__grefCard(withSteam, [note("Todd", "a", "b")], []);
  has(artCard, "assets/gameref/" + withSteam + ".webp", "art: the LOCAL webp is tier one, so dropping a file still wins");
  has(artCard, "steam/apps/" + refs[withSteam].steam + "/header.jpg", "art: the Steam capsule is carried as the next tier");
  has(artCard, "VApp.grefArtFail", "art: failure steps down the chain rather than leaving a broken frame");
  has(artCard, "gr-art-word", "art: the typographic tile renders underneath regardless");
}
// A pending (unseeded) game has no derived path at all — it must not request a cover for a
// slug that was invented by a crew member thirty seconds ago.
var pendingCard = CARD("somegamenobodywroteup", [note("Todd", "a", "b")], [{ slug: "somegamenobodywroteup", name: "Some Game" }]);
hasnt(pendingCard, "assets/gameref/somegamenobodywroteup", "art: a pending game requests no cover");
has(pendingCard, "gr-art-word", "art: …but still gets the typographic tile");

/* ---- 9d. toggling opens exactly one card and leaves the rest alone ------- */
els = {};                                   // fresh stub DOM
A.grefToggle("helldivers2");
var reopened = CARD("helldivers2", three, fixtureRefs);
has(reopened, 'aria-expanded="true"', "toggle: the opened slug renders expanded on the next render");
ok(/<div class="gr-detail" id="grdetail-helldivers2">/.test(reopened), "toggle: …and its panel loses `hidden`");
has(reopened, "gr-card open", "toggle: the card carries the open class for the caret");
// Open state must survive a re-sort — renderReference() rebuilds the list with innerHTML,
// and slamming an open card shut mid-comparison is the bug this state exists to prevent.
var other = CARD("seaofthieves", [note("Todd", "a", "b")], fixtureRefs);
has(other, 'aria-expanded="false"', "toggle: opening one card does not open its neighbours");
A.grefToggle("helldivers2");
has(CARD("helldivers2", three, fixtureRefs), 'aria-expanded="false"', "toggle: toggling again closes it");

/* ---- 9e. a long take is CLAMPED, never truncated (VR-120) ----------------
   The fourth cap on this page, and the only one that caps a single person rather than a
   count. The failure it exists for: one four-paragraph take sets the height of the column
   for the nine people who wrote a sentence.
   The load-bearing assertion is that the FULL string still reaches the DOM — if this ever
   becomes a substring operation the page silently starts eating the ends of people's
   takes, and nothing else here would notice. */
var LONG = "x".repeat(400), SHORT = "a short and punchy take";
var longNote = [note("Todd", LONG, SHORT)];
h = CARD("helldivers2", longNote, fixtureRefs);
has(h, LONG, "long take: the ENTIRE text is in the DOM — clamped by CSS, never cut");
has(h, "gr-long", "long take: the row is marked for clamping");
has(h, "Read more", "long take: …and offers to un-clamp");
hasnt(h, "x".repeat(400) + "…", "long take: no ellipsis is baked into the string itself");
// A short take must NOT get a button — a Read more over three words is noise, and it would
// appear on almost every row, which is the same wall by another route.
ok(h.indexOf("gr-long") === h.lastIndexOf("gr-long"),
  "short take: only the long side is marked (the punchy one is left alone)");
ok((h.match(/Read more/g) || []).length === 1, "short take: exactly one Read more, on the long quote");
// The threshold has to sit between "a sentence" and "a paragraph" or it is doing nothing.
// 220 chars is roughly five lines against a four-line clamp.
var midNote = [note("Todd", "y".repeat(150), "")];
hasnt(CARD("helldivers2", midNote, fixtureRefs), "Read more",
  "threshold: a 150-character take is normal writing and is left unclamped");
// Read more and "+n more" are different disclosures and must not be counted as each other.
ok(!/\+\d+ more/.test('<button class="gr-readmore">Read more</button>'),
  "Read more does not match the +n more pattern the quote-count checks rely on");
ok(typeof A.grefExpand === "function", "grefExpand is exported for the Read more buttons");

/* ---- 10. the page renders offline without throwing ---------------------- */
var view = A.route ? null : null;
ok(typeof A.grefOpen === "function", "grefOpen is exported for the card + CTA buttons");
ok(typeof A.grefSubmit === "function", "grefSubmit is exported");
ok(typeof A.grefNameChange === "function", "grefNameChange is exported for the name field");
ok(typeof A.grefPick === "function", "grefPick is exported for the did-you-mean buttons");
ok(typeof A.grefMore === "function", "grefMore is exported for the disclosure");
ok(typeof A.grefSort === "function", "grefSort is exported for the sort select");
ok(typeof A.grefToggle === "function", "grefToggle is exported for the summary buttons");
ok(typeof A.grefArtFail === "function", "grefArtFail is exported for the <img> onerror chain");

/* ---- report ------------------------------------------------------------- */
console.log("VEILRUN game-reference check");
console.log("  " + pass + " checks passed");
if (fails.length) {
  console.log("\nFAILED (" + fails.length + "):");
  fails.forEach(function (f) { console.log("  - " + f); });
  process.exit(1);
}
console.log("\nPASS — slugs stable, near misses never auto-merge, cards survive 1–10 takes.");
