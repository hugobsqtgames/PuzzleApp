import Foundation
import PuzzleKit

/// Défi du jour : une famille et un palier par date locale, et une graine identique
/// pour tous les joueurs de même langue et même version de générateur.
public struct DailyAssignment: Hashable, Sendable {
    public let day: DayKey
    public let family: FamilyID
    public let tier: Tier
    public let seed: UInt64
}

public struct DailyPlanner: Sendable {
    public let families: [FamilyID]
    public let contentLanguage: String
    public let generatorVersion: Int
    /// Premier jour du cycle de rotation.
    public let epoch: DayKey

    /// Palier par jour ISO (lundi → dimanche) : la semaine monte doucement.
    public static let weekdayTiers: [Tier] = [.glow, .glow, .flame, .flame, .blaze, .blaze, .beacon]

    public init(families: [FamilyID], contentLanguage: String, generatorVersion: Int, epoch: DayKey = DayKey(year: 2026, month: 1, day: 5)) {
        precondition(!families.isEmpty, "at least one family")
        self.families = families; self.contentLanguage = contentLanguage
        self.generatorVersion = generatorVersion; self.epoch = epoch
    }

    /// Écart minimal garanti entre deux occurrences d'une même famille.
    public var guaranteedGap: Int { max(1, min(5, families.count / 3 + 1)) }

    private var headSize: Int { guaranteedGap - 1 }

    private func rawBlock(_ index: Int) -> [FamilyID] {
        var rng = SeededRNG(seed: StableHash.seed("daily-rotation", contentLanguage, String(generatorVersion), String(index)))
        return rng.shuffled(families)
    }

    /// Ordre des familles d'un bloc. La fin d'un bloc n'est jamais modifiée ; seul son début est
    /// réordonné pour ne pas répéter les dernières familles du bloc précédent.
    func block(_ index: Int) -> [FamilyID] {
        var current = rawBlock(index)
        let g = headSize
        guard g > 0, families.count >= 3 * g else { return current }
        let previousTail = Set(rawBlock(index - 1).suffix(g))
        // Réordonne les positions 0..<(n - g) : d'abord les familles absentes de la fin précédente.
        let editable = Array(current[0..<(current.count - g)])
        let reordered = editable.filter { !previousTail.contains($0) } + editable.filter { previousTail.contains($0) }
        current.replaceSubrange(0..<(current.count - g), with: reordered)
        return current
    }

    public func assignment(for day: DayKey) -> DailyAssignment {
        let offset = day.days(since: epoch)
        let n = families.count
        let blockIndex = offset >= 0 ? offset / n : (offset - n + 1) / n
        let position = offset - blockIndex * n
        let family = block(blockIndex)[position]
        let tier = Self.weekdayTiers[day.isoWeekday - 1]
        let seed = StableHash.seed("daily", day.description, contentLanguage, String(generatorVersion))
        return DailyAssignment(day: day, family: family, tier: tier, seed: seed)
    }
}

/// Série (« flamme du soir ») et historique local du défi.
public struct DailyState: Codable, Hashable, Sendable {
    public var completedDays: Set<DayKey> = []
    public var catchUpDays: Set<DayKey> = []
    public var streak = 0
    public var bestStreak = 0
    public var nightlights = 0
    public var lastStreakDay: DayKey?
    /// Plus grande date jamais vue : protège contre une horloge reculée.
    public var maxSeenDay: DayKey?
    public init() {}
}

public enum DailyCompletion: Hashable, Sendable {
    case alreadyDone
    case streakContinued(streak: Int, nightlightsUsed: Int, nightlightEarned: Bool)
    case streakRestarted
    /// Jour antérieur au dernier jour de série (horloge reculée) : enregistré, série intacte.
    case recordedWithoutStreakChange
    case caughtUp
    case catchUpTooOld
}

public struct StreakRules: Codable, Hashable, Sendable {
    public var daysPerNightlight = 7
    public var maxNightlights = 2
    public var catchUpWindowDays = 7
    /// Un défi commencé avant minuit compte pour son jour s'il est fini dans ce délai.
    public var midnightGraceSeconds: TimeInterval = 2 * 3600
    public init() {}
    public static let standard = StreakRules()
}

public struct StreakKeeper: Sendable {
    public let rules: StreakRules
    public init(rules: StreakRules = .standard) { self.rules = rules }

    /// Jour crédité pour un défi commencé à `start` et fini à `end`, et s'il s'agit d'un rattrapage.
    public func creditedDay(challengeDay: DayKey, finishedAt end: Date, startedAt start: Date, timeZone: TimeZone = .current) -> (day: DayKey, isCatchUp: Bool) {
        let finishedDay = DayKey(end, timeZone: timeZone)
        if finishedDay == challengeDay { return (challengeDay, false) }
        if finishedDay > challengeDay, DayKey(start, timeZone: timeZone) == challengeDay, end.timeIntervalSince(start) <= rules.midnightGraceSeconds {
            return (challengeDay, false)
        }
        return (challengeDay, finishedDay > challengeDay)
    }

    /// Enregistre la réussite du défi de `day`. `today` sert à la fenêtre de rattrapage.
    public func complete(_ day: DayKey, today: DayKey, isCatchUp: Bool, state: inout DailyState) -> DailyCompletion {
        state.maxSeenDay = max(state.maxSeenDay ?? today, today)
        if state.completedDays.contains(day) || state.catchUpDays.contains(day) { return .alreadyDone }
        if isCatchUp {
            guard today.days(since: day) <= rules.catchUpWindowDays, day < today else { return .catchUpTooOld }
            state.catchUpDays.insert(day)
            return .caughtUp
        }
        state.completedDays.insert(day)
        guard let last = state.lastStreakDay else {
            state.streak = 1
            state.lastStreakDay = day
            state.bestStreak = max(state.bestStreak, 1)
            return .streakContinued(streak: 1, nightlightsUsed: 0, nightlightEarned: false)
        }
        let gap = day.days(since: last)
        if gap <= 0 { return .recordedWithoutStreakChange }
        var used = 0
        if gap >= 2 {
            let needed = gap - 1
            guard state.nightlights >= needed else {
                state.streak = 1
                state.lastStreakDay = day
                return .streakRestarted
            }
            state.nightlights -= needed
            used = needed
        }
        state.streak += 1
        state.lastStreakDay = day
        state.bestStreak = max(state.bestStreak, state.streak)
        var earned = false
        if state.streak % rules.daysPerNightlight == 0 && state.nightlights < rules.maxNightlights {
            state.nightlights += 1
            earned = true
        }
        return .streakContinued(streak: state.streak, nightlightsUsed: used, nightlightEarned: earned)
    }
}
