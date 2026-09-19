/* VEILRUN — audience-archetypes doc structure check (VR-208, 9/15).
 *
 * WHY THIS EXISTS. VR-208 asks for one audience archetype per genre (2D pair,
 * 3D arena, narrative), each naming what that player wants, what makes them
 * leave, and what brings them back, each marked hypothesis-or-evidenced with
 * evidence named when evidenced, written to `_Project Knowledge/` and never
 * this repo. The card is tagged `provable: no`, and it is RIGHT about the
 * only question that actually matters: no harness can tell a true archetype
 * from a plausible one. That is not what this file does.
 *
 * WHAT THIS DOES CHECK is the part of DONE WHEN that is structural rather
 * than evaluative — schema and completeness, not truth:
 *   1. exactly 3 entries (one per genre, not one per game)
 *   2. no duplicate / empty headings
 *   3. no heading is actually a specific game or combo id — checked against
 *      the REAL `VEILRUN.games` manifest in js/data.js, not a guessed list
 *   4/5/6. each entry names Wants / Leaves / Returns, non-empty, non-placeholder
 *   7. each entry's Status is exactly "hypothesis" or "evidenced"
 *   8. "evidenced" entries carry a non-empty, non-placeholder Evidence field
 *   9. no .md file whose name contains "archetype" is tracked, staged or
 *      sitting untracked-unignored in THIS repo (DONE WHEN #4 — the doc
 *      belongs in `_Project Knowledge/`, never here; mirrors _leakcheck.js's
 *      two-set scan; scoped to .md so this harness's own filename —
 *      `_archetypes.js` — does not flag itself)
 *
 * WHAT THIS DELIBERATELY DOES NOT CHECK. "Each marked hypothesis or
 * evidenced" is a presence/format rule — this harness cannot and does not
 * judge whether the mark is the RIGHT one, whether the archetype itself is
 * accurate, or whether "RETURN's candidates re-scored against them" (DONE
 * WHEN #5) actually happened in good faith. Those are Jordan's / the
 * Council's calls, not a harness's.
 *
 * THE ##/"Key:" DELIMITER SYNTAX IS A CHOSEN CONVENTION, NOT A SOURCED
 * NUMBER. The four field names (Wants/Leaves/Returns/Status/Evidence) are
 * quoted straight out of VR-208's DONE WHEN text (Trello, ratified by
 * Jordan 9/14) — that part has provenance. The markdown delimiter itself
 * (`## <genre>` headings, `**Key:** value` lines) does not; it is this
 * harness's proposal for how to make an unwritten doc machine-parseable,
 * and it is expected to be revisited once the doc actually exists and
 * someone other than this harness has an opinion about its shape.
 *
 * THE DOC DOES NOT EXIST YET. Every fixture below is invented for the gate
 * and the mutation pass — never asserted as fact about the reference, only
 * used to prove the validator rejects what it should. Checks 1–8 run purely
 * against these embedded fixtures and need no mount. Check 9 runs against
 * the real repo every time. Once a real doc lands at `_Project Knowledge/`
 * (an .md file matching /archetype/i, case-insensitive) this harness picks
 * it up automatically and validates it for real; until then it SKIPS that
 * one part, loudly, and says so.
 *
 * No dependencies. Run: node _archetypes.js
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = __dirname;
var HOME = process.env.HOME || "";

/* ── Part 1: where the doc will live, and the real game/combo ids ────────── */

var DOC_CANDIDATES = [
  path.join(HOME, "Desktop/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(HOME, "Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(HOME, "Documents/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(ROOT, "../Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(HOME, "mnt/Claude Access/Games/Veilrun/_Project Knowledge"),
  path.join(ROOT, "../../Claude Access/Games/Veilrun/_Project Knowledge")
];

function findCanonDir() {
  for (var i = 0; i < DOC_CANDIDATES.length; i++) {
    try { if (fs.statSync(DOC_CANDIDATES[i]).isDirectory()) return DOC_CANDIDATES[i]; } catch (e) {}
  }
  return null;
}

function findArchetypeDoc(dir) {
  if (!dir) return null;
  var files;
  try { files = fs.readdirSync(dir); } catch (e) { return null; }
  var hits = files.filter(function (f) { return /archetype/i.test(f) && /\.md$/i.test(f); });
  if (hits.length === 1) return { path: path.join(dir, hits[0]) };
  if (hits.length > 1) return { ambiguous: hits };
  return null;
}

/* Real ids/labels out of the marked `VEILRUN.games = [ ... ]` array in
   js/data.js — never retyped. Bracket-depth walk to find the real close,
   same discipline as the other extractors in this repo. Exits loudly (2)
   if the anchor moves, per CLAUDE.md §4's convention for every extractor
   that reads a real source. */
function knownGameNames() {
  var file = path.join(ROOT, "js/data.js");
  var text;
  try { text = fs.readFileSync(file, "utf8"); } catch (e) {
    console.log("FATAL — cannot read js/data.js: " + e.message);
    process.exit(2);
  }
  var start = text.indexOf("VEILRUN.games = [");
  if (start === -1) {
    console.log("FATAL — `VEILRUN.games = [` anchor not found in js/data.js.");
    console.log("        The manifest moved; this harness cannot verify \"per genre, not");
    console.log("        per game\" without it. Exiting loudly rather than skipping quietly.");
    process.exit(2);
  }
  var depth = 0, end = -1;
  for (var i = start; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) {
    console.log("FATAL — `VEILRUN.games = [` never closes. Anchor moved or file truncated.");
    process.exit(2);
  }
  var block = text.slice(start, end);
  var names = {};
  var re = /\b(?:id|label)\s*:\s*"([^"]+)"/g, m;
  while ((m = re.exec(block)) !== null) names[m[1].trim().toLowerCase()] = true;
  return Object.keys(names);
}

/* ── Part 2: the schema ───────────────────────────────────────────────────
   Field names sourced from VR-208's own DONE WHEN text (ratified 9/14).
   Delimiter syntax is this harness's own proposal — see header. */

var PLACEHOLDER = { "n/a": 1, "na": 1, "tbd": 1, "todo": 1, "none": 1, "-": 1, "unknown": 1, "???": 1, "": 1 };

function isPlaceholder(v) {
  return !!PLACEHOLDER[String(v || "").trim().toLowerCase().replace(/[.!]+$/, "")];
}

function parseSections(text) {
  var re = /^##\s+(.+?)\s*$/gm;
  var marks = [], m;
  while ((m = re.exec(text)) !== null) marks.push({ heading: m[1].trim(), index: m.index, end: m.index + m[0].length });
  return marks.map(function (mk, i) {
    var bodyEnd = (i + 1 < marks.length) ? marks[i + 1].index : text.length;
    return { heading: mk.heading, fields: extractFields(text.slice(mk.end, bodyEnd)) };
  });
}

function extractFields(body) {
  var fields = {};
  var re = /^[ \t]*\*{0,2}(Wants|Leaves|Returns|Status|Evidence)\*{0,2}[ \t]*:[ \t]*\*{0,2}[ \t]*(.*)$/gim, m;
  while ((m = re.exec(body)) !== null) {
    var key = m[1].toLowerCase();
    if (!(key in fields)) fields[key] = m[2].replace(/\*+\s*$/, "").trim();
  }
  return fields;
}

/* `opts` disables one rule at a time — that's the mutation pass below,
   without forking the whole function per mutant. */
function validate(text, knownNames, opts) {
  opts = opts || {};
  var errs = [];
  var sections = parseSections(text);

  if (!opts.skipCount && sections.length !== 3) {
    errs.push("count: expected exactly 3 genre entries, found " + sections.length);
  }

  var seen = {};
  sections.forEach(function (s) {
    var h = s.heading.trim();

    if (!opts.skipDup) {
      if (!h) errs.push("entry has an empty heading");
      else if (seen[h.toLowerCase()]) errs.push("duplicate heading: \"" + h + "\"");
      seen[h.toLowerCase()] = true;
    }

    if (!opts.skipPerGame && knownNames.indexOf(h.toLowerCase()) !== -1) {
      errs.push("\"" + h + "\": heading matches a specific game/combo id from js/data.js, not a genre");
    }

    if (!opts.skipContent) {
      ["wants", "leaves", "returns"].forEach(function (key) {
        var v = s.fields[key];
        if (!v || isPlaceholder(v)) errs.push("\"" + h + "\": " + key + " is empty or a placeholder");
      });
    }

    if (!opts.skipStatus) {
      var status = (s.fields.status || "").trim().toLowerCase();
      if (status !== "hypothesis" && status !== "evidenced") {
        errs.push("\"" + h + "\": status must be \"hypothesis\" or \"evidenced\", found " + JSON.stringify(s.fields.status || ""));
      }
      if (!opts.skipEvidence && status === "evidenced") {
        var ev = s.fields.evidence;
        if (!ev || isPlaceholder(ev)) errs.push("\"" + h + "\": marked evidenced but evidence is empty/placeholder");
      }
    }
  });

  return { ok: errs.length === 0, errs: errs, sections: sections };
}

/* ── Part 3: location — DONE WHEN #4, "never this repo" ──────────────────
   Mirrors _leakcheck.js's two-set scan: tracked + untracked-unignored,
   because a file one `git add` away is one commit from published. The file
   list is injectable so the self-test below can prove both directions
   without needing a real bad file in the repo. */
function scanRepoForArchetypeDoc(overrideFiles) {
  var files;
  if (overrideFiles) {
    files = overrideFiles;
  } else {
    try {
      var tracked = cp.execSync("git ls-files -z", { cwd: ROOT, encoding: "utf8" });
      var untracked = cp.execSync("git ls-files --others --exclude-standard -z", { cwd: ROOT, encoding: "utf8" });
      files = (tracked + untracked).split("\0").filter(Boolean);
    } catch (e) {
      return { ok: null, note: "git unreadable: " + e.message };
    }
  }
  var hits = files.filter(function (f) {
    var b = path.basename(f);
    return /archetype/i.test(b) && /\.md$/i.test(b);
  });
  return { ok: hits.length === 0, hits: hits };
}

/* ── Fixtures — invented for the gate, never asserted as reference fact ── */

var GOOD_DOC = [
  "## 2D pair",
  "",
  "**Wants:** Fast co-op wins with a partner they already trust.",
  "**Leaves:** A level that only ever needed one of the two kits.",
  "**Returns:** A new combo pairing unlocked, or a faster split time to chase.",
  "**Status:** hypothesis",
  "**Evidence:** n/a — no dedicated 2D-pair playtest data yet.",
  "",
  "## 3D arena",
  "",
  "**Wants:** A single character that feels good to move before anything else.",
  "**Leaves:** A wave spike that reads as unfair rather than hard.",
  "**Returns:** A named milestone wave they haven't beaten yet.",
  "**Status:** evidenced",
  "**Evidence:** VR-98, 11 takes / 2 people — crew cites wave difficulty most often.",
  "",
  "## Narrative",
  "",
  "**Wants:** A story that visibly reacts to who they brought.",
  "**Leaves:** An ending that reads the same as one they already saw.",
  "**Returns:** A route they know they haven't unlocked yet.",
  "**Status:** hypothesis",
  "**Evidence:** n/a — Rook Signal is the only chapter live so far.",
  ""
].join("\n");

var BAD1_COUNT = GOOD_DOC.slice(0, GOOD_DOC.indexOf("## Narrative"));

var BAD2_DUPLICATE = GOOD_DOC.replace("## Narrative", "## 2D pair");

var BAD3_PERGAME = GOOD_DOC.replace("## Narrative", "## Cinder + Vesper");

var BAD4_WANTS = GOOD_DOC.replace(
  "**Wants:** Fast co-op wins with a partner they already trust.",
  "**Wants:**"
);

var BAD5_LEAVES = GOOD_DOC.replace(
  "**Leaves:** A level that only ever needed one of the two kits.",
  "**Leaves:**"
);

var BAD6_RETURNS = GOOD_DOC.replace(
  "**Returns:** A new combo pairing unlocked, or a faster split time to chase.",
  "**Returns:**"
);

var BAD7_STATUS = GOOD_DOC.replace("**Status:** hypothesis", "**Status:** confirmed");

var BAD8_EVIDENCE = GOOD_DOC.replace(
  "**Evidence:** VR-98, 11 takes / 2 people — crew cites wave difficulty most often.",
  "**Evidence:** n/a"
);

/* ── Run ───────────────────────────────────────────────────────────────── */

console.log("VEILRUN audience-archetypes doc structure check (VR-208)");
console.log("  checks structure/completeness only — truth-content is not, and cannot be, judged here.");

var KNOWN = knownGameNames();
console.log("  known game/combo ids pulled from js/data.js: " + KNOWN.length);
console.log("");

var checks = 0, fails = [];
function assertCheck(desc, cond) {
  checks++;
  if (!cond) fails.push(desc);
}

/* Gate: the good fixture validates clean. */
var rGood = validate(GOOD_DOC, KNOWN, {});
assertCheck("gate: well-formed fixture validates clean", rGood.ok && rGood.errs.length === 0);

/* Gate: each deliberately-bad fixture is rejected, for the right reason. */
var BADS = [
  { name: "count (2 entries instead of 3)", text: BAD1_COUNT, expect: /^count:/ },
  { name: "duplicate genre heading", text: BAD2_DUPLICATE, expect: /duplicate heading/ },
  { name: "heading is a specific game, not a genre", text: BAD3_PERGAME, expect: /matches a specific game\/combo id/ },
  { name: "empty Wants", text: BAD4_WANTS, expect: /wants is empty/ },
  { name: "empty Leaves", text: BAD5_LEAVES, expect: /leaves is empty/ },
  { name: "empty Returns", text: BAD6_RETURNS, expect: /returns is empty/ },
  { name: "invalid Status value", text: BAD7_STATUS, expect: /status must be/ },
  { name: "evidenced with placeholder Evidence", text: BAD8_EVIDENCE, expect: /marked evidenced but evidence/ }
];

BADS.forEach(function (b) {
  var r = validate(b.text, KNOWN, {});
  assertCheck("gate: rejects — " + b.name, !r.ok);
  assertCheck("gate: rejects — " + b.name + " (right reason)", r.errs.some(function (e) { return b.expect.test(e); }));
});

/* Mutation pass: weaken one rule at a time, confirm the fixture built to
   catch it now wrongly passes — proving the rule was load-bearing. */
var MUTANTS = [
  { name: "count check disabled", fixture: BAD1_COUNT, opts: { skipCount: true } },
  { name: "duplicate check disabled", fixture: BAD2_DUPLICATE, opts: { skipDup: true } },
  { name: "per-game check disabled", fixture: BAD3_PERGAME, opts: { skipPerGame: true } },
  { name: "content (Wants/Leaves/Returns) check disabled", fixture: BAD4_WANTS, opts: { skipContent: true } },
  { name: "status check disabled", fixture: BAD7_STATUS, opts: { skipStatus: true } },
  { name: "evidence-when-evidenced check disabled", fixture: BAD8_EVIDENCE, opts: { skipEvidence: true } }
];

var killed = 0;
MUTANTS.forEach(function (mu) {
  var baseline = validate(mu.fixture, KNOWN, {});
  var mutant = validate(mu.fixture, KNOWN, mu.opts);
  var caught = (!baseline.ok) && mutant.ok;
  assertCheck("mutant killed — " + mu.name, caught);
  if (caught) killed++;
});
console.log("  mutants: " + killed + "/" + MUTANTS.length + " killed (each weakened rule let its target fixture wrongly pass)");

/* Location gate: prove both directions before trusting the live scan. */
var cleanScan = scanRepoForArchetypeDoc(["README.md", "js/data.js", "games/proving-ground/index.html"]);
assertCheck("location gate: clean file list passes", cleanScan.ok === true);

var dirtyScan = scanRepoForArchetypeDoc(["README.md", "_Project Knowledge/Audience Archetypes.md"]);
assertCheck("location gate: a tracked archetype-named file is caught", dirtyScan.ok === false && dirtyScan.hits.length === 1);

/* The real, live check — DONE WHEN #4, right now, this repo. */
var realScan = scanRepoForArchetypeDoc(null);
if (realScan.ok === null) {
  console.log("  ~ SKIP — could not read git file list (" + realScan.note + ")");
} else {
  assertCheck("live repo: no archetype-named file tracked/staged/untracked (DONE WHEN #4)", realScan.ok === true);
  if (!realScan.ok) console.log("    found: " + realScan.hits.join(", "));
}

/* The real doc, if it exists yet. */
var canonDir = findCanonDir();
if (!canonDir) {
  console.log("  ~ SKIP — no `Claude Access` mount found; cannot check the real doc from here.");
} else {
  var found = findArchetypeDoc(canonDir);
  if (!found) {
    console.log("  ~ SKIP — no audience-archetypes doc exists yet at " + canonDir.replace(HOME, "~") +
                " (VR-208's own writing is not done). Schema self-tested against fixtures only.");
  } else if (found.ambiguous) {
    console.log("  ~ SKIP — more than one archetype-named file found, ambiguous: " + found.ambiguous.join(", "));
  } else {
    var real = fs.readFileSync(found.path, "utf8");
    var r = validate(real, KNOWN, {});
    assertCheck("real doc: structurally valid against VR-208's schema", r.ok);
    if (!r.ok) r.errs.forEach(function (e) { console.log("    " + e); });
  }
}

console.log("");
if (fails.length) {
  console.log("FAILED (" + fails.length + "):");
  fails.forEach(function (f) { console.log("  " + f); });
  console.log("\nFAIL — " + checks + " checks, " + fails.length + " failed. Do not ship.");
  process.exit(1);
}
console.log("PASS — " + checks + " checks");
