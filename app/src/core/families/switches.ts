/** Interrupteurs — portage exact de Families/Switches/Switches.swift (résolution exacte sur GF(2)). */
import { canonicalGrid } from '../puzzlekit/grid';
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl, Hint } from '../puzzlekit/types';

export type SwitchPattern = 'cross' | 'diagonal' | 'ring';
const OFFSETS: Record<SwitchPattern, [number, number][]> = {
  cross: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]],
  diagonal: [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  ring: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const PATTERN_BONUS: Record<SwitchPattern, number> = { cross: 0, diagonal: 6, ring: 10 };

export interface SwitchesPuzzle {
  rows: number;
  columns: number;
  pattern: SwitchPattern;
  initiallyLit: boolean[];
}
export interface SwitchesState {
  lit: boolean[];
  moves: number;
}
export interface SwitchesParams {
  rows: number;
  columns: number;
  pattern?: SwitchPattern;
  presses: [number, number];
  minimumMoves?: number;
}
export interface SwitchesSolution {
  presses: boolean[];
}
export const moveCount = (s: SwitchesSolution) => s.presses.filter(Boolean).length;

const isWellFormed = (rows: number, columns: number, cells: number) =>
  Number.isInteger(rows) && Number.isInteger(columns) && rows > 0 && columns > 0 && rows <= 8 && columns <= 8 && rows * columns === cells;

const bit = (i: number) => 1n << BigInt(i);

export class SwitchesFamily implements PuzzleFamily<SwitchesPuzzle, SwitchesState, SwitchesParams, SwitchesSolution> {
  readonly id = 'switches';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  mask(index: number, p: SwitchesPuzzle): bigint {
    const r = Math.floor(index / p.columns), c = index % p.columns;
    let m = 0n;
    for (const [dr, dc] of OFFSETS[p.pattern]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < p.rows && cc < p.columns) m |= bit(rr * p.columns + cc);
    }
    return m;
  }

  press(index: number, state: SwitchesState, p: SwitchesPuzzle): SwitchesState {
    const n = p.rows * p.columns;
    if (!(index >= 0 && index < n) || state.lit.length !== n) return state;
    const m = this.mask(index, p);
    const lit = state.lit.map((v, i) => ((m & bit(i)) !== 0n ? !v : v));
    return { lit, moves: state.moves + 1 };
  }

  generate(p: SwitchesParams, rng: SeededRNG): SwitchesPuzzle | null {
    if (!isWellFormed(p.rows, p.columns, p.rows * p.columns) || p.presses[0] < 0 || p.presses[1] < p.presses[0]) return null;
    const pattern = p.pattern ?? 'cross';
    const n = p.rows * p.columns;
    const count = Math.min(n, rng.int(p.presses[0], p.presses[1]));
    const chosen = rng.shuffled(Array.from({ length: n }, (_, i) => i)).slice(0, count);
    const draft: SwitchesPuzzle = { rows: p.rows, columns: p.columns, pattern, initiallyLit: Array(n).fill(true) };
    let state: SwitchesState = { lit: draft.initiallyLit.slice(), moves: 0 };
    for (const i of chosen) state = this.press(i, state, draft);
    const puzzle: SwitchesPuzzle = { rows: p.rows, columns: p.columns, pattern, initiallyLit: state.lit };
    if (state.lit.every(Boolean)) return null;
    const minimal = this.minimalSolution(puzzle, puzzle.initiallyLit);
    if (!minimal || moveCount(minimal) < (p.minimumMoves ?? 1)) return null;
    return puzzle;
  }

  /** Résout A·x = b sur GF(2) (b = cases éteintes). null si aucune solution. */
  linearSolve(p: SwitchesPuzzle, lit: boolean[]): { particular: boolean[]; nullBasis: boolean[][] } | null {
    const n = p.rows * p.columns;
    if (lit.length !== n) return null;
    const rows: bigint[] = Array(n).fill(0n);
    const rhs = lit.map((v) => !v);
    for (let j = 0; j < n; j++) {
      const m = this.mask(j, p);
      for (let i = 0; i < n; i++) if ((m & bit(i)) !== 0n) rows[i] |= bit(j);
    }
    const pivots: number[] = [];
    let rank = 0;
    for (let column = 0; column < n; column++) {
      let pivot = -1;
      for (let r = rank; r < n; r++) if ((rows[r] & bit(column)) !== 0n) { pivot = r; break; }
      if (pivot < 0) continue;
      [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
      [rhs[rank], rhs[pivot]] = [rhs[pivot], rhs[rank]];
      for (let r = 0; r < n; r++) {
        if (r !== rank && (rows[r] & bit(column)) !== 0n) {
          rows[r] ^= rows[rank];
          rhs[r] = rhs[r] !== rhs[rank];
        }
      }
      pivots.push(column);
      rank++;
    }
    for (let r = rank; r < n; r++) if (rhs[r]) return null;
    const particular = Array(n).fill(false);
    pivots.forEach((column, r) => (particular[column] = rhs[r]));
    const nullBasis: boolean[][] = [];
    for (let f = 0; f < n; f++) {
      if (pivots.includes(f)) continue;
      const v = Array(n).fill(false);
      v[f] = true;
      pivots.forEach((column, r) => { if ((rows[r] & bit(f)) !== 0n) v[column] = true; });
      nullBasis.push(v);
    }
    return { particular, nullBasis };
  }

  minimalSolution(p: SwitchesPuzzle, lit: boolean[]): SwitchesSolution | null {
    const system = this.linearSolve(p, lit);
    if (!system) return null;
    let best = system.particular;
    let bestWeight = best.filter(Boolean).length;
    const k = system.nullBasis.length;
    if (k <= 20) {
      for (let combo = 1; combo < 1 << k; combo++) {
        const v = system.particular.slice();
        for (let b = 0; b < k; b++) {
          if (combo & (1 << b)) for (let i = 0; i < v.length; i++) if (system.nullBasis[b][i]) v[i] = !v[i];
        }
        const w = v.filter(Boolean).length;
        if (w < bestWeight) { best = v; bestWeight = w; }
      }
    }
    return { presses: best };
  }

  nullity(p: SwitchesPuzzle): number {
    return this.linearSolve(p, Array(p.rows * p.columns).fill(true))?.nullBasis.length ?? 0;
  }

  solve(p: SwitchesPuzzle, limit: number): SolveReport<SwitchesSolution> {
    const system = this.linearSolve(p, p.initiallyLit);
    const minimal = this.minimalSolution(p, p.initiallyLit);
    if (!system || !minimal) return { solutionCount: 0, solutions: [], trace: [], humanSolvable: true, searchNodes: 0 };
    const k = system.nullBasis.length;
    const count = k >= 62 ? limit : Math.min(limit, 2 ** k);
    return { solutionCount: count, solutions: [minimal], trace: [], humanSolvable: true, searchNodes: k <= 20 ? 2 ** k : 0 };
  }

  initialState(p: SwitchesPuzzle): SwitchesState {
    return { lit: p.initiallyLit.slice(), moves: 0 };
  }

  stateApplying(solution: SwitchesSolution, p: SwitchesPuzzle): SwitchesState {
    let s = this.initialState(p);
    solution.presses.forEach((pressed, i) => { if (pressed) s = this.press(i, s, p); });
    return s;
  }

  validate(p: SwitchesPuzzle, state: SwitchesState): ValidationResult {
    return state.lit.length === p.rows * p.columns && state.lit.every(Boolean) ? CORRECT : INCOMPLETE;
  }

  rate(p: SwitchesPuzzle, report: SolveReport<SwitchesSolution>): number {
    const moves = report.solutions[0] ? moveCount(report.solutions[0]) : 0;
    return clampScore(moves * 6 + Math.max(0, p.rows * p.columns - 9) + PATTERN_BONUS[p.pattern] - this.nullity(p) * 3);
  }

  hint(p: SwitchesPuzzle, state: SwitchesState, level: HintLevel): Hint<SwitchesState> | null {
    if (this.validate(p, state).kind === 'correct') return null;
    const plan = this.minimalSolution(p, state.lit);
    if (!plan) return null;
    const pressed = plan.presses.flatMap((v, i) => (v ? [i] : []));
    const first = pressed[0];
    if (first === undefined) return null;
    const row = Math.floor(first / p.columns), column = first % p.columns;
    const rowCells = Array.from({ length: p.columns }, (_, c) => cell(row, c));
    switch (level) {
      case HintLevel.Whisper:
        return { level, text: tpl('switches.hint.whisper', [String(row + 1)]), focus: rowCells };
      case HintLevel.Lead:
        return { level, text: tpl('switches.hint.lead', [String(row + 1), String(moveCount(plan))]), focus: rowCells };
      case HintLevel.Insight:
        return { level, text: tpl('switches.hint.insight', [String(row + 1), String(column + 1)]), focus: [cell(row, column)], resultingState: this.press(first, state, p) };
      case HintLevel.Solution: {
        let solved = state;
        for (const i of pressed) solved = this.press(i, solved, p);
        return { level, text: tpl('switches.hint.solution', [String(moveCount(plan))]), focus: pressed.map((i) => cell(Math.floor(i / p.columns), i % p.columns)), resultingState: solved };
      }
    }
  }

  fingerprint(p: SwitchesPuzzle): string {
    return `${p.pattern}|` + canonicalGrid(p.rows, p.columns, (r, c) => (p.initiallyLit[r * p.columns + c] ? 'o' : '.'));
  }

  parse(raw: unknown): SwitchesPuzzle | null {
    const o = raw as Partial<SwitchesPuzzle> | null;
    if (!o || typeof o !== 'object' || !Array.isArray(o.initiallyLit) || !o.initiallyLit.every((v) => typeof v === 'boolean')) return null;
    if (o.pattern !== 'cross' && o.pattern !== 'diagonal' && o.pattern !== 'ring') return null;
    if (typeof o.rows !== 'number' || typeof o.columns !== 'number' || !isWellFormed(o.rows, o.columns, o.initiallyLit.length)) return null;
    return { rows: o.rows, columns: o.columns, pattern: o.pattern, initiallyLit: o.initiallyLit.slice() };
  }

  equals(a: SwitchesPuzzle, b: SwitchesPuzzle): boolean {
    return a.rows === b.rows && a.columns === b.columns && a.pattern === b.pattern && a.initiallyLit.every((v, i) => v === b.initiallyLit[i]);
  }
}
