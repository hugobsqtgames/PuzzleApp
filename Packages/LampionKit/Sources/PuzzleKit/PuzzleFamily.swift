/// Identifiant stable d'une famille de puzzles (« switches », « locks », « lamps »…).
public struct FamilyID: RawRepresentable, Codable, Sendable, Hashable, ExpressibleByStringLiteral, CustomStringConvertible {
    public let rawValue: String
    public init(rawValue: String) { self.rawValue = rawValue }
    public init(stringLiteral value: String) { rawValue = value }
    public var description: String { rawValue }
}

/// Référence à une case d'un plateau, pour localiser erreurs et indices.
public struct CellRef: Codable, Sendable, Hashable, Comparable {
    public let row: Int
    public let column: Int
    public init(_ row: Int, _ column: Int) { self.row = row; self.column = column }
    public static func < (a: CellRef, b: CellRef) -> Bool { (a.row, a.column) < (b.row, b.column) }
}

/// Texte localisable avec paramètres. Le moteur ne produit jamais de texte en dur :
/// l'app résout `key` dans ses String Catalogs et y injecte `arguments`.
public struct LocalizedTemplate: Codable, Sendable, Hashable, CustomStringConvertible {
    public let key: String
    public let arguments: [String]
    public init(_ key: String, _ arguments: [String] = []) { self.key = key; self.arguments = arguments }
    public var description: String { arguments.isEmpty ? key : "\(key)(\(arguments.joined(separator: ", ")))" }
}

/// Une étape du raisonnement d'un solveur « humain ».
public struct DeductionStep: Codable, Sendable, Hashable {
    /// Rang de la technique : 1 = la plus simple.
    public let techniqueRank: Int
    public let technique: String
    /// Zone concernée (pour le Murmure).
    public let focus: [CellRef]
    /// Explication (pour la Piste).
    public let explanation: LocalizedTemplate

    public init(techniqueRank: Int, technique: String, focus: [CellRef], explanation: LocalizedTemplate) {
        self.techniqueRank = techniqueRank
        self.technique = technique
        self.focus = focus
        self.explanation = explanation
    }
}

/// Résultat d'une résolution.
public struct SolveReport<Solution: Sendable>: Sendable {
    /// Nombre de solutions trouvées, plafonné par la limite demandée (2 suffit pour prouver l'unicité).
    public let solutionCount: Int
    public let solutions: [Solution]
    /// Trace du solveur « humain » (vide si la famille n'en a pas).
    public let trace: [DeductionStep]
    /// Vrai si le solveur « humain » termine sans recherche exhaustive.
    public let humanSolvable: Bool
    /// Effort du solveur complet (nœuds explorés).
    public let searchNodes: Int

    public init(solutionCount: Int, solutions: [Solution], trace: [DeductionStep] = [], humanSolvable: Bool = true, searchNodes: Int = 0) {
        self.solutionCount = solutionCount
        self.solutions = solutions
        self.trace = trace
        self.humanSolvable = humanSolvable
        self.searchNodes = searchNodes
    }

    public var maxTechniqueRank: Int { trace.map(\.techniqueRank).max() ?? 0 }
}

/// Problème localisé dans l'état du joueur.
public struct Issue: Codable, Sendable, Hashable {
    public let cells: [CellRef]
    public let message: LocalizedTemplate
    public init(cells: [CellRef], message: LocalizedTemplate) { self.cells = cells; self.message = message }
}

public enum ValidationResult: Codable, Sendable, Hashable {
    case correct
    case incomplete
    case invalid([Issue])

    public var isCorrect: Bool { self == .correct }
}

/// Niveaux d'indice (GAME_DESIGN § 6).
public enum HintLevel: Int, Codable, Sendable, CaseIterable, Comparable {
    case whisper = 1, lead, insight, solution
    public static func < (a: HintLevel, b: HintLevel) -> Bool { a.rawValue < b.rawValue }
}

public struct Hint<State: Sendable>: Sendable {
    public let level: HintLevel
    public let text: LocalizedTemplate
    public let focus: [CellRef]
    /// État proposé (Éclairage : une déduction appliquée ; Solution : l'état résolu).
    public let resultingState: State?

    public init(level: HintLevel, text: LocalizedTemplate, focus: [CellRef], resultingState: State? = nil) {
        self.level = level
        self.text = text
        self.focus = focus
        self.resultingState = resultingState
    }
}

/// Contrat d'une famille de puzzles (TECHNICAL_ARCHITECTURE § 5.1).
/// Ajouter une famille = implémenter ce protocole ; aucun autre module ne change.
public protocol PuzzleFamily: Sendable {
    associatedtype Puzzle: Codable & Sendable & Hashable
    associatedtype State: Codable & Sendable & Hashable
    associatedtype Parameters: Codable & Sendable & Hashable
    associatedtype Solution: Sendable & Hashable

    static var id: FamilyID { get }
    /// Version du format de données ; à incrémenter si l'encodage change.
    static var formatVersion: Int { get }
    /// Vrai si le puzzle doit avoir exactement une solution (sinon ≥ 1 suffit).
    static var requiresUniqueSolution: Bool { get }
    /// Version du générateur ; entre dans les graines, à incrémenter si l'algorithme change.
    static var generatorVersion: Int { get }

    var thresholds: TierThresholds { get }

    func generate(_ parameters: Parameters, rng: inout SeededRNG) -> Puzzle?
    func solve(_ puzzle: Puzzle, limit: Int) -> SolveReport<Solution>
    func initialState(for puzzle: Puzzle) -> State
    func state(applying solution: Solution, to puzzle: Puzzle) -> State
    func validate(_ puzzle: Puzzle, state: State) -> ValidationResult
    func rate(_ puzzle: Puzzle, report: SolveReport<Solution>) -> DifficultyScore
    func hint(_ puzzle: Puzzle, state: State, level: HintLevel) -> Hint<State>?
    /// Empreinte canonique (identique pour deux puzzles équivalents par symétrie).
    func fingerprint(_ puzzle: Puzzle) -> String
}

extension PuzzleFamily {
    public var thresholds: TierThresholds { .standard }

    public func tier(_ puzzle: Puzzle, report: SolveReport<Solution>) -> Tier {
        thresholds.tier(for: rate(puzzle, report: report))
    }
}
