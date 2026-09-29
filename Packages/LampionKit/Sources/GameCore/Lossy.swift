import Foundation

/// Décodage « au mieux » d'un élément : une valeur illisible devient nil au lieu de faire échouer
/// tout le conteneur. Indispensable pour qu'une seule entrée abîmée ne fasse pas perdre toute une sauvegarde.
struct Failable<T: Decodable>: Decodable {
    let value: T?
    init(from decoder: Decoder) throws {
        value = try? T(from: decoder)
        if value == nil { (decoder.userInfo[DecodingLosses.key] as? DecodingLosses)?.record() }
    }
}

/// Compte les éléments écartés pendant un décodage tolérant, pour savoir si une sauvegarde
/// n'a été relue que partiellement (et doit alors être complétée par la copie de secours).
public final class DecodingLosses: @unchecked Sendable {
    public static let key = CodingUserInfoKey(rawValue: "lampion.decodingLosses")!
    private let lock = NSLock()
    private var total = 0
    public init() {}
    func record() { lock.lock(); total += 1; lock.unlock() }
    public var count: Int { lock.lock(); defer { lock.unlock() }; return total }
}

extension KeyedDecodingContainer {
    /// Dictionnaire décodé entrée par entrée ; les entrées illisibles sont ignorées.
    func lossyDictionary<DictKey: Hashable & CodingKeyRepresentable & Decodable, V: Decodable>(_ type: [DictKey: V].Type, forKey key: Key) -> [DictKey: V] {
        guard let raw = try? decodeIfPresent([DictKey: Failable<V>].self, forKey: key) else {
            if contains(key) { superDecoderLosses()?.record() }
            return [:]
        }
        return raw.compactMapValues(\.value)
    }

    /// Ensemble décodé élément par élément ; les éléments illisibles sont ignorés.
    func lossySet<T: Hashable & Decodable>(_ type: Set<T>.Type, forKey key: Key) -> Set<T> {
        guard let raw = try? decodeIfPresent([Failable<T>].self, forKey: key) else {
            if contains(key) { superDecoderLosses()?.record() }
            return []
        }
        return Set(raw.compactMap(\.value))
    }

    func value<T: Decodable>(_ type: T.Type, forKey key: Key, default fallback: T) -> T {
        do { return try decodeIfPresent(T.self, forKey: key) ?? fallback } catch {
            (superDecoderLosses())?.record()
            return fallback
        }
    }

    private func superDecoderLosses() -> DecodingLosses? {
        (try? superDecoder())?.userInfo[DecodingLosses.key] as? DecodingLosses
    }
}
