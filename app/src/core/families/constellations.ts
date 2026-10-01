/**
 * Constellations — the Observatory's sky is cut into n constellations. Put one
 * star in each row, each column and each constellation. Two stars never
 * touch, not even by a corner.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, DeductionStep, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface ConstellationsPuzzle { n: number; regions: number[] }
/** 0 = not decided, 1 = star, 2 = marked empty (a dot). */
export interface ConstellationsState { cells: number[] }
export interface ConstellationsParams { n: number }

const around = (n: number, i: number) => {
  const r = Math.floor(i / n), c = i % n, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const y = r + dr, x = c + dc;
    if (y >= 0 && x >= 0 && y < n && x < n) out.push(y * n + x);
  }
  return out;
};
const side = (n: number, i: number) => around(n, i).filter((j) => Math.floor(j / n) === Math.floor(i / n) || j % n === i % n);

type UnitKind = 'row' | 'col' | 'region';
interface Unit { kind: UnitKind; k: number; cells: number[] }
export function unitsOf(p: ConstellationsPuzzle): Unit[] {
  const { n } = p, out: Unit[] = [];
  for (let k = 0; k < n; k++) out.push({ kind: 'row', k, cells: [...Array(n)].map((_, c) => k * n + c) });
  for (let k = 0; k < n; k++) out.push({ kind: 'col', k, cells: [...Array(n)].map((_, r) => r * n + k) });
  for (let k = 0; k < n; k++) out.push({ kind: 'region', k, cells: p.regions.map((g, i) => (g === k ? i : -1)).filter((i) => i >= 0) });
  return out;
}

/** Every answer (up to `limit`): one star per row, in order. */
export function solveConstellations(p: ConstellationsPuzzle, limit: number): { solutions: number[][]; nodes: number } {
  const { n } = p, colUsed = new Array(n).fill(false), regUsed = new Array(n).fill(false), pick: number[] = [], out: number[][] = [];
  let nodes = 0;
  const rec = (r: number) => {
    if (out.length >= limit || nodes > 400_000) return;
    nodes++;
    if (r === n) { out.push(pick.map((c, row) => row * n + c)); return; }
    for (let c = 0; c < n; c++) {
      const g = p.regions[r * n + c];
      if (colUsed[c] || regUsed[g] || (r > 0 && Math.abs(pick[r - 1] - c) <= 1)) continue;
      colUsed[c] = regUsed[g] = true; pick.push(c);
      rec(r + 1);
      colUsed[c] = regUsed[g] = false; pick.pop();
      if (out.length >= limit) return;
    }
  };
  rec(0);
  return { solutions: out, nodes };
}

/** The cells a star at i rules out: its row, column, constellation and neighbours. */
const shadow = (p: ConstellationsPuzzle, i: number) => {
  const { n } = p, r = Math.floor(i / n), c = i % n, out = new Set<number>(around(n, i));
  for (let k = 0; k < n; k++) { out.add(r * n + k); out.add(k * n + c); }
  p.regions.forEach((g, j) => { if (g === p.regions[i]) out.add(j); });
  out.delete(i);
  return out;
};

export interface Step { rank: number; technique: string; place?: number; remove?: number[]; unit?: number[] }

/**
 * The simplest deduction left, from the stars placed and the cells still open
 * (`open[i]`: could still hold a star). Null when stuck (or done).
 */
export function nextStep(p: ConstellationsPuzzle, star: boolean[], open: boolean[]): Step | null {
  const units = unitsOf(p);
  // 1. Around a star, along its row, column and constellation: nothing.
  for (let i = 0; i < star.length; i++) if (star[i]) {
    const gone = [...shadow(p, i)].filter((j) => open[j]);
    if (gone.length) return { rank: 1, technique: 'shadow', remove: gone, unit: [i] };
  }
  // 1. A row, column or constellation with one place left.
  for (const u of units) {
    if (u.cells.some((i) => star[i])) continue;
    const left = u.cells.filter((i) => open[i]);
    if (left.length === 1) return { rank: 1, technique: `single.${u.kind}`, place: left[0], unit: u.cells };
  }
  // 2. A constellation held in one row (or column): the rest of that row is empty; and the other way round.
  for (const u of units) {
    if (u.cells.some((i) => star[i])) continue;
    const left = u.cells.filter((i) => open[i]);
    if (!left.length) continue;
    for (const v of units) {
      if (v.kind === u.kind || (u.kind !== 'region' && v.kind !== 'region')) continue;
      if (!left.every((i) => v.cells.includes(i))) continue;
      const gone = v.cells.filter((i) => open[i] && !u.cells.includes(i));
      if (gone.length) return { rank: 2, technique: u.kind === 'region' ? 'confined.region' : 'confined.line', remove: gone, unit: left };
    }
  }
  // 3. A star here would leave some row, column or constellation without any place.
  for (let i = 0; i < open.length; i++) if (open[i]) {
    const sh = shadow(p, i);
    for (const u of units) {
      if (u.cells.includes(i) || u.cells.some((j) => star[j])) continue;
      const left = u.cells.filter((j) => open[j]);
      if (left.length && left.every((j) => sh.has(j))) return { rank: 3, technique: 'starve', remove: [i], unit: left };
    }
  }
  // 4. Two (or three) constellations held in as many rows or columns: those lines belong to them.
  const regions = units.filter((u) => u.kind === 'region' && !u.cells.some((i) => star[i]));
  for (const line of ['row', 'col'] as const) {
    const lineOf = (i: number) => (line === 'row' ? Math.floor(i / p.n) : i % p.n);
    const spans = regions.map((u) => ({ u, lines: [...new Set(u.cells.filter((i) => open[i]).map(lineOf))] }));
    for (const size of [2, 3]) {
      const pool = spans.filter((s) => s.lines.length && s.lines.length <= size);
      const choose = (from: number, picked: typeof pool): Step | null => {
        if (picked.length === size) {
          const lines = new Set(picked.flatMap((s) => s.lines));
          if (lines.size !== size) return null;
          const mine = new Set(picked.flatMap((s) => s.u.cells));
          const gone = open.map((o, i) => (o && lines.has(lineOf(i)) && !mine.has(i) ? i : -1)).filter((i) => i >= 0);
          return gone.length ? { rank: 4, technique: `group.${line}`, remove: gone, unit: [...mine].filter((i) => open[i]) } : null;
        }
        for (let k = from; k < pool.length; k++) { const s = choose(k + 1, [...picked, pool[k]]); if (s) return s; }
        return null;
      };
      const s = choose(0, []);
      if (s) return s;
    }
  }
  return null;
}

/** Solves by deduction alone; the trace says how hard it was. */
export function deduce(p: ConstellationsPuzzle): { trace: DeductionStep[]; solved: boolean } {
  const star = new Array(p.n * p.n).fill(false), open = new Array(p.n * p.n).fill(true), trace: DeductionStep[] = [];
  const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
  for (let guard = 0; guard < 400; guard++) {
    const s = nextStep(p, star, open);
    if (!s) break;
    if (s.place !== undefined) { star[s.place] = true; open[s.place] = false; }
    for (const i of s.remove ?? []) open[i] = false;
    trace.push({ techniqueRank: s.rank, technique: s.technique, focus: [...(s.remove ?? []), ...(s.place !== undefined ? [s.place] : [])].map(at), explanation: tpl(`constellations.step.${s.technique}`) });
  }
  return { trace, solved: star.filter(Boolean).length === p.n };
}

export class ConstellationsFamily implements PuzzleFamily<ConstellationsPuzzle, ConstellationsState, ConstellationsParams, number[]> {
  readonly id = 'constellations';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: ConstellationsParams, rng: SeededRNG): ConstellationsPuzzle | null {
    const { n } = params;
    // The answer first: one star per row and column, never touching.
    const cols: number[] = [], used = new Array(n).fill(false);
    const place = (r: number): boolean => {
      if (r === n) return true;
      for (const c of rng.shuffled([...Array(n).keys()])) {
        if (used[c] || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
        used[c] = true; cols.push(c);
        if (place(r + 1)) return true;
        used[c] = false; cols.pop();
      }
      return false;
    };
    if (!place(0)) return null;
    const stars = cols.map((c, r) => r * n + c);
    // Then the constellations grow around their stars.
    const regions = new Array(n * n).fill(-1);
    stars.forEach((s, k) => { regions[s] = k; });
    for (let left = n * n - n; left > 0;) {
      const edge: [number, number][] = [];
      regions.forEach((g, i) => { if (g < 0) for (const j of side(n, i)) if (regions[j] >= 0) edge.push([i, regions[j]]); });
      const [i, g] = rng.pick(edge);
      regions[i] = g; left--;
    }
    const p: ConstellationsPuzzle = { n, regions };
    const truth = new Set(stars);
    // Then mend it: while another answer exists, move one of its stars into a neighbouring constellation.
    for (let round = 0; round < 60; round++) {
      const sols = solveConstellations(p, 2).solutions;
      const other = sols.find((s) => s.some((i) => !truth.has(i)));
      if (!other) return sols.length === 1 ? p : null;
      const movable = rng.shuffled(other.filter((i) => !truth.has(i)));
      let moved = false;
      for (const i of movable) {
        const from = p.regions[i];
        const rest = p.regions.map((g, j) => (g === from && j !== i ? j : -1)).filter((j) => j >= 0);
        if (!connected(n, rest)) continue;
        const to = rng.shuffled(side(n, i).map((j) => p.regions[j]).filter((g) => g !== from));
        if (!to.length) continue;
        p.regions[i] = to[0]; moved = true; break;
      }
      if (!moved) return null;
    }
    return null;
  }

  solve(p: ConstellationsPuzzle, limit: number): SolveReport<number[]> {
    const r = solveConstellations(p, limit), d = deduce(p);
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: d.trace, humanSolvable: d.solved, searchNodes: r.nodes };
  }

  initialState(p: ConstellationsPuzzle): ConstellationsState { return { cells: new Array(p.n * p.n).fill(0) }; }
  stateApplying(sol: number[], p: ConstellationsPuzzle): ConstellationsState {
    const s = new Set(sol);
    return { cells: [...Array(p.n * p.n)].map((_, i) => (s.has(i) ? 1 : 2)) };
  }

  validate(p: ConstellationsPuzzle, s: ConstellationsState): ValidationResult {
    const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
    const stars = s.cells.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0), set = new Set(stars);
    for (const f of stars) {
      const touch = around(p.n, f).find((x) => set.has(x));
      if (touch !== undefined) return { kind: 'invalid', issues: [{ cells: [at(f), at(touch)], message: tpl('constellations.error.touch') }] };
    }
    for (const u of unitsOf(p)) {
      const mine = u.cells.filter((i) => set.has(i));
      if (mine.length > 1) return { kind: 'invalid', issues: [{ cells: mine.map(at), message: tpl(`constellations.error.${u.kind}`, [String(u.k + 1)]) }] };
    }
    return stars.length === p.n ? CORRECT : INCOMPLETE;
  }

  rate(p: ConstellationsPuzzle, report: SolveReport<number[]>): number {
    const rank = report.trace.reduce((m, s) => Math.max(m, s.techniqueRank), 0);
    const hard = report.trace.filter((s) => s.techniqueRank >= 3).length;
    return clampScore((p.n - 5) * 13 + (rank - 1) * 9 + hard * 2 + (report.humanSolvable ? 0 : 30) + 5);
  }

  hint(p: ConstellationsPuzzle, s: ConstellationsState, level: HintLevel): Hint<ConstellationsState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const sol = new Set(solveConstellations(p, 1).solutions[0]);
    const at = (i: number) => cell(Math.floor(i / p.n), i % p.n);
    const answer = this.stateApplying([...sol], p);
    if (level === HintLevel.Solution) return { level, text: tpl('constellations.hint.solution'), focus: [], resultingState: answer };
    const wrong = s.cells.findIndex((v, i) => (v === 1 && !sol.has(i)) || (v === 2 && sol.has(i)));
    if (wrong >= 0) {
      const cells = s.cells.slice(); cells[wrong] = 0;
      return { level, text: tpl('constellations.hint.mistake'), focus: [at(wrong)], resultingState: level === HintLevel.Insight ? { cells } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('constellations.hint.whisper'), focus: [] };
    const star = s.cells.map((v) => v === 1), open = s.cells.map((v) => v === 0);
    const step = nextStep(p, star, open);
    if (step) {
      const focus = (step.place !== undefined ? [step.place] : step.remove ?? []).map(at);
      if (level === HintLevel.Lead) return { level, text: tpl(`constellations.hint.${step.technique}`), focus };
      const cells = s.cells.slice();
      if (step.place !== undefined) cells[step.place] = 1;
      for (const i of step.remove ?? []) cells[i] = 2;
      return { level, text: tpl(`constellations.hint.${step.technique}.insight`), focus, resultingState: { cells } };
    }
    const next = [...sol].find((i) => s.cells[i] === 0);
    if (next === undefined) return { level, text: tpl('constellations.hint.solution'), focus: [], resultingState: answer };
    if (level === HintLevel.Lead) return { level, text: tpl('constellations.hint.lead'), focus: [at(next)] };
    const cells = s.cells.slice(); cells[next] = 1;
    return { level, text: tpl('constellations.hint.insight'), focus: [at(next)], resultingState: { cells } };
  }

  fingerprint(p: ConstellationsPuzzle): string { return `constellations:${p.n}:${p.regions.join('')}`; }
  parse(raw: unknown): ConstellationsPuzzle | null {
    const o = raw as Partial<ConstellationsPuzzle> | null;
    if (!o || !Number.isInteger(o.n)) return null;
    const n = o.n as number;
    if (n < 4 || n > 10) return null;
    if (!Array.isArray(o.regions) || o.regions.length !== n * n || !o.regions.every((g) => Number.isInteger(g) && g >= 0 && g < n)) return null;
    if (new Set(o.regions).size !== n) return null;
    return { n, regions: o.regions.slice() };
  }
  equals(a: ConstellationsPuzzle, b: ConstellationsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}

/** Are these cells one piece (side by side)? */
function connected(n: number, cells: number[]): boolean {
  if (!cells.length) return false;
  const all = new Set(cells), seen = new Set([cells[0]]), stack = [cells[0]];
  while (stack.length) for (const j of side(n, stack.pop()!)) if (all.has(j) && !seen.has(j)) { seen.add(j); stack.push(j); }
  return seen.size === all.size;
}
