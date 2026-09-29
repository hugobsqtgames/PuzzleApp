import PuzzleKit

/// Interrupteurs : chaque bouton inverse sa lanterne et celles de son motif.
/// Objectif : tout allumer. Résolution exacte par algèbre linéaire sur GF(2).

public enum SwitchPattern: String, Codable, Sendable, Hashable, CaseIterable {
    /// Le bouton et ses 4 voisins orthogonaux.
    case cross
    /// Le bouton et ses 4 voisins diagonaux.
    case diagonal
    /// Le bouton et ses 8 voisins.
    case ring

    public var offsets: [(Int, Int)] {
        switch self {
        case .cross: [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]
        case .diagonal: [(0, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)]
        case .ring: [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
        }
    }
}

public struct SwitchesPuzzle: Codable, Sendable, Hashable {
    public let rows: Int
    public let columns: Int
    public let pattern: SwitchPattern
    /// État initial des lanternes, ligne par ligne.
    public let initiallyLit: [Bool]

    public init(rows: Int, columns: Int, pattern: SwitchPattern, initiallyLit: [Bool]) {
        precondition(initiallyLit.count == rows * columns, "grid size mismatch")
        precondition(rows * columns <= 64, "grids are limited to 64 cells")
        self.rows = rows
        self.columns = columns
        self.pattern = pattern
        self.initiallyLit = initiallyLit
    }

    public var cellCount: Int { rows * columns }

    /// Dimensions cohérentes (une donnée de contenu ou de sauvegarde abîmée ne doit jamais faire planter).
    public static func isWellFormed(rows: Int, columns: Int, cells: Int) -> Bool {
        rows > 0 && columns > 0 && rows <= 8 && columns <= 8 && rows * columns == cells
    }

    enum CodingKeys: String, CodingKey { case rows, columns, pattern, initiallyLit }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let rows = try c.decode(Int.self, forKey: .rows), columns = try c.decode(Int.self, forKey: .columns)
        let lit = try c.decode([Bool].self, forKey: .initiallyLit)
        guard Self.isWellFormed(rows: rows, columns: columns, cells: lit.count) else {
            throw DecodingError.dataCorruptedError(forKey: .initiallyLit, in: c, debugDescription: "inconsistent switches grid")
        }
        self.init(rows: rows, columns: columns, pattern: try c.decode(SwitchPattern.self, forKey: .pattern), initiallyLit: lit)
    }
}

public struct SwitchesState: Codable, Sendable, Hashable {
    public var lit: [Bool]
    public var moves: Int
    public init(lit: [Bool], moves: Int = 0) { self.lit = lit; self.moves = moves }
}

public struct SwitchesParameters: Codable, Sendable, Hashable {
    public var rows: Int
    public var columns: Int
    public var pattern: SwitchPattern
    /// Nombre d'appuis utilisés pour brouiller la grille.
    public var presses: ClosedRange<Int>
    /// Nombre minimal de coups exigé pour accepter le puzzle.
    public var minimumMoves: Int

    public init(rows: Int, columns: Int, pattern: SwitchPattern = .cross, presses: ClosedRange<Int>, minimumMoves: Int = 1) {
        self.rows = rows
        self.columns = columns
        self.pattern = pattern
        self.presses = presses
        self.minimumMoves = minimumMoves
    }
}

/// Une solution : l'ensemble (minimal) des boutons à presser, chacun une fois.
public struct SwitchesSolution: Sendable, Hashable {
    public let presses: [Bool]
    public var moveCount: Int { presses.filter { $0 }.count }
}

public struct SwitchesFamily: PuzzleFamily {
    public static let id: FamilyID = "switches"
    public static let formatVersion = 1
    public static let requiresUniqueSolution = false
    public static let generatorVersion = 1

    public init() {}

    // MARK: Règles

    /// Masque des cases inversées par le bouton `index`.
    public func mask(of index: Int, in puzzle: SwitchesPuzzle) -> UInt64 {
        let r = index / puzzle.columns, c = index % puzzle.columns
        var mask: UInt64 = 0
        for (dr, dc) in puzzle.pattern.offsets {
            let rr = r + dr, cc = c + dc
            if rr >= 0, cc >= 0, rr < puzzle.rows, cc < puzzle.columns {
                mask |= 1 << UInt64(rr * puzzle.columns + cc)
            }
        }
        return mask
    }

    public func press(_ index: Int, state: inout SwitchesState, puzzle: SwitchesPuzzle) {
        guard (0..<puzzle.cellCount).contains(index), state.lit.count == puzzle.cellCount else { return }
        let m = mask(of: index, in: puzzle)
        for i in 0..<puzzle.cellCount where m & (1 << UInt64(i)) != 0 { state.lit[i].toggle() }
        state.moves += 1
    }

    // MARK: Génération

    public func generate(_ p: SwitchesParameters, rng: inout SeededRNG) -> SwitchesPuzzle? {
        guard SwitchesPuzzle.isWellFormed(rows: p.rows, columns: p.columns, cells: p.rows * p.columns),
              p.presses.lowerBound >= 0 else { return nil }
        let n = p.rows * p.columns
        let count = min(n, rng.int(in: p.presses))
        let chosen = rng.shuffled(Array(0..<n)).prefix(count)
        var state = SwitchesState(lit: Array(repeating: true, count: n))
        let draft = SwitchesPuzzle(rows: p.rows, columns: p.columns, pattern: p.pattern, initiallyLit: state.lit)
        for index in chosen { press(index, state: &state, puzzle: draft) }
        let puzzle = SwitchesPuzzle(rows: p.rows, columns: p.columns, pattern: p.pattern, initiallyLit: state.lit)
        guard !state.lit.allSatisfy({ $0 }) else { return nil }
        guard let minimal = minimalSolution(puzzle, lit: puzzle.initiallyLit), minimal.moveCount >= p.minimumMoves else { return nil }
        return puzzle
    }

    // MARK: Résolution (GF(2))

    struct LinearSystem {
        var particular: [Bool]
        var nullBasis: [[Bool]]
    }

    /// Résout A·x = b où b = cases éteintes. Renvoie nil si aucune solution.
    func linearSolve(_ puzzle: SwitchesPuzzle, lit: [Bool]) -> LinearSystem? {
        let n = puzzle.cellCount
        guard lit.count == n else { return nil }
        // Équation i : somme des boutons j qui touchent la case i = (case i éteinte).
        var rows: [UInt64] = Array(repeating: 0, count: n)
        var rhs: [Bool] = lit.map { !$0 }
        for j in 0..<n {
            let m = mask(of: j, in: puzzle)
            for i in 0..<n where m & (1 << UInt64(i)) != 0 { rows[i] |= 1 << UInt64(j) }
        }
        var pivotColumns: [Int] = []
        var rank = 0
        for column in 0..<n {
            guard let pivot = (rank..<n).first(where: { rows[$0] & (1 << UInt64(column)) != 0 }) else { continue }
            rows.swapAt(rank, pivot); rhs.swapAt(rank, pivot)
            for r in 0..<n where r != rank && rows[r] & (1 << UInt64(column)) != 0 {
                rows[r] ^= rows[rank]
                rhs[r] = rhs[r] != rhs[rank]
            }
            pivotColumns.append(column)
            rank += 1
        }
        for r in rank..<n where rhs[r] { return nil }
        var particular = Array(repeating: false, count: n)
        for (r, column) in pivotColumns.enumerated() { particular[column] = rhs[r] }
        let free = (0..<n).filter { !pivotColumns.contains($0) }
        var basis: [[Bool]] = []
        for f in free {
            var v = Array(repeating: false, count: n)
            v[f] = true
            for (r, column) in pivotColumns.enumerated() where rows[r] & (1 << UInt64(f)) != 0 { v[column] = true }
            basis.append(v)
        }
        return LinearSystem(particular: particular, nullBasis: basis)
    }

    /// Solution de poids minimal (nombre de coups minimal).
    public func minimalSolution(_ puzzle: SwitchesPuzzle, lit: [Bool]) -> SwitchesSolution? {
        guard let system = linearSolve(puzzle, lit: lit) else { return nil }
        var best = system.particular
        var bestWeight = best.filter { $0 }.count
        let k = system.nullBasis.count
        if k <= 20 {
            for combo in 1..<(1 << k) {
                var v = system.particular
                for b in 0..<k where combo & (1 << b) != 0 {
                    for i in 0..<v.count where system.nullBasis[b][i] { v[i].toggle() }
                }
                let w = v.filter { $0 }.count
                if w < bestWeight { best = v; bestWeight = w }
            }
        }
        return SwitchesSolution(presses: best)
    }

    public func nullity(_ puzzle: SwitchesPuzzle) -> Int {
        linearSolve(puzzle, lit: Array(repeating: true, count: puzzle.cellCount))?.nullBasis.count ?? 0
    }

    public func solve(_ puzzle: SwitchesPuzzle, limit: Int) -> SolveReport<SwitchesSolution> {
        guard let system = linearSolve(puzzle, lit: puzzle.initiallyLit), let minimal = minimalSolution(puzzle, lit: puzzle.initiallyLit) else {
            return SolveReport(solutionCount: 0, solutions: [])
        }
        let k = system.nullBasis.count
        let count = k >= 62 ? limit : min(limit, 1 << k)
        return SolveReport(solutionCount: count, solutions: [minimal], humanSolvable: true, searchNodes: k <= 20 ? 1 << k : 0)
    }

    public func initialState(for puzzle: SwitchesPuzzle) -> SwitchesState { SwitchesState(lit: puzzle.initiallyLit) }

    public func state(applying solution: SwitchesSolution, to puzzle: SwitchesPuzzle) -> SwitchesState {
        var state = initialState(for: puzzle)
        for (i, pressed) in solution.presses.enumerated() where pressed { press(i, state: &state, puzzle: puzzle) }
        return state
    }

    public func validate(_ puzzle: SwitchesPuzzle, state: SwitchesState) -> ValidationResult {
        state.lit.count == puzzle.cellCount && state.lit.allSatisfy { $0 } ? .correct : .incomplete
    }

    // MARK: Difficulté

    public func rate(_ puzzle: SwitchesPuzzle, report: SolveReport<SwitchesSolution>) -> DifficultyScore {
        let moves = report.solutions.first?.moveCount ?? 0
        let patternBonus = switch puzzle.pattern { case .cross: 0; case .diagonal: 6; case .ring: 10 }
        let nullityRelief = nullity(puzzle) * 3
        return DifficultyScore(moves * 6 + max(0, puzzle.cellCount - 9) + patternBonus - nullityRelief)
    }

    // MARK: Indices

    public func hint(_ puzzle: SwitchesPuzzle, state: SwitchesState, level: HintLevel) -> Hint<SwitchesState>? {
        guard validate(puzzle, state: state) != .correct, let plan = minimalSolution(puzzle, lit: state.lit) else { return nil }
        let pressed = plan.presses.indices.filter { plan.presses[$0] }
        guard let first = pressed.first else { return nil }
        let row = first / puzzle.columns, column = first % puzzle.columns
        let rowCells = (0..<puzzle.columns).map { CellRef(row, $0) }
        switch level {
        case .whisper:
            return Hint(level: level, text: LocalizedTemplate("switches.hint.whisper", [String(row + 1)]), focus: rowCells)
        case .lead:
            return Hint(level: level, text: LocalizedTemplate("switches.hint.lead", [String(row + 1), String(plan.moveCount)]), focus: rowCells)
        case .insight:
            var next = state
            press(first, state: &next, puzzle: puzzle)
            return Hint(level: level, text: LocalizedTemplate("switches.hint.insight", [String(row + 1), String(column + 1)]), focus: [CellRef(row, column)], resultingState: next)
        case .solution:
            var solved = state
            for index in pressed { press(index, state: &solved, puzzle: puzzle) }
            return Hint(level: level, text: LocalizedTemplate("switches.hint.solution", [String(plan.moveCount)]), focus: pressed.map { CellRef($0 / puzzle.columns, $0 % puzzle.columns) }, resultingState: solved)
        }
    }

    // MARK: Empreinte

    public func fingerprint(_ puzzle: SwitchesPuzzle) -> String {
        "\(puzzle.pattern.rawValue)|" + Canonical.grid(rows: puzzle.rows, columns: puzzle.columns) { r, c in
            puzzle.initiallyLit[r * puzzle.columns + c] ? "o" : "."
        }
    }
}
