/* ---------------------------------------------------------------------------
   VEILRUN — Proving Ground · STRIKE-FEEL BAR   (VR-168)

   WHAT THIS IS. `_sim.js` proves the balance arithmetic; `_arena.js` proves the
   shape of the ground; `_clipfit.js` proves the animation fits the strike
   window. NOTHING WE OWNED ASKED WHETHER THE STRIKE WINDOW ITSELF IS RIGHT.
   This does. It is the first harness in the repo whose thresholds come from
   OUTSIDE the repo — measured off a community-datamined frame-data table for a
   class of 23 one-handed-blade chain kits in a reference title. The table, its
   commit hash, the per-character source lines and the attribution live in the
   rubric in `Claude Access` (Planning · Reference & Specs · VR-168), because
   this repo is the public website and a harness does not name a commercial game.

   WHY IT IS NOT ALREADY COVERED — checked, not assumed:
     · `_sim.js` has exactly one strike-timing assertion, `chainDps().time < 1.5`,
       and never mentions `chainWindow`.
     · `_clipfit.js` consumes `wind + active + rec` as a DENOMINATOR only
       (`mechFor()`). It proves the art fits the number; it never asks whether
       the number is right. Its "finisher reads heavier" pair only LOOKS like a
       constraint on BALANCE because CLIPFIT gives stages 2 and 3 the SAME clip
       window [25,44] — give stage 3 its own window and that proxy stops
       constraining anything at all.
   So this harness judges what `_clipfit.js` takes as given.

   IT MEASURES BY EXECUTION, NEVER BY ARITHMETIC. The game runs a fixed
   `STEP = 1/60`, and `updateStrike()` advances `atkT += dt` and compares against
   a seconds value. A BALANCE number is therefore NOT what the player gets:
   `rec: 0.20` costs THIRTEEN frames, not twelve, because twelve 1/60s accumulate
   to 0.19999999999999998. `ceil(0.20*60)` says 12 and is wrong. So this file
   lifts `startStrike()`, `updateStrike()` and the strike input branch out of
   index.html and RUNS them, frame by frame, and every bar below is asserted
   against the played frame count.

   NOTHING HERE IS A RETYPED COPY. BALANCE (same anchor `_sim.js` uses), the two
   strike functions, the input branch, the player's strike fields, `STEP`, the
   hitstop literals and the `chainWindow` comment are all lifted from the real
   file. If an anchor stops matching this exits 2 loudly rather than judging a
   stale copy — the `_arena.js` contract.

   ------------------------------ MEASURED -----------------------------------
   Read off the reference table, n named beside each. These are facts about the
   reference, not opinions about this game:
     · step-1 contact 8-18 frames @60 (n=22) · step-2 6-18 (n=23) · step-3 8-31 (n=23)
     · finisher hitstop >= opener hitstop in 20/20 kits, inverted in none
     · escalation ratio is 1.00x or >= 2.00x and <= 4.00x. THE BAND (1.00, 2.00)
       IS EMPTY across 20 kits — a chain either does not escalate or it at least
       doubles. Ours is 1.70x, which no kit in the class does.
     · cancel-into-next opens strictly before return-to-idle: 73 of 74 chain
       steps, 20 of 21 kits that expose the distinction
     · the last chain step has the longest animation: 23 of 23 kits
     · the last chain step out-damages the opener: 8 of 8 kits parsed

   ------------------------------- CHOSEN ------------------------------------
   Ruled by Jordan 2026-09-06 and therefore sourced. Cited inline as "ruling 9/6":
     1  chainWindow: the CODE is right (the window opens after recovery ENDS).
        The COMMENT is the bug. Semantics unchanged. -> VR-169
     2  recovery cancel: bar the CATEGORICAL rule only — cancel opens strictly
        before recovery ends. NO FRACTION IS ENCODED ANYWHERE IN THIS FILE.
     3  the input buffer should cover the WHOLE swing. -> VR-169
     4  the unsourced numeric rows are barred as RELATIVE INVARIANTS ONLY —
        no absolute threshold on `rec`, no rec:active ratio, no step-shape number.
     5  `active` is a post-contact COMMITMENT window, not a hitbox duration —
        `strikeHits()` fires once, at the wind->active edge. No "active-frame
        ratio" is barred, because that would measure a phase this game does not
        implement. RECOMMENDATION ONLY: rename it. This file does not rename it.

   NOT BARRED, ON PURPOSE. Opener hitstop in absolute ms (class 10-30ms, ours
   46ms): absolute freeze duration is entangled with camera distance and the pace
   of the surrounding game in a way a dimensionless ratio is not, and the sample
   holds only three distinct values. Reported in the rubric for Jordan; not
   enforced here. Input-to-first-visible-response, buffer window LENGTH and the
   chain-drop timeout are NOT OBTAINABLE from any source found — the reference
   sim does not even model a chain-drop clock — and are not barred.

   WHAT IT CAUGHT, on its first run against the shipped game:
     · no cancel window at ALL — the next strike begins on the same frame the
       swing ends, in 0 of 3 stages, against 73/74 reference steps
     · a press during wind or active is DISCARDED, not buffered
     · hitstop escalates 1.70x, inside a band no kit in the class occupies
     · both openers reach contact faster than the fastest kit in a 22-kit class
     · the `chainWindow` comment contradicts the code it sits beside
   ⚠️ THAT IS THE FINDING, NOT A BUG IN THIS FILE. Fixing it means moving the
   game (VR-169), never loosening the bar. A judge that can edit what it judges
   is not a judge.

   IT JUDGES ITSELF ON EVERY RUN. Phase B feeds the same judge one kit that is
   correct on every property — proving the bar is satisfiable and not vacuously
   red — plus seventeen kits each broken on exactly one property, and FAILS if
   any of them passes.

   THE MUTATION PASS, run rather than reasoned about. Fourteen mutants, fourteen
   kills — recorded in the hand-off; see the rubric.

   Dependency-free. Usage:  node _strike.js  [--verbose]
   --------------------------------------------------------------------------- */

var fs = require("fs"), path = require("path"), vm = require("vm");
var VERBOSE = process.argv.indexOf("--verbose") >= 0;
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

/* =========================================================================
   1 · LIFT THE GAME'S OWN SOURCE
   ========================================================================= */
function lift(label, re) {
  var m = html.match(re);
  if (!m) {
    console.error("\nANCHOR LOST — could not lift `" + label + "` out of index.html.");
    console.error("This bar will not fall back to a copy. Fix the anchor in _strike.js.\n");
    process.exit(2);
  }
  return m;
}

var balBody     = lift("BALANCE block", /BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/)[1];
var srcStart    = lift("startStrike()",  /\nfunction startStrike\(\) \{[\s\S]*?\n\}/)[0];
var srcUpdate   = lift("updateStrike()", /\nfunction updateStrike\(dt\) \{[\s\S]*?\n\}/)[0];
var srcInput    = lift("strike input branch",
                       /\n  if \(pressed\.strike \|\| \(mouse\.l && player\.atkStage < 0\)\) \{[\s\S]*?\n  \}/)[0];
var srcFields   = lift("player strike fields",
                       /\n  (atkStage: -1, nextStage: 0, atkT: 0, atkPhase: "", atkHit: false, chainT: 0, queued: false,)/)[1];
var mStep       = lift("STEP", /\nvar STEP = ([^,;]+),/);
var mHitstop    = lift("hitStop() at the strike contact frame",
                       /hitStop\(player\.atkStage === 2 \? (\d+) : (\d+)\);/);
var mChainCmt   = lift("chainWindow comment", /\n *chainWindow: *[\d.]+, *\/\/ *([^\n]*)/);

/* The strike input branch is a fragment of updatePlayer(); wrap it so it can be
   called on its own. The wrapper adds nothing but the function header. */
var srcInputFn = "function strikeInput() {" + srcInput + "\n}";

var sandbox = {
  Math: Math, console: console, module: { exports: {} },
  /* Everything startStrike()/updateStrike() touch that is not the state machine.
     Recorders, not fakes with behaviour — the only thing they do is log. */
  AU: { swing: function () {} },
  trail: { visible: false, material: {}, position: { set: function () {} },
           rotation: {}, scale: { setScalar: function () {} } },
  TRAIL_GEO: [0, 1, 2],
  trailSpin: 0,
  strikeHits: function () { sandbox.__hits.push(sandbox.__frame); },
  verbYaw: function () { return 0; },
  __hits: [], __frame: 0, __starts: []
};
vm.createContext(sandbox);
vm.runInContext(balBody, sandbox, { filename: "index.html#BALANCE" });
var BAL = sandbox.module.exports, C = BAL.C;
sandbox.C = C;
vm.runInContext([srcStart, srcUpdate, srcInputFn,
                 "var player = { " + srcFields + " aim: 0 };",
                 "var pressed = { strike: false };",
                 "var mouse = { l: false };"].join("\n"),
                sandbox, { filename: "index.html#STRIKE" });

/* Wrap startStrike so a new swing is observable without touching the game's
   copy of it — the wrapper calls the real function, it does not replace it. */
var realStart = sandbox.startStrike;
sandbox.startStrike = function () {
  sandbox.__starts.push({ f: sandbox.__frame, stage: sandbox.player.nextStage });
  realStart();
};

var STEP = vm.runInContext(mStep[1], sandbox);        // derived: the game's own fixed timestep
var HITSTOP = { heavy: +mHitstop[1], light: +mHitstop[2] };   // ms, lifted from the call site
var CHAIN_COMMENT = mChainCmt[1].trim();

/* =========================================================================
   2 · MEASURE THE SHIPPED GAME BY RUNNING IT
   ========================================================================= */
var LIMIT = 600;                                       // 10s of sim at STEP — far past any swing

function reset(stage) {
  var p = sandbox.player;
  p.atkStage = -1; p.nextStage = stage; p.atkT = 0; p.atkPhase = "";
  p.atkHit = false; p.chainT = 0; p.queued = false;
  sandbox.__hits = []; sandbox.__starts = []; sandbox.__frame = 0;
  sandbox.pressed.strike = false; sandbox.mouse.l = false;
}

/* One run. `presses` maps a 1-based frame number to true. Frame ordering copies
   updatePlayer(): the input branch runs BEFORE updateStrike(), same as the game
   (index.html — inputs ~line 4272, updateStrike ~line 4315). */
function run(stage, presses, frames) {
  reset(stage);
  var p = sandbox.player, log = { phase: [], idleAt: 0, started: false };
  for (var f = 1; f <= (frames || LIMIT); f++) {
    sandbox.__frame = f;
    sandbox.pressed.strike = !!(presses && presses[f]);
    sandbox.strikeInput();
    if (p.atkStage >= 0) log.phase.push({ f: f, phase: p.atkPhase, stage: p.atkStage });
    else log.phase.push({ f: f, phase: "", stage: -1 });
    if (sandbox.__starts.length) log.started = true;
    sandbox.updateStrike(STEP);
    if (log.started && !log.idleAt && p.atkStage < 0) log.idleAt = f;
  }
  log.hits = sandbox.__hits.slice();
  log.starts = sandbox.__starts.slice();
  log.chainT = p.chainT;
  return log;
}

/* Played frames per phase for one stage, plus the contact frame and the frame
   the swing returns to idle. Counted off the phase the machine was IN when a
   step was taken — which is the number of 1/60 steps that phase actually cost. */
function measureStage(stage) {
  var log = run(stage, { 1: true });
  var w = 0, a = 0, r = 0;
  for (var i = 0; i < log.phase.length; i++) {
    var e = log.phase[i];
    if (e.stage !== stage) continue;
    if (e.phase === "wind") w++; else if (e.phase === "active") a++; else if (e.phase === "rec") r++;
  }
  return { windF: w, activeF: a, recF: r, totalF: w + a + r,
           contactF: log.hits.length ? log.hits[0] : 0,
           hits: log.hits.length, idleF: log.idleAt };
}

/* The earliest frame at which a NEW swing can begin, found by pressing on every
   frame of the swing in turn and taking the earliest second start. This is a
   measurement, not a reading of the source — if a cancel window is ever added,
   this finds it without being told where it is. */
function earliestNext(stage, idleF) {
  var best = Infinity;
  for (var p = 1; p <= idleF; p++) {
    var presses = {}; presses[1] = true; presses[p] = true;
    if (p === 1) continue;
    var log = run(stage, presses);
    if (log.starts.length > 1) best = Math.min(best, log.starts[1].f);
  }
  return best;
}

/* Is a press during `phase` remembered? Press once, inside that phase, and never
   again — then ask whether a second swing ever happens. */
function buffers(stage, phase, m) {
  var at = phase === "wind" ? Math.max(2, Math.ceil(m.windF / 2))
         : phase === "active" ? m.windF + Math.max(1, Math.ceil(m.activeF / 2))
         : m.windF + m.activeF + Math.max(1, Math.ceil(m.recF / 2));
  var presses = { 1: true }; presses[at] = true;
  var log = run(stage, presses);
  return { at: at, buffered: log.starts.length > 1 };
}

/* The chain-drop deadline: the last frame on which a second press still
   continues the chain instead of restarting it at the opener. */
function chainDeadline(stage) {
  var last = 0, after = -1;
  for (var p = 2; p <= LIMIT - 1; p++) {
    var presses = { 1: true }; presses[p] = true;
    var log = run(stage, presses);
    if (log.starts.length < 2) continue;
    var s = log.starts[1].stage;
    if (s === (stage + 1) % 3) last = p;
    else if (last && after < 0) { after = s; break; }
  }
  return { lastF: last, stageAfter: after };
}

function chainCycle() {
  var m0 = measureStage(0);
  var presses = { 1: true };
  presses[m0.windF + m0.activeF + 1] = true;          // queue inside recovery, three times
  var log = run(0, presses), seq = [log.starts[0].stage];
  var stage = log.starts.length > 1 ? log.starts[1].stage : -1;
  for (var k = 0; k < 3 && stage >= 0; k++) {
    seq.push(stage);
    var mm = measureStage(stage), pr = { 1: true };
    pr[mm.windF + mm.activeF + 1] = true;
    var lg = run(stage, pr);
    stage = lg.starts.length > 1 ? lg.starts[1].stage : -1;
  }
  return seq;
}

function framesFor(sec) {                              // derived: STEP, by execution not ceil
  var t = 0, n = 0;
  while (t < sec && n < LIMIT) { t += STEP; n++; }
  return n;
}

function measureGame() {
  var stages = [measureStage(0), measureStage(1), measureStage(2)];
  var kit = {
    label: "the shipped game",
    stage: stages,
    earliestNextF: stages.map(function (m, i) { return earliestNext(i, m.idleF); }),
    buffer: {
      wind:   buffers(0, "wind", stages[0]).buffered,
      active: buffers(0, "active", stages[0]).buffered,
      rec:    buffers(0, "rec", stages[0]).buffered
    },
    hitstop: { light: HITSTOP.light, heavy: HITSTOP.heavy },
    chain: chainDeadline(0),
    chainExpectF: stages[0].totalF + framesFor(C.chainWindow),
    cycle: chainCycle(),
    comment: CHAIN_COMMENT,
    dmg:   C.strike.map(function (s) { return s.dmg; }),
    knock: C.strike.map(function (s) { return s.knock; }),
    arc:   C.strike.map(function (s) { return s.arc; })
  };
  return kit;
}

/* =========================================================================
   3 · THE BAR
   Every threshold below carries where it came from. A number with no source in
   this column is a bug in this file, not a licence.
   ========================================================================= */
var REF = {
  /* measured: contact frame of each chain step, frames @60, across the reference
     class. step1 n=22 (min 8, max 18) · step2 n=23 (min 6, max 18) ·
     step3 n=23 (min 8, max 31). Per-character source lines are in the rubric. */
  contactF: [[8, 18], [6, 18], [8, 31]],

  /* measured: finisher/opener hitstop ratio across n=20 kits. Observed values are
     exactly {1.00, 2.00, 2.50, 2.67, 3.00, 3.33, 4.00} — 2 flat, 18 escalating,
     0 inverted. THE OPEN BAND (1.00, 2.00) IS EMPTY. So a chain that escalates
     at all escalates by at least 2.00x, and never by more than 4.00x. */
  escMin: 2.00, escMax: 4.00,

  /* measured: 73 of 74 chain steps, 20 of 21 kits exposing the distinction, put
     the cancel-into-next strictly before return-to-idle. Ruling 9/6 #2 bars the
     categorical rule only — there is deliberately no fraction here. */
  cancelBeforeIdle: true
};

function judge(k) {
  var out = [];
  function crit(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail }); }

  /* --- the machine itself, so the measurements below stand on something --- */
  var minPhase = Infinity;
  k.stage.forEach(function (m) { minPhase = Math.min(minPhase, m.windF, m.activeF, m.recF); });
  crit("phase", "every phase of every stage lasts at least one simulation step",   // derived: STEP
       minPhase >= 1, "shortest phase " + minPhase + "f at STEP=" + STEP.toFixed(5) + "s");
  crit("sum", "wind + active + rec is exactly when the swing returns to idle",
       k.stage.every(function (m) { return m.windF + m.activeF + m.recF === m.idleF; }),
       k.stage.map(function (m) { return m.windF + "+" + m.activeF + "+" + m.recF + "=" + m.idleF; }).join("  "));
  crit("contact1", "contact fires exactly once per swing, at the wind->active edge",  // ruling 9/6 #5
       k.stage.every(function (m) { return m.hits === 1 && m.contactF === m.windF; }),
       k.stage.map(function (m, i) { return "s" + (i + 1) + " " + m.hits + " hit @" + m.contactF + "f/" + m.windF + "f"; }).join("  "));

  /* --- startup: measured, reference class --- */
  for (var i = 0; i < 3; i++) {
    var b = REF.contactF[i], c = k.stage[i].contactF;
    crit("startup" + (i + 1),
         "stage " + (i + 1) + " reaches contact inside the reference band",
         c >= b[0] && c <= b[1],
         c + "f (" + (c / 60).toFixed(3) + "s) against " + b[0] + "-" + b[1] + "f");
  }

  /* --- hitstop: measured, reference class --- */
  crit("hsOrder", "the finisher's hitstop is not shorter than the opener's",       // measured: 20/20 kits
       k.hitstop.heavy >= k.hitstop.light,
       k.hitstop.heavy + "ms vs " + k.hitstop.light + "ms");
  var ratio = k.hitstop.light > 0 ? k.hitstop.heavy / k.hitstop.light : 0;
  var escalates = k.hitstop.heavy > k.hitstop.light;
  crit("hsFloor", "a chain that escalates its hitstop at all escalates by " + REF.escMin.toFixed(2) + "x or more",
       !escalates || ratio >= REF.escMin,
       ratio.toFixed(2) + "x — the reference class is flat or >=" + REF.escMin.toFixed(2) + "x, the band between is empty");
  crit("hsCeil", "...and by no more than " + REF.escMax.toFixed(2) + "x",          // measured: max observed
       ratio <= REF.escMax, ratio.toFixed(2) + "x against a class maximum of " + REF.escMax.toFixed(2) + "x");

  /* --- the cancel window: measured, categorical only (ruling 9/6 #2) --- */
  var cancelOk = k.stage.every(function (m, j) { return k.earliestNextF[j] < m.idleF; });
  crit("cancel", "at every stage the next strike can begin BEFORE the swing returns to idle",
       cancelOk === REF.cancelBeforeIdle,
       k.stage.map(function (m, j) {
         return "s" + (j + 1) + " earliest " + k.earliestNextF[j] + "f vs idle " + m.idleF + "f";
       }).join("  "));

  /* --- the input buffer: ruling 9/6 #3, the whole swing remembers a press --- */
  ["wind", "active", "rec"].forEach(function (ph) {
    crit("buf-" + ph, "a press during " + ph + " is remembered",
         k.buffer[ph], k.buffer[ph] ? "buffered" : "DISCARDED");
  });

  /* --- chainWindow: ruling 9/6 #1 — the code is right, the comment is the bug -- */
  crit("cmt", "the chainWindow comment does not misstate where the window starts",
       !/after a swing starts/i.test(k.comment),
       '"' + k.comment + '"');
  crit("deadline", "the chain-drop deadline is end-of-recovery plus the whole of chainWindow",
       k.chain.lastF === k.chainExpectF,
       k.chain.lastF + "f (" + (k.chain.lastF / 60).toFixed(3) + "s) against " + k.chainExpectF + "f expected");
  crit("reset", "one frame past the deadline the chain restarts at the opener",
       k.chain.stageAfter === 0, "stage " + k.chain.stageAfter);
  crit("cycle", "the chain is a three-step cycle that returns to the opener",
       k.cycle.length >= 4 && k.cycle[0] === 0 && k.cycle[1] === 1 && k.cycle[2] === 2 && k.cycle[3] === 0,
       k.cycle.join(" -> "));

  /* --- relative invariants only (ruling 9/6 #4); directions are measured ------ */
  crit("longest", "the finisher is the longest step in the chain",                 // measured: 23/23 kits
       k.stage[2].totalF > k.stage[0].totalF && k.stage[2].totalF > k.stage[1].totalF,
       k.stage.map(function (m) { return m.totalF + "f"; }).join(" / "));
  crit("dmg", "the finisher does the most damage",                                 // measured: 8/8 kits
       k.dmg[2] > k.dmg[0] && k.dmg[2] > k.dmg[1], k.dmg.join(" / "));
  crit("knock", "the finisher knocks back hardest",                                // ruling 9/6 #4
       k.knock[2] > k.knock[0] && k.knock[2] > k.knock[1], k.knock.join(" / "));
  crit("arc", "the finisher sweeps the widest arc",                                // ruling 9/6 #4
       k.arc[2] > k.arc[0] && k.arc[2] > k.arc[1], k.arc.join(" / ") + " deg");

  return out;
}

/* =========================================================================
   3b · THE ALLOWANCE LIST  (VR-170)
   -------------------------------------------------------------------------
   WHY THIS EXISTS. This bar is RED against the shipped game and cannot be made
   green: four of its failures are defects with a card, and three are values only
   Jordan can rule on. The `pre-commit` hook blocks on FAIL, so an honest red bar
   would block every commit in the repo until a design decision got made. The two
   bad answers are `--no-verify` (which blinds all 23 harnesses, indefinitely, to
   silence one) and editing the game or the thresholds to fake a green.

   THE PRECEDENT is `_docscheck.js`'s NO_DOCS_NEEDED, and specifically its two
   self-policing properties, both of which are reimplemented below:
     · an entry with no real reason FAILS — you cannot quiet a criterion by
       naming it; you have to say why, in public, in the file.
     · an entry whose criterion now PASSES fails as STALE — an allowance cannot
       outlive the bug it was written for. When VR-169 lands, its four entries
       must be deleted or this harness goes red, which is the mechanism working.

   ⚠️ THE ADAPTATION, AND IT IS THE WHOLE POINT. NO_DOCS_NEEDED excuses things
   that are genuinely not gaps, so folding them into a pass is honest. These are
   four real defects in shipped game code and three open questions. Folding them
   into the ok count would be exactly the lie by omission `_ship.js` refuses when
   it keeps SKIP out of PASS. So an allowance is a FOURTH STATE, NEVER A PASS:
   every allowed failure still prints in full, and the summary says
   `35 pass · 7 allowed · 0 unallowed` — it never says 42 pass.

   Anything NOT on this list still fails and still blocks. That is what keeps the
   bar's teeth against a future regression, and it is what `--no-verify` throws away.

   Each reason must name a card (VR-###) or say `ruling-pending`, and must be a
   real sentence — both are enforced below, not by convention.
   ========================================================================= */
var ALLOWED = {
  cancel:     "VR-169 — recovery is never cancelled: startStrike() is called inside the " +
              "recovery-COMPLETE branch, so every chained hit pays full rec. The reference " +
              "class opens the next step before return-to-idle in 73 of 74 chain steps.",
  "buf-wind": "VR-169 — a press during wind is consumed by `pressed.strike = false` and " +
              "dropped; only the rec phase buffers. Ruled 9/6: the buffer covers the whole swing.",
  "buf-active": "VR-169 — same defect as buf-wind, in the active phase. It is asserted per " +
              "phase on purpose, so fixing one phase does not silently clear the other.",
  cmt:        "VR-169 — the chainWindow comment says 'after a swing starts'; the code sets " +
              "chainT after recovery ENDS. Ruled 9/6: the code is right, the comment is the bug.",
  startup1:   "ruling-pending — stage 1 reaches contact in 6f against a measured floor of 8f. " +
              "This is a MEASURED GAP, not a defect: we are faster than the fastest kit in a " +
              "22-kit class, and a fast assassin may want exactly that. Needs Jordan's ruling " +
              "on BALANCE, and no thread may change strike[0].wind to clear this line.",
  startup2:   "ruling-pending — stage 2 reaches contact in 5f against a measured floor of 6f. " +
              "Same standing as startup1; same prohibition on quietly tuning it green.",
  hsFloor:    "ruling-pending — hitstop escalates 1.70x, inside the open band (1.00, 2.00) that " +
              "is EMPTY across 20 reference kits: a chain is either flat or at least doubles. " +
              "The fix is a hitStop() literal, not a BALANCE value, and it is Jordan's call."
};

/* =========================================================================
   4 · REPORT
   ========================================================================= */
var checks = 0, fails = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}

console.log("\nVEILRUN · Proving Ground — strike-feel bar (VR-168)\n" + "=".repeat(64));

var GAME = measureGame();

console.log("\n[what the player actually gets — nominal vs played, at STEP = 1/" +
            Math.round(1 / STEP) + "]");
for (var i = 0; i < 3; i++) {
  var s = C.strike[i], m = GAME.stage[i];
  console.log("  stage " + (i + 1) + "  wind " + s.wind.toFixed(2) + "s->" + m.windF +
              "f   active " + s.active.toFixed(2) + "s->" + m.activeF +
              "f   rec " + s.rec.toFixed(2) + "s->" + m.recF +
              "f   total " + (s.wind + s.active + s.rec).toFixed(2) + "s->" + m.totalF + "f");
}
console.log("  chainWindow " + C.chainWindow.toFixed(2) + "s->" + framesFor(C.chainWindow) +
            "f   ·  hitstop " + GAME.hitstop.light + "ms / " + GAME.hitstop.heavy + "ms" +
            "   ·  drop deadline " + GAME.chain.lastF + "f = " + (GAME.chain.lastF / 60).toFixed(3) + "s");

console.log("\n[the bar, against the shipped game]");
var verdicts = judge(GAME), allowedN = 0, unallowed = 0;
verdicts.forEach(function (r) {
  checks++;
  var note = r.detail ? "  — " + r.detail : "";
  if (r.pass) { console.log("  ok    " + r.name + note); return; }
  /* An allowed failure PRINTS IN FULL. It is never folded into the ok count. */
  if (Object.prototype.hasOwnProperty.call(ALLOWED, r.id)) {
    allowedN++;
    console.log("  ALLOW " + r.name + note);
    console.log("        ^ " + ALLOWED[r.id].replace(/(.{86})\s/g, "$1\n          "));
  } else {
    unallowed++;
    console.log("  FAIL  " + r.name + note);
  }
});

/* =========================================================================
   5 · THE GATE — the judge is judged
   One kit correct on every property (so the bar is provably satisfiable and not
   vacuously red), then one kit broken per property. Every number in a broken kit
   is a deliberate lie; none of them is a reference value.
   ========================================================================= */
function goodKit() {
  return {
    label: "a kit that is correct on every property",
    stage: [
      { windF: 10, activeF: 5, recF: 12, totalF: 27, contactF: 10, hits: 1, idleF: 27 },
      { windF: 9,  activeF: 5, recF: 12, totalF: 26, contactF: 9,  hits: 1, idleF: 26 },
      { windF: 14, activeF: 7, recF: 20, totalF: 41, contactF: 14, hits: 1, idleF: 41 }
    ],
    earliestNextF: [20, 19, 32],
    buffer: { wind: true, active: true, rec: true },
    hitstop: { light: 40, heavy: 100 },
    chain: { lastF: 55, stageAfter: 0 },
    chainExpectF: 55,
    cycle: [0, 1, 2, 0],
    comment: "sec after recovery ends that the next input still chains",
    dmg: [26, 30, 52], knock: [3.4, 3.8, 9.5], arc: [100, 110, 290]
  };
}
function bend(fn) { var k = goodKit(); fn(k); return k; }

var GATE = [
  ["startup1", "startup far too fast",            bend(function (k) { k.stage[0].windF = 3; k.stage[0].contactF = 3; k.stage[0].recF = 19; k.stage[0].idleF = 27; k.earliestNextF[0] = 14; })],
  ["startup1", "startup far too slow",            bend(function (k) { k.stage[0].windF = 24; k.stage[0].contactF = 24; k.stage[0].recF = 5; k.stage[0].totalF = 34; k.stage[0].idleF = 34; k.earliestNextF[0] = 26; })],
  ["startup3", "the finisher lands too late",     bend(function (k) { k.stage[2].windF = 45; k.stage[2].contactF = 45; k.stage[2].totalF = 72; k.stage[2].idleF = 72; })],
  ["hsOrder",  "hitstop inverted — light hit halts longer", bend(function (k) { k.hitstop = { light: 100, heavy: 40 }; })],
  ["hsFloor",  "hitstop escalates inside the empty band",   bend(function (k) { k.hitstop = { light: 46, heavy: 78 }; })],
  ["hsCeil",   "hitstop escalates past anything in the class", bend(function (k) { k.hitstop = { light: 20, heavy: 140 }; })],
  ["cancel",   "no cancel window — next strike only at idle", bend(function (k) { k.earliestNextF = [27, 26, 41]; })],
  ["buf-wind", "a press during wind is dropped",   bend(function (k) { k.buffer.wind = false; })],
  ["buf-active", "a press during active is dropped", bend(function (k) { k.buffer.active = false; })],
  ["buf-rec",  "a press during recovery is dropped", bend(function (k) { k.buffer.rec = false; })],
  ["cmt",      "the comment misstates where the window starts", bend(function (k) { k.comment = "sec after a swing starts that the next input chains"; })],
  ["deadline", "the drop deadline is measured from the swing start", bend(function (k) { k.chain.lastF = 28; })],
  ["reset",    "a dropped chain resumes mid-chain",  bend(function (k) { k.chain.stageAfter = 2; })],
  ["cycle",    "the chain never returns to the opener", bend(function (k) { k.cycle = [0, 1, 2, 2]; })],
  ["longest",  "the finisher is not the longest step", bend(function (k) { k.stage[2].totalF = 20; })],
  ["dmg",      "the finisher is not the hardest hit",  bend(function (k) { k.dmg = [26, 60, 52]; })],
  ["knock",    "the finisher knocks back least",       bend(function (k) { k.knock = [9.5, 3.8, 3.4]; })],
  ["arc",      "the finisher sweeps the narrowest arc", bend(function (k) { k.arc = [290, 110, 100]; })],
  ["phase",    "a phase shorter than one simulation step", bend(function (k) { k.stage[1].activeF = 0; k.stage[1].totalF = 21; k.stage[1].idleF = 21; })],
  ["contact1", "contact fires twice in one swing",     bend(function (k) { k.stage[0].hits = 2; })],
  /* Added after the mutation pass found `sum` was the ONE criterion no gate kit
     exercised — it could be waived outright and nothing noticed. idleF alone is
     bent, so this kit breaks `sum` and nothing else: earliestNextF stays below the
     larger idleF (cancel still passes) and totalF is untouched (longest still passes). */
  ["sum",      "the phases do not add up to the swing length", bend(function (k) { k.stage[1].idleF = 28; })]
];

console.log("\n[the gate — the judge is judged]");
var goodVerdict = judge(goodKit());
ok("a kit correct on every property passes the whole bar",
   goodVerdict.every(function (r) { return r.pass; }),
   goodVerdict.filter(function (r) { return !r.pass; }).map(function (r) { return r.id; }).join(",") || "all " + goodVerdict.length + " pass");
GATE.forEach(function (g) {
  var v = judge(g[2]), hit = v.filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
  ok("rejected: " + g[1], hit.indexOf(g[0]) >= 0, "on [" + hit.join(",") + "], wanted " + g[0]);
});

if (VERBOSE) {
  console.log("\n[verbose] earliest next-strike frame per stage: " + GAME.earliestNextF.join(", "));
  console.log("[verbose] chain cycle observed: " + GAME.cycle.join(" -> "));
  console.log("[verbose] chainWindow comment: \"" + GAME.comment + "\"");
}

/* The allowance list polices itself. A mute button you can add without saying why,
   or that survives the bug it excused, is not a decision — it is a way to stop
   looking. Both of these are failures of THIS harness, not warnings. */
console.log("\n[the allowance list polices itself]");
var byId = {};
verdicts.forEach(function (r) { byId[r.id] = r; });
Object.keys(ALLOWED).forEach(function (id) {
  var why = ALLOWED[id];
  ok("allowance for `" + id + "` names a card or says ruling-pending",
     /VR-\d+/.test(why) || /ruling-pending/.test(why),
     /VR-\d+/.test(why) ? why.match(/VR-\d+/)[0] : (/ruling-pending/.test(why) ? "ruling-pending" : "NEITHER"));
  ok("allowance for `" + id + "` gives an actual reason", why.replace(/\s+/g, " ").length >= 40,
     why.replace(/\s+/g, " ").length + " chars");
  ok("allowance for `" + id + "` refers to a criterion this bar has",
     Object.prototype.hasOwnProperty.call(byId, id), byId[id] ? "exists" : "NO SUCH CRITERION");
  ok("allowance for `" + id + "` is not stale", !byId[id] || !byId[id].pass,
     byId[id] && byId[id].pass ? "THAT CRITERION NOW PASSES — delete this entry" : "still failing");
});

console.log("");
var passN = checks - fails - allowedN - unallowed;
console.log("  " + passN + " pass · " + allowedN + " allowed · " + unallowed + " unallowed");
console.log("");
var bad = fails + unallowed;
console.log(bad === 0
  ? "PASS — " + checks + " checks (" + allowedN + " allowed, and an allowance is not a pass)"
  : "FAIL — " + bad + " of " + checks + " checks");
process.exit(bad === 0 ? 0 : 1);
