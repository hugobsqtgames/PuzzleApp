import { CandidatePipeline } from '../puzzlekit/pipeline';
import { SeededRNG } from '../puzzlekit/rng';
import { HintLevel } from '../puzzlekit/types';
import { GearsFamily, gearsLight, orientations } from '../families/gears';
import { EXPLAINERS, SequencesFamily, predictions } from '../families/sequences';
import { ScalesFamily, assignments } from '../families/scales';

describe('gears', () => {
  const f = new GearsFamily();
  const pipe = new CandidatePipeline(f);

  test('accepted puzzles are unique, solvable and keep tile shapes', () => {
    const { accepted } = pipe.generate(12, { rows: 5, columns: 5 }, 1n, undefined, 600);
    expect(accepted.length).toBe(12);
    for (const a of accepted) {
      const sol = a.report.solutions[0];
      expect(a.report.solutionCount).toBe(1);
      expect(f.validate(a.puzzle, f.stateApplying(sol)).kind).toBe('correct');
      expect(f.validate(a.puzzle, f.initialState(a.puzzle)).kind).toBe('incomplete');
      sol.tiles.forEach((m, i) => expect(orientations(a.puzzle.tiles[i])).toContain(m));
    }
  });

  test('deterministic from the seed', () => {
    const a = f.generate({ rows: 4, columns: 4 }, new SeededRNG(42n));
    const b = f.generate({ rows: 4, columns: 4 }, new SeededRNG(42n));
    expect(a).toEqual(b);
  });

  test('hints lead to the solution and never break shapes', () => {
    const { accepted } = pipe.generate(4, { rows: 4, columns: 4 }, 7n, undefined, 400);
    for (const a of accepted) {
      let s = f.initialState(a.puzzle);
      for (let guard = 0; guard < 40 && f.validate(a.puzzle, s).kind !== 'correct'; guard++) {
        expect(f.hint(a.puzzle, s, HintLevel.Whisper)).not.toBeNull();
        s = f.hint(a.puzzle, s, HintLevel.Insight)!.resultingState!;
      }
      expect(gearsLight(a.puzzle, s.tiles).solved).toBe(true);
      expect(f.hint(a.puzzle, s, HintLevel.Whisper)).toBeNull();
    }
  });

  test('bad data is refused, never crashes', () => {
    for (const raw of [null, {}, { rows: 3, columns: 3, source: 0, tiles: [1] }, { rows: 2, columns: 2, source: 9, tiles: [1, 2, 4, 8] }, 'x']) {
      expect(f.parse(raw)).toBeNull();
    }
  });
});

describe('sequences', () => {
  const f = new SequencesFamily();
  const pipe = new CandidatePipeline(f);

  test('explainers recognise their own rules', () => {
    expect(EXPLAINERS.add([3, 7, 11, 15])).toBe(19);
    expect(EXPLAINERS.addDoubling([3, 5, 9, 17, 33])).toBe(65);
    expect(EXPLAINERS.fibonacci([1, 2, 3, 5, 8])).toBe(13);
    expect(EXPLAINERS.squares([4, 9, 16, 25])).toBe(36);
    expect(EXPLAINERS.multiplyAdd([1, 3, 7, 15])).toBe(31);
    expect(EXPLAINERS.alternate([5, 8, 6, 9, 7])).toBe(10);
    expect(EXPLAINERS.interleaved([1, 20, 3, 17, 5, 14])).toBe(7);
    expect(EXPLAINERS.add([1, 2, 4])).toBeNull();
  });

  test.each([1, 2, 3] as const)('complexity %i: one right option, no distractor explained by a simple rule', (k) => {
    const { accepted } = pipe.generate(15, { complexity: k }, BigInt(k * 100), undefined, 3000);
    expect(accepted.length).toBe(15);
    for (const a of accepted) {
      const p = a.puzzle;
      expect(new Set(p.options).size).toBe(4);
      const explained = predictions(p.terms, k + 1);
      expect(explained.has(p.options[p.answer])).toBe(true);
      p.options.forEach((v, i) => { if (i !== p.answer) expect(explained.has(v)).toBe(false); });
      expect(f.validate(p, { selected: p.answer, ruledOut: [] }).kind).toBe('correct');
    }
  });

  test('the prototype puzzle is accepted by the rules', () => {
    const p = { terms: [3, 5, 9, 17, 33], options: [49, 65, 66, 50], answer: 1, rule: { kind: 'addDoubling' as const, a: 2, b: 0 } };
    expect(f.solve(p, 2).solutionCount).toBe(1);
  });
});

describe('scales', () => {
  const f = new ScalesFamily();
  const pipe = new CandidatePipeline(f);

  test.each([2, 3, 4] as const)('%i unknowns: unique answer, every balance needed, human-solvable', (n) => {
    const { accepted } = pipe.generate(6, { unknowns: n, maxWeight: n === 4 ? 16 : 20, knownWeights: 1 }, BigInt(n), undefined, 4000);
    expect(accepted.length).toBe(6);
    for (const a of accepted) {
      const p = a.puzzle;
      expect(assignments(p, 3).length).toBe(1);
      p.balances.forEach((_, i) => expect(assignments({ ...p, balances: p.balances.filter((__, j) => j !== i) }, 2).length).toBeGreaterThan(1));
      expect(a.report.humanSolvable).toBe(true);
      const ans = f.answer(p)!;
      expect(f.validate(p, { entry: String(ans) }).kind).toBe('correct');
      expect(f.validate(p, { entry: String(ans + 1) }).kind).toBe('invalid');
      expect(f.hint(p, { entry: '' }, HintLevel.Whisper)).not.toBeNull();
    }
  });

  test('bad data is refused', () => {
    expect(f.parse({ shapes: ['circle'], balances: [{ left: [{ shape: 3 }], right: [{ weight: 2 }] }], question: 0, maxWeight: 9 })).toBeNull();
    expect(f.parse(null)).toBeNull();
  });
});
