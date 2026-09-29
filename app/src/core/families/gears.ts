/**
 * Engrenages — conduire la lumière de la source à toutes les tuiles en les
 * tournant (GAME_DESIGN § 5.4). Arbre couvrant aléatoire → tuiles → rotations
 * aléatoires → unicité vérifiée par un solveur exhaustif avec élagage.
 *
 * Masques d'ouverture sur 4 bits : 1 = haut, 2 = droite, 4 = bas, 8 = gauche.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface GearsPuzzle { rows: number; columns: number; source: number; tiles: number[] }
export interface GearsState { tiles: number[] }
export interface GearsParams { rows: number; columns: number; branchiness?: number }
export interface GearsSolution { tiles: number[] }

const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
const opposite = (b: number) => (b + 2) % 4;

export function rotateMask(mask: number, quarterTurns: number): number {
  const k = ((quarterTurns % 4) + 4) % 4;
  let m = mask;
  for (let i = 0; i < k; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}
export const orientations = (mask: number) => [...new Set([0, 1, 2, 3].map((k) => rotateMask(mask, k)))];
const bits = (m: number) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

const isWellFormed = (p: GearsPuzzle) =>
  Number.isInteger(p.rows) && Number.isInteger(p.columns) && p.rows >= 2 && p.columns >= 2 && p.rows <= 9 && p.columns <= 9 &&
  p.tiles.length === p.rows * p.columns && p.tiles.every((m) => Number.isInteger(m) && m > 0 && m < 16) &&
  Number.isInteger(p.source) && p.source >= 0 && p.source < p.tiles.length;

/** Lumière, fuites et réussite pour un état donné. */
export function gearsLight(p: GearsPuzzle, tiles: readonly number[]): { lit: Set<number>; leaks: Set<number>; solved: boolean } {
  const n = p.rows * p.columns, lit = new Set<number>([p.source]), leaks = new Set<number>(), stack = [p.source];
  const link = (i: number, b: number) => {
    const r = Math.floor(i / p.columns) + DR[b], c = (i % p.columns) + DC[b];
    if (r < 0 || c < 0 || r >= p.rows || c >= p.columns) return -1;
    const j = r * p.columns + c;
    return (tiles[j] >> opposite(b)) & 1 ? j : -1;
  };
  while (stack.length) {
    const i = stack.pop()!;
    for (let b = 0; b < 4; b++) {
      if (!((tiles[i] >> b) & 1)) continue;
      const j = link(i, b);
      if (j < 0) { leaks.add(i); continue; }
      if (!lit.has(j)) { lit.add(j); stack.push(j); }
    }
  }
  let solved = lit.size === n && leaks.size === 0;
  if (solved) for (let i = 0; i < n && solved; i++) for (let b = 0; b < 4; b++) if ((tiles[i] >> b) & 1 && link(i, b) < 0) { solved = false; break; }
  return { lit, leaks, solved };
}

export class GearsFamily implements PuzzleFamily<GearsPuzzle, GearsState, GearsParams, GearsSolution> {
  readonly id = 'gears';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: GearsParams, rng: SeededRNG): GearsPuzzle | null {
    const { rows, columns } = params;
    if (!(rows >= 2 && columns >= 2 && rows <= 9 && columns <= 9)) return null;
    const n = rows * columns;
    // Randomised Prim; `branchiness` (0–1) favours growing from recent cells
    // (long corridors) or from random cells (many junctions).
    const branchiness = params.branchiness ?? 0.5;
    const masks = Array(n).fill(0);
    const inTree = new Set<number>();
    const start = rng.below(n);
    inTree.add(start);
    const frontier: number[] = [start];
    while (inTree.size < n) {
      const pickIndex = rng.chance(Math.round(branchiness * 100), 100) ? rng.below(frontier.length) : frontier.length - 1;
      const i = frontier[pickIndex];
      const r = Math.floor(i / columns), c = i % columns;
      const options = [0, 1, 2, 3].filter((b) => {
        const rr = r + DR[b], cc = c + DC[b];
        return rr >= 0 && cc >= 0 && rr < rows && cc < columns && !inTree.has(rr * columns + cc) && bits(masks[i]) < 3;
      });
      if (options.length === 0) { frontier.splice(pickIndex, 1); if (frontier.length === 0) return null; continue; }
      const b = rng.pick(options);
      const j = (r + DR[b]) * columns + (c + DC[b]);
      masks[i] |= 1 << b;
      masks[j] |= 1 << opposite(b);
      inTree.add(j);
      frontier.push(j);
    }
    // The source is a junction when possible (it reads better: light spreads out).
    const junctions = masks.map((m, i) => (bits(m) >= 2 ? i : -1)).filter((i) => i >= 0);
    const source = junctions.length ? rng.pick(junctions) : 0;
    const tiles = masks.map((m) => rotateMask(m, rng.below(4)));
    const puzzle: GearsPuzzle = { rows, columns, source, tiles };
    if (gearsLight(puzzle, tiles).solved) return null; // already solved after scrambling
    return puzzle;
  }

  /** Exhaustive search, row by row, pruning on borders and on already placed neighbours. */
  solve(p: GearsPuzzle, limit: number): SolveReport<GearsSolution> {
    if (!isWellFormed(p)) return { solutionCount: 0, solutions: [], trace: [], humanSolvable: false, searchNodes: 0 };
    const { rows, columns } = p, n = rows * columns;
    const options = p.tiles.map(orientations);
    const board = Array(n).fill(0);
    const solutions: GearsSolution[] = [];
    let count = 0, nodes = 0;
    const fits = (i: number, m: number) => {
      const r = Math.floor(i / columns), c = i % columns;
      if (r === 0 && m & 1) return false;
      if (c === columns - 1 && m & 2) return false;
      if (r === rows - 1 && m & 4) return false;
      if (c === 0 && m & 8) return false;
      if (r > 0 && ((m & 1) !== 0) !== ((board[i - columns] & 4) !== 0)) return false;
      if (c > 0 && ((m & 8) !== 0) !== ((board[i - 1] & 2) !== 0)) return false;
      return true;
    };
    const rec = (i: number) => {
      if (count >= limit) return;
      if (i === n) {
        if (gearsLight(p, board).solved) { count++; if (solutions.length < limit) solutions.push({ tiles: board.slice() }); }
        return;
      }
      for (const m of options[i]) {
        nodes++;
        if (fits(i, m)) { board[i] = m; rec(i + 1); }
      }
    };
    rec(0);
    return { solutionCount: count, solutions, trace: [], humanSolvable: true, searchNodes: nodes };
  }

  initialState(p: GearsPuzzle): GearsState { return { tiles: p.tiles.slice() }; }
  stateApplying(solution: GearsSolution): GearsState { return { tiles: solution.tiles.slice() }; }

  rotate(p: GearsPuzzle, s: GearsState, index: number, quarterTurns = 1): GearsState {
    if (!(index >= 0 && index < s.tiles.length)) return s;
    const tiles = s.tiles.slice();
    tiles[index] = rotateMask(tiles[index], quarterTurns);
    return { tiles };
  }

  validate(p: GearsPuzzle, s: GearsState): ValidationResult {
    if (s.tiles.length !== p.tiles.length) return INCOMPLETE;
    // A tile can only be rotated: its shape must be unchanged.
    if (s.tiles.some((m, i) => !orientations(p.tiles[i]).includes(m))) return INCOMPLETE;
    return gearsLight(p, s.tiles).solved ? CORRECT : INCOMPLETE;
  }

  rate(p: GearsPuzzle, report: SolveReport<GearsSolution>): number {
    const n = p.rows * p.columns;
    const junctions = p.tiles.filter((m) => bits(m) >= 3).length;
    const freeTiles = p.tiles.filter((m) => orientations(m).length > 1).length;
    const search = Math.log2(Math.max(1, report.searchNodes));
    return clampScore((n - 16) * 1.6 + junctions * 1.2 + search * 2.2 + freeTiles * 0.2 - 8);
  }

  /** Order in which a person usually fixes tiles: corners, then edges, then the rest. */
  private order(p: GearsPuzzle): number[] {
    const rank = (i: number) => {
      const r = Math.floor(i / p.columns), c = i % p.columns;
      const border = (r === 0 || r === p.rows - 1 ? 1 : 0) + (c === 0 || c === p.columns - 1 ? 1 : 0);
      return -border * 10 + orientations(p.tiles[i]).length;
    };
    return p.tiles.map((_, i) => i).sort((a, b) => rank(a) - rank(b) || a - b);
  }

  hint(p: GearsPuzzle, s: GearsState, level: HintLevel): Hint<GearsState> | null {
    const report = this.solve(p, 2);
    const sol = report.solutions[0];
    if (!sol || this.validate(p, s).kind === 'correct') return null;
    const wrong = this.order(p).find((i) => s.tiles[i] !== sol.tiles[i]);
    if (wrong === undefined) return null;
    const r = Math.floor(wrong / p.columns), c = wrong % p.columns;
    const dirs = [0, 1, 2, 3].filter((b) => (sol.tiles[wrong] >> b) & 1).map((b) => ['haut', 'droite', 'bas', 'gauche'][b]);
    const at = [String(r + 1), String(c + 1)];
    switch (level) {
      case HintLevel.Whisper: {
        const border = r === 0 || c === 0 || r === p.rows - 1 || c === p.columns - 1;
        return { level, text: tpl(border ? 'gears.hint.whisper.border' : 'gears.hint.whisper', at), focus: [cell(r, c)] };
      }
      case HintLevel.Lead:
        return { level, text: tpl('gears.hint.lead', [...at, dirs.join(', ')]), focus: [cell(r, c)] };
      case HintLevel.Insight: {
        const tiles = s.tiles.slice();
        tiles[wrong] = sol.tiles[wrong];
        return { level, text: tpl('gears.hint.insight', at), focus: [cell(r, c)], resultingState: { tiles } };
      }
      case HintLevel.Solution:
        return { level, text: tpl('gears.hint.solution'), focus: [], resultingState: { tiles: sol.tiles.slice() } };
    }
  }

  fingerprint(p: GearsPuzzle): string {
    // Rotation-invariant per tile: the canonical shape is the smallest orientation.
    const shape = (m: number) => Math.min(...orientations(m)).toString(16);
    return `${p.rows}x${p.columns}@${p.source}|` + p.tiles.map(shape).join('');
  }

  parse(raw: unknown): GearsPuzzle | null {
    const o = raw as Partial<GearsPuzzle> | null;
    if (!o || typeof o !== 'object' || !Array.isArray(o.tiles) || typeof o.rows !== 'number' || typeof o.columns !== 'number' || typeof o.source !== 'number') return null;
    const p: GearsPuzzle = { rows: o.rows, columns: o.columns, source: o.source, tiles: o.tiles.slice() as number[] };
    return isWellFormed(p) ? p : null;
  }

  equals(a: GearsPuzzle, b: GearsPuzzle): boolean {
    return a.rows === b.rows && a.columns === b.columns && a.source === b.source && a.tiles.every((m, i) => m === b.tiles[i]);
  }
}
