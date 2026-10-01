// Nothing the player has earned is lost: the profile file, the exported text,
// and a content update that adds lanterns.
import { SeededRNG } from '../puzzlekit/rng';
import { credit, encodeState, newGameState } from '../game/state';
import { DEFAULT_SETTINGS, decodeSide, exportText, parseImport } from '../../game/saveText';
import { CHIME_THEMES } from '../../audio/chime';
import { WORLD } from '../../game/catalog';
import { GameEngine } from '../game/engine';

const sample = () => {
  const s = newGameState();
  s.solved.set('phare.b1.r1.1', { solvedAt: '2026-09-21T14:13:20.000Z', paidHints: 1, wrongAnswers: 0, usedSolution: false });
  s.solved.set('phare.b1.r1.2', { solvedAt: '2026-09-21T14:20:00.000Z', paidHints: 0, wrongAnswers: 2, usedSolution: false });
  credit(s.wallet, 42, 'puzzle:phare.b1.r1.1');
  s.daily.completedDays.add('2026-09-29'); s.daily.streak = 3; s.daily.bestStreak = 3;
  s.collectibles.add('collectible.phare.b1.r1');
  s.equippedCosmetics.set('hat', 'bonnet'); s.onboardingDone = true;
  return s;
};

describe('Fichier profil (réglages, succès, objets trouvés)', () => {
  const full = JSON.stringify({
    settings: { ...DEFAULT_SETTINGS, music: false, language: 'en', chime: 'harp', reminderHour: 21 },
    profile: { murmures: 7, eggs: ['42', 'midnight'], picked: ['phare.b1.r1'], lastSeen: '2026-09-30T20:00:00.000Z', history: [{ label: 'x', amount: 3, at: '2026-09-30' }] },
  });

  test('relu à l’identique', () => {
    const d = decodeSide(full);
    expect(d.settings).toMatchObject({ music: false, language: 'en', chime: 'harp', reminderHour: 21 });
    expect(d.profile).toMatchObject({ murmures: 7, eggs: ['42', 'midnight'], picked: ['phare.b1.r1'], lastSeen: '2026-09-30T20:00:00.000Z' });
    expect(d.legacyObjects).toBe(false);
  });

  test('valeurs impossibles remplacées, le reste gardé', () => {
    const d = decodeSide(JSON.stringify({ settings: { language: 'klingon', chime: 'drums', reminderHour: 99, music: 'yes' }, profile: { murmures: -4, picked: ['phare.b1.r1', 3, null] } }));
    expect(d.settings.language).toBe('auto');
    expect(d.settings.chime).toBe('bells');
    expect(d.settings.reminderHour).toBe(23);
    expect(d.settings.music).toBe(true);
    expect(d.profile.murmures).toBe(0);
    expect(d.profile.picked).toEqual(['phare.b1.r1']);
  });

  test('fuzz : 2 000 fichiers abîmés, jamais d’exception, toujours des réglages valides', () => {
    const rng = new SeededRNG(7n);
    for (let i = 0; i < 2000; i++) {
      const chars = full.split('');
      const cuts = 1 + rng.int(0, 5);
      for (let k = 0; k < cuts; k++) {
        const at = rng.int(0, chars.length - 1);
        const op = rng.int(0, 2);
        if (op === 0) chars.splice(at, rng.int(1, 12));
        else if (op === 1) chars[at] = '{}[]",:0aé\u0000'[rng.int(0, 11)];
        else chars.splice(at, 0, '"x":1,');
      }
      const d = decodeSide(chars.join(''));
      for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]) expect(typeof d.settings[k]).toBe(typeof DEFAULT_SETTINGS[k]);
      expect(['auto', 'fr', 'en']).toContain(d.settings.language);
      expect(CHIME_THEMES).toContain(d.settings.chime);
      expect(Array.isArray(d.profile.picked)).toBe(true);
    }
  });
});

describe('Exporter puis importer sa progression', () => {
  test('aller-retour exact, objets trouvés compris', () => {
    const s = sample();
    const got = parseImport(exportText(s, ['phare.b1.r1']));
    expect(got).not.toBeNull();
    expect(encodeState(got!.state)).toEqual(encodeState(s));
    expect(got!.picked).toEqual(['phare.b1.r1']);
  });

  test('un objet d’une salle non éclairée n’est pas importé', () => {
    const got = parseImport(exportText(sample(), ['phare.b1.r1', 'horlo.b2.r3']));
    expect(got!.picked).toEqual(['phare.b1.r1']);
  });

  test('ancien export sans objets : les objets des salles éclairées restent trouvés', () => {
    const text = JSON.parse(exportText(sample(), []));
    delete text.picked;
    expect(parseImport(JSON.stringify(text))!.picked).toEqual(['phare.b1.r1']);
  });

  test('texte coupé ou étranger : refusé, jamais d’exception', () => {
    const text = exportText(sample(), ['phare.b1.r1']);
    for (let n = 0; n < text.length; n += 7) expect(() => parseImport(text.slice(0, n))).not.toThrow();
    expect(parseImport(text.slice(0, text.length - 3))).toBeNull();
    expect(parseImport('{"app":"autre","state":{}}')).toBeNull();
    expect(parseImport('null')).toBeNull();
    expect(parseImport('')).toBeNull();
  });
});

describe('Mise à jour du contenu', () => {
  test('une lanterne inconnue (contenu plus récent ou retiré) ne casse rien et ne fait rien perdre', () => {
    const s = sample();
    s.solved.set('ile.b9.r9.9', { solvedAt: '2027-01-01T00:00:00.000Z', paidHints: 0, wrongAnswers: 0, usedSolution: false });
    const got = parseImport(exportText(s, []))!;
    expect(got.state.solved.has('ile.b9.r9.9')).toBe(true);
    expect(got.state.solved.has('phare.b1.r1.1')).toBe(true);
    const p = new GameEngine(WORLD).progression;
    expect(() => p.totalLights(got.state)).not.toThrow();
    expect(p.totalLights(got.state)).toBeGreaterThanOrEqual(2);
  });
});
