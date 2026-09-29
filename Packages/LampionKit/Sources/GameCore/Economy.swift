/// Portefeuille d'Éclats. Chaque mouvement porte un identifiant unique :
/// l'appliquer deux fois (double tap, relance pendant une animation) n'a aucun effet.
public struct Wallet: Codable, Hashable, Sendable {
    public private(set) var balance: Int = 0
    public private(set) var earned: Int = 0
    public private(set) var spent: Int = 0
    public private(set) var appliedTransactions: Set<String> = []

    public init() {}

    enum CodingKeys: String, CodingKey { case balance, earned, spent, appliedTransactions }

    /// Décodage tolérant : chaque champ indépendamment, jamais de solde négatif.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        balance = max(0, c.value(Int.self, forKey: .balance, default: 0))
        earned = max(0, c.value(Int.self, forKey: .earned, default: 0))
        spent = max(0, c.value(Int.self, forKey: .spent, default: 0))
        appliedTransactions = c.lossySet(Set<String>.self, forKey: .appliedTransactions)
    }

    /// Fusion avec une copie de secours : le portefeuille le plus avancé (le plus de transactions) l'emporte,
    /// complété des identifiants de l'autre pour qu'aucune récompense ne soit versée deux fois.
    public func merged(with other: Wallet) -> Wallet {
        var best = appliedTransactions.count >= other.appliedTransactions.count ? self : other
        best.appliedTransactions.formUnion(appliedTransactions.union(other.appliedTransactions))
        return best
    }

    public enum Failure: Error, Equatable {
        case insufficientBalance(missing: Int)
        case invalidAmount
    }

    /// Crédite `amount` Éclats. Renvoie faux si la transaction était déjà appliquée.
    @discardableResult
    public mutating func credit(_ amount: Int, id: String) throws -> Bool {
        guard amount >= 0 else { throw Failure.invalidAmount }
        guard !appliedTransactions.contains(id) else { return false }
        let (newBalance, o1) = balance.addingReportingOverflow(amount)
        let (newEarned, o2) = earned.addingReportingOverflow(amount)
        guard !o1, !o2 else { throw Failure.invalidAmount }
        appliedTransactions.insert(id)
        balance = newBalance
        earned = newEarned
        return true
    }

    /// Débite `amount` Éclats. Le solde ne devient jamais négatif.
    @discardableResult
    public mutating func debit(_ amount: Int, id: String) throws -> Bool {
        guard amount >= 0 else { throw Failure.invalidAmount }
        guard !appliedTransactions.contains(id) else { return false }
        guard balance >= amount else { throw Failure.insufficientBalance(missing: amount - balance) }
        let (newSpent, overflow) = spent.addingReportingOverflow(amount)
        guard !overflow else { throw Failure.invalidAmount }
        appliedTransactions.insert(id)
        balance -= amount
        spent = newSpent
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
