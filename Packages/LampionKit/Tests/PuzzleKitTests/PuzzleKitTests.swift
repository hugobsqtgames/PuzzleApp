import Testing
@testable import PuzzleKit

@Suite("Aléatoire déterministe")
struct RandomTests {
    @Test("SplitMix64 et Xoshiro256** correspondent à une implémentation de référence indépendante")
    func referenceValues() {
        var sm = SplitMix64(seed: 42)
        #expect([sm.next(), sm.next(), sm.next()] == [0xBDD7_3226_2FEB_6E95, 0x28EF_E333_B266_F103, 0x4752_6757_130F_9F52])
        var rng = SeededRNG(seed: 42)
        let first = (0..<5).map { _ in rng.next() }
        #expect(first == [0x1578_0B2E_0C2E_C716, 0x6104_D986_6D11_3A7E, 0xAE17_5332_39E4_99A1, 0xECB8_AD47_03B3_60A1, 0xFDE6_DC7F_E2EC_5E64])
    }

    @Test("FNV-1a 64 bits est stable")
    func fnv() {
        #expect(StableHash.fnv1a64("") == 0xCBF2_9CE4_8422_2325)
        #expect(StableHash.fnv1a64("lampion") == 0xBE7C_ABED_2D94_03CF)
        #expect(StableHash.seed("daily", "2026-09-29", "fr", "1") == StableHash.seed("daily", "2026-09-29", "fr", "1"))
        #expect(StableHash.seed("daily", "2026-09-29", "fr", "1") != StableHash.seed("daily", "2026-09-29", "en", "1"))
    }

    @Test("below() reste dans les bornes et couvre toutes les valeurs")
    func below() {
        var rng = SeededRNG(seed: 7)
        var seen = Set<Int>()
        for _ in 0..<5_000 {
            let v = rng.below(7)
            #expect((0..<7).contains(v))
            seen.insert(v)
        }
        #expect(seen.count == 7)
    }

    @Test("Le mélange produit une permutation et dépend de la graine")
    func shuffle() {
        var a = SeededRNG(seed: 1), b = SeededRNG(seed: 1), c = SeededRNG(seed: 2)
        let items = Array(0..<50)
        let x = a.shuffled(items), y = b.shuffled(items), z = c.shuffled(items)
        #expect(x == y)
        #expect(x != z)
        #expect(x.sorted() == items)
    }
}

@Suite("Paliers et symétries")
struct TierAndGridTests {
    @Test("Les seuils standards donnent les paliers attendus", arguments: [
        (0, Tier.spark), (14, .spark), (15, .glow), (30, .flame), (49, .flame), (50, .blaze), (70, .beacon), (85, .star), (100, .star),
    ])
    func thresholds(score: Int, tier: Tier) {
        #expect(TierThresholds.standard.tier(for: DifficultyScore(score)) == tier)
    }

    @Test("Le score est borné à 0...100")
    func clamp() {
        #expect(DifficultyScore(-5).value == 0)
        #expect(DifficultyScore(250).value == 100)
    }

    @Test("La forme canonique ne dépend pas de l'orientation de la grille")
    func canonicalInvariance() {
        let grid = ["ab.", "..c", "d.."].map { Array($0) }
        let reference = Canonical.grid(rows: 3, columns: 3) { grid[$0][$1] }
        for symmetry in GridSymmetry.allCases {
            let transformed = (0..<3).map { r in (0..<3).map { c -> Character in
                let (sr, sc) = symmetry.source(row: r, column: c, rows: 3, columns: 3)
                return grid[sr][sc]
            } }
            #expect(Canonical.grid(rows: 3, columns: 3) { transformed[$0][$1] } == reference, "\(symmetry)")
        }
    }

    @Test("Les huit symétries d'une grille carrée sont des bijections distinctes")
    func symmetriesAreBijections() {
        var images = Set<[Int]>()
        for symmetry in GridSymmetry.allCases {
            var image: [Int] = []
            for r in 0..<3 { for c in 0..<3 {
                let (sr, sc) = symmetry.source(row: r, column: c, rows: 3, columns: 3)
                image.append(sr * 3 + sc)
            } }
            #expect(Set(image).count == 9)
            images.insert(image)
        }
        #expect(images.count == 8)
    }
}
