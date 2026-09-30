// The eight families added last: the common contract, then the rule of each one.
import { CandidatePipeline } from '../puzzlekit/pipeline';
import { HintLevel, PuzzleFamily } from '../puzzlekit/types';
import { EmbroideryFamily, runsOf, solveLine } from '../families/embroidery';
import { SignsFamily } from '../families/signs';
import { RoofsFamily, seen } from '../families/roofs';
import { GlideFamily, slide } from '../families/glide';
import { SliderFamily, isGoal, tapTile } from '../families/slider';
import { RibbonsFamily } from '../families/ribbons';
import { FirefliesFamily } from '../families/fireflies';
import { BridgesFamily, edgesOf, linkKey } from '../families/bridges';
import { repeats } from '../families/latin';

function contract<P, S>(name: string, family: PuzzleFamily<P, S, any, any>, params: unknown, count: number, attempts: number) {
  describe(name, () => {
    const { accepted } = new CandidatePipeline(family).generate(count, params, 23n, undefined, attempts);
    test(`generates ${count} puzzles`, () => { expect(accepted.length).toBe(count); });
    test('the answer is valid (and unique when required), the start is not', () => {
      for (const a of accepted) {
        if (family.requiresUniqueSolution) expect(a.report.solutionCount).toBe(1);
        expect(family.validate(a.puzzle, family.stateApplying(a.report.solutions[0], a.puzzle)).kind).toBe('correct');
        expect(family.validate(a.puzzle, family.initialState(a.puzzle)).kind).not.toBe('correct');
      }
    });
    test('hints always lead to the end', () => {
      for (const a of accepted.slice(0, 4)) {
        let s = family.initialState(a.puzzle);
        for (let i = 0; i < 200 && family.validate(a.puzzle, s).kind !== 'correct'; i++) {
          expect(family.hint(a.puzzle, s, HintLevel.Whisper)).not.toBeNull();
          const h = family.hint(a.puzzle, s, i < 8 ? HintLevel.Insight : HintLevel.Solution)!;
          if (h.resultingState !== undefined) s = h.resultingState;
        }
        expect(family.validate(a.puzzle, s).kind).toBe('correct');
      }
    });
    test('round trip through parse; bad data refused', () => {
      for (const a of accepted.slice(0, 3)) {
        const again = family.parse(JSON.parse(JSON.stringify(a.puzzle)));
        expect(again).not.toBeNull();
        expect(family.equals(again!, a.puzzle)).toBe(true);
      }
      for (const raw of [null, 3, 'x', {}, { rows: -1 }, { n: 99 }]) expect(family.parse(raw)).toBeNull();
    });
    test('deterministic from the seed', () => {
      const a = new CandidatePipeline(family).generate(1, params, 99n, undefined, attempts).accepted[0];
      const b = new CandidatePipeline(family).generate(1, params, 99n, undefined, attempts).accepted[0];
      expect(family.fingerprint(a.puzzle)).toBe(family.fingerprint(b.puzzle));
    });
  });
}

contract('broderie', new EmbroideryFamily(), { rows: 7, cols: 7, density: 0.55, symmetric: true }, 6, 400);
contract('signes', new SignsFamily(), { n: 5, startSigns: 8 }, 4, 100);
contract('toits', new RoofsFamily(), { n: 5, keepClues: 10 }, 3, 200);
contract('glissade', new GlideFamily(), { rows: 7, cols: 7, rocks: [7, 11], moves: [5, 7] }, 6, 2000);
contract('taquin', new SliderFamily(), { rows: 3, cols: 3, moves: [12, 16] }, 4, 400);
contract('rubans', new RibbonsFamily(), { rows: 6, cols: 6, pairs: [5, 6] }, 6, 400);
contract('lucioles', new FirefliesFamily(), { rows: 7, cols: 7, posts: [8, 10] }, 5, 400);
contract('passerelles', new BridgesFamily(), { rows: 7, cols: 7, islands: [9, 11] }, 5, 400);

describe('rules', () => {
  test('broderie: runs of a line, and the line reasoning', () => {
    expect(runsOf([true, true, false, true, false, false, true])).toEqual([2, 1, 1]);
    // A 4 in 5 cells: the middle three are stitched for sure.
    expect(solveLine([4], [-1, -1, -1, -1, -1])).toEqual([-1, 1, 1, 1, -1]);
    expect(solveLine([2], [-1, 0, -1, -1, 0])).toEqual([0, 0, 1, 1, 0]);
    expect(solveLine([3], [1, 0, -1, -1, -1])).toBeNull();
  });

  test('signes and toits: repeats, visible chimneys', () => {
    expect(repeats(3, [1, 1, 0, 0, 0, 0, 0, 0, 0]).sort()).toEqual([0, 1]);
    expect(repeats(3, [1, 0, 0, 1, 0, 0, 0, 0, 0]).sort()).toEqual([0, 3]);
    expect(seen([1, 3, 2, 4])).toBe(3);
    expect(seen([4, 1, 2, 3])).toBe(1);
    const f = new SignsFamily();
    const p = { n: 3, givens: [0, 0, 0, 0, 0, 0, 0, 0, 0], less: [[0, 1]] as [number, number][] };
    expect(f.validate(p, { values: [3, 2, 0, 0, 0, 0, 0, 0, 0] }).kind).toBe('invalid');
  });

  test('glissade: Nilo slides until something stops him', () => {
    const p = { rows: 3, cols: 4, rocks: [3], start: 0, goal: 2 };
    expect(slide(p, new Set(p.rocks), 0, 1)).toBe(2); // stops before the crate
    expect(slide(p, new Set(p.rocks), 0, 2)).toBe(8); // down to the bank
    expect(new GlideFamily().validate(p, { pos: 2, moves: 1 }).kind).toBe('correct');
  });

  test('taquin: a tap slides a whole line towards the gap', () => {
    // 1 2 3 / 4 5 6 / 7 8 _  → tap 7: the row slides right.
    const t = tapTile(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 0], 6);
    expect(t).toEqual([1, 2, 3, 4, 5, 6, 0, 7, 8]);
    expect(isGoal([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(true);
    expect(tapTile(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 0], 0)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  });

  test('rubans: draw from a pin, cut back, and a full loom is right', () => {
    const f = new RibbonsFamily();
    // 2×3 loom: A goes 0-1-2, B goes 3-4-5.
    const p = { rows: 3, cols: 3, ends: [[0, 2], [3, 5], [6, 8]] as [number, number][], known: [[0, 1, 2], [3, 4, 5], [6, 7, 8]] };
    let s = f.initialState(p);
    for (const i of [0, 1, 2]) s = f.touch(p, s, i);
    expect(s.paths[0]).toEqual([0, 1, 2]);
    s = f.touch(p, s, 1); // cut back to 1
    expect(s.paths[0]).toEqual([0, 1]);
    expect(f.validate(p, f.stateApplying(p.known)).kind).toBe('correct');
  });

  test('lucioles: fireflies never touch, and each sits by a lantern', () => {
    const f = new FirefliesFamily();
    const p = { rows: 3, cols: 3, posts: [4], rowCounts: [1, 0, 0], colCounts: [0, 1, 0] };
    expect(f.validate(p, { cells: [1, 1, 0, 0, 0, 0, 0, 0, 0] }).kind).toBe('invalid');
    expect(f.validate(p, { cells: [0, 1, 0, 0, 0, 0, 0, 0, 0] }).kind).toBe('correct');
  });

  test('passerelles: islands see each other across water; a new bridge lifts a crossing one', () => {
    const f = new BridgesFamily();
    // A cross: islands at (0,1),(2,1) vertical and (1,0),(1,2) horizontal.
    const p = { rows: 3, cols: 3, islands: [[1, 1], [3, 1], [5, 1], [7, 1]] as [number, number][] };
    const e = edgesOf(p);
    expect(e.length).toBe(2);
    let s = f.tapIsland(p, f.initialState(), 0);
    s = f.tapIsland(p, s, 3);
    expect(s.links[linkKey(0, 3)]).toBe(1);
    s = f.tapIsland(p, f.tapIsland(p, s, 1), 2);
    expect(s.links[linkKey(1, 2)]).toBe(1);
    expect(s.links[linkKey(0, 3)]).toBeUndefined();
  });
});
