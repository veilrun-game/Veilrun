# VEILRUN — orientation for Claude

Read this first. It exists so a fresh thread doesn't have to rediscover where things live.

---

## 1. The docs are NOT in this repo

The Kanban, the roadmaps, the GRDs and the canonical design docs live in a **separate
folder called `Claude Access`**, mounted alongside this repo. If it isn't mounted, ask for
it before doing anything else — most cards are unworkable without it.

| What | Path inside `Claude Access` |
|---|---|
| **Kanban (the card you were pointed at)** | `Games/Veilrun/Planning/VEILRUN Kanban.md` |
| Roadmap, game modes, GRDs, kickoffs | `Games/Veilrun/Planning/` |
| **Canon docs** (`_Project Knowledge/`) | `Games/Veilrun/_Project Knowledge/` |
| Character Kits & Synergies — *the* source of truth | `Games/Veilrun/_Project Knowledge/Character Kits & Synergies.md` |
| Midjourney prompt ledger, silhouette prompts, asset recipes | `Games/Veilrun/Art & Assets/` |
| Raw Midjourney downloads | `Games/Veilrun/Art & Assets/assets/` |
| Lore | `Games/Veilrun/Lore & World/` |

> **Mount-timing gotcha (this has burned a thread already):** the sandbox boots its mounts
> in the background. An `ls` of the mount root run in the first seconds of a session can
> come back showing only `outputs/` and `uploads/`. **That is not proof a folder is missing.**
> Re-check before concluding anything is absent.

Cards are referenced as `VR-##`. Find one with:
`grep -n "VR-91" "…/Claude Access/Games/Veilrun/Planning/VEILRUN Kanban.md"`

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
(e.g. `updates feed +1 · boardTree v1 node · Kanban VR-91 · docs folded`). Say "n/a"
explicitly rather than omitting an item.

1. **Updates feed** — new entry at the top of `VEILRUN.updates` in `js/data.js`, newest
   date, player-facing voice. Without it the release is invisible on the site.
2. **Leaderboard wiring** — the level's `gameId` is in `boardTree` in `js/data.js` under the
   right Version → Combo.
3. **Play access** — confirm the exact path a player takes (combo `play` link and/or the
   in-game Version dropdown), and that a preview build isn't silently the default.
4. **Kanban** — log/close the card, bump `_Last updated_`.
5. **Canon docs** — fold durable decisions back into `_Project Knowledge/`.

## 4. Validation — sim-first, don't ship unproven

1. Design the map/mechanic → 2. **sim** proving it's solvable, the interaction is *required*,
and there's no cheese → 3. `node --check` the extracted `<script>` → 4. wire into `js/data.js`
→ 5. verify.

Per-game harnesses live beside the game: `games/<name>/_sim.js` and `games/<name>/_check.js`.
Run them from inside the game's folder. Both must be green before hand-off.

## 5. Tech guardrails

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
  are archived to `games/<name>/versions/v0/index.html` (see `games/pair-level/`) and stay
  reachable via the in-game Version dropdown and their own `boardTree` node.

## 6. Repo map

```
index.html · app.html        the site (SPA-ish; app.html is the Lab/hub)
js/data.js                   games, combos, boardTree, updates feed, crew data  ← most edits
js/galleries.js              per-character gallery image arrays
css/                         site styles
assets/                      webp art (gallery/, landing/, world/, img/)
games/_engine/engine.js      shared 2D engine (pair-level track only)
games/<name>/index.html      each game, standalone single file
games/<name>/_sim.js         headless balance/solvability harness
games/<name>/_check.js       extracts inline <script> and syntax-checks it
```

Live: <https://veilrun-dxv.pages.dev>
