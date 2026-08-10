/* VEILRUN — site manifest check (VR-94).
 * VEILRUN.games in js/data.js is now the single source of truth for everything
 * playable: what the games index lists, what the Play button opens, and which
 * game_id each leaderboard reads. That makes it the one file where a typo is
 * silently expensive — a renamed level id orphans a board, a wrong play path
 * ships a dead button. This proves the manifest against the actual repo.
 *
 * No dependencies — run it with: node _check.js
 */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = __dirname;
var ctx = vm.createContext({});
ctx.window = ctx; ctx.globalThis = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), ctx, { filename: "js/data.js" });
var D = ctx.VEILRUN;

var errors = [], warnings = [], counts = { games: 0, versions: 0, combos: 0, levels: 0 };
function err(m) { errors.push(m); }
function warn(m) { warnings.push(m); }

/* ---- 1. shape + uniqueness ---------------------------------------------- */
var seenLevel = {}, seenGame = {};
(D.games || []).forEach(function (g) {
  counts.games++;
  if (seenGame[g.id]) err("duplicate game id: " + g.id);
  seenGame[g.id] = true;
  ["name", "status", "chars", "scoreKind", "short", "text"].forEach(function (k) {
    if (!g[k]) err(g.id + ": missing " + k);
  });
  if (["time", "points"].indexOf(g.scoreKind) === -1) err(g.id + ": scoreKind must be time|points, got " + g.scoreKind);
  if (!(g.howToPlay || []).length) err(g.id + ": no howToPlay — the game page renders an empty panel");
  if (!(g.versions || []).length) return err(g.id + ": no versions");

  // Controls: at least one version must carry them (others inherit).
  if (!g.versions.some(function (v) { return (v.controls || []).length; }))
    err(g.id + ": no version declares controls");

  // Key art must actually exist, or the index card and page hero both break.
  if (!g.art) warn(g.id + ": no key art set");
  else if (!fs.existsSync(path.join(ROOT, g.art))) err(g.id + ": key art missing on disk — " + g.art);

  g.versions.forEach(function (v, vi) {
    counts.versions++;
    if (!v.id || !v.label) err(g.id + ": version " + vi + " missing id/label");
    if (!(v.combos || []).length) err(g.id + "/" + v.id + ": no combos");
    // versions[0] is what the Play button opens by default — it must not be a preview.
    if (vi === 0 && /preview|legacy/i.test(v.label))
      err(g.id + ": default version is '" + v.label + "' — a preview/legacy build must never be the default");
    (v.combos || []).forEach(function (c) {
      counts.combos++;
      if (!c.play) return err(g.id + "/" + v.id + "/" + c.id + ": no play path");
      if (!fs.existsSync(path.join(ROOT, c.play)))
        err(g.id + "/" + v.id + "/" + c.id + ": play path does not exist — " + c.play);
      if (!(c.levels || []).length) err(g.id + "/" + v.id + "/" + c.id + ": no levels");
      (c.levels || []).forEach(function (l) {
        counts.levels++;
        if (!l.id || !l.label) return err(g.id + "/" + v.id + "/" + c.id + ": level missing id/label");
        // A level id IS the game_scores game_id. Two levels sharing one merges their boards.
        if (seenLevel[l.id]) err("duplicate level id '" + l.id + "' (" + seenLevel[l.id] + " and " + g.id + "/" + v.id + "/" + c.id + ") — these share a leaderboard");
        seenLevel[l.id] = g.id + "/" + v.id + "/" + c.id;
      });
    });
  });
});

/* ---- 2. the updates feed tags resolve ------------------------------------ */
(D.updates || []).forEach(function (u, i) {
  (u.games || []).forEach(function (id) {
    if (!seenGame[id]) err("updates[" + i + "] (" + u.date + ") tagged with unknown game id: " + id);
  });
});
(D.games || []).forEach(function (g) {
  var n = (D.updates || []).filter(function (u) { return (u.games || []).indexOf(g.id) > -1; }).length;
  if (!n) warn(g.id + ": no update tagged to it — its changelog will be empty");
});

/* ---- 3. no playable build left behind in VEILRUN.modes ------------------- */
(D.modes || []).forEach(function (m) {
  if (m.combos || m.boardTree || m.play)
    err("VEILRUN.modes still carries a playable build: " + m.id + " — it belongs in VEILRUN.games");
});

/* ---- 4. the per-game versions.js files agree with the manifest ----------- */
/* Each pair-level build ships a versions.js so its title screen can offer a
   version dropdown. That list restates the manifest, so it can drift. Until the
   games read the version from the URL param, this check is what keeps them honest. */
var pair = (D.games || []).filter(function (g) { return g.id === "pair-levels"; })[0];
if (pair) {
  fs.readdirSync(path.join(ROOT, "games")).forEach(function (dir) {
    var vf = path.join(ROOT, "games", dir, "versions.js");
    if (!fs.existsSync(vf)) return;
    var vctx = vm.createContext({}); vctx.window = vctx; vctx.document = { getElementById: function () { return null; } };
    try { vm.runInContext(fs.readFileSync(vf, "utf8"), vctx, { filename: vf }); }
    catch (e) { return err("games/" + dir + "/versions.js does not run: " + e.message); }
    (vctx.VR_VERSIONS || []).forEach(function (v) {
      var url = v.url.replace(/^\//, "");
      var known = pair.versions.some(function (mv) {
        return mv.combos.some(function (c) { return c.play === url; });
      });
      if (!known) err("games/" + dir + "/versions.js points at " + v.url + ", which is not in the manifest");
      if (!fs.existsSync(path.join(ROOT, url))) err("games/" + dir + "/versions.js points at a missing file: " + v.url);
    });
  });
}

/* ---- report -------------------------------------------------------------- */
console.log("VEILRUN manifest check");
console.log("  games " + counts.games + " · versions " + counts.versions +
            " · combos " + counts.combos + " · levels/game_ids " + counts.levels);
warnings.forEach(function (w) { console.log("  ! " + w); });
if (errors.length) {
  console.log("\nFAILED (" + errors.length + "):");
  errors.forEach(function (e) { console.log("  - " + e); });
  process.exit(1);
}
console.log("\nPASS — manifest complete, every play path and level id resolves.");
