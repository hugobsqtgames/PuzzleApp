/**
 * ContentForge (TypeScript) — generates the content pack of Vesper:
 * 1 000 lanterns placed in the world, each with a generated puzzle that is
 * validated (unique solution when required), rated, tiered and deduplicated,
 * plus the daily puzzles of the coming years.
 *
 *   cd app && npx tsx ../tools/forge/forge.ts            (everything, from scratch)
 *   cd app && npx tsx ../tools/forge/forge.ts --extend   (an update: keep what is published)
 *   cd app && npx tsx ../tools/forge/forge.ts --lock     (at release: record what is published)
 *
 * Output: app/src/content/generated/pack.json (deterministic: same code →
 * same file, byte for byte).
 */
import * as fs from 'fs';
import * as path from 'path';

import { CandidatePipeline } from '../../app/src/core/puzzlekit/pipeline';
import { SeededRNG, StableHash } from '../../app/src/core/puzzlekit/rng';
import { PuzzleFamily, Tier, TierThresholds } from '../../app/src/core/puzzlekit/types';
import { SwitchesFamily } from '../../app/src/core/families/switches';
import { LocksFamily } from '../../app/src/core/families/locks';
import { LampsFamily } from '../../app/src/core/families/lamps';
import { GearsFamily } from '../../app/src/core/families/gears';
import { SequencesFamily } from '../../app/src/core/families/sequences';
import { ScalesFamily } from '../../app/src/core/families/scales';
import { PatternsFamily } from '../../app/src/core/families/patterns';
import { LiarsFamily } from '../../app/src/core/families/liars';
import { ThreadsFamily } from '../../app/src/core/families/threads';
import { MirrorsFamily } from '../../app/src/core/families/mirrors';
import { InquiriesFamily } from '../../app/src/core/families/inquiries';
import { MarquetryFamily, SILHOUETTES } from '../../app/src/core/families/marquetry';
import { ChimesFamily } from '../../app/src/core/families/chimes';
import { StainedFamily } from '../../app/src/core/families/stained';
import { SpotFamily } from '../../app/src/core/families/spot';
import { ShelfFamily } from '../../app/src/core/families/shelf';
import { ShadowsFamily } from '../../app/src/core/families/shadows';
import { SealFamily, sealRuleFor } from '../../app/src/core/families/seal';
import { EmbroideryFamily } from '../../app/src/core/families/embroidery';
import { SignsFamily } from '../../app/src/core/families/signs';
import { RoofsFamily } from '../../app/src/core/families/roofs';
import { GlideFamily } from '../../app/src/core/families/glide';
import { SliderFamily } from '../../app/src/core/families/slider';
import { RibbonsFamily } from '../../app/src/core/families/ribbons';
import { FirefliesFamily } from '../../app/src/core/families/fireflies';
import { BridgesFamily } from '../../app/src/core/families/bridges';
import { DISTRICT_INFO } from '../../app/src/content/vesper';
import { DailyPlanner } from '../../app/src/core/game/daily';
import { addDays, dayKey, daysBetween } from '../../app/src/core/game/dayKey';
import { Fixed, PROTOTYPE_DAILY, PROTOTYPE_ROOM, TUTORIAL } from './fixed';

export type Code = 'IN' | 'CA' | 'LA' | 'EN' | 'SU' | 'BA' | 'MO' | 'ME' | 'FI' | 'MI' | 'EQ' | 'MA' | 'CR' | 'VI' | 'DI' | 'ET' | 'OM' | 'BR' | 'SG' | 'TO' | 'GL' | 'TQ' | 'RU' | 'LU' | 'PA' | 'SC';
const ALL: Code[] = ['SU', 'LA', 'CA', 'EN', 'MA', 'ME', 'EQ', 'BA', 'MO', 'FI', 'IN', 'MI', 'CR', 'VI', 'DI', 'ET', 'OM', 'BR', 'SG', 'TO', 'GL', 'TQ', 'RU', 'LU', 'PA'];
export const FORGE_VERSION = 5;

// ---------------------------------------------------------------- families

/** Per-family tier thresholds (GAME_DESIGN § 4.1), calibrated with calibrate.ts. */
const THRESHOLDS: Record<Code, TierThresholds> = {
  IN: TierThresholds.standard,
  LA: TierThresholds.standard,
  BA: TierThresholds.standard,
  CA: new TierThresholds([34, 40, 50, 70, 84]),
  EN: new TierThresholds([13, 31, 50, 70, 86]),
  SU: new TierThresholds([13, 30, 62, 80, 95]),
  MO: new TierThresholds([24, 38, 55, 72, 90]),
  ME: TierThresholds.standard,
  FI: TierThresholds.standard,
  MI: TierThresholds.standard,
  EQ: TierThresholds.standard,
  MA: new TierThresholds([16, 26, 38, 50, 65]),
  CR: new ChimesFamily().thresholds, VI: new StainedFamily().thresholds, DI: new SpotFamily().thresholds,
  ET: new ShelfFamily().thresholds, OM: new ShadowsFamily().thresholds, SC: new SealFamily().thresholds,
  BR: new EmbroideryFamily().thresholds, SG: new SignsFamily().thresholds, TO: new RoofsFamily().thresholds, GL: new GlideFamily().thresholds,
  TQ: new SliderFamily().thresholds, RU: new RibbonsFamily().thresholds, LU: new FirefliesFamily().thresholds, PA: new BridgesFamily().thresholds,
};
/** Highest tier a family can produce today. */
export const MAX_TIER: Record<Code, Tier> = { IN: 5, CA: 5, LA: 5, EN: 5, BA: 5, SU: 3, MO: 4, ME: 5, FI: 4, MI: 5, EQ: 5, MA: 3, CR: 5, VI: 5, DI: 5, ET: 5, OM: 5, BR: 4, SG: 5, TO: 5, GL: 5, TQ: 4, RU: 4, LU: 4, PA: 4, SC: 4 };

function withThresholds<F extends object>(family: F, t: TierThresholds): F {
  const f = Object.create(family) as F;
  Object.defineProperty(f, 'thresholds', { value: t });
  return f;
}

const FAMILIES: Record<Code, PuzzleFamily<any, any, any, any>> = {
  IN: withThresholds(new SwitchesFamily(), THRESHOLDS.IN),
  CA: withThresholds(new LocksFamily(), THRESHOLDS.CA),
  LA: withThresholds(new LampsFamily(), THRESHOLDS.LA),
  EN: withThresholds(new GearsFamily(), THRESHOLDS.EN),
  SU: withThresholds(new SequencesFamily(), THRESHOLDS.SU),
  BA: withThresholds(new ScalesFamily(), THRESHOLDS.BA),
  MO: withThresholds(new PatternsFamily(), THRESHOLDS.MO),
  ME: withThresholds(new LiarsFamily(), THRESHOLDS.ME),
  FI: withThresholds(new ThreadsFamily(), THRESHOLDS.FI),
  MI: withThresholds(new MirrorsFamily(), THRESHOLDS.MI),
  EQ: withThresholds(new InquiriesFamily(), THRESHOLDS.EQ),
  MA: withThresholds(new MarquetryFamily(), THRESHOLDS.MA),
  CR: new ChimesFamily(), VI: new StainedFamily(), DI: new SpotFamily(), ET: new ShelfFamily(), OM: new ShadowsFamily(), SC: new SealFamily(),
  BR: new EmbroideryFamily(), SG: new SignsFamily(), TO: new RoofsFamily(), GL: new GlideFamily(),
  TQ: new SliderFamily(), RU: new RibbonsFamily(), LU: new FirefliesFamily(), PA: new BridgesFamily(),
};
const SIL = Object.keys(SILHOUETTES);
const SMALL_SIL = ['lanterne', 'maison', 'phare', 'horloge'];
const LIE_EASY = ['liar', 'honest', 'atLeastOneLiar'];
const LIE_MID = ['liar', 'honest', 'atLeastOneLiar', 'exactlyLiars'];
const LIE_HARD = ['liar', 'honest', 'exactlyLiars', 'same', 'ifThen'];
const LIE_ALL = ['liar', 'honest', 'exactlyLiars', 'same', 'different', 'ifThen', 'allLiars'];
const EQ_DIRECT = ['has', 'at', 'hasNot', 'notAt'];
const EQ_ALL = ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'objectNotAt', 'either'];

/** Candidate parameters per family and tier, best first. */
const PARAMS: Record<Code, unknown[][]> = {
  IN: [
    [{ rows: 3, columns: 3, presses: [2, 3] }, { rows: 2, columns: 2, presses: [1, 2] }],
    [{ rows: 3, columns: 3, presses: [3, 5] }, { rows: 4, columns: 4, presses: [4, 7] }, { rows: 3, columns: 3, pattern: 'diagonal', presses: [2, 4] }],
    [{ rows: 3, columns: 3, presses: [4, 6] }, { rows: 4, columns: 4, pattern: 'diagonal', presses: [4, 7] }, { rows: 4, columns: 4, presses: [5, 8] }, { rows: 3, columns: 3, pattern: 'ring', presses: [2, 4] }, { rows: 5, columns: 5, presses: [6, 10] }],
    [{ rows: 5, columns: 5, presses: [6, 10] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [8, 12] }, { rows: 4, columns: 4, pattern: 'ring', presses: [4, 7] }],
    [{ rows: 5, columns: 5, presses: [9, 13] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [10, 14] }, { rows: 5, columns: 5, pattern: 'ring', presses: [6, 10] }],
    [{ rows: 6, columns: 6, presses: [10, 14] }, { rows: 5, columns: 5, pattern: 'ring', presses: [8, 12] }, { rows: 6, columns: 6, pattern: 'diagonal', presses: [10, 14] }],
  ],
  CA: [
    [{ length: 3, clueCount: [3, 5] }],
    [{ length: 3, clueCount: [3, 5] }, { length: 3, clueCount: [4, 7] }],
    [{ length: 3, clueCount: [4, 7] }, { length: 4, clueCount: [4, 6] }],
    [{ length: 4, clueCount: [4, 7] }],
    [{ length: 4, allowsRepeats: true, clueCount: [5, 9] }, { length: 5, clueCount: [5, 9] }],
    [{ length: 5, clueCount: [5, 9] }, { length: 4, allowsRepeats: true, clueCount: [6, 10] }],
  ],
  LA: [
    [{ rows: 5, columns: 5 }, { rows: 4, columns: 4 }],
    [{ rows: 5, columns: 5 }, { rows: 6, columns: 6 }],
    [{ rows: 6, columns: 6 }, { rows: 5, columns: 5 }, { rows: 7, columns: 7 }],
    [{ rows: 7, columns: 7 }, { rows: 6, columns: 6 }],
    [{ rows: 7, columns: 7 }, { rows: 8, columns: 8 }, { rows: 6, columns: 6 }],
    [{ rows: 8, columns: 8 }, { rows: 7, columns: 7 }],
  ],
  EN: [
    [{ rows: 4, columns: 4 }],
    [{ rows: 4, columns: 4 }, { rows: 5, columns: 5 }],
    [{ rows: 5, columns: 5 }],
    [{ rows: 6, columns: 6 }],
    [{ rows: 7, columns: 7 }, { rows: 6, columns: 6, branchiness: 0.9 }],
    [{ rows: 7, columns: 7 }],
  ],
  SU: [
    [{ complexity: 1 }], [{ complexity: 1 }, { complexity: 1, letters: true }], [{ complexity: 2 }, { complexity: 3 }, { complexity: 2, letters: true }], [{ complexity: 3 }, { complexity: 3, letters: true }], [], [],
  ],
  MO: [[{ active: 1 }], [{ active: 1 }, { active: 2 }], [{ active: 2 }, { active: 2, distribution: true }], [{ active: 2, distribution: true }, { active: 3, distribution: true }], [{ active: 3, distribution: true }], []],
  ME: [
    [{ characters: 3, kinds: LIE_EASY }], [{ characters: 4, kinds: LIE_MID }, { characters: 3, kinds: LIE_EASY }], [{ characters: 4, kinds: LIE_MID }, { characters: 5, kinds: LIE_HARD }],
    [{ characters: 5, kinds: LIE_HARD }], [{ characters: 6, kinds: LIE_ALL }], [{ characters: 6, kinds: LIE_ALL }],
  ],
  FI: [
    [{ rows: 4, columns: 4, wallPercent: 20 }], [{ rows: 5, columns: 5, wallPercent: 25 }], [{ rows: 6, columns: 6, wallPercent: 20 }],
    [{ rows: 7, columns: 7, wallPercent: 15 }], [{ rows: 8, columns: 8, wallPercent: 15 }, { rows: 7, columns: 7, wallPercent: 5 }], [{ rows: 8, columns: 8, wallPercent: 10 }],
  ],
  MI: [
    [{ rows: 5, columns: 5, mirrors: 1, targets: 2, obstaclePercent: 10 }], [{ rows: 5, columns: 5, mirrors: 2, targets: 3, obstaclePercent: 12 }],
    [{ rows: 6, columns: 6, mirrors: 3, targets: 4, obstaclePercent: 12 }], [{ rows: 6, columns: 6, mirrors: 4, targets: 5, obstaclePercent: 12 }, { rows: 7, columns: 7, mirrors: 4, targets: 5, obstaclePercent: 12 }],
    [{ rows: 7, columns: 7, mirrors: 4, targets: 5, obstaclePercent: 12 }, { rows: 7, columns: 7, mirrors: 5, targets: 6, obstaclePercent: 12 }], [{ rows: 7, columns: 7, mirrors: 5, targets: 6, obstaclePercent: 12 }, { rows: 8, columns: 8, mirrors: 5, targets: 6, obstaclePercent: 12 }],
  ],
  EQ: [[{ size: 3, kinds: EQ_DIRECT }], [{ size: 3, kinds: EQ_ALL }], [{ size: 4, kinds: EQ_ALL }], [{ size: 4, kinds: EQ_ALL }], [{ size: 5, kinds: EQ_ALL }], [{ size: 5, kinds: EQ_ALL }]],
  MA: [
    [{ silhouettes: SMALL_SIL, pieceSize: [3, 4] }], [{ silhouettes: SIL, pieceSize: [3, 4] }, { silhouettes: SIL, pieceSize: [4, 5] }],
    [{ silhouettes: SIL, pieceSize: [3, 5], flips: true }, { silhouettes: SIL, pieceSize: [3, 4] }], [{ silhouettes: SIL, pieceSize: [3, 5], flips: true }, { silhouettes: SIL, pieceSize: [4, 5], flips: true }], [], [],
  ],
  CR: [
    [{ bells: 3, length: [3, 3] }], [{ bells: 4, length: [4, 4] }, { bells: 3, length: [3, 3], reverse: true }], [{ bells: 4, length: [5, 6] }, { bells: 4, length: [4, 4], reverse: true }],
    [{ bells: 5, length: [6, 7] }, { bells: 4, length: [5, 6], reverse: true }], [{ bells: 5, length: [8, 8] }, { bells: 5, length: [6, 7], reverse: true }], [{ bells: 6, length: [9, 10] }, { bells: 5, length: [8, 8], reverse: true }],
  ],
  VI: [
    [{ rows: 2, cols: 3 }], [{ rows: 3, cols: 4 }, { rows: 3, cols: 3 }, { rows: 3, cols: 3, veiled: 1 }], [{ rows: 4, cols: 4 }, { rows: 3, cols: 4, veiled: 2 }],
    [{ rows: 4, cols: 4 }, { rows: 4, cols: 4, veiled: 3 }], [{ rows: 4, cols: 5 }, { rows: 4, cols: 5, veiled: 3 }], [{ rows: 5, cols: 5 }, { rows: 5, cols: 5, veiled: 4 }],
  ],
  DI: [
    [{ items: [8, 9], diffs: 3, kinds: ['missing', 'glyph'] }], [{ items: [10, 11], diffs: 4, kinds: ['missing', 'glyph', 'color'] }], [{ items: [12, 13], diffs: 5 }],
    [{ items: [12, 13], diffs: 5 }, { items: [13, 15], diffs: 6 }], [{ items: [13, 15], diffs: 6 }, { items: [15, 17], diffs: 7 }], [{ items: [15, 17], diffs: 7 }, { items: [17, 18], diffs: 8, kinds: ['color', 'turn', 'size', 'glyph'] }],
  ],
  ET: [[{ n: 3 }, { n: 4 }], [{ n: 4 }, { n: 5 }], [{ n: 5 }, { n: 6 }], [{ n: 6 }, { n: 5 }], [{ n: 7 }, { n: 6 }], [{ n: 7 }]],
  OM: [
    [{ cells: [4, 5], options: 3 }], [{ cells: [5, 6], options: 4 }, { cells: [5, 5], options: 4, reflection: true }],
    [{ cells: [6, 6], options: 4, nearMisses: true }, { cells: [5, 6], options: 5, nearMisses: true, reflection: true }],
    [{ cells: [7, 7], options: 6, nearMisses: true }, { cells: [5, 6], options: 5, nearMisses: true, reflection: true }, { cells: [6, 7], options: 5, nearMisses: true }],
    [{ cells: [7, 7], options: 6, nearMisses: true }, { cells: [6, 7], options: 6, nearMisses: true, reflection: true }],
    [{ cells: [8, 9], options: 6, nearMisses: true }, { cells: [7, 8], options: 6, nearMisses: true, reflection: true }],
  ],
  SC: [[], [], [], [], [], []],
  BR: [
    [{ rows: 5, cols: 5, density: 0.6 }, { rows: 5, cols: 5, density: 0.6, symmetric: true }], [{ rows: 6, cols: 6, density: 0.55, symmetric: true }, { rows: 6, cols: 6, density: 0.6 }],
    [{ rows: 7, cols: 7, density: 0.55, symmetric: true }, { rows: 8, cols: 8, density: 0.55 }], [{ rows: 9, cols: 9, density: 0.55, symmetric: true }, { rows: 10, cols: 10, density: 0.55, symmetric: true }],
    [{ rows: 10, cols: 10, density: 0.5 }, { rows: 10, cols: 10, density: 0.55, symmetric: true }], [],
  ],
  SG: [
    [{ n: 4, startSigns: 6, extraGivens: 4 }], [{ n: 4, startSigns: 6 }, { n: 4, startSigns: 6, extraGivens: 2 }], [{ n: 5, startSigns: 10 }, { n: 5, startSigns: 6 }],
    [{ n: 5, startSigns: 6 }, { n: 6, startSigns: 14 }], [{ n: 6, startSigns: 14 }, { n: 6, startSigns: 8 }], [{ n: 7, startSigns: 20 }],
  ],
  TO: [[{ n: 4, keepClues: 12, extraGivens: 3 }], [{ n: 4, keepClues: 8 }], [{ n: 5, keepClues: 12 }], [{ n: 5, keepClues: 8 }], [{ n: 6, keepClues: 14 }], [{ n: 6, keepClues: 10 }]],
  GL: [
    [{ rows: 5, cols: 5, rocks: [3, 5], moves: [2, 3] }], [{ rows: 6, cols: 6, rocks: [5, 8], moves: [4, 5] }], [{ rows: 7, cols: 7, rocks: [7, 11], moves: [6, 7] }],
    [{ rows: 7, cols: 7, rocks: [7, 11], moves: [7, 8] }, { rows: 8, cols: 8, rocks: [9, 14], moves: [8, 9] }], [{ rows: 8, cols: 8, rocks: [9, 14], moves: [9, 11] }], [{ rows: 9, cols: 9, rocks: [12, 18], moves: [11, 14] }],
  ],
  TQ: [
    [{ rows: 2, cols: 3, moves: [5, 8] }], [{ rows: 2, cols: 3, moves: [10, 16] }, { rows: 3, cols: 3, moves: [10, 13] }], [{ rows: 3, cols: 3, moves: [12, 15] }],
    [{ rows: 3, cols: 3, moves: [17, 20] }, { rows: 3, cols: 3, moves: [21, 23] }], [{ rows: 3, cols: 3, moves: [24, 31] }, { rows: 2, cols: 4, moves: [25, 32] }], [],
  ],
  RU: [[{ rows: 5, cols: 5, pairs: [4, 5] }, { rows: 6, cols: 6, pairs: [5, 6] }], [{ rows: 7, cols: 7, pairs: [6, 7] }], [{ rows: 8, cols: 8, pairs: [7, 8] }], [{ rows: 8, cols: 8, pairs: [5, 6] }], [{ rows: 9, cols: 9, pairs: [7, 8] }], []],
  LU: [[{ rows: 5, cols: 5, posts: [4, 5] }, { rows: 6, cols: 6, posts: [6, 7] }], [{ rows: 7, cols: 7, posts: [8, 10] }], [{ rows: 8, cols: 8, posts: [11, 13] }], [{ rows: 8, cols: 8, posts: [11, 13] }, { rows: 9, cols: 9, posts: [14, 16] }], [{ rows: 9, cols: 9, posts: [14, 16] }], []],
  PA: [[{ rows: 5, cols: 5, islands: [4, 5] }, { rows: 6, cols: 6, islands: [6, 8] }], [{ rows: 7, cols: 7, islands: [9, 11] }], [{ rows: 8, cols: 8, islands: [12, 14] }], [{ rows: 9, cols: 9, islands: [15, 18] }], [{ rows: 10, cols: 10, islands: [18, 22] }], []],
  BA: [
    [{ unknowns: 2, maxWeight: 20 }],
    [{ unknowns: 2, maxWeight: 20 }],
    [{ unknowns: 3, maxWeight: 20 }],
    [{ unknowns: 3, maxWeight: 20 }, { unknowns: 4, maxWeight: 16 }],
    [{ unknowns: 4, maxWeight: 16 }],
    [{ unknowns: 4, maxWeight: 16 }],
  ],
};

const seen = Object.fromEntries(ALL.map((c) => [c, new Set<string>()])) as Record<Code, Set<string>>;

/** Generates one puzzle of `code` as close as possible to `tier`. */
export function forgePuzzle(code: Code, tier: Tier, id: string, maxAttempts = 400): { data: unknown; tier: Tier; score: number } {
  const family = FAMILIES[code];
  const pipe = new CandidatePipeline(family);
  const base = StableHash.seed('forge', String(FORGE_VERSION), id);
  // Target tier first, then neighbours (closest first).
  const tiers = [tier, tier - 1, tier + 1, tier - 2, tier + 2].filter((t) => t >= 0 && t <= MAX_TIER[code]) as Tier[];
  for (const t of tiers) {
    const list = PARAMS[code][t] ?? [];
    // Each lantern starts at another candidate: sizes and variants take turns.
    const shift = list.length ? Number(base % BigInt(list.length)) : 0;
    const candidates = [...list.slice(shift), ...list.slice(0, shift)];
    for (let i = 0; i < candidates.length; i++) {
      const { accepted } = pipe.generate(1, candidates[i], base + BigInt(i * 100_000 + t * 1_000_000), [t, t], maxAttempts);
      const a = accepted.find((x) => !seen[code].has(x.fingerprint));
      if (a) { seen[code].add(a.fingerprint); return { data: a.puzzle, tier: a.tier, score: a.score }; }
    }
  }
  throw new Error(`forge: no ${code} puzzle near tier ${tier} for ${id}`);
}

// ---------------------------------------------------------------- world

interface DistrictPlan { id: string; main: Code[]; guests: Code[]; tiers: number[]; buildings: number; rooms: number[]; unlock: unknown; lettersFromKeystone4: boolean }

/** Tier distribution per district, in % (GAME_DESIGN § 4.2). */
const PLAN: DistrictPlan[] = [
  { id: 'phare', main: ['IN', 'LA', 'SU', 'DI', 'CR', 'OM', 'ET', 'CA', 'GL', 'TQ'], guests: [], tiers: [70, 30, 0, 0, 0, 0], buildings: 1, rooms: [6, 6, 6, 6], unlock: { kind: 'always' }, lettersFromKeystone4: false },
  { id: 'biblio', main: ['SU', 'MO', 'ET', 'SG'], guests: ['IN', 'LA', 'CA', 'DI', 'OM', 'CR', 'BA', 'BR', 'TO', 'GL', 'TQ', 'RU', 'LU', 'PA'], tiers: [25, 45, 25, 5, 0, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 24 }, lettersFromKeystone4: true },
  { id: 'horlo', main: ['EN', 'CA', 'CR', 'TQ'], guests: ['SU', 'MO', 'LA', 'IN', 'ET', 'VI', 'ME', 'EQ', 'BR', 'SG', 'TO', 'GL', 'RU', 'LU', 'PA'], tiers: [10, 35, 35, 15, 5, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 110 }, lettersFromKeystone4: true },
  { id: 'serre', main: ['FI', 'MA', 'DI', 'LU'], guests: ['EN', 'LA', 'MO', 'VI', 'OM', 'CR', 'IN', 'SU', 'MI', 'BR', 'SG', 'TO', 'GL', 'TQ', 'RU', 'PA'], tiers: [5, 25, 40, 20, 10, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 206 }, lettersFromKeystone4: true },
  { id: 'marche', main: ['BA', 'CA', 'ET', 'PA'], guests: ['MA', 'FI', 'SU', 'EN', 'DI', 'CR', 'IN', 'LA', 'MI', 'EQ', 'ME', 'BR', 'SG', 'TO', 'GL', 'TQ', 'RU', 'LU'], tiers: [0, 15, 35, 30, 15, 5], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 302 }, lettersFromKeystone4: true },
  { id: 'theatre', main: ['ME', 'EQ', 'OM', 'BR'], guests: ['BA', 'MO', 'FI', 'CR', 'VI', 'DI', 'IN', 'LA', 'MI', 'SG', 'TO', 'GL', 'TQ', 'RU', 'LU', 'PA'], tiers: [0, 10, 30, 30, 20, 10], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 398 }, lettersFromKeystone4: true },
  { id: 'obs', main: ['MI', 'VI', 'LA', 'TO'], guests: ['SU', 'CA', 'EN', 'MA', 'ME', 'EQ', 'BA', 'FI', 'IN', 'OM', 'DI', 'ET', 'CR', 'MO', 'BR', 'SG', 'GL', 'TQ', 'RU', 'LU', 'PA'], tiers: [0, 0, 25, 30, 30, 15], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 494 }, lettersFromKeystone4: true },
  { id: 'grenier', main: ['EN', 'LA', 'CA', 'IN', 'BA', 'MI', 'ME', 'EQ', 'FI', 'MO', 'VI', 'ET', 'OM', 'DI', 'CR', 'SU', 'BR', 'SG', 'TO', 'GL', 'TQ', 'RU', 'LU', 'PA'], guests: [], tiers: [0, 0, 0, 25, 45, 30], buildings: 1, rooms: [16], unlock: { kind: 'totalLightsAndLetters', lights: 590, letters: 4 }, lettersFromKeystone4: false },
];

/** Rooms whose name calls for a family: three of their lanterns take it (GAME_DESIGN § 3, « chaque salle a ses énigmes »). */
const SIGNATURE: Record<string, Code> = {
  'La Cuisine': 'ET', 'La Lanterne': 'MI', 'Le Globe': 'MO', 'Les Portulans': 'FI', 'La Table des vents': 'MI', 'Le Balcon': 'DI',
  'L’Atelier d’enluminure': 'VI', 'Le Cabinet des brouillons': 'DI', 'Les Rayonnages': 'ET', 'La Réserve': 'ET', 'Les Vitraux': 'VI', 'Le Sommet': 'TO',
  'La Forge': 'EN', 'Le Magasin': 'ET', 'Le Vestibule': 'CR', 'Les Rouages': 'EN', 'La Salle des Cloches': 'CR', 'Le Cadran': 'CA', 'Le Coucou': 'CR',
  'Les Poupées': 'DI', 'Le Joueur d’échecs': 'EQ', 'La Danseuse': 'CR', 'Le Cœur de l’automate': 'EN',
  'Les Orangers': 'LU', 'La Verrière': 'VI', 'Les Nénuphars': 'PA', 'Le Fond du bassin': 'DI', 'Les Semis': 'ET', 'Les Lianes': 'RU', 'La Canopée': 'OM',
  'Les Étals': 'DI', 'Les Balances': 'BA', 'Les Sacs': 'BA', 'Le Comptoir': 'BA', 'La Cale': 'ET', 'Le Grand Plateau': 'BA', 'Les Étalons': 'BA', 'Le Registre': 'EQ', 'La Criée': 'DI',
  'Le Vestiaire': 'BR', 'Le Bar': 'ET', 'Les Décors': 'OM', 'Les Accessoires': 'ET', 'La Machinerie': 'EN', 'Le Miroir': 'MI', 'La Malle': 'OM',
  'La Fosse': 'CR', 'Les Projecteurs': 'VI', 'Le Plateau': 'OM',
  'Le Polissoir': 'MI', 'Le Prisme': 'VI', 'Les Miroirs': 'MI', 'Le Banc d’optique': 'MI', 'Le Télescope': 'OM', 'Le Mécanisme': 'TQ',
  'Les Almanachs': 'ET', 'Les Globes célestes': 'OM', 'Le Sténopé': 'OM', 'Les Plaques': 'DI', 'Le Bain': 'VI', 'Le Rideau': 'BR',
};
function signatureOf(district: string, b: number, r: number): Code | undefined {
  const info = DISTRICT_INFO.find((d) => d.id === district);
  return info ? SIGNATURE[info.buildings[b]?.rooms[r]?.name ?? ''] : undefined;
}

/** Tier at quantile q of a distribution in %. */
function tierAt(dist: number[], q: number): Tier {
  let acc = 0;
  for (let t = 0; t < 6; t++) { acc += dist[t] / 100; if (q < acc - 1e-9) return t as Tier; }
  return dist.reduce((m, v, t) => (v > 0 ? t : m), 0) as Tier;
}

export interface LanternOut { id: string; family: Code; tier: Tier }
export interface RoomOut { id: string; lanterns: LanternOut[] }
export interface BuildingOut { id: string; rooms: RoomOut[]; keystone?: LanternOut; keystoneGivesLetter?: boolean }
export interface DistrictOut { id: string; unlock: unknown; buildings: BuildingOut[] }

/** Hand-placed lanterns keep their family and tier. */
const FIXED: Record<string, Fixed> = { ...TUTORIAL, ...PROTOTYPE_ROOM };

// ---------------------------------------------------------------- updates
//   --extend  keeps every lantern and daily puzzle of the current pack as is,
//             and only generates what is new (a district, a building, dates).
//   --lock    writes released.json: the fingerprint of everything published.
//             content.test then refuses any pack that changes a released puzzle.
const OUT = path.resolve(__dirname, '../../app/src/content/generated/pack.json');
const LOCK = path.resolve(__dirname, 'released.json');
const EXTEND = process.argv.includes('--extend');
type Kept = { f: Code; t: Tier; p: unknown };
const previous: { puzzles: Record<string, Kept>; daily: { puzzles: Record<string, Kept> } } | null =
  EXTEND && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
/** Lanterns already published: their family, tier and puzzle never change. */
const KEEP: Record<string, Kept> = previous?.puzzles ?? {};
/** A lantern placed by hand or already published. */
const settled = (id: string): Fixed | Kept | undefined => FIXED[id] ?? KEEP[id];

/**
 * Chooses the family of each lantern in play order, so that the player never
 * sees the same kind of puzzle over and over:
 * - never twice in a row, at most CAP of one family in any WINDOW lanterns;
 * - within a district, each family tends to its share (main families weigh 2,
 *   guests 1): the family most behind its share comes first;
 * - a room named after a family (La Salle des Cloches…) holds 2 of it.
 */
const WINDOW = 20, CAP = 4, SIGNATURE_COUNT = 2;
class FamilyPicker {
  private recent: Code[] = [];
  private used = new Map<string, number>(); // district|family → count
  private placed = new Map<string, number>(); // district → count
  private inRoom = new Map<string, Code[]>();

  next(d: DistrictPlan, tier: Tier, room: string, sig: Code | undefined, left: number, rng: SeededRNG, avoid?: Code): Code {
    const weights = new Map<Code, number>();
    for (const f of d.main) weights.set(f, 2);
    for (const f of d.guests) if (!weights.has(f)) weights.set(f, 1);
    const total = [...weights.values()].reduce((a, b) => a + b, 0);
    const n = (this.placed.get(d.id) ?? 0) + 1;
    const here = this.inRoom.get(room) ?? [];
    const win = this.recent.slice(-(WINDOW - 1));
    const count = (f: Code) => win.filter((x) => x === f).length;
    const prev = this.recent[this.recent.length - 1];
    const able = [...weights.keys()].filter((f) => MAX_TIER[f] >= tier && f !== avoid);
    // The signature family is owed its lanterns before the room runs out.
    const sigOwed = sig && MAX_TIER[sig] >= tier ? SIGNATURE_COUNT - here.filter((x) => x === sig).length : 0;
    if (sig && sigOwed > 0 && sig !== prev && sig !== avoid && count(sig) < CAP && (left <= sigOwed * 2 || rng.chance(1, 3))) return sig;
    // Hard rules first; relaxed only if nothing passes (a tiny district late in a window).
    const tries: ((f: Code) => boolean)[] = [
      (f) => f !== prev && count(f) < CAP && here.filter((x) => x === f).length < 3,
      (f) => f !== prev && count(f) < CAP + 1,
      (f) => f !== prev,
      () => true,
    ];
    for (const ok of tries) {
      const c = able.filter(ok);
      if (!c.length) continue;
      const score = new Map(c.map((f) => {
        const share = (weights.get(f)! / total) * n - (this.used.get(`${d.id}|${f}`) ?? 0);
        const last = this.recent.lastIndexOf(f);
        const since = last < 0 ? 99 : this.recent.length - last;
        return [f, share - (since <= 3 ? 0.9 : since <= 6 ? 0.35 : 0) + (rng.below(1000) / 1000) * 0.25] as const;
      }));
      return c.reduce((best, f) => (score.get(f)! > score.get(best)! ? f : best));
    }
    return 'LA';
  }

  record(district: string, room: string, f: Code) {
    this.recent.push(f);
    this.used.set(`${district}|${f}`, (this.used.get(`${district}|${f}`) ?? 0) + 1);
    this.placed.set(district, (this.placed.get(district) ?? 0) + 1);
    this.inRoom.set(room, [...(this.inRoom.get(room) ?? []), f]);
  }
}

function planWorld(): DistrictOut[] {
  const rng = new SeededRNG(StableHash.seed('forge-plan', String(FORGE_VERSION)));
  const introduced = new Map<Code, number>();
  const pick = new FamilyPicker();
  const out: DistrictOut[] = [];
  for (const d of PLAN) {
    const buildings: BuildingOut[] = [];
    for (let b = 0; b < d.buildings; b++) {
      const total = d.rooms.reduce((s, n) => s + n, 0);
      // Sawtooth: building 1 samples the easier part of the distribution, building 4 all of it.
      const reach = d.buildings === 1 ? 1 : 0.7 + 0.1 * b;
      const tiers = Array.from({ length: total }, (_, i) => tierAt(d.tiers, Math.min(0.999, ((i + 0.5) / total) * reach)));
      let cursor = 0;
      const rooms: RoomOut[] = d.rooms.map((size, r) => {
        const id = `${d.id}.b${b + 1}.r${r + 1}`;
        const roomTiers = tiers.slice(cursor, cursor + size);
        cursor += size;
        const sig = d.id !== 'phare' ? signatureOf(d.id, b, r) : undefined;
        const lanterns: LanternOut[] = roomTiers.map((t, i) => {
          const lid = `${id}.${i + 1}`;
          const fx = settled(lid);
          // A hand-placed lantern right after this one counts as its neighbour already.
          const nextFixed = settled(i + 1 < size ? `${id}.${i + 2}` : `${d.id}.b${b + 1}.r${r + 2}.1`)?.f;
          const family = fx ? fx.f : pick.next(d, t, id, sig, size - i, rng, nextFixed);
          pick.record(d.id, id, family);
          return { id: lid, family, tier: fx ? fx.t : t };
        });
        // A family's first 3 lanterns in the world are always Étincelle (GAME_DESIGN § 4.2).
        for (const l of lanterns) {
          const n = introduced.get(l.family) ?? 0;
          if (n < 3) l.tier = Tier.Spark;
          introduced.set(l.family, n + 1);
        }
        return { id, lanterns };
      });
      const top = Math.max(...tiers);
      const building: BuildingOut = { id: `${d.id}.b${b + 1}`, rooms };
      if (d.buildings === 4) {
        // The keystone is the building's seal: the digits of its rooms (see core/families/seal.ts).
        building.keystone = { id: `${d.id}.b${b + 1}.key`, family: 'SC', tier: Tier.Blaze };
        if (b === 3 && d.lettersFromKeystone4) building.keystoneGivesLetter = true;
      }
      buildings.push(building);
    }
    out.push({ id: d.id, unlock: d.unlock, buildings });
  }
  return out;
}

// ---------------------------------------------------------------- main

/** Fil: stores one full path with the puzzle, so a hint on a big open grid is instant on the phone. */
function withKnownPath(code: Code, data: unknown) {
  if (code !== 'FI') return;
  const p = data as { known?: number[] };
  const path = FAMILIES.FI.solve(data as never, 1).solutions[0] as number[] | undefined;
  if (path) p.known = path;
}

function main() {
  const t0 = Date.now();
  const world = planWorld();
  const puzzles: Record<string, { f: Code; t: Tier; p: unknown }> = {};
  const fixed: Record<string, Fixed | Kept> = { ...KEEP, ...FIXED };
  // Fixed and published puzzles take their place and family in the world.
  for (const d of world) for (const b of d.buildings) {
    for (const r of b.rooms) for (const l of r.lanterns) {
      const f = fixed[l.id];
      if (f) { l.family = f.f; l.tier = f.t; }
    }
    if (b.keystone && KEEP[b.keystone.id]) b.keystone.tier = KEEP[b.keystone.id].t;
  }
  // Published puzzles were checked when they were made; they only block duplicates.
  for (const k of Object.values(KEEP)) if (k.f !== 'SC') seen[k.f].add(FAMILIES[k.f].fingerprint(FAMILIES[k.f].parse(k.p)));
  for (const [id, f] of Object.entries(FIXED)) {
    if (f.p === undefined) continue;
    const family = FAMILIES[f.f];
    // A hand-placed puzzle must pass the same checks as a generated one.
    const report = family.solve(f.p, 2);
    if (report.solutionCount !== 1 && family.requiresUniqueSolution) throw new Error(`fixed puzzle ${id} is not unique`);
    if (family.validate(f.p, family.stateApplying(report.solutions[0], f.p)).kind !== 'correct') throw new Error(`fixed puzzle ${id} is invalid`);
    seen[f.f].add(family.fingerprint(f.p));
  }
  let count = 0;
  const hist: Record<string, number[]> = {};
  const all = world.flatMap((d) => d.buildings.flatMap((b) => [...b.rooms.flatMap((r) => r.lanterns), ...(b.keystone ? [b.keystone] : [])]));
  for (const l of all) {
    const fx = fixed[l.id];
    if (fx?.p !== undefined) { puzzles[l.id] = { f: fx.f, t: fx.t, p: fx.p }; continue; }
    if (KEEP[l.id]) { puzzles[l.id] = KEEP[l.id]; continue; }
    if (l.family === 'SC') {
      const b = world.flatMap((d) => d.buildings).find((x) => x.keystone === l)!;
      const bi = Number(b.id.split('.b')[1]) - 1;
      const seal = { rooms: b.rooms.map((r) => r.id), rule: sealRuleFor(b.id, bi) };
      const fam = FAMILIES.SC;
      l.tier = fam.thresholds.tier(fam.rate(seal, fam.solve(seal, 2)));
      puzzles[l.id] = { f: 'SC', t: l.tier, p: seal };
      continue;
    }
    const g = forgePuzzle(l.family, l.tier, l.id);
    withKnownPath(l.family, g.data);
    l.tier = g.tier;
    puzzles[l.id] = { f: l.family, t: g.tier, p: g.data };
    (hist[l.family] ??= [0, 0, 0, 0, 0, 0])[g.tier]++;
    if (++count % 100 === 0) process.stderr.write(`  ${count} lanterns (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  }
  // Daily puzzles: deterministic from the date (DailyPlanner), prepared in advance.
  const planner = new DailyPlanner(ALL, 'fr', FORGE_VERSION);
  const daily: Record<string, { f: Code; t: Tier; p: unknown }> = {};
  const first = dayKey(2026, 9, 1), last = dayKey(2028, 12, 31);
  for (let day = first; daysBetween(last, day) >= 0; day = addDays(day, 1)) {
    const kept = previous?.daily.puzzles[day];
    if (kept) { daily[day] = kept; continue; }
    const a = planner.assignment(day);
    const code = a.family as Code;
    const tier = Math.min(a.tier, MAX_TIER[code]) as Tier;
    const g = forgePuzzle(code, tier, `daily.${day}`);
    withKnownPath(code, g.data);
    daily[day] = { f: code, t: g.tier, p: g.data };
  }
  // The mockup's evening challenge was "Tuesday 29 September · Balances · Flame".
  daily['2026-09-29'] = { f: PROTOTYPE_DAILY.f, t: PROTOTYPE_DAILY.t, p: PROTOTYPE_DAILY.p };
  const pack = { version: FORGE_VERSION, world: { id: 'vesper', districts: world }, puzzles, daily: { first, last, puzzles: daily } };
  const out = OUT;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(pack));
  if (EXTEND) process.stderr.write(`  kept ${Object.keys(KEEP).length} published lanterns and ${Object.keys(previous?.daily.puzzles ?? {}).length} daily puzzles\n`);
  if (process.argv.includes('--lock')) {
    const fp = (x: Kept) => StableHash.fnv1a64(JSON.stringify(x)).toString(16);
    const lock = { version: FORGE_VERSION, lanterns: Object.fromEntries(Object.entries(puzzles).map(([k, v]) => [k, fp(v)])), daily: Object.fromEntries(Object.entries(daily).map(([k, v]) => [k, fp(v)])) };
    fs.writeFileSync(LOCK, JSON.stringify(lock, null, 0));
    process.stderr.write(`  released.json: ${Object.keys(lock.lanterns).length} lanterns, ${Object.keys(lock.daily).length} daily puzzles locked\n`);
  }
  process.stderr.write(`\n${all.length} lanterns, ${Object.keys(daily).length} daily puzzles in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${(fs.statSync(out).size / 1024).toFixed(0)} KB\n`);
  for (const [f, h] of Object.entries(hist)) process.stderr.write(`  ${f}: ${h.join(' ')}\n`);
}

main();
