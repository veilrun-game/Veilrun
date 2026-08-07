/* VEILRUN — Rook Signal graph validator.
 * The CYOA equivalent of the pair-levels' Python physics sim: prove the story graph
 * before shipping. Walks EVERY companion selection × EVERY choice path and checks:
 *   1. no path dead-ends (every walk reaches a terminal ending)
 *   2. no orphan nodes (every non-ending node is reachable from START)
 *   3. every declared ending is reachable by some real path
 *   4. no choice points at a node that isn't the story's terminal 'resolve' but has 0 available choices
 * Run: node games/rook-signal/validate.js
 */
var S = require("./story.js");

var COMPANION_IDS = S.COMPANIONS.map(function (c) { return c.id; });

// All legal companion selections: 0, 1, or 2 distinct companions.
function companionSets() {
  var sets = [[]];
  for (var i = 0; i < COMPANION_IDS.length; i++) {
    sets.push([COMPANION_IDS[i]]);
    for (var j = i + 1; j < COMPANION_IDS.length; j++) sets.push([COMPANION_IDS[i], COMPANION_IDS[j]]);
  }
  return sets;
}

function clone(f) { return JSON.parse(JSON.stringify(f)); }

var visitedNodes = {};
var endingsHit = {};
var errors = [];
var pathCount = 0;
var MAX_PATHS = 500000;

function availableChoices(node, f) {
  return (node.choices || []).filter(function (ch) { return !ch.when || ch.when(f); });
}

function walk(nodeId, f, trail) {
  if (pathCount > MAX_PATHS) return;
  if (nodeId === "resolve") {
    var endId = S.resolve(f);
    if (!S.ENDINGS[endId]) { errors.push("resolve() returned unknown ending '" + endId + "' via " + trail.join(">")); return; }
    endingsHit[endId] = (endingsHit[endId] || 0) + 1;
    pathCount++;
    return;
  }
  var node = S.NODES[nodeId];
  if (!node) { errors.push("missing node '" + nodeId + "' via " + trail.join(">")); return; }
  visitedNodes[nodeId] = true;

  if (node.ending) { endingsHit[nodeId] = (endingsHit[nodeId] || 0) + 1; pathCount++; return; }

  var choices = availableChoices(node, f);
  if (choices.length === 0) { errors.push("dead-end at node '" + nodeId + "' (no available choices) via " + trail.join(">") + " companions=[" + f.companions + "]"); return; }

  choices.forEach(function (ch) {
    var nf = clone(f);
    // re-bind functions lost by clone: effects operate on plain data only, so fine.
    if (ch.effect) ch.effect(nf);
    walk(ch.to, nf, trail.concat(nodeId));
  });
}

companionSets().forEach(function (set) {
  walk(S.START, S.newFlags(set), []);
});

// ---- checks ----
// orphan nodes
Object.keys(S.NODES).forEach(function (id) {
  if (!S.NODES[id].ending && !visitedNodes[id]) errors.push("orphan node never reached: '" + id + "'");
});
// endings reachable
S.ENDING_IDS.forEach(function (e) {
  if (!endingsHit[e]) errors.push("ending never reachable by any path: '" + e + "'");
});

// ---- report ----
console.log("Rook Signal — graph validation");
console.log("  companion selections tested: " + companionSets().length);
console.log("  full paths walked:           " + pathCount);
console.log("  nodes reached:               " + Object.keys(visitedNodes).length + " / " + Object.keys(S.NODES).filter(function (id) { return !S.NODES[id].ending; }).length + " non-ending");
console.log("  endings hit:");
S.ENDING_IDS.forEach(function (e) {
  console.log("    " + (endingsHit[e] ? "✓" : "✗") + " " + e + " — " + (endingsHit[e] || 0) + " paths");
});

if (errors.length) {
  console.log("\nFAILED (" + errors.length + "):");
  errors.slice(0, 30).forEach(function (e) { console.log("  - " + e); });
  process.exit(1);
} else {
  console.log("\nPASS — no dead ends, no orphans, all endings reachable.");
}
