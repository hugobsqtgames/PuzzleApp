/**
 * Carillon — memory. A melody plays on a few bells; play it back. No timer:
 * the melody can be heard again as often as wanted. Difficulty is its length
 * and the number of bells. Variant « à rebours »: play it back from the end.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface ChimesPuzzle { bells: number; melody: number[]; reverse?: boolean }
export interface ChimesState { played: number[] }
export interface ChimesParams { bells: number; length: [number, number]; reverse?: boolean }

/** The notes to play, in order: the melody, or the melody from its last note. */
export const toPlay = (p: ChimesPuzzle) => (p.reverse ? p.melody.slice().reverse() : p.melody.slice());

/** Longest prefix of `played` that follows the notes to play. */
export const goodPrefix = (p: ChimesPuzzle, played: number[]) => {
  const want = toPlay(p);
  let k = 0;
  while (k < played.length && k < want.length && played[k] === want[k]) k++;
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
    return params.reverse ? { bells, melody, reverse: true } : { bells, melody };
  }
  solve(p: ChimesPuzzle): SolveReport<number[]> {
    return { solutionCount: 1, solutions: [toPlay(p)], trace: [], humanSolvable: true, searchNodes: p.melody.length };
  }
  initialState(): ChimesState { return { played: [] }; }
  stateApplying(sol: number[]): ChimesState { return { played: sol.slice() }; }
  validate(p: ChimesPuzzle, s: ChimesState): ValidationResult {
    const k = goodPrefix(p, s.played);
    if (k < s.played.length) return { kind: 'invalid', issues: [{ cells: [cell(0, s.played[k])], message: tpl('chimes.wrong', [String(k + 1)]) }] };
    return k === p.melody.length ? CORRECT : INCOMPLETE;
  }
  // Playing it back from the end asks to hold the whole melody in mind at once.
  rate(p: ChimesPuzzle): number { return clampScore(p.melody.length * (p.reverse ? 10 : 8) + p.bells * 4 - 12); }
  hint(p: ChimesPuzzle, s: ChimesState, level: HintLevel): Hint<ChimesState> | null {
    const want = toPlay(p);
    const k = goodPrefix(p, s.played);
    if (k === want.length && k === s.played.length) return null;
    const next = want[k];
    const w = p.reverse ? 'chimes.hint.whisper.reverse' : 'chimes.hint.whisper';
    if (level === HintLevel.Whisper) return { level, text: tpl(w, [String(p.melody.length)]), focus: [] };
    if (level === HintLevel.Lead) return { level, text: tpl('chimes.hint.lead', [String(k + 1)]), focus: [cell(0, next)] };
    if (level === HintLevel.Insight) return { level, text: tpl('chimes.hint.insight', [String(k + 1)]), focus: [cell(0, next)], resultingState: { played: want.slice(0, k + 1) } };
    return { level, text: tpl('chimes.hint.solution'), focus: [], resultingState: { played: want } };
  }
  fingerprint(p: ChimesPuzzle): string { return `chimes:${p.bells}:${p.melody.join('')}${p.reverse ? ':r' : ''}`; }
  parse(raw: unknown): ChimesPuzzle | null {
    const o = raw as { bells?: unknown; melody?: unknown; reverse?: unknown } | null;
    if (!o || typeof o.bells !== 'number' || !Number.isInteger(o.bells) || o.bells < 2 || o.bells > 8) return null;
    if (!Array.isArray(o.melody) || o.melody.length < 1 || o.melody.length > 16) return null;
    if (!o.melody.every((b) => Number.isInteger(b) && b >= 0 && b < (o.bells as number))) return null;
    if (o.reverse !== undefined && typeof o.reverse !== 'boolean') return null;
    return o.reverse ? { bells: o.bells, melody: o.melody as number[], reverse: true } : { bells: o.bells, melody: o.melody as number[] };
  }
  equals(a: ChimesPuzzle, b: ChimesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
