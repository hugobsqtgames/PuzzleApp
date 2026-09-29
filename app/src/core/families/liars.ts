/**
 * Menteurs — each character always tells the truth or always lies. Who lies?
 * (GAME_DESIGN § 5.6). A random truth assignment → one statement per
 * character, chosen among templates whose truth value matches the speaker →
 * all 2ⁿ worlds enumerated → accepted only if exactly one world is
 * consistent.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export type Statement =
  | { kind: 'liar'; j: number }
  | { kind: 'honest'; j: number }
  | { kind: 'atLeastOneLiar' }
  | { kind: 'allLiars' }
  | { kind: 'exactlyLiars'; k: number }
  | { kind: 'same'; j: number }
  | { kind: 'different'; j: number; k: number }
  | { kind: 'ifThen'; j: number; k: number };

export interface LiarsPuzzle { names: number[]; statements: Statement[] }
/** Per character: null unknown, true tells the truth, false lies. */
export interface LiarsState { marks: (boolean | null)[] }
export interface LiarsParams { characters: 3 | 4 | 5 | 6; kinds: Statement['kind'][] }

/** Creatures of Vesper (article included; the UI capitalises at the start of a sentence). */
export const CHARACTERS = ['la Loutre', 'le Héron', 'la Taupe', 'le Grillon', 'la Chouette', 'le Hérisson', 'la Grenouille', 'le Loir'];

export function holds(st: Statement, speaker: number, w: readonly boolean[]): boolean {
  switch (st.kind) {
    case 'liar': return !w[st.j];
    case 'honest': return w[st.j];
    case 'atLeastOneLiar': return w.some((x) => !x);
    case 'allLiars': return w.every((x) => !x);
    case 'exactlyLiars': return w.filter((x) => !x).length === st.k;
    case 'same': return w[speaker] === w[st.j];
    case 'different': return w[st.j] !== w[st.k];
    case 'ifThen': return w[st.j] || w[st.k];
  }
}

export const consistent = (p: LiarsPuzzle, w: readonly boolean[]) => p.statements.every((st, i) => holds(st, i, w) === w[i]);

export function worlds(p: LiarsPuzzle, limit = 64): boolean[][] {
  const n = p.statements.length, out: boolean[][] = [];
  for (let m = 0; m < 1 << n && out.length < limit; m++) {
    const w = Array.from({ length: n }, (_, i) => ((m >> i) & 1) === 1);
    if (consistent(p, w)) out.push(w);
  }
  return out;
}

function candidates(i: number, n: number, kinds: Statement['kind'][]): Statement[] {
  const others = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i);
  const out: Statement[] = [];
  for (const kind of kinds) {
    if (kind === 'liar' || kind === 'honest' || kind === 'same') for (const j of others) out.push({ kind, j } as Statement);
    if (kind === 'atLeastOneLiar' || kind === 'allLiars') out.push({ kind });
    if (kind === 'exactlyLiars') for (let k = 1; k < n; k++) out.push({ kind, k });
    if (kind === 'different' || kind === 'ifThen') for (const j of others) for (const k of others) if (j !== k && (kind === 'ifThen' || j < k)) out.push({ kind, j, k } as Statement);
  }
  return out;
}

export class LiarsFamily implements PuzzleFamily<LiarsPuzzle, LiarsState, LiarsParams, boolean[]> {
  readonly id = 'liars';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: LiarsParams, rng: SeededRNG): LiarsPuzzle | null {
    const n = params.characters;
    const w = Array.from({ length: n }, () => rng.bool());
    if (w.every(Boolean)) w[rng.below(n)] = false; // at least one liar
    const statements: Statement[] = [];
    for (let i = 0; i < n; i++) {
      const fitting = candidates(i, n, params.kinds).filter((st) => holds(st, i, w) === w[i]);
      if (!fitting.length) return null;
      statements.push(rng.pick(fitting));
    }
    const names = rng.shuffled(Array.from({ length: CHARACTERS.length }, (_, k) => k)).slice(0, n);
    const p = { names, statements };
    return worlds(p, 2).length === 1 ? p : null;
  }

  /** Search effort: nodes of a depth-first search that checks each statement once its characters are known. */
  private cases(p: LiarsPuzzle): number {
    const n = p.statements.length;
    const refs = p.statements.map((st, i) => {
      const r = new Set<number>([i]);
      if ('j' in st) r.add(st.j);
      if (st.kind === 'different' || st.kind === 'ifThen') r.add(st.k);
      if (st.kind === 'atLeastOneLiar' || st.kind === 'allLiars' || st.kind === 'exactlyLiars') for (let k = 0; k < n; k++) r.add(k);
      return [...r];
    });
    let nodes = 0;
    const w: boolean[] = [];
    const rec = (d: number) => {
      nodes++;
      for (let i = 0; i < n; i++) if (refs[i].every((k) => k < d) && holds(p.statements[i], i, w) !== w[i]) return;
      if (d === n) return;
      for (const v of [true, false]) { w[d] = v; rec(d + 1); }
      w.length = d;
    };
    rec(0);
    return nodes;
  }

  solve(p: LiarsPuzzle, limit: number): SolveReport<boolean[]> {
    const ws = worlds(p, limit);
    return { solutionCount: ws.length, solutions: ws, trace: [], humanSolvable: true, searchNodes: this.cases(p) };
  }

  initialState(p: LiarsPuzzle): LiarsState { return { marks: p.statements.map(() => null) }; }
  stateApplying(solution: boolean[]): LiarsState { return { marks: solution.slice() }; }

  validate(p: LiarsPuzzle, s: LiarsState): ValidationResult {
    if (s.marks.length !== p.statements.length || s.marks.some((m) => m === null)) return INCOMPLETE;
    const w = s.marks as boolean[];
    const i = p.statements.findIndex((st, k) => holds(st, k, w) !== w[k]);
    if (i < 0) return CORRECT;
    return { kind: 'invalid', issues: [{ cells: [cell(i, 0)], message: tpl(w[i] ? 'liars.error.honestButFalse' : 'liars.error.liarButTrue', [`liars.name.${p.names[i]}`]) }] };
  }

  rate(p: LiarsPuzzle, report: SolveReport<boolean[]>): number {
    const weight: Record<Statement['kind'], number> = { liar: 1, honest: 1, atLeastOneLiar: 3, allLiars: 3, exactlyLiars: 6, same: 5, different: 6, ifThen: 8 };
    const n = p.statements.length;
    return clampScore((n - 3) * 16 + p.statements.reduce((s, st) => s + weight[st.kind], 0) + Math.log2(Math.max(1, report.searchNodes)) * 2 - 6);
  }

  hint(p: LiarsPuzzle, s: LiarsState, level: HintLevel): Hint<LiarsState> | null {
    const sol = worlds(p, 2)[0];
    if (!sol) return null;
    const wrong = s.marks.findIndex((m, i) => m !== null && m !== sol[i]);
    // Start from a self-referential or counting statement: those cut the most cases.
    const order = p.statements.map((st, i) => ({ i, r: st.kind === 'allLiars' || st.kind === 'exactlyLiars' || st.kind === 'same' ? 0 : st.kind === 'atLeastOneLiar' ? 1 : 2 })).sort((a, b) => a.r - b.r).map((x) => x.i);
    const target = wrong >= 0 ? wrong : order.find((i) => s.marks[i] !== sol[i]);
    if (target === undefined) return null;
    const name = `liars.name.${p.names[target]}`;
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl(wrong >= 0 ? 'liars.hint.checkMark' : 'liars.hint.whisper', [name]), focus: [cell(target, 0)] };
      case HintLevel.Lead: return { level, text: tpl('liars.hint.lead', [name]), focus: [cell(target, 0)] };
      case HintLevel.Insight: {
        const marks = s.marks.slice();
        marks[target] = sol[target];
        return { level, text: tpl(sol[target] ? 'liars.hint.insight.honest' : 'liars.hint.insight.liar', [name]), focus: [cell(target, 0)], resultingState: { marks } };
      }
      case HintLevel.Solution: return { level, text: tpl('liars.hint.solution'), focus: [], resultingState: { marks: sol.slice() } };
    }
  }

  fingerprint(p: LiarsPuzzle): string {
    return p.statements.map((st) => JSON.stringify(st)).join('|');
  }

  parse(raw: unknown): LiarsPuzzle | null {
    const o = raw as Partial<LiarsPuzzle> | null;
    if (!o || !Array.isArray(o.names) || !Array.isArray(o.statements) || o.names.length !== o.statements.length) return null;
    const n = o.names.length;
    if (n < 2 || n > 8 || !o.names.every((x) => Number.isInteger(x) && x >= 0 && x < CHARACTERS.length) || new Set(o.names).size !== n) return null;
    const idx = (x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < n;
    for (const st of o.statements as Statement[]) {
      if (!st || typeof st !== 'object') return null;
      switch (st.kind) {
        case 'liar': case 'honest': case 'same': if (!idx(st.j)) return null; break;
        case 'different': case 'ifThen': if (!idx(st.j) || !idx(st.k)) return null; break;
        case 'exactlyLiars': if (!idx(st.k)) return null; break;
        case 'atLeastOneLiar': case 'allLiars': break;
        default: return null;
      }
    }
    return { names: o.names.slice(), statements: (o.statements as Statement[]).map((st) => ({ ...st })) };
  }

  equals(a: LiarsPuzzle, b: LiarsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b) && a.names.join() === b.names.join(); }
}

/** The statement as the character says it (French). `name(i)` gives "la Loutre" etc. */
export function statementText(st: Statement, name: (i: number) => string, n: number): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  switch (st.kind) {
    case 'liar': return `${cap(name(st.j))} ment.`;
    case 'honest': return `${cap(name(st.j))} dit la vérité.`;
    case 'atLeastOneLiar': return 'Au moins l’un d’entre nous ment.';
    case 'allLiars': return n === 2 ? 'Nous mentons tous les deux.' : 'Nous mentons tous.';
    case 'exactlyLiars': return st.k === 1 ? 'Un seul d’entre nous ment.' : `Exactement ${st.k} d’entre nous mentent.`;
    case 'same': return `${cap(name(st.j))} et moi sommes du même camp.`;
    case 'different': return `${cap(name(st.j))} et ${name(st.k)} ne sont pas du même camp.`;
    case 'ifThen': return `Si ${name(st.j)} ment, alors ${name(st.k)} dit la vérité.`;
  }
}
