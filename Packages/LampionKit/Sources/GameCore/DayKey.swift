import Foundation

/// Jour calendaire local (année, mois, jour), indépendant de l'heure et du fuseau une fois créé.
/// L'arithmétique (écarts, jour de la semaine) se fait sur un numéro de jour civil exact,
/// sans dépendre de `Calendar` : pas de surprise avec l'heure d'été.
public struct DayKey: Hashable, Comparable, Sendable, CustomStringConvertible, Codable {
    public let year: Int
    public let month: Int
    public let day: Int

    public init(year: Int, month: Int, day: Int) {
        precondition(Self.isValid(year: year, month: month, day: day), "invalid date")
        self.year = year; self.month = month; self.day = day
    }

    public static func daysInMonth(year: Int, month: Int) -> Int {
        switch month {
        case 2: (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 29 : 28
        case 4, 6, 9, 11: 30
        default: 31
        }
    }

    public static func isValid(year: Int, month: Int, day: Int) -> Bool {
        (1...12).contains(month) && day >= 1 && day <= daysInMonth(year: year, month: month) && (-100_000...100_000).contains(year)
    }

    /// Jour local de `date` dans le fuseau donné (celui de l'appareil par défaut).
    public init(_ date: Date, timeZone: TimeZone = .current) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        self.init(year: c.year!, month: c.month!, day: c.day!)
    }

    /// Jours écoulés depuis le 1970-01-01 (algorithme « days from civil » de H. Hinnant).
    public var ordinal: Int {
        let y = month <= 2 ? year - 1 : year
        let era = (y >= 0 ? y : y - 399) / 400
        let yoe = y - era * 400
        let mp = (month + 9) % 12
        let doy = (153 * mp + 2) / 5 + day - 1
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        return era * 146_097 + doe - 719_468
    }

    public init(ordinal z0: Int) {
        let z = z0 + 719_468
        let era = (z >= 0 ? z : z - 146_096) / 146_097
        let doe = z - era * 146_097
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
        let mp = (5 * doy + 2) / 153
        let d = doy - (153 * mp + 2) / 5 + 1
        let m = mp < 10 ? mp + 3 : mp - 9
        self.init(year: yoe + era * 400 + (m <= 2 ? 1 : 0), month: m, day: d)
    }

    public func adding(days: Int) -> DayKey { DayKey(ordinal: ordinal + days) }
    public func days(since other: DayKey) -> Int { ordinal - other.ordinal }

    /// Jour ISO de la semaine : 1 = lundi … 7 = dimanche.
    public var isoWeekday: Int {
        // 1970-01-01 était un jeudi (4).
        let r = (ordinal + 3) % 7
        return (r >= 0 ? r : r + 7) + 1
    }

    public var description: String {
        String(format: "%04d-%02d-%02d", year, month, day)
    }

    public static func < (a: DayKey, b: DayKey) -> Bool { a.ordinal < b.ordinal }

    public init(from decoder: Decoder) throws {
        let text = try decoder.singleValueContainer().decode(String.self)
        let parts = text.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3, Self.isValid(year: parts[0], month: parts[1], day: parts[2]) else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "invalid day \(text)"))
        }
        self.init(year: parts[0], month: parts[1], day: parts[2])
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(description)
    }
}
