/* VEILRUN — _kit.js (scaffolded by _new.js, 2026-09-16, VR-185)
 *
 * WHAT THIS PROTECTS. TODO — one sentence: what does this prove, and what
 * breaks if it stops? That sentence is what _roster.js's PROTECTS table and
 * CLAUDE.md §4 both need; write it once the real assertions below exist.
 *
 * Scaffolded in "module" mode — require a real shared module directly (the _clock.js shape).
 *
 * Until the TODOs below are filled in, this harness still PASSES — it carries
 * one trivial self-test proving its own plumbing works, and its TODO section
 * reports a partial skip (`~ SKIP`, never a fail) so `node _ship.js` stays
 * green while this is mid-build.
 *
 * Run:  node _kit.js
 * ---------------------------------------------------------------------------- */
var fs = require("fs"), path = require("path");

var checks = 0, fails = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}

console.log("\nVEILRUN · _kit.js — scaffolded harness\n" + "=".repeat(58));

// -- the trivial self-test. Always true; proves the harness plumbing works. --
ok("scaffold self-test — this harness runs and its plumbing works", true);

// -- TODO (mode: module) ------------------------------------------------------
// Point TARGET_MODULE at the real dependency-free module. No DOM and no game
// state to stub — a straight require() runs the actual thing, the same reason
// _clock.js needs no extraction step at all.
var TARGET_MODULE = path.join(__dirname, "TODO-path-to-module.js");

if (fs.existsSync(TARGET_MODULE)) {
  var mod = require(TARGET_MODULE);
  // TODO: exercise the real module and assert on its behaviour.
  ok("TODO — replace with a real assertion against the required module", !!mod);
} else {
  console.log("  ~ SKIP — TARGET_MODULE does not exist yet: " + TARGET_MODULE + " (fill in the TODO)");
}

console.log("\n" + (fails ? "FAIL — " + fails + " of " : "PASS — ") + checks + " checks");

// Computed fresh every run, never typed twice — see _new.js's header for why.
console.log("\n📋 CLAUDE.md §4 line to paste once the TODOs above are real assertions:");
console.log("`_kit.js` (added 2026-09-16, VR-185) — TODO: what it proves. **" + checks + " checks.**");

process.exit(fails ? 1 : 0);
