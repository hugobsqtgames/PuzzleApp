/**
 * Carillon — memory. A melody plays on a few bells; play it back. No timer:
 * the melody can be heard again as often as wanted. Difficulty is its length
 * and the number of bells.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface ChimesPuzzle { bells: number; melody: number[] }
export interface ChimesState { played: number[] }
export interface ChimesParams { bells: number; length: [number, number] }

/** Longest prefix of `played` that follows the melody. */
export const goodPrefix = (p: ChimesPuzzle, played: number[]) => {
  let k = 0;
  while (k < played.length && k < p.melody.length && played[k] === p.melody[k]) k++;
  return k;
};


export class ChimesFamily implements PuzzleFamily<ChimesPuzzle, ChimesState, ChimesParams, number[]> {
  readonly id = 'chimes';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([30, 42, 54, 66, 80]);

  generate(params: ChimesParams, rng: SeededRNG): ChimesPuzzle | null {
    const bells = Math.max(3, Math.min(6, params.bells));
    const length = rng.int(params.length[0], params.length[1]);
    const melody: number[] = [];
    for (let i = 0; i < length; i++) {
      let b = rng.below(bells);
      // No note three times in a row: it would not sound like a melody.
      if (i >= 2 && melody[i - 1] === b && melody[i - 2] === b) b = (b + 1 + rng.below(bells - 1)) % bells;
      melody.push(b);
    }
    return { bells, melody };
  }
  solve(p: ChimesPuzzle): SolveReport<number[]> {
    return { solutionCount: 1, solutions: [p.melody.slice()], trace: [], humanSolvable: true, searchNodes: p.melody.length };
  }
  initialState(): ChimesState { return { played: [] }; }
  stateApplying(sol: number[]): ChimesState { return { played: sol.slice() }; }
  validate(p: ChimesPuzzle, s: ChimesState): ValidationResult {
    const k = goodPrefix(p, s.played);
    if (k < s.played.length) return { kind: 'invalid', issues: [{ cells: [cell(0, s.played[k])], message: tpl('chimes.wrong', [String(k + 1)]) }] };
    return k === p.melody.length ? CORRECT : INCOMPLETE;
  }
  rate(p: ChimesPuzzle): number { return clampScore(p.melody.length * 8 + p.bells * 4 - 12); }
  hint(p: ChimesPuzzle, s: ChimesState, level: HintLevel): Hint<ChimesState> | null {
    const k = goodPrefix(p, s.played);
    if (k === p.melody.length && k === s.played.length) return null;
    const next = p.melody[k];
    if (level === HintLevel.Whisper) return { level, text: tpl('chimes.hint.whisper', [String(p.melody.length)]), focus: [] };
    if (level === HintLevel.Lead) return { level, text: tpl('chimes.hint.lead', [String(k + 1)]), focus: [cell(0, next)] };
    if (level === HintLevel.Insight) return { level, text: tpl('chimes.hint.insight', [String(k + 1)]), focus: [cell(0, next)], resultingState: { played: p.melody.slice(0, k + 1) } };
    return { level, text: tpl('chimes.hint.solution'), focus: [], resultingState: { played: p.melody.slice() } };
  }
  fingerprint(p: ChimesPuzzle): string { return `chimes:${p.bells}:${p.melody.join('')}`; }
  parse(raw: unknown): ChimesPuzzle | null {
    const o = raw as { bells?: unknown; melody?: unknown } | null;
    if (!o || typeof o.bells !== 'number' || !Number.isInteger(o.bells) || o.bells < 2 || o.bells > 8) return null;
    if (!Array.isArray(o.melody) || o.melody.length < 1 || o.melody.length > 16) return null;
    if (!o.melody.every((b) => Number.isInteger(b) && b >= 0 && b < (o.bells as number))) return null;
    return { bells: o.bells, melody: o.melody as number[] };
  }
  equals(a: ChimesPuzzle, b: ChimesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
