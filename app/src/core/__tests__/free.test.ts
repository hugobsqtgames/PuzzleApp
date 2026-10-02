// Mode Libre: every family met can be made on the phone, at every difficulty offered, quickly.
import { FREE_CODES, FROM_THE_GAME, freeTiers, makeFreePuzzle } from '../../game/free';
import { CandidatePipeline } from '../puzzlekit/pipeline';
import { StableHash } from '../puzzlekit/rng';
import { FORGE_PARAMS } from '../content/forgeParams';
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

// The phone's screen freezes while one try runs: every family made on the phone must keep each
// try short (the slow ones come from the game's own puzzles, see FROM_THE_GAME).
test('aucune grille préparée sur le téléphone ne bloque l’écran (chaque essai reste court)', () => {
  const slow: string[] = [];
  for (const code of FREE_CODES) for (const tier of freeTiers(code)) {
    if (FROM_THE_GAME[code]?.includes(tier)) continue;
    const pipe = new CandidatePipeline(FAMILIES[code].engine as never);
    const list = FORGE_PARAMS[code][tier];
    const timed = (i: number) => {
      const t = Date.now();
      pipe.evaluate(list[i % list.length] as never, StableHash.seed('freeze', code, String(tier), String(i)));
      return Date.now() - t;
    };
    for (let i = 0; i < 25; i++) {
      // A try is the same work every time: a slow one is timed again, so that a cold start or a
      // busy test machine is not taken for a grid that freezes the phone.
      const ms = timed(i);
      if (ms > 1000 && timed(i) > 1000) { slow.push(`${code} ${tier}: ${ms} ms`); break; }
    }
  }
  expect(slow).toEqual([]);
}, 600000);

test('les familles trop lentes viennent tout de suite des énigmes du jeu', async () => {
  for (const [code, tiers] of Object.entries(FROM_THE_GAME)) for (const tier of tiers!) {
    const t0 = Date.now();
    const p = await new Promise<ReturnType<typeof import('../../game/free').freePuzzle>>((done) => { makeFreePuzzle(code as never, tier, done); });
    expect(p).not.toBeNull();
    expect(p!.code).toBe(code);
    expect(Date.now() - t0).toBeLessThan(500);
  }
});
