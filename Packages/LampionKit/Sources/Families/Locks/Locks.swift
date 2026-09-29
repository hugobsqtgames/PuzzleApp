import PuzzleKit

/// Cadenas : trouver un code à partir d'indices « n bien placés, m mal placés ».

public struct LockClue: Codable, Sendable, Hashable {
    public let guess: [Int]
    public let wellPlaced: Int
    public let misplaced: Int
    public init(guess: [Int], wellPlaced: Int, misplaced: Int) {
        self.guess = guess; self.wellPlaced = wellPlaced; self.misplaced = misplaced
    }
    public var isNothing: Bool { wellPlaced == 0 && misplaced == 0 }
}

public struct LocksPuzzle: Codable, Sendable, Hashable {
    public let length: Int
    /// Symboles possibles : 0..<alphabet (0–9 pour des chiffres).
    public let alphabet: Int
    public let allowsRepeats: Bool
    public let clues: [LockClue]

    public init(length: Int, alphabet: Int = 10, allowsRepeats: Bool = false, clues: [LockClue]) {
        self.length = length; self.alphabet = alphabet; self.allowsRepeats = allowsRepeats; self.clues = clues
    }
}

public struct LocksState: Codable, Sendable, Hashable {
    public var symbols: [Int?]
    /// Symboles barrés par le joueur (bloc-notes).
    public var crossedOut: [Int]
    public init(symbols: [Int?], crossedOut: [Int] = []) { self.symbols = symbols; self.crossedOut = crossedOut }
}

public struct LocksParameters: Codable, Sendable, Hashable {
    public var length: Int
    public var alphabet: Int
    public var allowsRepeats: Bool
    public var clueCount: ClosedRange<Int>
    /// Nombre maximal d'indices « aucun symbole juste » (ils sont très faciles).
    public var maxNothingClues: Int

    public init(length: Int = 3, alphabet: Int = 10, allowsRepeats: Bool = false, clueCount: ClosedRange<Int> = 4...6, maxNothingClues: Int = 1) {
        self.length = length; self.alphabet = alphabet; self.allowsRepeats = allowsRepeats
        self.clueCount = clueCount; self.maxNothingClues = maxNothingClues
    }
}

public struct LocksFamily: PuzzleFamily {
    public typealias Solution = [Int]
    public static let id: FamilyID = "locks"
    public static let formatVersion = 1
    public static let requiresUniqueSolution = true
    public static let generatorVersion = 1

    public init() {}

    // MARK: Règles

    /// Score d'une proposition contre un code (multiensembles : gère les répétitions).
    public static func score(code: [Int], guess: [Int]) -> (wellPlaced: Int, misplaced: Int) {
        var well = 0
        var codeCounts: [Int: Int] = [:], guessCounts: [Int: Int] = [:]
        for i in 0..<min(code.count, guess.count) {
            if code[i] == guess[i] { well += 1 } else {
                codeCounts[code[i], default: 0] += 1
                guessCounts[guess[i], default: 0] += 1
            }
        }
        var mis = 0
        for (symbol, n) in guessCounts { mis += min(n, codeCounts[symbol] ?? 0) }
        return (well, mis)
    }

    static func consistent(_ code: [Int], with clues: [LockClue]) -> Bool {
        clues.allSatisfy { clue in
            let s = score(code: code, guess: clue.guess)
            return s.wellPlaced == clue.wellPlaced && s.misplaced == clue.misplaced
        }
    }

    /// Tous les codes possibles, dans un ordre figé.
    static func allCodes(length: Int, alphabet: Int, allowsRepeats: Bool) -> [[Int]] {
        var result: [[Int]] = []
        var current: [Int] = []
        func build() {
            if current.count == length { result.append(current); return }
            for s in 0..<alphabet where allowsRepeats || !current.contains(s) {
                current.append(s); build(); current.removeLast()
            }
        }
        build()
        return result
    }

    // MARK: Génération

    public func generate(_ p: LocksParameters, rng: inout SeededRNG) -> LocksPuzzle? {
        guard p.length >= 2, p.alphabet >= p.length || p.allowsRepeats else { return nil }
        let codes = Self.allCodes(length: p.length, alphabet: p.alphabet, allowsRepeats: p.allowsRepeats)
        let code = rng.pick(codes)
        var candidates = codes
        var clues: [LockClue] = []
        var nothing = 0
        for guess in rng.shuffled(codes) where guess != code {
            let s = Self.score(code: code, guess: guess)
            let clue = LockClue(guess: guess, wellPlaced: s.wellPlaced, misplaced: s.misplaced)
            if clue.isNothing && nothing >= p.maxNothingClues { continue }
            let reduced = candidates.filter { Self.consistent($0, with: [clue]) }
            guard reduced.count < candidates.count else { continue }
            clues.append(clue)
            if clue.isNothing { nothing += 1 }
            candidates = reduced
            if candidates.count == 1 { break }
            if clues.count > p.clueCount.upperBound + 4 { return nil }
        }
        guard candidates == [code] else { return nil }
        // Minimisation : chaque indice restant doit être nécessaire.
        var i = 0
        while i < clues.count {
            var without = clues
            without.remove(at: i)
            if codes.filter({ Self.consistent($0, with: without) }).count == 1 { clues = without } else { i += 1 }
        }
        guard p.clueCount.contains(clues.count) else { return nil }
        return LocksPuzzle(length: p.length, alphabet: p.alphabet, allowsRepeats: p.allowsRepeats, clues: clues)
    }

    // MARK: Résolution

    /// Élimination « humaine » simple : indices « rien de juste » et « aucun bien placé ».
    /// Renvoie les ensembles de symboles possibles par position et la trace.
    func simpleElimination(_ puzzle: LocksPuzzle) -> (candidates: [Set<Int>], trace: [DeductionStep]) {
        var sets = Array(repeating: Set(0..<puzzle.alphabet), count: puzzle.length)
        var trace: [DeductionStep] = []
        for (index, clue) in puzzle.clues.enumerated() where clue.isNothing {
            for p in 0..<puzzle.length { sets[p].subtract(clue.guess) }
            trace.append(DeductionStep(techniqueRank: 1, technique: "nothingCorrect", focus: [CellRef(index, 0)],
                                       explanation: LocalizedTemplate("locks.step.nothingCorrect", [Self.text(clue.guess)])))
        }
        for (index, clue) in puzzle.clues.enumerated() where clue.wellPlaced == 0 && !clue.isNothing {
            var removed = false
            for (p, symbol) in clue.guess.enumerated() where sets[p].contains(symbol) { sets[p].remove(symbol); removed = true }
            if removed {
                trace.append(DeductionStep(techniqueRank: 2, technique: "noneWellPlaced", focus: [CellRef(index, 0)],
                                           explanation: LocalizedTemplate("locks.step.noneWellPlaced", [Self.text(clue.guess)])))
            }
        }
        return (sets, trace)
    }

    public func solve(_ puzzle: LocksPuzzle, limit: Int) -> SolveReport<[Int]> {
        let codes = Self.allCodes(length: puzzle.length, alphabet: puzzle.alphabet, allowsRepeats: puzzle.allowsRepeats)
        var solutions: [[Int]] = []
        var count = 0
        for code in codes where Self.consistent(code, with: puzzle.clues) {
            count += 1
            if solutions.count < limit { solutions.append(code) }
            if count >= limit { break }
        }
        let (sets, simpleTrace) = simpleElimination(puzzle)
        var trace = simpleTrace
        // Codes encore compatibles avec les ensembles simples : ce qui reste relève du raisonnement croisé.
        let remaining = codes.filter { code in code.indices.allSatisfy { sets[$0].contains(code[$0]) } }.count
        var crossSteps = 0
        var r = remaining
        while r > 1 { r = (r + 1) / 2; crossSteps += 1 }
        if crossSteps > 0 {
            let focus = puzzle.clues.indices.filter { !puzzle.clues[$0].isNothing }.map { CellRef($0, 0) }
            for _ in 0..<crossSteps {
                trace.append(DeductionStep(techniqueRank: 3, technique: "crossReasoning", focus: focus,
                                           explanation: LocalizedTemplate("locks.step.crossReasoning")))
            }
        }
        return SolveReport(solutionCount: count, solutions: solutions, trace: trace, humanSolvable: true, searchNodes: codes.count)
    }

    public func initialState(for puzzle: LocksPuzzle) -> LocksState {
        LocksState(symbols: Array(repeating: nil, count: puzzle.length))
    }

    public func state(applying solution: [Int], to puzzle: LocksPuzzle) -> LocksState {
        LocksState(symbols: solution.map { Optional($0) })
    }

    public func validate(_ puzzle: LocksPuzzle, state: LocksState) -> ValidationResult {
        guard state.symbols.count == puzzle.length else { return .incomplete }
        let symbols = state.symbols.compactMap { $0 }
        guard symbols.count == puzzle.length else { return .incomplete }
        if !puzzle.allowsRepeats && Set(symbols).count < symbols.count {
            return .invalid([Issue(cells: (0..<puzzle.length).map { CellRef(-1, $0) }, message: LocalizedTemplate("locks.error.repeatedSymbols"))])
        }
        for (index, clue) in puzzle.clues.enumerated() {
            let s = Self.score(code: symbols, guess: clue.guess)
            if s.wellPlaced != clue.wellPlaced || s.misplaced != clue.misplaced {
                return .invalid([Issue(cells: [CellRef(index, 0)], message: LocalizedTemplate("locks.error.clue", [
                    Self.text(symbols), Self.text(clue.guess),
                    String(s.wellPlaced), String(s.misplaced), String(clue.wellPlaced), String(clue.misplaced),
                ]))])
            }
        }
        return .correct
    }

    // MARK: Difficulté

    public func rate(_ puzzle: LocksPuzzle, report: SolveReport<[Int]>) -> DifficultyScore {
        let cross = report.trace.filter { $0.techniqueRank == 3 }.count
        let score = 10 + max(0, puzzle.clues.count - 3) * 4 + (puzzle.length - 3) * 12 + cross * 3
            + (puzzle.alphabet > 10 ? 10 : 0) + (puzzle.allowsRepeats ? 12 : 0)
        return DifficultyScore(score)
    }

    // MARK: Indices

    public func hint(_ puzzle: LocksPuzzle, state: LocksState, level: HintLevel) -> Hint<LocksState>? {
        let report = solve(puzzle, limit: 2)
        guard report.solutionCount == 1, let solution = report.solutions.first,
              state.symbols.compactMap({ $0 }) != solution else { return nil }
        // Indice le plus simple à exploiter : un « rien de juste » non encore barré, sinon un « aucun bien placé ».
        let crossed = Set(state.crossedOut)
        let target = puzzle.clues.indices.first { puzzle.clues[$0].isNothing && !Set(puzzle.clues[$0].guess).isSubset(of: crossed) }
            ?? puzzle.clues.indices.first { puzzle.clues[$0].wellPlaced == 0 }
            ?? 0
        let clue = puzzle.clues[target]
        switch level {
        case .whisper:
            return Hint(level: level, text: LocalizedTemplate("locks.hint.whisper", [Self.text(clue.guess)]), focus: [CellRef(target, 0)])
        case .lead:
            let key = clue.isNothing ? "locks.hint.lead.nothing" : clue.wellPlaced == 0 ? "locks.hint.lead.noneWellPlaced" : "locks.hint.lead.compare"
            return Hint(level: level, text: LocalizedTemplate(key, [Self.text(clue.guess)]), focus: [CellRef(target, 0)])
        case .insight:
            guard let position = (0..<puzzle.length).first(where: { state.symbols[$0] != solution[$0] }) else { return nil }
            var next = state
            next.symbols[position] = solution[position]
            return Hint(level: level, text: LocalizedTemplate("locks.hint.insight", [String(position + 1), String(solution[position])]), focus: [CellRef(-1, position)], resultingState: next)
        case .solution:
            var solved = state
            solved.symbols = solution.map { Optional($0) }
            return Hint(level: level, text: LocalizedTemplate("locks.hint.solution", [Self.text(solution)]), focus: [], resultingState: solved)
        }
    }

    public func fingerprint(_ puzzle: LocksPuzzle) -> String {
        let clues = puzzle.clues.map { "\(Self.text($0.guess)):\($0.wellPlaced)\($0.misplaced)" }.sorted()
        return "\(puzzle.length)/\(puzzle.alphabet)/\(puzzle.allowsRepeats ? "r" : "u")|" + clues.joined(separator: ",")
    }

    static func text(_ symbols: [Int]) -> String { symbols.map(String.init).joined(separator: " ") }
}
