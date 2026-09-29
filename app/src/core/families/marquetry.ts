/**
 * Marqueterie — fill the silhouette with all the pieces; pieces can be
 * turned (GAME_DESIGN § 5.5). A silhouette from a themed library → random
 * cut into pieces of 3–5 cells → exact-cover search counts the solutions
 * (any covering is accepted; fewer solutions = harder).
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, clampScore, tpl } from '../puzzlekit/types';

export type Shape = [number, number][];
export interface Placement { rot: number; row: number; col: number }
export interface MarquetryPuzzle { name: string; mask: string[]; pieces: Shape[]; flips: boolean }
export interface MarquetryState { placed: (Placement | null)[] }
export interface MarquetryParams { silhouettes: string[]; pieceSize: [number, number]; flips?: boolean }

/** Themed silhouettes ('#' = to fill). */
export const SILHOUETTES: Record<string, { title: string; mask: string[] }> = {
  lanterne: { title: 'une lanterne', mask: ['.##.', '####', '####', '####', '.##.'] },
  cle: { title: 'une clé', mask: ['##....', '###...', '######', '###..#', '##....'] },
  theiere: { title: 'une théière', mask: ['..##..', '.####.', '######', '######', '.####.'] },
  maison: { title: 'une maison', mask: ['..#..', '.###.', '#####', '#####', '##.##'] },
  poisson: { title: 'un poisson', mask: ['.###..#', '#####.#', '#######', '#####.#', '.###..#'] },
  bateau: { title: 'un bateau', mask: ['...#...', '..###..', '.####..', '#######', '.#####.'] },
  coeur: { title: 'un cœur', mask: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'] },
  etoile: { title: 'une étoile', mask: ['...#...', '..###..', '#######', '.#####.', '.##.##.'] },
  phare: { title: 'un phare', mask: ['.##.', '####', '.##.', '.##.', '####', '####'] },
  horloge: { title: 'une horloge', mask: ['.####.', '######', '######', '######', '.####.'] },
};

const rotate = (s: Shape): Shape => normalize(s.map(([r, c]) => [c, -r] as [number, number]));
const flip = (s: Shape): Shape => normalize(s.map(([r, c]) => [r, -c] as [number, number]));
export function normalize(s: Shape): Shape {
  const mr = Math.min(...s.map((x) => x[0])), mc = Math.min(...s.map((x) => x[1]));
  return s.map(([r, c]) => [r - mr, c - mc] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const key = (s: Shape) => s.map(([r, c]) => `${r},${c}`).join(';');

/** Distinct orientations of a piece: index = rot (0–3), +4 when flipped. */
export function orientation(s: Shape, rot: number): Shape {
  let x = normalize(s);
  if (rot >= 4) x = flip(x);
  for (let i = 0; i < rot % 4; i++) x = rotate(x);
  return x;
}
export function orientations(s: Shape, flips: boolean): number[] {
  const seen = new Set<string>(), out: number[] = [];
  for (let r = 0; r < (flips ? 8 : 4); r++) { const k = key(orientation(s, r)); if (!seen.has(k)) { seen.add(k); out.push(r); } }
  return out;
}

export const cellsOf = (s: Shape, p: Placement): [number, number][] => orientation(s, p.rot).map(([r, c]) => [r + p.row, c + p.col]);

export class MarquetryFamily implements PuzzleFamily<MarquetryPuzzle, MarquetryState, MarquetryParams, Placement[]> {
  readonly id = 'marquetry';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: MarquetryParams, rng: SeededRNG): MarquetryPuzzle | null {
    const name = rng.pick(params.silhouettes);
    const mask = SILHOUETTES[name].mask;
    const R = mask.length, C = mask[0].length;
    const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < R && c < C && mask[r][c] === '#';
    const owner = mask.map((row) => [...row].map(() => -1));
    const pieces: Shape[] = [];
    const freeCells = () => { const out: [number, number][] = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (inside(r, c) && owner[r][c] < 0) out.push([r, c]); return out; };
    const freeNeighbours = (r: number, c: number) => ([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as [number, number][]).filter(([a, b]) => inside(a, b) && owner[a][b] < 0);
    for (let guard = 0; guard < 60; guard++) {
      const free = freeCells();
      if (!free.length) break;
      // Grow from the most constrained free cell (fewest free neighbours).
      free.sort((a, b) => freeNeighbours(...a).length - freeNeighbours(...b).length);
      const seed = free[0];
      const target = rng.int(params.pieceSize[0], params.pieceSize[1]);
      const piece: [number, number][] = [seed];
      owner[seed[0]][seed[1]] = pieces.length;
      while (piece.length < target) {
        const frontier = piece.flatMap(([r, c]) => freeNeighbours(r, c));
        if (!frontier.length) break;
        const [r, c] = rng.pick(frontier);
        owner[r][c] = pieces.length;
        piece.push([r, c]);
      }
      if (piece.length < 3) return null;
      pieces.push(normalize(piece));
    }
    if (freeCells().length) return null;
    // Pieces are given turned at random: the player must find the orientation.
    const flips = params.flips ?? false;
    const given = pieces.map((s) => orientation(s, rng.below(flips ? 8 : 4)));
    return { name, mask: mask.slice(), pieces: rng.shuffled(given), flips };
  }

  /** Exact cover: fill the first empty cell (reading order) with every unused piece orientation. */
  search(p: MarquetryPuzzle, fixed: (Placement | null)[], limit: number, budget = 300_000): { solutions: Placement[][]; nodes: number } {
    const R = p.mask.length, C = p.mask[0].length;
    const grid: number[][] = p.mask.map((row) => [...row].map((ch) => (ch === '#' ? -1 : -2)));
    const placed: (Placement | null)[] = p.pieces.map(() => null);
    const put = (i: number, pl: Placement, v: number) => { for (const [r, c] of cellsOf(p.pieces[i], pl)) grid[r][c] = v; };
    const fits = (i: number, pl: Placement) => cellsOf(p.pieces[i], pl).every(([r, c]) => r >= 0 && c >= 0 && r < R && c < C && grid[r][c] === -1);
    for (let i = 0; i < fixed.length; i++) { const f = fixed[i]; if (f && fits(i, f)) { put(i, f, i); placed[i] = f; } }
    const solutions: Placement[][] = [];
    let nodes = 0;
    const rec = () => {
      if (solutions.length >= limit || nodes > budget) return;
      nodes++;
      let tr = -1, tc = -1;
      outer: for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (grid[r][c] === -1) { tr = r; tc = c; break outer; }
      if (tr < 0) { if (placed.every(Boolean)) solutions.push(placed.map((x) => ({ ...x! }))); return; }
      for (let i = 0; i < p.pieces.length; i++) {
        if (placed[i]) continue;
        for (const rot of orientations(p.pieces[i], p.flips)) {
          const shape = orientation(p.pieces[i], rot);
          // Anchor the piece's first cell (reading order) on the target cell.
          const [ar, ac] = shape[0];
          const pl = { rot, row: tr - ar, col: tc - ac };
          if (!fits(i, pl)) continue;
          put(i, pl, i); placed[i] = pl;
          rec();
          put(i, pl, -1); placed[i] = null;
        }
      }
    };
    rec();
    return { solutions, nodes };
  }

  solve(p: MarquetryPuzzle, limit: number): SolveReport<Placement[]> {
    const r = this.search(p, [], limit);
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: [], humanSolvable: r.solutions.length > 0, searchNodes: r.nodes };
  }

  initialState(p: MarquetryPuzzle): MarquetryState { return { placed: p.pieces.map(() => null) }; }
  stateApplying(solution: Placement[]): MarquetryState { return { placed: solution.map((x) => ({ ...x })) }; }

  /** Cells covered by each placed piece; -1 free, -2 outside the silhouette. */
  coverage(p: MarquetryPuzzle, s: MarquetryState): { grid: number[][]; overlaps: number } {
    const grid: number[][] = p.mask.map((row) => [...row].map((ch) => (ch === '#' ? -1 : -2)));
    let overlaps = 0;
    s.placed.forEach((pl, i) => {
      if (!pl) return;
      for (const [r, c] of cellsOf(p.pieces[i], pl)) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== -1) { overlaps++; continue; }
        grid[r][c] = i;
      }
    });
    return { grid, overlaps };
  }

  /** Puts piece `i` so that its cell `anchor` lands on (row, col); null if it does not fit. */
  place(p: MarquetryPuzzle, s: MarquetryState, i: number, rot: number, anchor: number, row: number, col: number): MarquetryState | null {
    const shape = orientation(p.pieces[i], rot);
    const [ar, ac] = shape[Math.min(anchor, shape.length - 1)];
    const pl = { rot, row: row - ar, col: col - ac };
    const others = { placed: s.placed.map((x, k) => (k === i ? null : x)) };
    const { grid } = this.coverage(p, others);
    const ok = cellsOf(p.pieces[i], pl).every(([r, c]) => r >= 0 && c >= 0 && r < grid.length && c < grid[0].length && grid[r][c] === -1);
    if (!ok) return null;
    return { placed: s.placed.map((x, k) => (k === i ? pl : x)) };
  }

  validate(p: MarquetryPuzzle, s: MarquetryState): ValidationResult {
    if (s.placed.length !== p.pieces.length || s.placed.some((x) => !x)) return INCOMPLETE;
    const { grid, overlaps } = this.coverage(p, s);
    if (overlaps) return INCOMPLETE;
    return grid.every((row) => row.every((v) => v !== -1)) ? CORRECT : INCOMPLETE;
  }

  rate(p: MarquetryPuzzle, report: SolveReport<Placement[]>): number {
    const few = report.solutionCount <= 1 ? 12 : report.solutionCount <= 3 ? 6 : 0;
    return clampScore((p.pieces.length - 3) * 7 + Math.log2(Math.max(1, report.searchNodes)) * 2.2 + few + (p.flips ? 10 : 0) - 8);
  }

  hint(p: MarquetryPuzzle, s: MarquetryState, level: HintLevel): Hint<MarquetryState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    // A solution that keeps as many of the player's pieces as possible.
    let keep = s.placed.slice();
    let sol = this.search(p, keep, 1).solutions[0];
    const removed: number[] = [];
    while (!sol) {
      const i = keep.findIndex((x) => x);
      if (i < 0) return null;
      keep = keep.map((x, k) => (k === i ? null : x));
      removed.push(i);
      sol = this.search(p, keep, 1).solutions[0];
    }
    if (level === HintLevel.Solution) return { level, text: tpl('marquetry.hint.solution'), focus: [], resultingState: this.stateApplying(sol) };
    if (removed.length) {
      return { level, text: tpl('marquetry.hint.wrong', [String(removed[0] + 1)]), focus: [], resultingState: level === HintLevel.Insight ? { placed: keep } : undefined };
    }
    const next = sol.findIndex((_, i) => !s.placed[i]);
    if (next < 0) return null;
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('marquetry.hint.whisper'), focus: [] };
      case HintLevel.Lead: return { level, text: tpl('marquetry.hint.lead', [String(next + 1)]), focus: [] };
      case HintLevel.Insight: return { level, text: tpl('marquetry.hint.insight', [String(next + 1)]), focus: [], resultingState: { placed: s.placed.map((x, k) => (k === next ? sol[next] : x)) } };
    }
    return null;
  }

  fingerprint(p: MarquetryPuzzle): string {
    const canon = (s: Shape) => orientations(s, true).map((r) => key(orientation(s, r))).sort()[0];
    return `${p.name}|${p.flips ? 'f' : ''}|` + p.pieces.map(canon).sort().join('/');
  }

  parse(raw: unknown): MarquetryPuzzle | null {
    const o = raw as Partial<MarquetryPuzzle> | null;
    if (!o || typeof o.name !== 'string' || !Array.isArray(o.mask) || !Array.isArray(o.pieces) || typeof o.flips !== 'boolean') return null;
    if (!o.mask.length || !o.mask.every((row) => typeof row === 'string' && row.length === o.mask![0].length && /^[#.]+$/.test(row))) return null;
    const area = o.mask.join('').split('').filter((ch) => ch === '#').length;
    let total = 0;
    for (const s of o.pieces) {
      if (!Array.isArray(s) || s.length < 1 || s.length > 8 || !s.every((x) => Array.isArray(x) && x.length === 2 && x.every((v) => Number.isInteger(v) && v >= 0 && v < 10))) return null;
      total += s.length;
    }
    if (total !== area) return null;
    return { name: o.name, mask: o.mask.slice(), pieces: o.pieces.map((s) => normalize(s as Shape)), flips: o.flips };
  }

  equals(a: MarquetryPuzzle, b: MarquetryPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
