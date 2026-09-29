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
        // `try?` champ par champ : un champ abîmé ne fait pas perdre les autres.
        solved = (try? c.decodeIfPresent([PuzzleID: SolveRecord].self, forKey: .solved)) ?? [:]
        inProgress = (try? c.decodeIfPresent([PuzzleID: Data].self, forKey: .inProgress)) ?? [:]
        wallet = (try? c.decodeIfPresent(Wallet.self, forKey: .wallet)) ?? Wallet()
        daily = (try? c.decodeIfPresent(DailyState.self, forKey: .daily)) ?? DailyState()
        collectibles = (try? c.decodeIfPresent(Set<String>.self, forKey: .collectibles)) ?? []
        ownedCosmetics = (try? c.decodeIfPresent(Set<String>.self, forKey: .ownedCosmetics)) ?? []
        equippedCosmetics = (try? c.decodeIfPresent([String: String].self, forKey: .equippedCosmetics)) ?? [:]
        seenDialogue = (try? c.decodeIfPresent(Set<String>.self, forKey: .seenDialogue)) ?? []
        lastPuzzle = try? c.decodeIfPresent(PuzzleID.self, forKey: .lastPuzzle)
        onboardingDone = (try? c.decodeIfPresent(Bool.self, forKey: .onboardingDone)) ?? false
    }
}
