/**
 * Lucioles — in the garden, each lantern post has one firefly resting right
 * next to it (above, below, left or right). Two fireflies never touch, not
 * even by a corner. The numbers count the fireflies of each row and column.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface FirefliesPuzzle { rows: number; cols: number; posts: number[]; rowCounts: number[]; colCounts: number[] }
/** 0 = not decided, 1 = firefly, 2 = marked empty (grass). */
export interface FirefliesState { cells: number[] }
export interface FirefliesParams { rows: number; cols: number; posts: [number, number] }

const side = (p: { rows: number; cols: number }, i: number) => {
  const r = Math.floor(i / p.cols), c = i % p.cols, out: number[] = [];
  if (r > 0) out.push(i - p.cols); if (r < p.rows - 1) out.push(i + p.cols);
  if (c > 0) out.push(i - 1); if (c < p.cols - 1) out.push(i + 1);
  return out;
};
const around = (p: { rows: number; cols: number }, i: number) => {
  const r = Math.floor(i / p.cols), c = i % p.cols, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const y = r + dr, x = c + dc;
    if (y >= 0 && x >= 0 && y < p.rows && x < p.cols) out.push(y * p.cols + x);
  }
  return out;
};

/** Can every post be given its own firefly next to it? (augmenting paths) */
function matched(p: FirefliesPuzzle, flies: Set<number>): boolean {
  const owner = new Map<number, number>();
  const tryPost = (t: number, seen: Set<number>): boolean => {
    for (const f of side(p, t)) {
      if (!flies.has(f) || seen.has(f)) continue;
      seen.add(f);
      if (!owner.has(f) || tryPost(owner.get(f)!, seen)) { owner.set(f, t); return true; }
    }
    return false;
  };
  return p.posts.every((t) => tryPost(t, new Set()));
}

/** Every answer (up to `limit`): each post, in order, picks the side of its firefly. */
export function solveFireflies(p: FirefliesPuzzle, limit: number): { solutions: number[][]; nodes: number } {
  const posts = new Set(p.posts), flies = new Set<number>(), out: number[][] = [];
  const rowN = new Array(p.rows).fill(0), colN = new Array(p.cols).fill(0);
  let nodes = 0;
  const order = p.posts.slice().sort((a, b) => a - b);
  const rec = (k: number) => {
    if (out.length >= limit || nodes > 400_000) return;
    nodes++;
    if (k === order.length) {
      if (rowN.every((v, r) => v === p.rowCounts[r]) && colN.every((v, c) => v === p.colCounts[c])) out.push([...flies].sort((a, b) => a - b));
      return;
    }
    const t = order[k];
    // Its firefly may already be there (shared in the search order only if not taken by an earlier post).
    for (const f of side(p, t)) {
      if (posts.has(f) || flies.has(f)) continue;
      const r = Math.floor(f / p.cols), c = f % p.cols;
      if (rowN[r] >= p.rowCounts[r] || colN[c] >= p.colCounts[c]) continue;
      if (around(p, f).some((x) => flies.has(x))) continue;
      flies.add(f); rowN[r]++; colN[c]++;
      rec(k + 1);
      flies.delete(f); rowN[r]--; colN[c]--;
      if (out.length >= limit) return;
    }
  };
  rec(0);
  return { solutions: out, nodes };
}

export class FirefliesFamily implements PuzzleFamily<FirefliesPuzzle, FirefliesState, FirefliesParams, number[]> {
  readonly id = 'fireflies';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([22, 36, 50, 64, 78]);

  generate(params: FirefliesParams, rng: SeededRNG): FirefliesPuzzle | null {
    const { rows, cols } = params, n = rows * cols, g = { rows, cols };
    const want = rng.int(params.posts[0], params.posts[1]);
    const flies = new Set<number>(), posts = new Set<number>();
    for (let guard = 0; posts.size < want && guard < 600; guard++) {
      const f = rng.below(n);
      if (flies.has(f) || posts.has(f) || around(g, f).some((x) => flies.has(x))) continue;
      const free = side(g, f).filter((x) => !flies.has(x) && !posts.has(x));
      if (!free.length) continue;
      flies.add(f); posts.add(rng.pick(free));
    }
    if (posts.size < want) return null;
    const p: FirefliesPuzzle = {
      rows, cols, posts: [...posts].sort((a, b) => a - b),
      rowCounts: [...Array(rows)].map((_, r) => [...flies].filter((f) => Math.floor(f / cols) === r).length),
      colCounts: [...Array(cols)].map((_, c) => [...flies].filter((f) => f % cols === c).length),
    };
    return solveFireflies(p, 2).solutions.length === 1 ? p : null;
  }

  solve(p: FirefliesPuzzle, limit: number): SolveReport<number[]> {
    const r = solveFireflies(p, limit);
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: [], humanSolvable: true, searchNodes: r.nodes };
  }

  initialState(p: FirefliesPuzzle): FirefliesState { return { cells: new Array(p.rows * p.cols).fill(0) }; }
  stateApplying(sol: number[], p: FirefliesPuzzle): FirefliesState {
    const posts = new Set(p.posts), flies = new Set(sol);
    return { cells: [...Array(p.rows * p.cols)].map((_, i) => (posts.has(i) ? 0 : flies.has(i) ? 1 : 2)) };
  }

  validate(p: FirefliesPuzzle, s: FirefliesState): ValidationResult {
    const at = (i: number) => cell(Math.floor(i / p.cols), i % p.cols);
    const flies = new Set(s.cells.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0));
    for (const f of flies) {
      const touch = around(p, f).find((x) => flies.has(x));
      if (touch !== undefined) return { kind: 'invalid', issues: [{ cells: [at(f), at(touch)], message: tpl('fireflies.error.touch') }] };
    }
    for (let r = 0; r < p.rows; r++) if ([...flies].filter((f) => Math.floor(f / p.cols) === r).length > p.rowCounts[r]) return { kind: 'invalid', issues: [{ cells: [...Array(p.cols)].map((_, c) => cell(r, c)), message: tpl('fireflies.error.row', [String(r + 1)]) }] };
    for (let c = 0; c < p.cols; c++) if ([...flies].filter((f) => f % p.cols === c).length > p.colCounts[c]) return { kind: 'invalid', issues: [{ cells: [...Array(p.rows)].map((_, r) => cell(r, c)), message: tpl('fireflies.error.col', [String(c + 1)]) }] };
    const lonely = [...flies].find((f) => !side(p, f).some((x) => p.posts.includes(x)));
    if (lonely !== undefined) return { kind: 'invalid', issues: [{ cells: [at(lonely)], message: tpl('fireflies.error.alone') }] };
    const full = flies.size === p.posts.length && [...Array(p.rows)].every((_, r) => [...flies].filter((f) => Math.floor(f / p.cols) === r).length === p.rowCounts[r]);
    return full && matched(p, flies) ? CORRECT : INCOMPLETE;
  }

  rate(p: FirefliesPuzzle, report: SolveReport<number[]>): number {
    return clampScore(p.rows * p.cols * 0.7 + p.posts.length * 1.5 + Math.log2(Math.max(1, report.searchNodes)) * 3 - 30);
  }

  hint(p: FirefliesPuzzle, s: FirefliesState, level: HintLevel): Hint<FirefliesState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const sol = new Set(this.solve(p, 1).solutions[0]);
    const posts = new Set(p.posts);
    const at = (i: number) => cell(Math.floor(i / p.cols), i % p.cols);
    const answer = this.stateApplying([...sol], p);
    if (level === HintLevel.Solution) return { level, text: tpl('fireflies.hint.solution'), focus: [], resultingState: answer };
    const wrong = s.cells.findIndex((v, i) => (v === 1 && !sol.has(i)) || (v === 2 && sol.has(i)));
    if (wrong >= 0) {
      const cells = s.cells.slice(); cells[wrong] = 0;
      return { level, text: tpl('fireflies.hint.mistake'), focus: [at(wrong)], resultingState: level === HintLevel.Insight ? { cells } : undefined };
    }
    if (level === HintLevel.Whisper) return { level, text: tpl('fireflies.hint.whisper'), focus: [] };
    // Simple reasons first: grass far from every post, grass beside a firefly, a full row or column.
    const flies = new Set(s.cells.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0));
    const open = [...Array(p.rows * p.cols).keys()].filter((i) => !posts.has(i) && s.cells[i] === 0);
    const reasons: [string, (i: number) => boolean][] = [
      ['fireflies.hint.far', (i) => !side(p, i).some((x) => posts.has(x))],
      ['fireflies.hint.touch', (i) => around(p, i).some((x) => flies.has(x))],
      ['fireflies.hint.full', (i) => [...flies].filter((f) => Math.floor(f / p.cols) === Math.floor(i / p.cols)).length === p.rowCounts[Math.floor(i / p.cols)] || [...flies].filter((f) => f % p.cols === i % p.cols).length === p.colCounts[i % p.cols]],
    ];
    for (const [key, test] of reasons) {
      const grass = open.filter((i) => test(i) && !sol.has(i));
      if (!grass.length) continue;
      if (level === HintLevel.Lead) return { level, text: tpl(key), focus: grass.map(at) };
      const cells = s.cells.slice(); for (const i of grass) cells[i] = 2;
      return { level, text: tpl(`${key}.insight`), focus: grass.map(at), resultingState: { cells } };
    }
    const next = open.find((i) => sol.has(i));
    if (next === undefined) return { level, text: tpl('fireflies.hint.solution'), focus: [], resultingState: answer };
    if (level === HintLevel.Lead) return { level, text: tpl('fireflies.hint.lead'), focus: [at(next)] };
    const cells = s.cells.slice(); cells[next] = 1;
    return { level, text: tpl('fireflies.hint.insight'), focus: [at(next)], resultingState: { cells } };
  }

  fingerprint(p: FirefliesPuzzle): string { return `fireflies:${p.rows}x${p.cols}:${p.posts.join('.')}:${p.rowCounts.join('')}/${p.colCounts.join('')}`; }
  parse(raw: unknown): FirefliesPuzzle | null {
    const o = raw as Partial<FirefliesPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number, n = rows * cols;
    if (rows < 3 || cols < 3 || rows > 10 || cols > 10) return null;
    if (!Array.isArray(o.posts) || !o.posts.length || !o.posts.every((v) => Number.isInteger(v) && v >= 0 && v < n) || new Set(o.posts).size !== o.posts.length) return null;
    const counts = (a: unknown, len: number, max: number) => Array.isArray(a) && a.length === len && a.every((v) => Number.isInteger(v) && v >= 0 && v <= max);
    if (!counts(o.rowCounts, rows, cols) || !counts(o.colCounts, cols, rows)) return null;
    return { rows, cols, posts: o.posts.slice(), rowCounts: o.rowCounts!.slice(), colCounts: o.colCounts!.slice() };
  }
  equals(a: FirefliesPuzzle, b: FirefliesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
