import Foundation

/// Décodage « au mieux » d'un élément : une valeur illisible devient nil au lieu de faire échouer
/// tout le conteneur. Indispensable pour qu'une seule entrée abîmée ne fasse pas perdre toute une sauvegarde.
struct Failable<T: Decodable>: Decodable {
    let value: T?
    init(from decoder: Decoder) throws { value = try? T(from: decoder) }
}

extension KeyedDecodingContainer {
    /// Dictionnaire décodé entrée par entrée ; les entrées illisibles sont ignorées.
    func lossyDictionary<DictKey: Hashable & CodingKeyRepresentable & Decodable, V: Decodable>(_ type: [DictKey: V].Type, forKey key: Key) -> [DictKey: V] {
        guard let raw = try? decodeIfPresent([DictKey: Failable<V>].self, forKey: key) else { return [:] }
        return raw.compactMapValues(\.value)
    }

    /// Ensemble décodé élément par élément ; les éléments illisibles sont ignorés.
    func lossySet<T: Hashable & Decodable>(_ type: Set<T>.Type, forKey key: Key) -> Set<T> {
        guard let raw = try? decodeIfPresent([Failable<T>].self, forKey: key) else { return [] }
        return Set(raw.compactMap(\.value))
    }

    func value<T: Decodable>(_ type: T.Type, forKey key: Key, default fallback: T) -> T {
        (try? decodeIfPresent(T.self, forKey: key)) ?? fallback
    }
}
