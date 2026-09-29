import Foundation
import Testing
@testable import GameCore
import PuzzleKit

@Suite("Audit des règles")
struct AuditTests {
    func decode(_ json: String) throws -> GameState {
        let d = JSONDecoder(); d.dateDecodingStrategy = .iso8601
        return try d.decode(GameState.self, from: Data(json.utf8))
    }

    @Test("Une entrée abîmée ne fait perdre qu'elle-même (progression, Éclats, série)")
    func partialCorruption() throws {
        let s = try decode("""
        {"solved":{"a":{"solvedAt":"2026-01-01T00:00:00Z","paidHints":0,"wrongAnswers":0,"usedSolution":false},
                   "b":{"solvedAt":"PAS UNE DATE","paidHints":0,"wrongAnswers":0,"usedSolution":false}},
         "wallet":{"balance":120,"earned":120,"spent":0,"appliedTransactions":["x",42]},
         "daily":{"completedDays":["2026-09-28","2026-02-30"],"catchUpDays":[],"streak":9,"bestStreak":9,"nightlights":1},
         "collectibles":["ok",7]}
        """)
        #expect(s.solved.keys.map(\.rawValue) == ["a"])
        #expect(s.wallet.balance == 120 && s.wallet.appliedTransactions == ["x"])
        #expect(s.daily.streak == 9 && s.daily.completedDays == [DayKey(year: 2026, month: 9, day: 28)])
        #expect(s.collectibles == ["ok"])
    }

    @Test("Valeurs négatives impossibles ramenées à zéro")
    func negativeValues() throws {
        let s = try decode(#"{"wallet":{"balance":-50,"earned":-1,"spent":-9,"appliedTransactions":[]},"daily":{"streak":-4,"bestStreak":-1,"nightlights":-2}}"#)
        #expect(s.wallet.balance == 0 && s.daily.streak == 0 && s.daily.nightlights == 0 && s.daily.bestStreak == 0)
    }

    @Test("Le portefeuille refuse un dépassement au lieu de planter")
    func walletOverflow() throws {
        var w = Wallet()
        try w.credit(Int.max, id: "a")
        #expect(throws: Wallet.Failure.invalidAmount) { try w.credit(1, id: "b") }
        #expect(w.balance == Int.max)
    }

    @Test("Une lanterne verrouillée ou inconnue ne peut pas être résolue")
    func lockedLantern() {
        let engine = GameEngine(world: Fixtures.world)
        var s = GameState()
        #expect(engine.puzzleSolved("obs.b4.key", record: SolveRecord(solvedAt: .now), state: &s).isEmpty)
        #expect(engine.puzzleSolved("n'existe.pas", record: SolveRecord(solvedAt: .now), state: &s).isEmpty)
        #expect(s.wallet.balance == 0 && s.solved.isEmpty)
    }

    @Test("« Continuer » reste dans le bâtiment en cours au lieu de revenir au Phare")
    func continueStaysNearby() {
        let p = Progression(world: Fixtures.world)
        var s = GameState()
        for l in Fixtures.world.districts[0].allLanterns.dropLast() { s.solved[l.puzzle] = SolveRecord(solvedAt: .distantPast) }
        for l in Fixtures.world.districts[1].buildings[0].rooms[0].lanterns { s.solved[l.puzzle] = SolveRecord(solvedAt: .distantPast); s.lastPuzzle = l.puzzle }
        #expect(p.recommended(s)?.puzzle.rawValue.hasPrefix("biblio.b1.r2") == true)
    }

    @Test("Les dates impossibles sont refusées ; années bissextiles correctes")
    func strictDates() {
        #expect(throws: (any Error).self) { try JSONDecoder().decode([DayKey].self, from: Data(#"["2026-02-30"]"#.utf8)) }
        #expect(throws: (any Error).self) { try JSONDecoder().decode([DayKey].self, from: Data(#"["2026-04-31"]"#.utf8)) }
        #expect(DayKey.isValid(year: 2028, month: 2, day: 29))
        #expect(!DayKey.isValid(year: 2100, month: 2, day: 29))
        #expect(DayKey.isValid(year: 2000, month: 2, day: 29))
    }

    @Test("Familles en double dans la rotation : dédoublonnées, écart garanti respecté")
    func duplicateFamilies() {
        let p = DailyPlanner(families: ["a", "a", "b", "c", "d", "e", "f"], contentLanguage: "fr", generatorVersion: 1)
        #expect(p.families == ["a", "b", "c", "d", "e", "f"])
        var last: [FamilyID: Int] = [:]
        for o in 0..<400 {
            let f = p.assignment(for: DayKey(year: 2026, month: 1, day: 5).adding(days: o)).family
            if let l = last[f] { #expect(o - l >= p.guaranteedGap) }
            last[f] = o
        }
    }

    @Test("Red team : spam de résolutions, d'indices et de défis — aucune récompense en double")
    func spam() throws {
        let engine = GameEngine(world: Fixtures.world)
        var s = GameState()
        let utc = try #require(TimeZone(identifier: "UTC"))
        let noon = Date(timeIntervalSince1970: 1_790_683_200)
        for _ in 0..<50 {
            _ = engine.puzzleSolved("phare.b1.r1.1", record: SolveRecord(solvedAt: noon), state: &s)
            _ = engine.dailySolved(challengeDay: DayKey(noon, timeZone: utc), startedAt: noon, finishedAt: noon, timeZone: utc, state: &s)
            _ = engine.buyHint(.lead, puzzle: "phare.b1.r1.2", step: 0, state: &s)
        }
        // 8 + 4 (Clairvoyance) + défi 15 + 1 (série) − 5 (Piste, une seule fois).
        #expect(s.wallet.balance == 8 + 4 + 16 - 5)
        #expect(s.daily.streak == 1)
    }

    @Test("Horloge avancée puis reculée : la série et les récompenses restent cohérentes")
    func clockJumps() throws {
        let engine = GameEngine(world: Fixtures.world)
        let utc = try #require(TimeZone(identifier: "UTC"))
        var s = GameState()
        let base = Date(timeIntervalSince1970: 1_790_683_200)
        for offset in [0, 1, 30, 2, 1, 31, -400] {
            let t = base.addingTimeInterval(Double(offset) * 86_400)
            _ = engine.dailySolved(challengeDay: DayKey(t, timeZone: utc), startedAt: t, finishedAt: t, timeZone: utc, state: &s)
            #expect(s.daily.streak >= 0 && s.daily.bestStreak >= s.daily.streak && s.wallet.balance >= 0)
        }
        // Six dates distinctes (le jour +1 est rejoué) : chacune n'est récompensée qu'une fois.
        #expect(s.wallet.appliedTransactions.filter { $0.hasPrefix("daily:") }.count == 6)
    }
}
