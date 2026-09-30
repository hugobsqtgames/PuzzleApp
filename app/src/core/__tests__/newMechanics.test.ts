import { CandidatePipeline } from '../puzzlekit/pipeline';
import { HintLevel, PuzzleFamily } from '../puzzlekit/types';
import { ChimesFamily, toPlay } from '../families/chimes';
import { StainedFamily, assignments, shows } from '../families/stained';
import { SpotFamily, changed, diffAt } from '../families/spot';
import { ShelfFamily, holds, orders } from '../families/shelf';
import { ShadowsFamily, mirror, sameTurned } from '../families/shadows';
import { SealFamily, sealCode, sealDigit } from '../families/seal';
import { SequencesFamily, termText } from '../families/sequences';
import { SwitchesFamily } from '../families/switches';

/** Common contract: accepted puzzles are valid, hints reach a solved state, bad data is refused. */
function contract<P, S>(name: string, family: PuzzleFamily<P, S, any, any>, params: unknown, count: number, attempts: number) {
  describe(name, () => {
    const { accepted } = new CandidatePipeline(family).generate(count, params, 11n, undefined, attempts);

    test(`generates ${count} puzzles`, () => { expect(accepted.length).toBe(count); });

    test('solution is valid, unique when required, start is not solved', () => {
      for (const a of accepted) {
        if (family.requiresUniqueSolution) expect(a.report.solutionCount).toBe(1);
        expect(family.validate(a.puzzle, family.stateApplying(a.report.solutions[0], a.puzzle)).kind).toBe('correct');
        expect(family.validate(a.puzzle, family.initialState(a.puzzle)).kind).not.toBe('correct');
      }
    });

    test('hints (Insight, then Solution) always lead to a solved puzzle', () => {
      for (const a of accepted.slice(0, 4)) {
        let s = family.initialState(a.puzzle);
        for (let i = 0; i < 60 && family.validate(a.puzzle, s).kind !== 'correct'; i++) {
          expect(family.hint(a.puzzle, s, HintLevel.Whisper)).not.toBeNull();
          const h = family.hint(a.puzzle, s, i < 3 ? HintLevel.Insight : HintLevel.Solution)!;
          if (h.resultingState !== undefined) s = h.resultingState;
        }
        expect(family.validate(a.puzzle, s).kind).toBe('correct');
      }
    });

    test('round trip through parse, and bad data is refused', () => {
      for (const a of accepted.slice(0, 3)) {
        const again = family.parse(JSON.parse(JSON.stringify(a.puzzle)));
        expect(again).not.toBeNull();
        expect(family.equals(again!, a.puzzle)).toBe(true);
      }
      for (const raw of [null, 3, 'x', {}, { rows: -1 }]) expect(family.parse(raw)).toBeNull();
    });

    test('deterministic from the seed', () => {
      const a = new CandidatePipeline(family).generate(1, params, 99n, undefined, attempts).accepted[0];
      const b = new CandidatePipeline(family).generate(1, params, 99n, undefined, attempts).accepted[0];
      expect(family.fingerprint(a.puzzle)).toBe(family.fingerprint(b.puzzle));
    });
  });
}

contract('chimes', new ChimesFamily(), { bells: 4, length: [4, 7] }, 10, 100);
contract('stained 3×3', new StainedFamily(), { rows: 3, cols: 3 }, 10, 2000);
contract('stained 4×4', new StainedFamily(), { rows: 4, cols: 4 }, 6, 4000);
contract('spot', new SpotFamily(), { items: [10, 14], diffs: 5 }, 10, 2000);
contract('shelf 5', new ShelfFamily(), { n: 5 }, 10, 2000);
contract('shelf 6', new ShelfFamily(), { n: 6 }, 5, 3000);
contract('shadows', new ShadowsFamily(), { cells: [5, 6], options: 4 }, 10, 3000);
contract('shadows (near misses)', new ShadowsFamily(), { cells: [6, 7], options: 6, nearMisses: true }, 6, 6000);

// Variants: the same contract holds.
contract('chimes à rebours', new ChimesFamily(), { bells: 4, length: [4, 6], reverse: true }, 8, 100);
contract('shadows reflet', new ShadowsFamily(), { cells: [6, 6], options: 5, nearMisses: true, reflection: true }, 6, 6000);
contract('stained voilé', new StainedFamily(), { rows: 4, cols: 4, veiled: 3 }, 5, 4000);
contract('suites de lettres', new SequencesFamily(), { complexity: 1, letters: true }, 8, 4000);
contract('suites de lettres (k = 3)', new SequencesFamily(), { complexity: 3, letters: true }, 6, 4000);
contract('interrupteurs (huit voisines)', new SwitchesFamily(), { rows: 4, columns: 4, pattern: 'ring', presses: [4, 7] }, 6, 400);

describe('variants', () => {
  test('à rebours: the melody is played from its last note', () => {
    const f = new ChimesFamily();
    const p = { bells: 4, melody: [0, 1, 2, 3], reverse: true };
    expect(toPlay(p)).toEqual([3, 2, 1, 0]);
    expect(f.validate(p, { played: [3, 2, 1, 0] }).kind).toBe('correct');
    expect(f.validate(p, { played: [0] }).kind).toBe('invalid');
    expect(f.fingerprint(p)).not.toBe(f.fingerprint({ bells: 4, melody: [0, 1, 2, 3] }));
  });

  test('reflet: the right option is the mirror image, a plain turn is the trap', () => {
    const f = new ShadowsFamily();
    const { accepted } = new CandidatePipeline(f).generate(4, { cells: [5, 6], options: 4, reflection: true }, 5n, undefined, 3000);
    for (const a of accepted) {
      const p = a.puzzle;
      expect(sameTurned(mirror(p.shape), p.options[p.answer])).toBe(true);
      p.options.forEach((o, i) => { if (i !== p.answer) expect(sameTurned(mirror(p.shape), o)).toBe(false); });
      const trap = p.options.findIndex((o) => sameTurned(p.shape, o));
      if (trap >= 0) {
        const v = f.validate(p, { selected: trap, ruledOut: [] });
        expect(v.kind === 'invalid' && v.issues[0].message.key).toBe('shadows.wrong.unflipped');
      }
    }
  });

  test('vitres voilées: frosted panes never decide, and the answer stays unique', () => {
    const f = new StainedFamily();
    const { accepted } = new CandidatePipeline(f).generate(4, { rows: 4, cols: 4, veiled: 3 }, 9n, undefined, 4000);
    expect(accepted.length).toBe(4);
    for (const a of accepted) {
      const p = a.puzzle;
      expect(p.veiled).toHaveLength(3);
      expect(assignments(p, 2)).toHaveLength(1);
      // Without the veils the same filters still answer: the veils only hide.
      expect(assignments({ ...p, veiled: undefined }, 2)).toHaveLength(1);
      expect(p.veiled!.every((i) => !shows(p, i))).toBe(true);
    }
  });

  test('suites de lettres: terms stay between A and Z and read as letters', () => {
    const f = new SequencesFamily();
    const { accepted } = new CandidatePipeline(f).generate(6, { complexity: 2, letters: true }, 3n, undefined, 6000);
    for (const a of accepted) {
      expect([...a.puzzle.terms, ...a.puzzle.options].every((v) => v >= 1 && v <= 26)).toBe(true);
      expect(a.puzzle.terms.map((v) => termText(a.puzzle, v)).join('')).toMatch(/^[A-Z]+$/);
    }
    expect(termText({ letters: true }, 1)).toBe('A');
    expect(termText({}, 26)).toBe('26');
  });
});

describe('rules of the new families', () => {
  test('chimes: a wrong note is reported at its place, the right prefix is incomplete', () => {
    const f = new ChimesFamily(), p = { bells: 4, melody: [0, 2, 1, 3] };
    expect(f.validate(p, { played: [0, 2] }).kind).toBe('incomplete');
    const v = f.validate(p, { played: [0, 1] });
    expect(v.kind).toBe('invalid');
    expect(f.validate(p, { played: [0, 2, 1, 3] }).kind).toBe('correct');
  });
  test('stained: a pane is the mix of its row and its column', () => {
    const f = new StainedFamily();
    const p = { rows: 2, cols: 2, target: [3, 5, 6, 4], givenRows: [1, null], givenCols: [2, null] };
    expect(assignments(p, 5)).toEqual([{ rowF: [1, 4], colF: [2, 4] }]);
    expect(f.validate(p, { rowF: [1, 4], colF: [2, 4] }).kind).toBe('correct');
    expect(f.validate(p, { rowF: [1, 2], colF: [2, 0] }).kind).toBe('invalid');
  });
  test('spot: the second picture differs only where told, and taps find them', () => {
    const f = new SpotFamily();
    const p = new CandidatePipeline(f).generate(1, { items: [12, 12], diffs: 4 }, 5n, undefined, 500).accepted[0].puzzle;
    const b = changed(p);
    const differing = p.items.map((it, i) => JSON.stringify(it) !== JSON.stringify(b[i])).filter(Boolean).length;
    expect(differing).toBe(4);
    p.diffs.forEach((d, k) => expect(diffAt(p, p.items[d.i].x + 2, p.items[d.i].y - 2)).toBe(k));
  });
  test('shelf: clues and the only order', () => {
    expect(holds({ k: 'between', a: 1, b: 0, c: 2 }, [0, 1, 2])).toBe(true);
    expect(holds({ k: 'end', a: 1 }, [0, 1, 2])).toBe(false);
    const p = new CandidatePipeline(new ShelfFamily()).generate(1, { n: 5 }, 8n, undefined, 500).accepted[0].puzzle;
    expect(orders(5, p.clues, 5)).toHaveLength(1);
  });
  test('shadows: only one option is the shape turned; flipped ones are explained', () => {
    const f = new ShadowsFamily();
    const p = new CandidatePipeline(f).generate(1, { cells: [5, 5], options: 4 }, 3n, undefined, 500).accepted[0].puzzle;
    expect(p.options.filter((o) => sameTurned(p.shape, o))).toHaveLength(1);
    const flipped = p.options.findIndex((o) => sameTurned(o, mirror(p.shape)));
    const v = f.validate(p, { selected: flipped, ruledOut: [] });
    expect(v.kind === 'invalid' && v.issues[0].message.key).toBe('shadows.wrong.flipped');
  });
  test('seal: digits are stable, rules combine them, hints end on the code', () => {
    const f = new SealFamily();
    const rooms = ['horlo.b1.r1', 'horlo.b1.r2', 'horlo.b1.r3', 'horlo.b1.r4'];
    const d = rooms.map(sealDigit);
    expect(d.every((x) => x >= 1 && x <= 9)).toBe(true);
    expect(sealCode({ rooms, rule: 'up' })).toEqual(d);
    expect(sealCode({ rooms, rule: 'down' })).toEqual([...d].reverse());
    const sum = d.reduce((a, b) => a + b, 0);
    expect(sealCode({ rooms, rule: 'sum' })).toEqual([Math.floor(sum / 10), sum % 10]);
    expect(sealCode({ rooms, rule: 'pairs' })).toEqual([(d[0] + d[1]) % 10, (d[2] + d[3]) % 10]);
    const p = { rooms, rule: 'up' as const };
    const h = f.hint(p, f.initialState(p), HintLevel.Solution)!;
    expect(f.validate(p, h.resultingState!).kind).toBe('correct');
    expect(f.validate(p, f.initialState(p)).kind).toBe('invalid');
    expect(f.parse({ rooms, rule: 'nope' })).toBeNull();
  });
});
