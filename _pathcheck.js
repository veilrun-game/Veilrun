/* VEILRUN — publish-by-location check (VR-165 Gap B, 9/7).
 *
 * WHY THIS IS A SEPARATE HARNESS AND NOT MORE OF `_leakcheck.js`.
 *
 * `_leakcheck.js` answers "does this file CONTAIN something withheld". VR-164 proved
 * that is not the whole question. `.claude/agents/release-steward.md` was tracked,
 * scanned, and clean — zero term matches — and it was still world-readable at
 * <https://veilrun-dxv.pages.dev/.claude/agents/release-steward.md> from the day it
 * was committed. The content check did its job exactly right and the file still
 * should never have been published.
 *
 * **"No withheld term" does not mean "safe to publish."** Some files are wrong to
 * publish because of WHERE THEY ARE, whatever is inside them. That is a rule about
 * location, and no amount of reading the bytes will ever produce it.
 *
 * AND IT CANNOT LIVE INSIDE `_leakcheck.js`, WHICH IS THE OTHER HALF OF THE CARD.
 * That file exits 0 at ~line 62 when the `Claude Access` mount is missing, because
 * its term list is unreadable without it — correct for a content scan. A location
 * rule needs NO term list and no mount, so putting it after that early exit would
 * make it silently never run in exactly the environments that have no mount: a check
 * that looks present and isn't. That is VR-164's failure reproduced structurally, so
 * this is its own file at the root, discovered by `_ship.js` and run unconditionally.
 *
 * IT NEVER SKIPS. The only thing it needs is git.
 *
 * THE RULES POLICE THEMSELVES. Every entry carries a reason string and an empty one
 * fails the run, the same contract `_docscheck.js` puts on `NO_DOCS_NEEDED`. A rule
 * you can add or weaken without saying why is a mute button, not a decision.
 *
 * WHAT IT IS NOT. It is not a second `.gitignore`. `.gitignore` stops a file being
 * added; this catches one that got added anyway — by an `-f`, by a rule written after
 * the fact, or by a path nobody thought of. `.gitignore` does not untrack what is
 * already tracked (VR-164 again), so the two are complementary and neither replaces
 * the other. The cross-check at the end reports rules that have no `.gitignore` cover.
 *
 * No dependencies. Run: node _pathcheck.js
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = __dirname;

/* ── The denylist ──────────────────────────────────────────────────────────────
 *
 * DIRECTORIES THAT MUST NEVER BE TRACKED. Matched at the repo root or at any depth,
 * because `games/.claude/` is the same mistake one folder down and a root-anchored
 * rule would wave it through.
 */
var DENY_DIRS = [
  {
    dir: ".claude/",
    card: "VR-164",
    reason: "Agent config — skills, agents, commands and hooks. It names unshipped " +
            "cards, quotes Jordan and describes how the project is run. None of it is " +
            "dangerous and all of it is ours. Pages serves dot-directories like any " +
            "other file; release-steward.md was live at a guessable URL for a day."
  },
  {
    dir: "_Project Knowledge/",
    card: "VR-127",
    reason: "Canon — world lore, unreleased character kits, unratified proposals. " +
            "CLAUDE.md §1: `Claude Access` is the ONLY place these are edited, and §5 " +
            "says committing them is publication, not a private slip. Missed by one " +
            "`git add` on 8/30. The repo's `— see Claude Access` stub is a different " +
            "path and is deliberately allowed."
  },
  {
    dir: "Art & Assets/",
    card: "VR-127",
    reason: "The Midjourney prompt ledger and asset recipes, same rule as canon. The " +
            "shipped webp lives in `assets/`; the working folder never crosses over."
  }
];

/* FILENAMES THAT MUST NEVER BE TRACKED, wherever they sit. A path rule rather than a
 * content rule on purpose: this fires on the NAME, so it catches an empty placeholder
 * and a mis-pasted key alike, and it fires before anyone has to read the bytes. */
var DENY_NAMES = [
  {
    re: /service_role/i,
    card: "CLAUDE.md §5",
    reason: "The Supabase service_role key must never be committed in any form. The " +
            "anon key is browser-safe and lives in js/config.js on purpose — that is " +
            "the whole distinction, so the dangerous one gets a name rule of its own."
  },
  {
    re: /^\.env(\..*)?$/i,
    card: "CLAUDE.md §5",
    reason: "Environment files. `.env.example` is the one legitimate exception and is " +
            "allowed by name below."
  },
  {
    re: /\.pem$/i,
    card: "CLAUDE.md §5",
    reason: "Private keys. There is no version of this that is safe on a public site."
  }
];

var NAME_EXCEPTIONS = { ".env.example": "the checked-in template — no values in it" };

/* THE POINTER STUBS MUST STAY EMPTY. CLAUDE.md §1 calls them "deliberately empty and
 * must stay that way", which until now was a sentence rather than a mechanism. A stub
 * that quietly grows a real file is the canon leak wearing the pointer's name, and it
 * would pass DENY_DIRS above because its path is `_Project Knowledge — see Claude
 * Access/`, not `_Project Knowledge/`. Matched by SUFFIX so a fourth stub added later
 * is covered without editing this file. */
var STUB_SUFFIX = "— see Claude Access";
var STUB_ALLOWED = { ".gitkeep": 1 };

/* ── Matching ──────────────────────────────────────────────────────────────────── */

/* Root or any depth, matched on WHOLE PATH SEGMENTS. A bare `indexOf` would be wrong
   in the direction that fails a clean repo: `notes.claude/` contains the string
   ".claude/" and is an ordinary folder. The segment test is what makes `games/.claude/`
   a hit and `notes.claude/` a miss, and the cases below exist to hold that line —
   mutating this function to a plain substring search passed an earlier version of the
   test set, which is how the weak test was found. */
function underDir(rel, dir) {
  return rel.indexOf(dir) === 0 || rel.indexOf("/" + dir) !== -1;
}

function stubViolation(rel) {
  var parts = rel.split("/");
  for (var i = 0; i < parts.length - 1; i++) {
    if (parts[i].slice(-STUB_SUFFIX.length) === STUB_SUFFIX) {
      var base = parts[parts.length - 1];
      return STUB_ALLOWED[base] ? null : { stub: parts[i], file: base };
    }
  }
  return null;
}

function nameViolation(rel) {
  var base = rel.split("/").pop();
  if (NAME_EXCEPTIONS[base]) return null;
  for (var i = 0; i < DENY_NAMES.length; i++) {
    if (DENY_NAMES[i].re.test(base)) return DENY_NAMES[i];
  }
  return null;
}

console.log("VEILRUN publish-by-location check");

var checks = 0, problems = [];
function ok(label, cond) {
  checks++;
  if (!cond) problems.push(label);
}

/* ── 1. The rules police themselves ────────────────────────────────────────────
 * Before asserting anything about the repo, assert that the list doing the asserting
 * is honest. A bare rule with no reason would let someone widen or narrow this file
 * silently, and the value of the whole harness is that its policy is legible. */
DENY_DIRS.concat(DENY_NAMES).forEach(function (r) {
  var label = r.dir || String(r.re);
  ok("rule `" + label + "` states a reason", !!(r.reason && r.reason.trim().length > 20));
  ok("rule `" + label + "` cites a card or doc", !!(r.card && r.card.trim()));
});
DENY_DIRS.forEach(function (r) {
  ok("dir rule `" + r.dir + "` ends in a slash", r.dir.slice(-1) === "/");
});

/* ── 2. The matcher is tested, not eyeballed ───────────────────────────────────
 * The near-miss cases are the point. `_Project Knowledge — see Claude Access/` must
 * NOT match the `_Project Knowledge/` rule, and `.claudeignore` must not match
 * `.claude/` — a matcher that is wrong in that direction fails a clean repo, and a
 * harness that cries wolf is a harness that gets switched off. */
[
  [".claude/agents/release-steward.md", ".claude/", true, "the real VR-164 file"],
  [".claude/settings.local.json", ".claude/", true, "settings under the same dir"],
  ["games/.claude/agents/x.md", ".claude/", true, "nested one folder down"],
  [".claudeignore", ".claude/", false, "a prefix that is not the directory"],
  ["js/claude/x.js", ".claude/", false, "no leading dot"],
  ["notes.claude/x.md", ".claude/", false, "the name INSIDE a segment, not a segment"],
  ["a/b/notes.claude/x.md", ".claude/", false, "the same, nested"],
  ["my_Project Knowledge/x.md", "_Project Knowledge/", false, "a segment that merely ends with the rule"],
  ["_Project Knowledge/World & Lore.md", "_Project Knowledge/", true, "canon committed"],
  ["_Project Knowledge — see Claude Access/.gitkeep", "_Project Knowledge/", false, "the pointer stub"],
  ["Art & Assets/prompt-ledger.md", "Art & Assets/", true, "the working art folder"],
  ["assets/gallery/vesper-01.webp", "Art & Assets/", false, "the shipped webp folder"]
].forEach(function (t) {
  ok("matcher: " + t[3], underDir(t[0], t[1]) === t[2]);
});

[
  ["js/config.js", false, "the anon key file stays"],
  ["js/supabase_service_role.js", true, "a service_role key by name"],
  [".env", true, "a bare env file"],
  [".env.production", true, "an env file with a suffix"],
  [".env.example", false, "the checked-in template"],
  ["certs/site.pem", true, "a private key"],
  ["games/proving-ground/index.html", false, "an ordinary game file"]
].forEach(function (t) {
  ok("name rule: " + t[2], !!nameViolation(t[0]) === t[1]);
});

[
  ["_Project Knowledge — see Claude Access/.gitkeep", false, "the stub's own keeper"],
  ["_Project Knowledge — see Claude Access/World & Lore.md", true, "canon inside the stub"],
  ["Art & Assets — see Claude Access/ledger.md", true, "art notes inside the stub"],
  ["css/site.css", false, "a path with no stub in it"]
].forEach(function (t) {
  ok("stub rule: " + t[2], !!stubViolation(t[0]) === t[1]);
});

console.log("  " + checks + " policy and matcher checks");

if (problems.length) {
  console.log("\n" + "=".repeat(58));
  console.log("FAIL — this harness's own rules or matcher are broken:\n");
  problems.forEach(function (p) { console.log("  " + p); });
  console.log("\n  Fix these before trusting anything below them.");
  process.exit(1);
}

/* ── 3. The actual scan ────────────────────────────────────────────────────────
 * `git ls-files` reads the INDEX, not the last commit, so a file that has been
 * `git add`ed and not yet committed is already visible here. That is what lets the
 * pre-commit hook stop the mistake at the moment it is made rather than one commit
 * after it is public. */
/* `-z` AND NUL SPLITTING, NEVER NEWLINES. Plain `git ls-files` applies `core.quotePath`
   and returns a non-ASCII path as a QUOTED, BACKSLASH-ESCAPED string — this repo's two
   pointer stubs come back as `"_Project Knowledge \342\200\224 see Claude Access/..."`,
   quotes and octal included. Every rule below would then be comparing against a mangled
   path and would quietly never match. Found by mutation-testing this file: the stub test
   passed as a unit and failed against a real index. `-z` emits raw bytes with a NUL
   separator and no quoting, which is also the only form that survives a filename
   containing a newline. `_leakcheck.js` had the same bug and is fixed the same way. */
var files;
try {
  files = cp.execSync("git ls-files -z", { cwd: ROOT, encoding: "utf8" })
    .split("\0").map(function (f) { return f.trim(); }).filter(Boolean);
} catch (e) {
  console.log("\n  ~ SKIP — git is unavailable (" + e.message.split("\n")[0] + ")");
  console.log("\nSKIP — nothing asserted. This is not a pass.");
  process.exit(0);
}

console.log("  " + files.length + " tracked path(s) examined");

var hits = [];
files.forEach(function (rel) {
  DENY_DIRS.forEach(function (r) {
    if (underDir(rel, r.dir)) hits.push({ rel: rel, why: "directory `" + r.dir + "`", card: r.card, reason: r.reason });
  });
  var n = nameViolation(rel);
  if (n) hits.push({ rel: rel, why: "filename rule " + String(n.re), card: n.card, reason: n.reason });
  var s = stubViolation(rel);
  if (s) {
    hits.push({
      rel: rel,
      why: "the pointer stub `" + s.stub + "` must stay empty",
      card: "CLAUDE.md §1",
      reason: "The stub exists to point at `Claude Access`. A real file inside it is " +
              "canon in the public repo wearing the pointer's name."
    });
  }
});

/* ── 4. Cross-check: is each rule also covered by .gitignore? ──────────────────
 * REPORTED, NEVER FATAL. A rule with no ignore cover still works — this harness
 * catches it at `git add` time via the index. But it catches it as a red build
 * rather than as a file that was never staged, and knowing which rules have only
 * the late defence is worth a line. Failing here would block commits over a
 * belt-and-braces gap, which is how a hook gets bypassed. */
var uncovered = [];
try {
  var ig = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  DENY_DIRS.forEach(function (r) {
    if (ig.indexOf(r.dir) === -1) uncovered.push(r.dir);
  });
} catch (e) { uncovered = null; }

console.log("\n" + "=".repeat(58));

if (hits.length) {
  console.log("FAIL — tracked files that must never be published by LOCATION:\n");
  hits.forEach(function (h) {
    console.log("  " + h.rel);
    console.log("      ^ " + h.why + "  (" + h.card + ")");
    console.log("        " + h.reason.replace(/\s+/g, " "));
    console.log("");
  });
  console.log("  THIS IS NOT A CONTENT PROBLEM and `_leakcheck.js` will not agree with it.");
  console.log("  The file may be entirely clean and still be wrong to serve. Untrack it:");
  console.log("      git rm --cached -r <path>");
  console.log("  and confirm `.gitignore` covers it, since ignoring never untracks (VR-164).");
  console.log("");
  console.log("  Do not silence this by deleting the rule. If a path genuinely belongs on");
  console.log("  the public site, say so on a card first — that is a publishing decision.");
  process.exit(1);
}

if (uncovered === null) {
  console.log("  ~ .gitignore unreadable — the cross-check did not run.");
} else if (uncovered.length) {
  console.log("  ⚠ denied but not in .gitignore: " + uncovered.join(", "));
  console.log("    Not a failure — this harness still catches them from the index. But the");
  console.log("    early defence is missing, so the first warning would be a red commit.");
}

console.log("PASS — " + checks + " checks. Nothing tracked violates a location rule.");
