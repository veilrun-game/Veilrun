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

- **NEVER commit or push to `main`.** `main` is what Cloudflare Pages deploys, so a commit there
  **is a publish**. That stays Jordan's, always, via GitHub Desktop.
  ✅ **REVISED 9/7 — committing to a BRANCH is allowed, and is now the expected path for agent
  work.** Create a branch, commit with the message the checklist produced, push the branch, and
  move the card to `🔀 In review`. **A branch push deploys nothing** (Pages watches only `main`),
  and **the pre-commit hook still runs**, so `_pathcheck.js` and `_leakcheck.js` fire before
  anything is committed anywhere — the publish guards are not bypassed by this, they are reached
  one step earlier.
  **Why it changed:** the old rule stranded the card. An agent handed over a message, its session
  ended, Jordan committed by hand — and then nothing could move the card without him *asking* for
  it, at which point he may as well have moved it himself. **A handoff that needs a human to relay
  it is not a handoff.**
  ⚠️ **Still scope the message to EVERYTHING uncommitted**, not just the last change — run
  `git status` and `git diff` first. Unchanged, and it is the part that catches work from an
  earlier session riding along.
- **Never delete files — archive instead.** Ask before anything irreversible.
- **Every character has a synergy with every other character**, in some form — depth varies with
  the relationship, and that asymmetry is the interesting part. **And every character can hold
  their own weight:** real strengths, real weaknesses, no passengers.
  ⚠️ **REVISED 9/7 (STU-08 ruling 1). This used to read "every character is fully capable solo; a
  pairing unlocks an enhancement, never a dependency" — and that was too strong in one direction
  and too vague in the other.** "Holds their own weight" is **not** "can solo any content," which
  the old wording quietly asserted. **And whether a GAME requires the synergy to progress is that
  game's own stance, declared on its card — not a house law.** The 2D pair track requires it and is
  better for it; a battle royale would not. Read the old rule literally and it forbids the very
  design that proved the concept. Full reasoning: `Claude Access/Studio/Planning/NORTHSTAR
  (STU-08).md` §7.
- **Big synergies drain the area thin — power has a price.** This is the balancing lever.
- **When "is this good?" has no obvious answer, the NORTHSTAR is the tiebreaker** —
  `Claude Access/Studio/Planning/NORTHSTAR (STU-08).md`. It states what this studio is aiming at,
  what good looks like, what to avoid, and the two different thresholds for *shipping* versus
  *asking the crew for their attention*. **It is short on purpose. Read it rather than guessing.**

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
4. **Trello** — log the card on the board. *(Changed 8/16; this used to say "update
   `Planning/VEILRUN Kanban.md`".)*
   ⚠️ **NEVER ASK JORDAN WHETHER TO MOVE A CARD. Ever.** (9/7.) **Every transition below is either
   an agent's own action or a fact readable out of git.** None of them is a judgement call, and
   asking turns something automatic into a prompt he has to answer.

   **THE PIPELINE — a card's list IS its stage:**
   · **Building** → `🟣 In progress`.
   · **Branch committed and pushed** → **move it to `🔀 In review` yourself**. Do not ask. Do not
     move it to Done — it is not live yet.
     ⚠️ **REVISED 9/12 — this used to say "and put the branch name in a comment," and no agent could
     ever do it.** The Trello connector's write tool has no comment action; its `action` enum is
     `create · update · move · archive · mark_done · attach_label · detach_label` and nothing else.
     Reading comments works (they ride along in a card `get`), so the gap is invisible until you try
     to write one. **A standing instruction no agent can follow is worse than no instruction** — it
     made every run end with an apology for a step that was never available.
     **The replacement is to DERIVE the branch, not record it.** A card's branch is
     **`vr-<number>-<slug>`**, always — `VR-174` → `vr-174-affirmed-renders`. That makes the branch
     a lookup rather than a fact someone has to write down: `git branch -r --list 'origin/vr-174-*'`
     answers it from the repo, which is the same move the merge check already makes. **Nothing goes
     on the card at all** — not a comment, not a title prefix, not a description line. A board field
     that restates what git already knows is one more thing that can drift.
     **If a card ever needs two branches, the second is `vr-<number>-<slug>-2`** — still derivable
     by the same glob.
   · **Branch merged into `main`** → **move it to `🟢 Done`.** This is derivable, never a question:
     `git branch --merged main` lists what has landed. **The Producer's sweep checks this every run**,
     so a card cannot sit in review after its branch is merged.
   · **Nothing committed yet** → leave it in `🟣 In progress` and say so.
   · **`🟢 Done` is FINAL.** A problem with something live becomes a **new card** — bug or
     enhancement — never a reopening. This is why `VR-117` sat in Done titled *"FIX PENDING PUSH
     (live is broken)"* for a week: **a card used as a status light stops being a record of what
     shipped.**

   **Jordan's only step in this is the merge**, which is the one place a human judgement genuinely
   belongs — it is the moment work becomes public. **As of 9/13 he does not do it unaided:
   `branch-steward` (§3's delegate table) performs the merge into `main` up to but not including the
   commit — conflicts resolved, `_ship.js` run on the MERGED tree, everything staged — so the step
   left to him is approval rather than operation.**
   **A git hook cannot move the card** — the board needs credentials and §5 forbids them in this
   repo. The agent moves it on push; the sweep moves it on merge.
5. **Canon docs** — fold durable decisions back into `_Project Knowledge/` **inside `Claude Access`**
   (§1), never into this repo. The item is easy to skip precisely because it is the one thing on
   this list that cannot ride along in the changeset — so say which file you edited in the
   hand-off, or say "n/a" and mean it. `_docscheck.js` reports what a commit claimed and the docs
   never mention, and it can only see the docs when the mount is there.

### DELEGATE THIS CHECKLIST — do not walk it from memory (VR-159, 9/4)

**Before any hand-off on a changeset touching `games/`, `js/data.js` or the site shell, delegate to
the `release-steward` subagent** (`.claude/agents/release-steward.md`). It runs `_ship.js`, walks the
five items above against the actual diff, and drafts the commit message.

⚠️ **`.claude/` IS UNTRACKED AS OF VR-164 (9/5), so a fresh clone will not have the steward** — the
same contract as the pre-commit hook below, and for the same reason in reverse: the hook is untracked
because it *can't* be tracked, and this is untracked because it **must not** be. This repo is the
public website and Pages serves dot-directories like any other; `release-steward.md` was live at a
guessable URL from the day it was committed. **The canonical copy lives in `Claude Access` at
`_Project Knowledge/_setup/agent-config/`** — copy it back from there, edit the repo's working copy
(that is the one the agent loads), and copy your change back. **Do not re-add it to the repo.**

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
| **Branch · commit · push · move the card · prepare the merge** | **`branch-steward`** *(added 9/13, VR-180)* | Execution. It takes the reviewed message and runs it, then merges the branch into `main` **up to but not including the commit**, so Jordan approves rather than operates. |

⚠️ **`branch-steward` IS FULL AUTO BELOW `main` AND STOPS DEAD AT IT.** Branches, commits, pushes,
branch-to-branch merges, mechanical conflict resolution and card movement all happen without asking.
`git commit` on `main` and `git push origin main` are the two things it will refuse even when asked
directly, because `main` is what Pages deploys — **the merge commit is the publish, and the publish
is Jordan's.** Jordan chose this split explicitly on 9/13 when asked how far it should go.

⚠️ **Why it exists, in one sentence: the 9/7 revision fixed the hand-off and left the LAST step —
the only one that needs a person — as the one with no support at all.** On 9/13 Jordan started the
VR-174 merge in GitHub Desktop, hit a one-file conflict that was purely mechanical (`main` had
deleted a list entry, the branch had added a different one — both right, keep both), and stopped:
*"I'm honestly feeling a bit over my head with the branches and how to merge things etc."* **Nothing
on the board or in the repo said a half-finished merge was sitting in the working tree.** Which is
why `branch-steward`'s Step 0, before it reads the request at all, is *check for a merge in progress*.

⚠️ **`release-steward` hands off to it and never the reverse.** The reviewer stays read-only on git;
the executor never reviews its own work. Red results are never handed over — a red changeset pushed
to a branch is just a card in review that cannot be merged.

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
  the HTML), plus `_arena.js`, `_gauntlet.js`, `_billboard.js`, `_touch.js`, `_clipfit.js`,
  `_shroud.js`, `_zoom.js`, `_strike.js`, `_exec.js` and `_check.js`. **`_arena.js` (added 9/3 with VR-148) judges the SHAPE OF
  THE GROUND** rather than the numbers — six criteria per layout (reach · wedge · shroud · cheese ·
  blink · convergence). It is the external bar VR-154's generator gets scored against, and the reason
  VR-121 can add walls without anyone eyeballing whether the result is playable.
  **`_gauntlet.js` (added 9/4, VR-148's open half) is the LOOP that walks a builder up to that bar** —
  generate → judge → *named failures back* → repeat, three rounds, spend reported. ⚠️ **The builder is
  an agent and this file is deliberately not it**: the referee owns the round discipline, the brief and
  the spend accounting, and nothing creative. Run with no arguments it is a harness (22 checks, ~1s) —
  it self-tests the referee against canned verdicts plus **one live judge call**, so the parse is never
  a fixture agreeing with itself. **Driving a real round costs an agent, so a commit never starts one.**
  Its three guards against a loop that is theatre — a resubmitted layout refused, a `_note` required
  from round 2 that must NAME a failed criterion, and the judge quoted verbatim rather than paraphrased —
  are the difference between this and VR-154's randomizer.
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
  It has since grown to **544 checks and executes FOUR of the file's marked blocks** — `TOUCH`,
  `SHEET`, `PRESET` and `AIM` — so it is the harness that covers the settings dialog's focus
  contract and its stages, and the aim solver, as well as the pad. *(This sentence said "three"
  and named only the first three from the day `AIM` was added; `_ship.js` checks the NUMBER and
  could not see the omission — a count is machine-checkable and a list of names is not.)*
  **VR-131/132/133 (8/23) added:** the three-stage sheet walked
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
  **VR-126 (9/7) added the directional hold**, driven as real pointer events against the stub: the
  22% dead zone measured from where the thumb LANDED, release always firing (and firing *undirected*
  inside the dead zone), the setting proven byte-identical to today's tap path while it is off, Stalk
  proven to never open a hold, a lost pointer capture proven to drop a half-finished verb rather than
  fire it, and the overlay proven to read every cone and range from `BALANCE` rather than a retyped
  copy. It also asserts the **desktop** stub answers `holdYaw()` — `verbYaw()` calls it every frame
  in every mode, so a missing stub is a TypeError in the desktop aim path thrown by a mobile feature.
  **`_shroud.js` (added 8/23 with VR-130) is the only harness that RENDERS.** It lifts the veil
  shader out of `index.html` — never a retyped copy — compiles it in a real GL context, draws
  the whole Shroud transition and **counts pixels**, so it can assert that skin, glass and the
  burning tear are all on screen at once mid-sweep. That is a claim about the picture, and no
  amount of reading the file as text can make it. **It is the one thing in this repo that needs
  an npm install (`playwright`), so it SKIPS its render pass — five text checks, exit 0 —
  rather than failing a clean checkout.** `_shroud.png` beside it is the sheet from a run that
  did render, checked in so the picture is reviewable without installing anything.
  **`_strike.js` (added 9/6 with VR-168) is the first harness whose thresholds come from OUTSIDE
  this repo** — measured off a community-datamined frame-data table for a class of one-handed-blade
  chain kits. It asks the one question nothing else did: **not whether the art fits the strike window,
  but whether the strike window itself is right.** The clip harness consumes `wind + active + rec` as
  a *denominator* and so takes those numbers as given; `_strike.js` judges them, in **71 checks**, and
  it **measures by execution, never by arithmetic** — it lifts `startStrike()`, `updateStrike()` and the
  strike input branch out of the HTML and runs them frame by frame at the real `STEP = 1/60`, because
  a BALANCE number is not what the player gets: `rec: 0.20` costs THIRTEEN frames, not twelve, since
  twelve 1/60s sum to 0.19999999999999998. ⚠️ **SEVEN OF ITS CRITERIA FAIL THE SHIPPED GAME AND ARE
  ALLOWED, NOT PASSED (VR-170).** Four are VR-169's defects; three are values awaiting Jordan's
  ruling. **An allowance is a FOURTH STATE** — every allowed failure still prints in full and the
  summary reads `64 pass · 7 allowed · 0 unallowed`, never 71 pass, for the same reason `_ship.js`
  keeps SKIP out of PASS. The list **polices itself**: an entry with no card or `ruling-pending`
  fails, and an entry whose criterion has since started passing fails as **stale**, so an allowance
  cannot outlive its bug. Anything not on the list still fails and still blocks. **Do not make it
  green by editing the game or loosening the bar** — a bar that named four real defects on its first
  run is the harness working. The reference title is named only in the rubric in `Claude Access`
  (Planning · Reference & Specs · VR-168); a harness in this repo never names a commercial game.
  **`_exec.js` (added 9/12 with VR-172) is the only harness that judges what a verb says when it
  finds NOTHING.** Every other bar here measures a verb that connected; this one lifts
  `tryExecute()` out of the HTML and runs it at an empty arena, at a husk past `execRange` and at a
  husk outside `execArc`, in **58 checks**, and asks whether the press was perceivable at all.
  ⚠️ **It failed the shipped game on 12 of them before VR-172 landed** — the miss path wrote
  literally nothing, so a whiff and a dead button were byte-identical to the player. It bars three
  things at once, and the second is the one a later thread will trip: a whiff must be **perceivable**,
  must still **cost nothing** (no `execCd`, no lunge, no facing snap — "costs nothing" was a ruling
  about price that had been quietly carrying a ruling about feedback), and must **not borrow the
  hit's tells** (`hitStop`, `shake`, `thinGround`). It runs every case at all three `cam.mode` values
  through the real lifted `verbYaw()`, and proves that is the real one by making arcade and third
  disagree about the same husk. **The AU method names are read out of the file rather than listed**,
  so a sound added tomorrow is an observable here tomorrow with no edit to the harness.
- **Narrative** — `games/rook-signal/validate.js` walks the story graph (no dead ends, no orphans,
  all six endings reachable), plus `_check.js`.

**Site-level, thirteen at the repo root** *(nine until 9/16)*, all dependency-free and mutation-tested
except `_kit.js`: `_check.js` (the
`VEILRUN.games` manifest), `_hubcheck.js` (Hub states), `_updatescheck.js` (weekly-hero states),
`_grefcheck.js` (Game Reference catalogue + matcher), `_docscheck.js` (ship-checklist item 5),
`_leakcheck.js` (withheld lore, §5), `_pathcheck.js` (withheld *locations*, §5),
`_clock.js` (the shared fixed-timestep clock, **42 checks**),
`_board.js` (card state derived from git, **50 checks**),
`_kit.js` (added 9/16, VR-196 — scaffolded by `_new.js` in `module` mode, awaiting VR-185's
character kit schema; one trivial self-test today, not yet mutation-tested because there is nothing
real in it to mutate),
`_navcheck.js` (nav reachability, **23 checks**),
`_archetypes.js` (audience-archetype doc structure, **26 checks**),
`_bus.js` (the shared synchronous event bus, **38 checks**).
Everything relevant must be green before hand-off.

**`_archetypes.js` (added 9/16, VR-208) checks the schema of a doc that does not exist yet.** The
card is tagged `provable: no` about the only question that matters — no harness can tell a true
archetype from a plausible one — so this one deliberately answers a smaller question: three entries,
one per genre, each naming Wants / Leaves / Returns, each marked `hypothesis` or `evidenced` with
evidence named when evidenced, and no archetype `.md` tracked in THIS repo (the doc belongs in
`_Project Knowledge/`). Until VR-208's writing is done it reports a **`~` partial skip**, never a
fail, and self-tests its schema against fixtures — **6/6 mutants killed**. The `##`/`**Key:**`
delimiter syntax is this harness's proposal, not a sourced number, and is expected to be revisited
once the doc exists.

**`_navcheck.js` (added 9/16, VR-197) is the narrow provable slice pulled out of an otherwise
`provable: no` card.** The full ask — is the site's IA *right* — needs Jordan's eye and the crew's
behaviour and stays exactly where it was. What reduces to a harness is only the wiring underneath
it: every `#hash` link in `app.html`/`js/app.js` resolves to a route `route()` recognizes (it has
no 404 path, so a stale link silently renders the Hub instead of failing loud), every view function
is reachable, no two peer entries in `#navlinks` share an identical href, and the primary nav is
provably one click from anywhere because `route()` only ever rewrites `#view`'s innerHTML. It reads
these live off the router and markup rather than a retyped copy. **It would pass a genuinely bad
IA that had no dead links** — quality was never the question it answers.

**`_board.js` (added 9/14, VR-207) is the harness over `_boardstate.js`, which is a TOOL and is
excluded from the green set** alongside `_grefart.js`, `_pv.js` and `_roster.js`. `_boardstate.js`
prints which VR numbers reached `origin/main` and which sit on a pushed unmerged branch; it decides
nothing and moves nothing, and the `board-reconciler` agent reads it to move Trello cards.
⚠️ **It exists because `branch-steward` only moves cards for git steps IT performs.** VR-189 was
built, committed, pushed and deployed on 9/14, and its card sat in `🌙 Tonight` until a human noticed.
Nothing was broken; nothing moved it either. Every hand-path has that hole, so card state stopped
being asserted and started being derived.
⚠️ **Its highest-value assertion is the slash run.** Commit `4f3bbdc` closes three cards in one
subject — `(VR-180/181/182)`. A naive `/VR-\d+/` reads one and strands two, silently, forever. The
harness pins all three *and* proves the naive version really would have been wrong rather than taking
it on faith. The git reader is injectable for the same reason: the repo has no unmerged branches
today, so the rule that a card whose branch already reached `main` is **shipped, not pending** would
have had zero coverage until the first night it mattered.
⚠️ **`🟣 In progress` is REPORT-ONLY to the reconciler, and that was learned the same day.** A dry
run against the real board found four cards there that git calls shipped, and **two would have been
moved wrongly**: `VR-100` is a *recurring* weekly canon audit whose card is permanent, and `VR-98`
shipped its page on 8/15 with open work still on it. `VR-181` and `VR-182` genuinely were finished
and unmoved. **Nothing in git distinguishes those two groups** — `🟣 In progress` means a person said
they are working on something, git cannot see that claim, and so git does not get to overrule it.
The reconciler reports the mismatch and moves nothing. Surfacing it was the requirement; moving it
never was.

**`_clock.js` (added 9/14, VR-189) is the first harness that tests a REAL SHARED MODULE rather than
code lifted out of an HTML file.** `games/_engine/clock.js` is UMD-lite, so the harness `require`s the
actual class and drives it — no DOM, no game state, nothing to stub, and therefore no retyped copy that
can drift from the thing it checks. Everything else here has to extract a marked block because the code
it tests only exists inside a page.
⚠️ **Two of its assertions were WRONG on the first run and the module was right**, which is worth
recording because the failures looked identical to a broken refactor. One expected a 1.0s dt at
`scale 0.5` to leave a remainder, when thirty owed steps hit `MAXSTEPS` and reset `acc` to 0 *by
design* — it was measuring the cap while claiming to measure the scale. The other asserted
`accumulate()` takes **13** steps to clear 0.20s. It takes **12**, carrying ~4.9e-17. **The 13-frame
fact belongs to a COUNTDOWN** — `_strike.js` decrements a timer by `STEP` and twelve of them sum to
0.19999999999999998, so the window costs a thirteenth frame. Same floating-point fact, opposite ends.
**Assert each in the shape it actually takes.**

**`_bus.js` (added 9/18, VR-204) is the second harness in the `_clock.js` family — a REAL SHARED
MODULE, `require`d directly, never lifted.** `games/_engine/bus.js` is the synchronous, ordered
publish/subscribe bus this card introduces to fix the structural version of VR-172's failure: a
verb's effects threaded through call sites by hand, where a later edit forgets one. Section 1 proves
the module itself — the event set is fixed and enumerable (`new Bus(["hit-landed"])`, not free-form
strings), an unknown event throws rather than being silently swallowed, listeners fire in
registration order within the same tick, and unsubscribe is symmetric (the returned function, or
`off()` by reference, removes exactly one listener and nothing else — proven including the case
where a listener unsubscribes itself mid-emit). Section 2 does not re-run the game — booting THREE.js
for one function is what `_exec.js` already avoids — it **lifts** the real `HITBUS = new
VE.Bus([...])` construction, the real `damageEnemy()` body and every real `HITBUS.on(...)`
registration out of `proving-ground/index.html`, the same anchor-or-exit-2 contract as `_exec.js`,
and proves every declared event has at least one subscriber and that `damageEnemy()` now emits
instead of calling `floatNumber()` / `burst()` / `AU.hit()` by hand. **The harness was proven to
actually catch a regression, not just pass one**: pulling the AU subscriber back out during review
turned one check red immediately. Mutation-tested — an `emit()` that stops asserting the event is
known (the exact free-form-bus failure this module exists to remove) and an unsubscribe turned into
a no-op both diverge from the real module. **38 checks.** Everything past `hit-landed` — the other
six observables VR-204's card names (hitstop, shake, telemetry, achievements) and every other call
site in `damageEnemy()`'s neighbours — is explicitly out of scope; the card asks for one event
routed end to end, not a rewrite.

**`_pathcheck.js` (added 9/7, VR-165) asks the question content-scanning CANNOT.** Its sibling asks
whether a file *contains* something withheld; VR-164 proved that is not the whole question, because
`.claude/agents/release-steward.md` was tracked, scanned and **clean — zero term matches** — and was
world-readable at a guessable URL from the day it was committed. **"No withheld term" does not mean
"safe to publish."** It therefore holds a rule about **location, not content**: a denylist of paths
that must never be tracked — `.claude/`, the canon working folders, secrets by filename — plus the
rule that §1's `— see Claude Access` pointer stubs **stay empty**, which was a sentence until now.
It runs **38 checks** and is the one root harness that **never skips**: it needs no term list and no
mount, which is exactly why it could not live inside the lore scan (that file exits early without
the mount, so a location rule placed after it would silently never run — VR-164's failure
reproduced structurally). It reads `git ls-files`, which is the **index**, so it stops a bad
`git add` at the pre-commit hook rather than one commit after it is public.

⚠️ **Both publish checks read `git ls-files -z` and split on NUL, and that is load-bearing, not
style.** Plain `git ls-files` applies `core.quotePath` and returns a non-ASCII path
backslash-escaped and quoted — this repo's two pointer stubs come back as
`"_Project Knowledge \342\200\224 see ..."`. `_leakcheck.js` then failed to open them and its
`catch` returned **silently**, so every tracked file with an em dash in its path was skipped
*without being counted as skipped*. Two files on 9/7, both empty keepers — but they were the canon
pointer stubs, and every canon filename in this project has an em dash in it. Found by
mutation-testing `_pathcheck.js`; `_leakcheck.js` now also **names any file it could not read**.

**RUN THEM WITH `node _ship.js` (VR-159, 9/4) — it is a RUNNER, not an eighth check.** It asserts
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

**AND THE NUMBERS THIS FILE STATES, not just the filenames (VR-161, 9/6).** Every `N checks` claim
in §4 is compared against what that harness printed in the same run — no second invocation. A
missing filename is visible from `ls`; a wrong count is only visible by running the harness, which
is why `_touch.js` sat here claiming 374 while printing 494. **A count that FELL is called out
separately** — rising means the harness grew, falling means assertions were deleted. It reports and
never edits: a checker that rewrites the thing it checks can only ever agree with itself.

**A git `pre-commit` hook runs `_ship.js --staged` on every commit**, including from GitHub Desktop —
the only point in the workflow where a check runs without being asked, because the commit happens
outside Claude where no agent can see it. It blocks on FAIL, never on SKIP. **It lives in
`.git/hooks/` and is therefore NOT tracked**, so a fresh clone will not have it; the VR-159 card
carries the script to recreate it.

**`_leakcheck.js` (added 8/30, VR-127) scans everything `git ls-files` reports** — which is
exactly the set Pages publishes — for terms listed in `Claude Access`. It **skips without the
mount** and **never prints the matched term**, because a red build ends up in logs and
screenshots. Mutation-tested against five breaks including the real one it was written for.
**As of VR-165 (9/7) it scans a SECOND set**: `git ls-files --others --exclude-standard`, the
untracked-unignored files a `git add .` would sweep in. That set also **fails** rather than warns —
the private place is `Claude Access`, not this repo's working directory — but it is worded
separately, because *"already public"* and *"one `git add` away"* are different facts with
different remedies. ⚠️ The old comment at its scan (*"an untracked scratch file is not published
and is not this check's business"*) was true, and false one `git add` later.

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

**FIVE FILES AT THE ROOT ARE TOOLS, NOT HARNESSES** *(four until 9/16)*. None has a pass/fail and
none is ever in the green-before-hand-off set — running them proves nothing, and counting them as
harnesses makes the set look larger than it is. `_ship.js` excludes every one of them by name.
⚠️ **This sentence states a COUNT, so it goes stale silently.** `_ship.js` verifies the per-harness
counts in §4 but not this one — adding a tool means editing this line in the same changeset.

- **`_new.js` (added 9/16, VR-196) — writes a harness SKELETON, not a harness itself.** Its sibling
  is `_roster.js`: that one reports what harnesses already exist, read off `ls`; this one creates
  what does not exist yet. Four modes, none invented for this card — `extract` (marked HTML block +
  vm sandbox, the `_sim.js`/`_touch.js` shape), `exec` (lift a function out of an HTML file and run
  it, the `_exec.js` shape), `binary` (parse a binary asset, the `_clipfit.js` shape), and `module`
  (require a real shared module directly, the `_clock.js` shape). What it writes **passes trivially
  out of the box** — one always-true self-test plus a TODO section that reports a `~` partial skip,
  never a fail, until a human points it at a real target — so `node _ship.js` stays green the moment
  a scaffold is generated, not only once someone finishes it. It also **refuses to overwrite** an
  existing file, in keeping with §2's never-delete rule. `node _new.js kit --mode module --card
  VR-185` produced `_kit.js` as the card's own proof the generator works end to end; `_kit.js` is
  real, discovered by `_ship.js` and listed by `_roster.js`, and currently passes on its one trivial
  check while it waits for VR-185 to give it something real to require.

- **`_boardstate.js` (added 9/14, VR-207) — prints which VR numbers reached `origin/main` and which
  sit on a pushed unmerged branch**, plus the commit that shipped each one. `--json` for the
  `board-reconciler` agent, which is the only thing that acts on it. **It derives and it decides
  nothing** — the harness over it is `_board.js`, which IS counted.
- `_grefart.js` — resolves Steam appids for game-reference covers. Run by hand. Report-only unless
  given `--write`.
- `_pv.js` — renders the real `__grefCard()` against the real CSS with a demo dataset and writes a
  static preview to `/tmp/gref-preview.html` (VR-109). Run by hand. Prints one line and exits 0;
  **it has no assertions at all.** Named here as of VR-147 (8/31) — it had been at a public URL,
  described nowhere, since 8/16.
- **`_roster.js` (added 9/13, VR-181) — emits the canonical harness roster from `ls`, with one line
  per harness saying what it protects.** `--json` for machines, `--diff <file.json>` to compare
  against what a surface currently lists, **in both directions** — missing entries are the failure
  every previous roster had; **extra entries are the one nobody checked for**, where a deleted or
  renamed harness leaves behind a step that reads as a gate nobody is running.

- **`_boardstate.js` (added 9/14, VR-207) — the fourth tool.** Prints what git says about which
  cards shipped; `board-reconciler` is the only consumer. Its harness is `_board.js`.

  ⚠️ **It exists for Puzzle specifically, and the reasoning generalises.** Four of the six surfaces
  that once listed harnesses are clean today because they **deleted the list** and pointed at
  `node _ship.js`. **Puzzle cannot point at a command** — it is a diagram, and a validation diagram
  with no harnesses in it is a diagram of nothing. So it is the one surface that legitimately needs
  a roster, and therefore the one that must have it **generated rather than typed.** The agent that
  syncs it never types a filename; every one of the five historical misses was a filename somebody
  forgot to type.

  ⚠️ **A harness with no description is LISTED as unexplained, never dropped.** The failure mode is
  a loud gap instead of a short list — every previous roster failed by being short.

## 5. Tech guardrails

- **THIS REPO IS THE PUBLIC WEBSITE. Everything in it is world-readable.** Cloudflare Pages
  deploys from the repo root with no `_routes.json`, so **every file is served, including ones
  nothing links to and ones whose names start with `_`.** Verify rather than assume:
  <https://veilrun-dxv.pages.dev/CLAUDE.md> and `/_check.js` both return live content — this
  file and every harness are already public. **Before adding any file to this repo, ask whether
  you would be happy reading it at a guessable URL.** This is the reason the canon docs live in
  `Claude Access` (§1) rather than here: committing them would publish unreleased character kits,
  world lore and unratified proposals. Found the hard way on 8/30, one `git add` short.
- ⚠️ **THERE ARE TWO PUBLIC HOSTS, NOT ONE (verified live 9/13).** Cloudflare Pages is the one this
  file has always named. **A Netlify site serves the same repo at
  `https://stirring-horse-1393ea.netlify.app`** — `/CLAUDE.md` returns this file there too.
  **So a publish check run against one URL has checked half.** Nothing about the guards changes:
  `_leakcheck.js` and `_pathcheck.js` police the repo's *contents*, which is host-independent, and
  that is exactly why they still hold. But *"is this already public?"* is a two-URL question.
  ⚠️ **Grepping the repo for deploy config finds nothing and proves nothing.** There is no
  `netlify.toml` and no `_redirects` — the site is wired at Netlify's dashboard, against the GitHub
  repo. **A second deploy can exist with no trace in the tree**, which is the transferable lesson:
  the repo cannot tell you everywhere it is served from.
  **It is kept deliberately** — Netlify posts a **deploy preview on every pull request**, so a
  branch can be played before it is merged, which Pages does not offer. That preview is worth more
  than having a single host. **Do not turn it off to tidy up.**
- **Some lore is WITHHELD, and withheld means it cannot come into this repo.** Certain world
  material is deliberately unannounced — the crew is meant to meet it in a game, not in a
  changelog or a doc they stumble on. Because this repo is the public site, **material reaching
  it is publication, not a private slip.** The withheld terms live in `Claude Access` at
  `_Project Knowledge/_setup/confidential-terms.txt` (never here — a list in the repo publishes
  the words it protects), and **`_leakcheck.js` enforces it** against everything `git ls-files`
  reports — plus, as of VR-165, everything a `git add .` would sweep in. It names the file and line
  and **never prints the term**. Applies to `js/data.js` above all: an updates entry is the fastest
  route from a private idea to the whole crew.
- **Some files are wrong to publish because of WHERE THEY ARE, whatever is inside them.**
  `.claude/agents/release-steward.md` was scanned and **clean**, and was still world-readable for a
  day (VR-164). **A clean content scan is not permission to publish.** `_pathcheck.js` holds the
  location rule: `.claude/`, the canon working folders, secrets by filename, and §1's pointer stubs
  staying empty. **Adding a path to that denylist is cheap; removing one is a publishing decision
  and belongs on a card.** **This rule exists because it was broken the day it was written** — the
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
