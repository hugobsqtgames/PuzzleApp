import Foundation
import Testing
@testable import GameCore
import PuzzleKit

@Suite("Dates locales")
struct DayKeyTests {
    @Test("Numéro de jour : aller-retour sur 30 000 jours, dates connues")
    func ordinalRoundTrip() {
        #expect(DayKey(year: 1970, month: 1, day: 1).ordinal == 0)
        #expect(DayKey(year: 2000, month: 3, day: 1).ordinal == 11_017)
        for z in stride(from: -2_000, to: 28_000, by: 1) { #expect(DayKey(ordinal: z).ordinal == z) }
        #expect(DayKey(year: 2026, month: 9, day: 29).isoWeekday == 2) // mardi
        #expect(DayKey(year: 2028, month: 2, day: 29).adding(days: 1) == DayKey(year: 2028, month: 3, day: 1))
    }

    @Test("Le jour dépend du fuseau de l'appareil")
    func timeZones() throws {
        // 2026-09-29 23:30 UTC = 30 septembre à Paris, 29 septembre à New York.
        let instant = Date(timeIntervalSince1970: 1_790_724_600)
        #expect(DayKey(instant, timeZone: try #require(TimeZone(identifier: "UTC"))) == DayKey(year: 2026, month: 9, day: 29))
        #expect(DayKey(instant, timeZone: try #require(TimeZone(identifier: "Europe/Paris"))) == DayKey(year: 2026, month: 9, day: 30))
        #expect(DayKey(instant, timeZone: try #require(TimeZone(identifier: "America/New_York"))) == DayKey(year: 2026, month: 9, day: 29))
    }

    @Test("Encodage JSON en « AAAA-MM-JJ » et rejet des dates invalides")
    func coding() throws {
        let data = try JSONEncoder().encode([DayKey(year: 2026, month: 9, day: 29)])
        #expect(String(decoding: data, as: UTF8.self) == "[\"2026-09-29\"]")
        #expect(try JSONDecoder().decode([DayKey].self, from: data) == [DayKey(year: 2026, month: 9, day: 29)])
        #expect(throws: DecodingError.self) { try JSONDecoder().decode([DayKey].self, from: Data("[\"2026-13-01\"]".utf8)) }
    }
}

@Suite("Progression")
struct ProgressionTests {
    let progression = Progression(world: Fixtures.world)

    func solving(_ ids: [String]) -> GameState {
        var s = GameState()
        for id in ids { s.solved[PuzzleID(rawValue: id)] = SolveRecord(solvedAt: .distantPast) }
        return s
    }

    @Test("Le monde de test contient 1 000 lanternes sans doublon")
    func worldSize() {
        #expect(Fixtures.world.allLanterns.count == 1_000)
        #expect(Fixtures.world.duplicatePuzzleIDs.isEmpty)
    }

    @Test("Salle suivante à 60 % arrondi au supérieur : 6/10, 4/6")
    func roomRule() {
        #expect(ProgressionRules.standard.lightsToOpenNextRoom(afterRoomOf: 10) == 6)
        #expect(ProgressionRules.standard.lightsToOpenNextRoom(afterRoomOf: 6) == 4)
        #expect(ProgressionRules.standard.lightsToOpenNextRoom(afterRoomOf: 9) == 6)
        let phare = Fixtures.world.districts[0].buildings[0]
        #expect(!progression.isUnlocked(room: 1, in: phare, buildingUnlocked: true, solving(["phare.b1.r1.1", "phare.b1.r1.2", "phare.b1.r1.3"])))
        #expect(progression.isUnlocked(room: 1, in: phare, buildingUnlocked: true, solving((1...4).map { "phare.b1.r1.\($0)" })))
    }

    @Test("Au départ : les 6 lanternes de la Cuisine du Phare, et rien d'autre")
    func start() {
        #expect(progression.playableLanterns(GameState()).map(\.puzzle.rawValue) == (1...6).map { "phare.b1.r1.\($0)" })
    }

    @Test("La Bibliothèque ouvre à 14 lumières")
    func districtThreshold() {
        let phare = Fixtures.world.districts[0].allLanterns.map(\.puzzle.rawValue)
        #expect(!progression.isUnlocked(Fixtures.world.districts[1], solving(Array(phare.prefix(13)))))
        #expect(progression.isUnlocked(Fixtures.world.districts[1], solving(Array(phare.prefix(14)))))
    }

    @Test("La lanterne-clé ouvre à 30 lanternes du bâtiment")
    func keystone() {
        let b = Fixtures.world.districts[1].buildings[0]
        let ids = b.regularLanterns.map(\.puzzle.rawValue)
        #expect(!progression.isKeystoneUnlocked(b, buildingUnlocked: true, solving(Array(ids.prefix(29)))))
        #expect(progression.isKeystoneUnlocked(b, buildingUnlocked: true, solving(Array(ids.prefix(30)))))
    }

    @Test("Jamais bloqué : ≥ min(3, restantes) lanternes jouables sur des parties aléatoires complètes", arguments: Array(0..<12))
    func neverStuck(seed: Int) {
        var rng = SeededRNG(seed: UInt64(seed))
        var state = GameState()
        let total = Fixtures.world.allLanterns.count
        var solvedCount = 0
        while true {
            let open = progression.playableUnsolved(state)
            #expect(open.count >= min(3, total - solvedCount), "stuck after \(solvedCount) lights")
            guard !open.isEmpty else { break }
            // Joueur réaliste : suit souvent la recommandation, papillonne parfois.
            let pick = rng.chance(2, in: 3) ? progression.recommended(state)! : rng.pick(open)
            state.solved[pick.puzzle] = SolveRecord(solvedAt: .distantPast)
            state.lastPuzzle = pick.puzzle
            solvedCount += 1
        }
        #expect(solvedCount == total)
    }
}

@Suite("Économie et récompenses")
struct EconomyTests {
    let engine = GameEngine(world: Fixtures.world)

    @Test("Crédit et débit idempotents ; le solde ne devient jamais négatif")
    func wallet() throws {
        var w = Wallet()
        #expect(try w.credit(10, id: "a"))
        #expect(try !w.credit(10, id: "a"))
        #expect(w.balance == 10)
        #expect(throws: Wallet.Failure.insufficientBalance(missing: 5)) { try w.debit(15, id: "b") }
        #expect(w.balance == 10)
        #expect(try w.debit(4, id: "c"))
        #expect(try !w.debit(4, id: "c"))
        #expect(w.balance == 6 && w.earned == 10 && w.spent == 4)
    }

    @Test("Récompense par palier et bonus Clairvoyance")
    func rewards() {
        #expect(engine.reward(for: .flame, clairvoyant: true) == (12, 6))
        #expect(engine.reward(for: .flame, clairvoyant: false) == (12, 0))
        #expect(engine.reward(for: .star, clairvoyant: true) == (25, 12))
    }

    @Test("Résoudre deux fois la même lanterne ne rapporte rien la seconde fois")
    func doubleSolve() {
        var s = GameState()
        let id: PuzzleID = "phare.b1.r1.1"
        let first = engine.puzzleSolved(id, record: SolveRecord(solvedAt: .now), state: &s)
        let balance = s.wallet.balance
        let second = engine.puzzleSolved(id, record: SolveRecord(solvedAt: .now), state: &s)
        #expect(first == [.lanternLit(id, shards: 8, clairvoyanceBonus: 4)])
        #expect(second.isEmpty)
        #expect(s.wallet.balance == balance)
    }

    @Test("Salle complète : bonus et objet trouvé une seule fois ; quartier débloqué annoncé")
    func completionAndUnlock() {
        var s = GameState()
        var all: [Celebration] = []
        for lantern in Fixtures.world.districts[0].allLanterns {
            all += engine.puzzleSolved(lantern.puzzle, record: SolveRecord(solvedAt: .now, paidHints: 1), state: &s)
        }
        #expect(all.filter { if case .roomCompleted = $0 { true } else { false } }.count == 4)
        #expect(all.filter { if case .buildingCompleted = $0 { true } else { false } }.count == 1)
        #expect(all.filter { if case .districtCompleted = $0 { true } else { false } }.count == 1)
        #expect(all.contains(.districtUnlocked(districtID: "biblio")))
        #expect(s.collectibles.count == 4)
        // 24 × 8 + 4 × 20 + 50 + 100, sans Clairvoyance (indice payé).
        #expect(s.wallet.balance == 24 * 8 + 4 * 20 + 50 + 100)
    }

    @Test("Un indice acheté pour une étape n'est jamais facturé deux fois")
    func hintPurchase() throws {
        var s = GameState()
        try s.wallet.credit(12, id: "seed")
        #expect(engine.buyHint(.whisper, puzzle: "p", step: 0, state: &s) == .granted(cost: 0))
        #expect(engine.buyHint(.lead, puzzle: "p", step: 0, state: &s) == .granted(cost: 5))
        #expect(engine.buyHint(.lead, puzzle: "p", step: 0, state: &s) == .alreadyOwned)
        #expect(engine.buyHint(.insight, puzzle: "p", step: 0, state: &s) == .insufficientBalance(missing: 3))
        #expect(s.wallet.balance == 7)
    }
}

@Suite("Défi du jour")
struct DailyTests {
    let families: [FamilyID] = ["sequences", "lamps", "locks", "gears", "marquetry", "liars", "inquiries", "scales", "patterns", "thread", "switches", "mirrors"]

    @Test("Même date, même langue, même version : même défi")
    func deterministic() {
        let a = DailyPlanner(families: families, contentLanguage: "fr", generatorVersion: 1)
        let b = DailyPlanner(families: families, contentLanguage: "fr", generatorVersion: 1)
        let day = DayKey(year: 2026, month: 9, day: 29)
        #expect(a.assignment(for: day) == b.assignment(for: day))
        #expect(a.assignment(for: day).seed != DailyPlanner(families: families, contentLanguage: "en", generatorVersion: 1).assignment(for: day).seed)
    }

    @Test("Aucune famille ne revient avant l'écart garanti, sur 5 ans", arguments: [3, 5, 12])
    func rotationGap(count: Int) {
        let planner = DailyPlanner(families: Array(families.prefix(count)), contentLanguage: "fr", generatorVersion: 1)
        let start = DayKey(year: 2025, month: 12, day: 1)
        var lastSeen: [FamilyID: Int] = [:]
        var counts: [FamilyID: Int] = [:]
        for offset in 0..<(365 * 5) {
            let family = planner.assignment(for: start.adding(days: offset)).family
            if let last = lastSeen[family] { #expect(offset - last >= planner.guaranteedGap, "\(family) after \(offset - last) days") }
            lastSeen[family] = offset
            counts[family, default: 0] += 1
        }
        #expect(counts.count == count)
        #expect((counts.values.max() ?? 0) - (counts.values.min() ?? 0) <= 2)
        if count == 12 { #expect(planner.guaranteedGap == 5) }
    }

    @Test("Le palier suit le jour de la semaine")
    func weekdayTier() {
        let planner = DailyPlanner(families: families, contentLanguage: "fr", generatorVersion: 1)
        #expect(planner.assignment(for: DayKey(year: 2026, month: 9, day: 28)).tier == .glow) // lundi
        #expect(planner.assignment(for: DayKey(year: 2026, month: 10, day: 2)).tier == .blaze) // vendredi
        #expect(planner.assignment(for: DayKey(year: 2026, month: 10, day: 4)).tier == .beacon) // dimanche
    }
}

@Suite("Série et veilleuses")
struct StreakTests {
    let keeper = StreakKeeper()
    let d0 = DayKey(year: 2026, month: 9, day: 1)

    func run(_ offsets: [Int], nightlights: Int = 0) -> (DailyState, [DailyCompletion]) {
        var s = DailyState()
        s.nightlights = nightlights
        let results = offsets.map { keeper.complete(d0.adding(days: $0), today: d0.adding(days: $0), isCatchUp: false, state: &s) }
        return (s, results)
    }

    @Test("Jours consécutifs : la série monte, une veilleuse tous les 7 soirs, 2 au maximum")
    func consecutive() {
        let (s, _) = run(Array(0..<21))
        #expect(s.streak == 21 && s.bestStreak == 21)
        #expect(s.nightlights == 2)
    }

    @Test("Un soir manqué est couvert par une veilleuse")
    func gapCovered() {
        let (s, results) = run([0, 1, 3], nightlights: 1)
        #expect(results.last == .streakContinued(streak: 3, nightlightsUsed: 1, nightlightEarned: false))
        #expect(s.nightlights == 0)
    }

    @Test("Sans veilleuse, la série repart à 1 ; le record est conservé")
    func gapBreaks() {
        let (s, results) = run([0, 1, 2, 5])
        #expect(results.last == .streakRestarted)
        #expect(s.streak == 1 && s.bestStreak == 3)
    }

    @Test("Refaire le même jour ne change rien")
    func sameDay() {
        let (s, results) = run([0, 0])
        #expect(results.last == .alreadyDone)
        #expect(s.streak == 1)
    }

    @Test("Horloge reculée : le jour est enregistré, la série n'est jamais cassée")
    func clockBackwards() {
        var s = DailyState()
        _ = keeper.complete(d0.adding(days: 5), today: d0.adding(days: 5), isCatchUp: false, state: &s)
        let r = keeper.complete(d0.adding(days: 2), today: d0.adding(days: 2), isCatchUp: false, state: &s)
        #expect(r == .recordedWithoutStreakChange)
        #expect(s.streak == 1 && s.maxSeenDay == d0.adding(days: 5))
    }

    @Test("Rattrapage : 7 jours maximum, ne compte pas pour la série")
    func catchUp() {
        var s = DailyState()
        #expect(keeper.complete(d0, today: d0.adding(days: 7), isCatchUp: true, state: &s) == .caughtUp)
        #expect(keeper.complete(d0.adding(days: -1), today: d0.adding(days: 7), isCatchUp: true, state: &s) == .catchUpTooOld)
        #expect(s.streak == 0)
    }

    @Test("Minuit pendant le défi : compte pour son jour s'il est fini dans les 2 h")
    func midnightGrace() throws {
        let utc = try #require(TimeZone(identifier: "UTC"))
        let day = DayKey(year: 2026, month: 9, day: 29)
        let start = Date(timeIntervalSince1970: 1_790_726_400 - 1_800) // 23:30
        let quick = keeper.creditedDay(challengeDay: day, finishedAt: start.addingTimeInterval(3_600), startedAt: start, timeZone: utc)
        let slow = keeper.creditedDay(challengeDay: day, finishedAt: start.addingTimeInterval(3 * 3_600), startedAt: start, timeZone: utc)
        #expect(quick.day == day && !quick.isCatchUp)
        #expect(slow.day == day && slow.isCatchUp)
    }

    @Test("Défi du jour dans le moteur : récompense unique par date")
    func engineDaily() throws {
        let engine = GameEngine(world: Fixtures.world)
        let utc = try #require(TimeZone(identifier: "UTC"))
        var s = GameState()
        let noon = Date(timeIntervalSince1970: 1_790_683_200) // 2026-09-29 12:00 UTC
        let first = engine.dailySolved(challengeDay: DayKey(noon, timeZone: utc), startedAt: noon, finishedAt: noon, timeZone: utc, state: &s)
        let again = engine.dailySolved(challengeDay: DayKey(noon, timeZone: utc), startedAt: noon, finishedAt: noon, timeZone: utc, state: &s)
        #expect(first == [.dailyCompleted(.streakContinued(streak: 1, nightlightsUsed: 0, nightlightEarned: false), shards: 16)])
        #expect(again == [.dailyCompleted(.alreadyDone, shards: 0)])
        #expect(s.wallet.balance == 16)
    }
}
