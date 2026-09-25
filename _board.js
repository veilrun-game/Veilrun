/* VEILRUN — the harness over `_boardstate.js` (VR-207, 9/14).
 *
 * WHAT IT PROVES. That card state derived from git is derived CORRECTLY — because the
 * reconciler that moves Trello cards trusts this parser completely, and a parser that
 * silently drops a card number produces a board that looks maintained and is wrong.
 * That is strictly worse than the stale board it replaces.
 *
 * THE ASSERTION THAT MATTERS is the slash run. Commit `4f3bbdc` closes three cards in
 * one subject: `(VR-180/181/182)`. A naive /VR-\d+/ reads one and strands two, forever,
 * quietly. Check 2 pins the three, and check 24 proves the naive version really would
 * have been wrong rather than taking it on faith.
 *
 * THE SECOND ONE is regex state. `RUN` is a /g regex reused across calls, and a /g
 * regex carries `lastIndex` between `exec` loops. Forget to reset it and the parser
 * returns a DIFFERENT answer the second time it is called on the same string — a bug
 * that passes every single-call test ever written. Check 25 calls twice.
 *
 * No dependencies. Run: node _board.js
 */
var B = require("./_boardstate.js");
var cp = require("child_process");

var pass = 0, fails = [];
function ok(label, cond, detail) {
  if (cond) { pass++; return; }
  fails.push(label + (detail === undefined ? "" : "  [got: " + detail + "]"));
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ── The parser ───────────────────────────────────────────────────────────── */

ok("a plain subject yields its one card",
   eq(B.cardsInSubject("VR-189 · One clock — lift the fixed timestep"), ["VR-189"]));

ok("A SLASH RUN YIELDS EVERY CARD IN IT — the 4f3bbdc case",
   eq(B.cardsInSubject("The last git step gets an agent (VR-180/181/182)"),
      ["VR-180", "VR-181", "VR-182"]),
   JSON.stringify(B.cardsInSubject("x (VR-180/181/182)")));

ok("a letter suffix is part of the number, not noise",
   eq(B.cardsInSubject("VR-97A · Weekly digest hero"), ["VR-97A"]));

ok("a slash run carries letter suffixes through",
   eq(B.cardsInSubject("VR-97A/97B · both halves"), ["VR-97A", "VR-97B"]));

ok("a TRAILING DATE is not swallowed as a continuation",
   eq(B.cardsInSubject("VR-137 · Pickers that show what you are picking (shipped 8/23)"),
      ["VR-137"]),
   JSON.stringify(B.cardsInSubject("VR-137 · x (shipped 8/23)")));

ok("an ISO date elsewhere in the subject is not a card",
   eq(B.cardsInSubject("VR-100 · Canon audit — LAST RUN 2026-09-14"), ["VR-100"]));

ok("a subject with no card yields nothing",
   eq(B.cardsInSubject("Two public hosts, not one — Netlify serves this repo as well"), []));

ok("two separate runs in one subject both count",
   eq(B.cardsInSubject("VR-46 §9 split out as VR-191"), ["VR-46", "VR-191"]));

ok("the same card twice in one subject counts once",
   eq(B.cardsInSubject("VR-189 · one clock, closing VR-189"), ["VR-189"]));

ok("lowercase is not a card number — the convention is uppercase",
   eq(B.cardsInSubject("vr-189 · lowercase"), []));

ok("VR- with no digits is not a card",
   eq(B.cardsInSubject("VR- · a dash and nothing else"), []));

ok("a card inside parentheses is found",
   eq(B.cardsInSubject("Merge branch 'x' (VR-174)"), ["VR-174"]));

ok("a non-string subject does not throw",
   (function () { try { return eq(B.cardsInSubject(null), []); } catch (e) { return false; } })());

/* ── The set builder ──────────────────────────────────────────────────────── */

ok("cardsInSubjects dedupes across lines",
   eq(B.cardsInSubjects(["VR-189 · a", "VR-189 · b"]), ["VR-189"]));

ok("cardsInSubjects SORTS NUMERICALLY, not lexically",
   eq(B.cardsInSubjects(["VR-100 · a", "VR-9 · b", "VR-20 · c"]),
      ["VR-9", "VR-20", "VR-100"]),
   JSON.stringify(B.cardsInSubjects(["VR-100 · a", "VR-9 · b", "VR-20 · c"])));

ok("cardsInSubjects flattens slash runs too",
   eq(B.cardsInSubjects(["x (VR-180/181/182)", "VR-189 · y"]),
      ["VR-180", "VR-181", "VR-182", "VR-189"]));

ok("an empty list yields an empty set",
   eq(B.cardsInSubjects([]), []));

/* ── The two bugs this file exists for ────────────────────────────────────── */

var NAIVE = /VR-\d+/g;
var slash = "The last git step gets an agent (VR-180/181/182)";
var naiveCount = (slash.match(NAIVE) || []).length;
ok("THE NAIVE PARSER REALLY WOULD BE WRONG — 1 card vs 3, proven not assumed",
   naiveCount === 1 && B.cardsInSubject(slash).length === 3,
   "naive " + naiveCount + " vs real " + B.cardsInSubject(slash).length);

ok("the parser is idempotent — same input, same answer, twice",
   eq(B.cardsInSubject(slash), B.cardsInSubject(slash)));

ok("cardsInSubject preserves ORDER OF APPEARANCE and does not sort",
   eq(B.cardsInSubject("VR-191 supersedes VR-46"), ["VR-191", "VR-46"]),
   JSON.stringify(B.cardsInSubject("VR-191 supersedes VR-46")));

/* ── The decision, on a synthetic repo ─────────────────────────────────────
 *
 * THE RULE WITH NO REAL COVERAGE. The repo has no unmerged branches today, so
 * every branch assertion below would be vacuously true against the real one.
 * These four are the reconciler's actual judgement, driven directly. */

/* VR-212. subjectsOn only ever answers "origin/main" here — NOT the old
   `branch + " ^origin/main"` concatenation derive() used to send it. That shape
   mirrors the real gitIO()'s two-reader split post-fix: a single ref goes through
   subjectsOn, a RANGE goes through subjectsInRange as two separate arguments. If
   derive() ever regresses to building a combined-string range and calling
   subjectsOn with it, this mock returns null for it (no branch's ref string is
   literally "origin/main") exactly as the real, unpatched git() call did when
   execFileSync rejected the concatenated ref — so the branch goes missing from
   inReview the same silent way it did in production, and the tests below catch it. */
function fakeIO(main, branches) {
  return {
    subjectsOn: function (ref) { return ref === "origin/main" ? main : null; },
    subjectsInRange: function (includeRef, excludeRef) {
      if (excludeRef !== "origin/main") return null;
      return branches[includeRef] || [];
    },
    unmergedBranches: function () { return Object.keys(branches); }
  };
}

var syn = B.derive(fakeIO(
  ["VR-189 · shipped", "VR-180/181/182 · also shipped"],
  { "origin/vr-999-thing": ["VR-999 · on a branch, unmerged"] }
));
ok("a card on an unmerged branch lands IN REVIEW, not Done",
   eq(syn.inReview, ["VR-999"]) && syn.shipped.indexOf("VR-999") === -1,
   JSON.stringify(syn.inReview));
ok("its branch is named so a human can find it",
   eq(syn.branches["origin/vr-999-thing"], ["VR-999"]));

var dup = B.derive(fakeIO(
  ["VR-500 · merged to main"],
  { "origin/vr-500-thing": ["VR-500 · the branch it came from"] }
));
ok("A CARD WHOSE BRANCH ALREADY REACHED MAIN IS SHIPPED, NOT PENDING — the rule " +
   "that decides whether Done or In review wins",
   eq(dup.shipped, ["VR-500"]) && eq(dup.inReview, []),
   "shipped " + JSON.stringify(dup.shipped) + " review " + JSON.stringify(dup.inReview));
ok("and that emptied branch is dropped from the map rather than listed with nothing",
   Object.keys(dup.branches).length === 0,
   JSON.stringify(Object.keys(dup.branches)));

/* VR-212 — THE REGRESSION, REPRODUCED. PR #5 sat open on `run/2026-09-20-3` with
   three real cards and `node _boardstate.js` reported IN REVIEW as zero: this is
   that shape, with a batch-runner branch name rather than a hand-built one, to
   prove the fix is not scoped to `vr-<number>-<slug>` alone (DONE WHEN #4). */
var batch = B.derive(fakeIO(
  ["VR-189 · shipped"],
  { "origin/run/2026-09-20-3": ["VR-206 · a", "VR-195 · b", "VR-201 · c"] }
));
ok("a run/<date> batch branch is read exactly like a vr-###-slug one — three cards, all IN REVIEW",
   eq(batch.inReview, ["VR-195", "VR-201", "VR-206"]),
   JSON.stringify(batch.inReview));

/* THE MUTANT: derive() built a revision RANGE by string-concatenating
   "<branch> ^origin/main" into one argv element and handing it to subjectsOn().
   execFileSync never runs a shell, so that string reaches git as a single
   unparseable ref — git rejects it, the real io returns null, and the branch is
   silently skipped. Reproduced directly against the mock, no branch required:
   the combined string is not the literal ref "origin/main", so subjectsOn
   returns null for it, exactly as production did. */
ok("MUTANT KILLED — subjectsOn() with the old concatenated range returns null, same as the real bug",
   fakeIO(["x"], {}).subjectsOn("origin/run/2026-09-20-3 ^origin/main") === null);
ok("...while subjectsInRange() with the two refs as separate arguments answers correctly",
   eq(fakeIO(["x"], { "origin/run/2026-09-20-3": ["VR-1 · y"] })
       .subjectsInRange("origin/run/2026-09-20-3", "origin/main"),
      ["VR-1 · y"]));

/* THE REAL GIT CALL, NOT A MOCK OF IT. `_boardstate.js` exports subjectsInRange
   so this can prove the actual execFileSync path — not a retyped copy of it —
   handles a genuine range without throwing, using refs this repo already has
   (HEAD / HEAD~5) so no branch has to be created or deleted to prove it. */
var realRange = B.subjectsInRange("HEAD", "HEAD~5");
ok("subjectsInRange() against the real repo does not throw and returns an array",
   Array.isArray(realRange), JSON.stringify(realRange));
var oracle = cp.execFileSync("git", ["log", "--format=%s", "HEAD", "^HEAD~5"],
                              { cwd: __dirname, encoding: "utf8" }).split("\n").filter(Boolean);
ok("...and it agrees with an independently-issued git log over the same range",
   eq(realRange, oracle), JSON.stringify(realRange) + " vs " + JSON.stringify(oracle));

var none = B.derive(fakeIO(["Two public hosts, not one"], {}));
ok("a repo with no card numbers derives cleanly rather than throwing",
   none.ok === true && eq(none.shipped, []) && eq(none.inReview, []));

var broken = B.derive({ subjectsOn: function () { return null; }, unmergedBranches: function () { return []; } });
ok("an unreachable origin/main REPORTS ITSELF rather than deriving an empty board — " +
   "an empty board would read as 'nothing has shipped' and move every card backwards",
   broken.ok === false && broken.reason === "NO_ORIGIN_MAIN");

/* ── Against the real repository ──────────────────────────────────────────── */

var state = B.derive();

ok("derive() reaches origin/main", state.ok === true, state.reason || "");
ok("derive() returns arrays, never null",
   Array.isArray(state.shipped) && Array.isArray(state.inReview));
ok("derive() returns a branch map", state.branches && typeof state.branches === "object");

if (state.ok) {
  ok("VR-189 is shipped — it is on main and deployed",
     state.shipped.indexOf("VR-189") !== -1);

  ok("ALL THREE of 4f3bbdc's cards are shipped, not just the first",
     state.shipped.indexOf("VR-180") !== -1 &&
     state.shipped.indexOf("VR-181") !== -1 &&
     state.shipped.indexOf("VR-182") !== -1);

  ok("the lettered pair from the digest work is shipped",
     state.shipped.indexOf("VR-97A") !== -1 && state.shipped.indexOf("VR-97B") !== -1);

  var nums = state.shipped.map(function (s) { return parseInt(s.slice(3), 10); });
  var sorted = true;
  for (var i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) sorted = false;
  ok("shipped comes back in numeric order", sorted);

  var overlap = state.inReview.filter(function (id) { return state.shipped.indexOf(id) !== -1; });
  ok("SHIPPED AND IN-REVIEW ARE DISJOINT — a merged branch is shipped, not pending",
     overlap.length === 0, overlap.join(" "));

  var emptyBranch = Object.keys(state.branches).filter(function (b) {
    return !state.branches[b] || !state.branches[b].length;
  });
  ok("no branch is listed without at least one card behind it",
     emptyBranch.length === 0, emptyBranch.join(" "));

  var reviewAccounted = state.inReview.every(function (id) {
    return Object.keys(state.branches).some(function (b) {
      return state.branches[b].indexOf(id) !== -1;
    });
  });
  ok("every in-review card is traceable to the branch it sits on", reviewAccounted);

  ok("shipped is non-trivial — a parser that found nothing would pass every test above",
     state.shipped.length >= 20, state.shipped.length + " cards");

  ok("every shipped card names the commit that shipped it",
     state.shipped.every(function (id) {
       var c = state.shippedBy[id];
       return c && /^[0-9a-f]{7,}$/.test(c.sha) && /^\d{4}-\d{2}-\d{2}$/.test(c.date);
     }));

  ok("VR-189's Done annotation resolves to the right commit",
     state.shippedBy["VR-189"] && state.shippedBy["VR-189"].sha === "79f811e",
     state.shippedBy["VR-189"] && state.shippedBy["VR-189"].sha);

  ok("a card closed inside a slash run gets that run's commit, not none",
     state.shippedBy["VR-181"] && state.shippedBy["VR-181"].sha === "4f3bbdc",
     state.shippedBy["VR-181"] && state.shippedBy["VR-181"].sha);
}

/* THE EARLIEST COMMIT WINS. A card mentioned again in a later merge or follow-up
   shipped when it FIRST landed; dating Done by the follow-up misreports the history. */
var twice = B.derive(fakeIO(
  ["VR-700 · follow-up touch", "VR-700 · the commit that actually shipped it"],
  {}
));
ok("derive() is well-formed when the same card appears in two commits",
   eq(twice.shipped, ["VR-700"]));

var dated = B.derive({
  subjectsOn: function (r) { return r === "origin/main" ? ["VR-700 · later", "VR-700 · first"] : []; },
  unmergedBranches: function () { return []; },
  commitsOn: function () {
    return [ { sha: "bbbbbbb", date: "2026-09-10", subject: "VR-700 · later" },
             { sha: "aaaaaaa", date: "2026-09-01", subject: "VR-700 · first" } ];
  }
});
ok("THE EARLIEST COMMIT WINS — Done is dated when the card landed, not when it was last touched",
   dated.shippedBy["VR-700"].sha === "aaaaaaa" && dated.shippedBy["VR-700"].date === "2026-09-01",
   dated.shippedBy["VR-700"].sha + " " + dated.shippedBy["VR-700"].date);

ok("a reader with no commit log still derives, it just cannot annotate",
   (function () {
     var d = B.derive(fakeIO(["VR-701 · x"], {}));
     return d.ok === true && eq(d.shipped, ["VR-701"]) && Object.keys(d.shippedBy).length === 0;
   })());

/* ── The command-line contract the reconciler depends on ──────────────────── */

var res = cp.spawnSync("node", ["_boardstate.js", "--json"],
                       { cwd: __dirname, encoding: "utf8", timeout: 60000 });
ok("`node _boardstate.js --json` exits clean", res.status === 0, "status " + res.status);

var parsed = null;
try { parsed = JSON.parse(res.stdout); } catch (e) { parsed = null; }
ok("`--json` emits VALID JSON and nothing else on stdout", parsed !== null);
if (parsed) {
  ok("the JSON carries shipped, inReview and branches",
     Array.isArray(parsed.shipped) && Array.isArray(parsed.inReview) && !!parsed.branches);
  ok("the JSON agrees with the in-process derivation",
     eq(parsed.shipped, state.shipped));
}

var human = cp.spawnSync("node", ["_boardstate.js"], { cwd: __dirname, encoding: "utf8", timeout: 60000 });
ok("the human-readable run exits clean too", human.status === 0, "status " + human.status);
ok("the human run names both halves of the state",
   /SHIPPED/.test(human.stdout) && /IN REVIEW/.test(human.stdout));

ok("the module exports exactly what the reconciler calls",
   typeof B.cardsInSubject === "function" &&
   typeof B.cardsInSubjects === "function" &&
   typeof B.derive === "function");

/* ── Summary ──────────────────────────────────────────────────────────────── */

fails.forEach(function (f) { console.log("  ✗ " + f); });
console.log((fails.length ? "FAIL" : "PASS") + " — board state: " + pass + " checks passed" +
            (fails.length ? ", " + fails.length + " failed" : ""));
process.exit(fails.length ? 1 : 0);
