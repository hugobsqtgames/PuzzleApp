// Scene props, part 2: glasshouse, pond, floating market.
import { m, acc, flame, r1 } from './kit';
import { Prop, mk } from './props1';

// ---------------------------------------------------------------- glasshouse

export const orangeTree: Prop = (g, x, y, s = 1, o) => {
  let fruit = '';
  const pts = [[-30, -150], [8, -176], [34, -140], [-6, -128], [22, -110], [-38, -118]];
  pts.forEach(([dx, dy], i) => { fruit += `<circle cx="${dx}" cy="${dy}" r="${6 + (i % 2)}" fill="${g.c('#2a2440', i === (o?.v ?? 9) ? '#FFD98E' : '#F09A4A')}"/>`; });
  return mk(x, y, s, o, `<path d="M-30 0l-6 -44h72l-6 44z" fill="${m(g, 'clay')}"/><path d="M-38 -44h76" stroke="${g.c('#262040', '#c0704a')}" stroke-width="6"/><path d="M0 -44v-70" stroke="${m(g, 'woodD')}" stroke-width="8"/>
  <circle cx="0" cy="-146" r="54" fill="${m(g, 'leafD')}"/><circle cx="-22" cy="-160" r="30" fill="${m(g, 'leaf')}"/><circle cx="26" cy="-140" r="30" fill="${m(g, 'leaf')}"/><circle cx="6" cy="-180" r="22" fill="${m(g, 'leafL')}"/>${fruit}`,
  [[0, -212, 'le sommet de l’oranger'], [0, -58, 'le bac de l’oranger']]);
};

export const fountain: Prop = (g, x, y, s = 1, o) => {
  const w = g.c('#22305a', '#8FD3E0');
  return mk(x, y, s, o, `<ellipse cx="0" cy="-14" rx="100" ry="22" fill="${m(g, 'stoneL')}"/><ellipse cx="0" cy="-20" rx="88" ry="16" fill="${g.c('#101634', '#2f6a7a')}"/><rect x="-10" y="-110" width="20" height="94" fill="${m(g, 'stoneL')}"/><ellipse cx="0" cy="-110" rx="44" ry="10" fill="${m(g, 'stone')}"/>
  <path d="M0 -120q-30 -40 -44 8M0 -120q30 -40 44 8M0 -120v-30" stroke="${w}" stroke-width="3" fill="none" opacity=".75"/><circle cy="-154" r="5" fill="${w}"/>${[-60, -20, 30, 64].map((dx) => `<ellipse cx="${dx}" cy="-20" rx="10" ry="2" fill="none" stroke="${w}" stroke-width="1" opacity=".6"/>`).join('')}`,
  [[0, -172, 'le jet de la fontaine'], [-70, -40, 'la margelle, à gauche'], [70, -40, 'la margelle, à droite']]);
};

export const bench: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-40" width="120" height="8" rx="3" fill="${m(g, 'woodL')}"/><rect x="-60" y="-70" width="120" height="7" rx="3" fill="${m(g, 'woodL')}"/><rect x="-60" y="-56" width="120" height="7" rx="3" fill="${m(g, 'wood')}"/><path d="M-50 -32V0M50 -32V0M-52 -70v38M52 -70v38" stroke="${m(g, 'iron')}" stroke-width="5"/>`, [[-30, -84, 'le banc'], [34, -54, 'l’autre bout du banc']]);

export const pot: Prop = (g, x, y, s = 1, o) => {
  const v = o?.v ?? 0;
  const leaves = v === 1
    ? `<path d="M0 -30q-30 -50 -10 -80M0 -30q30 -46 16 -84M0 -30q-4 -40 4 -70" stroke="${m(g, 'leafL')}" stroke-width="8" fill="none" stroke-linecap="round"/>`
    : v === 2 ? `<circle cy="-60" r="26" fill="${m(g, 'leaf')}"/><circle cx="-8" cy="-66" r="6" fill="${acc(g, o?.c ?? 1)}"/><circle cx="10" cy="-56" r="6" fill="${acc(g, (o?.c ?? 1) + 3)}"/><circle cx="2" cy="-76" r="5" fill="${acc(g, (o?.c ?? 1) + 5)}"/>`
      : [-40, -15, 15, 40].map((a) => `<ellipse cx="${a / 2}" cy="-58" rx="8" ry="30" transform="rotate(${a} ${a / 2} -34)" fill="${m(g, a % 20 ? 'leafL' : 'leaf')}"/>`).join('');
  return mk(x, y, s, o, `${leaves}<path d="M-18 0l-4 -32h44l-4 32z" fill="${m(g, 'clay')}"/><rect x="-24" y="-36" width="48" height="7" rx="2" fill="${g.c('#262040', '#c0704a')}"/>`, [[0, v === 1 ? -120 : -96, 'le pot']]);
};

export const palm: Prop = (g, x, y, s = 1, o) => {
  let fronds = '';
  for (let i = 0; i < 7; i++) { const a = -150 + i * 22; fronds += `<path d="M0 -250q${r1(Math.cos(a * Math.PI / 180) * 60)} ${r1(Math.sin(a * Math.PI / 180) * 40 - 20)} ${r1(Math.cos(a * Math.PI / 180) * 110)} ${r1(Math.sin(a * Math.PI / 180) * 70 + 40)}" stroke="${m(g, i % 2 ? 'leaf' : 'leafL')}" stroke-width="14" fill="none" stroke-linecap="round"/>`; }
  return mk(x, y, s, o, `<path d="M-10 0q-6 -130 10 -250M10 0q-2 -130 -10 -250" stroke="${m(g, 'woodL')}" stroke-width="10" fill="none"/>${[...Array(10)].map((_, i) => `<path d="M-10 ${-20 - i * 24}h20" stroke="${m(g, 'woodD')}" stroke-width="3"/>`).join('')}${fronds}<circle cx="-8" cy="-244" r="7" fill="${m(g, 'woodD')}"/><circle cx="8" cy="-240" r="7" fill="${m(g, 'woodD')}"/>`,
    [[0, -276, 'le haut du palmier'], [0, -140, 'le tronc du palmier']]);
};

export const vine: Prop = (g, x, y, s = 1, o) => {
  const L = o?.w ?? 200;
  let leaves = '';
  for (let i = 1; i < L / 26; i++) leaves += `<ellipse cx="${(i % 2 ? -1 : 1) * 9}" cy="${i * 26}" rx="10" ry="5" transform="rotate(${i % 2 ? 30 : -30} ${(i % 2 ? -1 : 1) * 9} ${i * 26})" fill="${m(g, i % 3 ? 'leafL' : 'leaf')}"/>`;
  return mk(x, 0, s, o, `<path d="M0 0q16 ${L / 3} -6 ${L * 0.66}t6 ${L / 3}" stroke="${m(g, 'leafD')}" stroke-width="4" fill="none"/>${leaves}`, [[0, L + 10, 'la liane']]);
};

export const walkway: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-200" y="0" width="400" height="10" fill="${m(g, 'ironL')}"/><path d="M-200 -40H200" stroke="${m(g, 'ironL')}" stroke-width="3"/>${[...Array(21)].map((_, i) => `<path d="M${-200 + i * 20} 0v-40" stroke="${m(g, 'iron')}" stroke-width="2"/>`).join('')}<path d="M-140 10l-30 160M140 10l30 160" stroke="${m(g, 'iron')}" stroke-width="6"/>`, [[-110, -54, 'la passerelle, à gauche'], [110, -54, 'la passerelle, à droite']]);

export const bigLeaf: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0q-10 -80 -60 -120q70 0 60 120z" fill="${m(g, 'leaf')}"/><path d="M0 0q-10 -80 -60 -120" stroke="${m(g, 'leafL')}" stroke-width="2" fill="none"/><path d="M0 0q20 -70 70 -90q-40 60 -70 90z" fill="${m(g, 'leafD')}"/>`, [[-40, -120, 'la grande feuille']]);

export const moonFlower: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0q-6 -40 4 -70" stroke="${m(g, 'leafL')}" stroke-width="4" fill="none"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="4" cy="-86" rx="7" ry="16" transform="rotate(${a} 4 -76)" fill="${g.c('#262B52', '#EFE8D8')}" opacity=".9"/>`).join('')}<circle cx="4" cy="-76" r="5" fill="${g.c('#262B52', '#FFD98E')}"/>`, [[4, -112, 'la fleur de minuit']]);

export const seedTable: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-80" y="-66" width="160" height="10" fill="${m(g, 'woodL')}"/><path d="M-70 -56V0M70 -56V0" stroke="${m(g, 'wood')}" stroke-width="8"/>${[-54, -8, 38].map((dx) => `<rect x="${dx - 20}" y="-80" width="40" height="14" rx="2" fill="${m(g, 'clay')}"/>${[0, 1, 2, 3].map((k) => `<path d="M${dx - 14 + k * 9} -80q-2 -8 2 -12" stroke="${m(g, 'leafL')}" stroke-width="2.5" fill="none"/>`).join('')}`).join('')}`, [[-54, -100, 'les semis, à gauche'], [38, -100, 'les semis, à droite']]);

export const wheelbarrow: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-60 -50h90l-16 30h-60z" fill="${m(g, 'ironL')}"/><path d="M-30 -52q20 -14 50 0" fill="${g.c('#1a1830', '#5a3a26')}"/><circle cx="-40" cy="-12" r="12" fill="none" stroke="${m(g, 'wood')}" stroke-width="5"/><path d="M30 -40l40 -10M-2 -20v20" stroke="${m(g, 'wood')}" stroke-width="5"/>`, [[-16, -70, 'la brouette']]);

export const wateringCan: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-18" y="-34" width="36" height="34" rx="6" fill="${m(g, 'ironL')}"/><path d="M18 -26l24 -18M-18 -30q-14 -2 -10 18" stroke="${m(g, 'ironL')}" stroke-width="5" fill="none"/><path d="M-12 -40q12 -14 24 0" stroke="${m(g, 'ironL')}" stroke-width="4" fill="none"/><path d="M40 -46l6 -2" stroke="${m(g, 'ironL')}" stroke-width="8"/>`, [[0, -56, 'l’arrosoir']]);

export const greenhouseStove: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-26" y="-60" width="52" height="60" rx="8" fill="${m(g, 'iron')}"/><circle cy="-34" r="12" fill="${g.c('#101326', '#E8744A')}" opacity=".85"/><path d="M0 -60v-100q0 -20 30 -30" stroke="${m(g, 'iron')}" stroke-width="10" fill="none"/>${[0, 1, 2].map((i) => `<path d="M${-20 + i * 16} -170q-8 -14 4 -24q10 -10 0 -20" stroke="#EFE8D8" stroke-width="5" fill="none" opacity="${(0.05 + g.t * 0.12).toFixed(2)}"/>`).join('')}`, [[-30, -80, 'le poêle de la serre']]);

// ---------------------------------------------------------------- pond

export const reeds: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [...Array(7)].map((_, i) => `<path d="M${-24 + i * 8} 0q${(i % 3) * 6 - 6} -60 ${(i % 2) * 10 - 5} -${90 + (i % 3) * 20}" stroke="${m(g, i % 2 ? 'leaf' : 'leafL')}" stroke-width="3" fill="none"/>${i % 3 === 1 ? `<rect x="${(i % 2) * 10 - 9 + (i * 8 - 24)}" y="-${104 + (i % 3) * 20}" width="7" height="22" rx="3.5" fill="${m(g, 'woodD')}" transform="rotate(${(i % 3) * 4} ${i * 8 - 24} -100)"/>` : ''}`).join(''), [[0, -130, 'les roseaux']]);

export const rock: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 0q-6 -30 20 -38q30 -10 50 6q16 14 10 32z" fill="${m(g, 'stoneL')}"/><path d="M-20 -30q20 -8 36 2" stroke="${m(g, 'stone')}" stroke-width="3" fill="none"/>`, [[0, -50, 'le galet']]);

export const lilypad: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0a40 12 0 1 1 1 0l-2 -12z" fill="${m(g, 'leaf')}" transform="translate(0 0)"/><ellipse cx="0" cy="0" rx="40" ry="12" fill="${m(g, 'leaf')}"/><path d="M0 0l-20 -9" stroke="${g.c('#101634', '#1f4a56')}" stroke-width="4"/>${o?.v === 1 ? `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-14" rx="5" ry="12" transform="rotate(${a} 0 -8) scale(1 .6)" fill="${g.c('#262B52', '#F0B8C8')}"/>`).join('')}<circle cy="-8" r="4" fill="${g.c('#262B52', '#FFD98E')}"/>` : ''}`, [[10, -22, o?.v === 1 ? 'la fleur de nénuphar' : 'le nénuphar']]);

export const pier: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 0L-140 60H180L100 0z" fill="${m(g, 'woodL')}"/>${[...Array(8)].map((_, i) => `<path d="M${-40 + i * 20} 0L${-140 + i * 45} 60" stroke="${m(g, 'wood')}" stroke-width="2"/>`).join('')}<path d="M-40 0v-30M100 0v-30M-140 60v-30M180 60v-30" stroke="${m(g, 'woodD')}" stroke-width="8"/>`, [[-40, -44, 'le poteau du ponton'], [100, -44, 'le bout du ponton']]);

export const rowboat: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-80 -30h160q-14 30 -40 30h-84q-26 0 -36 -30z" fill="${m(g, 'wood')}"/><path d="M-80 -30h160" stroke="${m(g, 'woodL')}" stroke-width="5"/><path d="M-30 -30v-6h14v6M20 -30v-6h14v6" fill="${m(g, 'woodD')}"/><path d="M-40 -34l90 -40" stroke="${m(g, 'woodL')}" stroke-width="4"/><path d="M40 -70l20 -8 6 10z" fill="${m(g, 'woodL')}"/>`, [[-56, -50, 'la barque'], [50, -94, 'la rame']]);

export const fish: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-20 0q20 -16 40 0q-20 16 -40 0z" fill="${acc(g, o?.c ?? 1)}"/><path d="M-20 0l-12 -10v20z" fill="${acc(g, o?.c ?? 1)}"/><circle cx="10" cy="-2" r="2" fill="#0a0c1e"/>`, [[0, -18, 'le poisson']]);

export const seaweed: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2].map((i) => `<path d="M${-10 + i * 10} 0q-14 -30 0 -60t0 -${60 + i * 20}" stroke="${m(g, i % 2 ? 'leafL' : 'leaf')}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join(''), [[0, -150, 'les algues']]);

export const shell: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-18 0q-4 -28 18 -30q22 2 18 30z" fill="${g.c('#262B52', '#F0C8B0')}"/>${[-12, -6, 0, 6, 12].map((dx) => `<path d="M0 -28L${dx} 0" stroke="${g.c('#1f2448', '#c0907a')}" stroke-width="1.5"/>`).join('')}`, [[0, -44, 'le coquillage']]);

export const frog: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<ellipse cy="-10" rx="16" ry="11" fill="${m(g, 'leafL')}"/><circle cx="-8" cy="-20" r="5" fill="${m(g, 'leafL')}"/><circle cx="8" cy="-20" r="5" fill="${m(g, 'leafL')}"/><path d="M-10 -21h4M6 -21h4" stroke="#0a0c1e" stroke-width="2" stroke-linecap="round"/>`, [[0, -34, 'la grenouille']]);

// ---------------------------------------------------------------- market

export const stall: Prop = (g, x, y, s = 1, o) => {
  const c1 = acc(g, o?.c ?? 1, '#221a3a'), c2 = g.c('#262B52', '#EFE8D8');
  let stripes = '';
  for (let i = 0; i < 6; i++) stripes += `<path d="M${-70 + i * 23.3} -160l-6 30h23.3l6 -30z" fill="${i % 2 ? c1 : c2}"/>`;
  let goods = '';
  for (let i = 0; i < 5; i++) goods += `<ellipse cx="${-48 + i * 24}" cy="-78" rx="11" ry="7" fill="${acc(g, (o?.c ?? 1) + i + 2)}"/>`;
  return mk(x, y, s, o, `<path d="M-64 -130V0M64 -130V0" stroke="${m(g, 'wood')}" stroke-width="6"/>${stripes}<path d="M-76 -130q12 10 23 0t23 0t23 0t23 0t23 0t23 0" fill="${c1}"/><rect x="-72" y="-72" width="144" height="12" fill="${m(g, 'woodL')}"/><rect x="-66" y="-60" width="132" height="60" fill="${m(g, 'wood')}"/>${goods}`,
    [[-40, -176, 'l’auvent'], [36, -96, 'l’étal']]);
};

export const scaleStand: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-110M-24 0h48" stroke="${m(g, 'brass')}" stroke-width="6" stroke-linecap="round"/><path d="M-70 -110h140" stroke="${m(g, 'brass')}" stroke-width="5" stroke-linecap="round"/><path d="M-70 -110l-18 40h36zM70 -110l-18 40h36z" fill="none" stroke="${m(g, 'brassD')}" stroke-width="1.5"/><path d="M-94 -70q24 12 48 0M46 -70q24 12 48 0" fill="${m(g, 'brass')}"/><circle cy="-116" r="7" fill="${m(g, 'gold')}"/>`, [[-70, -128, 'la balance, à gauche'], [70, -128, 'la balance, à droite']]);

export const spiceSacks: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [[-44, 0, 3], [0, 0, 1], [44, 0, 6], [-22, -34, 4], [22, -34, 0]].map(([dx, dy, c]) => `<g transform="translate(${dx} ${dy})"><path d="M-22 0q-6 -26 4 -38h36q10 12 4 38z" fill="${g.c('#1f2040', '#8a6a4a')}"/><ellipse cy="-38" rx="18" ry="6" fill="${acc(g, c)}"/></g>`).join(''), [[-22, -84, 'les sacs d’épices'], [44, -54, 'le sac de droite']]);

/** String of paper lanterns across the scene, from (x, y) to (x + w, y). */
export const lampions: Prop = (g, x, y, s = 1, o) => {
  const w = o?.w ?? 300, n = 6;
  let b = `<path d="M0 0Q${w / 2} 50 ${w} 0" stroke="${m(g, 'paperD')}" stroke-width="1.5" fill="none"/>`;
  for (let i = 1; i < n; i++) { const tx = (w * i) / n, ty = 50 * 2 * (i / n) * (1 - i / n) + 6; b += `<g transform="translate(${r1(tx)} ${r1(ty)})"><ellipse cy="10" rx="9" ry="12" fill="${acc(g, i + (o?.c ?? 0), '#221a3a')}" opacity=".95"/><path d="M-5 -2h10M-5 22h10" stroke="${m(g, 'woodD')}" stroke-width="2"/></g>`; }
  return { s: `<g transform="translate(${x} ${y})">${b}</g>`, a: o?.v === 1 ? [[r1(x + w / 2), r1(y + 42), o?.l?.[0] ?? 'la guirlande de lampions']] : [] };
};

export const bollard: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-14 0v-30q0 -10 14 -10t14 10v30z" fill="${m(g, 'ironL')}"/><path d="M-20 -30h40" stroke="${m(g, 'iron')}" stroke-width="5"/><path d="M-14 -12q14 8 28 0" stroke="${m(g, 'paperD')}" stroke-width="4" fill="none"/>`, [[0, -54, 'la bitte d’amarrage']]);

export const ropeCoil: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2, 3].map((i) => `<ellipse cy="${-4 - i * 5}" rx="${30 - i * 4}" ry="8" fill="none" stroke="${m(g, 'paperD')}" stroke-width="5"/>`).join(''), [[0, -40, 'le cordage']]);

export const mast: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0V-300" stroke="${m(g, 'woodL')}" stroke-width="10"/><path d="M-60 -250H60" stroke="${m(g, 'wood')}" stroke-width="6"/><path d="M0 -300L-80 0M0 -300L80 0" stroke="${m(g, 'paperD')}" stroke-width="1.5"/><path d="M-56 -246q56 30 112 0v110q-56 20 -112 0z" fill="${g.c('#1f2448', '#c9b89a')}" opacity=".8"/>`, [[0, -316, 'le haut du mât'], [-44, -120, 'la voile']]);

export const figurehead: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-140 0q60 -10 110 -60q20 -30 60 -40q-10 40 -40 70q-40 30 -130 30z" fill="${m(g, 'wood')}"/><path d="M30 -100q16 -10 30 -4q-6 14 -24 16z" fill="${m(g, 'gold')}"/><circle cx="40" cy="-112" r="10" fill="${m(g, 'gold')}"/><path d="M-120 -4q60 -10 100 -52" stroke="${m(g, 'woodL')}" stroke-width="4" fill="none"/>`, [[44, -136, 'la figure de proue'], [-80, -30, 'le bastingage']]);

export const rudder: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 -40V60" stroke="${m(g, 'woodL')}" stroke-width="8"/><path d="M0 0h40q10 30 -10 60h-30z" fill="${m(g, 'wood')}"/><path d="M0 -40h-70" stroke="${m(g, 'wood')}" stroke-width="7" stroke-linecap="round"/>`, [[-70, -58, 'la barre']]);

export const counter: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-${(o?.w ?? 200) / 2}" y="-80" width="${o?.w ?? 200}" height="80" fill="${m(g, o?.v === 1 ? 'velvet' : 'wood')}"/><rect x="-${(o?.w ?? 200) / 2 + 8}" y="-90" width="${(o?.w ?? 200) + 16}" height="12" rx="3" fill="${m(g, o?.v === 1 ? 'gold' : 'woodL')}"/>${[...Array(Math.floor((o?.w ?? 200) / 50))].map((_, i) => `<rect x="${-(o?.w ?? 200) / 2 + 12 + i * 50}" y="-66" width="36" height="52" rx="3" fill="none" stroke="${m(g, o?.v === 1 ? 'gold' : 'woodL')}" stroke-width="2"/>`).join('')}`,
  [[-(o?.w ?? 200) / 4, -104, 'le comptoir'], [(o?.w ?? 200) / 4, -104, 'le bout du comptoir']]);

export const abacus: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-36" y="-50" width="72" height="50" rx="3" fill="none" stroke="${m(g, 'wood')}" stroke-width="5"/>${[0, 1, 2, 3].map((r) => `<path d="M-34 ${-40 + r * 11}h68" stroke="${m(g, 'brassD')}" stroke-width="1.5"/>${[0, 1, 2].map((k) => `<circle cx="${-26 + k * 9 + (r % 2) * 20}" cy="${-40 + r * 11}" r="4" fill="${g.c('#262B52', '#F0E0D0')}"/>`).join('')}`).join('')}`, [[0, -64, 'le boulier']]);

export const coins: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2, 3, 4].map((i) => `<ellipse cx="${-10 + (i % 2) * 6}" cy="${-4 - i * 5}" rx="14" ry="4" fill="${m(g, 'gold')}"/>`).join('') + `<ellipse cx="22" cy="-4" rx="14" ry="4" fill="${m(g, 'brass')}"/>`, [[0, -40, 'la pile de pièces']]);

export const ledger: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 0l40 -8 40 8v-6l-40 -8 -40 8z" fill="${m(g, 'paper')}"/><path d="M-40 -6l40 -8v8" fill="none" stroke="${m(g, 'paperD')}" stroke-width="1"/><rect x="-44" y="0" width="88" height="6" rx="2" fill="${m(g, 'velvet')}"/><path d="M-30 -8l20 -4M10 -12l20 4" stroke="${m(g, 'ink')}" stroke-width="1"/>`, [[0, -28, 'le registre']]);

export const weights: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [[-40, 34], [-8, 26], [18, 20], [38, 14]].map(([dx, h]) => `<path d="M${dx - h / 2} 0l${h / 6} ${-h}h${(h * 2) / 3}l${h / 6} ${h}z" fill="${m(g, dx < 0 ? 'ironL' : 'brass')}"/><path d="M${dx - 4} ${-h}q4 -8 8 0" stroke="${m(g, 'iron')}" stroke-width="3" fill="none"/>`).join(''), [[-40, -52, 'les poids']]);

export const bigScale: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-200M-50 0h100" stroke="${m(g, 'ironL')}" stroke-width="12" stroke-linecap="round"/><path d="M-140 -200h280" stroke="${m(g, 'brass')}" stroke-width="10" stroke-linecap="round"/><circle cy="-206" r="14" fill="${m(g, 'gold')}"/>
  <path d="M-140 -200l-30 90M-140 -200l30 90M140 -200l-30 90M140 -200l30 90" stroke="${m(g, 'brassD')}" stroke-width="2"/><path d="M-180 -110q40 20 80 0zM100 -110q40 20 80 0z" fill="${m(g, 'brass')}"/><path d="M-160 -116h20v-20h20v20" fill="${m(g, 'ironL')}"/>`, [[0, -232, 'le fléau'], [-140, -150, 'le plateau de gauche'], [140, -136, 'le plateau de droite']]);

export const lamppost: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-200M-14 0h28" stroke="${m(g, 'iron')}" stroke-width="6"/><path d="M0 -200q0 -20 30 -20" stroke="${m(g, 'iron')}" stroke-width="5" fill="none"/><path d="M20 -220h20l-4 30h-12z" fill="${m(g, 'ironL')}"/>`, [[30, -190, 'le réverbère']]);

export const booth: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-140" width="80" height="140" fill="${m(g, 'wood')}"/><path d="M-50 -140l50 -30 50 30z" fill="${m(g, 'velvet')}"/><rect x="-26" y="-110" width="52" height="40" fill="#0a0c1e"/><rect x="-30" y="-70" width="60" height="6" fill="${m(g, 'woodL')}"/><text y="-148" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${g.c('#262B52', '#FFD98E')}">BILLETS</text>`, [[0, -186, 'la guérite'], [20, -84, 'le guichet']]);

export const fishCrate: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-30" width="80" height="30" fill="${m(g, 'woodL')}"/><path d="M-40 -15h80" stroke="${m(g, 'wood')}" stroke-width="2"/>${[-24, 0, 24].map((dx, i) => `<path d="M${dx - 12} -32q12 -10 24 0q-12 10 -24 0z" fill="${acc(g, i + 3)}"/>`).join('')}`, [[0, -52, 'la caisse de poissons']]);

export const buoy: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<ellipse cy="-6" rx="18" ry="8" fill="${g.c('#221a3a', '#E88A8A')}"/><path d="M-10 -12l10 -30 10 30z" fill="${g.c('#262B52', '#EFE8D8')}"/><circle cy="-44" r="4" fill="${m(g, 'brass')}"/>`, [[0, -58, 'la bouée']]);

export const flameAt = flame;
