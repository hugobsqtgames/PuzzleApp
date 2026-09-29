/**
 * Point d'entrée unique des règles — portage de GameCore/GameEngine.swift.
 * L'état est modifié AVANT les animations : quitter l'app pendant une célébration ne perd rien et ne redonne rien.
 */
import { HintLevel, Tier } from '../puzzlekit/types';
import { DailyCompletion, StreakKeeper } from './daily';
import { DayKey } from './dayKey';
import { Progression } from './progression';
import { GameState, SolveRecord, WalletError, credit, debit, isClairvoyant } from './state';
import { World, buildingLanterns, districtLanterns } from './world';

export interface EconomyRules {
  tierRewards: number[]; clairvoyancePercent: number; roomBonus: number; buildingBonus: number; districtBonus: number;
  dailyReward: number; dailyStreakBonusCap: number; hintCosts: number[];
}
export const STANDARD_ECONOMY: EconomyRules = {
  tierRewards: [5, 8, 12, 16, 20, 25], clairvoyancePercent: 50, roomBonus: 20, buildingBonus: 50, districtBonus: 100,
  dailyReward: 15, dailyStreakBonusCap: 10, hintCosts: [0, 5, 10, 20],
};

export type Celebration =
  | { kind: 'lanternLit'; puzzle: string; shards: number; clairvoyanceBonus: number }
  | { kind: 'roomCompleted'; roomID: string; shards: number }
  | { kind: 'buildingCompleted'; buildingID: string; shards: number }
  | { kind: 'districtCompleted'; districtID: string; shards: number }
  | { kind: 'districtUnlocked'; districtID: string }
  | { kind: 'letterFound'; buildingID: string }
  | { kind: 'dailyCompleted'; result: DailyCompletion; shards: number };

export type HintPurchase = { kind: 'granted'; cost: number } | { kind: 'alreadyOwned' } | { kind: 'insufficientBalance'; missing: number };

const tryCredit = (s: GameState, amount: number, id: string) => { try { return credit(s.wallet, amount, id); } catch { return false; } };

export class GameEngine {
  readonly progression: Progression;
  constructor(world: World, readonly economy: EconomyRules = STANDARD_ECONOMY, readonly streaks: StreakKeeper = new StreakKeeper()) {
    this.progression = new Progression(world);
  }

  reward(tier: Tier, clairvoyant: boolean) {
    const base = this.economy.tierRewards[tier];
    return { base, bonus: clairvoyant ? Math.floor((base * this.economy.clairvoyancePercent) / 100) : 0 };
  }

  puzzleSolved(id: string, record: SolveRecord, s: GameState): Celebration[] {
    const p = this.progression;
    if (s.solved.has(id) || !p.isPlayable(id, s)) return [];
    const place = p.locate(id)!;
    const unlockedBefore = new Set(p.world.districts.filter((d) => p.isDistrictUnlocked(d, p.totalLights(s), p.letters(s))).map((d) => d.id));
    const lettersBefore = p.letters(s);
    s.solved.set(id, { ...record });
    s.inProgress.delete(id);
    s.lastPuzzle = id;
    const out: Celebration[] = [];
    const { base, bonus } = this.reward(place.lantern.tier, isClairvoyant(record));
    if (tryCredit(s, base + bonus, `puzzle:${id}`)) out.push({ kind: 'lanternLit', puzzle: id, shards: base, clairvoyanceBonus: bonus });
    if (place.room && p.lights(place.room.lanterns, s) === place.room.lanterns.length && tryCredit(s, this.economy.roomBonus, `room:${place.room.id}`)) {
      s.collectibles.add(`collectible.${place.room.id}`);
      out.push({ kind: 'roomCompleted', roomID: place.room.id, shards: this.economy.roomBonus });
    }
    const bl = buildingLanterns(place.building);
    if (p.lights(bl, s) === bl.length && tryCredit(s, this.economy.buildingBonus, `building:${place.building.id}`)) {
      out.push({ kind: 'buildingCompleted', buildingID: place.building.id, shards: this.economy.buildingBonus });
    }
    if (p.letters(s) > lettersBefore) out.push({ kind: 'letterFound', buildingID: place.building.id });
    const dl = districtLanterns(place.district);
    if (p.lights(dl, s) === dl.length && tryCredit(s, this.economy.districtBonus, `district:${place.district.id}`)) {
      out.push({ kind: 'districtCompleted', districtID: place.district.id, shards: this.economy.districtBonus });
    }
    const total = p.totalLights(s), letters = p.letters(s);
    for (const d of p.world.districts) if (!unlockedBefore.has(d.id) && p.isDistrictUnlocked(d, total, letters)) out.push({ kind: 'districtUnlocked', districtID: d.id });
    return out;
  }

  buyHint(level: HintLevel, puzzle: string, step: number, s: GameState): HintPurchase {
    const cost = this.economy.hintCosts[level - 1];
    const id = `hint:${puzzle}:${step}:${level}`;
    if (s.wallet.appliedTransactions.has(id)) return { kind: 'alreadyOwned' };
    try {
      debit(s.wallet, cost, id);
      return { kind: 'granted', cost };
    } catch (e) {
      return { kind: 'insufficientBalance', missing: e instanceof WalletError && e.reason === 'insufficient' ? e.missing : cost };
    }
  }

  dailySolved(challengeDay: DayKey, startedAt: Date, finishedAt: Date, s: GameState): Celebration[] {
    const today = this.streaks.dayOf(finishedAt);
    const credited = this.streaks.creditedDay(challengeDay, startedAt, finishedAt);
    const result = this.streaks.complete(credited.day, today, credited.isCatchUp, s.daily);
    let shards = 0;
    if (result.kind === 'streakContinued' || result.kind === 'streakRestarted' || result.kind === 'recordedWithoutStreakChange') {
      const amount = this.economy.dailyReward + Math.min(this.economy.dailyStreakBonusCap, s.daily.streak);
      if (tryCredit(s, amount, `daily:${credited.day}`)) shards = amount;
    } else if (result.kind === 'caughtUp') {
      if (tryCredit(s, this.economy.dailyReward, `daily:${credited.day}`)) shards = this.economy.dailyReward;
    }
    return [{ kind: 'dailyCompleted', result, shards }];
  }
}
