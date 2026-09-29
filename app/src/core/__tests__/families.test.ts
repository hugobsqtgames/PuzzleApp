import { CandidatePipeline } from '../puzzlekit/pipeline';
import { SeededRNG, StableHash } from '../puzzlekit/rng';
import { HINT_LEVELS, HintLevel, LocalizedTemplate, Tier, TierThresholds, tierKey } from '../puzzlekit/types';
import { canonicalGrid, ALL_SYMMETRIES, source } from '../puzzlekit/grid';
import { SwitchesFamily, SwitchesPuzzle, moveCount } from '../families/switches';
import { LocksFamily, LocksPuzzle, lockScore } from '../families/locks';
import { LampMark, LampsBoard, LampsFamily, LampsPuzzle } from '../families/lamps';
import fr from '../../../../Content/strings/core.fr.json';
import en from '../../../../Content/strings/core.en.json';

const switches = new SwitchesFamily(), locks = new LocksFamily(), lamps = new LampsFamily();
const lampsProto: LampsPuzzle = { layout: ['.X..XX', '..3...', 'XXXX..', '..XX2X', '...X..', 'X2..X.'] };
const lampsProtoSolution = [0, 2, 7, 9, 16, 18, 25, 28, 32, 35];
const lockProto: LocksPuzzle = { length: 3, alphabet: 10, allowsRepeats: false, clues: [
  { guess: [2, 6, 1], wellPlaced: 0, misplaced: 1 }, { guess: [3, 4, 9], wellPlaced: 0, misplaced: 2 }, { guess: [9, 7, 6], wellPlaced: 0, misplaced: 1 },
  { guess: [3, 4, 7], wellPlaced: 0, misplaced: 1 }, { guess: [1, 8, 5], wellPlaced: 0, misplaced: 0 }] };
const pressed = (presses: number[], rows = 3, columns = 3): SwitchesPuzzle => {
  const all: SwitchesPuzzle = { rows, columns, pattern: 'cross', initiallyLit: Array(rows * columns).fill(true) };
  let s = switches.initialState(all);
  for (const p of presses) s = switches.press(p, s, all);
  return { ...all, initiallyLit: s.lit };
};

describe('Socle', () => {
  test('aléatoire : bornes, intervalle unitaire, mélange = permutation', () => {
    const rng = new SeededRNG(7n);
    const seen = new Set<number>();
    for (let i = 0; i < 3000; i++) { const v = rng.below(7); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(7); seen.add(v); }
    expect(seen.size).toBe(7);
    expect(rng.int(5, 5)).toBe(5);
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(new SeededRNG(1n).shuffled(items)).toEqual(new SeededRNG(1n).shuffled(items));
    expect(new SeededRNG(1n).shuffled(items).sort((a, b) => a - b)).toEqual(items);
  });
  test.each([[0, Tier.Spark], [15, Tier.Glow], [30, Tier.Flame], [50, Tier.Blaze], [70, Tier.Beacon], [85, Tier.Star]])('seuil %i → palier %i', (s, t) => {
    expect(TierThresholds.standard.tier(s)).toBe(t);
  });
  test('seuils incohérents refusés', () => {
    expect(() => new TierThresholds([50, 40, 30, 20, 10])).toThrow();
    expect(() => new TierThresholds([1, 2, 3])).toThrow();
  });
  test('forme canonique invariante par symétrie', () => {
    const g = ['ab.', '..c', 'd..'].map((r) => r.split(''));
    const ref = canonicalGrid(3, 3, (r, c) => g[r][c]);
    for (const sym of ALL_SYMMETRIES) {
      const t = [0, 1, 2].map((r) => [0, 1, 2].map((c) => { const [sr, sc] = source(sym, r, c, 3, 3); return g[sr][sc]; }));
      expect(canonicalGrid(3, 3, (r, c) => t[r][c])).toBe(ref);
    }
  });
});

describe('Interrupteurs', () => {
  test('puzzle de la maquette : 3 coups, solution unique', () => {
    const p = pressed([0, 5, 7]);
    const r = switches.solve(p, 2);
    expect(r.solutionCount).toBe(1);
    expect(moveCount(r.solutions[0])).toBe(3);
  });
  test('noyaux connus : 3×3 → 0, 4×4 → 4, 5×5 → 2', () => {
    expect(switches.nullity(pressed([], 3, 3))).toBe(0);
    expect(switches.nullity(pressed([], 4, 4))).toBe(4);
    expect(switches.nullity(pressed([], 5, 5))).toBe(2);
  });
  test('minimum GF(2) = force brute sur 30 puzzles 3×4', () => {
    for (let seed = 0; seed < 30; seed++) {
      const p = switches.generate({ rows: 3, columns: 4, pattern: (['cross', 'diagonal', 'ring'] as const)[seed % 3], presses: [1, 8] }, new SeededRNG(BigInt(seed)));
      if (!p) continue;
      let best = Infinity;
      for (let combo = 0; combo < 1 << 12; combo++) {
        let s = switches.initialState(p);
        for (let i = 0; i < 12; i++) if (combo & (1 << i)) s = switches.press(i, s, p);
        if (s.lit.every(Boolean)) best = Math.min(best, (combo.toString(2).match(/1/g) ?? []).length);
      }
      expect(moveCount(switches.minimalSolution(p, p.initiallyLit)!)).toBe(best);
    }
  });
  test('chaque Éclairage rapproche d’un coup', () => {
    const p = pressed([1, 4, 8, 11], 4, 4);
    let s = switches.initialState(p);
    let remaining = moveCount(switches.minimalSolution(p, s.lit)!);
    while (remaining > 0) {
      s = switches.hint(p, s, HintLevel.Insight)!.resultingState!;
      const now = moveCount(switches.minimalSolution(p, s.lit)!);
      expect(now).toBe(remaining - 1);
      remaining = now;
    }
    expect(switches.validate(p, s).kind).toBe('correct');
  });
  test('tutoriel 2×2 = Étincelle', () => {
    const p = pressed([0], 2, 2);
    expect(switches.thresholds.tier(switches.rate(p, switches.solve(p, 2)))).toBe(Tier.Spark);
  });
});

describe('Cadenas', () => {
  test('score', () => {
    expect(lockScore([4, 9, 2], [3, 4, 9])).toEqual([0, 2]);
    expect(lockScore([1, 1, 2], [1, 2, 1])).toEqual([1, 2]);
    expect(lockScore([1, 2, 3], [1, 1, 1])).toEqual([1, 0]);
  });
  test('cadenas de la maquette : 4 9 2, Flamme', () => {
    const r = locks.solve(lockProto, 2);
    expect(r.solutionCount).toBe(1);
    expect(r.solutions[0]).toEqual([4, 9, 2]);
    expect(locks.thresholds.tier(locks.rate(lockProto, r))).toBe(Tier.Flame);
  });
  test('erreur précise : ligne 3 4 9', () => {
    const v = locks.validate(lockProto, { symbols: [3, 9, 2], crossedOut: [] });
    expect(v).toEqual({ kind: 'invalid', issues: [{ cells: [{ row: 1, column: 0 }], message: { key: 'locks.error.clue', args: ['3 9 2', '3 4 9', '1', '1', '0', '2'] } }] });
  });
  test('indices : chaque indice généré est nécessaire', () => {
    for (let seed = 0; seed < 25; seed++) {
      const p = locks.generate({ clueCount: [3, 7] }, new SeededRNG(BigInt(seed)));
      if (!p) continue;
      expect(locks.solve(p, 2).solutionCount).toBe(1);
      p.clues.forEach((_, i) => expect(locks.solve({ ...p, clues: p.clues.filter((__, j) => j !== i) }, 2).solutionCount).toBeGreaterThan(1));
    }
  });
});

describe('Lampes', () => {
  test('grille de la maquette : solution unique identique au Python et au Swift', () => {
    const r = lamps.solve(lampsProto, 2);
    expect(r.solutionCount).toBe(1);
    expect(r.solutions[0].lamps).toEqual(lampsProtoSolution);
    expect(r.humanSolvable).toBe(true);
  });
  test('une lampe posée sur un mur ne valide jamais une grille', () => {
    const p: LampsPuzzle = { layout: ['...', '.1X', '...'] };
    const s = lamps.initialState(p);
    s.marks[5] = LampMark.Lamp; s.marks[0] = LampMark.Lamp; s.marks[8] = LampMark.Lamp;
    expect(lamps.validate(p, s).kind).not.toBe('correct');
  });
  test('chaîne d’Éclairages : converge sur 20 grilles', () => {
    const pipe = new CandidatePipeline(lamps);
    for (let seed = 0; seed < 20; seed++) {
      const o = pipe.evaluate({ rows: 6, columns: 6 }, BigInt(1000 + seed));
      if (!('accepted' in o)) continue;
      const p = o.accepted.puzzle;
      let s = lamps.initialState(p), steps = 0;
      while (lamps.validate(p, s).kind !== 'correct') {
        s = lamps.hint(p, s, HintLevel.Insight)!.resultingState!;
        expect(++steps).toBeLessThan(72);
      }
    }
  });
  test('révélation progressive', () => {
    const b = new LampsBoard(lampsProto), s = lamps.initialState(lampsProto), sol = new Set(lampsProtoSolution);
    expect(lamps.revealHint(b, s, sol, HintLevel.Whisper)!.focus).toHaveLength(6);
    expect(lamps.revealHint(b, s, sol, HintLevel.Lead)!.focus).toHaveLength(11);
    expect(lamps.revealHint(b, s, sol, HintLevel.Insight)!.focus).toEqual([{ row: 0, column: 0 }]);
  });
});

describe('Robustesse (audit)', () => {
  test('données malformées refusées sans crash', () => {
    expect(switches.parse({ rows: 3, columns: 3, pattern: 'cross', initiallyLit: [true] })).toBeNull();
    expect(switches.parse({ rows: -3, columns: -3, pattern: 'cross', initiallyLit: Array(9).fill(true) })).toBeNull();
    expect(locks.parse({ length: 3, alphabet: 10, allowsRepeats: false, clues: [{ guess: [1, 2], wellPlaced: 0, misplaced: 0 }] })).toBeNull();
    expect(locks.parse({ length: 8, alphabet: 36, allowsRepeats: true, clues: [] })).toBeNull();
    expect(lamps.parse({ layout: ['...', '..'] })).toBeNull();
    expect(lamps.parse({ layout: ['..9'] })).toBeNull();
    expect(lamps.parse(null)).toBeNull();
    expect(locks.parse(JSON.parse(JSON.stringify(lockProto)))).toEqual(lockProto);
  });
  test('paramètres absurdes → null', () => {
    const rng = new SeededRNG(1n);
    expect(switches.generate({ rows: 3, columns: 3, presses: [-4, -2] }, rng)).toBeNull();
    expect(switches.generate({ rows: 0, columns: 5, presses: [1, 3] }, rng)).toBeNull();
    expect(locks.generate({ length: 9, alphabet: 36, allowsRepeats: true }, rng)).toBeNull();
    expect(locks.generate({ length: 4, alphabet: 3 }, rng)).toBeNull();
  });
  test('états de taille incohérente : aucune opération ne plante', () => {
    const sw = pressed([4]);
    for (const level of HINT_LEVELS) {
      expect(switches.hint(sw, { lit: [true], moves: 0 }, level)).toBeNull();
      expect(locks.hint(lockProto, { symbols: [4], crossedOut: [] }, level)).toBeNull();
      expect(lamps.hint(lampsProto, { marks: [LampMark.Lamp] }, level)).toBeNull();
    }
    expect(switches.press(99, { lit: [true], moves: 0 }, sw)).toEqual({ lit: [true], moves: 0 });
    expect(lamps.validate(lampsProto, { marks: [] }).kind).toBe('incomplete');
    expect(locks.validate(lockProto, { symbols: [4, 9, 2, 1], crossedOut: [] }).kind).toBe('incomplete');
  });
});

describe('Localisation', () => {
  const catalogs: Record<string, Record<string, string>> = { fr, en };
  test('mêmes clés dans les deux langues', () => expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort()));
  test('chaque texte émis existe en FR et EN avec le bon nombre de paramètres', () => {
    const out: LocalizedTemplate[] = [0, 1, 2, 3, 4, 5].map((t) => ({ key: tierKey(t), args: [] }));
    const collect = <P, S, Pa, So>(f: { hint: (p: P, s: S, l: HintLevel) => { text: LocalizedTemplate; resultingState?: S } | null; initialState: (p: P) => S }, pipe: CandidatePipeline<P, S, Pa, So>, params: Pa, seeds: number) => {
      for (let seed = 0; seed < seeds; seed++) {
        const o = pipe.evaluate(params, BigInt(seed));
        if (!('accepted' in o)) continue;
        out.push(...o.accepted.report.trace.map((s) => s.explanation));
        let s = f.initialState(o.accepted.puzzle);
        for (let i = 0; i < 60; i++) {
          for (const l of HINT_LEVELS) { const h = f.hint(o.accepted.puzzle, s, l); if (h) out.push(h.text); }
          const next = f.hint(o.accepted.puzzle, s, HintLevel.Insight)?.resultingState;
          if (!next) break;
          s = next;
        }
      }
    };
    collect(switches, new CandidatePipeline(switches), { rows: 3, columns: 3, presses: [2, 5] as [number, number] }, 10);
    collect(locks, new CandidatePipeline(locks), {}, 15);
    collect(lamps, new CandidatePipeline(lamps), { rows: 6, columns: 6 }, 40);
    const v = locks.validate(lockProto, { symbols: [3, 3, 2], crossedOut: [] });
    if (v.kind === 'invalid') out.push(...v.issues.map((i) => i.message));
    const w = lamps.validate({ layout: ['...', '.1.', '...'] }, { marks: [1, 1, 0, 1, 0, 0, 0, 0, 0] });
    if (w.kind === 'invalid') out.push(...w.issues.map((i) => i.message));
    const b = new LampsBoard(lampsProto);
    for (const l of HINT_LEVELS) { const h = lamps.revealHint(b, lamps.initialState(lampsProto), new Set([0, 2]), l); if (h) out.push(h.text); }
    expect(out.length).toBeGreaterThan(100);
    for (const lang of ['fr', 'en']) {
      for (const t of out) {
        const text = catalogs[lang][t.key];
        expect(text).toBeDefined();
        const holes = new Set([...(text ?? '').matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])));
        expect([...holes].sort()).toEqual(t.args.map((_, i) => i));
      }
    }
  });
});
