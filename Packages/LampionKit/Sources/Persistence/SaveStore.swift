import Foundation
import GameCore
#if canImport(Darwin)
import Darwin
#elseif canImport(Glibc)
import Glibc
#endif

/// Enveloppe versionnée de la sauvegarde.
public struct SaveEnvelope: Codable, Sendable {
    public var schemaVersion: Int
    public var appVersion: String
    public var savedAt: Date
    public var state: GameState
}

/// Migration d'un schéma N vers N+1, sur le JSON brut (avant décodage typé).
public struct SaveMigration: Sendable {
    public let from: Int
    public let migrate: @Sendable (inout [String: Any]) throws -> Void
    public init(from: Int, migrate: @escaping @Sendable (inout [String: Any]) throws -> Void) { self.from = from; self.migrate = migrate }
}

public enum LoadSource: Equatable, Sendable {
    case main, backup, fresh
    /// Fichiers présents mais impossibles à LIRE (appareil verrouillé, protection des données, erreur disque).
    /// Rien n'est mis de côté et l'écriture est bloquée : écrire maintenant écraserait une progression intacte.
    case unavailable
}

public enum SaveError: Error, Equatable {
    /// `save` appelé sans chargement réussi préalable : refusé pour ne jamais écraser une sauvegarde non lue.
    case notLoaded
}

public struct LoadResult: Sendable {
    public let state: GameState
    public let source: LoadSource
    /// Chemin où un fichier illisible a été mis de côté (jamais écrasé), pour diagnostic.
    public let quarantined: [URL]
    /// Vrai si une migration a été appliquée.
    public let migrated: Bool
}

/// Sauvegarde locale robuste (TECHNICAL_ARCHITECTURE § 10) :
/// écriture atomique, copie de secours, migrations en chaîne, décodage tolérant, jamais de crash.
public actor SaveStore {
    public static let currentSchemaVersion = 1

    private let directory: URL
    private let appVersion: String
    private let migrations: [Int: SaveMigration]
    private let fileManager = FileManager.default
    private let clock: @Sendable () -> Date
    /// Vrai une fois qu'un chargement a abouti (y compris « neuf » quand aucun fichier n'existe).
    private var writable = false

    public var mainURL: URL { directory.appendingPathComponent("save.json") }
    public var backupURL: URL { directory.appendingPathComponent("save.backup.json") }

    public init(directory: URL, appVersion: String, migrations: [SaveMigration] = [], clock: @escaping @Sendable () -> Date = Date.init) {
        self.directory = directory
        self.appVersion = appVersion
        self.migrations = Dictionary(uniqueKeysWithValues: migrations.map { ($0.from, $0) })
        self.clock = clock
    }

    private static func encoder() -> JSONEncoder {
        let e = JSONEncoder()
        e.outputFormatting = [.sortedKeys]
        e.dateEncodingStrategy = .iso8601
        return e
    }

    private static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }

    /// Écrit l'état : fichier temporaire → la sauvegarde courante devient la copie de secours → remplacement.
    public func save(_ state: GameState) throws {
        guard writable else { throw SaveError.notLoaded }
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        let envelope = SaveEnvelope(schemaVersion: Self.currentSchemaVersion, appVersion: appVersion, savedAt: clock(), state: state)
        let data = try Self.encoder().encode(envelope)
        let temp = directory.appendingPathComponent("save.\(UUID().uuidString).tmp")
        try data.write(to: temp, options: .atomic)
        if fileManager.fileExists(atPath: mainURL.path) {
            if fileManager.fileExists(atPath: backupURL.path) { try fileManager.removeItem(at: backupURL) }
            try fileManager.copyItem(at: mainURL, to: backupURL)
        }
        // rename(2) remplace la cible de façon atomique sur un même volume (Darwin comme Linux).
        guard rename(temp.path, mainURL.path) == 0 else {
            let code = errno
            try? fileManager.removeItem(at: temp)
            throw POSIXError(POSIXErrorCode(rawValue: code) ?? .EIO)
        }
    }

    /// Charge l'état : principal → secours → état neuf. Ne lève jamais d'erreur.
    public func load() -> LoadResult {
        removeStaleTemporaryFiles()
        var quarantined: [URL] = []
        var unreadable = false
        for (url, source) in [(mainURL, LoadSource.main), (backupURL, .backup)] {
            guard fileManager.fileExists(atPath: url.path) else { continue }
            let data: Data
            do { data = try Data(contentsOf: url) } catch {
                // Illisible ≠ abîmé : on ne touche à rien.
                unreadable = true
                continue
            }
            if let (state, migrated, schema) = try? decode(data) {
                if schema > Self.currentSchemaVersion { preserveNewerSave(url, schema: schema) }
                writable = true
                return LoadResult(state: state, source: source, quarantined: quarantined, migrated: migrated)
            }
            if let moved = quarantine(url) { quarantined.append(moved) }
        }
        if unreadable {
            writable = false
            return LoadResult(state: GameState(), source: .unavailable, quarantined: quarantined, migrated: false)
        }
        writable = true
        return LoadResult(state: GameState(), source: .fresh, quarantined: quarantined, migrated: false)
    }

    /// Fichiers temporaires laissés par une écriture interrompue (arrêt brutal entre l'écriture et le renommage).
    private func removeStaleTemporaryFiles() {
        guard let names = try? fileManager.contentsOfDirectory(atPath: directory.path) else { return }
        for name in names where name.hasPrefix("save.") && name.hasSuffix(".tmp") {
            try? fileManager.removeItem(at: directory.appendingPathComponent(name))
        }
    }

    /// Une sauvegarde écrite par une version plus récente de l'app est copiée à l'identique avant d'être
    /// réécrite dans l'ancien format (retour à une version antérieure) : ses champs inconnus ne sont pas perdus.
    private func preserveNewerSave(_ url: URL, schema: Int) {
        let copy = directory.appendingPathComponent("save.schema\(schema).preserved.json")
        guard !fileManager.fileExists(atPath: copy.path) else { return }
        try? fileManager.copyItem(at: url, to: copy)
    }

    private func decode(_ data: Data) throws -> (GameState, Bool, Int) {
        guard var json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw CocoaError(.fileReadCorruptFile)
        }
        let original = json["schemaVersion"] as? Int ?? 0
        var version = original
        guard version <= Self.currentSchemaVersion else {
            // Sauvegarde d'une version plus récente de l'app : on lit ce qu'on comprend, sans migrer.
            return (try Self.decodeState(json), false, original)
        }
        var migrated = false
        while version < Self.currentSchemaVersion {
            guard let migration = migrations[version] else { throw CocoaError(.fileReadCorruptFile) }
            try migration.migrate(&json)
            version += 1
            json["schemaVersion"] = version
            migrated = true
        }
        return (try Self.decodeState(json), migrated, original)
    }

    private static func decodeState(_ json: [String: Any]) throws -> GameState {
        guard let stateJSON = json["state"] else { throw CocoaError(.fileReadCorruptFile) }
        let data = try JSONSerialization.data(withJSONObject: stateJSON)
        return try decoder().decode(GameState.self, from: data)
    }

    private func quarantine(_ url: URL) -> URL? {
        let target = directory.appendingPathComponent("corrupt-\(Int(clock().timeIntervalSince1970))-\(url.lastPathComponent)")
        return (try? fileManager.moveItem(at: url, to: target)) != nil ? target : nil
    }
}
