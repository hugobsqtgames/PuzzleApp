// What is written outside the main save: the settings and the profile
// (profile.json), and the text of an exported progress. Pure functions, so
// the tests can throw anything at them.
import { GameState, decodeState, encodeState } from '../core/game/state';
import { CHIME_THEMES, ChimeTheme } from '../audio/chime';
import { Profile, newProfile } from './rewards';
import type { LangSetting } from '../i18n';

export interface Settings {
  music: boolean;
  effects: boolean;
  haptics: boolean;
  /** Open puzzles straight from the room, without the lantern preview. */
  direct: boolean;
  reminder: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** The reminder was offered once (after the first daily puzzle). */
  reminderOffered: boolean;
  /** Colour-blind aid: patterns on the stained glass, dashes on the spot-the-difference pictures. */
  colorAid: boolean;
  /** 'auto' follows the phone. */
  language: LangSetting;
  /** The Carillon's instrument. */
  chime: ChimeTheme;
}
export const DEFAULT_SETTINGS: Settings = { music: true, effects: true, haptics: true, direct: false, reminder: false, reminderHour: 19, reminderMinute: 30, reminderOffered: false, colorAid: false, language: 'auto', chime: 'bells' };

export function decodeSide(text: string): { settings: Settings; profile: Profile; legacyObjects?: boolean } {
  const out: { settings: Settings; profile: Profile; legacyObjects?: boolean } = { settings: { ...DEFAULT_SETTINGS }, profile: newProfile() };
  try {
    const o = JSON.parse(text) as { settings?: Record<string, unknown>; profile?: Record<string, unknown> };
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const v = o.settings?.[k];
      if (typeof v === typeof DEFAULT_SETTINGS[k]) (out.settings as unknown as Record<string, unknown>)[k] = v;
    }
    const p = o.profile ?? {};
    // Saves from before the object search: the objects already won stay found.
    out.legacyObjects = !!o.profile && !Array.isArray(p.picked);
    const n = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0);
    const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 50) : []);
    out.profile = {
      murmures: n(p.murmures), oops: n(p.oops), thrifty: n(p.thrifty), catchUps: n(p.catchUps), hatDrops: n(p.hatDrops), eggs: strings(p.eggs), lastSeen: typeof p.lastSeen === 'string' && !Number.isNaN(Date.parse(p.lastSeen)) ? p.lastSeen : null,
      themes: strings(p.themes), visited: strings(p.visited),
      durations: Array.isArray(p.durations) && p.durations.length === 6 ? p.durations.map((d) => (Array.isArray(d) ? d.filter((x) => typeof x === 'number' && x > 0 && x < 86400).slice(-100) : [])) : newProfile().durations,
      picked: Array.isArray(p.picked) ? p.picked.filter((x): x is string => typeof x === 'string').slice(0, 200) : [],
      history: Array.isArray(p.history) ? p.history.filter((h): h is Profile['history'][number] => !!h && typeof h.label === 'string' && typeof h.amount === 'number' && typeof h.at === 'string').slice(-30) : [],
    };
  } catch { /* defaults */ }
  if (!['auto', 'fr', 'en'].includes(out.settings.language)) out.settings.language = 'auto';
  if (!CHIME_THEMES.includes(out.settings.chime)) out.settings.chime = 'bells';
  out.settings.reminderHour = Math.min(23, Math.max(0, Math.trunc(out.settings.reminderHour)));
  out.settings.reminderMinute = Math.min(59, Math.max(0, Math.trunc(out.settings.reminderMinute)));
  return out;
}

/** The text the player shares to move their progress elsewhere. */
export function exportText(state: GameState, picked: string[], now = new Date()): string {
  return JSON.stringify({ app: 'lampion', v: 1, exportedAt: now.toISOString(), state: encodeState(state), picked });
}

/** An exported progress read back, or null if the text is not one. */
export function parseImport(text: string): { state: GameState; picked: string[] } | null {
  try {
    const o = JSON.parse(text) as { app?: unknown; state?: unknown; picked?: unknown };
    if (!o || o.app !== 'lampion' || !o.state) return null;
    const state = decodeState(o.state);
    // Objects can only have been found in rooms the imported progress has fully lit. Older exports
    // did not carry them: those rooms' objects count as found rather than being lost.
    const lit = (id: string) => state.collectibles.has(`collectible.${id}`);
    const picked = Array.isArray(o.picked) ? o.picked.filter((x): x is string => typeof x === 'string' && lit(x)) : [...state.collectibles].filter((c) => c.startsWith('collectible.')).map((c) => c.slice('collectible.'.length));
    return { state, picked: [...new Set(picked)] };
  } catch { return null; }
}
