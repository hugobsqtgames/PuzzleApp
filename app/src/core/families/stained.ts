/**
 * Vitraux — colours. Each row and each column of a stained-glass window has
 * one coloured filter (red, yellow, blue) or none. A pane shows the mix of its
 * row and its column: red + yellow = orange, yellow + blue = green,
 * red + blue = violet. Find every filter from the colours of the panes.
 * Some filters are set in lead (given) so that one answer only is possible.
 * Variant « vitres voilées »: some panes are frosted and show no colour; the
 * others still leave one answer only.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export const FILTERS = [0, 1, 2, 4] as const; // none, red, yellow, blue

export interface StainedPuzzle { rows: number; cols: number; target: number[]; givenRows: (number | null)[]; givenCols: (number | null)[]; veiled?: number[] }
export interface StainedState { rowF: number[]; colF: number[] }
export interface StainedParams { rows: number; cols: number; nonePercent?: number; veiled?: number }
interface Sol { rowF: number[]; colF: number[] }

const isFilter = (v: unknown): v is number => typeof v === 'number' && (FILTERS as readonly number[]).includes(v);
/** Whether the pane at index i shows its colour. */
export const shows = (p: StainedPuzzle, i: number) => !p.veiled?.includes(i);

/** Every filter assignment matching the target (rows enumerated, columns deduced), up to `limit`. */
export function assignments(p: StainedPuzzle, limit: number): Sol[] {
  const out: Sol[] = [];
  const rowF = Array(p.rows).fill(0);
  const rec = (r: number) => {
    if (out.length >= limit) return;
    if (r === p.rows) {
      // For each column, the filters compatible with every pane of the column.
      const choices: number[][] = [];
      for (let c = 0; c < p.cols; c++) {
        const opts = (p.givenCols[c] !== null ? [p.givenCols[c] as number] : [...FILTERS]).filter((f) => rowF.every((rf, rr) => !shows(p, rr * p.cols + c) || (rf | f) === p.target[rr * p.cols + c]));
        if (!opts.length) return;
        choices.push(opts);
      }
      const colF = Array(p.cols).fill(0);
      const pick = (c: number) => {
        if (out.length >= limit) return;
        if (c === p.cols) { out.push({ rowF: rowF.slice(), colF: colF.slice() }); return; }
        for (const f of choices[c]) { colF[c] = f; pick(c + 1); }
      };
      pick(0);
      return;
    }
    const opts = p.givenRows[r] !== null ? [p.givenRows[r] as number] : [...FILTERS];
    for (const f of opts) {
      // A row filter can only bring colours that every pane of the row has.
      if (![...Array(p.cols).keys()].every((c) => !shows(p, r * p.cols + c) || (p.target[r * p.cols + c] & f) === f)) continue;
      rowF[r] = f; rec(r + 1);
    }
  };
  rec(0);
  return out;
}

export class StainedFamily implements PuzzleFamily<StainedPuzzle, StainedState, StainedParams, Sol> {
  readonly id = 'stained';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([25, 38, 50, 62, 76]);

  generate(params: StainedParams, rng: SeededRNG): StainedPuzzle | null {
    const { rows, cols } = params, none = params.nonePercent ?? 15;
    const f = () => (rng.chance(none, 100) ? 0 : FILTERS[1 + rng.below(3)]);
    const rowF = [...Array(rows)].map(f), colF = [...Array(cols)].map(f);
    const target = [...Array(rows * cols)].map((_, i) => rowF[Math.floor(i / cols)] | colF[i % cols]);
    // Needs mixes: a window of pure colours says nothing.
    if (target.filter((c) => c === 3 || c === 5 || c === 6).length < Math.ceil((rows * cols) / 3)) return null;
    const p: StainedPuzzle = { rows, cols, target, givenRows: Array(rows).fill(null), givenCols: Array(cols).fill(null) };
    const lines = [...[...Array(rows)].map((_, r) => ['r', r] as const), ...[...Array(cols)].map((_, c) => ['c', c] as const)];
    const order = rng.shuffled(lines);
    for (const [k, i] of order) {
      if (assignments(p, 2).length === 1) break;
      if (k === 'r') p.givenRows[i] = rowF[i]; else p.givenCols[i] = colF[i];
    }
    if (assignments(p, 2).length !== 1) return null;
    // Remove givens that are not needed.
    for (const [k, i] of order) {
      const arr = k === 'r' ? p.givenRows : p.givenCols;
      if (arr[i] === null) continue;
      const keep = arr[i];
      arr[i] = null;
      if (assignments(p, 2).length !== 1) arr[i] = keep;
    }
    const given = p.givenRows.filter((x) => x !== null).length + p.givenCols.filter((x) => x !== null).length;
    if (given > Math.ceil((rows + cols) / 2)) return null;
    if (params.veiled) {
      // Frost panes one by one, as long as the window still has one answer only.
      const veiled: number[] = [];
      for (const i of rng.shuffled([...Array(rows * cols).keys()])) {
        if (veiled.length === params.veiled) break;
        p.veiled = [...veiled, i];
        if (assignments(p, 2).length === 1) veiled.push(i);
      }
      if (veiled.length < params.veiled) return null;
      p.veiled = veiled.sort((a, b) => a - b);
    }
    return p;
  }
  solve(p: StainedPuzzle, limit: number): SolveReport<Sol> {
    const sols = assignments(p, limit);
    return { solutionCount: sols.length, solutions: sols, trace: [], humanSolvable: true, searchNodes: sols.length };
  }
  initialState(p: StainedPuzzle): StainedState {
    return { rowF: p.givenRows.map((g) => g ?? 0), colF: p.givenCols.map((g) => g ?? 0) };
  }
  stateApplying(sol: Sol): StainedState { return { rowF: sol.rowF.slice(), colF: sol.colF.slice() }; }
  validate(p: StainedPuzzle, s: StainedState): ValidationResult {
    const wrong: { row: number; column: number }[] = [];
    let done = true;
    for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
      // A frosted pane says nothing: the window is right when every clear pane is.
      if (!shows(p, r * p.cols + c)) continue;
      const now = s.rowF[r] | s.colF[c], want = p.target[r * p.cols + c];
      if (now !== want) done = false;
      if ((now & ~want) !== 0) wrong.push(cell(r, c));
    }
    if (done) return CORRECT;
    if (wrong.length) return { kind: 'invalid', issues: [{ cells: wrong, message: tpl('stained.error.extra') }] };
    return INCOMPLETE;
  }
  rate(p: StainedPuzzle): number {
    const given = p.givenRows.filter((x) => x !== null).length + p.givenCols.filter((x) => x !== null).length;
    return clampScore(p.rows * p.cols * 3 + (p.rows + p.cols - given) * 3 + (p.veiled?.length ?? 0) * 4 - 20);
  }
  /** First line (rows first) whose filter is not the solution's. */
  private firstWrong(p: StainedPuzzle, s: StainedState) {
    const sol = assignments(p, 1)[0];
    for (let r = 0; r < p.rows; r++) if (s.rowF[r] !== sol.rowF[r]) return { kind: 'row' as const, i: r, f: sol.rowF[r], sol };
    for (let c = 0; c < p.cols; c++) if (s.colF[c] !== sol.colF[c]) return { kind: 'col' as const, i: c, f: sol.colF[c], sol };
    return null;
  }
  hint(p: StainedPuzzle, s: StainedState, level: HintLevel): Hint<StainedState> | null {
    const w = this.firstWrong(p, s);
    if (!w) return null;
    const focus = [w.kind === 'row' ? cell(w.i, -1) : cell(-1, w.i)];
    const line = w.kind === 'row' ? 'row' : 'col', n = String(w.i + 1);
    if (level === HintLevel.Whisper) return { level, text: tpl('stained.hint.whisper'), focus: [] };
    if (level === HintLevel.Lead) return { level, text: tpl(`stained.hint.lead.${line}`, [n]), focus };
    if (level === HintLevel.Insight) {
      const next = { rowF: s.rowF.slice(), colF: s.colF.slice() };
      if (w.kind === 'row') next.rowF[w.i] = w.f; else next.colF[w.i] = w.f;
      return { level, text: tpl(`stained.hint.insight.${line}`, [n, `stained.filter.${w.f}`]), focus, resultingState: next };
    }
    return { level, text: tpl('stained.hint.solution'), focus: [], resultingState: { rowF: w.sol.rowF.slice(), colF: w.sol.colF.slice() } };
  }
  fingerprint(p: StainedPuzzle): string { return `stained:${p.rows}x${p.cols}:${p.target.join('')}:${p.givenRows.map((g) => g ?? '-').join('')}:${p.givenCols.map((g) => g ?? '-').join('')}${p.veiled?.length ? ':v' + p.veiled.join('.') : ''}`; }
  parse(raw: unknown): StainedPuzzle | null {
    const o = raw as Partial<StainedPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number;
    if (rows < 2 || rows > 6 || cols < 2 || cols > 6) return null;
    if (!Array.isArray(o.target) || o.target.length !== rows * cols || !o.target.every((v) => Number.isInteger(v) && v >= 0 && v <= 7)) return null;
    const giv = (a: unknown, n: number) => Array.isArray(a) && a.length === n && a.every((v) => v === null || isFilter(v));
    if (!giv(o.givenRows, rows) || !giv(o.givenCols, cols)) return null;
    const p: StainedPuzzle = { rows, cols, target: o.target.slice(), givenRows: (o.givenRows as (number | null)[]).slice(), givenCols: (o.givenCols as (number | null)[]).slice() };
    if (o.veiled !== undefined) {
      if (!Array.isArray(o.veiled) || !o.veiled.every((i) => Number.isInteger(i) && i >= 0 && i < rows * cols) || new Set(o.veiled).size !== o.veiled.length) return null;
      if (o.veiled.length) p.veiled = o.veiled.slice();
    }
    return p;
  }
  equals(a: StainedPuzzle, b: StainedPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
