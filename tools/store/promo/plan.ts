// Picks the real puzzles the promo plays, and works out their moves with the game's own engines.
//   cd app && npx tsx ../tools/store/promo/plan.ts   → tools/store/promo/plan.json
import * as fs from 'fs';
import * as path from 'path';
import { BridgesFamily, edgesOf, type BridgesPuzzle } from '../../../app/src/core/families/bridges';

const PACK = require('../../../app/src/content/generated/pack.json');
const lit = (save: string) => new Set(Object.keys(require(path.join(__dirname, '..', save)).state.solved));
const MOCK = lit('saveMock.json'), ADV = lit('save800.json');
const rooms: { id: string; lanterns: { id: string; family: string; tier: number }[] }[] = PACK.world.districts.flatMap((d: any) => d.buildings.flatMap((b: any) => b.rooms));

// The Carillon of the Tour du Carillon not yet played in the mock-up save (a first success).
const tower = PACK.world.districts.find((d: any) => d.id === 'horlo').buildings[1].rooms[0];
const ck = tower.lanterns.findIndex((l: any) => l.family === 'CR' && !MOCK.has(l.id));
const cr = PACK.puzzles[tower.lanterns[ck].id].p;
const bells = (cr.reverse ? cr.melody.slice().reverse() : cr.melody) as number[];

// A Passerelles puzzle of the advanced save, small enough to be built in a few seconds.
const fam = new BridgesFamily();
let best: { room: string; n: number; taps: number[] } | null = null;
for (const r of rooms) r.lanterns.forEach((l, i) => {
  if (l.family !== 'PA' || !ADV.has(l.id) || l.tier < 1) return;
  const p = fam.parse(PACK.puzzles[l.id].p) as BridgesPuzzle;
  const sol = fam.solve(p, 1).solutions[0] as number[];
  const taps: number[] = [];
  edgesOf(p).forEach((e, k) => { for (let c = 0; c < (sol[k] ?? 0); c++) taps.push(e.a, e.b); });
  if (taps.length >= 14 && (!best || taps.length < best.taps.length)) best = { room: r.id, n: i + 1, taps };
});

const plan = { carillon: { room: tower.id, n: ck + 1, bells }, bridges: best };
fs.writeFileSync(path.join(__dirname, 'plan.json'), JSON.stringify(plan, null, 1));
console.log(JSON.stringify(plan).slice(0, 400));
