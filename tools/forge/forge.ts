/**
 * ContentForge (TypeScript) — generates the content pack of Vesper:
 * 1 000 lanterns placed in the world, each with a generated puzzle that is
 * validated (unique solution when required), rated, tiered and deduplicated,
 * plus the daily puzzles of the coming years.
 *
 *   cd app && npx tsx ../tools/forge/forge.ts
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
import { DailyPlanner } from '../../app/src/core/game/daily';
import { addDays, dayKey, daysBetween } from '../../app/src/core/game/dayKey';
import { Fixed, PROTOTYPE_DAILY, PROTOTYPE_ROOM, TUTORIAL } from './fixed';

export type Code = 'IN' | 'CA' | 'LA' | 'EN' | 'SU' | 'BA' | 'MO' | 'ME' | 'FI' | 'MI' | 'EQ' | 'MA';
const ALL: Code[] = ['SU', 'LA', 'CA', 'EN', 'MA', 'ME', 'EQ', 'BA', 'MO', 'FI', 'IN', 'MI'];
export const FORGE_VERSION = 2;

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
};
/** Highest tier a family can produce today. */
export const MAX_TIER: Record<Code, Tier> = { IN: 5, CA: 5, LA: 5, EN: 5, BA: 5, SU: 3, MO: 4, ME: 5, FI: 4, MI: 5, EQ: 5, MA: 3 };

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
    [{ rows: 3, columns: 3, presses: [3, 5] }, { rows: 4, columns: 4, presses: [4, 7] }],
    [{ rows: 3, columns: 3, presses: [4, 6] }, { rows: 4, columns: 4, presses: [5, 8] }, { rows: 5, columns: 5, presses: [6, 10] }],
    [{ rows: 5, columns: 5, presses: [6, 10] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [8, 12] }],
    [{ rows: 5, columns: 5, presses: [9, 13] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [10, 14] }],
    [{ rows: 6, columns: 6, presses: [10, 14] }, { rows: 5, columns: 5, presses: [11, 14] }],
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
    [{ complexity: 1 }], [{ complexity: 1 }], [{ complexity: 2 }, { complexity: 3 }], [{ complexity: 3 }], [], [],
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
    const candidates = PARAMS[code][t] ?? [];
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
  { id: 'phare', main: ['IN', 'LA', 'SU'], guests: [], tiers: [70, 30, 0, 0, 0, 0], buildings: 1, rooms: [6, 6, 6, 6], unlock: { kind: 'always' }, lettersFromKeystone4: false },
  { id: 'biblio', main: ['SU', 'MO'], guests: ['IN', 'LA', 'CA'], tiers: [25, 45, 25, 5, 0, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 14 }, lettersFromKeystone4: true },
  { id: 'horlo', main: ['EN', 'CA'], guests: ['SU', 'MO', 'LA', 'IN'], tiers: [10, 35, 35, 15, 5, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 110 }, lettersFromKeystone4: true },
  { id: 'serre', main: ['FI', 'MA'], guests: ['EN', 'LA', 'MO'], tiers: [5, 25, 40, 20, 10, 0], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 206 }, lettersFromKeystone4: true },
  { id: 'marche', main: ['BA', 'CA'], guests: ['MA', 'FI', 'SU', 'EN'], tiers: [0, 15, 35, 30, 15, 5], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 302 }, lettersFromKeystone4: true },
  { id: 'theatre', main: ['ME', 'EQ'], guests: ['BA', 'MO', 'FI'], tiers: [0, 10, 30, 30, 20, 10], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 398 }, lettersFromKeystone4: true },
  { id: 'obs', main: ['MI', 'MO'], guests: ['SU', 'LA', 'CA', 'EN', 'MA', 'ME', 'EQ', 'BA', 'FI', 'IN'], tiers: [0, 0, 25, 30, 30, 15], buildings: 4, rooms: [10, 10, 10, 9], unlock: { kind: 'totalLights', lights: 494 }, lettersFromKeystone4: true },
  { id: 'grenier', main: ['EN', 'LA', 'CA', 'IN', 'BA', 'MI', 'ME', 'EQ', 'FI', 'MO'], guests: [], tiers: [0, 0, 0, 25, 45, 30], buildings: 1, rooms: [16], unlock: { kind: 'totalLightsAndLetters', lights: 590, letters: 4 }, lettersFromKeystone4: false },
];

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

function planWorld(): DistrictOut[] {
  const rng = new SeededRNG(StableHash.seed('forge-plan', String(FORGE_VERSION)));
  const introduced = new Map<Code, number>();
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
        // Families: ~60 % main, ~40 % guests, spread evenly, never 3 in a row.
        const mains = d.guests.length ? Math.round(size * 0.6) : size;
        const pool: Code[] = [];
        for (let i = 0; i < mains; i++) pool.push(d.main[(i + r + b) % d.main.length]);
        for (let i = 0; i < size - mains; i++) pool.push(d.guests[(i + r * 2 + b) % d.guests.length]);
        let fams: Code[] = rng.shuffled(pool);
        for (let guard = 0; guard < 200 && fams.some((f, i) => i >= 2 && f === fams[i - 1] && f === fams[i - 2]); guard++) fams = rng.shuffled(pool);
        const lanterns: LanternOut[] = roomTiers.map((t, i) => ({ id: `${id}.${i + 1}`, family: fams[i], tier: t }));
        // A family that cannot reach a tier swaps place with one that can.
        for (let i = 0; i < lanterns.length; i++) {
          if (MAX_TIER[lanterns[i].family] >= lanterns[i].tier) continue;
          const j = lanterns.findIndex((o) => MAX_TIER[o.family] >= lanterns[i].tier && MAX_TIER[lanterns[i].family] >= o.tier);
          if (j >= 0) [lanterns[i].family, lanterns[j].family] = [lanterns[j].family, lanterns[i].family];
          else lanterns[i].family = d.main.find((f) => MAX_TIER[f] >= lanterns[i].tier) ?? 'LA';
        }
        // A family's first 3 lanterns in the world are always Étincelle (GAME_DESIGN § 4.2).
        for (const l of lanterns) {
          const n = introduced.get(l.family) ?? 0;
          if (n < 3) l.tier = Tier.Spark;
          introduced.set(l.family, n + 1);
        }
        // Recommended order = increasing difficulty; keep the family spread.
        lanterns.sort((x, y) => x.tier - y.tier);
        lanterns.forEach((l, i) => { l.id = `${id}.${i + 1}`; });
        return { id, lanterns };
      });
      const top = Math.max(...tiers);
      const building: BuildingOut = { id: `${d.id}.b${b + 1}`, rooms };
      if (d.buildings === 4) {
        const keyFamily = d.main.find((f) => MAX_TIER[f] >= Math.min(5, top + 1)) ?? 'LA';
        building.keystone = { id: `${d.id}.b${b + 1}.key`, family: keyFamily, tier: Math.max(Tier.Blaze, Math.min(Tier.Star, top + 1)) as Tier };
        if (b === 3 && d.lettersFromKeystone4) building.keystoneGivesLetter = true;
      }
      buildings.push(building);
    }
    out.push({ id: d.id, unlock: d.unlock, buildings });
  }
  return out;
}

// ---------------------------------------------------------------- main

function main() {
  const t0 = Date.now();
  const world = planWorld();
  const puzzles: Record<string, { f: Code; t: Tier; p: unknown }> = {};
  const fixed: Record<string, Fixed> = { ...TUTORIAL, ...PROTOTYPE_ROOM };
  // Fixed puzzles take their place and family in the world.
  for (const d of world) for (const b of d.buildings) for (const r of b.rooms) for (const l of r.lanterns) {
    const f = fixed[l.id];
    if (f) { l.family = f.f; l.tier = f.t; }
  }
  for (const [id, f] of Object.entries(fixed)) {
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
    const g = forgePuzzle(l.family, l.tier, l.id);
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
    const a = planner.assignment(day);
    const code = a.family as Code;
    const tier = Math.min(a.tier, MAX_TIER[code]) as Tier;
    const g = forgePuzzle(code, tier, `daily.${day}`);
    daily[day] = { f: code, t: g.tier, p: g.data };
  }
  // The mockup's evening challenge was "Tuesday 29 September · Balances · Flame".
  daily['2026-09-29'] = { f: PROTOTYPE_DAILY.f, t: PROTOTYPE_DAILY.t, p: PROTOTYPE_DAILY.p };
  const pack = { version: FORGE_VERSION, world: { id: 'vesper', districts: world }, puzzles, daily: { first, last, puzzles: daily } };
  const out = path.resolve(__dirname, '../../app/src/content/generated/pack.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(pack));
  process.stderr.write(`\n${all.length} lanterns, ${Object.keys(daily).length} daily puzzles in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${(fs.statSync(out).size / 1024).toFixed(0)} KB\n`);
  for (const [f, h] of Object.entries(hist)) process.stderr.write(`  ${f}: ${h.join(' ')}\n`);
}

main();
