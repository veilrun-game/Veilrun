/* VEILRUN — Board / action tracker for the site (mirrors the Kanban doc; kept in sync). */
window.VEILRUN = window.VEILRUN || {};
VEILRUN.board = {
  updated: "2026-08-08",
  columns: [
    { name: "In progress", cards: [
      { id: "VR-79", t: "3D wave arena — Proving Ground v0 (Vesper slice); Anvil + Citrine next", who: "Claude", pri: "P1" },
      { id: "VR-64", t: "Babel / Manafest — build the 10th character (lore + kit + synergy)", who: "Both", pri: "P2" },
      { id: "VR-65", t: "Balance the 9 landing silhouettes (crop/scale to match) — Photoshop/Figma", who: "Jordan", pri: "P3" }
    ]},
    { name: "On Jordan — Sunday render queue", cards: [
      { id: "MJ", t: "Lieutenants reworked ×6: Ruin, Rapture, Wake, Gall, Fault, Lock (counter-not-mirror + red)", who: "Jordan", pri: "P2" },
      { id: "MJ", t: "Scryemother — reworked as the swarm-hub organism", who: "Jordan", pri: "P2" },
      { id: "MJ", t: "Temper ×2 (portable-forge / weapon-pack) + Vesper ×3 (eyes/mask/hood)", who: "Jordan", pri: "P2" },
      { id: "MJ", t: "Prompts ready to copy/paste — see the Sunday Render Set doc", who: "Jordan", pri: "" }
    ]},
    { name: "Up next", cards: [
      { id: "VR-21", t: "Manafest — pick codename + squad kits (feeds Babel build)", who: "Jordan", pri: "P2" },
      { id: "VR-61", t: "Identity → account-email attribution (waiting on the full email list)", who: "Jordan", pri: "P3" },
      { id: "VR-59", t: "Threats/lore batch — parked until the crew votes on the Threats pages", who: "Both", pri: "P2" },
      { id: "VR-46", t: "Expand the design system (document all patterns)", who: "Claude", pri: "P3" },
      { id: "VR-18", t: "Rook map-recon prototype (fog of war)", who: "Claude", pri: "P2" }
    ]},
    { name: "Backlog", cards: [
      { id: "VR-63", t: "Integrations screen (link PlayStation, etc.)", who: "Both", pri: "P3" },
      { id: "VR-30", t: "Ship to PlayStation Store + Steam (north star)", who: "Both", pri: "P1" },
      { id: "VR-33", t: "Ownership, trademark, art-rights (commercial-grade)", who: "Both", pri: "P2" },
      { id: "VR-34", t: "Art pipeline: AI-assisted → toward original", who: "Both", pri: "P2" }
    ]},
    { name: "Done (recent)", cards: [
      { id: "★", t: "Veilrun's first 3D game — Proving Ground wave arena, playable in the Lab", who: "Claude", pri: "" },
      { id: "★", t: "Crew silhouette row live on the landing + tap-to-gallery", who: "Both", pri: "" },
      { id: "★", t: "All art → WebP (971MB → 104MB, ~89% lighter)", who: "Claude", pri: "" },
      { id: "★", t: "Enemy concept art live; galleries sort by group likes", who: "Both", pri: "" },
      { id: "★", t: "Gallery likes split — My likes vs Liked by anyone", who: "Claude", pri: "" },
      { id: "★", t: "Image archive/hide tool on your profile", who: "Claude", pri: "" },
      { id: "★", t: "Mobile pass — Hub dropdown, accordion nav, bottom bar", who: "Claude", pri: "" },
      { id: "★", t: "Account creation fixed (check-email + welcome)", who: "Claude", pri: "" },
      { id: "★", t: "Name resolved: Veilrun (game) · The Last Fluent (crew, in-world)", who: "Jordan", pri: "" }
    ]}
  ]
};
