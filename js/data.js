/* VEILRUN — Content (edit here to add/change; no layout code lives in this file). */
window.VEILRUN = window.VEILRUN || {};

VEILRUN.world = {
  premise: "Reality has two halves drifting apart. If they fully separate, the world we see dies. The crew are the only ones fluent in both — and someone powerful is trying to finish the split on purpose.",
  force: [
    { name: "The Current", side: "Topside", text: "They treat it as technology — circuitry, machines. Most never ask what's underneath." },
    { name: "The Weave", side: "The hidden layer", text: "The same force treated as magic — binding, weaving, will. Neither language is wrong." },
    { name: "The Rule", side: "The catch", text: "The Current is conserved, and it remembers. Drain a place and it goes 'thin'. Big effects always cost something." }
  ],
  layers: [
    { name: "The Overcity", tag: "Topside · the Current", img: "assets/img/overcity.webp", text: "A vertical industrial-arcane metropolis, surveilled. Most live and die here never knowing the other layer is real." },
    { name: "The Underweft", tag: "The Weave", img: "assets/img/underweft.webp", text: "The same city's hidden self, rearranged by meaning not distance. Beautiful and wrong-feeling." },
    { name: "The Seam", tag: "The border", img: "assets/img/seam.webp", text: "A translation gradient. Cross it and words, visuals, even item names shift. The crew is fluent on both sides." },
    { name: "The Thinned", tag: "The blight", img: "assets/img/thinned.webp", text: "When too much Current is drained, a place goes thin — colorless, listless. The endpoint of the drift." }
  ],
  sundering: "~200 years ago someone tried to seize the Current at scale and tore the translation apart. The seams hardened overnight; families were split across a border that had been a doorway. The two languages keep drifting — and it's accelerating. If the drift completes, the layers separate for good.",
  villain: { name: "The Severant", text: "A former Warden, grieving and half-right, fluent in both layers, trying to FINISH the Sundering. He believes separation is mercy. The crew's dark mirror." },
  factions: [
    { name: "The Concord", text: "The establishment. Denies the Weave, strip-mines the Current, runs the surveillance state." },
    { name: "The Wardens", text: "Seam-keepers; a ceremonial rune-priest order. Uneasy allies as often as enemies." },
    { name: "The Hollowmen", text: "Zealots who want the severance to complete. The apocalyptic faction." },
    { name: "The Trade", text: "The underworld running on cross-seam goods." },
    { name: "The Stranded", text: "The split families and victims of the Sundering. The crew's people." }
  ]
};

// Members / sub-types inside the "collection" threats. Keyed by threat id (VEILRUN.threats).
// Singles (severant, wardens) have no entry → they render as a single build-out page.
// `proposed: true` marks concepts we're floating for feedback (art stays TBD until generated).
VEILRUN.threatMembers = {
  lieutenants: [
    { id: "choir", name: "The Choir", mirrors: "Rook", role: "Named mini-boss", palette: "sickly pale-green / bone",
      dir: "assets/enemies/lieutenants/choir", count: 12,
      desc: "Rook reads minds with serene control; the Choir cages them. A gaunt psionic wreck streaming sickly green light, haloed by overlapping screaming faces — the minds he's trapped. Telepathy turned into a prison." },
    { id: "slag", name: "Slag", mirrors: "Temper", role: "Named mini-boss", palette: "molten red-orange / charcoal",
      dir: "assets/enemies/lieutenants/slag", count: 8,
      desc: "Temper masters every weapon; Slag just hoards them. A hulking figure draped in dozens of crudely fused blades, molten light bleeding through blackened armor, dragging an ugly cleaver. Craft replaced by quantity — grafting, not forging." },
    { id: "tithe", name: "Tithe", mirrors: "Magpie", role: "Named mini-boss", palette: "sickly crimson / ashen grey",
      dir: "assets/enemies/lieutenants/tithe", count: 16,
      desc: "Magpie salvages the discarded; Tithe drains the living. A witch-mechanic hung with stolen bone-charms and crimson siphons, tubes pulling grey Current from withered victims. Resourcefulness twisted into parasitism." },
    { id: "gall", name: "Gall", mirrors: "Cinder", role: "Named mini-boss", palette: "bilious green / black",
      dir: "assets/enemies/lieutenants/gall", count: 12,
      desc: "Cinder feeds the crew; Gall feeds them rot. A banquet-master who turns nourishment into poison — brewing plagues where Cinder brews buffs, a feast that hollows you from the inside." },
    { id: "wake", name: "Wake", mirrors: "Vesper", role: "Named mini-boss", palette: "deep indigo / void",
      dir: "assets/enemies/lieutenants/wake", count: 8,
      desc: "Vesper guards unseen; Wake erases without a trace. A hollow that dissolves into shadow and unmakes people mid-sentence — the quiet protector inverted into a stalker you never wake from." },
    { id: "fault", name: "Fault", mirrors: "Citrine", role: "Named mini-boss", palette: "sickly yellow / red",
      dir: "assets/enemies/lieutenants/fault", count: 8,
      desc: "Citrine powers the crew; Fault overloads the district. A live-wire trapmaster who wires whole streets into a killing grid — current turned from a tool into an execution." },
    { id: "lock", name: "Lock", mirrors: "Latch", role: "Named mini-boss", palette: "corrupted electric-blue / white",
      dir: "assets/enemies/lieutenants/lock", count: 24,
      desc: "Latch opens doors between worlds; Lock seals them shut. A dimensional jailer who folds people into pocket-cells and severs every link that could reach them — connection turned to solitary." },
    { id: "rapture", name: "Rapture", mirrors: "Wren", role: "Named mini-boss", palette: "blinding magenta / white",
      dir: "assets/enemies/lieutenants/rapture", count: 12,
      desc: "Wren holds immense power barely in check; Rapture lets all of it go. An ecstatic surge of raw arcane force with no restraint and no mercy — the power without the person to hold it back." },
    { id: "ruin", name: "Ruin", mirrors: "Anvil", role: "Named mini-boss", palette: "gunmetal / iron-red",
      dir: "assets/enemies/lieutenants/ruin", count: 12,
      desc: "Anvil is the immovable shield; Ruin is the unstoppable wreck. A siege-engine of a man built only to flatten — protection inverted into pure demolition." }
  ],
  concord: [
    { id: "enforcer", name: "Concord Enforcer", role: "Fodder", palette: "gunmetal + red",
      dir: "assets/enemies/concord/enforcer", count: 24,
      desc: "A faceless visored riot trooper with one glowing red slit, sleek dark industrial-arcane armor, a current-powered rifle. Disciplined and anonymous — the boot of the surveillance state." },
    { id: "hunter", name: "Concord Hunter", role: "Elite", palette: "black / steel + searing red",
      dir: "assets/enemies/concord/hunter", count: 16,
      desc: "An elite tracker built to run down seam-crossers: heavy black armor, red optics, rune-dampening tech, a current-charged glaive. Cold and predatory." },
    { id: "warrant", name: "The Warrant", role: "Elite · commander", palette: "steel + cold red",
      dir: "assets/enemies/concord/warrant", count: 4,
      desc: "The inquisitor who signs the hunts — a Concord commander who never dirties their own hands, only authorizes. A face for the empire's cruelty." }
  ],
  hollowmen: [
    { id: "cultist", name: "Hollowman Cultist", role: "Fodder", palette: "crimson + black",
      dir: "assets/enemies/hollowmen/cultist", count: 12,
      desc: "A fanatic in torn crimson-and-black robes, cracked bone mask, dull-red rune-scars, a curved ritual blade. Gaunt and zealous — the rank and file of the apocalypse." },
    { id: "chant", name: "The Chant", role: "Elite", palette: "crimson + ash",
      dir: "assets/enemies/hollowmen/chant", count: 4,
      desc: "Where cultists cut, the Chant unmakes — a robed priest droning the severance-hymn, thinning the very air around them. The order's voice, and its worst idea." },
    { id: "scarred", name: "Rune-Scarred", role: "Elite", palette: "raw red + bone",
      dir: "assets/enemies/hollowmen/scarred", count: 4,
      desc: "A convert so covered in glowing rune-scars the flesh barely holds — a walking wound where the severance is already half-finished. What true belief costs." }
  ],
  thinned: [
    { id: "husk", name: "Thinned Husk", role: "Fodder", palette: "grey + dying ember",
      dir: "assets/enemies/thinned/husk", count: 20,
      desc: "A hollowed-out human drained of color and life — ashen cracked skin, empty flickering eyes, a listless shamble. The human cost of the drift made into an enemy. Tragic more than evil." },
    { id: "beast", name: "Drained Beast", role: "Creature", palette: "grey + bone-white",
      dir: "assets/enemies/thinned/beast", count: 12,
      desc: "A once-living predator hollowed by the thinning — emaciated grey hide over bone, hollow white eyes, trailing dead Current. Gaunt, unnatural, and still hunting." }
  ],
  "weave-horrors": [
    { id: "horror", name: "Weave-horror", role: "Monster", palette: "toxic green + violet",
      dir: "assets/enemies/weave-horrors/horror", count: 16,
      desc: "A body that folds wrong through space — too many angles, limbs of crystallized arcane light, no face, only drifting runic glyphs. Not a soldier; a wound in geometry." },
    { id: "maw", name: "The Maw", role: "Environmental mini-boss", palette: "void + green / violet",
      dir: "assets/enemies/weave-horrors/maw", count: 4,
      desc: "A massive tear in reality shaped like a circling mouth of fractured light and shadow, ringed by broken runes and grasping tendrils, swallowing the light around it." }
  ],
  scrye: [
    { id: "drone", name: "Scrye Drone", role: "World-flavor", palette: "current-blue + violet",
      dir: "assets/enemies/scrye/drone", count: 12,
      desc: "A single hovering Concord eye — one glowing blue lens ringed by orbiting glyphs, sweeping scan-beams across the streets. Alone it's nothing; the swarm is everywhere." },
    { id: "scryemother", name: "Scryemother", role: "??? · rumored hub", palette: "deep blue + violet",
      dir: "assets/enemies/scrye/scryemother", count: 8,
      desc: "The rumored hub the swarm reports to, where every feed converges. Blind it and you blind the Concord — if it exists at all." }
  ]
};

VEILRUN.crew = [
  {
    id: "saffron", name: "Cinder", player: "Zack", alias: "Soviet", accent: "var(--c-saffron)",
    gamingName: "SovietEspionage", actualName: "Zack", nickname: "Soviet",
    img: "assets/img/saffron.webp", pick: "Cinder",
    role: "Alchemist-Infiltrator", tagline: "The Cook — chemistry, brews, and quiet kills.",
    lore: "The chef whose pharmacology lets him pass unseen or drop a target without a sound. In the Weave, his cooking reads as alchemy.",
    codenames: ["Cinder","Saffron","Marrow","Brine","Hemlock","Decoct"],
    kit: { passive: { name: "Tolerance", text: "Immune to poisons, gas, sedatives; can dose himself for combat highs no one else can stomach." },
      actives: [ {name:"Concoction", text:"Brew effects pre-mission — sleep aerosols, hallucinogens, combat stims."},
                 {name:"Last Supper", text:"A silent contact toxin for clean eliminations."},
                 {name:"Field Kitchen", text:"Drop a station mid-mission that cooks buffs and antidotes for the crew."} ],
      ult: { name:"Seven-Course", text:"A layered chemical assault set off in sequence — gas, hallucinogen, corrosive, incendiary, each course feeding the next." } },
    synergies: [ {name:"Quenched Steel (aura)", text:"With Temper (roommates): compounds bound into steel — blades that poison or sear."},
                 {name:"Flashpoint", text:"Citrine sparks a Saffron gas cloud into an area bomb."},
                 {name:"Old Recipes", text:"With Magpie: ritual herbalism meets chemistry for brews neither makes alone."} ]
  },
  {
    id: "temper", name: "Temper", player: "Todd", alias: "Toddlez", aliases: ["Toddlez", "BipolarCrayons", "Toddles"], accent: "var(--c-temper)",
    gamingName: "BipolarCrayons", actualName: "Todd", nickname: "Toddlez",
    img: "assets/img/temper.webp",
    role: "Weaverforge Blademaster", tagline: "Master of all weapons, peerless with the blade.",
    lore: "He doesn't just build weapons — he binds properties into steel. Dangerous at range, lethal up close, unmatched in a duel.",
    codenames: ["Temper","Cooper","Sever","Quench","Forge","Ward"],
    kit: { passive: { name:"Forgebound", text:"Any weapon he wields gains bonus stats; melee and blades gain DOUBLE." },
      actives: [ {name:"Frankenforge", text:"Fuse two weapons mid-mission into a hybrid (arc-edge, flame-cleaver)."},
                 {name:"Bladedance", text:"A close-quarters flurry that deflects projectiles and punishes anyone who closes."} ],
      ult: { name:"The Last Edge", text:"A masterwork katana forged from a sliver of the Weave — cuts through anything, even the seam between layers." } },
    synergies: [ {name:"Protean", text:"With Latch: a shifting dimensional state bound into the blade — flows between forms in real time."},
                 {name:"Stormsteel", text:"With Citrine: an arc-katana that chains lightning."},
                 {name:"Quenched Steel (aura)", text:"With Saffron (roommates): pre-treated poison/sear blades."} ]
  },
  {
    id: "vesper", name: "Vesper", player: "Ramon", alias: "Ramos the Wise", aliases: ["RamosTheWise"], accent: "var(--c-vesper)",
    gamingName: "RamosTheWise", actualName: "Ramon", nickname: "Ramos",
    img: "assets/img/vesper.webp",
    role: "Phantom Assassin", tagline: "The unseen one — stealth and resilience in one.",
    lore: "Sits in a corner of a room unnoticed. Resilient where most stealth classes are fragile. Brother to Rook.",
    codenames: ["Vesper","Dusk","Hush","Gloam","Still","Wraith","Bishop"],
    kit: { passive: { name:"Shroud (metered)", text:"Moving and acting drain a stealth meter; going still refills it fast. Bank cloak by being patient." },
      actives: [ {name:"Veilstep", text:"Spend meter for a short blink that breaks line of sight."},
                 {name:"Execute", text:"A guaranteed silent takedown from stealth."} ],
      ult: null },
    synergies: [ {name:"Marked Prey (aura: Blood Echo)", text:"With Rook (brothers): Rook marks through walls and blinks Vesper into a guaranteed kill."},
                 {name:"Threadlink: Sever", text:"With Latch (best friends): the hive mind — Execute through a marked target without line of sight."} ]
  },
  {
    id: "citrine", name: "Citrine", player: "Julian", alias: "Mango", aliases: ["ItsBabyMango"], accent: "var(--c-citrine)",
    gamingName: "ItsBabyMango", actualName: "Julian", nickname: "Mango",
    img: "assets/img/citrine.webp",
    role: "Electrician / Trap Engineer", tagline: "Everything electrical — from a single device to a whole city.",
    lore: "Traps, EMPs, and current at any scale. In the Weave, he commands the lightning-spirit in the wire.",
    codenames: ["Citrine","Fuse","Arc","Filament","Ground","Stormwire"],
    kit: { passive: { name:"Conduit", text:"Electrified melee and faster interaction with any device." },
      actives: [ {name:"Trapline", text:"Place tripwires, shock mines, and lures."},
                 {name:"Cascade", text:"A scalable EMP — one device, to a building, to a whole district."} ],
      ult: null },
    synergies: [ {name:"Hot Feed (universal aura)", text:"Allies near Citrine get faster ability recharge — he's a walking power outlet."},
                 {name:"Gridfall", text:"With Latch: the EMP jumps device → building → district."},
                 {name:"Stormsteel", text:"With Temper: an arc-katana that chains lightning."} ]
  },
  {
    id: "latch", name: "Latch", player: "Jordan", alias: "jkrazy", accent: "var(--c-latch)",
    gamingName: "Jkrazy", actualName: "Jordan", nickname: "J",
    img: "assets/img/latch.webp",
    role: "Dimensional Technologist · The Keystone", tagline: "Hacker, creative technologist, martial artist — the crew's multiplier.",
    lore: "Reads and rewrites the threads of how things are bound. Weaker solo by design; built to make everyone else better.",
    codenames: ["Latch","Loomhand","Warp","Cipher","Key","Tangent"],
    kit: { passive: { name:"Higher Dimension", text:"Briefly sees through walls and phase-layers, revealing hidden routes and enemy intent." },
      actives: [ {name:"Augment", text:"Buff an ally's next ability — a gas spreads twice as far, an EMP jumps to a whole building."},
                 {name:"Breach", text:"Hack or disable any tech-based obstacle or enemy device."} ],
      ult: null },
    synergies: [ {name:"The keystone", text:"Every character's ceiling goes up when Latch Augments them."},
                 {name:"Threadlink (aura)", text:"With Vesper (best friends): shared senses / hive mind; echo-cast each other's abilities."},
                 {name:"Two Tongues (aura)", text:"With Magpie (partners): rune + tech binding open any lock instantly."} ]
  },
  {
    id: "wren", name: "Wren", player: "Zaylee", alias: "krayzay", aliases: ["KrayZay"], accent: "var(--c-wren)",
    gamingName: "KrayZay", actualName: "Zaylee", nickname: "Zay",
    img: "assets/img/wren.webp",
    role: "Prodigy", tagline: "Small but mighty — natural talent, maxed-out gear.",
    lore: "The most naturally gifted of the crew, and she's 17. She doesn't cast — she dances, and the current follows her movement. Her dad (Latch) builds her gear; Magpie is her stepmom.",
    codenames: ["Wren","Sparrow","Pip","Spark","Ember","Jinx"],
    kit: { passive: { name:"Overclocked", text:"Her abilities scale harder than anyone's but build strain when overused. Highest ceiling, real cost." },
      actives: [ {name:"Cadence", text:"Power runs on rhythm — land abilities on the beat to build a momentum meter that amplifies everything."},
                 {name:"Surge", text:"A burst of current channeled through a movement — a small body hitting absurdly hard."},
                 {name:"Latch's Aegis", text:"Her father's protective ward, tougher than her size suggests."} ],
      ult: { name:"Crescendo", text:"A full performance of dance-driven strikes, each move feeding the next — the longer she holds the rhythm, the bigger the finish." } },
    synergies: [ {name:"Inheritance (aura)", text:"With Latch (father/daughter): his Augment on her is oversized; strain builds slower near him."},
                 {name:"Hearth (aura)", text:"With Magpie (stepmom): her ward raises Wren's strain ceiling."} ]
  },
  {
    // "Maddogg" (two g's) is how Michael actually signed up — found 8/10 in votes, logins and game_scores.
    // Without it, every one of his rows fell out of identityFor() and off the contribution leaderboard.
    id: "anvil", name: "Anvil", player: "Michael", alias: "Maddog", aliases: ["Mike", "Maddogg"], accent: "var(--c-anvil)",
    gamingName: "Maddog", actualName: "Mike", nickname: null, // Jordan flagged unsure (7/20) — ask Mike
    img: "assets/img/anvil.webp",
    role: "Juggernaut", tagline: "The immovable wall — the loud option, and the sleeper.",
    lore: "Nearly indestructible. He scales his own size — small enough to blend into a crowd, then erupts into a towering wall of armor.",
    codenames: ["Anvil","Rampart","Granite","Boulder","Atlas","Breaker"],
    kit: { passive: { name:"Unbreakable", text:"Heavy damage reduction, can't be staggered." },
      actives: [ {name:"Mass", text:"Scale his size — blend into a crowd, then grow toward a juggernaut (bigger = harder-hitting but slower and louder)."},
                 {name:"Rampage", text:"Charge through walls, cover, and enemies — and any ally caught in his path gets plowed along, carried safely through the breach with him."},
                 {name:"Aggro", text:"Force enemies to focus him while the crew repositions."} ],
      ult: null },
    synergies: [ {name:"Bulwark (universal aura)", text:"Allies in Anvil's shadow can't be staggered and take reduced splash — he's cover that walks."},
                 {name:"Doorbreaker", text:"Augmented by Latch, he carries enemies THROUGH the seam into the Weave."} ]
  },
  {
    id: "magpie", name: "Magpie", player: "Ali", alias: "inaudiblerooster", aliases: ["inaudibleRooster"], accent: "var(--c-magpie)",
    gamingName: "inaudibleRooster", actualName: "Ali", nickname: "rooster",
    img: "assets/img/magpie.webp",
    role: "Hexwright · Witch-Mechanic", tagline: "Part grease-monkey, part witch — she builds, and her engineering is craft-work.",
    lore: "The crew's witch-fixer. She provides through Weave-craft: half-machine, half-fetish contraptions, warding a sanctum, and reading what's coming. The hearth and protector of the crew. Partner to Latch; stepmom to Wren.",
    codenames: ["Magpie","Hearth","Relic","Cache","Omen","Piston"],
    kit: { passive: { name:"The Hoard", text:"Her stash is scavenged parts AND charms, stones, and bones; she fabricates whatever the crew needs. Cheaper, broader loadouts for everyone." },
      actives: [ {name:"Warded Sanctum", text:"Builds and consecrates the home base — reinforced with runework so it stands across the seam. Uninvited enemies who cross are weakened."},
                 {name:"Contraptions", text:"Deploy devices that are equal parts machine and ritual: a bone-and-wire turret, a rune-etched trap, a censer-drone."},
                 {name:"Rig the Ride", text:"Her enchanted vehicle can punch a short Weave-path for the escape."} ],
      ult: { name:"The Rite", text:"A ritual that builds over time and pays off huge — a crew-wide blessing, a curse on a target, or stabilizing a thinned zone." } },
    synergies: [ {name:"Two Tongues (aura)", text:"With Latch (partners): rune + tech binding unbind any lock instantly."},
                 {name:"Hearth (aura)", text:"With Wren (stepmom): her ward raises the prodigy's strain ceiling."},
                 {name:"Old Recipes", text:"With Saffron: ritual herbalism meets chemistry."} ]
  },
  {
    id: "rook", name: "Rook", player: "Naz", alias: "Darz", aliases: ["OfficerBucky"], accent: "var(--c-rook)",
    gamingName: "OfficerBucky", actualName: "Naz", nickname: "Darz", // confirmed Naz (7/25)
    img: "assets/img/rook.webp",
    role: "Psionic · Vesper's Brother", tagline: "Telepathy, teleport, telekinesis — the crew's sixth sense.",
    lore: "In a wheelchair, with overwhelming mental power. A sixth sense for his brother on covert missions. The seen world has no words for what he does.",
    codenames: ["Rook","Augur","Pale","Oracle","Echo","Sage"],
    kit: { passive: { name:"Sixth Sense", text:"Shares enemy positions with the crew, strongest when linked to his brother." },
      actives: [ {name:"Telekinesis", text:"Throw objects and enemies, manipulate the environment."},
                 {name:"Blink", text:"Teleport himself or an ally a short range."} ],
      ult: null },
    synergies: [ {name:"Marked Prey (aura: Blood Echo)", text:"With Vesper (brothers): marks a target through walls and blinks his brother into a guaranteed silent kill."},
                 {name:"Second Sight", text:"With Magpie: Drift-reading + Sixth Sense — the crew sees the next 10 seconds."} ]
  },
  {
    // "GloriousGlanz" is Manafest's sign-up name — confirmed by Jordan 8/10. Same class of bug as
    // Anvil's "Maddogg": without it his 6 sessions fell out of identityFor() and he read as dormant.
    id: "babel", name: "Babel", player: "Manafest", alias: "Manafest", aliases: ["GloriousGlanz"], accent: "var(--c-babel)",
    gamingName: "ManafestDread", actualName: "Manafest", nickname: "Manafest", // real name is Jordan — omitted to avoid colliding with Latch's Jordan in identity matching (VR-64)
    img: "assets/img/babel.webp",
    role: "The Interpreter — linguist · commander · diplomat", tagline: "Fluent in every tongue of both halves; talks the world back together.",
    lore: "A military linguist out of the Stranded who speaks every dialect of the Current and the Weave — and the dead tongues from before the Sundering. Where the crew are fluent in both halves, Babel is fluent in all of them, which makes him the Severant's natural opposite: living proof the two worlds can still be spoken together. Balanced field-commander and scholar-diplomat — his real edge is communication and persuasion, and he never fights alone. (Concept in progress — portrait and kit still being shaped; feedback very welcome.)",
    codenames: ["Babel","Cipher","Tongues","Lex","Pentecost"],
    kit: { passive: { name:"Polyglot", text:"Reads and operates any faction's tech or runes; allies near him cross the Seam with no penalty — meanings stay legible." },
      actives: [ {name:"True Name", text:"Speak an enemy's true name to stagger, expose, or briefly disable it (bosses resist)."},
                 {name:"Silver Tongue", text:"Talk a lesser enemy into standing down or switching sides for a short time — de-escalate or open a path without a fight."},
                 {name:"Fireteam · Amber & Cookie", text:"Two named support fighters deploy with the same weapon kit as Babel — so he's a three-person fireteam even when solo."},
                 {name:"Babel Field", text:"An area where language scrambles for enemies — they miscommunicate and lose coordination — while allies stay clear."} ],
      ult: { name:"Lingua Prima", text:"Speaks the original pre-Sundering tongue for a few seconds and rewrites a slice of the battlefield — heal a Thinned zone, translate a wall into a door, silence the Weave-horrors." } },
    synergies: [ {name:"Old Tongues", text:"With Magpie: feeds her advanced, ancient language — her salvage-hexes become precise, older, and far stronger."},
                 {name:"Farsight", text:"With Latch: Latch opens a rift, Babel reads what's on the other side so it lands exactly right."} ]
  }
];

/* Structured synergy data — powers the mobile explorer + combo builder. */
VEILRUN.synergy = {
  pairs: [
    { a:"anvil",   b:"latch",   name:"Battering Ram",   effect:"Anvil Rampages through a wall while Latch bends the seam — Anvil plows Latch along in the breach, carrying them both across (even between the two worlds) in one unstoppable hit." },
    { a:"babel",   b:"magpie",  name:"Old Tongues",     effect:"Babel feeds Magpie advanced, ancient language — her salvage-hexes become precise, older, and far stronger." },
    { a:"babel",   b:"latch",   name:"Farsight",        effect:"Latch opens a rift; Babel reads what's on the far side so it lands exactly right, and kits the fireteam with Latch's dimensional gear." },
    { a:"saffron", b:"temper",  name:"Venomforge",      effect:"Saffron's compounds bound into Temper's steel — blades that poison or sear on contact." },
    { a:"saffron", b:"vesper",  name:"Quiet Catering",  effect:"A guaranteed traceless kill; sleep aerosols don't break Vesper's stealth meter." },
    { a:"saffron", b:"citrine", name:"Flashpoint",      effect:"Citrine sparks a Saffron gas cloud into an area bomb." },
    { a:"saffron", b:"latch",   name:"Ventilation",     effect:"Augmented gas spreads twice as far; Breach pushes it through a building's air system." },
    { a:"saffron", b:"wren",    name:"Encore Shot",     effect:"A stim tuned to her Cadence — her next Crescendo ignores strain, then the bill comes due." },
    { a:"saffron", b:"anvil",   name:"Fog Wagon",       effect:"Dispensers on Anvil's armor — his Rampage lays a wall of gas behind him." },
    { a:"saffron", b:"magpie",  name:"Old Recipes",     effect:"Ritual herbalism meets chemistry — Weave-active brews neither makes alone." },
    { a:"saffron", b:"rook",    name:"Silver Service",  effect:"Rook telekinetically places vials with surgical precision — through windows, mid-air." },
    { a:"temper",  b:"vesper",  name:"Twin Edges",      effect:"A 'still blade' costs Vesper no meter to draw; his Execute opens a free Bladedance." },
    { a:"temper",  b:"citrine", name:"Stormsteel",      effect:"A charge fused into the blade — an arc-katana that chains lightning." },
    { a:"temper",  b:"latch",   name:"Protean",         effect:"An unfixed dimensional state bound into the blade — flows between forms in real time." },
    { a:"temper",  b:"wren",    name:"Tempo",           effect:"Her rhythm syncs to his bladework: parry windows widen and deflects feed her meter." },
    { a:"temper",  b:"anvil",   name:"Hammer & Anvil",  effect:"Anvil staggers a line through a wall; Temper meets them on the other side." },
    { a:"temper",  b:"magpie",  name:"Charmed Steel",   effect:"Hexes worked into a Frankenforge hybrid — holds permanently, carries a curse rider." },
    { a:"temper",  b:"rook",    name:"Guided Edge",     effect:"Thrown blades steered in flight and recalled — impossible angles." },
    { a:"vesper",  b:"citrine", name:"Baited Shadow",   effect:"A decoy lures pursuers into Trapline — shocked enemies never saw either of them." },
    { a:"vesper",  b:"latch",   name:"Threadlink: Sever", effect:"The hive mind weaponized — Execute through a marked target without line of sight." },
    { a:"vesper",  b:"wren",    name:"Misdirection",    effect:"Every eye on Wren's performance while Vesper works the dark." },
    { a:"vesper",  b:"anvil",   name:"Thunder & Silence", effect:"Aggro drags the room to Anvil; anyone facing away is Execute-eligible." },
    { a:"vesper",  b:"magpie",  name:"Smokecraft",      effect:"Warding smoke counts as stealth cover and refills Vesper's Shroud inside it." },
    { a:"vesper",  b:"rook",    name:"Marked Prey",     effect:"Rook marks through walls and blinks his brother into a guaranteed silent kill." },
    { a:"citrine", b:"latch",   name:"Gridfall",        effect:"Augmented Cascade — the EMP jumps device → building → district." },
    { a:"citrine", b:"wren",    name:"Live Wire",       effect:"Her dance discharges chain lightning on the beat; traps feed her meter." },
    { a:"citrine", b:"anvil",   name:"Thundershield",   effect:"Electrified armor — melee arcs back; Rampage becomes a rolling shock field." },
    { a:"citrine", b:"magpie",  name:"Witchlight",      effect:"A storm heart in a bone-and-wire turret; rune-traps chain into shock mines." },
    { a:"citrine", b:"rook",    name:"Conductor",       effect:"Rook throws enemies into live traps; a TK object through Citrine's arc is a railgun round." },
    { a:"latch",   b:"wren",    name:"Inheritance: Overdrive", effect:"The strongest amp in the game — her next ability at double scale, zero strain." },
    { a:"latch",   b:"anvil",   name:"Doorbreaker",     effect:"Augmented Anvil carries enemies THROUGH the seam into the Weave." },
    { a:"latch",   b:"magpie",  name:"Two Tongues: Unbind", effect:"Any lock, ward, or seal — tech + rune binding open it instantly." },
    { a:"latch",   b:"rook",    name:"Coordinates",     effect:"Higher Dimension feeds Rook exact data — Blink range doubles, passes through read walls." },
    { a:"wren",    b:"anvil",   name:"Guardrail",       effect:"Anvil bodies the crowd off her stage; if strain crashes her, he catches the fall." },
    { a:"wren",    b:"magpie",  name:"Hearth: Blessing", effect:"Inside the ward, Wren's strain limit rises — the prodigy pushes harder, safely." },
    { a:"wren",    b:"rook",    name:"Lift",            effect:"Telekinetic choreography — aerial verses her body couldn't reach alone." },
    { a:"anvil",   b:"magpie",  name:"Warded Wall",     effect:"Charm-plated armor annuls the first big hit each fight; a consecrated battering ram." },
    { a:"anvil",   b:"rook",    name:"Siege",           effect:"Anvil breaks it, Rook throws it — debris steered mid-flight into the wrong people." },
    { a:"magpie",  b:"rook",    name:"Second Sight",    effect:"Drift-reading + Sixth Sense — the crew sees the next 10 seconds." }
  ],
  auras: [
    { name:"Quenched Steel", members:["saffron","temper"], rel:"roommates", effect:"Temper's weapons come pre-treated with Saffron's compounds; his cleaver counts as a Forgebound blade." },
    { name:"Threadlink",     members:["latch","vesper"],   rel:"best friends", effect:"Hive mind: shared senses, echo-cast each other's abilities, no comms needed." },
    { name:"Blood Echo",     members:["vesper","rook"],    rel:"brothers", effect:"Vesper is never surprised while linked; Rook feels threats to his brother first." },
    { name:"Inheritance",    members:["latch","wren"],     rel:"father/daughter", effect:"His Augment on her is oversized; her strain builds slower near him." },
    { name:"Hearth",         members:["magpie","wren"],    rel:"stepmom/stepdaughter", effect:"Her ward raises Wren's strain ceiling — push harder, safely." },
    { name:"Two Tongues",    members:["magpie","latch"],   rel:"partners", effect:"Rune + tech binding on the same lock; shared crafting stash." }
  ],
  universal: [
    { name:"Bulwark",  member:"anvil",   effect:"Allies in Anvil's shadow can't be staggered and take reduced splash — he's cover that walks." },
    { name:"Hot Feed", member:"citrine", effect:"Allies near Citrine get faster ability recharge and instant device use — a walking power outlet." }
  ],
  trios: [
    { name:"The Family",    members:["latch","magpie","wren"], effect:"Ward + amp + performance stack into a sanctified stage — allies blessed, enemies cursed, Wren's finale at triple scale." },
    { name:"The Quiet War", members:["vesper","rook","latch"], effect:"Hive mind + brothers: every enemy marked; Vesper may Execute any two in one breath. The room simply ends." },
    { name:"The Foundry",   members:["temper","saffron","citrine"], effect:"Poisoned, superheated, current-charged steel — one blade carrying all three signatures." },
    { name:"The Avalanche", members:["anvil","rook","citrine"], effect:"Anvil charges, Rook steers the wreckage, Citrine electrifies it. City-block damage — and the district goes thin." }
  ],
  fullChorus: "All nine deployed with every bond lit → Full Chorus: every synergy active at once for 30 seconds. The cost: it thins the district. The state the Severant fears."
};

/* ---------------------------------------------------------------------------
   VEILRUN.games — the single manifest for everything playable (VR-94).
   Folds together what used to be three overlapping lists: the Lab chooser's
   `combos`, the leaderboard's `boardTree`, and the per-mode `play` links. A
   combo's play path and its levels are now stated ONCE, here.

   Shape:
     id        route + the key `updates[].games` tags against  (#games/<id>)
     name      display name
     short     one line for the games index card
     text      the full pitch, shown on the game page
     status    drives the status pill (shared with VEILRUN.modes)
     chars     who you play as
     scoreKind "time" (lower is better) or "points" (higher is better)
     art       key art for the index card + game page hero
     howToPlay player-facing rules, in reading order
     controls  [keys, what it does] — per version, since v2 rebound everything
     versions  [{ id, label, combos: [{ id, label, sub, play, levels: [...] }] }]
               versions[0] is the DEFAULT — the one the Play button opens.
               A level's `id` IS the game_id written to game_scores; never
               rename one without migrating the board.
   Anything that is an idea rather than a playable build stays in
   VEILRUN.modes below. --------------------------------------------------- */
VEILRUN.games = [
  { id: "pair-levels", name: "2D Pair Levels", status: "prototyping", chars: "Pairs", scoreKind: "time",
    art: "assets/world/gameplay-views/02.webp",
    short: "Levels only clearable with a specific pair's combo — the purest test of the synergy rule.",
    text: "Levels only clearable with a specific pair's combo — the purest synergy test. Choose your characters, then run their levels: Anvil + Latch (flip the world & charge through walls) or Cinder + Vesper (stealth — cloak, gas, and the Dose combo).",
    howToPlay: [
      "Pick a pair, then a level. Every map is built so neither character can finish it alone — the way through is the two kits combined.",
      "You control one at a time. Switch freely; whoever you leave behind holds their ground.",
      "The clock starts on your first input and stops when you clear. That time posts to the crew board for that exact level, so each level is its own race.",
      "Stuck rather than dead? Reset the level. It costs you the clock, not the attempt."
    ],
    versions: [
      { id: "v1", label: "v1 (current)",
        controls: [
          ["Arrows / A · D", "Move"],
          ["Up / W / Space", "Jump"],
          ["Tab or Shift", "Switch character"],
          ["E or Enter", "Use the active character's ability"],
          ["R", "Reset the level"],
          ["On-screen pad", "Phones — slide between \u25c4 and \u25ba to change direction without lifting your thumb"]
        ],
        combos: [
          { id: "anvil-latch", label: "Anvil + Latch", sub: "Flip & charge \u00b7 The Seam Gate", play: "games/pair-level/index.html",
            levels: [ { id: "seam-gate", label: "Level 1" }, { id: "seam-gate-2", label: "Level 2" }, { id: "seam-gate-3", label: "Level 3" } ] },
          { id: "cinder-vesper", label: "Cinder + Vesper", sub: "Stealth \u00b7 Shadow Run (has the first enemy)", play: "games/shadow-run/index.html",
            levels: [ { id: "shadow-run", label: "Level 1" }, { id: "shadow-run-2", label: "Level 2" }, { id: "shadow-run-3", label: "Level 3" } ] },
          { id: "rook-wren", label: "Rook + Wren", sub: "Telekinesis \u00b7 Uplift (launch + surge)", play: "games/uplift/index.html",
            levels: [ { id: "uplift", label: "Level 1" }, { id: "uplift-2", label: "Level 2" }, { id: "uplift-3", label: "Level 3" } ] },
          { id: "temper-citrine", label: "Temper + Citrine", sub: "Blades & arc \u00b7 Arcline (plant + power)", play: "games/arcline/index.html",
            levels: [ { id: "arcline", label: "Level 1" }, { id: "arcline-2", label: "Level 2" }, { id: "arcline-3", label: "Level 3" } ] },
          { id: "magpie-babel", label: "Magpie + Babel", sub: "Shield & command \u00b7 Runeway (shield + power the lift)", play: "games/runeway/index.html",
            levels: [ { id: "runeway", label: "Level 1" }, { id: "runeway-2", label: "Level 2" }, { id: "runeway-2b", label: "Level 2-2" }, { id: "runeway-3", label: "Level 3" } ] }
        ] },
      { id: "v2", label: "v2 (preview)",
        controls: [
          ["Arrow keys", "Move \u2014 up is jump"],
          ["Q / W / E", "Primary / Secondary / Signature \u2014 the buttons relabel per character"],
          ["A", "Interact"],
          ["S or Tab", "Switch character"],
          ["D or R", "Reset the level"],
          ["Touch", "Analog stick on the left, the same six ability buttons on the right"]
        ],
        combos: [
          { id: "anvil-latch", label: "Anvil + Latch \u00b7 Shield the Keystone", play: "games/pair-level-v2/index.html",
            levels: [ { id: "pair-level-v2", label: "Slice 1 \u2014 Shield the Keystone" } ] },
          { id: "temper-citrine", label: "Temper + Citrine \u00b7 Plant & Power", play: "games/arcline-v2/index.html",
            levels: [ { id: "arcline-v2", label: "Slice 1 \u2014 Plant & Power" } ] },
          { id: "rook-wren", label: "Rook + Wren \u00b7 Brains & Body", play: "games/uplift-v2/index.html",
            levels: [ { id: "uplift-v2", label: "Slice 1 \u2014 Brains & Body" } ] },
          { id: "cinder-vesper", label: "Cinder + Vesper \u00b7 Quiet Catering", play: "games/shadow-run-v2/index.html",
            levels: [ { id: "shadow-run-v2", label: "Slice 1 \u2014 Quiet Catering" } ] },
          { id: "magpie-babel", label: "Magpie + Babel \u00b7 Cross the Seam", play: "games/runeway-v2/index.html",
            levels: [ { id: "runeway-v2", label: "Slice 1 \u2014 Cross the Seam" } ] }
        ] },
      { id: "v0", label: "v0 (legacy)",
        combos: [
          { id: "anvil-latch", label: "Anvil + Latch \u00b7 Foundry Gate", play: "games/pair-level/versions/v0/index.html",
            levels: [ { id: "foundry-gate", label: "Level 1" } ] }
        ] }
    ] },

  { id: "story-cyoa", name: "Story Chapters (Choose-Your-Adventure)", status: "prototyping", chars: "Solo lead + 0\u20132 crew", scoreKind: "points",
    art: "assets/img/seam.webp",
    short: "Branching single-character chapters. Who you bring decides which routes exist at all.",
    text: "Single-character branching stories, Lifeline/Reigns-style. You guide a lead through one self-contained chapter; who you bring and the calls you make decide how it ends — many ways to win, many ways to fail. Chapter 1: Rook Signal (guide the crew through a thinning pocket to reach Wren). More characters coming.",
    howToPlay: [
      "Pick your lead, then bring up to two crew. Most routes through a chapter open because a specific person is standing there \u2014 who you pick matters more than any single choice.",
      "Reach is what acting from the safe side of the Seam costs you. You start with 5. You can still act at zero, but that is overreaching, and it changes how the chapter ends.",
      "The Thinning bar fills when you take time or force a way through. Fill it and the pocket is gone with Wren still inside. Lower is better.",
      "Your Resolve Score rewards getting her out cheaply \u2014 Reach to spare, a low Thinning clock, no scars left on the world. There are six endings, and each new one you reach pays on the crew board, so replaying with a different crew is worth it."
    ],
    versions: [
      { id: "v1", label: "v1 (current)",
        controls: [
          ["Click / tap", "Make a choice"],
          ["1 \u2013 9", "Pick that numbered choice"],
          ["H", "Open the rules \u2014 Reach, Thinning, Crew, Score"],
          ["Esc", "Close the rules"]
        ],
        combos: [
          { id: "rook-signal", label: "Rook \u00b7 Rook Signal", sub: "Chapter 1 \u00b7 reach Wren through a thinning pocket", play: "games/rook-signal/index.html",
            char: "rook",
            levels: [ { id: "rook-signal", label: "Chapter 1 \u2014 Resolve Score" } ] }
        ] }
    ] },

  { id: "arena-3d", name: "Proving Ground (3D wave arena)", status: "prototyping", chars: "Solo \u2014 one crew member per run", scoreKind: "points",
    art: "assets/world/gameplay-views/04.webp",
    short: "The first 3D game on the site \u2014 endless waves in a walled pit, and the first real answer to how a character FEELS.",
    text: "The first 3D game on the site \u2014 and the first real look at how one character FEELS to control. Drop into a walled pit in the Underweft, pick a crew member, and survive endless waves of husks coming through tears in the seam. Vesper is playable now: a three-hit blade chain, a two-charge Veilstep blink, and Execute \u2014 a finisher that kills anything already wounded, refunds a blink, and thins the floor where it lands. Stand perfectly still and the Shroud takes you: they lose track of you, and your next strike kills outright. Endless, with a named milestone wave every five.",
    howToPlay: [
      "Plays on a phone or tablet as well as a desktop. On desktop it is mouse and keyboard, pointer-locked \u2014 the click on Enter the arena is what grants the browser pointer lock, so it cannot be skipped. On touch you get a stick and six buttons under the arena instead, and no pointer lock is ever asked for.",
      "Waves are endless, with a named milestone wave every five. Your run score is waves survived, kills and executes together.",
      "Execute only finishes something already wounded \u2014 it refunds a Veilstep charge and thins the floor where it lands.",
      "Stand perfectly still and the Shroud takes you: they lose track of you and your next strike kills outright. Standing still is also how you die — which is what Stalk is for.",
      "Hold Ctrl to Stalk. You move slowly enough to keep the veil, so the Shroud stops being a thing you stand in and becomes a thing you carry. The price is the clock: stalking crosses the arena about sixteen times slower than running.",
      "Press \\ for the tuning panel — swap between four arena layouts, change the camera, the pixel grid, the fog and the look of the veil. It cannot touch the balance numbers, so nothing in there can put you up the leaderboard."
    ],
    versions: [
      { id: "v1", label: "v1 (current)",
        controls: [
          ["WASD", "Move"],
          ["Mouse", "Look and aim"],
          ["Left click", "Strike \u2014 chains into a three-hit combo"],
          ["Right click / Q", "Execute \u2014 finishes the wounded, refunds a Veilstep"],
          ["Shift / Space", "Veilstep \u2014 blink through anything, two charges"],
          ["Ctrl / C", "Stalk \u2014 creep slowly enough to keep the Shroud while you move"],
          ["V \u00b7 \u25a3", "Change view \u2014 cycles arcade, third person and first person"],
          ["H", "Controls and abilities \u2014 the run clock pauses while it is open"],
          ["\\", "Tuning panel \u2014 map, camera, pixel grid, fog and the veil look"],
          ["Touch \u00b7 stick", "Move \u2014 the arena sits above the pad, same layout as the 2D games"],
          ["Touch \u00b7 \u25c8 \u2605", "Execute / Veilstep \u2014 the button fills as it comes back; Veilstep splits in two, one half per charge"],
          ["Touch \u00b7 \u2726", "Strike \u2014 hold to keep the three-hit chain going"],
          ["Touch \u00b7 \u22b9", "Stalk \u2014 tap on, tap off (it latches, so it costs you no thumb)"],
          ["Touch \u00b7 drag", "Look and aim in third and first person; arcade ignores it by design"],
          ["Touch \u00b7 \u275a\u275a \u25a3 \u2699", "Top right \u2014 pause the arena, change the view, or open settings for how much arena fits the screen, look speed and your saved presets"]
        ],
        combos: [
          { id: "vesper", label: "Vesper \u00b7 Phantom assassin", sub: "3D wave survival \u00b7 rigged model, Shroud veil, four arenas", play: "games/proving-ground/index.html",
            char: "vesper",
            levels: [ { id: "proving-ground-v1", label: "Endless \u2014 run score" } ] }
        ] },
      { id: "v0", label: "v0 \u00b7 primitives (archive)",
        controls: [
          ["WASD", "Move"],
          ["Mouse", "Look and aim"],
          ["Left click", "Strike \u2014 chains into a three-hit combo"],
          ["Right click / Q", "Execute \u2014 finishes the wounded, refunds a Veilstep"],
          ["Shift / Space", "Veilstep \u2014 blink through anything, two charges"],
          ["V", "Swap third / first person (experimental)"],
          ["H", "Controls and abilities \u2014 the run clock pauses while it is open"]
        ],
        combos: [
          { id: "vesper", label: "Vesper \u00b7 Phantom assassin", sub: "The original build \u2014 cylinders and spheres, no model", play: "games/proving-ground/versions/v0/index.html",
            char: "vesper",
            levels: [ { id: "proving-ground", label: "Endless \u2014 run score" } ] }
        ] }
    ] }
];


VEILRUN.modes = [
  { id: "rook-recon", name: "Rook — Map Recon", status: "prototyping", text: "Fog-of-war board; Rook's Sixth Sense reveals, Blink shuttles allies. Cheapest digital test.", chars: "All (Rook headlines)" },
  { id: "seam-strike", name: "Seam Strike (heist/extraction)", status: "idea", text: "Co-op infiltration across the seam; loud crew vs quiet crew routes.", chars: "3–4" },
  { id: "warded-sanctum", name: "Warded Sanctum (defense)", status: "idea", text: "Magpie's base against waves; build traps between rounds (Orcs Must Die energy).", chars: "All" },
  { id: "rig-the-ride", name: "Rig the Ride (escort)", status: "idea", text: "Deliver something fragile across a thinning district in the enchanted vehicle.", chars: "All" },
  { id: "arena-clash", name: "Arena Clash (fighting game)", status: "idea", text: "Street Fighter / Mortal Kombat-style duels — pick from the roster and fight, with tag-team 2v2 / 2v1 and round-based (and maybe circular) arenas. (Pitched by jkrazy.)", chars: "1v1 / 2v2" },
  { id: "tactics-rpg", name: "Tactics RPG", status: "idea", text: "Turn-based grid squad tactics; positioning = the proximity-bond system.", chars: "Squad" },
  { id: "choose-adventure", name: "Choose-Your-Adventure", status: "idea", text: "A branching mission; each reader plays their character. Tests tone + the Severant.", chars: "All", refTag: "In motion — referenced by the Rook Signal CYOA design pass (Planning/GRD)." },
  { id: "comic-anthology", name: "Comic Anthology (interactive comics)", status: "idea", text: "A series of interactive, comic-book-styled stories tied to the world — builds out lore without building full game systems first, and could be published/sold on its own to help fund development. Maybe layers onto Choose-Your-Adventure rather than standing fully separate. (Pitched by jkrazy.)", chars: "All" },
  { id: "underweft-dive", name: "Underweft Dive (roguelite)", status: "idea", text: "Short runs into a rearranging Underweft; combos are the build system.", chars: "2 per run" },
  { id: "reunion-royale", name: "Reunion Royale", status: "idea", text: "Battle-royale twist — the crew scattered on a Sundering map must find each other and converge.", chars: "8" },
  { id: "severant-duel", name: "Severant Boss Duel", status: "idea", text: "One plays the Severant; the others must chain a Convergence to win.", chars: "1 vs many" },
  { id: "anthology", name: "Anthology (all of it)", status: "idea", text: "One world; each character headlines the genre that fits them.", chars: "All", refTag: "In motion — referenced by the Rook Signal CYOA design pass (Planning/GRD)." },
  { id: "companion-games", name: "Companion Games (origin stories)", status: "idea", text: "Each character gets their own smaller standalone game telling their backstory, all linking into the main Veilrun game. Related to Anthology (genre-per-character in one game) but distinct — this is separate titles, backstory-focused. Pitched by BipolarCrayons.", chars: "All (one per character)", refTag: "In motion — referenced by the Rook Signal CYOA design pass (Planning/GRD)." },
  { id: "mobile-idle-rpg", name: "Mobile Idle RPG", status: "idea", text: "A standalone mobile game: pick a character and play through Veilrun's story/lore idle-RPG style — clear waves of enemies, collect equipment, level up, choose skills/moves, and build a 3–4 person team. (Pitched by BipolarCrayons.)", chars: "Squad (3–4)" },
  { id: "seam-command", name: "Seam Command (RTS)", status: "idea", text: "Command & Conquer view; field all nine as hero units across both layers.", chars: "All 9 at once" },
  { id: "party-hub", name: "Party / Hub structure", status: "direction", text: "One game: Story + a pile of character party games + a training hangout.", chars: "All" }
];

VEILRUN.cover = "assets/img/cover.webp";

/* Counter-concept voting — 3 takes per crew member (Original vs two new "true counter" ideas).
   Rendered on the Lieutenants page so the group can vote a favorite + leave feedback. */
VEILRUN.counters = {
  intro: "Each Lieutenant is meant to hard-counter one of us — to shut down the exact thing that crew member does best. For each, here's the original idea plus two new takes. Vote the one you like most, and leave a note if you've got thoughts.",
  slots: [
    { crew: "saffron", hero: "Cinder", does: "poisons, brews, buffs the crew", opts: [
      { k: "orig", name: "Gall", tag: "Original", blurb: "Turns nourishment to rot — brews plagues where Cinder brews buffs; he is the poison, immune to it." },
      { k: "a", name: "Gorge", tag: "New A", blurb: "No biology to poison — eats her compounds and grows stronger with every vial thrown. Cracked by Vesper or Rook." },
      { k: "b", name: "Antibody", tag: "New B", blurb: "Adapts to any toxin instantly, turning her compounds into immunities then weapons. Cracked by Temper or Citrine." } ] },
    { crew: "temper", hero: "Temper", does: "masters and adapts to every weapon", opts: [
      { k: "orig", name: "Slag", tag: "Original", blurb: "Hoards crudely fused blades, molten light through blackened armor — quantity where Temper has craft." },
      { k: "a", name: "Echo", tag: "New A", blurb: "Copies any weapon Temper draws and wields it back at his own skill. Cracked by Rook or Wren — no weapon to copy." },
      { k: "b", name: "Quench", tag: "New B", blurb: "A formless molten mass no blade can bite. Cracked by Citrine (electrify) or Cinder (react it solid)." } ] },
    { crew: "vesper", hero: "Vesper", does: "stealth — never seen", opts: [
      { k: "orig", name: "Wake", tag: "Original", blurb: "Dissolves into shadow and unmakes people mid-sentence — the quiet protector inverted into a stalker." },
      { k: "a", name: "Argus", tag: "New A", blurb: "Sees every spectrum at once — stealth simply fails. Cracked by Magpie (blind it) or Rook (cloud it)." },
      { k: "b", name: "Tellheart", tag: "New B", blurb: "Hunts the heartbeat stealth can't hide. Cracked by Cinder (mask him) or Latch (move him out of the world)." } ] },
    { crew: "citrine", hero: "Citrine", does: "current, traps, electricity", opts: [
      { k: "orig", name: "Fault", tag: "Original", blurb: "Wires whole streets into a killing grid — current turned from a tool into an execution." },
      { k: "a", name: "Sump", tag: "New A", blurb: "Drinks electricity and swells — every trap and shock only charges it hotter. Cracked by Magpie (ground it) or Temper (break it by hand)." },
      { k: "b", name: "Earthed", tag: "New B", blurb: "An insulated colossus his grid can't touch. Cracked by Anvil (pin it) or Latch (displace it)." } ] },
    { crew: "latch", hero: "Latch", does: "opens rifts, moves between the two halves", opts: [
      { k: "orig", name: "Lock", tag: "Original", blurb: "A dimensional jailer who folds people into pocket-cells and severs every link — connection turned to solitary." },
      { k: "a", name: "Bilocary", tag: "New A", blurb: "Exists in the Overcity and Underweft at once — can't be rifted away. Cracked by Babel (read both) + a partner to strike both bodies." },
      { k: "b", name: "Oubliette", tag: "New B", blurb: "Seals every door Latch opens and folds the party into a pocket with no exit. Cracked by Magpie (pick the lock) or Wren (blast out)." } ] },
    { crew: "wren", hero: "Wren", does: "immense raw power, barely held in check", opts: [
      { k: "orig", name: "Rapture", tag: "Original", blurb: "Raw arcane force with no restraint and no mercy — the power without the person to hold it back." },
      { k: "a", name: "Recoil", tag: "New A", blurb: "Returns her energy amplified — the harder she hits, the harder she's hit; a contest she can't win. Cracked by Vesper or Rook — finesse, not force." },
      { k: "b", name: "Goad", tag: "New B", blurb: "Feeds on her restraint, egging her to unleash everything until she burns out. Cracked by Babel (channel it) or Rook (steady her)." } ] },
    { crew: "anvil", hero: "Anvil", does: "immovable shield, protector", opts: [
      { k: "orig", name: "Ruin", tag: "Original", blurb: "A siege-engine built only to flatten — protection inverted into pure demolition." },
      { k: "a", name: "Throughline", tag: "New A", blurb: "Phases past his body to strike whoever he's protecting — his shield guards nothing. Cracked by Vesper or Rook." },
      { k: "b", name: "Millstone", tag: "New B", blurb: "A slow, growing weight he can hold but never for long — endurance becomes a countdown. Cracked by Temper (cut its anchor) or Citrine (overload it)." } ] },
    { crew: "magpie", hero: "Magpie", does: "salvage, runes, spells, machines", opts: [
      { k: "orig", name: "Tithe", tag: "Original", blurb: "Drains grey Current from withered victims — resourcefulness twisted into parasitism." },
      { k: "a", name: "Corrode", tag: "New A", blurb: "Unmakes her tech and hexes on touch — everything she builds rusts in her hands. Cracked by Wren (raw power) or Vesper — no gear needed." },
      { k: "b", name: "Nullweft", tag: "New B", blurb: "A field of dead Weave where her spells won't fire. Cracked by Babel (ancient tongue) or Citrine (current is physics, not magic)." } ] },
    { crew: "rook", hero: "Rook", does: "telepathy, telekinesis, control", opts: [
      { k: "orig", name: "Choir", tag: "Original", blurb: "A psionic wreck haloed by the screaming minds he's trapped — telepathy turned into a prison." },
      { k: "a", name: "Hollowmind", tag: "New A", blurb: "A mindless swarm with no thoughts to read and nothing solid to grip. Cracked by Latch (displace it) or Citrine (raw current)." },
      { k: "b", name: "Overmind", tag: "New B", blurb: "A psychic predator that turns his own telepathy into a door inward and hijacks him. Cracked by Vesper (kill it fast) or Temper." } ] },
    { crew: "babel", hero: "Babel", does: "language, persuasion, omni-lingual command", opts: [
      { k: "a", name: "Static", tag: "New A", blurb: "The corruption of meaning — every word Babel speaks is scrambled or turned against him. Cracked by Vesper (act wordless) or Rook (mind, not speech)." },
      { k: "b", name: "Mute", tag: "New B", blurb: "A wordless force that can't be named, reasoned with, or talked down. Cracked by Wren or Anvil — raw force where words don't reach." } ] }
  ]
};

/* VEILRUN.weekly — the Updates page hero (VR-97).

   ONE flat object, deliberately. The Friday digest task REGENERATES IT WHOLE and
   overwrites this literal — never merge into it, never split a field out somewhere
   else in this file, or the task can't rewrite it safely.

   Required, or the hero silently doesn't render: weekEnding · headline · blurb.
   Optional and individually skippable: weekStart · metrics[] · image · highlights[].

   THE FALLBACK IS THE POINT. If this object goes missing, loses a required field, or
   `weekEnding` falls more than 14 days behind today, the Updates page drops back to
   exactly the plain log it showed before this existed — no error, no stub, no empty
   frame. This WILL stop being updated at some point and a stale summary is worse than
   none. Logic + the ageing rule live in weeklyHero() in js/app.js; states are proven
   headlessly by _updatescheck.js.

   Voice: same register as updates[] below — plain, specific, comfortable saying a week
   was quiet. Metrics are only worth a slot if they moved or they're surprising; don't
   ship the same four every week out of habit. Never invent one. */
VEILRUN.weekly = {
  weekStart: "2026-08-15",
  weekEnding: "2026-08-21",
  headline: "Vesper stopped being shapes — and the arena learned to fit in your hand",
  blurb: "Vesper is a real 3D model in Proving Ground now — rigged, eight animations, no longer a cylinder with a sphere on top — and that build is what Play opens. The arena plays on a phone for the first time too, and as of today the pad is four big buttons instead of six small ones, with each ability's cooldown filling up inside the button you press. Separately, a new page: the Game Reference, where you say what you love about a game and what makes you stop. 47 games are loaded to pick from.",
  metrics: [
    { label: "games loaded into the new reference", value: 47 },
    { label: "animations Vesper now carries", value: 8 },
    { label: "buttons on the phone pad, down from six", value: 4 },
    { label: "top run score in the arena, up from 742", value: "3,382" }
  ],
  image: {
    src: "assets/world/gameplay-views/02.webp",
    alt: "A lone figure standing beneath the suspended Overcity, lit magenta and cyan",
    why: "Landscape on purpose — a portrait (vesper.webp) forces the hero row taller than the text and strands ~150px of empty panel underneath on desktop; proven in a live render. Not last week's picture (01.webp) or the week before's (04.webp). One small figure under a world that dwarfs it, which is the week: a single character stopped being a placeholder."
  },
  highlights: [
    { label: "Play Proving Ground", href: "#games/arena-3d" },
    { label: "Open the Game Reference", href: "#reference" },
    { label: "Meet Vesper", href: "#crew/vesper" }
  ]
};

/* VEILRUN.loom — The Loom's weekly batch (VR-99).

   ONE object, regenerated WHOLE by the Friday task the same way VEILRUN.weekly is.
   Never merge into it, never split a field out elsewhere in this file, or the task
   can't rewrite it safely.

   Required, or the panel silently doesn't render: weekOf (YYYY-MM-DD) · ideas[].
   Each idea needs title · pitch · builtFrom[] — and builtFrom MUST carry at least
   THREE entries, each with a real `who` and a real `quote`.

   THE CITATION FLOOR IS THE FEATURE, NOT A VALIDATION RULE. An idea that can't point
   at three real takes is dropped at render time and never reaches the page. That is
   the whole reason a reader believes this panel instead of skimming past it, and it
   is what makes the person who wrote the quote see themselves in the result. If you
   are ever tempted to soften it to two, build a fourth idea instead.

   Quotes are VERBATIM, typos included. They are the crew's own words and lightly
   tidying them is how a citation quietly becomes a paraphrase.

   Ageing: past LOOM_MAX_AGE_DAYS (21) the panel removes itself entirely — same
   discipline as the weekly hero, for the same reason. A week with NO new takes is
   skipped rather than regenerated: last week's ideas are better than new ones
   manufactured from unchanged input.

   Voting rides the existing `votes` table — poll `loom-<weekOf>-<n>`, choice up/down.
   No new SQL. Thresholds live in one place, LOOM_THRESHOLDS in js/app.js, and are
   written down in _Project Knowledge/. */
VEILRUN.loom = {
  weekOf: "2026-08-28",
  takesRead: 31,
  people: 4,
  ideas: [
    {
      title: "The Thinning Line",
      pitch: "Trap-and-hold defense where the district is spent, not reset — every synergy you fire burns the ground it was fired on, and the map you finish a run in is the one you wrecked getting there.",
      builtFrom: [
        { who: "jkrazy", game: "Orcs Must Die! (series)", quote: "Limited characters to choose from - low replayability once you have everything" },
        { who: "BipolarCrayons", game: "Orcs Must Die! (series)", quote: "Gets boring once you have everything upgraded and unlocked" },
        { who: "Ramos The Wise", game: "Orcs Must Die! (series)", quote: "It does get repetitive after awhile." },
        { who: "jkrazy", game: "Orcs Must Die! (series)", quote: "The collaboration and traps and rounds of setting things up before the next wave comes. Each character has a unique advantage, but there are common traps etc to prevent bad guys from getting somewhere" }
      ],
      avoids: [
        "Repetitive once everything is unlocked — the three of you who wrote up Orcs Must Die all landed on the same sentence, so having the full kit is the START of the difficulty curve here, not the end of it.",
        "Grindy. There is nothing to farm: you bring the whole roster to run one, and what changes between runs is the ground."
      ],
      fits: "Citrine (Trapline, Hot Feed) and Magpie (Witchlight) build the line; Anvil is the cover that walks when it breaks. The Avalanche trio — Anvil, Rook, Citrine — is already written down in canon as \"city-block damage, and the district goes thin\", which is this mode's whole scoring rule rather than a flavour line."
    },
    {
      title: "Two Hands",
      pitch: "A two-body game for one pair of hands. You drive one character in the Overcity and one in the Underweft at the same time — swap which is yours mid-move, and the other holds the post you left it in.",
      builtFrom: [
        { who: "Soviet", game: "Beast of Reincarnation", quote: "The graphics and gameplay. Versatility of builds that can be created. The amount of weapons that can be found and the ability to control 2 characters simultaniously." },
        { who: "jkrazy", game: "The Plucky Squire", quote: "I loved the many different game mechanics this game has. I think the concept of switching between camera modes, animation/asset style is something I feel this overall project is trying to push towards." },
        { who: "Soviet", game: "Apex", quote: "My friends stoped playing and its not as much fun without friends." },
        { who: "jkrazy", game: "Command & Conquer (series)", quote: "The style of movement in the game, and being able to command a group of characters would be an interesting concept if tied together with some of the other ideas in here" }
      ],
      avoids: [
        "Needing four other people online. Half this crew has never signed in, and Soviet named the cost of that directly — so the co-op fantasy has to survive being played alone at 11pm.",
        "Losing the pair bonus when you play solo. Both bodies are yours, so the synergy fires whether or not anybody else showed up."
      ],
      fits: "Latch + Vesper, and it is barely an adaptation: Threadlink is already \"hive mind: shared senses, echo-cast each other's abilities, no comms needed\". Vesper + Rook (Blood Echo) is the second pairing. The 3D-over-2D split jkrazy is describing in The Plucky Squire is the Overcity/Underweft split we already have."
    },
    {
      title: "Last Call",
      pitch: "Twelve minutes, one link, no progression. Nine characters, one verb each, and a scoreboard that keeps last place close enough to matter — the thing you open when five people have twenty minutes and nobody wants to learn anything.",
      builtFrom: [
        { who: "BipolarCrayons", game: "Golf With Your Friends", quote: "Brainless fun with friends" },
        { who: "BipolarCrayons", game: "Sea of Thieves", quote: "No directive, big voyages can take hours with 1 or 2 people only." },
        { who: "jkrazy", game: "Predecessor", quote: "What I will say - only after having played one round, it did feel like the round was quite long, maybe I would have felt different playing it properly." },
        { who: "Ramos The Wise", game: "Party Animals", quote: "The physics and combat are absolutely terrible." },
        { who: "jkrazy", game: "Friends vs Friends", quote: "There were some technical issues getting everyone into the same lobby etc." }
      ],
      avoids: [
        "A round that outlasts the evening. Twelve minutes is the whole mode, not a match length we hope to hit.",
        "Loose physics played for laughs. Ramos and jkrazy both put Party Animals' physics in the gripe column — so movement here is readable and fair, and the comedy comes from the situation instead of from the controls betraying you.",
        "Lobby friction. One link, no install, no party system to fight — the failure jkrazy hit in Friends vs Friends is the one that kills a party game with this crew."
      ],
      fits: "The whole roster, deliberately flattened — one verb each, no kits to learn, no builds. Wren headlines it (the performance is the round) and Mario Kart's rubber band is the model: BipolarCrayons and Ramos both keep coming back to it, and mixed-skill players staying in contention is exactly why."
    }
  ]
};

VEILRUN.updates = [
  { date: "2026-08-31", games: ["arena-3d"], title: "Proving Ground: Vesper faces where you point him", text: "**The moonwalk is gone.** In third and first person Vesper would keep facing wherever the camera was looking and slide sideways underneath it \u2014 you were steering a character who was not looking where he was going. **It was one value doing two jobs.** Which way he faces and which way the camera looks were literally the same number, so moving without turning the camera could not turn him. They are two numbers now.\n\n**So the sticks work the way they do on a console.** **Left stick moves him, and therefore points him.** **Right stick looks.** That is it \u2014 the arrangement everybody already has in their hands, and once looking has its own stick there is nothing left to moonwalk. Let go and he holds the way he was facing rather than snapping back to the camera.\n\n**Two things deliberately did not change.** On a computer, third person still aims with the mouse \u2014 the mouse is how you aim there and always has been. And **first person still faces exactly where you look**, because any other answer puts the camera in the back of his own head. Arcade plays identically to yesterday; it already faced where you moved, and it now does it through the same one piece of code as everything else instead of its own.\n\n**Blinking picked up a fix on the way.** Veilstep with no direction held now goes **where you are pointing**, and with a direction held it resolves against the screen the same way walking does. In arcade those used to be two different answers.\n\n**And the camera settings apply to the view you are actually in.** Angle, Distance and Zoom were arcade\u0027s numbers \u2014 all three of them \u2014 so in third and first person you could drag them all day and nothing moved. **A setting that does nothing is worse than no setting**, so each row now belongs to a view and only appears in it: arcade keeps Angle, Distance and Zoom; third person gets Distance and Zoom; first person gets Zoom. **Third person got a real zoom for the first time** \u2014 it could pull the camera in before, but not open the lens, and those are two different shots. The wheel still does the right thing in every view.\n\n**Nothing about the fight moved.** Same damage, same reach, same cones, same windows, same leaderboard \u2014 and that is checked automatically rather than promised. Tell us whether he turns as sharply as you expect now, and whether the pad wants a way to aim without walking.", cta: { label: "\u25b6 Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-30", games: ["arena-3d"], title: "Proving Ground: the wheel moves the camera now", text: "**Zoom was in Settings, and only Settings.** There has been a Zoom slider in the Camera group since the panel existed — and pulling the camera in to see what you just hit is not a thing you open a panel for. **Scroll the wheel.** Up pulls in, down pushes out, and it works mid-fight without pausing anything. **− and = do the same** if you are on a trackpad, and **0** puts it back where it was.\n\n**It works in all three views, which is the part that took the work.** Zoom is not one number here. Arcade pulls the camera physically closer. Third person shortens the boom over Vesper's shoulder. First person has nothing to pull closer — you are already at his eyes — so there the wheel opens the lens instead. Three different things, one gesture, and the corner tells you which one you just moved.\n\n**Third and first person had no framing controls at all before this.** Angle, Distance and Zoom were all arcade, so two of the three views were simply not adjustable. There are now rows for both — **Third-person distance** and **First-person field of view** — and they travel in a saved preset alongside the arcade ones, because where the camera sits is a look, and looks are what presets are for.\n\n**Wind third person all the way in and you end up about where his shoulder is.** That is deliberate, and it is where a future version can let you scroll straight from third person into first without it being a mode switch at all. Not built yet — but the range goes there on purpose.\n\n**One thing got fixed on the way.** If the stored settings on your device were ever corrupted, the panel would show a broken number over an arena quietly running on a sensible one — and, worse, the new wheel would have silently stopped working with nothing to tell you why. Bad values are now corrected in the panel, in the game and on disk, all at once. A number out of range gets pulled back into range; anything that is not a number at all goes back to the default.", cta: { label: "Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-30", title: "The Loom: three game ideas, read out of what you told us", text: "**Nine days ago the Game Reference page was empty.** It now has **31 takes from four of you** \u2014 Ramon 11, Jordan 9, Todd 7, Zack 4 \u2014 and that was the whole gate. **The Loom is open.**\n\nIt sits above the reference list, and every Friday it reads everything the crew has written about the games they actually play and hands back **three Veilrun game ideas**. Not one blended idea. Three that deliberately don't fit together, because three things worth building beats one compromise nobody asked for.\n\n**Every idea quotes at least three of your takes, by name, word for word.** That is the rule the whole thing is built on, and it is enforced rather than hoped for: an idea that can't point at three real quotes doesn't get published at all. If a week produces two good ideas, you get two. You will never get a confident-sounding third one that came from nowhere \u2014 which is the only reason a panel like this is worth reading.\n\n**This week's three.** *The Thinning Line* \u2014 trap-and-hold defense where firing a big synergy permanently wrecks the ground you fired it on, so having everything unlocked is where the difficulty *starts*. That one exists because all three of you who wrote up Orcs Must Die independently said the same thing about it getting repetitive. *Two Hands* \u2014 you drive one character in the Overcity and one in the Underweft at the same time, built from Zack's note about controlling two characters at once and Jordan's about switching art styles mid-game, and designed around the fact that half this crew is rarely online at the same time. *Last Call* \u2014 twelve minutes, one link, no progression, no unlocks, nothing to learn.\n\n**And you get to kill them.** \u25b2 **Build this** and \u25bc **Not it** on each one. **+3 and it moves into the Lab as a real idea card.** **\u22123 and it dims** \u2014 still on the page, still readable, still votable, and one up-vote brings it straight back. **\u22125 and it leaves the panel.** The gap between those last two is on purpose: three people not liking something is a signal, not a verdict, and an idea that could have been great shouldn't die because three of us were in a mood. Nothing is ever deleted \u2014 an archived idea keeps its write-up and its score in the docs, so a good idea that landed in a bad week can be dug back out.\n\n**If you haven't added a take yet, that's the thing to do.** The ideas are only as good as what's in there, and right now they're built from four people. **Six of you aren't in this week's batch, and it's obvious which taste is missing.**", cta: { label: "Open the Game Reference", href: "#reference" } },
  { date: "2026-08-24", games: ["arena-3d"], title: "Proving Ground: settings that fit whatever window you are in", text: "**Settings never noticed a small window on a desktop.** Drag the browser narrow and the panel stayed a narrow strip down the right-hand edge \u2014 at 375px wide that is a 290px panel and about 85px of arena. It looked like a missing breakpoint. It was a missing *question*: the panel was asking \u201cdoes this device have a touchscreen\u201d, and a desktop window dragged narrow still has a mouse, so the answer was always no.\n\n**Now it asks whether there is room.** Below about 820px the panel is the same bottom sheet a phone gets \u2014 tiles, one group at a time, the lot. Above it, the drawer. **And it switches while you drag**, which is the part that was actually broken: cross the line mid-setting and the panel hands itself back to its own front door instead of stranding you on a stage that no longer exists.\n\n**The drawer got a width worth having.** It was hardcoded at 290px \u2014 not a setting, not responsive, not adjustable. It now grows with the window and stops before it can eat the fight, because not covering the arena is the only reason to prefer a drawer to a sheet in the first place. **And you can drag its left edge**, or nudge it with the arrow keys if you would rather not drag; double-click hands it back to the automatic width. Your setting sticks per device, and a window too small for it wins \u2014 a panel you sized on a big monitor can never come back and cover the game on a small one.\n\n**Wide windows get a category rail.** The same seven categories the phone shows as tiles, down the left side of the drawer, with the groups still all there beside them. Click one to jump to it; scroll and it keeps up with you. **Nothing is hidden to make room for it** \u2014 seeing everything at once is what the drawer is *for*, and that has not changed since it was 290px wide.", cta: { label: "Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-23", games: ["arena-3d"], title: "Proving Ground: the settings panel got out of its own way", text: "**Second pass on the same day, all of it from watching it get used.**\n\n**The sheet opens full and moves like a sheet.** It used to open at about two-thirds and jump between two sizes; now it comes up full, follows your thumb one-to-one when you drag the handle, resists instead of stopping dead at the top, and lands where the flick was going rather than where your finger stopped. It is also only as tall as it needs to be \u2014 a six-row group no longer renders as six rows and half a screen of nothing with a scrollbar that has nothing to scroll.\n\n**Opening settings over the intro or pause screen used to hide the arena behind it.** Which is unhelpful for exactly the settings people open it for: fog, the pixel grid, the Shroud colours are all judged by looking. The panel fades out while you are tuning and comes straight back when you close it. Nothing about the run changes.\n\n**And the stick-side setting used to sit on top of the thing it moves.** A bottom sheet covers the pad at every height there is, so the pad settings open at the *top* of the screen instead, with the controls in full view underneath.\n\n**Maps are pictures now.** Four plates instead of a dropdown, each one a top-down plan of that map\u2019s actual cover \u2014 drawn from the map\u2019s own data, so it cannot end up advertising a layout the arena does not have. The Shroud colours show their colour in the list next to the hex, rather than only the hex.\n\n**The Shrouded message moved.** It was floating at a fixed height inside the arena, which landed in the middle of the fight on a phone. It is a bar directly above the controls now, and the camera readout shares it \u2014 one place the game speaks from instead of two corners.\n\n**Husk models start higher.** Auto never meant \u201ccards\u201d, but it started with six models and waves allow more than six alive from wave 7, so you could meet a flat one early and reasonably conclude the models were off. It starts with ten now, which covers everything alive until wave 16, and still hands them back if a phone cannot hold it.", cta: { label: "Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-23", games: ["arena-3d"], title: "Proving Ground: settings you can find, and a pad you can move", text: "**The settings panel had everything in it and no shape.** Twenty-odd controls in one column on a phone, and the honest read on it was that it was *a lot, without much easy direction.* Some of that was literally a margin — every section header sat closer to the group above it than to its own rows, so the spacing was saying the opposite of what the structure meant.\n\n**So settings opens on tiles now.** Arena, Camera, Controls, Render, Shroud, Motion, Presets — each one saying what's actually inside it, so you tap into a group instead of scrolling past six to reach the seventh. Back walks out one step at a time. On a desktop it's the same drawer it has always been, with real room between the groups.\n\n**There's a Controls group in there, which is new.** Move the stick to the right and the buttons to the left, make the whole pad bigger or smaller, swap which pair of buttons sits on top, drop the labels for bigger icons. Mirror the pad and the button columns mirror with it, so Strike and Execute stay under the thumb that isn't steering. None of it travels in a saved preset — how you hold your own phone is not something somebody else's setup gets to decide for you.\n\n**Third and first person got a second stick.** A small faint one above the buttons that turns the camera, so you can walk and look at the same time instead of letting go of the arena to swipe it. Dragging the window still works exactly as it did, and one Look speed slider drives both. Arcade doesn't show it — that camera is fixed on purpose, and a control that does nothing is worse than no control.\n\n**All the small buttons are drawn now.** The gear, the pause bars, the three camera views and the four pad verbs were unicode characters: one font fallback from a blank box, and two of the camera icons were a single hairline apart at thumb size. They're proper drawings at the same weight as everything else, and each view is a different shape rather than a different number of rings.\n\n**Last thing — the start screen has How to play and Settings on it.** Both open the same panels the in-game buttons do. Picking arcade and sizing your pad before your first run used to mean starting a run first and hunting a small button in the corner.", cta: { label: "Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-23", title: "Play moved to where you actually look for it", text: "**The Games page was somewhere to read about games, not to start one.** Every card opened a game page, and the Play button on that page sat underneath the crew leaderboard \u2014 so on a phone, starting Proving Ground meant a tap, a scroll past ten times that weren\u0027t yours, and another tap. **Both halves of that are fixed.**\n\nEvery card on the Games page now carries its own \u25b6 Play, and it opens exactly what that game\u0027s page opens by default \u2014 with a line underneath naming the run, so the button is never a mystery. Open is still there when you want the versions, the board and the changelog.\n\nOn a game page the three pickers \u2014 version, characters, level \u2014 have come up out of the right-hand rail into a row under the title, with Play on the end of it. **Pick your run, play it, and the crew board is waiting underneath** for when you come back to see what your time was worth. Changing a picker still re-scopes the board and the button together, so the card can never claim one thing and launch another." },
  { date: "2026-08-23", games: ["arena-3d"], title: "The Shroud stopped being two effects", text: "**Vesper going invisible used to happen twice.** First he burned full of violet holes, and then \u2014 separately, over the top of all of it \u2014 a glass version of him faded in. Two things in a row, and it read as two things in a row: a dissolve, and then a hologram that arrived to replace it. Jordan called it before anyone else did: *it should look like the violet dissolve reveals the glass, like it\u2019s inside of him.* **So now it does, and the change is smaller than it sounds.** The noise that eats him is no longer a pattern of holes \u2014 it is a depth map into him. The skin burns back from the thinnest places first, and what is under the skin is the glass. There is no second step, because there is nothing to fade in: the glass was already there, and the violet is only what takes the skin off it. At any moment mid-shroud you are looking at all three at once \u2014 skin that has not gone yet, a lit tear where it is going, and glass where it has already gone. **The tear moves rather than accumulating.** It opens ahead of the glass and closes behind it, so he is never a body full of holes \u2014 it is a burn line travelling over him, and it goes out when it reaches the far side. **He also comes apart at a steady rate now, which he never did.** The old front crawled for the first half of the shroud and then took him all at once, because the noise it moved through is bunched up around its middle and nobody had ever measured that. It is flattened out now: every tenth of the shroud takes a comparable bite out of him. **And for the first time, the effect is actually tested.** The shroud was the one piece of Vesper nothing could check \u2014 the other harnesses read the code as text and can prove a word is present, not that the picture is right. The new one compiles the real shader, renders the whole transition, counts the pixels, and fails if skin and glass are ever not on screen together. Which is precisely the thing that was wrong. **Nothing about being shrouded changed** \u2014 same stillness to trigger it, same break speed, same execute, same everything on the board. He just stops looking like two ideas taped together.", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-23", games: ["arena-3d"], title: "Proving Ground: a camera button up top, and settings you can save by name", text: "**Changing the camera used to mean opening Settings.** Three views live in Proving Ground \u2014 arcade, which holds the camera still the way the old beat-'em-ups did; third person, over Vesper's shoulder; and first person, down the blade. On a desktop the V key has always cycled them. On a phone there is no V key, so you opened the panel, scrolled to Camera and picked one out of a dropdown. **There is a \u25a3 button at the top right now**, beside Pause and Settings, and it cycles the three. Jordan asked for exactly that: *something that just toggles between camera settings.* **It also says which view you are in**, which a toggle has to do or you end up pressing it three times to find out \u2014 the button changes shape, and the corner names the view in words for a moment and then gets out of the way. That corner used to sit there for the whole run restating something, and if you had ever pressed `[` it spent the rest of the session telling you about the pixel grid instead. **Switching mid-fight no longer strands you.** Going from arcade into third person on a desktop used to leave you in a free-look camera with a mouse that did nothing, and a thumb halfway through aiming when the view changed carried on aiming a camera that no longer existed. Both are fixed, and your Stalk stays armed through it \u2014 changing the camera is not a reason to drop an ability you turned on. **And the view you pick now survives closing the tab.** It always looked like it would and it never did: the panel would say \u201cThird person\u201d and the arena would open in arcade. **The other half of this is presets.** Jordan again: *maybe we can have the ability to also save certain settings within the game \u2014 like community built settings.* **Settings has a Presets section now.** Give it a name, hit Save, and the way the game looks and feels is kept under that name on this device \u2014 camera framing, fog, the pixel grid, the three Shroud colours and all five motion sliders. Load it back whenever you want, delete it when you are done with it. **It deliberately does not remember your map or which view you are in.** A preset that drops you onto somebody else's arena, or yanks you into first person, is one you have to undo before you can judge it. **And nothing in a preset can change the fight.** The list of things a preset is allowed to touch is written down in one place, and no number that decides damage, cooldowns or how big a wave is appears on it \u2014 so a preset from a stranger can make the game look completely different and cannot make it easier. **Sharing them with each other is the next step, and it is not built yet.** The plan is a short code you copy and paste to somebody, with no accounts and nothing kept on our end. Copy settings to clipboard is untouched and still works exactly as it did." },
  { date: "2026-08-23", games: ["arena-3d"], title: "Proving Ground: settings comes up from the bottom now, and everything in it is thumb-sized", text: "**The settings panel on a phone was a strip down the right-hand edge**, about a third of the screen wide, and every control in it was built for a mouse pointer \u2014 dropdowns you could miss, colour swatches the size of a grain of rice, sliders with a handle you had to hunt for. Jordan put it plainly: *the options in the settings menu weren't super accessible on mobile.* **It comes up from the bottom instead now**, the way a sheet does on a phone, so it opens under your thumb rather than off in the corner your thumb reaches worst \u2014 and it stops short of the top on purpose, because half of what is in there (fog, the pixel grid, the three Shroud colours) is judged by watching the arena change behind it. Drag the bar at the top up for the full list, or down to put it away. **And you are not tuning blind any more.** Jordan again, after the first pass: *the setting should be selected first, and then the slider appears along with the full view on the window, so you can see the change you're making as you make it.* He is describing a real problem \u2014 fog, the pixel grid, the three Shroud colours and every camera number are things you judge by looking at the arena, and the panel was standing in front of the arena while you judged. **So the sheet has two steps now.** First a plain list: one line per setting, its name and where it is currently set. Tap one and the sheet drops to a strip at the bottom of the screen with that single control on it, big, and the arena above it \u2014 and the run holds still while you are in there, so nothing takes a swing at you while both thumbs are on a slider. Back, or Escape, returns you to the list. **Everything you can touch is at least 44 pixels across**, which is the size a thumb actually needs and the size the accessibility standards ask for. The three Shroud colour swatches now print their colour beside them as text, so they are still tellable apart if colour is not something you can rely on. Every control says its own name to a screen reader, Escape closes the panel, and your place on the page comes back to where you left it. **And there is a Settings button inside Pause now** \u2014 Jordan again: *inside pause I think it would be helpful to have a 'settings' button just to make that bit a bit easier.* Before, changing the camera mid-run meant leaving pause, finding the cog in the corner, and losing the frozen moment you paused to look at. The desktop panel is unchanged \u2014 it was never the one causing trouble.", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-23", games: ["arena-3d"], title: "Proving Ground: you can turn the shaking down now", text: "**Proving Ground moves a lot.** The camera shakes when you connect, the lens punches when you Execute, the screen reddens at the edges when something gets through your guard, a Veilstep leaves a trail of you behind, and every wave announces itself with a banner that jumps. **Most of that is why it feels good to play** \u2014 and for some people it is exactly why they have to stop after ten minutes. **There are five sliders in Settings now, under Motion:** screen shake, lens kick, hit vignette, afterimages, and banner and number pops. Each runs from full to off, on its own. Above them is a **Reduce all motion** button that takes the lot down in one press, and puts it back the same way. **If you have already told your phone or your computer that you want less motion, we start there.** The sliders come up reduced without you asking and the panel says why. **But your machine only has one switch, and you may not want it thrown the whole way.** Plenty of people are fine with the red edge and not fine with the camera shaking \u2014 that combination has nowhere to live at the system level, so it lives here. Touch anything in this panel and this device keeps your answer from then on, even if the system setting changes underneath it. **Two things deliberately do not switch off.** The hit vignette dims and slows but never disappears: it is the only full-screen sign that something got through, and leaving the person who asked for less motion with less information than everyone else is backwards. And **the freeze on impact stays exactly as it was.** It looks like it belongs on this list and it does not \u2014 it is the absence of movement rather than movement, and with the shake turned off it is the main thing telling you a hit landed. **Nothing here touches the fight.** Same damage, same reach, same windows, same leaderboard. That is not a promise, either: the build is checked automatically to prove none of these settings can reach the balance numbers, and it fails if one ever does. **If you have been playing this in short bursts because it makes you queasy, tell us whether these are the right five.**", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-22", title: "Game Reference: long takes stop crowding out short ones", text: "Small one, and it came from Jordan reading his own entry back: **\"I put a big ole paragraph in there, so it's looking big right now.\"** He's right, and the problem isn't the paragraph — it's that **one long take was setting the height of the column for everybody else in it.** Write four sentences under someone's four paragraphs and yours is a footnote to theirs. **So a long take now shows its first four lines with a Read more.** Tap it and you get the whole thing. **Nothing is cut** — the full text is still on the page, so searching the page still finds it and a screen reader still reads all of it; only the space it takes up is capped until you ask. **Write as much as you want.** That was always the intent and it still is — the long ones are usually the useful ones. This just means writing a lot doesn't cost the person after you.", cta: { label: "Open the Game Reference", href: "#reference" } },
  { date: "2026-08-22", games: ["arena-3d"], title: "The husks are bodies now — 59fps on a phone, and one stutter we caught", text: "**The husks have been flat pictures this whole time.** Every enemy in Proving Ground was a photograph of an enemy — a card that quietly turned to keep facing you. That is why twenty-six of them cost almost nothing, and it is also why they never quite felt like they were in the room with you. **They are real bodies now.** They run at you, they wind up and stab, their head snaps back when you catch them, and they fall over instead of shrinking. **The grey was never a placeholder — it was the answer.** The Thinned are written down as people drained hollow: grey, listless, one dying ember left. A featureless grey human shape with a single failing light in its chest is that description with nothing added to it, so that is exactly what they are. The ember doesn’t pulse steadily, either. Steady light is something you control; theirs flickers on two beats that never line up and drops out every so often, because it is the same light the crew carry, going out. **Their death got better by accident.** The falling animation is longer than the dissolve, so a husk now comes apart before it hits the floor — which is what ought to happen to something held together by a current that just went off. **And we measured it before shipping it, which this project had never actually done.** Twenty-six animated bodies is real work in a way twenty-six pictures never was, and every frame-rate reading we had ever taken came from a browser tab that was not in front — which throttles itself and reports a number that means nothing. So we built something that refuses to do that, ran it on a phone, and the answer was better than expected: **twenty-six full bodies hold 59 frames a second, and cost two milliseconds a frame over the flat cards.** Seventy times the geometry, on a phone, with the pixel filter switched off — which is the most expensive way to play it. The game still starts careful and only promotes more of them once it has confirmed there is room, and you should not be able to see the join; if you can, tell us. **And the measurement found a real stutter, which is the entire point of taking one.** The averages looked fine and the game still froze for a fifth of a second the first time a crowd of husks all swung at once — every husk was quietly finishing its own setup at the exact moment it first attacked, and they all attack together. That work now happens up front, a couple of husks at a time, so it never lands mid-fight. **A number that only tells you the average is a number that hides exactly this**, so the report calls out the single worst frame separately and always will. **There is a Measure frame rate button in Settings, and we would still like yours.** It runs the same fight three times — all bodies, all cards, then an empty room — and refuses to give you a number at all if you looked away mid-run. **One phone is one phone; if yours is a different one, that button is the most useful two minutes you can give us this week.** **One apology owed.** If you opened Proving Ground on a computer in the last day and the enemies were just shadows sliding around the floor with nobody attached to them — that was real, that was us, and it is fixed. The bodies were being animated in the wrong units and were walking around eleven metres under the arena, while the shadow that gets drawn at their feet stayed exactly where it should be. Phones were unaffected, which is its own small lesson. **No balance moved.** Same health, same damage, same reach, same windows, same leaderboard — the husks just stopped being pictures of themselves.", cta: { label: "▶ Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-22", games: ["arena-3d"], title: "Vesper finally moves as fast as he hits", text: "Vesper's basic strike has felt wrong since the model went in, and Jordan put it plainly: *he should be lightning quick, and right now the swing feels way too long.* **He was right, and it turned out not to be an animation problem at all.** The swing was a three-second animation being played at normal speed inside a strike that lasts about a third of a second \u2014 so you saw the opening sixth of it and then it cut off mid-swing. That is the whole \"long and floaty\" feeling, and it was a missing division rather than a missing animation. Execute was worse: a seven-second clip shown for three tenths of a second, which is four percent of it. **Now the numbers that decide how fast a strike actually is are the same numbers that decide how fast it looks.** The clip gets trimmed to the part where the blade is moving, then played at whatever speed makes it fit the strike. Change one and the other follows \u2014 they can no longer quietly drift apart. **He's also swinging a different weapon, sort of.** The old animation was a wide slash built for a long sword, which was never his \u2014 he carries short blades. It's a stab now. And because the new one happens to contain two of them, **the first hit and the second hit are genuinely different motions** instead of the same one played twice. **The finisher deliberately did not get faster.** The spin at the end of the chain is supposed to land heavy, so it plays at close to full speed while the two openers run nearly twice as quick. Sharpening all three to one rate was the obvious wrong fix. **None of the balance changed** \u2014 same damage, same reach, same windows, same leaderboard. Only the picture caught up with them. Tell us whether he reads quick enough now, or whether the openers want to be quicker still.", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-21", games: ["arena-3d"], title: "Proving Ground: four big buttons instead of six small ones", text: "Six buttons crowded the bottom of the screen on a phone, and two of them \u2014 Pause and Settings \u2014 weren\u0027t even part of the fight. They\u0027ve moved up to the top right corner alongside the ? button, and **the pad is four buttons now: Execute and Veilstep on top, Strike and Stalk under your thumb.** They are roughly twice the size they were, without the arena getting any smaller \u2014 the buttons simply take the room the pad was already holding. The bigger change is what\u0027s *in* them. **Your cooldowns are the buttons now.** Execute fills as it comes back, and when you chain a kill off a wounded husk you can watch it claw a second and a half of that back with a flash \u2014 the flow loop, finally visible instead of implied. Veilstep is split down the middle, one half per charge: a full half is a blink in the bank, and the other half fills as the next one recharges, so you can see both what you have and how long until you have more, in one button. The old two-dot charge counter is gone; it could only ever tell you the first half of that. On a phone the keyboard-labelled pips at the bottom of the screen have gone too \u2014 they were saying \u0027Shift\u0027 and \u0027RMB\u0027 to someone holding a phone, and the pad says the same thing better. **The wave, the kills and the clock have grown some shape as well.** The wave line carries a progress bar and a count of what\u0027s still owed you, the three-second breather between waves counts itself down instead of feeling like the game stopped, and a milestone wave now keeps its name on screen \u2014 *thinned ground, the tear widens, hunters* \u2014 for as long as it applies, rather than flashing past in a banner you were too busy to read. All the touch targets clear the 44px minimum they should have cleared the first time. Tell us whether four verbs is the right number before we start layering anything else onto them.", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-16", games: ["arena-3d"], title: "Proving Ground plays on your phone now", text: "Proving Ground has been desktop-only since the day it shipped, and that was never a small caveat — it's the best-looking thing on the site and half the crew were never going to sit down at a computer to try it. **It plays on a phone and an iPad now.** The arena gets the window, and underneath it you get the same control layout as the 2D games: **a stick on the left, six buttons on the right.** Strike, Execute and Veilstep across the top — hold Strike and the three-hit chain keeps going, exactly like holding the mouse button. Then **Stalk, Pause and Settings** underneath. **Stalk latches.** On desktop you hold Ctrl; on a phone you tap it on and tap it off, because holding a button for the length of a slow creep across the arena is a thumb you don't have spare. Everything else about it is unchanged — same creep speed, same cost to the clock. **All three camera views work on touch**, not just the fixed one. Drag the arena to look around in third and first person. The fixed arcade camera deliberately ignores dragging, because its whole trick is that the angle never changes. **One thing genuinely needs your eye, and it's in Settings.** A phone screen is nearly square where a monitor is wide, so the arena crops in at the sides and you can't see husks coming. There's a **Fit to screen** slider: slide it down and you keep the tight, flattened look with a big Vesper; slide it up and you see as much ground as a desktop does, with a smaller one. **We've started it in the middle and pulled the camera in closer than desktop, but the right answer is whatever reads best in your hand** — so drag it, then hit Copy settings and send them over. Same for **Look speed** if dragging to aim feels too twitchy. **Your leaderboard is untouched** — same board, same scores, phone runs and desktop runs on the one table.", cta: { label: "▶ Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-16", title: "Game Reference: the games have covers, and the page fits on a screen again", text: "Two fixes to the Game Reference, both from Jordan reading it back after it started getting used. **The page was a wall of text.** Every card was showing everything it had — the write-up, both halves, every quote, every tag — all at once, all the way down. Fine when there was one game on there. Unreadable at fifteen, which is the whole problem, because the point of the page is that you read what each other said. **So a card is now a single row: the cover, the name, and the one line that matters** — the ⟳ line that says how many of you agreed on the same thing. **Click it and it opens** with everything that used to be on display. Open as many as you like at once; nothing snaps shut when you open the next one, so you can put two games side by side and compare the gripes. Sorting the list won't close them either. **And the covers are in.** Every card was a name on a grey tile because there were no images anywhere — 28 of them now pull the real cover art. The rest keep the tile, and a handful always will: Mario Kart, Fortnite and League aren't on Steam, and the two dead ones aren't anywhere. **If a cover is wrong, say so and it'll get swapped** — they were matched by name, and a name match is a guess with good manners. Nothing you've written has moved, and nothing needs re-entering.", cta: { label: "Open the Game Reference", href: "#reference" } },
  { date: "2026-08-16", games: ["arena-3d"], title: "Vesper is a real character now — and the arena opens with him by default", text: "Last time we talked about Proving Ground, the honest summary was **grey boxes with a number on them**. That's over. **Vesper is a proper 3D model in there now** — built from the actual character art, rigged, and carrying eight animations: standing, walking, running, stalking, three attacks, taking a hit, and going down. He is no longer a cylinder with a sphere on top, and this is now what **Play** opens. The old primitives build hasn't gone anywhere — it's **v0 · primitives (archive)** in the Version dropdown, and its leaderboard times are untouched. **The Shroud looks like something now.** Standing still used to just make you translucent. Now the veil eats holes through him with lit edges and shedding motes, then knits back up and leaves him as dark violet glass with a kiss of seam-pink where he turns away. **And there's a fix in there for the thing that was wrong with it.** Shroud demanded you stand perfectly still in a room filling with husks, which is an excellent way to die — so the veil was a nice idea you could rarely use. **Hold Ctrl to Stalk:** you creep slowly enough that the veil survives, so you can carry it instead of standing in it. It costs you the clock — stalking across the arena takes about sixteen times as long as running it — so it's a real decision rather than a free upgrade. **There's a tuning panel on the `\\` key.** Four arena layouts to swap between mid-run — the Pit, a colonnade that funnels them into a lane, open ground with nowhere to hide, and a keep with a ring of cover — plus the camera, the pixel grid, the fog and every value in the veil. Fiddle with all of it; **it cannot touch the balance numbers**, so nothing in there can flatter your run score. **What we need from you:** which of the four arenas is the best fight, and whether Stalk is worth what it costs. Both are questions the numbers can't answer.", cta: { label: "▶ Play Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-15", title: "47 games loaded — just start typing", text: "Following on from the Game Reference going up: **the box now knows about 47 games** — everything off the list we've played between us, from Helldivers and Sea of Thieves down to Uno, Stick Fight and the browser games from school. Start typing and it'll find the one you mean, so you're picking a name rather than spelling it. **You won't see them on the page yet, and that's deliberate.** A card only appears once somebody's actually said something about the game — a wall of 47 empty boxes would just be a list of games, which nobody needs. Say one thing about one of them and the full card appears, already filled in with what it is, what it runs on and whether it's 2D or 3D. **We've written that part so you don't have to.** You'll never be asked what platform something is on or what genre it counts as. Two boxes: what you love, and what takes you out of it. **Two of them are dead and still worth talking about** — Highguard lasted 45 days and Spellbreak's servers went off in 2023. Those might be the most useful cards on the page: we liked both, and something still went wrong. If you've got a game we've missed, add it and we'll write it up.", cta: { label: "Find your game", href: "#reference" } },
  { date: "2026-08-15", title: "New: tell us what you actually play — and what makes you stop", text: "There's a new page in the Lab: **Game Reference**. Add a game you actually play, say what you love about it, and say the thing that takes you out of it. **The second one is the bit we need.** Everyone can list games they like — that's easy and it tells us almost nothing. What's genuinely useful is the other half: the grind that made you stop, the menus that fought you, the mode that was great until hour ten. No game is perfect, and knowing precisely where a good one loses you is what turns taste into decisions about what we build. **Two boxes and your name, under two minutes.** We fill in the rest — what the game is, what it runs on, whether it's 2D or 3D — so you never have to type anything you'd have to look up. If someone's already added the game, yours joins theirs on the same card, and once three of you say the same thing the card says so out loud. **You can change your mind.** Come back any time and update your take — and after the first one you can add just a gripe, or just a love, without redoing both. **Takes count triple on the leaderboard**, same as feedback, once per game however often you edit it. Coming next: each week this reads everything you've all said and hands back three game ideas built out of it. That needs about eight takes from three people to be worth anything, so it's waiting on you.", cta: { label: "Add a game", href: "#reference" } },
  { date: "2026-08-11", title: "The Updates page opens with the week, not the log", text: "There are 108 entries on the Updates page and they've always been in one flat list, newest first. That's a fine record and a terrible way to catch up — if you've been away a fortnight you're expected to read backwards until things look familiar, and nobody does that. **So the page now opens with the week itself:** a headline, a few lines on what it amounted to, the numbers that actually moved, and links straight to the things worth opening. The full log is still underneath, unchanged, and on a phone there's a **skip to the full log** button so the summary can't get in your way. **It's written to be honest about a quiet week.** If not much shipped it will say not much shipped — padding three small fixes into a milestone would waste your time, and you'd stop reading it, which defeats the point. **And it knows to get out of the way.** The summary is refreshed by hand each week for now, and one week that will be forgotten — so if it ever goes more than a fortnight without an update, it removes itself and the page goes back to exactly the log you're used to. A stale summary claiming to be \"this week\" is worse than no summary at all.", cta: { label: "Read this week", href: "#updates" } },
  { date: "2026-08-11", title: "The Hub knows who you are now — and tells you what you missed", text: "The Hub has shown everyone the same page since the day it went up: same cover image, same list, whether you'd been here yesterday or never. **Now it works out where you left off and starts there.** If things have shipped since you last signed in, it says so — how many, what they were, and a jump straight to each one, capped at five so it stays readable rather than becoming another wall. If nothing has changed, it says that too, plainly, and points you at whatever still needs you instead of pretending there's news. **It knows the difference between \"nothing new\" and \"never been here.\"** That sounds obvious and it wasn't — telling someone on their first ever visit that they're \"all caught up\" is nonsense, so first-timers get something else entirely: what the project actually is, where it's got to in numbers, the art, and three things worth doing in order. **And if something genuinely needs you** — a vote that's still open, a note of yours we've since fixed — that leads the page instead of the news. **Nothing new to sign up for and nothing to keep up with.** It reads your existing sign-ins to work out when you were last here, so it worked from the moment it went live. If you'd rather have the old one, add /v0 to the address. Tell us if it gets it wrong — particularly if it claims you missed something you didn't.", cta: { label: "Open the Hub", href: "#hub" } },
  { date: "2026-08-10", games: ["arena-3d"], title: "Proving Ground has a second version in the dropdown — and it looks deliberately unfinished", text: "Everything in Proving Ground so far has been built out of cylinders and spheres, because modelling real characters is the kind of job that eats a month and produces nothing playable. **So we're skipping models entirely.** The new **v1 · sprite arena** preview swaps those shapes for flat images that always turn to face the camera — a trick old games used constantly, and it means art can come straight out of Midjourney and drop into the game with no rigging at all. **Fair warning: the art in it right now is placeholder.** Grey boxes with a number on them. That is on purpose — the point of this build is to prove the plumbing works before we spend a Sunday generating 152 images, not to look good. The camera has been pulled much lower to suit it, because a flat image viewed from above just reads as a card lying on the floor. **v0 is still what Play opens** — nothing about your runs or the board changes. If you want to see where this is heading, pick **v1 · sprite arena (preview)** from the Version dropdown on the game's page, and tell us whether the lower camera feels better or worse to fight with. That's the actual question.", cta: { label: "▶ Open Proving Ground", href: "#games/arena-3d" } },
  { date: "2026-08-09", games: ["pair-levels", "story-cyoa", "arena-3d"], title: "The games have their own home now — and their own pages", text: "The Lab was doing two jobs badly. It opened as an idea board, then three playable games moved in on top of it, and the fifteen concepts everyone actually votes on got pushed to the bottom of a very long page. So we split them. **There's a Games section now** — find it under Lab in the menu. It lists everything you can actually play, and each game has its own page. **Each game page has the lot in one place:** pick your version, characters and level up top, hit Play, and right there underneath is that game's leaderboard, how it works, the full control list, and its own changelog — every update we've ever shipped for that game, and nothing about the others. The controls even change when you switch to a v2 preview, because v2 rebound everything and telling you the v1 keys would just be wrong. **The Lab is the idea board again** — concepts, votes, and a button through to the games. Nothing moved out of reach: every game plays exactly as it did, v1 is still what Play opens, and your leaderboard times are untouched. **And Rook Signal now knows who you picked.** Choose your character on its game page and the game skips its own character screen and takes you straight to choosing who you bring. That's the first of three — the pair levels and Proving Ground still ask you themselves for now.", cta: { label: "▶ View playable games", href: "#games" } },
  { date: "2026-08-08", games: ["story-cyoa"], title: "Rook Signal: every beat is a real decision now", text: "Jordan's note after playing was that the choices felt thin — “sometimes there's only one option.” He was right, and it was worse than it looked: on a typical run, four of the seven beats were a single button you just had to press. That's fixed. • The three scouting beats now each cost you something. Feel for Wren and you can lend her a piece of your own steadiness — it costs Reach, but she holds when the archway starts to go. Map the exits and you can push the route into your crew's heads, which costs Reach but buys back time on the crossing. Trace the drain and you can push closer to learn what the thing actually is — that costs time you may not have, and what you find out follows you out of the chapter. Or take the free option every time and go in lean. • And beat four always has your own two answers now, whoever you brought: lift the collapse yourself with everything you've got, or spend no power at all and talk Wren through moving herself — slower, safer, and the closest the chapter gets to what Rook actually is. That one's there even on the solo run. Same six endings, same scoring — but there are now nearly five times as many distinct ways through, so a second run with the same crew won't play the same.", cta: { label: "▶ Play Rook Signal", href: "games/rook-signal/index.html" } },
  { date: "2026-08-08", games: ["story-cyoa", "pair-levels", "arena-3d"], title: "You asked, we fixed: the Lab, the help you were missing, and an honest leaderboard", text: "This one is entirely your feedback, shipped. **Rook Signal now explains itself.** The Reach pips and the Thinning bar were sitting there with no explanation anywhere \u2014 fair complaint, and it's fixed: there's a 'How this works' panel before you start, and you can pull it back up any time with the ? in the corner or the H key. Every choice now tells you what it cost, too \u2014 the pips drain, the Thinning bar shakes, and a note names the price (or tells you when a choice was free). **Every game has help now.** The controls and kit list used to vanish the moment you pressed Play. Press H in any of the pair levels or Proving Ground and it comes back \u2014 and the run clock pauses while it's open, so reading the controls never costs you a time. **The Lab's game cards are rebuilt.** Each prototype is now one full-width card with its leaderboard inside it: pick your version, characters and level in one place, see that exact board, and hit Play in the bottom-right \u2014 no more choosing twice through two different screens. There's also a new 'Where you stand' line showing your rank, your time, and how far off the lead you are, so you can tell at a glance which levels are worth another run. **And the leaderboard is honest now.** Beating your own best gave you 3 points every single time, which meant you could shave a millisecond and farm it forever. Each award is now once per level, same as trying and clearing. Keep it coming \u2014 all of the above came from notes you left on the feedback page.", cta: { label: "\u25b6 Open the Lab", href: "#lab" } },
  { date: "2026-08-08", games: ["arena-3d"], title: "Veilrun in 3D: Proving Ground \u2014 survive the waves as Vesper", text: "The first 3D game on the site, and the first one built to answer a different question than the pair levels do: not 'is this puzzle clever' but 'does controlling this character feel good.' Proving Ground is a crew training pit in the Underweft \u2014 a walled arena with a thinning seam for an edge \u2014 and husks come through tears in that seam wave after wave until you go down. Vesper is the one playable so far, with a real kit: a three-hit blade chain that ends in a spin, a Veilstep blink on two charges you can throw yourself through anything with, and Execute \u2014 lunge on anything already wounded and it just dies, which refunds a blink, patches you up, and takes time off its own cooldown, so good play chains into more good play. The floor pays for it: Execute thins the ground where it lands, and husks move faster over thinned floor. Power has a price. The one to find on your own: stand perfectly still for a moment and the Shroud takes you \u2014 they lose track of you and wander toward where you were, and your next strike kills outright, whatever its health. Standing still in a room filling with husks is also an excellent way to die. It runs forever, escalating, with a named milestone wave every five (the tear widens, the ground thins, then they start lunging), and the board is your run score \u2014 waves survived, kills, executes, time alive. Desktop for now: WASD and the mouse. It's a v0 prototype with no art in it \u2014 everything you see is lighting and shapes \u2014 so tell us how it FEELS to move and hit things. That's the whole point of it. Anvil and Citrine are next, once Vesper plays right.", cta: { label: "\u25b6 Play Proving Ground", href: "games/proving-ground/index.html" } },
  { date: "2026-08-07", games: ["story-cyoa"], title: "New game type: Story Chapters — play Rook's first Choose-Your-Adventure", text: "A whole new way to play, live in the Lab. Story Chapters are single-character branching stories in the vein of Lifeline and Reigns — you read a scene, make a call, and live with it. Chapter 1 is 'Rook Signal': Wren's trapped in a pocket of the Underweft that's thinning fast, and Rook is the only one who can reach her — mind-first, from the safe side of the Seam. Before you start you pick up to two crew to send in as your hands (Vesper, Magpie, Anvil, Latch, or Babel — each opens a different way through), or go in alone for the hardest run. Manage two things: Rook's Reach (act at range and it drains — hit empty and it all comes apart) and the Thinning clock (dawdle and the pocket's gone). Six endings — clean saves, costly ones, and a few ways to lose — and the board rewards finding all of them: points for your first run, and more for every new ending you uncover. Pick Rook on the character screen; the rest of the crew are 'coming soon' while they weigh in on their own chapters.", cta: { label: "▶ Play Rook Signal", href: "games/rook-signal/index.html" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Seam Gate v2: Anvil's charge now escorts + smashes", text: "Playtest fixes on the Anvil + Latch v2 preview. Anvil's Charge now brings Latch along in his protective wake — a charge-and-escort — so you're not running the keystone through the fire on his own; and it smashes turrets it hits, not just breakable walls. BULWARK is directional — Anvil physically blocks shots, so whoever's tucked behind him is safe and bullets spark off his body (no bubble). And flipping back no longer drops you into the chasm — the flip snaps you onto the nearest footing (or politely refuses if there's none).", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Seam Gate v2 preview: Anvil + Latch — and all five pairs now have a v2 slice", text: "The last pair gets the v2 treatment, so the whole crew is now playable on the new controller + kit. This one leans into the two halves of the world: Latch can't take a hit, but he FLIPS the whole crew into the Underweft whenever he wants — no runes, unlike Magpie & Babel. Anvil is unbreakable: his BULWARK aura soaks enemy fire for anyone in his shadow, and his Charge plows through breakable walls. The chasm can't be jumped, so Latch flips you into the Underweft; a turret rakes the bridge, so keep Latch behind Anvil; a breakable wall blocks the way, so Anvil charges it; then Latch flips you back onto the exit ledge. Opt-in preview: Anvil + Latch still opens v1 (the Seam Gate) by default; use the Version dropdown or the Lab leaderboard to pick 'v2 · Shield the Keystone'. (Next: these five slices become the testbed for folding the two-world system into shared engine code, so everyone crosses into the same Underweft.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Arcline v2 preview: new controller + the full Temper & Citrine kits", text: "Pair #4 gets the v2 treatment — four of five pairs now have a v2 slice. Same new controller on the plant-and-power game. Temper THROWS blades that stick as conductors (not footholds), and now also: Bladedance (a parry stance), Frankenforge (fuse two planted blades into one longer-reach hybrid), and Retrieve (pull a blade back to re-throw). Citrine's Spark hops blade-to-blade to a far trigger; she also gets Trapline (place a shock mine) and Cascade (a bigger, longer-range zap). The trigger sits behind a gate, out of her spark range — so you have to plant a Temper blade to bridge the arc, spark it, and open the gate. Opt-in preview: Temper + Citrine still opens v1 by default; use the Version dropdown (or the Lab leaderboard) to pick 'v2 · Plant & Power'. Own best-times board. (An aimable/chargeable throw for deeper blade-network puzzles is a separate round — this slice uses the proven fixed throw.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Shadow Run: downed guards now leave a body", text: "Small feel fix on the Cinder + Vesper v2 preview: when you take a guard down (Vesper's Execute or Cinder's Last Supper), they now fall over and fade into a body on the ground instead of just vanishing — the same fall-and-fade the crew uses when they're downed. Reads a lot less like people blinking out of existence.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Uplift v2 preview: new controller + the full Rook & Wren kits", text: "Pair #3 gets the v2 treatment. Same new controller (analog stick + labeled ability buttons that relabel per character) on the launch-and-surge game, with fuller kits. Rook can't jump — he Telekinetically launches Wren up (then you steer her), can Blink to reposition, Anchor a temporary barrier/step, and Focus his Sixth Sense to light up the nodes. Wren Surges through a current-node to charge Rook's bridge, builds Cadence (a momentum meter that lengthens her next Surge), can raise her own Aegis ward (saves one fall), and can Trigger a node by hand if she's standing on it. Neither finishes alone: Wren only reaches the node via the launch, and Rook only crosses once the bridge is charged. Opt-in preview: Rook + Wren still opens v1 by default; use the Version dropdown on the title screen (or the Lab leaderboard) to pick 'v2 · Brains & Body'. Keeps its own best-times board. Prototype — tell us how the launch + surge feels with the new kit.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Shadow Run v2 preview: new controller + the full stealth kits (Cinder + Vesper)", text: "Pair #2 gets the v2 treatment. Same new controller (analog stick + labeled ability buttons that relabel per character) on top of the stealth game — and the kits are fuller now. Cinder lobs Gas to blind, Doses Vesper to cross the fumes (Cinder's immune), can silently take a guard down when he's unseen (Last Supper), and drops a Field Kitchen. Vesper holds still to cloak (Shroud), Veilsteps, Executes a guard from full stealth, and can Peek a patrol without breaking cover — his Signature is deliberately empty for now (a 'no action yet → tell us' button). The exit is a mechanical scanner only gas can blind, so the takedowns are tools on the human patrol while the gas+Dose crossing stays the heart of it. Opt-in preview: Cinder + Vesper still opens v1 by default; use the Version dropdown on the title screen (or the Lab leaderboard) to pick 'v2 · Quiet Catering'. Keeps its own best-times board. Prototype — tell us how the stealth kit feels.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", games: ["pair-levels"], title: "Runeway v2: friendlier desktop controls + a jump-in from v1", text: "Two quick fixes for the v2 preview. The desktop keyboard is two-handed now and much easier: movement is on the ARROW KEYS (up = jump), and the six actions sit under your left hand as a Q/W/E over A/S/D block that matches the on-screen grid — Q/W/E = Primary/Secondary/Signature, A/S/D = Interact/Switch/Reset (Tab still switches, R still resets). No more hunting for J/K/L/E/Tab across the board. Also: clear Level 3 of the current Runeway (v1) and the win screen now offers a 'Cross to v2 →' button, so you can jump straight into the new-controller preview. And when Babel goes down he now lies down and fades out gradually as his revive timer ticks, so you can see at a glance how long Magpie has to reach him.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-01", games: ["pair-levels"], title: "Runeway v2 preview: new controller + cross the seam (Magpie + Babel)", text: "A first look at the v2 controller and kit work — try it before it becomes the default. The controls are new: a proper analog stick on the left (drag or tap a direction; push up to jump) and a grid of ability buttons on the right that relabel for whoever you're holding — Magpie gets Shield / Ward / Revive, Babel gets Strike / Reinforce / True Name / Read (an empty slot just means 'no action here yet — tell us what it should do'). New mechanic: the world is split in two halves, the Overcity and the Underweft, and Babel reads the runes to cross the seam and takes the crew with him. This slice: cross into the Underweft, Babel powers a tram across a gap you can't jump while Magpie shields the turret fire, then read your way back to the exit. It's an opt-in preview — Magpie + Babel still opens v1 by default; use the Version dropdown on the game's title screen (or the Lab's leaderboard) to pick 'v2 · Cross the Seam'. Keeps its own best-times board. Very much a prototype — tell us if the new controller feels right and whether the extra actions are too much.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-01", games: ["pair-levels"], title: "Runeway: two more levels (Magpie + Babel)", text: "Magpie + Babel now has three levels, and the rune drives something different each time. Level 1: a lift straight up. Level 2: the rune powers a TRAM that ferries you across a pit you can't jump — the whole crossing is under fire, so time your shield and launch together; Babel can tap Read mid-ride to boost the tram for a faster run. Level 2-2 is that same tram turned brutal — a longer, fully-exposed crossing where one shield won't cover you, so you have to boost to survive (its own board, for the show-offs). Level 3 is the gauntlet: ride a lift up through one turret's fire — that one you can't reach, so shield it — then Babel silences the second turret and powers a tram across a high gap to the exit. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-01", title: "Vesper's gallery just tripled", text: "Dropped 96 new Vesper variants into his gallery — hood up, hood down, hood resting on the shoulder, the full range. Open Vesper on the Crew page and heart the ones you like.", cta: { label: "Meet Vesper →", href: "#crew/vesper" } },
  { date: "2026-07-31", games: ["pair-levels"], title: "Uplift: two more levels (Rook + Wren)", text: "Rook + Wren now has three levels. Level 2 makes Wren work for it — launched onto a ledge, then Surge across a gap to reach the node. Level 3 is a two-circuit run: charge the first node to bridge Rook forward, then he launches Wren again to charge a second node and open the way to the exit. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-31", games: ["pair-levels"], title: "Combo #3 is playable: Rook + Wren (Uplift)", text: "The third pair is in. Rook can't jump — but his ability launches Wren into the air (then you steer her). Wren is fast, jumps high, and her Surge dash charges a current-node that raises Rook's bridge so he can cross. Neither can finish alone: Wren can't reach the node without Rook's launch, and Rook can't cross the gap without Wren's charge. Find it under 2D Pair Levels → Play → pick Rook + Wren. Its own best-times board — go set the first record. (Prototype — tell us how the launch/steer feels.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", games: ["pair-levels"], title: "Combo #5 is in — all ten crew now play: Magpie + Babel (Runeway)", text: "The roster's complete — every crew member is in a playable pair. Magpie + Babel is combat-flavoured: a turret sprays fire across the way. Magpie throws up a SHIELD — an aura that wraps the whole crew and soaks up the fire for a few seconds, then recharges. Babel, the military linguist, reads foreign tech — stand by the turret to DISARM it, or by a rune to POWER its lift, an elevator that carries you up to the exit. Shield the crossing, silence the gun, ride the lift up. Find it under 2D Pair Levels → Play → Magpie + Babel. (Prototype — tell us how it feels; harder levels coming.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", games: ["pair-levels"], title: "Arcline: two more levels (Temper + Citrine)", text: "Temper + Citrine now has three levels. Level 2 throws a live-wire hazard across the path — Citrine has to spark it off before you can pass (that short zap of his finally earns its keep) — then a two-trigger gate. Level 3 walls you off completely — no more walking over to the trigger. Two triggers sit behind the wall, and Temper has to thread blades through two tight gaps at different heights so the current can chain to both. Citrine sparks from your side; if you haven't built the line, nothing lights. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", games: ["pair-levels"], title: "Combo #4 is playable: Temper + Citrine (Arcline)", text: "Four of five pairs are in. Temper THROWS blades that stick where they land — conductors, not footholds (so you can't just climb them). Citrine's Spark is short-range on its own, but it hops blade-to-blade: throw a line of blades to the gate's trigger, then spark it open. You genuinely need both. Find it under 2D Pair Levels → Play → Temper + Citrine. Its own best-times board. (Prototype, one level — tell us how the throw + spark feels and I'll build more.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", games: ["pair-levels"], title: "Fixes from your notes: mobile nav + leaderboard clarity", text: "A batch of fixes: the mobile nav dropdown no longer sticks open (you can close it and tap other links again), the stealth game's level picker is styled correctly, and the leaderboard now shows game points in each person's breakdown — and 'most active this week' counts play, not just feedback, so the numbers actually reflect where your points came from. Also gave the leaderboard dropdowns roomier arrows and bigger tap targets on mobile.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", games: ["pair-levels"], title: "Shadow Run: two more levels", text: "Cinder + Vesper now has three levels. Level 2 adds a second patrol to slip past; Level 3 is a two-gate run — you'll need to gas (and Dose across) more than once. Each has its own best-times board. Also fixed the leaderboard dropdowns being too small to tap on phones.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-29", games: ["pair-levels"], title: "New pair to play: Cinder + Vesper (stealth — with the first enemy)", text: "2D Pair Levels now lets you choose your characters. Hit Play and pick a combo: Anvil + Latch (the flip-and-charge levels) or the new Cinder + Vesper — a stealth level, and the game's first enemy. Vesper turns invisible when he holds still, Cinder lobs gas to blind a guard's vision cone, and the combo that matters: Cinder can Dose Vesper (stand together) so he crosses the gas unharmed. Slip both past the patrol to the exit — get spotted and it's back to the start. The leaderboard now sorts by Version → Combo → Level, so every pair keeps its own board. Go set the first Cinder + Vesper record. (Very much a prototype — tell us what feels off.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-28", games: ["pair-levels"], title: "Tidier game start screen", text: "Cleaned up the pair-level title screen: shorter intro, the level dropdown and Play button line up properly now, and the keyboard-controls line is hidden on phones (where you're using the on-screen buttons anyway).", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", games: ["pair-levels"], title: "Cleaner level picker", text: "The title-screen level menu is a tidy dropdown now, and the ✓ only appears on levels you've actually cleared — before, a stray checkmark was showing on whichever level was highlighted. Pick a level and hit Play.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", title: "Anvil's color is officially red", text: "We locked in Anvil's accent color: red, matching his silhouette and how he looks in the game (it just fits him). You'll see it on his crew card, hover, and gallery frame. Small thing, but it's part of a bigger tidy-up — we're getting the game and the site to share one set of brand colors instead of drifting apart." },
  { date: "2026-07-28", games: ["pair-levels"], title: "Win-screen polish: Replay left, Next right", text: "Small UX fix on the level-complete screen: Replay sits on the left (it takes you back), Next level on the right (it moves you forward), matching how buttons should read. The ‘← Back to the Lab’ control is a proper button now on both the title and win screens, instead of turning into a plain underlined link after some levels — one consistent style throughout.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", games: ["pair-levels"], title: "Level 3 is live — and Anvil has a new move", text: "There's a third level, plus a new trick for Anvil: while he's in the air, his ability crashes him straight down instead of charging. Worth experimenting with it as you go — you never know what might give way. Fastest route wins the board.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", games: ["pair-levels"], title: "Leaderboard: separate Version + Level pickers", text: "The Lab's best-times board now has two dropdowns instead of one — pick the Version (v1 Seam Gate / v0 Foundry Gate), then the Level within it. As we add levels they slot under their version instead of piling into one long list. The in-game level picker is a dropdown now too, so the title screen stays tidy as the roster of levels grows.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", games: ["pair-levels"], title: "Earn points for playing", text: "The game now pays out into the crew leaderboard: +2 for trying a level, +10 for your first clear, +3 every time you beat your own best, and 🏆 +5 for setting a new level record (taking #1). You'll see what you earned on the win screen, and it all stacks with the points for feedback, likes, and votes. So there's a reason to keep chasing faster times, not just first place.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", games: ["pair-levels"], title: "Level 2 is live — plus a level picker", text: "The Seam Gate now has a second level, 'The Long Seam' — a longer flip-and-charge gauntlet with a spot where Anvil's plow is the fast way through. Pick any level from the title screen (all open for testing, with a ✓ on the ones you've cleared). Fall or die and you restart that level, not the whole run. Each level keeps its own best-times board — switch between them in the Lab leaderboard dropdown.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", games: ["pair-levels"], title: "Leaderboard: pick the version + roomier buttons", text: "The Lab leaderboard now has a dropdown to switch between each version's best-times board (v1 Seam Gate, v0 Foundry Gate) — and as we add levels, they'll slot right in. Also gave the Play and Feedback buttons some breathing room so they're comfortable to tap.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", title: "Fixed: the update feed was cache-stuck", text: "If the Hub's latest update and the Recently list looked frozen, that was your browser holding onto an old copy of the site's data — the updates were all there, just cached. Fixed site-wide so pushes now show up right away. You may need one hard refresh to clear the old cache; after that it's automatic. (If you're seeing this entry, it worked.)", cta: { label: "▶ Play the game", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", games: ["pair-levels"], title: "Both maps now play on mobile", text: "The original Foundry Gate is back — rebuilt on the mobile engine as v0 (Anvil anchors pits, Latch breaches gaps, then a plate-and-door finish). Use the Version dropdown on either game's title screen to switch between v0 · Foundry Gate and v1 · Seam Gate. Each keeps its own best-times leaderboard, so there are two crowns to chase.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", title: "Playable games + live leaderboards in the Lab", text: "The Lab has a ‘Playable now’ section right at the top now — jump straight into the game without digging through the ideas, with the crew's best-times leaderboard sitting right beside it (your row highlighted). As we add more playable prototypes, they'll line up here too.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", title: "Babel's art is in — plus Vesper & Temper refreshed", text: "Manafest's character Babel now has real art: a hero portrait and a big gallery to react to, in place of the placeholder. Vesper and Temper picked up fresh variants too (masks, hoods, forge rigs). Open Babel on the Crew page and heart the ones you like.", cta: { label: "Meet Babel →", href: "#crew/babel" } },
  { date: "2026-07-26", games: ["pair-levels"], title: "Game polish for phones", text: "The pair level's on-screen buttons and the back-to-Lab control are proper tap targets now, so it's comfier to play on a phone. Toddlez and Ramon are already trading the top of the leaderboard — go stake your claim." },
  { date: "2026-07-26", games: ["pair-levels"], title: "Play older game versions + Anvil holds his ground", text: "The game's title screen now lists past versions, so you can jump back to an earlier build (v0.1, the Foundry Gate) any time. Also, per feedback: nobody can shove Anvil around anymore — he's immovable like a juggernaut should be — though he can still push others and plow Latch along." },
  { date: "2026-07-25", games: ["pair-levels"], title: "Seam Gate controls feel better", cta: { label: "▶ Play the Seam Gate", href: "games/pair-level/index.html" }, text: "A few prototype fixes: Latch now trails behind Anvil during a charge (Anvil's the shield, not a scoop), you can slide your thumb between ◄ and ► to change direction instead of re-tapping, the ability button keeps a steady ✦ icon with the action name underneath, and the ‘← Lab’ link finally lands you back in the Lab (not the Hub)." },
  { date: "2026-07-25", games: ["pair-levels"], title: "Anvil can plow Latch through walls", text: "New in the Seam Gate: if Anvil charges into Latch, he plows him along — carrying him through the breach, cracked wall and all. Makes getting past each other way easier, and it's now part of Anvil's kit (Rampage) and a new Anvil + Latch team-up, ‘Battering Ram.’ Characters also soft-push past each other now instead of feeling like a wall." },
  { date: "2026-07-25", games: ["pair-levels"], title: "Best-times leaderboard in the game", text: "The Seam Gate now records your clear time — beat the level and you'll see your best plus a ‘Best times · the crew’ ranking on the win screen, with your row highlighted. Race each other for the fastest run. (Your own best saves locally right away; the crew board goes live once the game_scores table is added in Supabase.)" },
  { date: "2026-07-25", games: ["pair-levels"], title: "Prototype polish + Lab tidy-up", text: "Small stuff: the game now shows its version (v0.2) and has a ← Lab button so it's easy to get back, the map button is bigger, and in the Lab the ‘Play the prototype’ and Feedback buttons no longer crowd each other (and feedback buttons are taller/easier to tap on mobile)." },
  { date: "2026-07-25", games: ["pair-levels"], title: "Playable prototype: The Seam Gate", text: "There's a real, playable thing in the Lab — hit ▶ Play on '2D Pair Levels.' You control Anvil and Latch (tap Switch). Here's the twist we just added: Latch can Flip the whole level between the two worlds — walls in the Overcity vanish in the Underweft — while Anvil charges straight through cracked walls that exist in both. Neither can clear it alone. Zooms and follows on phones, with a 🗺 Map button to peek at the whole level. Rough prototype — tell us how it feels." },
  { date: "2026-07-25", title: "Silhouette row: aligned + two rows of five", text: "Jordan re-balanced the landing silhouettes so they're all the same scale and grounded on the same line, and the row is now laid out two-across-five instead of one long strip. Babel joins the roster with a placeholder until his art lands." },
  { date: "2026-07-25", title: "Likes work again everywhere", text: "When all the art moved to WebP, it accidentally orphaned every existing like (they were saved against the old file names). Fixed — your hearts are reconnected and now show up group-wide across the Gallery, character pages, enemy pages, and the landing. Like something anywhere and everyone sees it. Also made the archive button on your profile red + bolder so it's clear it removes an image from the page." },
  { date: "2026-07-25", title: "Vote on the Lieutenant counters", text: "The Lieutenants page now has a voting block: for each of us, three takes on the enemy meant to counter you — the original idea plus two new ‘true counter’ concepts — with a quick blurb each. Pick your favorite and leave a note. Helps us lock the direction before we commit the art and lore." },
  { date: "2026-07-25", title: "Babel joined the crew (concept)", text: "Manafest's character, Babel, is on the site now — role, lore, kit, codenames, and a couple of synergies — as an in-progress concept with a placeholder portrait. Take a look on the Crew page and drop feedback on his abilities while they're still soft." },
  { date: "2026-07-25", title: "The Board is now a real tracker", text: "The Board page got refreshed to where things actually stand, plus a filter — tap ‘On me’ to see just your plate versus everything. There's a new ‘Sunday render queue’ column tracking the art that's teed up to generate. Easy to glance at from your phone." },
  { date: "2026-07-25", title: "Tap a silhouette to see the shot", text: "The nine silhouettes on the landing page now open in the full-screen gallery when you tap one, instead of jumping to a character page — so you can flip through the art up close. Character detail pages will come back later once they're ready." },
  { date: "2026-07-25", title: "Gallery likes: yours vs. everyone's", text: "The one ‘Favorites’ filter is now two — ♥ My likes shows only what you've hearted, and ★ Liked by anyone shows everything the whole group has liked. Makes it easy to see where the crew is landing versus your own picks. Also tidied the profile image tools: the drag-to-reorder handle moved to a little tab at the top-center of each image, so it's no longer stacked under the archive button." },
  { date: "2026-07-25", title: "The crew silhouette row is live", text: "The bottom of the landing page finally shows all nine — real back-facing silhouettes, each lit in their own color, in place of the old placeholder boxes. Tap any of them to jump to that character. Still locking the final shot for a couple, so shout if one isn't your favorite." },
  { date: "2026-07-25", title: "The whole site got a lot lighter", text: "Every image is now WebP instead of PNG — the art folder went from ~970MB to ~104MB (about 89% smaller) with no visible quality drop. Pages, and especially the big galleries, load noticeably faster on phones and burn way less data. Room to keep adding art without the site getting sluggish." },
  { date: "2026-07-25", title: "Enemy concepts now sort by your likes", text: "On the Lieutenant and enemy pages, the shot the group likes most rises to the top — the hero and the strip both order by likes now. So heart the directions you want to see more of; your votes literally reshuffle which concept leads. (Also corrected two names: Naz and Michael.)" },
  { date: "2026-07-25", title: "The Lieutenants (and the elites) have faces now", text: "Concept art landed for the six proposed Lieutenants — Lock, Ruin, Rapture, Gall, Wake, and Fault — plus the Scryemother, the Warrant, the Chant, and the Rune-Scarred. The ‘art TBD’ tiles across the Threats pages are gone; every enemy now has a gallery to react to. Temper's redesign came in too: 40 fresh frames in his gallery. Dig through, and use the new ⊘ archive button to cull the ones that miss." },
  { date: "2026-07-21", title: "Archive images you don't want to feature", text: "On your profile, every shot in the reorder grid now has a ⊘ button — tap it to archive that image. Archived shots drop off the character page and collect in an ‘Archived’ strip right below, where a Restore button brings any of them back. Saves group-wide like the ordering does, so it's easy to curate galleries down as we pour in more art." },
  { date: "2026-07-21", title: "Cleaner updates + de-duped World galleries", text: "The Hub's ‘Latest update’ now leads with a short headline and puts the details in a blurb underneath, instead of one giant run-on line — and the Updates page reads the same clean way. Also fixed the World galleries: each layer's hero image was quietly showing up twice in its lightbox." },
  { date: "2026-07-21", text: "Enemy pages now have real art. Pulled the full Midjourney sets out of the archive and split them per sub-type: the three Lieutenants have their own galleries (Slag ×8, The Choir ×12, Tithe ×16), and Concord (Enforcer/Hunter), Hollowmen (Cultist), Thinned (Husk/Beast), Weave-horrors (Weave-horror/the Maw), and Scrye (Drone) all show their images on their own pages with a lightbox. The ten still-in-design members — the six new Lieutenants plus a few proposed sub-types — show an ‘Art TBD’ tile, with Midjourney prompts queued so none of them are blocked." },
  { date: "2026-07-20", text: "Threats got real depth. The group enemies — Lieutenants, Concord, Hollowmen, Thinned, Weave-horrors, Scrye — now have individual member pages you can open and build out, each with its own concept and its own ideas/feedback thread, while the group page still collects big-picture feedback for the whole collection. The Severant's Lieutenants are fleshed out: the three we knew (Choir/mirrors Rook, Slag/Temper, Tithe/Magpie) plus six proposed to mirror the rest of the crew — Gall (Cinder), Wake (Vesper), Fault (Citrine), Lock (Latch), Rapture (Wren), Ruin (Anvil). Pitch more or vote on these. Art is marked ‘TBD’ so none of it waits on Midjourney." },
  { date: "2026-07-20", text: "Mobile menu tidy-up: Leaderboard and Updates now live under a Hub dropdown (shorter top nav, no more two-line stacking on tablets). On phones the Hub and Characters menus collapse — tap a header to expand it, and opening one closes the other so the sheet stays small. The bottom bar swapped Feedback and Menu, and Feedback is now a compact icon button. Plus: the profile ‘Unsaved changes’ label now sits above its buttons, and the leaderboard's ‘Anonymous’ bucket no longer holds a top spot — it shows de-emphasized at the bottom so named folks fill the ranks." },
  { date: "2026-07-20", text: "Fixed manual account creation: hitting Create Account used to silently bounce you back to sign-in with no message (the confirmation note got wiped instantly). Now you get a clear ‘Check your email’ screen, and after you click the link in that email you land on a ‘Welcome — account created!’ screen with a button straight into the Hub. Prefer email over Google? It works properly now." },
  { date: "2026-07-20", text: "Profile page refresh: edit your gaming name with a ✎ next to your name instead of a separate box, see your own stats (logins, feedback shared, likes given, votes cast) up top, and a new \"Your identity\" panel showing your character, gaming name, actual name, and nickname together. Password change moved in here too — hidden if you signed in with Google." },
  { date: "2026-07-20", text: "Leaderboard and profile now recognize everyone's full set of names (gaming name, nickname, real name) — should merge points correctly for the whole crew, not just a couple of test cases." },
  { date: "2026-07-20", text: "New Feedback page: every piece of feedback in one place, open items you can up-vote and resolved items with a stats header (submitted, resolved, still open, average days to resolve). Linked from the Updates page and the footer." },
  { date: "2026-07-20", text: "Updates page: \"You asked, we listened\" now shows just the 5 most recent resolved items with a link to the full Feedback page, plus a new \"feedback items resolved\" stat." },
  { date: "2026-07-20", text: "Leaderboard now shows the actual display name you go by, with a small tag for your character — points still merge across any name variants you've used, they just don't hide your name anymore." },
  { date: "2026-07-20", text: "Updates page now has a stats strip (total updates shipped, busiest day of the week) and a \"You asked, we listened\" section pulling in feedback that's since been resolved." },
  { date: "2026-07-20", text: "Leaderboard fix: name variants for the same person (Toddlez/BipolarCrayons, jkrazy/Latch, etc) now count as one entry instead of splitting your points across two rows." },
  { date: "2026-07-20", text: "Profile page: photo reorder now saves for everyone (not just your own browser) once the backend migration runs — new Save button, a warning if you navigate away with unsaved changes, a drag ghost that follows your cursor, and like counts shown right on each photo." },
  { date: "2026-07-20", text: "Lightbox: double-click or scroll to zoom in on a photo, drag to pan around while zoomed." },
  { date: "2026-07-20", text: "Threat pages: the ideas-and-voting section moved up near the top (used to be buried below the gallery), and concept art now shows in a proper grid instead of a plain strip." },
  { date: "2026-07-20", text: "Threats pages now show everyone's submitted ideas for that enemy right on the page, with an up-vote button — no more ideas disappearing into a form no one else sees." },
  { date: "2026-07-20", text: "New Lab idea: Companion Games — a standalone game per character telling their origin story, all linking into the main game. Pitched by BipolarCrayons — go vote on it." },
  { date: "2026-07-20", text: "Your profile page: reorder your character's photos by dragging the ⠿ handle or typing a position, not just one-at-a-time arrows — works on phones too." },
  { date: "2026-07-20", text: "Tap outside an enlarged photo in the gallery lightbox to close it." },
  { date: "2026-07-19", text: "The Landing's Seam Slider leveled up: you can now toggle between three scenes (Market Row, The Grand Mile, Foundry Row), and grabbing the seam turns it into a living rift — hold or drag it and it pulses and throws off sparks in the world's colors (violet, teal, magenta, white), then settles when you let go. Art is still wireframe while we dial in the real paired scenes for each world." },
  { date: "2026-07-19", text: "Fix: on phones, the Characters menu now stacks neatly down the page instead of spilling sideways off the screen." },
  { date: "2026-07-18", text: "The Hub's ‘Recently’ now always shows the newest batch of changes (with its date) instead of a stale ‘last 24 hours’ that could read 0 — it tracks the latest updates in the log, however recent they are." },
  { date: "2026-07-17", text: "Signing in with Google now respects your handle: if you've already been going by a codename, we ask whether to keep it or use your Google name — so you never lose your identity switching sign-in methods." },
  { date: "2026-07-17", text: "You can now sign in with Google — one tap, no password, and it drops you straight into the Hub. Email sign-up and the shared code still work too. Signing out fully logs you out now." },
  { date: "2026-07-17", text: "You've got a Profile page now — click your avatar (top-right) to set a fun display name (it's what shows on the leaderboard and your feedback), pick which crew character you are, and sign out from there." },
  { date: "2026-07-17", text: "Polish: clearer sign-in messages, tidier spacing on the Hub ‘Recently’ dashboard, and the dashboard now reads the real date so ‘last 24 hours’ counts today's changes." },
  { date: "2026-07-14", text: "The Hub has a new ‘Recently’ dashboard: the latest update stays up top, with a quick summary of how much changed in the last 24 hours and the past 7 days." },
  { date: "2026-07-14", text: "You can now make your own account. On the first screen: Create account (or Sign in) with an email + password, and your feedback is tied to the real you — so the leaderboard is accurate. A shared code still works for quick guest access. Signed in, you'll see your initial top-right; click it to sign out." },
  { date: "2026-07-14", text: "New: a Characters overview page (in the nav) — a hero highlighting the crew and the threats, with quick jumps into Crew, Threats, and Synergy. The nav is grouped under a tidied ‘Characters’ menu." },
  { date: "2026-07-14", text: "New: a crew Leaderboard — earn points for shaping Veilrun (feedback counts triple, plus likes and votes), with a ‘most active this week’ spotlight. It's live off our feedback so far; logins will feed it once accounts are in." },
  { date: "2026-07-14", text: "The nav is tidier: Crew, Threats, and Synergy now live under a ‘Characters’ menu, and there's a Leaderboard link up top." },
  { date: "2026-07-14", text: "New: a Landing page (wireframe) in the nav — an early look at the outward-facing front door. It has a draggable ‘Seam Slider’ that wipes a scene between the two worlds, plus scroll parallax and a seam-tear. Art is placeholder for now; we're building it up slowly to get it right." },
  { date: "2026-07-13", text: "The Lab is now votable — tap ▲ on any game idea to up-vote it. Counts are shared across the whole crew, so we can see which concepts are rising." },
  { date: "2026-07-13", text: "The nav moved to the bottom on phones (easier on the thumb): tap the middle button to open the menu as a slide-up sheet. And there's now an ever-present Feedback button, so you can chime in from any page." },
  { date: "2026-07-13", text: "Naming locked in: the crew is The Last Fluent; Veilrun is the game." },
  { date: "2026-07-13", text: "Gallery now has a ☆ Favorites-only filter — flip it on to see just the shots the group has ♥'d, so it's easy to spot what's moving forward." },
  { date: "2026-07-13", text: "New environment art! The Overcity, Underweft, Seam, and Thinned were re-rendered so both worlds feel like one universe — grounded and photoreal, the tech side warm and real with arcane light bleeding in, the Weave side lifelike despite the magic." },
  { date: "2026-07-13", text: "Gallery now loads in batches as you scroll (much faster), Threats have detail pages (with a 'suggest an ability' CTA), and favorites show as group-wide across everyone's devices. Bishop added as a Vesper codename option." },
  { date: "2026-07-13", text: "Likes now stick — favorites load from the database on every visit, so ♥'d images stay ♥'d across your phone and laptop, and group favorites glow for everyone." },
  { date: "2026-07-13", text: "World: tap a layer (Overcity, Underweft, Seam, Thinned) to page through its concept art; tiles no longer overflow." },
  { date: "2026-07-12", text: "We're live! And feedback now saves for real — a proper form (pick your name, type, note), a 'Share a thought' button on the Hub, and a 'Pitch a game mode' card in the Lab." },
  { date: "2026-07-12", text: "Big round: Gallery filters are now a multi-select dropdown + sort; the lightbox has a resizable grid view (like Finder); Threats has Tiles/Full/List like Crew; the Crew full view shows more images; and there's a new Board page tracking progress. Mobile character pages fixed." },
  { date: "2026-07-12", text: "Fixes: mobile character pages no longer dwarfed by the portrait, thumbnails follow the shown image, ♥ Like works inside the enlarged view, Lab tags cleaned up. Cinder's name is locked in." },
  { date: "2026-07-12", text: "Polish pass: swipeable lightboxes everywhere, per-character gallery filters, ♥ favorites float to the top, synergy partners shown on each character page, and a shared Full layout across Crew & Threats." },
  { date: "2026-07-12", text: "Art is now woven through the site — a full Gallery (filter by crew/world/threats + lightbox), the Threats bestiary with enemy art, and environment shots on World." },
  { date: "2026-07-12", text: "Each crew page now has a gallery flip-through — page through their concept renders and ♥ the ones you like." },
  { date: "2026-07-12", text: "New Synergy explorer — tap a character to see their connections, or build a combo to see combined effects. Mobile-friendly." },
  { date: "2026-07-12", text: "Site foundation scaffolded — Hub, World, and Crew live from data. Sitemap locked." },
  { date: "2026-07-12", text: "Both Midjourney batches sorted (824 files) into named asset folders." },
  { date: "2026-07-12", text: "Synergy matrix v2, game modes (incl. Party/Hub direction), and the website plan finalized." }
];

/* ============================================================================
   GAME REFERENCE (VR-98) — what the crew plays, and what makes them stop.
   ----------------------------------------------------------------------------
   Two halves, on purpose:
     · Supabase  (game_refs + game_ref_notes) holds what the CREW supplied —
       which games are on the list, and one editable take per person per game.
     · This file holds what we KNOW about each game — blurb, platform, 2D/3D,
       art. Editorial content belongs in a commit you can read, not in a table
       row nobody can diff.

   Cards below are built COMPLETE but stay HIDDEN until at least one person has
   a take on the game. That way contributing never produces a placeholder — the
   first take reveals a finished card, immediately. A game submitted that ISN'T
   in here still works; it renders a "context coming" stub, which is the
   authoring queue making itself visible.

   Keys are slugs: lower-case, punctuation and spaces stripped. The slug is the
   join key to both Supabase tables — renaming one orphans every take on it.
   ========================================================================== */
VEILRUN.gameRefs = {
  /* ---- Seeded catalogue (VR-98 §8). ~47 games from Jordan's list, 8/15.
     These are HIDDEN until somebody has a take on one — they exist so the submit box
     autocompletes and so the first take reveals a finished card instead of a stub.
     Blurbs describe the LOOP, not the marketing, because the loop is the transferable part.
     `art` is derived from the slug (assets/gameref/<slug>.webp) and falls back to a
     typographic tile, so covers can be dropped in later with no edit here.

     `steam` is a Steam appid and the MIDDLE tier of that fallback (VR-107): a local webp
     still wins, and if there's no local file the card borrows Steam's 460×215 capsule
     rather than showing the tile. Only present where the id has been VERIFIED against the
     store — a guessed appid renders a confidently wrong cover, which is worse than none,
     and roughly a third of the ids guessed from memory during this pass turned out to
     point at some other game entirely. No `steam` key means "not checked yet, or not on
     Steam" (Mario Kart, Fortnite, League, the browser games, and the two `gone` entries
     never will be); those render the tile, which is a designed state. `node _grefart.js`
     resolves the rest. ---- */

  apexlegends: { name: "Apex Legends", blurb: "Squad battle royale. Three-player teams drop in, loot, and fight to be the last squad standing — built on movement (slide, climb, zip) and a distinct ability kit per legend. The ping system let squads communicate without voice.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["co-op squad", "abilities", "movement", "battle royale"], steam: 1172470 },
  orcsmustdie: { name: "Orcs Must Die! (series)", blurb: "Trap-and-defend. You fortify a route with traps, then hold the line in person as waves of orcs pour toward your rift — planning phase, then a combat phase where your own weapons cover what the traps miss. Co-op across the series.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["base defense", "waves", "co-op", "traps"], steam: 102600 },
  highguard: { name: "Highguard", blurb: "3v3 raid shooter from Wildlight Entertainment, founded by ex-Titanfall and Apex developers. Each team fortifies a base, rides out to gather resources, then raids the other team's base while defending its own. Launched 26 Jan 2026 and shut down 12 Mar 2026 — 45 days — after Tencent withdrew funding.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["base defense", "abilities", "co-op squad", "PvP"], status: "gone" },
  crimsondesert: { name: "Crimson Desert", blurb: "Open-world action adventure from Pearl Abyss, released 19 Mar 2026. Large-scale traversal and physical, grapple-heavy combat across a continent at war.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["open world", "combat feel", "single player"], steam: 3321460 },
  reddeadredemption: { name: "Red Dead Redemption", blurb: "Rockstar's open-world western. A slow, weighty world where travel, hunting and incidental encounters carry as much of the game as the missions do — the pace is the design, not a cost.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["open world", "story", "single player"], steam: 1174180 },
  callofduty: { name: "Call of Duty (series)", blurb: "The long-running military shooter. Tight gunplay and short match loops, with a campaign, competitive multiplayer and a rotating cast of modes — the benchmark most shooters get measured against for feel.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["combat feel", "PvP", "progression"] },
  callofdutyzombies: { name: "Call of Duty: Zombies", blurb: "Co-op wave survival. Up to four players hold a shrinking space against escalating rounds of undead, spending points to open doors, buy weapons and rebuild barricades. Round-based, endless, and built around a map you learn.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["waves", "base defense", "co-op", "survival"] },
  golfwithyourfriends: { name: "Golf With Your Friends", blurb: "Up to twelve players putt through mini-golf courses at the same time, bumping each other off the green. Short holes, low stakes, easy to drop into.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["multiplayer", "party", "respects your time"], steam: 431240 },
  uno: { name: "UNO", blurb: "The card game, online. Short rounds, house rules, and a chat window — the appeal is that it's something a whole group can play while talking about something else.", dimension: "2D", platforms: ["PC", "PS5", "Xbox", "Switch", "Mobile"], mechanics: ["multiplayer", "party", "respects your time"], steam: 470220 },
  seaofthieves: { name: "Sea of Thieves", blurb: "Shared-world pirate co-op. A crew sails one ship together — someone steers, someone works the sails, someone patches holes below deck — chasing voyages while other real crews can find you at any time.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op", "open world", "shared roles", "PvPvE"], steam: 1172620 },
  commandandconquer: { name: "Command & Conquer (series)", blurb: "Real-time strategy. Harvest resources, build a base, produce an army and break the other side's base before they break yours — build order and economy as much as combat.", dimension: "2D", platforms: ["PC"], mechanics: ["base building", "strategy", "PvP"], steam: 1213210 },
  partyanimals: { name: "Party Animals", blurb: "Physics brawler. Wobbly puppies and kittens shove each other off ledges with deliberately unreliable ragdoll controls — the loose physics is the joke, not a flaw.", dimension: "3D", platforms: ["PC", "Xbox"], mechanics: ["multiplayer", "party", "physics"], steam: 1260320 },
  makeway: { name: "Make Way", blurb: "Build-and-race. Players lay down track pieces and hazards one at a time, then race across the track they collectively sabotaged. The building phase is the game.", dimension: "2D", platforms: ["PC", "Switch"], mechanics: ["multiplayer", "party", "building"], steam: 1445790 },
  mariokart: { name: "Mario Kart", blurb: "Kart racing with items. Skill in the driving, chaos in the item box, and a rubber-banding design that keeps last place in contention — which is why a mixed-skill group can all play it.", dimension: "3D", platforms: ["Switch"], mechanics: ["multiplayer", "party", "racing"] },
  plateup: { name: "PlateUp!", blurb: "Co-op kitchen roguelite. Run a restaurant across days that get harder, with permanent upgrades between runs — the pressure comes from coordinating who does what, not from reflexes.", dimension: "2D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["co-op", "roguelite", "progression", "shared roles"], steam: 1599600 },
  welcometoparadize: { name: "Welcome to ParadiZe", blurb: "Co-op zombie survival where you hack zombies into servants — they carry, fight and work your base while you build it up. Survival, base building and a light management layer.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op", "base building", "survival"], steam: 1519090 },
  allstarbrawl2: { name: "Nickelodeon All-Star Brawl 2", blurb: "Platform fighter in the Smash Bros mould — knock opponents off the stage rather than draining a health bar, with a Nickelodeon roster.", dimension: "2.5D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["multiplayer", "party", "combat feel"], steam: 2017080 },
  hyperchargeunboxed: { name: "Hypercharge: Unboxed", blurb: "Co-op toy-soldier wave defense. Up to four players build turrets and traps around a set of cores, then defend them through waves — shooter controls on a tower-defense frame, at toy scale.", dimension: "3D", platforms: ["PC", "Xbox", "Switch"], mechanics: ["base defense", "waves", "co-op", "building"], steam: 523660 },
  goatsimulator3: { name: "Goat Simulator 3", blurb: "Deliberately broken open-world slapstick. Co-op sandbox where the physics bugs are the content and the objectives are mostly excuses to cause trouble.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op", "party", "physics", "open world"], steam: 850190 },
  rocketleague: { name: "Rocket League", blurb: "Car football. A tiny rule set with an enormous skill ceiling — aerials, dribbles and rotation come out of physics rather than abilities. Five-minute matches.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["multiplayer", "movement", "respects your time", "PvP"], steam: 252950 },
  fortnite: { name: "Fortnite", blurb: "Battle royale with building. Harvest materials mid-fight and throw up walls and ramps as cover — the build layer is what separates it from every other BR. Now also a platform of other modes.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch", "Mobile"], mechanics: ["building", "multiplayer", "battle royale", "progression"] },
  friendsvsfriends: { name: "Friends vs Friends", blurb: "Shooter with a deckbuilder bolted on. You bring a hand of cards into each round and play them mid-fight for weapons and effects — short matches, silly combos.", dimension: "3D", platforms: ["PC"], mechanics: ["multiplayer", "abilities", "PvP", "respects your time"], steam: 1785150 },
  thepluckysquire: { name: "The Plucky Squire", blurb: "Storybook adventure that jumps between 2D pages and the 3D desk the book sits on — the whole game is built on moving between the two, and puzzles use the transition itself.", dimension: "2.5D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["single player", "puzzle", "art & style"], steam: 1627570 },
  marvelrivals: { name: "Marvel Rivals", blurb: "6v6 hero shooter. Distinct kits per character, destructible environments, and team-up abilities that only trigger with specific character pairings — the closest commercial analogue to a synergy system.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["abilities", "co-op squad", "PvP", "synergies"], steam: 2767030 },
  splitgate: { name: "Splitgate", blurb: "Arena shooter where every player can shoot portals — flanks and escapes come from portal placement, so the movement layer is entirely yours to invent. Its history is messy: the original's servers were shut down, and Splitgate 2 was pulled back to beta after a 2025 launch and relaunched as Splitgate: Arena Reloaded in December 2025.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["movement", "PvP", "multiplayer"], steam: 677620 },
  midnightmurderclub: { name: "Midnight Murder Club", blurb: "Hide-and-shoot in near-total darkness. Everyone has a pistol and a flashlight in a pitch-black mansion, and using your light to find someone also tells them exactly where you are. Voice chat is a mechanic.", dimension: "3D", platforms: ["PC", "PS5"], mechanics: ["multiplayer", "party", "PvP"], steam: 2698870 },
  diablo: { name: "Diablo (series)", blurb: "Isometric action RPG. Clear dungeons, collect loot, rebuild your character around what drops — the loop is build-craft and the endless numbers going up, playable co-op.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["abilities & builds", "progression", "co-op", "loot"], steam: 2344520 },
  helldivers2: { name: "Helldivers 2", blurb: "Co-op squad shooter. Four players drop into procedural missions, hold objectives against escalating waves, and extract. Friendly fire is always on, and stratagems are called in by typing directional codes under pressure.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op squad", "waves", "abilities", "survival"], steam: 553850 },
  anothercrabstreasure: { name: "Another Crab's Treasure", blurb: "Soulslike where you're a hermit crab and your shell is your gear — swap trash for a new shell and your defensive options change with it. Ocean-floor world, comic tone, real difficulty.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["combat feel", "single player", "progression"], steam: 1887840 },
  baldursgate3: { name: "Baldur's Gate 3", blurb: "Turn-based RPG on D&D rules, playable in co-op. The draw is that almost any plan works — the systems interact honestly enough that improvised solutions are usually supported rather than blocked.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op", "story", "abilities & builds"], steam: 1086940 },
  spiderman2: { name: "Marvel's Spider-Man 2", blurb: "Open-world superhero action. The web-swinging is the whole product — traversal that's enjoyable enough to be the reason you play, with combat and story built around it.", dimension: "3D", platforms: ["PS5"], mechanics: ["movement", "open world", "story", "single player"], steam: 2651280 },
  ridersrepublic: { name: "Riders Republic", blurb: "Open-world extreme sports playground. Bikes, skis, wingsuits and rockets across one shared map, with mass races and trick scoring.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["movement", "multiplayer", "open world"], steam: 2290180 },
  nomanssky: { name: "No Man's Sky", blurb: "Procedural space survival. Explore, mine, build bases and fly between planets — notable as much for the years of free updates that turned a rough launch around as for the game itself.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["base building", "co-op", "open world", "survival"], steam: 275850 },
  needforspeedheat: { name: "Need for Speed Heat", blurb: "Street racing with a day/night split — sanctioned races by day for money, illegal races by night for reputation, with police heat that follows you home. Deep visual customisation.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["racing", "customisation", "progression"], steam: 1222680 },
  titanfall2: { name: "Titanfall 2", blurb: "Movement shooter. Wall-running and sliding chain into constant momentum, and you call down a Titan to fight in. Its campaign is widely held up as one of the best-designed shooter campaigns ever made.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["movement", "combat feel", "abilities", "story"], steam: 1237970 },
  tonyhawkproskater: { name: "Tony Hawk's Pro Skater", blurb: "Trick-combo skating in two-minute runs. A short timer, a checklist of objectives per level, and a combo system that rewards linking everything together without touching the ground.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["movement", "respects your time", "progression"], steam: 2395210 },
  stray: { name: "Stray", blurb: "You're a cat in a dead neon city. Short, atmospheric, mostly traversal and light puzzles — carried by mood and animation rather than systems.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["single player", "art & style", "respects your time"], steam: 1332010 },
  cyberpunk2077: { name: "Cyberpunk 2077", blurb: "Open-world RPG in a dense vertical city. Build-driven — cyberware and skills let you play it as a hacker, a stealth build or a brawler — and a well-documented case of a disastrous launch repaired over years.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["abilities & builds", "open world", "story", "art & style"], steam: 1091500 },
  dysmantle: { name: "Dysmantle", blurb: "Post-apocalyptic survival where the hook is that you can break absolutely everything down for materials. Open world, top-down, crafting and base upgrades driving the progression.", dimension: "2D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["survival", "base building", "progression", "open world"], steam: 846770 },
  subnautica: { name: "Subnautica", blurb: "Underwater survival crafting. Scan what you find to unlock the means to go deeper, building habitats and submarines as you go — the pressure comes from the dark and the depth rather than from combat.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["survival", "base building", "single player", "progression"], steam: 264710 },
  spellbreak: { name: "Spellbreak", blurb: "Spell-slinging battle royale — pick two elemental gauntlets and combine them, so the fun came from interactions (lightning through a gas cloud) rather than gun stats. Servers shut down in January 2023.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["abilities", "synergies", "battle royale", "movement"], status: "gone" },
  thewitcher3: { name: "The Witcher 3: Wild Hunt", blurb: "Open-world RPG. Its reputation rests on the side quests — the smaller stories are written as well as the main one, which is why people remember the world rather than the combat.", dimension: "3D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["story", "open world", "single player"], steam: 292030 },
  eldenring: { name: "Elden Ring", blurb: "Open-world soulslike. Hard combat with readable rules, almost no direction, and discovery as the reward — you're trusted to go the wrong way and find something.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["combat feel", "open world", "abilities & builds"], steam: 1245620 },
  eldenringnightreign: { name: "Elden Ring Nightreign", blurb: "Standalone three-player co-op roguelite in the Elden Ring world, released 30 May 2025. Runs are three in-game days on a shrinking map, ending in a boss — designed around trios specifically, with solo supported and duos added after launch.", dimension: "3D", platforms: ["PC", "PS5", "Xbox"], mechanics: ["co-op squad", "roguelite", "combat feel", "abilities"], steam: 2622380 },
  leagueoflegends: { name: "League of Legends", blurb: "5v5 MOBA. Two teams push lanes toward each other's base, farming and fighting for the items and levels that decide the late game — enormous champion roster, deep team synergies, long matches.", dimension: "2.5D", platforms: ["PC"], mechanics: ["abilities", "co-op squad", "PvP", "synergies"] },
  stickfight: { name: "Stick Fight: The Game", blurb: "Physics brawler with stick figures. Up to four players, absurd weapons, levels that fall apart under you — rounds last seconds and nobody takes it seriously.", dimension: "2D", platforms: ["PC", "PS5", "Xbox", "Switch"], mechanics: ["multiplayer", "party", "physics", "respects your time"], steam: 674940 },
  theclassroom: { name: "The Classroom (browser series)", blurb: "Browser point-and-click from the Flash era — cheat off the students around you while the teacher patrols the room, and look away before she turns. Nostalgia tier, and a fair reminder of how small a game can be and still be remembered.", dimension: "2D", platforms: ["Browser"], mechanics: ["stealth", "puzzle", "single player", "respects your time"] }
};

/* Typo and shorthand collisions, resolved before the slug is looked up. Left side
   is what someone might type; right side must be a real key in gameRefs (or a slug
   already in Supabase). _grefcheck.js asserts every target is a clean slug and that no
   alias chains or points at itself.

   An alias MERGES SILENTLY, so an ambiguous one destroys data with no trace. Deliberately
   omitted for that reason: `tf2` (Team Fortress 2 far more often than Titanfall 2), `mk`
   (Mortal Kombat vs Mario Kart), `er` (too short to mean anything). When a shorthand is
   genuinely contested, leave it out and let the near-match prompt ask instead. */
VEILRUN.gameRefAliases = {
  cod: "callofduty",
  codzombies: "callofdutyzombies",
  zombies: "callofdutyzombies",
  hd2: "helldivers2",
  omd: "orcsmustdie",
  omd3: "orcsmustdie",
  orcsmustdie3: "orcsmustdie",
  rdr: "reddeadredemption",
  rdr2: "reddeadredemption",
  lol: "leagueoflegends",
  bg3: "baldursgate3",
  baldursgate: "baldursgate3",
  nfs: "needforspeedheat",
  gwf: "golfwithyourfriends",
  golfwithfriends: "golfwithyourfriends",
  cnc: "commandandconquer",
  asb2: "allstarbrawl2",
  thps: "tonyhawkproskater",
  cyberpunk: "cyberpunk2077",
  witcher: "thewitcher3",
  thewitcher: "thewitcher3",
  nightreign: "eldenringnightreign",
  sot: "seaofthieves",
  bg: "baldursgate3",
  hypercharge: "hyperchargeunboxed",
  pluckysquire: "thepluckysquire",
  classroom: "theclassroom",
  theclassroom2: "theclassroom",
  stickfightthegame: "stickfight"
};

/* The tag vocabulary. Deliberately about FEEL, not genre — genre is on the context
   card already, and nobody needs to be asked what genre Uno is.
   The gripe row is the more useful of the two: it's the half nobody writes down. */
VEILRUN.gameRefTags = {
  love: [
    "the movement", "the combat feel", "multiplayer / playing with friends",
    "base building & defense", "abilities & builds", "progression",
    "the look & style", "fashion & customisation", "the music",
    "feels good to use", "story", "it respects my time"
  ],
  gripe: [
    "grindy", "slow to get going", "punishing", "repetitive",
    "no real multiplayer", "bad with friends", "clunky menus & controls",
    "monetisation", "too complex", "technical problems"
  ]
};
