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
 * IT CHECKS THE DOC'S NUMBERS TOO (VR-161, 9/6). A missing FILENAME is visible from
 * `ls`; a wrong COUNT is only visible by running the harness and reading its output.
 * CLAUDE.md §4 said `_touch.js` had "374 checks" while the harness printed 494 — it
 * moved twice and nothing noticed either time, because the number was on screen every
 * commit and nothing was ever comparing it. Now something is. Same run, same output,
 * no second invocation and no new cost.
 *
 * A COUNT THAT DROPS IS THE INTERESTING ONE. Rising means the harness grew. Falling
 * means assertions were DELETED, so it is called out separately and loudly.
 *
 * THIS NEVER EDITS CLAUDE.md. A checker that silently rewrites the thing it checks can
 * only ever agree with itself. It reports the gap; a human folds it.
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
  var checks = countOf(text);

  /* Exit code is primary. The PASS/SKIP wording only refines a zero exit — several
     harnesses end on a line that says neither (games/proving-ground/_check.js prints
     "node --check: 1 inline script(s) OK"), so text alone cannot classify. */
  if (res.status !== 0) return { state: "FAIL", note: "", tail: last, full: text, checks: checks };

  if (/^~?\s*SKIP\b/i.test(last)) {
    return { state: "SKIP", note: last.replace(/^~?\s*SKIP\s*[—-]?\s*/i, ""), tail: last, checks: checks };
  }

  /* A green run that skipped PART of its work still says so, inline, with a ~. */
  var partial = lines.filter(function (l) { return /^\s*~\s*SKIP\b/i.test(l); });
  return {
    state: "PASS",
    note: partial.length ? partial.length + " partial skip" + (partial.length > 1 ? "s" : "") : "",
    tail: last,
    checks: checks
  };
}

/* The harness's own count, taken from the output it already produced.
 *
 * LAST MATCH WINS, deliberately. Every harness prints its total in its summary and the
 * summary is at the end — `PASS — 494 checks`, `PASS — hub states: 42 checks passed`,
 * `876 checks passed` two lines above a wordier PASS line. An earlier `N checks` is
 * either narration or a sub-total, and taking the first would quietly compare the doc
 * against a fragment. Harnesses that never print a count (_check.js, _leakcheck.js)
 * return null and are simply not comparable — which is not the same as agreeing. */
function countOf(text) {
  var re = /(\d+)\s+checks?\b/gi, m, last = null;
  while ((m = re.exec(text)) !== null) last = parseInt(m[1], 10);
  return last;
}

/* ── The doc-drift check ───────────────────────────────────────────────────── */

function docDrift(found) {
  var claudeMd = path.join(ROOT, "CLAUDE.md");
  var text;
  try { text = fs.readFileSync(claudeMd, "utf8"); } catch (e) { return null; }
  return found.filter(function (h) { return text.indexOf(h.file) === -1; });
}

/* ── The doc-NUMBER drift check (VR-161) ───────────────────────────────────── */

/* ATTRIBUTION IS THE WHOLE PROBLEM. "It has since grown to 374 checks" names no file,
 * and the nearest filename before it is `_sim.js` — mentioned mid-sentence, purely as
 * a comparison ("extracts the marked TOUCH block the same way `_sim.js` extracts
 * BALANCE"). Nearest-mention would blame the wrong harness and be confidently wrong,
 * which is worse than not checking.
 *
 * So a filename only becomes THE SUBJECT when it opens a sentence — start of line, or
 * straight after a `.`, ignoring the bold markers and warning glyphs the doc wraps its
 * subjects in. That is exactly how §4 is written: each harness gets introduced at the
 * head of a sentence and then referred to as "it" for a paragraph. A count claim is
 * attributed to the subject in force where it appears.
 *
 * A CLAIM WE CANNOT ATTRIBUTE IS REPORTED, NOT DROPPED. Silently discarding the ones
 * that do not parse is how a checker becomes theatre — it would go quiet precisely
 * when the doc got harder to read. */
function docNumbers(results) {
  var claudeMd = path.join(ROOT, "CLAUDE.md");
  var text;
  try { text = fs.readFileSync(claudeMd, "utf8"); } catch (e) { return null; }

  /* Ordered scan: a harness filename, or an "N checks" claim, whichever comes next. */
  var token = /(_[A-Za-z0-9]+\.(?:js|py))|(\d+)\s+checks?\b/g;
  var subject = null, claims = [], m, prevEnd = 0;

  while ((m = token.exec(text)) !== null) {
    /* A BLANK LINE ENDS THE SUBJECT. §4 introduces a harness and then says "it" for the
       rest of that bullet; it never carries the pronoun across a paragraph break. Letting
       the subject persist would attach an orphaned claim to whichever harness was named
       last — an attribution that looks confident and is arbitrary. Dropping it here is
       what makes the "unattributed" report reachable instead of decorative. */
    if (/\n[ \t]*\n/.test(text.slice(prevEnd, m.index))) subject = null;
    prevEnd = m.index + m[0].length;

    if (m[1]) {
      /* Sentence-initial? Walk back over the decoration the doc wraps its subjects in —
         spaces, backticks, `*`, `-`, `·`, and any non-ASCII glyph (⚠️, em dash, emoji) —
         and stop at the first thing that decides it. A newline ENDS the walk rather than
         being skipped: a filename opening a line is a subject, and eating the newline
         would carry the question onto the previous line and answer it there. */
      var subj = false;
      for (var i = m.index - 1; ; i--) {
        if (i < 0) { subj = true; break; }               /* start of file */
        var ch = text[i];
        if (ch === "\n") { subj = true; break; }          /* start of a line */
        if (ch === ".") { subj = true; break; }           /* start of a sentence */
        if (!/[ \t`*\-·]/.test(ch) && text.charCodeAt(i) <= 127) break;  /* mid-sentence */
      }
      if (subj) subject = m[1];
    } else {
      claims.push({
        file: subject,
        docSays: parseInt(m[2], 10),
        line: text.slice(0, m.index).split("\n").length
      });
    }
  }

  return claims.map(function (c) {
    if (!c.file) return { line: c.line, docSays: c.docSays, verdict: "unattributed" };
    var r = results[c.file];
    if (!r) return { line: c.line, docSays: c.docSays, file: c.file, verdict: "not run" };
    if (r.checks == null) return { line: c.line, docSays: c.docSays, file: c.file, verdict: "no count" };
    if (r.checks === c.docSays) return { verdict: "agrees" };
    return {
      line: c.line, docSays: c.docSays, file: c.file, actual: r.checks,
      verdict: r.checks < c.docSays ? "FELL" : "rose"
    };
  }).filter(function (c) { return c.verdict !== "agrees"; });
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

/* Keyed by BASENAME, because that is how CLAUDE.md names them. Two harnesses can share
   one (`_check.js` exists at the root and in two games), so a basename that gets a count
   from more than one file is marked ambiguous and never compared — an attribution we
   cannot make is not an attribution we should guess. */
var byName = {};

harnesses.forEach(function (h) {
  var r = run(h);
  if (r.checks != null) {
    if (byName[h.file] && byName[h.file].checks !== r.checks) byName[h.file] = { checks: null };
    else byName[h.file] = r;
  } else if (!byName[h.file]) byName[h.file] = r;
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

/* Numbers, not just filenames. Reported, never fixed — and never fatal: a stale count
   is a documentation bug, and blocking the pre-commit hook on one would only teach
   people to bypass the hook. */
var nums = docNumbers(byName);
if (nums && nums.length) {
  var real = nums.filter(function (n) { return n.verdict === "FELL" || n.verdict === "rose"; });
  var fell = real.filter(function (n) { return n.verdict === "FELL"; });

  if (real.length) {
    console.log("\n  ⚠ CLAUDE.md states check counts that no longer match the harness:");
    real.forEach(function (n) {
      console.log("    " + n.file + ": doc says " + n.docSays + ", harness says " + n.actual +
                  "  (CLAUDE.md:" + n.line + ", " + n.verdict + ")");
    });
    if (fell.length) {
      console.log("    ⚠ " + fell.map(function (n) { return n.file; }).join(", ") +
                  " FELL — a rising count means the harness grew, a falling one means");
      console.log("      assertions were deleted. Find out which before correcting the line.");
    }
    console.log("    Not a failure — fold the correction into CLAUDE.md by hand. This check");
    console.log("    never edits the doc it checks; one that did could only agree with itself.");
  }

  /* Claims we could not evaluate. Named, because a checker whose blind spots are silent
     is a checker that reports green for the wrong reason. "not run" is the exception and
     is deliberately quiet: under `--staged` most harnesses never ran, and crying wolf
     about them every commit is how a hook gets bypassed. */
  nums.forEach(function (n) {
    if (n.verdict === "unattributed") {
      console.log("\n  ⚠ CLAUDE.md:" + n.line + " claims " + n.docSays + " checks but names no harness.");
      console.log("    Reported rather than dropped — the check must not go quiet by failing to parse.");
    } else if (n.verdict === "no count") {
      console.log("\n  ⚠ CLAUDE.md:" + n.line + " claims " + n.docSays + " checks for " + n.file +
                  ", which prints no count.");
      console.log("    Nothing to compare against, so that line is unverifiable rather than correct.");
    }
  });
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
