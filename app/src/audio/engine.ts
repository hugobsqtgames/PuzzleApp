/**
 * Sound engine: executes the decisions of the core AudioDirector with
 * expo-audio. Ambiences are chained with two players and a crossfade, so
 * the loop never has a gap; effects use one player each, reused.
 * Nothing here can crash the game: every native call is guarded.
 */
import { AppState, AppStateStatus, Platform } from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { AmbiencePlace, AudioCommand, AudioDirector, AudioSettings, DEFAULT_AUDIO_SETTINGS, SOUND_EVENTS, STANDARD_MANIFEST, SoundEvent, SoundManifest } from '../core/audio/director';
import { AMBIENCE_FILES, AMBIENCE_LOOP_SECONDS, AMBIENCE_OVERLAP_SECONDS, SFX_FILES } from './files';

/** Rendered ambiences (tools/audio/render.js) for each place of the director. */
export const PLACE_AMBIENCE: Record<AmbiencePlace, string> = {
  night: 'nuit', lighthouse: 'phare', library: 'nuit', clockworks: 'horlo',
  glasshouse: 'serre', market: 'marche', theatre: 'nuit', observatory: 'nuit',
};
/** Effects whose notes follow the scale of the current place. */
const PER_PLACE: Partial<Record<SoundEvent, string>> = {
  manipulate: 'manipulate', lanternLit: 'lanternLit', roomCompleted: 'roomComplete', buildingCompleted: 'roomComplete',
  unlock: 'unlock', newDistrict: 'newDistrict', hint: 'hint',
};
const SHARED: Partial<Record<SoundEvent, string>> = { error: 'error', shards: 'shards', locked: 'locked' };

const MANIFEST: SoundManifest = {
  ...STANDARD_MANIFEST,
  // Mix is baked into the files (the prototype's buses): play at full volume.
  effects: Object.fromEntries(SOUND_EVENTS.map((e) => [e, { ...STANDARD_MANIFEST.effects[e], volume: 1 }])) as SoundManifest['effects'],
  ambiences: Object.fromEntries(Object.entries(STANDARD_MANIFEST.ambiences).map(([k, v]) => [k, { ...v, volume: 1 }])) as SoundManifest['ambiences'],
};

type Haptic = (kind: 'selection' | 'success' | 'error' | 'impactSoft' | 'impactMedium') => void;

const safe = (f: () => void) => { try { f(); } catch { /* audio is never worth a crash */ } };

/**
 * Plays a player from its start. Rewinding is asynchronous: playing at once
 * could start from the end of the last play, and nothing would be heard.
 */
function playFromStart(p: AudioPlayer, volume: number) {
  safe(() => {
    p.volume = volume;
    let at = 0;
    safe(() => { at = p.currentTime; });
    if (at < 0.01) { p.play(); return; }
    p.pause();
    p.seekTo(0).then(() => safe(() => p.play()), () => safe(() => p.play()));
  });
}

/**
 * A few players per sound, loaded ahead: creating a player loads its file
 * (a stall, and a silent first note), and one player cannot ring twice at once.
 */
class SoundPool {
  private pools = new Map<string, { players: AudioPlayer[]; next: number }>();
  constructor(private size: (key: string) => number) {}
  preload(keys: string[]) { for (const k of keys) this.get(k); }
  play(key: string, volume: number) {
    const pool = this.get(key);
    if (!pool) return;
    // Round robin, preferring a player that is not sounding.
    let i = pool.next;
    for (let k = 0; k < pool.players.length; k++) {
      const j = (pool.next + k) % pool.players.length;
      let busy = true;
      safe(() => { busy = pool.players[j].playing; });
      if (!busy) { i = j; break; }
    }
    pool.next = (i + 1) % pool.players.length;
    playFromStart(pool.players[i], volume);
  }
  pauseAll() { this.pools.forEach((pool) => pool.players.forEach((p) => safe(() => p.pause()))); }
  private get(key: string) {
    const hit = this.pools.get(key);
    if (hit) return hit;
    const src = SFX_FILES[key];
    if (src === undefined) return null;
    const players: AudioPlayer[] = [];
    for (let k = 0; k < this.size(key); k++) safe(() => { players.push(createAudioPlayer(src)); });
    if (!players.length) return null;
    const pool = { players, next: 0 };
    this.pools.set(key, pool);
    return pool;
  }
}

class AmbienceLoop {
  private players: AudioPlayer[] = [];
  private active = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private fades = new Set<ReturnType<typeof setInterval>>();
  private paused = false;

  constructor(readonly key: string, private target: number) {
    const src = AMBIENCE_FILES[key];
    for (let i = 0; i < 2; i++) {
      const p = createAudioPlayer(src);
      safe(() => { p.volume = 0; p.loop = false; });
      this.players.push(p);
    }
  }

  start(fadeMs: number) {
    const p = this.players[this.active];
    playFromStart(p, 0);
    this.fade(p, 0, this.target, fadeMs);
    this.schedule(AMBIENCE_LOOP_SECONDS * 1000);
  }

  /** Starts the other player before the end of this one and crossfades. */
  private schedule(ms: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.paused) return;
      const from = this.players[this.active];
      this.active = 1 - this.active;
      const to = this.players[this.active];
      // The other player ended its last turn at the end of the file: it must rewind before playing.
      playFromStart(to, 0);
      const overlap = AMBIENCE_OVERLAP_SECONDS * 1000;
      this.fade(to, 0, this.target, overlap);
      this.fade(from, this.target, 0, overlap, () => safe(() => from.pause()));
      this.schedule(AMBIENCE_LOOP_SECONDS * 1000);
    }, ms);
  }

  private fade(p: AudioPlayer, a: number, b: number, ms: number, done?: () => void) {
    if (ms <= 0) { safe(() => { p.volume = b; }); done?.(); return; }
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    const id = setInterval(() => {
      i++;
      // Equal-power curve: no dip in the middle of a crossfade.
      const t = i / steps;
      const v = a < b ? b * Math.sin((t * Math.PI) / 2) : a * Math.cos((t * Math.PI) / 2);
      safe(() => { p.volume = Math.max(0, Math.min(1, v)); });
      if (i >= steps) { clearInterval(id); this.fades.delete(id); done?.(); }
    }, 50);
    this.fades.add(id);
  }

  stop(fadeMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    for (const p of this.players) {
      let from = 0;
      safe(() => { from = p.volume; });
      if (from > 0) this.fade(p, from, 0, fadeMs);
    }
    setTimeout(() => this.release(), fadeMs + 200);
  }

  pause() {
    this.paused = true;
    if (this.timer) clearTimeout(this.timer);
    for (const p of this.players) safe(() => p.pause());
  }

  resume() {
    this.paused = false;
    const p = this.players[this.active];
    safe(() => { p.volume = this.target; p.play(); });
    // Remaining time of the current copy is unknown after a pause: restart the schedule from its position.
    let left = AMBIENCE_LOOP_SECONDS * 1000;
    safe(() => { left = Math.max(1000, (AMBIENCE_LOOP_SECONDS - p.currentTime) * 1000); });
    this.schedule(left);
  }

  release() {
    this.fades.forEach(clearInterval);
    this.fades.clear();
    for (const p of this.players) safe(() => { p.pause(); p.release(); });
    this.players = [];
  }
}

export class SoundEngine {
  readonly director: AudioDirector;
  private ambience: AmbienceLoop | null = null;
  // Bells can ring fast, one after the other: three players each; two for the other effects.
  private sfx = new SoundPool((key) => (key.startsWith('bell_') ? 3 : 2));
  private place: AmbiencePlace = 'lighthouse';
  private appState: AppStateStatus = AppState.currentState;
  /** Browsers block audio until the first interaction; phones do not. */
  private unlocked = Platform.OS !== 'web';

  constructor(private haptic: Haptic, settings: AudioSettings = DEFAULT_AUDIO_SETTINGS) {
    this.director = new AudioDirector({ ...settings }, MANIFEST);
    safe(() => { void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {}); });
    if (!this.unlocked && typeof document !== 'undefined') {
      const unlock = () => {
        this.unlocked = true;
        document.removeEventListener('pointerdown', unlock);
        const playing = this.director.playing;
        if (playing) safe(() => { this.ambience = new AmbienceLoop(PLACE_AMBIENCE[playing], 1); this.ambience.start(1500); });
      };
      document.addEventListener('pointerdown', unlock);
    }
    AppState.addEventListener('change', (next) => {
      const was = this.appState;
      this.appState = next;
      if (was === 'active' && next !== 'active') this.run(this.director.didEnterBackground());
      else if (was !== 'active' && next === 'active') this.run(this.director.willEnterForeground());
    });
  }

  setSettings(s: AudioSettings) { this.run(this.director.update(s)); }

  enter(place: AmbiencePlace) {
    this.place = place;
    // The effects of this place are loaded now, not at their first use.
    if (this.unlocked) this.sfx.preload([...Object.keys(PER_PLACE).map((e) => this.effectKey(e as SoundEvent)!), ...Object.values(SHARED)]);
    this.run(this.director.enter(place));
  }

  /** Loads the Carillon's bells before its melody plays. */
  preloadBells() { if (this.unlocked) this.sfx.preload([0, 1, 2, 3, 4, 5].map((i) => `bell_${i}`)); }

  play(event: SoundEvent) {
    this.run(this.director.trigger(event, Date.now()));
  }

  /** One bell of the Carillon (0…5), low to high. Follows the "Effets sonores" setting. */
  note(i: number) {
    if (!this.unlocked || !this.director.settings.effects) return;
    this.sfx.play(`bell_${Math.max(0, Math.min(5, i))}`, 0.9);
  }

  private effectKey(event: SoundEvent): string | null {
    const per = PER_PLACE[event];
    if (per) return `${per}_${PLACE_AMBIENCE[this.place]}`;
    return SHARED[event] ?? null;
  }

  private run(commands: AudioCommand[]) {
    for (const c of commands) {
      if (!this.unlocked && c.kind !== 'haptic') continue;
      switch (c.kind) {
        case 'startAmbience':
        case 'crossfade': {
          const key = PLACE_AMBIENCE[c.kind === 'startAmbience' ? c.place : c.to];
          const ms = c.kind === 'startAmbience' ? c.fadeInMs : c.durationMs;
          if (this.ambience?.key === key) break; // two places share the same file: keep playing
          this.ambience?.stop(ms);
          safe(() => { this.ambience = new AmbienceLoop(key, 1); this.ambience.start(ms); });
          break;
        }
        case 'stopAmbience':
          this.ambience?.stop(c.fadeOutMs);
          this.ambience = null;
          break;
        case 'playEffect': {
          const key = this.effectKey(c.event);
          if (key) this.sfx.play(key, c.volume);
          break;
        }
        case 'haptic':
          this.haptic(c.haptic);
          break;
        case 'suspend':
          this.ambience?.pause();
          this.sfx.pauseAll();
          break;
        case 'resume':
          this.ambience?.resume();
          break;
      }
    }
  }
}
