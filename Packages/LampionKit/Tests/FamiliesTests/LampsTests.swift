import Testing
@testable import FamilyLamps
@testable import PuzzleKit

@Suite("Lampes")
struct LampsTests {
    let family = LampsFamily()
    /// La grille de la maquette, générée et vérifiée séparément en Python.
    let prototype = LampsPuzzle(layout: [".X..XX", "..3...", "XXXX..", "..XX2X", "...X..", "X2..X."])
    let prototypeSolution: Set<Int> = [0, 2, 7, 9, 16, 18, 25, 28, 32, 35]

    func state(lamps: [Int], in puzzle: LampsPuzzle) -> LampsState {
        var s = family.initialState(for: puzzle)
        for i in lamps { s.marks[i] = .lamp }
        return s
    }

    @Test("La grille de la maquette a une solution unique, identique à la vérification Python")
    func prototypeUnique() throws {
        let report = family.solve(prototype, limit: 2)
        #expect(report.solutionCount == 1)
        #expect(Set(try #require(report.solutions.first).lamps) == prototypeSolution)
        #expect(report.humanSolvable)
    }

    @Test("Deux lampes qui se voient sont signalées toutes les deux")
    func conflicts() {
        let s = state(lamps: [2, 3], in: prototype)
        guard case .invalid(let issues) = family.validate(prototype, state: s) else { Issue.record("expected invalid"); return }
        #expect(issues.first?.message.key == "lamps.error.seeEachOther")
        #expect(Set(issues.first?.cells ?? []) == [CellRef(0, 2), CellRef(0, 3)])
    }

    @Test("Un mur dépassé donne son attendu et son réel")
    func overfullWall() {
        // Mur « 1 » au centre, touché par deux lampes qui ne se voient pas.
        let small = LampsPuzzle(layout: ["...", ".1.", "..."])
        let s = state(lamps: [1, 3], in: small)
        guard case .invalid(let issues) = family.validate(small, state: s) else { Issue.record("expected invalid"); return }
        #expect(issues.contains { $0.message == LocalizedTemplate("lamps.error.wallOver", ["1", "2"]) })
    }

    @Test("La solution de la maquette est validée ; une grille partielle est incomplète")
    func validation() {
        #expect(family.validate(prototype, state: state(lamps: Array(prototypeSolution), in: prototype)) == .correct)
        #expect(family.validate(prototype, state: state(lamps: [0, 2], in: prototype)) == .incomplete)
    }

    @Test("Propriété : chaque puzzle accepté est unique, validé et résoluble par déduction", arguments: Array(0..<120))
    func generatedAreSound(seed: Int) throws {
        let pipeline = CandidatePipeline(family: family)
        let size = 5 + seed % 3
        let outcome = pipeline.evaluate(parameters: LampsParameters(rows: size, columns: size), seed: UInt64(seed))
        guard let accepted = outcome.accepted else { return }
        let p = accepted.puzzle
        #expect(family.solve(p, limit: 2).solutionCount == 1)
        #expect(accepted.report.humanSolvable)
        // La symétrie centrale des murs est respectée.
        let flat = Array(p.layout.joined())
        for i in flat.indices { #expect((flat[i] == ".") == (flat[flat.count - 1 - i] == ".")) }
    }

    @Test("Les Éclairages successifs résolvent la grille depuis zéro", arguments: Array(0..<25))
    func insightChainSolves(seed: Int) throws {
        let outcome = CandidatePipeline(family: family).evaluate(parameters: LampsParameters(rows: 6, columns: 6), seed: UInt64(1000 + seed))
        guard let p = outcome.accepted?.puzzle else { return }
        var s = family.initialState(for: p)
        var steps = 0
        while family.validate(p, state: s) != .correct {
            s = try #require(family.hint(p, state: s, level: .insight)?.resultingState)
            steps += 1
            try #require(steps < 72, "hint chain did not converge")
        }
    }

    @Test("Une erreur du joueur est signalée avant toute nouvelle déduction")
    func mistakeFirst() throws {
        var s = family.initialState(for: prototype)
        s.marks[3] = .lamp // n'est pas dans la solution
        let whisper = try #require(family.hint(prototype, state: s, level: .whisper))
        #expect(whisper.text.key == "lamps.hint.checkMistake")
        #expect(whisper.focus == [CellRef(0, 3)])
        let fix = try #require(family.hint(prototype, state: s, level: .insight)?.resultingState)
        #expect(fix.marks[3] == .empty)
    }

    @Test("L'empreinte est invariante par rotation")
    func fingerprintRotation() {
        let layout = prototype.layout.map { Array($0) }
        let rotated = (0..<6).map { r in String((0..<6).map { c in layout[5 - c][r] }) }
        #expect(family.fingerprint(prototype) == family.fingerprint(LampsPuzzle(layout: rotated)))
    }

    @Test("Le pipeline est déterministe : mêmes graines, mêmes puzzles")
    func pipelineDeterminism() {
        let a = CandidatePipeline(family: family).generate(count: 5, parameters: LampsParameters(rows: 6, columns: 6), seedBase: 42)
        let b = CandidatePipeline(family: family).generate(count: 5, parameters: LampsParameters(rows: 6, columns: 6), seedBase: 42)
        #expect(a.accepted.map(\.fingerprint) == b.accepted.map(\.fingerprint))
        #expect(Set(a.accepted.map(\.fingerprint)).count == a.accepted.count)
    }
}
