/**
 * Directeur son et haptique — portage de GameAudio/AudioDirector.swift.
 * DÉCIDE (quoi jouer, quand, quelle vibration) ; expo-audio / expo-haptics EXÉCUTENT les commandes.
 */
export const SOUND_EVENTS = ['manipulate', 'error', 'lanternLit', 'shards', 'roomCompleted', 'buildingCompleted', 'unlock', 'newDistrict', 'hint', 'locked', 'uiTap'] as const;
export type SoundEvent = (typeof SOUND_EVENTS)[number];
export const AMBIENCE_PLACES = ['night', 'lighthouse', 'library', 'clockworks', 'glasshouse', 'market', 'theatre', 'observatory'] as const;
export type AmbiencePlace = (typeof AMBIENCE_PLACES)[number];
export type Haptic = 'selection' | 'success' | 'error' | 'impactSoft' | 'impactMedium';

export interface AudioSettings { music: boolean; effects: boolean; haptics: boolean; interfaceTaps: boolean }
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = { music: true, effects: true, haptics: true, interfaceTaps: false };
export function decodeAudioSettings(raw: unknown): AudioSettings {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const b = (k: keyof AudioSettings) => (typeof o[k] === 'boolean' ? (o[k] as boolean) : DEFAULT_AUDIO_SETTINGS[k]);
  return { music: b('music'), effects: b('effects'), haptics: b('haptics'), interfaceTaps: b('interfaceTaps') };
}

export interface SoundCue { file: string; volume: number; minimumIntervalMs: number; haptic?: Haptic }
export interface SoundManifest { effects: Record<SoundEvent, SoundCue>; ambiences: Record<AmbiencePlace, { file: string; volume: number }>; crossfadeMs: number }

export const STANDARD_MANIFEST: SoundManifest = {
  effects: {
    manipulate: { file: 'sfx_manipulate', volume: 0.5, minimumIntervalMs: 35, haptic: 'selection' },
    error: { file: 'sfx_error_soft', volume: 0.6, minimumIntervalMs: 300, haptic: 'error' },
    lanternLit: { file: 'sfx_lantern_lit', volume: 0.8, minimumIntervalMs: 500, haptic: 'success' },
    shards: { file: 'sfx_shards', volume: 0.45, minimumIntervalMs: 200 },
    roomCompleted: { file: 'sfx_room_complete', volume: 0.85, minimumIntervalMs: 1000, haptic: 'success' },
    buildingCompleted: { file: 'sfx_building_complete', volume: 0.85, minimumIntervalMs: 1000, haptic: 'impactSoft' },
    unlock: { file: 'sfx_unlock', volume: 0.75, minimumIntervalMs: 500, haptic: 'impactMedium' },
    newDistrict: { file: 'sfx_new_district_theme', volume: 0.8, minimumIntervalMs: 2000, haptic: 'impactSoft' },
    hint: { file: 'sfx_hint_whisper', volume: 0.5, minimumIntervalMs: 300 },
    locked: { file: 'sfx_locked', volume: 0.5, minimumIntervalMs: 300 },
    uiTap: { file: 'sfx_ui_tap', volume: 0.3, minimumIntervalMs: 50 },
  },
  ambiences: Object.fromEntries(AMBIENCE_PLACES.map((p) => [p, { file: `amb_${p}`, volume: 0.55 }])) as SoundManifest['ambiences'],
  crossfadeMs: 2000,
};

export type AudioCommand =
  | { kind: 'startAmbience'; place: AmbiencePlace; file: string; volume: number; fadeInMs: number }
  | { kind: 'crossfade'; to: AmbiencePlace; file: string; volume: number; durationMs: number }
  | { kind: 'stopAmbience'; fadeOutMs: number }
  | { kind: 'playEffect'; event: SoundEvent; file: string; volume: number }
  | { kind: 'haptic'; haptic: Haptic }
  | { kind: 'suspend' }
  | { kind: 'resume' };

export class AudioDirector {
  place: AmbiencePlace | null = null;
  /** Ambiance chargée (en lecture, ou en pause en arrière-plan). */
  playing: AmbiencePlace | null = null;
  isActive = true;
  private lastPlayed = new Map<SoundEvent, number>();

  constructor(public settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS }, readonly manifest: SoundManifest = STANDARD_MANIFEST) {}

  get wantedAmbience(): AmbiencePlace | null { return this.settings.music ? this.place : null; }

  enter(place: AmbiencePlace | null): AudioCommand[] { this.place = place; return this.reconcile(); }

  /** `timeMs` : horloge monotone. */
  trigger(event: SoundEvent, timeMs: number): AudioCommand[] {
    if (!this.isActive) return [];
    const cue = this.manifest.effects[event];
    if (event === 'uiTap' && !this.settings.interfaceTaps) return [];
    const last = this.lastPlayed.get(event);
    if (last !== undefined && timeMs >= last && timeMs - last < cue.minimumIntervalMs) return [];
    this.lastPlayed.set(event, timeMs);
    const out: AudioCommand[] = [];
    if (this.settings.effects) out.push({ kind: 'playEffect', event, file: cue.file, volume: cue.volume });
    if (this.settings.haptics && cue.haptic) out.push({ kind: 'haptic', haptic: cue.haptic });
    return out;
  }

  update(settings: AudioSettings): AudioCommand[] { this.settings = { ...settings }; return this.reconcile(); }

  didEnterBackground(): AudioCommand[] {
    if (!this.isActive) return [];
    this.isActive = false;
    return [{ kind: 'suspend' }];
  }

  willEnterForeground(): AudioCommand[] {
    if (this.isActive) return [];
    this.isActive = true;
    this.lastPlayed.clear();
    return [{ kind: 'resume' }, ...this.reconcile()];
  }

  private reconcile(): AudioCommand[] {
    if (!this.isActive) return [];
    const wanted = this.wantedAmbience;
    if (wanted === this.playing) return [];
    const was = this.playing;
    this.playing = wanted;
    if (wanted === null) return was === null ? [] : [{ kind: 'stopAmbience', fadeOutMs: this.manifest.crossfadeMs }];
    const cue = this.manifest.ambiences[wanted];
    if (was === null) return [{ kind: 'startAmbience', place: wanted, file: cue.file, volume: cue.volume, fadeInMs: this.manifest.crossfadeMs }];
    return [{ kind: 'crossfade', to: wanted, file: cue.file, volume: cue.volume, durationMs: this.manifest.crossfadeMs }];
  }
}
