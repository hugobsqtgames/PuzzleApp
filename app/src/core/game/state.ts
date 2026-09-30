/**
 * État de jeu sauvegardé, portefeuille et défi du jour.
 * Décodage tolérant ÉLÉMENT PAR ÉLÉMENT : une donnée abîmée ne fait perdre qu'elle-même, et chaque perte
 * est comptée (la sauvegarde peut alors être complétée par la copie de secours).
 */
import { DayKey, isDayKey } from './dayKey';

export interface SolveRecord { solvedAt: string; paidHints: number; wrongAnswers: number; usedSolution: boolean }

/** Somme de contrôle rapide (deux FNV-1a 32 bits indépendants = 64 bits) : détecte toute altération accidentelle. */
export function checksum(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x01000193) >>> 0;
    b = (b ^ (b >>> 15)) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
/** Intégrité d'une lanterne résolue : identifiant + contenu. Une entrée altérée (même son identifiant) est rejetée. */
const entryChecksum = (id: string, r: SolveRecord) => checksum(`${id}|${r.solvedAt}|${r.paidHints}|${r.wrongAnswers}|${r.usedSolution}`);
export const isClairvoyant = (r: SolveRecord) => r.paidHints === 0 && r.wrongAnswers === 0 && !r.usedSolution;

export interface Wallet { balance: number; earned: number; spent: number; appliedTransactions: Set<string> }
export interface DailyState {
  completedDays: Set<DayKey>;
  catchUpDays: Set<DayKey>;
  streak: number;
  bestStreak: number;
  nightlights: number;
  lastStreakDay: DayKey | null;
  maxSeenDay: DayKey | null;
}
export interface GameState {
  solved: Map<string, SolveRecord>;
  inProgress: Map<string, unknown>;
  wallet: Wallet;
  daily: DailyState;
  collectibles: Set<string>;
  ownedCosmetics: Set<string>;
  equippedCosmetics: Map<string, string>;
  seenDialogue: Set<string>;
  lastPuzzle: string | null;
  onboardingDone: boolean;
}

export const newWallet = (): Wallet => ({ balance: 0, earned: 0, spent: 0, appliedTransactions: new Set() });
export const newDailyState = (): DailyState => ({ completedDays: new Set(), catchUpDays: new Set(), streak: 0, bestStreak: 0, nightlights: 0, lastStreakDay: null, maxSeenDay: null });
export const newGameState = (): GameState => ({
  solved: new Map(), inProgress: new Map(), wallet: newWallet(), daily: newDailyState(), collectibles: new Set(), ownedCosmetics: new Set(),
  equippedCosmetics: new Map(), seenDialogue: new Set(), lastPuzzle: null, onboardingDone: false,
});

export function cloneState(s: GameState): GameState {
  return {
    solved: new Map([...s.solved].map(([k, v]) => [k, { ...v }])), inProgress: new Map(s.inProgress),
    wallet: { ...s.wallet, appliedTransactions: new Set(s.wallet.appliedTransactions) },
    daily: { ...s.daily, completedDays: new Set(s.daily.completedDays), catchUpDays: new Set(s.daily.catchUpDays) },
    collectibles: new Set(s.collectibles), ownedCosmetics: new Set(s.ownedCosmetics), equippedCosmetics: new Map(s.equippedCosmetics),
    seenDialogue: new Set(s.seenDialogue), lastPuzzle: s.lastPuzzle, onboardingDone: s.onboardingDone,
  };
}

// ---------- Encodage JSON (ordre des clés stable pour des sauvegardes comparables) ----------
const sorted = <T>(it: Iterable<T>) => [...it].sort() as T[];
export function encodeState(s: GameState): unknown {
  return {
    collectibles: sorted(s.collectibles),
    daily: { bestStreak: s.daily.bestStreak, catchUpDays: sorted(s.daily.catchUpDays), completedDays: sorted(s.daily.completedDays), lastStreakDay: s.daily.lastStreakDay, maxSeenDay: s.daily.maxSeenDay, nightlights: s.daily.nightlights, streak: s.daily.streak },
    equippedCosmetics: Object.fromEntries(sorted(s.equippedCosmetics.keys()).map((k) => [k, s.equippedCosmetics.get(k)])),
    inProgress: Object.fromEntries(sorted(s.inProgress.keys()).map((k) => [k, s.inProgress.get(k)])),
    lastPuzzle: s.lastPuzzle,
    onboardingDone: s.onboardingDone,
    ownedCosmetics: sorted(s.ownedCosmetics),
    seenDialogue: sorted(s.seenDialogue),
    solved: Object.fromEntries(sorted(s.solved.keys()).map((k) => { const r = s.solved.get(k)!; return [k, { ...r, c: entryChecksum(k, r) }]; })),
    wallet: { appliedTransactions: sorted(s.wallet.appliedTransactions), balance: s.wallet.balance, earned: s.wallet.earned, spent: s.wallet.spent },
  };
}

// ---------- Décodage tolérant ----------
export class Losses { count = 0; record() { this.count++; } }
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const nonNegInt = (v: unknown, fallback: number, losses: Losses) => {
  if (v === undefined) return fallback;
  if (typeof v === 'number' && Number.isSafeInteger(v)) return Math.max(0, v);
  losses.record();
  return fallback;
};
function lossySet<T>(raw: unknown, valid: (x: unknown) => x is T, losses: Losses): Set<T> {
  if (raw === undefined) return new Set();
  if (!Array.isArray(raw)) { losses.record(); return new Set(); }
  const out = new Set<T>();
  for (const x of raw) { if (valid(x)) out.add(x); else losses.record(); }
  return out;
}
const isString = (x: unknown): x is string => typeof x === 'string';

function decodeSolveRecord(id: string, v: unknown): SolveRecord | null {
  if (!isObject(v) || typeof v.solvedAt !== 'string' || Number.isNaN(Date.parse(v.solvedAt))) return null;
  const n = (x: unknown) => (typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 ? x : null);
  const paidHints = n(v.paidHints ?? 0), wrongAnswers = n(v.wrongAnswers ?? 0);
  if (paidHints === null || wrongAnswers === null || (v.usedSolution !== undefined && typeof v.usedSolution !== 'boolean')) return null;
  const record = { solvedAt: v.solvedAt, paidHints, wrongAnswers, usedSolution: v.usedSolution === true };
  // Somme de contrôle absente : ancien format, accepté ; présente mais fausse : entrée altérée, rejetée.
  if (v.c !== undefined && v.c !== entryChecksum(id, record)) return null;
  return record;
}

export function decodeWallet(raw: unknown, losses: Losses): Wallet {
  if (raw === undefined) return newWallet();
  if (!isObject(raw)) { losses.record(); return newWallet(); }
  return {
    balance: nonNegInt(raw.balance, 0, losses), earned: nonNegInt(raw.earned, 0, losses), spent: nonNegInt(raw.spent, 0, losses),
    appliedTransactions: lossySet(raw.appliedTransactions, isString, losses),
  };
}

export function decodeDaily(raw: unknown, losses: Losses): DailyState {
  if (raw === undefined) return newDailyState();
  if (!isObject(raw)) { losses.record(); return newDailyState(); }
  const streak = nonNegInt(raw.streak, 0, losses);
  const day = (v: unknown) => { if (v === undefined || v === null) return null; if (isDayKey(v)) return v; losses.record(); return null; };
  return {
    completedDays: lossySet(raw.completedDays, isDayKey, losses), catchUpDays: lossySet(raw.catchUpDays, isDayKey, losses),
    streak, bestStreak: Math.max(streak, nonNegInt(raw.bestStreak, 0, losses)), nightlights: nonNegInt(raw.nightlights, 0, losses),
    lastStreakDay: day(raw.lastStreakDay), maxSeenDay: day(raw.maxSeenDay),
  };
}

export function decodeState(raw: unknown, losses = new Losses()): GameState {
  const s = newGameState();
  if (!isObject(raw)) { losses.record(); return s; }
  if (raw.solved !== undefined) {
    if (isObject(raw.solved)) for (const [k, v] of Object.entries(raw.solved)) { const r = decodeSolveRecord(k, v); if (r) s.solved.set(k, r); else losses.record(); }
    else losses.record();
  }
  if (raw.inProgress !== undefined) {
    if (isObject(raw.inProgress)) for (const [k, v] of Object.entries(raw.inProgress)) s.inProgress.set(k, v);
    else losses.record();
  }
  s.wallet = decodeWallet(raw.wallet, losses);
  s.daily = decodeDaily(raw.daily, losses);
  s.collectibles = lossySet(raw.collectibles, isString, losses);
  s.ownedCosmetics = lossySet(raw.ownedCosmetics, isString, losses);
  s.seenDialogue = lossySet(raw.seenDialogue, isString, losses);
  if (raw.equippedCosmetics !== undefined) {
    if (isObject(raw.equippedCosmetics)) for (const [k, v] of Object.entries(raw.equippedCosmetics)) { if (typeof v === 'string') s.equippedCosmetics.set(k, v); else losses.record(); }
    else losses.record();
  }
  if (typeof raw.lastPuzzle === 'string') s.lastPuzzle = raw.lastPuzzle; else if (raw.lastPuzzle != null) losses.record();
  if (typeof raw.onboardingDone === 'boolean') s.onboardingDone = raw.onboardingDone; else if (raw.onboardingDone !== undefined) losses.record();
  return s;
}

/**
 * Fichier principal altéré (somme de contrôle globale fausse) : on repart de la copie de secours intacte et on n'y ajoute
 * que les lanternes du principal dont l'intégrité est prouvée. Aucune lanterne perdue, aucune inventée ;
 * seuls les Éclats et la série du tout dernier enregistrement peuvent être perdus.
 */
export function recoverFromBackup(corruptedMain: GameState, backup: GameState): GameState {
  const s = cloneState(backup);
  for (const [k, v] of corruptedMain.solved) if (!s.solved.has(k)) s.solved.set(k, { ...v });
  for (const k of s.solved.keys()) s.inProgress.delete(k);
  return s;
}

/** Complète un état relu partiellement avec la copie de secours (la progression ne fait que croître). */
export function mergeWithBackup(main: GameState, backup: GameState): GameState {
  const s = cloneState(main);
  for (const [k, v] of backup.solved) if (!s.solved.has(k)) s.solved.set(k, { ...v });
  for (const [k, v] of backup.inProgress) if (!s.inProgress.has(k) && !s.solved.has(k)) s.inProgress.set(k, v);
  for (const x of backup.collectibles) s.collectibles.add(x);
  for (const x of backup.ownedCosmetics) s.ownedCosmetics.add(x);
  for (const x of backup.seenDialogue) s.seenDialogue.add(x);
  for (const [k, v] of backup.equippedCosmetics) if (!s.equippedCosmetics.has(k)) s.equippedCosmetics.set(k, v);
  const best = s.wallet.appliedTransactions.size >= backup.wallet.appliedTransactions.size ? s.wallet : backup.wallet;
  s.wallet = { ...best, appliedTransactions: new Set([...s.wallet.appliedTransactions, ...backup.wallet.appliedTransactions]) };
  for (const d of backup.daily.completedDays) s.daily.completedDays.add(d);
  for (const d of backup.daily.catchUpDays) s.daily.catchUpDays.add(d);
  for (const d of s.daily.completedDays) s.daily.catchUpDays.delete(d);
  s.daily.bestStreak = Math.max(s.daily.bestStreak, backup.daily.bestStreak);
  if (s.daily.lastStreakDay === null) {
    s.daily.streak = backup.daily.streak; s.daily.nightlights = backup.daily.nightlights; s.daily.lastStreakDay = backup.daily.lastStreakDay;
    s.daily.bestStreak = Math.max(s.daily.bestStreak, s.daily.streak);
  }
  s.lastPuzzle = s.lastPuzzle ?? backup.lastPuzzle;
  s.onboardingDone = s.onboardingDone || backup.onboardingDone;
  return s;
}

// ---------- Portefeuille : chaque mouvement porte un identifiant ; jamais deux fois, jamais négatif ----------
export class WalletError extends Error {
  constructor(readonly reason: 'insufficient' | 'invalidAmount', readonly missing = 0) { super(reason); }
}
export function credit(w: Wallet, amount: number, id: string): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new WalletError('invalidAmount');
  if (w.appliedTransactions.has(id)) return false;
  if (w.balance + amount > Number.MAX_SAFE_INTEGER || w.earned + amount > Number.MAX_SAFE_INTEGER) throw new WalletError('invalidAmount');
  w.appliedTransactions.add(id);
  w.balance += amount;
  w.earned += amount;
  return true;
}
export function debit(w: Wallet, amount: number, id: string): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new WalletError('invalidAmount');
  if (w.appliedTransactions.has(id)) return false;
  if (w.balance < amount) throw new WalletError('insufficient', amount - w.balance);
  if (w.spent + amount > Number.MAX_SAFE_INTEGER) throw new WalletError('invalidAmount');
  w.appliedTransactions.add(id);
  w.balance -= amount;
  w.spent += amount;
  return true;
}
