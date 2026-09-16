/* VEILRUN — _new.js, a harness scaffold generator (VR-196, 9/16).
 *
 * WHY THIS EXISTS. Six harnesses were queued back to back (VR-185…196: `_clock.js`,
 * `_kit.js`, `_levelcheck.js`, `_input.js`, `_camera.js`, `_feel.js`) and every one of
 * them starts from the same ~80 lines: extract or lift real source, run it for real
 * rather than describe it, count PASS/SKIP/FAIL as three states, and print a count
 * `_ship.js` can compare against CLAUDE.md §4. Writing that boilerplate six times is
 * how it drifts on the sixth — this exists so it is written once.
 *
 * ITS SIBLING IS `_roster.js`. That one REPORTS what harnesses already exist, read
 * straight off `ls`. This one CREATES what does not exist yet. Neither one asserts
 * anything about game code — both are generators/reporters, which is why both are
 * TOOLS, not harnesses, and both are excluded from `_ship.js` by name.
 *
 * THE SHAPE IS NOT INVENTED HERE. Four modes, each lifted from a harness already in
 * this repo rather than a new idea:
 *   extract  — a marked block pulled out of an HTML file and run in a vm sandbox,
 *              the shape `_sim.js` and `_touch.js` use for BALANCE/TOUCH/SHEET/AIM.
 *   exec     — a function lifted out of an HTML file by name and executed directly,
 *              the shape `_exec.js` and the strike-window half of `_strike.js` use.
 *   binary   — a binary asset parsed and asserted against, the shape `_clipfit.js`
 *              uses for the real .glb clip durations.
 *   module   — a real, dependency-free module required directly, no HTML and no
 *              stub needed, the shape `_clock.js` uses for `games/_engine/clock.js`.
 *
 * WHAT IT WRITES PASSES TRIVIALLY, ON PURPOSE. A freshly scaffolded harness has one
 * assertion that is always true — proof the plumbing (counting, exit code, the
 * PASS/FAIL line) works — and a TODO section that reports a `~ SKIP` (the same
 * partial-skip convention `_ship.js` already recognises, never folded into PASS)
 * until a human points it at the real target and replaces the placeholder assertion.
 * That means `node _ship.js` stays green the moment a scaffold is generated, not
 * only once someone finishes it.
 *
 * IT ALSO PRINTS ITS OWN CLAUDE.md §4 LINE, EVERY TIME IT RUNS. `_ship.js` greps
 * CLAUDE.md for every harness it discovers and reports a scaffolded-but-undocumented
 * file as drift. Rather than trust a human to remember the doc line, the generated
 * harness computes it fresh from its own live check count on every run — so the line
 * to paste is never stale, because it was never typed twice.
 *
 * REFUSES TO OVERWRITE. This project never deletes files (CLAUDE.md §2), and a
 * generator that could silently clobber a hand-built harness is a hazard this file
 * must not create. Pick a different name, or edit the existing file directly.
 *
 * NOT A HARNESS — no assertions, no pass/fail. CLAUDE.md §4's tools list names it,
 * and `_ship.js` / `_roster.js` both exclude it by name alongside `_grefart.js`,
 * `_pv.js`, `_roster.js` and `_boardstate.js`.
 *
 * No dependencies. Run:
 *   node _new.js <name> [--mode extract|exec|binary|module] [--game <dir>] [--card VR-###]
 *   node _new.js --selftest
 * -------------------------------------------------------------------------------- */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var os = require("os");

var ROOT = __dirname;
var ARGS = process.argv.slice(2);
var MODES = { extract: 1, exec: 1, binary: 1, module: 1 };
var FLAGS_WITH_VALUE = ["--mode", "--game", "--card"];

function usage(msg) {
  if (msg) console.error("error: " + msg + "\n");
  console.error("Usage: node _new.js <name> [--mode extract|exec|binary|module] [--game <dir>] [--card VR-###]");
  console.error("       node _new.js --selftest");
  console.error("");
  console.error("  <name>   becomes `_<name>.js` — leading underscore / trailing .js optional.");
  console.error("  --mode   extract (DEFAULT) — marked HTML block + vm sandbox, the _sim.js/_touch.js shape.");
  console.error("           exec    — lift a named function out of an HTML file and run it, the _exec.js shape.");
  console.error("           binary  — parse a binary asset, the _clipfit.js shape.");
  console.error("           module  — require a real shared module directly, the _clock.js shape.");
  console.error("  --game   place the file in games/<dir>/ instead of the repo root (dir must exist).");
  console.error("  --card   VR-### to stamp into the header and the printed §4 line.");
  process.exit(msg ? 1 : 0);
}

function flagVal(flag) {
  var i = ARGS.indexOf(flag);
  return i > -1 && i + 1 < ARGS.length ? ARGS[i + 1] : null;
}

/* ── Normal generation ─────────────────────────────────────────────────────────── */

function main() {
  var positional = [];
  for (var i = 0; i < ARGS.length; i++) {
    var a = ARGS[i];
    if (FLAGS_WITH_VALUE.indexOf(a) > -1) { i++; continue; }
    if (a === "-h" || a === "--help") usage();
    if (a.charAt(0) === "-") usage("unknown flag '" + a + "'");
    positional.push(a);
  }
  if (positional.length !== 1) usage("expected exactly one <name>, got " + positional.length);

  var rawName = positional[0];
  var mode = flagVal("--mode") || "extract";
  var game = flagVal("--game");
  var card = flagVal("--card") || null;

  if (!MODES[mode]) usage("unknown mode '" + mode + "' — choose extract, exec, binary, or module");

  // "kit" / "_kit" / "kit.js" / "_kit.js" all normalize to "_kit.js".
  var base = rawName.replace(/^_+/, "").replace(/\.js$/i, "");
  if (!/^[a-z][a-z0-9_]*$/i.test(base)) usage("name must be alphanumeric (e.g. 'kit' or '_kit.js') — got '" + rawName + "'");
  var fileName = "_" + base + ".js";

  var dir = ROOT, relDir = "";
  if (game) {
    dir = path.join(ROOT, "games", game);
    relDir = "games/" + game + "/";
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      usage("games/" + game + " does not exist — create the game before scaffolding a harness for it");
    }
  }

  var outPath = path.join(dir, fileName);
  if (fs.existsSync(outPath)) {
    usage(relDir + fileName + " already exists — this tool never overwrites. Pick a different name, " +
          "or edit the existing file directly (CLAUDE.md §2: never delete/clobber, archive instead).");
  }

  var today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(outPath, render(fileName, mode, card, today));

  console.log("wrote " + relDir + fileName + "  (mode: " + mode + ")");
  console.log("");
  console.log("It passes trivially right now:");
  console.log("  node " + (game ? relDir + fileName : fileName));
  console.log("");
  console.log("Next, by hand:");
  console.log("  1. Fill in the TODO target path(s) near the top of the TODO section.");
  console.log("  2. Replace the placeholder ok(...) call with real assertions.");
  console.log("  3. Paste the §4 line the harness prints into CLAUDE.md §4.");
  console.log("  4. Add a PROTECTS entry for it in _roster.js (proves / breaks).");
  console.log("");
  console.log("Reminder: _new.js itself is a TOOL, not a harness — `node _ship.js` and");
  console.log("`node _roster.js` already exclude it by name.");
}

/* ── Self-test: generate into a scratch dir, run it, expect PASS, clean up. ──────
   The one thing this generator could get wrong silently is emitting a scaffold that
   does not actually pass trivially — which would contradict the header's own claim
   every time someone used it. This drives the real code path (render → write → run
   as a subprocess) rather than asserting on the template string, for the same reason
   every harness here executes instead of reading: a string that looks right and a
   script that runs right are different claims. */
function runSelfTest() {
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "veilrun-new-selftest-"));
  var fails = 0;
  [ "extract", "exec", "binary", "module" ].forEach(function (mode) {
    var name = "_st" + mode + ".js";
    var full = path.join(tmp, name);
    fs.writeFileSync(full, render(name, mode, "VR-000", "2026-01-01"));
    var res = cp.spawnSync("node", [full], { encoding: "utf8" });
    var passed = res.status === 0 && /^PASS/m.test(res.stdout || "");
    console.log((passed ? "  ok    " : "  FAIL  ") + "mode=" + mode + " scaffold passes trivially and exits 0");
    if (!passed) { fails++; console.log("      " + (res.stdout || res.stderr || "").split("\n").join("\n      ")); }
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("\n" + (fails ? "FAIL" : "PASS") + " — " + (4 - fails) + " of 4 modes scaffold cleanly");
  process.exit(fails ? 1 : 0);
}

/* ── Rendering ─────────────────────────────────────────────────────────────────── */

var MODE_INFO = {
  extract: {
    label: "marked-block extraction (the _sim.js / _touch.js shape)",
    requires: "var fs = require(\"fs\"), path = require(\"path\"), vm = require(\"vm\");",
    block: [
      "// -- TODO (mode: extract) ---------------------------------------------------",
      "// Point TARGET_HTML at the real game file and BLOCK_NAME at the marked region",
      "// (the game's HTML should wrap it in `/* BLOCK_NAME:BEGIN ... */` and",
      "// `/* BLOCK_NAME:END */`, the same convention BALANCE and TOUCH use).",
      "var TARGET_HTML = path.join(__dirname, \"TODO-game\", \"index.html\");  // e.g. \"games/<name>/index.html\"",
      "var BLOCK_NAME = \"TODO_BLOCK\";                                       // e.g. \"BALANCE\"",
      "",
      "if (fs.existsSync(TARGET_HTML)) {",
      "  var html = fs.readFileSync(TARGET_HTML, \"utf8\");",
      "  var re = new RegExp(BLOCK_NAME + \":BEGIN[\\\\s\\\\S]*?-+ \\\\*\\\\/([\\\\s\\\\S]*?)\\\\/\\\\* \" + BLOCK_NAME + \":END\");",
      "  var m = html.match(re);",
      "  if (m) {",
      "    var sandbox = { module: { exports: {} }, Math: Math, console: console };",
      "    vm.createContext(sandbox);",
      "    new vm.Script(m[1], { filename: TARGET_HTML + \"#\" + BLOCK_NAME }).runInContext(sandbox);",
      "    var DATA = sandbox.module.exports;",
      "    // TODO: real assertions against DATA go here — never a retyped copy of a number.",
      "    ok(\"TODO — replace with a real assertion against the extracted block\", true);",
      "  } else {",
      "    console.log(\"  ~ SKIP — \" + BLOCK_NAME + \" block not found in \" + TARGET_HTML + \" (TODO not wired up yet)\");",
      "  }",
      "} else {",
      "  console.log(\"  ~ SKIP — TARGET_HTML does not exist yet: \" + TARGET_HTML + \" (fill in the TODO)\");",
      "}"
    ].join("\n")
  },
  exec: {
    label: "lift a function out of an HTML file and run it (the _exec.js shape)",
    requires: "var fs = require(\"fs\"), path = require(\"path\"), vm = require(\"vm\");",
    block: [
      "// -- TODO (mode: exec) -------------------------------------------------------",
      "// Point TARGET_HTML at the real game file and FN_NAME at the function to lift",
      "// and execute directly — never re-describe what it does, run the real one.",
      "var TARGET_HTML = path.join(__dirname, \"TODO-game\", \"index.html\");  // e.g. \"games/<name>/index.html\"",
      "var FN_NAME = \"TODO_functionName\";                                   // e.g. \"tryExecute\"",
      "",
      "if (fs.existsSync(TARGET_HTML)) {",
      "  var html = fs.readFileSync(TARGET_HTML, \"utf8\");",
      "  var re = new RegExp(\"function\\\\s+\" + FN_NAME + \"\\\\s*\\\\([\\\\s\\\\S]*?\\\\n\\\\}\", \"m\");",
      "  var m = html.match(re);",
      "  if (m) {",
      "    var sandbox = { module: { exports: {} }, Math: Math, console: console };",
      "    vm.createContext(sandbox);",
      "    new vm.Script(m[0] + \"\\nmodule.exports = \" + FN_NAME + \";\", { filename: TARGET_HTML + \"#\" + FN_NAME })",
      "      .runInContext(sandbox);",
      "    var fn = sandbox.module.exports;",
      "    // TODO: call fn(...) with real fixtures and assert on the result.",
      "    ok(\"TODO — replace with a real assertion calling the lifted function\", typeof fn === \"function\");",
      "  } else {",
      "    console.log(\"  ~ SKIP — function \" + FN_NAME + \" not found in \" + TARGET_HTML + \" (TODO not wired up yet)\");",
      "  }",
      "} else {",
      "  console.log(\"  ~ SKIP — TARGET_HTML does not exist yet: \" + TARGET_HTML + \" (fill in the TODO)\");",
      "}"
    ].join("\n")
  },
  binary: {
    label: "parse a binary asset (the _clipfit.js shape)",
    requires: "var fs = require(\"fs\"), path = require(\"path\");",
    block: [
      "// -- TODO (mode: binary) ------------------------------------------------------",
      "// Point TARGET_ASSET at the real binary file. Parse the real bytes — this is",
      "// the one shape that reads an asset nothing else in the repo parses.",
      "var TARGET_ASSET = path.join(__dirname, \"assets\", \"TODO-asset.glb\");",
      "",
      "if (fs.existsSync(TARGET_ASSET)) {",
      "  var buf = fs.readFileSync(TARGET_ASSET);",
      "  // TODO: parse the real binary format and assert on what you find in it.",
      "  ok(\"TODO — replace with a real assertion against the parsed asset\", buf.length > 0);",
      "} else {",
      "  console.log(\"  ~ SKIP — TARGET_ASSET does not exist yet: \" + TARGET_ASSET + \" (fill in the TODO)\");",
      "}"
    ].join("\n")
  },
  module: {
    label: "require a real shared module directly (the _clock.js shape)",
    requires: "var fs = require(\"fs\"), path = require(\"path\");",
    block: [
      "// -- TODO (mode: module) ------------------------------------------------------",
      "// Point TARGET_MODULE at the real dependency-free module. No DOM and no game",
      "// state to stub — a straight require() runs the actual thing, the same reason",
      "// _clock.js needs no extraction step at all.",
      "var TARGET_MODULE = path.join(__dirname, \"TODO-path-to-module.js\");",
      "",
      "if (fs.existsSync(TARGET_MODULE)) {",
      "  var mod = require(TARGET_MODULE);",
      "  // TODO: exercise the real module and assert on its behaviour.",
      "  ok(\"TODO — replace with a real assertion against the required module\", !!mod);",
      "} else {",
      "  console.log(\"  ~ SKIP — TARGET_MODULE does not exist yet: \" + TARGET_MODULE + \" (fill in the TODO)\");",
      "}"
    ].join("\n")
  }
};

function render(name, modeKey, cardId, dateStr) {
  var info = MODE_INFO[modeKey];
  var cardLine = cardId ? ", " + cardId : "";
  return [
    "/* VEILRUN — " + name + " (scaffolded by _new.js, " + dateStr + cardLine + ")",
    " *",
    " * WHAT THIS PROTECTS. TODO — one sentence: what does this prove, and what",
    " * breaks if it stops? That sentence is what _roster.js's PROTECTS table and",
    " * CLAUDE.md §4 both need; write it once the real assertions below exist.",
    " *",
    " * Scaffolded in \"" + modeKey + "\" mode — " + info.label + ".",
    " *",
    " * Until the TODOs below are filled in, this harness still PASSES — it carries",
    " * one trivial self-test proving its own plumbing works, and its TODO section",
    " * reports a partial skip (`~ SKIP`, never a fail) so `node _ship.js` stays",
    " * green while this is mid-build.",
    " *",
    " * Run:  node " + name,
    " * ---------------------------------------------------------------------------- */",
    info.requires,
    "",
    "var checks = 0, fails = 0;",
    "function ok(name, cond, detail) {",
    "  checks++;",
    "  if (!cond) { fails++; console.log(\"  FAIL  \" + name + (detail ? \"  — \" + detail : \"\")); }",
    "  else console.log(\"  ok    \" + name + (detail ? \"  — \" + detail : \"\"));",
    "}",
    "",
    "console.log(\"\\nVEILRUN · " + name + " — scaffolded harness\\n\" + \"=\".repeat(58));",
    "",
    "// -- the trivial self-test. Always true; proves the harness plumbing works. --",
    "ok(\"scaffold self-test — this harness runs and its plumbing works\", true);",
    "",
    info.block,
    "",
    "console.log(\"\\n\" + (fails ? \"FAIL — \" + fails + \" of \" : \"PASS — \") + checks + \" checks\");",
    "",
    "// Computed fresh every run, never typed twice — see _new.js's header for why.",
    "console.log(\"\\n📋 CLAUDE.md §4 line to paste once the TODOs above are real assertions:\");",
    "console.log(\"`" + name + "` (added " + dateStr + cardLine + ") — TODO: what it proves. **\" + checks + \" checks.**\");",
    "",
    "process.exit(fails ? 1 : 0);",
    ""
  ].join("\n");
}

/* ── Dispatch — after render()/MODE_INFO exist, so both paths can use them ───── */

if (ARGS[0] === "--selftest") runSelfTest();
else main();
