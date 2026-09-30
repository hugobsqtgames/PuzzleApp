// English: every text the app can show has its translation, with the same {0}, {1}… slots.
import * as fs from 'fs';
import { EN } from '../../i18n/en';
import { resolveLang, setLang, tr, trn } from '../../i18n';
import { dataTexts, engineTexts, literalsInSource } from './i18nTexts';

const slots = (s: string) => [...new Set(s.match(/\{\d+\}/g) ?? [])].sort().join('');

// I18N_DUMP=file npx jest i18n → writes the French texts still missing an English version.
if (process.env.I18N_DUMP) {
  const all = [...new Set([...engineTexts(), ...literalsInSource(), ...dataTexts()])].filter((fr) => !(fr in EN));
  fs.writeFileSync(process.env.I18N_DUMP, JSON.stringify(all, null, 1));
}

describe('English', () => {
  test('every text of the puzzle engine is translated', () => {
    const missing = engineTexts().filter((fr) => !(fr in EN));
    expect(missing).toEqual([]);
  });
  test('every tr() text of the app is translated', () => {
    const missing = literalsInSource().filter((fr) => !(fr in EN));
    expect(missing).toEqual([]);
  });
  test('every text held in data (districts, letters, wardrobe, scenes…) is translated', () => {
    const missing = dataTexts().filter((fr) => !(fr in EN));
    expect(missing).toEqual([]);
  });
  test('translations keep the same slots', () => {
    const broken = Object.entries(EN).filter(([fr, en]) => slots(fr) !== slots(en)).map(([fr]) => fr);
    expect(broken).toEqual([]);
  });
  test('language choice, fallback and plurals', () => {
    expect(resolveLang('auto', 'fr')).toBe('fr');
    expect(resolveLang('auto', 'de')).toBe('en');
    expect(resolveLang('fr', 'en')).toBe('fr');
    setLang('en');
    expect(tr('Le code est {0}.', [42])).toBe('The code is 42.');
    expect(tr('texte sans traduction')).toBe('texte sans traduction');
    setLang('fr');
    expect(tr('Le code est {0}.', [42])).toBe('Le code est 42.');
    expect(trn(1, '{0} lanterne', '{0} lanternes')).toBe('1 lanterne');
  });
});
