/* VEILRUN — nav reachability & dead-route check (VR-197, 9/16).
 *
 * WHERE THIS SITS RELATIVE TO VR-197. That card asks whether the site's whole
 * information architecture is RIGHT — whether Hub/Crew/World/Lab/etc. is the
 * correct shape, whether two surfaces answer the same question, whether a
 * stranger can find anything. `provable: no` is the right call on that
 * question and this harness does not attempt it. It exists for the one
 * narrow slice of that card that IS a fact about the code rather than a
 * judgment about the shape: **does every link the site actually contains
 * point somewhere real, and does every page the router can render have a
 * link pointing at it?** A dead link and an orphaned page are literal
 * accretion damage — exactly what VR-197 calls "the site grew by accretion
 * and the seams show" — and neither needs an eye or a crew, only a reader.
 *
 * WHAT IT DOES NOT CLAIM. It does not know whether Hub and Updates overlap
 * in purpose, whether the Lab dropdown belongs where it is, or whether a
 * stranger could find the leaderboard. Those are VR-197's actual subject and
 * they stay with Jordan and the crew. This harness would pass a genuinely
 * bad IA that happened to have no dead links and no orphans, and that is
 * fine — it was never asked to judge quality, only wiring.
 *
 * NO CHOSEN NUMBERS. Every fact this file asserts is read out of the real
 * router (`js/app.js`'s `views` object and `route()` function) and the real
 * markup (`app.html`) — never retyped, never a threshold someone picked.
 * That is why there is no companion rubric in `Claude Access`: a rubric
 * exists to separate MEASURED from CHOSEN, and there is nothing chosen here
 * to separate out. Rule 1's provenance for every check below is "derived
 * from this repo," read live on every run.
 *
 * FOUR THINGS IT PROVES:
 *   1. DEAD LINKS — every `href="#x"` / `location.hash = "#x"` found in
 *      `app.html` and `js/app.js` names a route the router actually
 *      recognizes. `route()` has no 404: an unrecognized hash silently
 *      renders `views.hub()` with no error, so a typo'd or stale link reads
 *      to a player as "this button goes to the Hub for some reason" — worse
 *      than a broken link, because nothing ever complains.
 *   2. ORPHANED VIEWS — every function in the `views` object is reachable
 *      from somewhere: either its own key is used as a literal `#key`
 *      target, or it is called by name (`views.foo(...)`) the way
 *      `character`/`game`/`threat` are called from inside `route()`'s
 *      argument branches. A view satisfying neither is dead code rendering
 *      a page nothing links to.
 *   3. DUPLICATE NAV DESTINATIONS — no two `<a data-route>` entries inside
 *      the persistent `#navlinks` menu share an identical `href`. This is
 *      the one literal, mechanical slice of "two surfaces answer the same
 *      question" — exact href identity, not semantic overlap. It does NOT
 *      claim to catch two *different* routes that render similar content;
 *      that comparison needs a person's judgment about what the pages say,
 *      which is exactly the part of VR-197 this file does not touch.
 *   4. CLICK DEPTH OF THE PRIMARY NAV IS PROVABLY 1 — `<nav>` in `app.html`
 *      sits outside `<main id="view">`, and `route()` only ever replaces
 *      `view().innerHTML`; nothing in the `views` object touches
 *      `navlinks`. So every destination in the persistent menu is one click
 *      from literally any page, including itself — not measured by
 *      crawling, but proven from the fact that the router never rebuilds
 *      the nav. (Anything reached only through a card — a single
 *      character's page, a single game's page — sits outside the nav
 *      entirely and this file makes no claim about its depth.)
 *
 * ANCHORS, NOT LINE NUMBERS. `const views = {` and `function route() {` are
 * located by text search and their closing brace by matching indentation —
 * never a hardcoded line range. If either anchor moves or its close can't be
 * found at the same indent, this exits loudly (2) rather than silently
 * scanning the wrong text, the same contract `_arena.js` holds.
 *
 * No dependencies. Run: node _navcheck.js
 */
var fs = require("fs");
var path = require("path");

var ROOT = __dirname;
var appHtml = fs.readFileSync(path.join(ROOT, "app.html"), "utf8");
var appJs = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");

var checks = 0, failures = [];
function ok(label, cond) { checks++; if (!cond) failures.push(label); }

/* ── Line numbers for error messages, computed from a char offset ────────── */
function lineAt(text, idx) { return text.slice(0, idx).split("\n").length; }

/* ── 1. Anchor extraction — indentation-matched, never a hardcoded range ──── */
function findIndentedBlock(text, openRe, closeTrim) {
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(openRe);
    if (!m) continue;
    var indent = m[1];
    for (var j = i + 1; j < lines.length; j++) {
      var line = lines[j];
      var trimmed = line.replace(/^\s*/, "");
      var lineIndent = line.slice(0, line.length - trimmed.length);
      if (trimmed === closeTrim && lineIndent === indent) {
        return { startLine: i, endLine: j, indent: indent, text: lines.slice(i, j + 1).join("\n") };
      }
    }
    return null; // opened but no close found at the same indent — anchor drift
  }
  return null; // never opened — anchor gone
}

/* ── 2. The four detectors, as pure functions so the gate below can feed ──
 *      them synthetic good/bad input before they ever touch the real site. */

// A hash target is "dead" if its top-level segment names no known route.
function findDeadLinks(targets, knownRoutes) {
  return targets.filter(function (t) { return knownRoutes.indexOf(t.name) === -1; });
}

// A view is "wired" if it's called by name somewhere, or its own key is used
// as a literal `#key` hash target anywhere in the site.
function findOrphanViews(viewKeys, calledNames, hashTargetNames) {
  return viewKeys.filter(function (k) {
    return calledNames.indexOf(k) === -1 && hashTargetNames.indexOf(k) === -1;
  });
}

// Two nav entries pointing at byte-identical hrefs.
function findDuplicateHrefs(navHtml) {
  var re = /href="(#[^"]+)"/g, seen = {}, dups = [], m;
  while ((m = re.exec(navHtml))) {
    seen[m[1]] = (seen[m[1]] || 0) + 1;
    if (seen[m[1]] === 2) dups.push(m[1]);
  }
  return dups;
}

// A `.navdrop-btn` (the dropdown's own label, e.g. "Hub ▾") deliberately
// shares its href with the first entry of its own `.navdrop-menu` (e.g.
// "Hub home") — three-for-three in the current nav (Hub, Characters, Lab).
// That is the trigger doubling as a link to its section's overview, a
// normal dropdown convention, not a copy-paste duplicate. Found the hard
// way: the first version of this detector flagged all three as bugs. Strip
// the trigger anchors before comparing, so only PEER entries — two menu
// items, or two top-level links — are checked against each other.
function stripNavdropTriggers(navHtml) {
  return navHtml.replace(/<a class="navdrop-btn"[^>]*>.*?<\/a>/g, "");
}

// Extract `#word` targets from `href="#word"` / `href='#word'` and
// `location.hash = "#word"` / `location.hash='#word'`. Deliberately excludes
// SVG `<use href="#id">` sprite refs, which share the syntax but point at a
// fragment inside the same document, not a route — this site has none today
// (checked below with a fixture) but a future icon sprite must not read as
// 1,000 dead links.
function extractHashTargets(text) {
  var out = [];
  var re = /(?:href=["']|location\.hash\s*=\s*["'`])#([A-Za-z]\w*)/g;
  var m;
  while ((m = re.exec(text))) {
    var tagStart = text.lastIndexOf("<", m.index);
    var isSvgUse = tagStart !== -1 && text.slice(tagStart, tagStart + 5) === "<use ";
    if (!isSvgUse) out.push({ name: m[1], idx: m.index });
  }
  return out;
}

// True when <nav> is declared before the router-controlled <main id="view"> —
// i.e. the persistent nav sits outside the region route() ever rewrites.
function navPersistsOutsideView(html) {
  var navIdx = html.indexOf("<nav");
  var mainIdx = html.indexOf('<main id="view">');
  return navIdx !== -1 && mainIdx !== -1 && navIdx < mainIdx;
}

function extractDivBlock(text, openMarker) {
  var start = text.indexOf(openMarker);
  if (start === -1) return null;
  var i = text.indexOf(">", start) + 1, depth = 1;
  while (depth > 0) {
    var nextOpen = text.indexOf("<div", i);
    var nextClose = text.indexOf("</div>", i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) { depth++; i = nextOpen + 4; }
    else { depth--; i = nextClose + 6; }
  }
  return text.slice(start, i);
}

console.log("VEILRUN nav reachability check");

/* ── 3. THE GATE — synthetic bad input, proven caught, before real files ──
 * Rule 4: a bar that has never rejected anything is not known to be a bar.
 * Each pure detector (dead-link, orphan, duplicate-href, the SVG-<use>
 * exclusion, nav-placement) gets a deliberately-bad fixture AND a clean one
 * here, plus a check that anchor extraction refuses to guess on drift. If
 * any of these fail, the detector logic itself is broken and the real scan
 * below is not trustworthy — so a gate failure aborts before it runs. */
var gateFail = [];
function gate(label, cond) { checks++; if (!cond) gateFail.push(label); }

// 3a. Dead-link detector catches a made-up route and clears a real one.
(function () {
  var known = ["hub", "world"];
  var targets = [{ name: "hub", idx: 0 }, { name: "ghostRoute", idx: 10 }];
  var dead = findDeadLinks(targets, known);
  gate("gate: dead-link detector flags an unknown route", dead.length === 1 && dead[0].name === "ghostRoute");
  gate("gate: dead-link detector clears a real one", dead.every(function (d) { return d.name !== "hub"; }));
})();

// 3b. Orphan detector catches a view nothing calls and nothing links to.
(function () {
  var orphans = findOrphanViews(
    ["hub", "ghostPage"],
    ["hub"],          // calledNames — nothing calls ghostPage()
    ["hub"]           // hashTargetNames — nothing links to #ghostPage
  );
  gate("gate: orphan detector flags a view with no call site and no link", orphans.indexOf("ghostPage") > -1);
  gate("gate: orphan detector clears a view reached by a literal link", orphans.indexOf("hub") === -1);
  var wiredByCallOnly = findOrphanViews(["character"], ["character"], []);
  gate("gate: orphan detector clears a view reached only by a named call (character/game/threat's real shape)", wiredByCallOnly.length === 0);
})();

// 3c. Duplicate-href detector catches two menu entries pointing at the same place.
(function () {
  var bad = '<a data-route href="#hub">Hub home</a><a data-route href="#hub">Also Hub</a>';
  var good = '<a data-route href="#hub">Hub home</a><a data-route href="#world">World</a>';
  gate("gate: duplicate-href detector flags two identical menu hrefs", findDuplicateHrefs(bad).length === 1);
  gate("gate: duplicate-href detector clears distinct menu hrefs", findDuplicateHrefs(good).length === 0);
  // The real false positive this build hit: a dropdown trigger sharing its
  // href with the first item of its own menu must NOT be flagged, once
  // triggers are stripped — but a genuine duplicate between two PEER items
  // still must be.
  var triggerPair = '<a class="navdrop-btn" data-route href="#hub" aria-haspopup="true">Hub <span class="caret"></span></a>' +
    '<div class="navdrop-menu"><a data-route href="#hub">Hub home</a><a data-route href="#updates">Updates</a></div>';
  gate("gate: trigger + its own first menu item sharing an href is NOT flagged once triggers are stripped",
    findDuplicateHrefs(stripNavdropTriggers(triggerPair)).length === 0);
  var peerDup = '<div class="navdrop-menu"><a data-route href="#hub">Hub home</a><a data-route href="#hub">Copy-pasted by mistake</a></div>';
  gate("gate: two PEER menu items (not a trigger pair) sharing an href is still flagged",
    findDuplicateHrefs(stripNavdropTriggers(peerDup)).length === 1);
})();

// 3d. Hash-target extraction ignores SVG `<use href="#id">` sprite refs.
(function () {
  var svg = '<svg><use href="#icon-heart"></use></svg><a href="#gallery">Gallery</a>';
  var targets = extractHashTargets(svg).map(function (t) { return t.name; });
  gate("gate: hash extractor ignores an SVG <use> sprite ref", targets.indexOf("icon-heart") === -1);
  gate("gate: hash extractor still catches the real nav link beside it", targets.indexOf("gallery") > -1);
})();

// 3e. navPersistsOutsideView catches the nav being moved inside the swapped region.
(function () {
  var good = '<nav>stuff</nav><main id="view">rendered here</main>';
  var bad = '<main id="view">rendered here</main><nav>stuff</nav>';
  gate("gate: nav-placement check passes when <nav> precedes <main id=\"view\">", navPersistsOutsideView(good) === true);
  gate("gate: nav-placement check fails when <main id=\"view\"> precedes <nav>", navPersistsOutsideView(bad) === false);
})();

// 3f. Anchor extraction exits loudly rather than mis-scanning on drift.
(function () {
  var driftedText = "const views = {\n  hub() {\n  }\n// closing brace at the wrong indent, not \"};\"\n";
  var block = findIndentedBlock(driftedText, /^(\s*)const views = \{\s*$/, "};");
  gate("gate: anchor finder returns null (not a wrong guess) when the close never matches indent", block === null);
  var stableText = "  const views = {\n    hub() {\n    }\n  };\n";
  var okBlock = findIndentedBlock(stableText, /^(\s*)const views = \{\s*$/, "};");
  gate("gate: anchor finder still finds a real block", !!okBlock && okBlock.text.indexOf("hub()") > -1);
})();

if (gateFail.length) {
  console.log("\nFAIL — this harness's own detectors are broken (caught before touching the real site):\n");
  gateFail.forEach(function (g) { console.log("  - " + g); });
  process.exit(1);
}
console.log("  gate: " + checks + " synthetic bad/good fixtures, all caught correctly");

/* ── 4. Extract the real router out of js/app.js ──────────────────────────── */
var viewsBlock = findIndentedBlock(appJs, /^(\s*)const views = \{\s*$/, "};");
if (!viewsBlock) {
  console.log("\nFAIL (2) — anchor moved: `const views = {` in js/app.js was not found, or its");
  console.log("closing `};` no longer sits at the same indent. This harness reads the real");
  console.log("router rather than a retyped copy, so it refuses to guess. Re-check js/app.js.");
  process.exit(2);
}
var routeBlock = findIndentedBlock(appJs, /^(\s*)function route\(\) \{\s*$/, "}");
if (!routeBlock) {
  console.log("\nFAIL (2) — anchor moved: `function route() {` in js/app.js was not found, or");
  console.log("its closing `}` no longer sits at the same indent. Re-check js/app.js.");
  process.exit(2);
}

var memberRe = new RegExp("^" + viewsBlock.indent + "  (\\w+)\\([^)]*\\)\\s*\\{\\s*$");
var viewKeys = [];
viewsBlock.text.split("\n").forEach(function (line) {
  var m = line.match(memberRe);
  if (m) viewKeys.push(m[1]);
});
ok("the `views` object yields at least one page (extraction actually matched something)", viewKeys.length > 0);

// Extra top-level route names route() recognizes that aren't views keys
// (today: only "landing", which is rendered by VLanding.view() instead).
var extraRouteNames = [];
var nameRe = /name\s*===\s*"(\w+)"/g, nm;
while ((nm = nameRe.exec(routeBlock.text))) {
  if (extraRouteNames.indexOf(nm[1]) === -1) extraRouteNames.push(nm[1]);
}
var knownRoutes = viewKeys.concat(extraRouteNames.filter(function (n) { return viewKeys.indexOf(n) === -1; }));

// Views called by name anywhere (character/game/threat are reached this way,
// not by their own key appearing as a literal `#character` hash).
var calledNames = [];
var callRe = /views\.(\w+)\(/g, cm;
while ((cm = callRe.exec(appJs))) {
  if (calledNames.indexOf(cm[1]) === -1) calledNames.push(cm[1]);
}

var htmlTargets = extractHashTargets(appHtml);
var jsTargets = extractHashTargets(appJs);
var allTargets = htmlTargets.map(function (t) { return { name: t.name, file: "app.html", line: lineAt(appHtml, t.idx) }; })
  .concat(jsTargets.map(function (t) { return { name: t.name, file: "js/app.js", line: lineAt(appJs, t.idx) }; }));
ok("at least one hash target was found to check (extraction isn't silently empty)", allTargets.length > 0);

var allTargetNames = allTargets.map(function (t) { return t.name; });

/* ── 5. Check 1 — dead links ──────────────────────────────────────────────── */
var dead = findDeadLinks(allTargets, knownRoutes);
dead.forEach(function (d) {
  ok("dead link: " + d.file + ":" + d.line + " points at #" + d.name + ", which route() does not recognize " +
     "(falls back to Hub silently)", false);
});
if (!dead.length) ok("every hash target in app.html and js/app.js (" + allTargets.length + " found) resolves to a route route() recognizes", true);

/* ── 6. Check 2 — orphaned views ──────────────────────────────────────────── */
var orphans = findOrphanViews(viewKeys, calledNames, allTargetNames);
orphans.forEach(function (o) {
  ok("orphaned view: `views." + o + "` is never called by name and its key `#" + o + "` is never used as a link — dead page", false);
});
if (!orphans.length) ok("every one of the " + viewKeys.length + " views is reachable (called by name, or linked as #<key>)", true);

/* ── 7. Check 3 — duplicate nav destinations ──────────────────────────────── */
var navBlock = extractDivBlock(appHtml, '<div class="links" id="navlinks">');
ok("the persistent `#navlinks` menu was found in app.html", !!navBlock);
if (navBlock) {
  var dupHrefs = findDuplicateHrefs(stripNavdropTriggers(navBlock));
  dupHrefs.forEach(function (h) {
    ok("duplicate nav destination: two PEER menu entries both point at " + h + " (not a dropdown trigger/first-item pair)", false);
  });
  if (!dupHrefs.length) ok("no two peer entries in the primary nav menu share an identical href (dropdown triggers excluded — see stripNavdropTriggers)", true);
}

/* ── 8. Check 4 — the primary nav's click depth is provably 1 ────────────── */
ok("<nav> is declared before the router-controlled <main id=\"view\"> in app.html " +
   "(the router only ever swaps #view's content, so nav persists on every route)",
   navPersistsOutsideView(appHtml));
ok("no view template touches `navlinks` (the nav is never rebuilt by a route render)",
   viewsBlock.text.indexOf("navlinks") === -1);

/* ── report ───────────────────────────────────────────────────────────────── */
console.log("  " + viewKeys.length + " views · " + allTargets.length + " hash targets checked · " +
            (navBlock ? findDuplicateHrefs(stripNavdropTriggers(navBlock)).length : "?") + " duplicate nav hrefs (triggers excluded)");
if (failures.length) {
  console.log("\nFAILED (" + failures.length + "):");
  failures.forEach(function (f) { console.log("  - " + f); });
  process.exit(1);
}
console.log("\nPASS — " + checks + " checks. No dead links, no orphaned views, no duplicate nav " +
            "destinations, and the primary nav is provably one click from anywhere.");
