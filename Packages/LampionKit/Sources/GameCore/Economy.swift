/// Portefeuille d'Éclats. Chaque mouvement porte un identifiant unique :
/// l'appliquer deux fois (double tap, relance pendant une animation) n'a aucun effet.
public struct Wallet: Codable, Hashable, Sendable {
    public private(set) var balance: Int = 0
    public private(set) var earned: Int = 0
    public private(set) var spent: Int = 0
    public private(set) var appliedTransactions: Set<String> = []

    public init() {}

    public enum Failure: Error, Equatable {
        case insufficientBalance(missing: Int)
        case invalidAmount
    }

    /// Crédite `amount` Éclats. Renvoie faux si la transaction était déjà appliquée.
    @discardableResult
    public mutating func credit(_ amount: Int, id: String) throws -> Bool {
        guard amount >= 0 else { throw Failure.invalidAmount }
        guard !appliedTransactions.contains(id) else { return false }
        appliedTransactions.insert(id)
        balance += amount
        earned += amount
        return true
    }

    /// Débite `amount` Éclats. Le solde ne devient jamais négatif.
    @discardableResult
    public mutating func debit(_ amount: Int, id: String) throws -> Bool {
        guard amount >= 0 else { throw Failure.invalidAmount }
        guard !appliedTransactions.contains(id) else { return false }
        guard balance >= amount else { throw Failure.insufficientBalance(missing: amount - balance) }
        appliedTransactions.insert(id)
        balance -= amount
        spent += amount
        return true
    }
}

/// Barème (GAME_DESIGN § 6–7). Valeurs de départ, ajustables sans toucher au code appelant.
public struct EconomyRules: Codable, Hashable, Sendable {
    public var tierRewards = [5, 8, 12, 16, 20, 25]
    /// Bonus Clairvoyance en pourcentage de la récompense de base.
    public var clairvoyancePercent = 50
    public var roomBonus = 20
    public var buildingBonus = 50
    public var districtBonus = 100
    public var dailyReward = 15
    public var dailyStreakBonusCap = 10
    /// Coût des indices : Murmure, Piste, Éclairage, Solution.
    public var hintCosts = [0, 5, 10, 20]

    public init() {}
    public static let standard = EconomyRules()
}
