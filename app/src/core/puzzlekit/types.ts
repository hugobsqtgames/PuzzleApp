/** Types communs du moteur de puzzles — portage de PuzzleKit/PuzzleFamily.swift et Difficulty.swift. */
import { SeededRNG } from './rng';

export enum Tier {
  Spark = 0,
  Glow,
  Flame,
  Blaze,
  Beacon,
  Star,
}
export const TIER_KEYS = ['spark', 'glow', 'flame', 'blaze', 'beacon', 'star'] as const;
export const tierKey = (t: Tier) => `tier.${TIER_KEYS[t]}`;

export const clampScore = (v: number) => Math.min(100, Math.max(0, Math.trunc(v)));

/** Bornes inférieures (incluses) des paliers glow, flame, blaze, beacon, star. */
export class TierThresholds {
  readonly lowerBounds: readonly number[];
  constructor(lowerBounds: readonly number[]) {
    if (lowerBounds.length !== 5 || lowerBounds.some((b, i) => i > 0 && b < lowerBounds[i - 1])) {
      throw new RangeError('5 increasing bounds expected');
    }
    this.lowerBounds = lowerBounds;
  }
  static readonly standard = new TierThresholds([15, 30, 50, 70, 85]);
  tier(score: number): Tier {
    let tier = Tier.Spark;
    this.lowerBounds.forEach((bound, i) => {
      if (score >= bound) tier = (i + 1) as Tier;
    });
    return tier;
  }
}

export interface CellRef {
  row: number;
  column: number;
}
export const cell = (row: number, column: number): CellRef => ({ row, column });

/** Texte localisable avec paramètres : le moteur ne produit jamais de texte en dur. */
export interface LocalizedTemplate {
  key: string;
  args: string[];
}
export const tpl = (key: string, args: string[] = []): LocalizedTemplate => ({ key, args });

export interface DeductionStep {
  techniqueRank: number;
  technique: string;
  focus: CellRef[];
  explanation: LocalizedTemplate;
}

export interface SolveReport<Solution> {
  /** Nombre de solutions, plafonné par la limite demandée. */
  solutionCount: number;
  solutions: Solution[];
  trace: DeductionStep[];
  humanSolvable: boolean;
  searchNodes: number;
}
export const maxTechniqueRank = (r: SolveReport<unknown>) => r.trace.reduce((m, s) => Math.max(m, s.techniqueRank), 0);

export interface Issue {
  cells: CellRef[];
  message: LocalizedTemplate;
}
export type ValidationResult = { kind: 'correct' } | { kind: 'incomplete' } | { kind: 'invalid'; issues: Issue[] };
export const CORRECT: ValidationResult = { kind: 'correct' };
export const INCOMPLETE: ValidationResult = { kind: 'incomplete' };

export enum HintLevel {
  Whisper = 1,
  Lead,
  Insight,
  Solution,
}
export const HINT_LEVELS = [HintLevel.Whisper, HintLevel.Lead, HintLevel.Insight, HintLevel.Solution];

export interface Hint<State> {
  level: HintLevel;
  text: LocalizedTemplate;
  focus: CellRef[];
  resultingState?: State;
}

/** Contrat d'une famille (identique au protocole Swift). */
export interface PuzzleFamily<Puzzle, State, Params, Solution> {
  readonly id: string;
  readonly formatVersion: number;
  readonly requiresUniqueSolution: boolean;
  readonly generatorVersion: number;
  readonly thresholds: TierThresholds;
  generate(params: Params, rng: SeededRNG): Puzzle | null;
  solve(puzzle: Puzzle, limit: number): SolveReport<Solution>;
  initialState(puzzle: Puzzle): State;
  stateApplying(solution: Solution, puzzle: Puzzle): State;
  validate(puzzle: Puzzle, state: State): ValidationResult;
  rate(puzzle: Puzzle, report: SolveReport<Solution>): number;
  hint(puzzle: Puzzle, state: State, level: HintLevel): Hint<State> | null;
  fingerprint(puzzle: Puzzle): string;
  /** Contrôle de forme d'un puzzle venu de l'extérieur (contenu, sauvegarde) : jamais de crash sur des données abîmées. */
  parse(raw: unknown): Puzzle | null;
  equals(a: Puzzle, b: Puzzle): boolean;
}
