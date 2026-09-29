/**
 * Balances — trouver le poids d'un objet à partir de balances en équilibre
 * (GAME_DESIGN § 5.8). Poids entiers aléatoires → balances construites en
 * combinant les objets → acceptation seulement si : un seul jeu de poids
 * est possible (énumération exhaustive), chaque balance est nécessaire,
 * l'objet demandé n'est jamais seul face à un poids connu, et la résolution
 * « humaine » (substitutions successives) aboutit.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, DeductionStep, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export const SHAPES = ['circle', 'triangle', 'square', 'diamond'] as const;
export type Shape = (typeof SHAPES)[number];
/** An item on a pan: an object (index into `shapes`) or a known weight. */
export type PanItem = { shape: number } | { weight: number };
export interface Balance { left: PanItem[]; right: PanItem[] }
export interface ScalesPuzzle { shapes: Shape[]; balances: Balance[]; question: number; maxWeight: number }
export interface ScalesState { entry: string }
export interface ScalesParams { unknowns: 2 | 3 | 4; maxWeight: number; knownWeights?: number }

const isShape = (i: PanItem): i is { shape: number } => 'shape' in i;

/** Coefficients (per shape) and constant: Σ left − Σ right = 0 ⇔ Σ c·w + k = 0. */
function equation(b: Balance, n: number): { c: number[]; k: number } {
  const c = Array(n).fill(0);
  let k = 0;
  for (const it of b.left) if (isShape(it)) c[it.shape]++; else k += it.weight;
  for (const it of b.right) if (isShape(it)) c[it.shape]--; else k -= it.weight;
  return { c, k };
}

const holds = (b: Balance, w: readonly number[]) => {
  const { c, k } = equation(b, w.length);
  return c.reduce((s, ci, i) => s + ci * w[i], k) === 0;
};

/** All weight assignments (1…max) satisfying every balance, up to `limit`. */
export function assignments(p: Pick<ScalesPuzzle, 'shapes' | 'balances' | 'maxWeight'>, limit: number): number[][] {
  const n = p.shapes.length, out: number[][] = [], w = Array(n).fill(1);
  const rec = (i: number) => {
    if (out.length >= limit) return;
    if (i === n) { if (p.balances.every((b) => holds(b, w))) out.push(w.slice()); return; }
    for (let v = 1; v <= p.maxWeight; v++) { w[i] = v; rec(i + 1); }
  };
  rec(0);
  return out;
}

/** Human-style deduction: one-unknown balances, then pairs of balances sharing two unknowns. */
export function deduce(p: ScalesPuzzle): { order: { shape: number; value: number; from: number[] }[]; complete: boolean; combos: number } {
  const n = p.shapes.length, known = new Map<number, number>(), eqs = p.balances.map((b) => equation(b, n));
  const order: { shape: number; value: number; from: number[] }[] = [];
  let combos = 0;
  const reduce = (e: { c: number[]; k: number }) => {
    let k = e.k;
    const c = e.c.map((ci, i) => { if (known.has(i)) { k += ci * known.get(i)!; return 0; } return ci; });
    return { c, k, unknown: c.map((ci, i) => (ci !== 0 ? i : -1)).filter((i) => i >= 0) };
  };
  for (let guard = 0; guard < 20 && known.size < n; guard++) {
    let progress = false;
    for (let bi = 0; bi < eqs.length; bi++) {
      const r = reduce(eqs[bi]);
      if (r.unknown.length !== 1) continue;
      const s = r.unknown[0], v = -r.k / r.c[s];
      if (!Number.isInteger(v) || v <= 0) return { order, complete: false, combos };
      known.set(s, v); order.push({ shape: s, value: v, from: [bi] }); progress = true;
    }
    if (progress) continue;
    // Pair of balances with the same two unknowns: substitute one into the other.
    outer: for (let i = 0; i < eqs.length; i++) for (let j = i + 1; j < eqs.length; j++) {
      const a = reduce(eqs[i]), b = reduce(eqs[j]);
      if (a.unknown.length !== 2 || b.unknown.length !== 2 || a.unknown.some((u, x) => u !== b.unknown[x])) continue;
      const [x, y] = a.unknown;
      const det = a.c[x] * b.c[y] - a.c[y] * b.c[x];
      if (det === 0) continue;
      const vx = (-a.k * b.c[y] + b.k * a.c[y]) / det;
      if (!Number.isInteger(vx) || vx <= 0) continue;
      known.set(x, vx); order.push({ shape: x, value: vx, from: [i, j] }); combos++; progress = true;
      break outer;
    }
    if (!progress) break;
  }
  return { order, complete: known.size === n, combos };
}

export class ScalesFamily implements PuzzleFamily<ScalesPuzzle, ScalesState, ScalesParams, number> {
  readonly id = 'scales';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: ScalesParams, rng: SeededRNG): ScalesPuzzle | null {
    const n = params.unknowns, max = params.maxWeight;
    const shapes = rng.shuffled([...SHAPES]).slice(0, n);
    const w = Array.from({ length: n }, () => rng.int(1, Math.min(max, 12 + n * 2)));
    if (new Set(w).size < n) return null;
    const balances: Balance[] = [];
    const knownBudget = params.knownWeights ?? 1;
    let knownUsed = 0;
    const multiset = (size: number, pool: number[]) => Array.from({ length: size }, () => rng.pick(pool));
    for (let tries = 0; tries < 40 && balances.length < n + 1; tries++) {
      const left = multiset(rng.int(1, n >= 3 ? 3 : 2), Array.from({ length: n }, (_, i) => i)).sort();
      const sum = left.reduce((s, i) => s + w[i], 0);
      let right: PanItem[] | null = null;
      if (knownUsed < knownBudget && rng.chance(45, 100)) {
        right = [{ weight: sum }];
      } else {
        // Another multiset of shapes with the same total (search, ≤ 3 items).
        const found: number[][] = [];
        const rec = (start: number, acc: number[], total: number) => {
          if (total === sum && acc.length > 0) { found.push(acc.slice()); return; }
          if (acc.length >= 3 || total >= sum) return;
          for (let i = start; i < n; i++) { acc.push(i); rec(i, acc, total + w[i]); acc.pop(); }
        };
        rec(0, [], 0);
        const candidates = found.filter((f) => f.join() !== left.join() && !f.some((s) => left.includes(s)));
        if (candidates.length) right = rng.pick(candidates).map((shape) => ({ shape }));
        else if (knownUsed < knownBudget) right = [{ weight: sum }];
      }
      if (!right) continue;
      const leftItems: PanItem[] = left.map((shape) => ({ shape }));
      // Never "question alone vs a known weight": that would give the answer away.
      if (left.length === 1 && left[0] === 0 && right.every((r) => !isShape(r))) continue;
      const b: Balance = rng.bool() ? { left: leftItems, right } : { left: right, right: leftItems };
      if (right.some((r) => !isShape(r))) knownUsed++;
      balances.push(b);
      const draft: ScalesPuzzle = { shapes, balances: balances.slice(), question: 0, maxWeight: max };
      if (assignments(draft, 2).length === 1) break;
    }
    const puzzle: ScalesPuzzle = { shapes, balances, question: 0, maxWeight: max };
    if (assignments(puzzle, 2).length !== 1) return null;
    // Every balance must be needed.
    for (let i = 0; i < balances.length; i++) {
      if (assignments({ ...puzzle, balances: balances.filter((_, j) => j !== i) }, 2).length === 1) return null;
    }
    const d = deduce(puzzle);
    if (!d.complete) return null;
    // Ask for the shape found last: it needs the whole chain of reasoning.
    const question = d.order[d.order.length - 1].shape;
    if (balances.some((b) => {
      const sides = [b.left, b.right];
      return sides.some((s, i) => s.length === 1 && isShape(s[0]) && s[0].shape === question && sides[1 - i].every((x) => !isShape(x)));
    })) return null;
    return { ...puzzle, question };
  }

  solve(p: ScalesPuzzle, limit: number): SolveReport<number> {
    const sols = assignments(p, limit);
    const d = deduce(p);
    const trace: DeductionStep[] = d.order.map((o) => ({
      techniqueRank: o.from.length, technique: o.from.length === 1 ? 'direct' : 'substitution', focus: [],
      explanation: tpl('scales.step', [String(o.shape), String(o.value)]),
    }));
    return { solutionCount: sols.length, solutions: sols.map((s) => s[p.question]), trace, humanSolvable: d.complete, searchNodes: p.maxWeight ** p.shapes.length };
  }

  initialState(): ScalesState { return { entry: '' }; }
  stateApplying(solution: number): ScalesState { return { entry: String(solution) }; }

  answer(p: ScalesPuzzle): number | null {
    const sols = assignments(p, 2);
    return sols.length === 1 ? sols[0][p.question] : null;
  }

  validate(p: ScalesPuzzle, s: ScalesState): ValidationResult {
    if (s.entry === '') return INCOMPLETE;
    return Number(s.entry) === this.answer(p) ? CORRECT : { kind: 'invalid', issues: [{ cells: [], message: tpl('scales.error.wrong', [s.entry]) }] };
  }

  rate(p: ScalesPuzzle, report: SolveReport<number>): number {
    const combos = report.trace.filter((t) => t.techniqueRank === 2).length;
    const items = p.balances.reduce((s, b) => s + b.left.length + b.right.length, 0);
    return clampScore((p.shapes.length - 2) * 22 + combos * 12 + items * 1.2 + (p.maxWeight > 20 ? 8 : 0) + 4);
  }

  hint(p: ScalesPuzzle, s: ScalesState, level: HintLevel): Hint<ScalesState> | null {
    const d = deduce(p), ans = this.answer(p);
    if (ans === null || Number(s.entry) === ans) return null;
    const first = d.order[0];
    const shapeKey = (i: number) => `scales.shape.${p.shapes[i]}`;
    switch (level) {
      case HintLevel.Whisper:
        return { level, text: tpl('scales.hint.whisper', first.from.map((b) => String(b + 1))), focus: [] };
      case HintLevel.Lead:
        return { level, text: tpl('scales.hint.lead', [shapeKey(first.shape), first.from.map((b) => String(b + 1)).join(' et ')]), focus: [] };
      case HintLevel.Insight: {
        const step = d.order.length > 1 ? d.order[d.order.length - 2] : first;
        return { level, text: tpl('scales.hint.insight', [shapeKey(step.shape), String(step.value)]), focus: [] };
      }
      case HintLevel.Solution:
        return { level, text: tpl('scales.hint.solution', [shapeKey(p.question), String(ans)]), focus: [], resultingState: { entry: String(ans) } };
    }
  }

  fingerprint(p: ScalesPuzzle): string {
    const side = (items: PanItem[]) => items.map((i) => (isShape(i) ? `s${i.shape}` : `w${i.weight}`)).sort().join('+');
    return `${p.shapes.length}?${p.question}|` + p.balances.map((b) => [side(b.left), side(b.right)].sort().join('=')).sort().join(';');
  }

  parse(raw: unknown): ScalesPuzzle | null {
    const o = raw as Partial<ScalesPuzzle> | null;
    if (!o || !Array.isArray(o.shapes) || !Array.isArray(o.balances) || typeof o.question !== 'number' || typeof o.maxWeight !== 'number') return null;
    const n = o.shapes.length;
    if (n < 1 || n > 4 || !o.shapes.every((s) => (SHAPES as readonly string[]).includes(s)) || o.question < 0 || o.question >= n || o.maxWeight < 1 || o.maxWeight > 60) return null;
    const item = (i: unknown): PanItem | null => {
      const x = i as { shape?: unknown; weight?: unknown } | null;
      if (x && typeof x.shape === 'number' && Number.isInteger(x.shape) && x.shape >= 0 && x.shape < n) return { shape: x.shape };
      if (x && typeof x.weight === 'number' && Number.isInteger(x.weight) && x.weight > 0 && x.weight < 1000) return { weight: x.weight };
      return null;
    };
    const balances: Balance[] = [];
    for (const b of o.balances as unknown[]) {
      const bb = b as { left?: unknown[]; right?: unknown[] } | null;
      if (!bb || !Array.isArray(bb.left) || !Array.isArray(bb.right) || !bb.left.length || !bb.right.length) return null;
      const left = bb.left.map(item), right = bb.right.map(item);
      if (left.includes(null) || right.includes(null)) return null;
      balances.push({ left: left as PanItem[], right: right as PanItem[] });
    }
    return { shapes: o.shapes.slice() as Shape[], balances, question: o.question, maxWeight: o.maxWeight };
  }

  equals(a: ScalesPuzzle, b: ScalesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
