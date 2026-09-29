// Puzzle session logic of the prototype (makePuzzle, actions, finish), as pure
// functions over plain data so screens stay thin and everything is testable.

import {
  GEARS, gearsInitial, gearsState, rotateMask,
  switchesInitial, tutorialInitial, toggleCross, allOn,
  LOCK, checkLock,
  LAMPS, lampsInitial, lampsState,
  SEQUENCE, SCALES,
} from '../content/prototypePuzzles';
import { DemoGame, FamilyCode, PuzzleKind, HINT_COST, REWARD } from '../content/vesperDemo';

export const ANSWER_KINDS: PuzzleKind[] = ['CA', 'SU', 'BA'];

interface Board { rot?: number[][]; b?: number[][]; c?: number[][] }

export interface Puzzle {
  kind: PuzzleKind;
  family: FamilyCode;
  tier: number;
  slot: number | null;
  daily: boolean;
  tuto: boolean;
  hl: number;            // hint level reached: 0 none … 4 solution
  errors: number;
  moves: number;
  err: string | null;
  badClue: number;
  solved: boolean;
  usedSolution: boolean;
  history: string[];
  future: string[];
  rot: number[][];       // gears
  b: number[][];         // switches / tutorial
  c: number[][];         // lamps marks
  w: number[];           // lock wheels
  sel: number | null;    // sequence option
  wrong: number[];       // sequence options ruled out
  val: string;           // scales answer
}

export function makePuzzle(kind: PuzzleKind, extra: Partial<Puzzle> = {}): Puzzle {
  const tier = kind === 'TUTO' ? 0 : kind === 'EN' || kind === 'IN' || kind === 'SU' ? 1 : 2;
  return {
    kind, family: kind === 'TUTO' ? 'IN' : kind, tier, slot: null, daily: kind === 'BA', tuto: kind === 'TUTO',
    hl: 0, errors: 0, moves: 0, err: null, badClue: -1, solved: false, usedSolution: false, history: [], future: [],
    rot: kind === 'EN' ? gearsInitial() : [],
    b: kind === 'IN' ? switchesInitial() : kind === 'TUTO' ? tutorialInitial() : [],
    c: kind === 'LA' ? lampsInitial() : [],
    w: [0, 0, 0], sel: null, wrong: [], val: '',
    ...extra,
  };
}

const snap = (p: Puzzle) => JSON.stringify({ rot: p.rot, b: p.b, c: p.c } satisfies Board);
function restore(p: Puzzle, s: string): Puzzle {
  const o = JSON.parse(s) as Board;
  return { ...p, rot: o.rot ?? p.rot, b: o.b ?? p.b, c: o.c ?? p.c };
}
const withHistory = (p: Puzzle): Puzzle => ({ ...p, history: [...p.history, snap(p)], future: [], err: null });

export function rotateTile(p: Puzzle, r: number, c: number): Puzzle {
  const q = withHistory(p);
  const rot = q.rot.map((row) => [...row]);
  rot[r][c] = rotateMask(rot[r][c], 1);
  return { ...q, rot, moves: q.moves + 1 };
}

export function pressSwitch(p: Puzzle, r: number, c: number): Puzzle {
  const q = withHistory(p);
  const b = q.b.map((row) => [...row]);
  toggleCross(b, r, c);
  return { ...q, b, moves: q.moves + 1 };
}

/** Empty → lamp → dot → empty. */
export function cycleLamp(p: Puzzle, r: number, c: number): Puzzle {
  if (LAMPS.grid[r][c] !== '.') return p;
  const q = withHistory(p);
  const m = q.c.map((row) => [...row]);
  m[r][c] = (m[r][c] + 1) % 3;
  return { ...q, c: m };
}

export function turnWheel(p: Puzzle, i: number, d: 1 | -1): Puzzle {
  const w = [...p.w];
  w[i] = (w[i] + d + 10) % 10;
  return { ...p, w, err: null, badClue: -1 };
}

export const chooseOption = (p: Puzzle, v: number): Puzzle => ({ ...p, sel: v, err: null });

export function typeKey(p: Puzzle, k: string): Puzzle {
  if (k === '⌫') return { ...p, val: p.val.slice(0, -1), err: null };
  if (k === 'C') return { ...p, val: '', err: null };
  return { ...p, val: p.val.length < 3 ? p.val + k : p.val, err: null };
}

export function undo(p: Puzzle): Puzzle {
  if (!p.history.length) return p;
  const prev = p.history[p.history.length - 1];
  return { ...restore(p, prev), history: p.history.slice(0, -1), future: [...p.future, snap(p)], err: null };
}

export function redo(p: Puzzle): Puzzle {
  if (!p.future.length) return p;
  const next = p.future[p.future.length - 1];
  return { ...restore(p, next), future: p.future.slice(0, -1), history: [...p.history, snap(p)] };
}

/** Solved by manipulation (families without an answer to submit). */
export function checkAuto(p: Puzzle): boolean {
  if (p.kind === 'EN') return gearsState(p.rot).ok;
  if (p.kind === 'IN' || p.kind === 'TUTO') return allOn(p.b);
  if (p.kind === 'LA') return lampsState(p.c).ok;
  return false;
}

export function fmtPegs(w: number, m: number): string {
  if (!w && !m) return 'aucun chiffre juste';
  const a: string[] = [];
  if (w) a.push(`${w} bien placé${w > 1 ? 's' : ''}`);
  if (m) a.push(`${m} mal placé${m > 1 ? 's' : ''}`);
  return a.join(' et ');
}

export function canValidate(p: Puzzle): boolean {
  return p.kind === 'CA' || (p.kind === 'SU' && p.sel != null) || (p.kind === 'BA' && p.val !== '');
}

/** Validates an answer family. Returns the updated puzzle and whether it is right. */
export function validateAnswer(p: Puzzle): { puzzle: Puzzle; ok: boolean } {
  if (p.kind === 'CA') {
    const g = p.w.join('');
    const res = checkLock(g);
    if (res.kind === 'solved') return { puzzle: p, ok: true };
    if (res.kind === 'repeatedDigits') return { puzzle: { ...p, err: 'Les trois chiffres du code sont tous différents.', badClue: -1, errors: p.errors + 1 }, ok: false };
    const clue = LOCK.clues[res.clue][0];
    const err = `Avec ${g.split('').join(' ')}, la ligne ${clue.split('').join(' ')} donnerait ${fmtPegs(...res.got)}, au lieu de ${fmtPegs(...res.expected)}.`;
    return { puzzle: { ...p, err, badClue: res.clue, errors: p.errors + 1 }, ok: false };
  }
  if (p.kind === 'SU') {
    if (p.sel === SEQUENCE.answer) return { puzzle: p, ok: true };
    return { puzzle: { ...p, wrong: p.sel != null ? [...p.wrong, p.sel] : p.wrong, sel: null, err: 'Pas celle-ci. Regarde comment évoluent les écarts.', errors: p.errors + 1 }, ok: false };
  }
  if (p.kind === 'BA') {
    if (Number(p.val) === SCALES.answer) return { puzzle: p, ok: true };
    return { puzzle: { ...p, err: `${p.val || '?'} ne tient pas l’équilibre. Vérifie la balance 2.`, val: '', errors: p.errors + 1 }, ok: false };
  }
  return { puzzle: p, ok: false };
}

export function applySolution(p: Puzzle): Puzzle {
  const q = withHistory(p);
  switch (p.kind) {
    case 'EN': return { ...q, rot: GEARS.solution.map((r) => [...r]) };
    case 'IN': case 'TUTO': return { ...q, b: q.b.map((r) => r.map(() => 1)) };
    case 'CA': return { ...q, w: LOCK.code.split('').map(Number) };
    case 'LA': {
      const c = lampsInitial();
      for (const [r, cc] of LAMPS.solution) c[r][cc] = 1;
      return { ...q, c };
    }
    case 'SU': return { ...q, sel: SEQUENCE.answer };
    case 'BA': return { ...q, val: String(SCALES.answer) };
  }
}

/** Buys the next hint level. Level 4 applies the solution. */
export function buyHint(p: Puzzle, shards: number): { puzzle: Puzzle; cost: number } | null {
  if (p.hl >= 4 || p.solved) return null;
  const cost = HINT_COST[p.hl];
  if (shards < cost) return null;
  const q = { ...p, hl: p.hl + 1 };
  return { puzzle: q.hl === 4 ? { ...applySolution(q), usedSolution: true } : q, cost };
}

export interface LastResult {
  family: FamilyCode;
  tier: number;
  reward: number;
  bonus: number;
  slot: number | null;
  daily: boolean;
  tuto: boolean;
  moves: number;
  usedSolution: boolean;
  replay: boolean;
}

/**
 * Ends a puzzle. Idempotent per puzzle (`solved`), and rewards are given only
 * once per lantern and once per daily puzzle (audit fixes of the prototype).
 */
export function finish(game: DemoGame, p: Puzzle, today = ''): { game: DemoGame; puzzle: Puzzle; last: LastResult } | null {
  if (p.solved) return null;
  const alreadyLit = p.slot != null && game.room[p.slot].lit;
  const dailyAlready = p.daily && game.dailyDone;
  const rewarded = !alreadyLit && !dailyAlready && !p.tuto;
  // Clairvoyance: no paid hint (the free Murmure is fine), no wrong answer.
  const bonus = rewarded && !p.usedSolution && p.hl <= 1 && p.errors === 0 ? Math.round(REWARD[p.tier] / 2) : 0;
  const reward = rewarded ? REWARD[p.tier] : 0;
  let g: DemoGame = { ...game, shards: game.shards + reward + bonus };
  if (p.slot != null && !alreadyLit) {
    g = { ...g, room: g.room.map((l, i) => (i === p.slot ? { ...l, lit: true } : l)), lights: g.lights + 1, justLit: p.slot };
  }
  if (p.daily && !dailyAlready) {
    const streak = g.streak + 1;
    g = { ...g, dailyDone: true, dailyDay: today, streak, best: Math.max(g.best, streak), shards: g.shards + 15 + Math.min(10, streak) };
  }
  const last: LastResult = {
    family: p.family, tier: p.tier, reward, bonus, slot: p.slot, daily: p.daily, tuto: p.tuto,
    moves: p.moves, usedSolution: p.usedSolution, replay: !rewarded && !p.tuto,
  };
  return { game: g, puzzle: { ...p, solved: true }, last };
}

export function hintText(p: Puzzle, level: number): string {
  const hints = {
    EN: GEARS.hints.fr, IN: [
      'Chaque bouton touche aussi ses voisins en croix. Commence par un coin.',
      'Le coin en haut à gauche éteint est bien placé pour tout rallumer autour de lui.',
      'Appuie sur le coin en haut à gauche, puis cherche les deux boutons restants au bord.',
    ], CA: LOCK.hints.fr, LA: LAMPS.hints.fr, SU: SEQUENCE.hints.fr, BA: SCALES.hints.fr,
  } as Record<FamilyCode, readonly string[]>;
  return hints[p.family][level] ?? '';
}
