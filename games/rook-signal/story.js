/* VEILRUN — Rook Signal (Choose-Your-Adventure, Chapter 1)
 * SINGLE SOURCE OF TRUTH for the story graph + flag logic.
 * Loaded by index.html (browser) and required by validate.js (node).
 *
 * Design frame (see Planning/VEILRUN — GRD Choose-Your-Adventure Ch.1 (Rook).md):
 *  - Rook is remote (psionic). You guide whoever you brought through a THINNING pocket.
 *  - Flags: companions[], reach (5), clock (0..10), intel, pathRisk, thinned, covered, overreached.
 *  - Branching is carried by WHO you bring (companion-gated beats), not a sprawling tree.
 *  - Endings differ by HOW you win / WHAT mistake lost it. The Thinning is the cost mechanic.
 *
 * Node shape:
 *   { id, beat, text(f)->string, choices: [ { label(f)->str|str, to, when?(f)->bool, effect?(f) } ] }
 *   terminal endings: { id, ending:true, tier, base, text(f) }
 *   the single computed jump lives in resolve(f) -> endingId.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ROOK_SIGNAL_STORY = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---- roster available as companions this chapter ----
  var COMPANIONS = [
    { id: "vesper", name: "Vesper", accent: "var(--c-vesper)", blurb: "His brother. Slips a patrol without a sound." },
    { id: "magpie", name: "Magpie", accent: "var(--c-magpie)", blurb: "Hexwright. Reads a Weave-ward instead of forcing it." },
    { id: "anvil",  name: "Anvil",  accent: "var(--c-anvil)",  blurb: "Juggernaut. Clears a collapse fast — and loud." },
    { id: "latch",  name: "Latch",  accent: "var(--c-latch)",  blurb: "Changes how you get in. Calls the crossing." },
    { id: "babel",  name: "Babel",  accent: "var(--c-babel)",  blurb: "Reads Concord-tech. Something down here is theirs." }
  ];

  // ---- flag helpers ----
  function has(f, id) { return f.companions.indexOf(id) !== -1; }
  function nonLatch(f) { return f.companions.filter(function (c) { return c !== "latch"; }); }
  function nameList(f) {
    var n = f.companions.map(function (id) {
      var c = COMPANIONS.filter(function (x) { return x.id === id; })[0];
      return c ? c.name : id;
    });
    if (n.length === 0) return "no one";
    if (n.length === 1) return n[0];
    return n[0] + " and " + n[1];
  }
  var CLOCK_MAX = 8; // the pocket is gone when the Thinning clock tops out

  function spend(f, key, n) { // clamp reach at 0, flag overreach if it would go under
    if (key === "reach") {
      if (f.reach - n < 0) { f.reach = 0; f.overreached = true; }
      else f.reach -= n;
    } else if (key === "clock") {
      f.clock = Math.min(CLOCK_MAX, f.clock + n);
    }
  }

  function newFlags(companions) {
    return {
      companions: companions.slice(),
      reach: 5, clock: 0,
      intel: null, pathRisk: "med",
      thinned: false, covered: false, overreached: false
    };
  }

  // ---- NODES ----
  var NODES = {

    // BEAT 1 tail + BEAT 2 setup. Companion pick happens on the select screen; we arrive here.
    open: {
      beat: 1,
      text: function (f) {
        var who = f.companions.length ? nameList(f) + " already inside, small against the dark" : "no one inside — just your reach and her voice";
        return "You close your eyes on the safe side of the Seam and push your mind through it.\n\n"
          + "The pocket comes up wrong. A slice of the Underweft gone grey at the edges — color bleeding out of the brick, sound going flat, the Weave draining somewhere you can't yet see. Wren is a bright thread in the middle of it, and the thread is fraying.\n\n"
          + "You feel " + who + ". You have five measures of Reach before your grip on this place slips. Sensing costs nothing. Acting at range costs.\n\n"
          + "Read the room before you touch anything.";
      },
      choices: [
        { label: "Feel for Wren herself — how much time she really has", to: "c_condition", effect: function (f) { f.intel = "condition"; } },
        { label: "Map the ways out before the walls close them", to: "c_exits", effect: function (f) { f.intel = "exits"; } },
        { label: "Trace what's draining the pocket", to: "c_source", effect: function (f) { f.intel = "source"; } }
      ]
    },

    c_condition: {
      beat: 2,
      text: function (f) {
        return "You find her heartbeat first — fast, steady, scared but not panicking. Good. She's pinned but whole, tucked in the lee of a fallen archway where the thinning hasn't reached yet.\n\n"
          + "\"Rook.\" Not a question. She felt you arrive. \"It's getting quiet in here. Like the room's forgetting the words for itself.\"\n\n"
          + "You know exactly how long she has now. Not long. But you know.";
      },
      choices: [ { label: "Reach for her, then", to: "threshold" } ]
    },
    c_exits: {
      beat: 2,
      text: function (f) {
        return "You run your attention along the walls. Three ways this pocket meets the rest of the Underweft: a stairwell already going grey and untrustworthy, a service seam behind the archway, and a live rune-crossing that still hums — the one clean door.\n\n"
          + "You mark the clean one. Whatever else happens, you know where you're taking her.";
      },
      choices: [ { label: "Reach in", to: "threshold" } ]
    },
    c_source: {
      beat: 2,
      text: function (f) {
        var extra = has(f, "babel")
          ? "\n\nThe shape of it snags on something Babel taught you to notice — that's not natural drift. That's a made thing, drinking the place dry. Concord-made."
          : "\n\nIt isn't natural drift. Something is *drinking* this place — a made thing, siphoning the Weave out on purpose. You don't have the language to read it. Not yet.";
        return "You follow the drain to its root. There's a cold knot at the pocket's heart where the color is vanishing fastest, pulling everything toward it like a slow drain in a tub." + extra;
      },
      choices: [ { label: "Get to Wren before it finishes", to: "threshold" } ]
    },

    // BEAT 3 — The Threshold. Indexed only by whether Latch is in the party.
    threshold: {
      beat: 3,
      text: function (f) {
        if (has(f, "latch")) {
          return "Latch sets his hands on the air and finds the crossing you scouted. \"I can flip us straight onto her,\" he says, \"but you have to feed me the room clean. If I go in blind I put us down sideways.\"\n\n"
            + "The pocket won't hold a careful approach forever. But a rushed flip lands you wrong.";
        }
        return "No one here can bend the crossing. You go in the slow way, on foot through a place that's actively coming apart. The only question is how much you rush it.";
      },
      choices: [
        // With Latch
        { label: "Call the flip now — trust your read", when: function (f) { return has(f, "latch"); }, to: "obstacle",
          effect: function (f) {
            // good read (you scouted exits) lands clean; otherwise you land disoriented and lose time
            if (f.intel === "exits") { f.pathRisk = "low"; }
            else { spend(f, "clock", 2); f.pathRisk = "med"; }
          } },
        { label: "Have Latch line it up slow and sure", when: function (f) { return has(f, "latch"); }, to: "obstacle",
          effect: function (f) { spend(f, "clock", 3); f.pathRisk = "low"; } },
        // Without Latch
        { label: "Take the long crossing — careful footing", when: function (f) { return !has(f, "latch"); }, to: "obstacle",
          effect: function (f) { spend(f, "clock", 3); f.pathRisk = "low"; } },
        { label: "Force a crossing yourself — shove them through", when: function (f) { return !has(f, "latch"); }, to: "obstacle",
          effect: function (f) { spend(f, "reach", 1); f.pathRisk = "med"; } }
      ]
    },

    // BEAT 4 — The Obstacle. A caved passage between you and Wren. Options = who you brought.
    obstacle: {
      beat: 4,
      text: function (f) {
        var lead = "The way to Wren is blocked — a run of passage where the ceiling has half-come-down and the thinning is worst. ";
        if (nonLatch(f).length === 0) {
          return lead + "You brought no hands for this. It's you and her voice and whatever you can move from the far side of the Seam.";
        }
        return lead + "You've got people on-site. Pick how this gets solved.";
      },
      choices: [
        { label: "Vesper — thread the dead-air gap without touching the debris", when: function (f) { return has(f, "vesper"); }, to: "cost",
          effect: function (f) { spend(f, "reach", 1); f.pathRisk = "low"; } },
        { label: "Magpie — read the ward holding the rubble and unpick it", when: function (f) { return has(f, "magpie"); }, to: "cost",
          effect: function (f) { spend(f, "reach", 1); f.pathRisk = (f.intel === "source") ? "low" : "med"; } },
        { label: "Anvil — put a shoulder through it, fast and loud", when: function (f) { return has(f, "anvil"); }, to: "cost",
          effect: function (f) { spend(f, "reach", 1); f.pathRisk = "high"; } },
        { label: "Babel — the siphon's console is here; read it, choke the drain", when: function (f) { return has(f, "babel"); }, to: "cost",
          effect: function (f) { spend(f, "reach", 2); f.pathRisk = "low"; f.siphonKnown = true; } },
        { label: "Do it yourself — lift the fall with your mind, piece by piece", when: function (f) { return nonLatch(f).length === 0; }, to: "cost",
          // solo is punishing, but if you truly know her state you can guide it precisely instead of blindly
          effect: function (f) { spend(f, "reach", 2); f.pathRisk = (f.intel === "condition") ? "med" : "high"; } }
      ]
    },

    // BEAT 5 — The Cost Moment. The whole game's spine: spend power, or spend time.
    cost: {
      beat: 5,
      text: function (f) {
        return "You're close now. She's just past the last stretch, and the last stretch is the worst of it — the floor between you thinning so fast you can watch a puddle of colour vanish.\n\n"
          + "You can wrench it open. Tear a shortcut straight to her with everything you've got. It'll work. It'll also finish this pocket for good — the Weave remembers what you take, and this place would never come back.\n\n"
          + "Or you go slow and gentle and let the clock run, and pray she's still got the time.";
      },
      choices: [
        { label: "Force the shortcut — get her NOW, whatever it costs the place", to: "complication",
          effect: function (f) { spend(f, "reach", 2); f.thinned = true; } },
        { label: "Slow and gentle — spend time, not the pocket", to: "complication",
          effect: function (f) { spend(f, "clock", 3); } }
      ]
    },

    // BEAT 6 — The Complication. Escalates no matter what; text hardens if you're running dry.
    complication: {
      beat: 6,
      text: function (f) {
        var dire = (f.reach <= 1 || f.clock >= 8);
        if (dire) {
          return "And of course it isn't clean. The archway sheltering Wren gives a low groan and starts to go — and you're nearly empty, your grip on this place trembling, the clock almost run out.\n\n"
            + "Whatever you do next, do it with what little you have left.";
        }
        return "The archway sheltering Wren gives a groan and shifts. Not down yet — but moving. You've got a breath to decide how to spend it.";
      },
      choices: [
        { label: "Hold steady — shield her, save your Reach", to: "exit",
          effect: function (f) { spend(f, "clock", 2); f.covered = true; } },
        { label: "Spend Reach to shore the arch and keep pace", to: "exit",
          effect: function (f) { spend(f, "reach", 1); } }
      ]
    },

    // BEAT 7 — The Exit. Final choice; leads into resolve().
    exit: {
      beat: 7,
      text: function (f) {
        var door = (f.intel === "exits")
          ? "You already know the clean door — the live crossing you marked on the way in."
          : "You don't have a mapped exit; you'll have to find the way out as you pull her.";
        var help = nonLatch(f).length
          ? " " + nameList(f) + " " + (f.companions.length > 1 ? "are" : "is") + " right there with her."
          : " It's just her, and your voice in her head.";
        return "Last move. Wren's within reach and the pocket is nearly gone." + help + "\n\n" + door;
      },
      choices: [
        { label: "Pull her out clean and fast", to: "resolve" },
        { label: "Put yourself between her and the collapse — take the hit", to: "resolve",
          effect: function (f) { f.covered = true; } }
      ]
    }
  };

  // ---- BEAT 8 — resolution ----
  // Order matters: catastrophic failures first, then success tiers by HOW it went.
  function resolve(f) {
    if (f.overreached) return "overreach";
    if (f.clock >= CLOCK_MAX) return "tooslow";
    var clean = (f.reach >= 2 && !f.thinned && f.pathRisk !== "high");
    if (f.companions.length === 0) {
      return clean ? "onlyVoice" : "costly";
    }
    if (f.pathRisk === "high" && !f.covered) return "companionHurt";
    if (f.thinned) return "costly";
    if (clean) return "clean";
    return "costly";
  }

  // ---- ENDINGS ----
  var ENDINGS = {
    clean: {
      tier: "The best outcome", base: 100, good: true,
      title: "Clean Extraction",
      text: function (f) {
        return "You bring Wren through the live crossing with Reach to spare, and the pocket holds behind you — grey at the edges, but alive. It'll heal.\n\n"
          + (f.companions.length ? nameList(f) + " " + (f.companions.length > 1 ? "come" : "comes") + " out with her, unhurt. " : "")
          + "Wren pulls the Seam-side air into her lungs like she's tasting it. \"You made that look easy,\" she says. It wasn't. But you didn't leave a scar on the world to do it, and that's the whole art.";
      }
    },
    costly: {
      tier: "You got her — it cost the place", base: 70, good: true,
      title: "Costly Extraction",
      text: function (f) {
        return "Wren comes out. That's what matters, and you hold onto that.\n\n"
          + "But the pocket doesn't. Behind you the colour finishes draining out of it, sound dying to nothing, and the Underweft closes over a stretch of itself that won't come back. The Weave remembers what you took to save her.\n\n"
          + "\"We had to,\" Wren says, watching it go grey. Neither of you quite believes there wasn't another way. That's the price, and you paid it in full.";
      }
    },
    companionHurt: {
      tier: "You got her — someone paid for it", base: 60, good: true,
      title: "A Hand in the Dark",
      text: function (f) {
        var who = nonLatch(f)[0] ? (COMPANIONS.filter(function (c) { return c.id === nonLatch(f)[0]; })[0] || {}).name : "your partner";
        who = who || "your partner";
        return "It was loud and it was fast and it worked — Wren's out. But the collapse caught " + who + " on the way, and you felt it happen a half-second before you could move to stop it.\n\n"
          + who + " will mend. But you'll carry the shape of that half-second, and so will they. Some jobs you win and still owe something afterward.\n\n"
          + "Wren won't let go of your sleeve. \"Next time,\" she says quietly, \"we go quieter.\"";
      }
    },
    tooslow: {
      tier: "Failure — the clock ran out", base: 20, good: false,
      title: "Too Slow",
      text: function (f) {
        return "You were careful. You were right to be careful. You were just too careful, and the pocket didn't wait.\n\n"
          + "The bright thread that was Wren goes thin between one breath and the next — not gone, you tell yourself, not gone, just too far into the grey for your reach to follow. The crossing closes. Your mind snaps back across the Seam and you're staring at a wall.\n\n"
          + "Patience is a weapon. It's also, sometimes, the thing that kills you.";
      }
    },
    overreach: {
      tier: "Failure — you emptied yourself", base: 10, good: false,
      title: "Overreach",
      text: function (f) {
        return "You reach for one more thing you don't have. The last measure of you goes out like a held breath — and then there's nothing to hold the crossing, nothing to hold *you*, and the pocket and Wren and the grey all rush away at once.\n\n"
          + "You come to on the safe side with a nosebleed and a headful of static, hours gone. You don't remember letting go. That's the danger of a keystone with no keystone of his own — spend past empty and the world spends you back.";
      }
    },
    onlyVoice: {
      tier: "The hardest clean win", base: 90, good: true,
      title: "The Only Voice",
      text: function (f) {
        return "No hands. No Latch to fold the distance. Just you, across the Seam, and a scared kid in a room that's forgetting itself — and your voice, steady, telling her exactly where to put each foot.\n\n"
          + "\"Left. Now down. Trust it — I've got the floor.\" And you do have the floor; you're holding it with your mind from a world away. She walks out of a collapsing pocket on nothing but your word and comes through the crossing shaking and whole.\n\n"
          + "You didn't touch a thing you didn't have to. You just refused to be the reason she was alone in there. Sometimes that's the entire power.";
      }
    }
  };

  function scoreFor(f, endingId) {
    var e = ENDINGS[endingId];
    var base = e ? e.base : 0;
    return base + f.reach * 4; // reach 0..5 → up to +20
  }

  // Ordered list of endings for "discover all paths" tracking / validation.
  var ENDING_IDS = ["clean", "costly", "companionHurt", "tooslow", "overreach", "onlyVoice"];

  return {
    COMPANIONS: COMPANIONS,
    NODES: NODES,
    ENDINGS: ENDINGS,
    ENDING_IDS: ENDING_IDS,
    START: "open",
    CLOCK_MAX: CLOCK_MAX,
    REACH_MAX: 5,
    newFlags: newFlags,
    resolve: resolve,
    scoreFor: scoreFor,
    // expose helpers for the runtime UI
    has: has, nonLatch: nonLatch, nameList: nameList
  };
});
