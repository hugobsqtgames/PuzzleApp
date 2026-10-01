// Constellations, the family that arrives after the shipped content: made on the phone (mode Libre).
import { ConstellationsFamily, nextStep, solveConstellations } from '../families/constellations';
import { CandidatePipeline } from '../puzzlekit/pipeline';
import { HintLevel } from '../puzzlekit/types';
import { FORGE_PARAMS } from '../content/forgeParams';
import { FREE_CODES } from '../../game/free';

const f = new ConstellationsFamily();
const pipe = new CandidatePipeline(f);

function make(n: number, from = 0) {
  for (let i = from; i < from + 400; i++) {
    const o = pipe.evaluate({ n }, BigInt(i));
    if ('accepted' in o) return o.accepted.puzzle;
  }
  throw new Error(`nothing made at ${n}`);
}

test('dans le mode Libre, à chaque difficulté', () => {
  expect(FREE_CODES).toContain('CO');
  expect(FORGE_PARAMS.CO.every((l) => l.length)).toBe(true);
});

test.each([5, 6, 7, 8, 9, 10])('%i de côté : une seule réponse, une étoile par ligne, colonne et constellation', (n) => {
  const p = make(n);
  const sols = solveConstellations(p, 2).solutions;
  expect(sols).toHaveLength(1);
  const [sol] = sols;
  expect(new Set(sol.map((i) => Math.floor(i / n))).size).toBe(n);
  expect(new Set(sol.map((i) => i % n)).size).toBe(n);
  expect(new Set(sol.map((i) => p.regions[i])).size).toBe(n);
  expect(f.validate(p, f.stateApplying(sol, p)).kind).toBe('correct');
});

test.each([5, 6, 7, 8])('%i de côté : les indices Révélation mènent à la solution, sans jamais se tromper', (n) => {
  for (const from of [0, 1000, 2000]) {
    const p = make(n, from);
    let s = f.initialState(p);
    for (let guard = 0; guard < 200 && f.validate(p, s).kind !== 'correct'; guard++) {
      const h = f.hint(p, s, HintLevel.Insight);
      expect(h?.resultingState).toBeDefined();
      s = h!.resultingState!;
      expect(f.validate(p, s).kind).not.toBe('invalid');
    }
    expect(f.validate(p, s).kind).toBe('correct');
  }
});

test('les erreurs sont nommées', () => {
  const p = make(6);
  const s = f.initialState(p);
  s.cells[0] = 1; s.cells[7] = 1;
  expect(f.validate(p, s)).toMatchObject({ kind: 'invalid', issues: [{ message: { key: 'constellations.error.touch' } }] });
  const t = f.initialState(p);
  t.cells[0] = 1; t.cells[3] = 1;
  expect(f.validate(p, t)).toMatchObject({ kind: 'invalid', issues: [{ message: { key: 'constellations.error.row' } }] });
  expect(f.hint(p, t, HintLevel.Lead)?.text.key).toBe('constellations.hint.mistake');
});

test('une grille abîmée est refusée, jamais de plantage', () => {
  const p = make(5);
  expect(f.parse(p)).toEqual(p);
  for (const bad of [null, {}, { n: 5 }, { n: 5, regions: [1, 2] }, { n: 3, regions: Array(9).fill(0) }, { n: 5, regions: Array(25).fill(0) }, { n: 5, regions: p.regions.map(() => 7) }]) expect(f.parse(bad)).toBeNull();
});

test('chaque déduction est juste : jamais une étoile retirée, jamais une étoile de trop', () => {
  for (const n of [5, 6, 7, 8, 9]) for (let k = 0; k < 12; k++) {
    const p = make(n, k * 500);
    const sol = new Set(solveConstellations(p, 1).solutions[0]);
    const star = new Array(n * n).fill(false), open = new Array(n * n).fill(true);
    for (let guard = 0; guard < 400; guard++) {
      const st = nextStep(p, star, open);
      if (!st) break;
      if (st.place !== undefined) { expect(sol.has(st.place)).toBe(true); star[st.place] = true; open[st.place] = false; }
      for (const i of st.remove ?? []) { expect(sol.has(i)).toBe(false); open[i] = false; }
    }
  }
});
