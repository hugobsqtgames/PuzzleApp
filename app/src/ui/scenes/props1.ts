// Scene props, part 1: home, lighthouse, library, clockworks.
// Every prop is drawn around a base point (feet on the floor, or centre for
// wall pieces) and returns the places where a lantern can sit on it.
import { SVG_SERIF } from '../theme';
import { G, Drawn, at, m, acc, flame, r1, W } from './kit';

export interface PO {
  /** Replace the anchor labels (same order). */
  l?: string[];
  /** Mirror horizontally. */
  f?: boolean;
  /** Variant. */
  v?: number;
  /** Width, for stretchable props. */
  w?: number;
  /** Accent colour index. */
  c?: number;
}
export type Prop = (g: G, x: number, y: number, s?: number, o?: PO) => Drawn;

/** Wraps a drawing at (x, y) × s and turns relative anchors into absolute ones. */
export function mk(x: number, y: number, s: number, o: PO | undefined, body: string, anchors: [number, number, string][]): Drawn {
  const f = !!o?.f;
  return {
    s: at(x, y, s, body, f),
    a: anchors.map(([dx, dy, label], i) => [r1(x + (f ? -dx : dx) * s), r1(y + dy * s), o?.l?.[i] ?? label]),
  };
}

// ---------------------------------------------------------------- everywhere

/** Ceiling lamp on a cord. y = where the shade hangs. */
export const hang: Prop = (g, x, y, s = 1, o) => mk(x, 0, 1, o, `<path d="M0 0V${y - 14}" stroke="${m(g, 'brassD')}" stroke-width="2"/><path d="M${-17 * s} ${y - 14}h${34 * s}l${-6 * s} ${12 * s}h${-22 * s}z" fill="${m(g, 'brassD')}"/>`, [[0, y + 18 * s, 'la suspension']]);

export const chandelier: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 ${-y / s}V-10" stroke="${m(g, 'gold')}" stroke-width="2"/><path d="M-50 0q50 30 100 0M-30 -6q30 20 60 0" stroke="${m(g, 'gold')}" stroke-width="4" fill="none"/><circle r="8" fill="${m(g, 'gold')}"/>${[-50, -25, 25, 50].map((dx) => `<path d="M${dx} ${dx % 50 ? 4 : 0}v-10" stroke="${m(g, 'gold')}" stroke-width="3"/>${flame(g, dx, (dx % 50 ? 4 : 0) - 16, 0.7)}`).join('')}<path d="M-8 10l8 14 8-14" fill="${g.c('#262B52', '#BFE6F0')}" opacity=".7"/>`, [[0, 28, 'le lustre']]);

export const sconce: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v12M-10 12h20" stroke="${m(g, 'brass')}" stroke-width="3"/><path d="M-8 -2a8 8 0 0 1 16 0" fill="${m(g, 'brassD')}"/>`, [[0, -4, 'l’applique']]);

/** Wall shelf with jars or books. w = width. */
export const shelf: Prop = (g, x, y, s = 1, o) => {
  const w = o?.w ?? 84, v = o?.v ?? 0;
  let items = '';
  for (let i = 0, cx = -w / 2 + 8; cx < w / 2 - 12; i++) {
    const kind = (v + i) % 3, c = acc(g, (o?.c ?? 0) + i);
    if (v === 2) { const bw = 7 + ((i * 5) % 6), bh = 22 + ((i * 7) % 12); items += `<rect x="${cx}" y="${-bh}" width="${bw}" height="${bh}" rx="1.5" fill="${c}"/>`; cx += bw + 2; continue; }
    if (kind === 0) items += `<rect x="${cx}" y="-28" width="16" height="28" rx="5" fill="${c}" opacity=".9"/><rect x="${cx + 3}" y="-32" width="10" height="5" rx="1.5" fill="${m(g, 'woodD')}"/>`;
    else if (kind === 1) items += `<rect x="${cx}" y="-22" width="18" height="22" rx="5" fill="${c}" opacity=".9"/>`;
    else items += `<path d="M${cx + 8} -30c-8 10-8 22 0 30c8-8 8-20 0-30z" fill="${c}" opacity=".85"/>`;
    cx += 24;
  }
  return mk(x, y, s, o, `${items}<rect x="${-w / 2}" y="0" width="${w}" height="7" rx="2" fill="${m(g, 'wood')}"/><path d="M${-w / 2 + 8} 7l6 10M${w / 2 - 8} 7l-6 10" stroke="${m(g, 'woodD')}" stroke-width="3"/>`, [[w / 4 - 4, -26, 'l’étagère']]);
};

export const table: Prop = (g, x, y, s = 1, o) => {
  const w = o?.w ?? 160;
  const top = o?.v === 1 ? `<ellipse cx="0" cy="-60" rx="${w / 2}" ry="12" fill="${m(g, 'woodL')}"/><path d="M0 -52v48M-24 0h48" stroke="${m(g, 'wood')}" stroke-width="9" stroke-linecap="round"/>` : `<rect x="${-w / 2}" y="-66" width="${w}" height="14" rx="4" fill="${m(g, 'woodL')}"/><path d="M${-w / 2 + 12} -52V0M${w / 2 - 12} -52V0" stroke="${m(g, 'wood')}" stroke-width="9" stroke-linecap="round"/>`;
  return mk(x, y, s, o, top, [[-w / 4, -80, 'la table, à gauche'], [w / 4, -80, 'la table, à droite']]);
};

export const stool: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<ellipse cx="0" cy="-36" rx="26" ry="7" fill="${m(g, 'woodL')}"/><path d="M-18 -32l-6 32M18 -32l6 32M0 -30v30" stroke="${m(g, 'wood')}" stroke-width="5" stroke-linecap="round"/>`, [[0, -48, 'le tabouret']]);

export const chair: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-18 0v-44h36v44M-18 -44v-46M-18 -90h8v46" stroke="${m(g, 'wood')}" stroke-width="6" stroke-linecap="round" fill="none"/><rect x="-22" y="-48" width="44" height="8" rx="3" fill="${m(g, 'woodL')}"/>`, [[-14, -100, 'la chaise']]);

export const chest: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-34" y="-46" width="68" height="46" rx="6" fill="${o?.v === 1 ? m(g, 'velvet') : m(g, 'wood')}"/><path d="M-34 -30h68" stroke="${m(g, 'gold')}" stroke-width="2"/><path d="M-34 -46q34 -14 68 0" fill="${m(g, 'woodL')}"/><rect x="-5" y="-34" width="10" height="10" rx="2" fill="${m(g, 'gold')}"/>`, [[0, -62, o?.v === 1 ? 'la malle' : 'le coffre']]);

export const crate: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-26" y="-44" width="52" height="44" fill="${m(g, 'woodL')}"/><path d="M-26 -44l52 44M-26 0l52 -44" stroke="${m(g, 'wood')}" stroke-width="4"/><rect x="-26" y="-44" width="52" height="44" fill="none" stroke="${m(g, 'wood')}" stroke-width="4"/>`, [[0, -58, 'la caisse']]);

export const barrel: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-22 0q-8 -30 0 -60h44q8 30 0 60z" fill="${m(g, 'wood')}"/><path d="M-26 -14h52M-26 -46h52" stroke="${m(g, 'iron')}" stroke-width="4"/><ellipse cx="0" cy="-60" rx="22" ry="5" fill="${m(g, 'woodL')}"/>`, [[0, -74, 'le tonneau']]);

export const sack: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-24 0q-6 -28 6 -42l-4 -8h24l-4 8q12 14 6 42z" fill="${acc(g, o?.c ?? 6, '#1f2040')}" opacity=".9"/><path d="M-12 -42h24" stroke="${m(g, 'paperD')}" stroke-width="3"/><ellipse cx="0" cy="-48" rx="10" ry="3" fill="${acc(g, (o?.c ?? 6) + 1)}"/>`, [[0, -62, 'le sac']]);

export const rug: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<ellipse cx="0" cy="0" rx="${(o?.w ?? 140) / 2}" ry="18" fill="${g.c('#1a1636', o?.v === 1 ? '#3f5f96' : '#7a2a36')}" opacity=".75"/><ellipse cx="0" cy="0" rx="${(o?.w ?? 140) / 2 - 12}" ry="11" fill="none" stroke="${m(g, 'gold')}" stroke-width="1.5" opacity=".6"/>`, []);

export const door: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-34 0V-120a34 34 0 0 1 68 0V0z" fill="${m(g, 'wood')}"/><path d="M-26 -8V-116a26 26 0 0 1 52 0V-8z" fill="none" stroke="${m(g, 'woodD')}" stroke-width="3"/><path d="M0 -150V0" stroke="${m(g, 'woodD')}" stroke-width="2"/><circle cx="18" cy="-60" r="4" fill="${m(g, 'gold')}"/>`, [[0, -164, 'la porte']]);

export const coatHook: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-4" width="80" height="8" rx="3" fill="${m(g, 'wood')}"/>${[-24, 0, 24].map((dx) => `<path d="M${dx} 4v8q0 6 6 6" stroke="${m(g, 'brass')}" stroke-width="2.5" fill="none"/>`).join('')}<path d="M-30 14q6 -4 12 0l4 60h-20z" fill="${acc(g, o?.c ?? 3)}" opacity=".85"/><path d="M18 14q6 -4 12 0l6 46h-24z" fill="${acc(g, (o?.c ?? 3) + 2)}" opacity=".85"/>`, [[0, -16, 'le portemanteau']]);

export const candle: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-4" y="-22" width="8" height="22" rx="2" fill="${m(g, 'paper')}"/><ellipse cx="0" cy="0" rx="10" ry="3" fill="${m(g, 'brass')}"/>${flame(g, 0, -28, 0.8)}`, [[0, -44, 'la bougie']]);

export const bookStack: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2, 3].map((i) => `<rect x="${-22 + (i % 2) * 4}" y="${-12 - i * 12}" width="${44 - i * 3}" height="11" rx="2" fill="${acc(g, (o?.c ?? 0) + i)}"/>`).join(''), [[0, -62, 'la pile de livres']]);

export const plant: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-14 0l-4 -26h36l-4 26z" fill="${m(g, 'clay')}"/>${[-1, 0, 1].map((k) => `<path d="M${k * 4} -26q${k * 20} -26 ${k * 10 + 2} -46" stroke="${m(g, 'leafL')}" stroke-width="3" fill="none"/><ellipse cx="${k * 12 + 2}" cy="${-40 - Math.abs(k) * -6}" rx="9" ry="5" transform="rotate(${k * 40} ${k * 12 + 2} ${-40 + Math.abs(k) * 6})" fill="${m(g, 'leaf')}"/>`).join('')}`, [[0, -62, 'la plante']]);

// ---------------------------------------------------------------- Phare

export const stove: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-36" y="-70" width="72" height="62" rx="6" fill="${m(g, 'iron')}"/><rect x="-24" y="-50" width="48" height="26" rx="4" fill="${g.c('#101326', '#E8744A')}" opacity=".85"/><path d="M-30 -8v8M30 -8v8" stroke="${m(g, 'iron')}" stroke-width="6"/><rect x="-10" y="-160" width="20" height="90" fill="${m(g, 'iron')}"/>
  <path d="M-14 -84q14 -18 28 0v12h-28z" fill="${m(g, 'brass')}"/><path d="M14 -80q10 0 12 -8" stroke="${m(g, 'brass')}" stroke-width="3" fill="none"/>`, [[-20, -92, 'le poêle'], [2, -100, 'la bouilloire']]);

export const potRack: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-4" width="120" height="8" rx="3" fill="${m(g, 'iron')}"/>${[-44, -14, 16, 44].map((dx, i) => `<path d="M${dx} 4v10" stroke="${m(g, 'iron')}" stroke-width="2"/><path d="M${dx - 12 + i} 14h${24 - i * 2}v${12 + i * 2}a${12 - i} 8 0 0 1 ${-24 + i * 2} 0z" fill="${i % 2 ? m(g, 'brass') : m(g, 'ironL')}"/>`).join('')}`, [[-44, -14, 'les casseroles'], [30, -14, 'le crochet']]);

export const breadBasket: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-24 0q-4 -18 0 -20h48q4 2 0 20z" fill="${m(g, 'woodL')}"/><ellipse cx="-8" cy="-22" rx="14" ry="8" fill="${g.c('#262B52', '#c98a4a')}"/><ellipse cx="10" cy="-20" rx="12" ry="7" fill="${g.c('#262B52', '#b8783c')}"/>`, [[0, -36, 'la corbeille à pain']]);

export const teapot: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<ellipse cx="0" cy="-14" rx="18" ry="14" fill="${acc(g, o?.c ?? 1)}"/><path d="M16 -18q14 -2 16 -12M-18 -20q-10 0 -8 12" stroke="${acc(g, o?.c ?? 1)}" stroke-width="4" fill="none"/><circle cy="-30" r="4" fill="${acc(g, o?.c ?? 1)}"/>`, [[0, -44, 'la théière']]);

/** Spiral stair against the round wall, rising to the right. */
export const spiral: Prop = (g, x, y, s = 1, o) => {
  let st = '';
  for (let i = 0; i < 9; i++) st += `<path d="M${-120 + i * 26} ${-i * 34}h40l-6 14h-40z" fill="${i % 2 ? m(g, 'woodL') : m(g, 'wood')}"/>`;
  return mk(x, y, s, o, `<path d="M-100 0V-40" stroke="${m(g, 'woodD')}" stroke-width="6"/>${st}<path d="M-110 -30Q0 -160 110 -300" stroke="${m(g, 'brass')}" stroke-width="3" fill="none"/>${[0, 3, 6].map((i) => `<path d="M${-100 + i * 26} ${-i * 34}v-30" stroke="${m(g, 'brassD')}" stroke-width="2"/>`).join('')}`,
    [[-100, -30, 'la première marche'], [-22, -130, 'le palier'], [70, -250, 'la marche du haut']]);
};

export const bed: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-70" y="-40" width="140" height="26" rx="6" fill="${acc(g, o?.c ?? 3, '#1f2448')}" opacity=".85"/><rect x="-70" y="-50" width="40" height="16" rx="8" fill="${m(g, 'paper')}"/><path d="M-74 0v-80M74 0v-44" stroke="${m(g, 'wood')}" stroke-width="8" stroke-linecap="round"/><rect x="-74" y="-18" width="148" height="10" fill="${m(g, 'wood')}"/>`, [[-58, -96, 'la tête du lit'], [40, -58, 'la couverture']]);

export const desk: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-64" y="-70" width="128" height="12" rx="3" fill="${m(g, 'woodL')}"/><rect x="18" y="-58" width="40" height="58" fill="${m(g, 'wood')}"/><path d="M24 -40h28M24 -20h28" stroke="${m(g, 'woodD')}" stroke-width="3"/><path d="M-56 -58V0" stroke="${m(g, 'wood')}" stroke-width="8"/>
  <rect x="-46" y="-80" width="44" height="10" rx="1" fill="${m(g, 'paper')}" transform="rotate(-4 -24 -75)"/><path d="M10 -70l6 -22" stroke="${m(g, 'paperD')}" stroke-width="1.5"/>`, [[-24, -92, 'le bureau'], [40, -86, 'le coin du bureau']]);

export const lensBig: Prop = (g, x, y, s = 1, o) => {
  let rings = '';
  for (let i = 0; i < 6; i++) rings += `<ellipse cx="0" cy="-110" rx="${60 - i * 9}" ry="${86 - i * 13}" fill="none" stroke="${g.c('#2a3563', '#FFE6B0')}" stroke-width="3" opacity="${(0.4 + i * 0.1).toFixed(2)}"/>`;
  return mk(x, y, s, o, `<circle cx="0" cy="-110" r="${80 + g.t * 30}" fill="${g.glow}" opacity="${(0.05 + g.t * 0.25).toFixed(2)}"/><rect x="-40" y="-20" width="80" height="20" fill="${m(g, 'brassD')}"/><path d="M-60 -110a60 86 0 0 1 120 0a60 86 0 0 1 -120 0" fill="${g.c('#141a3a', '#3a4a6a')}" opacity=".7"/>${rings}<rect x="-66" y="-30" width="132" height="12" rx="4" fill="${m(g, 'brass')}"/><rect x="-66" y="-200" width="132" height="10" rx="4" fill="${m(g, 'brass')}"/>`,
    [[0, -110, 'la grande lentille'], [-50, -214, 'le haut de la lentille'], [52, -40, 'le socle']]);
};

export const oilCan: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-14 0v-30l6 -8h16l6 8v30z" fill="${acc(g, o?.c ?? 1, '#1f2448')}"/><path d="M8 -36q12 -12 20 -6" stroke="${m(g, 'brass')}" stroke-width="3" fill="none"/>`, [[0, -50, 'le bidon d’huile']]);

// ---------------------------------------------------------------- library

export const bookcase: Prop = (g, x, y, s = 1, o) => {
  const w = o?.w ?? 90, h = 250;
  let b = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${m(g, 'woodD')}"/><rect x="${-w / 2}" y="${-h - 10}" width="${w}" height="12" fill="${m(g, 'wood')}"/>`;
  for (let row = 0; row < 5; row++) {
    const yy = -h + 12 + row * 48;
    b += `<rect x="${-w / 2}" y="${yy + 40}" width="${w}" height="6" fill="${m(g, 'wood')}"/>`;
    let cx = -w / 2 + 4;
    while (cx < w / 2 - 10) { const bw = 6 + Math.floor(g.r() * 7), bh = 24 + Math.floor(g.r() * 14); b += `<rect x="${cx}" y="${yy + 40 - bh}" width="${bw}" height="${bh}" rx="1" fill="${acc(g, Math.floor(g.r() * 8))}" opacity=".9"/>`; cx += bw + 1.5; }
  }
  return mk(x, y, s, o, b, [[0, -h - 24, 'le haut du rayonnage'], [w / 4, -118, 'le rayonnage']]);
};

export const ladder: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-20 0L10 -260M16 0L46 -260" stroke="${m(g, 'woodL')}" stroke-width="6"/>${[...Array(9)].map((_, i) => `<path d="M${-18 + i * 3.3} ${-24 - i * 28}h36" stroke="${m(g, 'wood')}" stroke-width="4"/>`).join('')}<circle cx="-20" cy="0" r="6" fill="${m(g, 'brass')}"/><circle cx="16" cy="0" r="6" fill="${m(g, 'brass')}"/><path d="M4 -266h48" stroke="${m(g, 'brass')}" stroke-width="3"/>`, [[-4, -110, 'l’échelle'], [26, -230, 'le haut de l’échelle']]);

export const globe: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-30 0l30 -40 30 40M0 -40v-14" stroke="${m(g, 'wood')}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cy="-100" r="46" fill="${g.c('#1a2046', '#3f6a8a')}"/>
  <path d="M-30 -120q20 -10 30 4t26 -4M-38 -92q18 10 30 -2t28 8M-10 -70q10 -6 24 2" stroke="${g.c('#22305a', '#9CCB8A')}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 -154a54 54 0 0 1 0 108" stroke="${m(g, 'brass')}" stroke-width="5" fill="none"/><path d="M-46 -100h92" stroke="${m(g, 'brassD')}" stroke-width="2" opacity=".7"/>`, [[0, -164, 'le haut du globe'], [44, -60, 'le pied du globe']]);

export const mapTable: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-90" y="-72" width="180" height="14" rx="3" fill="${m(g, 'woodL')}"/><path d="M-78 -58V0M78 -58V0" stroke="${m(g, 'wood')}" stroke-width="9" stroke-linecap="round"/>
  <path d="M-70 -76l60 -8 50 8 -50 6z" fill="${m(g, 'paper')}"/><path d="M-50 -78q20 -6 40 0M-20 -72q20 4 40 -2" stroke="${m(g, 'paperD')}" stroke-width="1.5" fill="none"/>${[40, 58, 72].map((dx, i) => `<rect x="${dx - 4}" y="${-84 - i * 5}" width="8" height="28" rx="4" fill="${m(g, i % 2 ? 'paperD' : 'paper')}" transform="rotate(${60 + i * 8} ${dx} ${-78})"/>`).join('')}`,
  [[-50, -92, 'la carte dépliée'], [60, -104, 'les cartes roulées']]);

export const windrose: Prop = (g, x, y, s = 1, o) => {
  let pts = '';
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, L = i % 2 ? 24 : 44; pts += `<path d="M0 0L${r1(Math.cos(a - 0.2) * 9)} ${r1(Math.sin(a - 0.2) * 9)}L${r1(Math.cos(a) * L)} ${r1(Math.sin(a) * L)}L${r1(Math.cos(a + 0.2) * 9)} ${r1(Math.sin(a + 0.2) * 9)}z" fill="${i % 2 ? m(g, 'brassD') : m(g, 'gold')}"/>`; }
  return mk(x, y, s, o, `<circle r="50" fill="none" stroke="${m(g, 'brass')}" stroke-width="2"/>${pts}<circle r="5" fill="${m(g, 'paper')}"/>`, [[0, -62, 'la rose des vents']]);
};

export const spyglass: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0l-22 -60M0 0l22 -60M0 0v-62" stroke="${m(g, 'wood')}" stroke-width="4"/><rect x="-44" y="-86" width="90" height="16" rx="6" fill="${m(g, 'brass')}" transform="rotate(-24 0 -78)"/><rect x="36" y="-104" width="22" height="20" rx="4" fill="${m(g, 'brassD')}" transform="rotate(-24 0 -78)"/>`, [[-30, -86, 'la longue-vue']]);

export const lectern: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-80M-22 0h44" stroke="${m(g, 'wood')}" stroke-width="8" stroke-linecap="round"/><path d="M-34 -80l68 -18v14l-68 18z" fill="${m(g, 'woodL')}"/><path d="M-26 -88l50 -13" stroke="${m(g, 'paper')}" stroke-width="7"/>`, [[0, -112, 'le pupitre']]);

export const writingDesk: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-50 -60l100 -14v10l-100 14z" fill="${m(g, 'woodL')}"/><path d="M-42 -50V0M42 -62V0" stroke="${m(g, 'wood')}" stroke-width="7" stroke-linecap="round"/><path d="M-30 -60l50 -7" stroke="${m(g, 'paper')}" stroke-width="6"/><rect x="26" y="-82" width="10" height="10" rx="3" fill="${m(g, 'ink')}"/><path d="M34 -80l10 -20" stroke="${m(g, 'paper')}" stroke-width="2"/>`, [[-24, -80, 'le pupitre'], [40, -100, 'l’encrier']]);

export const easel: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-30 0l24 -150M30 0l-24 -150M0 -150v150" stroke="${m(g, 'wood')}" stroke-width="5"/><rect x="-40" y="-130" width="80" height="70" fill="${m(g, 'paper')}"/><circle cx="-10" cy="-100" r="14" fill="${g.c('#262B52', '#D8B56A')}" opacity=".9"/><path d="M-30 -74q20 -18 60 -6" stroke="${acc(g, 4)}" stroke-width="4" fill="none"/><path d="M-44 -58h88" stroke="${m(g, 'woodL')}" stroke-width="5"/>`, [[0, -164, 'le chevalet']]);

export const paintPots: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2].map((i) => `<rect x="${-30 + i * 22}" y="-18" width="16" height="18" rx="3" fill="${acc(g, i + 4)}"/><path d="M${-26 + i * 22} -18l${4 - i * 3} -18" stroke="${m(g, 'wood')}" stroke-width="2"/>`).join(''), [[0, -40, 'les pots de couleur']]);

export const bookPress: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-20" width="80" height="20" fill="${m(g, 'wood')}"/><path d="M-34 -20v-80M34 -20v-80M-40 -100h80" stroke="${m(g, 'iron')}" stroke-width="7"/><path d="M0 -100v40M-24 -60h48" stroke="${m(g, 'ironL')}" stroke-width="6"/><circle cy="-110" r="10" fill="none" stroke="${m(g, 'ironL')}" stroke-width="4"/>${[0, 1, 2].map((i) => `<rect x="-26" y="${-34 - i * 9}" width="52" height="8" rx="1" fill="${acc(g, i + 1)}"/>`).join('')}`, [[0, -126, 'la presse']]);

export const drawers: Prop = (g, x, y, s = 1, o) => {
  let d = `<rect x="-50" y="-150" width="100" height="150" fill="${m(g, 'wood')}"/>`;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) d += `<rect x="${-46 + c * 31}" y="${-146 + r * 24}" width="28" height="20" rx="2" fill="${m(g, 'woodL')}"/><circle cx="${-32 + c * 31}" cy="${-136 + r * 24}" r="2" fill="${m(g, 'brass')}"/>`;
  return mk(x, y, s, o, d, [[-24, -164, 'le haut du meuble'], [30, -64, 'les tiroirs']]);
};

export const wastebasket: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-18 0l-4 -40h44l-4 40z" fill="${m(g, 'woodL')}"/>${[[-10, -46], [6, -50], [16, -40], [-26, -12], [30, -6]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="7" fill="${m(g, 'paper')}"/><path d="M${dx - 4} ${dy - 2}l6 3" stroke="${m(g, 'paperD')}" stroke-width="1.2"/>`).join('')}`, [[0, -64, 'la corbeille']]);

export const armchair: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 -30v-60q0 -16 16 -16h48q16 0 16 16v60z" fill="${acc(g, o?.c ?? 1, '#1f1838')}"/><rect x="-50" y="-50" width="20" height="44" rx="8" fill="${acc(g, o?.c ?? 1, '#1f1838')}"/><rect x="30" y="-50" width="20" height="44" rx="8" fill="${acc(g, o?.c ?? 1, '#1f1838')}"/><rect x="-40" y="-40" width="80" height="22" rx="6" fill="${g.c('#262B52', '#c98a6a')}"/><path d="M-40 -6v6M40 -6v6" stroke="${m(g, 'wood')}" stroke-width="6"/>`, [[0, -120, 'le fauteuil']]);

export const floorLamp: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-140M-16 0h32" stroke="${m(g, 'brass')}" stroke-width="4"/><path d="M-20 -140l6 -24h28l6 24z" fill="${g.c('#262B52', '#E8C07A')}"/>`, [[0, -176, 'le lampadaire']]);

export const fireplace: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-80" y="-130" width="160" height="130" fill="${m(g, 'stoneL')}"/><rect x="-90" y="-138" width="180" height="14" rx="3" fill="${m(g, 'stone')}"/><path d="M-50 0v-70a50 40 0 0 1 100 0V0z" fill="${g.c('#0a0b18', '#2a1a12')}"/>
  <path d="M-24 -6q12 -40 24 -30q12 -24 20 4q10 -8 4 26z" fill="${g.c('#2a1a22', '#E8744A')}" opacity="${(0.3 + g.t * 0.6).toFixed(2)}"/><path d="M-30 -4h60" stroke="${m(g, 'woodD')}" stroke-width="7" stroke-linecap="round"/>`, [[-60, -150, 'le manteau de la cheminée'], [0, -40, 'l’âtre'], [60, -150, 'le bout du manteau']]);

export const vitrail: Prop = (g, x, y, s = 1, o) => {
  const cols = ['#8FB8F0', '#E88A8A', '#FFD98E', '#7FC8A9', '#B79CE0'];
  let p = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) p += `<rect x="${-24 + j * 16}" y="${-120 + i * 20}" width="16" height="20" fill="${g.c('#1a1f44', cols[(i * 2 + j + (o?.c ?? 0)) % 5])}" opacity=".85"/>`;
  return mk(x, y, s, o, `<path d="M-24 -20V-110a24 24 0 0 1 48 0V-20z" fill="#0a0c1e"/>${p}<path d="M-24 -20V-110a24 24 0 0 1 48 0V-20z" fill="none" stroke="${m(g, 'iron')}" stroke-width="4"/><path d="M-24 -60h48M0 -134v114" stroke="${m(g, 'iron')}" stroke-width="2"/><rect x="-30" y="-20" width="60" height="7" rx="2" fill="${m(g, 'stone')}"/>`, [[0, -8, 'le rebord du vitrail']]);
};

// ---------------------------------------------------------------- clockworks

export const grandfather: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-27" y="-214" width="54" height="214" rx="8" fill="${g.c('#1B1F3A', '#5a4330')}"/><circle cx="0" cy="-180" r="20" fill="${g.c('#262B52', '#e9d6ae')}"/><path d="M0 -180v-12M0 -180l8 4" stroke="#1B1F3A" stroke-width="2.2" stroke-linecap="round"/>
  <rect x="-15" y="-146" width="30" height="120" rx="6" fill="${g.c('#141833', '#3a2a1e')}"/><path d="M0 -142v80" stroke="${g.c('#2E3360', '#c9a563')}" stroke-width="2"/><circle cx="0" cy="-58" r="9" fill="${g.c('#2E3360', '#D8B56A')}"/>`, [[0, -180, 'la pendule']]);

export const wallClock: Prop = (g, x, y, s = 1, o) => {
  const r = o?.w ?? 26;
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; ticks += `<path d="M${r1(Math.cos(a) * (r - 4))} ${r1(Math.sin(a) * (r - 4))}L${r1(Math.cos(a) * (r - 8))} ${r1(Math.sin(a) * (r - 8))}" stroke="#1B1F3A" stroke-width="2"/>`; }
  const h = (o?.v ?? 0) * 0.7;
  return mk(x, y, s, o, `<circle r="${r + 5}" fill="${m(g, o?.c === 1 ? 'brass' : 'wood')}"/><circle r="${r}" fill="${m(g, 'paper')}"/>${ticks}<path d="M0 0L${r1(Math.cos(h - 1.6) * r * 0.5)} ${r1(Math.sin(h - 1.6) * r * 0.5)}M0 0L${r1(Math.cos(h * 3) * r * 0.75)} ${r1(Math.sin(h * 3) * r * 0.75)}" stroke="#1B1F3A" stroke-width="2.4" stroke-linecap="round"/>`, [[0, -r - 16, 'l’horloge']]);
};

export const gearWall: Prop = (g, x, y, s = 1, o) => {
  const r = o?.w ?? 24;
  const teeth = Math.max(8, Math.round(r / 2.6));
  return mk(x, y, s, o, `<circle r="${r}" fill="none" stroke="${m(g, o?.c === 1 ? 'gold' : 'brassD')}" stroke-width="${r / 4}" stroke-dasharray="${r1((2 * Math.PI * r) / teeth / 2)} ${r1((2 * Math.PI * r) / teeth / 2)}"/><circle r="${r * 0.72}" fill="none" stroke="${m(g, o?.c === 1 ? 'gold' : 'brassD')}" stroke-width="3"/><circle r="${r / 2}" fill="${m(g, 'woodD')}"/><circle r="${r / 6}" fill="${m(g, 'brass')}"/>`, [[0, 0, 'la roue murale']]);
};

export const anvil: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-16 0l6 -40h20l6 40z" fill="${m(g, 'wood')}"/><path d="M-44 -54h70q20 0 30 -10v8q-8 12 -28 14h-12l-6 6h-28l-6 -6h-20z" fill="${m(g, 'ironL')}"/>`, [[0, -76, 'l’enclume']]);

export const forge: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-70" width="120" height="70" fill="${m(g, 'stone')}"/><path d="M-50 -70h100l-20 -30h-60z" fill="${m(g, 'stoneD')}"/><rect x="-16" y="-240" width="32" height="140" fill="${m(g, 'stone')}"/>
  <path d="M-40 -72q10 -20 20 -8q10 -26 22 0q10 -16 18 8z" fill="${g.c('#2a1a22', '#E8744A')}" opacity="${(0.3 + g.t * 0.6).toFixed(2)}"/>${[...Array(6)].map((_, i) => `<circle cx="${-30 + i * 12}" cy="${-76 - (i % 3) * 6}" r="2" fill="${g.c('#262B52', '#FFD98E')}"/>`).join('')}`, [[-40, -112, 'la forge'], [40, -112, 'le bord de la forge']]);

export const bellows: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 -20l50 -16v32z" fill="${m(g, 'cloth')}"/><path d="M-40 -20l50 -16M-40 -20l50 16" stroke="${m(g, 'wood')}" stroke-width="5"/><path d="M10 -20h26" stroke="${m(g, 'iron')}" stroke-width="5"/><path d="M-40 -20h-20" stroke="${m(g, 'wood')}" stroke-width="7" stroke-linecap="round"/>`, [[-10, -50, 'le soufflet']]);

export const bell: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 ${-y / s}V-50" stroke="${m(g, 'wood')}" stroke-width="6"/><path d="M-34 0q2 -46 34 -50q32 4 34 50z" fill="${m(g, o?.c === 1 ? 'gold' : 'brass')}"/><rect x="-38" y="-4" width="76" height="8" rx="4" fill="${m(g, 'brassD')}"/><circle cy="10" r="7" fill="${m(g, 'brassD')}"/>`, [[0, 26, 'la cloche']]);

export const bigPendulum: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 ${-y / s}V-40" stroke="${m(g, 'brass')}" stroke-width="5"/><circle r="40" fill="${m(g, 'gold')}"/><circle r="28" fill="none" stroke="${m(g, 'brassD')}" stroke-width="3"/><circle r="8" fill="${m(g, 'brassD')}"/>`, [[0, 0, 'le balancier']]);

export const clockFace: Prop = (g, x, y, s = 1, o) => {
  let t = '';
  const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2; t += `<text x="${r1(Math.cos(a) * 92)}" y="${r1(Math.sin(a) * 92 + 5)}" text-anchor="middle" font-family="${SVG_SERIF}" font-size="15" fill="${g.c('#262B52', '#3a2a1e')}">${R[i]}</text>`; }
  return mk(x, y, s, o, `<circle r="120" fill="${m(g, 'brass')}"/><circle r="110" fill="${m(g, 'paper')}"/>${t}<path d="M0 0L-40 -56M0 0L70 20" stroke="#1B1F3A" stroke-width="6" stroke-linecap="round"/><circle r="8" fill="#1B1F3A"/>`, [[-86, -78, 'le cadran, en haut à gauche'], [0, -140, 'le haut du cadran'], [86, 70, 'le cadran, en bas à droite']]);
};

export const cuckoo: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-30 0v-50l30 -26 30 26v50z" fill="${m(g, 'wood')}"/><path d="M-36 -48l36 -32 36 32" stroke="${m(g, 'woodL')}" stroke-width="6" fill="none"/><rect x="-8" y="-58" width="16" height="14" fill="#0a0c1e"/><circle cy="-22" r="14" fill="${m(g, 'paper')}"/><path d="M0 -22v-8M0 -22l6 3" stroke="#1B1F3A" stroke-width="1.8"/><path d="M-10 0v40M10 0v28" stroke="${m(g, 'brassD')}" stroke-width="2"/><path d="M-14 40h8v14h-8zM6 28h8v14h-8z" fill="${m(g, 'brass')}"/>`, [[0, -90, 'le coucou']]);

export const moonClock: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-190" width="120" height="190" rx="10" fill="${m(g, 'wood')}"/><path d="M-50 -110a50 50 0 0 1 100 0z" fill="${g.c('#1a1f44', '#2a3a6a')}"/>${[-30, 0, 30].map((dx, i) => `<circle cx="${dx}" cy="-126" r="10" fill="${m(g, 'paper')}" opacity=".9"/>${i !== 1 ? `<circle cx="${dx + (i ? 5 : -5)}" cy="-128" r="9" fill="${g.c('#1a1f44', '#2a3a6a')}"/>` : ''}`).join('')}
  <circle cy="-60" r="34" fill="${m(g, 'paper')}"/><path d="M0 -60v-24M0 -60l14 8" stroke="#1B1F3A" stroke-width="3" stroke-linecap="round"/>${[...Array(5)].map((_, i) => `<circle cx="${-44 + i * 22}" cy="-170" r="2" fill="${g.c('#262B52', '#FFD98E')}"/>`).join('')}`, [[0, -206, 'l’horloge lunaire'], [0, -20, 'le bas de l’horloge']]);

export const doll: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-12 0l4 -30h16l4 30z" fill="${acc(g, o?.c ?? 1)}"/><circle cy="-40" r="11" fill="${m(g, 'paper')}"/><path d="M-11 -44q11 -14 22 0" fill="${acc(g, (o?.c ?? 1) + 3)}"/><circle cx="-4" cy="-40" r="1.6" fill="#1B1F3A"/><circle cx="4" cy="-40" r="1.6" fill="#1B1F3A"/><path d="M-6 -24l-10 12M6 -24l10 12" stroke="${m(g, 'paper')}" stroke-width="3"/><path d="M14 -30l8 -4" stroke="${m(g, 'brass')}" stroke-width="3"/>`, [[0, -64, 'la poupée']]);

export const chessAutomaton: Prop = (g, x, y, s = 1, o) => {
  let board = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) board += `<rect x="${-40 + j * 20}" y="${-66 - (3 - i) * 3}" width="20" height="3" fill="${(i + j) % 2 ? m(g, 'paper') : m(g, 'woodD')}"/>`;
  return mk(x, y, s, o, `<rect x="-60" y="-60" width="120" height="60" fill="${m(g, 'wood')}"/><rect x="-44" y="-80" width="88" height="14" fill="${m(g, 'woodL')}"/>${board}<path d="M-20 -84l4 -12h8l4 12zM16 -84l3 -16h6l3 16z" fill="${m(g, 'paper')}"/><path d="M26 -100l0 -8" stroke="${m(g, 'paper')}" stroke-width="3"/>
  <path d="M60 -60l30 -10v-60l-30 -10z" fill="${acc(g, 5)}" opacity=".9"/><circle cx="76" cy="-160" r="16" fill="${m(g, 'paper')}"/><path d="M62 -168q14 -18 28 0" fill="${m(g, 'velvet')}"/><path d="M62 -100l-40 10" stroke="${m(g, 'brass')}" stroke-width="5" stroke-linecap="round"/>`, [[-30, -110, 'l’échiquier'], [76, -196, 'le joueur d’échecs']]);
};

export const musicBox: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-40" width="80" height="40" rx="4" fill="${m(g, 'velvet')}"/><path d="M-40 -40l-4 -30h88l-4 30" fill="${m(g, 'woodL')}"/><path d="M-40 -20h80" stroke="${m(g, 'gold')}" stroke-width="2"/><ellipse cy="-42" rx="20" ry="4" fill="${m(g, 'gold')}"/>
  <path d="M0 -44v-36M0 -70l-14 -8M0 -70l12 -12" stroke="${m(g, 'paper')}" stroke-width="3" stroke-linecap="round"/><path d="M-10 -44q10 -20 20 0z" fill="${acc(g, 2)}"/><circle cy="-86" r="5" fill="${m(g, 'paper')}"/><path d="M44 -20h10l4 -6" stroke="${m(g, 'brass')}" stroke-width="3" fill="none"/>`, [[0, -104, 'la danseuse'], [-40, -84, 'le couvercle']]);

export const mechHeart: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 30C-60 -10 -70 -60 -40 -80c20 -12 36 -2 40 12c4 -14 20 -24 40 -12c30 20 20 70 -40 110z" fill="${m(g, 'brassD')}"/><path d="M0 18C-44 -12 -52 -52 -32 -66c14 -8 26 0 32 12c6 -12 18 -20 32 -12c20 14 12 54 -32 84z" fill="none" stroke="${m(g, 'gold')}" stroke-width="3"/>
  <circle cx="-18" cy="-40" r="14" fill="none" stroke="${m(g, 'gold')}" stroke-width="5" stroke-dasharray="4 3"/><circle cx="16" cy="-30" r="10" fill="none" stroke="${m(g, 'gold')}" stroke-width="4" stroke-dasharray="3 3"/><circle r="${6 + g.t * 4}" cx="0" cy="-10" fill="${g.c('#262B52', '#E88A8A')}"/>
  <path d="M-60 -60H-120M60 -60h60M40 -80v-60" stroke="${m(g, 'iron')}" stroke-width="8" fill="none"/>`, [[0, -100, 'le cœur de l’automate'], [-110, -76, 'le tuyau de gauche'], [90, -76, 'le tuyau de droite']]);

export const workbench: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-91" y="-76" width="182" height="16" rx="4" fill="${m(g, 'woodL')}"/><path d="M-79 -60v60M79 -60v60" stroke="${m(g, 'woodD')}" stroke-width="10" stroke-linecap="round"/><g transform="translate(0 -92)"><circle r="14" fill="none" stroke="${m(g, 'gold')}" stroke-width="5" stroke-dasharray="5 4"/><circle cx="24" cy="6" r="9" fill="none" stroke="${m(g, 'brass')}" stroke-width="4" stroke-dasharray="4 3"/></g>`, [[-46, -86, 'l’établi, à gauche'], [50, -86, 'l’établi, à droite']]);

export const vise: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-14" y="-26" width="28" height="26" fill="${m(g, 'ironL')}"/><rect x="-20" y="-34" width="40" height="10" fill="${m(g, 'iron')}"/><path d="M14 -14h22" stroke="${m(g, 'ironL')}" stroke-width="4"/>`, [[0, -48, 'l’étau']]);

export const toolBoard: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-40" width="120" height="80" rx="4" fill="${m(g, 'woodD')}"/>${[-44, -24, -4, 18, 40].map((dx, i) => i % 2 ? `<path d="M${dx} -28v44" stroke="${m(g, 'ironL')}" stroke-width="4"/><rect x="${dx - 7}" y="-32" width="14" height="10" fill="${m(g, 'wood')}"/>` : `<path d="M${dx} -30v36" stroke="${m(g, 'wood')}" stroke-width="4"/><path d="M${dx - 6} 6h12" stroke="${m(g, 'ironL')}" stroke-width="6"/>`).join('')}`, [[0, -54, 'le tableau à outils']]);

export const hourglass: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-14 -40h28M-14 0h28" stroke="${m(g, 'wood')}" stroke-width="4"/><path d="M-10 -38q0 14 10 18q10 -4 10 -18zM-10 -2q0 -14 10 -18q10 4 10 18z" fill="${g.c('#1a2046', '#BFE6F0')}" opacity=".6"/><path d="M-6 -4q6 -8 12 0z" fill="${g.c('#262B52', '#D8B56A')}"/>`, [[0, -52, 'le sablier']]);

export const W2 = W / 2;
