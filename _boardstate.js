/* VEILRUN — board state, DERIVED FROM GIT (VR-207, 9/14).
 *
 * WHY THIS EXISTS. On 9/14 VR-189 was built, committed, pushed to `main` and deployed.
 * Its card sat in `🌙 Tonight` until a human noticed, two hours later. Nothing was
 * broken. Nothing moved it either.
 *
 * `branch-steward` (VR-180) moves cards correctly — but only for git steps IT performs.
 * VR-189 went out by hand: harnesses fixed in a chat session, committed, pushed from
 * GitHub Desktop. The agent was never in the loop, so no card moved. Every hand-path
 * has that hole, and hand-paths are not going away.
 *
 * SO STOP ASSERTING CARD STATE AND DERIVE IT. The commit subject convention already
 * carries the number. Git already knows what reached `main` and what is sitting on an
 * unmerged branch. That is the whole input; nothing new has to be recorded, and nothing
 * depends on whoever pushed remembering to do a second thing.
 *
 * THIS ASSERTS NOTHING AND MOVES NOTHING. It is a TOOL, like `_roster.js` — it prints
 * what git says and stops. The agent that moves cards reads this; a reader that also
 * decided would be a reader you could not check. `_board.js` is the harness over it.
 *
 * THE GIT READER IS INJECTABLE, and that is not architecture for its own sake. Today
 * the repo has ZERO unmerged branches, so the rule that matters most — a card whose
 * branch already reached `main` is SHIPPED, not pending review — would have no coverage
 * at all until the first night it mattered. `derive(io)` takes a reader so the harness
 * can hand it a synthetic repo and prove the decision, not the plumbing.
 *
 * THE PARSER IS THE PART THAT CAN BE WRONG, so it is pure and exported. `4f3bbdc` is
 * the reason: its subject ends `(VR-180/181/182)` — three cards, one commit. A naive
 * /VR-\d+/ reads that as one card and silently strands the other two, which is the
 * exact failure class this file exists to end. `VR-97A` is the other one: a letter
 * suffix is a real card number.
 *
 * VR-212 (9/22) — THIS WENT BLIND ON A REAL PR. PR #5 sat open with three cards on
 * `run/2026-09-20-3` and `node _boardstate.js` reported IN REVIEW as zero. The card's own
 * working theory going in was that the branch->card mapping expected the `vr-<number>-<slug>`
 * shape and choked on a dateful batch-branch name — reasonable, since that was the only
 * convention this file had ever seen. IT WAS WRONG. This file never reads a branch's name for
 * card numbers; it only ever reads the commits ON it. The actual bug was one line up the
 * call stack: `subjectsOn(branch + " ^origin/main")` concatenates a revision RANGE into a
 * single string, and `execFileSync` never runs a shell — that string arrives at git as one
 * unparseable ref with a space in it, git rejects it, `git()` catches the throw and returns
 * null, and `derive()`'s `if (subs === null) continue;` skips the branch. Silently, for EVERY
 * branch, regardless of its name. `subjectsInRange(includeRef, excludeRef)` passes the two
 * refs as separate argv elements instead, which is the actual fix.
 *
 * No dependencies. Run: node _boardstate.js [--json]
 */
var cp = require("child_process");

/* A run of card numbers: VR-189, VR-97A, or VR-180/181/182.
   Anchored with no whitespace allowed inside the run, so "(shipped 8/23)" sitting
   later in the same subject can never be swallowed as a continuation. */
var RUN = /VR-(\d+[A-Z]?(?:\/\d+[A-Z]?)*)/g;

/* Parse one commit subject into the card numbers it claims.
   Returns canonical "VR-###" strings, deduped, in order of appearance. */
function cardsInSubject(subject) {
  var out = [], seen = {}, m;
  RUN.lastIndex = 0;
  while ((m = RUN.exec(String(subject))) !== null) {
    var parts = m[1].split("/");
    for (var i = 0; i < parts.length; i++) {
      var id = "VR-" + parts[i];
      if (!seen[id]) { seen[id] = 1; out.push(id); }
    }
  }
  return out;
}

/* Parse many subjects into a deduped, sorted set. */
function cardsInSubjects(subjects) {
  var seen = {};
  for (var i = 0; i < subjects.length; i++) {
    var ids = cardsInSubject(subjects[i]);
    for (var j = 0; j < ids.length; j++) seen[ids[j]] = 1;
  }
  return Object.keys(seen).sort(function (a, b) {
    return (parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10)) || a.localeCompare(b);
  });
}

/* ── git ─────────────────────────────────────────────────────────────────── */

function git(args) {
  try {
    return cp.execFileSync("git", args, {
      cwd: __dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    });
  } catch (e) { return null; }
}

function subjectsOn(ref) {
  var out = git(["log", "--format=%s", ref]);
  return out === null ? null : out.split("\n").filter(Boolean);
}

/* VR-212 fix. `git()` shells out via execFileSync, which never invokes a shell —
   a range built by string-concatenating "<ref> ^<exclude>" into ONE argv element
   is not two revisions, it is one unparseable ref with a space in it, and git
   rejects it. That is not a branch-NAME-shape bug (the card's own working theory
   going in); it reproduces for `vr-###-slug` and `run/<date>` alike, and it
   reproduces for any two refs at all — `includeRef` and `excludeRef` MUST be
   separate argv elements. */
function subjectsInRange(includeRef, excludeRef) {
  var out = git(["log", "--format=%s", includeRef, "^" + excludeRef]);
  return out === null ? null : out.split("\n").filter(Boolean);
}

/* Subject PLUS the short sha and date, oldest last (git log order).
   Used only to annotate a card as it lands in Done — "SHIPPED 9/14 (79f811e)" is the
   convention the board already uses, and a reconciler that moved cards without it would
   make Done less informative than the hand-written entries it is replacing. */
function commitsOn(ref) {
  var out = git(["log", "--format=%h\u0001%ad\u0001%s", "--date=short", ref]);
  if (out === null) return null;
  return out.split("\n").filter(Boolean).map(function (line) {
    var f = line.split("\u0001");
    return { sha: f[0], date: f[1], subject: f.slice(2).join("\u0001") };
  });
}

/* Remote branches that have NOT been merged into origin/main.
   A branch whose work is already on main is not "in review" — it is shipped. */
function unmergedRemoteBranches() {
  var out = git(["branch", "-r", "--no-merged", "origin/main", "--format=%(refname:short)"]);
  if (out === null) return [];
  return out.split("\n").map(function (s) { return s.trim(); }).filter(function (b) {
    return b && b !== "origin/main" && b.indexOf("origin/HEAD") !== 0;
  });
}

/* The real reader. Swapped out wholesale by the harness. */
function gitIO() {
  return { subjectsOn: subjectsOn, subjectsInRange: subjectsInRange,
           unmergedBranches: unmergedRemoteBranches, commitsOn: commitsOn };
}

function derive(io) {
  io = io || gitIO();
  var mainSubjects = io.subjectsOn("origin/main");
  if (mainSubjects === null) {
    return { ok: false, reason: "NO_ORIGIN_MAIN", shipped: [], inReview: [], branches: {} };
  }

  var shipped = cardsInSubjects(mainSubjects);
  var shippedSet = {};
  for (var i = 0; i < shipped.length; i++) shippedSet[shipped[i]] = 1;

  var branches = {}, reviewSeen = {};
  var brs = io.unmergedBranches();
  for (var b = 0; b < brs.length; b++) {
    var subs = io.subjectsInRange(brs[b], "origin/main");
    if (subs === null) continue;
    var ids = cardsInSubjects(subs).filter(function (id) { return !shippedSet[id]; });
    if (ids.length) {
      branches[brs[b]] = ids;
      for (var k = 0; k < ids.length; k++) reviewSeen[ids[k]] = 1;
    }
  }

  /* Which commit shipped each card. The EARLIEST one wins: a card mentioned again in a
     later merge or follow-up was shipped when it first landed, not when it was last
     touched, and a Done entry dated by the follow-up would misreport its own history. */
  var shippedBy = {};
  var log = io.commitsOn ? io.commitsOn("origin/main") : null;
  if (log) {
    for (var c = log.length - 1; c >= 0; c--) {
      var ids = cardsInSubject(log[c].subject);
      for (var q = 0; q < ids.length; q++) {
        if (!shippedBy[ids[q]]) {
          shippedBy[ids[q]] = { sha: log[c].sha, date: log[c].date, subject: log[c].subject };
        }
      }
    }
  }

  return {
    ok: true,
    shipped: shipped,
    inReview: Object.keys(reviewSeen).sort(),
    branches: branches,
    shippedBy: shippedBy
  };
}

module.exports = {
  cardsInSubject: cardsInSubject,
  cardsInSubjects: cardsInSubjects,
  subjectsInRange: subjectsInRange,
  derive: derive
};

if (require.main === module) {
  var state = derive();
  if (process.argv.indexOf("--json") !== -1) {
    process.stdout.write(JSON.stringify(state, null, 2) + "\n");
  } else if (!state.ok) {
    console.log("BOARDSTATE " + state.reason + " — cannot derive without origin/main.");
    process.exit(1);
  } else {
    console.log("SHIPPED (on origin/main), " + state.shipped.length + ":");
    console.log("  " + state.shipped.join(" "));
    console.log("IN REVIEW (pushed, unmerged), " + state.inReview.length + ":");
    if (!state.inReview.length) console.log("  (none)");
    Object.keys(state.branches).forEach(function (b) {
      console.log("  " + b + " → " + state.branches[b].join(" "));
    });
  }
}
