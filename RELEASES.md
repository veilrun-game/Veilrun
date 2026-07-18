# VEILRUN — Releases

A plain-English log of website versions so we always know what to roll back to.

**How this works**
- Every commit is already a full, restorable snapshot (that's git). This file just labels the ones worth remembering.
- When we hit a "known-good" state, we **tag** it in GitHub Desktop: History → right-click the commit → **Create Tag** → name it (e.g. `v1.1`) → then **Push** (Push origin, and push tags).
- To go back later: **Netlify** Deploys → pick an older deploy → *Publish deploy* (instant, live-site only), or in GitHub Desktop right-click a commit → *Revert changes in commit* (safe), or check out a tag for a deeper rollback.
- Versioning: bump the **minor** number for feature releases (v1.1, v1.2…), the **major** for a big milestone (v2.0), and note the date + what changed below.

---

## v1.0 — Concept preview baseline · 2026-07-14

The first tagged "known-good" release. Everything built to date, behind the passcode:

- **Site foundation** — hand-built hash-router SPA: Hub, World, Crew, Threats, Synergy, Gallery, Lab, Updates, Board, Design system. Soft passcode gate.
- **Content** — the nine crew (The Last Fluent) with kits/codenames/synergies, the world (two layers + Seam + factions), threats bestiary, synergy matrix + combo builder, full concept-art gallery with favorites.
- **Art** — unified photoreal environment set (Overcity, Underweft, Seam, Thinned).
- **Backend (Supabase)** — feedback, likes, and votes persisting group-wide; weekly feedback review.
- **Lab voting** — up-vote game ideas, counts shared across the crew.
- **Crew leaderboard** — contribution ranking (feedback ×3 + likes + votes) with a weekly spotlight.
- **Nav** — mobile bottom bar with slide-up sheet, ever-present Feedback button, Characters dropdown, Leaderboard link; smoother page transitions.
- **Landing page (wireframe)** — parallax hero, growing seam-tear, draggable Seam Slider, crew silhouette reveal; placeholder art with a wireframe notice.
- **Naming** — crew: The Last Fluent; game: Veilrun.

*Tag this commit `v1.0` in GitHub Desktop to set the baseline.*

---

## Next up (not yet released)
- Landing assets (paired scenes + silhouettes from Midjourney, seam-tear from Figma Weave) → full landing build.
- Accounts (Supabase Auth): individual logins, profiles, real attribution.

<!-- Add new releases at the TOP of the version list, above v1.0. Template:

## vX.Y — <short name> · YYYY-MM-DD
- what changed
- what changed
-->
