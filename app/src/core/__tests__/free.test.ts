// Mode Libre: every family met can be made on the phone, at every difficulty offered, quickly.
import { FREE_CODES, freeTiers, makeFreePuzzle } from '../../game/free';
import { FAMILIES } from '../../game/catalog';
import { startSession, giveHint, hintAvailable, hintCost, isComplete, canSubmit, submit } from '../../game/session';
import { HintLevel } from '../puzzlekit/types';

const cases = FREE_CODES.flatMap((c) => freeTiers(c).map((t) => [c, t] as const));

test.each(cases)('%s palier %i : prête à temps, et les indices la résolvent (gratuits)', async (code, tier) => {
  const t0 = Date.now();
  const p = await new Promise<ReturnType<typeof import('../../game/free').freePuzzle>>((done) => { makeFreePuzzle(code, tier, done); });
  const ms = Date.now() - t0;
  expect(p).not.toBeNull();
  // After 5 s the game hands over one of its own puzzles: never a long wait (margin for a loaded test machine).
  expect(ms).toBeLessThan(9000);
  let s = startSession(p!, 'free', new Date());
  expect(hintCost(s, HintLevel.Solution)).toBe(0);
  for (let guard = 0; guard < 40; guard++) {
    if (isComplete(s)) break;
    if (FAMILIES[code].answer && canSubmit(s) && submit(s).correct) break;
    if (!hintAvailable(s, HintLevel.Solution)) break;
    s = giveHint(s, HintLevel.Solution, 0)!;
  }
  if (FAMILIES[code].answer) expect(submit(s).correct).toBe(true);
  else expect(isComplete(s)).toBe(true);
}, 15000);
