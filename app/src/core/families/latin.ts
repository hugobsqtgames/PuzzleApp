/**
 * Shared engine for the number squares (Signes, Toits): each digit 1…n once
 * per row and once per column, plus the family's own rule. A small solver
 * with candidate sets, the most constrained cell first.
 */
import { SeededRNG } from '../puzzlekit/rng';

/** A random latin square: the cyclic one, rows, columns and digits shuffled. */
export function randomLatin(n: number, rng: SeededRNG): number[] {
  const rows = rng.shuffled([...Array(n).keys()]), cols = rng.shuffled([...Array(n).keys()]), sym = rng.shuffled([...Array(n).keys()].map((x) => x + 1));
  const g = new Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g[r * n + c] = sym[(rows[r] + cols[c]) % n];
  return g;
}

/** The family's rule: may `g` (0 = empty) still become a solution? Called after each placement at `i`. */
export type LatinCheck = (g: number[], i: number) => boolean;
/** Narrows the candidates of every cell with the family's rule (optional, for speed and hints). */
export type LatinPrune = (g: number[], cands: number[][]) => void;

/** Candidates of every empty cell from rows and columns, then the family's pruning, to a fixpoint. */
export function candidatesOf(n: number, g: number[], prune?: LatinPrune): number[][] {
  const cands = g.map((v, i) => {
    if (v) return [v];
    const r = Math.floor(i / n), c = i % n, used = new Set<number>();
    for (let k = 0; k < n; k++) { used.add(g[r * n + k]); used.add(g[k * n + c]); }
    return [...Array(n)].map((_, x) => x + 1).filter((x) => !used.has(x));
  });
  if (prune) {
    for (let round = 0; round < 12; round++) {
      const before = cands.reduce((s, c) => s + c.length, 0);
      prune(g, cands);
      if (cands.reduce((s, c) => s + c.length, 0) === before) break;
    }
  }
  return cands;
}

/** Solutions of the square (up to `limit`), and the search effort. */
export function solveLatin(n: number, givens: number[], check: LatinCheck, limit: number, prune?: LatinPrune, budget = 200_000): { solutions: number[][]; nodes: number } {
  const g = givens.slice();
  const out: number[][] = [];
  let nodes = 0;
  const rec = () => {
    if (out.length >= limit || nodes > budget) return;
    nodes++;
    const cands = candidatesOf(n, g, prune);
    let best = -1;
    for (let i = 0; i < g.length; i++) {
      if (g[i]) continue;
      if (!cands[i].length) return;
      if (best < 0 || cands[i].length < cands[best].length) best = i;
    }
    if (best < 0) { out.push(g.slice()); return; }
    for (const v of cands[best]) {
      g[best] = v;
      if (check(g, best)) rec();
      g[best] = 0;
      if (out.length >= limit) return;
    }
  };
  // The givens themselves must hold.
  if (g.every((v, i) => !v || check(g, i))) rec();
  return { solutions: out, nodes };
}

/** Cells repeated in a row or a column (for live errors). */
export function repeats(n: number, g: number[]): number[] {
  const bad = new Set<number>();
  for (let r = 0; r < n; r++) for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const i = r * n + a, j = r * n + b;
    if (g[i] && g[i] === g[j]) { bad.add(i); bad.add(j); }
    const k = a * n + r, l = b * n + r;
    if (g[k] && g[k] === g[l]) { bad.add(k); bad.add(l); }
  }
  return [...bad];
}

/** For hints: an empty cell with a single candidate, or a digit with a single place in a line. */
export function forcedCell(n: number, g: number[], prune?: LatinPrune): { i: number; v: number; why: 'single' | 'row' | 'col' } | null {
  const cands = candidatesOf(n, g, prune);
  for (let i = 0; i < g.length; i++) if (!g[i] && cands[i].length === 1) return { i, v: cands[i][0], why: 'single' };
  for (let line = 0; line < n; line++) for (let v = 1; v <= n; v++) {
    const inRow = [...Array(n)].map((_, k) => line * n + k).filter((i) => !g[i] && cands[i].includes(v));
    if (inRow.length === 1 && ![...Array(n)].some((_, k) => g[line * n + k] === v)) return { i: inRow[0], v, why: 'row' };
    const inCol = [...Array(n)].map((_, k) => k * n + line).filter((i) => !g[i] && cands[i].includes(v));
    if (inCol.length === 1 && ![...Array(n)].some((_, k) => g[k * n + line] === v)) return { i: inCol[0], v, why: 'col' };
  }
  return null;
}
