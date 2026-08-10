/* VEILRUN — Rook Signal boot/param check (VR-94).
 * Two jobs, both cheap and both things that have broken before:
 *   1. syntax-check the inline <script> (the file has no build step, so a typo
 *      only shows up as a blank page in a browser)
 *   2. exercise bootFromParams() — the URL-param contract the site relies on —
 *      against the REAL function text lifted out of index.html, with the DOM
 *      collaborators stubbed. If the site passes ?char=/&crew= and this drifts,
 *      the game silently falls back to its own picker and the game page starts
 *      lying about what Play will do.
 * Run: node games/rook-signal/_check.js
 */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
var S = require("./story.js");
var errors = [];

/* ---- 1. syntax ---------------------------------------------------------- */
var inline = HTML.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);
if (!inline) { console.log("FAILED: no inline <script> found"); process.exit(1); }
try { new vm.Script(inline[1], { filename: "rook-signal inline <script>" }); }
catch (e) { errors.push("inline script does not parse: " + e.message); }

/* ---- 2. the boot contract ----------------------------------------------- */
// Lift the real function body rather than restating it, so this test can't pass
// against a version of the logic that no longer ships.
var fnMatch = inline[1].match(/function bootFromParams\(\)\{[\s\S]*?\n  \}/);
if (!fnMatch) errors.push("bootFromParams() not found in index.html — did it get renamed?");

var CREW_LIVE = ["rook"]; // mirrors the `live:true` entries in index.html's CREW

function run(search) {
  var ctx = {
    location: { search: search },
    URLSearchParams: URLSearchParams,
    S: S,
    CREW: [{ id: "rook", live: true }, { id: "vesper" }, { id: "latch" }, { id: "wren" },
           { id: "magpie" }, { id: "anvil" }, { id: "cinder" }, { id: "temper" },
           { id: "citrine" }, { id: "babel" }],
    picked: null,
    shown: null
  };
  ctx.screenCompanions = function () { ctx.shown = "companions"; };
  vm.createContext(ctx);
  vm.runInContext(fnMatch[0] + "\n; __r = bootFromParams();", ctx);
  return { handled: ctx.__r, picked: ctx.picked, shown: ctx.shown };
}

function check(name, cond, detail) { if (!cond) errors.push(name + (detail ? " — " + detail : "")); }

if (fnMatch) {
  var r;

  r = run("");
  check("no params falls through to the internal picker", r.handled === false && r.shown === null);

  r = run("?char=rook");
  check("?char=rook skips the character grid", r.handled === true && r.shown === "companions");
  check("?char=rook starts with an empty crew", r.picked && r.picked.length === 0,
    "got " + JSON.stringify(r.picked));

  r = run("?char=ROOK");
  check("char is case-insensitive", r.handled === true);

  r = run("?char=vesper");
  check("a not-yet-playable character falls back to the picker", r.handled === false,
    "vesper has no chapter — must not skip the grid");

  r = run("?char=nobody");
  check("an unknown character falls back to the picker", r.handled === false);

  r = run("?char=rook&crew=vesper,magpie");
  check("crew pre-ticks both companions", r.handled === true && r.picked.join(",") === "vesper,magpie",
    "got " + JSON.stringify(r.picked));

  r = run("?char=rook&crew=vesper,magpie,anvil,latch");
  check("crew is capped at the same 2 the toggle enforces", r.picked.length === 2,
    "got " + JSON.stringify(r.picked));

  r = run("?char=rook&crew=gandalf,vesper");
  check("unknown companion ids are dropped, not passed through", r.picked.join(",") === "vesper",
    "got " + JSON.stringify(r.picked));

  r = run("?char=rook&crew=");
  check("an empty crew param means solo, not broken", r.handled === true && r.picked.length === 0,
    "got " + JSON.stringify(r.picked));

  r = run("?char=rook&crew=%20vesper%20");
  check("whitespace around a companion id is tolerated", r.picked.join(",") === "vesper",
    "got " + JSON.stringify(r.picked));
}

/* ---- report -------------------------------------------------------------- */
if (errors.length) {
  console.log("FAILED (" + errors.length + "):");
  errors.forEach(function (e) { console.log("  - " + e); });
  process.exit(1);
}
console.log("PASS — inline script parses; boot params handled, and no-param fallback intact.");
