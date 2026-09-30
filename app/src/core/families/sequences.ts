/**
 * Suites — trouver le terme suivant (GAME_DESIGN § 5.1).
 *
 * Une banque de règles, chacune avec une complexité k. Un puzzle est accepté
 * seulement si : la bonne réponse suit une règle de complexité k ; AUCUN
 * distracteur n'est le terme suivant selon une règle de la banque de
 * complexité ≤ k + 1 appliquée aux termes visibles (anti-ambiguïté).
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export type RuleKind =
  | 'add' | 'multiply' | 'addGrowing' | 'addDoubling' | 'fibonacci' | 'squares'
  | 'multiplyAdd' | 'alternate' | 'interleaved' | 'addTripling' | 'cubes';

export interface SequencesPuzzle {
  terms: number[];
  options: number[];
  /** Index of the right option. */
  answer: number;
  rule: { kind: RuleKind; a: number; b: number };
  /** Variant: the terms are letters of the alphabet (1 = A … 26 = Z). */
  letters?: boolean;
}
export interface SequencesState { selected: number | null; ruledOut: number[] }
export interface SequencesParams { complexity: 1 | 2 | 3; length?: number; maxValue?: number; letters?: boolean }

/** Rules that read well with letters: steps through the alphabet, not products. */
const LETTER_KINDS: RuleKind[] = ['add', 'addGrowing', 'alternate', 'interleaved'];
/** How a term is shown: a number, or its letter. */
export const termText = (p: { letters?: boolean }, v: number) => (p.letters ? String.fromCharCode(64 + v) : String(v));

export const RULE_COMPLEXITY: Record<RuleKind, number> = {
  add: 1, multiply: 1, addGrowing: 2, addDoubling: 2, fibonacci: 2, squares: 2,
  multiplyAdd: 3, alternate: 3, interleaved: 3, addTripling: 3, cubes: 3,
};

const gaps = (t: readonly number[]) => t.slice(1).map((v, i) => v - t[i]);
const allEqual = (a: readonly number[]) => a.every((v) => v === a[0]);

/**
 * For each rule kind, the next term if the visible terms follow that rule
 * (with parameters inferred from the terms), else null.
 */
export const EXPLAINERS: Record<RuleKind, (t: readonly number[]) => number | null> = {
  add: (t) => { const g = gaps(t); return allEqual(g) ? t[t.length - 1] + g[0] : null; },
  multiply: (t) => {
    if (t[0] === 0) return null;
    const r = t[1] / t[0];
    if (!Number.isInteger(r) || r < 2) return null;
    return t.every((v, i) => i === 0 || v === t[i - 1] * r) ? t[t.length - 1] * r : null;
  },
  addGrowing: (t) => { const g = gaps(t), gg = gaps(g); return gg.length >= 2 && allEqual(gg) && gg[0] !== 0 ? t[t.length - 1] + g[g.length - 1] + gg[0] : null; },
  addDoubling: (t) => { const g = gaps(t); return g[0] !== 0 && g.every((v, i) => i === 0 || v === g[i - 1] * 2) ? t[t.length - 1] + g[g.length - 1] * 2 : null; },
  addTripling: (t) => { const g = gaps(t); return g[0] !== 0 && g.every((v, i) => i === 0 || v === g[i - 1] * 3) ? t[t.length - 1] + g[g.length - 1] * 3 : null; },
  fibonacci: (t) => (t.length >= 4 && t.every((v, i) => i < 2 || v === t[i - 1] + t[i - 2]) ? t[t.length - 1] + t[t.length - 2] : null),
  squares: (t) => {
    const root = Math.round(Math.sqrt(t[0]));
    if (root * root !== t[0]) return null;
    return t.every((v, i) => v === (root + i) ** 2) ? (root + t.length) ** 2 : null;
  },
  cubes: (t) => {
    const root = Math.round(Math.cbrt(t[0]));
    if (root ** 3 !== t[0]) return null;
    return t.every((v, i) => v === (root + i) ** 3) ? (root + t.length) ** 3 : null;
  },
  multiplyAdd: (t) => {
    // t[i+1] = t[i] * a + b, a in 2..3, b ≠ 0
    for (const a of [2, 3]) {
      const b = t[1] - t[0] * a;
      if (b !== 0 && t.every((v, i) => i === 0 || v === t[i - 1] * a + b)) return t[t.length - 1] * a + b;
    }
    return null;
  },
  alternate: (t) => {
    // Gaps alternate between two different values: +a, +b, +a, +b…
    const g = gaps(t);
    if (g.length < 3 || g[0] === g[1]) return null;
    return g.every((v, i) => v === g[i % 2]) ? t[t.length - 1] + g[g.length % 2] : null;
  },
  interleaved: (t) => {
    // Two arithmetic sequences interleaved (even and odd positions), different steps.
    if (t.length < 5) return null;
    const even = t.filter((_, i) => i % 2 === 0), odd = t.filter((_, i) => i % 2 === 1);
    const ge = gaps(even), go = gaps(odd);
    if (!allEqual(ge) || !allEqual(go) || ge[0] === go[0]) return null;
    return t.length % 2 === 0 ? even[even.length - 1] + ge[0] : odd[odd.length - 1] + go[0];
  },
};

/** Every next term some rule of complexity ≤ k predicts for these terms. */
export function predictions(terms: readonly number[], maxComplexity: number): Set<number> {
  const out = new Set<number>();
  for (const kind of Object.keys(EXPLAINERS) as RuleKind[]) {
    if (RULE_COMPLEXITY[kind] > maxComplexity) continue;
    const v = EXPLAINERS[kind](terms);
    if (v !== null) out.add(v);
  }
  return out;
}

function build(kind: RuleKind, rng: SeededRNG, length: number): { terms: number[]; a: number; b: number } | null {
  const seq: number[] = [];
  let a = 0, b = 0;
  switch (kind) {
    case 'add': { a = rng.int(2, 12); const s = rng.int(1, 20); for (let i = 0; i < length; i++) seq.push(s + a * i); break; }
    case 'multiply': { a = rng.int(2, 3); const s = rng.int(1, 5); for (let i = 0; i < length; i++) seq.push(s * a ** i); break; }
    case 'addGrowing': { const g0 = rng.int(1, 5); b = rng.int(1, 4); a = g0; let v = rng.int(1, 12), g = g0; for (let i = 0; i < length; i++) { seq.push(v); v += g; g += b; } break; }
    case 'addDoubling': { a = rng.int(1, 3); let v = rng.int(1, 10), g = a; for (let i = 0; i < length; i++) { seq.push(v); v += g; g *= 2; } break; }
    case 'addTripling': { a = rng.int(1, 2); let v = rng.int(1, 10), g = a; for (let i = 0; i < length; i++) { seq.push(v); v += g; g *= 3; } break; }
    case 'fibonacci': { let x = rng.int(1, 5), y = rng.int(x, 8); a = x; b = y; for (let i = 0; i < length; i++) { seq.push(x); [x, y] = [y, x + y]; } break; }
    case 'squares': { a = rng.int(1, 6); for (let i = 0; i < length; i++) seq.push((a + i) ** 2); break; }
    case 'cubes': { a = rng.int(1, 3); for (let i = 0; i < length; i++) seq.push((a + i) ** 3); break; }
    case 'multiplyAdd': { a = rng.int(2, 3); b = rng.pick([-1, 1, 2, 3]); let v = rng.int(1, 4); for (let i = 0; i < length; i++) { seq.push(v); v = v * a + b; } break; }
    case 'alternate': { a = rng.int(2, 9); b = rng.int(1, 9); if (a === b) return null; if (rng.bool()) b = -b; let v = rng.int(5, 20); for (let i = 0; i < length; i++) { seq.push(v); v += i % 2 === 0 ? a : b; } break; }
    case 'interleaved': { a = rng.int(2, 6); b = rng.int(2, 9); if (a === b) return null; const s1 = rng.int(1, 10), s2 = rng.int(10, 30); for (let i = 0; i < length; i++) seq.push(i % 2 === 0 ? s1 + a * (i / 2) : s2 - b * ((i - 1) / 2)); break; }
  }
  return { terms: seq, a, b };
}

const SAME_FAMILY_ORDER: RuleKind[] = ['add', 'multiply', 'addGrowing', 'addDoubling', 'fibonacci', 'squares', 'multiplyAdd', 'alternate', 'interleaved', 'addTripling', 'cubes'];

export class SequencesFamily implements PuzzleFamily<SequencesPuzzle, SequencesState, SequencesParams, number> {
  readonly id = 'sequences';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: SequencesParams, rng: SeededRNG): SequencesPuzzle | null {
    const kinds = SAME_FAMILY_ORDER.filter((k) => RULE_COMPLEXITY[k] === params.complexity && (!params.letters || LETTER_KINDS.includes(k)));
    const kind = rng.pick(kinds);
    const length = params.length ?? (kind === 'interleaved' ? 6 : 5);
    const built = build(kind, rng, length + 1);
    if (!built) return null;
    const answer = built.terms[length], terms = built.terms.slice(0, length);
    const max = params.letters ? 26 : params.maxValue ?? 999;
    if (built.terms.some((v) => v < (params.letters ? 1 : 0) || v > max)) return null;
    if (EXPLAINERS[kind](terms) !== answer) return null; // rule must be recognisable from the visible terms
    const explained = predictions(terms, params.complexity + 1);
    // Several rules may explain the same terms; they must all agree on the answer.
    if ([...explained].some((v) => v !== answer)) return null;
    // Plausible distractors: typical slips (wrong step, off by one gap, wrong operation).
    const g = gaps(terms), last = terms[terms.length - 1], lastGap = g[g.length - 1];
    const pool = [answer + 1, answer - 1, last + lastGap, answer + lastGap, answer - lastGap, answer + 2, answer - 2, last * 2, answer + 10, answer - 10, last + g[0]]
      .filter((v) => v > 0 && v !== answer && v <= (params.letters ? 26 : max * 2) && !explained.has(v));
    const distractors = rng.shuffled([...new Set(pool)]).slice(0, 3);
    if (distractors.length < 3) return null;
    const options = rng.shuffled([answer, ...distractors]);
    const p: SequencesPuzzle = { terms, options, answer: options.indexOf(answer), rule: { kind, a: built.a, b: built.b } };
    return params.letters ? { ...p, letters: true } : p;
  }

  solve(p: SequencesPuzzle, limit: number): SolveReport<number> {
    const k = RULE_COMPLEXITY[p.rule.kind] ?? 3;
    const explained = predictions(p.terms, k + 1);
    const right = p.options.filter((v) => explained.has(v));
    return { solutionCount: Math.min(limit, right.length), solutions: right.slice(0, limit).map((v) => p.options.indexOf(v)), trace: [], humanSolvable: true, searchNodes: 0 };
  }

  initialState(): SequencesState { return { selected: null, ruledOut: [] }; }
  stateApplying(solution: number): SequencesState { return { selected: solution, ruledOut: [] }; }

  validate(p: SequencesPuzzle, s: SequencesState): ValidationResult {
    if (s.selected === null) return INCOMPLETE;
    return s.selected === p.answer ? CORRECT : { kind: 'invalid', issues: [{ cells: [], message: tpl('sequences.error.wrong') }] };
  }

  rate(p: SequencesPuzzle): number {
    const k = RULE_COMPLEXITY[p.rule.kind] ?? 3;
    const size = Math.max(...p.terms, p.options[p.answer]);
    return clampScore((k - 1) * 24 + 6 + Math.min(12, Math.log10(Math.max(1, size)) * 5) + (p.terms.length > 5 ? 4 : 0));
  }

  hint(p: SequencesPuzzle, s: SequencesState, level: HintLevel): Hint<SequencesState> | null {
    if (s.selected === p.answer) return null;
    const g = gaps(p.terms).join(', ');
    const { kind, a, b } = p.rule;
    const key = p.letters ? `sequences.letters.${kind}` : `sequences.hint.${kind}`;
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl(`${key}.whisper`), focus: [] };
      case HintLevel.Lead: return { level, text: tpl(`${key}.lead`, [g, String(a), String(b)]), focus: [] };
      case HintLevel.Insight: return { level, text: tpl(`${key}.insight`, [g, String(a), String(b), String(p.options[p.answer] - p.terms[p.terms.length - 1])]), focus: [] };
      case HintLevel.Solution: return { level, text: tpl('sequences.hint.solution', [termText(p, p.options[p.answer])]), focus: [], resultingState: { selected: p.answer, ruledOut: s.ruledOut } };
    }
  }

  fingerprint(p: SequencesPuzzle): string { return `${p.letters ? 'L|' : ''}${p.terms.join(',')}|${[...p.options].sort((x, y) => x - y).join(',')}`; }

  parse(raw: unknown): SequencesPuzzle | null {
    const o = raw as Partial<SequencesPuzzle> | null;
    if (!o || !Array.isArray(o.terms) || !Array.isArray(o.options) || typeof o.answer !== 'number' || !o.rule || !(o.rule.kind in RULE_COMPLEXITY)) return null;
    if (o.options.length < 2 || o.answer < 0 || o.answer >= o.options.length || o.terms.length < 3) return null;
    if (![...o.terms, ...o.options].every((v) => Number.isSafeInteger(v))) return null;
    if (o.letters !== undefined && typeof o.letters !== 'boolean') return null;
    if (o.letters && ![...o.terms, ...o.options].every((v) => v >= 1 && v <= 26)) return null;
    const p: SequencesPuzzle = { terms: o.terms.slice(), options: o.options.slice(), answer: o.answer, rule: { kind: o.rule.kind, a: Number(o.rule.a) || 0, b: Number(o.rule.b) || 0 } };
    return o.letters ? { ...p, letters: true } : p;
  }

  equals(a: SequencesPuzzle, b: SequencesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b) && a.answer === b.answer; }
}
