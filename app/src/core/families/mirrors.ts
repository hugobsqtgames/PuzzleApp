/**
 * Miroirs — place mirrors so the light ray reaches every target
 * (GAME_DESIGN § 5.12). The ray is built backwards-free: a random walk
 * from the source turning at mirrors → targets placed on the ray (the
 * last segment always has one, so every mirror is needed) → obstacles off
 * the ray → a solver that follows the ray and branches at every empty cell
 * checks that exactly one set of mirrors lights every target.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

/** Cells: '.' empty, '#' obstacle, 'T' target. */
export interface MirrorsPuzzle { rows: number; columns: number; cells: string; source: { cell: number; dir: number }; mirrors: number }
/** Per cell: 0 nothing, 1 '/', 2 '\'. */
export interface MirrorsState { marks: number[] }
export interface MirrorsParams { rows: number; columns: number; mirrors: number; targets: number; obstaclePercent: number }

const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
const SLASH = [1, 0, 3, 2];     // '/' : up→right, right→up, down→left, left→down
const BACKSLASH = [3, 2, 1, 0]; // '\' : up→left, right→down, down→right, left→up
export const reflect = (mark: number, dir: number) => (mark === 1 ? SLASH[dir] : mark === 2 ? BACKSLASH[dir] : dir);

export interface Trace { cells: number[]; hits: Set<number>; ends: 'out' | 'blocked' | 'loop' }

export function trace(p: MirrorsPuzzle, marks: readonly number[]): Trace {
  const seen = new Set<string>(), cells: number[] = [], hits = new Set<number>();
  let i = p.source.cell, dir = p.source.dir;
  for (;;) {
    const r = Math.floor(i / p.columns), c = i % p.columns;
    if (r < 0 || c < 0 || r >= p.rows || c >= p.columns) return { cells, hits, ends: 'out' };
    if (p.cells[i] === '#') return { cells, hits, ends: 'blocked' };
    const k = `${i}:${dir}`;
    if (seen.has(k)) return { cells, hits, ends: 'loop' };
    seen.add(k);
    cells.push(i);
    if (p.cells[i] === 'T') hits.add(i);
    dir = reflect(marks[i] ?? 0, dir);
    const nr = r + DR[dir], nc = c + DC[dir];
    if (nr < 0 || nc < 0 || nr >= p.rows || nc >= p.columns) return { cells, hits, ends: 'out' };
    i = nr * p.columns + nc;
  }
}

const targetsOf = (p: MirrorsPuzzle) => [...p.cells].map((ch, i) => (ch === 'T' ? i : -1)).filter((i) => i >= 0);

export class MirrorsFamily implements PuzzleFamily<MirrorsPuzzle, MirrorsState, MirrorsParams, number[]> {
  readonly id = 'mirrors';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = TierThresholds.standard;

  generate(params: MirrorsParams, rng: SeededRNG): MirrorsPuzzle | null {
    const { rows, columns } = params, n = rows * columns;
    // Source on the left or top border, entering the grid.
    const fromLeft = rng.bool();
    const start = fromLeft ? rng.below(rows) * columns : rng.below(columns);
    const dir0 = fromLeft ? 1 : 2;
    const marks = Array(n).fill(0);
    const onPath = new Set<number>();
    const segments: number[][] = [];
    let i = start, dir = dir0;
    const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < columns;
    for (let k = 0; k <= params.mirrors; k++) {
      const seg: number[] = [];
      const lastSegment = k === params.mirrors;
      const length = lastSegment ? Infinity : rng.int(2, Math.max(2, Math.min(4, Math.max(rows, columns) - 2)));
      for (let step = 0; ; step++) {
        if (onPath.has(i)) return null;
        onPath.add(i); seg.push(i);
        if (step + 1 >= length) break;
        const r = Math.floor(i / columns), c = i % columns;
        const nr = r + DR[dir], nc = c + DC[dir];
        if (!inside(nr, nc)) { if (lastSegment) break; return null; }
        i = nr * columns + nc;
      }
      segments.push(seg);
      if (lastSegment) break;
      // Turn at the last cell of this segment, towards a free cell inside the grid.
      const r = Math.floor(i / columns), c = i % columns;
      const turns = rng.shuffled([1, 2]).filter((m) => { const d = reflect(m, dir); const nr = r + DR[d], nc = c + DC[d]; return inside(nr, nc) && !onPath.has(nr * columns + nc); });
      if (!turns.length) return null;
      marks[i] = turns[0];
      dir = reflect(turns[0], dir);
      i = (r + DR[dir]) * columns + (c + DC[dir]);
    }
    // Targets: the last free cell before each mirror forces every turn; one more on the last segment.
    const free = (seg: number[]) => seg.filter((x) => marks[x] === 0);
    const targets = new Set<number>();
    for (const seg of segments.slice(0, -1)) { const f = free(seg); if (!f.length) return null; targets.add(f[f.length - 1]); }
    const last = free(segments[segments.length - 1]);
    if (!last.length) return null;
    targets.add(rng.pick(last));
    const extra = rng.shuffled(segments.flatMap(free).filter((x) => !targets.has(x)));
    for (const t of extra) { if (targets.size >= params.targets) break; targets.add(t); }
    const chars = Array(n).fill('.');
    for (const t of targets) chars[t] = 'T';
    for (let x = 0; x < n; x++) if (!onPath.has(x) && rng.chance(params.obstaclePercent, 100)) chars[x] = '#';
    const p: MirrorsPuzzle = { rows, columns, cells: chars.join(''), source: { cell: start, dir: dir0 }, mirrors: params.mirrors };
    const report = this.solve(p, 2);
    return report.solutionCount === 1 ? p : null;
  }

  /** Follows the ray; at each empty cell: straight, '/' or '\' (if mirrors are left). */
  solve(p: MirrorsPuzzle, limit: number): SolveReport<number[]> {
    const n = p.rows * p.columns, targets = targetsOf(p);
    const marks = Array(n).fill(0);
    const crossed = new Uint16Array(n); // times the ray went straight through a cell
    const found = new Map<string, number[]>();
    let nodes = 0;
    const rec = (i: number, dir: number, left: number, hits: Set<number>, seen: Set<string>) => {
      if (found.size >= limit || nodes > 500_000) return;
      nodes++;
      const r = Math.floor(i / p.columns), c = i % p.columns;
      const outside = r < 0 || c < 0 || r >= p.rows || c >= p.columns;
      const stop = outside || p.cells[i] === '#' || seen.has(`${i}:${dir}`);
      if (stop) {
        if (targets.every((t) => hits.has(t))) {
          const key = marks.map((m, x) => (m ? `${x}${m === 1 ? '/' : '\\'}` : '')).filter(Boolean).join(',');
          if (!found.has(key)) found.set(key, marks.slice());
        }
        return;
      }
      const seen2 = new Set(seen); seen2.add(`${i}:${dir}`);
      const hits2 = p.cells[i] === 'T' ? new Set(hits).add(i) : hits;
      const go = (d: number, l = left) => {
        const nr = r + DR[d], nc = c + DC[d];
        const next = nr < 0 || nc < 0 || nr >= p.rows || nc >= p.columns ? -1 : nr * p.columns + nc;
        rec(next, d, l, hits2, seen2);
      };
      if (marks[i]) { go(reflect(marks[i], dir)); return; }
      crossed[i]++; go(dir); crossed[i]--;
      if (p.cells[i] === '.' && left > 0 && crossed[i] === 0) {
        for (const m of [1, 2]) { marks[i] = m; go(reflect(m, dir), left - 1); marks[i] = 0; }
      }
    };
    rec(p.source.cell, p.source.dir, p.mirrors, new Set(), new Set());
    const solutions = [...found.values()];
    return { solutionCount: solutions.length, solutions, trace: [], humanSolvable: nodes <= 500_000, searchNodes: nodes };
  }

  initialState(p: MirrorsPuzzle): MirrorsState { return { marks: Array(p.rows * p.columns).fill(0) }; }
  stateApplying(solution: number[]): MirrorsState { return { marks: solution.slice() }; }

  /** Tap: nothing → '/' → '\' → nothing (only on empty cells). */
  touch(p: MirrorsPuzzle, s: MirrorsState, i: number): MirrorsState {
    if (p.cells[i] !== '.') return s;
    const marks = s.marks.slice();
    marks[i] = (marks[i] + 1) % 3;
    return { marks };
  }

  used = (s: MirrorsState) => s.marks.filter(Boolean).length;

  validate(p: MirrorsPuzzle, s: MirrorsState): ValidationResult {
    if (s.marks.length !== p.rows * p.columns) return INCOMPLETE;
    if (this.used(s) > p.mirrors) return { kind: 'invalid', issues: [{ cells: [], message: tpl('mirrors.error.tooMany', [String(p.mirrors)]) }] };
    const t = trace(p, s.marks);
    return targetsOf(p).every((x) => t.hits.has(x)) ? CORRECT : INCOMPLETE;
  }

  rate(p: MirrorsPuzzle, report: SolveReport<number[]>): number {
    const n = p.rows * p.columns;
    return clampScore(p.mirrors * 10 + (n - 25) * 0.6 + Math.log2(Math.max(1, report.searchNodes)) * 2.5 - 12);
  }

  hint(p: MirrorsPuzzle, s: MirrorsState, level: HintLevel): Hint<MirrorsState> | null {
    const sol = this.solve(p, 1).solutions[0];
    if (!sol || this.validate(p, s).kind === 'correct') return null;
    const at = (x: number) => [String(Math.floor(x / p.columns) + 1), String((x % p.columns) + 1)];
    const wrong = s.marks.findIndex((m, x) => m !== 0 && m !== sol[x]);
    const missing = sol.findIndex((m, x) => m !== 0 && s.marks[x] !== m);
    const x = wrong >= 0 ? wrong : missing;
    if (x < 0) return null;
    const f = [cell(Math.floor(x / p.columns), x % p.columns)];
    if (level === HintLevel.Solution) return { level, text: tpl('mirrors.hint.solution'), focus: [], resultingState: { marks: sol.slice() } };
    if (wrong >= 0) {
      const marks = s.marks.slice(); marks[x] = sol[x];
      return { level, text: tpl('mirrors.hint.wrong', at(x)), focus: f, resultingState: level === HintLevel.Insight ? { marks } : undefined };
    }
    const target = targetsOf(p).find((t) => !trace(p, s.marks).hits.has(t)) ?? x;
    switch (level) {
      case HintLevel.Whisper: return { level, text: tpl('mirrors.hint.whisper', at(target)), focus: [cell(Math.floor(target / p.columns), target % p.columns)] };
      case HintLevel.Lead: return { level, text: tpl('mirrors.hint.lead', [at(x)[0]]), focus: [] };
      case HintLevel.Insight: {
        const marks = s.marks.slice(); marks[x] = sol[x];
        return { level, text: tpl('mirrors.hint.insight', [...at(x), sol[x] === 1 ? '/' : '\\']), focus: f, resultingState: { marks } };
      }
    }
    return null;
  }

  fingerprint(p: MirrorsPuzzle): string { return `${p.rows}x${p.columns}:${p.source.cell}>${p.source.dir}:${p.mirrors}|${p.cells}`; }

  parse(raw: unknown): MirrorsPuzzle | null {
    const o = raw as Partial<MirrorsPuzzle> | null;
    if (!o || typeof o.rows !== 'number' || typeof o.columns !== 'number' || typeof o.cells !== 'string' || !o.source || typeof o.mirrors !== 'number') return null;
    const n = o.rows * o.columns;
    if (!(o.rows >= 3 && o.columns >= 3 && o.rows <= 10 && o.columns <= 10) || o.cells.length !== n || !/^[.#T]+$/.test(o.cells)) return null;
    if (!Number.isInteger(o.source.cell) || o.source.cell < 0 || o.source.cell >= n || ![0, 1, 2, 3].includes(o.source.dir) || o.mirrors < 0 || o.mirrors > 12) return null;
    return { rows: o.rows, columns: o.columns, cells: o.cells, source: { cell: o.source.cell, dir: o.source.dir }, mirrors: o.mirrors };
  }

  equals(a: MirrorsPuzzle, b: MirrorsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
