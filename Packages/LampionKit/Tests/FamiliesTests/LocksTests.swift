import Testing
@testable import FamilyLocks
@testable import PuzzleKit

@Suite("Cadenas")
struct LocksTests {
    let family = LocksFamily()
    /// Le cadenas de la maquette (code 4 9 2).
    let prototype = LocksPuzzle(length: 3, clues: [
        LockClue(guess: [2, 6, 1], wellPlaced: 0, misplaced: 1),
        LockClue(guess: [3, 4, 9], wellPlaced: 0, misplaced: 2),
        LockClue(guess: [9, 7, 6], wellPlaced: 0, misplaced: 1),
        LockClue(guess: [3, 4, 7], wellPlaced: 0, misplaced: 1),
        LockClue(guess: [1, 8, 5], wellPlaced: 0, misplaced: 0),
    ])

    @Test("Score : bien placés et mal placés, répétitions comprises")
    func scoring() {
        #expect(LocksFamily.score(code: [4, 9, 2], guess: [3, 4, 9]) == (0, 2))
        #expect(LocksFamily.score(code: [4, 9, 2], guess: [4, 9, 2]) == (3, 0))
        #expect(LocksFamily.score(code: [1, 1, 2], guess: [1, 2, 1]) == (1, 2))
        #expect(LocksFamily.score(code: [1, 2, 3], guess: [1, 1, 1]) == (1, 0))
    }

    @Test("Le cadenas de la maquette a une seule solution : 4 9 2")
    func prototypeUnique() {
        let report = family.solve(prototype, limit: 2)
        #expect(report.solutionCount == 1)
        #expect(report.solutions.first == [4, 9, 2])
        #expect(family.tier(prototype, report: report) == .flame)
    }

    @Test("Une réponse fausse désigne la première ligne non respectée, avec les chiffres réels")
    func preciseError() {
        let state = LocksState(symbols: [3, 9, 2])
        guard case .invalid(let issues) = family.validate(prototype, state: state) else {
            Issue.record("expected invalid"); return
        }
        #expect(issues.first?.cells == [CellRef(1, 0)])
        #expect(issues.first?.message == LocalizedTemplate("locks.error.clue", ["3 9 2", "3 4 9", "1", "1", "0", "2"]))
    }

    @Test("Chiffres répétés refusés quand le code n'en a pas ; code incomplet = incomplet")
    func repeatsAndIncomplete() {
        guard case .invalid(let issues) = family.validate(prototype, state: LocksState(symbols: [4, 4, 2])) else {
            Issue.record("expected invalid"); return
        }
        #expect(issues.first?.message.key == "locks.error.repeatedSymbols")
        #expect(family.validate(prototype, state: LocksState(symbols: [4, nil, 2])) == .incomplete)
        #expect(family.validate(prototype, state: LocksState(symbols: [4, 9, 2])) == .correct)
    }

    @Test("Propriété : solution unique et chaque indice est nécessaire", arguments: Array(0..<60))
    func generatedAreMinimalAndUnique(seed: Int) {
        var rng = SeededRNG(seed: UInt64(seed))
        let params = LocksParameters(length: seed % 3 == 0 ? 4 : 3, clueCount: 3...7)
        guard let p = family.generate(params, rng: &rng) else { return }
        #expect(family.solve(p, limit: 2).solutionCount == 1)
        #expect(p.clues.filter(\.isNothing).count <= params.maxNothingClues)
        for i in p.clues.indices {
            var fewer = p.clues
            fewer.remove(at: i)
            let relaxed = LocksPuzzle(length: p.length, alphabet: p.alphabet, allowsRepeats: p.allowsRepeats, clues: fewer)
            #expect(family.solve(relaxed, limit: 2).solutionCount > 1, "clue \(i) is redundant")
        }
    }

    @Test("Les Éclairages successifs mènent à la solution")
    func insightChain() throws {
        var state = family.initialState(for: prototype)
        for _ in 0..<3 {
            state = try #require(family.hint(prototype, state: state, level: .insight)?.resultingState)
        }
        #expect(family.validate(prototype, state: state) == .correct)
    }

    @Test("Le Murmure vise d'abord l'indice « rien de juste »")
    func whisperTargetsNothingClue() {
        let hint = family.hint(prototype, state: family.initialState(for: prototype), level: .whisper)
        #expect(hint?.focus == [CellRef(4, 0)])
    }
}
