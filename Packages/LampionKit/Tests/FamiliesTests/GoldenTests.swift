import Testing
@testable import FamilyLamps
@testable import FamilyLocks
@testable import FamilySwitches
@testable import PuzzleKit

/// Empreintes de référence : mêmes graines ⇒ mêmes puzzles, pour toujours.
/// Si ce test échoue, un générateur a changé : incrémenter `generatorVersion` (et régénérer le contenu)
/// plutôt que de mettre à jour ces valeurs.
@Suite("Empreintes de référence des générateurs")
struct GoldenTests {
    static func prints<F: PuzzleFamily>(_ family: F, _ parameters: F.Parameters) -> [String] {
        CandidatePipeline(family: family).generate(count: 3, parameters: parameters, seedBase: 2026).accepted
            .map { String(StableHash.fnv1a64($0.fingerprint), radix: 16) }
    }

    @Test("Interrupteurs") func switches() {
        #expect(Self.prints(SwitchesFamily(), SwitchesParameters(rows: 4, columns: 4, presses: 3...8, minimumMoves: 2))
                == ["314983cb036cb244", "25c760094cc17d02", "a2111db38fcb1055"])
    }

    @Test("Cadenas") func locks() {
        #expect(Self.prints(LocksFamily(), LocksParameters()) == ["4dc9e4d2c8a85510", "a339e6462e6759f5", "d9dca26b32d6ecfc"])
    }

    @Test("Lampes") func lamps() {
        #expect(Self.prints(LampsFamily(), LampsParameters(rows: 6, columns: 6)) == ["f1c4b6166823127d", "560a9a2097f3b2ef", "8f8782f587a900ac"])
    }
}
