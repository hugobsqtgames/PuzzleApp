/**
 * Motifs — which piece completes the 3×3 table (GAME_DESIGN § 5.9).
 *
 * Each cell has five attributes (shape, count, fill, size, rotation). Each
 * attribute follows a rule by row: constant everywhere, constant per row,
 * constant per column, progression along the row, or distribution (each row
 * holds the same three values). The rules are inferred from the first two
 * rows; the puzzle is accepted only if, for every attribute, all the rules
 * that fit the first two rows predict the same missing value (no
 * ambiguity), and if no distractor matches every prediction.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export const ATTRIBUTES = ['shape', 'count', 'fill', 'size', 'rotation'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export const DOMAIN: Record<Attribute, number> = { shape: 4, count: 3, fill: 3, size: 3, rotation: 4 };
export type Cell = Record<Attribute, number>;
export type RuleKind = 'constant' | 'row' | 'column' | 'progression' | 'distribution';

export interface PatternsPuzzle {
  /** 8 cells in reading order; the 9th (bottom right) is missing. */
  cells: Cell[];
  options: Cell[];
  answer: number;
  /** Rule per attribute, for hints. */
  rules: Record<Attribute, RuleKind>;
}
export interface PatternsState { selected: number | null; ruledOut: number[] }
export interface PatternsParams { active: 1 | 2 | 3; distribution?: boolean }

const same = (a: Cell, b: Cell) => ATTRIBUTES.every((k) => a[k] === b[k]);
const mod = (v: number, d: number) => ((v % d) + d) % d;

/** Every value the missing cell may take for one attribute, over all rules that fit the 8 known cells. */
export function predictions(cells: Cell[], attr: Attribute): Map<number, RuleKind[]> {
  const v = (r: number, c: number) => cells[r * 3 + c][attr];
  const D = DOMAIN[attr];
  const out = new Map<number, RuleKind[]>();
  const add = (val: number, k: RuleKind) => out.set(val, [...(out.get(val) ?? []), k]);
  const all = cells.map((x) => x[attr]);
  if (all.every((x) => x === all[0])) add(all[0], 'constant');
  const rowConst = [0, 1].every((r) => v(r, 0) === v(r, 1) && v(r, 1) === v(r, 2)) && v(2, 0) === v(2, 1);
  if (rowConst && !(all.every((x) => x === all[0]))) add(v(2, 0), 'row');
  const colConst = [0, 1, 2].every((c) => v(0, c) === v(1, c)) && v(0, 2) === v(1, 2) && v(2, 0) === v(0, 0) && v(2, 1) === v(0, 1);
  if (colConst && !(all.every((x) => x === all[0]))) add(v(0, 2), 'column');
  // Progression: +d (mod D) along each row, same d everywhere, d ≠ 0.
  for (let d = 1; d < D; d++) {
    if ([0, 1].every((r) => mod(v(r, 1) - v(r, 0), D) === d && mod(v(r, 2) - v(r, 1), D) === d) && mod(v(2, 1) - v(2, 0), D) === d) add(mod(v(2, 1) + d, D), 'progression');
  }
  // Distribution: rows 1 and 2 are permutations of the same three distinct values.
  const s0 = [v(0, 0), v(0, 1), v(0, 2)], s1 = [v(1, 0), v(1, 1), v(1, 2)];
  const set = new Set(s0);
  if (set.size === 3 && s1.every((x) => set.has(x)) && new Set(s1).size === 3 && s0.join() !== s1.join()) {
    const rest = [...set].filter((x) => x !== v(2, 0) && x !== v(2, 1));
    if (rest.length === 1 && v(2, 0) !== v(2, 1)) add(rest[0], 'distribution');
  }
  return out;
}

/** The unique answer the table implies, or null if some attribute is ambiguous or unexplained. */
export function impliedAnswer(cells: Cell[]): Cell | null {
  const out = {} as Cell;
  for (const a of ATTRIBUTES) {
    const p = predictions(cells, a);
    if (p.size !== 1) return null;
    out[a] = [...p.keys()][0];
  }
  return out;
}

function fillRule(rule: RuleKind, D: number, rng: SeededRNG): number[] {
  const g = Array(9).fill(0);
  if (rule === 'constant') { const x = rng.below(D); g.fill(x); }
  if (rule === 'row') { const xs = rng.shuffled(Array.from({ length: D }, (_, i) => i)); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r * 3 + c] = xs[r % D]; }
  if (rule === 'column') { const xs = rng.shuffled(Array.from({ length: D }, (_, i) => i)); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r * 3 + c] = xs[c % D]; }
  if (rule === 'progression') {
    const d = D === 3 ? 1 : rng.pick([1, D - 1]);
    for (let r = 0; r < 3; r++) { const s = rng.below(D); for (let c = 0; c < 3; c++) g[r * 3 + c] = mod(s + d * c, D); }
  }
  if (rule === 'distribution') {
    const vals = rng.shuffled(Array.from({ length: D }, (_, i) => i)).slice(0, 3);
    const perms = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    const order = rng.shuffled(perms);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r * 3 + c] = vals[order[r][c]];
  }
  return g;
}

export class PatternsFamily implements PuzzleFamily<PatternsPuzzle, PatternsState, PatternsParams, number> {
  readonly id = 'patterns';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: PatternsParams, rng: SeededRNG): PatternsPuzzle | null {
    let active: Attribute[] = rng.shuffled([...ATTRIBUTES]).slice(0, params.active);
    // Rotation only reads on the triangle: it never varies together with the shape.
    if (active.includes('rotation') && active.includes('shape')) {
      const spare = ATTRIBUTES.filter((a) => !active.includes(a) && a !== 'rotation');
      active = [...active.filter((a) => a !== 'rotation'), ...(spare.length ? [rng.pick(spare)] : [])];
    }
    const rules = {} as Record<Attribute, RuleKind>;
    for (const a of ATTRIBUTES) {
      if (!active.includes(a)) { rules[a] = 'constant'; continue; }
      const choices: RuleKind[] = params.distribution ? ['distribution', 'progression', 'row', 'column'] : ['progression', 'row', 'column'];
      rules[a] = rng.pick(choices);
    }
    const grids = Object.fromEntries(ATTRIBUTES.map((a) => [a, fillRule(rules[a], DOMAIN[a], rng)])) as Record<Attribute, number[]>;
    if (rules.rotation !== 'constant') grids.shape = Array(9).fill(1); // triangles
    const full: Cell[] = Array.from({ length: 9 }, (_, i) => Object.fromEntries(ATTRIBUTES.map((a) => [a, grids[a][i]])) as Cell);
    const cells = full.slice(0, 8), answer = full[8];
    const implied = impliedAnswer(cells);
    if (!implied || !same(implied, answer)) return null;
    // Distractors: the answer with one attribute changed (mostly), some with two.
    const pool: Cell[] = [];
    for (const a of ATTRIBUTES) for (let d = 1; d < DOMAIN[a]; d++) pool.push({ ...answer, [a]: mod(answer[a] + d, DOMAIN[a]) });
    const near = rng.shuffled(pool.filter((c) => active.includes((ATTRIBUTES.find((a) => c[a] !== answer[a]))!)));
    const far = rng.shuffled(pool);
    const picks: Cell[] = [];
    for (const c of [...near, ...far]) {
      if (picks.length >= 5) break;
      if (!picks.some((p) => same(p, c)) && !same(c, answer)) picks.push(c);
    }
    if (picks.length < 5) return null;
    const options = rng.shuffled([answer, ...picks]);
    return { cells, options, answer: options.findIndex((o) => same(o, answer)), rules };
  }

  solve(p: PatternsPuzzle, limit: number): SolveReport<number> {
    const implied = impliedAnswer(p.cells);
    const right = implied ? p.options.map((o, i) => (same(o, implied) ? i : -1)).filter((i) => i >= 0) : [];
    return { solutionCount: Math.min(limit, right.length), solutions: right.slice(0, limit), trace: [], humanSolvable: true, searchNodes: 0 };
  }

  initialState(): PatternsState { return { selected: null, ruledOut: [] }; }
  stateApplying(solution: number): PatternsState { return { selected: solution, ruledOut: [] }; }

  validate(p: PatternsPuzzle, s: PatternsState): ValidationResult {
    if (s.selected === null) return INCOMPLETE;
    if (s.selected === p.answer) return CORRECT;
    const o = p.options[s.selected], a = p.options[p.answer];
    const wrong = ATTRIBUTES.find((k) => o[k] !== a[k])!;
    return { kind: 'invalid', issues: [{ cells: [], message: tpl('patterns.error.wrong', [`patterns.attr.${wrong}`]) }] };
  }

  rate(p: PatternsPuzzle): number {
    const active = ATTRIBUTES.filter((a) => p.rules[a] !== 'constant');
    const weight: Record<RuleKind, number> = { constant: 0, row: 6, column: 6, progression: 10, distribution: 16 };
    const answer = p.options[p.answer];
    const close = p.options.filter((o, i) => i !== p.answer && ATTRIBUTES.filter((k) => o[k] !== answer[k]).length === 1).length;
    return clampScore(active.length * 12 + active.reduce((s, a) => s + weight[p.rules[a]], 0) + close * 2 - 6);
  }

  hint(p: PatternsPuzzle, s: PatternsState, level: HintLevel): Hint<PatternsState> | null {
    if (s.selected === p.answer) return null;
    const active = ATTRIBUTES.filter((a) => p.rules[a] !== 'constant');
    const a = active[0] ?? 'shape';
    const answer = p.options[p.answer];
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('patterns.hint.whisper', [`patterns.attr.${a}`]), focus: [] };
      case HintLevel.Lead: return { level, text: tpl(`patterns.hint.lead.${p.rules[a]}`, [`patterns.attr.${a}`]), focus: [] };
      case HintLevel.Insight: {
        // Rule out every option that breaks the first active attribute.
        const ruledOut = p.options.map((o, i) => (o[a] !== answer[a] ? i : -1)).filter((i) => i >= 0);
        return { level, text: tpl('patterns.hint.insight', [`patterns.attr.${a}`, `patterns.value.${a}.${answer[a]}`]), focus: [], resultingState: { selected: s.selected !== null && ruledOut.includes(s.selected) ? null : s.selected, ruledOut: [...new Set([...s.ruledOut, ...ruledOut])] } };
      }
      case HintLevel.Solution: return { level, text: tpl('patterns.hint.solution'), focus: [], resultingState: { selected: p.answer, ruledOut: s.ruledOut } };
    }
  }

  fingerprint(p: PatternsPuzzle): string {
    const key = (c: Cell) => ATTRIBUTES.map((a) => c[a]).join('');
    return p.cells.map(key).join('.') + '|' + p.options.map(key).sort().join('.');
  }

  parse(raw: unknown): PatternsPuzzle | null {
    const o = raw as Partial<PatternsPuzzle> | null;
    const cellOk = (c: unknown): c is Cell => !!c && typeof c === 'object' && ATTRIBUTES.every((a) => Number.isInteger((c as Cell)[a]) && (c as Cell)[a] >= 0 && (c as Cell)[a] < DOMAIN[a]);
    if (!o || !Array.isArray(o.cells) || o.cells.length !== 8 || !o.cells.every(cellOk) || !Array.isArray(o.options) || o.options.length < 2 || !o.options.every(cellOk)) return null;
    if (typeof o.answer !== 'number' || o.answer < 0 || o.answer >= o.options.length || !o.rules) return null;
    const kinds: RuleKind[] = ['constant', 'row', 'column', 'progression', 'distribution'];
    if (!ATTRIBUTES.every((a) => kinds.includes((o.rules as Record<string, RuleKind>)[a]))) return null;
    return { cells: o.cells.map((c) => ({ ...c })), options: o.options.map((c) => ({ ...c })), answer: o.answer, rules: { ...(o.rules as Record<Attribute, RuleKind>) } };
  }

  equals(a: PatternsPuzzle, b: PatternsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b) && a.answer === b.answer; }
}
