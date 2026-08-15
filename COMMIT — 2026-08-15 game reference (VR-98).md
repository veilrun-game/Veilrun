# Commit message — 2026-08-15 (supersedes the earlier canon-audit hand-off)

Scoped to **everything uncommitted since `69e3f31`** (`git status` + `git diff` run first). That includes three separate pieces of work that are all still in the tree: the **Vesper model** (already there when this thread started), the **canon audit's `CLAUDE.md` fix** (VR-100, another thread today), and the **game reference** built here.

`COMMIT — 2026-08-15 canon audit + Vesper model.md` at the repo root is the earlier hand-off from the audit thread. It is still accurate for its half; this file supersedes it as the message to send, because two more things landed after it was written. **Archive the older file rather than deleting it.**

---

```
Game reference: what the crew plays, and what makes them stop (VR-98)

Plus the Vesper model landing in the arena and the canon audit's CLAUDE.md
fix, both already uncommitted in the tree.

GAME REFERENCE (VR-98) — new #reference page in the Lab dropdown
- Crew add a game, what they love, and what takes them out of it. Both
  required on a first take; the gripes are the half nobody writes down and
  the half that transfers into design decisions.
- Two Supabase tables. `unique (slug, who)` makes one-take-per-person-per-game
  a database guarantee, which turns "add just a gripe later" into an upsert
  rather than a feature; a `has_something` check permits loves-only or
  gripes-only while refusing empty rows.
- Objective context (platform, 2D/3D, mechanics) lives in VEILRUN.gameRefs in
  js/data.js and is never asked of the crew — that's what keeps the form to
  four fields. Editorial content belongs in a commit you can read.
- Merge log with no extra table: raw_name + match_kind on every note give the
  "also submitted as" line and separate automatic from confirmed matches.
  Exact slug hits merge silently; near hits ASK. Auto-merging a near hit is
  the one failure here that loses data with no trace.
- Cards are pre-built and hidden until someone has a take, so contributing
  reveals a finished card instead of a placeholder.
- Takes score 3 on the contribution leaderboard, derived from row counts —
  no game_points writes, no SQL, and editing can't farm it.
- Lab top band is now two panels across on desktop. Flex, not grid, per
  hub.css's height-coupling note.
- New harness _grefcheck.js: 138 checks, mutation-tested against eight
  deliberate breaks, all caught. The mutation run found a real fragility the
  passing tests missed — the shown-quote count was hardcoded in two coupled
  slices, so changing one silently swallowed a quote. Now one SHOWN constant.
- Updates feed +1, written to ask rather than announce.

PROVING GROUND — Vesper's model owns the player (VR-91)
- Render precedence made explicit: MODEL > SPRITE > PRIMITIVES. Without it
  the layers fight — the sprite layer hides player.g and the model is its
  child, so the placeholder blob was winning.
- Facing bug fixed properly. Blender's forward is -Y and glTF's is -Z so they
  look like they agree; the exporter maps (x,y,z) -> (x,z,-y), so -Y arrives
  as glTF +Z, the same way every primitive faces. The model needs MESH_PI
  like everything else.
- The model shares the sprite state machine rather than growing its own, with
  clip-aware fallbacks and per-clip stride-rate scaling so feet stop skating.
- Shroud is now a dissolve into a glass ghost, not a fade.
- _billboard.js +10 checks, _sim.js +18. Adds assets/models/vesper.glb
  (8.7 MB) and the Blender clip-merge script.

DOCS (VR-100)
- CLAUDE.md: corrected four references to `boardTree`, which has not existed
  since VR-94 folded it into the VEILRUN.games manifest on 8/9. The ship
  checklist was telling every fresh thread to wire levels into a data
  structure that isn't there.
```

---

## Ship checklist — this changeset

| # | Item | Status |
|---|---|---|
| 1 | **Updates feed** | ✅ **+1 for VR-98**, player voice, written to *ask* ("add one game and one gripe") rather than announce. ⚠️ **Still outstanding for the Vesper model** — see below. |
| 2 | **Leaderboard wiring** | **n/a for the games manifest** — the reference has no `gameId` and nothing playable; no new or renamed level ids anywhere in this changeset. **But the *contribution* leaderboard did change**, so the explainer copy on `#leaderboard` was updated in the same commit — otherwise the board would silently score something it doesn't explain. |
| 3 | **Play access** | **n/a as a game.** Reference path verified: nav → Lab ▾ → Game Reference, plus both Lab band panels. Proving Ground unchanged — `versions/v0` is still what Play opens, model work stays in the v1 preview behind the Version dropdown. |
| 4 | **Kanban** | ✅ **VR-98 opened and logged as shipped, VR-99 opened** (both were flagged missing by VR-100's audit this morning). `_Last updated_` bumped. |
| 5 | **Canon docs** | ✅ `_Project Knowledge/00` gained the catalogue principle, the MVP definition, a refreshed status block and a Project-attachment sync warning. These live in `Claude Access`, outside this repo, so they are **not part of this commit**. |

## Two things to decide before you push

1. **The Vesper model still has no updates-feed entry.** The audit thread flagged this and deliberately didn't write one, because the honest wording depends on whether the clip set is finished. That judgement still stands and it's still outstanding — the model changes what a player sees in the v1 preview. Either write it or accept the release ships silent, but it should be a decision rather than an omission.
2. **`assets/models/vesper.glb` is 8.7 MB of binary in git.** Repeating the audit's flag because this commit is the last cheap moment to change course: with nine more crew through the same pipeline that's ~80 MB in history, and git history is permanent. Worth deciding now whether large model assets belong in the repo or behind a CDN.

## Not blocking, but worth knowing

- **The reference page is live and empty.** That's intended — cards only appear once someone has a take. The seed pass (~50 context cards + cover art) is its own commit, deliberately excluded so the page is proven at 0, 1 and 50 games first.
- **VR-95 is still double-assigned** (`The Thinning` and `GRD Origin Intake` both claim it). VR-100 raised it, it needs your call, and no automated pass can resolve it.
