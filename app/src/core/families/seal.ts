/**
 * Sceau — the keystone of a building (GAME_DESIGN § 6 bis, "revenir sur ses pas").
 *
 * Every room of the building shows a digit painted in its scenery once it is
 * lit enough. The seal asks for a code made from those digits, following one
 * rule (in order going up, going down, their sum, the sum of each pair of
 * rooms). The player has to go back to the rooms, look, remember, combine.
 *
 * The digit of a room depends only on its id (stable across content
 * versions), so the scenery and the seal always agree.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export const SEAL_RULES = ['up', 'down', 'sum', 'pairs'] as const;
export type SealRule = (typeof SEAL_RULES)[number];

export interface SealPuzzle { rooms: string[]; rule: SealRule }
export interface SealState { wheels: number[] }
export interface SealParams { rooms: string[]; rule?: SealRule }

/** Digit (1…9) painted in a room: FNV-1a of its id. */
export function sealDigit(roomId: string): number {
  let h = 2166136261;
  for (let i = 0; i < roomId.length; i++) h = Math.imul(h ^ roomId.charCodeAt(i), 16777619);
  return ((h >>> 0) % 9) + 1;
}

export function sealCode(p: SealPuzzle): number[] {
  const d = p.rooms.map(sealDigit);
  switch (p.rule) {
    case 'up': return d;
    case 'down': return [...d].reverse();
    case 'sum': { const s = d.reduce((a, b) => a + b, 0); return [Math.floor(s / 10), s % 10]; }
    case 'pairs': {
      const out: number[] = [];
      for (let i = 0; i < d.length; i += 2) out.push((d[i] + (d[i + 1] ?? 0)) % 10);
      return out;
    }
  }
}

/** Rule of a building from its id: the four rules are spread over each district. */
export function sealRuleFor(buildingId: string, index: number): SealRule {
  return SEAL_RULES[(index + sealDigit(buildingId)) % SEAL_RULES.length];
}

export class SealFamily implements PuzzleFamily<SealPuzzle, SealState, SealParams, number[]> {
  readonly id = 'seal';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([10, 20, 30, 50, 90]);

  generate(params: SealParams, rng: SeededRNG): SealPuzzle | null {
    if (!params.rooms.length) return null;
    return { rooms: params.rooms.slice(), rule: params.rule ?? SEAL_RULES[rng.below(SEAL_RULES.length)] };
  }
  solve(p: SealPuzzle): SolveReport<number[]> {
    return { solutionCount: 1, solutions: [sealCode(p)], trace: [], humanSolvable: true, searchNodes: p.rooms.length };
  }
  initialState(p: SealPuzzle): SealState { return { wheels: sealCode(p).map(() => 0) }; }
  stateApplying(sol: number[]): SealState { return { wheels: sol.slice() }; }
  validate(p: SealPuzzle, s: SealState): ValidationResult {
    const code = sealCode(p);
    if (s.wheels.length !== code.length) return INCOMPLETE;
    if (s.wheels.every((v, i) => v === code[i])) return CORRECT;
    return { kind: 'invalid', issues: [{ cells: [], message: tpl(`seal.wrong.${p.rule}`) }] };
  }
  rate(p: SealPuzzle): number { return clampScore({ up: 35, down: 40, sum: 55, pairs: 60 }[p.rule]); }
  hint(p: SealPuzzle, s: SealState, level: HintLevel): Hint<SealState> | null {
    const code = sealCode(p);
    if (s.wheels.length === code.length && s.wheels.every((v, i) => v === code[i])) return null;
    const digits = p.rooms.map(sealDigit);
    if (level === HintLevel.Whisper) return { level, text: tpl('seal.hint.whisper'), focus: [] };
    if (level === HintLevel.Lead) {
      // The first room whose digit the player most likely misses: the first one of the rule's order.
      const order = p.rule === 'down' ? [...p.rooms.keys()].reverse() : [...p.rooms.keys()];
      const i = order[0];
      return { level, text: tpl('seal.hint.lead', [String(i + 1), String(digits[i])]), focus: [] };
    }
    if (level === HintLevel.Insight) return { level, text: tpl('seal.hint.insight', [digits.map((d, i) => `Salle ${i + 1} : ${d}`).join(', ')]), focus: [] };
    return { level, text: tpl('seal.hint.solution', [code.join(' ')]), focus: [], resultingState: { wheels: code.slice() } };
  }
  fingerprint(p: SealPuzzle): string { return `seal:${p.rule}:${p.rooms.join(',')}`; }
  parse(raw: unknown): SealPuzzle | null {
    const o = raw as { rooms?: unknown; rule?: unknown } | null;
    if (!o || !Array.isArray(o.rooms) || !o.rooms.length || o.rooms.length > 8 || !o.rooms.every((r) => typeof r === 'string')) return null;
    if (!SEAL_RULES.includes(o.rule as SealRule)) return null;
    return { rooms: o.rooms as string[], rule: o.rule as SealRule };
  }
  equals(a: SealPuzzle, b: SealPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
