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
    id: "anvil", name: "Anvil", player: "Michael", alias: "Maddog", aliases: ["Mike"], accent: "var(--c-anvil)",
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
    id: "babel", name: "Babel", player: "Manafest", alias: "Manafest", accent: "var(--c-babel)",
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

VEILRUN.modes = [
  { id: "rook-recon", name: "Rook — Map Recon", status: "prototyping", text: "Fog-of-war board; Rook's Sixth Sense reveals, Blink shuttles allies. Cheapest digital test.", chars: "All (Rook headlines)" },
  { id: "seam-strike", name: "Seam Strike (heist/extraction)", status: "idea", text: "Co-op infiltration across the seam; loud crew vs quiet crew routes.", chars: "3–4" },
  { id: "warded-sanctum", name: "Warded Sanctum (defense)", status: "idea", text: "Magpie's base against waves; build traps between rounds (Orcs Must Die energy).", chars: "All" },
  { id: "rig-the-ride", name: "Rig the Ride (escort)", status: "idea", text: "Deliver something fragile across a thinning district in the enchanted vehicle.", chars: "All" },
  { id: "pair-levels", name: "2D Pair Levels", status: "prototyping", text: "Levels only clearable with a specific pair's combo — the purest synergy test. Choose your characters, then run their levels: Anvil + Latch (flip the world & charge through walls) or Cinder + Vesper (stealth — cloak, gas, and the Dose combo).", chars: "Pairs", version: "v1",
    combos: [
      { id: "anvil-latch", label: "Anvil + Latch", sub: "Flip & charge · The Seam Gate", play: "games/pair-level/index.html" },
      { id: "cinder-vesper", label: "Cinder + Vesper", sub: "Stealth · Shadow Run (has the first enemy)", play: "games/shadow-run/index.html" },
      { id: "rook-wren", label: "Rook + Wren", sub: "Telekinesis · Uplift (launch + surge)", play: "games/uplift/index.html" },
      { id: "temper-citrine", label: "Temper + Citrine", sub: "Blades & arc · Arcline (plant + power)", play: "games/arcline/index.html" },
      { id: "magpie-babel", label: "Magpie + Babel", sub: "Shield & command · Runeway (shield + power the lift)", play: "games/runeway/index.html" }
    ],
    boardTree: [
      { id: "v1", label: "v1 (current)", combos: [
        { id: "anvil-latch", label: "Anvil + Latch", levels: [ { id: "seam-gate", label: "Level 1" }, { id: "seam-gate-2", label: "Level 2" }, { id: "seam-gate-3", label: "Level 3" } ] },
        { id: "cinder-vesper", label: "Cinder + Vesper", levels: [ { id: "shadow-run", label: "Level 1" }, { id: "shadow-run-2", label: "Level 2" }, { id: "shadow-run-3", label: "Level 3" } ] },
        { id: "rook-wren", label: "Rook + Wren", levels: [ { id: "uplift", label: "Level 1" }, { id: "uplift-2", label: "Level 2" }, { id: "uplift-3", label: "Level 3" } ] },
        { id: "temper-citrine", label: "Temper + Citrine", levels: [ { id: "arcline", label: "Level 1" }, { id: "arcline-2", label: "Level 2" }, { id: "arcline-3", label: "Level 3" } ] },
        { id: "magpie-babel", label: "Magpie + Babel", levels: [ { id: "runeway", label: "Level 1" }, { id: "runeway-2", label: "Level 2" }, { id: "runeway-2b", label: "Level 2-2" }, { id: "runeway-3", label: "Level 3" } ] }
      ] },
      { id: "v2", label: "v2 (preview)", combos: [
        { id: "magpie-babel", label: "Magpie + Babel · Cross the Seam", levels: [ { id: "runeway-v2", label: "Slice 1 — Cross the Seam" } ] }
      ] },
      { id: "v0", label: "v0 (legacy)", combos: [
        { id: "anvil-latch", label: "Anvil + Latch · Foundry Gate", levels: [ { id: "foundry-gate", label: "Level 1" } ] }
      ] }
    ] },
  { id: "arena-clash", name: "Arena Clash (fighting game)", status: "idea", text: "Street Fighter / Mortal Kombat-style duels — pick from the roster and fight, with tag-team 2v2 / 2v1 and round-based (and maybe circular) arenas. (Pitched by jkrazy.)", chars: "1v1 / 2v2" },
  { id: "tactics-rpg", name: "Tactics RPG", status: "idea", text: "Turn-based grid squad tactics; positioning = the proximity-bond system.", chars: "Squad" },
  { id: "choose-adventure", name: "Choose-Your-Adventure", status: "idea", text: "A branching mission; each reader plays their character. Tests tone + the Severant.", chars: "All" },
  { id: "comic-anthology", name: "Comic Anthology (interactive comics)", status: "idea", text: "A series of interactive, comic-book-styled stories tied to the world — builds out lore without building full game systems first, and could be published/sold on its own to help fund development. Maybe layers onto Choose-Your-Adventure rather than standing fully separate. (Pitched by jkrazy.)", chars: "All" },
  { id: "underweft-dive", name: "Underweft Dive (roguelite)", status: "idea", text: "Short runs into a rearranging Underweft; combos are the build system.", chars: "2 per run" },
  { id: "reunion-royale", name: "Reunion Royale", status: "idea", text: "Battle-royale twist — the crew scattered on a Sundering map must find each other and converge.", chars: "8" },
  { id: "severant-duel", name: "Severant Boss Duel", status: "idea", text: "One plays the Severant; the others must chain a Convergence to win.", chars: "1 vs many" },
  { id: "anthology", name: "Anthology (all of it)", status: "idea", text: "One world; each character headlines the genre that fits them.", chars: "All" },
  { id: "companion-games", name: "Companion Games (origin stories)", status: "idea", text: "Each character gets their own smaller standalone game telling their backstory, all linking into the main Veilrun game. Related to Anthology (genre-per-character in one game) but distinct — this is separate titles, backstory-focused. Pitched by BipolarCrayons.", chars: "All (one per character)" },
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

VEILRUN.updates = [
  { date: "2026-08-05", title: "Runeway v2 preview: new controller + cross the seam (Magpie + Babel)", text: "A first look at the v2 controller and kit work — try it before it becomes the default. The controls are new: a proper analog stick on the left (drag or tap a direction; push up to jump) and a grid of ability buttons on the right that relabel for whoever you're holding — Magpie gets Shield / Ward / Revive, Babel gets Strike / Reinforce / True Name / Read (an empty slot just means 'no action here yet — tell us what it should do'). New mechanic: the world is split in two halves, the Overcity and the Underweft, and Babel reads the runes to cross the seam and takes the crew with him. This slice: cross into the Underweft, Babel powers a tram across a gap you can't jump while Magpie shields the turret fire, then read your way back to the exit. It's an opt-in preview — Magpie + Babel still opens v1 by default; use the Version dropdown on the game's title screen (or the Lab's leaderboard) to pick 'v2 · Cross the Seam'. Keeps its own best-times board. Very much a prototype — tell us if the new controller feels right and whether the extra actions are too much.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-04", title: "Runeway: two more levels (Magpie + Babel)", text: "Magpie + Babel now has three levels, and the rune drives something different each time. Level 1: a lift straight up. Level 2: the rune powers a TRAM that ferries you across a pit you can't jump — the whole crossing is under fire, so time your shield and launch together; Babel can tap Read mid-ride to boost the tram for a faster run. Level 2-2 is that same tram turned brutal — a longer, fully-exposed crossing where one shield won't cover you, so you have to boost to survive (its own board, for the show-offs). Level 3 is the gauntlet: ride a lift up through one turret's fire — that one you can't reach, so shield it — then Babel silences the second turret and powers a tram across a high gap to the exit. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-03", title: "Combo #5 is in — all ten crew now play: Magpie + Babel (Runeway)", text: "The roster's complete — every crew member is in a playable pair. Magpie + Babel is combat-flavoured: a turret sprays fire across the way. Magpie throws up a SHIELD — an aura that wraps the whole crew and soaks up the fire for a few seconds, then recharges. Babel, the military linguist, reads foreign tech — stand by the turret to DISARM it, or by a rune to POWER its lift, an elevator that carries you up to the exit. Shield the crossing, silence the gun, ride the lift up. Find it under 2D Pair Levels → Play → Magpie + Babel. (Prototype — tell us how it feels; harder levels coming.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-02", title: "Arcline: two more levels (Temper + Citrine)", text: "Temper + Citrine now has three levels. Level 2 throws a live-wire hazard across the path — Citrine has to spark it off before you can pass (that short zap of his finally earns its keep) — then a two-trigger gate. Level 3 walls you off completely — no more walking over to the trigger. Two triggers sit behind the wall, and Temper has to thread blades through two tight gaps at different heights so the current can chain to both. Citrine sparks from your side; if you haven't built the line, nothing lights. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-08-01", title: "Vesper's gallery just tripled", text: "Dropped 96 new Vesper variants into his gallery — hood up, hood down, hood resting on the shoulder, the full range. Open Vesper on the Crew page and heart the ones you like.", cta: { label: "Meet Vesper →", href: "#crew/vesper" } },
  { date: "2026-08-01", title: "Combo #4 is playable: Temper + Citrine (Arcline)", text: "Four of five pairs are in. Temper THROWS blades that stick where they land — conductors, not footholds (so you can't just climb them). Citrine's Spark is short-range on its own, but it hops blade-to-blade: throw a line of blades to the gate's trigger, then spark it open. You genuinely need both. Find it under 2D Pair Levels → Play → Temper + Citrine. Its own best-times board. (Prototype, one level — tell us how the throw + spark feels and I'll build more.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-31", title: "Uplift: two more levels (Rook + Wren)", text: "Rook + Wren now has three levels. Level 2 makes Wren work for it — launched onto a ledge, then Surge across a gap to reach the node. Level 3 is a two-circuit run: charge the first node to bridge Rook forward, then he launches Wren again to charge a second node and open the way to the exit. Each keeps its own best-times board.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-31", title: "Combo #3 is playable: Rook + Wren (Uplift)", text: "The third pair is in. Rook can't jump — but his ability launches Wren into the air (then you steer her). Wren is fast, jumps high, and her Surge dash charges a current-node that raises Rook's bridge so he can cross. Neither can finish alone: Wren can't reach the node without Rook's launch, and Rook can't cross the gap without Wren's charge. Find it under 2D Pair Levels → Play → pick Rook + Wren. Its own best-times board — go set the first record. (Prototype — tell us how the launch/steer feels.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", title: "Fixes from your notes: mobile nav + leaderboard clarity", text: "A batch of fixes: the mobile nav dropdown no longer sticks open (you can close it and tap other links again), the stealth game's level picker is styled correctly, and the leaderboard now shows game points in each person's breakdown — and 'most active this week' counts play, not just feedback, so the numbers actually reflect where your points came from. Also gave the leaderboard dropdowns roomier arrows and bigger tap targets on mobile.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-30", title: "Shadow Run: two more levels", text: "Cinder + Vesper now has three levels. Level 2 adds a second patrol to slip past; Level 3 is a two-gate run — you'll need to gas (and Dose across) more than once. Each has its own best-times board. Also fixed the leaderboard dropdowns being too small to tap on phones.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-29", title: "New pair to play: Cinder + Vesper (stealth — with the first enemy)", text: "2D Pair Levels now lets you choose your characters. Hit Play and pick a combo: Anvil + Latch (the flip-and-charge levels) or the new Cinder + Vesper — a stealth level, and the game's first enemy. Vesper turns invisible when he holds still, Cinder lobs gas to blind a guard's vision cone, and the combo that matters: Cinder can Dose Vesper (stand together) so he crosses the gas unharmed. Slip both past the patrol to the exit — get spotted and it's back to the start. The leaderboard now sorts by Version → Combo → Level, so every pair keeps its own board. Go set the first Cinder + Vesper record. (Very much a prototype — tell us what feels off.)", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-28", title: "Tidier game start screen", text: "Cleaned up the pair-level title screen: shorter intro, the level dropdown and Play button line up properly now, and the keyboard-controls line is hidden on phones (where you're using the on-screen buttons anyway).", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", title: "Cleaner level picker", text: "The title-screen level menu is a tidy dropdown now, and the ✓ only appears on levels you've actually cleared — before, a stray checkmark was showing on whichever level was highlighted. Pick a level and hit Play.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", title: "Anvil's color is officially red", text: "We locked in Anvil's accent color: red, matching his silhouette and how he looks in the game (it just fits him). You'll see it on his crew card, hover, and gallery frame. Small thing, but it's part of a bigger tidy-up — we're getting the game and the site to share one set of brand colors instead of drifting apart." },
  { date: "2026-07-28", title: "Win-screen polish: Replay left, Next right", text: "Small UX fix on the level-complete screen: Replay sits on the left (it takes you back), Next level on the right (it moves you forward), matching how buttons should read. The ‘← Back to the Lab’ control is a proper button now on both the title and win screens, instead of turning into a plain underlined link after some levels — one consistent style throughout.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", title: "Level 3 is live — and Anvil has a new move", text: "There's a third level, plus a new trick for Anvil: while he's in the air, his ability crashes him straight down instead of charging. Worth experimenting with it as you go — you never know what might give way. Fastest route wins the board.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-28", title: "Leaderboard: separate Version + Level pickers", text: "The Lab's best-times board now has two dropdowns instead of one — pick the Version (v1 Seam Gate / v0 Foundry Gate), then the Level within it. As we add levels they slot under their version instead of piling into one long list. The in-game level picker is a dropdown now too, so the title screen stays tidy as the roster of levels grows.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", title: "Earn points for playing", text: "The game now pays out into the crew leaderboard: +2 for trying a level, +10 for your first clear, +3 every time you beat your own best, and 🏆 +5 for setting a new level record (taking #1). You'll see what you earned on the win screen, and it all stacks with the points for feedback, likes, and votes. So there's a reason to keep chasing faster times, not just first place.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", title: "Level 2 is live — plus a level picker", text: "The Seam Gate now has a second level, 'The Long Seam' — a longer flip-and-charge gauntlet with a spot where Anvil's plow is the fast way through. Pick any level from the title screen (all open for testing, with a ✓ on the ones you've cleared). Fall or die and you restart that level, not the whole run. Each level keeps its own best-times board — switch between them in the Lab leaderboard dropdown.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", title: "Leaderboard: pick the version + roomier buttons", text: "The Lab leaderboard now has a dropdown to switch between each version's best-times board (v1 Seam Gate, v0 Foundry Gate) — and as we add levels, they'll slot right in. Also gave the Play and Feedback buttons some breathing room so they're comfortable to tap.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", title: "Fixed: the update feed was cache-stuck", text: "If the Hub's latest update and the Recently list looked frozen, that was your browser holding onto an old copy of the site's data — the updates were all there, just cached. Fixed site-wide so pushes now show up right away. You may need one hard refresh to clear the old cache; after that it's automatic. (If you're seeing this entry, it worked.)", cta: { label: "▶ Play the game", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", title: "Both maps now play on mobile", text: "The original Foundry Gate is back — rebuilt on the mobile engine as v0 (Anvil anchors pits, Latch breaches gaps, then a plate-and-door finish). Use the Version dropdown on either game's title screen to switch between v0 · Foundry Gate and v1 · Seam Gate. Each keeps its own best-times leaderboard, so there are two crowns to chase.", cta: { label: "▶ Play", href: "games/pair-level/index.html" } },
  { date: "2026-07-26", title: "Playable games + live leaderboards in the Lab", text: "The Lab has a ‘Playable now’ section right at the top now — jump straight into the game without digging through the ideas, with the crew's best-times leaderboard sitting right beside it (your row highlighted). As we add more playable prototypes, they'll line up here too.", cta: { label: "Open the Lab →", href: "#lab" } },
  { date: "2026-07-26", title: "Babel's art is in — plus Vesper & Temper refreshed", text: "Manafest's character Babel now has real art: a hero portrait and a big gallery to react to, in place of the placeholder. Vesper and Temper picked up fresh variants too (masks, hoods, forge rigs). Open Babel on the Crew page and heart the ones you like.", cta: { label: "Meet Babel →", href: "#crew/babel" } },
  { date: "2026-07-26", title: "Game polish for phones", text: "The pair level's on-screen buttons and the back-to-Lab control are proper tap targets now, so it's comfier to play on a phone. Toddlez and Ramon are already trading the top of the leaderboard — go stake your claim." },
  { date: "2026-07-26", title: "Play older game versions + Anvil holds his ground", text: "The game's title screen now lists past versions, so you can jump back to an earlier build (v0.1, the Foundry Gate) any time. Also, per feedback: nobody can shove Anvil around anymore — he's immovable like a juggernaut should be — though he can still push others and plow Latch along." },
  { date: "2026-07-25", title: "Seam Gate controls feel better", cta: { label: "▶ Play the Seam Gate", href: "games/pair-level/index.html" }, text: "A few prototype fixes: Latch now trails behind Anvil during a charge (Anvil's the shield, not a scoop), you can slide your thumb between ◄ and ► to change direction instead of re-tapping, the ability button keeps a steady ✦ icon with the action name underneath, and the ‘← Lab’ link finally lands you back in the Lab (not the Hub)." },
  { date: "2026-07-25", title: "Anvil can plow Latch through walls", text: "New in the Seam Gate: if Anvil charges into Latch, he plows him along — carrying him through the breach, cracked wall and all. Makes getting past each other way easier, and it's now part of Anvil's kit (Rampage) and a new Anvil + Latch team-up, ‘Battering Ram.’ Characters also soft-push past each other now instead of feeling like a wall." },
  { date: "2026-07-25", title: "Best-times leaderboard in the game", text: "The Seam Gate now records your clear time — beat the level and you'll see your best plus a ‘Best times · the crew’ ranking on the win screen, with your row highlighted. Race each other for the fastest run. (Your own best saves locally right away; the crew board goes live once the game_scores table is added in Supabase.)" },
  { date: "2026-07-25", title: "Prototype polish + Lab tidy-up", text: "Small stuff: the game now shows its version (v0.2) and has a ← Lab button so it's easy to get back, the map button is bigger, and in the Lab the ‘Play the prototype’ and Feedback buttons no longer crowd each other (and feedback buttons are taller/easier to tap on mobile)." },
  { date: "2026-07-25", title: "Playable prototype: The Seam Gate", text: "There's a real, playable thing in the Lab — hit ▶ Play on '2D Pair Levels.' You control Anvil and Latch (tap Switch). Here's the twist we just added: Latch can Flip the whole level between the two worlds — walls in the Overcity vanish in the Underweft — while Anvil charges straight through cracked walls that exist in both. Neither can clear it alone. Zooms and follows on phones, with a 🗺 Map button to peek at the whole level. Rough prototype — tell us how it feels." },
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
