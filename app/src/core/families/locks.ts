/** Cadenas — portage exact de Families/Locks/Locks.swift. */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl, DeductionStep } from '../puzzlekit/types';

export interface LockClue {
  guess: number[];
  wellPlaced: number;
  misplaced: number;
}
export interface LocksPuzzle {
  length: number;
  alphabet: number;
  allowsRepeats: boolean;
  clues: LockClue[];
}
export interface LocksState {
  symbols: (number | null)[];
  crossedOut: number[];
}
export interface LocksParams {
  length?: number;
  alphabet?: number;
  allowsRepeats?: boolean;
  clueCount?: [number, number];
  maxNothingClues?: number;
}

export const MAX_SEARCH_SPACE = 1_000_000;
const isNothing = (c: LockClue) => c.wellPlaced === 0 && c.misplaced === 0;
const text = (symbols: number[]) => symbols.join(' ');

export function searchSpace(length: number, alphabet: number, repeats: boolean): number | null {
  if (!(length >= 1 && alphabet >= 1 && length <= 8 && alphabet <= 36)) return null;
  let total = 1;
  for (let i = 0; i < length; i++) {
    const factor = repeats ? alphabet : alphabet - i;
    if (factor <= 0) return 0;
    total *= factor;
    if (total > MAX_SEARCH_SPACE) return null;
  }
  return total;
}

export function isWellFormedLock(p: LocksPuzzle): boolean {
  const space = searchSpace(p.length, p.alphabet, p.allowsRepeats);
  if (!space) return false;
  return p.clues.every(
    (c) =>
      c.guess.length === p.length && c.guess.every((s) => Number.isInteger(s) && s >= 0 && s < p.alphabet) &&
      Number.isInteger(c.wellPlaced) && Number.isInteger(c.misplaced) && c.wellPlaced >= 0 && c.misplaced >= 0 && c.wellPlaced + c.misplaced <= p.length,
  );
}

/** Score d'une proposition (multiensembles : gère les répétitions). */
export function lockScore(code: number[], guess: number[]): [number, number] {
  let well = 0;
  const codeCounts = new Map<number, number>(), guessCounts = new Map<number, number>();
  for (let i = 0; i < Math.min(code.length, guess.length); i++) {
    if (code[i] === guess[i]) well++;
    else {
      codeCounts.set(code[i], (codeCounts.get(code[i]) ?? 0) + 1);
      guessCounts.set(guess[i], (guessCounts.get(guess[i]) ?? 0) + 1);
    }
  }
  let mis = 0;
  guessCounts.forEach((n, symbol) => (mis += Math.min(n, codeCounts.get(symbol) ?? 0)));
  return [well, mis];
}

const consistent = (code: number[], clues: LockClue[]) =>
  clues.every((c) => {
    const [w, m] = lockScore(code, c.guess);
    return w === c.wellPlaced && m === c.misplaced;
  });

export function allCodes(length: number, alphabet: number, repeats: boolean): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const build = () => {
    if (current.length === length) { result.push(current.slice()); return; }
    for (let s = 0; s < alphabet; s++) {
      if (!repeats && current.includes(s)) continue;
      current.push(s); build(); current.pop();
    }
  };
  build();
  return result;
}

const sameArray = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export class LocksFamily implements PuzzleFamily<LocksPuzzle, LocksState, LocksParams, number[]> {
  readonly id = 'locks';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: LocksParams, rng: SeededRNG): LocksPuzzle | null {
    const length = params.length ?? 3, alphabet = params.alphabet ?? 10, repeats = params.allowsRepeats ?? false;
    const [minClues, maxClues] = params.clueCount ?? [4, 6];
    const maxNothing = params.maxNothingClues ?? 1;
    if (!(length >= 2 && (alphabet >= length || repeats))) return null;
    const space = searchSpace(length, alphabet, repeats);
    if (!space || space <= 1 || maxNothing < 0) return null;
    const codes = allCodes(length, alphabet, repeats);
    const code = rng.pick(codes);
    let candidates = codes;
    let clues: LockClue[] = [];
    let nothing = 0;
    for (const guess of rng.shuffled(codes)) {
      if (sameArray(guess, code)) continue;
      const [w, m] = lockScore(code, guess);
      const clue: LockClue = { guess, wellPlaced: w, misplaced: m };
      if (isNothing(clue) && nothing >= maxNothing) continue;
      const reduced = candidates.filter((c) => consistent(c, [clue]));
      if (reduced.length >= candidates.length) continue;
      clues.push(clue);
      if (isNothing(clue)) nothing++;
      candidates = reduced;
      if (candidates.length === 1) break;
      if (clues.length > maxClues + 4) return null;
    }
    if (!(candidates.length === 1 && sameArray(candidates[0], code))) return null;
    let i = 0;
    while (i < clues.length) {
      const without = clues.filter((_, j) => j !== i);
      if (codes.filter((c) => consistent(c, without)).length === 1) clues = without;
      else i++;
    }
    if (clues.length < minClues || clues.length > maxClues) return null;
    return { length, alphabet, allowsRepeats: repeats, clues };
  }

  simpleElimination(p: LocksPuzzle): { sets: Set<number>[]; trace: DeductionStep[] } {
    const sets = Array.from({ length: p.length }, () => new Set(Array.from({ length: p.alphabet }, (_, i) => i)));
    const trace: DeductionStep[] = [];
    p.clues.forEach((c, index) => {
      if (!isNothing(c)) return;
      for (const set of sets) for (const s of c.guess) set.delete(s);
      trace.push({ techniqueRank: 1, technique: 'nothingCorrect', focus: [cell(index, 0)], explanation: tpl('locks.step.nothingCorrect', [text(c.guess)]) });
    });
    p.clues.forEach((c, index) => {
      if (!(c.wellPlaced === 0 && !isNothing(c))) return;
      let removed = false;
      c.guess.forEach((s, pos) => { if (sets[pos].has(s)) { sets[pos].delete(s); removed = true; } });
      if (removed) trace.push({ techniqueRank: 2, technique: 'noneWellPlaced', focus: [cell(index, 0)], explanation: tpl('locks.step.noneWellPlaced', [text(c.guess)]) });
    });
    return { sets, trace };
  }

  solve(p: LocksPuzzle, limit: number): SolveReport<number[]> {
    if (!isWellFormedLock(p)) return { solutionCount: 0, solutions: [], trace: [], humanSolvable: false, searchNodes: 0 };
    const codes = allCodes(p.length, p.alphabet, p.allowsRepeats);
    const solutions: number[][] = [];
    let count = 0;
    for (const code of codes) {
      if (!consistent(code, p.clues)) continue;
      count++;
      if (solutions.length < limit) solutions.push(code);
      if (count >= limit) break;
    }
    const { sets, trace } = this.simpleElimination(p);
    const remaining = codes.filter((code) => code.every((s, i) => sets[i].has(s))).length;
    let crossSteps = 0;
    for (let r = remaining; r > 1; r = Math.floor((r + 1) / 2)) crossSteps++;
    if (crossSteps > 0) {
      const focus = p.clues.flatMap((c, i) => (isNothing(c) ? [] : [cell(i, 0)]));
      for (let k = 0; k < crossSteps; k++) trace.push({ techniqueRank: 3, technique: 'crossReasoning', focus, explanation: tpl('locks.step.crossReasoning') });
    }
    return { solutionCount: count, solutions, trace, humanSolvable: true, searchNodes: codes.length };
  }

  initialState(p: LocksPuzzle): LocksState {
    return { symbols: Array(p.length).fill(null), crossedOut: [] };
  }

  stateApplying(solution: number[]): LocksState {
    return { symbols: solution.slice(), crossedOut: [] };
  }

  validate(p: LocksPuzzle, state: LocksState): ValidationResult {
    if (state.symbols.length !== p.length) return INCOMPLETE;
    const symbols = state.symbols.filter((s): s is number => s !== null);
    if (symbols.length !== p.length) return INCOMPLETE;
    if (!p.allowsRepeats && new Set(symbols).size < symbols.length) {
      return { kind: 'invalid', issues: [{ cells: symbols.map((_, i) => cell(-1, i)), message: tpl('locks.error.repeatedSymbols') }] };
    }
    for (let index = 0; index < p.clues.length; index++) {
      const c = p.clues[index];
      const [w, m] = lockScore(symbols, c.guess);
      if (w !== c.wellPlaced || m !== c.misplaced) {
        return { kind: 'invalid', issues: [{ cells: [cell(index, 0)], message: tpl('locks.error.clue', [text(symbols), text(c.guess), String(w), String(m), String(c.wellPlaced), String(c.misplaced)]) }] };
      }
    }
    return CORRECT;
  }

  rate(p: LocksPuzzle, report: SolveReport<number[]>): number {
    const cross = report.trace.filter((s) => s.techniqueRank === 3).length;
    return clampScore(10 + Math.max(0, p.clues.length - 3) * 4 + (p.length - 3) * 12 + cross * 3 + (p.alphabet > 10 ? 10 : 0) + (p.allowsRepeats ? 12 : 0));
  }

  hint(p: LocksPuzzle, state: LocksState, level: HintLevel): Hint<LocksState> | null {
    const report = this.solve(p, 2);
    const solution = report.solutions[0];
    const entered = state.symbols.filter((s): s is number => s !== null);
    if (state.symbols.length !== p.length || p.clues.length === 0 || report.solutionCount !== 1 || !solution || sameArray(entered, solution)) return null;
    const crossed = new Set(state.crossedOut);
    let target = p.clues.findIndex((c) => isNothing(c) && !c.guess.every((s) => crossed.has(s)));
    if (target < 0) target = p.clues.findIndex((c) => c.wellPlaced === 0);
    if (target < 0) target = 0;
    const clue = p.clues[target];
    switch (level) {
      case HintLevel.Whisper:
        return { level, text: tpl('locks.hint.whisper', [text(clue.guess)]), focus: [cell(target, 0)] };
      case HintLevel.Lead: {
        const key = isNothing(clue) ? 'locks.hint.lead.nothing' : clue.wellPlaced === 0 ? 'locks.hint.lead.noneWellPlaced' : 'locks.hint.lead.compare';
        return { level, text: tpl(key, [text(clue.guess)]), focus: [cell(target, 0)] };
      }
      case HintLevel.Insight: {
        const position = state.symbols.findIndex((s, i) => s !== solution[i]);
        if (position < 0) return null;
        const symbols = state.symbols.slice();
        symbols[position] = solution[position];
        return { level, text: tpl('locks.hint.insight', [String(position + 1), String(solution[position])]), focus: [cell(-1, position)], resultingState: { ...state, symbols } };
      }
      case HintLevel.Solution:
        return { level, text: tpl('locks.hint.solution', [text(solution)]), focus: [], resultingState: { ...state, symbols: solution.slice() } };
    }
  }

  fingerprint(p: LocksPuzzle): string {
    const clues = p.clues.map((c) => `${text(c.guess)}:${c.wellPlaced}${c.misplaced}`).sort();
    return `${p.length}/${p.alphabet}/${p.allowsRepeats ? 'r' : 'u'}|` + clues.join(',');
  }

  parse(raw: unknown): LocksPuzzle | null {
    const o = raw as Partial<LocksPuzzle> | null;
    if (!o || typeof o !== 'object' || typeof o.length !== 'number' || typeof o.alphabet !== 'number' || typeof o.allowsRepeats !== 'boolean' || !Array.isArray(o.clues)) return null;
    const clues: LockClue[] = [];
    for (const c of o.clues as unknown[]) {
      const k = c as Partial<LockClue> | null;
      if (!k || !Array.isArray(k.guess) || typeof k.wellPlaced !== 'number' || typeof k.misplaced !== 'number') return null;
      clues.push({ guess: k.guess.slice(), wellPlaced: k.wellPlaced, misplaced: k.misplaced });
    }
    const p: LocksPuzzle = { length: o.length, alphabet: o.alphabet, allowsRepeats: o.allowsRepeats, clues };
    return isWellFormedLock(p) ? p : null;
  }

  equals(a: LocksPuzzle, b: LocksPuzzle): boolean {
    return this.fingerprint(a) === this.fingerprint(b) && a.clues.length === b.clues.length && a.clues.every((c, i) => sameArray(c.guess, b.clues[i].guess));
  }
}
