# VEILRUN website — how to run & edit

## Run it
Open **`index.html`** in a browser. Enter the passphrase (default: `bothsides`) → lands on the Hub.

Two ways that work best:
- Double-click `index.html` (works for most things).
- Or, for zero quirks, serve the folder: in Terminal, `cd` into this folder and run `python3 -m http.server`, then open `http://localhost:8000`.

## Where things live
- **Change content** (world, crew, kits, modes, updates) → `js/data.js`. Plain data, no layout. Add a character = add an object to `VEILRUN.crew`.
- **Change look** (colors, fonts, spacing, the seam) → `css/tokens.css`. Edit a token once, whole site updates.
- **Change layout/components** → `css/base.css` + `js/components.js`.
- **Add a page/section** → add a view in `js/app.js` (`views.xxx`) and a nav link in `app.html`.

## The passphrase
Set in `index.html` (`PASSPHRASE`). This is a **soft gate only** — good for keeping casual eyes out, not real security (the files are viewable in the browser). Real password protection gets added at the host (Netlify/Cloudflare) when we deploy.

## What's built (v1 foundation)
- Landing + soft gate → Hub dashboard.
- **World** and **Crew** (with per-character detail: kit, codenames, full synergy set) — live from data.
- **Lab** (mode cards + feedback), **Updates**, and a link to the interactive **Synergy Matrix**.
- **Threats** and **Gallery** are wired stubs — structure's there, content/art next.
- In-context **Feedback** buttons (log locally for now; route to Jordan at deploy).

## What's next
- Wire the sorted art (`../assets/...`) into Crew portraits, Threats, and Gallery.
- Build the Combo Builder + Rook map prototype into the Lab.
- Deploy to a free URL (Netlify) with host-level password.
