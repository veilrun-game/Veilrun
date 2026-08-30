/* VEILRUN — confidential lore check (VR-127, 8/30).
 *
 * WHY THIS EXISTS. Some world material is deliberately withheld — the crew should
 * meet it in a game, not in a changelog. Jordan, 8/30: *"something I think I want
 * to keep on the low, and tell the crew much later... I want to make sure there is
 * something there that surprises people."*
 *
 * THIS REPO IS THE PUBLIC WEBSITE (CLAUDE.md §5). Cloudflare Pages serves the root,
 * so every file here is one guessable URL away from any crew member — `/CLAUDE.md`
 * and `/_check.js` both return live content today. Withheld material reaching this
 * repo is not a private mistake, it is publication.
 *
 * AND IT ALREADY HAPPENED ONCE, WHICH IS WHY THIS IS A CHECK AND NOT A NOTE. On
 * 8/30 a paragraph added to CLAUDE.md — a paragraph whose entire purpose was to
 * record that the material must stay private — named it, in the repo, on a public
 * page. Writing down "keep this secret" is not a mechanism. This is.
 *
 * WHERE THE TERMS LIVE, AND WHY NOT HERE. The list is in `Claude Access` at
 * `_Project Knowledge/_setup/confidential-terms.txt`. Putting it in the repo would
 * publish the words it protects. Hashing them into the repo was considered and
 * rejected: a salted hash of one English word is a dictionary lookup, so it buys
 * the appearance of secrecy and leaks the salt as well.
 *
 * SO IT SKIPS WITHOUT THE MOUNT — the `_docscheck.js` / `_shroud.js` contract. A
 * check that cannot evaluate its condition must say so rather than go green.
 *
 * IT NEVER PRINTS THE TERM. A failure names the file, the line and the term's
 * INDEX in the list. Printing the match would put the secret in CI logs, in a
 * scrollback, and in whatever a screenshot of a red build ends up attached to.
 *
 * No dependencies. Run: node _leakcheck.js
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = __dirname;
var HOME = process.env.HOME || "";
var LIST = "_Project Knowledge/_setup/confidential-terms.txt";
var CANDIDATES = [
  path.join(HOME, "Desktop/Claude Access/Games/Veilrun", LIST),
  path.join(HOME, "Claude Access/Games/Veilrun", LIST),
  path.join(HOME, "Documents/Claude Access/Games/Veilrun", LIST),
  path.join(ROOT, "../Claude Access/Games/Veilrun", LIST),
  // Cowork/sandbox layout: connected folders mount as siblings under ~/mnt/<name>, so
  // `Claude Access` sits at ~/mnt/Claude Access — NOT ~/Claude Access, and not one level
  // up from the repo either (ROOT/.. is ~/mnt/GitHub). Both of those were already in this
  // list and both miss by one segment, so this harness SKIPPED in the one environment the
  // weekly scheduled tasks actually run in. A harness that always skips is a harness that
  // is never wrong and never useful; the SKIP text is honest about not being a pass, but
  // nobody reads a line that never changes.
  path.join(HOME, "mnt/Claude Access/Games/Veilrun", LIST),
  path.join(ROOT, "../../Claude Access/Games/Veilrun", LIST)
];

console.log("VEILRUN confidential lore check");

var listPath = null;
for (var i = 0; i < CANDIDATES.length; i++) {
  try { if (fs.statSync(CANDIDATES[i]).isFile()) { listPath = CANDIDATES[i]; break; } } catch (e) {}
}
if (!listPath) {
  console.log("  ~ SKIP — no `Claude Access` mount, so the term list is unreadable.");
  console.log("    Expected at: <Claude Access>/Games/Veilrun/" + LIST);
  console.log("\nSKIP — nothing asserted. This is not a pass.");
  process.exit(0);
}

var terms = fs.readFileSync(listPath, "utf8").split("\n")
  .map(function (l) { return l.trim(); })
  .filter(function (l) { return l && l.charAt(0) !== "#"; })
  .map(function (l) { return l.toLowerCase(); });

if (!terms.length) {
  console.log("  no terms listed — nothing is currently withheld.");
  console.log("\nPASS — vacuous, and correctly so.");
  process.exit(0);
}
console.log("  " + terms.length + " withheld term(s) loaded (not printed, by design)");

/* Scan what git actually tracks — that is exactly the set Pages deploys. An
   untracked scratch file is not published and is not this check's business. */
var files = [];
try {
  files = cp.execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .split("\n").map(function (f) { return f.trim(); }).filter(Boolean);
} catch (e) {
  console.log("\n  ~ SKIP — git is unavailable (" + e.message.split("\n")[0] + ")");
  process.exit(0);
}

/* Binaries have no prose to leak and would produce noise; the check's own source
   names no term but its FILENAME comment might, so it excludes itself either way. */
var SKIP_EXT = /\.(png|jpg|jpeg|webp|gif|ico|glb|gltf|mp3|wav|ogg|mp4|woff2?|ttf|otf|zip|pdf)$/i;
var SELF = path.basename(__filename);

var hits = [], scanned = 0;
files.forEach(function (rel) {
  if (SKIP_EXT.test(rel) || path.basename(rel) === SELF) return;
  var body;
  try { body = fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch (e) { return; }
  scanned++;
  var lines = body.split("\n");
  terms.forEach(function (term, ti) {
    /* Whole words only. Without the boundary, a term that is a substring of a
       normal word fails on every innocent use and the check gets switched off. */
    var re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    lines.forEach(function (line, li) {
      if (re.test(line)) hits.push({ file: rel, line: li + 1, index: ti });
    });
  });
});

console.log("  " + scanned + " tracked text file(s) scanned");

/* COMMIT MESSAGES ARE A PUBLIC SURFACE TOO, and a separate one — they are not
   files, so the scan above cannot see them. If the GitHub repo is public they are
   readable on the web; either way they are permanent, which is worse than a file.
   A file leak is one commit to fix. A message leak needs a history rewrite.

   Caught because the hand-off message for this very card described the material by
   name while describing the rule against naming it — the second time that mistake
   was made in one day, in a different medium, which is the argument for checking
   both rather than remembering harder. */
var msgHits = [];
try {
  /* One record separator BETWEEN commits and a unit separator INSIDE each, so a
     multi-line body cannot be mistaken for a record boundary. An earlier version
     split on a doubled separator and silently scanned 4 of 124 messages — a check
     that reads 3% of its input while reporting PASS is worse than no check, so the
     count is printed and worth glancing at. */
  var log = cp.execSync("git log --pretty=format:%H%x1f%s%n%b%x1e", { cwd: ROOT, encoding: "utf8" });
  var entries = log.split("\x1e").map(function (e) { return e.trim(); }).filter(Boolean);
  entries.forEach(function (entry) {
    var cut = entry.indexOf("\x1f");
    if (cut < 0) return;
    var sha = entry.slice(0, cut).trim().slice(0, 7);
    var text = entry.slice(cut + 1);
    terms.forEach(function (term, ti) {
      var re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      if (re.test(text)) msgHits.push({ sha: sha, index: ti });
    });
  });
  console.log("  " + entries.length + " commit message(s) scanned");
} catch (e) {
  console.log("  ~ commit messages not scanned (git unavailable)");
}

console.log("\n" + "=".repeat(58));
if (msgHits.length) {
  console.log("FAIL — withheld material is in a COMMIT MESSAGE, which is permanent:\n");
  msgHits.forEach(function (h) {
    console.log("  " + h.sha + "   (term #" + (h.index + 1) + " in the list)");
  });
  console.log("\n  A file can be fixed in the next commit. This cannot — it needs a history");
  console.log("  rewrite, so decide deliberately rather than reflexively. If the commit is");
  console.log("  unpushed, amending is enough.");
  process.exit(1);
}
if (hits.length) {
  console.log("FAIL — withheld material is in the public repo:\n");
  hits.forEach(function (h) {
    console.log("  " + h.file + ":" + h.line + "   (term #" + (h.index + 1) + " in the list)");
  });
  console.log("\n  The term is NOT printed here on purpose — a red build ends up in logs and");
  console.log("  screenshots. Open the line, and see the list in `Claude Access` if you need it.");
  console.log("\n  Remove it, or — if it has been ratified and announced — delete its line from");
  console.log("  the term list. Do not silence this by narrowing the scan.");
  process.exit(1);
}
console.log("PASS — nothing withheld appears in anything git tracks.");
