# Commit message — 2026-08-15

Scoped to **everything uncommitted since `69e3f31`** (`git status` + `git diff` run first), not just the audit's changes. The Vesper model work below was already in the working tree when the audit started — it is described here because it is uncommitted, not because this pass produced it.

---

```
Vesper's model lands in the arena, and the docs stop lying about boardTree

- Proving Ground: the real Vesper GLB now owns the player. Render precedence
  is explicit — MODEL > SPRITE > PRIMITIVES — because without it the layers
  fight: the sprite layer hides player.g, and the model is a child of it, so
  the placeholder blob was winning.
- Fixed the facing bug properly. Blender's forward is -Y and glTF's is -Z so
  it LOOKS like they agree; the exporter maps (x,y,z) -> (x,z,-y), so -Y
  arrives as glTF +Z — the same way every primitive faces. The model needs
  MESH_PI like everything else.
- The model shares the sprite state machine rather than growing its own, with
  clip-aware fallbacks (no crouch clip yet -> move; run clip above RUN_AT) and
  per-clip stride-rate scaling so feet stop skating at full speed.
- Shroud is now a dissolve into a glass ghost, not a fade.
- _billboard.js +10 checks and _sim.js +18, covering precedence, facing, the
  shared state machine and the dissolve. All green.
- Adds assets/models/vesper.glb (8.7 MB) and the Blender clip-merge script.
- CLAUDE.md: corrected four references to `boardTree`, which has not existed
  since VR-94 folded it into the VEILRUN.games manifest on 8/9. The ship
  checklist was still telling every fresh thread to wire levels into a data
  structure that isn't there.
```

---

**Ship-checklist status for this changeset:**

- **Updates feed — n/a for the doc half; OUTSTANDING for the model half.** The Vesper model changes what a player sees in Proving Ground v1, so by the checklist it needs an entry in `VEILRUN.updates` before this is "shipped." **This audit deliberately did not write one** — it's site code and player-facing copy, and the honest version of that entry depends on whether the clip set is finished. Worth writing before you push.
- **Leaderboard wiring — n/a.** No new or renamed level ids; `proving-ground-v1` already exists in the manifest.
- **Play access — unchanged.** `versions/v0` (primitives) is still what Play opens; the model work is in the v1 preview behind the Version dropdown. Confirm that's still what you want now the model is real.
- **Kanban — done.** `_Last updated_` bumped to 2026-08-15; VR-100 opened.
- **Canon docs — done.** Seven docs corrected in `_Project Knowledge/`; full write-up at `Planning/VEILRUN — Canon Audit 2026-08-15 (VR-100).md`.

**Note:** the `_Project Knowledge/` and `Planning/` edits live in the `Claude Access` folder, outside this repo, so they are not part of this commit. `CLAUDE.md` is the only repo file the audit touched.

**Before you commit:** `assets/models/vesper.glb` is 8.7 MB. Worth deciding whether large binary model assets belong in git or behind a CDN — it's much cheaper to decide now than after several characters land.
