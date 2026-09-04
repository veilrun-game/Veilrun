# VEILRUN — orientation for Claude

Read this first. It exists so a fresh thread doesn't have to rediscover where things live.

---

## 1. The board is in Trello; the docs are NOT in this repo

**The Kanban lives in Trello: <https://trello.com/b/YIultiwd/veilrun>** — moved there
2026-08-16 and it is now the single source of truth for card state. `Planning/VEILRUN Kanban.md`
is a pointer stub; the pre-migration file is frozen at
`Games/Veilrun/Planning/archive/VEILRUN Kanban (archived 2026-08-16).md`. **Do not re-create
card state in a markdown file** — a second copy is exactly the drift §4's canon audit exists
to catch. Start on the board's **📌 Board guide** list.

The roadmaps, the GRDs and the canonical design docs live in a **separate folder called
`Claude Access`**, mounted alongside this repo. If it isn't mounted, ask for it before doing
anything else — most cards are unworkable without it.

| What | Path inside `Claude Access` |
|---|---|
| Roadmap, game modes, GRDs, kickoffs | `Games/Veilrun/Planning/` |
| **Canon docs** (`_Project Knowledge/`) | `Games/Veilrun/_Project Knowledge/` |
| Character Kits & Synergies — *the* source of truth | `Games/Veilrun/_Project Knowledge/Character Kits & Synergies.md` |
| Midjourney prompt ledger, silhouette prompts, asset recipes | `Games/Veilrun/Art & Assets/` |
| Raw Midjourney downloads | `Games/Veilrun/Art & Assets/assets/` |
| Lore | `Games/Veilrun/Lore & World/` |
| **Archived Kanban** (superseded by Trello) | `Games/Veilrun/Planning/archive/` |

> **`Claude Access` is the ONLY place canon docs are edited.** The repo folder
> `_Project Knowledge — see Claude Access/` is a pointer stub, exactly like
> `Art & Assets — see Claude Access/` — it is deliberately empty and must stay that way.
> **The canon docs must never be committed to this repo.** See §5's publishing note for why
> that is a rule and not a preference.
>
> **The copy in the Claude Project is DERIVED, and it is replaced rather than edited.** Project
> knowledge files cannot be edited in place — you delete and re-upload — so anything typed there
> is typed into a copy that the next refresh destroys. **Type in `Claude Access`; publish to the
> project.** If a doc in the project looks newer than the mount, that is a bug, not a source.
>
> **Why this is stated so bluntly (8/30):** all three surfaces had drifted, in both directions
> at once. The mount had a Loom section the project lacked; the project held an unratified world
> proposal that existed *nowhere else* and would have been destroyed by the first refresh;
> `Character Kits & Synergies` — the file this table calls *the* source of truth — spelled Rook
> **"Naz"** in one copy and **"Nas"** in the other. Reconciled on 8/30, with the pre-merge
> originals kept in `Claude Access` at `_Archive/pre-merge 2026-08-30/`.
>
> **That proposal is CONFIDENTIAL and is deliberately not named here.** See §5's confidential-lore
> rule; `_leakcheck.js` enforces it. This paragraph originally named it, on a page that is served
> publicly — which is precisely why the rule and the check now exist.

> **Mount-timing gotcha (this has burned a thread already):** the sandbox boots its mounts
> in the background. An `ls` of the mount root run in the first seconds of a session can
> come back showing only `outputs/` and `uploads/`. **That is not proof a folder is missing.**
> Re-check before concluding anything is absent.

Cards are referenced as `VR-##` — search that id in the Trello board. **A card's id is the
contract:** ids are cited across `_Project Knowledge/`, commit messages and this file, and
they did not change in the migration. **Never renumber one.** For pre-migration history,
grep the archived file. **A number cited in a commit subject is a claim on that number** —
VR-110 shipped in `c8576a9` with no card and nearly collided with the next one opened.
**It stopped being hypothetical on 8/22: `cece0e2` claimed VR-120 for the Game Reference clamp
while a Backlog card ("Vesper model fidelity") already held that number.** Resolved 8/23 on
Jordan's call: **the shipped card keeps VR-120 and the Backlog card became VR-128** — because the
commit is permanent and the card is not, so *the commit wins and the card moves*. That is the
general rule. Cited VR-120s written before 8/23 mean the Game Reference clamp.
**It happened again on 8/24** — `913abcb` shipped citing VR-135/136/137 while a *Prompt Forge* card
already held 135 and a *Community image forge* card held 136. Same rule applied: the commits kept the
numbers, the two cards became **VR-141** and **VR-142**. Twice in two days is a process failure, not bad
luck, so there is now a protocol.

**A third on 8/30, and its cause is different from the first two.** `d592e19` shipped *and pushed*
citing **VR-140** for the Proving Ground zoom work while the *Decisions* card had held VR-140 since
8/24. Rule applied unchanged: the commit kept 140, and Decisions became **VR-144**. But the first two
collisions happened because **nobody had claimed a number at all**; this one happened because a thread
**claimed one without reading the counter** — which still said VR-144 the whole time, six days after
140 was taken. **A register cannot defend a number from a thread that never opens it.** So the emphasis
in step 1 below is the entire protocol: the moment you decide to open a card IS the moment to read and
bump the counter, not a step you come back for.

### THE NUMBER PROTOCOL — follow it before opening any card or writing any `VR-##`

**The board's `📌 Board guide` list holds a card titled `🔢 NEXT CARD NUMBER → VR-###`. That title IS
the register.** It is a title and not a description on purpose: you can read the next free number off the
board without opening anything.

1. **CLAIM FIRST, WORK SECOND.** Read the counter card's title. That number is yours.
2. **Bump the counter IMMEDIATELY** — rename it to the next number *before* you create the card or write
   a line of code. A number you are 'about to use' is not claimed.
3. **Then** create the card, or write the commit subject.
4. **A commit subject may only cite a number that already exists as a card.** This is the actual root
   cause of both collisions: work shipped citing a number nobody had claimed on the board. If you are
   shipping something with no card, open the card first — it takes ten seconds and it is the whole fix.
5. **Claimed but abandoned? Leave the number burned.** Do not recycle it back into the counter. Gaps are
   free; collisions are not.
6. **If the counter is ever behind the real highest card** (someone opened one by hand), fix the counter
   to `highest + 1` and say so — do not assume the counter is right just because it exists.

**Why this beats 'check the board first':** checking is a scan of ~130 cards that a thread does once and
then trusts for the rest of a long session, while another thread ships. The counter is a single value
that gets *mutated on claim*, so two threads racing collide on the counter rather than silently on the
number.

**Three waiting states, and the distinction is who owns the next step:** `⏸️ Parked` = a
person (crew playtest, a vote, Jordan's call); `🚧 Blocked` = another card; `🔵 To do` =
nothing in the way. A blocked card carries `⛔ BLOCKED BY: VR-## (reason)` on the first line
of its description — **name the reason, not just the number**, so a later thread can tell a
live block from one that quietly expired. Kickoff prompts for individual cards live in
`Games/Veilrun/Planning/prompts/`.

---

## 2. House rules (non-negotiable)

- **Never run `git commit` or `git push`.** Jordan commits via GitHub Desktop. Deliver a
  commit message (subject + short bullet body) instead — and run `git status` + `git diff`
  first, scoping the message to *everything* uncommitted, not just the last change.
- **Never delete files — archive instead.** Ask before anything irreversible.
- **Every character is fully capable solo.** A pairing/trio unlocks a unique *enhancement*,
  never a dependency.
- **Big synergies drain the area thin — power has a price.** This is the balancing lever.

## 3. Ship checklist — required on every commit that changes a game / level / mechanic

Do these in the *same* changeset, then list which ones you touched in the hand-off
(e.g. `updates feed +1 · manifest v1 node · Trello VR-91 · docs folded`). Say "n/a"
explicitly rather than omitting an item.

1. **Updates feed** — new entry at the top of `VEILRUN.updates` in `js/data.js`, newest
   date, player-facing voice. Without it the release is invisible on the site.
2. **Leaderboard wiring** — the level's id is in the **`VEILRUN.games` manifest** in `js/data.js`
   under the right Version → Combo → `levels[]`. *(There is no separate `boardTree` array —
   VR-94 folded `combos` + `boardTree` + per-mode `play` links into one manifest on 8/9;
   `js/app.js` keeps a `boardTreeOf()` helper that just reads `game.versions`.)* A level's
   `id` IS the `game_id` in `game_scores` — never rename one without migrating the board.
3. **Play access** — confirm the exact path a player takes (combo `play` link and/or the
   in-game Version dropdown), and that a preview build isn't silently the default.
4. **Trello** — log/close the card on the board. *(Changed 8/16; this used to say
   "update `Planning/VEILRUN Kanban.md`".)*
5. **Canon docs** — fold durable decisions back into `_Project Knowledge/` **inside `Claude Access`**
   (§1), never into this repo. The item is easy to skip precisely because it is the one thing on
   this list that cannot ride along in the changeset — so say which file you edited in the
   hand-off, or say "n/a" and mean it. `_docscheck.js` reports what a commit claimed and the docs
   never mention, and it can only see the docs when the mount is there.

### DELEGATE THIS CHECKLIST — do not walk it from memory (VR-159, 9/4)

**Before any hand-off on a changeset touching `games/`, `js/data.js` or the site shell, delegate to
the `release-steward` subagent** (`.claude/agents/release-steward.md`). It runs `_ship.js`, walks the
five items above against the actual diff, and drafts the commit message.

**Jordan should never have to ask for it by name. If he does, this rule has failed** — that was the
whole complaint on 9/4: *"it feels like an extra step now instead of just being at the end of a
prompt."* An agent you have to remember to summon is a chore with more steps than the chore it replaced.

**Why a subagent and not this thread.** Twenty-one harness outputs is a lot of context to spend on a
checklist. And **a thread that just spent an hour building something is the worst available reviewer
of whether it documented itself** — it knows what it meant, which is exactly the knowledge that makes
item 5 easy to wave through.

**The split, so neither half does the other's job:**

| Half | Who | Why |
|---|---|---|
| Run the harnesses | **`_ship.js`**, and the pre-commit hook already runs it | Deterministic. Never needed a language model, and a script cannot hallucinate a green. |
| Items 1–5 against the diff, and the commit message | **`release-steward`** | Judgment. Item 5 asks whether a decision belongs in canon; item 3 asks whether a player can actually reach the thing. No script answers those. |

⚠️ **A green `_ship.js` is not a passed checklist.** It proves the code is sound; it says nothing
about whether the release is visible on the site, reachable by a player, logged on the board, or
written down. **Those four are the ones that actually get skipped** — every entry in `_docscheck.js`'s
debt list is one of them, never a harness failure.

## 4. Validation — sim-first, don't ship unproven

1. Design the map/mechanic → 2. **sim** proving it's solvable, the interaction is *required*,
and there's no cheese → 3. `node --check` the extracted `<script>` → 4. wire into `js/data.js`
→ 5. verify.

Per-game harnesses live beside the game, and **they are not all `_sim.js`** — check what's actually
in the folder before assuming:

- **2D pair track** — `games/<name>-v2/_sim.py` (Python physics sim).
- **3D** — `games/proving-ground/_sim.js` (asserts against the marked `BALANCE` block extracted from
  the HTML), plus `_arena.js`, `_billboard.js`, `_touch.js`, `_clipfit.js`, `_shroud.js`, `_zoom.js`
  and `_check.js`. **`_arena.js` (added 9/3 with VR-148) judges the SHAPE OF THE GROUND** rather than
  the numbers — six criteria per layout (reach · wedge · shroud · cheese · blink · convergence). It is
  the external bar VR-154's generator gets scored against, and the reason VR-121 can add walls without
  anyone eyeballing whether the result is playable.
  ⚠️ **`_zoom.js` was missing from this sentence from the day it was added (VR-140, 8/30) until 8/31**,
  and a session that trusted this list instead of `ls` skipped it and shipped two regressions into it.
  **This is the exact failure VR-100's Task B3 exists to catch, and the list it caught was this one.**
  **`ls` the folder. Always — and check what a file actually does before counting it.** **`_clipfit.js`
  (added 8/22 with VR-111) is the only harness in the repo that reads a BINARY ASSET** — it parses
  `assets/models/vesper.glb` for real clip durations and proves them against the marked `CLIPFIT`
  block and the strike windows in `BALANCE`. It exists because VR-111 was invisible to everything
  else we own: a 3s animation played inside a 0.36s strike, nothing threw, and no harness could
  see it because the animation lives in a file nobody parsed. **Re-run it after ANY re-merge of
  a character GLB** — a source clip that changes length silently moves the frame windows onto the
  wrong motion, which is the failure it was built to catch. `_touch.js` (added 8/16 with the
  VR-79 mobile pass) extracts the marked `TOUCH` block the same way `_sim.js` extracts `BALANCE`
  and **executes it against a hand-rolled DOM stub** — so the stick deadzone, the Stalk latch and
  the inert-when-not-live rule are proven, not eyeballed on a phone. Its highest-value assertion is
  that the `matchMedia` string in the script and the `@media` query in the stylesheet are
  **character-identical**: CSS decides whether the pad is on screen, JS decides whether it's wired,
  and a mismatch reads as "mobile is broken" rather than as a one-character typo.
  It has since grown to **374 checks and executes three of the file's marked blocks** — `TOUCH`,
  `SHEET` and `PRESET` — so it is the harness that covers the settings dialog's focus contract and
  its stages as well as the pad. **VR-131/132/133 (8/23) added:** the three-stage sheet walked
  end to end (tiles → group → control → back out), a markup check that **no `.trow` sits outside a
  `<section class="tsec">`** (such a row gets a list entry and no tile — fine on desktop,
  unreachable on a phone), all four combinations of the pad's handedness/verb-order mirrors, the
  camera stick proven to be a **rate** by ticking it with no further pointer events, and every
  `<use href="#…">` in the file resolved against the inline icon sprite — a dangling one renders
  *nothing*, silently, on one button. **VR-135/136/137 (8/23) added** the sheet's proportional
  drag driven pointer-by-pointer against a stub that models the sheet's real height (1:1 tracking,
  the rubber band, and a **flick read as a flick** rather than as forty pixels), the top-anchored
  peek for the one group that is watched at the pad, the message bar's state-vs-event priority,
  and the husk model budget checked against the shipped wave curve rather than a retyped copy —
  so "the first billboard appears at wave N" stays true if the curve moves.
  **`_shroud.js` (added 8/23 with VR-130) is the only harness that RENDERS.** It lifts the veil
  shader out of `index.html` — never a retyped copy — compiles it in a real GL context, draws
  the whole Shroud transition and **counts pixels**, so it can assert that skin, glass and the
  burning tear are all on screen at once mid-sweep. That is a claim about the picture, and no
  amount of reading the file as text can make it. **It is the one thing in this repo that needs
  an npm install (`playwright`), so it SKIPS its render pass — five text checks, exit 0 —
  rather than failing a clean checkout.** `_shroud.png` beside it is the sheet from a run that
  did render, checked in so the picture is reviewable without installing anything.
- **Narrative** — `games/rook-signal/validate.js` walks the story graph (no dead ends, no orphans,
  all six endings reachable), plus `_check.js`.

**Site-level, six at the repo root, all dependency-free and mutation-tested:** `_check.js` (the
`VEILRUN.games` manifest), `_hubcheck.js` (Hub states), `_updatescheck.js` (weekly-hero states),
`_grefcheck.js` (Game Reference catalogue + matcher), `_docscheck.js` (ship-checklist item 5),
`_leakcheck.js` (withheld lore, §5). Everything relevant must be green before hand-off.

**RUN THEM WITH `node _ship.js` (VR-159, 9/4) — it is a RUNNER, not a seventh check.** It asserts
nothing of its own; every claim it prints belongs to the harness that made it. It **discovers by
listing the folders**, so it cannot inherit a stale list — including this one — and it excludes the
two tools below by name. It reports **PASS / SKIP / FAIL as three states**, because a run where the
two mount-dependent checks skipped has not checked the two things most likely to be wrong, and a
summary folding SKIP into PASS lies by omission. `--staged` scopes the per-game harnesses to games
with staged changes (~0.8s vs ~38s for the full sweep).

**AND IT CHECKS THIS SENTENCE BACK.** Every harness it discovers is grepped for in this file, and
anything missing is reported as drift. That is the 8/31 failure turned into a mechanism: the list
above can still go stale, but it can no longer go stale *quietly*. It found `_arena.js` missing on
its first run, four days after VR-148 added it.

**A git `pre-commit` hook runs `_ship.js --staged` on every commit**, including from GitHub Desktop —
the only point in the workflow where a check runs without being asked, because the commit happens
outside Claude where no agent can see it. It blocks on FAIL, never on SKIP. **It lives in
`.git/hooks/` and is therefore NOT tracked**, so a fresh clone will not have it; the VR-159 card
carries the script to recreate it.

**`_leakcheck.js` (added 8/30, VR-127) scans everything `git ls-files` reports** — which is
exactly the set Pages publishes — for terms listed in `Claude Access`. It **skips without the
mount** and **never prints the matched term**, because a red build ends up in logs and
screenshots. Mutation-tested against five breaks including the real one it was written for.

**`_docscheck.js` (added 8/30 with VR-140) is the only harness that checks a rule about
PROCESS rather than about code**, and the only one whose subject matter lives outside the repo.
It reads the VR numbers this repo has *claimed* in commit subjects and reports the ones the canon
docs never mention. Three deliberate properties: it **skips rather than fails without the
`Claude Access` mount** (the `_shroud.js`-without-playwright contract — never go red for a
condition you cannot evaluate); it **only fails when an undocumented card actually touched
`games/` or `js/data.js`**, because a cover-art card wanting no canon entry is normal and failing
on it teaches people to ignore the harness; and its `NO_DOCS_NEEDED` exclusions **police
themselves** — a bare entry with no reason fails, and an entry for a card that has since been
documented fails as stale. An exemption you can add without saying why is a mute button, not a
decision. **It found VR-109 on its first run** — shipped 8/16, touched the site, never written up
— now listed as acknowledged debt rather than a silent miss. It also parses `VR-131/132/133`,
the house style for a multi-card subject, which a bare `/VR-\d+/` silently reads as one number.

**TWO FILES AT THE ROOT ARE TOOLS, NOT HARNESSES.** Neither has a pass/fail and neither is ever in
the green-before-hand-off set — running them proves nothing, and counting them as harnesses makes
the set look larger than it is.

- `_grefart.js` — resolves Steam appids for game-reference covers. Run by hand. Report-only unless
  given `--write`.
- `_pv.js` — renders the real `__grefCard()` against the real CSS with a demo dataset and writes a
  static preview to `/tmp/gref-preview.html` (VR-109). Run by hand. Prints one line and exits 0;
  **it has no assertions at all.** Named here as of VR-147 (8/31) — it had been at a public URL,
  described nowhere, since 8/16.

## 5. Tech guardrails

- **THIS REPO IS THE PUBLIC WEBSITE. Everything in it is world-readable.** Cloudflare Pages
  deploys from the repo root with no `_routes.json`, so **every file is served, including ones
  nothing links to and ones whose names start with `_`.** Verify rather than assume:
  <https://veilrun-dxv.pages.dev/CLAUDE.md> and `/_check.js` both return live content — this
  file and every harness are already public. **Before adding any file to this repo, ask whether
  you would be happy reading it at a guessable URL.** This is the reason the canon docs live in
  `Claude Access` (§1) rather than here: committing them would publish unreleased character kits,
  world lore and unratified proposals. Found the hard way on 8/30, one `git add` short.
- **Some lore is WITHHELD, and withheld means it cannot come into this repo.** Certain world
  material is deliberately unannounced — the crew is meant to meet it in a game, not in a
  changelog or a doc they stumble on. Because this repo is the public site, **material reaching
  it is publication, not a private slip.** The withheld terms live in `Claude Access` at
  `_Project Knowledge/_setup/confidential-terms.txt` (never here — a list in the repo publishes
  the words it protects), and **`_leakcheck.js` enforces it** against everything `git ls-files`
  reports, which is exactly what Pages deploys. It names the file and line and **never prints the
  term**. Applies to `js/data.js` above all: an updates entry is the fastest route from a private
  idea to the whole crew. **This rule exists because it was broken the day it was written** — the
  CLAUDE.md paragraph in §1 recording that the material must stay private originally named it, on
  a public page. Writing "keep this secret" in a doc is not a mechanism.
- Games are **standalone single-file** `games/<name>/index.html`, inline IIFE, no build step.
- **2D pair-level track:** shared engine at `games/_engine/engine.js` (`VE.Physics / Camera /
  Controller / Net / World`). Engine constants `TILE=40, COLS=24, ROWS=14`.
- **3D track (`games/proving-ground/`) deliberately does NOT use the 2D engine.** Three.js
  **r128** from the Cloudflare CDN. r128 has **no `CapsuleGeometry`** — build bodies from
  cylinders/spheres/cones.
- **cdnjs hosts r128's core but NOT its `examples/` loaders.** `GLTFLoader` therefore comes from
  jsDelivr (`cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js`) — the same
  CDN the site already uses for Supabase. Deliberate, not an oversight.
- **Every asset load falls back.** A missing sprite sheet keeps the primitive rigs; a missing
  player model keeps the primitive rig. A failed asset must never mean a broken game.
- Supabase: shared `game_scores` + `game_points` tables — **no new SQL per game**. The anon
  key is browser-safe and lives in `js/config.js` on purpose; the **`service_role` key must
  never be committed**, in any form.
- Versioning convention: the current build is `games/<name>/index.html`; superseded builds
  are archived to `games/<name>/versions/v0/index.html` (see `games/pair-level/` and
  `games/proving-ground/`) and stay reachable via the in-game Version dropdown and their own
  node in the `VEILRUN.games` manifest.
- **Promoting a preview to default** (worked example: Proving Ground, `f3777be`, 8/15) — reorder
  `versions[]` so the new build is `versions[0]`, which is what `js/app.js` opens; relabel the
  superseded node as an archive; **leave every level `id` alone** so no board migrates; and write
  the updates-feed entry. `_check.js` enforces that no preview/legacy label sits in `versions[0]`.

## 6. Repo map

```
index.html · app.html        the site (SPA-ish; app.html is the Lab/hub)
js/data.js                   VEILRUN.games manifest, modes, updates feed, weekly, crew  ← most edits
js/galleries.js              per-character gallery image arrays
css/                         site styles
assets/                      webp art (gallery/, landing/, world/, img/)
games/_engine/engine.js      shared 2D engine (pair-level track only)
games/<name>/index.html      each game, standalone single file
games/<name>/_sim.js         headless balance/solvability harness
games/<name>/_check.js       extracts inline <script> and syntax-checks it
```

Live: <https://veilrun-dxv.pages.dev>
