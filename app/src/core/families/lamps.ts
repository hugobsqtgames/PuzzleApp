/** Lampes (genre « Akari »). */
import { canonicalGrid } from '../puzzlekit/grid';
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, CellRef, DeductionStep, Hint, HintLevel, INCOMPLETE, Issue, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, maxTechniqueRank, tpl } from '../puzzlekit/types';

export enum LampMark { Empty = 0, Lamp = 1, Dot = 2 }
export interface LampsPuzzle { layout: string[] }
export interface LampsState { marks: LampMark[] }
export interface LampsParams { rows: number; columns: number; wallPercent?: [number, number] }
export interface LampsSolution { lamps: number[] }
export interface LampPlacement { index: number; mark: LampMark }
export interface LampsIllumination { lit: boolean[]; conflicts: number[]; overfullWalls: number[] }

const ALLOWED = new Set(['.', 'X', '0', '1', '2', '3', '4']);
export function isWellFormedLayout(layout: unknown): layout is string[] {
  if (!Array.isArray(layout) || layout.length === 0 || layout.length > 20) return false;
  if (!layout.every((row) => typeof row === 'string')) return false;
  const width = (layout[0] as string).length;
  return width > 0 && width <= 20 && layout.every((row: string) => row.length === width && [...row].every((ch) => ALLOWED.has(ch)));
}

export class LampsBoard {
  readonly rows: number;
  readonly columns: number;
  readonly white: boolean[];
  readonly clue: (number | null)[];
  readonly numbered: number[];
  readonly sight: number[][];
  readonly neighbors: number[][];

  constructor(p: LampsPuzzle) {
    const rows = p.layout.length, columns = p.layout[0].length;
    const chars = p.layout.join('').split('');
    this.rows = rows;
    this.columns = columns;
    this.white = chars.map((c) => c === '.');
    this.clue = chars.map((c) => (c >= '0' && c <= '9' ? Number(c) : null));
    this.numbered = this.clue.flatMap((v, i) => (chars[i] !== '.' && v !== null ? [i] : []));
    this.neighbors = [];
    this.sight = [];
    for (let i = 0; i < rows * columns; i++) {
      const r = Math.floor(i / columns), c = i % columns;
      this.neighbors.push(([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as const)
        .filter(([a, b]) => a >= 0 && b >= 0 && a < rows && b < columns).map(([a, b]) => a * columns + b));
      const seen: number[] = [];
      if (chars[i] === '.') {
        seen.push(i);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          let rr = r + dr, cc = c + dc;
          while (rr >= 0 && cc >= 0 && rr < rows && cc < columns && chars[rr * columns + cc] === '.') {
            seen.push(rr * columns + cc);
            rr += dr; cc += dc;
          }
        }
      }
      this.sight.push(seen);
    }
  }
  get count() { return this.rows * this.columns; }
  ref(i: number): CellRef { return cell(Math.floor(i / this.columns), i % this.columns); }
  /** Marques utilisables : null si la taille diffère ; toute marque posée sur un mur est ignorée. */
  sanitized(marks: LampMark[]): LampMark[] | null {
    if (marks.length !== this.count) return null;
    return marks.map((m, i) => (this.white[i] ? m : LampMark.Empty));
  }
}

export class LampsExactSolver {
  lamp: boolean[]; blocked: boolean[]; lit: number[];
  solutions: number[][] = [];
  count = 0;
  nodes = 0;
  constructor(readonly b: LampsBoard, readonly limit: number, readonly rng: SeededRNG | null = null, readonly useClues = true) {
    this.lamp = Array(b.count).fill(false);
    this.blocked = Array(b.count).fill(false);
    this.lit = Array(b.count).fill(0);
  }
  wallsOK(exact: boolean): boolean {
    if (!this.useClues) return true;
    for (const w of this.b.numbered) {
      const n = this.b.clue[w]!;
      let k = 0, available = 0;
      for (const q of this.b.neighbors[w]) {
        if (!this.b.white[q]) continue;
        if (this.lamp[q]) k++; else if (!this.blocked[q] && this.lit[q] === 0) available++;
      }
      if (k > n || k + available < n || (exact && k !== n)) return false;
    }
    return true;
  }
  run(): this { this.search(); return this; }
  private search(): void {
    if (this.count >= this.limit) return;
    this.nodes++;
    if (!this.wallsOK(false)) return;
    const b = this.b;
    let bestCell = -1, bestCandidates: number[] = [];
    for (let c = 0; c < b.count; c++) {
      if (!(b.white[c] && this.lit[c] === 0)) continue;
      const candidates = b.sight[c].filter((q) => !this.blocked[q] && this.lit[q] === 0);
      if (candidates.length === 0) return;
      if (bestCell < 0 || candidates.length < bestCandidates.length) {
        bestCell = c; bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    if (bestCell < 0) {
      if (this.wallsOK(true)) {
        this.count++;
        if (this.solutions.length < this.limit) this.solutions.push(this.lamp.flatMap((v, i) => (v ? [i] : [])));
      }
      return;
    }
    const order = bestCandidates.slice();
    if (this.rng) this.rng.shuffle(order);
    const newlyBlocked: number[] = [];
    for (const p of order) {
      this.lamp[p] = true;
      for (const q of b.sight[p]) this.lit[q]++;
      this.search();
      this.lamp[p] = false;
      for (const q of b.sight[p]) this.lit[q]--;
      if (this.count >= this.limit) break;
      this.blocked[p] = true;
      newlyBlocked.push(p);
    }
    for (const p of newlyBlocked) this.blocked[p] = false;
  }
}

interface Deduction { step: DeductionStep; placements: LampPlacement[] }

export class LampsHumanSolver {
  constructor(readonly b: LampsBoard) {}
  litCounts(marks: LampMark[]): number[] {
    const lit = Array(this.b.count).fill(0);
    for (let p = 0; p < this.b.count; p++) if (marks[p] === LampMark.Lamp) for (const q of this.b.sight[p]) lit[q]++;
    return lit;
  }
  possible(p: number, marks: LampMark[], lit: number[]) { return this.b.white[p] && marks[p] === LampMark.Empty && lit[p] === 0; }
  contradiction(marks: LampMark[]): boolean {
    const b = this.b, lit = this.litCounts(marks);
    for (let p = 0; p < b.count; p++) if (marks[p] === LampMark.Lamp && lit[p] > 1) return true;
    for (const w of b.numbered) {
      const n = b.clue[w]!;
      const k = b.neighbors[w].filter((q) => marks[q] === LampMark.Lamp).length;
      const available = b.neighbors[w].filter((q) => this.possible(q, marks, lit)).length;
      if (k > n || k + available < n) return true;
    }
    for (let c = 0; c < b.count; c++) {
      if (b.white[c] && lit[c] === 0 && !b.sight[c].some((q) => this.possible(q, marks, lit))) return true;
    }
    return false;
  }
  isSolved(marks: LampMark[]): boolean {
    const b = this.b, lit = this.litCounts(marks);
    for (let p = 0; p < b.count; p++) if (b.white[p] && lit[p] === 0) return false;
    for (let p = 0; p < b.count; p++) if (marks[p] === LampMark.Lamp && lit[p] > 1) return false;
    for (const w of b.numbered) if (b.neighbors[w].filter((q) => marks[q] === LampMark.Lamp).length !== b.clue[w]) return false;
    return true;
  }
  simpleStep(marks: LampMark[]): Deduction | null {
    const b = this.b, lit = this.litCounts(marks);
    for (const w of b.numbered) {
      const n = b.clue[w]!;
      const k = b.neighbors[w].filter((q) => marks[q] === LampMark.Lamp).length;
      const open = b.neighbors[w].filter((q) => this.possible(q, marks, lit));
      if (open.length === 0) continue;
      if (k === n) {
        return { step: { techniqueRank: 1, technique: 'wallSatisfied', focus: [b.ref(w), ...open.map((q) => b.ref(q))], explanation: tpl('lamps.step.wallSatisfied', [String(n)]) },
                 placements: open.map((index) => ({ index, mark: LampMark.Dot })) };
      }
      if (k + open.length === n) {
        return { step: { techniqueRank: 1, technique: 'wallSaturated', focus: [b.ref(w), ...open.map((q) => b.ref(q))], explanation: tpl('lamps.step.wallSaturated', [String(n), String(open.length)]) },
                 placements: open.map((index) => ({ index, mark: LampMark.Lamp })) };
      }
    }
    for (let c = 0; c < b.count; c++) {
      if (!(b.white[c] && lit[c] === 0)) continue;
      const sources = b.sight[c].filter((q) => this.possible(q, marks, lit));
      if (sources.length === 1) {
        return { step: { techniqueRank: 2, technique: 'onlySource', focus: [b.ref(c), b.ref(sources[0])], explanation: tpl('lamps.step.onlySource') },
                 placements: [{ index: sources[0], mark: LampMark.Lamp }] };
      }
    }
    return null;
  }
  apply(placements: LampPlacement[], marks: LampMark[]): LampMark[] {
    const next = marks.slice();
    for (const p of placements) next[p.index] = p.mark;
    return next;
  }
  propagateFindsContradiction(start: LampMark[]): boolean {
    let marks = start;
    for (let i = 0; i < this.b.count * 2; i++) {
      if (this.contradiction(marks)) return true;
      const step = this.simpleStep(marks);
      if (!step) return false;
      marks = this.apply(step.placements, marks);
    }
    return this.contradiction(marks);
  }
  nextStep(marks: LampMark[]): Deduction | null {
    const simple = this.simpleStep(marks);
    if (simple) return simple;
    const lit = this.litCounts(marks);
    const candidates: number[] = [];
    for (let p = 0; p < this.b.count; p++) if (this.possible(p, marks, lit)) candidates.push(p);
    for (const rank of [3, 4]) {
      for (const p of candidates) {
        for (const [trial, conclusion] of [[LampMark.Lamp, LampMark.Dot], [LampMark.Dot, LampMark.Lamp]] as const) {
          const test = marks.slice();
          test[p] = trial;
          const found = rank === 3 ? this.contradiction(test) : this.propagateFindsContradiction(test);
          if (found) {
            const key = conclusion === LampMark.Dot ? 'lamps.step.lampWouldBreak' : 'lamps.step.lampRequired';
            return { step: { techniqueRank: rank, technique: rank === 3 ? 'directContradiction' : 'chainedContradiction', focus: [this.b.ref(p)], explanation: tpl(key) },
                     placements: [{ index: p, mark: conclusion }] };
          }
        }
      }
    }
    return null;
  }
  solve(start: LampMark[]): { trace: DeductionStep[]; solved: boolean } {
    let marks = start;
    const trace: DeductionStep[] = [];
    for (let i = 0; i < this.b.count * 3; i++) {
      if (this.isSolved(marks)) return { trace, solved: true };
      const step = this.nextStep(marks);
      if (!step) return { trace, solved: false };
      trace.push(step.step);
      marks = this.apply(step.placements, marks);
    }
    return { trace, solved: this.isSolved(marks) };
  }
}

const toLayout = (chars: string[], columns: number) => Array.from({ length: chars.length / columns }, (_, r) => chars.slice(r * columns, (r + 1) * columns).join(''));

export class LampsFamily implements PuzzleFamily<LampsPuzzle, LampsState, LampsParams, LampsSolution> {
  readonly id = 'lamps';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  illumination(p: LampsPuzzle, state: LampsState): LampsIllumination {
    const b = new LampsBoard(p);
    const marks = b.sanitized(state.marks);
    if (!marks) return { lit: Array(b.count).fill(false), conflicts: [], overfullWalls: [] };
    const lit = new LampsHumanSolver(b).litCounts(marks);
    return {
      lit: lit.map((v) => v > 0),
      conflicts: marks.flatMap((m, i) => (m === LampMark.Lamp && lit[i] > 1 ? [i] : [])),
      overfullWalls: b.numbered.filter((w) => b.neighbors[w].filter((q) => marks[q] === LampMark.Lamp).length > b.clue[w]!),
    };
  }

  generate(p: LampsParams, rng: SeededRNG): LampsPuzzle | null {
    const n = p.rows * p.columns;
    if (!(Number.isInteger(n) && n >= 9 && p.rows <= 20 && p.columns <= 20)) return null;
    const [lo, hi] = p.wallPercent ?? [18, 26];
    const percent = rng.int(lo, hi);
    let chars: string[] = Array(n).fill('.');
    for (let i = 0; i < n; i++) {
      const mirror = n - 1 - i;
      if (i > mirror) break;
      if (rng.chance(percent, 100)) { chars[i] = 'X'; chars[mirror] = 'X'; }
    }
    if (!chars.includes('.')) return null;
    const board = new LampsBoard({ layout: toLayout(chars, p.columns) });
    const finder = new LampsExactSolver(board, 1, new SeededRNG(rng.next()), false).run();
    const first = finder.solutions[0];
    if (!first) return null;
    const lamps = new Set(first);
    chars = chars.map((ch, i) => (ch === 'X' ? String(board.neighbors[i].filter((q) => lamps.has(q)).length) : ch));
    let puzzle: LampsPuzzle = { layout: toLayout(chars, p.columns) };
    if (new LampsExactSolver(new LampsBoard(puzzle), 2).run().count !== 1) return null;
    for (const i of rng.shuffled(chars.flatMap((ch, i) => (ch >= '0' && ch <= '9' ? [i] : [])))) {
      const trial = chars.slice();
      trial[i] = 'X';
      const candidate: LampsPuzzle = { layout: toLayout(trial, p.columns) };
      if (new LampsExactSolver(new LampsBoard(candidate), 2).run().count === 1) { chars = trial; puzzle = candidate; }
    }
    return puzzle;
  }

  solve(p: LampsPuzzle, limit: number): SolveReport<LampsSolution> {
    const board = new LampsBoard(p);
    const exact = new LampsExactSolver(board, limit).run();
    const human = new LampsHumanSolver(board).solve(Array(board.count).fill(LampMark.Empty));
    return { solutionCount: exact.count, solutions: exact.solutions.map((lamps) => ({ lamps })), trace: human.trace, humanSolvable: human.solved, searchNodes: exact.nodes };
  }

  initialState(p: LampsPuzzle): LampsState {
    return { marks: Array(p.layout.length * p.layout[0].length).fill(LampMark.Empty) };
  }

  stateApplying(solution: LampsSolution, p: LampsPuzzle): LampsState {
    const s = this.initialState(p);
    for (const i of solution.lamps) s.marks[i] = LampMark.Lamp;
    return s;
  }

  validate(p: LampsPuzzle, state: LampsState): ValidationResult {
    const b = new LampsBoard(p);
    const marks = b.sanitized(state.marks);
    if (!marks) return INCOMPLETE;
    const info = this.illumination(p, state);
    const issues: Issue[] = [];
    if (info.conflicts.length) issues.push({ cells: info.conflicts.map((i) => b.ref(i)), message: tpl('lamps.error.seeEachOther') });
    for (const w of info.overfullWalls) {
      const have = b.neighbors[w].filter((q) => marks[q] === LampMark.Lamp).length;
      issues.push({ cells: [b.ref(w)], message: tpl('lamps.error.wallOver', [String(b.clue[w]), String(have)]) });
    }
    if (issues.length) return { kind: 'invalid', issues };
    return new LampsHumanSolver(b).isSolved(marks) ? CORRECT : INCOMPLETE;
  }

  rate(p: LampsPuzzle, report: SolveReport<LampsSolution>): number {
    if (!report.humanSolvable) return 90;
    const base = ({ 0: 5, 1: 8, 2: 22, 3: 40, 4: 58 } as Record<number, number>)[maxTechniqueRank(report)] ?? 58;
    const advanced = report.trace.filter((s) => s.techniqueRank >= 3).length;
    const whites = p.layout.join('').split('').filter((c) => c === '.').length;
    const relief = Math.floor(Math.max(0, 30 - whites) / 2);
    return clampScore(base + Math.min(20, advanced * 3) + Math.floor(whites / 6) - relief);
  }

  hint(p: LampsPuzzle, raw: LampsState, level: HintLevel): Hint<LampsState> | null {
    const board = new LampsBoard(p);
    const clean = board.sanitized(raw.marks);
    if (!clean) return null;
    const state: LampsState = { marks: clean };
    const exact = new LampsExactSolver(board, 2).run();
    if (exact.count !== 1 || this.validate(p, state).kind === 'correct') return null;
    const solution = new Set(exact.solutions[0]);
    const solved: LampsState = { marks: state.marks.map((m, i) => (board.white[i] ? (solution.has(i) ? LampMark.Lamp : LampMark.Empty) : m)) };

    const wrong = state.marks.findIndex((m, i) => (m === LampMark.Lamp && !solution.has(i)) || (m === LampMark.Dot && solution.has(i)));
    if (wrong >= 0) {
      const fixed: LampsState = { marks: state.marks.slice() };
      fixed.marks[wrong] = LampMark.Empty;
      const key = state.marks[wrong] === LampMark.Lamp ? 'lamps.hint.wrongLamp' : 'lamps.hint.wrongDot';
      switch (level) {
        case HintLevel.Whisper: return { level, text: tpl('lamps.hint.checkMistake'), focus: [board.ref(wrong)] };
        case HintLevel.Lead: return { level, text: tpl(key), focus: [board.ref(wrong)] };
        case HintLevel.Insight: return { level, text: tpl(key), focus: [board.ref(wrong)], resultingState: fixed };
        case HintLevel.Solution: return { level, text: tpl('lamps.hint.solution'), focus: [], resultingState: solved };
      }
    }
    if (level === HintLevel.Solution) return { level, text: tpl('lamps.hint.solution'), focus: [], resultingState: solved };
    const human = new LampsHumanSolver(board);
    const deduction = human.nextStep(state.marks);
    if (deduction) {
      const next: LampsState = { marks: human.apply(deduction.placements, state.marks) };
      switch (level) {
        case HintLevel.Whisper: return { level, text: tpl(`lamps.hint.whisper.${deduction.step.technique}`), focus: deduction.step.focus };
        case HintLevel.Lead: return { level, text: deduction.step.explanation, focus: deduction.step.focus };
        default: return { level, text: deduction.step.explanation, focus: deduction.step.focus, resultingState: next };
      }
    }
    return this.revealHint(board, state, solution, level);
  }

  /** Révélation progressive (ligne → croisement → case) : jamais la réponse dès le Murmure. */
  revealHint(board: LampsBoard, state: LampsState, solution: Set<number>, level: HintLevel): Hint<LampsState> | null {
    const reveal = [...solution].sort((a, b) => a - b).find((i) => state.marks[i] !== LampMark.Lamp);
    if (reveal === undefined) return null;
    const row = Math.floor(reveal / board.columns), column = reveal % board.columns;
    const rowCells = Array.from({ length: board.columns }, (_, c) => cell(row, c));
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('lamps.hint.reveal.whisper', [String(row + 1)]), focus: rowCells };
      case HintLevel.Lead: {
        const colCells = Array.from({ length: board.rows }, (_, r) => r).filter((r) => r !== row).map((r) => cell(r, column));
        return { level, text: tpl('lamps.hint.reveal.lead', [String(row + 1), String(column + 1)]), focus: [...rowCells, ...colCells] };
      }
      default: {
        const next: LampsState = { marks: state.marks.slice() };
        next.marks[reveal] = LampMark.Lamp;
        return { level, text: tpl('lamps.hint.reveal'), focus: [board.ref(reveal)], resultingState: next };
      }
    }
  }

  fingerprint(p: LampsPuzzle): string {
    const chars = p.layout.map((r) => r.split(''));
    return canonicalGrid(p.layout.length, p.layout[0].length, (r, c) => chars[r][c]);
  }

  parse(raw: unknown): LampsPuzzle | null {
    const layout = (raw as { layout?: unknown } | null)?.layout;
    return isWellFormedLayout(layout) ? { layout: layout.slice() } : null;
  }

  equals(a: LampsPuzzle, b: LampsPuzzle): boolean {
    return a.layout.length === b.layout.length && a.layout.every((r, i) => r === b.layout[i]);
  }
}
