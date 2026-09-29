import PuzzleKit

/// Identifiant stable d'un puzzle placé dans le monde (« clockworks.b1.r2.07 »). Ne change jamais.
public struct PuzzleID: RawRepresentable, Codable, CodingKeyRepresentable, Hashable, Sendable, Comparable, ExpressibleByStringLiteral, CustomStringConvertible {
    public let rawValue: String
    public init(rawValue: String) { self.rawValue = rawValue }
    public init(stringLiteral value: String) { rawValue = value }
    public var description: String { rawValue }
    public static func < (a: PuzzleID, b: PuzzleID) -> Bool { a.rawValue < b.rawValue }
}

public struct Lantern: Codable, Hashable, Sendable {
    public let puzzle: PuzzleID
    public let family: FamilyID
    public let tier: Tier
    public init(puzzle: PuzzleID, family: FamilyID, tier: Tier) { self.puzzle = puzzle; self.family = family; self.tier = tier }
}

public struct Room: Codable, Hashable, Sendable {
    public let id: String
    public let lanterns: [Lantern]
    public init(id: String, lanterns: [Lantern]) { self.id = id; self.lanterns = lanterns }
}

public struct Building: Codable, Hashable, Sendable {
    public let id: String
    public let rooms: [Room]
    /// Lanterne-clé écrite à la main (optionnelle, ex. le Phare n'en a pas).
    public let keystone: Lantern?
    /// Vrai si la lanterne-clé de ce bâtiment donne une lettre de l'Allumeur.
    public let keystoneGivesLetter: Bool
    public init(id: String, rooms: [Room], keystone: Lantern? = nil, keystoneGivesLetter: Bool = false) {
        self.id = id; self.rooms = rooms; self.keystone = keystone; self.keystoneGivesLetter = keystoneGivesLetter
    }

    public var regularLanterns: [Lantern] { rooms.flatMap(\.lanterns) }
    public var allLanterns: [Lantern] { regularLanterns + (keystone.map { [$0] } ?? []) }
}

public enum UnlockRule: Codable, Hashable, Sendable {
    case always
    case totalLights(Int)
    case totalLightsAndLetters(lights: Int, letters: Int)
}

public struct District: Codable, Hashable, Sendable {
    public let id: String
    public let unlock: UnlockRule
    public let buildings: [Building]
    public init(id: String, unlock: UnlockRule, buildings: [Building]) { self.id = id; self.unlock = unlock; self.buildings = buildings }
    public var allLanterns: [Lantern] { buildings.flatMap(\.allLanterns) }
}

public struct World: Codable, Hashable, Sendable {
    public let id: String
    public let districts: [District]
    public init(id: String, districts: [District]) { self.id = id; self.districts = districts }

    public var allLanterns: [Lantern] { districts.flatMap(\.allLanterns) }

    /// Vérifie qu'aucun identifiant de puzzle n'est placé deux fois.
    public var duplicatePuzzleIDs: [PuzzleID] {
        var seen = Set<PuzzleID>(), duplicates: [PuzzleID] = []
        for lantern in allLanterns where !seen.insert(lantern.puzzle).inserted { duplicates.append(lantern.puzzle) }
        return duplicates
    }
}
