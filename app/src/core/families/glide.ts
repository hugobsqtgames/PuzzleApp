/**
 * Glissade — the canal has frozen. Nilo slides until a crate or the bank
 * stops him, and must come to rest on the lantern. Any way there is right;
 * the difficulty is the length of the shortest one.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export type Dir = 0 | 1 | 2 | 3; // up, right, down, left
export const DIRS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export interface GlidePuzzle { rows: number; cols: number; rocks: number[]; start: number; goal: number }
export interface GlideState { pos: number; moves: number }
export interface GlideParams { rows: number; cols: number; rocks: [number, number]; moves: [number, number] }

/** Where a slide from `from` towards `d` stops. */
export function slide(p: GlidePuzzle, rocks: Set<number>, from: number, d: Dir): number {
  let r = Math.floor(from / p.cols), c = from % p.cols;
  for (;;) {
    const nr = r + DIRS[d][0], nc = c + DIRS[d][1];
    if (nr < 0 || nc < 0 || nr >= p.rows || nc >= p.cols || rocks.has(nr * p.cols + nc)) return r * p.cols + c;
    r = nr; c = nc;
  }
}

/** Shortest slides from `from` to the goal (breadth first), with how many rests are reachable. */
export function shortest(p: GlidePuzzle, from: number): { path: Dir[] | null; reachable: number } {
  const rocks = new Set(p.rocks);
  const prev = new Map<number, [number, Dir]>([[from, [-1, 0]]]);
  const queue = [from];
  while (queue.length) {
    const x = queue.shift()!;
    if (x === p.goal) {
      const path: Dir[] = [];
      for (let y = x; y !== from; y = prev.get(y)![0]) path.unshift(prev.get(y)![1]);
      return { path, reachable: prev.size };
    }
    for (const d of [0, 1, 2, 3] as Dir[]) {
      const y = slide(p, rocks, x, d);
      if (y !== x && !prev.has(y)) { prev.set(y, [x, d]); queue.push(y); }
    }
  }
  return { path: null, reachable: prev.size };
}

export class GlideFamily implements PuzzleFamily<GlidePuzzle, GlideState, GlideParams, Dir[]> {
  readonly id = 'glide';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([20, 34, 48, 62, 76]);

  generate(params: GlideParams, rng: SeededRNG): GlidePuzzle | null {
    const { rows, cols } = params, n = rows * cols;
    const cells = rng.shuffled([...Array(n).keys()]);
    const rocks = cells.slice(0, rng.int(params.rocks[0], params.rocks[1])).sort((a, b) => a - b);
    const free = cells.slice(rocks.length);
    const p: GlidePuzzle = { rows, cols, rocks, start: free[0], goal: free[1] };
    // The lantern must be a place where one can stop: next to a crate or the bank.
    const { path } = shortest(p, p.start);
    if (!path || path.length < params.moves[0] || path.length > params.moves[1]) return null;
    return p;
  }

  solve(p: GlidePuzzle): SolveReport<Dir[]> {
    const { path, reachable } = shortest(p, p.start);
    return { solutionCount: path ? 1 : 0, solutions: path ? [path] : [], trace: [], humanSolvable: !!path, searchNodes: reachable };
  }

  initialState(p: GlidePuzzle): GlideState { return { pos: p.start, moves: 0 }; }
  stateApplying(sol: Dir[], p: GlidePuzzle): GlideState {
    const rocks = new Set(p.rocks);
    return { pos: sol.reduce((x, d) => slide(p, rocks, x, d), p.start), moves: sol.length };
  }
  /** One slide. */
  move(p: GlidePuzzle, s: GlideState, d: Dir): GlideState {
    const to = slide(p, new Set(p.rocks), s.pos, d);
    return to === s.pos ? s : { pos: to, moves: s.moves + 1 };
  }

  validate(p: GlidePuzzle, s: GlideState): ValidationResult { return s.pos === p.goal ? CORRECT : INCOMPLETE; }

  rate(p: GlidePuzzle, report: SolveReport<Dir[]>): number {
    const moves = report.solutions[0]?.length ?? 0;
    return clampScore(moves * 7 + Math.log2(Math.max(2, report.searchNodes)) * 4 + p.rows * p.cols * 0.1 - 22);
  }

  hint(p: GlidePuzzle, s: GlideState, level: HintLevel): Hint<GlideState> | null {
    if (s.pos === p.goal) return null;
    const { path } = shortest(p, s.pos);
    const at = (i: number) => cell(Math.floor(i / p.cols), i % p.cols);
    if (!path) {
      // Stuck where the lantern cannot be reached: start again.
      return { level, text: tpl('glide.hint.stuck'), focus: [at(p.start)], resultingState: level >= HintLevel.Insight ? { pos: p.start, moves: s.moves } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('glide.hint.whisper', [String(shortest(p, p.start).path!.length)]), focus: [] };
    const dir = path[0], name = `glide.dir.${dir}`;
    if (level === HintLevel.Lead) return { level, text: tpl('glide.hint.lead', [name]), focus: [at(slide(p, new Set(p.rocks), s.pos, dir))] };
    if (level === HintLevel.Insight) return { level, text: tpl('glide.hint.insight', [name]), focus: [], resultingState: this.move(p, s, dir) };
    return { level, text: tpl('glide.hint.solution'), focus: [], resultingState: { pos: p.goal, moves: s.moves + path.length } };
  }

  fingerprint(p: GlidePuzzle): string { return `glide:${p.rows}x${p.cols}:${p.rocks.join('.')}:${p.start}>${p.goal}`; }
  parse(raw: unknown): GlidePuzzle | null {
    const o = raw as Partial<GlidePuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number, n = rows * cols;
    if (rows < 3 || cols < 3 || rows > 10 || cols > 10) return null;
    const idx = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < n;
    if (!Array.isArray(o.rocks) || !o.rocks.every(idx) || !idx(o.start) || !idx(o.goal) || o.start === o.goal) return null;
    if (o.rocks.includes(o.start as number) || o.rocks.includes(o.goal as number)) return null;
    return { rows, cols, rocks: o.rocks.slice(), start: o.start as number, goal: o.goal as number };
  }
  equals(a: GlidePuzzle, b: GlidePuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
