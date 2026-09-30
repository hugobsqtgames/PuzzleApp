// Plays the 1000 lanterns in order with three kinds of players and watches the shards:
// how often a hint is out of reach, what is left at 100/250/500/750/1000 lanterns.
//   cd app && npx tsx ../tools/economy/simulate.ts
// ECON='{...}' tries other rules without touching the game.
import { STANDARD_ECONOMY as E } from '../../app/src/core/game/engine';
import { ACHIEVEMENTS, COSMETICS } from '../../app/src/game/rewards';
import { WELCOME_SHARDS } from '../../app/src/core/game/engine';
import { SeededRNG } from '../../app/src/core/puzzlekit/rng';
const pack = require('../../app/src/content/generated/pack.json');
const econ = JSON.parse(process.env.ECON || 'null') ?? E;
type L = { tier: number; room: string; building: string; district: string };
const order: L[] = [];
for (const d of pack.world.districts) for (const b of d.buildings) { for (const r of b.rooms) for (const l of r.lanterns) order.push({ tier: l.tier, room: r.id, building: b.id, district: d.id }); if (b.keystone) order.push({ tier: b.keystone.tier, room: '', building: b.id, district: d.id }); }
const achTotal = ACHIEVEMENTS.reduce((a: number, x: any) => a + (x.reward ?? 0), 0);
const prices = COSMETICS.map((c: any) => c.price).filter((x: number) => x > 0).sort((a: number, b: number) => a - b);
const PROFILES: Record<string, number[]> = { debutant: [0.08, 0.15, 0.3, 0.45, 0.6, 0.7], regulier: [0.03, 0.06, 0.15, 0.25, 0.35, 0.45], expert: [0, 0.02, 0.05, 0.1, 0.15, 0.2] };
for (const [name, need] of Object.entries(PROFILES)) {
  const rng = new SeededRNG(42n);
  let bal = WELCOME_SHARDS, stuck = 0, spentHints = 0, spentCos = 0, bought = 0, minBeforeHint = 1e9;
  const roomLeft = new Map<string, number>(), bLeft = new Map<string, number>(), dLeft = new Map<string, number>();
  for (const l of order) { if (l.room) roomLeft.set(l.room, (roomLeft.get(l.room) ?? 0) + 1); bLeft.set(l.building, (bLeft.get(l.building) ?? 0) + 1); dLeft.set(l.district, (dLeft.get(l.district) ?? 0) + 1); }
  const curve: number[] = [];
  order.forEach((l, i) => {
    let paid = 0;
    if (rng.below(1000) < need[l.tier] * 1000) {
      // Piste, then maybe Éclairage, then maybe Solution: bought one after the other.
      const levels = [econ.hintCosts[1]];
      if (rng.bool()) { levels.push(econ.hintCosts[2]); if (rng.below(10) < 3) levels.push(econ.hintCosts[3]); }
      for (const c of levels) { minBeforeHint = Math.min(minBeforeHint, bal); if (bal < c) { stuck++; break; } bal -= c; paid += c; spentHints += c; }
    }
    const base = econ.tierRewards[l.tier];
    bal += base + (paid ? 0 : Math.floor(base * econ.clairvoyancePercent / 100));
    if (l.room) { const n = roomLeft.get(l.room)! - 1; roomLeft.set(l.room, n); if (!n) bal += econ.roomBonus; }
    const nb = bLeft.get(l.building)! - 1; bLeft.set(l.building, nb); if (!nb) bal += econ.buildingBonus;
    const nd = dLeft.get(l.district)! - 1; dLeft.set(l.district, nd); if (!nd) bal += econ.districtBonus;
    bal += achTotal / order.length; // achievements, spread over the game
    if (i % 12 === 11) bal += econ.dailyReward + 5; // one evening challenge every dozen lanterns
    // Buys the next cosmetic when it leaves a comfortable margin.
    if (bought < prices.length && bal > prices[bought] + 80) { bal -= prices[bought]; spentCos += prices[bought]; bought++; }
    if ([99, 249, 499, 749, 999].includes(i)) curve.push(Math.round(bal));
  });
  console.log(`${name.padEnd(9)} bloqué faute d'éclats: ${String(stuck).padStart(3)} fois | indices payés: ${spentHints} | cosmétiques: ${bought}/${prices.length} (${spentCos}) | solde après 100/250/500/750/1000: ${curve.join(' / ')}`);
}
