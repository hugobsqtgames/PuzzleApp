import Foundation
import PuzzleKit

/// Trace d'une résolution.
public struct SolveRecord: Codable, Hashable, Sendable {
    public var solvedAt: Date
    public var paidHints: Int
    public var wrongAnswers: Int
    public var usedSolution: Bool
    public var clairvoyant: Bool { paidHints == 0 && wrongAnswers == 0 && !usedSolution }

    public init(solvedAt: Date, paidHints: Int = 0, wrongAnswers: Int = 0, usedSolution: Bool = false) {
        self.solvedAt = solvedAt; self.paidHints = paidHints; self.wrongAnswers = wrongAnswers; self.usedSolution = usedSolution
    }
}

/// État de jeu complet, sauvegardé localement.
///
/// Décodage tolérant : chaque champ absent prend sa valeur par défaut, les champs inconnus
/// sont ignorés. Une sauvegarde d'une version antérieure ou partiellement abîmée reste lisible.
public struct GameState: Codable, Hashable, Sendable {
    public var solved: [PuzzleID: SolveRecord] = [:]
    /// États de puzzles en cours, encodés par leur famille (reprise exacte).
    public var inProgress: [PuzzleID: Data] = [:]
    public var wallet = Wallet()
    public var daily = DailyState()
    public var collectibles: Set<String> = []
    public var ownedCosmetics: Set<String> = []
    public var equippedCosmetics: [String: String] = [:]
    public var seenDialogue: Set<String> = []
    public var lastPuzzle: PuzzleID?
    public var onboardingDone = false

    public init() {}

    enum CodingKeys: String, CodingKey {
        case solved, inProgress, wallet, daily, collectibles, ownedCosmetics, equippedCosmetics, seenDialogue, lastPuzzle, onboardingDone
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        // Champ par champ, et élément par élément pour les collections :
        // une donnée abîmée ne fait perdre qu'elle-même.
        solved = c.lossyDictionary([PuzzleID: SolveRecord].self, forKey: .solved)
        inProgress = c.lossyDictionary([PuzzleID: Data].self, forKey: .inProgress)
        wallet = c.value(Wallet.self, forKey: .wallet, default: Wallet())
        daily = c.value(DailyState.self, forKey: .daily, default: DailyState())
        collectibles = c.lossySet(Set<String>.self, forKey: .collectibles)
        ownedCosmetics = c.lossySet(Set<String>.self, forKey: .ownedCosmetics)
        equippedCosmetics = c.lossyDictionary([String: String].self, forKey: .equippedCosmetics)
        seenDialogue = c.lossySet(Set<String>.self, forKey: .seenDialogue)
        lastPuzzle = try? c.decodeIfPresent(PuzzleID.self, forKey: .lastPuzzle)
        onboardingDone = (try? c.decodeIfPresent(Bool.self, forKey: .onboardingDone)) ?? false
    }
}
