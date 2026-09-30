// Lampion is written in French; English is a dictionary keyed by the French text.
//   tr('Salle {0}', [3]) → « Salle 3 » or « Room 3 ».
// A missing English text falls back to the French one (and a test lists them).
import { EN } from './en';

export type Lang = 'fr' | 'en';
export type LangSetting = 'auto' | Lang;

let current: Lang = 'fr';

export const lang = (): Lang => current;
export const setLang = (l: Lang) => { current = l; };

/** The language to use: the player's choice, else the phone's (French for French speakers, English otherwise). */
export function resolveLang(setting: LangSetting, deviceLanguage: string | null | undefined): Lang {
  if (setting !== 'auto') return setting;
  return (deviceLanguage ?? 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

const fill = (s: string, args: readonly (string | number)[]) => (args.length ? s.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? '')) : s);

/** The text in the current language, with {0}, {1}… filled. */
export function tr(fr: string, args: readonly (string | number)[] = []): string {
  return fill(current === 'en' ? EN[fr] ?? fr : fr, args);
}

/** One or several: tr of the right form. */
export const trn = (n: number, one: string, many: string, args: readonly (string | number)[] = [n]) => tr(n > 1 || n === 0 && current === 'en' ? many : one, args);

/** Runs f with French as the language: for texts that are stored (history), translated when shown. */
export function inFrench<T>(f: () => T): T {
  const was = current;
  current = 'fr';
  try { return f(); } finally { current = was; }
}

/** A stored label such as « Lanterne · Broderie », read in the current language part by part. */
export const trLabel = (label: string) => label.split(' · ').map((part) => tr(part)).join(' · ');

/** The locale for dates and numbers. */
export const locale = () => (current === 'en' ? 'en-GB' : 'fr-FR');

const proxies = new WeakMap<object, unknown>();
/**
 * A view of French data (districts, letters, wardrobe…) whose texts read in
 * the current language. Numbers, colours, ids and functions pass through.
 */
export function translated<T extends object>(data: T): T {
  const hit = proxies.get(data);
  if (hit) return hit as T;
  const view = new Proxy(data, {
    get(target, key, receiver) {
      const v = Reflect.get(target, key, receiver);
      if (typeof v === 'string') return current === 'en' ? EN[v] ?? v : v;
      if (v && typeof v === 'object') return translated(v);
      return v;
    },
  });
  proxies.set(data, view);
  return view;
}

/** Gives an object's text fields a translated reading (for objects that also hold engines). */
export function translateFields<T extends object>(o: T, fields: (keyof T)[]): T {
  for (const f of fields) {
    const fr = o[f];
    if (typeof fr === 'string') Object.defineProperty(o, f, { get: () => tr(fr), enumerable: true, configurable: true });
  }
  return o;
}
