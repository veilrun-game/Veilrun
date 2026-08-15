# Commit message — 2026-08-15 (second commit of the day)

Scoped to **everything uncommitted since `bab27bf`** (`git status` + `git diff` run first).
That's the seed pass built here **plus a Proving Ground HUD fix that was already in the tree** —
not mine, but uncommitted, so it's described below rather than omitted.

The earlier hand-off files at the repo root (`COMMIT — 2026-08-15 canon audit + Vesper model.md`
and `COMMIT — 2026-08-15 game reference (VR-98).md`) are **spent** — their contents went out in
`bab27bf`. Archive them rather than deleting.

---

```
Game reference: 47 games seeded, and a dedupe bug the seed exposed (VR-98)

Plus a Proving Ground HUD anchor fix already uncommitted in the tree.

SEED PASS (VR-98)
- 47 games from Jordan's list in VEILRUN.gameRefs: blurb, dimension,
  platforms, mechanics. Blurbs describe the LOOP rather than the marketing,
  because the loop is the part that transfers into our own design.
- Hidden until somebody has a take, so the page's empty state stays honest.
  They exist to power autocomplete — recognition beats recall for a crew
  where half have never engaged, and it means almost nobody types a raw name.
- Highguard and Spellbreak carry status:"gone". Both are games the crew liked
  that died anyway, which makes them the most instructive cards on the page.

THE BUG THE SEED FOUND
- A new "every seeded name resolves to its own slug" check caught that display
  names don't always normalise to their keys: "Marvel's Spider-Man 2" bares to
  marvelsspiderman2 against a spiderman2 key, "Orcs Must Die! (series)" carries
  a suffix the key doesn't. Since the catalogue IS the autocomplete source, a
  crew member picking a game from the list would have filed their take under a
  brand-new slug and silently created a duplicate card — the exact failure the
  dedupe design exists to prevent, arriving through the front door.
- Fixed structurally with a display-name index in grefMatch, not by hand-adding
  aliases, so a future entry can't reintroduce it.
- Three more invariants asserted: no two games share a normalised display name,
  no alias hijacks one, no alias shadows a real slug.
- Ambiguous aliases deliberately omitted (tf2, mk, er). An alias merges
  silently, so a contested shorthand has to go to the near-match prompt.

COVER ART
- Path derived from the slug; the image LAYERS OVER the typographic tile
  instead of replacing it. So covers drop into assets/gameref/<slug>.webp one
  at a time with no data.js edit, and a missing file is a designed card rather
  than a broken frame — which is also the CLAUDE.md "every asset load falls
  back" rule.
- assets/gameref/README.md documents the naming convention and the encode.

- _grefcheck.js: 654 checks, mutation-tested. Updates feed +1.

PROVING GROUND — HUD anchor fix (not from this thread, already in the tree)
- The gear button and the score both anchored top-right and had been stacked
  since v0; a third element made it visible. Gear moved to top:14px/right:16px,
  .hud-tr down to top:58px.
- _billboard.js +20 lines asserting no two fixed/absolute elements share a
  top/right anchor — the generalised version of the bug, not just this case.
  All three Proving Ground harnesses green (69 / 37 / node --check).
```

---

## Ship checklist

| # | Item | Status |
|---|---|---|
| 1 | **Updates feed** | ✅ **+1** — "47 games loaded, just start typing." Written to lower the cost of the first interaction, and it names the two dead games as the interesting ones. |
| 2 | **Leaderboard wiring** | **n/a** — no `gameId`, nothing playable, `VEILRUN.games` manifest untouched. Contribution scoring unchanged since `bab27bf`. |
| 3 | **Play access** | **n/a as a game.** Reference path unchanged: nav → Lab ▾ → Game Reference. Proving Ground untouched by this thread — `versions/v0` still what Play opens. |
| 4 | **Kanban** | ✅ VR-98 seed pass logged and closed out on the card; `_Last updated_` bumped. |
| 5 | **Canon docs** | **n/a this pass** — nothing durable changed. The catalogue and MVP principles landed in `_Project Knowledge/00` earlier today. |

## Open, and none of it blocking

1. **~47 cover images still to drop in.** No code needed — file in, card lights up. Convention in `assets/gameref/README.md`. Nothing looks broken until then.
2. **The Classroom is written from memory** and says so in its own blurb. Correct it or cut it.
3. **The together-tier is still uncorrected** — I didn't guess at it, per your call, so nothing in the data claims who played what with whom.
4. **VR-99 (The Loom) is unblocked the moment there are 8 takes from 3 people.** The empty-state panel is already live and counting.
5. Still outstanding from this morning, unchanged: **the Vesper model has no updates-feed entry**, and **`assets/models/vesper.glb` is 8.7 MB of binary now in git history** as of `bab27bf` — that decision has been made by default rather than deliberately, and it gets more expensive per character.
