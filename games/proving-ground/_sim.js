/* ---------------------------------------------------------------------------
   Proving Ground — headless balance harness.
   Sim-first, adapted to real-time 3D: the renderer/feel is validated by
   playtest, but every deterministic number (wave schedule, damage math,
   cooldowns, score) is proved here, against the SAME source the game runs.
   Usage: node _sim.js
   --------------------------------------------------------------------------- */
const fs = require("fs"), path = require("path"), vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const m = html.match(/BALANCE:BEGIN[\s\S]*?-+ \*\/([\s\S]*?)\/\* BALANCE:END/);
if (!m) { console.error("could not find the BALANCE block in index.html"); process.exit(1); }
const sandbox = { module: { exports: {} }, Math: Math, console: console };
vm.createContext(sandbox);
new vm.Script(m[1], { filename: "index.html#BALANCE" }).runInContext(sandbox);
const BAL = sandbox.module.exports;
const C = BAL.C;

let fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
  else console.log("  ok    " + name + (detail ? "  — " + detail : ""));
}

console.log("\nVEILRUN · Proving Ground — balance harness\n" + "=".repeat(58));

/* ---------------------------- wave schedule ---------------------------- */
console.log("\n[wave schedule]");
let lastCount = -1, lastHp = -1, monoCount = true, monoHp = true, spdOk = true,
    intOk = true, concOk = true;
for (let n = 1; n <= 60; n++) {
  const s = BAL.waveSpec(n);
  if (s.count < lastCount) monoCount = false;
  if (s.hpMult < lastHp) monoHp = false;
  if (s.spdMult > 2.0001) spdOk = false;
  if (!(s.interval > 0.1)) intOk = false;
  if (s.concurrent > C.liveCap) concOk = false;
  lastCount = s.count; lastHp = s.hpMult;
}
ok("enemy count never decreases", monoCount);
ok("enemy HP never decreases", monoHp);
ok("speed multiplier capped at 2.0x", spdOk);
ok("spawn interval stays positive", intOk);
ok("concurrent enemies never exceed the live cap", concOk, "cap " + C.liveCap);
ok("count saturates rather than exploding", BAL.waveSpec(60).count <= 34, "wave 60 = " + BAL.waveSpec(60).count);
ok("enemy HP is capped — no bullet sponges", BAL.waveSpec(200).hpMult <= C.enemyHpCap + 1e-9,
   "caps at " + C.enemyHpCap + "x (" + Math.round(C.enemyHp * C.enemyHpCap) + " hp)");

/* ------------------------------- stalk --------------------------------- */
/* The whole point of the stalk is that the veil survives it. If stalkSpeed ever
   creeps above shroudBreakSpeed the mechanic silently stops working — you would
   crouch, move, and be seen, with nothing in the UI to explain why. */
console.log("\n[stalk]");
ok("stalk stays under the shroud break speed", C.stalkSpeed < C.shroudBreakSpeed,
   C.stalkSpeed + " < " + C.shroudBreakSpeed);
ok("stalk has real margin, not a rounding error",
   C.shroudBreakSpeed - C.stalkSpeed >= 0.05,
   "margin " + (C.shroudBreakSpeed - C.stalkSpeed).toFixed(2));
ok("stalking costs you the exit", C.moveSpeed / C.stalkSpeed >= 8,
   Math.round(C.moveSpeed / C.stalkSpeed) + "x slower than a run — power has a price");
ok("but it is still movement, not standing still", C.stalkSpeed > 0.2);
/* crossing the arena while veiled should be a real commitment, not a free reposition */
ok("crossing the arena stalked takes a meaningful chunk of a wave",
   (C.arena * 2) / C.stalkSpeed > 20,
   Math.round((C.arena * 2) / C.stalkSpeed) + "s to cross the full arena");

/* ---------------------------- milestones ------------------------------- */
console.log("\n[milestones]");
const mile = [];
for (let n = 1; n <= 20; n++) if (BAL.waveSpec(n).milestone) mile.push(n);
ok("milestones land every " + C.milestoneEvery + " waves", JSON.stringify(mile) === "[5,10,15,20]", mile.join(", "));
ok("modifiers cycle through all three", BAL.milestoneFor(5).key === "tear" && BAL.milestoneFor(10).key === "thin" &&
   BAL.milestoneFor(15).key === "hunter" && BAL.milestoneFor(20).key === "tear");
let noMileSpeedBreak = true;
for (let n = 5; n <= 60; n += 5) if (BAL.waveSpec(n).spdMult > 2.0001) noMileSpeedBreak = false;
ok("milestone speed bonus cannot break the cap", noMileSpeedBreak);

/* ------------------------------ combat --------------------------------- */
console.log("\n[combat math]");
const cd = BAL.chainDps();
ok("a full strike chain is under a second and a half", cd.time < 1.5, cd.time.toFixed(2) + "s for " + cd.dmg + " dmg (" + cd.dps.toFixed(0) + " dps)");
const h1 = BAL.hitsToKill(1);
ok("wave 1 husk dies in 3-5 hits", h1 >= 3 && h1 <= 5, h1 + " hits");
ok("wave 10 husk stays under 12 hits", BAL.hitsToKill(10) <= 12, BAL.hitsToKill(10) + " hits");
ok("wave 20 husk stays under 20 hits", BAL.hitsToKill(20) <= 20, BAL.hitsToKill(20) + " hits");

// Execute must be reachable mid-chain, at every wave, or the signature is dead weight.
let execReachable = true, worstHits = 0;
for (let n = 1; n <= 40; n++) {
  const hp = C.enemyHp * BAL.waveSpec(n).hpMult, need = hp * (1 - C.execThreshold);
  let d = 0, hits = 0;
  while (d < need && hits < 60) { d += C.strike[hits % 3].dmg; hits++; }
  worstHits = Math.max(worstHits, hits);
  if (hits > 8) execReachable = false;
}
ok("Execute is reachable within 8 hits at every wave to 40", execReachable, "worst case " + worstHits + " hits");
ok("Execute finisher out-damages a single strike", C.execDmg > C.strike[2].dmg, C.execDmg + " vs " + C.strike[2].dmg);
ok("Execute cooldown outlasts a full strike chain", C.execCd > cd.time, C.execCd + "s vs " + cd.time.toFixed(2) + "s");
ok("chain-kill refund cannot make Execute free", C.execKillCdRefund < C.execCd, C.execKillCdRefund + "s off " + C.execCd + "s");

/* ---------------------------- mobility --------------------------------- */
console.log("\n[mobility]");
const cross = (C.arena * 2) / C.moveSpeed;
const blinkCycle = C.stepCharges * C.stepRecharge;
ok("Veilstep is a commitment, not a faster walk", blinkCycle > cross,
   "full recharge " + blinkCycle.toFixed(1) + "s vs " + cross.toFixed(1) + "s to cross the arena on foot");
ok("one blink covers less than half the arena", C.stepDist < C.arena, C.stepDist + " of " + C.arena + " half-extent");
ok("blink i-frames are shorter than the enemy wind-up", C.stepIframe < C.enemyWind,
   C.stepIframe + "s vs " + C.enemyWind + "s telegraph");
ok("a husk cannot outrun Vesper, even thinned and at cap",
   C.enemySpeed * 2.0 * C.thinSpeedBonus < C.moveSpeed,
   (C.enemySpeed * 2.0 * C.thinSpeedBonus).toFixed(2) + " vs " + C.moveSpeed);

/* --------------------------- survivability ----------------------------- */
console.log("\n[survivability]");
const worstDps = C.enemyDmg / C.iframeOnHit;
const ttd = C.playerHp / worstDps;
ok("surviving a total swarm-out takes at least 5 seconds", ttd >= 5,
   ttd.toFixed(1) + "s at the i-frame-capped worst case of " + worstDps.toFixed(1) + " dps");
ok("i-frames outlast an enemy's active window", C.iframeOnHit > C.enemyActive);
ok("Execute heal cannot outpace incoming damage", C.execKillHeal < C.enemyDmg * 2, C.execKillHeal + " hp");
ok("the enemy telegraph is long enough to react to", C.enemyWind >= 0.4, C.enemyWind + "s");

/* ------------------------------ score ---------------------------------- */
console.log("\n[score]");
const base = { waves: 5, kills: 40, executes: 8, time: 120 };
const bump = k => { const s = Object.assign({}, base); s[k] += 1; return BAL.scoreFor(s) > BAL.scoreFor(base); };
ok("score rises with every input", ["waves", "kills", "executes", "time"].every(bump));
ok("score is never negative", BAL.scoreFor({ waves: 0, kills: 0, executes: 0, time: 0 }) === 0);
ok("waves dominate kills", BAL.scoreFor({ waves: 1, kills: 0, executes: 0, time: 0 }) >
   BAL.scoreFor({ waves: 0, kills: 9, executes: 0, time: 0 }), "1 wave = 100, 9 kills = 90");
ok("playing Vesper properly pays", BAL.scoreFor({ waves: 0, kills: 0, executes: 1, time: 0 }) >
   BAL.scoreFor({ waves: 0, kills: 1, executes: 0, time: 0 }), "execute 15 vs kill 10");

/* ------------------- husk SEARCH — Shroud's payoff (VR-119) ------------- */
console.log("\n[husk SEARCH — what losing you costs them]");
/* These are not decoration numbers. Shroud is the only one of Vesper's verbs
   with no button, no cost and — until this card — no visible effect, so the
   relationships that make it WORTH standing still are the thing to prove. */
ok("losing you is slower than seeing you", C.huskSearchSpeed < 1,
   "a husk that hunts as fast blind as sighted makes Shroud worthless — " +
   (C.enemySpeed * C.huskSearchSpeed).toFixed(2) + " vs " + C.enemySpeed.toFixed(2) + " u/s");
ok("but they still close on you, slowly", C.huskSearchSpeed > 0.15,
   "a search that barely moves is a room that has stopped playing with you");
ok("there IS a grace window before they give up", C.huskLoseT > 0,
   "at zero, a pillar clipping the line for two frames flips the whole room and back");
ok("and it is short enough to feel like stealth", C.huskLoseT < C.shroudDelay,
   "they must accept the loss faster than the veil takes, or Shroud reads as delayed — " +
   C.huskLoseT + "s vs shroudDelay " + C.shroudDelay + "s");
ok("a beat range, not a beat", C.huskBeatMin < C.huskBeatMax,
   C.huskBeatMin + "-" + C.huskBeatMax + "s, randomised so a crowd never scans in unison");
ok("the shortest beat outlasts the grace window", C.huskBeatMin > C.huskLoseT,
   "otherwise a husk can cycle a whole beat inside the time it takes to notice you are gone");
ok("they get at least one full cycle before patrolling", C.huskSearchGiveUp > C.huskBeatMax * 2,
   "give-up " + C.huskSearchGiveUp + "s against a worst-case walk+scan of " + (C.huskBeatMax * 2) + "s");
ok("staying hidden outlasts a search, so hiding can actually win",
   C.huskSearchGiveUp > C.shroudDelay * 4,
   "if they gave up slower than you can re-veil, Shroud would only ever delay the same fight");
/* The one that ties the mechanic to the fiction: Stalk exists so you can move
   while veiled. If a stalking Vesper were slower than a searching husk, the
   husks would close on you anyway and Stalk would be a worse way to stand still. */
/* The trade Stalk is FOR, stated as a number. Stalk (0.5) is deliberately
   SLOWER than a searching husk, so creeping away veiled does not simply beat
   the search — you have to pick a direction and commit, or hold still and let
   them drift past. If this ever inverted, Shroud plus Stalk would become a
   universal escape and the whole state below would stop mattering. */
ok("stalking does NOT outpace a search — the veil is not an exit",
   C.stalkSpeed < C.enemySpeed * C.huskSearchSpeed,
   "stalk " + C.stalkSpeed + " u/s against a search of " +
   (C.enemySpeed * C.huskSearchSpeed).toFixed(2) + " u/s");
ok("but breaking cover always does", C.moveSpeed > C.enemySpeed * C.huskSearchSpeed * 2,
   "running is the escape, and it costs you the veil — that is the decision");

/* --------------------- projected run (the difficulty curve) ------------- */
console.log("\n[projected run — estimated wave clear time]");
const swingTime = cd.time / 3;
let cumulative = 0, curveOk = true;
for (const n of [1, 3, 5, 10, 15, 20]) {
  const s = BAL.waveSpec(n);
  // pessimistic: no Executes, no Shroud kills, pure strike chain
  const fight = s.count * BAL.hitsToKill(n) * swingTime;
  const pacing = s.count * s.interval;
  const wave = Math.max(fight, pacing) + C.breather;
  cumulative += wave;
  if (wave > 180) curveOk = false;
  console.log("  wave " + String(n).padStart(2) + "  " + String(s.count).padStart(2) + " husks  " +
    Math.round(C.enemyHp * s.hpMult) + " hp  " + s.spdMult.toFixed(2) + "x spd  ~" +
    wave.toFixed(0) + "s  (run total ~" + Math.round(cumulative / 60) + "m)" +
    (s.milestone ? "  << " + s.milestone.name : ""));
}
ok("no wave becomes a slog, even played the slow way", curveOk, "all under 180s worst case");
ok("a good run reaches a couple of minutes", cumulative > 120, "~" + Math.round(cumulative / 60) + "m to wave 20");

console.log("\n" + "=".repeat(58));
console.log(fails === 0 ? "PASS — " + checks + " checks" : "FAIL — " + fails + " of " + checks + " checks");
process.exit(fails === 0 ? 0 : 1);
