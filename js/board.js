/* VEILRUN — Board snapshot for the site (mirrors the Kanban doc; I keep them in sync). */
window.VEILRUN = window.VEILRUN || {};
VEILRUN.board = {
  updated: "2026-07-12",
  columns: [
    { name: "In progress", cards: [
      { id: "VR-41", t: "Supabase backend wiring (feedback, likes, votes)", who: "Claude", pri: "P1" }
    ]},
    { name: "Up next", cards: [
      { id: "VR-46", t: "Expand the design system (document all patterns)", who: "Claude", pri: "P3" },
      { id: "VR-36", t: "Deploy to Cloudflare Pages + real password", who: "Both", pri: "P2" },
      { id: "VR-08", t: "Name decision — 'The Last Fluent' vs Veilrun (group vote)", who: "Jordan", pri: "P2" },
      { id: "VR-05", t: "Re-render the Overcity grittier / less magical", who: "Claude", pri: "P2" },
      { id: "VR-21", t: "Build Manafest + squad (Cookie, Amber…)", who: "Jordan", pri: "P2" },
      { id: "VR-23", t: "Build Nick (Cinder's brother, dark magic)", who: "Jordan", pri: "P2" }
    ]},
    { name: "Backlog", cards: [
      { id: "VR-18", t: "Rook map-recon prototype (fog of war)", who: "Claude", pri: "P2" },
      { id: "VR-38", t: "Character emblem icons (Midjourney)", who: "Jordan", pri: "P2" },
      { id: "VR-30", t: "Ship to PlayStation Store + Steam (north star)", who: "Both", pri: "P1" },
      { id: "VR-33", t: "Ownership, trademark, art-rights (commercial-grade)", who: "Both", pri: "P2" },
      { id: "VR-34", t: "Art pipeline: AI-assisted → toward original", who: "Both", pri: "P2" }
    ]},
    { name: "Done (recent)", cards: [
      { id: "★", t: "Website: Hub, World, Crew, Threats, Synergy, Gallery, Lab, Board", who: "Claude", pri: "" },
      { id: "★", t: "824 renders sorted; full crew + enemy + world art wired", who: "Claude", pri: "" },
      { id: "★", t: "Synergy explorer + combo builder (mobile-first)", who: "Claude", pri: "" },
      { id: "★", t: "Bible: synergy matrix, game modes, roadmap, plan", who: "Claude", pri: "" }
    ]}
  ]
};
