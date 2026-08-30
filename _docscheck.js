/* VEILRUN — docs coverage check (VR-140, 8/30).
 *
 * WHY THIS EXISTS. The ship checklist has five items. Four of them land in the
 * changeset — the updates feed, the manifest, the play path and the Trello card
 * are all one `git add` away from the commit that needs them. **Canon docs are
 * the one item that cannot**, because they live in `Claude Access` and this repo
 * is the public website (CLAUDE.md §5). So docs is the item that gets skipped,
 * and nothing notices, because the thing that would notice is not in the repo
 * either.
 *
 * This closes that loop as far as it can honestly be closed: it reads the VR
 * numbers this repo has CLAIMED in its commit subjects, and reports the ones the
 * canon docs never mention.
 *
 * IT REPORTS RATHER THAN POLICES, and the distinction is deliberate. Plenty of
 * cards genuinely want no docs entry — cover art, a crew survey, a one-line copy
 * fix. Failing on those trains you to ignore the harness, which is worse than not
 * having it. So an undocumented card is a LINE IN THE REPORT; it only FAILS when
 * a card is undocumented *and* touched a game, a mechanic or the engine, which is
 * exactly the changeset the checklist's item 5 is written for.
 *
 * IT SKIPS RATHER THAN FAILS WITHOUT THE MOUNT — the same contract `_shroud.js`
 * has without playwright. A clean checkout on a machine with no `Claude Access`
 * must not go red for a condition it cannot even evaluate.
 *
 * No dependencies. Run: node _docscheck.js   [--all]
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = __dirname;
var ALL = process.argv.indexOf("--all") > -1;

/* `VR-131/132/133` is one commit claiming three numbers, and it is the house style
   for a multi-card changeset — 913abcb and 7156f63 both use it, and so does the
   Reference doc's own heading. A bare /VR-\d+/ reads that as VR-131 and silently
   drops two, which would have reported them as undocumented in one direction and
   as unclaimed in the other. Both halves of this file share one reader so they
   cannot disagree about what a citation is. */
function citedIn(text) {
  var out = {}, m, re = /VR-(\d+(?:\s*\/\s*\d+)*)/g;
  while ((m = re.exec(text)) !== null) {
    m[1].split("/").forEach(function (n) {
      n = n.trim(); if (n) out["VR-" + n] = true;
    });
  }
  return Object.keys(out);
}

/* THE EXCLUSIONS, AND WHY THEY LIVE HERE RATHER THAN IN THE DOCS.
   A card can legitimately want no canon entry, and the honest way to say so is to
   WRITE IT DOWN with a reason — the same argument the preset spec's "NOT HERE,
   deliberately" comment makes. Silence would mean "undocumented" and "deliberately
   undocumented" look identical, which is the whole failure this check exists to end.

   In the harness rather than in a doc because this list is a claim about the REPO's
   history, it wants git history of its own, and the docs are not in git (§5). Every
   entry needs a reason string; an empty one fails the check below, so nobody can
   quiet this by adding a bare number. */
var NO_DOCS_NEEDED = {
  "VR-107": "NOT A GAP. Game Reference cover art — resolving Steam appids for 47 games is " +
            "asset sourcing, not a design decision. `_grefart.js` is the record of how it " +
            "works and it lives in the repo where it belongs."
};

/* CLEARED 8/30 — VR-109, VR-110, VR-120, VR-129 and VR-130 were listed here for
   about an hour and are now written up instead. Worth recording what put them here,
   because the mechanism will recur:

   All five were 'documented' only in `State of Play 2026-08-23.md`, a dated audit
   snapshot that was sitting in the canon folder. While it sat there this check read
   it as canon and passed — a snapshot saying "VR-130 shipped" is a record of a day,
   not documentation of a decision. Slimming the folder on 8/30 moved it to Planning/
   and five cards went red at once.

   So: a status list in the canon folder does not just go stale, it MASKS. It made
   four Game Reference interaction decisions and an entire shader rework look covered.
   VR-130 is the one that proves the point — the Shroud went from two phases to one
   front, brought the only harness in this repo that renders, and had no entry at all.

   Now: VR-98/109/110/120 are one entry in Design System.md ("the four caps, and the
   one that caps a person"), VR-129 is the primary-action-placement entry beside it,
   and VR-130 is a 3D-track section in Reference — Game Engine & Mechanics. */

/* Where the canon docs actually live. Several candidates because the mount point
   has moved once already and a hard-coded absolute path is the kind of thing that
   rots silently — the folder name is the stable part, not the route to it. */
var HOME = process.env.HOME || "";
var CANDIDATES = [
  path.join(HOME, "Desktop/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(HOME, "Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(HOME, "Documents/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(ROOT, "../Claude Access/Games/Veilrun/_Project Knowledge"),
  // Cowork/sandbox layout: connected folders mount as siblings under ~/mnt/<name>, so
  // `Claude Access` sits at ~/mnt/Claude Access — NOT ~/Claude Access, and not one level
  // up from the repo either (ROOT/.. is ~/mnt/GitHub). Both of those were already in this
  // list and both miss by one segment, so this harness SKIPPED in the one environment the
  // weekly scheduled tasks actually run in. A harness that always skips is a harness that
  // is never wrong and never useful; the SKIP text is honest about not being a pass, but
  // nobody reads a line that never changes.
  path.join(HOME, "mnt/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(ROOT, "../../Claude Access/Games/Veilrun/_Project Knowledge")
];

function findDocs() {
  for (var i = 0; i < CANDIDATES.length; i++) {
    try { if (fs.statSync(CANDIDATES[i]).isDirectory()) return CANDIDATES[i]; } catch (e) {}
  }
  return null;
}

console.log("VEILRUN docs coverage check");

var DOCS = findDocs();
if (!DOCS) {
  console.log("  ~ SKIP — no `Claude Access` mount found, so there are no docs to check against.");
  console.log("    Looked in:");
  CANDIDATES.forEach(function (c) { console.log("      " + c.replace(HOME, "~")); });
  console.log("\nSKIP — nothing asserted. This is not a pass.");
  process.exit(0);
}
console.log("  docs: " + DOCS.replace(HOME, "~"));

/* ---- what the docs mention ---------------------------------------------- */
var documented = {};
var docFiles = fs.readdirSync(DOCS).filter(function (f) { return /\.md$/i.test(f); });
docFiles.forEach(function (f) {
  var body = fs.readFileSync(path.join(DOCS, f), "utf8");
  citedIn(body).forEach(function (id) {
    (documented[id] = documented[id] || []).push(f);
  });
});
console.log("  " + docFiles.length + " docs · " + Object.keys(documented).length + " VR numbers mentioned");

/* ---- what the commits claimed -------------------------------------------- */
/* Commit subjects, not bodies: CLAUDE.md §1 makes the subject the place a number
   is CLAIMED, and a number claimed in a subject is the one that becomes permanent. */
var log = "";
try {
  log = cp.execSync("git log --pretty=format:%H%x09%ad%x09%s --date=short", { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  console.log("\n  ~ SKIP — no git history available (" + e.message.split("\n")[0] + ")");
  process.exit(0);
}

/* Which paths make a commit one the checklist's item 5 actually governs.
   "changes a game, level or mechanic" — engine, game source and the manifest. */
function touchesGame(sha) {
  var files = "";
  try { files = cp.execSync("git show --pretty=format: --name-only " + sha, { cwd: ROOT, encoding: "utf8" }); }
  catch (e) { return false; }
  return /^games\/.+\.(html|js)$/m.test(files) || /^js\/data\.js$/m.test(files);
}

var claims = {};   // VR-## -> [{sha, date, subject}]
log.split("\n").forEach(function (line) {
  var parts = line.split("\t");
  if (parts.length < 3) return;
  var sha = parts[0], date = parts[1], subj = parts.slice(2).join("\t");
  citedIn(subj).forEach(function (id) {
    (claims[id] = claims[id] || []).push({ sha: sha, short: sha.slice(0, 7), date: date, subject: subj });
  });
});

var ids = Object.keys(claims).sort(function (a, b) { return +a.slice(3) - +b.slice(3); });
console.log("  " + ids.length + " VR numbers claimed across " + log.split("\n").length + " commits");

/* ---- the report ---------------------------------------------------------- */
var undocumented = ids.filter(function (id) { return !documented[id]; });
var failures = [];

if (!undocumented.length) {
  console.log("\n[coverage]\n  ok    every VR number claimed in a commit subject appears in the canon docs");
} else {
  console.log("\n[claimed in a commit, never mentioned in the docs]");
  undocumented.forEach(function (id) {
    var c = claims[id][0];
    var governed = claims[id].some(function (x) { return touchesGame(x.sha); });
    var excused = Object.prototype.hasOwnProperty.call(NO_DOCS_NEEDED, id);
    var tag = !governed ? "  note " : (excused ? "  DEBT " : "  MISS ");
    if (governed && !excused) failures.push(id);
    console.log(tag + id + "  " + c.date + "  " + c.short + "  " + c.subject.slice(0, 70));
    if (governed && !excused) console.log("        ^ touched games/ or js/data.js — checklist item 5 applies to this one");
    if (excused) console.log("        ^ " + NO_DOCS_NEEDED[id].replace(/(.{88})\s/g, "$1\n          "));
  });
}

if (ALL) {
  console.log("\n[documented, for reference]");
  ids.filter(function (id) { return documented[id]; }).forEach(function (id) {
    console.log("  ok    " + id + "  →  " + documented[id].filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", "));
  });
}

/* Docs that cite a number no commit ever claimed. Not a failure — a card can be
   documented before it ships, and pre-migration history is in the archived Kanban
   rather than in git — but it is the direction a typo'd id shows up from. */
var orphans = Object.keys(documented).filter(function (id) { return !claims[id]; })
  .sort(function (a, b) { return +a.slice(3) - +b.slice(3); });
if (orphans.length) {
  console.log("\n[in the docs, never claimed in a commit subject — unshipped, pre-git, or a typo]");
  console.log("  " + orphans.join(" "));
}

/* The exclusions list polices itself, so it cannot become the quiet place numbers
   go to die: a bare entry with no reason fails, and an entry for a card that IS
   documented — or that never shipped — is stale and fails too. An exemption you
   can add without saying why is not a decision, it is a mute button. */
var badExcuse = [];
Object.keys(NO_DOCS_NEEDED).forEach(function (id) {
  var why = NO_DOCS_NEEDED[id];
  if (typeof why !== "string" || why.trim().length < 20)
    badExcuse.push(id + " — no reason given; say why or write the entry");
  else if (documented[id])
    badExcuse.push(id + " — now documented in " + documented[id][0] + "; delete this line");
  else if (!claims[id])
    badExcuse.push(id + " — no commit ever claimed it; the exclusion is stale");
});
if (badExcuse.length) {
  console.log("\n[the exclusions list is not honest]");
  badExcuse.forEach(function (m) { console.log("  FAIL  " + m); });
}

console.log("\n" + "=".repeat(58));
if (badExcuse.length) {
  console.log("FAIL — " + badExcuse.length + " bad entr" + (badExcuse.length === 1 ? "y" : "ies") +
              " in NO_DOCS_NEEDED. Fix the list, not the check.");
  process.exit(1);
}
if (failures.length) {
  console.log("FAIL — " + failures.join(", ") + " changed a game and the canon docs never mention it.");
  console.log("       Write the entry in `Claude Access` (CLAUDE.md §1), or — if the card genuinely");
  console.log("       wants none — add it to NO_DOCS_NEEDED at the top of this file WITH A REASON.");
  process.exit(1);
}
/* "Deliberately undocumented" and "not written up yet" are different states and the
   summary should not blur them — blurring is how debt becomes invisible again. The
   reason string declares which it is; anything not opening NOT A GAP counts as debt. */
var excused = Object.keys(NO_DOCS_NEEDED);
var debt = excused.filter(function (id) { return !/^NOT A GAP/.test(NO_DOCS_NEEDED[id]); });
console.log("PASS — every game-changing card that claimed a number is documented" +
            (excused.length ? ", or is listed with a stated reason (" + excused.length + ")" : "") + ".");
if (debt.length) {
  console.log("       " + debt.length + " of those " + (debt.length === 1 ? "is" : "are") +
              " acknowledged DEBT, not an exemption: " + debt.join(", ") + ".");
  console.log("       Listed so it stays visible. Write the entry and delete the line.");
}
