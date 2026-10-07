// What is written outside the main save: the settings and the profile
// (profile.json), and the text of an exported progress. Pure functions, so
// the tests can throw anything at them.
import { GameState, Losses, checksum, decodeState, encodeState } from '../core/game/state';
import { CHIME_THEMES, ChimeTheme } from '../audio/chime';
import { HOUSE_SLOTS, Profile, newProfile } from './rewards';
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
  /** The app icon follows the season (iOS, outside Expo Go). */
  seasonIcon: boolean;
  /** Volumes, 0–1 (with the music and effects switches on). */
  musicVolume: number;
  effectsVolume: number;
  /** A small caption on screen for the important sounds. */
  soundCaptions: boolean;
  /** Buttons and glows take the colour of the district the player is in. */
  districtTint: boolean;
}
export const DEFAULT_SETTINGS: Settings = { music: true, effects: true, haptics: true, direct: false, reminder: false, reminderHour: 19, reminderMinute: 30, reminderOffered: false, colorAid: false, language: 'auto', chime: 'bells', seasonIcon: false, musicVolume: 1, effectsVolume: 1, soundCaptions: false, districtTint: true };

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
      seenVersion: typeof p.seenVersion === 'string' ? p.seenVersion.slice(0, 20) : null,
      reviewAsked: p.reviewAsked === true,
      photos: Array.isArray(p.photos) ? p.photos.filter((x): x is { d: string; at: string } => !!x && typeof x.d === 'string' && typeof x.at === 'string').slice(0, 20) : [],
      house: (() => {
        const h = (p.house ?? {}) as { name?: unknown; shelf?: unknown; decor?: unknown };
        const shelf = Array.from({ length: HOUSE_SLOTS }, (_, i) => (Array.isArray(h.shelf) && typeof h.shelf[i] === 'string' ? h.shelf[i] as string : null));
        const decor: Record<string, string> = {};
        if (h.decor && typeof h.decor === 'object') for (const [k, v] of Object.entries(h.decor as Record<string, unknown>)) if (typeof v === 'string' && k.length < 20) decor[k] = v.slice(0, 40);
        return { name: typeof h.name === 'string' ? h.name.slice(0, 30) : '', shelf, decor };
      })(),
      history: Array.isArray(p.history) ? p.history.filter((h): h is Profile['history'][number] => !!h && typeof h.label === 'string' && typeof h.amount === 'number' && typeof h.at === 'string').slice(-30) : [],
    };
  } catch { /* defaults */ }
  if (!['auto', 'fr', 'en'].includes(out.settings.language)) out.settings.language = 'auto';
  if (!CHIME_THEMES.includes(out.settings.chime)) out.settings.chime = 'bells';
  for (const k of ['musicVolume', 'effectsVolume'] as const) out.settings[k] = Number.isFinite(out.settings[k]) ? Math.min(1, Math.max(0.25, out.settings[k])) : 1;
  out.settings.reminderHour = Math.min(23, Math.max(0, Math.trunc(out.settings.reminderHour)));
  out.settings.reminderMinute = Math.min(59, Math.max(0, Math.trunc(out.settings.reminderMinute)));
  return out;
}

/** The text the player shares to move their progress elsewhere. */
export function exportText(state: GameState, picked: string[], now = new Date()): string {
  const encoded = encodeState(state);
  return JSON.stringify({ app: 'lampion', v: 1, exportedAt: now.toISOString(), checksum: checksum(JSON.stringify(encoded)), state: encoded, picked });
}

/** An exported progress read back, or null if the text is not one. */
export function parseImport(text: string): { state: GameState; picked: string[] } | null {
  try {
    const o = JSON.parse(text) as { app?: unknown; state?: unknown; picked?: unknown };
    if (!o || o.app !== 'lampion' || !o.state) return null;
    // An import replaces the whole game: a text altered on the way is refused, never half imported.
    if (typeof (o as { checksum?: unknown }).checksum === 'string' && (o as { checksum: string }).checksum !== checksum(JSON.stringify(o.state))) return null;
    const losses = new Losses();
    const state = decodeState(o.state, losses);
    if (losses.count > 0) return null;
    // Objects can only have been found in rooms the imported progress has fully lit. Older exports
    // did not carry them: those rooms' objects count as found rather than being lost.
    const lit = (id: string) => state.collectibles.has(`collectible.${id}`);
    const picked = Array.isArray(o.picked) ? o.picked.filter((x): x is string => typeof x === 'string' && lit(x)) : [...state.collectibles].filter((c) => c.startsWith('collectible.')).map((c) => c.slice('collectible.'.length));
    return { state, picked: [...new Set(picked)] };
  } catch { return null; }
}
