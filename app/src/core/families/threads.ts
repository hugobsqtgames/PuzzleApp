/**
 * Fil — draw one thread through every cell, from the start lantern to the
 * end lantern, without crossing walls (GAME_DESIGN § 5.10). A random
 * Hamiltonian path ("backbite" moves) → endpoints become the lanterns →
 * walls on unused edges. Any valid path is accepted; the number of
 * solutions and the search effort measure the difficulty.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface ThreadsPuzzle {
  rows: number;
  columns: number;
  start: number;
  end: number;
  /** Walls between two orthogonal neighbours, as "a-b" with a < b. */
  walls: string[];
}
export interface ThreadsState { path: number[] }
export interface ThreadsParams { rows: number; columns: number; wallPercent: number }

const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function neighbours(p: Pick<ThreadsPuzzle, 'rows' | 'columns'>, i: number): number[] {
  const r = Math.floor(i / p.columns), c = i % p.columns, out: number[] = [];
  if (r > 0) out.push(i - p.columns);
  if (c < p.columns - 1) out.push(i + 1);
  if (r < p.rows - 1) out.push(i + p.columns);
  if (c > 0) out.push(i - 1);
  return out;
}

export function canStep(p: ThreadsPuzzle, walls: Set<string>, a: number, b: number): boolean {
  return neighbours(p, a).includes(b) && !walls.has(edgeKey(a, b));
}

/** Random Hamiltonian path on the grid by backbite moves from a zigzag. */
export function randomHamiltonian(rows: number, columns: number, rng: SeededRNG, moves: number): number[] {
  let path: number[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) path.push(r * columns + (r % 2 === 0 ? c : columns - 1 - c));
  const grid = { rows, columns };
  for (let m = 0; m < moves; m++) {
    if (rng.bool()) path.reverse();
    const head = path[0];
    const options = neighbours(grid, head).filter((x) => x !== path[1]);
    if (!options.length) continue;
    const x = rng.pick(options);
    const k = path.indexOf(x);
    // Backbite: connect head to x and reverse the prefix before x.
    path = [...path.slice(0, k).reverse(), ...path.slice(k)];
  }
  return path;
}

export class ThreadsFamily implements PuzzleFamily<ThreadsPuzzle, ThreadsState, ThreadsParams, number[]> {
  readonly id = 'threads';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: ThreadsParams, rng: SeededRNG): ThreadsPuzzle | null {
    const { rows, columns } = params;
    if (!(rows >= 3 && columns >= 3 && rows <= 8 && columns <= 8)) return null;
    const n = rows * columns;
    const path = randomHamiltonian(rows, columns, rng, n * 12);
    const used = new Set(path.slice(1).map((x, i) => edgeKey(path[i], x)));
    const walls: string[] = [];
    for (let i = 0; i < n; i++) for (const j of neighbours({ rows, columns }, i)) {
      if (j <= i) continue;
      const k = edgeKey(i, j);
      if (!used.has(k) && rng.chance(params.wallPercent, 100)) walls.push(k);
    }
    return { rows, columns, start: path[0], end: path[n - 1], walls: walls.sort() };
  }

  /** Paths from start to end through every cell (up to `limit`), with a node budget. */
  private search(p: ThreadsPuzzle, prefix: number[], limit: number, budget = 400_000): { paths: number[][]; nodes: number; complete: boolean } {
    const n = p.rows * p.columns, walls = new Set(p.walls);
    const visited = new Uint8Array(n);
    for (const x of prefix) visited[x] = 1;
    const path = prefix.slice();
    const paths: number[][] = [];
    let nodes = 0;
    const free = (x: number) => !visited[x];
    const ok = (): boolean => {
      // Unvisited cells must stay connected to the head, and none may be a dead end.
      const head = path[path.length - 1];
      const left = n - path.length;
      if (left === 0) return head === p.end;
      if (visited[p.end]) return false;
      const seen = new Uint8Array(n);
      const stack = [head];
      seen[head] = 1;
      let count = 0;
      while (stack.length) {
        const x = stack.pop()!;
        for (const y of neighbours(p, x)) if (free(y) && !seen[y] && canStep(p, walls, x, y)) { seen[y] = 1; count++; stack.push(y); }
      }
      if (count !== left) return false;
      for (let x = 0; x < n; x++) {
        if (!free(x) || x === p.end) continue;
        let exits = 0;
        for (const y of neighbours(p, x)) if ((free(y) || y === head) && canStep(p, walls, x, y)) exits++;
        if (exits < 2) return false;
      }
      return true;
    };
    const rec = () => {
      if (paths.length >= limit || nodes > budget) return;
      nodes++;
      if (!ok()) return;
      if (path.length === n) { paths.push(path.slice()); return; }
      const head = path[path.length - 1];
      for (const y of neighbours(p, head)) {
        if (!free(y) || !canStep(p, walls, head, y)) continue;
        visited[y] = 1; path.push(y);
        rec();
        path.pop(); visited[y] = 0;
      }
    };
    if (prefix.length && prefix[0] === p.start) rec();
    return { paths, nodes, complete: nodes <= budget };
  }

  solve(p: ThreadsPuzzle, limit: number): SolveReport<number[]> {
    const r = this.search(p, [p.start], limit);
    return { solutionCount: r.paths.length, solutions: r.paths, trace: [], humanSolvable: r.complete, searchNodes: r.nodes };
  }

  initialState(p: ThreadsPuzzle): ThreadsState { return { path: [p.start] }; }
  stateApplying(solution: number[]): ThreadsState { return { path: solution.slice() }; }

  /** Tap on a cell: extend the thread to a free neighbour, or cut it back to a cell already on it. */
  touch(p: ThreadsPuzzle, s: ThreadsState, i: number): ThreadsState {
    const k = s.path.indexOf(i);
    if (k >= 0) return { path: s.path.slice(0, Math.max(1, k + 1)) };
    const head = s.path[s.path.length - 1];
    if (head === p.end && s.path.length > 1) return s;
    return canStep(p, new Set(p.walls), head, i) ? { path: [...s.path, i] } : s;
  }

  validate(p: ThreadsPuzzle, s: ThreadsState): ValidationResult {
    const n = p.rows * p.columns, walls = new Set(p.walls);
    if (s.path[0] !== p.start || new Set(s.path).size !== s.path.length) return INCOMPLETE;
    if (!s.path.every((x, i) => i === 0 || canStep(p, walls, s.path[i - 1], x))) return INCOMPLETE;
    return s.path.length === n && s.path[n - 1] === p.end ? CORRECT : INCOMPLETE;
  }

  rate(p: ThreadsPuzzle, report: SolveReport<number[]>): number {
    const n = p.rows * p.columns;
    const few = report.solutionCount <= 1 ? 10 : report.solutionCount <= 3 ? 5 : 0;
    return clampScore((n - 16) * 1.3 + Math.log2(Math.max(1, report.searchNodes)) * 2.5 + few - 10);
  }

  hint(p: ThreadsPuzzle, s: ThreadsState, level: HintLevel): Hint<ThreadsState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    // Longest prefix of the player's thread that can still be completed.
    let keep = s.path.length, found: number[] | null = null;
    while (keep >= 1 && !found) {
      const r = this.search(p, s.path.slice(0, keep), 1, 60_000);
      if (r.paths.length) found = r.paths[0];
      else keep--;
    }
    if (!found) return null;
    const at = (x: number) => [String(Math.floor(x / p.columns) + 1), String((x % p.columns) + 1)];
    if (keep < s.path.length) {
      const x = s.path[keep - 1];
      if (level === HintLevel.Solution) return { level, text: tpl('threads.hint.solution'), focus: [], resultingState: { path: found } };
      return { level, text: tpl('threads.hint.backtrack', at(x)), focus: [cell(Math.floor(x / p.columns), x % p.columns)], resultingState: level === HintLevel.Insight ? { path: s.path.slice(0, keep) } : undefined };
    }
    const next = found[keep];
    const f = [cell(Math.floor(next / p.columns), next % p.columns)];
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('threads.hint.whisper'), focus: [] };
      case HintLevel.Lead: return { level, text: tpl('threads.hint.lead', at(next)), focus: f };
      case HintLevel.Insight: return { level, text: tpl('threads.hint.insight', at(next)), focus: f, resultingState: { path: found.slice(0, keep + 1) } };
      case HintLevel.Solution: return { level, text: tpl('threads.hint.solution'), focus: [], resultingState: { path: found } };
    }
  }

  fingerprint(p: ThreadsPuzzle): string { return `${p.rows}x${p.columns}:${p.start}>${p.end}|${p.walls.join(',')}`; }

  parse(raw: unknown): ThreadsPuzzle | null {
    const o = raw as Partial<ThreadsPuzzle> | null;
    if (!o || typeof o.rows !== 'number' || typeof o.columns !== 'number' || !Array.isArray(o.walls)) return null;
    const n = o.rows * o.columns;
    if (!(o.rows >= 2 && o.columns >= 2 && o.rows <= 8 && o.columns <= 8)) return null;
    if (!Number.isInteger(o.start) || !Number.isInteger(o.end) || o.start! < 0 || o.end! < 0 || o.start! >= n || o.end! >= n || o.start === o.end) return null;
    const grid = { rows: o.rows, columns: o.columns };
    for (const w of o.walls) {
      if (typeof w !== 'string') return null;
      const [a, b] = w.split('-').map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b || !neighbours(grid, a).includes(b)) return null;
    }
    return { rows: o.rows, columns: o.columns, start: o.start!, end: o.end!, walls: o.walls.slice() };
  }

  equals(a: ThreadsPuzzle, b: ThreadsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
