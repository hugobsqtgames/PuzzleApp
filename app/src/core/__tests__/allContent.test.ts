// Every puzzle that ships, one by one (heavy: run with HEAVY=1 npx jest allContent).
// For each: it opens, its board validates without throwing, the Solution hint leads to a solved
// puzzle, and it is solvable by the family's solver (with a single answer when required).
import { FAMILIES, WORLD, dailyPuzzle, dailyRange, eventPuzzle, eventSize, puzzleFor, type PlayablePuzzle } from '../../game/catalog';
import { canSubmit, giveHint, hintAvailable, isComplete, startSession, submit } from '../../game/session';
import { HintLevel } from '../puzzlekit/types';
import { worldLanterns } from '../game/world';
import { addDays } from '../game/dayKey';

const run = process.env.HEAVY ? test : test.skip;
const now = new Date('2026-10-02T20:00:00');

function check(p: PlayablePuzzle): string | null {
  const fam = FAMILIES[p.code];
  try {
    let s = startSession(p, 'lantern', now);
    if (fam.engine.validate(p.data, s.state).kind === 'correct' && !fam.answer) return 'already solved at start';
    for (let guard = 0; guard < 40; guard++) {
      if (isComplete(s)) break;
      if (fam.answer && canSubmit(s) && submit(s).correct) break;
      if (!hintAvailable(s, HintLevel.Solution)) break;
      const next = giveHint(s, HintLevel.Solution, 20);
      if (!next) return 'no hint';
      s = next;
    }
    if (fam.answer ? !submit(s).correct : !isComplete(s)) return 'hints do not solve it';
    if (p.code !== 'SC') {
      const r = fam.engine.solve(p.data, 2);
      if (r.solutionCount < 1) return 'solver finds no answer';
      if (fam.engine.requiresUniqueSolution && r.solutionCount !== 1) return `not unique (${r.solutionCount})`;
    }
    return null;
  } catch (e) { return `throws: ${(e as Error).message}`; }
}

run('les 1 000 lanternes', () => {
  const bad: string[] = [];
  for (const l of worldLanterns(WORLD)) {
    const p = puzzleFor(l.puzzle);
    if (!p) { bad.push(`${l.puzzle}: missing`); continue; }
    const why = check(p);
    if (why) bad.push(`${l.puzzle} (${p.code}): ${why}`);
  }
  expect(bad).toEqual([]);
}, 3_600_000);

run('tous les défis du soir préparés', () => {
  const bad: string[] = [];
  let n = 0;
  for (let d = dailyRange.first; d <= dailyRange.last; d = addDays(d, 1)) {
    const p = dailyPuzzle(d);
    n++;
    if (!p) { bad.push(`${d}: missing`); continue; }
    const why = check(p);
    if (why) bad.push(`${d} (${p.code}): ${why}`);
  }
  expect(n).toBeGreaterThan(800);
  expect(bad).toEqual([]);
}, 3_600_000);

run('les énigmes des trois fêtes', () => {
  const bad: string[] = [];
  for (const id of ['lanternes', 'halloween', 'noel']) for (let n = 0; n < eventSize(id); n++) {
    const p = eventPuzzle(id, n);
    const why = p ? check(p) : 'missing';
    if (why) bad.push(`${id} ${n + 1}: ${why}`);
  }
  expect(bad).toEqual([]);
}, 600_000);
