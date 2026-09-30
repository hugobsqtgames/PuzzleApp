import { SeededRNG, SplitMix64, StableHash } from '../puzzlekit/rng';
import { CandidatePipeline } from '../puzzlekit/pipeline';
import { SwitchesFamily } from '../families/switches';

import { LocksFamily } from '../families/locks';

import { LampsFamily } from '../families/lamps';

const golden = (fingerprints: string[]) => fingerprints.map((f) => StableHash.fnv1a64(f).toString(16));

describe('Fidélité aux valeurs de référence (cœur d’origine)', () => {
  test('SplitMix64 et Xoshiro256** : valeurs de référence', () => {
    const sm = new SplitMix64(42n);
    expect([sm.next(), sm.next(), sm.next()]).toEqual([0xbdd732262feb6e95n, 0x28efe333b266f103n, 0x47526757130f9f52n]);
    const rng = new SeededRNG(42n);
    expect(Array.from({ length: 5 }, () => rng.next())).toEqual([0x15780b2e0c2ec716n, 0x6104d9866d113a7en, 0xae17533239e499a1n, 0xecb8ad4703b360a1n, 0xfde6dc7fe2ec5e64n]);
  });

  test('FNV-1a et dérivation de graines', () => {
    expect(StableHash.fnv1a64('')).toBe(0xcbf29ce484222325n);
    expect(StableHash.fnv1a64('lampion')).toBe(0xbe7cabed2d9403cfn);
  });

  test('Interrupteurs : mêmes puzzles que le cœur d’origine', () => {
    const r = new CandidatePipeline(new SwitchesFamily()).generate(3, { rows: 4, columns: 4, presses: [3, 8], minimumMoves: 2 }, 2026n);
    expect(golden(r.accepted.map((a) => a.fingerprint))).toEqual(['314983cb036cb244', '25c760094cc17d02', 'a2111db38fcb1055']);
  });
});
test('Cadenas : mêmes puzzles que le cœur d’origine', () => {
  const r = new CandidatePipeline(new LocksFamily()).generate(3, {}, 2026n);
  expect(golden(r.accepted.map((a) => a.fingerprint))).toEqual(['4dc9e4d2c8a85510', 'a339e6462e6759f5', 'd9dca26b32d6ecfc']);
});
test('Lampes : mêmes puzzles que le cœur d’origine', () => {
  const r = new CandidatePipeline(new LampsFamily()).generate(3, { rows: 6, columns: 6 }, 2026n);
  expect(golden(r.accepted.map((a) => a.fingerprint))).toEqual(['f1c4b6166823127d', '560a9a2097f3b2ef', '8f8782f587a900ac']);
});
