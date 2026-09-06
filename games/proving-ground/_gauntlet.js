/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · GAUNTLET LOOP REFEREE   (VR-148, second half)

   WHAT THIS IS. `_arena.js` is the bar. This is the thing that makes a builder
   walk up to it repeatedly: generate -> judge -> NAMED FAILURES BACK -> repeat,
   capped at three rounds, spend reported.

   ⚠️ THE BUILDER IS AN AGENT, AND THIS FILE IS NOT IT. That separation is the
   whole card. A seeded random generator that retries until it passes is VR-154's
   map randomizer, not a gauntlet loop — the value here is that something READS
   the named failure and adapts, so "cheese failed in the north pocket" changes
   the next layout deliberately rather than statistically. So this file owns the
   round discipline and nothing creative:

     · it writes the brief the builder works from
     · it invokes the judge, exactly as `node _arena.js --judge layout.json`
     · it turns the verdict into the next round's brief, quoting the judge VERBATIM
     · it holds the three-round cap, and refuses a builder that is not adapting
     · it accounts for the spend

   THE SPLIT IS VR-159's, DELIBERATELY. `_ship.js` runs the harnesses because
   that half is deterministic and never needed a language model; `release-steward`
   makes the judgement calls. Same shape here: the referee is a state machine and
   the bar is a sim, so the only thing an agent is trusted with is the half that
   actually needs one. A referee written as an agent would be a third opinion in
   a room that already has too many.

   ⚠️ THREE GUARDS AGAINST THEATRE, and they are the reason this is more than a
   `while` loop. Each one is a way a loop can look like it worked without working:

     1  A RESUBMITTED LAYOUT IS REFUSED. Byte-identical geometry is not an
        adaptation, it is a retry, and a retry against a deterministic judge is
        a guaranteed identical verdict.
     2  FROM ROUND 2, THE BUILDER MUST STATE ITS CHANGE in `_note`, and that note
        must NAME a criterion that actually failed. A generator cannot write
        "widened the north-east doorway because `wedge` named a husk stuck at
        14.2,-9.6"; it can only produce different numbers. This is the cheapest
        available proof that the feedback reached something that reads.
     3  THE JUDGE'S WORDING IS QUOTED, NEVER PARAPHRASED. A referee that
        summarises the failure in its own words has inserted an opinion between
        the bar and the builder, and the bar stops being one the builder cannot
        argue with.

   THE VERDICT IS PARSED FROM THE JUDGE'S PRINTED OUTPUT, on purpose. `--judge`
   is the entry point `_arena.js` documents for exactly this, and adding a
   machine-readable second output would be a second copy of the verdict to keep
   in sync. The parse is strict instead: all six criteria must be present and the
   summary line must agree with the exit code, or this aborts. A misread verdict
   is worse than no verdict, so it is made loud rather than made likely.

   ⚠️ THE BRIEF IS PART OF THE LOOP, AND THE FIRST TWO RUNS PROVED IT. Runs A and B
   both stalled on `shroud` in the forties — 42/46/46 and 46/47/49 — with two
   different builders independently diagnosing the same cause: their cover had no
   depth along the line of sight. Neither could act on it, because the round-1 brief
   told them walls were unavailable until VR-121. That was WRONG. A row of circles
   with gaps is a wall with doorways, it is what `_arena.js`'s own reference arena
   builds, and that reference arena is the thing the judge asserts clears all six at
   70u. Six rounds and half a million tokens went into working around a sentence in
   this file. A loop is only as good as the problem statement it opens with, and a
   brief that forbids the answer is a defect in the loop, not a hard problem.

   RUN ARTIFACTS NEVER LAND IN THE REPO. CLAUDE.md §5 — everything committed here
   is served at a guessable URL. The run directory defaults into the system temp
   dir and this refuses to write one inside the repo even if asked.

   WITH NO ARGUMENTS THIS IS A HARNESS: it self-tests the referee against canned
   verdicts (offline, deterministic, ~1s) and makes one real judge call to prove
   the wiring. It is in `_ship.js`'s discovered set for that reason. Driving an
   actual round costs an agent, so a real run is never something a commit starts.

   Dependency-free. Usage:
     node _gauntlet.js                                   self-test
     node _gauntlet.js --start [--dir D] [--half H] [--rounds N]
     node _gauntlet.js --submit layout.json [--dir D] [--spend '{...}']
     node _gauntlet.js --report [--dir D]
   --------------------------------------------------------------------------- */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");

const HERE = __dirname;
const REPO = path.resolve(HERE, "..", "..");
const JUDGE = path.join(HERE, "_arena.js");
const CRITERIA = ["reach", "wedge", "shroud", "cheese", "blink", "converge"];
const DEFAULT_CAP = 3;

/* ==========================================================================
   0 · ARGUMENTS
   ========================================================================== */
const ARGV = process.argv.slice(2);
function flag(name) { return ARGV.indexOf(name) !== -1; }
function opt(name, dflt) {
  const i = ARGV.indexOf(name);
  return i >= 0 && i + 1 < ARGV.length ? ARGV[i + 1] : dflt;
}

/* ==========================================================================
   1 · RUN STATE
   ========================================================================== */
function stateFile(dir) { return path.join(dir, "run.json"); }

function loadRun(dir) {
  const f = stateFile(dir);
  if (!fs.existsSync(f)) die("no run in " + dir + " — start one with `node _gauntlet.js --start --dir " + dir + "`");
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
function saveRun(dir, run) {
  fs.writeFileSync(stateFile(dir), JSON.stringify(run, null, 2));
}

function die(msg) { console.error("\ngauntlet: " + msg + "\n"); process.exit(2); }

/* A run directory inside the repo would be published (CLAUDE.md §5) and would
   also be picked up by nothing that knows to ignore it. Refused rather than
   gitignored: an ignore rule is a thing you can forget to write. */
function checkDir(dir) {
  const abs = path.resolve(dir);
  if (abs === REPO || abs.startsWith(REPO + path.sep))
    die("refusing to write a run directory inside the repo (" + abs + ").\n" +
        "        Everything in this repo is served publicly — CLAUDE.md §5.\n" +
        "        Leave --dir off and it lands in " + os.tmpdir() + ".");
  return abs;
}

/* ==========================================================================
   2 · THE JUDGE
   The one thing this file is allowed to believe.
   ========================================================================== */
function runJudge(layoutPath) {
  const t0 = Date.now();
  const res = cp.spawnSync("node", [JUDGE, "--judge", layoutPath], { encoding: "utf8", timeout: 300000 });
  const ms = Date.now() - t0;
  if (res.error) die("could not run the judge: " + res.error.message);
  if (res.status === 2)
    die("the judge exited 2 — it lost an anchor in index.html and refuses to judge a stale copy.\n" +
        (res.stderr || "").trim());
  return parseVerdict((res.stdout || "") + (res.stderr || ""), res.status, ms);
}

/* Strict on purpose. Every criterion must be accounted for and the printed
   summary must agree with the exit code; anything else aborts rather than
   guessing. See the header — a misread verdict is the failure mode that would
   make this whole loop a lie. */
function parseVerdict(text, exitCode, ms) {
  const lines = text.split("\n");
  const by = {};
  for (const raw of lines) {
    const m = /^\s{2}(ok|FAIL)\s+(\w+)\s+(.*)$/.exec(raw);
    if (!m) continue;
    if (CRITERIA.indexOf(m[2]) < 0) continue;
    by[m[2]] = { pass: m[1] === "ok", line: m[3].trim() };
  }
  const missing = CRITERIA.filter(k => !by[k]);
  if (missing.length)
    die("could not parse the judge's verdict — no line for: " + missing.join(", ") +
        "\n        The judge's output format changed. Fix the parse in _gauntlet.js;\n" +
        "        do NOT let this loop run on a half-read verdict.\n\n" + text);

  const failed = CRITERIA.filter(k => !by[k].pass);
  const summary = /^(PASS|FAIL)\b/m.exec(text);
  if (!summary) die("the judge printed no PASS/FAIL summary line.\n\n" + text);
  const saidPass = summary[1] === "PASS";
  if (saidPass !== (failed.length === 0))
    die("the judge's summary line and its per-criterion lines disagree.\n\n" + text);
  if (exitCode != null && (exitCode === 0) !== saidPass)
    die("the judge's exit code (" + exitCode + ") disagrees with its summary (" + summary[1] + ").\n\n" + text);

  return { pass: saidPass, failed: failed, by: by, ms: ms, raw: text.trim() };
}

/* ==========================================================================
   3 · READING A LAYOUT, AND WHETHER IT IS A NEW ONE
   ========================================================================== */
function geometryOf(L) {
  /* The identity of a layout is its geometry, not its name or its note. A
     builder that renames the map and resubmits the same stones has not adapted. */
  return JSON.stringify({
    half: L.half == null ? null : +L.half,
    pillars: (L.pillars || []).map(p => [+p.x, +p.z, +p.r, +p.h])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  });
}

/* Pillars are matched to the previous round's by proximity, so a layout that
   nudged four stones reads as "4 moved" rather than "40 removed, 40 added".
   The point is to show the builder — and whoever reads the transcript — the
   SIZE of the adaptation, which is how you tell a considered change from a
   reroll. */
function diffLayouts(prev, next) {
  if (!prev) return { text: "first submission", moved: 0, added: (next.pillars || []).length, removed: 0 };
  const A = (prev.pillars || []).slice(), B = (next.pillars || []).slice();
  const usedB = new Array(B.length).fill(false);
  let moved = 0, same = 0, removed = 0;
  for (const a of A) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < B.length; i++) {
      if (usedB[i]) continue;
      const d = Math.hypot(B[i].x - a.x, B[i].z - a.z);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0 && bd <= 1.5) {
      usedB[best] = true;
      if (bd < 1e-9 && Math.abs(B[best].r - a.r) < 1e-9) same++; else moved++;
    } else removed++;
  }
  const added = usedB.filter(u => !u).length;
  const bits = [];
  if (added) bits.push(added + " added");
  if (removed) bits.push(removed + " removed");
  if (moved) bits.push(moved + " moved");
  if (same) bits.push(same + " unchanged");
  const halfChanged = (prev.half == null ? null : +prev.half) !== (next.half == null ? null : +next.half);
  if (halfChanged) bits.unshift("half " + prev.half + " -> " + next.half);
  return { text: bits.join(", ") || "identical", moved: moved, added: added, removed: removed };
}

/* ==========================================================================
   4 · THE BRIEFS
   Round 1 states the problem. Every later round states the NAMED FAILURE, in
   the judge's words, plus the previous round's line beside the new one so the
   builder can see whether its change helped. That side-by-side is the single
   most useful thing this file produces: "shroud 41% -> 47%, bar 50%" tells a
   builder to push harder in the same direction, where a bare re-statement of
   the failure tells it nothing at all.
   ========================================================================== */
const SCHEMA = [
  "{",
  '  "id":   "kebab-case-id",',
  '  "name": "Human name",',
  '  "half":  35,                       // half-extent; the playable box is 2*half square',
  '  "pillars": [ { "x": 0, "z": 0, "r": 1.2, "h": 4.4 } ],',
  '  "_note": "what you changed this round and which named failure it targets"',
  "}"
].join("\n");

/* The three rules the judge itself discovered while it was being written. They
   are stated here rather than left to be rediscovered because every one of them
   costs a wasted round, and a wasted round out of three is a third of the run. */
const CONSTRAINTS = [
  "1. PILLARS MUST NOT OVERLAP once inflated by the player radius (0.45). The game's",
  "   push-out resolves one pillar at a time, so overlapping cover squeezes a body",
  "   through and leaves it standing inside stone. Keep centre-to-centre distance",
  "   above r1 + r2 + 1.30. (This is also why circles cannot make a solid wall — a",
  "   row of stones with gaps is the only wall the game has until VR-121.)",
  "2. COVER MUST CLEAR THE SEAM BY r + 0.90. A blink clamped into the wall gets",
  "   pushed back out through it by cover sitting too close to the edge.",
  "3. COVER MUST CLEAR THE HUSK SPAWN RING, which runs 0.8u inside the seam on all",
  "   four sides. A stone on the ring is one husks spawn inside, and they deadlock."
].join("\n");

function brief1(run) {
  return [
    "# GAUNTLET — round 1 of " + run.cap,
    "",
    "Build one arena layout for the VEILRUN Proving Ground and write it to the file",
    "named at the end of this brief. It will be judged by `_arena.js`, which you do",
    "not get to argue with, on six criteria:",
    "",
    "  reach     every walkable region is one connected space",
    "  wedge     no husk gets permanently stuck on geometry",
    "  shroud    a line of sight can be broken AND HELD for Shroud's 1.15s window",
    "  cheese    there is no spot a husk can never reach you in",
    "  blink     Veilstep's 5.6u step cannot put you outside the arena",
    "  converge  two players can plausibly find each other",
    "",
    "## The arena",
    "",
    "Half-extent " + run.half + " — a " + (2 * run.half) + "u box, which is VR-151's ruled size for the",
    "1v1 mirror (~8-10s to cross at moveSpeed 7.8). This is deliberately harder than",
    "the 20u maps the game ships: the failure mode of a big stealth map is EMPTY, not",
    "big, and `converge` is what catches that.",
    "",
    "## The vocabulary you have",
    "",
    "Round pillars only — `{x, z, r, h}`. There is no wall primitive; VR-121 has not",
    "landed one.",
    "",
    "⚠️ THAT DOES NOT MEAN YOU CANNOT BUILD WALLS. A ROW of stones, spaced just under",
    "twice their radius apart, is a wall with doorways in it — and it is the strongest",
    "construction this vocabulary has. A lone circle breaks a line of sight only while",
    "player, stone and husk are nearly collinear, and that alignment collapses within a",
    "step as the husk closes; a row has depth along the line, so the next stone picks up",
    "the block as the first one's shadow narrows. If you build a field of isolated",
    "stones you will find `shroud` stalls in the forties however many you add, because",
    "the shape is wrong rather than the count.",
    "",
    "VR-151 has ruled that ROOMS, not a field, are the right shape for an arena this",
    "size. Rooms are buildable today: rows for the dividing walls, gaps in the rows for",
    "the doors, loose cover inside each chamber so the middle of a room is not a",
    "billiard table. You are not limited to that shape — but you are being told it works.",
    "",
    "## Three rules the judge already found, so you do not have to lose a round to them",
    "",
    CONSTRAINTS,
    "",
    "## Useful numbers",
    "",
    "  player radius 0.45 · husk radius 0.42 · husk reach 2.0 · husk speed 3.0",
    "  player speed 7.8 · Shroud needs 1.15s of unseen stillness · Veilstep 5.6u",
    "  two players are considered to have found each other at 12u with line of sight",
    "",
    "## Output",
    "",
    "Write ONLY this JSON object to `" + run.dir + "/round-1.json`:",
    "",
    "```json",
    SCHEMA,
    "```",
    "",
    "`_note` is required from round 2 onward and welcome now. Do not write anything",
    "else to that file — the judge parses it as a layout."
  ].join("\n");
}

function briefN(run, n) {
  const last = run.rounds[run.rounds.length - 1];
  const prev = run.rounds.length > 1 ? run.rounds[run.rounds.length - 2] : null;
  const out = [
    "# GAUNTLET — round " + n + " of " + run.cap,
    "",
    "The judge rejected round " + last.n + ". Its wording, verbatim — this is the bar, not a",
    "suggestion, and it is the same bar next round:",
    ""
  ];

  out.push("## FAILED — " + last.verdict.failed.join(", "));
  out.push("");
  for (const k of last.verdict.failed) {
    out.push("### " + k);
    out.push("  " + last.verdict.by[k].line);
    if (prev && prev.verdict.by[k]) {
      const was = prev.verdict.by[k];
      out.push("  round " + prev.n + " said: " + was.line);
      out.push("  -> " + (was.pass
        ? "⚠️ THIS PASSED IN ROUND " + prev.n + " AND YOU BROKE IT. Whatever you changed traded"
          + "\n     one criterion for another; the bar wants all six at once."
        : "still failing after your last change — read the two lines above against"
          + "\n     each other and decide whether you moved in the right direction at all."));
    }
    out.push("");
  }

  const passing = CRITERIA.filter(k => last.verdict.by[k].pass);
  if (passing.length) {
    out.push("## PASSING — do not break these");
    out.push("");
    for (const k of passing) out.push("  " + k.padEnd(9) + last.verdict.by[k].line);
    out.push("");
  }

  out.push("## Your round " + last.n + " layout");
  out.push("");
  out.push("  " + (last.layout.pillars || []).length + " pillars, half " + (last.layout.half == null ? "default" : last.layout.half) +
           (last.diff ? " (" + last.diff.text + ")" : ""));
  if (last.note) out.push('  you said: "' + last.note + '"');
  out.push("  the file is still at " + run.dir + "/round-" + last.n + ".json — start from it or start over.");
  out.push("");
  out.push("## Three rules that have not changed");
  out.push("");
  out.push(CONSTRAINTS);
  out.push("");
  out.push("## Output");
  out.push("");
  out.push("Write ONLY the layout JSON to `" + run.dir + "/round-" + n + ".json`.");
  out.push("");
  out.push("⚠️ `_note` IS REQUIRED THIS ROUND and it must name at least one of the criteria");
  out.push("above (" + last.verdict.failed.join(", ") + "). The referee refuses a submission");
  out.push("that does not — a change that cannot say which named failure it targets is a");
  out.push("reroll, and a reroll against a deterministic judge is the same verdict again.");
  if (n === run.cap) {
    out.push("");
    out.push("⚠️ THIS IS THE LAST ROUND. There is no round " + (n + 1) + ".");
  }
  return out.join("\n");
}

/* ==========================================================================
   5 · COMMANDS
   ========================================================================== */
function cmdStart() {
  const dir = checkDir(opt("--dir", path.join(os.tmpdir(), "veilrun-gauntlet-" + Date.now())));
  fs.mkdirSync(dir, { recursive: true });
  const run = {
    started: new Date().toISOString(),
    dir: dir,
    cap: +opt("--rounds", DEFAULT_CAP),
    half: +opt("--half", 35),
    status: "open",
    rounds: [],
    judgeMs: 0
  };
  saveRun(dir, run);
  const b = brief1(run);
  fs.writeFileSync(path.join(dir, "brief-1.md"), b);
  console.log("\ngauntlet: round 1 of " + run.cap + " open · " + dir);
  console.log("brief:    " + path.join(dir, "brief-1.md"));
  console.log("submit:   node _gauntlet.js --submit " + dir + "/round-1.json --dir " + dir + "\n");
}

function cmdSubmit() {
  const file = opt("--submit");
  if (!file) die("--submit needs a layout file");
  const dir = checkDir(opt("--dir", path.dirname(path.resolve(file))));
  const run = loadRun(dir);
  if (run.status !== "open") die("this run is already " + run.status + " — nothing more to submit.");
  if (run.rounds.length >= run.cap)
    die("the cap is " + run.cap + " rounds and " + run.rounds.length + " have been judged. The run is over;\n" +
        "        `node _gauntlet.js --report --dir " + dir + "` for the verdict.");

  const n = run.rounds.length + 1;
  let L;
  try { L = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); }
  catch (e) { die("round " + n + " is not valid JSON: " + e.message); }
  if (!Array.isArray(L.pillars)) die("round " + n + " has no `pillars` array.");

  const note = typeof L._note === "string" ? L._note.trim() : "";
  const last = run.rounds.length ? run.rounds[run.rounds.length - 1] : null;

  /* Guard 1 — a resubmission is not an adaptation. */
  const geo = geometryOf(L);
  for (const r of run.rounds) {
    if (r.geo === geo)
      die("round " + n + " is geometrically identical to round " + r.n + ".\n" +
          "        The judge is deterministic, so this would produce the same verdict.\n" +
          "        A retry is not an adaptation — change the layout or stop the run.");
  }

  /* Guard 2 — from round 2 the builder must say what it changed, and name a
     criterion that actually failed. This is the check that separates a loop
     from a lottery, so it aborts rather than warns. */
  if (n > 1) {
    if (note.length < 12)
      die("round " + n + " has no `_note`. From round 2 the builder must state what it\n" +
          "        changed and which named failure it targets.");
    const named = last.verdict.failed.filter(k => new RegExp("\\b" + k + "\\b", "i").test(note));
    if (!named.length)
      die("round " + n + "'s `_note` does not name any criterion that failed:\n" +
          "          failed:  " + last.verdict.failed.join(", ") + "\n" +
          '          note:    "' + note + '"\n' +
          "        The feedback has to reach something that reads it. Name the criterion.");
  }

  const judgeFile = path.join(dir, "round-" + n + ".json");
  if (path.resolve(file) !== judgeFile) fs.copyFileSync(path.resolve(file), judgeFile);

  console.log("\ngauntlet: judging round " + n + " of " + run.cap + " ...");
  const v = runJudge(judgeFile);
  const diff = diffLayouts(last ? last.layout : null, L);

  run.rounds.push({
    n: n, layout: L, note: note, geo: geo, diff: diff,
    verdict: { pass: v.pass, failed: v.failed, by: v.by, ms: v.ms },
    spend: parseSpend(opt("--spend", null)),
    at: new Date().toISOString()
  });
  run.judgeMs += v.ms;

  console.log(v.raw.split("\n").map(l => l).join("\n"));

  if (v.pass) {
    run.status = "passed";
    saveRun(dir, run);
    console.log("\ngauntlet: PASSED on round " + n + " of " + run.cap + ".");
    console.log("report:   node _gauntlet.js --report --dir " + dir + "\n");
    return;
  }
  if (n >= run.cap) {
    run.status = "exhausted";
    saveRun(dir, run);
    console.log("\ngauntlet: round " + n + " failed and the cap is " + run.cap + ". The run is over unpassed —");
    console.log("          which is a result, not an error. `--report` for the whole run.\n");
    return;
  }
  const nb = briefN(run, n + 1);
  fs.writeFileSync(path.join(dir, "brief-" + (n + 1) + ".md"), nb);
  saveRun(dir, run);
  console.log("\ngauntlet: round " + n + " failed on " + v.failed.join(", ") + ".");
  console.log("brief:    " + path.join(dir, "brief-" + (n + 1) + ".md"));
  console.log("submit:   node _gauntlet.js --submit " + dir + "/round-" + (n + 1) + ".json --dir " + dir + "\n");
}

/* Spend is REPORTED, not measured here — this file cannot see the builder's
   token meter, and inventing a number would be worse than carrying the one the
   builder's own runtime prints. Passed in per round as JSON; anything absent is
   shown as unknown rather than as zero. Zero is a claim. */
function parseSpend(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { die("--spend is not valid JSON: " + e.message); }
}

function cmdReport() {
  const dir = checkDir(opt("--dir"));
  const run = loadRun(dir);
  const W = 70;
  console.log("\nVEILRUN · Proving Ground — GAUNTLET RUN (VR-148)\n" + "=".repeat(W));
  console.log("started   " + run.started);
  console.log("arena     half " + run.half + " (" + (2 * run.half) + "u box)");
  console.log("cap       " + run.cap + " rounds · used " + run.rounds.length);
  console.log("status    " + run.status.toUpperCase());
  console.log("dir       " + run.dir);

  for (const r of run.rounds) {
    console.log("\n" + "-".repeat(W));
    console.log("ROUND " + r.n + " — " + (r.verdict.pass ? "PASS" : "FAIL: " + r.verdict.failed.join(", ")));
    console.log("  layout   " + (r.layout.pillars || []).length + " pillars, half " +
                (r.layout.half == null ? "default" : r.layout.half) + " · " + r.diff.text);
    if (r.note) console.log("  builder  " + wrap(r.note, W - 11, "           "));
    for (const k of CRITERIA)
      console.log("  " + (r.verdict.by[k].pass ? "ok   " : "FAIL ") + k.padEnd(9) + r.verdict.by[k].line);
  }

  /* The adaptation trail — what the loop is actually for. Reading it should make
     it obvious whether the builder responded to the judge or just rolled again. */
  if (run.rounds.length > 1) {
    console.log("\n" + "-".repeat(W));
    console.log("DID THE BUILDER ADAPT?");
    for (let i = 1; i < run.rounds.length; i++) {
      const a = run.rounds[i - 1], b = run.rounds[i];
      console.log("\n  round " + a.n + " -> " + b.n + ": " + b.diff.text);
      for (const k of CRITERIA) {
        const wasP = a.verdict.by[k].pass, isP = b.verdict.by[k].pass;
        if (wasP && isP) continue;
        const tag = !wasP && isP ? "FIXED  " : wasP && !isP ? "BROKE  " : "still  ";
        console.log("    " + tag + k);
        console.log("      was: " + a.verdict.by[k].line);
        console.log("      now: " + b.verdict.by[k].line);
      }
    }
  }

  console.log("\n" + "-".repeat(W));
  console.log("SPEND");
  let tok = 0, usd = 0, known = 0, turns = 0, wall = 0;
  for (const r of run.rounds) {
    const s = r.spend;
    if (!s) { console.log("  round " + r.n + "   builder: not reported"); continue; }
    known++;
    /* `tok` is a total where a runtime only reports one; in/out where it splits
       them. Summed the same either way, and never inferred from the other. */
    tok += (+s.tok || 0) + (+s.in || 0) + (+s.out || 0);
    usd += +s.usd || 0; turns += +s.turns || 0; wall += +s.wall_s || 0;
    console.log("  round " + r.n + "   builder: " +
      [s.model ? s.model : null,
       (s.in != null || s.out != null) ? ((s.in || 0) + " in / " + (s.out || 0) + " out tok")
         : s.tok != null ? (+s.tok).toLocaleString("en-US") + " tok" : null,
       s.turns != null ? s.turns + " turns" : null,
       s.wall_s != null ? s.wall_s + "s" : null,
       s.usd != null ? "$" + (+s.usd).toFixed(4) : null].filter(Boolean).join(" · "));
  }
  if (known < run.rounds.length)
    console.log("  ⚠️ " + (run.rounds.length - known) + " round(s) reported no builder spend — counted as unknown, not as zero");
  console.log("  builder   " + (known ? tok.toLocaleString("en-US") + " tok · " + turns + " turns · " +
              wall.toFixed(0) + "s" + (usd ? " · $" + usd.toFixed(4) : "") : "not reported"));
  console.log("  judge     " + run.rounds.length + " invocations · " + (run.judgeMs / 1000).toFixed(1) + "s CPU · $0");
  console.log("\n" + "=".repeat(W));
  console.log(run.status === "passed"
    ? "PASSED on round " + run.rounds.length + " of " + run.cap
    : run.status === "exhausted"
      ? "UNPASSED after " + run.cap + " rounds — the bar held"
      : "OPEN — round " + (run.rounds.length + 1) + " has not been submitted");
  console.log("");
}

function wrap(s, w, pad) {
  const words = s.split(/\s+/), out = []; let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > w) { out.push(line); line = word; }
    else line = line ? line + " " + word : word;
  }
  if (line) out.push(line);
  return out.join("\n" + pad);
}

/* ==========================================================================
   6 · SELF-TEST — the referee's own bar
   `_arena.js` refuses to be a judge that never rejects anything; the same rule
   applies to a referee. Everything below runs offline against canned verdicts
   except one live judge call, which is there to prove the parse is reading the
   real format rather than a fixture that agrees with it.
   ========================================================================== */
let fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}
function throws(fn) {
  const realExit = process.exit, realErr = console.error;
  let exited = null, msg = "";
  process.exit = function (c) { exited = c; throw new Error("__exit__"); };
  console.error = function (s) { msg += s + "\n"; };
  try { fn(); } catch (e) { if (e.message !== "__exit__") { msg += e.message; exited = exited == null ? -1 : exited; } }
  process.exit = realExit; console.error = realErr;
  return { exited: exited, msg: msg };
}

function fakeJudgeText(failing, stats) {
  const lines = [""];
  lines.push("fixture — 3 pillars, half 35");
  for (const k of CRITERIA)
    lines.push("  " + (failing.indexOf(k) < 0 ? "ok   " : "FAIL ") + k.padEnd(9) + (stats[k] || "line for " + k));
  lines.push("");
  lines.push(failing.length ? "FAIL — " + failing.join(", ") : "PASS");
  return lines.join("\n");
}

function selfTest() {
  console.log("\nVEILRUN · Proving Ground — GAUNTLET LOOP REFEREE (VR-148)\n" + "=".repeat(70));

  console.log("\n[the verdict parse — strict, or the whole loop runs on a misread]");
  {
    const v = parseVerdict(fakeJudgeText(["shroud", "converge"], {}), 1, 5);
    ok("a failing verdict is read", !v.pass && v.failed.join(",") === "shroud,converge", v.failed.join(", "));
    const p = parseVerdict(fakeJudgeText([], {}), 0, 5);
    ok("a passing verdict is read", p.pass && p.failed.length === 0);
  }
  {
    const t = fakeJudgeText(["shroud"], {}).replace(/^\s{2}(ok|FAIL)\s+cheese.*$/m, "  cheese: fine");
    const r = throws(() => parseVerdict(t, 1, 5));
    ok("a missing criterion aborts rather than being assumed passed",
       r.exited === 2 && /no line for: cheese/.test(r.msg));
  }
  {
    /* The nastiest realistic drift: the summary line and the per-criterion lines
       disagree. A referee that trusted either alone would report a green run. */
    const t = fakeJudgeText(["shroud"], {}).replace(/^FAIL.*$/m, "PASS");
    const r = throws(() => parseVerdict(t, 1, 5));
    ok("summary disagreeing with the criterion lines aborts", r.exited === 2 && /disagree/.test(r.msg));
  }
  {
    const r = throws(() => parseVerdict(fakeJudgeText(["shroud"], {}), 0, 5));
    ok("an exit code disagreeing with the verdict aborts", r.exited === 2 && /exit code/.test(r.msg));
  }

  console.log("\n[the feedback brief — the judge's words, not the referee's]");
  const line1 = "only 41% of engagements offer a line you can break and HOLD for Shroud's 1.15s (needs 50%)";
  const line2 = "only 47% of engagements offer a line you can break and HOLD for Shroud's 1.15s (needs 50%)";
  const run = {
    dir: "/tmp/x", cap: 3, half: 35, rounds: [
      { n: 1, layout: { half: 35, pillars: [{ x: 0, z: 0, r: 1, h: 4 }] }, note: "", diff: { text: "first submission" },
        verdict: parseVerdict(fakeJudgeText(["shroud"], { shroud: line1 }), 1, 1) }
    ]
  };
  {
    const b = briefN(run, 2);
    ok("the brief quotes the judge verbatim", b.indexOf(line1) >= 0);
    ok("the brief names the failed criterion as the ask", /must name at least one of the criteria/.test(b) && /\(shroud\)/.test(b));
    ok("the brief lists what passed, so it is not traded away", /## PASSING/.test(b) && /reach/.test(b));
    ok("the brief does not paraphrase the failure", b.indexOf("needs more cover") < 0);
  }
  {
    run.rounds.push({ n: 2, layout: { half: 35, pillars: [] }, note: "widened cover for shroud", diff: { text: "6 added" },
                      verdict: parseVerdict(fakeJudgeText(["shroud"], { shroud: line2 }), 1, 1) });
    const b = briefN(run, 3);
    ok("round 3's brief shows the previous round's line beside the new one",
       b.indexOf(line1) >= 0 && b.indexOf(line2) >= 0);
    ok("it says the last round is the last round", /THIS IS THE LAST ROUND/.test(b));
  }
  {
    /* A criterion traded away is the failure mode a bare "what failed" list hides. */
    const r2 = { dir: "/tmp/x", cap: 3, half: 35, rounds: [
      { n: 1, layout: { pillars: [] }, note: "", diff: { text: "x" },
        verdict: parseVerdict(fakeJudgeText(["shroud"], {}), 1, 1) },
      { n: 2, layout: { pillars: [] }, note: "", diff: { text: "y" },
        verdict: parseVerdict(fakeJudgeText(["reach"], {}), 1, 1) }
    ] };
    ok("breaking a criterion that used to pass is called out, not buried",
       /YOU BROKE IT/.test(briefN(r2, 3)));
  }

  console.log("\n[the three guards against a loop that is theatre]");
  {
    const a = { half: 35, pillars: [{ x: 1, z: 2, r: 1, h: 4 }, { x: 3, z: 4, r: 1, h: 4 }] };
    const b = { id: "renamed", name: "Different name", half: 35, _note: "totally new",
                pillars: [{ x: 3, z: 4, r: 1, h: 4 }, { x: 1, z: 2, r: 1, h: 4 }] };
    ok("a reordered, renamed resubmission is recognised as the same geometry",
       geometryOf(a) === geometryOf(b));
    const c = { half: 35, pillars: [{ x: 1, z: 2.1, r: 1, h: 4 }, { x: 3, z: 4, r: 1, h: 4 }] };
    ok("a genuinely moved stone is not", geometryOf(a) !== geometryOf(c));
  }
  {
    const failed = ["shroud", "cheese"];
    const names = note => failed.filter(k => new RegExp("\\b" + k + "\\b", "i").test(note));
    ok("a note naming the failure is accepted",
       names("pulled four stones inward to raise shroud viability").length === 1);
    ok("a note that names nothing is refused", names("tried something else").length === 0);
    ok("the match is on the criterion, not on any word", names("cheesecake").length === 0,
       "word-boundary matching");
  }
  {
    const d = diffLayouts({ pillars: [{ x: 0, z: 0, r: 1, h: 4 }, { x: 5, z: 5, r: 1, h: 4 }] },
                          { pillars: [{ x: 0.4, z: 0, r: 1, h: 4 }, { x: 5, z: 5, r: 1, h: 4 }, { x: -5, z: 5, r: 1, h: 4 }] });
    ok("a nudge reads as a move, not as a delete and an add",
       d.moved === 1 && d.added === 1 && d.removed === 0, d.text);
  }
  {
    const r = throws(() => checkDir(path.join(REPO, "gauntlet-run")));
    ok("a run directory inside the repo is refused (CLAUDE.md §5)",
       r.exited === 2 && /served publicly/.test(r.msg));
    let threw = false;
    try { checkDir(path.join(os.tmpdir(), "veilrun-gauntlet-selftest")); } catch (e) { threw = true; }
    ok("a run directory in the system temp dir is allowed", !threw);
  }

  console.log("\n[the wiring — one real judge call, so the parse is not a fixture agreeing with itself]");
  {
    const tmp = path.join(os.tmpdir(), "veilrun-gauntlet-selftest-" + process.pid + ".json");
    fs.writeFileSync(tmp, JSON.stringify({
      id: "selftest-open", name: "Self-test",
      pillars: [{ x: -6.8, z: -6.8, r: 0.7, h: 3.2 }, { x: 6.8, z: 6.8, r: 0.7, h: 3.2 }]
    }));
    const v = runJudge(tmp);
    fs.unlinkSync(tmp);
    /* Open Ground is the game's control map — "almost no cover, nowhere to hide" —
       so the live call is expected to come back rejecting `shroud`. Asserting a
       REJECTION rather than a pass is deliberate: it proves the loop can actually
       receive a named failure, which is the only thing it exists to carry. */
    ok("the judge really runs and its six criteria really parse",
       Object.keys(v.by).length === 6, v.ms + "ms");
    ok("a coverless layout comes back rejected on `shroud`, named",
       !v.pass && v.failed.indexOf("shroud") >= 0, v.by.shroud.line);
  }

  console.log("\n" + "=".repeat(70));
  console.log(fails === 0 ? "PASS — " + checks + " checks" : "FAIL — " + fails + " of " + checks + " checks");
  process.exit(fails === 0 ? 0 : 1);
}

/* ==========================================================================
   7 · DISPATCH
   ========================================================================== */
if (flag("--start")) cmdStart();
else if (flag("--submit")) cmdSubmit();
else if (flag("--report")) cmdReport();
else selfTest();
