/**
 * Signes — a square of digits (each 1…n once per row and per column) with
 * « < » signs between some neighbouring cells, and a few digits given.
 * Only squares a step-by-step reasoning finishes are kept.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';
import { LatinPrune, candidatesOf, forcedCell, randomLatin, repeats, solveLatin } from './latin';

/** `less`: pairs [a, b] of neighbouring cells with value(a) < value(b). */
export interface SignsPuzzle { n: number; givens: number[]; less: [number, number][] }
export interface SignsState { values: number[] }
export interface SignsParams { n: number; startSigns: number; /** Digits given back after the trimming, for gentler squares. */ extraGivens?: number }

const pruneFor = (p: SignsPuzzle): LatinPrune => (_g, cands) => {
  for (const [a, b] of p.less) {
    const maxB = Math.max(...cands[b], 0), minA = Math.min(...cands[a], p.n + 1);
    cands[a] = cands[a].filter((x) => x < maxB);
    cands[b] = cands[b].filter((x) => x > minA);
  }
};
const checkFor = (p: SignsPuzzle) => (g: number[], i: number) => p.less.every(([a, b]) => (a !== i && b !== i) || !g[a] || !g[b] || g[a] < g[b]);

/** Solves by forced steps only; the number of steps, or -1 when a guess would be needed. */
function logicalSteps(p: SignsPuzzle): number {
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

export class SignsFamily implements PuzzleFamily<SignsPuzzle, SignsState, SignsParams, number[]> {
  readonly id = 'signs';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([24, 38, 52, 66, 80]);

  generate(params: SignsParams, rng: SeededRNG): SignsPuzzle | null {
    const n = params.n, sol = randomLatin(n, rng);
    const pairs: [number, number][] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (c + 1 < n) pairs.push(sol[i] < sol[i + 1] ? [i, i + 1] : [i + 1, i]);
      if (r + 1 < n) pairs.push(sol[i] < sol[i + n] ? [i, i + n] : [i + n, i]);
    }
    const pool = rng.shuffled(pairs);
    const p: SignsPuzzle = { n, givens: new Array(n * n).fill(0), less: pool.splice(0, params.startSigns) };
    const cells = rng.shuffled([...Array(n * n).keys()]);
    const unique = () => solveLatin(n, p.givens, checkFor(p), 2, pruneFor(p)).solutions.length === 1;
    for (let guard = 0; guard < 80 && !unique(); guard++) {
      if (pool.length && rng.chance(7, 10)) p.less.push(pool.pop()!);
      else { const i = cells.pop(); if (i === undefined) return null; p.givens[i] = sol[i]; }
    }
    if (!unique()) return null;
    // Take back what is not needed, signs first: the square should rest on its signs.
    for (const k of rng.shuffled([...p.less.keys()]).sort((a, b) => b - a)) {
      const keep = p.less[k];
      p.less.splice(k, 1);
      if (!unique() || logicalSteps(p) < 0) p.less.splice(k, 0, keep);
    }
    for (const i of rng.shuffled([...Array(n * n).keys()])) {
      if (!p.givens[i]) continue;
      const keep = p.givens[i];
      p.givens[i] = 0;
      if (!unique() || logicalSteps(p) < 0) p.givens[i] = keep;
    }
    let extra = params.extraGivens ?? 0;
    for (const i of rng.shuffled([...Array(n * n).keys()])) {
      if (extra <= 0) break;
      if (!p.givens[i]) { p.givens[i] = sol[i]; extra--; }
    }
    if (logicalSteps(p) < 0) return null;
    p.less.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return p;
  }

  solve(p: SignsPuzzle, limit: number): SolveReport<number[]> {
    const r = solveLatin(p.n, p.givens, checkFor(p), limit, pruneFor(p));
    const steps = logicalSteps(p);
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: [], humanSolvable: steps >= 0, searchNodes: r.nodes };
  }

  initialState(p: SignsPuzzle): SignsState { return { values: p.givens.slice() }; }
  stateApplying(sol: number[]): SignsState { return { values: sol.slice() }; }

  validate(p: SignsPuzzle, s: SignsState): ValidationResult {
    const rep = repeats(p.n, s.values);
    const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
    if (rep.length) return { kind: 'invalid', issues: [{ cells: rep.map(at), message: tpl('signs.error.repeat') }] };
    const broken = p.less.find(([a, b]) => s.values[a] && s.values[b] && s.values[a] >= s.values[b]);
    if (broken) return { kind: 'invalid', issues: [{ cells: broken.map(at), message: tpl('signs.error.sign') }] };
    return s.values.every(Boolean) ? CORRECT : INCOMPLETE;
  }

  rate(p: SignsPuzzle, report: SolveReport<number[]>): number {
    const given = p.givens.filter(Boolean).length;
    return clampScore(p.n * p.n * 2.2 - given * 2.5 - p.less.length * 0.6 + Math.log2(Math.max(1, report.searchNodes)) * 4 - 12);
  }

  hint(p: SignsPuzzle, s: SignsState, level: HintLevel): Hint<SignsState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const sol = this.solve(p, 1).solutions[0];
    const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
    if (level === HintLevel.Solution) return { level, text: tpl('signs.hint.solution'), focus: [], resultingState: { values: sol.slice() } };
    const wrong = s.values.findIndex((v, i) => v && v !== sol[i]);
    if (wrong >= 0) {
      const values = s.values.slice(); values[wrong] = 0;
      return { level, text: tpl('signs.hint.mistake'), focus: [at(wrong)], resultingState: level === HintLevel.Insight ? { values } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('signs.hint.whisper'), focus: [] };
    const f = forcedCell(p.n, s.values, pruneFor(p)) ?? { i: s.values.findIndex((v) => !v), v: 0, why: 'single' as const };
    const v = sol[f.i];
    const r = Math.floor(f.i / p.n) + 1, c = (f.i % p.n) + 1;
    if (level === HintLevel.Lead) return { level, text: tpl(`signs.hint.lead.${f.why}`, [String(r), String(c)]), focus: [at(f.i)] };
    const values = s.values.slice(); values[f.i] = v;
    return { level, text: tpl('signs.hint.insight', [String(r), String(c), String(v)]), focus: [at(f.i)], resultingState: { values } };
  }

  fingerprint(p: SignsPuzzle): string { return `signs:${p.n}:${p.givens.join('')}:${p.less.map((x) => x.join('<')).join(',')}`; }
  parse(raw: unknown): SignsPuzzle | null {
    const o = raw as Partial<SignsPuzzle> | null;
    if (!o || !Number.isInteger(o.n) || (o.n as number) < 3 || (o.n as number) > 7) return null;
    const n = o.n as number;
    if (!Array.isArray(o.givens) || o.givens.length !== n * n || !o.givens.every((v) => Number.isInteger(v) && v >= 0 && v <= n)) return null;
    const near = (a: number, b: number) => (Math.abs(a - b) === 1 && Math.floor(a / n) === Math.floor(b / n)) || Math.abs(a - b) === n;
    if (!Array.isArray(o.less) || !o.less.every((x) => Array.isArray(x) && x.length === 2 && x.every((v) => Number.isInteger(v) && v >= 0 && v < n * n) && near(x[0], x[1]))) return null;
    return { n, givens: o.givens.slice(), less: o.less.map((x) => [x[0], x[1]] as [number, number]) };
  }
  equals(a: SignsPuzzle, b: SignsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}

export { candidatesOf };
