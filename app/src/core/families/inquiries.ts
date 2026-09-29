/**
 * Enquêtes — match each resident with an object and a place from the clues
 * (GAME_DESIGN § 5.7). Random solution → pool of true clues → clues added
 * until a single table fits (all n!² tables enumerated) → minimisation: every
 * remaining clue is necessary.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export type Clue =
  | { kind: 'has'; p: number; o: number }
  | { kind: 'hasNot'; p: number; o: number }
  | { kind: 'at'; p: number; l: number }
  | { kind: 'notAt'; p: number; l: number }
  | { kind: 'objectAt'; o: number; l: number }
  | { kind: 'objectNotAt'; o: number; l: number }
  | { kind: 'either'; p: number; o: number; o2: number };

export interface InquiriesPuzzle { size: number; people: number[]; objects: number[]; places: number[]; clues: Clue[] }
export interface Table { object: number[]; place: number[] }
export interface InquiriesState { object: (number | null)[]; place: (number | null)[]; crossed: number[] }
export interface InquiriesParams { size: 3 | 4 | 5; kinds: Clue['kind'][] }

export const PEOPLE = ['la Loutre', 'le Héron', 'la Taupe', 'le Grillon', 'la Chouette', 'le Hérisson', 'la Grenouille', 'le Loir'];
export const OBJECTS = ['la clé', 'la loupe', 'le sablier', 'la plume', 'la boussole', 'le ressort', 'la bobine'];
export const PLACES = ['au Phare', 'à la Bibliothèque', 'à l’Horlogerie', 'au Marché', 'à la Serre', 'au Théâtre', 'à l’Observatoire'];

export function fits(c: Clue, t: Table): boolean {
  switch (c.kind) {
    case 'has': return t.object[c.p] === c.o;
    case 'hasNot': return t.object[c.p] !== c.o;
    case 'at': return t.place[c.p] === c.l;
    case 'notAt': return t.place[c.p] !== c.l;
    case 'objectAt': return t.place[t.object.indexOf(c.o)] === c.l;
    case 'objectNotAt': return t.place[t.object.indexOf(c.o)] !== c.l;
    case 'either': return t.object[c.p] === c.o || t.object[c.p] === c.o2;
  }
}

function permutations(n: number): number[][] {
  const out: number[][] = [], a = Array.from({ length: n }, (_, i) => i);
  const rec = (k: number) => {
    if (k === n) { out.push(a.slice()); return; }
    for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; }
  };
  rec(0);
  return out;
}
const PERMS = new Map<number, number[][]>();
const perms = (n: number) => { if (!PERMS.has(n)) PERMS.set(n, permutations(n)); return PERMS.get(n)!; };

export function tables(size: number, clues: Clue[], limit: number): Table[] {
  const out: Table[] = [];
  // Object-only clues filter object permutations first.
  const objClues: Clue[] = clues.filter((c) => c.kind === 'has' || c.kind === 'hasNot' || c.kind === 'either');
  const rest = clues.filter((c) => !objClues.includes(c));
  for (const object of perms(size)) {
    if (!objClues.every((c) => fits(c as Clue, { object, place: object }))) continue;
    for (const place of perms(size)) {
      const t = { object, place };
      if (rest.every((c) => fits(c, t))) { out.push({ object: object.slice(), place: place.slice() }); if (out.length >= limit) return out; }
    }
  }
  return out;
}

function trueClues(t: Table, n: number, kinds: Clue['kind'][]): Clue[] {
  const out: Clue[] = [];
  for (let p = 0; p < n; p++) for (let x = 0; x < n; x++) {
    if (kinds.includes('has') && t.object[p] === x) out.push({ kind: 'has', p, o: x });
    if (kinds.includes('hasNot') && t.object[p] !== x) out.push({ kind: 'hasNot', p, o: x });
    if (kinds.includes('at') && t.place[p] === x) out.push({ kind: 'at', p, l: x });
    if (kinds.includes('notAt') && t.place[p] !== x) out.push({ kind: 'notAt', p, l: x });
    if (kinds.includes('either') && t.object[p] !== x) out.push({ kind: 'either', p, o: Math.min(t.object[p], x), o2: Math.max(t.object[p], x) });
  }
  for (let o = 0; o < n; o++) for (let l = 0; l < n; l++) {
    const where = t.place[t.object.indexOf(o)];
    if (kinds.includes('objectAt') && where === l) out.push({ kind: 'objectAt', o, l });
    if (kinds.includes('objectNotAt') && where !== l) out.push({ kind: 'objectNotAt', o, l });
  }
  return out;
}

export class InquiriesFamily implements PuzzleFamily<InquiriesPuzzle, InquiriesState, InquiriesParams, Table> {
  readonly id = 'inquiries';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: InquiriesParams, rng: SeededRNG): InquiriesPuzzle | null {
    const n = params.size;
    const t: Table = { object: rng.shuffled(Array.from({ length: n }, (_, i) => i)), place: rng.shuffled(Array.from({ length: n }, (_, i) => i)) };
    const pool = rng.shuffled(trueClues(t, n, params.kinds));
    let clues: Clue[] = [];
    for (const c of pool) {
      clues.push(c);
      if (tables(n, clues, 2).length === 1) break;
    }
    if (tables(n, clues, 2).length !== 1) return null;
    // Minimise: drop every clue that is not needed.
    for (let i = clues.length - 1; i >= 0; i--) {
      const without = clues.filter((_, j) => j !== i);
      if (tables(n, without, 2).length === 1) clues = without;
    }
    const pick = (list: string[]) => rng.shuffled(Array.from({ length: list.length }, (_, i) => i)).slice(0, n);
    return { size: n, people: pick(PEOPLE), objects: pick(OBJECTS), places: pick(PLACES), clues: rng.shuffled(clues) };
  }

  solve(p: InquiriesPuzzle, limit: number): SolveReport<Table> {
    const ts = tables(p.size, p.clues, limit);
    return { solutionCount: ts.length, solutions: ts, trace: [], humanSolvable: true, searchNodes: perms(p.size).length };
  }

  initialState(p: InquiriesPuzzle): InquiriesState { return { object: Array(p.size).fill(null), place: Array(p.size).fill(null), crossed: [] }; }
  stateApplying(t: Table): InquiriesState { return { object: t.object.slice(), place: t.place.slice(), crossed: [] }; }

  validate(p: InquiriesPuzzle, s: InquiriesState): ValidationResult {
    if (s.object.some((x) => x === null) || s.place.some((x) => x === null)) return INCOMPLETE;
    const t: Table = { object: s.object as number[], place: s.place as number[] };
    if (new Set(t.object).size !== p.size) return { kind: 'invalid', issues: [{ cells: [], message: tpl('inquiries.error.sameObject') }] };
    if (new Set(t.place).size !== p.size) return { kind: 'invalid', issues: [{ cells: [], message: tpl('inquiries.error.samePlace') }] };
    const i = p.clues.findIndex((c) => !fits(c, t));
    if (i >= 0) return { kind: 'invalid', issues: [{ cells: [cell(i, 0)], message: tpl('inquiries.error.clue', [String(i + 1)]) }] };
    return CORRECT;
  }

  rate(p: InquiriesPuzzle): number {
    const weight: Record<Clue['kind'], number> = { has: 1, at: 1, hasNot: 3, notAt: 3, objectAt: 4, objectNotAt: 6, either: 5 };
    return clampScore((p.size - 3) * 20 + p.clues.reduce((s, c) => s + weight[c.kind], 0) * 1.2 - 4);
  }

  hint(p: InquiriesPuzzle, s: InquiriesState, level: HintLevel): Hint<InquiriesState> | null {
    const sol = tables(p.size, p.clues, 1)[0];
    if (!sol || this.validate(p, s).kind === 'correct') return null;
    const wrongObj = s.object.findIndex((x, i) => x !== null && x !== sol.object[i]);
    const wrongPlace = s.place.findIndex((x, i) => x !== null && x !== sol.place[i]);
    const direct = p.clues.findIndex((c) => c.kind === 'has' || c.kind === 'at' || c.kind === 'objectAt');
    const start = direct >= 0 ? direct : 0;
    if (level === HintLevel.Solution) return { level, text: tpl('inquiries.hint.solution'), focus: [], resultingState: { ...this.stateApplying(sol), crossed: s.crossed } };
    if (wrongObj >= 0 || wrongPlace >= 0) {
      const who = wrongObj >= 0 ? wrongObj : wrongPlace;
      const next = { ...s, object: s.object.slice(), place: s.place.slice() };
      if (wrongObj >= 0) next.object[wrongObj] = null; else next.place[wrongPlace] = null;
      return { level, text: tpl('inquiries.hint.wrong', [`inquiries.person.${p.people[who]}`]), focus: [], resultingState: level === HintLevel.Insight ? next : undefined };
    }
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('inquiries.hint.whisper', [String(start + 1)]), focus: [cell(start, 0)] };
      case HintLevel.Lead: return { level, text: tpl('inquiries.hint.lead'), focus: [] };
      case HintLevel.Insight: {
        const i = s.object.findIndex((x) => x === null);
        const next = { ...s, object: s.object.slice(), place: s.place.slice() };
        if (i >= 0) { next.object[i] = sol.object[i]; return { level, text: tpl('inquiries.hint.insight.object', [`inquiries.person.${p.people[i]}`, `inquiries.object.${p.objects[sol.object[i]]}`]), focus: [], resultingState: next }; }
        const j = s.place.findIndex((x) => x === null);
        if (j < 0) return null;
        next.place[j] = sol.place[j];
        return { level, text: tpl('inquiries.hint.insight.place', [`inquiries.person.${p.people[j]}`, `inquiries.place.${p.places[sol.place[j]]}`]), focus: [], resultingState: next };
      }
    }
    return null;
  }

  fingerprint(p: InquiriesPuzzle): string { return `${p.size}|` + p.clues.map((c) => JSON.stringify(c)).sort().join(';'); }

  parse(raw: unknown): InquiriesPuzzle | null {
    const o = raw as Partial<InquiriesPuzzle> | null;
    if (!o || typeof o.size !== 'number' || o.size < 2 || o.size > 5 || !Array.isArray(o.clues) || !Array.isArray(o.people) || !Array.isArray(o.objects) || !Array.isArray(o.places)) return null;
    const n = o.size;
    const list = (a: unknown[], max: number) => a.length === n && a.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < max) && new Set(a).size === n;
    if (!list(o.people, PEOPLE.length) || !list(o.objects, OBJECTS.length) || !list(o.places, PLACES.length)) return null;
    const ok = (x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < n;
    for (const c of o.clues as Clue[]) {
      if (!c) return null;
      const good = (c.kind === 'has' || c.kind === 'hasNot') ? ok(c.p) && ok(c.o)
        : (c.kind === 'at' || c.kind === 'notAt') ? ok(c.p) && ok(c.l)
          : (c.kind === 'objectAt' || c.kind === 'objectNotAt') ? ok(c.o) && ok(c.l)
            : c.kind === 'either' ? ok(c.p) && ok(c.o) && ok(c.o2) : false;
      if (!good) return null;
    }
    return { size: n, people: o.people.slice(), objects: o.objects.slice(), places: o.places.slice(), clues: (o.clues as Clue[]).map((c) => ({ ...c })) };
  }

  equals(a: InquiriesPuzzle, b: InquiriesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}

/** A clue as a sentence (French). */
export function clueText(c: Clue, p: InquiriesPuzzle): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const who = (i: number) => PEOPLE[p.people[i]], what = (i: number) => OBJECTS[p.objects[i]], where = (i: number) => PLACES[p.places[i]];
  switch (c.kind) {
    case 'has': return `${cap(who(c.p))} a ${what(c.o)}.`;
    case 'hasNot': return `${cap(who(c.p))} n’a pas ${what(c.o)}.`;
    case 'at': return `${cap(who(c.p))} est ${where(c.l)}.`;
    case 'notAt': return `${cap(who(c.p))} n’est pas ${where(c.l)}.`;
    case 'objectAt': return `Qui a ${what(c.o)} est ${where(c.l)}.`;
    case 'objectNotAt': return `Qui a ${what(c.o)} n’est pas ${where(c.l)}.`;
    case 'either': return `${cap(who(c.p))} a ${what(c.o)} ou ${what(c.o2)}.`;
  }
}
