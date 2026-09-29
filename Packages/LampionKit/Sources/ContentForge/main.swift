import FamilyLamps
import FamilyLocks
import FamilySwitches
import Foundation
import PuzzleKit

// ContentForge — génération et validation de contenu, hors de l'appareil.
//   contentforge soak [n]    génère n puzzles par famille et affiche les statistiques
//   contentforge audit [n]   attaque massive : n graines par configuration, invariants vérifiés un par un

func report<F: PuzzleFamily>(_ family: F, parameters: F.Parameters, count: Int) {
    let start = Date()
    let result = CandidatePipeline(family: family).generate(count: count, parameters: parameters, seedBase: 1, maxAttempts: count * 50)
    var tiers: [Tier: Int] = [:]
    for accepted in result.accepted { tiers[accepted.tier, default: 0] += 1 }
    let tierText = Tier.allCases.map { "\($0)=\(tiers[$0] ?? 0)" }.joined(separator: " ")
    let rejectText = result.rejections.sorted { $0.value > $1.value }.map { "\($0.key)=\($0.value)" }.joined(separator: " ")
    print("\(F.id): \(result.accepted.count) acceptés en \(String(format: "%.1f", Date().timeIntervalSince(start))) s | \(tierText) | rejets: \(rejectText)")
}

struct AuditStats {
    var candidates = 0, accepted = 0, failures: [String] = [], slowest = 0.0, slowestSeed: UInt64 = 0
    var tiers: [Tier: Int] = [:]
    var fingerprints: Set<String> = []
    var duplicates = 0
}

/// Invariants vérifiés pour chaque puzzle accepté.
func audit<F: PuzzleFamily>(_ family: F, label: String, parameters: F.Parameters, seeds: Int, maxHintSteps: Int) -> AuditStats {
    var stats = AuditStats()
    let pipeline = CandidatePipeline(family: family)
    for i in 0..<seeds {
        let seed = StableHash.seed("audit", label, String(i))
        stats.candidates += 1
        let t0 = Date()
        let outcome = pipeline.evaluate(parameters: parameters, seed: seed)
        let elapsed = Date().timeIntervalSince(t0)
        if elapsed > stats.slowest { stats.slowest = elapsed; stats.slowestSeed = seed }
        guard let a = outcome.accepted else { continue }
        stats.accepted += 1
        stats.tiers[a.tier, default: 0] += 1
        func fail(_ what: String) { stats.failures.append("\(label) seed=\(seed): \(what)") }
        // Déterminisme : même graine → même puzzle.
        var r1 = SeededRNG(seed: seed), r2 = SeededRNG(seed: seed)
        if family.generate(parameters, rng: &r1) != family.generate(parameters, rng: &r2) { fail("non-deterministic") }
        // Aller-retour JSON (le contenu livré doit se relire à l'identique et passer les contrôles de forme).
        if let data = try? JSONEncoder().encode(a.puzzle) {
            if (try? JSONDecoder().decode(F.Puzzle.self, from: data)) != a.puzzle { fail("json round-trip") }
        } else { fail("encode") }
        // Solution : unique si exigée, validée.
        let report = family.solve(a.puzzle, limit: 3)
        if F.requiresUniqueSolution && report.solutionCount != 1 { fail("solutions=\(report.solutionCount)") }
        guard let solution = report.solutions.first else { fail("no solution"); continue }
        if !family.validate(a.puzzle, state: family.state(applying: solution, to: a.puzzle)).isCorrect { fail("solution rejected") }
        // État initial jamais déjà résolu.
        if family.validate(a.puzzle, state: family.initialState(for: a.puzzle)).isCorrect { fail("initial state already solved") }
        // Doublons.
        if !stats.fingerprints.insert(a.fingerprint).inserted { stats.duplicates += 1 }
        // Chaîne d'Éclairages : converge vers une solution valide ; le Murmure ne modifie jamais l'état.
        var state = family.initialState(for: a.puzzle)
        var steps = 0
        while !family.validate(a.puzzle, state: state).isCorrect {
            if let w = family.hint(a.puzzle, state: state, level: .whisper), w.resultingState != nil { fail("whisper changes state") }
            guard let next = family.hint(a.puzzle, state: state, level: .insight)?.resultingState else { fail("hint chain stuck at step \(steps)"); break }
            if next == state { fail("hint made no progress"); break }
            state = next
            steps += 1
            if steps > maxHintSteps { fail("hint chain too long"); break }
        }
        // L'indice Solution résout depuis l'état initial.
        if let solved = family.hint(a.puzzle, state: family.initialState(for: a.puzzle), level: .solution)?.resultingState,
           !family.validate(a.puzzle, state: solved).isCorrect { fail("solution hint wrong") }
    }
    return stats
}

func printAudit(_ label: String, _ s: AuditStats) {
    let tiers = Tier.allCases.map { "\($0)=\(s.tiers[$0] ?? 0)" }.joined(separator: " ")
    print("\(label.padding(toLength: 26, withPad: " ", startingAt: 0)) candidats=\(s.candidates) acceptés=\(s.accepted) doublons=\(s.duplicates) échecs=\(s.failures.count) max=\(String(format: "%.3f", s.slowest))s | \(tiers)")
    for f in s.failures.prefix(5) { print("   ✘ \(f)") }
}

let arguments = CommandLine.arguments.dropFirst()
switch arguments.first {
case "soak":
    let count = arguments.dropFirst().first.flatMap(Int.init) ?? 100
    report(SwitchesFamily(), parameters: SwitchesParameters(rows: 4, columns: 4, presses: 3...8, minimumMoves: 2), count: count)
    report(LocksFamily(), parameters: LocksParameters(length: 3, clueCount: 4...6), count: count)
    report(LampsFamily(), parameters: LampsParameters(rows: 6, columns: 6), count: count)
case "audit":
    let n = arguments.dropFirst().first.flatMap(Int.init) ?? 300
    var failed = 0
    for (r, c, pattern) in [(2, 2, SwitchPattern.cross), (3, 3, .cross), (4, 4, .cross), (5, 5, .cross), (3, 5, .diagonal), (6, 6, .ring), (8, 8, .cross)] {
        let s = audit(SwitchesFamily(), label: "switches \(r)x\(c) \(pattern)", parameters: SwitchesParameters(rows: r, columns: c, pattern: pattern, presses: 1...(r * c)), seeds: n, maxHintSteps: 64)
        printAudit("switches \(r)x\(c) \(pattern)", s); failed += s.failures.count
    }
    for (len, alpha, rep) in [(2, 10, false), (3, 10, false), (4, 10, false), (3, 6, true), (4, 8, true), (5, 10, false)] {
        let s = audit(LocksFamily(), label: "locks \(len)/\(alpha)\(rep ? "r" : "")", parameters: LocksParameters(length: len, alphabet: alpha, allowsRepeats: rep, clueCount: 2...9), seeds: len >= 5 ? n / 5 : n, maxHintSteps: 8)
        printAudit("locks \(len)/\(alpha)\(rep ? " rep" : "")", s); failed += s.failures.count
    }
    for (size, walls) in [(4, 10...30), (5, 15...30), (6, 18...26), (7, 15...25), (8, 18...26), (10, 18...26), (6, 40...60), (6, 0...5)] {
        let s = audit(LampsFamily(), label: "lamps \(size) \(walls)", parameters: LampsParameters(rows: size, columns: size, wallPercent: walls), seeds: size >= 10 ? n / 5 : n, maxHintSteps: size * size)
        printAudit("lamps \(size)x\(size) murs \(walls)", s); failed += s.failures.count
    }
    print(failed == 0 ? "AUDIT OK" : "AUDIT: \(failed) échecs")
    exit(failed == 0 ? 0 : 1)
default:
    print("usage: contentforge soak [n] | audit [n]")
}
