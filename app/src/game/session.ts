/**
 * One puzzle being played: state, history, hints and errors. Pure functions
 * over plain data, for any family (the family engine does the rules).
 *
 * Hints (GAME_DESIGN § 6): levels unlock in order for the same position; once
 * the player moves on, the next hint starts again at level 1 for the next
 * deduction. The free Murmure has a 20 s cooldown per puzzle.
 */
import { CellRef, HintLevel, Tier } from '../core/puzzlekit/types';
import { SolveRecord } from '../core/game/state';
import { STANDARD_ECONOMY } from '../core/game/engine';
import { t } from '../content/strings';
import { Code, FAMILIES, PlayablePuzzle } from './catalog';

export type SessionKind = 'lantern' | 'daily' | 'event';
/** What each hint level costs: the engine's table, so the sheet always shows what is charged. */
export const HINT_COSTS = STANDARD_ECONOMY.hintCosts;

export interface Session {
  id: string;
  code: Code;
  tier: Tier;
  kind: SessionKind;
  data: any;
  state: any;
  history: any[];
  future: any[];
  moves: number;
  /** Hints of the current step: texts already bought, level reached, highlighted cells. */
  /**
   * Hints of the current position: the highest level taken, the texts by level (index level − 1),
   * the free Murmures used on this puzzle.
   */
  hint: { step: number; level: number; texts: (string | undefined)[]; focus: CellRef[]; stale: boolean; freeWhispers: number };
  paidHints: number;
  wrongAnswers: number;
  usedSolution: boolean;
  error: { text: string; focus: CellRef[] } | null;
  startedAt: string;
  solved: boolean;
}

const engine = (s: { code: Code }) => FAMILIES[s.code].engine;

export function startSession(p: PlayablePuzzle, kind: SessionKind, now: Date, saved?: unknown): Session {
  const e = FAMILIES[p.code].engine;
  let state = e.initialState(p.data);
  // Lock wheels start on 0, as in the mockup (a wheel always shows a digit).
  if (p.code === 'CA') state = { ...state, symbols: state.symbols.map(() => 0) };
  const s: Session = {
    id: p.id, code: p.code, tier: p.tier, kind, data: p.data, state, history: [], future: [], moves: 0,
    hint: { step: 0, level: 0, texts: [], focus: [], stale: false, freeWhispers: 0 },
    paidHints: 0, wrongAnswers: 0, usedSolution: false, error: null, startedAt: now.toISOString(), solved: false,
  };
  return saved ? restoreProgress(s, saved) : s;
}

/** Applies a new board state from a player action. */
export function play(s: Session, next: any, countsAsMove = true): Session {
  if (s.solved || next === s.state) return s;
  return {
    ...s, state: next, history: [...s.history, s.state], future: [], moves: s.moves + (countsAsMove ? 1 : 0), error: null,
    hint: s.hint.level > 0 ? { ...s.hint, stale: true, focus: [] } : s.hint,
  };
}

export function undo(s: Session): Session {
  if (!s.history.length || s.solved) return s;
  return { ...s, state: s.history[s.history.length - 1], history: s.history.slice(0, -1), future: [...s.future, s.state], error: null };
}

export function redo(s: Session): Session {
  if (!s.future.length || s.solved) return s;
  return { ...s, state: s.future[s.future.length - 1], future: s.future.slice(0, -1), history: [...s.history, s.state] };
}

/** Families without an answer validate themselves as soon as the board is right. */
export function isComplete(s: Session): boolean {
  return !FAMILIES[s.code].answer && engine(s).validate(s.data, s.state).kind === 'correct';
}

export function canSubmit(s: Session): boolean {
  if (!FAMILIES[s.code].answer || s.solved) return false;
  if (s.code === 'SU' || s.code === 'MO' || s.code === 'OM') return s.state.selected !== null;
  if (s.code === 'ME') return s.state.marks.every((m: boolean | null) => m !== null);
  if (s.code === 'EQ') return s.state.object.every((x: number | null) => x !== null) && s.state.place.every((x: number | null) => x !== null);
  if (s.code === 'BA') return s.state.entry !== '';
  return true;
}

/** Submits an answer. Wrong answers are explained, never punished (they only cost Clairvoyance). */
export function submit(s: Session): { session: Session; correct: boolean } {
  const v = engine(s).validate(s.data, s.state);
  if (v.kind === 'correct') return { session: s, correct: true };
  if (v.kind === 'incomplete') return { session: s, correct: false };
  const issue = v.issues[0];
  let state = s.state;
  if (s.code === 'SU' || s.code === 'MO' || s.code === 'OM') state = { ...state, ruledOut: [...state.ruledOut, state.selected], selected: null };
  if (s.code === 'BA') state = { ...state, entry: '' };
  return {
    session: { ...s, state, wrongAnswers: s.wrongAnswers + 1, error: { text: issue ? t(issue.message) : '', focus: issue?.cells ?? [] } },
    correct: false,
  };
}

/** Levels that can be taken at this position: any level above the ones already taken (no order to follow). */
export function hintAvailable(s: Session, level: HintLevel): boolean {
  if (s.solved) return false;
  return level > (s.hint.stale ? 0 : s.hint.level);
}

/** Level shown for the current position (0: none). */
export const shownHint = (s: Session) => (s.hint.stale ? 0 : s.hint.level);

/** Price of a hint for this puzzle: the first Murmures are free, then they cost a little. */
export function hintCost(s: Session, level: HintLevel): number {
  if (level === HintLevel.Whisper) return s.hint.freeWhispers < STANDARD_ECONOMY.freeWhispers ? 0 : STANDARD_ECONOMY.whisperPrice;
  return HINT_COSTS[level - 1];
}

/**
 * Gives the hint of `level` for the current position (the caller has already
 * paid `cost`). Returns null when the engine has nothing to say (already solved).
 */
export function giveHint(s: Session, level: HintLevel, cost: number): Session | null {
  const h = engine(s).hint(s.data, s.state, level);
  if (!h) return null;
  const newStep = s.hint.stale;
  const texts = newStep ? [] : s.hint.texts.slice();
  texts[level - 1] = t(h.text);
  let next: Session = {
    ...s,
    hint: {
      step: newStep ? s.hint.step + 1 : s.hint.step, level, texts, focus: h.focus, stale: false,
      freeWhispers: s.hint.freeWhispers + (level === HintLevel.Whisper && cost === 0 ? 1 : 0),
    },
    paidHints: s.paidHints + (cost > 0 ? 1 : 0),
    usedSolution: s.usedSolution || level === HintLevel.Solution,
    error: null,
  };
  if (h.resultingState !== undefined) {
    next = { ...next, history: [...next.history, next.state], future: [], state: h.resultingState };
  }
  return next;
}

export function record(s: Session, now: Date): SolveRecord {
  return { solvedAt: now.toISOString(), paidHints: s.paidHints, wrongAnswers: s.wrongAnswers, usedSolution: s.usedSolution };
}

// ---------------------------------------------------------------- in progress

/** What is kept when the player leaves a puzzle (GameState.inProgress). */
export function progressOf(s: Session): unknown {
  return { v: 1, fp: fingerprintOf(s), state: s.state, moves: s.moves, paidHints: s.paidHints, wrongAnswers: s.wrongAnswers, usedSolution: s.usedSolution, startedAt: s.startedAt, whispers: s.hint.freeWhispers };
}

/**
 * Identifies the exact puzzle a saved board was played on. Not the family's
 * fingerprint: that one is the same for a puzzle and its turned copy.
 */
function fingerprintOf(s: Session): string {
  const text = `${s.code}:${JSON.stringify(s.data)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

function restoreProgress(s: Session, raw: unknown): Session {
  const o = raw as { v?: unknown; fp?: unknown; state?: unknown; moves?: unknown; paidHints?: unknown; wrongAnswers?: unknown; usedSolution?: unknown; startedAt?: unknown; whispers?: unknown } | null;
  if (!o || o.v !== 1 || o.state === undefined) return s;
  // A board belongs to one puzzle: after a content update, the lantern may hold another one.
  if (o.fp !== fingerprintOf(s)) return s;
  // Only a state the engine understands is restored: a damaged one restarts the puzzle, never crashes it.
  if (!isStateLike(s, o.state)) return s;
  const n = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0);
  return {
    ...s, state: o.state, moves: n(o.moves), paidHints: n(o.paidHints), wrongAnswers: n(o.wrongAnswers), usedSolution: o.usedSolution === true,
    hint: { ...s.hint, freeWhispers: n(o.whispers) },
    startedAt: typeof o.startedAt === 'string' && !Number.isNaN(Date.parse(o.startedAt)) ? o.startedAt : s.startedAt,
  };
}

function isStateLike(s: Session, st: any): boolean {
  if (!st || typeof st !== 'object') return false;
  const init = s.state;
  for (const k of Object.keys(init)) {
    const a = init[k], b = st[k];
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && k !== 'crossedOut' && k !== 'ruledOut' && a.length !== b.length) return false;
    if (!Array.isArray(a) && a !== null && typeof a !== typeof b) return false;
  }
  // Ask the engine: validating must not throw.
  try { engine(s).validate(s.data, st); return true; } catch { return false; }
}
