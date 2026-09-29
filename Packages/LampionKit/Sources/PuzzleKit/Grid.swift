/// Utilitaires de grilles : symétries et encodage canonique (empreintes).
public enum GridSymmetry: CaseIterable, Sendable {
    case identity, rotate90, rotate180, rotate270, flipHorizontal, flipVertical, transpose, antiTranspose

    /// Symétries applicables à une grille `rows × columns` (les rotations d'un quart de tour exigent une grille carrée).
    public static func applicable(rows: Int, columns: Int) -> [GridSymmetry] {
        rows == columns ? allCases : [.identity, .rotate180, .flipHorizontal, .flipVertical]
    }

    /// Case de la grille d'origine (`rows × columns`) qui se retrouve en (r, c) après transformation.
    public func source(row r: Int, column c: Int, rows: Int, columns: Int) -> (Int, Int) {
        switch self {
        case .identity: (r, c)
        case .rotate90: (rows - 1 - c, r)
        case .rotate180: (rows - 1 - r, columns - 1 - c)
        case .rotate270: (c, columns - 1 - r)
        case .flipHorizontal: (r, columns - 1 - c)
        case .flipVertical: (rows - 1 - r, c)
        case .transpose: (c, r)
        case .antiTranspose: (rows - 1 - c, columns - 1 - r)
        }
    }

    /// Dimensions de la grille transformée.
    public func dimensions(rows: Int, columns: Int) -> (rows: Int, columns: Int) {
        switch self {
        case .rotate90, .rotate270, .transpose, .antiTranspose: (columns, rows)
        default: (rows, columns)
        }
    }
}

public enum Canonical {
    /// Plus petite représentation textuelle parmi toutes les symétries applicables.
    /// `symbol(r, c)` renvoie le caractère de la case (r, c) de la grille d'origine.
    public static func grid(rows: Int, columns: Int, symbol: (Int, Int) -> Character) -> String {
        var best: String?
        for symmetry in GridSymmetry.applicable(rows: rows, columns: columns) {
            let (tr, tc) = symmetry.dimensions(rows: rows, columns: columns)
            var text = "\(tr)x\(tc):"
            text.reserveCapacity(tr * tc + 8)
            for r in 0..<tr {
                for c in 0..<tc {
                    let (sr, sc) = symmetry.source(row: r, column: c, rows: rows, columns: columns)
                    text.append(symbol(sr, sc))
                }
            }
            if best == nil || text < best! { best = text }
        }
        return best!
    }
}
