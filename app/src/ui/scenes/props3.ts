// Scene props, part 3: theatre, observatory, attic.
import { m, acc, flame, r1 } from './kit';
import { Prop, mk } from './props1';

// ---------------------------------------------------------------- theatre

export const coatRack: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-170M-24 0h48" stroke="${m(g, 'wood')}" stroke-width="6" stroke-linecap="round"/><path d="M0 -160l-22 -8M0 -160l22 -8M0 -140l-18 10M0 -140l18 10" stroke="${m(g, 'wood')}" stroke-width="4" stroke-linecap="round"/><path d="M-22 -166q-10 30 -6 80h20q4 -40 -8 -80z" fill="${acc(g, o?.c ?? 4)}" opacity=".85"/><circle cx="22" cy="-172" r="12" fill="${acc(g, (o?.c ?? 4) + 3)}"/><path d="M8 -170h28" stroke="${acc(g, (o?.c ?? 4) + 3)}" stroke-width="5"/>`, [[0, -196, 'le portemanteau']]);

export const grandStair: Prop = (g, x, y, s = 1, o) => {
  let st = '';
  for (let i = 0; i < 8; i++) st += `<rect x="${-120 + i * 8}" y="${-i * 22 - 22}" width="${240 - i * 16}" height="22" fill="${i % 2 ? m(g, 'stoneL') : m(g, 'stone')}"/>`;
  return mk(x, y, s, o, `${st}<rect x="-40" y="-176" width="80" height="176" fill="${g.c('#1a1636', '#7a2a36')}" opacity=".85"/><path d="M-130 0L-70 -180M130 0L70 -180" stroke="${m(g, 'gold')}" stroke-width="6"/>${[-130, 130].map((dx) => `<circle cx="${dx}" cy="-8" r="10" fill="${m(g, 'gold')}"/>`).join('')}`,
    [[-120, -40, 'la rampe, en bas'], [0, -196, 'le haut de l’escalier'], [118, -40, 'l’autre rampe']]);
};

export const barCounter: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-130" y="-90" width="260" height="90" fill="${m(g, 'woodD')}"/><rect x="-140" y="-100" width="280" height="14" rx="4" fill="${m(g, 'gold')}"/>${[-100, -40, 20, 80].map((dx) => `<rect x="${dx}" y="-80" width="40" height="70" rx="4" fill="none" stroke="${m(g, 'wood')}" stroke-width="3"/>`).join('')}
  ${[-90, -60, 40, 70].map((dx, i) => `<path d="M${dx - 6} -100l-4 -20h20l-4 20z" fill="${g.c('#262B52', '#BFE6F0')}" opacity=".7"/><path d="M${dx} -100v-2" stroke="${acc(g, i)}" stroke-width="3"/>`).join('')}`, [[-80, -130, 'le comptoir du bar'], [80, -130, 'le bout du bar']]);

export const bottleShelf: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1].map((r) => `<rect x="-90" y="${r * 50}" width="180" height="6" fill="${m(g, 'gold')}"/>${[...Array(8)].map((_, i) => `<path d="M${-80 + i * 22} ${r * 50}v-30q0 -6 4 -8v-8h6v8q4 2 4 8v30z" fill="${acc(g, i + r * 3, '#1a1f44')}" opacity=".85"/>`).join('')}`).join(''), [[-60, -54, 'l’étagère à bouteilles'], [60, -4, 'les verres']]);

export const boxSeat: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-70 0q0 -30 70 -36q70 6 70 36z" fill="${m(g, 'gold')}"/><path d="M-66 -4q0 -24 66 -28q66 4 66 28" fill="${m(g, 'velvet')}"/><path d="M-80 -150q20 60 0 150M80 -150q-20 60 0 150" stroke="${m(g, 'velvet')}" stroke-width="24" fill="none"/><path d="M-80 -150H80" stroke="${m(g, 'gold')}" stroke-width="6"/><rect x="-60" y="-140" width="120" height="104" fill="#0a0c1e" opacity=".6"/>`, [[0, -50, 'le balcon de la loge'], [0, -166, 'le haut de la loge']]);

export const sandbags: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 ${-y / s}V-60" stroke="${m(g, 'paperD')}" stroke-width="2"/><path d="M-16 -60q-6 30 0 60h32q6 -30 0 -60z" fill="${g.c('#1f2040', '#8a765c')}"/><path d="M-10 -60h20" stroke="${m(g, 'paperD')}" stroke-width="4"/>`, [[0, -78, 'le contrepoids']]);

export const pulley: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<circle r="22" fill="none" stroke="${m(g, 'woodL')}" stroke-width="7"/><circle r="5" fill="${m(g, 'iron')}"/><path d="M-22 0V200M22 0V160" stroke="${m(g, 'paperD')}" stroke-width="2"/><path d="M0 -22v-30" stroke="${m(g, 'iron')}" stroke-width="5"/>`, [[0, -58, 'la poulie']]);

export const flat: Prop = (g, x, y, s = 1, o) => {
  const v = o?.v ?? 0;
  const paint = v === 1
    ? `<path d="M-60 -20q30 -60 60 -40q30 -50 60 0z" fill="${g.c('#16233a', '#5e9f78')}"/><circle cx="-20" cy="-140" r="20" fill="${g.c('#262B52', '#EFE8D8')}"/>`
    : `<path d="M-60 -20l40 -80 30 50 20 -30 30 60z" fill="${g.c('#191d3a', '#6a7aa0')}"/><path d="M-60 -20h120" stroke="${g.c('#1f2448', '#3f5f96')}" stroke-width="8"/>`;
  return mk(x, y, s, o, `<rect x="-70" y="-190" width="140" height="190" fill="${g.c('#1a1f44', '#b8c8d8')}"/>${paint}<path d="M70 -190l30 190" stroke="${m(g, 'wood')}" stroke-width="6"/>`, [[0, -206, 'le décor peint']]);
};

export const cardMoon: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 ${-y / s}V-50" stroke="${m(g, 'paperD')}" stroke-width="1.5"/><path d="M20 -50a50 50 0 1 0 0 100a38 38 0 1 1 0 -100z" fill="${g.c('#262B52', '#FFE6B0')}"/><circle cx="-14" cy="0" r="3" fill="${g.c('#1f2448', '#c9a563')}"/><path d="M-20 14q6 4 12 0" stroke="${g.c('#1f2448', '#c9a563')}" stroke-width="2" fill="none"/>`, [[-10, 64, 'la lune en carton']]);

export const propShelf: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `${[0, 1, 2].map((r) => `<rect x="-80" y="${-r * 60}" width="160" height="6" fill="${m(g, 'wood')}"/>`).join('')}<path d="M-80 6V-160M80 6V-160" stroke="${m(g, 'wood')}" stroke-width="6"/>
  <path d="M-60 -2l8 -24 8 12 8 -16 8 16 8 -12 8 24z" fill="${m(g, 'gold')}"/><path d="M20 -2q10 -30 30 -30q-4 20 -10 30z" fill="${acc(g, 3)}"/><rect x="-50" y="-100" width="20" height="38" rx="4" fill="${acc(g, 5)}"/><path d="M0 -62a16 16 0 0 1 32 0z" fill="${g.c('#262B52', '#EFE8D8')}"/><path d="M-60 -122l40 0" stroke="${m(g, 'brass')}" stroke-width="5"/><circle cx="40" cy="-138" r="12" fill="${acc(g, 1)}"/>`, [[-44, -46, 'la couronne'], [40, -106, 'le masque'], [-30, -170, 'le haut de l’étagère']]);

export const winch: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-40" y="-60" width="80" height="60" fill="${m(g, 'wood')}"/><circle cy="-60" r="30" fill="none" stroke="${m(g, 'ironL')}" stroke-width="8"/><circle cy="-60" r="10" fill="${m(g, 'paperD')}"/><path d="M0 -60l40 -30" stroke="${m(g, 'iron')}" stroke-width="6" stroke-linecap="round"/><circle cx="40" cy="-90" r="6" fill="${m(g, 'wood')}"/><path d="M-30 -60V-300" stroke="${m(g, 'paperD')}" stroke-width="2"/>`, [[0, -108, 'le treuil'], [44, -108, 'la manivelle']]);

export const prompterBox: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-60 0q0 -70 60 -70q60 0 60 70z" fill="${m(g, 'woodD')}"/><path d="M-50 0q0 -56 50 -56q50 0 50 56z" fill="#0a0c1e"/><path d="M-60 0q0 -70 60 -70q60 0 60 70" stroke="${m(g, 'gold')}" stroke-width="4" fill="none"/><path d="M-20 -8l20 -10 20 10z" fill="${m(g, 'paper')}"/>${flame(g, 30, -20, 0.6)}`, [[0, -86, 'le trou du souffleur']]);

export const vanity: Prop = (g, x, y, s = 1, o) => {
  let bulbs = '';
  for (let i = 0; i < 7; i++) bulbs += `<circle cx="${-60 + i * 20}" cy="-196" r="5" fill="${g.c('#262B52', '#FFE6B0')}"/>`;
  for (let i = 0; i < 4; i++) bulbs += `<circle cx="-66" cy="${-176 + i * 24}" r="5" fill="${g.c('#262B52', '#FFE6B0')}"/><circle cx="66" cy="${-176 + i * 24}" r="5" fill="${g.c('#262B52', '#FFE6B0')}"/>`;
  return mk(x, y, s, o, `<rect x="-70" y="-202" width="140" height="120" rx="8" fill="${m(g, 'woodL')}"/><rect x="-56" y="-188" width="112" height="96" rx="6" fill="${g.c('#141a3a', '#8aa0b8')}" opacity=".85"/><path d="M-30 -120l50 -50M-10 -110l40 -40" stroke="#EFE8D8" stroke-width="3" opacity=".25"/>${bulbs}
  <rect x="-90" y="-78" width="180" height="12" rx="3" fill="${m(g, 'woodL')}"/><path d="M-80 -66V0M80 -66V0" stroke="${m(g, 'wood')}" stroke-width="8"/>${[-50, -20, 30].map((dx, i) => `<rect x="${dx}" y="${-92 + i * 2}" width="${10 + i * 4}" height="${14 - i * 2}" rx="3" fill="${acc(g, i + 1)}"/>`).join('')}`, [[0, -222, 'le haut du miroir'], [-60, -96, 'la coiffeuse, à gauche'], [60, -96, 'la coiffeuse, à droite']]);
};

export const mask: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-20 -10q0 -30 20 -30t20 30q-2 20 -20 26q-18 -6 -20 -26z" fill="${g.c('#262B52', '#EFE8D8')}"/><path d="M-12 -18q4 -4 8 0M4 -18q4 -4 8 0" stroke="#0a0c1e" stroke-width="3" fill="none"/><path d="M-6 2q6 4 12 0" stroke="#0a0c1e" stroke-width="2" fill="none"/>`, [[0, -56, 'le masque']]);

export const footlights: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [...Array(8)].map((_, i) => `<path d="M${-140 + i * 40} 0l-8 -14h16z" fill="${m(g, 'brass')}"/><circle cx="${-140 + i * 40}" cy="-16" r="4" fill="${g.c('#262B52', '#FFE6B0')}"/>`).join(''), [[-100, -34, 'la rampe'], [100, -34, 'l’autre bout de la rampe']]);

export const musicStand: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-80M-16 0h32" stroke="${m(g, 'iron')}" stroke-width="3"/><path d="M-26 -80h52l-4 -34h-44z" fill="${m(g, 'paper')}"/>${[0, 1, 2, 3].map((i) => `<path d="M-20 ${-106 + i * 6}h40" stroke="${m(g, 'paperD')}" stroke-width="1"/>`).join('')}`, [[0, -126, 'le pupitre à musique']]);

export const spotlight: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-120M-20 0h40" stroke="${m(g, 'iron')}" stroke-width="5"/><rect x="-24" y="-150" width="50" height="34" rx="8" fill="${m(g, 'ironL')}" transform="rotate(${o?.f ? 20 : -20} 0 -133)"/><path d="M26 -150L180 -20" stroke="${g.c('#1a1f44', '#FFE6B0')}" stroke-width="40" opacity="${(0.02 + g.t * 0.08).toFixed(3)}"/>`, [[0, -176, 'le projecteur']]);

export const shadowScreen: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-110" y="-200" width="220" height="150" fill="${g.c('#1a1f44', '#EFE0C0')}"/><rect x="-110" y="-200" width="220" height="150" fill="none" stroke="${m(g, 'wood')}" stroke-width="8"/><path d="M-110 -50l-10 50M110 -50l10 50" stroke="${m(g, 'wood')}" stroke-width="6"/>
  <path d="M-60 -60q10 -50 30 -60l10 -20 8 16q30 10 20 64z" fill="${g.c('#0a0c1e', '#2a2440')}"/><path d="M30 -60l10 -60q20 -10 30 10l-6 50z" fill="${g.c('#0a0c1e', '#2a2440')}"/>`, [[-80, -220, 'l’écran d’ombres'], [80, -30, 'le pied de l’écran']]);

// ---------------------------------------------------------------- observatory

export const bigTelescope: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-50 0l50 -90 50 90" stroke="${m(g, 'iron')}" stroke-width="10" fill="none"/><circle cy="-96" r="14" fill="${m(g, 'brass')}"/>
  <g transform="rotate(-32 0 -96)"><rect x="-150" y="-118" width="260" height="44" rx="14" fill="${m(g, 'brass')}"/><rect x="100" y="-124" width="40" height="56" rx="8" fill="${m(g, 'brassD')}"/><rect x="-170" y="-108" width="30" height="24" rx="5" fill="${m(g, 'brassD')}"/></g>`, [[-150, -40, 'l’oculaire'], [96, -210, 'le bout du télescope'], [40, -40, 'le trépied']]);

export const armillary: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-50M-20 0h40" stroke="${m(g, 'wood')}" stroke-width="6" stroke-linecap="round"/><circle cy="-100" r="46" fill="none" stroke="${m(g, 'brass')}" stroke-width="4"/><ellipse cy="-100" rx="46" ry="14" fill="none" stroke="${m(g, 'gold')}" stroke-width="3" transform="rotate(-20 0 -100)"/><ellipse cy="-100" rx="14" ry="46" fill="none" stroke="${m(g, 'brassD')}" stroke-width="3"/><circle cy="-100" r="10" fill="${g.c('#262B52', '#FFD98E')}"/>`, [[0, -160, 'la sphère armillaire']]);

export const celestialGlobe: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-24 0l24 -30 24 30" stroke="${m(g, 'wood')}" stroke-width="6" fill="none"/><circle cy="-70" r="36" fill="${g.c('#12184a', '#24306a')}"/>${[...Array(9)].map((_, i) => `<circle cx="${r1(Math.cos(i * 2.1) * 24)}" cy="${r1(-70 + Math.sin(i * 1.7) * 24)}" r="1.8" fill="${g.c('#2a3563', '#FFD98E')}"/>`).join('')}<path d="M-20 -86l14 8 16 -12 12 10" stroke="${g.c('#2a3563', '#FFD98E')}" stroke-width="1" fill="none"/><path d="M0 -112a42 42 0 0 1 0 84" stroke="${m(g, 'brass')}" stroke-width="4" fill="none"/>`, [[0, -124, 'le globe céleste']]);

export const prism: Prop = (g, x, y, s = 1, o) => {
  const cols = ['#E88A8A', '#F4B45E', '#FFD98E', '#9CCB8A', '#8FB8F0', '#B79CE0'];
  return mk(x, y, s, o, `<path d="M-200 -70L-20 -52" stroke="#EFE8D8" stroke-width="3" opacity="${(0.1 + g.t * 0.5).toFixed(2)}"/>${cols.map((c, i) => `<path d="M20 -48L200 ${-80 + i * 14}" stroke="${g.c('#1a1f44', c)}" stroke-width="5" opacity="${(0.15 + g.t * 0.6).toFixed(2)}"/>`).join('')}
  <path d="M-40 -20L0 -90L40 -20z" fill="${g.c('#1a2046', '#BFE6F0')}" opacity=".75"/><path d="M-40 -20L0 -90L40 -20z" fill="none" stroke="${g.c('#2a3563', '#EFE8D8')}" stroke-width="2"/><rect x="-50" y="-20" width="100" height="20" rx="4" fill="${m(g, 'wood')}"/>`, [[0, -106, 'le prisme'], [180, -96, 'l’arc-en-ciel']]);
};

export const mirrorStand: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M0 0v-70M-18 0h36" stroke="${m(g, 'brass')}" stroke-width="4"/><ellipse cy="-100" rx="26" ry="34" fill="${g.c('#141a3a', '#9ab0c8')}" transform="rotate(${o?.v ?? -20} 0 -100)"/><ellipse cy="-100" rx="26" ry="34" fill="none" stroke="${m(g, 'brass')}" stroke-width="4" transform="rotate(${o?.v ?? -20} 0 -100)"/><path d="M-10 -110l14 -14" stroke="#EFE8D8" stroke-width="3" opacity=".3"/>`, [[0, -146, 'le miroir']]);

export const opticalBench: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-160" y="-70" width="320" height="10" rx="3" fill="${m(g, 'brass')}"/><path d="M-140 -60V0M140 -60V0" stroke="${m(g, 'iron')}" stroke-width="8"/>${[-110, -30, 50, 120].map((dx, i) => `<path d="M${dx} -70v-30" stroke="${m(g, 'brassD')}" stroke-width="4"/><ellipse cx="${dx}" cy="-112" rx="${6 + i * 2}" ry="${16 + i * 3}" fill="${g.c('#141a3a', '#BFE6F0')}" opacity=".7"/>`).join('')}<path d="M-150 -112H150" stroke="#EFE8D8" stroke-width="2" stroke-dasharray="4 6" opacity="${(0.1 + g.t * 0.6).toFixed(2)}"/>`, [[-110, -150, 'la première lentille'], [120, -156, 'la dernière lentille']]);

export const polishBench: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-80" y="-70" width="160" height="12" rx="3" fill="${m(g, 'woodL')}"/><path d="M-70 -58V0M70 -58V0" stroke="${m(g, 'wood')}" stroke-width="8"/><ellipse cx="-20" cy="-74" rx="30" ry="6" fill="${m(g, 'stoneL')}"/><ellipse cx="-20" cy="-80" rx="16" ry="4" fill="${g.c('#1a2046', '#BFE6F0')}"/><path d="M40 -70v-20l14 -4" stroke="${m(g, 'brass')}" stroke-width="4" fill="none"/>`, [[-40, -94, 'le polissoir'], [50, -104, 'la pince']]);

export const crank: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<circle r="40" fill="none" stroke="${m(g, 'brass')}" stroke-width="8" stroke-dasharray="10 6"/><circle r="12" fill="${m(g, 'brassD')}"/><path d="M0 0l30 -30" stroke="${m(g, 'iron')}" stroke-width="6"/><circle cx="30" cy="-30" r="7" fill="${m(g, 'wood')}"/><path d="M0 40V${120}" stroke="${m(g, 'iron')}" stroke-width="8"/>`, [[0, -58, 'la manivelle de la coupole']]);

export const domeSlit: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-40 0V-260q40 -30 80 0V0" fill="#05060f"/><circle cx="0" cy="-160" r="${2 + g.t * 1}" fill="#EFE8D8"/>${[...Array(14)].map((_, i) => `<circle cx="${r1(-30 + ((i * 37) % 60))}" cy="${r1(-20 - ((i * 53) % 230))}" r="1.2" fill="#EFE8D8" opacity=".7"/>`).join('')}<path d="M-40 0V-260q40 -30 80 0V0" fill="none" stroke="${m(g, 'brass')}" stroke-width="6"/>`, [[0, -290, 'l’ouverture'], [-60, -40, 'le rail de la coupole']]);

export const pinhole: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-50" y="-80" width="100" height="80" fill="${m(g, 'woodD')}"/><circle cx="50" cy="-40" r="4" fill="#EFE8D8" opacity="${(0.3 + g.t * 0.7).toFixed(2)}"/><path d="M50 -40L240 -120" stroke="#EFE8D8" stroke-width="2" opacity="${(0.05 + g.t * 0.3).toFixed(2)}"/><path d="M-50 -40L-150 -80L-150 0z" fill="#EFE8D8" opacity="${(0.02 + g.t * 0.08).toFixed(3)}"/>`, [[0, -96, 'le sténopé']]);

export const plateRack: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-60" y="-110" width="120" height="110" fill="${m(g, 'wood')}"/>${[...Array(8)].map((_, i) => `<rect x="${-52 + i * 13}" y="-104" width="9" height="70" rx="1" fill="${g.c('#141a3a', '#6a7a8a')}"/>`).join('')}`, [[0, -126, 'le casier à plaques']]);

export const trays: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-120" y="-70" width="240" height="12" fill="${m(g, 'woodL')}"/><path d="M-110 -58V0M110 -58V0" stroke="${m(g, 'wood')}" stroke-width="8"/>${[-80, 0, 80].map((dx) => `<rect x="${dx - 32}" y="-82" width="64" height="12" rx="2" fill="${g.c('#12122a', '#5a2a2a')}"/><rect x="${dx - 26}" y="-80" width="52" height="6" fill="${g.c('#141430', '#8a4a4a')}" opacity=".7"/>`).join('')}`, [[-80, -100, 'le premier bain'], [80, -100, 'le dernier bain']]);

export const safelight: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<circle r="${30 + g.t * 30}" fill="#E8744A" opacity="${(g.t * 0.2).toFixed(2)}"/><rect x="-16" y="-12" width="32" height="24" rx="6" fill="${g.c('#2a1418', '#E8744A')}"/><path d="M0 -12v-20" stroke="${m(g, 'iron')}" stroke-width="3"/>`, [[0, 26, 'la lampe rouge']]);

export const heavyCurtain: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-90 0V-320H90V0z" fill="${g.c('#16122e', '#3a2440')}"/>${[-60, -20, 20, 60].map((dx) => `<path d="M${dx} -320Q${dx + 10} -160 ${dx} 0" stroke="${g.c('#100c22', '#2a1830')}" stroke-width="8" fill="none"/>`).join('')}<path d="M40 -320q30 160 50 320H40q-10 -160 0 -320z" fill="#0a0c1e"/><path d="M60 -300l10 290" stroke="#EFE8D8" stroke-width="3" opacity="${(0.1 + g.t * 0.4).toFixed(2)}"/>`, [[-40, -40, 'le bas du rideau'], [66, -120, 'la fente du rideau']]);

export const almanacs: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2, 3].map((r) => `<rect x="-70" y="${-r * 50 - 6}" width="140" height="6" fill="${m(g, 'wood')}"/>${[...Array(9)].map((_, i) => `<rect x="${-66 + i * 15}" y="${-r * 50 - 44}" width="12" height="38" rx="1" fill="${g.c('#1a1f44', ['#3f5f96', '#24306a', '#6a4a7a'][(i + r) % 3])}"/><circle cx="${-60 + i * 15}" cy="${-r * 50 - 30}" r="2" fill="${g.c('#262B52', '#FFD98E')}"/>`).join('')}`).join('') + `<path d="M-70 0V-206M70 0V-206" stroke="${m(g, 'wood')}" stroke-width="6"/>`, [[-40, -220, 'le haut des almanachs'], [40, -60, 'les almanachs']]);

export const starChart: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-70" y="-50" width="140" height="100" fill="${g.c('#12184a', '#24306a')}"/><rect x="-70" y="-50" width="140" height="100" fill="none" stroke="${m(g, 'brass')}" stroke-width="4"/>${[...Array(16)].map((_, i) => `<circle cx="${r1(-60 + ((i * 47) % 120))}" cy="${r1(-40 + ((i * 29) % 80))}" r="${1 + (i % 3) * 0.6}" fill="${g.c('#2a3563', '#FFD98E')}"/>`).join('')}<path d="M-50 -20l30 10 20 -20 40 30" stroke="${g.c('#2a3563', '#8FB8F0')}" stroke-width="1" fill="none"/>`, [[0, -66, 'la carte du ciel']]);

// ---------------------------------------------------------------- attic

export const rockingChair: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-50 0q50 14 100 0" stroke="${m(g, 'wood')}" stroke-width="6" fill="none"/><path d="M-30 4v-50h60v50M-30 -46l-10 -70M30 -46l-4 -20" stroke="${m(g, 'wood')}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-36 -110l-6 -40 10 -2 6 40z" fill="${m(g, 'woodL')}"/><path d="M-26 -50h54" stroke="${acc(g, 1)}" stroke-width="10"/>`, [[-40, -164, 'le fauteuil à bascule']]);

export const letters: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2].map((i) => `<rect x="${-26 + i * 6}" y="${-8 - i * 6}" width="44" height="30" rx="2" fill="${m(g, 'paper')}" transform="rotate(${-8 + i * 7} 0 0)"/><path d="M${-26 + i * 6} ${-8 - i * 6}l22 14 22 -14" stroke="${m(g, 'paperD')}" stroke-width="1.5" fill="none" transform="rotate(${-8 + i * 7} 0 0)"/>`).join('') + `<circle cx="10" cy="-6" r="5" fill="${g.c('#221a3a', '#B5553F')}"/>`, [[0, -36, 'les lettres']]);

export const oldLamp: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<path d="M-16 0h32l-6 -10h-20z" fill="${m(g, 'brass')}"/><path d="M-12 -10q-4 -30 12 -40q16 10 12 40z" fill="${g.c('#1a2046', '#BFE6F0')}" opacity=".6"/>${flame(g, 0, -26, 0.9)}<path d="M-8 -52h16" stroke="${m(g, 'brass')}" stroke-width="3"/>`, [[0, -70, 'la vieille lampe']]);

export const portrait: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, `<rect x="-36" y="-46" width="72" height="92" rx="4" fill="${m(g, 'gold')}"/><rect x="-28" y="-38" width="56" height="76" fill="${g.c('#1a1636', '#3a2c40')}"/><circle cy="-8" r="14" fill="${g.c('#262B52', '#c9a080')}"/><path d="M-20 38q20 -40 40 0z" fill="${acc(g, o?.c ?? 5)}"/>`, [[0, -62, 'le portrait']]);

/** Darkroom line with drying prints, from x to x + w. */
export const clothesline: Prop = (g, x, y, s = 1, o) => {
  const w = o?.w ?? 300;
  let b = `<path d="M0 0Q${w / 2} 24 ${w} 0" stroke="${m(g, 'paperD')}" stroke-width="1.5" fill="none"/>`;
  for (let i = 1; i < 5; i++) { const tx = (w * i) / 5, ty = 24 * 4 * (i / 5) * (1 - i / 5); b += `<g transform="translate(${r1(tx)} ${r1(ty)})"><rect x="-3" y="-4" width="6" height="8" fill="${m(g, 'wood')}"/><rect x="-16" y="4" width="32" height="40" fill="${g.c('#141430', '#c8b8a8')}"/><rect x="-12" y="8" width="24" height="24" fill="${g.c('#101024', i % 2 ? '#4a3a44' : '#3a4a54')}"/></g>`; }
  return { s: `<g transform="translate(${x} ${y})">${b}</g>`, a: [[r1(x + w * 0.2), r1(y + 60), o?.l?.[0] ?? 'le fil à sécher, à gauche'], [r1(x + w * 0.8), r1(y + 60), o?.l?.[1] ?? 'le fil à sécher, à droite']] };
};

export const developer: Prop = (g, x, y, s = 1, o) => mk(x, y, s, o, [0, 1, 2].map((i) => `<path d="M${-30 + i * 22} 0v-24l4 -8v-8h8v8l4 8v24z" fill="${g.c('#141430', ['#6a2a2a', '#3a4a6a', '#4a5a3a'][i])}" opacity=".9"/>`).join(''), [[0, -56, 'les flacons']]);
