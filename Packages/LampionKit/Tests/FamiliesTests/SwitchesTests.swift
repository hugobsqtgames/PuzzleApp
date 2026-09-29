import Testing
@testable import FamilySwitches
@testable import PuzzleKit

@Suite("Interrupteurs")
struct SwitchesTests {
    let family = SwitchesFamily()

    func puzzle(pressing presses: [Int], rows: Int = 3, columns: Int = 3, pattern: SwitchPattern = .cross) -> SwitchesPuzzle {
        let all = SwitchesPuzzle(rows: rows, columns: columns, pattern: pattern, initiallyLit: Array(repeating: true, count: rows * columns))
        var state = family.initialState(for: all)
        for p in presses { family.press(p, state: &state, puzzle: all) }
        return SwitchesPuzzle(rows: rows, columns: columns, pattern: pattern, initiallyLit: state.lit)
    }

    /// Minimum par force brute sur les 2^n combinaisons d'appuis.
    func bruteForceMinimum(_ p: SwitchesPuzzle) -> Int? {
        var best: Int?
        for combo in 0..<(1 << p.cellCount) {
            var state = family.initialState(for: p)
            for i in 0..<p.cellCount where combo & (1 << i) != 0 { family.press(i, state: &state, puzzle: p) }
            if state.lit.allSatisfy({ $0 }) { best = min(best ?? .max, combo.nonzeroBitCount) }
        }
        return best
    }

    @Test("Le puzzle de la maquette se résout en exactement 3 coups, solution unique")
    func prototypePuzzle() {
        let p = puzzle(pressing: [0, 5, 7])
        let report = family.solve(p, limit: 2)
        #expect(report.solutionCount == 1)
        #expect(report.solutions.first?.moveCount == 3)
        #expect(report.solutions.first?.presses.indices.filter { report.solutions.first!.presses[$0] } == [0, 5, 7])
    }

    @Test("Dimension du noyau connue du genre : 3×3 → 0, 4×4 → 4, 5×5 → 2")
    func knownNullities() {
        #expect(family.nullity(puzzle(pressing: [], rows: 3, columns: 3)) == 0)
        #expect(family.nullity(puzzle(pressing: [], rows: 4, columns: 4)) == 4)
        #expect(family.nullity(puzzle(pressing: [], rows: 5, columns: 5)) == 2)
    }

    @Test("Le solveur GF(2) trouve le même minimum que la force brute", arguments: Array(0..<40))
    func matchesBruteForce(seed: Int) {
        var rng = SeededRNG(seed: UInt64(seed))
        let pattern = SwitchPattern.allCases[seed % 3]
        let params = SwitchesParameters(rows: 3, columns: 4, pattern: pattern, presses: 1...8)
        guard let p = family.generate(params, rng: &rng) else { return }
        #expect(family.minimalSolution(p, lit: p.initiallyLit)?.moveCount == bruteForceMinimum(p))
    }

    @Test("Propriété : tout puzzle généré est solvable et sa solution valide", arguments: Array(0..<200))
    func generatedAreSolvable(seed: Int) throws {
        var rng = SeededRNG(seed: UInt64(seed))
        let params = SwitchesParameters(rows: 5, columns: 5, presses: 2...10, minimumMoves: 2)
        guard let p = family.generate(params, rng: &rng) else { return }
        let report = family.solve(p, limit: 2)
        let solution = try #require(report.solutions.first)
        #expect(family.validate(p, state: family.state(applying: solution, to: p)) == .correct)
        #expect(solution.moveCount >= 2)
    }

    @Test("La génération est déterministe")
    func deterministic() {
        let params = SwitchesParameters(rows: 4, columns: 4, presses: 3...8)
        var a = SeededRNG(seed: 99), b = SeededRNG(seed: 99)
        #expect(family.generate(params, rng: &a) == family.generate(params, rng: &b))
    }

    @Test("Chaque Éclairage rapproche d'un coup de la solution")
    func insightProgresses() throws {
        let p = puzzle(pressing: [1, 4, 8, 11], rows: 4, columns: 4)
        var state = family.initialState(for: p)
        var remaining = try #require(family.minimalSolution(p, lit: state.lit)).moveCount
        while remaining > 0 {
            let hint = try #require(family.hint(p, state: state, level: .insight))
            state = try #require(hint.resultingState)
            let now = try #require(family.minimalSolution(p, lit: state.lit)).moveCount
            #expect(now == remaining - 1)
            remaining = now
        }
        #expect(family.validate(p, state: state) == .correct)
        #expect(family.hint(p, state: state, level: .whisper) == nil)
    }

    @Test("L'indice Solution résout le puzzle ; le Murmure ne modifie rien")
    func solutionHint() throws {
        let p = puzzle(pressing: [0, 5, 7])
        let start = family.initialState(for: p)
        #expect(family.hint(p, state: start, level: .whisper)?.resultingState == nil)
        let solved = try #require(family.hint(p, state: start, level: .solution)?.resultingState)
        #expect(family.validate(p, state: solved) == .correct)
    }

    @Test("L'empreinte est identique pour un puzzle et son miroir")
    func fingerprintSymmetry() {
        #expect(family.fingerprint(puzzle(pressing: [0])) == family.fingerprint(puzzle(pressing: [2])))
        #expect(family.fingerprint(puzzle(pressing: [0])) != family.fingerprint(puzzle(pressing: [4])))
    }

    @Test("Le puzzle d'introduction (2×2, 1 coup) est au palier Étincelle")
    func tutorialTier() {
        let p = puzzle(pressing: [0], rows: 2, columns: 2)
        #expect(family.tier(p, report: family.solve(p, limit: 2)) == .spark)
    }
}
