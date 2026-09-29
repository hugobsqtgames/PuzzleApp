// Vector art of the prototype (prototype/index.html §§ 3–5), ported as SVG
// strings rendered by react-native-svg's SvgXml. Shapes, colours and numbers
// are the prototype's; only CSS classes, inline styles and ARIA attributes are
// dropped (not supported by SvgXml), and animations are done in React.

import { T } from './theme';
import {
  DISTRICTS, FLAMES, HBUILD, ROOM_SLOTS, District, DemoGame,
  distLights, distState, litCount,
} from '../content/vesperDemo';

let uidCounter = 0;
const uid = (p: string) => `${p}${++uidCounter}`;

export function hex2rgb(h: string): number[] {
  h = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function mix(a: string, b: string, t: number): string {
  const A = hex2rgb(a), B = hex2rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** The prototype's small seeded RNG (mulberry32), for stars and windows. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// MARK: - Icons (1.5 stroke, 24 grid)

export const IC: Record<string, string> = {
  SU: '<circle cx="5" cy="15.5" r="1.6"/><circle cx="11" cy="13.5" r="2.6"/><circle cx="18.5" cy="11" r="3.6"/>',
  LA: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 6.5v2"/><rect x="9.2" y="8.5" width="5.6" height="7.5" rx="1.8"/><path d="M10.2 17.5h3.6"/>',
  CA: '<path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"/><circle cx="12" cy="15" r="5.5"/><path d="M12 13v2.2"/>',
  EN: '<circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.8"/><path d="M12 3.5v2.2M12 18.3v2.2M4.6 7.75l1.9 1.1M17.5 15.15l1.9 1.1M4.6 16.25l1.9-1.1M17.5 8.85l1.9-1.1"/>',
  BA: '<path d="M12 4v15M4.5 7h15M8 20h8"/><path d="M4.5 7l-2 6h4zM19.5 7l-2 6h4z"/><path d="M2.5 13a2 2 0 0 0 4 0M17.5 13a2 2 0 0 0 4 0"/>',
  IN: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  map: '<path d="M3 6l6-2.5 6 2.5 6-2.5v15L15 21l-6-2.5L3 21z"/><path d="M9 3.5v15M15 6v15"/>',
  shard: '<path d="M12 2.5l6.5 7.5L12 21.5 5.5 10z"/><path d="M5.5 10h13M12 2.5 9.5 10 12 21.5l2.5-11.5z"/>',
  light: '<path d="M12 21c-3.3 0-5.5-2.3-5.5-5.3 0-3.7 3.3-5.2 4.2-9.7 2.6 1.6 6.8 5.2 6.8 9.7 0 3-2.2 5.3-5.5 5.3z"/><path d="M12 21c-1.4 0-2.4-1-2.4-2.4 0-1.8 1.5-2.6 2.4-4.4.9 1.8 2.4 2.6 2.4 4.4 0 1.4-1 2.4-2.4 2.4z"/>',
  lock: '<path d="M8 10V8a4 4 0 0 1 8 0v2"/><rect x="5.5" y="10" width="13" height="10.5" rx="3"/><path d="M12 14v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M7 7l10 10M17 7L7 17"/>',
  whisper: '<path d="M4 16c0-5 3.5-9 8-11"/><path d="M8 18c0-3.5 2-6.5 5-8"/><path d="M12 20c0-2 1-4 3-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  star: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
  moonI: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  music: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  hint: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
};

export function iconXml(name: string, color: string, strokeWidth = 1.6): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${IC[name] ?? ''}</svg>`;
}

// MARK: - Nilo

export type Mood = 'neutral' | 'curious' | 'think' | 'joy' | 'oops' | 'hint' | 'wonder' | 'sleep';

export interface NiloOptions { mood?: Mood; flame?: string; hat?: string; flameScale?: number }

/** Nilo's body. The flame is returned separately so React can animate it. */
export function niloXml(o: NiloOptions = {}): string {
  const mood = o.mood ?? 'neutral';
  const fc = (FLAMES[o.flame ?? 'amber'] ?? FLAMES.amber).color;
  const id = uid('n');
  const body = '#1E2347', hi = '#2C3266', inner = '#3A4180';
  const M = ({
    neutral: { el: 0, er: 0, fs: 1 }, curious: { el: -8, er: 14, fs: 1.05, tilt: -6 }, think: { el: -14, er: -14, fs: 0.8 },
    joy: { el: 8, er: -8, fs: 1.4 }, oops: { el: -28, er: 28, fs: 0.85 }, hint: { el: 0, er: -16, fs: 1.15 },
    wonder: { el: 12, er: -12, fs: 1.5 }, sleep: { el: -32, er: 32, fs: 0.6 },
  } as Record<Mood, { el: number; er: number; fs: number; tilt?: number }>)[mood];
  const fcol = mood === 'sleep' ? '#E8744A' : mood === 'wonder' && !o.flame ? '#BFE6F0' : fc;
  const ey = '#FFE6B0';
  let eyes: string;
  if (mood === 'joy') eyes = `<path d="M42 67q5-7 10 0M64 67q5-7 10 0" stroke="${ey}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M53 79q5 5 10 0" stroke="${ey}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  else if (mood === 'sleep') eyes = `<path d="M42 68q5 3 10 0M64 68q5 3 10 0" stroke="${ey}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  else if (mood === 'oops') eyes = `<path d="M43 62l7 4.5-7 4.5M73 62l-7 4.5 7 4.5" stroke="${ey}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  else {
    const ry = ({ think: 2.6, wonder: 9, curious: 8 } as Record<string, number>)[mood] ?? 7, rx = mood === 'wonder' ? 6 : 5;
    eyes = `<ellipse cx="47" cy="66" rx="${rx}" ry="${ry}" fill="${ey}"/><ellipse cx="69" cy="66" rx="${rx}" ry="${ry}" fill="${ey}"/><ellipse cx="47" cy="66" rx="${rx + 4}" ry="${ry + 4}" fill="${ey}" opacity=".12"/><ellipse cx="69" cy="66" rx="${rx + 4}" ry="${ry + 4}" fill="${ey}" opacity=".12"/>`;
  }
  const hat = ({
    none: '',
    bonnet: `<path d="M45 40q13-26 27-1q-13 5-27 1z" fill="#34407F"/><path d="M44 40q14 6 29 0" stroke="#F4B45E" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="60" cy="16" r="4.5" fill="#F4B45E"/>`,
    glasses: `<circle cx="47" cy="66" r="10" fill="none" stroke="#D8B56A" stroke-width="2.2"/><circle cx="69" cy="66" r="10" fill="none" stroke="#D8B56A" stroke-width="2.2"/><path d="M57 65h2" stroke="#D8B56A" stroke-width="2.2"/>`,
  } as Record<string, string>)[o.hat ?? 'none'] ?? '';
  const sparkle = mood === 'joy' || mood === 'wonder'
    ? `<g fill="${T.gold}"><path d="M120 14l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/><path d="M90 12l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/><path d="M124 44l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></g>` : '';
  const tilt = M.tilt ? `transform="rotate(${M.tilt} 58 104)"` : '';
  const fs = M.fs * (o.flameScale ?? 1);
  const zz = mood === 'sleep'
    ? `<text x="84" y="40" fill="${T.tx2}" font-family="Georgia,serif" font-style="italic" font-size="12">z</text><text x="92" y="30" fill="${T.tx2}" font-family="Georgia,serif" font-style="italic" font-size="9">z</text>` : '';
  return `<svg viewBox="0 0 132 120">
  <defs><radialGradient id="${id}g"><stop offset="0" stop-color="${fcol}" stop-opacity=".75"/><stop offset=".45" stop-color="${fcol}" stop-opacity=".25"/><stop offset="1" stop-color="${fcol}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${body}"/></linearGradient></defs>
  <g ${tilt}>
   <path d="M84 94c18 2 28-14 22-30-4-10-6-18-2-24" stroke="${body}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
   <g transform="rotate(${M.el} 43 46)"><path d="M36 54Q30 30 30 18q1-4 5-1q9 9 15 21z" fill="${body}"/><path d="M38 48Q34 32 34 24q6 7 10 16z" fill="${inner}"/></g>
   <g transform="rotate(${M.er} 73 46)"><path d="M80 54Q86 30 86 18q-1-4-5-1q-9 9-15 21z" fill="${body}"/><path d="M78 48Q82 32 82 24q-6 7-10 16z" fill="${inner}"/></g>
   <path d="M58 34c22 0 32 22 32 42s-14 28-32 28-32-8-32-28 10-42 32-42z" fill="url(#${id}b)"/>
   <ellipse cx="58" cy="90" rx="17" ry="11" fill="${hi}" opacity=".6"/><ellipse cx="47" cy="104" rx="7" ry="3.2" fill="${hi}"/><ellipse cx="69" cy="104" rx="7" ry="3.2" fill="${hi}"/>
   ${eyes}${hat}
  </g>
  <circle cx="104" cy="31" r="${24 * fs}" fill="url(#${id}g)"/>
  <circle cx="104" cy="31" r="${9 * fs}" fill="${fcol}"/>
  <circle cx="104" cy="31" r="${4 * fs}" fill="#FFF3D6"/>
  ${sparkle}${zz}
 </svg>`;
}

// MARK: - Vesper

function stars(w: number, h: number, n: number, seed: number, dx = 0, dy = 0): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rr = r() * 1.2 + 0.4;
    r(); // animation delay in the prototype: keep the sequence identical
    s += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${rr.toFixed(2)}" fill="#EFE8D8" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

type Roof = 'peak' | 'dome' | 'flat' | 'spire' | 'clock';

function bld(x: number, y: number, w: number, h: number, roof: Roof, hue: string, lit: number, seed: number): string {
  const r = rng(seed || 7), wallDark = T.dark2;
  const wall = lit > 0 ? mix(wallDark, mix(hue, '#2a2440', 0.55), Math.min(1, 0.25 + lit * 0.6)) : wallDark;
  const roofC = lit > 0 ? mix('#20254a', hue, 0.35) : '#171b36';
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>`;
  if (roof === 'peak') s += `<path d="M${x - 4} ${y}L${x + w / 2} ${y - w * 0.55}L${x + w + 4} ${y}z" fill="${roofC}"/>`;
  if (roof === 'spire') s += `<path d="M${x - 3} ${y}L${x + w / 2} ${y - w * 1.2}L${x + w + 3} ${y}z" fill="${roofC}"/>`;
  if (roof === 'dome') s += `<path d="M${x} ${y}a${w / 2} ${w / 2.2} 0 0 1 ${w} 0z" fill="${roofC}"/>`;
  if (roof === 'clock') s += `<path d="M${x - 4} ${y}L${x + w / 2} ${y - w * 0.6}L${x + w + 4} ${y}z" fill="${roofC}"/><circle cx="${x + w / 2}" cy="${y + w * 0.32}" r="${w * 0.22}" fill="${lit > 0 ? mix(hue, '#ffffff', 0.2) : '#232849'}"/><path d="M${x + w / 2} ${y + w * 0.32}v-${w * 0.14}M${x + w / 2} ${y + w * 0.32}h${w * 0.1}" stroke="${lit > 0 ? '#3a2f1c' : '#171b36'}" stroke-width="1.5"/>`;
  if (roof === 'flat') s += `<rect x="${x - 3}" y="${y - 5}" width="${w + 6}" height="5" fill="${roofC}"/>`;
  const cols = Math.max(1, Math.floor(w / 14));
  const rows = Math.max(1, Math.floor((h - (roof === 'clock' ? w * 0.6 : 6)) / 18));
  const y0 = y + (roof === 'clock' ? w * 0.6 : 8);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const on = r() < lit, wx = x + (w - cols * 14) / 2 + j * 14 + 4, wy = y0 + i * 18;
    s += `<rect x="${wx.toFixed(1)}" y="${wy}" width="6" height="9" rx="3" fill="${on ? mix(hue, '#FFE6B0', 0.45) : '#10132a'}"/>`;
    if (on) s += `<rect x="${(wx - 3).toFixed(1)}" y="${wy - 3}" width="12" height="15" rx="6" fill="${hue}" opacity=".18"/>`;
  }
  return s;
}

function lighthouse(x: number, y: number, s: number, lit: boolean): string {
  return `<path d="M${x - 9 * s} ${y}L${x - 6 * s} ${y - 60 * s}L${x + 6 * s} ${y - 60 * s}L${x + 9 * s} ${y}z" fill="${lit ? '#3a3558' : '#1B1F3A'}"/>
  <path d="M${x - 7.6 * s} ${y - 20 * s}h${15.2 * s}v${6 * s}h-${15.2 * s}zM${x - 6.8 * s} ${y - 42 * s}h${13.6 * s}v${6 * s}h-${13.6 * s}z" fill="${lit ? '#F4B45E' : '#262B52'}" opacity=".5"/>
  <rect x="${x - 7 * s}" y="${y - 68 * s}" width="${14 * s}" height="${8 * s}" rx="${2 * s}" fill="${lit ? '#FFE6B0' : '#232849'}"/>
  <path d="M${x - 8 * s} ${y - 68 * s}L${x} ${y - 76 * s}L${x + 8 * s} ${y - 68 * s}z" fill="${lit ? '#4a3f63' : '#1B1F3A'}"/>
  ${lit ? `<circle cx="${x}" cy="${y - 64 * s}" r="${22 * s}" fill="#F4B45E" opacity=".2"/><path d="M${x} ${y - 64 * s}L${x - 120 * s} ${y - 80 * s}L${x - 120 * s} ${y - 50 * s}z" fill="#F4B45E" opacity=".07"/>` : ''}`;
}

function island(cx: number, cy: number, w: number, lit: boolean, hue: string): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${w * 0.09}" fill="${lit ? mix('#141833', hue, 0.12) : '#11142a'}"/><ellipse cx="${cx}" cy="${cy + 3}" rx="${w / 2 - 6}" ry="${w * 0.06}" fill="#0a0c1c" opacity=".6"/>`;
}

function fog(cx: number, cy: number, w: number, h: number): string {
  const id = uid('f');
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#141733" stop-opacity=".96"/><stop offset=".55" stop-color="#11142c" stop-opacity=".88"/><stop offset="1" stop-color="#0D0F1E" stop-opacity="0"/></radialGradient></defs><g><ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="url(#${id})"/><ellipse cx="${cx - w * 0.22}" cy="${cy - h * 0.12}" rx="${w * 0.3}" ry="${h * 0.34}" fill="url(#${id})"/><ellipse cx="${cx + w * 0.22}" cy="${cy + h * 0.08}" rx="${w * 0.3}" ry="${h * 0.3}" fill="url(#${id})"/></g>`;
}

type DState = 'locked' | 'current' | 'open';

function districtArt(d: District, cx: number, cy: number, sc: number, state: DState, fogOff = false): string {
  const lit = state === 'locked' ? 0 : d.id === 'phare' ? 1 : d.id === 'biblio' ? 0.75 : d.id === 'horlo' ? 0.3 : 0.5;
  const h = d.hue;
  let s = island(cx, cy + 2, 170 * sc, lit > 0, h);
  const B = (dx: number, dy: number, w: number, hh: number, roof: Roof, seed: number) =>
    bld(cx + dx * sc, cy - hh * sc + dy * sc, w * sc, hh * sc, roof, h, lit, seed);
  if (d.id === 'phare') s += lighthouse(cx - 10 * sc, cy, sc * 1.1, lit > 0) + bld(cx + 18 * sc, cy - 26 * sc, 30 * sc, 26 * sc, 'peak', h, lit, 3);
  if (d.id === 'biblio') s += B(-60, 0, 34, 58, 'peak', 11) + B(-22, 0, 44, 82, 'dome', 12) + B(26, 0, 30, 50, 'peak', 13) + B(58, 0, 22, 36, 'flat', 14);
  if (d.id === 'horlo') s += B(-62, 0, 30, 46, 'peak', 21) + B(-28, 0, 30, 96, 'clock', 22) + B(6, 0, 40, 56, 'flat', 23) + B(48, 0, 28, 70, 'spire', 24);
  if (d.id === 'serre') s += B(-60, 0, 50, 40, 'dome', 31) + B(-6, 0, 60, 54, 'dome', 32) + B(56, 0, 30, 34, 'peak', 33);
  if (d.id === 'marche') s += B(-60, 0, 26, 34, 'peak', 41) + B(-30, 0, 26, 42, 'peak', 42) + B(0, 0, 26, 30, 'peak', 43) + B(30, 0, 34, 46, 'flat', 44) + `<path d="M${cx - 80 * sc} ${cy + 4 * sc}q20 10 40 0" stroke="${lit ? h : '#262B52'}" stroke-width="${2 * sc}" fill="none"/>`;
  if (d.id === 'theatre') s += B(-50, 0, 100, 60, 'dome', 51) + B(-66, 0, 18, 74, 'spire', 52) + B(48, 0, 18, 74, 'spire', 53);
  if (d.id === 'obs') s += B(-30, 0, 60, 40, 'flat', 61) + `<path d="M${cx - 24 * sc} ${cy - 40 * sc}a${24 * sc} ${22 * sc} 0 0 1 ${48 * sc} 0z" fill="${lit ? mix('#20254a', h, 0.35) : '#171b36'}"/><path d="M${cx + 4 * sc} ${cy - 58 * sc}l${26 * sc} -${20 * sc}" stroke="${lit ? h : '#262B52'}" stroke-width="${6 * sc}" stroke-linecap="round"/>` + B(38, 0, 24, 54, 'spire', 62);
  if (state === 'locked' && !fogOff) s += fog(cx, cy - 30 * sc, 220 * sc, 120 * sc);
  return s;
}

/** Window on Vesper (home). */
export function vesperWindowXml(g: DemoGame, w: number, h: number): string {
  const gid = uid('g');
  const P: [string, number, number, number][] = [['phare', 0.12, 0.86, 0.62], ['biblio', 0.34, 0.7, 0.5], ['horlo', 0.58, 0.62, 0.5], ['serre', 0.8, 0.5, 0.42], ['marche', 0.35, 0.36, 0.34], ['theatre', 0.64, 0.24, 0.3], ['obs', 0.86, 0.14, 0.26]];
  let s = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080914"/><stop offset=".7" stop-color="#11142c"/><stop offset="1" stop-color="#0D0F1E"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${gid})"/>${stars(w, h * 0.6, 40, 3)}<circle cx="${w * 0.82}" cy="${h * 0.16}" r="${h * 0.06}" fill="#EFE8D8" opacity=".85"/><circle cx="${w * 0.835}" cy="${h * 0.15}" r="${h * 0.06}" fill="#11142c"/>`;
  for (const [id, px, py, sc] of P.slice().reverse()) {
    const d = DISTRICTS.find((x) => x.id === id)!;
    s += districtArt(d, px * w, py * h, sc * Math.min(w / 390, h / 230), distState(g, d));
  }
  s += `<rect y="${h * 0.93}" width="${w}" height="${h * 0.07}" fill="#0a0c1c"/></svg>`;
  return s;
}

export const MAP_W = 390, MAP_H = 1180;
export const MAP_POS: Record<string, [number, number, number]> = {
  phare: [120, 1100, 0.75], biblio: [268, 940, 0.8], horlo: [118, 780, 0.8], serre: [272, 620, 0.75],
  marche: [118, 462, 0.75], theatre: [272, 308, 0.72], obs: [150, 160, 0.72],
};

/** Map of Vesper (iPhone layout). Nilo is drawn by React over the Horlogerie. */
export function mapXml(g: DemoGame): string {
  const gid = uid('g');
  const W = MAP_W, H = MAP_H, pos = MAP_POS;
  let s = `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset=".5" stop-color="#0a0c1d"/><stop offset="1" stop-color="#101330"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#${gid})"/>${stars(W, H, 120, 9)}`;
  for (let i = 0; i < 14; i++) { const y = (i + 0.5) * H / 14; s += `<path d="M${(i * 53) % W} ${y}q14-4 28 0" stroke="#1d2247" stroke-width="1.2" fill="none"/>`; }
  const order = DISTRICTS.map((d) => d.id);
  for (let i = 0; i < order.length - 1; i++) {
    const [x1, y1] = pos[order[i]], [x2, y2] = pos[order[i + 1]];
    const on = distState(g, DISTRICTS[i + 1]) !== 'locked';
    const d = `M${x1} ${y1 + 6}C${x1} ${(y1 + y2) / 2},${x2} ${(y1 + y2) / 2},${x2} ${y2 + 6}`;
    s += `<path d="${d}" stroke="${on ? '#6b5a3c' : '#1e2345'}" stroke-width="3" fill="none" ${on ? '' : 'stroke-dasharray="5 7"'}/>`;
    if (on) s += `<path d="${d}" stroke="#F4B45E" stroke-width="1" fill="none" opacity=".5" stroke-dasharray="2 10"/>`;
  }
  for (const d of DISTRICTS) {
    const [cx, cy, sc] = pos[d.id], st = distState(g, d), L = distLights(g, d);
    const label = st === 'locked' ? `◌ ${d.need} lumières` : `${L} / ${d.total}`;
    s += districtArt(d, cx, cy, sc, st);
    if (st === 'current') s += `<circle cx="${cx}" cy="${cy - 40 * sc}" r="${70 * sc}" fill="none" stroke="#F4B45E" stroke-width="1.5" opacity=".6"/>`;
    s += `<g transform="translate(${cx},${cy + 26})">
        <rect x="-86" y="-15" width="172" height="44" rx="14" fill="${st === 'locked' ? '#11142a' : '#171A2E'}" stroke="${st === 'current' ? '#F4B45E' : '#2E3360'}" opacity=".94"/>
        <text x="0" y="1" text-anchor="middle" fill="${st === 'locked' ? '#9CA2C6' : '#EFE8D8'}" font-family="Georgia,serif" font-size="14.5" font-weight="600">${esc(d.short ?? d.name)}</text>
        <text x="0" y="19" text-anchor="middle" fill="${st === 'locked' ? '#7A80A8' : d.hue}" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="600">${label}</text>
      </g>`;
  }
  return s + '</svg>';
}

/** Horlogerie panorama (district screen). */
export function districtXml(): string {
  const gid = uid('g');
  let s = `<svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMax meet"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080914"/><stop offset="1" stop-color="#1a1a2e"/></linearGradient></defs>
  <rect width="360" height="300" fill="url(#${gid})"/>${stars(360, 120, 26, 21)}
  <path d="M0 262h360v38H0z" fill="#121530"/><path d="M0 262h360" stroke="#3a3350" stroke-width="1"/>`;
  for (const b of HBUILD) {
    s += bld(b.x, 262 - b.h, b.w, b.h, b.roof, '#D8B56A', b.lit, b.x);
    if (!b.open) s += `<g transform="translate(${b.x + b.w / 2 - 11},${262 - b.h / 2 - 11})"><circle cx="11" cy="11" r="15" fill="#0D0F1E" opacity=".8"/><g stroke="#9CA2C6" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M7 10V8a4 4 0 0 1 8 0v2"/><rect x="4.5" y="10" width="13" height="10" rx="3"/></g></g>`;
  }
  s += `<g transform="translate(150,236)"><ellipse cx="20" cy="22" rx="24" ry="16" fill="#3a3350"/><ellipse cx="6" cy="18" rx="10" ry="8" fill="#443c5c"/><ellipse cx="-3" cy="19" rx="4" ry="3" fill="#a07a86" opacity=".7"/><path d="M2 14q3 2 6 0" stroke="#9CA2C6" stroke-width="1.2" fill="none"/><circle cx="5" cy="15" r="5" fill="none" stroke="#D8B56A" stroke-width="1" opacity=".6"/><text x="30" y="2" fill="#9CA2C6" font-style="italic" font-family="Georgia,serif" font-size="11">z</text><text x="37" y="-6" fill="#9CA2C6" font-style="italic" font-family="Georgia,serif" font-size="8">z</text></g>`;
  return s + '</svg>';
}

export interface BuildingRoom { name: string; lit: number; total: number; state: 'done' | 'current' | 'open' | 'locked'; need?: string }

export function atelierRooms(g: DemoGame): { total: number; rooms: BuildingRoom[]; keyOpen: boolean } {
  const r2 = litCount(g);
  return {
    total: 24 + r2,
    rooms: [
      { name: 'Salle 1 · La Forge', lit: 10, total: 10, state: 'done' },
      { name: 'Salle 2 · L’Établi', lit: r2, total: 10, state: r2 >= 10 ? 'done' : 'current' },
      { name: 'Salle 3 · Le Magasin', lit: 8, total: 10, state: 'open' },
      { name: 'Salle 4 · La Mansarde', lit: 6, total: 9, state: 'open' },
    ],
    keyOpen: 24 + r2 >= 30,
  };
}

export const COUPE_RECTS = [
  { x: 30, y: 330, w: 300, h: 90 }, { x: 30, y: 230, w: 150, h: 100 }, { x: 180, y: 230, w: 150, h: 100 },
  { x: 30, y: 130, w: 150, h: 100 }, { x: 180, y: 130, w: 150, h: 100 },
];

/** Building cross-section (Atelier des Ressorts). */
export function coupeXml(g: DemoGame): string {
  const B = atelierRooms(g), hue = '#D8B56A';
  let s = `<svg viewBox="0 0 360 440">
  <path d="M18 130L180 34 342 130z" fill="#1d2140"/><circle cx="180" cy="94" r="22" fill="${mix('#1d2140', hue, 0.5)}"/><path d="M180 94v-13M180 94l9 5" stroke="#1d2140" stroke-width="2.4" stroke-linecap="round"/>
  <rect x="24" y="128" width="312" height="298" rx="4" fill="#0f1228"/>`;
  COUPE_RECTS.forEach((r, i) => {
    const isKey = i === 4, room = isKey ? null : B.rooms[i];
    const st = isKey ? (B.keyOpen ? 'open' : 'locked') : room!.state;
    const L = isKey ? 0 : room!.lit;
    const frac = isKey ? (st === 'open' ? 0.15 : 0) : L / 10;
    const fill = st === 'locked' ? '#0c0e20' : mix('#161a36', mix(hue, '#3a2c1c', 0.55), Math.min(1, 0.2 + frac * 0.8));
    const label = isKey ? 'Lanterne-clé' : room!.name.split(' · ')[0];
    s += `<rect x="${r.x + 4}" y="${r.y + 4}" width="${r.w - 8}" height="${r.h - 8}" rx="6" fill="${fill}" stroke="${st === 'current' ? '#F4B45E' : '#2E3360'}" stroke-width="${st === 'current' ? 2 : 1}"/>`;
    if (frac > 0) s += `<ellipse cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2}" rx="${r.w * 0.4}" ry="${r.h * 0.35}" fill="${hue}" opacity="${(0.06 + frac * 0.14).toFixed(2)}"/>`;
    if (!isKey && st !== 'locked') {
      const TT = room!.total;
      for (let k = 0; k < TT; k++) {
        const on = k < L, cx = r.x + 18 + k * ((r.w - 36) / (TT - 1)), cy = r.y + r.h - 22;
        s += `<circle cx="${cx}" cy="${cy}" r="${on ? 4 : 3}" fill="${on ? '#F4B45E' : 'none'}" stroke="${on ? 'none' : '#4a5190'}" stroke-width="1.3"/>`;
        if (on) s += `<circle cx="${cx}" cy="${cy}" r="8" fill="#F4B45E" opacity=".18"/>`;
      }
    }
    const sub = st === 'locked' ? 'Verrouillée' : isKey ? 'Ouverte · Énigme' : st === 'done' ? 'Complète · objet trouvé' : `${L} / ${room!.total}`;
    s += `<text x="${r.x + 16}" y="${r.y + 28}" fill="${st === 'locked' ? '#7A80A8' : '#EFE8D8'}" font-family="Georgia,serif" font-size="16" font-weight="600">${esc(label)}</text>
      <text x="${r.x + 16}" y="${r.y + 47}" fill="${st === 'locked' ? '#7A80A8' : '#9CA2C6'}" font-family="Helvetica,Arial,sans-serif" font-size="12.5" font-weight="600">${sub}</text>`;
    if (st === 'locked') s += `<g transform="translate(${r.x + r.w - 40},${r.y + 18})" stroke="#7A80A8" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M7 10V8a4 4 0 0 1 8 0v2"/><rect x="4.5" y="10" width="13" height="10" rx="3"/></g>`;
    if (isKey && st === 'open') s += `<g transform="translate(${r.x + r.w - 44},${r.y + 50})"><circle cx="12" cy="12" r="16" fill="#F4B45E" opacity=".15"/><path d="M8.5 8.5a3.5 3.5 0 1 1 5.2 3.1c-1 .6-1.7 1.3-1.7 2.6v.8M12 19h.01" stroke="#F4B45E" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  });
  s += `<rect x="150" y="410" width="60" height="16" fill="#0a0c1c"/></svg>`;
  return s;
}

export const ROOM_W = 390, ROOM_H = 470;

/** Salle 2 "L'Établi". Lanterns are drawn separately so they can be tapped. */
export function roomXml(g: DemoGame): string {
  const n = litCount(g), t = n / 10, hue = '#D8B56A';
  const wall = mix('#141833', mix(hue, '#2d2238', 0.6), t * 0.75), floor = mix('#0f1128', mix(hue, '#1e1712', 0.7), t * 0.6);
  const obj = (dark: string, litc: string) => mix(dark, litc, t * 0.85);
  const gid = uid('g');
  let s = `<svg viewBox="0 0 390 470" preserveAspectRatio="xMidYMid meet">
  <defs><radialGradient id="${gid}"><stop offset="0" stop-color="${hue}" stop-opacity=".5"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient></defs>
  <rect width="390" height="470" fill="${wall}"/>
  <path d="M0 360h390v110H0z" fill="${floor}"/><path d="M0 360h390" stroke="${obj('#1f2448', '#6b5638')}" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${i * 65} 360L${i * 65 - 40} 470" stroke="${obj('#141833', '#2b2217')}" stroke-width="1.5"/>`).join('')}
  <rect x="150" y="84" width="92" height="110" rx="46" fill="#0a0c1e"/><circle cx="214" cy="114" r="11" fill="#EFE8D8" opacity=".9"/><circle cx="219" cy="111" r="10" fill="#0a0c1e"/>${stars(92, 100, 8, 41, 150, 90)}
  <path d="M196 84v110M150 140h92" stroke="${obj('#262B52', '#8a6f45')}" stroke-width="4"/><rect x="146" y="192" width="100" height="8" rx="3" fill="${obj('#262B52', '#7a5f3a')}"/>
  <path d="M195 0v52" stroke="${obj('#262B52', '#8a6f45')}" stroke-width="2"/><path d="M178 52h34l-6 12h-22z" fill="${obj('#262B52', '#8a6f45')}"/>
  <g transform="translate(104,96)"><circle r="24" fill="none" stroke="${obj('#262B52', '#9b7d4c')}" stroke-width="6" stroke-dasharray="7 5"/><circle r="12" fill="${obj('#1B1F3A', '#6d5634')}"/></g>
  <rect x="36" y="118" width="54" height="214" rx="8" fill="${obj('#1B1F3A', '#5a4330')}"/><circle cx="63" cy="152" r="20" fill="${obj('#262B52', '#e9d6ae')}"/><path d="M63 152v-12M63 152l8 4" stroke="#1B1F3A" stroke-width="2.2" stroke-linecap="round"/>
  <rect x="48" y="186" width="30" height="120" rx="6" fill="${obj('#141833', '#3a2a1e')}"/><path d="M63 190v80" stroke="${obj('#2E3360', '#c9a563')}" stroke-width="2"/><circle cx="63" cy="274" r="9" fill="${obj('#2E3360', '#D8B56A')}"/>
  <g fill="${obj('#262B52', '#6d5230')}"><rect x="288" y="148" width="84" height="7" rx="2"/><rect x="288" y="256" width="84" height="7" rx="2"/></g>
  <g opacity=".9"><rect x="296" y="120" width="16" height="28" rx="5" fill="${obj('#1f2448', '#7FC8A9')}"/><rect x="342" y="126" width="18" height="22" rx="5" fill="${obj('#1f2448', '#EE8A6B')}"/></g>
  <g><rect x="296" y="222" width="14" height="34" rx="4" fill="${obj('#1f2448', '#E7A98B')}"/><rect x="346" y="232" width="20" height="24" rx="5" fill="${obj('#1f2448', '#8FB8F0')}"/></g>
  <rect x="104" y="324" width="182" height="16" rx="4" fill="${obj('#262B52', '#7a5a36')}"/><path d="M116 340v60M274 340v60" stroke="${obj('#1f2448', '#5a4328')}" stroke-width="10" stroke-linecap="round"/>
  <g transform="translate(196,308)"><circle r="14" fill="none" stroke="${obj('#2E3360', '#D8B56A')}" stroke-width="5" stroke-dasharray="5 4"/><circle cx="24" cy="6" r="9" fill="none" stroke="${obj('#2E3360', '#c9a563')}" stroke-width="4" stroke-dasharray="4 3"/></g>
  <rect x="294" y="394" width="68" height="46" rx="6" fill="${obj('#1B1F3A', '#6a4a2c')}"/><path d="M294 410h68" stroke="${obj('#262B52', '#D8B56A')}" stroke-width="2"/>
  <ellipse cx="70" cy="424" rx="26" ry="7" fill="${obj('#262B52', '#7a5a36')}"/><path d="M52 428l-6 34M88 428l6 34M70 430v32" stroke="${obj('#1f2448', '#5a4328')}" stroke-width="5" stroke-linecap="round"/>`;
  g.room.forEach((l, i) => {
    if (l.lit) { const p = ROOM_SLOTS[i]; s += `<circle cx="${p.x}" cy="${p.y}" r="70" fill="url(#${gid})" opacity=".55"/>`; }
  });
  if (n === 10) s += `<g transform="translate(330,380)"><circle r="18" fill="#FFD98E" opacity=".25"/><path d="M-6 -2a6 6 0 1 1 6 6" stroke="#FFD98E" stroke-width="2.4" fill="none"/></g>`;
  return s + '</svg>';
}

/** One room lantern, drawn in a 60×60 box centred on the slot. */
export function roomLanternXml(i: number, lit: boolean): string {
  const x = 30, y = 34;
  return `<svg viewBox="0 0 60 60">
      <path d="M${x} ${y - 19}v4" stroke="${lit ? '#c9a563' : '#4a5190'}" stroke-width="1.8"/>
      <rect x="${x - 9}" y="${y - 15}" width="18" height="25" rx="7" fill="${lit ? '#F4B45E' : '#141833'}" stroke="${lit ? '#FFE6B0' : '#5a62a8'}" stroke-width="1.6"/>
      ${lit ? `<circle cx="${x}" cy="${y - 2}" r="5" fill="#FFF3D6"/><circle cx="${x}" cy="${y - 2}" r="22" fill="#F4B45E" opacity=".2"/>` : `<path d="M${x - 4} ${y - 2}h8" stroke="#5a62a8" stroke-width="1.4" stroke-linecap="round"/>`}
      <path d="M${x - 6} ${y + 13}h12" stroke="${lit ? '#c9a563' : '#4a5190'}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${x + 13}" cy="${y - 15}" r="8" fill="#0D0F1E" stroke="${lit ? '#6b5a3c' : '#2E3360'}"/><text x="${x + 13}" y="${y - 11.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${lit ? '#F4B45E' : '#9CA2C6'}" font-family="Helvetica,Arial,sans-serif">${i + 1}</text>
    </svg>`;
}

// MARK: - Puzzle pieces

export function tileXml(m: number, lit: boolean, isSource: boolean): string {
  const col = lit ? T.amber : '#3a4180';
  const bits = [0, 1, 2, 3].filter((b) => (m >> b) & 1);
  const ends = [[50, 0], [100, 50], [50, 100], [0, 50]];
  let s = '<svg viewBox="0 0 100 100">';
  if (lit) bits.forEach((b) => { s += `<line x1="50" y1="50" x2="${ends[b][0]}" y2="${ends[b][1]}" stroke="${T.amber}" stroke-width="30" stroke-linecap="butt" opacity=".16"/>`; });
  bits.forEach((b) => { s += `<line x1="50" y1="50" x2="${ends[b][0]}" y2="${ends[b][1]}" stroke="${col}" stroke-width="14"/>`; });
  s += `<circle cx="50" cy="50" r="9" fill="${col}"/>`;
  if (isSource) s += `<circle cx="50" cy="50" r="26" fill="${T.gold}" opacity=".25"/><circle cx="50" cy="50" r="17" fill="${T.gold}"/><circle cx="50" cy="50" r="8" fill="#FFF3D6"/>`;
  else if (bits.length === 1) s += `<rect x="36" y="32" width="28" height="38" rx="11" fill="${lit ? T.amber : '#141833'}" stroke="${lit ? '#FFE6B0' : '#5a62a8'}" stroke-width="4"/>${lit ? '<circle cx="50" cy="50" r="7" fill="#FFF3D6"/>' : ''}`;
  return s + '</svg>';
}

export function lampXml(conflict: boolean): string {
  const c = conflict ? T.coral : T.amber;
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${c}" opacity=".25"/><rect x="7.5" y="5" width="9" height="13" rx="3.5" fill="${c}"/><circle cx="12" cy="11" r="2.4" fill="#FFF3D6"/>${conflict ? `<path d="M3 3l18 18" stroke="${T.coral}" stroke-width="2"/>` : ''}</svg>`;
}

const SHAPES = {
  circ: '<circle r="11" fill="#D8B56A"/>',
  tri: '<path d="M0 -13L12 9H-12z" fill="#E7A98B"/>',
  sq: '<rect x="-11" y="-11" width="22" height="22" rx="3" fill="#8FB8F0"/>',
  w12: '<path d="M-12 11L-8 -9H8L12 11z" fill="#9CA2C6"/><text y="6" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="800" font-size="12" fill="#0D0F1E">12</text>',
};

export function balanceXml(left: (keyof typeof SHAPES)[], right: (keyof typeof SHAPES)[]): string {
  const put = (arr: (keyof typeof SHAPES)[], x0: number) => arr.map((sh, i) => `<g transform="translate(${x0 + i * 26 - (arr.length - 1) * 13},46)">${SHAPES[sh]}</g>`).join('');
  return `<svg viewBox="0 0 300 80"><path d="M150 18v54M120 76h60" stroke="#6b5a3c" stroke-width="4" stroke-linecap="round"/><path d="M40 20h220" stroke="#8a6f45" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="18" r="5" fill="#D8B56A"/><path d="M40 20l-24 40h48zM260 20l-24 40h48z" fill="none" stroke="#6b5a3c" stroke-width="1.5"/><path d="M12 60h56M232 60h56" stroke="#8a6f45" stroke-width="4" stroke-linecap="round"/>${put(left, 40)}${put(right, 260)}</svg>`;
}

export const squareXml = `<svg viewBox="-14 -14 28 28">${SHAPES.sq}</svg>`;

export function bigLanternXml(): string {
  return `<svg viewBox="0 0 100 120"><circle cx="50" cy="62" r="48" fill="${T.amber}" opacity=".18"/><path d="M50 6v10" stroke="#c9a563" stroke-width="3"/><path d="M40 16h20" stroke="#c9a563" stroke-width="4" stroke-linecap="round"/><rect x="28" y="20" width="44" height="66" rx="18" fill="${T.amber}" stroke="#FFE6B0" stroke-width="3"/><circle cx="50" cy="52" r="12" fill="#FFF3D6"/><path d="M36 92h28" stroke="#c9a563" stroke-width="5" stroke-linecap="round"/></svg>`;
}

export function springXml(): string {
  return `<svg viewBox="0 0 200 160"><circle cx="100" cy="80" r="70" fill="${T.gold}" opacity=".12"/><path d="M100 80m0-6a6 6 0 1 1-6 6 12 12 0 0 1 12-12 18 18 0 0 1 18 18 24 24 0 0 1-24 24 30 30 0 0 1-30-30 36 36 0 0 1 36-36 42 42 0 0 1 42 42" stroke="#D8B56A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M150 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${T.gold}"/><path d="M40 118l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="${T.gold}"/></svg>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
