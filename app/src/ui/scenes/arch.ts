// Room architectures: the walls, floor, ceiling and windows every room is built
// in. One per kind of place, each with variants, so that a room of the Phare
// never looks like a room of the Théâtre.
import { G, W, H, FLOOR, Anchor, at, m, moon, r1, starsIn } from './kit';

export type Arch =
  | 'tower' | 'lamp' | 'library' | 'study' | 'workshop' | 'attic' | 'belfry' | 'clockhall'
  | 'glass' | 'garden' | 'pond' | 'under' | 'deck' | 'hold' | 'hall' | 'foyer'
  | 'backstage' | 'dressing' | 'stage' | 'dome' | 'lab' | 'dark' | 'balcony';

export type Win = 'porthole' | 'arch' | 'round' | 'tall' | 'twin' | 'stained' | 'skylight' | 'none';

export interface ArchOpts {
  win?: Win;
  /** Window centre x (and y for some kinds). */
  wx?: number;
  wy?: number;
  floor?: number;
  /** Tint of the walls, lit (wallpaper, velvet, glass). */
  tint?: string;
}

const SKY = '#0a0c1e';

export function windowXml(g: G, kind: Win, x: number, y: number, frame: string): string {
  const sid = g.id('sky');
  const sky = (body: string, clip: string) =>
    `<defs><clipPath id="${sid}">${clip}</clipPath></defs><g clip-path="url(#${sid})"><rect x="${x - 80}" y="${y - 90}" width="160" height="180" fill="${SKY}"/>${starsIn(g, x - 70, y - 80, 140, 150, 14)}${moon(x + 18, y - 26, 10, SKY)}${body}</g>`;
  switch (kind) {
    case 'porthole':
      return sky('', `<circle cx="${x}" cy="${y}" r="30"/>`) + `<circle cx="${x}" cy="${y}" r="30" fill="none" stroke="${frame}" stroke-width="7"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${r1(x + 34 * Math.cos(a * Math.PI / 180))}" cy="${r1(y + 34 * Math.sin(a * Math.PI / 180))}" r="2" fill="${frame}"/>`).join('')}`;
    case 'round':
      return sky('', `<circle cx="${x}" cy="${y}" r="40"/>`) + `<circle cx="${x}" cy="${y}" r="40" fill="none" stroke="${frame}" stroke-width="5"/><path d="M${x} ${y - 40}v80M${x - 40} ${y}h80" stroke="${frame}" stroke-width="3"/>`;
    case 'tall':
      return sky('', `<rect x="${x - 26}" y="${y - 70}" width="52" height="140" rx="26"/>`) + `<rect x="${x - 26}" y="${y - 70}" width="52" height="140" rx="26" fill="none" stroke="${frame}" stroke-width="5"/><path d="M${x} ${y - 70}v140M${x - 26} ${y - 10}h52M${x - 26} ${y + 30}h52" stroke="${frame}" stroke-width="3"/><rect x="${x - 32}" y="${y + 68}" width="64" height="7" rx="3" fill="${frame}"/>`;
    case 'twin':
      return [x - 34, x + 34].map((cx) => sky('', `<rect x="${cx - 22}" y="${y - 50}" width="44" height="100" rx="22"/>`).replace(new RegExp(sid, 'g'), sid + cx) + `<rect x="${cx - 22}" y="${y - 50}" width="44" height="100" rx="22" fill="none" stroke="${frame}" stroke-width="5"/><path d="M${cx} ${y - 50}v100M${cx - 22} ${y}h44" stroke="${frame}" stroke-width="3"/>`).join('');
    case 'stained': {
      const cols = ['#8FB8F0', '#E88A8A', '#FFD98E', '#7FC8A9', '#B79CE0', '#8FB8F0'];
      let s = `<defs><clipPath id="${sid}"><path d="M${x - 34} ${y + 60}V${y - 30}a34 34 0 0 1 68 0V${y + 60}z"/></clipPath></defs><g clip-path="url(#${sid})"><rect x="${x - 40}" y="${y - 70}" width="80" height="140" fill="${SKY}"/>`;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) s += `<rect x="${x - 34 + j * 17}" y="${y - 64 + i * 22}" width="17" height="22" fill="${g.c('#1a1f44', cols[(i + j) % cols.length])}" opacity="${(0.55 + ((i * 3 + j) % 3) * 0.15).toFixed(2)}"/>`;
      s += `<circle cx="${x}" cy="${y - 22}" r="16" fill="${g.c('#262B52', '#FFD98E')}" opacity=".8"/></g>`;
      return s + `<path d="M${x - 34} ${y + 60}V${y - 30}a34 34 0 0 1 68 0V${y + 60}z" fill="none" stroke="${frame}" stroke-width="5"/><path d="M${x - 34} ${y - 20}h68M${x - 34} ${y + 20}h68M${x} ${y - 64}v124" stroke="${frame}" stroke-width="2.4"/>`;
    }
    case 'skylight':
      return sky('', `<path d="M${x - 50} ${y + 30}L${x - 30} ${y - 30}H${x + 30}L${x + 50} ${y + 30}z"/>`) + `<path d="M${x - 50} ${y + 30}L${x - 30} ${y - 30}H${x + 30}L${x + 50} ${y + 30}z" fill="none" stroke="${frame}" stroke-width="5"/><path d="M${x} ${y - 30}v60M${x - 40} ${y}h80" stroke="${frame}" stroke-width="3"/>`;
    case 'arch':
    default:
      return sky('', `<rect x="${x - 46}" y="${y - 55}" width="92" height="110" rx="46"/>`) + `<path d="M${x} ${y - 55}v110M${x - 46} ${y + 1}h92" stroke="${frame}" stroke-width="4"/><rect x="${x - 50}" y="${y + 53}" width="100" height="8" rx="3" fill="${frame}"/>`;
  }
}

/** Perspective floor boards / tiles. */
function planks(g: G, fy: number, dark: string, lit: string, n = 7, step = 65, lean = -40): string {
  let s = '';
  for (let i = 0; i <= n; i++) s += `<path d="M${i * step} ${fy}L${i * step + lean} ${H}" stroke="${g.c(dark, lit)}" stroke-width="1.5"/>`;
  return s;
}
function tiles(g: G, fy: number, dark: string, lit: string): string {
  let s = '';
  for (let i = -3; i <= 9; i++) s += `<path d="M${195 + i * 34} ${fy}L${195 + i * 70} ${H}" stroke="${g.c(dark, lit)}" stroke-width="1.2"/>`;
  for (const y of [fy + 22, fy + 52, fy + 90]) s += `<path d="M0 ${y}H${W}" stroke="${g.c(dark, lit)}" stroke-width="1.2"/>`;
  return s;
}
function stones(g: G, x0: number, y0: number, w: number, h: number, seed = 0): string {
  let s = '';
  const col = g.c('#1f2346', '#4c4556');
  for (let row = 0, y = y0; y < y0 + h; row++, y += 26) {
    const off = (row + seed) % 2 ? 0 : 24;
    for (let x = x0 - off; x < x0 + w; x += 48) s += `<rect x="${x + 2}" y="${y + 2}" width="44" height="22" rx="5" fill="none" stroke="${col}" stroke-width="1.3" opacity=".7"/>`;
  }
  return s;
}
function beams(g: G, y: number): string {
  return `<rect x="0" y="${y}" width="${W}" height="16" fill="${m(g, 'woodD')}"/><path d="M0 ${y + 16}H${W}" stroke="${m(g, 'wood')}" stroke-width="2"/>`;
}
function wainscot(g: G, fy: number, h = 70): string {
  let s = `<rect x="0" y="${fy - h}" width="${W}" height="${h}" fill="${m(g, 'woodD')}"/><path d="M0 ${fy - h}H${W}" stroke="${m(g, 'woodL')}" stroke-width="3"/>`;
  for (let x = 14; x < W; x += 64) s += `<rect x="${x}" y="${fy - h + 12}" width="50" height="${h - 24}" rx="4" fill="none" stroke="${m(g, 'wood')}" stroke-width="2"/>`;
  return s;
}
function curtainsSide(g: G, col: string, fy: number): string {
  const c = g.c('#1f1838', col), d = g.c('#150f28', col === '#7a2a36' ? '#4e1a24' : col);
  return `<path d="M0 0H70Q50 ${fy * 0.45} 64 ${fy + 40}H0z" fill="${c}"/><path d="M18 0Q10 ${fy * 0.5} 22 ${fy + 40}M40 0Q30 ${fy * 0.5} 44 ${fy + 40}" stroke="${d}" stroke-width="5" fill="none"/>
  <path d="M${W} 0H${W - 70}Q${W - 50} ${fy * 0.45} ${W - 64} ${fy + 40}H${W}z" fill="${c}"/><path d="M${W - 18} 0Q${W - 10} ${fy * 0.5} ${W - 22} ${fy + 40}M${W - 40} 0Q${W - 30} ${fy * 0.5} ${W - 44} ${fy + 40}" stroke="${d}" stroke-width="5" fill="none"/>
  <path d="M0 0H${W}V26Q${W * 0.75} 46 ${W / 2} 30Q${W * 0.25} 46 0 26z" fill="${c}"/><path d="M0 26Q${W * 0.25} 46 ${W / 2} 30Q${W * 0.75} 46 ${W} 26" stroke="${g.c('#2E3360', '#D8B56A')}" stroke-width="3" fill="none"/>`;
}

export function archXml(g: G, kind: Arch, o: ArchOpts = {}): string {
  const fy = o.floor ?? FLOOR;
  const wx = o.wx ?? 195, wy = o.wy ?? 150;
  const win = (def: Win, frame: string) => (o.win ?? def) === 'none' ? '' : windowXml(g, o.win ?? def, wx, wy, frame);
  const tint = o.tint;
  switch (kind) {
    case 'tower': { // Round stone room of the Phare: curved walls, shaded sides.
      const wall = g.c('#141833', '#4a3f4c'), sid = g.id('curve');
      return `<defs><linearGradient id="${sid}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="${wall}"/>${stones(g, 0, 0, W, fy)}${win('porthole', m(g, 'brass'))}
      <path d="M0 ${fy}Q${W / 2} ${fy - 14} ${W} ${fy}V${H}H0z" fill="${g.c('#0f1128', '#3a2c20')}"/>${planks(g, fy, '#141833', '#2b2217', 8, 56, -30)}
      <path d="M0 ${fy}Q${W / 2} ${fy - 14} ${W} ${fy}" stroke="${m(g, 'woodL')}" stroke-width="3" fill="none"/><rect width="${W}" height="${H}" fill="url(#${sid})"/>`;
    }
    case 'lamp': { // Lantern room at the top of the Phare: glass all around, the sea at night.
      const sid = g.id('sea');
      let s = `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, 260, 60)}${moon(310, 70, 14, SKY)}
      <defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.c('#101634', '#1f3656')}"/><stop offset="1" stop-color="#070918"/></linearGradient></defs>
      <rect y="300" width="${W}" height="140" fill="url(#${sid})"/>`;
      for (let i = 0; i < 9; i++) s += `<path d="M${20 + g.r() * 340} ${310 + i * 14}h${20 + g.r() * 40}" stroke="${g.c('#2a3563', '#8FB8F0')}" stroke-width="1.5" opacity=".5"/>`;
      s += `<path d="M300 310l60 -6v12z" fill="#EFE8D8" opacity=".25"/>`;
      for (const x of [0, 98, 195, 292, 390]) s += `<rect x="${x - 5}" y="0" width="10" height="${fy}" fill="${m(g, 'iron')}"/>`;
      s += `<rect y="${fy - 60}" width="${W}" height="8" fill="${m(g, 'brass')}"/><path d="M0 ${fy - 30}H${W}" stroke="${m(g, 'brassD')}" stroke-width="4"/>`;
      for (let x = 10; x < W; x += 24) s += `<path d="M${x} ${fy - 52}V${fy}" stroke="${m(g, 'brassD')}" stroke-width="2.5"/>`;
      return s + `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#12152c', '#3e3848')}"/>${planks(g, fy, '#191d3a', '#5a5366', 8, 60, 0)}`;
    }
    case 'library': { // Wood panelling, the back wall covered in books.
      let s = `<rect width="${W}" height="${H}" fill="${g.c('#141833', tint ?? '#3a2a30')}"/>`;
      for (const [x0, x1] of [[0, 130], [260, 390]]) {
        s += `<rect x="${x0}" y="30" width="${x1 - x0}" height="${fy - 30}" fill="${m(g, 'woodD')}"/>`;
        for (let y = 60; y < fy - 20; y += 58) {
          s += `<rect x="${x0}" y="${y + 44}" width="${x1 - x0}" height="6" fill="${m(g, 'wood')}"/>`;
          let x = x0 + 6;
          while (x < x1 - 10) { const w = 7 + Math.floor(g.r() * 8), h = 30 + Math.floor(g.r() * 14); s += `<rect x="${x}" y="${y + 44 - h}" width="${w}" height="${h}" rx="1.5" fill="${g.c('#1f2448', ['#8e4a3a', '#3f5f96', '#5e8a5c', '#a0783c', '#6a4a7a'][Math.floor(g.r() * 5)])}"/>`; x += w + 1.5; }
        }
      }
      return s + win('arch', m(g, 'woodL')) + `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217')}<rect y="18" width="${W}" height="12" fill="${m(g, 'wood')}"/>`;
    }
    case 'study': // Panelled room with wallpaper (reading room, archive foot, scriptorium).
      return `<rect width="${W}" height="${H}" fill="${g.c('#151934', tint ?? '#3d3040')}"/>${[...Array(13)].map((_, i) => `<path d="M${i * 32 + 16} 0V${fy - 90}" stroke="${g.c('#1b1f3c', '#4a3a4a')}" stroke-width="10" opacity=".55"/>`).join('')}
      ${win('tall', m(g, 'woodL'))}${wainscot(g, fy, 90)}<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217')}
      <rect x="40" y="${fy + 18}" width="310" height="${H - fy - 30}" rx="6" fill="${g.c('#16193a', tint ? '#5a2a36' : '#5a2a36')}" opacity=".55"/>`;
    case 'workshop': // The prototype's Établi: plain wall, planks.
      return `<rect width="${W}" height="${H}" fill="${g.c('#141833', '#3a2d34')}"/>${win('arch', m(g, 'brassD'))}<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2c20')}"/><path d="M0 ${fy}H${W}" stroke="${g.c('#1f2448', '#6b5638')}" stroke-width="2"/>${planks(g, fy, '#141833', '#2b2217')}`;
    case 'attic': { // Sloped roof beams, skylight.
      const roof = m(g, 'woodD');
      return `<rect width="${W}" height="${H}" fill="${g.c('#12152c', '#3a2d2a')}"/>${win('skylight', m(g, 'woodL'))}
      <path d="M0 0L0 210L130 0z" fill="${roof}"/><path d="M${W} 0V210L${W - 130} 0z" fill="${roof}"/>
      <path d="M0 210L130 0M${W} 210L${W - 130} 0" stroke="${m(g, 'wood')}" stroke-width="10"/><path d="M40 146L40 ${fy}M${W - 40} 146V${fy}" stroke="${m(g, 'wood')}" stroke-width="12"/>
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217', 8, 56, -20)}`;
    }
    case 'belfry': // Wooden tower inside: posts, cross beams, arched openings.
      return `<rect width="${W}" height="${H}" fill="${g.c('#131731', '#35293a')}"/>${stones(g, 0, 0, W, fy, 1)}${win('twin', m(g, 'woodL'))}
      <path d="M30 0V${fy}M${W - 30} 0V${fy}" stroke="${m(g, 'wood')}" stroke-width="16"/><path d="M30 60L${W - 30} 60M30 60L110 140M${W - 30} 60L${W - 110} 140" stroke="${m(g, 'wood')}" stroke-width="10"/>
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217')}`;
    case 'clockhall': // Tall hall full of clocks: striped wallpaper and moulding.
      return `<rect width="${W}" height="${H}" fill="${g.c('#151934', tint ?? '#3a2c3c')}"/>${[...Array(20)].map((_, i) => `<path d="M${i * 20} 40V${fy - 60}" stroke="${g.c('#1a1e3a', '#46344a')}" stroke-width="6" opacity=".6"/>`).join('')}
      <rect y="28" width="${W}" height="12" fill="${m(g, 'brassD')}"/>${wainscot(g, fy, 60)}${o.win ? win('round', m(g, 'brass')) : ''}<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#2e2230')}"/>${tiles(g, fy, '#141833', '#3e2c38')}`;
    case 'glass': { // Greenhouse: iron frames, glass panes on the night.
      let s = `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, fy, 50)}${moon(wx, 90, 13, SKY)}<rect width="${W}" height="${fy}" fill="${g.c('#132a3a', tint ?? '#2f6a5a')}" opacity="${(0.25 + g.t * 0.2).toFixed(2)}"/>`;
      for (let x = 0; x <= W; x += 65) s += `<path d="M${x} 0V${fy}" stroke="${m(g, 'ironL')}" stroke-width="4"/>`;
      for (let y = 40; y < fy; y += 90) s += `<path d="M0 ${y}H${W}" stroke="${m(g, 'ironL')}" stroke-width="3"/>`;
      s += `<path d="M0 60Q${W / 2} -40 ${W} 60" stroke="${m(g, 'ironL')}" stroke-width="5" fill="none"/>`;
      return s + `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#12142a', '#5a3a2c')}"/>${tiles(g, fy, '#191c38', '#7a4c38')}`;
    }
    case 'garden': // Open-air garden in the glasshouse: arches of iron above, gravel.
      return `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, 300, 40)}${moon(300, 80, 13, SKY)}
      <path d="M-20 ${fy}V120Q${W / 2} -60 ${W + 20} 120V${fy}" stroke="${m(g, 'ironL')}" stroke-width="5" fill="none"/><path d="M40 ${fy}V150Q${W / 2} 10 ${W - 40} 150V${fy}" stroke="${m(g, 'iron')}" stroke-width="3" fill="none"/>
      <rect y="${fy - 40}" width="${W}" height="40" fill="${m(g, 'leafD')}"/>${[...Array(12)].map((_, i) => `<circle cx="${i * 36 + 10}" cy="${fy - 40}" r="${16 + (i % 3) * 6}" fill="${m(g, i % 2 ? 'leaf' : 'leafD')}"/>`).join('')}
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#14172e', '#5a4a3c')}"/>${[...Array(40)].map(() => `<circle cx="${r1(g.r() * W)}" cy="${r1(fy + 8 + g.r() * (H - fy - 10))}" r="1.4" fill="${g.c('#1f2448', '#8a765c')}"/>`).join('')}`;
    case 'pond': { // Water up to the horizon, reeds, a glass roof far away.
      const sid = g.id('pw');
      let s = `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, 240, 40)}${moon(80, 70, 12, SKY)}
      <path d="M0 150Q${W / 2} 40 ${W} 150" stroke="${m(g, 'iron')}" stroke-width="3" fill="none" opacity=".7"/>
      <defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.c('#101634', '#1f4a56')}"/><stop offset="1" stop-color="${g.c('#0a0e24', '#12303c')}"/></linearGradient></defs>
      <rect y="${fy - 120}" width="${W}" height="${H}" fill="url(#${sid})"/>`;
      for (let i = 0; i < 12; i++) s += `<path d="M${r1(g.r() * 360)} ${r1(fy - 100 + g.r() * 230)}h${r1(16 + g.r() * 30)}" stroke="${g.c('#22305a', '#7FC8A9')}" stroke-width="1.4" opacity=".45"/>`;
      return s;
    }
    case 'under': { // Bottom of the pond: water all around, light from above.
      const sid = g.id('uw');
      let s = `<defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.c('#12204a', '#2f6a7a')}"/><stop offset="1" stop-color="${g.c('#070a1c', '#0f2a34')}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${sid})"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${60 + i * 70} 0L${30 + i * 80} ${fy}" stroke="#EFE8D8" stroke-width="${10 + i * 3}" opacity="${(0.02 + g.t * 0.04).toFixed(3)}"/>`;
      s += `<path d="M0 ${fy}Q${W / 3} ${fy - 20} ${W / 2} ${fy}T${W} ${fy - 6}V${H}H0z" fill="${g.c('#10142c', '#4a4030')}"/>`;
      for (let i = 0; i < 18; i++) s += `<circle cx="${r1(g.r() * W)}" cy="${r1(g.r() * fy)}" r="${r1(1 + g.r() * 3)}" fill="none" stroke="${g.c('#2a3563', '#BFE6F0')}" stroke-width="1" opacity=".6"/>`;
      return s;
    }
    case 'deck': { // Floating market: night sky, dark water, the wooden deck of a boat or bridge.
      const sid = g.id('dw');
      let s = `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, 250, 50)}${moon(o.wx ?? 320, 70, 13, SKY)}
      <defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.c('#0f1634', '#1f3a5a')}"/><stop offset="1" stop-color="#060816"/></linearGradient></defs>
      <path d="M0 250h60v-26h24v26h40v-40h30v40h70v-20h26v20h60v-34h22v34h58V300H0z" fill="${g.c('#0d1026', '#241e30')}"/>
      <rect y="298" width="${W}" height="${fy - 298}" fill="url(#${sid})"/>`;
      for (let i = 0; i < 10; i++) s += `<path d="M${r1(g.r() * 360)} ${r1(306 + g.r() * (fy - 316))}h${r1(14 + g.r() * 30)}" stroke="${g.c('#22305a', '#E8C07A')}" stroke-width="1.3" opacity=".45"/>`;
      s += `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${m(g, 'wood')}"/>${planks(g, fy, '#141833', '#4a3522', 8, 60, 0)}<path d="M0 ${fy}H${W}" stroke="${m(g, 'woodL')}" stroke-width="5"/>`;
      return s;
    }
    case 'hold': // Inside a boat: curved hull, ribs, a porthole.
      return `<rect width="${W}" height="${H}" fill="${g.c('#12152c', '#3a2a22')}"/>${[...Array(14)].map((_, i) => `<path d="M0 ${40 + i * 28}Q${W / 2} ${30 + i * 28} ${W} ${40 + i * 28}" stroke="${m(g, 'woodD')}" stroke-width="3" fill="none"/>`).join('')}
      ${[40, 150, 240, 350].map((x) => `<path d="M${x} 0Q${x + (x < 195 ? -20 : 20)} ${fy / 2} ${x} ${fy}" stroke="${m(g, 'wood')}" stroke-width="12" fill="none"/>`).join('')}${win('porthole', m(g, 'brass'))}
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217')}`;
    case 'hall': // Market hall: iron columns, big arched roof, stone floor.
      return `<rect width="${W}" height="${H}" fill="${g.c('#131731', '#34303e')}"/><path d="M0 170Q${W / 2} -40 ${W} 170" stroke="${m(g, 'ironL')}" stroke-width="10" fill="none"/><path d="M0 200Q${W / 2} 0 ${W} 200" stroke="${m(g, 'iron')}" stroke-width="4" fill="none"/>
      ${win('round', m(g, 'ironL'))}${[20, 370].map((x) => `<rect x="${x - 9}" y="120" width="18" height="${fy - 120}" fill="${m(g, 'ironL')}"/><rect x="${x - 15}" y="${fy - 16}" width="30" height="16" fill="${m(g, 'iron')}"/>`).join('')}
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#12152c', '#4a4452')}"/>${tiles(g, fy, '#191d3a', '#5e5868')}`;
    case 'foyer': { // Theatre foyer: red wallpaper, gilded frames, marble floor.
      const red = tint ?? '#6a2430';
      let s = `<rect width="${W}" height="${H}" fill="${g.c('#191534', red)}"/>`;
      for (let x = 12; x < W; x += 26) s += `<path d="M${x} 40V${fy - 70}" stroke="${g.c('#1d1838', '#7a2c38')}" stroke-width="3" stroke-dasharray="2 8" opacity=".8"/>`;
      s += `<rect y="26" width="${W}" height="14" fill="${m(g, 'gold')}"/>${wainscot(g, fy, 70)}${o.win ? win(o.win, m(g, 'gold')) : ''}`;
      s += `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#14172e', '#4a4452')}"/>`;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) s += `<path d="M${i * 65 + j * 20} ${fy + j * 40}l32 0l20 40l-32 0z" fill="${g.c('#101326', '#2e2a38')}"/>`;
      return s;
    }
    case 'backstage': // Behind the stage: black walls, ropes, a brick wall at the back.
      return `<rect width="${W}" height="${H}" fill="${g.c('#0f1128', '#2a2230')}"/>${stones(g, 0, 60, W, fy - 60)}
      ${[60, 110, 290, 330].map((x) => `<path d="M${x} 0V${fy - 60}" stroke="${m(g, 'paperD')}" stroke-width="2"/>`).join('')}<rect y="0" width="${W}" height="30" fill="${m(g, 'woodD')}"/>
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0d0f22', '#2e2418')}"/>${planks(g, fy, '#141833', '#241c14', 12, 36, 0)}`;
    case 'dressing': // Dressing room: wallpaper, mirror light, rug.
      return `<rect width="${W}" height="${H}" fill="${g.c('#16183a', tint ?? '#4a3040')}"/>${[...Array(10)].map((_, i) => `<circle cx="${i * 44 + 20}" cy="${60 + (i % 2) * 40}" r="10" fill="none" stroke="${g.c('#1d1f40', '#5a3a4c')}" stroke-width="2"/>`).join('')}
      ${[...Array(10)].map((_, i) => `<circle cx="${i * 44 + 42}" cy="${150 + (i % 2) * 40}" r="10" fill="none" stroke="${g.c('#1d1f40', '#5a3a4c')}" stroke-width="2"/>`).join('')}${o.win ? win(o.win, m(g, 'woodL')) : ''}
      ${wainscot(g, fy, 60)}<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#3a2618')}"/>${planks(g, fy, '#141833', '#2b2217')}<ellipse cx="195" cy="${fy + 70}" rx="150" ry="36" fill="${g.c('#1a1636', '#6a2a3a')}" opacity=".7"/>`;
    case 'stage': // The great stage: velvet curtains, footlights, boards.
      return `<rect width="${W}" height="${H}" fill="${g.c('#0c0e22', tint ?? '#1f2440')}"/>${curtainsSide(g, '#7a2a36', fy)}
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#12142a', '#5a3a24')}"/>${planks(g, fy, '#191d3a', '#3a2618', 12, 34, 0)}<rect y="${fy}" width="${W}" height="10" fill="${m(g, 'woodL')}"/>
      ${[...Array(9)].map((_, i) => `<path d="M${30 + i * 42} ${fy + 4}h14" stroke="${g.c('#262B52', '#FFD98E')}" stroke-width="5" stroke-linecap="round"/>`).join('')}`;
    case 'dome': { // Observatory dome: star map painted on the ceiling, brass ring.
      let s = `<rect width="${W}" height="${H}" fill="${g.c('#0f1230', tint ?? '#1f2a52')}"/><path d="M-40 ${fy - 80}Q${W / 2} -140 ${W + 40} ${fy - 80}" fill="${g.c('#0b0e26', '#18204a')}"/>`;
      s += starsIn(g, 20, 20, W - 40, 200, 40);
      s += `<path d="M60 110l40 -30l50 10l40 -40M230 60l40 30l60 -10" stroke="${g.c('#1f2448', '#8FB8F0')}" stroke-width="1" opacity=".6" fill="none"/>`;
      s += `<path d="M-40 ${fy - 80}Q${W / 2} -140 ${W + 40} ${fy - 80}" stroke="${m(g, 'brass')}" stroke-width="6" fill="none"/><rect y="${fy - 80}" width="${W}" height="80" fill="${g.c('#12152c', '#2c2a44')}"/><path d="M0 ${fy - 80}H${W}" stroke="${m(g, 'brass')}" stroke-width="5"/>`;
      return s + `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#2a2438')}"/>${tiles(g, fy, '#141833', '#3a3450')}`;
    }
    case 'lab': // Lens workshop: blue-grey walls, shelves, a long window.
      return `<rect width="${W}" height="${H}" fill="${g.c('#131733', tint ?? '#27304a')}"/>${win('tall', m(g, 'brass'))}<rect y="${fy - 50}" width="${W}" height="50" fill="${g.c('#12152c', '#222a40')}"/><path d="M0 ${fy - 50}H${W}" stroke="${m(g, 'brassD')}" stroke-width="3"/>
      <rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0f1128', '#2a2a38')}"/>${tiles(g, fy, '#141833', '#3a3a4c')}`;
    case 'dark': // Darkroom: everything red once the safe light is on.
      return `<rect width="${W}" height="${H}" fill="${g.c('#0f0f24', '#3a1a22')}"/><rect x="0" y="0" width="${W}" height="${H}" fill="#E8744A" opacity="${(g.t * 0.08).toFixed(3)}"/>${win('none', '')}
      <rect y="${fy - 40}" width="${W}" height="40" fill="${g.c('#12122a', '#2a1418')}"/><rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#0c0c20', '#241216')}"/>${tiles(g, fy, '#141430', '#3a1c22')}`;
    case 'balcony': { // Outside, on a stone balcony above the city.
      let s = `<rect width="${W}" height="${H}" fill="${SKY}"/>${starsIn(g, 0, 0, W, 300, 70)}${moon(o.wx ?? 90, 80, 16, SKY)}`;
      s += `<path d="M0 300h40v-40h20v40h30v-70h24l10 -20 10 20v70h40v-30h30v30h50v-50h26v50h40v-26h30v26h40V340H0z" fill="${g.c('#0f1230', '#241e34')}"/>`;
      for (let i = 0; i < 18; i++) s += `<rect x="${r1(g.r() * 380)}" y="${r1(240 + g.r() * 90)}" width="3" height="4" fill="${g.c('#1f2448', '#F4B45E')}" opacity="${(0.4 + g.r() * 0.5).toFixed(2)}"/>`;
      s += `<rect y="${fy - 60}" width="${W}" height="14" rx="4" fill="${m(g, 'stoneL')}"/>`;
      for (let x = 14; x < W; x += 30) s += `<path d="M${x} ${fy - 46}q-8 23 0 46M${x + 10} ${fy - 46}q8 23 0 46" stroke="${m(g, 'stone')}" stroke-width="6" fill="none"/>`;
      return s + `<rect y="${fy}" width="${W}" height="${H - fy}" fill="${g.c('#12152c', '#4a4452')}"/>${tiles(g, fy, '#191d3a', '#5e5868')}`;
    }
  }
}

/** Places to hang a lantern that come with the architecture itself. */
export function archAnchors(kind: Arch, o: ArchOpts = {}): Anchor[] {
  const fy = o.floor ?? FLOOR, wx = o.wx ?? 195, wy = o.wy ?? 150;
  const out: Anchor[] = [];
  const winKind = o.win ?? ({ tower: 'porthole', library: 'arch', study: 'tall', workshop: 'arch', attic: 'skylight', belfry: 'twin', hold: 'porthole', hall: 'round', lab: 'tall' } as Partial<Record<Arch, Win>>)[kind];
  if (winKind && winKind !== 'none' && !['foyer', 'dressing', 'clockhall'].includes(kind) || (o.win && o.win !== 'none')) {
    const sill = ({ porthole: 42, round: 52, tall: 86, twin: 62, stained: 76, skylight: 44, arch: 70 } as Record<string, number>)[winKind ?? 'arch'] ?? 60;
    out.push([wx, wy + sill, 'le rebord de la fenêtre']);
  }
  switch (kind) {
    case 'library': out.push([40, 56, 'le haut des étagères, à gauche'], [350, 56, 'le haut des étagères, à droite']); break;
    case 'lamp': out.push([46, fy - 76, 'la rambarde, à gauche'], [344, fy - 76, 'la rambarde, à droite']); break;
    case 'attic': out.push([40, 130, 'la poutre de gauche'], [350, 130, 'la poutre de droite']); break;
    case 'belfry': out.push([30, 76, 'le poteau de gauche'], [360, 76, 'le poteau de droite']); break;
    case 'glass': out.push([65, 62, 'l’armature de verre'], [325, 62, 'l’armature, à droite']); break;
    case 'garden': out.push([60, fy - 64, 'la haie'], [330, fy - 70, 'le bout de la haie']); break;
    case 'deck': out.push([60, 226, 'les toits de l’autre rive'], [300, 214, 'la cheminée au loin']); break;
    case 'hold': out.push([40, 60, 'la membrure'], [350, 60, 'l’autre membrure']); break;
    case 'hall': out.push([36, 140, 'la colonne de gauche'], [354, 140, 'la colonne de droite']); break;
    case 'foyer': out.push([60, 62, 'la corniche dorée'], [330, 62, 'la corniche, à droite']); break;
    case 'backstage': out.push([40, 58, 'la passerelle des cintres'], [350, 58, 'la passerelle, à droite']); break;
    case 'stage': out.push([40, 60, 'le rideau de gauche'], [350, 60, 'le rideau de droite']); break;
    case 'dome': out.push([40, fy - 100, 'l’anneau de la coupole'], [350, fy - 100, 'l’anneau, à droite']); break;
    case 'balcony': out.push([40, fy - 76, 'la balustrade'], [350, fy - 76, 'le bout de la balustrade']); break;
    case 'clockhall': case 'study': case 'dressing': out.push([40, fy - 110, 'la boiserie'], [350, fy - 110, 'la boiserie, à droite']); break;
    default: break;
  }
  return out;
}

export { at };
