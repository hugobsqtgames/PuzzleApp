import { CODES, FAMILIES, WORLD, dailyPuzzle, dailyRange, puzzleFor } from '../../game/catalog';
import { canSubmit, giveHint, hintAvailable, hintCost, isComplete, play, redo, startSession, submit, undo } from '../../game/session';
import { reminderDates } from '../../game/reminders';
import { worldLanterns, regularLanterns } from '../game/world';
import { GameEngine } from '../game/engine';
import { newGameState } from '../game/state';
import { SeededRNG } from '../puzzlekit/rng';
import { HintLevel } from '../puzzlekit/types';
import { DISTRICT_INFO } from '../../content/vesper';

const lanterns = worldLanterns(WORLD);

describe('content pack', () => {
  test('1 000 lanterns, unique ids, the structure of GAME_DESIGN § 2', () => {
    expect(lanterns.length).toBe(1000);
    expect(new Set(lanterns.map((l) => l.puzzle)).size).toBe(1000);
    const ids = WORLD.districts.map((d) => d.id);
    expect(ids).toEqual(['phare', 'biblio', 'horlo', 'serre', 'marche', 'theatre', 'obs', 'grenier']);
    for (const d of WORLD.districts.slice(1, 7)) {
      expect(d.buildings.length).toBe(4);
      for (const b of d.buildings) {
        expect(b.rooms.map((r) => r.lanterns.length)).toEqual([10, 10, 10, 9]);
        expect(b.keystone).toBeDefined();
      }
      expect(d.buildings[3].keystoneGivesLetter).toBe(true);
    }
  });

  test('every lantern has a valid puzzle of its family and tier', () => {
    for (const l of lanterns) {
      const p = puzzleFor(l.puzzle);
      expect(p).not.toBeNull();
      expect(p!.code).toBe(l.family);
      expect(p!.tier).toBe(l.tier);
    }
  });

  test('a sample of puzzles is solvable (unique when required) and not already solved', () => {
    const rng = new SeededRNG(5n);
    const sample = rng.shuffled(lanterns).slice(0, 80);
    for (const l of sample) {
      const p = puzzleFor(l.puzzle)!;
      const e = FAMILIES[p.code].engine;
      const report = e.solve(p.data, 2);
      if (e.requiresUniqueSolution) expect(report.solutionCount).toBe(1);
      expect(e.validate(p.data, e.stateApplying(report.solutions[0], p.data)).kind).toBe('correct');
      expect(e.validate(p.data, e.initialState(p.data)).kind).not.toBe('correct');
    }
  });

  test('the mockup room keeps its puzzles', () => {
    const room = WORLD.districts[2].buildings[0].rooms[1];
    expect(room.id).toBe('horlo.b1.r2');
    expect(room.lanterns.map((l) => l.family)).toEqual(['IN', 'SU', 'EN', 'CA', 'SU', 'LA', 'EN', 'IN', 'CA', 'LA']);
    expect((puzzleFor('horlo.b1.r2.9')!.data as { clues: unknown[] }).clues.length).toBe(5);
    expect((puzzleFor('horlo.b1.r2.10')!.data as { layout: string[] }).layout[1]).toBe('..3...');
  });

  test('names exist for every district, building and room', () => {
    for (const d of WORLD.districts) {
      const info = DISTRICT_INFO.find((x) => x.id === d.id)!;
      expect(info.buildings.length).toBe(d.buildings.length);
      d.buildings.forEach((b, i) => expect(info.buildings[i].rooms.length).toBe(b.rooms.length));
    }
  });

  test('daily puzzles exist for every prepared day and beyond', () => {
    expect(dailyPuzzle(dailyRange.first)).not.toBeNull();
    expect(dailyPuzzle('2026-09-29')!.code).toBe('BA');
    expect(dailyPuzzle(dailyRange.last)).not.toBeNull();
    const later = dailyPuzzle('2030-02-03');
    expect(later).not.toBeNull();
    expect(dailyPuzzle('2030-02-03')).toBe(later);
  });

  test('never blocked: playing any open lantern always leads to the end', () => {
    for (const seed of [1n, 2n]) {
      const e = new GameEngine(WORLD), s = newGameState(), rng = new SeededRNG(seed);
      let guard = 0;
      while (guard++ < 1100) {
        const open = e.progression.playableUnsolved(s);
        if (open.length === 0) break;
        // Keep at least 3 choices while the game is not over (GAME_DESIGN § 3); the Phare's last
        // lanterns are the exception: the Bibliothèque waits for the whole Phare to be lit.
        const phareEnd = s.solved.size >= 22 && s.solved.size < 24;
        if (s.solved.size < 990 && !phareEnd) expect(open.length).toBeGreaterThanOrEqual(3);
        const l = rng.pick(open);
        e.puzzleSolved(l.puzzle, { solvedAt: new Date().toISOString(), paidHints: 0, wrongAnswers: 0, usedSolution: false }, s);
      }
      expect(s.solved.size).toBe(1000);
      expect(s.collectibles.size).toBe(101);
      expect(regularLanterns(WORLD.districts[7].buildings[0]).every((l) => s.solved.has(l.puzzle))).toBe(true);
    }
  });
});

describe('sessions on real puzzles', () => {
  const now = new Date('2026-09-29T20:00:00');
  test.each(CODES)('%s: hints lead to a solved puzzle', (code) => {
    const l = lanterns.find((x) => x.family === code && x.tier >= 2)!;
    let s = startSession(puzzleFor(l.puzzle)!, 'lantern', now);
    for (let guard = 0; guard < 30; guard++) {
      if (isComplete(s)) break;
      if (FAMILIES[code].answer && canSubmit(s) && submit(s).correct) break;
      if (!hintAvailable(s, HintLevel.Solution)) break;
      const next = giveHint(s, HintLevel.Solution, 20);
      expect(next).not.toBeNull();
      s = next!;
    }
    expect(s.usedSolution).toBe(true);
    if (FAMILIES[code].answer) expect(submit(s).correct).toBe(true);
    else expect(isComplete(s)).toBe(true);
  });

  test('undo / redo and hint steps', () => {
    const p = puzzleFor(lanterns.find((x) => x.family === 'EN')!.puzzle)!;
    const e = FAMILIES.EN.engine as import('../families/gears').GearsFamily;
    let s = startSession(p, 'lantern', now);
    const s0 = s.state;
    s = play(s, e.rotate(p.data as never, s.state, 0));
    expect(undo(s).state).toEqual(s0);
    expect(redo(undo(s)).state).toEqual(s.state);
    // Any level can be taken at once, never twice for the same position.
    expect(hintAvailable(s, HintLevel.Lead)).toBe(true);
    s = giveHint(s, HintLevel.Whisper, 0)!;
    expect(hintAvailable(s, HintLevel.Whisper)).toBe(false);
    expect(hintAvailable(s, HintLevel.Lead)).toBe(true);
    s = play(s, e.rotate(p.data as never, s.state, 1));
    expect(hintAvailable(s, HintLevel.Whisper)).toBe(true); // moved on: next deduction starts over
  });

  test('three free Murmures per puzzle, then they cost a little', () => {
    const p = puzzleFor(lanterns.find((x) => x.family === 'EN')!.puzzle)!;
    const e = FAMILIES.EN.engine as any;
    let s = startSession(p, 'lantern', now);
    for (let k = 0; k < 3; k++) {
      expect(hintCost(s, HintLevel.Whisper)).toBe(0);
      s = giveHint(s, HintLevel.Whisper, 0)!;
      s = play(s, e.rotate(p.data as never, s.state, k + 1));
    }
    expect(hintCost(s, HintLevel.Whisper)).toBe(3);
    expect(s.paidHints).toBe(0);
    s = giveHint(s, HintLevel.Whisper, 3)!;
    expect(s.paidHints).toBe(1); // a paid Murmure costs the Clairvoyance bonus, like any paid hint
  });

  test('wrong answers are explained and counted', () => {
    const l = lanterns.find((x) => x.family === 'CA')!;
    let s = startSession(puzzleFor(l.puzzle)!, 'lantern', now);
    const r = submit(s); // 0 0 0: repeated digits
    expect(r.correct).toBe(false);
    expect(r.session.wrongAnswers).toBe(1);
    expect(r.session.error!.text.length).toBeGreaterThan(10);
  });
});

describe('reminders', () => {
  const plan = { enabled: true, hour: 19, minute: 30, doneToday: false, streak: 0 };
  test('next three evenings, today only if not done and not passed', () => {
    const d = reminderDates(plan, new Date('2026-09-29T10:00:00'));
    expect(d.map((x) => x.getDate())).toEqual([29, 30, 1]);
    expect(reminderDates({ ...plan, doneToday: true }, new Date('2026-09-29T10:00:00')).map((x) => x.getDate())).toEqual([30, 1, 2]);
    expect(reminderDates(plan, new Date('2026-09-29T21:00:00')).map((x) => x.getDate())).toEqual([30, 1, 2]);
    expect(reminderDates({ ...plan, enabled: false }, new Date())).toEqual([]);
  });
});
