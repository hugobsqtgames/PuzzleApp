/**
 * The game's single source of truth, shared by every screen. Rules come from
 * the core (GameEngine, Progression, wallet, streak); the save is the core's
 * SaveStore (atomic, backed up, checksummed). The state is always changed
 * before any animation, so leaving the app mid-celebration loses nothing.
 */
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { GameEngine, Celebration, WELCOME_SHARDS } from '../core/game/engine';
import { GameState, cloneState, credit, debit, newGameState } from '../core/game/state';
import { SaveStore } from '../core/persistence/saveStore';
import { SideFile } from '../core/persistence/sideFile';
import { localDayKey, DayKey } from '../core/game/dayKey';
import { HintLevel } from '../core/puzzlekit/types';
import { AudioSettings, SoundEvent } from '../core/audio/director';
import { SoundEngine } from '../audio/engine';
import { DEFAULT_SETTINGS, Settings, decodeSide, exportText, parseImport } from './saveText';
import type { Code } from './catalog';
import { WORLD, dailyPuzzle, eventPuzzle, eventSize, puzzleFor, FAMILIES, CONTENT_VERSION } from './catalog';
import { EVENTS, EventId, eventDone } from './seasons';
import { syncAppIcon } from './appIcon';
import { syncWidget } from './widget';
import { APP_VERSION } from '../content/whatsNew';
import { Session, giveHint, hintCost, progressOf, record, startSession } from './session';
import { ACHIEVEMENTS, COSMETICS, Profile, Slot, achievementContext, achievementStatus, newProfile, owns, starsOf } from './rewards';
import { SAVE_DIRECTORY, deviceFS } from './files';
import { scheduleReminders } from './reminders';
import { inFrench, lang, tr } from '../i18n';

export { DEFAULT_SETTINGS, type Settings } from './saveText';

export interface Result {
  session: Session;
  celebrations: Celebration[];
  replay: boolean;
  minimalMoves?: number;
  newAchievements: string[];
}

interface Store {
  ready: boolean;
  /** The save exists but could not be read: progress is not written until the next launch. */
  readOnly: boolean;
  state: GameState;
  engine: GameEngine;
  settings: Settings;
  profile: Profile;
  result: Result | null;
  toast: { text: string; icon?: string } | null;
  today: DayKey;
  showToast(text: string, icon?: string): void;
  openLantern(id: string): boolean;
  openDaily(day: DayKey): boolean;
  /** The n-th puzzle (0-based) of this year's seasonal event. */
  openEvent(id: EventId, year: number, n: number): boolean;
  /** A puzzle of the mode Libre (made by makeFreePuzzle). */
  openFree(p: import('./catalog').PlayablePuzzle): void;
  updateSession(s: Session): void;
  leaveSession(): void;
  finishSession(s: Session): Result | null;
  /** Buys (or takes, for the free Murmure) the next hint level. */
  buyHint(s: Session, level: HintLevel): { session: Session } | { missing: number } | null;
  buyCosmetic(id: string): boolean;
  equip(slot: Slot, id: string): void;
  setSettings(patch: Partial<Settings>): void;
  completeOnboarding(): void;
  markSeen(key: string): void;
  noteProfile(patch: (p: Profile) => Profile): void;
  /** A secret of Vesper found (easter egg): counted once. */
  findEgg(id: string): void;
  /** Whole days since the previous launch (0 on a first launch): Nilo's welcome back. */
  daysAway: number;
  /** The player found the room's object in the lit scene. */
  pickObject(roomId: string): void;
  play(event: SoundEvent): void;
  /** A bell of the Carillon. */
  note(i: number): void;
  enterPlace(place: Parameters<SoundEngine['enter']>[0]): void;
  haptic(kind: 'selection' | 'success' | 'error' | 'impactSoft' | 'impactMedium'): void;
  /** Listens to the sound events (sound captions). Returns an unsubscribe. */
  onSound(cb: (e: SoundEvent) => void): () => void;
  resetProgress(): Promise<void>;
  exportProgress(): string;
  importProgress(text: string): boolean;
}

/** The haptic of a move, by family (the others: a light selection tick). */
const FAMILY_TOUCH: Partial<Record<Code, 'impactSoft' | 'impactMedium'>> = {
  GL: 'impactMedium', TQ: 'impactMedium',
  IN: 'impactSoft', MI: 'impactSoft', BR: 'impactSoft', LU: 'impactSoft', PA: 'impactSoft', EN: 'impactSoft', FI: 'impactSoft', MA: 'impactSoft', RU: 'impactSoft',
};

const Ctx = createContext<Store | null>(null);
/**
 * The puzzle being played, on its own: it changes at every move, and only the
 * puzzle screen reads it (the screens behind it are not redrawn at each tap).
 */
const SessionCtx = createContext<Session | null>(null);
/** Shards for each puzzle of a seasonal event (once per year and puzzle). */
export const EVENT_SHARDS = 15;
const engine = new GameEngine(WORLD);
const saveStore = new SaveStore(deviceFS, SAVE_DIRECTORY, `content-${CONTENT_VERSION}`);
const sideFile = new SideFile(deviceFS, SAVE_DIRECTORY);


export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [state, setState] = useState<GameState>(newGameState);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<Profile>(newProfile);
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [toast, setToast] = useState<Store['toast']>(null);
  const [today, setToday] = useState<DayKey>(() => localDayKey(new Date()));
  const [daysAway, setDaysAway] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values for callbacks (every writer below also updates them at once).
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  const profileRef = useRef(profile);
  const sessionRef = useRef(session);
  useLayoutEffect(() => { stateRef.current = state; settingsRef.current = settings; profileRef.current = profile; sessionRef.current = session; });

  const haptic = useCallback((kind: 'selection' | 'success' | 'error' | 'impactSoft' | 'impactMedium') => {
    if (!settingsRef.current.haptics) return;
    try {
      if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'error') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else if (kind === 'selection') void Haptics.selectionAsync();
      else void Haptics.impactAsync(kind === 'impactMedium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    } catch { /* no haptics here */ }
  }, []);
  const sound = useMemo(() => new SoundEngine((k) => haptic(k)), [haptic]);
  // Each family has its own touch under the finger: a heavy block, a soft thread, a light tap.
  const sessionCode = session?.code;
  useEffect(() => { sound.setTouch(sessionCode ? FAMILY_TOUCH[sessionCode] ?? null : null); }, [sound, sessionCode]);

  // ---------------------------------------------------------------- persistence
  // Settings and profile (objects found, house, album…): their own file, kept as safely as the game.
  const writeSide = useCallback(async (s: Settings, p: Profile) => {
    try { await sideFile.write(JSON.stringify({ v: 1, at: new Date().toISOString(), settings: s, profile: p })); } catch { /* retried at the next change */ }
  }, []);

  const saving = useRef<Promise<void>>(Promise.resolve());
  const save = useCallback((s: GameState, replace = false) => {
    saving.current = saving.current.then(() => (replace ? saveStore.replace(s) : saveStore.save(s))).catch(() => { /* not loaded or storage error: next save retries */ });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await saveStore.load().catch(() => null);
      let side: ReturnType<typeof decodeSide> = { settings: { ...DEFAULT_SETTINGS }, profile: newProfile() };
      try { const got = await sideFile.read(); if (got.text !== null) side = decodeSide(got.text); } catch { /* defaults */ }
      if (!alive) return;
      if (loaded) { setState(loaded.state); setReadOnly(loaded.source === 'unavailable'); } else setReadOnly(true);
      if (side.legacyObjects && loaded) {
        side.profile = { ...side.profile, picked: [...loaded.state.collectibles].filter((c) => c.startsWith('collectible.')).map((c) => c.slice('collectible.'.length)) };
        void writeSide(side.settings, side.profile);
      }
      setSettingsState(side.settings);
      // Days since the last launch, then this launch is remembered.
      const last = side.profile.lastSeen ? Date.parse(side.profile.lastSeen) : NaN;
      setDaysAway(Number.isNaN(last) ? 0 : Math.max(0, Math.floor((Date.now() - last) / 86_400_000)));
      // A fresh install has nothing new to announce: it starts at this version.
      side.profile = { ...side.profile, lastSeen: new Date().toISOString(), seenVersion: side.profile.seenVersion ?? APP_VERSION };
      void writeSide(side.settings, side.profile);
      setProfile(side.profile);
      sound.setSettings({ music: side.settings.music, effects: side.settings.effects, haptics: side.settings.haptics, interfaceTaps: false });
      sound.setChime(side.settings.chime);
      sound.setVolumes(side.settings.musicVolume, side.settings.effectsVolume);
      void syncAppIcon(side.settings.seasonIcon);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [sound, writeSide]);

  // Day change while the app is open (midnight): the daily puzzle and reminders follow.
  useEffect(() => {
    const id = setInterval(() => { const d = localDayKey(new Date()); setToday((old) => (old === d ? old : d)); }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Reminders are (re)planned at each launch, day change, daily success and language change
  // (their text is written in the language of the moment; the layout sets it before effects run).
  useEffect(() => {
    if (!ready) return;
    void scheduleReminders({ enabled: settings.reminder, hour: settings.reminderHour, minute: settings.reminderMinute, doneToday: state.daily.completedDays.has(today), streak: state.daily.streak });
  }, [ready, settings.reminder, settings.reminderHour, settings.reminderMinute, settings.language, state.daily.completedDays, state.daily.streak, today]);

  const commit = useCallback((next: GameState, replace = false) => {
    stateRef.current = next;
    setState(next);
    save(next, replace);
  }, [save]);

  const commitProfile = useCallback((next: Profile) => {
    profileRef.current = next;
    setProfile(next);
    void writeSide(settingsRef.current, next);
  }, [writeSide]);

  // Toasts are queued: two messages never overwrite each other.
  const toastQueue = useRef<{ text: string; icon?: string }[]>([]);
  const nextToast = useCallback(function next() {
    const t = toastQueue.current.shift() ?? null;
    setToast(t);
    toastTimer.current = t ? setTimeout(next, 2600 + Math.min(1400, t.text.length * 18)) : null;
  }, []);
  const showToast = useCallback((text: string, icon?: string) => {
    if (toastQueue.current.some((t) => t.text === text)) return;
    toastQueue.current.push({ text, icon });
    if (!toastTimer.current) nextToast();
  }, [nextToast]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  /** Credits newly completed achievements (once each). Returns their names. */
  const creditAchievements = useCallback((s: GameState, p: Profile): string[] => {
    const ctx = achievementContext(s, engine.progression, p);
    const names: string[] = [];
    for (const { a, done } of achievementStatus(ctx)) {
      if (!done) continue;
      try { if (credit(s.wallet, a.reward, `achievement:${a.id}`)) names.push(a.name); } catch { /* never block */ }
    }
    return names;
  }, []);

  /** History labels are stored in French (`label` is read with French texts) and translated when shown. */
  const addHistory = (p: Profile, label: () => string, amount: number): Profile =>
    amount === 0 ? p : { ...p, history: [...p.history, { label: inFrench(label), amount, at: new Date().toISOString() }].slice(-30) };

  // ---------------------------------------------------------------- sessions
  const openLantern = useCallback((id: string) => {
    const s = stateRef.current;
    const p = puzzleFor(id);
    if (!p || !engine.progression.isPlayable(id, s)) return false;
    const place = engine.progression.locate(id);
    if (place && !profileRef.current.visited.includes(place.district.id)) commitProfile({ ...profileRef.current, visited: [...profileRef.current.visited, place.district.id] });
    if (p.code === 'CR') sound.preloadBells(); // loaded before the melody plays
    setSession(startSession(p, 'lantern', new Date(), s.inProgress.get(id)));
    setResult(null);
    return true;
  }, [commitProfile, sound]);

  const openDaily = useCallback((day: DayKey) => {
    const p = dailyPuzzle(day);
    if (!p) return false;
    if (p.code === 'CR') sound.preloadBells();
    setSession({ ...startSession(p, 'daily', new Date()), id: `daily.${day}` });
    setResult(null);
    return true;
  }, [sound]);

  const openEvent = useCallback((id: EventId, year: number, n: number) => {
    const p = eventPuzzle(id, n);
    if (!p) return false;
    if (p.code === 'CR') sound.preloadBells();
    // The session id carries the year: each year's event is played anew.
    setSession({ ...startSession(p, 'event', new Date()), id: `event.${id}.${year}.${n + 1}` });
    setResult(null);
    return true;
  }, [sound]);

  const openFree = useCallback((p: import('./catalog').PlayablePuzzle) => {
    if (p.code === 'CR') sound.preloadBells();
    setSession({ ...startSession(p, 'free', new Date()), id: p.id });
    setResult(null);
  }, [sound]);

  const updateSession = useCallback((s: Session) => { sessionRef.current = s; setSession(s); }, []);

  /** Keeps the board of an unfinished lantern (GameState.inProgress). */
  const leaveSession = useCallback(() => {
    const s = sessionRef.current;
    if (s && !s.solved && s.kind === 'lantern' && (s.moves > 0 || s.history.length > 0)) {
      const next = cloneState(stateRef.current);
      next.inProgress.set(s.id, progressOf(s));
      commit(next);
    }
  }, [commit]);

  // Leaving the app mid-puzzle (home button, call, app killed later) keeps the board.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') leaveSession(); });
    return () => sub.remove();
  }, [leaveSession]);

  const finishSession = useCallback((s: Session): Result | null => {
    if (s.solved) return null;
    const now = new Date();
    const next = cloneState(stateRef.current);
    let p = profileRef.current;
    let celebrations: Celebration[] = [];
    let replay = false;
    let minimalMoves: number | undefined;
    if (s.kind === 'lantern') {
      replay = next.solved.has(s.id);
      const before = next.solved.get(s.id);
      celebrations = engine.puzzleSolved(s.id, record(s, now), next);
      // A replay never takes anything away: only a better mastery (more stars) is kept.
      if (before && starsOf(record(s, now)) > starsOf(before)) next.solved.set(s.id, { ...record(s, now), solvedAt: before.solvedAt });
      next.inProgress.delete(s.id);
      if (!replay) {
        const secs = Math.round((now.getTime() - Date.parse(s.startedAt)) / 1000);
        if (secs > 0 && secs < 86400) p = { ...p, durations: p.durations.map((d, t) => (t === s.tier ? [...d, secs].slice(-100) : d)) };
        for (const c of celebrations) {
          if (c.kind === 'lanternLit') p = addHistory(p, () => `Lanterne · ${FAMILIES[s.code].name}`, c.shards + c.clairvoyanceBonus);
          if (c.kind === 'roomCompleted') p = addHistory(p, () => 'Salle entièrement éclairée', c.shards);
          if (c.kind === 'buildingCompleted') p = addHistory(p, () => 'Bâtiment entièrement éclairé', c.shards);
          if (c.kind === 'districtCompleted') p = addHistory(p, () => 'Quartier entièrement éclairé', c.shards);
        }
      }
    } else if (s.kind === 'free') {
      // Mode Libre: nothing is won or recorded, it is only for the pleasure of it.
      celebrations = [];
    } else if (s.kind === 'event') {
      // event.<id>.<year>.<n>: a light for the event, a few Shards, and its milestones once and for all.
      const [, id, year] = s.id.split('.') as [string, EventId, string];
      replay = next.seenDialogue.has(s.id);
      next.seenDialogue.add(s.id);
      const shards = replay ? 0 : EVENT_SHARDS;
      if (shards) credit(next.wallet, shards, `event:${s.id}`);
      const solved = eventDone(next, id, Number(year), eventSize(id)).filter(Boolean).length;
      const gift = EVENTS[id].milestones.find(([n, flag]) => solved >= n && !next.seenDialogue.has(flag))?.[2] ?? null;
      for (const [n, flag] of EVENTS[id].milestones) if (solved >= n) next.seenDialogue.add(flag);
      if (shards) p = addHistory(p, () => `${EVENTS[id].name} · ${FAMILIES[s.code].name}`, shards);
      celebrations = [{ kind: 'eventLit', event: id, solved, total: eventSize(id), shards, gift } as unknown as Celebration];
    } else {
      const day = s.id.slice('daily.'.length) as DayKey;
      celebrations = engine.dailySolved(day, new Date(s.startedAt), now, next);
      const c = celebrations[0];
      if (c && c.kind === 'dailyCompleted') {
        replay = c.result.kind === 'alreadyDone';
        if (c.result.kind === 'caughtUp') p = { ...p, catchUps: p.catchUps + 1 };
        p = addHistory(p, () => `Défi du soir · ${FAMILIES[s.code].name}`, c.shards);
      }
    }
    if (s.code === 'IN') {
      const e = FAMILIES.IN.engine as import('../core/families/switches').SwitchesFamily;
      const min = e.minimalSolution(s.data, s.data.initiallyLit);
      if (min) {
        minimalMoves = min.presses.filter(Boolean).length;
        if (!s.usedSolution && s.state.moves === minimalMoves && !replay && s.kind !== 'free') p = { ...p, thrifty: p.thrifty + 1 };
      }
    }
    if (s.wrongAnswers === 1 && !s.usedSolution && s.kind !== 'free') p = { ...p, oops: p.oops + 1 };
    const newAchievements = creditAchievements(next, p);
    for (const name of newAchievements) {
      const a = ACHIEVEMENTS.find((x) => x.name === name);
      p = addHistory(p, () => `Succès · ${a?.name ?? name}`, a?.reward ?? 0);
    }
    commit(next);
    commitProfile(p);
    const done = { ...s, solved: true };
    setSession(done);
    const r: Result = { session: done, celebrations, replay, minimalMoves, newAchievements };
    setResult(r);
    return r;
  }, [commit, commitProfile, creditAchievements]);

  const buyHint = useCallback((s: Session, level: HintLevel) => {
    const cost = hintCost(s, level);
    // Every Murmure counts for « Chut », free or not.
    const noteWhisper = () => { if (level === HintLevel.Whisper && s.kind !== 'free') commitProfile({ ...profileRef.current, murmures: profileRef.current.murmures + 1 }); };
    if (cost === 0) {
      const next = giveHint(s, level, 0);
      if (!next) return null;
      noteWhisper();
      setSession(next);
      return { session: next };
    }
    const st = cloneState(stateRef.current);
    const purchase = engine.buyHint(level, s.id, s.hint.stale ? s.hint.step + 1 : s.hint.step, st, cost);
    if (purchase.kind === 'insufficientBalance') return { missing: purchase.missing };
    const next = giveHint(s, level, cost);
    if (!next) return null;
    if (purchase.kind === 'granted') {
      commit(st);
      commitProfile(addHistory(profileRef.current, () => `${['Murmure', 'Piste', 'Éclairage', 'Solution'][level - 1]} · ${FAMILIES[s.code].name}`, -purchase.cost));
    }
    noteWhisper();
    setSession(next);
    return { session: next };
  }, [commit, commitProfile]);

  const buyCosmetic = useCallback((id: string) => {
    const c = COSMETICS.find((x) => x.id === id);
    if (!c || !c.price) return false;
    const next = cloneState(stateRef.current);
    try {
      if (!debit(next.wallet, c.price, `cosmetic:${id}`)) return false;
    } catch { return false; }
    next.ownedCosmetics.add(id);
    next.equippedCosmetics.set(c.slot, id);
    commit(next);
    commitProfile(addHistory(profileRef.current, () => c.name, -c.price));
    return true;
  }, [commit, commitProfile]);

  const equip = useCallback((slot: Slot, id: string) => {
    const c = COSMETICS.find((x) => x.id === id);
    const next = cloneState(stateRef.current);
    if (!c || !owns(c, next, achievementContext(next, engine.progression, profileRef.current))) return;
    next.equippedCosmetics.set(slot, id);
    commit(next);
  }, [commit]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettingsState(next);
    sound.setSettings({ music: next.music, effects: next.effects, haptics: next.haptics, interfaceTaps: false } as AudioSettings);
    sound.setChime(next.chime);
    sound.setVolumes(next.musicVolume, next.effectsVolume);
    if (patch.seasonIcon !== undefined) void syncAppIcon(next.seasonIcon);
    void writeSide(next, profileRef.current);
  }, [sound, writeSide]);

  const completeOnboarding = useCallback(() => {
    if (stateRef.current.onboardingDone) return;
    const next = cloneState(stateRef.current);
    next.onboardingDone = true;
    // A welcome gift: the first Piste is never out of reach (credited once, by its id).
    if (credit(next.wallet, WELCOME_SHARDS, 'gift:welcome')) commitProfile(addHistory(profileRef.current, () => 'Cadeau de bienvenue', WELCOME_SHARDS));
    commit(next);
  }, [commit, commitProfile]);

  const markSeen = useCallback((key: string) => {
    if (stateRef.current.seenDialogue.has(key)) return;
    const next = cloneState(stateRef.current);
    next.seenDialogue.add(key);
    commit(next);
  }, [commit]);

  const noteProfile = useCallback((patch: (p: Profile) => Profile) => {
    const p = patch(profileRef.current);
    const st = cloneState(stateRef.current);
    const names = creditAchievements(st, p);
    commitProfile(p);
    if (names.length) { commit(st); showToast(names.length <= 3 ? tr('Succès : {0}', [names.join(', ')]) : tr('{0} succès débloqués. Retrouve-les dans le Carnet.', [names.length]), 'star'); }
  }, [commit, commitProfile, creditAchievements, showToast]);

  const findEgg = useCallback((id: string) => {
    if (profileRef.current.eggs.includes(id)) return;
    noteProfile((p) => ({ ...p, eggs: [...p.eggs, id] }));
  }, [noteProfile]);

  const pickObject = useCallback((roomId: string) => {
    if (profileRef.current.picked.includes(roomId)) return;
    commitProfile({ ...profileRef.current, picked: [...profileRef.current.picked, roomId] });
  }, [commitProfile]);

  const enterPlace = useCallback((place: Parameters<SoundEngine['enter']>[0]) => {
    sound.enter(place);
    if (settingsRef.current.music && !profileRef.current.themes.includes(place)) {
      noteProfile((p) => ({ ...p, themes: [...p.themes, place] }));
    }
  }, [sound, noteProfile]);

  const resetProgress = useCallback(async () => {
    const fresh = newGameState();
    fresh.onboardingDone = true;
    // The backup copy is erased too: the old game can never come back mixed into the new one.
    commit(fresh, true);
    // A new game, but the app keeps knowing it already asked for a rating and which version's news were seen.
    commitProfile({ ...newProfile(), reviewAsked: profileRef.current.reviewAsked, seenVersion: profileRef.current.seenVersion });
    setSession(null);
    setResult(null);
  }, [commit, commitProfile]);

  // The found objects travel with the progress (they live in the side file, not in the game state).
  const exportProgress = useCallback(() => exportText(stateRef.current, profileRef.current.picked), []);

  const importProgress = useCallback((text: string) => {
    const got = parseImport(text);
    if (!got) return false;
    commit(got.state, true);
    commitProfile({ ...profileRef.current, picked: got.picked });
    return true;
  }, [commit, commitProfile]);

  // The home-screen widget follows the streak and tonight's challenge.
  useEffect(() => {
    if (!ready) return;
    const d = dailyPuzzle(today);
    syncWidget({ streak: state.daily.streak, dailyDone: state.daily.completedDays.has(today), dailyFamily: d ? FAMILIES[d.code].name : '', dailyDay: today, lights: engine.progression.totalLights(state), lang: lang() });
  }, [ready, state, today, settings.language]);

  const value = useMemo<Store>(() => ({
    ready, readOnly, state, engine, settings, profile, result, toast, today, daysAway,
    showToast, openLantern, openDaily, openEvent, openFree, updateSession, leaveSession, finishSession, buyHint, buyCosmetic, equip, setSettings,
    completeOnboarding, markSeen, noteProfile, findEgg, pickObject, play: (e) => sound.play(e), note: (i) => sound.note(i), onSound: (cb) => sound.onSound(cb), enterPlace, haptic, resetProgress, exportProgress, importProgress,
  }), [ready, readOnly, state, settings, profile, result, toast, today, daysAway, showToast, openLantern, openDaily, openEvent, openFree, updateSession, leaveSession, finishSession,
    buyHint, buyCosmetic, equip, setSettings, completeOnboarding, markSeen, noteProfile, findEgg, pickObject, sound, enterPlace, haptic, resetProgress, exportProgress, importProgress]);

  return <Ctx.Provider value={value}><SessionCtx.Provider value={session}>{children}</SessionCtx.Provider></Ctx.Provider>;
}

/** The puzzle being played (null outside a puzzle). */
export const useSession = () => useContext(SessionCtx);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside GameProvider');
  return v;
}
