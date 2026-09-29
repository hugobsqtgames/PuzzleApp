import { CandidatePipeline } from '../puzzlekit/pipeline';
import { SeededRNG } from '../puzzlekit/rng';
import { HintLevel, PuzzleFamily } from '../puzzlekit/types';
import { PatternsFamily, impliedAnswer, ATTRIBUTES } from '../families/patterns';
import { LiarsFamily, worlds, statementText, CHARACTERS } from '../families/liars';
import { ThreadsFamily } from '../families/threads';
import { MirrorsFamily, trace } from '../families/mirrors';
import { InquiriesFamily, tables, clueText } from '../families/inquiries';
import { MarquetryFamily, SILHOUETTES } from '../families/marquetry';

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

contract('patterns (2 attributes)', new PatternsFamily(), { active: 2 }, 12, 2000);
contract('patterns (3 attributes, distribution)', new PatternsFamily(), { active: 3, distribution: true }, 8, 4000);
contract('liars (4)', new LiarsFamily(), { characters: 4, kinds: ['liar', 'honest', 'atLeastOneLiar', 'exactlyLiars'] }, 10, 3000);
contract('liars (6)', new LiarsFamily(), { characters: 6, kinds: ['liar', 'honest', 'exactlyLiars', 'same', 'different', 'ifThen'] }, 6, 6000);
contract('threads 5×5', new ThreadsFamily(), { rows: 5, columns: 5, wallPercent: 30 }, 8, 200);
contract('mirrors 6×6', new MirrorsFamily(), { rows: 6, columns: 6, mirrors: 3, targets: 3, obstaclePercent: 12 }, 8, 6000);
contract('inquiries 4', new InquiriesFamily(), { size: 4, kinds: ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'objectNotAt'] }, 6, 300);
contract('marquetry', new MarquetryFamily(), { silhouettes: Object.keys(SILHOUETTES), pieceSize: [3, 5] }, 8, 800);

describe('family specifics', () => {
  test('patterns: the answer is the only option matching every rule', () => {
    const f = new PatternsFamily();
    const a = new CandidatePipeline(f).generate(10, { active: 3, distribution: true }, 5n, undefined, 4000).accepted;
    for (const x of a) {
      const implied = impliedAnswer(x.puzzle.cells)!;
      x.puzzle.options.forEach((o, i) => expect(ATTRIBUTES.every((k) => o[k] === implied[k])).toBe(i === x.puzzle.answer));
    }
  });

  test('liars: exactly one consistent world, readable statements', () => {
    const f = new LiarsFamily();
    const a = new CandidatePipeline(f).generate(5, { characters: 5, kinds: ['liar', 'honest', 'same', 'ifThen', 'exactlyLiars'] }, 3n, undefined, 6000).accepted;
    for (const x of a) {
      expect(worlds(x.puzzle, 3).length).toBe(1);
      for (const st of x.puzzle.statements) expect(statementText(st, (i) => CHARACTERS[x.puzzle.names[i]], 5)).toMatch(/^[A-ZÀ-Ü].*\.$/);
    }
  });

  test('threads: tapping extends and cuts the thread', () => {
    const f = new ThreadsFamily();
    const p = new CandidatePipeline(f).generate(1, { rows: 4, columns: 4, wallPercent: 0 }, 1n, undefined, 200).accepted[0].puzzle;
    let s = f.initialState(p);
    const sol = f.solve(p, 1).solutions[0];
    for (const x of sol.slice(1)) s = f.touch(p, s, x);
    expect(f.validate(p, s).kind).toBe('correct');
    s = f.touch(p, s, sol[3]);
    expect(s.path).toEqual(sol.slice(0, 4));
  });

  test('mirrors: the solution lights every target, fewer mirrors do not', () => {
    const f = new MirrorsFamily();
    const a = new CandidatePipeline(f).generate(5, { rows: 6, columns: 6, mirrors: 3, targets: 3, obstaclePercent: 10 }, 8n, undefined, 6000).accepted;
    for (const x of a) {
      const sol = x.report.solutions[0];
      const hits = trace(x.puzzle, sol).hits;
      [...x.puzzle.cells].forEach((ch, i) => { if (ch === 'T') expect(hits.has(i)).toBe(true); });
      expect(f.validate(x.puzzle, { marks: Array(36).fill(0) }).kind).toBe('incomplete');
    }
  });

  test('inquiries: every clue is necessary and reads as a sentence', () => {
    const f = new InquiriesFamily();
    const a = new CandidatePipeline(f).generate(4, { size: 4, kinds: ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'either'] }, 4n, undefined, 300).accepted;
    for (const x of a) {
      x.puzzle.clues.forEach((_, i) => expect(tables(4, x.puzzle.clues.filter((__, j) => j !== i), 2).length).toBeGreaterThan(1));
      for (const c of x.puzzle.clues) expect(clueText(c, x.puzzle)).toMatch(/^[A-ZÀ-Ü].*\.$/);
    }
  });

  test('marquetry: pieces cover the silhouette exactly', () => {
    const f = new MarquetryFamily();
    const a = new CandidatePipeline(f).generate(5, { silhouettes: Object.keys(SILHOUETTES), pieceSize: [3, 5] }, 2n, undefined, 800).accepted;
    for (const x of a) {
      const area = x.puzzle.mask.join('').split('').filter((c) => c === '#').length;
      expect(x.puzzle.pieces.reduce((s, p) => s + p.length, 0)).toBe(area);
      expect(f.place(x.puzzle, f.initialState(x.puzzle), 0, 0, 0, -5, -5)).toBeNull();
    }
  });

  test('seeded rng sanity for the suite', () => { expect(new SeededRNG(1n).below(10)).toBe(new SeededRNG(1n).below(10)); });
});
