/** Défi du jour, série et veilleuses — portage de GameCore/Daily.swift. */
import { SeededRNG, StableHash } from '../puzzlekit/rng';
import { Tier } from '../puzzlekit/types';
import { DayKey, addDays, dayKey, daysBetween, isoWeekday, localDayKey } from './dayKey';
import { DailyState } from './state';

export interface DailyAssignment { day: DayKey; family: string; tier: Tier; seed: bigint }
export const WEEKDAY_TIERS: Tier[] = [Tier.Glow, Tier.Glow, Tier.Flame, Tier.Flame, Tier.Blaze, Tier.Blaze, Tier.Beacon];

export class DailyPlanner {
  readonly families: string[];
  constructor(families: string[], readonly contentLanguage: string, readonly generatorVersion: number, readonly epoch: DayKey = dayKey(2026, 1, 5)) {
    if (families.length === 0) throw new RangeError('at least one family');
    this.families = [...new Set(families)];
  }
  /** Écart minimal garanti entre deux occurrences d'une même famille. */
  get guaranteedGap() { return Math.max(1, Math.min(5, Math.floor(this.families.length / 3) + 1)); }
  private rawBlock(index: number) {
    return new SeededRNG(StableHash.seed('daily-rotation', this.contentLanguage, String(this.generatorVersion), String(index))).shuffled(this.families);
  }
  block(index: number): string[] {
    const current = this.rawBlock(index), g = this.guaranteedGap - 1;
    if (g <= 0 || this.families.length < 3 * g) return current;
    const prevTail = new Set(this.rawBlock(index - 1).slice(-g));
    const editable = current.slice(0, current.length - g);
    return [...editable.filter((f) => !prevTail.has(f)), ...editable.filter((f) => prevTail.has(f)), ...current.slice(current.length - g)];
  }
  assignment(day: DayKey): DailyAssignment {
    const offset = daysBetween(day, this.epoch), n = this.families.length;
    const blockIndex = Math.floor(offset / n), position = offset - blockIndex * n;
    return { day, family: this.block(blockIndex)[position], tier: WEEKDAY_TIERS[isoWeekday(day) - 1], seed: StableHash.seed('daily', day, this.contentLanguage, String(this.generatorVersion)) };
  }
}

export type DailyCompletion =
  | { kind: 'alreadyDone' }
  | { kind: 'streakContinued'; streak: number; nightlightsUsed: number; nightlightEarned: boolean }
  | { kind: 'streakRestarted' }
  | { kind: 'recordedWithoutStreakChange' }
  | { kind: 'caughtUp' }
  | { kind: 'catchUpTooOld' };

export interface StreakRules { daysPerNightlight: number; maxNightlights: number; catchUpWindowDays: number; midnightGraceMs: number }
export const STANDARD_STREAK: StreakRules = { daysPerNightlight: 7, maxNightlights: 2, catchUpWindowDays: 7, midnightGraceMs: 2 * 3600 * 1000 };

export class StreakKeeper {
  constructor(readonly rules: StreakRules = STANDARD_STREAK, readonly dayOf: (d: Date) => DayKey = localDayKey) {}

  /** Jour crédité pour un défi commencé à `start` et fini à `end`. */
  creditedDay(challengeDay: DayKey, start: Date, end: Date): { day: DayKey; isCatchUp: boolean } {
    const finished = this.dayOf(end);
    if (finished === challengeDay) return { day: challengeDay, isCatchUp: false };
    const late = daysBetween(finished, challengeDay) > 0;
    if (late && this.dayOf(start) === challengeDay && end.getTime() - start.getTime() <= this.rules.midnightGraceMs) return { day: challengeDay, isCatchUp: false };
    return { day: challengeDay, isCatchUp: late };
  }

  complete(day: DayKey, today: DayKey, isCatchUp: boolean, s: DailyState): DailyCompletion {
    s.maxSeenDay = s.maxSeenDay && daysBetween(s.maxSeenDay, today) > 0 ? s.maxSeenDay : today;
    if (s.completedDays.has(day) || s.catchUpDays.has(day)) return { kind: 'alreadyDone' };
    if (isCatchUp) {
      if (daysBetween(today, day) > this.rules.catchUpWindowDays || daysBetween(today, day) <= 0) return { kind: 'catchUpTooOld' };
      s.catchUpDays.add(day);
      return { kind: 'caughtUp' };
    }
    s.completedDays.add(day);
    if (s.lastStreakDay === null) {
      s.streak = 1; s.lastStreakDay = day; s.bestStreak = Math.max(s.bestStreak, 1);
      return { kind: 'streakContinued', streak: 1, nightlightsUsed: 0, nightlightEarned: false };
    }
    const gap = daysBetween(day, s.lastStreakDay);
    if (gap <= 0) return { kind: 'recordedWithoutStreakChange' };
    let used = 0;
    if (gap >= 2) {
      const needed = gap - 1;
      if (s.nightlights < needed) { s.streak = 1; s.lastStreakDay = day; return { kind: 'streakRestarted' }; }
      s.nightlights -= needed;
      used = needed;
    }
    s.streak += 1;
    s.lastStreakDay = day;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    let earned = false;
    if (s.streak % this.rules.daysPerNightlight === 0 && s.nightlights < this.rules.maxNightlights) { s.nightlights++; earned = true; }
    return { kind: 'streakContinued', streak: s.streak, nightlightsUsed: used, nightlightEarned: earned };
  }
}
export { addDays };
