@testable import GameCore
import PuzzleKit

/// Monde de test aux proportions de la V1 (GAME_DESIGN § 2) : Phare 4 × 6,
/// 6 quartiers × 4 bâtiments × (10, 10, 10, 9 + clé), Grenier 16.
enum Fixtures {
    static func lantern(_ id: String, _ tier: Tier = .glow) -> Lantern { Lantern(puzzle: PuzzleID(rawValue: id), family: "lamps", tier: tier) }

    static func room(_ id: String, _ count: Int) -> Room {
        Room(id: id, lanterns: (1...count).map { lantern("\(id).\($0)") })
    }

    static let thresholds = [110, 206, 302, 398, 494]

    static let world: World = {
        let phare = District(id: "phare", unlock: .always, buildings: [
            Building(id: "phare.b1", rooms: (1...4).map { room("phare.b1.r\($0)", 6) }),
        ])
        let unlocks: [UnlockRule] = [.totalLights(14)] + thresholds.map { .totalLights($0) }
        let districts = ["biblio", "horlo", "serre", "marche", "theatre", "obs"].enumerated().map { index, name in
            District(id: name, unlock: unlocks[index], buildings: (1...4).map { b in
                Building(id: "\(name).b\(b)",
                         rooms: [10, 10, 10, 9].enumerated().map { room("\(name).b\(b).r\($0.offset + 1)", $0.element) },
                         keystone: lantern("\(name).b\(b).key", .beacon),
                         keystoneGivesLetter: b == 4)
            })
        }
        let grenier = District(id: "grenier", unlock: .totalLightsAndLetters(lights: 590, letters: 4), buildings: [
            Building(id: "grenier.b1", rooms: [room("grenier.b1.r1", 16)]),
        ])
        return World(id: "vesper", districts: [phare] + districts + [grenier])
    }()
}
