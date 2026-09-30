/**
 * Taquin — the tiles of a lantern window got mixed up. Slide them back in
 * order (1, 2, 3… with the gap at the end). Scrambled by legal moves only, so
 * it is always possible; the difficulty is the length of the shortest way.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface SliderPuzzle { rows: number; cols: number; tiles: number[] }
export interface SliderState { tiles: number[] }
export interface SliderParams { rows: number; cols: number; moves: [number, number] }

const goalOf = (n: number) => [...Array(n)].map((_, i) => (i + 1) % n);
export const isGoal = (t: number[]) => t.every((v, i) => v === (i + 1) % t.length);

/** Tiles next to the gap (they can slide into it). */
export function movable(rows: number, cols: number, t: number[]): number[] {
  const g = t.indexOf(0), r = Math.floor(g / cols), c = g % cols, out: number[] = [];
  if (r > 0) out.push(g - cols);
  if (r < rows - 1) out.push(g + cols);
  if (c > 0) out.push(g - 1);
  if (c < cols - 1) out.push(g + 1);
  return out;
}
export const swapGap = (t: number[], i: number) => { const n = t.slice(), g = n.indexOf(0); [n[g], n[i]] = [n[i], n[g]]; return n; };

/** Tap on a tile in the gap's row or column: the whole line slides. */
export function tapTile(rows: number, cols: number, t: number[], i: number): number[] {
  const g = t.indexOf(0), gr = Math.floor(g / cols), gc = g % cols, r = Math.floor(i / cols), c = i % cols;
  if (i === g || (r !== gr && c !== gc)) return t;
  let out = t;
  const step = r === gr ? (c > gc ? 1 : -1) : (r > gr ? cols : -cols);
  for (let x = g + step; ; x += step) { out = swapGap(out, x); if (x === i) break; }
  return out;
}

function heuristic(rows: number, cols: number, t: number[]): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) {
    const v = t[i];
    if (!v) continue;
    const gi = v - 1;
    h += Math.abs(Math.floor(i / cols) - Math.floor(gi / cols)) + Math.abs((i % cols) - (gi % cols));
  }
  // Linear conflicts: two tiles in their goal row (or column) in the wrong order.
  for (let r = 0; r < rows; r++) for (let a = 0; a < cols; a++) for (let b = a + 1; b < cols; b++) {
    const x = t[r * cols + a], y = t[r * cols + b];
    if (x && y && Math.floor((x - 1) / cols) === r && Math.floor((y - 1) / cols) === r && x > y) h += 2;
  }
  for (let c = 0; c < cols; c++) for (let a = 0; a < rows; a++) for (let b = a + 1; b < rows; b++) {
    const x = t[a * cols + c], y = t[b * cols + c];
    if (x && y && (x - 1) % cols === c && (y - 1) % cols === c && x > y) h += 2;
  }
  return h;
}

/** Shortest sequence of tiles to slide (A*), or null past the node budget. */
export function shortestSlides(rows: number, cols: number, start: number[], budget = 250_000): { path: number[] | null; nodes: number } {
  const key = (t: number[]) => t.join(',');
  // Binary heap on f = g + h.
  const heap: [number, number, number[]][] = [];
  const push = (f: number, g: number, t: number[]) => { heap.push([f, g, t]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const best = new Map<string, number>([[key(start), 0]]);
  const prev = new Map<string, [string, number]>();
  push(heuristic(rows, cols, start), 0, start);
  let nodes = 0;
  while (heap.length && nodes < budget) {
    const [, g, t] = pop();
    const k = key(t);
    if (g > (best.get(k) ?? Infinity)) continue;
    nodes++;
    if (isGoal(t)) {
      const path: number[] = [];
      for (let x = k; prev.has(x); x = prev.get(x)![0]) path.unshift(prev.get(x)![1]);
      return { path, nodes };
    }
    for (const i of movable(rows, cols, t)) {
      const n = swapGap(t, i), nk = key(n);
      if (g + 1 < (best.get(nk) ?? Infinity)) { best.set(nk, g + 1); prev.set(nk, [k, t[i]]); push(g + 1 + heuristic(rows, cols, n), g + 1, n); }
    }
  }
  return { path: null, nodes };
}

export class SliderFamily implements PuzzleFamily<SliderPuzzle, SliderState, SliderParams, number[]> {
  readonly id = 'slider';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([20, 34, 48, 62, 76]);

  generate(params: SliderParams, rng: SeededRNG): SliderPuzzle | null {
    const { rows, cols } = params;
    let t = goalOf(rows * cols), last = -1;
    for (let k = 0; k < params.moves[1] * 3; k++) {
      const opts = movable(rows, cols, t).filter((i) => t[i] !== last);
      const i = rng.pick(opts);
      last = t[i];
      t = swapGap(t, i);
    }
    const { path } = shortestSlides(rows, cols, t);
    if (!path || path.length < params.moves[0] || path.length > params.moves[1]) return null;
    return { rows, cols, tiles: t };
  }

  solve(p: SliderPuzzle): SolveReport<number[]> {
    const { path, nodes } = shortestSlides(p.rows, p.cols, p.tiles);
    return { solutionCount: path ? 1 : 0, solutions: path ? [path] : [], trace: [], humanSolvable: !!path, searchNodes: nodes };
  }

  initialState(p: SliderPuzzle): SliderState { return { tiles: p.tiles.slice() }; }
  stateApplying(_sol: number[], p: SliderPuzzle): SliderState { return { tiles: goalOf(p.rows * p.cols) }; }

  validate(_p: SliderPuzzle, s: SliderState): ValidationResult { return isGoal(s.tiles) ? CORRECT : INCOMPLETE; }

  rate(p: SliderPuzzle, report: SolveReport<number[]>): number {
    const moves = report.solutions[0]?.length ?? 0;
    return clampScore(moves * 2.6 + (p.rows * p.cols - 6) * 2 - 6);
  }

  hint(p: SliderPuzzle, s: SliderState, level: HintLevel): Hint<SliderState> | null {
    if (isGoal(s.tiles)) return null;
    const goal = goalOf(p.rows * p.cols);
    if (level === HintLevel.Solution) return { level, text: tpl('slider.hint.solution'), focus: [], resultingState: { tiles: goal } };
    const { path } = shortestSlides(p.rows, p.cols, s.tiles);
    if (level === HintLevel.Whisper) return { level, text: tpl(path ? 'slider.hint.whisper' : 'slider.hint.whisper.far', path ? [String(path.length)] : []), focus: [] };
    if (!path || !path.length) return { level, text: tpl('slider.hint.solution'), focus: [], resultingState: { tiles: goal } };
    const i = s.tiles.indexOf(path[0]);
    const focus = [cell(Math.floor(i / p.cols), i % p.cols)];
    if (level === HintLevel.Lead) return { level, text: tpl('slider.hint.lead', [String(path[0])]), focus };
    return { level, text: tpl('slider.hint.insight', [String(path[0])]), focus, resultingState: { tiles: swapGap(s.tiles, i) } };
  }

  fingerprint(p: SliderPuzzle): string { return `slider:${p.rows}x${p.cols}:${p.tiles.join('.')}`; }
  parse(raw: unknown): SliderPuzzle | null {
    const o = raw as Partial<SliderPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number, n = rows * cols;
    if (rows < 2 || cols < 2 || n > 12) return null;
    if (!Array.isArray(o.tiles) || o.tiles.length !== n || new Set(o.tiles).size !== n || !o.tiles.every((v) => Number.isInteger(v) && v >= 0 && v < n)) return null;
    return { rows, cols, tiles: o.tiles.slice() };
  }
  equals(a: SliderPuzzle, b: SliderPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
