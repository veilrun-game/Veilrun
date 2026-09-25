/* VEILRUN — the canonical harness roster, emitted rather than maintained (VR-181, 9/13).
 *
 * WHY THIS EXISTS. Six surfaces in this project have claimed to enumerate the
 * harnesses. Five of them have been caught behind reality at least once, and the
 * weekly audit's Task B3 has found a stale list FIVE WEEKS RUNNING — boardTree
 * (8/15), _grefcheck.js (8/16), _clipfit.js (8/23), the House rules card (9/6),
 * and Puzzle's two Workflow tabs (9/13, five harnesses behind).
 *
 * The fix that actually worked was never "check the list more carefully". Four of
 * those six surfaces are clean today because they DELETED their list and pointed
 * at `node _ship.js`. The ones still wrong are the ones that kept a list.
 *
 * But Puzzle cannot point at a command — it is a diagram, and a diagram of a
 * validation flow with no harnesses in it is not a diagram of anything. So Puzzle
 * is the one surface that legitimately needs a roster, and therefore the one that
 * needs the roster GENERATED rather than typed.
 *
 * THIS FILE IS THAT GENERATOR, AND IT IS NOT A HARNESS. It asserts nothing and has
 * no pass/fail — it discovers by listing the folders (the same way `_ship.js`
 * does, and for the same reason) and prints the roster as JSON. `_ship.js`
 * excludes it by name alongside `_grefart.js` and `_pv.js`.
 *
 * WHAT CONSUMES IT. An agent with the Puzzle connector: run this, diff the output
 * against the `Harnesses — what each one protects` tab, and create/update/delete
 * steps so they match. **The agent never types a filename** — which is the whole
 * point, because every one of the five misses above was a filename somebody
 * forgot to type.
 *
 * WHY A SCRIPT AND NOT A DIRECT SYNC. Puzzle needs credentials, and CLAUDE.md §5
 * forbids credentials in this repo, which is the public website. So the split is:
 * this file owns WHAT THE TRUTH IS and lives in git; the agent owns GETTING IT
 * THERE and lives where the credentials are. Neither half can drift on its own —
 * this one is regenerated from `ls` every run, and the other one never invents a
 * name.
 *
 * No dependencies. Run: node _roster.js [--json] [--diff <file.json>]
 */
var fs = require("fs");
var path = require("path");

var ROOT = __dirname;
var JSON_ONLY = process.argv.indexOf("--json") > -1;
var DIFF_AT = process.argv.indexOf("--diff");

/* NOT HARNESSES, and the distinction is load-bearing rather than tidy. These have
   no assertions and no pass/fail, so counting them makes the green set look larger
   than it is — CLAUDE.md §4 names them for exactly this reason, and Puzzle already
   carries `_pv.js` correctly labelled "NOT a gate". `_ship.js` is the runner and
   asserts nothing of its own; `_roster.js` is this file. */
var NOT_A_HARNESS = {
  "_grefart.js": "tool — resolves Steam appids for Game Reference covers. Run by hand.",
  "_pv.js":      "tool — renders a static Game Reference preview. No assertions at all.",
  "_ship.js":    "runner — discovers and runs every harness. Asserts nothing of its own.",
  "_roster.js":  "generator — emits this roster. Asserts nothing of its own.",
  "_boardstate.js": "tool — prints which VR numbers reached main and which sit on an unmerged branch. Derives, never decides. `_board.js` is its harness.",
  "_new.js": "generator — writes a harness SKELETON (extract/exec/binary/module modes). Asserts nothing about what it generates; the generated file is its own harness once it exists."
};

/* What each harness PROVES, and what BREAKS IF IT STOPS. Two fields, deliberately.
   "Proves" is what the file does and you could work it out by reading it. "Breaks"
   is why anyone should care, and it is the half that cannot be reconstructed from
   the code — most of these are a real incident someone had to live through.

   THIS IS THE ONLY HAND-MAINTAINED PART OF THIS FILE, and it is deliberately the
   part that cannot go silently wrong: a harness with no entry here is REPORTED as
   unexplained rather than quietly omitted, so the failure mode is a loud gap
   instead of a short list. That inversion is the entire design — every previous
   roster failed by being short, never by being noisy.

   ⚠️ NOTE WHAT IS ABSENT: check counts. Not one of these lines states a number.
   Puzzle's version of this list carried per-harness counts from 8/31 and three of
   them were wrong by 9/13 — a count is a second copy of something only the harness
   can tell you, and CLAUDE.md §4's counts are checked back by `_ship.js` for
   exactly that reason. Say what it protects; let it say how many.

   Harvested 9/13 from Puzzle's `Harnesses — what each one protects` tab before
   that tab was archived (VR-181). Full verbatim record:
   `Claude Access/Games/Veilrun/_Archive/Puzzle — Harnesses tab (archived 2026-09-13).md` */
var PROTECTS = {
  "_board.js": {
    proves: "Card state derived from git — that a commit subject closing several cards at once (VR-180/181/182) yields all of them, and that a card whose branch already reached main counts as shipped rather than still in review.",
    breaks: "The reconciler moves the wrong cards, or silently moves none. A board that looks maintained and is wrong is worse than the stale one it replaced — VR-189 sat in Tonight for two hours after it was live on the site, and a parser that drops a number would hide that forever instead of for an afternoon." },
  "_clock.js": {
    proves: "The shared fixed-timestep clock — the accumulator drains in whole steps, the max-steps clamp DISCARDS the overflow rather than carrying it, a scaled dt scales the accumulation and not the step, and the true frame delta is read BEFORE the clamp so the perf sampler sees the hitch the player got.",
    breaks: "Feel stops being frame-rate independent, and it stops silently — the game still runs, it just runs differently on a 144Hz monitor than on the machine the balance numbers were tuned on. Carrying the overflow instead of dropping it turns one long frame into a spiral the sim never catches up from." },
  "_check.js": {
    proves: "The VEILRUN.games manifest — every play path and every level id resolves, and no preview or legacy label sits in versions[0], the node js/app.js actually opens.",
    breaks: "A game goes unreachable from the site, or a level id stops resolving and every board attached to it orphans. Promoting a preview to default silently opens the wrong build." },
  "_hubcheck.js": {
    proves: "views.hub() for EVERY user state, against the real app.js in a DOM stub.",
    breaks: "The first thing a new person sees is a page telling them what changed since a visit they never made. This has bitten twice." },
  "_updatescheck.js": {
    proves: "The weekly hero in every state, including the ageing rule — a missing, malformed or stale VEILRUN.weekly falls back to EXACTLY the page that existed before the feature.",
    breaks: "A bad weekly entry takes the whole Updates page down instead of quietly disappearing." },
  "_grefcheck.js": {
    proves: "The Game Reference catalogue and matcher — slugs stay stable, near misses never auto-merge, cards survive 1–10 takes, and the gripes-affirmation contract holds.",
    breaks: "Two different games silently collapse into one card, or a slug shifts and everyone's entries detach from the game they were written about." },
  "_docscheck.js": {
    proves: "Ship-checklist item 5 — VR numbers claimed in commit subjects that the canon docs never mention. The only harness whose subject matter lives outside the repo. SKIPS without the mount.",
    breaks: "Work ships and the canon docs never learn about it — which is how the ship checklist rotted in the first place." },
  "_leakcheck.js": {
    proves: "Nothing withheld appears in anything git tracks, or in anything one `git add .` would sweep in. Never prints the matched term — a red build ends up in logs and screenshots. SKIPS without the mount.",
    breaks: "Unreleased lore ships to a public URL and cannot be unshipped. This repo IS the website, so material reaching it is publication, not a private slip." },
  "_pathcheck.js": {
    proves: "Location rather than content — paths that must never be tracked, and the canon pointer stubs staying empty. Reads the INDEX, so it stops a bad `git add` at the hook. NEVER skips.",
    breaks: "A file that is perfectly clean of withheld terms goes world-readable anyway. VR-164: .claude/agents/release-steward.md scanned clean and was public at a guessable URL for a day." },
  "_kit.js": {
    proves: "Scaffolded from _new.js (VR-196) in `module` mode, awaiting VR-185's character kit schema. Today it proves only its own plumbing — one trivial self-test — and reports a partial skip until VR-185 gives it a real module to require.",
    breaks: "Nothing yet — there is no real assertion here. Its purpose right now is proof that _new.js's generator produces a runnable, correctly-classified skeleton end to end; VR-185 replaces the TODO with the real bar." },
  "_hitstop.js": {
    proves: "The shared budgeted hit-stop channel — raise() latches to the max of what is still counting down rather than summing, a hard cap bounds any single freeze, update() floors at zero on real (never sim-scaled) time, and it never reads MOTION at all. Lifts the real consumer wiring out of both proving-ground/index.html and pair-level-v2/index.html to prove each drives the shared clock's scale from it rather than a hand-rolled bypass — and drives Seam Gate v2's caught()/settleCaught() frame by frame to prove the held frame shows the impact and the level resets only after it.",
    breaks: "Two close hits stack into a freeze that reads as a hang, or a reduced-motion setting quietly starts changing how long a strike window really lasts — the exact TUNE-reaches-BALANCE hazard `_billboard.js` exists to catch, arriving through a second game that never inherited the rule." },
  "_cross.js": {
    proves: "The 2D engine's two-world crossing (VE.World.cross), run for real against Seam Gate v2's lifted maps and body sizes: a carried mate keeps its offset and feet line, a kept spot with no footing falls back to the nearest standable spot on the mate's own side, never on top of the crosser, and an authored door (atX + mateDX) lands exactly where it always did.",
    breaks: "Latch's Flip stacks Anvil on top of him again — and since Anvil's body blocks shots, every Flip becomes a free bulwark the level was never designed around (VR-214). Or a flip over the Overcity chasm drops Anvil into it." },
  "_bus.js": {
    proves: "The shared synchronous event bus — named/enumerable events, publish/subscribe/unsubscribe, registration-order delivery, and that an unknown event throws rather than swallowing silently. Then lifts Proving Ground's real HITBUS wiring out of the HTML and proves every declared event has a subscriber and damageEnemy() emits rather than calling its old effects by hand.",
    breaks: "A verb's effect gets threaded through by hand again and a later edit forgets one call site — the exact VR-172 failure this bus exists to structurally rule out. An event declared with no subscriber is a call site somebody meant to move and did not." },

  "games/proving-ground/_sim.js": {
    proves: "Every deterministic number in the 3D game — wave schedule, damage, cooldowns, score — against the marked BALANCE block extracted from the HTML, never a retyped copy. Projects wave clear times.",
    breaks: "Balance drifts silently. A wave becomes unclearable or trivial and nobody knows until a player says the game feels wrong. Feel is playtested; numbers are only ever proven here." },
  "games/proving-ground/_arena.js": {
    proves: "The SHAPE of the ground rather than the numbers — reach, wedge, shroud, cheese, blink, convergence. Judges itself: every run feeds it arenas broken on purpose and it goes red if it passes one.",
    breaks: "Maps get walls, rooms and eventually a randomiser with nothing generating faster than anyone can check. It refused two real Veilstep bugs on its first run." },
  "games/proving-ground/_gauntlet.js": {
    proves: "The generate → judge → NAMED FAILURES BACK loop that walks a builder up to _arena.js's bar. Three rounds, spend reported. Self-tests the referee against canned verdicts plus one live judge call.",
    breaks: "The loop becomes theatre — a resubmitted layout, a paraphrased verdict, a round that learned nothing. Its three guards are the difference between this and a randomiser." },
  "games/proving-ground/_billboard.js": {
    proves: "Sprite math against the asset contract AND the wall between feel and balance — the sprite layer never touches BALANCE, BALANCE never reads MOTION, and BALANCE stays DOM-free.",
    breaks: "Sprites face the wrong way — loud to a player, silent to every other harness. And hitStop becomes scalable from the motion panel, which is a balance edit wearing a display-setting costume." },
  "games/proving-ground/_touch.js": {
    proves: "TOUCH, SHEET, PRESET and AIM executed against a DOM stub — pad, settings-sheet focus contract, aim solver. Its best assertion: the matchMedia string and the @media query are CHARACTER-IDENTICAL.",
    breaks: "Mobile dies quietly. The pad renders and does nothing, or one button is invisible, and the only way to find out is to be holding the right phone." },
  "games/proving-ground/_clipfit.js": {
    proves: "Real animation clip durations, parsed out of the binary .glb, against the marked CLIPFIT block and the strike windows in BALANCE. The only harness that reads an asset.",
    breaks: "VR-111 returns — a 3s animation inside a 0.36s strike window. Nothing threw and no harness could see it, because the animation lives in a file nobody parsed. RE-RUN AFTER ANY GLB RE-MERGE." },
  "games/proving-ground/_shroud.js": {
    proves: "The veil shader lifted from index.html, compiled in a real GL context, drawn and COUNTED IN PIXELS. The only harness that renders. Skips its render pass without playwright.",
    breaks: "The Shroud reveal degrades to something nothing can check. Others can prove the word uGhost is present; only this one can prove the reveal looks like a reveal." },
  "games/proving-ground/_zoom.js": {
    proves: "Zoom means a DIFFERENT QUANTITY in each camera mode — metres of dolly in arcade and third, degrees of lens in first — and all three ends behave. Magnitude is never read.",
    breaks: "Zoom looks fine in one camera mode and is silently dead in the other two. It was missing from CLAUDE.md §4 for a day and a session that trusted the list shipped two regressions into it." },
  "games/proving-ground/_strike.js": {
    proves: "Whether the strike WINDOW ITSELF is right — thresholds from outside this repo, measured by frame-stepping the real functions at 1/60 rather than by arithmetic. Carries an allowance list.",
    breaks: "The clip harness takes wind+active+rec as a denominator and so takes those numbers as given. Nothing else judges them. It named four real defects on its first run." },
  "games/proving-ground/_exec.js": {
    proves: "What a verb says when it finds NOTHING — a whiff must be perceivable, must still cost nothing, and must not borrow the hit's tells. Every case at all three cam.mode values.",
    breaks: "A miss and a dead button become byte-identical to the player. That cost a week in early September, when right-click genuinely did appear broken in third person." },
  "games/proving-ground/_check.js": {
    proves: "The inline <script> extracted from the single-file game parses.",
    breaks: "A syntax error ships. There is no build step, so nothing between the edit and the live site catches it, and the game is simply blank for everyone." },

  "games/rook-signal/validate.js": {
    proves: "The story graph walked exhaustively — no dead ends, no orphans, all six endings reachable.",
    breaks: "A story edit strands a node. A choice goes nowhere, or an ending we wrote becomes unreachable and nobody ever sees it. Invisible to every other check we own." },
  "games/rook-signal/_check.js": {
    proves: "The inline script parses, boot params are handled, and the no-param fallback is intact.",
    breaks: "The game breaks when opened without params — which is exactly how anyone arriving from the hub opens it." }
};

/* Every `<name>-v2/_sim.py` shares one entry — they are the same harness shape per
   pair level, and writing five near-identical blocks is how one of them ends up
   subtly different from the other four for no reason. The per-level specifics
   (Wren's apex, the Overcity chasm, the patrol cone gaps) live in each file's own
   assertions, where they are executable rather than described. */
var PAIR_SIM = {
  proves: "Python physics sim for the v2 pair slice — the level is solvable, the pair interaction is REQUIRED, and there is no cheese route around it.",
  breaks: "A level ships that is either impossible or completable without the pairing — which quietly voids the design rule the whole game is built on."
};

function exists(p) { try { fs.statSync(path.join(ROOT, p)); return true; } catch (e) { return false; } }

function lsHarnesses() {
  var out = [];

  // Site level: every _*.js at the root, minus the tools and runners.
  fs.readdirSync(ROOT)
    .filter(function (f) { return /^_.*\.js$/.test(f); })
    .sort()
    .forEach(function (f) { if (!NOT_A_HARNESS[f]) out.push(f); });

  // Per game: _*.js, _*.py and validate.js, skipping archived builds under
  // versions/ and the Blender scripts under _tools/ — neither is a gate.
  var games = path.join(ROOT, "games");
  if (exists("games")) {
    fs.readdirSync(games).sort().forEach(function (g) {
      var dir = path.join(games, g);
      try { if (!fs.statSync(dir).isDirectory()) return; } catch (e) { return; }
      fs.readdirSync(dir).sort().forEach(function (f) {
        if (/^_.*\.(js|py)$/.test(f) || f === "validate.js") out.push("games/" + g + "/" + f);
      });
    });
  }
  return out;
}

var found = lsHarnesses();

var roster = found.map(function (rel) {
  var e = PROTECTS[rel];
  if (!e && /-v2\/_sim\.py$/.test(rel)) e = PAIR_SIM;
  return { file: rel, proves: (e && e.proves) || null, breaks: (e && e.breaks) || null };
});

var unexplained = roster.filter(function (r) { return !r.proves; });

if (DIFF_AT > -1) {
  /* Diff mode: hand it a JSON array of names currently on a surface (Puzzle's tab,
     say) and it reports both directions. MISSING is the failure every previous
     roster had; EXTRA is the one nobody checked for — a harness that was deleted
     or renamed leaves a step behind that reads as a gate nobody is running. */
  var theirs = JSON.parse(fs.readFileSync(process.argv[DIFF_AT + 1], "utf8"));
  var mine = {}, mapTheirs = {};
  roster.forEach(function (r) { mine[r.file] = true; });
  theirs.forEach(function (t) { mapTheirs[t] = true; });

  var missing = roster.filter(function (r) { return !mapTheirs[r.file]; }).map(function (r) { return r.file; });
  var extra = theirs.filter(function (t) { return !mine[t]; });

  console.log("VEILRUN roster diff");
  console.log("  " + roster.length + " harness(es) on disk · " + theirs.length + " on the surface\n");
  if (missing.length) {
    console.log("[on disk, MISSING from the surface]");
    missing.forEach(function (f) {
      var e = PROTECTS[f] || PAIR_SIM;
      console.log("  + " + f);
      console.log("      proves: " + e.proves);
      console.log("      breaks: " + e.breaks);
    });
    console.log("");
  }
  if (extra.length) {
    console.log("[on the surface, NOT on disk — deleted, renamed, or never a harness]");
    extra.forEach(function (f) { console.log("  - " + f); });
    console.log("");
  }
  if (!missing.length && !extra.length) console.log("In step. Nothing to do.");
  process.exit(0);
}

if (JSON_ONLY) { console.log(JSON.stringify(roster, null, 2)); process.exit(0); }

console.log("VEILRUN harness roster — generated from `ls`, never typed");
console.log("  " + roster.length + " harness(es) · " + Object.keys(NOT_A_HARNESS).length + " excluded by name\n");
roster.forEach(function (r) {
  console.log("  " + r.file);
  if (r.proves) {
    console.log("      proves: " + r.proves);
    console.log("      breaks: " + r.breaks);
  } else {
    console.log("      ⚠️ NO DESCRIPTION — add it to PROTECTS in _roster.js");
  }
});
console.log("\n[excluded — tools and runners, never in the green set]");
Object.keys(NOT_A_HARNESS).sort().forEach(function (f) {
  console.log("  " + f + " — " + NOT_A_HARNESS[f]);
});
if (unexplained.length) {
  console.log("\n⚠️ " + unexplained.length + " harness(es) have no description. They are LISTED anyway —");
  console.log("   a roster that drops what it cannot explain is how every previous one went short.");
}
console.log("\nThis file is not a harness. It asserts nothing; it emits.");
