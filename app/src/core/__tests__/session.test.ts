import { freshGame, PuzzleKind, REWARD } from '../../content/vesperDemo';
import {
  applySolution, buyHint, checkAuto, cycleLamp, finish, makePuzzle, pressSwitch, redo,
  rotateTile, turnWheel, undo, validateAnswer, chooseOption, typeKey,
} from '../../state/session';
import { decodeDemo, encodeDemo } from '../../state/demoSave';

describe('puzzle session', () => {
  test('the solution of every family is accepted', () => {
    for (const kind of ['EN', 'IN', 'LA', 'TUTO'] as PuzzleKind[]) {
      const p = makePuzzle(kind);
      expect(checkAuto(p)).toBe(false);
      expect(checkAuto(applySolution(p))).toBe(true);
    }
    for (const kind of ['CA', 'SU', 'BA'] as PuzzleKind[]) {
      expect(validateAnswer(applySolution(makePuzzle(kind))).ok).toBe(true);
    }
  });

  test('undo and redo restore boards exactly', () => {
    const p0 = makePuzzle('EN');
    const p1 = rotateTile(p0, 0, 0);
    const p2 = rotateTile(p1, 2, 3);
    const u = undo(p2);
    expect(u.rot).toEqual(p1.rot);
    expect(undo(u).rot).toEqual(p0.rot);
    expect(redo(u).rot).toEqual(p2.rot);
    const s = pressSwitch(makePuzzle('IN'), 1, 1);
    expect(undo(s).b).toEqual(makePuzzle('IN').b);
  });

  test('lamps cycle empty → lamp → dot and ignore walls', () => {
    let p = makePuzzle('LA');
    p = cycleLamp(p, 0, 0); expect(p.c[0][0]).toBe(1);
    p = cycleLamp(p, 0, 0); expect(p.c[0][0]).toBe(2);
    p = cycleLamp(p, 0, 0); expect(p.c[0][0]).toBe(0);
    expect(cycleLamp(p, 0, 1)).toBe(p); // wall
  });

  test('wrong answers explain themselves and count as errors', () => {
    let p = makePuzzle('CA');
    p = turnWheel(turnWheel(turnWheel(p, 0, 1), 1, 1), 2, -1); // 1 1 9
    let r = validateAnswer(p);
    expect(r.ok).toBe(false);
    expect(r.puzzle.err).toMatch(/différents/);
    p = { ...p, w: [3, 9, 2] };
    r = validateAnswer(p);
    expect(r.puzzle.err).toMatch(/^Avec 3 9 2, la ligne/);
    expect(r.puzzle.badClue).toBeGreaterThanOrEqual(0);
    expect(r.puzzle.errors).toBe(1);

    const s = validateAnswer(chooseOption(makePuzzle('SU'), 49));
    expect(s.puzzle.wrong).toEqual([49]);
    expect(s.puzzle.sel).toBeNull();

    const b = validateAnswer(typeKey(typeKey(makePuzzle('BA'), '1'), '2'));
    expect(b.ok).toBe(false);
    expect(b.puzzle.val).toBe('');
    expect(typeKey(typeKey(typeKey(typeKey(makePuzzle('BA'), '1'), '2'), '3'), '4').val).toBe('123');
  });

  test('rewards: once per lantern, Clairvoyance only without paid hints or errors', () => {
    const g = freshGame();
    const slot = g.room.findIndex((l) => !l.lit);
    const tier = g.room[slot].tier;
    const p = applySolution(makePuzzle(g.room[slot].family, { slot, tier }));
    const r1 = finish(g, p)!;
    expect(r1.last.reward).toBe(REWARD[tier]);
    expect(r1.last.bonus).toBe(Math.round(REWARD[tier] / 2));
    expect(r1.game.room[slot].lit).toBe(true);
    expect(r1.game.lights).toBe(g.lights + 1);
    expect(r1.game.shards).toBe(g.shards + REWARD[tier] + Math.round(REWARD[tier] / 2));
    // Same puzzle object again: nothing happens.
    expect(finish(r1.game, r1.puzzle)).toBeNull();
    // Replaying the lantern: no reward.
    const replay = finish(r1.game, makePuzzle(g.room[slot].family, { slot, tier }))!;
    expect(replay.last.replay).toBe(true);
    expect(replay.game.shards).toBe(r1.game.shards);
    expect(replay.game.lights).toBe(r1.game.lights);

    // A paid hint (Piste) removes the bonus, the free Murmure does not.
    const withMurmure = { ...makePuzzle('EN', { slot, tier }), hl: 1 };
    expect(finish(g, withMurmure)!.last.bonus).toBeGreaterThan(0);
    const withPiste = { ...makePuzzle('EN', { slot, tier }), hl: 2 };
    expect(finish(g, withPiste)!.last.bonus).toBe(0);
  });

  test('hints cost 0 / 5 / 10 / 20 and the last one solves the puzzle', () => {
    let p = makePuzzle('LA');
    const costs: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = buyHint(p, 1000)!;
      costs.push(r.cost);
      p = r.puzzle;
    }
    expect(costs).toEqual([0, 5, 10, 20]);
    expect(p.usedSolution).toBe(true);
    expect(checkAuto(p)).toBe(true);
    expect(buyHint(p, 1000)).toBeNull();
    expect(buyHint({ ...makePuzzle('LA'), hl: 1 }, 4)).toBeNull(); // cannot afford 5
    const g = freshGame();
    expect(finish(g, { ...p, slot: 9, tier: 2 })!.last.bonus).toBe(0);
  });

  test('daily: rewarded once, streak grows', () => {
    const g = freshGame();
    const r = finish(g, applySolution(makePuzzle('BA')), '2026-09-29')!;
    expect(r.game.dailyDone).toBe(true);
    expect(r.game.dailyDay).toBe('2026-09-29');
    expect(r.game.streak).toBe(g.streak + 1);
    const again = finish(r.game, applySolution(makePuzzle('BA')), '2026-09-29')!;
    expect(again.game.streak).toBe(r.game.streak);
    expect(again.game.shards).toBe(r.game.shards);
  });
});

describe('demo save', () => {
  test('round trip', () => {
    const g = { ...freshGame(), shards: 999, dailyDone: true, dailyDay: '2026-09-29' };
    g.room = g.room.map((l, i) => (i === 7 ? { ...l, lit: true } : l));
    expect(decodeDemo(encodeDemo(g), '2026-09-29')).toEqual({ ...g, justLit: -1 });
  });

  test('the daily flag only holds for its own day', () => {
    const g = { ...freshGame(), dailyDone: true, dailyDay: '2026-09-29' };
    expect(decodeDemo(encodeDemo(g), '2026-09-30')!.dailyDone).toBe(false);
  });

  test('corruption is detected, never turned into progress', () => {
    const text = encodeDemo({ ...freshGame(), shards: 10 });
    for (let i = 0; i < text.length; i++) {
      const bad = text.slice(0, i) + (text[i] === 'a' ? 'b' : 'a') + text.slice(i + 1);
      const d = decodeDemo(bad);
      if (d) expect(d).toEqual(decodeDemo(text)); // only harmless edits (e.g. whitespace) may pass
    }
    expect(decodeDemo('')).toBeNull();
    expect(decodeDemo('{"v":2,"sum":"x","body":"{}"}')).toBeNull();
  });

  test('bad fields fall back to defaults instead of wiping the save', () => {
    const body = JSON.stringify({ lights: -5, shards: 50, streak: 'x', room: [{ family: 'IN', lit: true }] });
    const { checksum } = jest.requireActual('../game/state') as typeof import('../game/state');
    const d = decodeDemo(JSON.stringify({ v: 1, sum: checksum(body), body }))!;
    const f = freshGame();
    expect(d.shards).toBe(50);
    expect(d.lights).toBe(f.lights);
    expect(d.streak).toBe(f.streak);
    expect(d.room).toEqual(f.room);
  });
});
