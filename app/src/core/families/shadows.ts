/**
 * Ombres — shapes. An object made of little squares casts its shadow on the
 * wall, turned. Which shadow is its own? Shadows turn, they never flip: the
 * mirror images are there to catch the eye, and in harder puzzles, shapes
 * with one square moved.
 * Variant « Reflet »: the object seen in a mirror. A reflection is always
 * flipped (then maybe turned): the plain turns become the traps.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export type Cells = [number, number][];
export interface ShadowsPuzzle { shape: Cells; options: Cells[]; answer: number; reflection?: boolean }
export interface ShadowsState { selected: number | null; ruledOut: number[] }
export interface ShadowsParams { cells: [number, number]; options: number; nearMisses?: boolean; reflection?: boolean }

export function normalize(c: Cells): Cells {
  const r0 = Math.min(...c.map((x) => x[0])), c0 = Math.min(...c.map((x) => x[1]));
  return c.map(([r, k]) => [r - r0, k - c0] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const key = (c: Cells) => normalize(c).map((x) => x.join('.')).join(' ');
export const rotate = (c: Cells): Cells => normalize(c.map(([r, k]) => [k, -r] as [number, number]));
export const mirror = (c: Cells): Cells => normalize(c.map(([r, k]) => [r, -k] as [number, number]));
const rotations = (c: Cells) => { const out = [normalize(c)]; for (let i = 0; i < 3; i++) out.push(rotate(out[out.length - 1])); return out; };
/** Same shape once turned (not flipped). */
export const sameTurned = (a: Cells, b: Cells) => rotations(a).some((r) => key(r) === key(b));
/** What the right option looks like before turning: the shape, or its mirror image for a reflection. */
const seenAs = (p: { shape: Cells; reflection?: boolean }) => (p.reflection ? mirror(p.shape) : p.shape);
/** The look-alike that is wrong: the mirror image for a shadow, the shape itself for a reflection. */
const trapOf = (p: { shape: Cells; reflection?: boolean }) => (p.reflection ? p.shape : mirror(p.shape));
const connected = (c: Cells) => {
  const set = new Set(c.map((x) => x.join('.'))), seen = new Set<string>([c[0].join('.')]), stack = [c[0]];
  while (stack.length) { const [r, k] = stack.pop()!; for (const [dr, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = `${r + dr}.${k + dk}`; if (set.has(n) && !seen.has(n)) { seen.add(n); stack.push([r + dr, k + dk]); } } }
  return seen.size === c.length;
};

export class ShadowsFamily implements PuzzleFamily<ShadowsPuzzle, ShadowsState, ShadowsParams, number> {
  readonly id = 'shadows';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([28, 40, 52, 64, 78]);

  generate(params: ShadowsParams, rng: SeededRNG): ShadowsPuzzle | null {
    const size = rng.int(params.cells[0], params.cells[1]);
    const cells: Cells = [[0, 0]];
    while (cells.length < size) {
      const [r, k] = cells[rng.below(cells.length)];
      const [dr, dk] = [[1, 0], [-1, 0], [0, 1], [0, -1]][rng.below(4)];
      if (!cells.some((x) => x[0] === r + dr && x[1] === k + dk)) cells.push([r + dr, k + dk]);
    }
    const shape = normalize(cells);
    // Its mirror must be a different shape, or the distractors would be right too.
    if (sameTurned(shape, mirror(shape))) return null;
    const kind = { shape, reflection: params.reflection };
    // A shadow is always turned; a reflection may also be seen straight.
    const turned = rotations(seenAs(kind))[params.reflection ? rng.below(4) : 1 + rng.below(3)];
    const pool: Cells[] = rng.shuffled(rotations(trapOf(kind)));
    if (params.nearMisses) {
      for (let t = 0; t < 30 && pool.length < 8; t++) {
        // Move one square elsewhere, keeping the shape in one piece.
        const c = shape.map((x) => [...x] as [number, number]);
        const i = rng.below(c.length), [r, k] = c[rng.below(c.length)], [dr, dk] = [[1, 0], [-1, 0], [0, 1], [0, -1]][rng.below(4)];
        c[i] = [r + dr, k + dk];
        if (new Set(c.map((x) => x.join('.'))).size !== c.length || !connected(c)) continue;
        const v = rotations(c)[rng.below(4)];
        if (sameTurned(v, shape) || sameTurned(v, mirror(shape)) || pool.some((x) => sameTurned(x, v))) continue;
        pool.unshift(v);
      }
    }
    const distractors: Cells[] = [];
    for (const d of pool) if (distractors.length < params.options - 1 && !distractors.some((x) => key(x) === key(d))) distractors.push(d);
    if (distractors.length < params.options - 1) return null;
    const answer = rng.below(params.options);
    const options = [...distractors];
    options.splice(answer, 0, turned);
    return params.reflection ? { shape, options, answer, reflection: true } : { shape, options, answer };
  }
  solve(p: ShadowsPuzzle): SolveReport<number> {
    const ok = p.options.map((o, i) => (sameTurned(seenAs(p), o) ? i : -1)).filter((i) => i >= 0);
    return { solutionCount: ok.length, solutions: ok, trace: [], humanSolvable: true, searchNodes: p.options.length };
  }
  initialState(): ShadowsState { return { selected: null, ruledOut: [] }; }
  stateApplying(sol: number): ShadowsState { return { selected: sol, ruledOut: [] }; }
  validate(p: ShadowsPuzzle, s: ShadowsState): ValidationResult {
    if (s.selected === null) return INCOMPLETE;
    if (s.selected === p.answer) return CORRECT;
    const trap = sameTurned(p.options[s.selected], trapOf(p));
    const msg = trap ? (p.reflection ? 'shadows.wrong.unflipped' : 'shadows.wrong.flipped') : 'shadows.wrong.other';
    return { kind: 'invalid', issues: [{ cells: [], message: tpl(msg) }] };
  }
  rate(p: ShadowsPuzzle): number {
    const near = p.options.filter((o, i) => i !== p.answer && !sameTurned(o, trapOf(p))).length;
    // Seeing the object flipped in the mind is harder than seeing it turned.
    return clampScore(p.shape.length * 7 + p.options.length * 3 + near * 6 - 25 + (p.reflection ? 8 : 0));
  }
  hint(p: ShadowsPuzzle, s: ShadowsState, level: HintLevel): Hint<ShadowsState> | null {
    if (s.selected === p.answer) return null;
    const wrong = p.options.map((_, i) => i).filter((i) => i !== p.answer && !s.ruledOut.includes(i));
    if (level === HintLevel.Whisper) return { level, text: tpl(p.reflection ? 'shadows.hint.whisper.reflection' : 'shadows.hint.whisper'), focus: [] };
    if (level === HintLevel.Lead || level === HintLevel.Insight) {
      const drop = wrong.slice(0, level === HintLevel.Lead ? 1 : 2);
      if (!drop.length) return { level, text: tpl('shadows.hint.solution'), focus: [], resultingState: { selected: p.answer, ruledOut: s.ruledOut } };
      return { level, text: tpl(level === HintLevel.Lead ? 'shadows.hint.lead' : 'shadows.hint.insight'), focus: [], resultingState: { selected: s.selected !== null && drop.includes(s.selected) ? null : s.selected, ruledOut: [...s.ruledOut, ...drop] } };
    }
    return { level, text: tpl('shadows.hint.solution'), focus: [], resultingState: { selected: p.answer, ruledOut: s.ruledOut } };
  }
  fingerprint(p: ShadowsPuzzle): string { return `shadows:${key(p.shape)}:${p.options.map(key).join('/')}:${p.answer}${p.reflection ? ':m' : ''}`; }
  parse(raw: unknown): ShadowsPuzzle | null {
    const o = raw as Partial<ShadowsPuzzle> | null;
    const okCells = (c: unknown): c is Cells => Array.isArray(c) && c.length >= 3 && c.length <= 10 && c.every((x) => Array.isArray(x) && x.length === 2 && x.every((v) => Number.isInteger(v) && Math.abs(v) <= 12));
    if (!o || !okCells(o.shape) || !Array.isArray(o.options) || o.options.length < 2 || o.options.length > 8 || !o.options.every(okCells)) return null;
    if (typeof o.answer !== 'number' || !Number.isInteger(o.answer) || o.answer < 0 || o.answer >= o.options.length) return null;
    if (o.reflection !== undefined && typeof o.reflection !== 'boolean') return null;
    const p: ShadowsPuzzle = { shape: normalize(o.shape), options: o.options.map((c) => normalize(c)), answer: o.answer };
    return o.reflection ? { ...p, reflection: true } : p;
  }
  equals(a: ShadowsPuzzle, b: ShadowsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
