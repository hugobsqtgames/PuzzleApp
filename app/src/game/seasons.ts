// The seasons of Vesper and its two yearly events, from the phone's date.
// Everything ships in the app: the events need no connection and come back
// every year. An event's progress is kept per year in GameState.seenDialogue
// (`event.<id>.<year>.<n>`), its rewards once and for all (`event.<id>.half`…).
import type { GameState } from '../core/game/state';

export type SeasonId = 'printemps' | 'ete' | 'automne' | 'hiver';
export type Particle = 'petal' | 'firefly' | 'leaf' | 'snow' | 'bat' | 'rain';

export interface Season {
  id: SeasonId;
  /** French name (translated where shown). */
  name: string;
  flame: string;
  accent: string;
  particle: Particle;
  line: string;
  /** What Nilo wears on the home screen when the player chose nothing for that slot. */
  wear: { hat?: string; scarf?: string };
}

export const SEASONS: Record<SeasonId, Season> = {
  printemps: { id: 'printemps', name: 'Printemps', flame: '#F29BC4', accent: '#F7B6D2', particle: 'petal', line: 'Les cerisiers du Quai fleurissent. Nilo a des fleurs sur la tête.', wear: { hat: 'flowers' } },
  ete: { id: 'ete', name: 'Été', flame: '#FFD98E', accent: '#FFE89A', particle: 'firefly', line: 'Les lucioles sortent tôt. Les soirées durent plus longtemps.', wear: { hat: 'straw' } },
  automne: { id: 'automne', name: 'Automne', flame: '#E8744A', accent: '#F0924A', particle: 'leaf', line: 'Les feuilles tombent sur les toits. Odeur de cannelle au Marché.', wear: { scarf: 'spice' } },
  hiver: { id: 'hiver', name: 'Hiver', flame: '#BFE6F0', accent: '#EAF6FF', particle: 'snow', line: 'La neige étouffe les pas. Chaque lanterne réchauffe un peu plus.', wear: { scarf: 'knit' } },
};

/** Month (1–12) and day, compared as one number. */
const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();

export function seasonOn(d: Date): Season {
  const x = md(d);
  if (x >= 321 && x <= 620) return SEASONS.printemps;
  if (x >= 621 && x <= 922) return SEASONS.ete;
  if (x >= 923 && x <= 1220) return SEASONS.automne;
  return SEASONS.hiver;
}

export type EventId = 'halloween' | 'noel';

export interface SeasonEvent {
  id: EventId;
  name: string;
  flame: string;
  particle: Particle;
  /** First and last day, as month * 100 + day (Noël crosses the new year). */
  from: number;
  to: number;
  /** 'free': every puzzle playable at once; 'evening': one more each evening. */
  pace: 'free' | 'evening';
  story: string;
  /** Milestones: [puzzles solved, flag kept forever, cosmetic it gives]. */
  milestones: [number, string, string][];
}

export const EVENTS: Record<EventId, SeasonEvent> = {
  halloween: {
    id: 'halloween', name: 'La Nuit des Citrouilles', flame: '#F28C28', particle: 'bat', from: 1025, to: 1102, pace: 'free',
    story: 'Les citrouilles du Marché se sont éteintes. Sept énigmes à résoudre, à ton rythme, pour les rallumer.',
    milestones: [[4, 'event.halloween.half', 'comp.pumpkin'], [7, 'event.halloween.complete', 'hat.witch']],
  },
  noel: {
    id: 'noel', name: 'La Veillée de Vesper', flame: '#FFE6B0', particle: 'snow', from: 1215, to: 106, pace: 'evening',
    story: 'Douze soirs de veillée : chaque soir, une nouvelle lanterne s’allume au-dessus de la place.',
    milestones: [[3, 'event.noel.start', 'comp.snowflake'], [6, 'event.noel.half', 'hat.santa'], [12, 'event.noel.complete', 'scarf.holly']],
  },
};

/** The event running on this date, with the year it started (Noël started the year before in January). */
export function eventOn(d: Date): { event: SeasonEvent; year: number } | null {
  const x = md(d);
  for (const e of Object.values(EVENTS)) {
    const inside = e.from <= e.to ? x >= e.from && x <= e.to : x >= e.from || x <= e.to;
    if (inside) return { event: e, year: e.from > e.to && x <= e.to ? d.getFullYear() - 1 : d.getFullYear() };
  }
  return null;
}

/** The event's last day, for « jusqu’au 2 novembre ». */
export function eventEnd(e: SeasonEvent, year: number): Date {
  return new Date(e.from > e.to ? year + 1 : year, Math.floor(e.to / 100) - 1, e.to % 100);
}

/** How many of the event's puzzles are open on this date. */
export function eventOpen(e: SeasonEvent, year: number, d: Date, size: number): number {
  if (e.pace === 'free') return size;
  const start = new Date(year, Math.floor(e.from / 100) - 1, e.from % 100);
  const days = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, Math.min(size, days + 1));
}

export const eventKey = (id: EventId, year: number, n: number) => `event.${id}.${year}.${n + 1}`;

/** Which of the event's puzzles this year are solved. */
export function eventDone(s: GameState, id: EventId, year: number, size: number): boolean[] {
  return Array.from({ length: size }, (_, n) => s.seenDialogue.has(eventKey(id, year, n)));
}

export type Weather = 'clear' | 'rain' | 'fog';

/**
 * Vesper's weather for a day: mostly clear, a fine rain now and then, some
 * foggy evenings. Always the same for a given date. No rain in winter (it
 * snows), none during an event (its own sky).
 */
export function weatherOn(d: Date): Weather {
  if (eventOn(d)) return 'clear';
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let x = key ^ 0x5bd1e995;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x = Math.imul(x ^ (x >>> 12), 0x297a2d39); x ^= x >>> 15;
  const roll = (x >>> 0) % 100;
  if (roll < 14 && seasonOn(d).id !== 'hiver') return 'rain';
  if (roll >= 14 && roll < 26) return 'fog';
  return 'clear';
}
