// Save format of the playable slice: a versioned envelope with a checksum.
// Pure functions (tested); the file I/O lives in demoStorage.ts.

import { checksum } from '../core/game/state';
import { DemoGame, FamilyCode, freshGame } from '../content/vesperDemo';

export const DEMO_SAVE_VERSION = 1;

export function encodeDemo(g: DemoGame): string {
  const body = JSON.stringify(g);
  return JSON.stringify({ v: DEMO_SAVE_VERSION, sum: checksum(body), body });
}

const FAMS: FamilyCode[] = ['SU', 'LA', 'CA', 'EN', 'IN', 'BA'];
const int = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;

/**
 * Decodes a save. Returns null when the text is not a save, is corrupted
 * (checksum), or comes from a newer version: the caller then tries the backup.
 * Fields are checked one by one; a bad field falls back to the default value
 * instead of wiping the whole save.
 */
export function decodeDemo(text: string, today = todayKey()): DemoGame | null {
  let env: { v?: unknown; sum?: unknown; body?: unknown };
  try { env = JSON.parse(text); } catch { return null; }
  if (!env || typeof env !== 'object' || env.v !== DEMO_SAVE_VERSION || typeof env.body !== 'string') return null;
  if (env.sum !== checksum(env.body)) return null;
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(env.body); } catch { return null; }
  if (!raw || typeof raw !== 'object') return null;

  const d = freshGame();
  const g: DemoGame = { ...d };
  const MAX = 1_000_000;
  if (int(raw.lights, 0, MAX)) g.lights = raw.lights;
  if (int(raw.shards, 0, MAX)) g.shards = raw.shards;
  if (int(raw.streak, 0, MAX)) g.streak = raw.streak;
  if (int(raw.best, 0, MAX)) g.best = raw.best;
  if (int(raw.nightlights, 0, 9)) g.nightlights = raw.nightlights;
  if (typeof raw.dailyDay === 'string') g.dailyDay = raw.dailyDay;
  g.dailyDone = raw.dailyDone === true && g.dailyDay === today;
  if (typeof raw.roomRewarded === 'boolean') g.roomRewarded = raw.roomRewarded;
  if (typeof raw.flame === 'string') g.flame = raw.flame;
  if (typeof raw.hat === 'string') g.hat = raw.hat;
  g.justLit = -1;
  if (Array.isArray(raw.room) && raw.room.length === d.room.length) {
    // The room layout is content, not progress: only `lit` is taken from the save.
    g.room = d.room.map((l, i) => {
      const r = (raw.room as unknown[])[i] as { lit?: unknown; family?: unknown };
      const sameLantern = r && typeof r === 'object' && FAMS.includes(r.family as FamilyCode) && r.family === l.family;
      return sameLantern && typeof r.lit === 'boolean' ? { ...l, lit: r.lit } : l;
    });
  }
  g.best = Math.max(g.best, g.streak);
  return g;
}

/** Local calendar day, "YYYY-MM-DD". */
export function todayKey(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
