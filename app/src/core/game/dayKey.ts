/**
 * Jour calendaire local « AAAA-MM-JJ » — portage de GameCore/DayKey.swift.
 * Stocké en chaîne (clé de Set/Map, JSON direct) ; l'arithmétique passe par un numéro de jour civil exact.
 */
export type DayKey = string;

export const daysInMonth = (y: number, m: number) =>
  m === 2 ? ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31;

export const isValidDate = (y: number, m: number, d: number) =>
  Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && y >= -100000 && y <= 100000 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);

const pad = (n: number, w: number) => String(Math.abs(n)).padStart(w, '0');

export function dayKey(y: number, m: number, d: number): DayKey {
  if (!isValidDate(y, m, d)) throw new RangeError(`invalid date ${y}-${m}-${d}`);
  return `${y < 0 ? '-' : ''}${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/** Analyse stricte : null si la chaîne n'est pas une date réelle. */
export function parseDayKey(text: unknown): { y: number; m: number; d: number } | null {
  if (typeof text !== 'string') return null;
  const match = /^(-?\d{4,6})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isValidDate(y, m, d) ? { y, m, d } : null;
}
export const isDayKey = (text: unknown): text is DayKey => parseDayKey(text) !== null;

/** Jours depuis le 1970-01-01 (« days from civil », H. Hinnant). */
export function ordinal(day: DayKey): number {
  const p = parseDayKey(day);
  if (!p) throw new RangeError(`invalid day ${day}`);
  const y = p.m <= 2 ? p.y - 1 : p.y;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (p.m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + p.d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromOrdinal(z0: number): DayKey {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return dayKey(yoe + era * 400 + (m <= 2 ? 1 : 0), m, d);
}

export const addDays = (day: DayKey, n: number) => fromOrdinal(ordinal(day) + n);
export const daysBetween = (later: DayKey, earlier: DayKey) => ordinal(later) - ordinal(earlier);
/** 1 = lundi … 7 = dimanche. */
export const isoWeekday = (day: DayKey) => (((ordinal(day) + 3) % 7) + 7) % 7 + 1;

/** Jour local de l'appareil. */
export const localDayKey = (date: Date): DayKey => dayKey(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** Jour dans un fuseau IANA donné (tests, outils). */
export function dayKeyIn(date: Date, timeZone: string): DayKey {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return dayKey(get('year'), get('month'), get('day'));
}
