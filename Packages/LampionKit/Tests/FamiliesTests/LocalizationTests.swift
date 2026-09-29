import Foundation
import Testing
@testable import FamilyLamps
@testable import FamilyLocks
@testable import FamilySwitches
@testable import PuzzleKit

/// Tout texte produit par le moteur doit exister en français ET en anglais,
/// avec autant d'emplacements « {n} » que d'arguments fournis.
@Suite("Localisation du moteur")
struct LocalizationTests {
    static func catalog(_ language: String) throws -> [String: String] {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("Content/strings/core.\(language).json")
        return try JSONDecoder().decode([String: String].self, from: Data(contentsOf: url))
    }

    /// Textes émis en parcourant indices (tous niveaux, depuis l'état initial puis en suivant les Éclairages),
    /// étapes de résolution et erreurs de validation.
    static func emittedTemplates() -> [LocalizedTemplate] {
        var out: [LocalizedTemplate] = Tier.allCases.map { LocalizedTemplate($0.localizationKey) }
        func collect<F: PuzzleFamily>(_ family: F, _ parameters: F.Parameters, seeds: Range<Int>) {
            for seed in seeds {
                guard let accepted = CandidatePipeline(family: family).evaluate(parameters: parameters, seed: UInt64(seed)).accepted else { continue }
                out += accepted.report.trace.map(\.explanation)
                var state = family.initialState(for: accepted.puzzle)
                for _ in 0..<60 {
                    for level in HintLevel.allCases { if let h = family.hint(accepted.puzzle, state: state, level: level) { out.append(h.text) } }
                    guard let next = family.hint(accepted.puzzle, state: state, level: .insight)?.resultingState else { break }
                    state = next
                }
            }
        }
        collect(SwitchesFamily(), SwitchesParameters(rows: 3, columns: 3, presses: 2...5), seeds: 0..<10)
        collect(LocksFamily(), LocksParameters(), seeds: 0..<15)
        collect(LampsFamily(), LampsParameters(rows: 6, columns: 6), seeds: 0..<40)
        // Erreurs de validation construites volontairement.
        let lock = LocksPuzzle(length: 3, clues: [LockClue(guess: [1, 2, 3], wellPlaced: 0, misplaced: 1), LockClue(guess: [4, 5, 6], wellPlaced: 1, misplaced: 0)])
        for symbols in [[1, 1, 2], [7, 8, 9]] {
            if case .invalid(let issues) = LocksFamily().validate(lock, state: LocksState(symbols: symbols)) { out += issues.map(\.message) }
        }
        let grid = LampsPuzzle(layout: ["...", ".1.", "..."])
        var marks = LampsFamily().initialState(for: grid)
        marks.marks[0] = .lamp; marks.marks[1] = .lamp; marks.marks[3] = .lamp
        if case .invalid(let issues) = LampsFamily().validate(grid, state: marks) { out += issues.map(\.message) }
        var wrong = LampsFamily().initialState(for: grid)
        wrong.marks[1] = .dot
        for level in HintLevel.allCases { if let h = LampsFamily().hint(grid, state: wrong, level: level) { out.append(h.text) } }
        // Branche de révélation (rarement atteinte en jeu, mais ses textes doivent exister).
        let proto = LampsPuzzle(layout: [".X..XX", "..3...", "XXXX..", "..XX2X", "...X..", "X2..X."])
        for level in HintLevel.allCases {
            if let h = LampsFamily().revealHint(board: LampsBoard(proto), state: LampsFamily().initialState(for: proto), solutionLamps: [0, 2], level: level) { out.append(h.text) }
        }
        return out
    }

    @Test("Chaque texte émis existe en FR et en EN avec le bon nombre d'emplacements", arguments: ["fr", "en"])
    func completeness(language: String) throws {
        let strings = try Self.catalog(language)
        let emitted = Self.emittedTemplates()
        #expect(emitted.count > 100)
        for template in Set(emitted) {
            let text = try #require(strings[template.key], "missing \(language) key \(template.key)")
            let placeholders = Set(text.matches(of: /\{(\d+)\}/).map { Int($0.1)! })
            #expect(placeholders == Set(0..<template.arguments.count), "\(template.key): \(placeholders) vs \(template.arguments.count) args")
        }
    }

    @Test("Les deux langues ont exactement les mêmes clés")
    func sameKeys() throws {
        #expect(Set(try Self.catalog("fr").keys) == Set(try Self.catalog("en").keys))
    }
}
