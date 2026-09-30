/**
 * Étagère — order. A few objects to put back on a shelf, left to right,
 * following clues ("the clock is left of the book", "the key is at one end",
 * "the vase is between the lamp and the shell"). One order only fits.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export type ShelfClue =
  | { k: 'left'; a: number; b: number }
  | { k: 'next'; a: number; b: number }
  | { k: 'notNext'; a: number; b: number }
  | { k: 'end'; a: number }
  | { k: 'pos'; a: number; p: number }
  | { k: 'notPos'; a: number; p: number }
  | { k: 'between'; a: number; b: number; c: number };
export const SHELF_KINDS = ['left', 'next', 'notNext', 'end', 'pos', 'notPos', 'between'] as const;

/** Names of the objects (indices into the UI's pictures and into `shelf.item.*`). */
export const SHELF_ITEMS = 10;

export interface ShelfPuzzle { items: number[]; clues: ShelfClue[]; start: number[] }
export interface ShelfState { order: number[] }
export interface ShelfParams { n: number; kinds?: (typeof SHELF_KINDS)[number][] }

/** Does this order (order[slot] = item index) satisfy the clue? */
export function holds(c: ShelfClue, order: number[]): boolean {
  const at = (x: number) => order.indexOf(x);
  switch (c.k) {
    case 'left': return at(c.a) < at(c.b);
    case 'next': return Math.abs(at(c.a) - at(c.b)) === 1;
    case 'notNext': return Math.abs(at(c.a) - at(c.b)) !== 1;
    case 'end': return at(c.a) === 0 || at(c.a) === order.length - 1;
    case 'pos': return at(c.a) === c.p;
    case 'notPos': return at(c.a) !== c.p;
    case 'between': { const a = at(c.a), b = at(c.b), d = at(c.c); return (b < a && a < d) || (d < a && a < b); }
  }
}

function permutations(n: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [], used = Array(n).fill(false);
  const rec = () => {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(i); rec(); cur.pop(); used[i] = false; }
  };
  rec();
  return out;
}
const PERMS = new Map<number, number[][]>();
const permsOf = (n: number) => { if (!PERMS.has(n)) PERMS.set(n, permutations(n)); return PERMS.get(n)!; };

export function orders(n: number, clues: ShelfClue[], limit: number): number[][] {
  const out: number[][] = [];
  for (const o of permsOf(n)) { if (clues.every((c) => holds(c, o))) { out.push(o); if (out.length >= limit) break; } }
  return out;
}

const WEIGHT: Record<ShelfClue['k'], number> = { pos: 1, end: 2, left: 3, next: 3, notPos: 4, notNext: 5, between: 6 };

export class ShelfFamily implements PuzzleFamily<ShelfPuzzle, ShelfState, ShelfParams, number[]> {
  readonly id = 'shelf';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([30, 42, 54, 66, 80]);

  generate(params: ShelfParams, rng: SeededRNG): ShelfPuzzle | null {
    const n = Math.max(3, Math.min(7, params.n));
    const kinds = params.kinds ?? [...SHELF_KINDS];
    const items = rng.shuffled([...Array(SHELF_ITEMS).keys()]).slice(0, n);
    const sol = rng.shuffled([...Array(n).keys()]);
    // A pool of true clues, drawn at random.
    const pool: ShelfClue[] = [];
    for (let tries = 0; tries < 200 && pool.length < 40; tries++) {
      const k = kinds[rng.below(kinds.length)];
      const a = rng.below(n); let b = rng.below(n); if (b === a) b = (a + 1) % n; let c = rng.below(n); if (c === a || c === b) c = [...Array(n).keys()].find((x) => x !== a && x !== b)!;
      const clue: ShelfClue = k === 'end' ? { k, a } : k === 'pos' || k === 'notPos' ? { k, a, p: k === 'pos' ? sol.indexOf(a) : (sol.indexOf(a) + 1 + rng.below(n - 1)) % n } : k === 'between' ? { k, a, b, c } : { k, a, b };
      if (holds(clue, sol) && !pool.some((x) => JSON.stringify(x) === JSON.stringify(clue))) pool.push(clue);
    }
    const clues: ShelfClue[] = [];
    for (const c of pool) {
      if (orders(n, clues, 2).length === 1) break;
      clues.push(c);
    }
    if (orders(n, clues, 2).length !== 1) return null;
    // Drop the clues that say nothing new.
    for (let i = clues.length - 1; i >= 0; i--) {
      const rest = clues.filter((_, j) => j !== i);
      if (orders(n, rest, 2).length === 1) clues.splice(i, 1);
    }
    if (clues.filter((c) => c.k === 'pos').length > Math.floor(n / 2)) return null;
    // Starting order: the objects as found, never already right.
    let start = rng.shuffled([...Array(n).keys()]);
    if (start.every((v, i) => v === sol[i])) start = [...start.slice(1), start[0]];
    return { items, clues, start };
  }
  solve(p: ShelfPuzzle, limit: number): SolveReport<number[]> {
    const sols = orders(p.items.length, p.clues, limit);
    return { solutionCount: sols.length, solutions: sols, trace: [], humanSolvable: true, searchNodes: permsOf(p.items.length).length };
  }
  initialState(p: ShelfPuzzle): ShelfState { return { order: p.start.slice() }; }
  stateApplying(sol: number[]): ShelfState { return { order: sol.slice() }; }
  validate(p: ShelfPuzzle, s: ShelfState): ValidationResult {
    const bad = p.clues.findIndex((c) => !holds(c, s.order));
    if (bad < 0) return CORRECT;
    return { kind: 'invalid', issues: [{ cells: [cell(bad, -1)], message: tpl('shelf.wrong', [String(bad + 1)]) }] };
  }
  rate(p: ShelfPuzzle): number {
    const w = p.clues.reduce((s, c) => s + WEIGHT[c.k], 0);
    return clampScore(p.items.length * 9 + w * 1.5 - 20);
  }
  hint(p: ShelfPuzzle, s: ShelfState, level: HintLevel): Hint<ShelfState> | null {
    const sol = orders(p.items.length, p.clues, 1)[0];
    const slot = sol.findIndex((v, i) => s.order[i] !== v);
    if (slot < 0) return null;
    const item = sol[slot];
    if (level === HintLevel.Whisper) {
      const pin = p.clues.findIndex((c) => c.k === 'pos' || c.k === 'end');
      return { level, text: pin >= 0 ? tpl('shelf.hint.whisper.clue', [String(pin + 1)]) : tpl('shelf.hint.whisper'), focus: pin >= 0 ? [cell(pin, -1)] : [] };
    }
    if (level === HintLevel.Lead) return { level, text: tpl('shelf.hint.lead', [String(slot + 1)]), focus: [cell(-1, slot)] };
    if (level === HintLevel.Insight) {
      const order = s.order.slice(), from = order.indexOf(item);
      [order[slot], order[from]] = [order[from], order[slot]];
      return { level, text: tpl('shelf.hint.insight', [`shelf.item.${p.items[item]}`, String(slot + 1)]), focus: [cell(-1, slot)], resultingState: { order } };
    }
    return { level, text: tpl('shelf.hint.solution'), focus: [], resultingState: { order: sol.slice() } };
  }
  fingerprint(p: ShelfPuzzle): string { return `shelf:${p.items.join(',')}:${JSON.stringify(p.clues)}:${p.start.join('')}`; }
  parse(raw: unknown): ShelfPuzzle | null {
    const o = raw as Partial<ShelfPuzzle> | null;
    if (!o || !Array.isArray(o.items) || o.items.length < 3 || o.items.length > 7) return null;
    const n = o.items.length;
    const int = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
    if (!o.items.every((v) => int(v, 0, SHELF_ITEMS - 1)) || new Set(o.items).size !== n) return null;
    if (!Array.isArray(o.start) || o.start.length !== n || new Set(o.start).size !== n || !o.start.every((v) => int(v, 0, n - 1))) return null;
    if (!Array.isArray(o.clues) || !o.clues.length || o.clues.length > 20) return null;
    for (const c of o.clues as ShelfClue[]) {
      if (!c || !SHELF_KINDS.includes(c.k) || !int(c.a, 0, n - 1)) return null;
      if ('b' in c && !int(c.b, 0, n - 1)) return null;
      if ('c' in c && !int(c.c, 0, n - 1)) return null;
      if ('p' in c && !int(c.p, 0, n - 1)) return null;
    }
    return { items: o.items.slice(), clues: (o.clues as ShelfClue[]).map((c) => ({ ...c })), start: o.start.slice() };
  }
  equals(a: ShelfPuzzle, b: ShelfPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
