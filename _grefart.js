/* VEILRUN — game reference cover resolver (VR-107).
 *
 * Reports which catalogue entries still have no cover, and resolves Steam appids for the
 * ones that can have one. Read-only by default: it prints a report and a paste-ready
 * `steam:` line per confident match, and writes NOTHING unless you pass --write.
 *
 * WHY IT ASKS RATHER THAN GUESSES
 * -------------------------------
 * The 8/16 pass seeded 28 appids by hand and verified every one against the store first.
 * That was not caution for its own sake: SIX of the ids recalled from memory pointed at a
 * completely different game — `orcsmustdie` at Shredder's Revenge, `goatsimulator3` at
 * Lunacid, `tonyhawkproskater` at an adult visual novel. A missing cover renders as the
 * typographic tile and reads as designed. A WRONG cover reads as a bug and, on the Tony
 * Hawk example, as something worse. So the rule here is the same one the dedupe matcher
 * follows: an exact hit is taken, anything short of one is REPORTED, never written.
 *
 *   node _grefart.js              # report only
 *   node _grefart.js --write      # apply the exact matches to js/data.js
 *   node _grefart.js --download   # also fetch capsules to assets/gameref/<slug>.webp
 *
 * No API key. Steam's storefront search is public; --download additionally needs `cwebp`
 * (the same encode the gallery uses: -q 85 -m 6).
 */
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var https = require("https");

var ROOT = __dirname;
var WRITE = process.argv.indexOf("--write") !== -1;
var DOWNLOAD = process.argv.indexOf("--download") !== -1;

/* ---- read the catalogue without a browser ------------------------------- */
var ctx = vm.createContext({});
ctx.window = ctx; ctx.globalThis = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), ctx, { filename: "js/data.js" });
var refs = ctx.VEILRUN.gameRefs || {};

/* Games that are not on Steam and never will be. Listing them explicitly is the point:
   without this, every run re-reports them as "unresolved" and the report trains you to
   ignore it. A tile is the FINAL answer for these, not a gap. */
var NOT_ON_STEAM = {
  mariokart: "Nintendo platform exclusive",
  fortnite: "Epic Games Store only",
  leagueoflegends: "Riot client only",
  callofduty: "Battle.net / series entry, no single canonical appid",
  callofdutyzombies: "mode within the series, not a standalone app",
  theclassroom: "browser game",
  highguard: "delisted — shut down 12 Mar 2026",
  spellbreak: "delisted — servers closed"
};

function get(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { "User-Agent": "veilrun-grefart/1.0" } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); return resolve(get(res.headers.location));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode + " " + url)); }
      var chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () { resolve(Buffer.concat(chunks)); });
    }).on("error", reject);
  });
}

var bare = function (s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };

/* Steam's own storefront search. Returns [{appid, name}]. */
async function search(name) {
  var url = "https://steamcommunity.com/actions/SearchApps/" + encodeURIComponent(name);
  try { return JSON.parse((await get(url)).toString("utf8")); } catch (e) { return []; }
}

/* EXACT means the normalised names match, or the candidate name starts with ours (so
   "Sea of Thieves" accepts "Sea of Thieves: 2026 Edition" — same game, reissued). Anything
   else is a suggestion for a human, and is printed rather than applied. */
function classify(want, cands) {
  var w = bare(want);
  for (var i = 0; i < cands.length; i++) {
    var c = bare(cands[i].name);
    if (c === w || c.indexOf(w) === 0 || w.indexOf(c) === 0) return { kind: "exact", hit: cands[i] };
  }
  return cands.length ? { kind: "near", hit: cands[0], all: cands.slice(0, 4) } : { kind: "none" };
}

(async function main() {
  var slugs = Object.keys(refs);
  var haveLocal = [], haveSteam = [], skipped = [], exact = [], near = [], none = [];

  for (var i = 0; i < slugs.length; i++) {
    var slug = slugs[i], g = refs[slug];
    if (fs.existsSync(path.join(ROOT, "assets/gameref", slug + ".webp"))) { haveLocal.push(slug); continue; }
    if (g.steam) { haveSteam.push(slug); continue; }
    if (NOT_ON_STEAM[slug]) { skipped.push(slug); continue; }

    var res = classify(g.name, await search(g.name));
    if (res.kind === "exact") exact.push({ slug: slug, name: g.name, hit: res.hit });
    else if (res.kind === "near") near.push({ slug: slug, name: g.name, all: res.all });
    else none.push({ slug: slug, name: g.name });
    await new Promise(function (r) { setTimeout(r, 350); });   // be a good citizen
  }

  console.log("VEILRUN game-reference cover report\n");
  console.log("  " + haveLocal.length + " local webp on disk (highest tier, always wins)");
  console.log("  " + haveSteam.length + " resolved to a verified Steam capsule");
  console.log("  " + skipped.length + " not on Steam by nature — the tile is the final answer");
  console.log("  " + exact.length + " newly resolved exactly");
  console.log("  " + near.length + " need a human — reported, NOT written");
  console.log("  " + none.length + " no result at all\n");

  if (exact.length) {
    console.log("EXACT — safe to apply:");
    exact.forEach(function (e) { console.log("  " + e.slug + "  →  " + e.hit.appid + "  (" + e.hit.name + ")"); });
    console.log("");
  }
  if (near.length) {
    console.log("AMBIGUOUS — pick one by hand, or leave the tile:");
    near.forEach(function (e) {
      console.log("  " + e.slug + "  (" + e.name + ")");
      e.all.forEach(function (c) { console.log("      " + c.appid + "  " + c.name); });
    });
    console.log("");
  }
  if (none.length) {
    console.log("NO RESULT — probably not on Steam; consider adding to NOT_ON_STEAM:");
    none.forEach(function (e) { console.log("  " + e.slug + "  (" + e.name + ")"); });
    console.log("");
  }

  if (WRITE && exact.length) {
    var p = path.join(ROOT, "js/data.js");
    var src = fs.readFileSync(p, "utf8");
    exact.forEach(function (e) {
      var re = new RegExp("^(  " + e.slug + ": \\{.*?)( \\},)$", "m");
      src = src.replace(re, function (_, head, tail) { return head + ", steam: " + e.hit.appid + tail; });
    });
    fs.writeFileSync(p, src);
    console.log("Wrote " + exact.length + " appids into js/data.js. Re-run node _grefcheck.js.");
  } else if (exact.length) {
    console.log("Report only. Re-run with --write to apply the exact matches.");
  }

  if (DOWNLOAD) {
    var out = path.join(ROOT, "assets/gameref");
    var all = haveSteam.map(function (s) { return { slug: s, appid: refs[s].steam }; })
      .concat(exact.map(function (e) { return { slug: e.slug, appid: e.hit.appid }; }));
    for (var j = 0; j < all.length; j++) {
      var f = path.join(out, all[j].slug + ".webp");
      if (fs.existsSync(f)) continue;
      try {
        var jpg = await get("https://cdn.cloudflare.steamstatic.com/steam/apps/" + all[j].appid + "/header.jpg");
        var tmp = path.join(out, "." + all[j].slug + ".jpg");
        fs.writeFileSync(tmp, jpg);
        require("child_process").execSync("cwebp -q 85 -m 6 " + JSON.stringify(tmp) + " -o " + JSON.stringify(f), { stdio: "ignore" });
        fs.unlinkSync(tmp);
        console.log("  saved assets/gameref/" + all[j].slug + ".webp");
      } catch (err) {
        console.log("  SKIP " + all[j].slug + " — " + err.message);
      }
    }
  }
})();
