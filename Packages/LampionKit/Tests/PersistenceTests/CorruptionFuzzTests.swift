import Foundation
import Testing
@testable import GameCore
@testable import Persistence
import PuzzleKit

@Suite("Fuzz de corruption des sauvegardes")
struct CorruptionFuzzTests {
    @Test("600 fichiers principaux abîmés (octets modifiés, tronqués) : jamais de crash, jamais de progression inventée")
    func fuzz() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("lampion-fuzz-\(UUID().uuidString)")
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        _ = await store.load()
        var good = GameState()
        for i in 0..<40 { good.solved[PuzzleID(rawValue: "p\(i)")] = SolveRecord(solvedAt: Date(timeIntervalSince1970: 1_790_000_000)) }
        try good.wallet.credit(321, id: "seed")
        good.daily.streak = 5; good.daily.bestStreak = 7
        try await store.save(good)
        try await store.save(good) // la copie de secours existe
        let pristine = try Data(contentsOf: await store.mainURL)
        let backup = try Data(contentsOf: await store.backupURL)
        var rng = SeededRNG(seed: 99)
        var sources: [LoadSource: Int] = [:]
        for _ in 0..<600 {
            var bytes = [UInt8](pristine)
            switch rng.below(3) {
            case 0: for _ in 0..<rng.int(in: 1...8) { bytes[rng.below(bytes.count)] = UInt8(rng.below(256)) }
            case 1: bytes = Array(bytes.prefix(rng.below(bytes.count)))
            default: bytes.insert(contentsOf: Array("\"}]".utf8), at: rng.below(bytes.count))
            }
            try Data(bytes).write(to: await store.mainURL)
            try backup.write(to: await store.backupURL)
            let loaded = await SaveStore(directory: dir, appVersion: "1.0.0").load()
            sources[loaded.source, default: 0] += 1
            // Jamais plus de progression que l'original, jamais de valeur négative.
            #expect(loaded.state.solved.count <= 40)
            #expect(loaded.state.wallet.balance >= 0 && loaded.state.wallet.balance <= 321)
            #expect(loaded.state.daily.streak >= 0)
            // Si le fichier principal est illisible, la copie de secours restitue tout.
            // Qu'il vienne du secours ou d'un principal partiellement lisible complété par le secours : rien n'est perdu.
            #expect(loaded.state.solved == good.solved && loaded.state.wallet.balance == good.wallet.balance, "source \(loaded.source)")
            #expect(loaded.source != .fresh && loaded.source != .unavailable)
            for url in loaded.quarantined { try? FileManager.default.removeItem(at: url) }
        }
        print("sources:", sources)
    }
}

@Suite("Relecture partielle")
struct PartialReadTests {
    @Test("Une entrée abîmée dans le fichier principal est récupérée depuis la copie de secours, puis sauvegardée")
    func partialMainMergedWithBackup() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("lampion-partial-\(UUID().uuidString)")
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        _ = await store.load()
        var s = GameState()
        for i in 0..<5 { s.solved[PuzzleID(rawValue: "p\(i)")] = SolveRecord(solvedAt: Date(timeIntervalSince1970: 1_790_000_000)) }
        try s.wallet.credit(50, id: "a")
        try await store.save(s)
        s.solved["p5"] = SolveRecord(solvedAt: Date(timeIntervalSince1970: 1_790_000_100))
        try await store.save(s) // principal : 6 entrées ; secours : 5 entrées
        // Abîme une date du fichier principal : l'entrée p2 devient illisible.
        var text = String(decoding: try Data(contentsOf: await store.mainURL), as: UTF8.self)
        let range = try #require(text.range(of: #""p2":{"#))
        let dateRange = try #require(text.range(of: "2026-", range: range.upperBound..<text.endIndex))
        text.replaceSubrange(dateRange, with: "XXXX-")
        try Data(text.utf8).write(to: await store.mainURL)

        let reopened = SaveStore(directory: dir, appVersion: "1.0.0")
        let loaded = await reopened.load()
        #expect(loaded.source == .main && loaded.mergedWithBackup)
        #expect(loaded.state.solved.count == 6) // p5 (plus récent) conservé ET p2 récupéré
        #expect(loaded.state.wallet.balance == 50)
        try await reopened.save(loaded.state)
        let again = await SaveStore(directory: dir, appVersion: "1.0.0").load()
        #expect(again.state.solved.count == 6 && !again.mergedWithBackup)
    }

    @Test("Sans perte, aucune fusion n'a lieu (pas de résurrection de données effacées volontairement)")
    func noMergeWhenIntact() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("lampion-intact-\(UUID().uuidString)")
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        _ = await store.load()
        var s = GameState()
        s.inProgress["x"] = Data([1, 2, 3])
        try await store.save(s)
        s.inProgress["x"] = nil // puzzle abandonné volontairement
        try await store.save(s)
        let loaded = await SaveStore(directory: dir, appVersion: "1.0.0").load()
        #expect(!loaded.mergedWithBackup && loaded.state.inProgress.isEmpty)
    }
}
