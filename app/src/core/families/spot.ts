/**
 * Différences — observation. Two pictures of the same shelf of curiosities;
 * a few things changed in the second (colour, missing, another object,
 * turned, bigger). Find them all. Positions are on a 100 × 70 canvas.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export const SPOT_KINDS = ['color', 'missing', 'glyph', 'turn', 'size'] as const;
export type SpotKind = (typeof SPOT_KINDS)[number];
/** Number of drawable objects (see ui) and of colours. */
export const SPOT_GLYPHS = 16;
export const SPOT_COLORS = 6;
export const SPOT_W = 100;
export const SPOT_H = 70;

export interface SpotItem { g: number; x: number; y: number; c: number; r: number; s: 1 | 2 }
export interface SpotDiff { i: number; kind: SpotKind; to: number }
export interface SpotPuzzle { items: SpotItem[]; diffs: SpotDiff[] }
export interface SpotState { found: number[]; misses: number }
export interface SpotParams { items: [number, number]; diffs: number; kinds?: SpotKind[] }

/** The second picture: the first one with its differences. */
export function changed(p: SpotPuzzle): (SpotItem | null)[] {
  return p.items.map((it, i) => {
    const d = p.diffs.find((x) => x.i === i);
    if (!d) return it;
    switch (d.kind) {
      case 'missing': return null;
      case 'color': return { ...it, c: d.to };
      case 'glyph': return { ...it, g: d.to };
      case 'turn': return { ...it, r: (it.r + d.to) % 360 };
      case 'size': return { ...it, s: it.s === 1 ? 2 : 1 };
    }
  });
}

/** Index of the difference at (x, y) of the canvas, if any (generous: fingers are big). */
export function diffAt(p: SpotPuzzle, x: number, y: number): number {
  let best = -1, dist = 11;
  p.diffs.forEach((d, k) => {
    const it = p.items[d.i];
    const r = Math.hypot(it.x - x, it.y - y);
    if (r < dist) { dist = r; best = k; }
  });
  return best;
}

export class SpotFamily implements PuzzleFamily<SpotPuzzle, SpotState, SpotParams, number[]> {
  readonly id = 'spot';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([30, 42, 54, 66, 80]);

  generate(params: SpotParams, rng: SeededRNG): SpotPuzzle | null {
    const kinds = params.kinds ?? [...SPOT_KINDS];
    const n = rng.int(params.items[0], params.items[1]);
    // Jittered grid: 5 columns × 4 rows of places, a few left empty.
    const places = rng.shuffled([...Array(20).keys()]).slice(0, n);
    const items: SpotItem[] = places.map((k) => ({
      g: rng.below(SPOT_GLYPHS), c: rng.below(SPOT_COLORS), r: [0, 0, 0, 90][rng.below(4)], s: (rng.chance(1, 4) ? 2 : 1) as 1 | 2,
      x: 10 + (k % 5) * 20 + rng.int(-3, 3), y: 9 + Math.floor(k / 5) * 17 + rng.int(-2, 2),
    }));
    const chosen = rng.shuffled([...items.keys()]).slice(0, params.diffs);
    // Differences not too close to each other: one tap, one difference.
    for (let a = 0; a < chosen.length; a++) for (let b = a + 1; b < chosen.length; b++) {
      if (Math.hypot(items[chosen[a]].x - items[chosen[b]].x, items[chosen[a]].y - items[chosen[b]].y) < 14) return null;
    }
    const diffs: SpotDiff[] = chosen.map((i) => {
      const kind = kinds[rng.below(kinds.length)];
      const it = items[i];
      const to = kind === 'color' ? (it.c + 1 + rng.below(SPOT_COLORS - 1)) % SPOT_COLORS
        : kind === 'glyph' ? (it.g + 1 + rng.below(SPOT_GLYPHS - 1)) % SPOT_GLYPHS
          : kind === 'turn' ? 90 * (1 + rng.below(3)) : 0;
      return { i, kind, to };
    });
    return { items, diffs };
  }
  solve(p: SpotPuzzle): SolveReport<number[]> {
    return { solutionCount: 1, solutions: [p.diffs.map((_, k) => k)], trace: [], humanSolvable: true, searchNodes: p.items.length };
  }
  initialState(): SpotState { return { found: [], misses: 0 }; }
  stateApplying(sol: number[]): SpotState { return { found: sol.slice(), misses: 0 }; }
  validate(p: SpotPuzzle, s: SpotState): ValidationResult {
    const all = p.diffs.every((_, k) => s.found.includes(k));
    return all ? CORRECT : INCOMPLETE;
  }
  rate(p: SpotPuzzle): number {
    const subtle = p.diffs.filter((d) => d.kind === 'turn' || d.kind === 'size' || d.kind === 'color').length;
    return clampScore(p.diffs.length * 9 + subtle * 5 + p.items.length - 20);
  }
  hint(p: SpotPuzzle, s: SpotState, level: HintLevel): Hint<SpotState> | null {
    const k = p.diffs.findIndex((_, i) => !s.found.includes(i));
    if (k < 0) return null;
    const it = p.items[p.diffs[k].i];
    const zone = `spot.zone.${it.y < SPOT_H / 2 ? 'top' : 'bottom'}.${it.x < SPOT_W / 3 ? 'left' : it.x > (2 * SPOT_W) / 3 ? 'right' : 'middle'}`;
    const left = String(p.diffs.length - s.found.length);
    if (level === HintLevel.Whisper) return { level, text: tpl('spot.hint.whisper', [left, zone]), focus: [] };
    if (level === HintLevel.Lead) return { level, text: tpl('spot.hint.lead'), focus: [cell(Math.round(it.y), Math.round(it.x))] };
    if (level === HintLevel.Insight) return { level, text: tpl(`spot.hint.insight.${p.diffs[k].kind}`), focus: [cell(Math.round(it.y), Math.round(it.x))], resultingState: { ...s, found: [...s.found, k] } };
    return { level, text: tpl('spot.hint.solution'), focus: [], resultingState: { ...s, found: p.diffs.map((_, i) => i) } };
  }
  fingerprint(p: SpotPuzzle): string {
    return `spot:${p.items.map((i) => `${i.g}.${i.c}.${i.x}.${i.y}.${i.r}.${i.s}`).join('|')}:${p.diffs.map((d) => `${d.i}${d.kind}${d.to}`).join(',')}`;
  }
  parse(raw: unknown): SpotPuzzle | null {
    const o = raw as { items?: unknown; diffs?: unknown } | null;
    if (!o || !Array.isArray(o.items) || !Array.isArray(o.diffs) || o.items.length < 3 || o.items.length > 30 || o.diffs.length < 1 || o.diffs.length > 10) return null;
    const int = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
    const items = o.items as SpotItem[];
    if (!items.every((i) => i && int(i.g, 0, SPOT_GLYPHS - 1) && int(i.c, 0, SPOT_COLORS - 1) && int(i.x, 0, SPOT_W) && int(i.y, 0, SPOT_H) && int(i.r, 0, 359) && (i.s === 1 || i.s === 2))) return null;
    const diffs = o.diffs as SpotDiff[];
    if (!diffs.every((d) => d && int(d.i, 0, items.length - 1) && SPOT_KINDS.includes(d.kind) && int(d.to, 0, 360))) return null;
    if (new Set(diffs.map((d) => d.i)).size !== diffs.length) return null;
    return { items: items.map((i) => ({ ...i })), diffs: diffs.map((d) => ({ ...d })) };
  }
  equals(a: SpotPuzzle, b: SpotPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
