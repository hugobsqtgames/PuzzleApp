import { SeededRNG } from '../puzzlekit/rng';
import { HintLevel } from '../puzzlekit/types';
import { addDays, dayKey, dayKeyIn, daysBetween, fromOrdinal, isoWeekday, ordinal, parseDayKey } from '../game/dayKey';
import { DailyPlanner, StreakKeeper } from '../game/daily';
import { GameEngine, STANDARD_ECONOMY as E } from '../game/engine';
import { Progression, lightsToOpenNextRoom } from '../game/progression';
import { GameState, WalletError, cloneState, credit, debit, decodeState, encodeState, newDailyState, newGameState, newWallet } from '../game/state';
import { duplicatePuzzleIDs, worldLanterns } from '../game/world';
import { FIXTURE_WORLD } from './fixtures';

const rec = (paidHints = 0) => ({ solvedAt: '2026-09-29T12:00:00.000Z', paidHints, wrongAnswers: 0, usedSolution: false });
const solving = (ids: string[]) => { const s = newGameState(); ids.forEach((id) => s.solved.set(id, rec())); return s; };
const utcKeeper = () => new StreakKeeper(undefined, (d) => dayKeyIn(d, 'UTC'));

describe('Dates', () => {
  test('numéro de jour : aller-retour, dates connues, bissextiles', () => {
    expect(ordinal('1970-01-01')).toBe(0);
    expect(ordinal('2000-03-01')).toBe(11017);
    for (let z = -2000; z < 28000; z += 7) expect(ordinal(fromOrdinal(z))).toBe(z);
    expect(isoWeekday('2026-09-29')).toBe(2);
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(parseDayKey('2026-02-30')).toBeNull();
    expect(parseDayKey('2100-02-29')).toBeNull();
    expect(parseDayKey('2000-02-29')).not.toBeNull();
    expect(() => dayKey(2026, 4, 31)).toThrow();
  });
  test.each(['Europe/Paris', 'America/New_York', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Kathmandu', 'Australia/Lord_Howe', 'America/St_Johns', 'UTC'])(
    'jour local cohérent autour de minuit et des changements d’heure (%s)', (tz) => {
      const rng = new SeededRNG(BigInt(tz.length));
      const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      for (let i = 0; i < 800; i++) {
        const t = new Date(1767225600000 + rng.below(24 * 365 * 4) * 3600000 + rng.int(-90, 90) * 1000);
        expect(dayKeyIn(t, tz)).toBe(fmt.format(t));
      }
    });
});

describe('Progression', () => {
  const p = new Progression(FIXTURE_WORLD);
  test('monde de 1 000 lanternes sans doublon', () => {
    expect(worldLanterns(FIXTURE_WORLD)).toHaveLength(1000);
    expect(duplicatePuzzleIDs(FIXTURE_WORLD)).toEqual([]);
  });
  test('salle suivante à 60 % arrondi au supérieur', () => {
    expect([lightsToOpenNextRoom(10), lightsToOpenNextRoom(6), lightsToOpenNextRoom(9)]).toEqual([6, 4, 6]);
    expect(p.playableLanterns(newGameState()).map((l) => l.puzzle)).toEqual([1, 2, 3, 4, 5, 6].map((i) => `phare.b1.r1.${i}`));
  });
  test('Bibliothèque à 14 lumières, clé à 30 avec chaque salle à 60 %', () => {
    const phare = FIXTURE_WORLD.districts[0].buildings[0].rooms.flatMap((r) => r.lanterns.map((l) => l.puzzle));
    const biblio = FIXTURE_WORLD.districts[1];
    expect(p.isDistrictUnlocked(biblio, p.totalLights(solving(phare.slice(0, 13))), 0)).toBe(false);
    expect(p.isDistrictUnlocked(biblio, p.totalLights(solving(phare.slice(0, 14))), 0)).toBe(true);
    const b = biblio.buildings[0], ids = b.rooms.flatMap((r) => r.lanterns.map((l) => l.puzzle));
    expect(p.isKeystoneOpen(b, solving(ids.slice(0, 29)))).toBe(false);
    // 30 lights, but the last room is still dark: its digit is not shown yet.
    expect(p.isKeystoneOpen(b, solving(ids.slice(0, 30)))).toBe(false);
    const spread = b.rooms.flatMap((r, i) => r.lanterns.slice(0, i < 3 ? 8 : 6).map((l) => l.puzzle));
    expect(spread).toHaveLength(30);
    expect(p.isKeystoneOpen(b, solving(spread))).toBe(true);
  });
  test.each([0, 1, 2, 3])('jamais bloqué : partie simulée complète (graine %i)', (seed) => {
    const rng = new SeededRNG(BigInt(seed));
    const s = newGameState();
    let solved = 0;
    for (;;) {
      const open = p.playableUnsolved(s);
      expect(open.length).toBeGreaterThanOrEqual(Math.min(3, 1000 - solved));
      if (!open.length) break;
      const pick = rng.chance(2, 3) ? p.recommended(s)! : rng.pick(open);
      s.solved.set(pick.puzzle, rec());
      s.lastPuzzle = pick.puzzle;
      solved++;
    }
    expect(solved).toBe(1000);
  });
  test('« Continuer » reste dans le bâtiment en cours', () => {
    const s = newGameState();
    FIXTURE_WORLD.districts[0].buildings[0].rooms.flatMap((r) => r.lanterns).slice(0, -1).forEach((l) => s.solved.set(l.puzzle, rec()));
    for (const l of FIXTURE_WORLD.districts[1].buildings[0].rooms[0].lanterns) { s.solved.set(l.puzzle, rec()); s.lastPuzzle = l.puzzle; }
    expect(p.recommended(s)!.puzzle.startsWith('biblio.b1.r2')).toBe(true);
  });
});

describe('Économie et moteur', () => {
  const engine = new GameEngine(FIXTURE_WORLD);
  test('portefeuille idempotent, jamais négatif, sans dépassement', () => {
    const w = newWallet();
    expect(credit(w, 10, 'a')).toBe(true);
    expect(credit(w, 10, 'a')).toBe(false);
    expect(() => debit(w, 15, 'b')).toThrow(WalletError);
    expect(debit(w, 4, 'c')).toBe(true);
    expect([w.balance, w.earned, w.spent]).toEqual([6, 10, 4]);
    credit(w, Number.MAX_SAFE_INTEGER - 10, 'big');
    expect(() => credit(w, 100, 'over')).toThrow(WalletError);
  });
  test('récompenses, Clairvoyance, double résolution sans effet', () => {
    const s = newGameState();
    // The first lantern of the fixture is a Lueur (tier 1); a clean solve earns half again.
    const base = E.tierRewards[1], bonus = Math.floor((base * E.clairvoyancePercent) / 100);
    expect(engine.puzzleSolved('phare.b1.r1.1', rec(), s)).toEqual([{ kind: 'lanternLit', puzzle: 'phare.b1.r1.1', shards: base, clairvoyanceBonus: bonus }]);
    expect(engine.puzzleSolved('phare.b1.r1.1', rec(), s)).toEqual([]);
    expect(s.wallet.balance).toBe(base + bonus);
  });
  test('lanterne verrouillée ou inconnue refusée', () => {
    const s = newGameState();
    expect(engine.puzzleSolved('obs.b4.key', rec(), s)).toEqual([]);
    expect(engine.puzzleSolved('inconnue', rec(), s)).toEqual([]);
    expect(s.wallet.balance).toBe(0);
  });
  test('Phare complet : bonus uniques, Bibliothèque annoncée', () => {
    const s = newGameState();
    const all = FIXTURE_WORLD.districts[0].buildings[0].rooms.flatMap((r) => r.lanterns).flatMap((l) => engine.puzzleSolved(l.puzzle, rec(1), s));
    expect(all.filter((c) => c.kind === 'roomCompleted')).toHaveLength(4);
    expect(all.filter((c) => c.kind === 'buildingCompleted')).toHaveLength(1);
    expect(all.filter((c) => c.kind === 'districtCompleted')).toHaveLength(1);
    expect(all).toContainEqual({ kind: 'districtUnlocked', districtID: 'biblio' });
    expect(s.wallet.balance).toBe(24 * E.tierRewards[1] + 4 * E.roomBonus + E.buildingBonus + E.districtBonus);
  });
  test('indice acheté une fois par étape', () => {
    const s = newGameState();
    const [, lead, insight] = engine.economy.hintCosts;
    credit(s.wallet, lead + 7, 'seed');
    expect(engine.buyHint(HintLevel.Whisper, 'p', 0, s)).toEqual({ kind: 'granted', cost: 0 });
    expect(engine.buyHint(HintLevel.Lead, 'p', 0, s)).toEqual({ kind: 'granted', cost: lead });
    expect(engine.buyHint(HintLevel.Lead, 'p', 0, s)).toEqual({ kind: 'alreadyOwned' });
    expect(engine.buyHint(HintLevel.Insight, 'p', 0, s)).toEqual({ kind: 'insufficientBalance', missing: insight - 7 });
  });
});

describe('Défi du jour et série', () => {
  const fams = ['sequences', 'lamps', 'locks', 'gears', 'marquetry', 'liars', 'inquiries', 'scales', 'patterns', 'thread', 'switches', 'mirrors'];
  test('déterministe, dépend de la langue', () => {
    const a = new DailyPlanner(fams, 'fr', 1), b = new DailyPlanner(fams, 'fr', 1);
    expect(a.assignment('2026-09-29')).toEqual(b.assignment('2026-09-29'));
    expect(a.assignment('2026-09-29').seed).not.toBe(new DailyPlanner(fams, 'en', 1).assignment('2026-09-29').seed);
  });
  test.each([3, 5, 12])('écart garanti respecté sur 5 ans (%i familles)', (n) => {
    const p = new DailyPlanner(fams.slice(0, n), 'fr', 1);
    const last = new Map<string, number>();
    for (let o = 0; o < 365 * 5; o++) {
      const f = p.assignment(addDays('2025-12-01', o)).family;
      if (last.has(f)) expect(o - last.get(f)!).toBeGreaterThanOrEqual(p.guaranteedGap);
      last.set(f, o);
    }
    if (n === 12) expect(p.guaranteedGap).toBe(5);
  });
  test('familles en double dédoublonnées', () => expect(new DailyPlanner(['a', 'a', 'b'], 'fr', 1).families).toEqual(['a', 'b']));
  test('palier selon le jour', () => {
    const p = new DailyPlanner(fams, 'fr', 1);
    expect([p.assignment('2026-09-28').tier, p.assignment('2026-10-02').tier, p.assignment('2026-10-04').tier]).toEqual([1, 3, 4]);
  });
  const run = (offsets: number[], nightlights = 0) => {
    const k = utcKeeper(), s = newDailyState();
    s.nightlights = nightlights;
    const results = offsets.map((o) => k.complete(addDays('2026-09-01', o), addDays('2026-09-01', o), false, s));
    return { s, results };
  };
  test('série, veilleuses (max 2), trou couvert ou non', () => {
    expect(run([...Array(21).keys()]).s).toMatchObject({ streak: 21, nightlights: 2 });
    expect(run([0, 1, 3], 1).results[2]).toEqual({ kind: 'streakContinued', streak: 3, nightlightsUsed: 1, nightlightEarned: false });
    const broken = run([0, 1, 2, 5]);
    expect(broken.results[3]).toEqual({ kind: 'streakRestarted' });
    expect(broken.s).toMatchObject({ streak: 1, bestStreak: 3 });
    expect(run([0, 0]).results[1]).toEqual({ kind: 'alreadyDone' });
  });
  test('horloge reculée, rattrapage, grâce de minuit', () => {
    const k = utcKeeper(), s = newDailyState();
    k.complete('2026-09-06', '2026-09-06', false, s);
    expect(k.complete('2026-09-03', '2026-09-03', false, s)).toEqual({ kind: 'recordedWithoutStreakChange' });
    const c = newDailyState();
    expect(k.complete('2026-09-01', '2026-09-08', true, c)).toEqual({ kind: 'caughtUp' });
    expect(k.complete('2026-08-31', '2026-09-08', true, c)).toEqual({ kind: 'catchUpTooOld' });
    const start = new Date(Date.UTC(2026, 8, 29, 23, 30));
    expect(k.creditedDay('2026-09-29', start, new Date(start.getTime() + 3600e3))).toEqual({ day: '2026-09-29', isCatchUp: false });
    expect(k.creditedDay('2026-09-29', start, new Date(start.getTime() + 3 * 3600e3))).toEqual({ day: '2026-09-29', isCatchUp: true });
  });
  test('défi dans le moteur : une récompense par date, spam sans effet', () => {
    const engine = new GameEngine(FIXTURE_WORLD, undefined, utcKeeper());
    const s = newGameState();
    const noon = new Date(Date.UTC(2026, 8, 29, 12));
    for (let i = 0; i < 20; i++) engine.dailySolved('2026-09-29', noon, noon, s);
    // The reward, plus the streak bonus of a first evening.
    expect(s.wallet.balance).toBe(E.dailyReward + 1);
    expect(s.daily.streak).toBe(1);
  });
});

describe('Sauvegarde : décodage tolérant', () => {
  test('une entrée abîmée ne fait perdre qu’elle-même', () => {
    const s = decodeState({
      solved: { a: rec(), b: { solvedAt: 'PAS UNE DATE' } },
      wallet: { balance: 120, earned: 120, spent: 0, appliedTransactions: ['x', 42] },
      daily: { completedDays: ['2026-09-28', '2026-02-30'], streak: 9, bestStreak: 9, nightlights: 1 },
      collectibles: ['ok', 7],
    });
    expect([...s.solved.keys()]).toEqual(['a']);
    expect(s.wallet.balance).toBe(120);
    expect([...s.wallet.appliedTransactions]).toEqual(['x']);
    expect(s.daily.streak).toBe(9);
    expect([...s.daily.completedDays]).toEqual(['2026-09-28']);
    expect([...s.collectibles]).toEqual(['ok']);
  });
  test('valeurs négatives ramenées à zéro', () => {
    const s = decodeState({ wallet: { balance: -50 }, daily: { streak: -4, nightlights: -2 } });
    expect([s.wallet.balance, s.daily.streak, s.daily.nightlights]).toEqual([0, 0, 0]);
  });
  test('aller-retour exact', () => {
    const s = newGameState();
    s.solved.set('x', rec(2)); credit(s.wallet, 7, 't'); s.daily.completedDays.add('2026-09-29'); s.equippedCosmetics.set('hat', 'bonnet'); s.onboardingDone = true;
    expect(encodeState(decodeState(JSON.parse(JSON.stringify(encodeState(s)))))).toEqual(encodeState(s));
  });
});

describe('Fuzz (bugs rares)', () => {
  test('20 000 opérations de série : invariants', () => {
    const rng = new SeededRNG(11n), k = utcKeeper(), s = newDailyState();
    let today = 0;
    for (let i = 0; i < 20000; i++) {
      today += rng.pick([0, 1, 1, 1, 2, 3, -1, 40, -40]);
      const day = addDays('2026-09-01', today + rng.pick([0, 0, 0, -1, -3, 1]));
      k.complete(day, addDays('2026-09-01', today), rng.chance(1, 6), s);
      expect(s.streak).toBeGreaterThanOrEqual(0);
      expect(s.bestStreak).toBeGreaterThanOrEqual(s.streak);
      expect(s.nightlights).toBeLessThanOrEqual(2);
      expect(s.streak).toBeLessThanOrEqual(s.completedDays.size);
      for (const d of s.catchUpDays) expect(s.completedDays.has(d)).toBe(false);
    }
  });
  test.each([0, 1, 2])('moteur : 2 000 actions aléatoires avec allers-retours de sauvegarde (graine %i)', (seed) => {
    const rng = new SeededRNG(BigInt(seed)), engine = new GameEngine(FIXTURE_WORLD, undefined, utcKeeper());
    const all = worldLanterns(FIXTURE_WORLD);
    let s: GameState = newGameState(), now = Date.UTC(2026, 8, 29, 12);
    for (let i = 0; i < 2000; i++) {
      const r = rng.below(6);
      if (r <= 1) { const open = engine.progression.playableUnsolved(s); if (open.length) engine.puzzleSolved(rng.pick(open).puzzle, rec(rng.below(2)), s); }
      else if (r === 2) engine.puzzleSolved(rng.pick(all).puzzle, rec(), s);
      else if (r === 3) engine.buyHint(rng.pick([1, 2, 3, 4]), rng.pick(all).puzzle, rng.below(3), s);
      else if (r === 4) { now += rng.int(-3, 4) * 86400e3 + rng.below(3600) * 1000; const d = new Date(now); engine.dailySolved(dayKeyIn(d, 'UTC'), d, d, s); }
      else { const copy = decodeState(JSON.parse(JSON.stringify(encodeState(s)))); expect(encodeState(copy)).toEqual(encodeState(s)); s = copy; }
      expect(s.wallet.balance).toBeGreaterThanOrEqual(0);
      expect(s.wallet.balance).toBe(s.wallet.earned - s.wallet.spent);
    }
    expect(daysBetween('2026-09-30', '2026-09-29')).toBe(1);
    expect(cloneState(s)).toEqual(s);
  });
});
