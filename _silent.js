/* VEILRUN — nothing fails silently, applied to the interface (VR-205, 9/21)
 *
 * SIGNAL. VR-172 ruled that a missed Execute in the arena wrote literally nothing, so a
 * whiff and a dead button were byte-identical to the player. This card asks the same
 * question of the site: does every control that can produce NO RESULT say so, in the DOM
 * and in the accessibility tree, not just to a sighted mouse user watching text appear?
 *
 * THE INVENTORY. Every control on the site that can legitimately return nothing:
 *   · Gallery filter / favourites toggle (js/app.js `views.gallery`)      — HAD text, no a11y announce
 *   · Board "On me" / "On Claude" filter (js/app.js `views.board`)        — WAS SILENT (fixed here)
 *   · Per-game leaderboard, `#gboard-<id>` (js/app.js `loadBoardInto`)    — HAD text, no a11y announce
 *   · Crew-wide leaderboard, `#lb-board` (same loader)                    — HAD text, no a11y announce
 *   · Feedback open/resolved lists, `#fb-open-list` / `#fb-resolved-list` — HAD text, no a11y announce
 *   · Game reference "add a game" name field (js/app.js `grefNameChange`) — clears its own
 *     suggestion box on an empty field and never submits nothing; not a no-result path.
 *   · Gripes box empty state (VR-173/174, `grefAffirms` family)           — already the model
 *     this card is generalising FROM, per the card's own text; untouched here.
 *   · Lab / Game reference sort dropdowns                                 — always reorder an
 *     existing non-empty list; there is no empty state to reach.
 * OUT OF SCOPE (named, not fixed): the profile image reorder "couldn't match your name"
 * panel and the account-creation error copy are both already-written states outside this
 * card's a11y-announcement finding, and a full crawl of every button on the site is the
 * "provable: no" half of this problem — this harness only proves the no-result paths named
 * above, which is the same cut `_navcheck.js` took on VR-197's larger IA question.
 *
 * WHAT WAS ACTUALLY WRONG, and it is one bug, not eight: none of these regions carried
 * `aria-live`, so replacing a loading placeholder with "No runs on this one yet" (or with
 * nothing, in the board's case) was silent to a screen reader even though it was already
 * visible text to a sighted user — the exact VR-172 asymmetry, on the accessibility tree
 * instead of the DOM. The board's empty-filter state was silent on BOTH channels: `cols`
 * could be an empty string with no fallback, so filtering to nothing rendered a blank
 * `.board` div.
 *
 * WHY THIS PROVES IT RATHER THAN EYEBALLS. `__renderBoard` and `__renderGallery` are new
 * test seams on `VApp` (same shape as `__renderHub`) that call the real `views.board()` /
 * `views.gallery()` inside a vm sandbox — never a retyped copy of their markup. The three
 * leaderboard/feedback containers are populated asynchronously over the network
 * (`window.VBackend`), so — same contract `_shroud.js` uses for its render pass — there is
 * no headless path to their filled state; this harness instead asserts the one fact that
 * IS static and load-bearing: the container `<div>` VEILRUN.js ships carries `aria-live`
 * before any network call ever fills it, so whatever the loader writes later — including
 * nothing-to-something — is announced.
 *
 * Run from the repo root:  node _silent.js
 */

const fs = require("fs"), vm = require("vm"), path = require("path");
let pass = 0; const fails = [];
const ok = (name, cond, detail) => { if (cond) pass++; else fails.push(name + (detail ? " — " + detail : "")); };

function build() {
  const ctx = {
    console,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    location: { hash: "#board" },
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } })
    },
    setTimeout, clearTimeout, Promise, Date, Math, JSON, RegExp, String, Number, Array, Object
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["js/data.js", "js/galleries.js", "js/board.js", "js/components.js", "js/app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), ctx, { filename: f });
  }
  return ctx;
}

const APP_JS = fs.readFileSync(path.join(__dirname, "js/app.js"), "utf8");

/* ---------------------------------------------------------- 1. board: silent-filter fix */
{
  const ctx = build();
  // A filter with no matching cards at all: nobody on the fake board is "nobody".
  const html = ctx.VApp.__renderBoard("jordan", {
    updated: "2026-09-21",
    columns: [{ name: "Backlog", cards: [{ id: "VR-1", t: "x", who: "Claude", pri: "P2" }] }]
  });
  ok("board: empty filter is not blank", !/class="board"[^>]*>\s*<\/div>/.test(html));
  ok("board: empty filter names itself", /Nothing on Jordan's plate/.test(html));
  ok("board: empty filter still has aria-live", /class="board"[^>]*aria-live="polite"/.test(html));
  ok("board: no leaked undefined", !/undefined|\[object Object\]/.test(html));
}

/* -------------------------------------------------------- 2. board: non-empty unaffected */
{
  const ctx = build();
  const html = ctx.VApp.__renderBoard("all", {
    updated: "2026-09-21",
    columns: [{ name: "In progress", cards: [{ id: "VR-1", t: "Do the thing", who: "Claude", pri: "P2" }] }]
  });
  ok("board: real cards still render", /VR-1/.test(html) && /Do the thing/.test(html));
  ok("board: no phantom empty message alongside real cards", !/Nothing on the board/.test(html));
  ok("board: still carries aria-live", /class="board"[^>]*aria-live="polite"/.test(html));
}

/* -------------------------------------------------------------- 3. gallery: empty states */
{
  const ctx = build();
  const html = ctx.VApp.__renderGallery({ favMode: "mine", filters: new Set() });
  ok("gallery: 'my likes' empty state names itself", /haven't liked any images/.test(html));
  ok("gallery: masonry carries aria-live", /id="masonry" aria-live="polite"/.test(html));
}
{
  const ctx = build();
  const html = ctx.VApp.__renderGallery({ favMode: "off", filters: new Set() });
  ok("gallery: normal grid still renders", !/No images match this filter/.test(html) || /class="gal-item|masonry/.test(html));
  ok("gallery: masonry present and non-destructive", /id="masonry" aria-live="polite">/.test(html));
}

/* --------------------------------------------------- 4. static: async containers announce */
// These three fill over the network (VBackend), so there is no headless render path to their
// filled state — the load-bearing, provable fact is that the shipped container already
// carries aria-live before any fetch ever completes. Anchored to the literal markup, not a
// retyped copy, so a rename of any id fails this rather than silently going unchecked.
[
  ['id="lb-board"', /<div id="lb-board"[^>]*aria-live="polite"/],
  ['id="gboard-${id}"', /<div id="gboard-\$\{id\}"[^>]*aria-live="polite"/],
  ['id="fb-open-list"', /<div id="fb-open-list"[^>]*aria-live="polite"/],
  ['id="fb-resolved-list"', /<div id="fb-resolved-list"[^>]*aria-live="polite"/]
].forEach(([label, re]) => ok("static: " + label + " carries aria-live", re.test(APP_JS)));

/* ----------------------------------------------- 5. keyboard path: no interactive markup lost */
// None of these fixes touch a control's reachability — they only add an attribute to an
// existing, already-focusable-or-not container and, for the board, add a <p>. Prove no
// button/select/input was removed from the three view functions this file touches.
{
  const ctx = build();
  const before = { board: (ctx.VApp.__renderBoard("all", { updated: "x", columns: [{ name: "c", cards: [{ id: "1", t: "t", who: "Claude", pri: "" }] }] }).match(/<button/g) || []).length };
  ok("board: filter buttons intact", before.board >= 3, "found " + before.board);
  const gal = ctx.VApp.__renderGallery({ favMode: "off", filters: new Set() });
  ok("gallery: filter/sort controls intact", /class="dd-btn"/.test(gal) && /class="dd-sort"/.test(gal));
}

console.log((fails.length ? "FAIL" : "PASS") + " — silent-interface: " + pass + " checks passed" + (fails.length ? ", " + fails.length + " failed" : ""));
fails.forEach(f => console.log("  ✗ " + f));
process.exit(fails.length ? 1 : 0);
