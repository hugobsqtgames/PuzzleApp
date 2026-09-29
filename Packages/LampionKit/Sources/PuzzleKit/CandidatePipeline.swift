/// Pipeline d'acceptation d'un puzzle généré :
/// GENERATE → SOLVE → UNIQUE? → VALIDATE(solution) → RATE → TIER OK? → FINGERPRINT unique? → ACCEPT / REJECT
/// (TECHNICAL_ARCHITECTURE § 8).
public enum RejectReason: Hashable, Sendable, CustomStringConvertible {
    case generationFailed
    case noSolution
    case notUnique
    case solutionRejectedByValidator
    case notHumanSolvable
    case wrongTier(Tier)
    case duplicate
    case familyConstraint(String)

    public var description: String {
        switch self {
        case .generationFailed: "generation-failed"
        case .noSolution: "no-solution"
        case .notUnique: "not-unique"
        case .solutionRejectedByValidator: "solution-rejected"
        case .notHumanSolvable: "not-human-solvable"
        case .wrongTier(let tier): "wrong-tier(\(tier))"
        case .duplicate: "duplicate"
        case .familyConstraint(let why): "constraint(\(why))"
        }
    }
}

public struct AcceptedPuzzle<F: PuzzleFamily>: Sendable {
    public let seed: UInt64
    public let puzzle: F.Puzzle
    public let score: DifficultyScore
    public let tier: Tier
    public let fingerprint: String
    public let report: SolveReport<F.Solution>
}

public enum CandidateOutcome<F: PuzzleFamily>: Sendable {
    case accepted(AcceptedPuzzle<F>)
    case rejected(RejectReason)

    public var accepted: AcceptedPuzzle<F>? {
        if case .accepted(let a) = self { return a }
        return nil
    }
}

public struct CandidatePipeline<F: PuzzleFamily>: Sendable {
    public let family: F
    /// Si faux, un puzzle qui exige une recherche exhaustive (hors palier Astre) est rejeté.
    public var allowNonHumanSolvableBelowStar = false

    public init(family: F) { self.family = family }

    /// Évalue un candidat. `seen` contient les empreintes déjà acceptées (déduplication).
    public func evaluate(parameters: F.Parameters, seed: UInt64, targetTiers: ClosedRange<Tier>? = nil, seen: Set<String> = []) -> CandidateOutcome<F> {
        var rng = SeededRNG(seed: seed)
        guard let puzzle = family.generate(parameters, rng: &rng) else { return .rejected(.generationFailed) }
        let report = family.solve(puzzle, limit: 2)
        guard report.solutionCount > 0, let solution = report.solutions.first else { return .rejected(.noSolution) }
        if F.requiresUniqueSolution && report.solutionCount != 1 { return .rejected(.notUnique) }
        let solvedState = family.state(applying: solution, to: puzzle)
        guard family.validate(puzzle, state: solvedState).isCorrect else { return .rejected(.solutionRejectedByValidator) }
        let score = family.rate(puzzle, report: report)
        let tier = family.thresholds.tier(for: score)
        if !report.humanSolvable && tier < .star && !allowNonHumanSolvableBelowStar { return .rejected(.notHumanSolvable) }
        if let targetTiers, !targetTiers.contains(tier) { return .rejected(.wrongTier(tier)) }
        let print = family.fingerprint(puzzle)
        if seen.contains(print) { return .rejected(.duplicate) }
        return .accepted(AcceptedPuzzle(seed: seed, puzzle: puzzle, score: score, tier: tier, fingerprint: print, report: report))
    }

    /// Génère jusqu'à `count` puzzles acceptés à partir de graines consécutives.
    public func generate(count: Int, parameters: F.Parameters, seedBase: UInt64, targetTiers: ClosedRange<Tier>? = nil, maxAttempts: Int = 10_000) -> (accepted: [AcceptedPuzzle<F>], rejections: [RejectReason: Int]) {
        var accepted: [AcceptedPuzzle<F>] = []
        var seen = Set<String>()
        var rejections: [RejectReason: Int] = [:]
        var attempt: UInt64 = 0
        while accepted.count < count && attempt < UInt64(maxAttempts) {
            let seed = StableHash.seed(F.id.rawValue, String(F.generatorVersion), String(seedBase &+ attempt))
            attempt += 1
            switch evaluate(parameters: parameters, seed: seed, targetTiers: targetTiers, seen: seen) {
            case .accepted(let puzzle):
                accepted.append(puzzle)
                seen.insert(puzzle.fingerprint)
            case .rejected(let reason):
                rejections[reason, default: 0] += 1
            }
        }
        return (accepted, rejections)
    }
}
