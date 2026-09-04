/* VEILRUN — the harness aggregator (VR-158, 9/4).
 *
 * WHY THIS EXISTS. "Everything relevant must be green before hand-off" (CLAUDE.md §4)
 * meant, until today, running twenty-one commands by hand across nine directories. A
 * checklist item that costs twenty-one invocations is a checklist item that gets done
 * from memory, and memory is what shipped two regressions into `_zoom.js` on 8/31.
 *
 * SO THIS RUNS THEM ALL AND PRINTS ONE ANSWER. It is not a new check. It asserts
 * nothing of its own — it is a runner, and every claim it makes belongs to the harness
 * that made it.
 *
 * IT DISCOVERS BY LISTING THE FOLDER, NEVER FROM A LIST. This is the whole point.
 * CLAUDE.md §4's harness sentence has been one entry short three times (8/15, 8/16,
 * 8/23) and a thread that trusted it instead of `ls` skipped a harness and shipped
 * through it. A runner built from a hard-coded array would inherit that bug forever
 * and look authoritative while doing it. There is no array here.
 *
 * AND IT CHECKS THE DOC BACK. Every harness it discovers is grepped for in CLAUDE.md,
 * and anything missing is reported as drift. That is the 8/31 failure turned into a
 * check: the list can still go stale, but it can no longer go stale QUIETLY.
 *
 * THE TWO TOOLS ARE EXCLUDED BY NAME. `_grefart.js` and `_pv.js` have no assertions
 * (CLAUDE.md §4). Running them proves nothing and counting them makes the green set
 * look larger than it is — which is the specific way a runner lies.
 *
 * SKIP IS NOT PASS, AND IT GETS ITS OWN COLUMN. `_docscheck.js` and `_leakcheck.js`
 * skip without the `Claude Access` mount; `_shroud.js` skips its render pass without
 * playwright; `_updatescheck.js` skips its baseline diff when HEAD already contains
 * the hero. All correct — never go red for a condition you cannot evaluate. But a
 * run where the two mount-dependent checks skipped has not checked the two things
 * most likely to be wrong, so a summary that folds SKIP into PASS is a summary that
 * lies by omission. Exit code is 0 for a clean run WITH skips; the skips are named.
 *
 * `--staged` SCOPES THE PER-GAME HARNESSES to games with staged changes, for the
 * pre-commit hook. Root harnesses always run: they cover the manifest, the feed and
 * the published surface, and any commit can break those.
 *
 * No dependencies. Run: node _ship.js [--staged] [--quiet]
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = __dirname;
var SELF = path.basename(__filename);
var ARGS = process.argv.slice(2);
var STAGED = ARGS.indexOf("--staged") !== -1;
var QUIET = ARGS.indexOf("--quiet") !== -1;

/* Named in CLAUDE.md §4 as tools, not harnesses. Neither has a pass/fail. */
var TOOLS = { "_grefart.js": 1, "_pv.js": 1 };

var TIMEOUT_MS = 180000;

function ls(dir) {
  try { return fs.readdirSync(dir); } catch (e) { return []; }
}

/* ── Discovery ─────────────────────────────────────────────────────────────── */

function rootHarnesses() {
  return ls(ROOT).filter(function (f) {
    return /^_.*\.js$/.test(f) && f !== SELF && !TOOLS[f];
  }).sort().map(function (f) {
    return { rel: f, dir: ROOT, file: f, scope: "root" };
  });
}

function gameHarnesses() {
  var out = [];
  var gamesDir = path.join(ROOT, "games");
  ls(gamesDir).sort().forEach(function (game) {
    var dir = path.join(gamesDir, game);
    try { if (!fs.statSync(dir).isDirectory()) return; } catch (e) { return; }
    ls(dir).sort().forEach(function (f) {
      var isHarness = (/^_.*\.(js|py)$/.test(f)) || f === "validate.js";
      if (!isHarness || TOOLS[f]) return;
      out.push({ rel: "games/" + game + "/" + f, dir: dir, file: f, scope: game });
    });
  });
  return out;
}

/* Games with staged changes, for --staged. Anything unparseable means "run it all",
   because a runner that silently narrows its own scope is worse than a slow one. */
function stagedGames() {
  try {
    var out = cp.execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf8" });
    var set = {};
    out.split("\n").forEach(function (line) {
      var m = /^games\/([^/]+)\//.exec(line.trim());
      if (m) set[m[1]] = 1;
    });
    return set;
  } catch (e) { return null; }
}

/* ── Running ───────────────────────────────────────────────────────────────── */

function run(h) {
  var isPy = /\.py$/.test(h.file);
  var bin = isPy ? "python3" : "node";
  var res = cp.spawnSync(bin, [h.file], {
    cwd: h.dir, encoding: "utf8", timeout: TIMEOUT_MS
  });

  if (res.error && res.error.code === "ENOENT") {
    return { state: "SKIP", note: bin + " not installed", tail: "" };
  }
  if (res.error && res.error.code === "ETIMEDOUT") {
    return { state: "FAIL", note: "timed out after " + (TIMEOUT_MS / 1000) + "s", tail: "" };
  }

  var text = (res.stdout || "") + (res.stderr || "");
  var lines = text.split("\n").filter(function (l) { return l.trim(); });
  var last = lines.length ? lines[lines.length - 1].trim() : "";

  /* Exit code is primary. The PASS/SKIP wording only refines a zero exit — several
     harnesses end on a line that says neither (games/proving-ground/_check.js prints
     "node --check: 1 inline script(s) OK"), so text alone cannot classify. */
  if (res.status !== 0) return { state: "FAIL", note: "", tail: last, full: text };

  if (/^~?\s*SKIP\b/i.test(last)) {
    return { state: "SKIP", note: last.replace(/^~?\s*SKIP\s*[—-]?\s*/i, ""), tail: last };
  }

  /* A green run that skipped PART of its work still says so, inline, with a ~. */
  var partial = lines.filter(function (l) { return /^\s*~\s*SKIP\b/i.test(l); });
  return {
    state: "PASS",
    note: partial.length ? partial.length + " partial skip" + (partial.length > 1 ? "s" : "") : "",
    tail: last
  };
}

/* ── The doc-drift check ───────────────────────────────────────────────────── */

function docDrift(found) {
  var claudeMd = path.join(ROOT, "CLAUDE.md");
  var text;
  try { text = fs.readFileSync(claudeMd, "utf8"); } catch (e) { return null; }
  return found.filter(function (h) { return text.indexOf(h.file) === -1; });
}

/* ── Main ──────────────────────────────────────────────────────────────────── */

var harnesses = rootHarnesses();
var games = gameHarnesses();
var scopeNote = "";

if (STAGED) {
  var touched = stagedGames();
  if (touched === null) {
    scopeNote = "git unreadable — running every per-game harness";
    harnesses = harnesses.concat(games);
  } else {
    var keep = games.filter(function (h) { return touched[h.scope]; });
    var names = Object.keys(touched);
    scopeNote = names.length
      ? "staged games: " + names.join(", ")
      : "no staged changes under games/ — root harnesses only";
    harnesses = harnesses.concat(keep);
  }
} else {
  harnesses = harnesses.concat(games);
}

console.log("VEILRUN ship check" + (STAGED ? " (staged scope)" : ""));
console.log("  " + harnesses.length + " harnesses discovered by listing the folders, not from a list");
if (scopeNote) console.log("  " + scopeNote);
console.log("");

var failed = [], skipped = [], passed = [];

harnesses.forEach(function (h) {
  var r = run(h);
  var tag = r.state === "PASS" ? "  ok  " : (r.state === "SKIP" ? "  ~   " : "  FAIL");
  var note = r.note ? "   (" + r.note + ")" : "";
  if (!QUIET || r.state !== "PASS") {
    console.log(tag + " " + pad(h.rel, 36) + r.state + note);
  }
  if (r.state === "FAIL") failed.push({ h: h, r: r });
  else if (r.state === "SKIP") skipped.push({ h: h, r: r });
  else passed.push({ h: h, r: r });
});

function pad(s, n) { while (s.length < n) s += " "; return s; }

console.log("");
console.log("  " + passed.length + " pass · " + skipped.length + " skip · " + failed.length + " fail");

/* The mount is the usual reason for a skip, and it is the one worth calling out:
   these two are the checks that police the ship checklist and the withheld lore. */
var mountBlind = skipped.filter(function (s) {
  return s.h.file === "_docscheck.js" || s.h.file === "_leakcheck.js";
});
if (mountBlind.length === 2) {
  console.log("\n  ⚠ BOTH mount-dependent checks skipped — `Claude Access` is not readable from here.");
  console.log("    Ship-checklist item 5 and the withheld-lore scan were NOT evaluated on this run.");
}

var drift = docDrift(harnesses);
if (drift && drift.length) {
  console.log("\n  ⚠ CLAUDE.md §4 does not mention: " + drift.map(function (h) { return h.file; }).join(", "));
  console.log("    Not a failure — the folder is the source of truth. But the doc is now stale,");
  console.log("    and a stale harness list is what shipped two regressions on 8/31.");
}

if (failed.length) {
  console.log("\nFAILED (" + failed.length + "):");
  failed.forEach(function (f) {
    console.log("  " + f.h.rel + (f.r.tail ? "\n      " + f.r.tail : "") + (f.r.note ? "  [" + f.r.note + "]" : ""));
  });
  console.log("\nFAIL — do not ship. Run the harness directly for its full output.");
  process.exit(1);
}

console.log("\nPASS — every harness that could run is green." +
            (skipped.length ? " " + skipped.length + " skipped and named above; a skip is not a pass." : ""));
