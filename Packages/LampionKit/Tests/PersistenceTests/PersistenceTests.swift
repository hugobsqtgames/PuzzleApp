import Foundation
import Testing
@testable import GameCore
@testable import Persistence

@Suite("Sauvegarde")
struct PersistenceTests {
    func tempDirectory() -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("lampion-tests-\(UUID().uuidString)")
    }

    func sampleState() throws -> GameState {
        var s = GameState()
        s.solved["phare.b1.r1.1"] = SolveRecord(solvedAt: Date(timeIntervalSince1970: 1_790_000_000), paidHints: 1)
        try s.wallet.credit(42, id: "puzzle:phare.b1.r1.1")
        s.daily.completedDays = [DayKey(year: 2026, month: 9, day: 29)]
        s.daily.streak = 3
        s.equippedCosmetics["hat"] = "bonnet"
        s.onboardingDone = true
        return s
    }

    @Test("Aller-retour exact ; aucun fichier temporaire laissé")
    func roundTrip() async throws {
        let dir = tempDirectory()
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        let state = try sampleState()
        try await store.save(state)
        try await store.save(state)
        let loaded = await store.load()
        #expect(loaded.source == .main)
        #expect(loaded.state == state)
        let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).sorted()
        #expect(files == ["save.backup.json", "save.json"])
    }

    @Test("Fichier principal corrompu : la copie de secours est utilisée et le fichier abîmé mis de côté")
    func backupRecovery() async throws {
        let dir = tempDirectory()
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        var state = try sampleState()
        try await store.save(state)
        state.onboardingDone = false
        try await store.save(state)
        try Data("{ tronqué".utf8).write(to: await store.mainURL)
        let loaded = await store.load()
        #expect(loaded.source == .backup)
        #expect(loaded.state.onboardingDone == true) // version précédente
        #expect(loaded.quarantined.count == 1)
        #expect(FileManager.default.fileExists(atPath: loaded.quarantined[0].path))
    }

    @Test("Les deux fichiers illisibles : état neuf, sans crash, rien d'effacé")
    func bothCorrupted() async throws {
        let dir = tempDirectory()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        try Data([0xFF, 0x00, 0x13]).write(to: await store.mainURL)
        try Data("[]".utf8).write(to: await store.backupURL)
        let loaded = await store.load()
        #expect(loaded.source == .fresh)
        #expect(loaded.state == GameState())
        #expect(loaded.quarantined.count == 2)
    }

    @Test("Décodage tolérant : champs manquants par défaut, champ abîmé isolé, champs inconnus ignorés")
    func tolerantDecoding() async throws {
        let dir = tempDirectory()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        let json = """
        {"schemaVersion":1,"appVersion":"1.0.0","savedAt":"2026-09-29T20:00:00Z",
         "state":{"onboardingDone":true,"daily":"pas un objet","collectibles":["collectible.a"],"futureFeature":{"x":1}}}
        """
        try Data(json.utf8).write(to: await store.mainURL)
        let loaded = await store.load()
        #expect(loaded.source == .main)
        #expect(loaded.state.onboardingDone)
        #expect(loaded.state.collectibles == ["collectible.a"])
        #expect(loaded.state.daily == DailyState())
        #expect(loaded.state.wallet.balance == 0)
    }

    @Test("Les migrations s'appliquent en chaîne sur l'ancien format")
    func migrations() async throws {
        let dir = tempDirectory()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        // Format hypothétique v0 : « tutorialFinished » au lieu de « onboardingDone ».
        let v0 = """
        {"schemaVersion":0,"appVersion":"0.9","savedAt":"2026-01-01T00:00:00Z","state":{"tutorialFinished":true}}
        """
        let migration = SaveMigration(from: 0) { json in
            guard var state = json["state"] as? [String: Any] else { return }
            state["onboardingDone"] = state.removeValue(forKey: "tutorialFinished")
            json["state"] = state
        }
        let store = SaveStore(directory: dir, appVersion: "1.0.0", migrations: [migration])
        try Data(v0.utf8).write(to: await store.mainURL)
        let loaded = await store.load()
        #expect(loaded.migrated)
        #expect(loaded.state.onboardingDone)
    }

    @Test("Migration manquante : la copie de secours prend le relais plutôt qu'une lecture fausse")
    func missingMigration() async throws {
        let dir = tempDirectory()
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        try await store.save(try sampleState())
        try await store.save(try sampleState())
        try Data(#"{"schemaVersion":0,"state":{}}"#.utf8).write(to: await store.mainURL)
        let loaded = await store.load()
        #expect(loaded.source == .backup)
    }

    @Test("Une sauvegarde d'une version plus récente reste lisible")
    func newerSchema() async throws {
        let dir = tempDirectory()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let store = SaveStore(directory: dir, appVersion: "1.0.0")
        try Data(#"{"schemaVersion":7,"appVersion":"3.0","savedAt":"2030-01-01T00:00:00Z","state":{"onboardingDone":true}}"#.utf8).write(to: await store.mainURL)
        let loaded = await store.load()
        #expect(loaded.source == .main && loaded.state.onboardingDone)
    }
}
