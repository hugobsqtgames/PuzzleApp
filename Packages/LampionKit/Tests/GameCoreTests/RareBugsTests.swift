import Foundation
import Testing
@testable import GameCore
import PuzzleKit

@Suite("Chasse aux bugs rares")
struct RareBugsTests {
    static let zones = ["Europe/Paris", "America/New_York", "Pacific/Kiritimati", "Pacific/Pago_Pago", "Asia/Kathmandu", "Australia/Lord_Howe", "America/St_Johns", "UTC"]

    @Test("Jour local = jour affiché par le système, autour des changements d'heure et de minuit", arguments: zones)
    func dayKeyMatchesFormatter(zone: String) throws {
        let tz = try #require(TimeZone(identifier: zone))
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = tz
        formatter.dateFormat = "yyyy-MM-dd"
        var rng = SeededRNG(seed: StableHash.seed(zone))
        let start = 1_767_225_600.0 // 2026-01-01
        for _ in 0..<4_000 {
            // Instants aléatoires, concentrés autour des heures piles (minuit, changements d'heure).
            let hour = Double(rng.below(24 * 365 * 4)) * 3600
            let jitter = Double(rng.int(in: -90...90))
            let date = Date(timeIntervalSince1970: start + hour + jitter)
            #expect(DayKey(date, timeZone: tz).description == formatter.string(from: date))
        }
    }

    @Test("Fuzz de la série : 20 000 opérations, invariants toujours vrais")
    func streakFuzz() {
        var rng = SeededRNG(seed: 11)
        let keeper = StreakKeeper()
        var s = DailyState()
        let base = DayKey(year: 2026, month: 9, day: 1)
        var today = 0
        for _ in 0..<20_000 {
            today += rng.pick([0, 1, 1, 1, 2, 3, -1, 40, -40])
            let day = base.adding(days: today + rng.pick([0, 0, 0, -1, -3, 1]))
            let catchUp = rng.chance(1, in: 6)
            _ = keeper.complete(day, today: base.adding(days: today), isCatchUp: catchUp, state: &s)
            #expect(s.streak >= 0 && s.bestStreak >= s.streak)
            #expect((0...StreakRules.standard.maxNightlights).contains(s.nightlights))
            #expect(s.completedDays.isDisjoint(with: s.catchUpDays))
            #expect(s.streak <= s.completedDays.count)
        }
    }

    @Test("Fuzz du moteur : actions aléatoires, y compris absurdes ; économie toujours cohérente", arguments: Array(0..<6))
    func engineFuzz(seed: Int) throws {
        var rng = SeededRNG(seed: UInt64(seed))
        let engine = GameEngine(world: Fixtures.world)
        let all = Fixtures.world.allLanterns
        let utc = try #require(TimeZone(identifier: "UTC"))
        var s = GameState()
        var now = Date(timeIntervalSince1970: 1_790_683_200)
        for step in 0..<3_000 {
            switch rng.below(6) {
            case 0, 1:
                let open = engine.progression.playableUnsolved(s)
                if let l = open.isEmpty ? nil : rng.pick(open) {
                    _ = engine.puzzleSolved(l.puzzle, record: SolveRecord(solvedAt: now, paidHints: rng.below(2)), state: &s)
                }
            case 2:
                _ = engine.puzzleSolved(rng.pick(all).puzzle, record: SolveRecord(solvedAt: now), state: &s) // souvent verrouillée
            case 3:
                _ = engine.buyHint(rng.pick(HintLevel.allCases), puzzle: rng.pick(all).puzzle, step: rng.below(3), state: &s)
            case 4:
                now = now.addingTimeInterval(Double(rng.int(in: -3...4)) * 86_400 + Double(rng.below(3600)))
                _ = engine.dailySolved(challengeDay: DayKey(now, timeZone: utc), startedAt: now, finishedAt: now, timeZone: utc, state: &s)
            default:
                // Aller-retour de sauvegarde en plein milieu.
                let e = JSONEncoder(); e.dateEncodingStrategy = .iso8601
                let d = JSONDecoder(); d.dateDecodingStrategy = .iso8601
                let copy = try d.decode(GameState.self, from: e.encode(s))
                #expect(copy == s, "save round-trip changed state at step \(step)")
                s = copy
            }
            #expect(s.wallet.balance >= 0)
            #expect(s.wallet.balance == s.wallet.earned - s.wallet.spent)
            for id in s.solved.keys { #expect(engine.progression.locate(id) != nil) }
        }
    }
}
