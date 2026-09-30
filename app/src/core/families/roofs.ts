/**
 * Toits — the chimneys of Vesper: each row and each column holds the heights
 * 1…n once. A number on the edge tells how many chimneys can be seen from
 * there, a tall one hiding every smaller one behind it.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';
import { LatinPrune, forcedCell, randomLatin, repeats, solveLatin } from './latin';

/** Clues read from the top (per column), bottom, left (per row) and right; 0 = none. */
export interface RoofsPuzzle { n: number; top: number[]; bottom: number[]; left: number[]; right: number[]; givens: number[] }
export interface RoofsState { values: number[] }
export interface RoofsParams { n: number; keepClues: number; extraGivens?: number }

export const seen = (line: number[]) => { let m = 0, k = 0; for (const v of line) if (v > m) { m = v; k++; } return k; };

const perms = new Map<number, number[][]>();
function permutations(n: number): number[][] {
  const hit = perms.get(n);
  if (hit) return hit;
  const out: number[][] = [];
  const rec = (cur: number[], left: number[]) => { if (!left.length) { out.push(cur); return; } left.forEach((v, i) => rec([...cur, v], [...left.slice(0, i), ...left.slice(i + 1)])); };
  rec([], [...Array(n)].map((_, i) => i + 1));
  perms.set(n, out);
  return out;
}

/** The lines of the square with their two clues (start side first). */
function lines(p: RoofsPuzzle): { cells: number[]; a: number; b: number }[] {
  const n = p.n, out: { cells: number[]; a: number; b: number }[] = [];
  for (let r = 0; r < n; r++) out.push({ cells: [...Array(n)].map((_, c) => r * n + c), a: p.left[r], b: p.right[r] });
  for (let c = 0; c < n; c++) out.push({ cells: [...Array(n)].map((_, r) => r * n + c), a: p.top[c], b: p.bottom[c] });
  return out;
}

/** Line reasoning: only the orders that fit the candidates and both clues survive. */
const pruneFor = (p: RoofsPuzzle): LatinPrune => (_g, cands) => {
  for (const { cells, a, b } of lines(p)) {
    if (!a && !b) continue;
    const allowed = cells.map(() => new Set<number>());
    for (const perm of permutations(p.n)) {
      if (!perm.every((v, k) => cands[cells[k]].includes(v))) continue;
      if (a && seen(perm) !== a) continue;
      if (b && seen([...perm].reverse()) !== b) continue;
      perm.forEach((v, k) => allowed[k].add(v));
    }
    cells.forEach((i, k) => { cands[i] = cands[i].filter((v) => allowed[k].has(v)); });
  }
};
const checkFor = (p: RoofsPuzzle) => (g: number[], i: number) => {
  const n = p.n, r = Math.floor(i / n), c = i % n;
  const row = g.slice(r * n, r * n + n), col = [...Array(n)].map((_, k) => g[k * n + c]);
  if (row.every(Boolean) && ((p.left[r] && seen(row) !== p.left[r]) || (p.right[r] && seen([...row].reverse()) !== p.right[r]))) return false;
  if (col.every(Boolean) && ((p.top[c] && seen(col) !== p.top[c]) || (p.bottom[c] && seen([...col].reverse()) !== p.bottom[c]))) return false;
  return true;
};

function logicalSteps(p: RoofsPuzzle): number {
  const g = p.givens.slice();
  let steps = 0;
  for (;;) {
    if (g.every(Boolean)) return steps;
    const f = forcedCell(p.n, g, pruneFor(p));
    if (!f) return -1;
    g[f.i] = f.v;
    steps++;
  }
}

export class RoofsFamily implements PuzzleFamily<RoofsPuzzle, RoofsState, RoofsParams, number[]> {
  readonly id = 'roofs';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([24, 38, 52, 66, 80]);

  generate(params: RoofsParams, rng: SeededRNG): RoofsPuzzle | null {
    const n = params.n, sol = randomLatin(n, rng);
    const row = (r: number) => sol.slice(r * n, r * n + n), col = (c: number) => [...Array(n)].map((_, k) => sol[k * n + c]);
    const p: RoofsPuzzle = {
      n, givens: new Array(n * n).fill(0),
      top: [...Array(n)].map((_, c) => seen(col(c))), bottom: [...Array(n)].map((_, c) => seen(col(c).reverse())),
      left: [...Array(n)].map((_, r) => seen(row(r))), right: [...Array(n)].map((_, r) => seen(row(r).reverse())),
    };
    const unique = () => solveLatin(n, p.givens, checkFor(p), 2, pruneFor(p)).solutions.length === 1;
    if (!unique() || logicalSteps(p) < 0) return null;
    // Take clues away while one answer and a reasoning path remain, down to `keepClues`.
    const sides = ['top', 'bottom', 'left', 'right'] as const;
    const slots = rng.shuffled(sides.flatMap((s) => [...Array(n).keys()].map((i) => [s, i] as const)));
    let clues = 4 * n;
    for (const [side, i] of slots) {
      if (clues <= params.keepClues) break;
      const keep = p[side][i];
      p[side][i] = 0;
      if (unique() && logicalSteps(p) >= 0) clues--; else p[side][i] = keep;
    }
    let extra = params.extraGivens ?? 0;
    for (const i of rng.shuffled([...Array(n * n).keys()])) { if (extra-- <= 0) break; p.givens[i] = sol[i]; }
    return p;
  }

  solve(p: RoofsPuzzle, limit: number): SolveReport<number[]> {
    const r = solveLatin(p.n, p.givens, checkFor(p), limit, pruneFor(p));
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: [], humanSolvable: logicalSteps(p) >= 0, searchNodes: r.nodes };
  }

  initialState(p: RoofsPuzzle): RoofsState { return { values: p.givens.slice() }; }
  stateApplying(sol: number[]): RoofsState { return { values: sol.slice() }; }

  validate(p: RoofsPuzzle, s: RoofsState): ValidationResult {
    const n = p.n, at = (i: number) => cell(Math.floor(i / n), i % n);
    const rep = repeats(n, s.values);
    if (rep.length) return { kind: 'invalid', issues: [{ cells: rep.map(at), message: tpl('roofs.error.repeat') }] };
    for (const { cells, a, b } of lines(p)) {
      const v = cells.map((i) => s.values[i]);
      if (!v.every(Boolean)) continue;
      if ((a && seen(v) !== a) || (b && seen([...v].reverse()) !== b)) return { kind: 'invalid', issues: [{ cells: cells.map(at), message: tpl('roofs.error.seen') }] };
    }
    return s.values.every(Boolean) ? CORRECT : INCOMPLETE;
  }

  rate(p: RoofsPuzzle, report: SolveReport<number[]>): number {
    const clues = [...p.top, ...p.bottom, ...p.left, ...p.right].filter(Boolean).length;
    return clampScore(p.n * p.n * 2.4 - clues * 1.2 - p.givens.filter(Boolean).length * 3 + Math.log2(Math.max(1, report.searchNodes)) * 3 - 8);
  }

  hint(p: RoofsPuzzle, s: RoofsState, level: HintLevel): Hint<RoofsState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const sol = this.solve(p, 1).solutions[0];
    const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
    if (level === HintLevel.Solution) return { level, text: tpl('roofs.hint.solution'), focus: [], resultingState: { values: sol.slice() } };
    const wrong = s.values.findIndex((v, i) => v && v !== sol[i]);
    if (wrong >= 0) {
      const values = s.values.slice(); values[wrong] = 0;
      return { level, text: tpl('roofs.hint.mistake'), focus: [at(wrong)], resultingState: level === HintLevel.Insight ? { values } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('roofs.hint.whisper'), focus: [] };
    const f = forcedCell(p.n, s.values, pruneFor(p)) ?? { i: s.values.findIndex((v) => !v), v: 0, why: 'single' as const };
    const r = Math.floor(f.i / p.n) + 1, c = (f.i % p.n) + 1;
    if (level === HintLevel.Lead) return { level, text: tpl(`roofs.hint.lead.${f.why}`, [String(r), String(c)]), focus: [at(f.i)] };
    const values = s.values.slice(); values[f.i] = sol[f.i];
    return { level, text: tpl('roofs.hint.insight', [String(r), String(c), String(sol[f.i])]), focus: [at(f.i)], resultingState: { values } };
  }

  fingerprint(p: RoofsPuzzle): string { return `roofs:${p.n}:${p.top.join('')}/${p.bottom.join('')}/${p.left.join('')}/${p.right.join('')}:${p.givens.join('')}`; }
  parse(raw: unknown): RoofsPuzzle | null {
    const o = raw as Partial<RoofsPuzzle> | null;
    if (!o || !Number.isInteger(o.n) || (o.n as number) < 3 || (o.n as number) > 6) return null;
    const n = o.n as number;
    const side = (a: unknown) => Array.isArray(a) && a.length === n && a.every((v) => Number.isInteger(v) && v >= 0 && v <= n);
    if (!side(o.top) || !side(o.bottom) || !side(o.left) || !side(o.right)) return null;
    if (!Array.isArray(o.givens) || o.givens.length !== n * n || !o.givens.every((v) => Number.isInteger(v) && v >= 0 && v <= n)) return null;
    return { n, top: o.top!.slice(), bottom: o.bottom!.slice(), left: o.left!.slice(), right: o.right!.slice(), givens: o.givens.slice() };
  }
  equals(a: RoofsPuzzle, b: RoofsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
