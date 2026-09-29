/** Symétries de grille et forme canonique (empreintes) — portage de PuzzleKit/Grid.swift. */
export type GridSymmetry = 'identity' | 'rotate90' | 'rotate180' | 'rotate270' | 'flipHorizontal' | 'flipVertical' | 'transpose' | 'antiTranspose';
export const ALL_SYMMETRIES: GridSymmetry[] = ['identity', 'rotate90', 'rotate180', 'rotate270', 'flipHorizontal', 'flipVertical', 'transpose', 'antiTranspose'];

export function applicableSymmetries(rows: number, columns: number): GridSymmetry[] {
  return rows === columns ? ALL_SYMMETRIES : ['identity', 'rotate180', 'flipHorizontal', 'flipVertical'];
}

/** Case d'origine (grille rows × columns) qui se retrouve en (r, c) après transformation. */
export function source(sym: GridSymmetry, r: number, c: number, rows: number, columns: number): [number, number] {
  switch (sym) {
    case 'identity': return [r, c];
    case 'rotate90': return [rows - 1 - c, r];
    case 'rotate180': return [rows - 1 - r, columns - 1 - c];
    case 'rotate270': return [c, columns - 1 - r];
    case 'flipHorizontal': return [r, columns - 1 - c];
    case 'flipVertical': return [rows - 1 - r, c];
    case 'transpose': return [c, r];
    case 'antiTranspose': return [rows - 1 - c, columns - 1 - r];
  }
}

export function transformedDimensions(sym: GridSymmetry, rows: number, columns: number): [number, number] {
  return sym === 'rotate90' || sym === 'rotate270' || sym === 'transpose' || sym === 'antiTranspose' ? [columns, rows] : [rows, columns];
}

/** Plus petite représentation textuelle parmi les symétries applicables. */
export function canonicalGrid(rows: number, columns: number, symbol: (r: number, c: number) => string): string {
  let best: string | null = null;
  for (const sym of applicableSymmetries(rows, columns)) {
    const [tr, tc] = transformedDimensions(sym, rows, columns);
    let text = `${tr}x${tc}:`;
    for (let r = 0; r < tr; r++) {
      for (let c = 0; c < tc; c++) {
        const [sr, sc] = source(sym, r, c, rows, columns);
        text += symbol(sr, sc);
      }
    }
    if (best === null || text < best) best = text;
  }
  return best!;
}
