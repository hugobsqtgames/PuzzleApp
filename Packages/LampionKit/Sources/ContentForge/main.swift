import FamilyLamps
import FamilyLocks
import FamilySwitches
import Foundation
import PuzzleKit

// ContentForge — génération et validation de contenu, hors de l'appareil.
//   contentforge soak [candidats par famille]   génère, résout, valide, mesure ; affiche les statistiques.

func report<F: PuzzleFamily>(_ family: F, parameters: F.Parameters, count: Int) {
    let start = Date()
    let result = CandidatePipeline(family: family).generate(count: count, parameters: parameters, seedBase: 1, maxAttempts: count * 50)
    var tiers: [Tier: Int] = [:]
    for accepted in result.accepted { tiers[accepted.tier, default: 0] += 1 }
    let tierText = Tier.allCases.map { "\($0)=\(tiers[$0] ?? 0)" }.joined(separator: " ")
    let rejectText = result.rejections.sorted { $0.value > $1.value }.map { "\($0.key)=\($0.value)" }.joined(separator: " ")
    print("\(F.id): \(result.accepted.count) acceptés en \(String(format: "%.1f", Date().timeIntervalSince(start))) s | \(tierText) | rejets: \(rejectText)")
}

let arguments = CommandLine.arguments.dropFirst()
switch arguments.first {
case "soak":
    let count = arguments.dropFirst().first.flatMap(Int.init) ?? 100
    report(SwitchesFamily(), parameters: SwitchesParameters(rows: 4, columns: 4, presses: 3...8, minimumMoves: 2), count: count)
    report(LocksFamily(), parameters: LocksParameters(length: 3, clueCount: 4...6), count: count)
    report(LampsFamily(), parameters: LampsParameters(rows: 6, columns: 6), count: count)
default:
    print("usage: contentforge soak [count]")
}
