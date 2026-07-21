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
    { name: "The Overcity", tag: "Topside · the Current", img: "assets/img/overcity.png", text: "A vertical industrial-arcane metropolis, surveilled. Most live and die here never knowing the other layer is real." },
    { name: "The Underweft", tag: "The Weave", img: "assets/img/underweft.png", text: "The same city's hidden self, rearranged by meaning not distance. Beautiful and wrong-feeling." },
    { name: "The Seam", tag: "The border", img: "assets/img/seam.png", text: "A translation gradient. Cross it and words, visuals, even item names shift. The crew is fluent on both sides." },
    { name: "The Thinned", tag: "The blight", img: "assets/img/thinned.png", text: "When too much Current is drained, a place goes thin — colorless, listless. The endpoint of the drift." }
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
      desc: "Rook reads minds with serene control; the Choir cages them. A gaunt psionic wreck streaming sickly green light, haloed by overlapping screaming faces — the minds he's trapped. Telepathy turned into a prison." },
    { id: "slag", name: "Slag", mirrors: "Temper", role: "Named mini-boss", palette: "molten red-orange / charcoal",
      desc: "Temper masters every weapon; Slag just hoards them. A hulking figure draped in dozens of crudely fused blades, molten light bleeding through blackened armor, dragging an ugly cleaver. Craft replaced by quantity — grafting, not forging." },
    { id: "tithe", name: "Tithe", mirrors: "Magpie", role: "Named mini-boss", palette: "sickly crimson / ashen grey",
      desc: "Magpie salvages the discarded; Tithe drains the living. A witch-mechanic hung with stolen bone-charms and crimson siphons, tubes pulling grey Current from withered victims. Resourcefulness twisted into parasitism." },
    { id: "gall", name: "Gall", mirrors: "Cinder", role: "Named mini-boss (proposed)", palette: "bilious green / black", proposed: true,
      desc: "Cinder feeds the crew; Gall feeds them rot. A banquet-master who turns nourishment into poison — brewing plagues where Cinder brews buffs, a feast that hollows you from the inside." },
    { id: "wake", name: "Wake", mirrors: "Vesper", role: "Named mini-boss (proposed)", palette: "deep indigo / void", proposed: true,
      desc: "Vesper guards unseen; Wake erases without a trace. A hollow that dissolves into shadow and unmakes people mid-sentence — the quiet protector inverted into a stalker you never wake from." },
    { id: "fault", name: "Fault", mirrors: "Citrine", role: "Named mini-boss (proposed)", palette: "sickly yellow / red", proposed: true,
      desc: "Citrine powers the crew; Fault overloads the district. A live-wire trapmaster who wires whole streets into a killing grid — current turned from a tool into an execution." },
    { id: "lock", name: "Lock", mirrors: "Latch", role: "Named mini-boss (proposed)", palette: "corrupted electric-blue / white", proposed: true,
      desc: "Latch opens doors between worlds; Lock seals them shut. A dimensional jailer who folds people into pocket-cells and severs every link that could reach them — connection turned to solitary." },
    { id: "rapture", name: "Rapture", mirrors: "Wren", role: "Named mini-boss (proposed)", palette: "blinding magenta / white", proposed: true,
      desc: "Wren holds immense power barely in check; Rapture lets all of it go. An ecstatic surge of raw arcane force with no restraint and no mercy — the power without the person to hold it back." },
    { id: "ruin", name: "Ruin", mirrors: "Anvil", role: "Named mini-boss (proposed)", palette: "gunmetal / iron-red", proposed: true,
      desc: "Anvil is the immovable shield; Ruin is the unstoppable wreck. A siege-engine of a man built only to flatten — protection inverted into pure demolition." }
  ],
  concord: [
    { id: "enforcer", name: "Concord Enforcer", role: "Fodder", palette: "gunmetal + red",
      desc: "A faceless visored riot trooper with one glowing red slit, sleek dark industrial-arcane armor, a current-powered rifle. Disciplined and anonymous — the boot of the surveillance state." },
    { id: "hunter", name: "Concord Hunter", role: "Elite", palette: "black / steel + searing red",
      desc: "An elite tracker built to run down seam-crossers: heavy black armor, red optics, rune-dampening tech, a current-charged glaive. Cold and predatory." },
    { id: "warrant", name: "The Warrant", role: "Elite · commander (proposed)", palette: "steel + cold red", proposed: true,
      desc: "The inquisitor who signs the hunts — a Concord commander who never dirties their own hands, only authorizes. A face for the empire's cruelty." }
  ],
  hollowmen: [
    { id: "cultist", name: "Hollowman Cultist", role: "Fodder", palette: "crimson + black",
      desc: "A fanatic in torn crimson-and-black robes, cracked bone mask, dull-red rune-scars, a curved ritual blade. Gaunt and zealous — the rank and file of the apocalypse." },
    { id: "chant", name: "The Chant", role: "Elite (proposed)", palette: "crimson + ash", proposed: true,
      desc: "Where cultists cut, the Chant unmakes — a robed priest droning the severance-hymn, thinning the very air around them. The order's voice, and its worst idea." },
    { id: "scarred", name: "Rune-Scarred", role: "Elite (proposed)", palette: "raw red + bone", proposed: true,
      desc: "A convert so covered in glowing rune-scars the flesh barely holds — a walking wound where the severance is already half-finished. What true belief costs." }
  ],
  thinned: [
    { id: "husk", name: "Thinned Husk", role: "Fodder", palette: "grey + dying ember",
      desc: "A hollowed-out human drained of color and life — ashen cracked skin, empty flickering eyes, a listless shamble. The human cost of the drift made into an enemy. Tragic more than evil." },
    { id: "beast", name: "Drained Beast", role: "Creature", palette: "grey + bone-white",
      desc: "A once-living predator hollowed by the thinning — emaciated grey hide over bone, hollow white eyes, trailing dead Current. Gaunt, unnatural, and still hunting." }
  ],
  "weave-horrors": [
    { id: "horror", name: "Weave-horror", role: "Monster", palette: "toxic green + violet",
      desc: "A body that folds wrong through space — too many angles, limbs of crystallized arcane light, no face, only drifting runic glyphs. Not a soldier; a wound in geometry." },
    { id: "maw", name: "The Maw", role: "Environmental mini-boss", palette: "void + green / violet",
      desc: "A massive tear in reality shaped like a circling mouth of fractured light and shadow, ringed by broken runes and grasping tendrils, swallowing the light around it." }
  ],
  scrye: [
    { id: "drone", name: "Scrye Drone", role: "World-flavor", palette: "current-blue + violet",
      desc: "A single hovering Concord eye — one glowing blue lens ringed by orbiting glyphs, sweeping scan-beams across the streets. Alone it's nothing; the swarm is everywhere." },
    { id: "scryemother", name: "Scryemother", role: "??? (proposed)", palette: "deep blue + violet", proposed: true,
      desc: "The rumored hub the swarm reports to, where every feed converges. Blind it and you blind the Concord — if it exists at all." }
  ]
};

VEILRUN.crew = [
  {
    id: "saffron", name: "Cinder", player: "Zack", alias: "Soviet", accent: "var(--c-saffron)",
    gamingName: "SovietEspionage", actualName: "Zack", nickname: "Soviet",
    img: "assets/img/saffron.png", pick: "Cinder",
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
    img: "assets/img/temper.png",
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
    img: "assets/img/vesper.png",
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
    img: "assets/img/citrine.png",
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
    img: "assets/img/latch.png",
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
    img: "assets/img/wren.png",
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
    id: "anvil", name: "Anvil", player: "Mike", alias: "Maddog", accent: "var(--c-anvil)",
    gamingName: "Maddog", actualName: "Mike", nickname: null, // Jordan flagged unsure (7/20) — ask Mike
    img: "assets/img/anvil.png",
    role: "Juggernaut", tagline: "The immovable wall — the loud option, and the sleeper.",
    lore: "Nearly indestructible. He scales his own size — small enough to blend into a crowd, then erupts into a towering wall of armor.",
    codenames: ["Anvil","Rampart","Granite","Boulder","Atlas","Breaker"],
    kit: { passive: { name:"Unbreakable", text:"Heavy damage reduction, can't be staggered." },
      actives: [ {name:"Mass", text:"Scale his size — blend into a crowd, then grow toward a juggernaut (bigger = harder-hitting but slower and louder)."},
                 {name:"Rampage", text:"Charge enemies through walls and cover."},
                 {name:"Aggro", text:"Force enemies to focus him while the crew repositions."} ],
      ult: null },
    synergies: [ {name:"Bulwark (universal aura)", text:"Allies in Anvil's shadow can't be staggered and take reduced splash — he's cover that walks."},
                 {name:"Doorbreaker", text:"Augmented by Latch, he carries enemies THROUGH the seam into the Weave."} ]
  },
  {
    id: "magpie", name: "Magpie", player: "Ali", alias: "inaudiblerooster", aliases: ["inaudibleRooster"], accent: "var(--c-magpie)",
    gamingName: "inaudibleRooster", actualName: "Ali", nickname: "rooster",
    img: "assets/img/magpie.png",
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
    id: "rook", name: "Rook", player: "Nas", alias: "Darz", aliases: ["OfficerBucky", "Naz"], accent: "var(--c-rook)",
    gamingName: "OfficerBucky", actualName: "Nas", nickname: "Darz", // Jordan wrote "Naz" (7/20) — double-checking spelling vs "Nas" already on file
    img: "assets/img/rook.png",
    role: "Psionic · Vesper's Brother", tagline: "Telepathy, teleport, telekinesis — the crew's sixth sense.",
    lore: "In a wheelchair, with overwhelming mental power. A sixth sense for his brother on covert missions. The seen world has no words for what he does.",
    codenames: ["Rook","Augur","Pale","Oracle","Echo","Sage"],
    kit: { passive: { name:"Sixth Sense", text:"Shares enemy positions with the crew, strongest when linked to his brother." },
      actives: [ {name:"Telekinesis", text:"Throw objects and enemies, manipulate the environment."},
                 {name:"Blink", text:"Teleport himself or an ally a short range."} ],
      ult: null },
    synergies: [ {name:"Marked Prey (aura: Blood Echo)", text:"With Vesper (brothers): marks a target through walls and blinks his brother into a guaranteed silent kill."},
                 {name:"Second Sight", text:"With Magpie: Drift-reading + Sixth Sense — the crew sees the next 10 seconds."} ]
  }
];

/* Structured synergy data — powers the mobile explorer + combo builder. */
VEILRUN.synergy = {
  pairs: [
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
  { id: "pair-levels", name: "2D Pair Levels", status: "idea", text: "Levels only clearable with a specific pair's combo. Purest synergy test.", chars: "Pairs" },
  { id: "tactics-rpg", name: "Tactics RPG", status: "idea", text: "Turn-based grid squad tactics; positioning = the proximity-bond system.", chars: "Squad" },
  { id: "choose-adventure", name: "Choose-Your-Adventure", status: "idea", text: "A branching mission; each reader plays their character. Tests tone + the Severant.", chars: "All" },
  { id: "underweft-dive", name: "Underweft Dive (roguelite)", status: "idea", text: "Short runs into a rearranging Underweft; combos are the build system.", chars: "2 per run" },
  { id: "reunion-royale", name: "Reunion Royale", status: "idea", text: "Battle-royale twist — the crew scattered on a Sundering map must find each other and converge.", chars: "8" },
  { id: "severant-duel", name: "Severant Boss Duel", status: "idea", text: "One plays the Severant; the others must chain a Convergence to win.", chars: "1 vs many" },
  { id: "anthology", name: "Anthology (all of it)", status: "idea", text: "One world; each character headlines the genre that fits them.", chars: "All" },
  { id: "companion-games", name: "Companion Games (origin stories)", status: "idea", text: "Each character gets their own smaller standalone game telling their backstory, all linking into the main Veilrun game. Related to Anthology (genre-per-character in one game) but distinct — this is separate titles, backstory-focused. Pitched by BipolarCrayons.", chars: "All (one per character)" },
  { id: "seam-command", name: "Seam Command (RTS)", status: "idea", text: "Command & Conquer view; field all nine as hero units across both layers.", chars: "All 9 at once" },
  { id: "party-hub", name: "Party / Hub structure", status: "direction", text: "One game: Story + a pile of character party games + a training hangout.", chars: "All" }
];

VEILRUN.cover = "assets/img/cover.png";

VEILRUN.updates = [
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
