// English: every text the app can show has its translation, with the same {0}, {1}… slots.
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
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
  test('no text is written straight into a screen (it must go through tr)', () => {
    const root = path.resolve(__dirname, '../..');
    const files: string[] = [];
    const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!['__tests__', 'i18n', 'generated'].includes(f)) walk(p); } else if (p.endsWith('.tsx')) files.push(p); } };
    walk(root);
    const raw: string[] = [];
    for (const f of files) {
      const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (n: ts.Node) => {
        // Proper names (the app, its version, its author) are the same in every language.
        if (ts.isJsxText(n) && /\p{L}{2}/u.test(n.getText()) && !/^(Lampion( [\d.]+ ·)?|Hugo BUSQUET)$/.test(n.getText().trim())) raw.push(`${path.relative(root, f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1} ${n.getText().trim()}`);
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    expect(raw).toEqual([]);
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
