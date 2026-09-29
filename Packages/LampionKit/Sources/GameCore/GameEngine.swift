import Foundation
import PuzzleKit

/// Célébrations à jouer, dans l'ordre, après un événement.
public enum Celebration: Hashable, Sendable {
    case lanternLit(PuzzleID, shards: Int, clairvoyanceBonus: Int)
    case roomCompleted(roomID: String, shards: Int)
    case buildingCompleted(buildingID: String, shards: Int)
    case districtCompleted(districtID: String, shards: Int)
    case districtUnlocked(districtID: String)
    case letterFound(buildingID: String)
    case dailyCompleted(DailyCompletion, shards: Int)
}

public enum HintPurchase: Equatable, Sendable {
    case granted(cost: Int)
    case alreadyOwned
    case insufficientBalance(missing: Int)
}

/// Point d'entrée unique des règles : chaque action produit un nouvel état et des célébrations.
/// L'état est modifié AVANT les animations : quitter l'app pendant une célébration ne perd rien
/// et ne redonne jamais une récompense.
public struct GameEngine: Sendable {
    public let progression: Progression
    public let economy: EconomyRules
    public let streaks: StreakKeeper

    public init(world: World, progressionRules: ProgressionRules = .standard, economy: EconomyRules = .standard, streakRules: StreakRules = .standard) {
        progression = Progression(world: world, rules: progressionRules)
        self.economy = economy
        streaks = StreakKeeper(rules: streakRules)
    }

    public func reward(for tier: Tier, clairvoyant: Bool) -> (base: Int, bonus: Int) {
        let base = economy.tierRewards[tier.rawValue]
        return (base, clairvoyant ? base * economy.clairvoyancePercent / 100 : 0)
    }

    /// Une lanterne du monde est résolue.
    public func puzzleSolved(_ id: PuzzleID, record: SolveRecord, state: inout GameState) -> [Celebration] {
        guard state.solved[id] == nil, let place = progression.locate(id),
              let lantern = (place.room?.lanterns ?? place.building.keystone.map { [$0] } ?? []).first(where: { $0.puzzle == id })
        else { return [] }
        let unlockedBefore = Set(progression.world.districts.filter { progression.isUnlocked($0, state) }.map(\.id))
        let lettersBefore = progression.letters(state)
        state.solved[id] = record
        state.inProgress[id] = nil
        state.lastPuzzle = id

        var celebrations: [Celebration] = []
        let (base, bonus) = reward(for: lantern.tier, clairvoyant: record.clairvoyant)
        if (try? state.wallet.credit(base + bonus, id: "puzzle:\(id)")) == true {
            celebrations.append(.lanternLit(id, shards: base, clairvoyanceBonus: bonus))
        }
        if let room = place.room, progression.lights(room.lanterns, state) == room.lanterns.count,
           (try? state.wallet.credit(economy.roomBonus, id: "room:\(room.id)")) == true {
            state.collectibles.insert("collectible.\(room.id)")
            celebrations.append(.roomCompleted(roomID: room.id, shards: economy.roomBonus))
        }
        if progression.lights(place.building.allLanterns, state) == place.building.allLanterns.count,
           (try? state.wallet.credit(economy.buildingBonus, id: "building:\(place.building.id)")) == true {
            celebrations.append(.buildingCompleted(buildingID: place.building.id, shards: economy.buildingBonus))
        }
        if progression.letters(state) > lettersBefore {
            celebrations.append(.letterFound(buildingID: place.building.id))
        }
        if progression.lights(place.district.allLanterns, state) == place.district.allLanterns.count,
           (try? state.wallet.credit(economy.districtBonus, id: "district:\(place.district.id)")) == true {
            celebrations.append(.districtCompleted(districtID: place.district.id, shards: economy.districtBonus))
        }
        for district in progression.world.districts where !unlockedBefore.contains(district.id) && progression.isUnlocked(district, state) {
            celebrations.append(.districtUnlocked(districtID: district.id))
        }
        return celebrations
    }

    /// Achat d'un niveau d'indice pour une étape donnée d'un puzzle. `step` distingue les étapes
    /// successives : le même indice pour la même étape n'est jamais facturé deux fois.
    public func buyHint(_ level: HintLevel, puzzle: PuzzleID, step: Int, state: inout GameState) -> HintPurchase {
        let cost = economy.hintCosts[level.rawValue - 1]
        let id = "hint:\(puzzle):\(step):\(level.rawValue)"
        if state.wallet.appliedTransactions.contains(id) { return .alreadyOwned }
        do {
            try state.wallet.debit(cost, id: id)
            return .granted(cost: cost)
        } catch Wallet.Failure.insufficientBalance(let missing) {
            return .insufficientBalance(missing: missing)
        } catch {
            return .insufficientBalance(missing: cost)
        }
    }

    /// Défi du jour réussi.
    public func dailySolved(challengeDay: DayKey, startedAt: Date, finishedAt: Date, timeZone: TimeZone = .current, state: inout GameState) -> [Celebration] {
        let today = DayKey(finishedAt, timeZone: timeZone)
        let credited = streaks.creditedDay(challengeDay: challengeDay, finishedAt: finishedAt, startedAt: startedAt, timeZone: timeZone)
        let result = streaks.complete(credited.day, today: today, isCatchUp: credited.isCatchUp, state: &state.daily)
        var shards = 0
        switch result {
        case .streakContinued, .streakRestarted, .recordedWithoutStreakChange:
            let bonus = min(economy.dailyStreakBonusCap, state.daily.streak)
            if (try? state.wallet.credit(economy.dailyReward + bonus, id: "daily:\(credited.day)")) == true { shards = economy.dailyReward + bonus }
        case .caughtUp:
            if (try? state.wallet.credit(economy.dailyReward, id: "daily:\(credited.day)")) == true { shards = economy.dailyReward }
        case .alreadyDone, .catchUpTooOld:
            break
        }
        return [.dailyCompleted(result, shards: shards)]
    }
}
