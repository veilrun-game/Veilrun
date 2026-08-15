# assets/gameref/ — cover art for the Game Reference (VR-98)

**Drop a file in here and the card picks it up. No code change, no `js/data.js` edit.**

## The convention

```
assets/gameref/<slug>.webp
```

`<slug>` is the key in `VEILRUN.gameRefs` in `js/data.js` — lower-case, letters and digits
only, no spaces or punctuation. Look it up there rather than guessing from the title, because
several display names don't match their key (`Marvel's Spider-Man 2` → `spiderman2`,
`Orcs Must Die! (series)` → `orcsmustdie`).

Examples:

```
assets/gameref/helldivers2.webp
assets/gameref/callofdutyzombies.webp
assets/gameref/eldenringnightreign.webp
```

## How the fallback works

Every card renders a **typographic tile** — the game's name in Oswald on the panel gradient —
and then layers the image on top of it. If the file isn't there, the `<img>` removes itself
and the tile shows through.

That means a missing cover is a **designed state, not a gap**. There is no broken-image frame
and no empty box, so the catalogue can be filled in one game at a time, in any order, whenever
you feel like it. It also satisfies the `CLAUDE.md` rule that every asset load falls back.

## Format

- **WebP**, quality 85, method 6 — the same encode as the gallery (see the `veilrun-gallery-drop`
  skill for the exact command).
- **Landscape**, roughly **460 × 215**. Cards are wide, and the tile is 200px on desktop and a
  140px banner on mobile, so anything near 2:1 crops cleanly.
- **Aim for 40–60 KB.** Fifty covers at that size is ~2.5 MB total, all lazy-loaded — about
  the weight of one character's gallery folder.

Convert with:

```
cwebp -q 85 -m 6 source.png -o assets/gameref/<slug>.webp
```

## A note on the images themselves

These are small identifying thumbnails on a password-gated page for ten people — ordinary
practice for a reference list. Keep them small, keep them local, and don't turn this folder
into a public art gallery. The image exists to make a card recognisable at a glance, nothing
more.
