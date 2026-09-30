/**
 * Broderie — a picture stitched on a canvas (nonogram). The numbers of a row
 * (or a column) are its runs of stitches, in order, with at least one empty
 * cell between two runs. Only pictures a line-by-line reasoning solves to the
 * end are kept: one answer, and never a guess.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, CellRef, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface EmbroideryPuzzle { rows: number; cols: number; rowClues: number[][]; colClues: number[][] }
/** 0 = not decided, 1 = stitch, 2 = marked empty. */
export interface EmbroideryState { cells: number[] }
export interface EmbroideryParams { rows: number; cols: number; density: number; symmetric?: boolean }

export const runsOf = (line: boolean[]) => {
  const out: number[] = [];
  let n = 0;
  for (const x of line) { if (x) n++; else if (n) { out.push(n); n = 0; } }
  if (n) out.push(n);
  return out;
};

/**
 * One line: every placement of the runs compatible with what is known
 * (-1 unknown, 0 empty, 1 stitch); returns the cells that are the same in all
 * of them, or null if none fits.
 */
export function solveLine(clue: number[], known: number[]): number[] | null {
  const n = known.length, k = clue.length;
  // can[i][j]: runs j.. can be placed in cells i.. (memoised).
  const memo = new Map<number, boolean>();
  const canFill = (from: number, to: number, v: number) => { for (let x = from; x < to; x++) if (known[x] !== -1 && known[x] !== v) return false; return true; };
  const can = (i: number, j: number): boolean => {
    const key = i * 64 + j;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let ok = false;
    if (j === k) ok = canFill(i, n, 0);
    else {
      const len = clue[j];
      for (let s = i; s + len <= n; s++) {
        if (!canFill(i, s, 0)) break;
        if (!canFill(s, s + len, 1)) continue;
        if (s + len < n && known[s + len] === 1) continue;
        if (can(Math.min(n, s + len + 1), j + 1)) { ok = true; break; }
      }
    }
    memo.set(key, ok);
    return ok;
  };
  if (!can(0, 0)) return null;
  // Collect which values each cell takes over all placements.
  const filled = new Array(n).fill(false), empty = new Array(n).fill(false);
  const seen = new Set<number>();
  const walk = (i: number, j: number) => {
    const key = i * 64 + j;
    if (seen.has(key)) return;
    seen.add(key);
    if (j === k) { for (let x = i; x < n; x++) empty[x] = true; return; }
    const len = clue[j];
    for (let s = i; s + len <= n; s++) {
      if (!canFill(i, s, 0)) break;
      if (!canFill(s, s + len, 1)) continue;
      if (s + len < n && known[s + len] === 1) continue;
      const next = Math.min(n, s + len + 1);
      if (!can(next, j + 1)) continue;
      for (let x = i; x < s; x++) empty[x] = true;
      for (let x = s; x < s + len; x++) filled[x] = true;
      if (s + len < n) empty[s + len] = true;
      walk(next, j + 1);
    }
  };
  walk(0, 0);
  return known.map((v, x) => (v !== -1 ? v : filled[x] && !empty[x] ? 1 : empty[x] && !filled[x] ? 0 : -1));
}

const lineOf = (p: EmbroideryPuzzle, g: number[], kind: 'r' | 'c', i: number) =>
  kind === 'r' ? g.slice(i * p.cols, i * p.cols + p.cols) : [...Array(p.rows)].map((_, r) => g[r * p.cols + i]);
const setLine = (p: EmbroideryPuzzle, g: number[], kind: 'r' | 'c', i: number, v: number[]) =>
  v.forEach((x, j) => { g[kind === 'r' ? i * p.cols + j : j * p.cols + i] = x; });

/** Line-by-line reasoning from `known` until nothing moves. */
export function propagate(p: EmbroideryPuzzle, known: number[]): { grid: number[] | null; rounds: number } {
  const g = known.slice();
  let rounds = 0, moved = true;
  while (moved) {
    moved = false;
    rounds++;
    for (const kind of ['r', 'c'] as const) {
      const count = kind === 'r' ? p.rows : p.cols;
      for (let i = 0; i < count; i++) {
        const before = lineOf(p, g, kind, i);
        const after = solveLine(kind === 'r' ? p.rowClues[i] : p.colClues[i], before);
        if (!after) return { grid: null, rounds };
        if (after.some((v, j) => v !== before[j])) { setLine(p, g, kind, i, after); moved = true; }
      }
    }
    if (rounds > 200) break;
  }
  return { grid: g, rounds };
}

export class EmbroideryFamily implements PuzzleFamily<EmbroideryPuzzle, EmbroideryState, EmbroideryParams, boolean[]> {
  readonly id = 'embroidery';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([22, 36, 50, 64, 78]);

  generate(params: EmbroideryParams, rng: SeededRNG): EmbroideryPuzzle | null {
    const { rows, cols } = params;
    const pic: boolean[] = new Array(rows * cols).fill(false);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      // A mirrored picture reads like an embroidered motif rather than noise.
      if (params.symmetric && c >= Math.ceil(cols / 2)) pic[r * cols + c] = pic[r * cols + (cols - 1 - c)];
      else pic[r * cols + c] = rng.chance(Math.round(params.density * 100), 100);
    }
    const p: EmbroideryPuzzle = {
      rows, cols,
      rowClues: [...Array(rows)].map((_, r) => runsOf(pic.slice(r * cols, r * cols + cols))),
      colClues: [...Array(cols)].map((_, c) => runsOf([...Array(rows)].map((__, r) => pic[r * cols + c]))),
    };
    // No blank line: a picture, not a gap.
    if (p.rowClues.some((x) => !x.length) || p.colClues.some((x) => !x.length)) return null;
    const { grid } = propagate(p, new Array(rows * cols).fill(-1));
    if (!grid || grid.some((v) => v === -1)) return null;
    return p;
  }

  solve(p: EmbroideryPuzzle): SolveReport<boolean[]> {
    const { grid, rounds } = propagate(p, new Array(p.rows * p.cols).fill(-1));
    if (!grid || grid.some((v) => v === -1)) return { solutionCount: grid ? 2 : 0, solutions: [], trace: [], humanSolvable: false, searchNodes: rounds };
    return { solutionCount: 1, solutions: [grid.map((v) => v === 1)], trace: [], humanSolvable: true, searchNodes: rounds };
  }

  initialState(p: EmbroideryPuzzle): EmbroideryState { return { cells: new Array(p.rows * p.cols).fill(0) }; }
  stateApplying(sol: boolean[]): EmbroideryState { return { cells: sol.map((x) => (x ? 1 : 2)) }; }

  validate(p: EmbroideryPuzzle, s: EmbroideryState): ValidationResult {
    const stitched = s.cells.map((v) => v === 1);
    // A line with more stitches than its numbers allow is wrong already.
    for (let r = 0; r < p.rows; r++) {
      const line = stitched.slice(r * p.cols, r * p.cols + p.cols);
      if (line.filter(Boolean).length > p.rowClues[r].reduce((a, b) => a + b, 0)) return { kind: 'invalid', issues: [{ cells: [...Array(p.cols)].map((_, c) => cell(r, c)), message: tpl('embroidery.error.row', [String(r + 1)]) }] };
    }
    for (let c = 0; c < p.cols; c++) {
      const line = [...Array(p.rows)].map((_, r) => stitched[r * p.cols + c]);
      if (line.filter(Boolean).length > p.colClues[c].reduce((a, b) => a + b, 0)) return { kind: 'invalid', issues: [{ cells: [...Array(p.rows)].map((_, r) => cell(r, c)), message: tpl('embroidery.error.col', [String(c + 1)]) }] };
    }
    const ok = [...Array(p.rows)].every((_, r) => same(runsOf(stitched.slice(r * p.cols, r * p.cols + p.cols)), p.rowClues[r]))
      && [...Array(p.cols)].every((_, c) => same(runsOf([...Array(p.rows)].map((__, r) => stitched[r * p.cols + c])), p.colClues[c]));
    return ok ? CORRECT : INCOMPLETE;
  }

  rate(p: EmbroideryPuzzle, report: SolveReport<boolean[]>): number {
    return clampScore(p.rows * p.cols * 0.55 + report.searchNodes * 4 - 6);
  }

  private solution(p: EmbroideryPuzzle): boolean[] { return this.solve(p).solutions[0]; }

  hint(p: EmbroideryPuzzle, s: EmbroideryState, level: HintLevel): Hint<EmbroideryState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const sol = this.solution(p);
    const at = (i: number): CellRef => cell(Math.floor(i / p.cols), i % p.cols);
    // A mistake first: a stitch where there is none, or a cross on a stitch.
    const wrong = s.cells.findIndex((v, i) => (v === 1 && !sol[i]) || (v === 2 && sol[i]));
    if (wrong >= 0) {
      const fixed = s.cells.slice(); fixed[wrong] = 0;
      if (level === HintLevel.Solution) return { level, text: tpl('embroidery.hint.solution'), focus: [], resultingState: this.stateApplying(sol) };
      return { level, text: tpl('embroidery.hint.mistake'), focus: [at(wrong)], resultingState: level === HintLevel.Insight ? { cells: fixed } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('embroidery.hint.whisper'), focus: [] };
    if (level === HintLevel.Solution) return { level, text: tpl('embroidery.hint.solution'), focus: [], resultingState: this.stateApplying(sol) };
    // The first line that says something new from what is already stitched.
    const known = s.cells.map((v) => (v === 1 ? 1 : v === 2 ? 0 : -1));
    for (const kind of ['r', 'c'] as const) {
      const count = kind === 'r' ? p.rows : p.cols;
      for (let i = 0; i < count; i++) {
        const before = lineOf(p, known, kind, i);
        const after = solveLine(kind === 'r' ? p.rowClues[i] : p.colClues[i], before);
        if (!after) continue;
        const news = after.map((v, j) => (v !== before[j] ? j : -1)).filter((j) => j >= 0);
        if (!news.length) continue;
        const idx = news.map((j) => (kind === 'r' ? i * p.cols + j : j * p.cols + i));
        const focus = idx.map(at);
        const key = kind === 'r' ? 'embroidery.hint.row' : 'embroidery.hint.col';
        if (level === HintLevel.Lead) return { level, text: tpl(key, [String(i + 1)]), focus };
        const cells = s.cells.slice();
        for (const x of idx) cells[x] = sol[x] ? 1 : 2;
        return { level, text: tpl(`${key}.insight`, [String(i + 1)]), focus, resultingState: { cells } };
      }
    }
    return { level, text: tpl('embroidery.hint.solution'), focus: [], resultingState: this.stateApplying(sol) };
  }

  fingerprint(p: EmbroideryPuzzle): string { return `embroidery:${p.rows}x${p.cols}:${p.rowClues.map((c) => c.join('.')).join('/')}|${p.colClues.map((c) => c.join('.')).join('/')}`; }
  parse(raw: unknown): EmbroideryPuzzle | null {
    const o = raw as Partial<EmbroideryPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number;
    if (rows < 3 || rows > 12 || cols < 3 || cols > 12) return null;
    const clues = (a: unknown, n: number, len: number) => Array.isArray(a) && a.length === n && a.every((c) => Array.isArray(c) && c.every((x) => Number.isInteger(x) && x >= 1 && x <= len) && c.reduce((s: number, x: number) => s + x, 0) + c.length - 1 <= len);
    if (!clues(o.rowClues, rows, cols) || !clues(o.colClues, cols, rows)) return null;
    return { rows, cols, rowClues: (o.rowClues as number[][]).map((c) => c.slice()), colClues: (o.colClues as number[][]).map((c) => c.slice()) };
  }
  equals(a: EmbroideryPuzzle, b: EmbroideryPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
