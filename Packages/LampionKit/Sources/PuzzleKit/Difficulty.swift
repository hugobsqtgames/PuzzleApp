/// Paliers de difficulté, du plus doux au plus exigeant.
///
/// Les noms affichés viennent de la localisation (`tier.<rawValue>`) :
/// FR Étincelle · Lueur · Flamme · Brasier · Fanal · Astre,
/// EN Spark · Glow · Flame · Blaze · Beacon · Star.
public enum Tier: Int, Codable, Sendable, CaseIterable, Comparable {
    case spark = 0, glow, flame, blaze, beacon, star

    public static func < (lhs: Tier, rhs: Tier) -> Bool { lhs.rawValue < rhs.rawValue }

    public var localizationKey: String { "tier.\(self)" }
}

/// Score de difficulté normalisé sur 0...100.
public struct DifficultyScore: Codable, Sendable, Hashable, Comparable {
    public let value: Int

    public init(_ value: Int) { self.value = min(100, max(0, value)) }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.init(try c.decode(Int.self, forKey: .value))
    }

    public static func < (lhs: DifficultyScore, rhs: DifficultyScore) -> Bool { lhs.value < rhs.value }
}

/// Conversion score → palier. Chaque famille a ses propres seuils,
/// recalibrés après les tests de jeu (GAME_DESIGN § 15).
public struct TierThresholds: Codable, Sendable, Hashable {
    /// Borne inférieure (incluse) des paliers glow, flame, blaze, beacon, star.
    public let lowerBounds: [Int]

    public init(_ lowerBounds: [Int]) {
        precondition(lowerBounds.count == Tier.allCases.count - 1, "5 bounds expected")
        precondition(lowerBounds == lowerBounds.sorted(), "bounds must be increasing")
        self.lowerBounds = lowerBounds
    }

    public enum InvalidThresholds: Error { case invalid([Int]) }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let bounds = try c.decode([Int].self, forKey: .lowerBounds)
        guard bounds.count == Tier.allCases.count - 1, bounds == bounds.sorted() else { throw InvalidThresholds.invalid(bounds) }
        lowerBounds = bounds
    }

    /// Seuils par défaut (GAME_DESIGN § 4.1).
    public static let standard = TierThresholds([15, 30, 50, 70, 85])

    public func tier(for score: DifficultyScore) -> Tier {
        var tier = Tier.spark
        for (index, bound) in lowerBounds.enumerated() where score.value >= bound {
            tier = Tier(rawValue: index + 1)!
        }
        return tier
    }
}
