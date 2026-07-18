/* VEILRUN — Board snapshot for the site (mirrors the Kanban doc; I keep them in sync). */
window.VEILRUN = window.VEILRUN || {};
VEILRUN.board = {
  updated: "2026-07-13",
  columns: [
    { name: "In progress", cards: [
      { id: "VR-64", t: "Accounts — create/sign-in built; verify Supabase email setting + test", who: "Both", pri: "P1" },
      { id: "VR-60", t: "Landing page — wireframe live; paused pending Weave/MJ assets", who: "Both", pri: "P2" }
    ]},
    { name: "Up next", cards: [
      { id: "VR-21", t: "Manafest — kit drafted; pick codename + squad kits", who: "Jordan", pri: "P2" },
      { id: "VR-63", t: "Landing assets: paired scenes + silhouettes (MJ) + seam-tear (Weave)", who: "Jordan", pri: "P2" },
      { id: "VR-66", t: "Google sign-in — wire button + login return (once you enable it)", who: "Both", pri: "P2" },
      { id: "VR-65", t: "Profile v2: change password, reorder your own pictures", who: "Claude", pri: "P3" },
      { id: "VR-46", t: "Expand the design system (document all patterns)", who: "Claude", pri: "P3" },
      { id: "VR-18", t: "Rook map-recon prototype (fog of war)", who: "Claude", pri: "P2" }
    ]},
    { name: "Backlog", cards: [
      { id: "VR-23", t: "Nick as own character — paused; folded into Cinder's kit for now", who: "Jordan", pri: "P3" },
      { id: "VR-55", t: "Weave-thinned art variant (both layers)", who: "Claude", pri: "P3" },
      { id: "VR-30", t: "Ship to PlayStation Store + Steam (north star)", who: "Both", pri: "P1" },
      { id: "VR-33", t: "Ownership, trademark, art-rights (commercial-grade)", who: "Both", pri: "P2" },
      { id: "VR-34", t: "Art pipeline: AI-assisted → toward original", who: "Both", pri: "P2" }
    ]},
    { name: "Done (recent)", cards: [
      { id: "★", t: "Profile page — display name, pick your character, sign out", who: "Claude", pri: "" },
      { id: "★", t: "Accounts — email sign-in / create-account flow (Supabase Auth)", who: "Claude", pri: "" },
      { id: "★", t: "Characters overview page + tidied nav dropdown", who: "Claude", pri: "" },
      { id: "★", t: "Crew leaderboard live — contribution ranking + weekly spotlight", who: "Claude", pri: "" },
      { id: "★", t: "Nav tidied — Characters dropdown + Leaderboard link", who: "Claude", pri: "" },
      { id: "★", t: "Landing wireframe — parallax, seam-tear, draggable Seam Slider", who: "Claude", pri: "" },
      { id: "★", t: "Lab voting live — up-vote ideas, counted group-wide", who: "Claude", pri: "" },
      { id: "★", t: "Nav → mobile bottom bar + ever-present Feedback CTA", who: "Claude", pri: "" },
      { id: "★", t: "Name locked: The Last Fluent (crew) · Veilrun (game)", who: "Jordan", pri: "" },
      { id: "★", t: "Supabase backend (feedback, likes, votes) + weekly review", who: "Claude", pri: "" },
      { id: "★", t: "Environment art re-rendered (unified photoreal recipe)", who: "Claude", pri: "" },
      { id: "★", t: "Website: Hub, World, Crew, Threats, Synergy, Gallery, Lab, Board", who: "Claude", pri: "" }
    ]}
  ]
};
