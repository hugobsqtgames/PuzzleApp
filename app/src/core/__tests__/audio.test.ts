import { AMBIENCE_PLACES, AudioDirector, SOUND_EVENTS, STANDARD_MANIFEST, decodeAudioSettings } from '../audio/director';
import { SeededRNG } from '../puzzlekit/rng';

describe('Directeur audio', () => {
  test('table complète, fichiers distincts', () => {
    for (const e of SOUND_EVENTS) expect(STANDARD_MANIFEST.effects[e]).toBeDefined();
    for (const p of AMBIENCE_PLACES) expect(STANDARD_MANIFEST.ambiences[p]).toBeDefined();
    expect(new Set(Object.values(STANDARD_MANIFEST.effects).map((c) => c.file)).size).toBe(SOUND_EVENTS.length);
  });
  test('ambiances : démarrage, fondu, arrêt', () => {
    const d = new AudioDirector();
    expect(d.enter('lighthouse')).toEqual([{ kind: 'startAmbience', place: 'lighthouse', file: 'amb_lighthouse', volume: 0.55, fadeInMs: 2000 }]);
    expect(d.enter('lighthouse')).toEqual([]);
    expect(d.enter('clockworks')).toEqual([{ kind: 'crossfade', to: 'clockworks', file: 'amb_clockworks', volume: 0.55, durationMs: 2000 }]);
    expect(d.enter(null)).toEqual([{ kind: 'stopAmbience', fadeOutMs: 2000 }]);
  });
  test('réglages séparés et anti-rafale', () => {
    const d = new AudioDirector();
    expect(d.trigger('lanternLit', 0)).toEqual([{ kind: 'playEffect', event: 'lanternLit', file: 'sfx_lantern_lit', volume: 0.8 }, { kind: 'haptic', haptic: 'success' }]);
    d.update({ ...d.settings, effects: false });
    expect(d.trigger('lanternLit', 10000)).toEqual([{ kind: 'haptic', haptic: 'success' }]);
    const e = new AudioDirector();
    let played = 0;
    for (let i = 0; i < 100; i++) if (e.trigger('manipulate', i * 10).length) played++;
    expect(played).toBe(25);
    expect(e.trigger('uiTap', 0)).toEqual([]);
  });
  test('arrière-plan : pause, décisions différées, reprise', () => {
    const d = new AudioDirector();
    d.enter('library');
    expect(d.didEnterBackground()).toEqual([{ kind: 'suspend' }]);
    expect(d.trigger('lanternLit', 1)).toEqual([]);
    expect(d.enter('observatory')).toEqual([]);
    expect(d.willEnterForeground()).toEqual([{ kind: 'resume' }, { kind: 'crossfade', to: 'observatory', file: 'amb_observatory', volume: 0.55, durationMs: 2000 }]);
  });
  test('stress : 10 000 actions, ambiance toujours cohérente', () => {
    const d = new AudioDirector(), rng = new SeededRNG(5n);
    let t = 0;
    for (let i = 0; i < 10000; i++) {
      t += rng.below(200);
      const r = rng.below(6);
      if (r === 0) d.enter(rng.chance(1, 8) ? null : rng.pick(AMBIENCE_PLACES));
      else if (r === 1) d.update({ ...d.settings, music: !d.settings.music });
      else if (r === 2) d.didEnterBackground();
      else if (r === 3) d.willEnterForeground();
      else d.trigger(rng.pick(SOUND_EVENTS), t);
      if (d.isActive) expect(d.playing).toBe(d.wantedAmbience);
    }
  });
  test('réglages : décodage tolérant', () => {
    expect(decodeAudioSettings({ music: false, effects: 'oui' })).toEqual({ music: false, effects: true, haptics: true, interfaceTaps: false });
    expect(decodeAudioSettings(null).music).toBe(true);
  });
});
