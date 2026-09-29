/** Pipeline d'acceptation : GENERATE → SOLVE → UNIQUE? → VALIDATE → RATE → TIER? → DOUBLON? — portage de CandidatePipeline.swift. */
import { SeededRNG, StableHash } from './rng';
import { PuzzleFamily, SolveReport, Tier } from './types';

export type RejectReason = 'generation-failed' | 'no-solution' | 'not-unique' | 'solution-rejected' | 'not-human-solvable' | `wrong-tier(${number})` | 'duplicate';

export interface Accepted<P, Sol> {
  seed: bigint;
  puzzle: P;
  score: number;
  tier: Tier;
  fingerprint: string;
  report: SolveReport<Sol>;
}

export type Outcome<P, Sol> = { accepted: Accepted<P, Sol> } | { rejected: RejectReason };

export class CandidatePipeline<P, S, Params, Sol> {
  allowNonHumanSolvableBelowStar = false;
  constructor(readonly family: PuzzleFamily<P, S, Params, Sol>) {}

  evaluate(params: Params, seed: bigint, targetTiers?: [Tier, Tier], seen: Set<string> = new Set()): Outcome<P, Sol> {
    const f = this.family;
    const puzzle = f.generate(params, new SeededRNG(seed));
    if (puzzle === null) return { rejected: 'generation-failed' };
    const report = f.solve(puzzle, 2);
    const solution = report.solutions[0];
    if (report.solutionCount <= 0 || solution === undefined) return { rejected: 'no-solution' };
    if (f.requiresUniqueSolution && report.solutionCount !== 1) return { rejected: 'not-unique' };
    if (f.validate(puzzle, f.stateApplying(solution, puzzle)).kind !== 'correct') return { rejected: 'solution-rejected' };
    const score = f.rate(puzzle, report);
    const tier = f.thresholds.tier(score);
    if (!report.humanSolvable && tier < Tier.Star && !this.allowNonHumanSolvableBelowStar) return { rejected: 'not-human-solvable' };
    if (targetTiers && (tier < targetTiers[0] || tier > targetTiers[1])) return { rejected: `wrong-tier(${tier})` };
    const print = f.fingerprint(puzzle);
    if (seen.has(print)) return { rejected: 'duplicate' };
    return { accepted: { seed, puzzle, score, tier, fingerprint: print, report } };
  }

  generate(count: number, params: Params, seedBase: bigint, targetTiers?: [Tier, Tier], maxAttempts = 10_000) {
    const accepted: Accepted<P, Sol>[] = [];
    const seen = new Set<string>();
    const rejections = new Map<RejectReason, number>();
    const U64 = (1n << 64n) - 1n;
    for (let attempt = 0; accepted.length < count && attempt < maxAttempts; attempt++) {
      const seed = StableHash.seed(this.family.id, String(this.family.generatorVersion), ((seedBase + BigInt(attempt)) & U64).toString());
      const outcome = this.evaluate(params, seed, targetTiers, seen);
      if ('accepted' in outcome) {
        accepted.push(outcome.accepted);
        seen.add(outcome.accepted.fingerprint);
      } else {
        rejections.set(outcome.rejected, (rejections.get(outcome.rejected) ?? 0) + 1);
      }
    }
    return { accepted, rejections };
  }
}
