import { Platform } from 'react-native';

// "Encre & Lueur" tokens (DESIGN_SYSTEM.md, prototype `T`).
export const T = {
  bg: '#0D0F1E',
  deep: '#080914',
  s1: '#171A2E',
  s2: '#22264A',
  line: '#2E3360',
  tx: '#EFE8D8',
  tx2: '#9CA2C6',
  tx3: '#7A80A8',
  amber: '#F4B45E',
  amberP: '#D9953F',
  moon: '#8FD3E0',
  gold: '#FFD98E',
  coral: '#E88A8A',
  dark1: '#141833',
  dark2: '#1B1F3A',
  dark3: '#262B52',
} as const;

export const R = { xs: 6, s: 10, m: 16, l: 24, xl: 32 } as const;

// Title serif. New York is not reachable from React Native; Georgia ships with
// iOS, Android maps "serif" to Noto Serif. A bundled font can replace both.
/**
 * Titles: Newsreader (SIL Open Font License, assets/fonts), close to the mockup's New York.
 * Each weight is its own family: a custom font must not be given fontWeight or fontStyle.
 */
export const FONTS = {
  'Newsreader-SemiBold': require('../../assets/fonts/Newsreader-SemiBold.ttf'),
  'Newsreader-Medium': require('../../assets/fonts/Newsreader-Medium.ttf'),
  'Newsreader-Italic': require('../../assets/fonts/Newsreader-Italic.ttf'),
};
export const SERIF = 'Newsreader-Medium';
export const SERIF_BOLD = 'Newsreader-SemiBold';
export const SERIF_ITALIC = 'Newsreader-Italic';
/** The same families inside SVG drawings, with a system fallback. */
export const SVG_SERIF = "Newsreader-Medium, Georgia, serif";
export const SVG_SERIF_BOLD = "Newsreader-SemiBold, Georgia, serif";
export const SVG_SERIF_ITALIC = "Newsreader-Italic, Georgia, serif";
export const ROUND = Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'ui-rounded, system-ui, sans-serif' });
export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

export const type = {
  display: { fontFamily: SERIF_BOLD, fontSize: 40, lineHeight: 46, color: T.tx },
  title1: { fontFamily: SERIF_BOLD, fontSize: 28, lineHeight: 34, color: T.tx },
  title2: { fontFamily: SERIF, fontSize: 22, lineHeight: 28, color: T.tx },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', color: T.tx },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: T.tx },
  body: { fontSize: 17, lineHeight: 24, color: T.tx },
  callout: { fontSize: 16, lineHeight: 21, color: T.tx },
  sub: { fontSize: 15, lineHeight: 20, color: T.tx2 },
  foot: { fontSize: 13, lineHeight: 18, color: T.tx2 },
  cap: { fontSize: 12, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', color: T.tx2 },
  dialogue: { fontFamily: SERIF_ITALIC, fontSize: 17, lineHeight: 25, color: T.tx },
} as const;
