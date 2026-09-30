/**
 * Rubans — pairs of coloured pins on a loom. Join each pair with a ribbon;
 * ribbons never cross, and together they cover the whole loom. Any complete
 * weave is right; one is stored with the puzzle for the hints.
 */
import { SeededRNG } from '../puzzlekit/rng';
import { CORRECT, Hint, HintLevel, INCOMPLETE, PuzzleFamily, SolveReport, TierThresholds, ValidationResult, cell, clampScore, tpl } from '../puzzlekit/types';
import { neighbours, randomHamiltonian } from './threads';

export interface RibbonsPuzzle { rows: number; cols: number; ends: [number, number][]; known: number[][] }
/** One path per colour, starting on one of its pins; `active` is the colour being drawn. */
export interface RibbonsState { paths: number[][]; active: number | null }
export interface RibbonsParams { rows: number; cols: number; pairs: [number, number] }

const grid = (p: RibbonsPuzzle) => ({ rows: p.rows, columns: p.cols });
export const pinColour = (p: RibbonsPuzzle, i: number) => p.ends.findIndex(([a, b]) => a === i || b === i);
const done = (p: RibbonsPuzzle, path: number[], k: number) => path.length > 1 && (path[0] === p.ends[k][0] ? path[path.length - 1] === p.ends[k][1] : path[path.length - 1] === p.ends[k][0]);

export class RibbonsFamily implements PuzzleFamily<RibbonsPuzzle, RibbonsState, RibbonsParams, number[][]> {
  readonly id = 'ribbons';
  readonly formatVersion = 1;
  readonly requiresUniqueSolution = false;
  readonly generatorVersion = 1;
  readonly thresholds = new TierThresholds([22, 36, 50, 64, 78]);

  generate(params: RibbonsParams, rng: SeededRNG): RibbonsPuzzle | null {
    const { rows, cols } = params, n = rows * cols;
    const path = randomHamiltonian(rows, cols, rng, n * 14);
    const k = rng.int(params.pairs[0], params.pairs[1]);
    // Cut the long path into k ribbons of at least 3 cells, of uneven lengths.
    const cuts = new Set<number>();
    for (let guard = 0; cuts.size < k - 1 && guard < 400; guard++) {
      const c = 3 + rng.below(n - 5);
      if ([...cuts].every((x) => Math.abs(x - c) >= 3) && c >= 3 && n - c >= 3) cuts.add(c);
    }
    if (cuts.size < k - 1) return null;
    const bounds = [0, ...[...cuts].sort((a, b) => a - b), n];
    const known = bounds.slice(1).map((e, i) => path.slice(bounds[i], e));
    // A ribbon that runs straight along its neighbour's side gives it away: keep the ones that bend.
    if (known.some((r) => r.length > 3 && isStraight(r, cols))) return null;
    const ends = known.map((r) => [r[0], r[r.length - 1]] as [number, number]);
    return { rows, cols, ends, known };
  }

  solve(p: RibbonsPuzzle): SolveReport<number[][]> {
    return { solutionCount: 1, solutions: [p.known.map((r) => r.slice())], trace: [], humanSolvable: true, searchNodes: p.rows * p.cols };
  }

  initialState(p: RibbonsPuzzle): RibbonsState { return { paths: p.ends.map(() => []), active: null }; }
  stateApplying(sol: number[][]): RibbonsState { return { paths: sol.map((r) => r.slice()), active: null }; }

  /** A tap on cell i: start at a pin, extend the active ribbon, or cut one back. */
  touch(p: RibbonsPuzzle, s: RibbonsState, i: number): RibbonsState {
    const paths = s.paths.map((r) => r.slice());
    const pin = pinColour(p, i);
    if (pin >= 0 && (s.active !== pin || !paths[pin].length || paths[pin][paths[pin].length - 1] !== i || paths[pin].length === 1)) {
      // A pin: (re)start its ribbon from there, unless it closes the active one.
      const act = s.active;
      if (act === pin && paths[pin].length && canStep(p, paths[pin][paths[pin].length - 1], i) && !paths[pin].includes(i)) { paths[pin].push(i); return { paths, active: null }; }
      paths[pin] = [i];
      return { paths, active: pin };
    }
    const owner = paths.findIndex((r) => r.includes(i));
    if (s.active !== null && owner !== s.active) {
      const r = paths[s.active];
      const head = r[r.length - 1];
      if (!r.length || done(p, r, s.active) || !canStep(p, head, i) || pin >= 0) return owner >= 0 ? this.cut(paths, owner, i) : s;
      if (owner >= 0) paths[owner] = paths[owner].slice(0, paths[owner].indexOf(i));
      r.push(i);
      return { paths, active: s.active };
    }
    if (owner >= 0) return this.cut(paths, owner, i);
    return s;
  }
  private cut(paths: number[][], k: number, i: number): RibbonsState {
    paths[k] = paths[k].slice(0, paths[k].indexOf(i) + 1);
    return { paths, active: k };
  }

  validate(p: RibbonsPuzzle, s: RibbonsState): ValidationResult {
    const covered = new Set<number>();
    for (const r of s.paths) for (const x of r) covered.add(x);
    const all = s.paths.every((r, k) => done(p, r, k));
    if (all && covered.size < p.rows * p.cols) {
      const empty = [...Array(p.rows * p.cols).keys()].filter((x) => !covered.has(x));
      return { kind: 'invalid', issues: [{ cells: empty.map((x) => cell(Math.floor(x / p.cols), x % p.cols)), message: tpl('ribbons.error.empty') }] };
    }
    return all && covered.size === p.rows * p.cols ? CORRECT : INCOMPLETE;
  }

  rate(p: RibbonsPuzzle): number {
    const n = p.rows * p.cols;
    return clampScore(n * 0.9 + (n / p.ends.length) * 2.2 - 30);
  }

  hint(p: RibbonsPuzzle, s: RibbonsState, level: HintLevel): Hint<RibbonsState> | null {
    if (this.validate(p, s).kind === 'correct') return null;
    const at = (x: number) => cell(Math.floor(x / p.cols), x % p.cols);
    if (level === HintLevel.Solution) return { level, text: tpl('ribbons.hint.solution'), focus: [], resultingState: this.stateApplying(p.known) };
    if (level === HintLevel.Whisper) return { level, text: tpl('ribbons.hint.whisper'), focus: [] };
    // The first ribbon that is not yet the known one: where it leaves it, or what it lacks.
    for (let k = 0; k < p.ends.length; k++) {
      const want = s.paths[k][0] === p.known[k][p.known[k].length - 1] ? [...p.known[k]].reverse() : p.known[k];
      const have = s.paths[k];
      if (have.length === want.length && have.every((x, j) => x === want[j])) continue;
      let same = 0;
      while (same < have.length && have[same] === want[same]) same++;
      const paths = s.paths.map((r) => r.slice());
      // Other ribbons lying on this one's cells step aside.
      for (let o = 0; o < paths.length; o++) if (o !== k) { const cut = paths[o].findIndex((x) => want.includes(x)); if (cut >= 0) paths[o] = paths[o].slice(0, cut); }
      paths[k] = want.slice();
      const focus = same < have.length ? [at(have[same])] : [at(want[Math.max(0, same)])];
      if (level === HintLevel.Lead) return { level, text: tpl(same < have.length ? 'ribbons.hint.off' : 'ribbons.hint.lead'), focus };
      return { level, text: tpl('ribbons.hint.insight'), focus: want.map(at), resultingState: { paths, active: null } };
    }
    return { level, text: tpl('ribbons.hint.solution'), focus: [], resultingState: this.stateApplying(p.known) };
  }

  fingerprint(p: RibbonsPuzzle): string { return `ribbons:${p.rows}x${p.cols}:${p.ends.map((e) => [...e].sort((a, b) => a - b).join('-')).sort().join(',')}`; }
  parse(raw: unknown): RibbonsPuzzle | null {
    const o = raw as Partial<RibbonsPuzzle> | null;
    if (!o || !Number.isInteger(o.rows) || !Number.isInteger(o.cols)) return null;
    const rows = o.rows as number, cols = o.cols as number, n = rows * cols;
    if (rows < 3 || cols < 3 || rows > 9 || cols > 9) return null;
    const idx = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < n;
    if (!Array.isArray(o.ends) || o.ends.length < 2 || o.ends.length > 10 || !o.ends.every((e) => Array.isArray(e) && e.length === 2 && e.every(idx))) return null;
    if (!Array.isArray(o.known) || o.known.length !== o.ends.length) return null;
    const p: RibbonsPuzzle = { rows, cols, ends: o.ends.map((e) => [e[0], e[1]] as [number, number]), known: (o.known as number[][]).map((r) => (Array.isArray(r) ? r.slice() : [])) };
    // The stored weave must be a real answer.
    if (!p.known.every((r, k) => r.length >= 2 && r.every(idx) && r[0] === p.ends[k][0] && r[r.length - 1] === p.ends[k][1] && r.every((x, j) => j === 0 || canStep(p, r[j - 1], x)))) return null;
    if (new Set(p.known.flat()).size !== n || p.known.flat().length !== n) return null;
    return p;
  }
  equals(a: RibbonsPuzzle, b: RibbonsPuzzle): boolean { return this.fingerprint(a) === this.fingerprint(b); }
}

function canStep(p: RibbonsPuzzle, a: number, b: number) { return neighbours(grid(p), a).includes(b); }
function isStraight(r: number[], cols: number) {
  const rows = new Set(r.map((x) => Math.floor(x / cols))), columns = new Set(r.map((x) => x % cols));
  return rows.size === 1 || columns.size === 1;
}
