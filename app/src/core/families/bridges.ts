/**
 * Passerelles — the islands of the floating market. Join them with
 * footbridges: straight, one or two between the same two islands, never
 * crossing. The number on an island is how many footbridges leave it, and
 * everything must end up joined together.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';

export interface BridgesPuzzle { rows: number; cols: number; islands: [number, number][] }
/** Footbridges per pair of islands, keyed "a-b" with a < b (indices in `islands`). */
export interface BridgesState { links: Record<string, number>; selected: number | null }
export interface BridgesParams { rows: number; cols: number; islands: [number, number] }

export const linkKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
interface Edge { a: number; b: number; cells: number[] }

/** Pairs of islands that see each other across empty water, with the water cells between. */
export function edgesOf(p: BridgesPuzzle): Edge[] {
  const at = new Map(p.islands.map(([pos], k) => [pos, k]));
  const out: Edge[] = [];
  p.islands.forEach(([pos], a) => {
    const r = Math.floor(pos / p.cols), c = pos % p.cols;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const cells: number[] = [];
      for (let y = r + dr, x = c + dc; y < p.rows && x < p.cols; y += dr, x += dc) {
        const i = y * p.cols + x;
        if (at.has(i)) { if (cells.length) out.push({ a, b: at.get(i)!, cells }); break; }
        cells.push(i);
      }
    }
  });
  return out;
}
const crossing = (e: Edge, f: Edge) => e.cells.some((x) => f.cells.includes(x));

function connected(n: number, edges: Edge[], counts: number[]): boolean {
  const adj: number[][] = [...Array(n)].map(() => []);
  edges.forEach((e, k) => { if (counts[k]) { adj[e.a].push(e.b); adj[e.b].push(e.a); } });
  const seen = new Set([0]), stack = [0];
  while (stack.length) for (const y of adj[stack.pop()!]) if (!seen.has(y)) { seen.add(y); stack.push(y); }
  return seen.size === n;
}

/** Every answer (up to `limit`) as bridge counts per edge. */
export function solveBridges(p: BridgesPuzzle, limit: number): { solutions: number[][]; nodes: number } {
  const edges = edgesOf(p), n = p.islands.length;
  const need = p.islands.map(([, v]) => v), sum = new Array(n).fill(0), left = new Array(n).fill(0);
  edges.forEach((e) => { left[e.a] += 2; left[e.b] += 2; });
  const counts = new Array(edges.length).fill(0), out: number[][] = [];
  const cross = edges.map((e) => edges.map((f, j) => (crossing(e, f) ? j : -1)).filter((j) => j >= 0));
  let nodes = 0;
  const rec = (k: number) => {
    if (out.length >= limit || nodes > 300_000) return;
    nodes++;
    if (k === edges.length) { if (sum.every((v, i) => v === need[i]) && connected(n, edges, counts)) out.push(counts.slice()); return; }
    const e = edges[k];
    left[e.a] -= 2; left[e.b] -= 2;
    for (const v of [0, 1, 2]) {
      if (v && cross[k].some((j) => j < k && counts[j])) break;
      if (sum[e.a] + v > need[e.a] || sum[e.b] + v > need[e.b]) break;
      if (sum[e.a] + v + left[e.a] < need[e.a] || sum[e.b] + v + left[e.b] < need[e.b]) continue;
      counts[k] = v; sum[e.a] += v; sum[e.b] += v;
      rec(k + 1);
      counts[k] = 0; sum[e.a] -= v; sum[e.b] -= v;
      if (out.length >= limit) break;
    }
    left[e.a] += 2; left[e.b] += 2;
  };
  rec(0);
  return { solutions: out, nodes };
}

export class BridgesFamily implements PuzzleFamily<BridgesPuzzle, BridgesState, BridgesParams, number[]> {
  readonly id = 'bridges';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = true;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([22, 36, 50, 64, 78]);

  generate(params: BridgesParams, rng: SeededRNG): BridgesPuzzle | null {
    const { rows, cols } = params, want = rng.int(params.islands[0], params.islands[1]);
    const islandAt = new Map<number, number>(), water = new Set<number>(); // cells under a bridge
    const deg: number[] = [];
    const add = (pos: number) => { islandAt.set(pos, deg.length); deg.push(0); };
    add(rng.below(rows * cols));
    for (let guard = 0; deg.length < want && guard < 2000; guard++) {
      const from = rng.pick([...islandAt.keys()]);
      const [dr, dc] = rng.pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
      const len = rng.int(2, Math.max(2, Math.floor(Math.max(rows, cols) / 2)));
      let r = Math.floor(from / cols), c = from % cols;
      const cells: number[] = [];
      let ok = true;
      for (let s = 1; s <= len; s++) {
        r += dr; c += dc;
        if (r < 0 || c < 0 || r >= rows || c >= cols) { ok = false; break; }
        const i = r * cols + c;
        if (islandAt.has(i) || water.has(i)) { ok = false; break; }
        if (s < len) cells.push(i);
      }
      if (!ok) continue;
      const to = r * cols + c;
      // No island right next to another: the footbridge would have no water to cross.
      if ([to - 1, to + 1, to - cols, to + cols].some((x) => islandAt.has(x) && x !== from && Math.abs((x % cols) - c) <= 1)) continue;
      add(to);
      cells.forEach((x) => water.add(x));
      const n = rng.chance(1, 3) ? 2 : 1;
      deg[islandAt.get(from)!] += n; deg[islandAt.get(to)!] += n;
    }
    if (deg.length < want) return null;
    const islands = [...islandAt.entries()].sort((x, y) => x[0] - y[0]).map(([pos, k]) => [pos, deg[k]] as [number, number]);
    const p: BridgesPuzzle = { rows, cols, islands };
    return solveBridges(p, 2).solutions.length === 1 ? p : null;
  }

  solve(p: BridgesPuzzle, limit: number): SolveReport<number[]> {
    const r = solveBridges(p, limit);
    return { solutionCount: r.solutions.length, solutions: r.solutions, trace: [], humanSolvable: true, searchNodes: r.nodes };
  }

  initialState(): BridgesState { return { links: {}, selected: null }; }
  stateApplying(sol: number[], p: BridgesPuzzle): BridgesState {
    const links: Record<string, number> = {};
    edgesOf(p).forEach((e, k) => { if (sol[k]) links[linkKey(e.a, e.b)] = sol[k]; });
    return { links, selected: null };
  }

  /** Tap island `k`: select it, or (with another selected in line) add a footbridge: 0 → 1 → 2 → 0. */
  tapIsland(p: BridgesPuzzle, s: BridgesState, k: number): BridgesState {
    if (s.selected === null || s.selected === k) return { ...s, selected: s.selected === k ? null : k };
    const e = edgesOf(p).find((x) => linkKey(x.a, x.b) === linkKey(s.selected!, k));
    if (!e) return { ...s, selected: k };
    const key = linkKey(e.a, e.b), next = ((s.links[key] ?? 0) + 1) % 3;
    const links = { ...s.links };
    if (next) {
      // A new footbridge lifts the ones it would cross.
      for (const f of edgesOf(p)) if (f !== e && crossing(e, f)) delete links[linkKey(f.a, f.b)];
      links[key] = next;
    } else delete links[key];
    return { links, selected: null };
  }

  validate(p: BridgesPuzzle, s: BridgesState): ValidationResult {
    const edges = edgesOf(p), sum = new Array(p.islands.length).fill(0);
    const counts = edges.map((e) => s.links[linkKey(e.a, e.b)] ?? 0);
    edges.forEach((e, k) => { sum[e.a] += counts[k]; sum[e.b] += counts[k]; });
    const at = (k: number) => cell(Math.floor(p.islands[k][0] / p.cols), p.islands[k][0] % p.cols);
    const over = sum.findIndex((v, k) => v > p.islands[k][1]);
    if (over >= 0) return { kind: 'invalid', issues: [{ cells: [at(over)], message: tpl('bridges.error.over') }] };
    const all = sum.every((v, k) => v === p.islands[k][1]);
    if (all && !connected(p.islands.length, edges, counts)) return { kind: 'invalid', issues: [{ cells: [], message: tpl('bridges.error.apart') }] };
    return all ? CORRECT : INCOMPLETE;
  }

  rate(p: BridgesPuzzle, report: SolveReport<number[]>): number {
    return clampScore(p.islands.length * 3 + Math.log2(Math.max(1, report.searchNodes)) * 3.5 + p.rows * p.cols * 0.15 - 30);
  }

  hint(p: BridgesPuzzle, s: BridgesState, level: HintLevel): Hint<BridgesState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const edges = edgesOf(p), sol = this.solve(p, 1).solutions[0];
    const at = (k: number) => cell(Math.floor(p.islands[k][0] / p.cols), p.islands[k][0] % p.cols);
    if (level === HintLevel.Solution) return { level, text: tpl('bridges.hint.solution'), focus: [], resultingState: this.stateApplying(sol, p) };
    const have = edges.map((e) => s.links[linkKey(e.a, e.b)] ?? 0);
    const set = (k: number) => { const links = { ...s.links }; const key = linkKey(edges[k].a, edges[k].b); if (sol[k]) links[key] = sol[k]; else delete links[key]; return { links, selected: null }; };
    const extra = have.findIndex((v, k) => v > sol[k]);
    if (extra >= 0) return { level, text: tpl('bridges.hint.mistake'), focus: [at(edges[extra].a), at(edges[extra].b)], resultingState: level === HintLevel.Insight ? set(extra) : undefined };
    if (level === HintLevel.Whisper) return { level, text: tpl('bridges.hint.whisper'), focus: [] };
    // Prefer an island whose number leaves no choice: all its bridges are forced.
    const missing = have.map((v, k) => (v < sol[k] ? k : -1)).filter((k) => k >= 0);
    const need = p.islands.map(([, v]) => v);
    const tight = missing.find((k) => [edges[k].a, edges[k].b].some((i) => need[i] === 2 * edges.filter((e) => e.a === i || e.b === i).length));
    const k = tight ?? missing[0];
    if (k === undefined) return { level, text: tpl('bridges.hint.solution'), focus: [], resultingState: this.stateApplying(sol, p) };
    if (level === HintLevel.Lead) return { level, text: tpl(sol[k] === 2 ? 'bridges.hint.lead.two' : 'bridges.hint.lead'), focus: [at(edges[k].a), at(edges[k].b)] };
    return { level, text: tpl('bridges.hint.insight'), focus: [at(edges[k].a), at(edges[k].b)], resultingState: set(k) };
  }

  fingerprint(p: BridgesPuzzle): string { return `bridges:${p.rows}x${p.cols}:${p.islands.map((x) => x.join('=')).join(',')}`; }
  parse(raw: unknown): BridgesPuzzle | null {
    const o = raw as Partial<BridgesPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number, n = rows * cols;
    if (rows < 3 || cols < 3 || rows > 12 || cols > 12) return null;
    if (!Array.isArray(o.islands) || o.islands.length < 2 || !o.islands.every((x) => Array.isArray(x) && x.length === 2 && Number.isInteger(x[0]) && x[0] >= 0 && x[0] < n && Number.isInteger(x[1]) && x[1] >= 1 && x[1] <= 8)) return null;
    if (new Set(o.islands.map((x) => x[0])).size !== o.islands.length) return null;
    return { rows, cols, islands: o.islands.map((x) => [x[0], x[1]] as [number, number]) };
  }
  equals(a: BridgesPuzzle, b: BridgesPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}
