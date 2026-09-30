// Room scenes: shared vocabulary.
//
// A scene is drawn on a 390 × 560 canvas (the room screen shows it full bleed,
// cropping a little on the sides or top depending on the phone). Every colour
// is a pair: its value in the dark and its value once the room is lit. The
// fraction of lanterns lit moves the whole room from one to the other, so
// "résoudre = éclairer" is visible on every object (prototype § room).
import { mix, rng } from '../color';

export const W = 390;
export const H = 560;
/** Default floor line. */
export const FLOOR = 432;

/** A place where a lantern can sit: position and what it sits on ("la pendule"). */
export type Anchor = [x: number, y: number, label: string];

export interface G {
  /** 0 (dark) → 1 (every lantern lit). */
  t: number;
  /** Light colour of the room (warm by default). */
  glow: string;
  /** Dark → lit blend. */
  c(dark: string, lit: string): string;
  /** Unique SVG ids inside one scene. */
  id(prefix: string): string;
  /** Seeded randomness (stable for a room). */
  r(): number;
}

export interface Drawn { s: string; a: Anchor[] }

export function makeG(t: number, glow: string, seed: number): G {
  let n = 0;
  const r = rng(seed);
  return {
    t, glow,
    c: (dark, lit) => mix(dark, lit, Math.max(0, Math.min(1, t)) * 0.85),
    id: (p) => `${p}${seed}x${++n}`,
    r,
  };
}

/** Materials, dark → lit. */
export const MAT = {
  wood: ['#1B1F3A', '#6d5230'], woodD: ['#141833', '#4a3522'], woodL: ['#262B52', '#8a6a42'],
  brass: ['#2E3360', '#c9a563'], brassD: ['#262B52', '#8a6f45'], gold: ['#2E3360', '#D8B56A'],
  iron: ['#1f2448', '#4a4f6a'], ironL: ['#2a2f58', '#6f7490'],
  stone: ['#191d3a', '#5a5366'], stoneL: ['#22264A', '#716a7c'], stoneD: ['#12152c', '#3e3848'],
  paper: ['#262B52', '#e9d6ae'], paperD: ['#1f2448', '#b9a47c'], cloth: ['#1f2448', '#8a3f3f'],
  leaf: ['#16233a', '#3f7a5c'], leafL: ['#1a2a44', '#5e9f78'], leafD: ['#121c30', '#2c5a44'],
  clay: ['#1f2040', '#a0583c'], glass: ['#1a2046', '#3d5a7a'], water: ['#0f1530', '#1f3f5c'],
  red: ['#221a3a', '#8e3a3a'], redD: ['#1a1530', '#5e2630'], velvet: ['#1f1838', '#7a2a36'],
  blue: ['#1a1f44', '#3f5f96'], ink: ['#141833', '#2a2440'],
} as const;
export type Mat = keyof typeof MAT;
export const m = (g: G, k: Mat) => g.c(MAT[k][0], MAT[k][1]);

/** Accent colours that only appear with light (jars, books, fabrics). */
export const ACCENTS = ['#7FC8A9', '#EE8A6B', '#E7A98B', '#8FB8F0', '#D8B56A', '#B79CE0', '#E8C07A', '#9CCB8A'];
export const acc = (g: G, i: number, dark = '#1f2448') => g.c(dark, ACCENTS[((i % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]);

/** Translate + scale wrapper. */
export const at = (x: number, y: number, s: number, body: string, flip = false) =>
  `<g transform="translate(${r1(x)} ${r1(y)}) scale(${flip ? -s : s} ${s})">${body}</g>`;
export const r1 = (v: number) => Math.round(v * 10) / 10;

/** Anchor relative to a prop placed at (x, y) with scale s. */
export const A = (x: number, y: number, s: number, dx: number, dy: number, label: string, flip = false): Anchor =>
  [r1(x + (flip ? -dx : dx) * s), r1(y + dy * s), label];

export function starsIn(g: G, x: number, y: number, w: number, h: number, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const px = x + g.r() * w, py = y + g.r() * h, rr = 0.5 + g.r() * 1.1;
    s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(rr)}" fill="#EFE8D8" opacity="${(0.3 + g.r() * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

export const moon = (x: number, y: number, r: number, sky: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#EFE8D8" opacity=".92"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.28}" r="${r * 0.9}" fill="${sky}"/>`;

/** Flame of a candle or oil lamp: always warm, brighter with the room. */
export const flame = (g: G, x: number, y: number, s = 1) =>
  `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><circle r="9" fill="${g.glow}" opacity="${(0.08 + g.t * 0.2).toFixed(2)}"/><path d="M0 -7c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7z" fill="${g.c('#6b4a2a', '#F4B45E')}"/><circle cy="1" r="1.6" fill="${g.c('#8a6a42', '#FFF3D6')}"/></g>`;
