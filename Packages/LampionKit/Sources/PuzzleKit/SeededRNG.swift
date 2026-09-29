/// Générateurs pseudo-aléatoires déterministes.
///
/// Règle du projet : tout hasard qui décide de la structure d'un puzzle passe par
/// `SeededRNG`. Les algorithmes de la bibliothèque standard (`shuffle`,
/// `randomElement`, `Int.random(in:using:)`) ne sont pas utilisés : leur
/// implémentation n'est pas garantie stable d'une version de Swift à l'autre,
/// ce qui changerait les puzzles générés à partir d'une même graine.

/// SplitMix64 — sert à dériver l'état initial de Xoshiro à partir d'une graine 64 bits.
public struct SplitMix64: Sendable {
    public private(set) var state: UInt64

    public init(seed: UInt64) { state = seed }

    public mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

/// Xoshiro256** — générateur principal. Rapide, bonne qualité statistique, état de 256 bits.
public struct SeededRNG: RandomNumberGenerator, Sendable {
    private var s0: UInt64, s1: UInt64, s2: UInt64, s3: UInt64

    public init(seed: UInt64) {
        var sm = SplitMix64(seed: seed)
        s0 = sm.next(); s1 = sm.next(); s2 = sm.next(); s3 = sm.next()
    }

    @inline(__always) private static func rotl(_ x: UInt64, _ k: UInt64) -> UInt64 {
        (x << k) | (x >> (64 - k))
    }

    public mutating func next() -> UInt64 {
        let result = Self.rotl(s1 &* 5, 7) &* 9
        let t = s1 << 17
        s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3
        s2 ^= t
        s3 = Self.rotl(s3, 45)
        return result
    }

    /// Entier uniforme dans `0..<bound`, par rejet (sans biais, algorithme figé).
    public mutating func below(_ bound: Int) -> Int {
        precondition(bound > 0, "bound must be positive")
        let b = UInt64(bound)
        let limit = UInt64.max - (UInt64.max % b)
        while true {
            let x = next()
            if x < limit { return Int(x % b) }
        }
    }

    /// Entier uniforme dans l'intervalle fermé.
    public mutating func int(in range: ClosedRange<Int>) -> Int {
        range.lowerBound + below(range.upperBound - range.lowerBound + 1)
    }

    /// Vrai avec une probabilité `numerator / denominator` (pas de flottant).
    public mutating func chance(_ numerator: Int, in denominator: Int) -> Bool {
        below(denominator) < numerator
    }

    public mutating func bool() -> Bool { next() & 1 == 1 }

    public mutating func pick<T>(_ items: [T]) -> T {
        precondition(!items.isEmpty, "cannot pick from an empty array")
        return items[below(items.count)]
    }

    /// Mélange de Fisher–Yates, implémentation figée.
    public mutating func shuffle<T>(_ items: inout [T]) {
        guard items.count > 1 else { return }
        for i in stride(from: items.count - 1, to: 0, by: -1) {
            let j = below(i + 1)
            if i != j { items.swapAt(i, j) }
        }
    }

    public mutating func shuffled<T>(_ items: [T]) -> [T] {
        var copy = items
        shuffle(&copy)
        return copy
    }
}

/// Hachage stable (FNV-1a 64 bits) pour dériver des graines à partir de textes.
/// `String.hashValue` est volontairement aléatoire par processus : il ne doit jamais servir ici.
public enum StableHash {
    public static func fnv1a64(_ text: String) -> UInt64 {
        var hash: UInt64 = 0xCBF2_9CE4_8422_2325
        for byte in text.utf8 {
            hash ^= UInt64(byte)
            hash &*= 0x0000_0100_0000_01B3
        }
        return hash
    }

    /// Graine dérivée de composants textuels, séparés par « | ».
    /// Exemple : `seed("daily", "2026-09-29", "fr", "3")`.
    public static func seed(_ components: String...) -> UInt64 {
        var sm = SplitMix64(seed: fnv1a64(components.joined(separator: "|")))
        return sm.next()
    }
}
