// The shipped content: every puzzle can be finished with hints, and the world never
// serves the same kind of puzzle over and over.
import { FAMILIES } from '../../game/catalog';
import { HintLevel } from '../puzzlekit/types';
import { play, progressOf, startSession } from '../../game/session';

const pack = require('../../content/generated/pack.json');

const all: [string, { f: keyof typeof FAMILIES; t: number; p: unknown }][] = [
  ...Object.entries<any>(pack.puzzles),
  ...Object.entries<any>(pack.daily.puzzles).map(([k, v]) => [`daily.${k}`, v] as [string, any]),
];

test('every shipped puzzle parses, and the Solution hint always finishes it', () => {
  const stuck: string[] = [];
  for (const [id, q] of all) {
    const e: any = FAMILIES[q.f].engine;
    const p = e.parse(q.p);
    if (!p) { stuck.push(`${id} (parse)`); continue; }
    let s = e.initialState(p);
    for (let i = 0; i < 40 && e.validate(p, s).kind !== 'correct'; i++) {
      const h = e.hint(p, s, HintLevel.Solution);
      if (!h) break;
      if (h.resultingState !== undefined) s = h.resultingState;
    }
    if (e.validate(p, s).kind !== 'correct') stuck.push(id);
  }
  expect(stuck).toEqual([]);
});

test('families are spread out: never twice in a row, at most 4 in any 20 lanterns', () => {
  const order: string[] = [];
  for (const d of pack.world.districts) for (const b of d.buildings) for (const r of b.rooms) for (const l of r.lanterns) order.push(l.family);
  for (let i = 1; i < order.length; i++) expect(order[i] === order[i - 1] ? `${i}: ${order[i]} twice` : 'ok').toBe('ok');
  let worst = 0;
  for (let i = 0; i + 20 <= order.length; i++) {
    const n = new Map<string, number>();
    for (const f of order.slice(i, i + 20)) n.set(f, (n.get(f) ?? 0) + 1);
    worst = Math.max(worst, ...n.values());
  }
  expect(worst).toBeLessThanOrEqual(4);
});

test('the Phare already shows 8 kinds of puzzles, and every family is well represented', () => {
  const phare = pack.world.districts.find((d: any) => d.id === 'phare');
  const kinds = new Set(phare.buildings.flatMap((b: any) => b.rooms.flatMap((r: any) => r.lanterns.map((l: any) => l.family))));
  expect(kinds.size).toBeGreaterThanOrEqual(8);
  const count = new Map<string, number>();
  for (const d of pack.world.districts) for (const b of d.buildings) for (const r of b.rooms) for (const l of r.lanterns) count.set(l.family, (count.get(l.family) ?? 0) + 1);
  expect(Math.min(...count.values())).toBeGreaterThanOrEqual(30);
});

test('each variant appears in the world', () => {
  const seen = { reverse: 0, reflection: 0, veiled: 0, letters: 0, pattern: 0 };
  for (const [id, q] of all) {
    if (id.startsWith('daily.')) continue;
    const p = q.p as any;
    if (q.f === 'CR' && p.reverse) seen.reverse++;
    if (q.f === 'OM' && p.reflection) seen.reflection++;
    if (q.f === 'VI' && p.veiled) seen.veiled++;
    if (q.f === 'SU' && p.letters) seen.letters++;
    if (q.f === 'IN' && p.pattern !== 'cross') seen.pattern++;
  }
  for (const v of Object.values(seen)) expect(v).toBeGreaterThanOrEqual(10);
});

test('a board in progress comes back only on the very puzzle it was played on', () => {
  const a: any = { id: 'x', code: 'IN', tier: 0, data: { rows: 2, columns: 2, pattern: 'cross', initiallyLit: [false, false, false, true] } };
  const b = { ...a, data: { ...a.data, initiallyLit: [true, false, false, false] } };
  const s = play(startSession(a, 'lantern', new Date()), { lit: [true, true, true, true], moves: 1 });
  const saved = JSON.parse(JSON.stringify(progressOf(s)));
  expect(startSession(a, 'lantern', new Date(), saved).moves).toBe(1);
  // Same shape of board, other puzzle (content updated): the lantern starts fresh.
  expect(startSession(b, 'lantern', new Date(), saved).moves).toBe(0);
  // An old save without a fingerprint starts fresh too.
  expect(startSession(a, 'lantern', new Date(), { ...saved, fp: undefined }).moves).toBe(0);
});
