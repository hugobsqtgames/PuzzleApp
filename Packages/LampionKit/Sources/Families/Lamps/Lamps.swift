import PuzzleKit

/// Lampes (genre « Akari ») : placer des lampes pour éclairer toutes les cases blanches.
/// Deux lampes ne se voient jamais ; un mur numéroté touche exactement ce nombre de lampes.

public enum LampMark: Int, Codable, Sendable, Hashable {
    case empty = 0, lamp, dot
}

public struct LampsPuzzle: Codable, Sendable, Hashable {
    /// Une chaîne par ligne : « . » case blanche, « X » mur, « 0 »…« 4 » mur numéroté.
    public let layout: [String]
    public init(layout: [String]) {
        precondition(Self.isWellFormed(layout), "malformed lamps layout")
        self.layout = layout
    }
    public var rows: Int { layout.count }
    public var columns: Int { layout[0].count }

    public static let allowedSymbols: Set<Character> = [".", "X", "0", "1", "2", "3", "4"]

    public static func isWellFormed(_ layout: [String]) -> Bool {
        guard let width = layout.first?.count, width > 0, width <= 20, layout.count <= 20 else { return false }
        return layout.allSatisfy { $0.count == width && $0.allSatisfy(allowedSymbols.contains) }
    }

    enum CodingKeys: String, CodingKey { case layout }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let layout = try c.decode([String].self, forKey: .layout)
        guard Self.isWellFormed(layout) else { throw DecodingError.dataCorruptedError(forKey: .layout, in: c, debugDescription: "malformed lamps layout") }
        self.layout = layout
    }
}

public struct LampsState: Codable, Sendable, Hashable {
    public var marks: [LampMark]
    public init(marks: [LampMark]) { self.marks = marks }
}

public struct LampsParameters: Codable, Sendable, Hashable {
    public var rows: Int
    public var columns: Int
    /// Proportion de murs, en pourcentage.
    public var wallPercent: ClosedRange<Int>
    public init(rows: Int, columns: Int, wallPercent: ClosedRange<Int> = 18...26) {
        self.rows = rows; self.columns = columns; self.wallPercent = wallPercent
    }
}

public struct LampsSolution: Sendable, Hashable {
    public let lamps: [Int]
}

/// Placement produit par une déduction.
public struct LampPlacement: Codable, Sendable, Hashable {
    public let index: Int
    public let mark: LampMark
}

/// Éclairage calculé d'un état (utile à l'interface).
public struct LampsIllumination: Sendable, Hashable {
    public let lit: [Bool]
    /// Lampes qui en voient une autre.
    public let conflicts: [Int]
    /// Murs numérotés dépassés : index → (attendu, présent).
    public let overfullWalls: [Int]
}

// MARK: - Plateau

struct LampsBoard: Sendable {
    let rows: Int, columns: Int
    let white: [Bool]
    let clue: [Int?]
    let numbered: [Int]
    let sight: [[Int]]
    let neighbors: [[Int]]

    init(_ puzzle: LampsPuzzle) {
        let rows = puzzle.rows, columns = puzzle.columns
        let chars = puzzle.layout.flatMap { Array($0) }
        let clue = chars.map { $0.wholeNumberValue }
        var nb: [[Int]] = []
        var sg: [[Int]] = []
        for i in 0..<(rows * columns) {
            let r = i / columns, c = i % columns
            nb.append([(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]
                .filter { $0.0 >= 0 && $0.1 >= 0 && $0.0 < rows && $0.1 < columns }
                .map { $0.0 * columns + $0.1 })
            var seen: [Int] = []
            if chars[i] == "." {
                seen.append(i)
                for (dr, dc) in [(-1, 0), (1, 0), (0, -1), (0, 1)] {
                    var rr = r + dr, cc = c + dc
                    while rr >= 0, cc >= 0, rr < rows, cc < columns, chars[rr * columns + cc] == "." {
                        seen.append(rr * columns + cc)
                        rr += dr; cc += dc
                    }
                }
            }
            sg.append(seen)
        }
        self.rows = rows
        self.columns = columns
        self.white = chars.map { $0 == "." }
        self.clue = clue
        self.numbered = clue.indices.filter { chars[$0] != "." && clue[$0] != nil }
        self.neighbors = nb
        self.sight = sg
    }

    var count: Int { rows * columns }
    func ref(_ i: Int) -> CellRef { CellRef(i / columns, i % columns) }
}

// MARK: - Solveur exhaustif

final class LampsExactSolver {
    let b: LampsBoard
    let limit: Int
    var rng: SeededRNG?
    var lamp: [Bool], blocked: [Bool], lit: [Int]
    var solutions: [[Int]] = []
    var count = 0
    var nodes = 0

    init(board: LampsBoard, limit: Int, rng: SeededRNG? = nil, useClues: Bool = true) {
        b = board; self.limit = limit; self.rng = rng
        lamp = Array(repeating: false, count: board.count)
        blocked = Array(repeating: false, count: board.count)
        lit = Array(repeating: 0, count: board.count)
        self.useClues = useClues
    }
    let useClues: Bool

    func wallsOK(exact: Bool) -> Bool {
        guard useClues else { return true }
        for w in b.numbered {
            let n = b.clue[w]!
            var k = 0, available = 0
            for q in b.neighbors[w] where b.white[q] {
                if lamp[q] { k += 1 } else if !blocked[q] && lit[q] == 0 { available += 1 }
            }
            if k > n || k + available < n || (exact && k != n) { return false }
        }
        return true
    }

    func run() -> LampsExactSolver { search(); return self }

    private func search() {
        guard count < limit else { return }
        nodes += 1
        guard wallsOK(exact: false) else { return }
        var bestCell = -1
        var bestCandidates: [Int] = []
        for c in 0..<b.count where b.white[c] && lit[c] == 0 {
            let candidates = b.sight[c].filter { !blocked[$0] && lit[$0] == 0 }
            if candidates.isEmpty { return }
            if bestCell < 0 || candidates.count < bestCandidates.count {
                bestCell = c; bestCandidates = candidates
                if candidates.count == 1 { break }
            }
        }
        if bestCell < 0 {
            if wallsOK(exact: true) {
                count += 1
                if solutions.count < limit { solutions.append(lamp.indices.filter { lamp[$0] }) }
            }
            return
        }
        var order = bestCandidates
        if rng != nil { rng!.shuffle(&order) }
        var newlyBlocked: [Int] = []
        for p in order {
            lamp[p] = true
            for q in b.sight[p] { lit[q] += 1 }
            search()
            lamp[p] = false
            for q in b.sight[p] { lit[q] -= 1 }
            if count >= limit { break }
            blocked[p] = true
            newlyBlocked.append(p)
        }
        for p in newlyBlocked { blocked[p] = false }
    }
}

// MARK: - Solveur « humain »

struct LampsDeduction {
    let step: DeductionStep
    let placements: [LampPlacement]
}

struct LampsHumanSolver {
    let b: LampsBoard

    func litCounts(_ marks: [LampMark]) -> [Int] {
        var lit = Array(repeating: 0, count: b.count)
        for p in 0..<b.count where marks[p] == .lamp { for q in b.sight[p] { lit[q] += 1 } }
        return lit
    }

    func possible(_ p: Int, _ marks: [LampMark], _ lit: [Int]) -> Bool {
        b.white[p] && marks[p] == .empty && lit[p] == 0
    }

    func contradiction(_ marks: [LampMark]) -> Bool {
        let lit = litCounts(marks)
        for p in 0..<b.count where marks[p] == .lamp && lit[p] > 1 { return true }
        for w in b.numbered {
            let n = b.clue[w]!
            let k = b.neighbors[w].filter { marks[$0] == .lamp }.count
            let available = b.neighbors[w].filter { possible($0, marks, lit) }.count
            if k > n || k + available < n { return true }
        }
        for c in 0..<b.count where b.white[c] && lit[c] == 0 {
            if !b.sight[c].contains(where: { possible($0, marks, lit) }) { return true }
        }
        return false
    }

    func isSolved(_ marks: [LampMark]) -> Bool {
        let lit = litCounts(marks)
        for p in 0..<b.count where b.white[p] && lit[p] == 0 { return false }
        for p in 0..<b.count where marks[p] == .lamp && lit[p] > 1 { return false }
        for w in b.numbered where b.neighbors[w].filter({ marks[$0] == .lamp }).count != b.clue[w]! { return false }
        return true
    }

    /// Déductions simples (rangs 1 et 2).
    func simpleStep(_ marks: [LampMark]) -> LampsDeduction? {
        let lit = litCounts(marks)
        for w in b.numbered {
            let n = b.clue[w]!
            let k = b.neighbors[w].filter { marks[$0] == .lamp }.count
            let open = b.neighbors[w].filter { possible($0, marks, lit) }
            guard !open.isEmpty else { continue }
            if k == n {
                return LampsDeduction(
                    step: DeductionStep(techniqueRank: 1, technique: "wallSatisfied", focus: [b.ref(w)] + open.map(b.ref),
                                        explanation: LocalizedTemplate("lamps.step.wallSatisfied", [String(n)])),
                    placements: open.map { LampPlacement(index: $0, mark: .dot) })
            }
            if k + open.count == n {
                return LampsDeduction(
                    step: DeductionStep(techniqueRank: 1, technique: "wallSaturated", focus: [b.ref(w)] + open.map(b.ref),
                                        explanation: LocalizedTemplate("lamps.step.wallSaturated", [String(n), String(open.count)])),
                    placements: open.map { LampPlacement(index: $0, mark: .lamp) })
            }
        }
        for c in 0..<b.count where b.white[c] && lit[c] == 0 {
            let sources = b.sight[c].filter { possible($0, marks, lit) }
            if sources.count == 1 {
                return LampsDeduction(
                    step: DeductionStep(techniqueRank: 2, technique: "onlySource", focus: [b.ref(c), b.ref(sources[0])],
                                        explanation: LocalizedTemplate("lamps.step.onlySource")),
                    placements: [LampPlacement(index: sources[0], mark: .lamp)])
            }
        }
        return nil
    }

    func apply(_ placements: [LampPlacement], to marks: inout [LampMark]) {
        for p in placements { marks[p.index] = p.mark }
    }

    /// Propage les déductions simples ; renvoie vrai si une contradiction apparaît.
    func propagateFindsContradiction(_ start: [LampMark]) -> Bool {
        var marks = start
        for _ in 0..<(b.count * 2) {
            if contradiction(marks) { return true }
            guard let step = simpleStep(marks) else { return false }
            apply(step.placements, to: &marks)
        }
        return contradiction(marks)
    }

    /// Prochaine déduction, de la plus simple à la plus avancée (rang ≤ 4).
    func nextStep(_ marks: [LampMark]) -> LampsDeduction? {
        if let simple = simpleStep(marks) { return simple }
        let lit = litCounts(marks)
        let candidates = (0..<b.count).filter { possible($0, marks, lit) }
        for rank in [3, 4] {
            for p in candidates {
                for (trial, conclusion) in [(LampMark.lamp, LampMark.dot), (.dot, .lamp)] {
                    var test = marks
                    test[p] = trial
                    let found = rank == 3 ? contradiction(test) : propagateFindsContradiction(test)
                    if found {
                        let key = conclusion == .dot ? "lamps.step.lampWouldBreak" : "lamps.step.lampRequired"
                        return LampsDeduction(
                            step: DeductionStep(techniqueRank: rank, technique: rank == 3 ? "directContradiction" : "chainedContradiction",
                                                focus: [b.ref(p)], explanation: LocalizedTemplate(key)),
                            placements: [LampPlacement(index: p, mark: conclusion)])
                    }
                }
            }
        }
        return nil
    }

    func solve(from start: [LampMark]) -> (trace: [DeductionStep], solved: Bool) {
        var marks = start
        var trace: [DeductionStep] = []
        for _ in 0..<(b.count * 3) {
            if isSolved(marks) { return (trace, true) }
            guard let step = nextStep(marks) else { return (trace, false) }
            trace.append(step.step)
            apply(step.placements, to: &marks)
        }
        return (trace, isSolved(marks))
    }
}

// MARK: - Famille

extension LampsBoard {
    /// Marques utilisables : nil si la taille ne correspond pas ; toute marque posée sur un mur est ignorée
    /// (une lampe « sur un mur » ne doit jamais satisfaire un nombre).
    func sanitized(_ marks: [LampMark]) -> [LampMark]? {
        guard marks.count == count else { return nil }
        return marks.indices.map { white[$0] ? marks[$0] : .empty }
    }
}

public struct LampsFamily: PuzzleFamily {
    public static let id: FamilyID = "lamps"
    public static let formatVersion = 1
    public static let requiresUniqueSolution = true
    public static let generatorVersion = 1

    public init() {}

    public func illumination(_ puzzle: LampsPuzzle, state: LampsState) -> LampsIllumination {
        let b = LampsBoard(puzzle)
        guard let marks = b.sanitized(state.marks) else {
            return LampsIllumination(lit: Array(repeating: false, count: b.count), conflicts: [], overfullWalls: [])
        }
        let solver = LampsHumanSolver(b: b)
        let lit = solver.litCounts(marks)
        let conflicts = (0..<b.count).filter { marks[$0] == .lamp && lit[$0] > 1 }
        let overfull = b.numbered.filter { w in b.neighbors[w].filter { marks[$0] == .lamp }.count > b.clue[w]! }
        return LampsIllumination(lit: lit.map { $0 > 0 }, conflicts: conflicts, overfullWalls: overfull)
    }

    // MARK: Génération

    public func generate(_ p: LampsParameters, rng: inout SeededRNG) -> LampsPuzzle? {
        let n = p.rows * p.columns
        guard n >= 9 else { return nil }
        let percent = rng.int(in: p.wallPercent)
        var chars = Array(repeating: Character("."), count: n)
        for i in 0..<n {
            let mirror = n - 1 - i
            guard i <= mirror else { break }
            if rng.chance(percent, in: 100) { chars[i] = "X"; chars[mirror] = "X" }
        }
        let layout = { (cs: [Character]) in stride(from: 0, to: n, by: p.columns).map { String(cs[$0..<($0 + p.columns)]) } }
        let open = LampsPuzzle(layout: layout(chars))
        guard chars.contains(".") else { return nil }
        let board = LampsBoard(open)
        let finder = LampsExactSolver(board: board, limit: 1, rng: SeededRNG(seed: rng.next()), useClues: false).run()
        guard let lamps = finder.solutions.first.map(Set.init) else { return nil }
        for i in 0..<n where chars[i] == "X" {
            let k = board.neighbors[i].filter { lamps.contains($0) }.count
            chars[i] = Character(String(k))
        }
        var puzzle = LampsPuzzle(layout: layout(chars))
        guard LampsExactSolver(board: LampsBoard(puzzle), limit: 2).run().count == 1 else { return nil }
        for i in rng.shuffled((0..<n).filter { chars[$0].isNumber }) {
            var trial = chars
            trial[i] = "X"
            let candidate = LampsPuzzle(layout: layout(trial))
            if LampsExactSolver(board: LampsBoard(candidate), limit: 2).run().count == 1 {
                chars = trial
                puzzle = candidate
            }
        }
        return puzzle
    }

    // MARK: Résolution

    public func solve(_ puzzle: LampsPuzzle, limit: Int) -> SolveReport<LampsSolution> {
        let board = LampsBoard(puzzle)
        let exact = LampsExactSolver(board: board, limit: limit).run()
        let human = LampsHumanSolver(b: board).solve(from: Array(repeating: .empty, count: board.count))
        return SolveReport(solutionCount: exact.count, solutions: exact.solutions.map { LampsSolution(lamps: $0) },
                           trace: human.trace, humanSolvable: human.solved, searchNodes: exact.nodes)
    }

    public func initialState(for puzzle: LampsPuzzle) -> LampsState {
        LampsState(marks: Array(repeating: .empty, count: puzzle.rows * puzzle.columns))
    }

    public func state(applying solution: LampsSolution, to puzzle: LampsPuzzle) -> LampsState {
        var state = initialState(for: puzzle)
        for i in solution.lamps { state.marks[i] = .lamp }
        return state
    }

    public func validate(_ puzzle: LampsPuzzle, state: LampsState) -> ValidationResult {
        let board = LampsBoard(puzzle)
        guard let marks = board.sanitized(state.marks) else { return .incomplete }
        let info = illumination(puzzle, state: state)
        var issues: [Issue] = []
        if !info.conflicts.isEmpty {
            issues.append(Issue(cells: info.conflicts.map(board.ref), message: LocalizedTemplate("lamps.error.seeEachOther")))
        }
        for w in info.overfullWalls {
            let have = board.neighbors[w].filter { marks[$0] == .lamp }.count
            issues.append(Issue(cells: [board.ref(w)], message: LocalizedTemplate("lamps.error.wallOver", [String(board.clue[w]!), String(have)])))
        }
        if !issues.isEmpty { return .invalid(issues) }
        return LampsHumanSolver(b: board).isSolved(marks) ? .correct : .incomplete
    }

    // MARK: Difficulté

    public func rate(_ puzzle: LampsPuzzle, report: SolveReport<LampsSolution>) -> DifficultyScore {
        guard report.humanSolvable else { return DifficultyScore(90) }
        let base = [0: 5, 1: 8, 2: 22, 3: 40, 4: 58][report.maxTechniqueRank] ?? 58
        let advanced = report.trace.filter { $0.techniqueRank >= 3 }.count
        let whites = puzzle.layout.joined().filter { $0 == "." }.count
        // Sur une petite grille, un raisonnement par l'absurde n'a que quelques pistes à essayer :
        // décote proportionnelle au manque de cases (audit : des 4×4 étaient classées Fanal).
        let smallGridRelief = max(0, 30 - whites) / 2
        return DifficultyScore(base + min(20, advanced * 3) + whites / 6 - smallGridRelief)
    }

    // MARK: Indices

    public func hint(_ puzzle: LampsPuzzle, state rawState: LampsState, level: HintLevel) -> Hint<LampsState>? {
        let board = LampsBoard(puzzle)
        guard let cleanMarks = board.sanitized(rawState.marks) else { return nil }
        let state = LampsState(marks: cleanMarks)
        let exact = LampsExactSolver(board: board, limit: 2).run()
        guard exact.count == 1, let solutionLamps = exact.solutions.first.map(Set.init),
              validate(puzzle, state: state) != .correct else { return nil }
        var solved = state
        for i in 0..<board.count where board.white[i] { solved.marks[i] = solutionLamps.contains(i) ? .lamp : .empty }

        // 1. Une erreur du joueur passe avant toute nouvelle déduction.
        if let wrong = (0..<board.count).first(where: {
            (state.marks[$0] == .lamp && !solutionLamps.contains($0)) || (state.marks[$0] == .dot && solutionLamps.contains($0))
        }) {
            var fixed = state
            fixed.marks[wrong] = .empty
            let key = state.marks[wrong] == .lamp ? "lamps.hint.wrongLamp" : "lamps.hint.wrongDot"
            switch level {
            case .whisper: return Hint(level: level, text: LocalizedTemplate("lamps.hint.checkMistake"), focus: [board.ref(wrong)])
            case .lead: return Hint(level: level, text: LocalizedTemplate(key), focus: [board.ref(wrong)])
            case .insight: return Hint(level: level, text: LocalizedTemplate(key), focus: [board.ref(wrong)], resultingState: fixed)
            case .solution: return Hint(level: level, text: LocalizedTemplate("lamps.hint.solution"), focus: [], resultingState: solved)
            }
        }

        // 2. Prochaine déduction depuis l'état du joueur.
        if level == .solution {
            return Hint(level: level, text: LocalizedTemplate("lamps.hint.solution"), focus: [], resultingState: solved)
        }
        let human = LampsHumanSolver(b: board)
        if let deduction = human.nextStep(state.marks) {
            var next = state
            human.apply(deduction.placements, to: &next.marks)
            switch level {
            case .whisper: return Hint(level: level, text: LocalizedTemplate("lamps.hint.whisper.\(deduction.step.technique)"), focus: deduction.step.focus)
            case .lead: return Hint(level: level, text: deduction.step.explanation, focus: deduction.step.focus)
            default: return Hint(level: level, text: deduction.step.explanation, focus: deduction.step.focus, resultingState: next)
            }
        }
        // 3. Aucune déduction disponible : révélation progressive.
        return revealHint(board: board, state: state, solutionLamps: solutionLamps, level: level)
    }

    /// Révèle une lampe de la solution progressivement (ligne, puis ligne et colonne, puis la case),
    /// pour ne jamais donner la réponse dès le Murmure.
    func revealHint(board: LampsBoard, state: LampsState, solutionLamps: Set<Int>, level: HintLevel) -> Hint<LampsState>? {
        guard let reveal = solutionLamps.sorted().first(where: { state.marks[$0] != .lamp }) else { return nil }
        let row = reveal / board.columns, column = reveal % board.columns
        switch level {
        case .whisper:
            return Hint(level: level, text: LocalizedTemplate("lamps.hint.reveal.whisper", [String(row + 1)]),
                        focus: (0..<board.columns).map { CellRef(row, $0) })
        case .lead:
            return Hint(level: level, text: LocalizedTemplate("lamps.hint.reveal.lead", [String(row + 1), String(column + 1)]),
                        focus: (0..<board.columns).map { CellRef(row, $0) } + (0..<board.rows).filter { $0 != row }.map { CellRef($0, column) })
        default:
            var next = state
            next.marks[reveal] = .lamp
            return Hint(level: level, text: LocalizedTemplate("lamps.hint.reveal"), focus: [board.ref(reveal)], resultingState: next)
        }
    }

    public func fingerprint(_ puzzle: LampsPuzzle) -> String {
        let chars = puzzle.layout.map { Array($0) }
        return Canonical.grid(rows: puzzle.rows, columns: puzzle.columns) { r, c in chars[r][c] }
    }
}
