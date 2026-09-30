// Room scenes: composition. Each room of Vesper has its own hand-placed
// scene (rooms-*.ts): architecture, props, where its lanterns sit, where its
// object hides and where the building's seal digit appears once lit.
import { SVG_SERIF_ITALIC } from '../theme';
import { G, W, H, Anchor, makeG, r1 } from './kit';
import { archXml, archAnchors, Arch, ArchOpts } from './arch';
import { Prop, PO } from './props1';
import { objectInScene } from './objects';
import { PHARE_BIBLIO } from './rooms-a';
import { HORLO_SERRE } from './rooms-b';
import { MARCHE_THEATRE } from './rooms-c';
import { OBS_GRENIER } from './rooms-d';

export { W as SCENE_W, H as SCENE_H };

/** Touch area of a lantern, in points. */
export const HIT_W = 46, HIT_H = 50;

/** Scale and offset that show the scene as large as possible without cutting a lantern. */
export function sceneFit(w: number, h: number) {
  const cover = Math.max(w / W, h / H);
  const k = Math.min(cover, w / 342, h / 470);
  return { k, ox: (w - W * k) / 2, oy: (h - H * k) / 2 };
}

/** A lantern place on screen: always fully visible and easy to touch, whatever the phone's shape. */
export function placeOnScreen<T extends { x: number; y: number }>(s: T, w: number, h: number): T {
  const { k, ox, oy } = sceneFit(w, h);
  return { ...s, x: Math.min(w - 28, Math.max(28, ox + s.x * k)), y: Math.min(h - 22, Math.max(34, oy + s.y * k)) };
}

export type Placed = [Prop, number, number, number?, PO?];

export interface RoomSpec {
  arch: Arch;
  ao?: ArchOpts;
  /** Light colour of the room once lit. */
  glow?: string;
  props: Placed[];
  /** Props drawn in front of the lanterns' halos (foreground). */
  front?: Placed[];
  /** Anchor indices to use, in lantern order (default: spread automatically). */
  slots?: number[];
  /** Where the room's object hides (found by searching once the room is lit). */
  hide: [number, number];
  /** Where the building's seal digit appears when the room is lit. */
  secret: [number, number];
  /** One line of story, told when entering. */
  intro: string;
}

export const ROOM_SPECS: Record<string, RoomSpec> = { ...PHARE_BIBLIO, ...HORLO_SERRE, ...MARCHE_THEATRE, ...OBS_GRENIER };

/** Checks every scene: enough anchors, spaced out, inside the screen. */
export function auditScenes(counts: Record<string, number>): string[] {
  const out: string[] = [];
  for (const [id, n] of Object.entries(counts)) {
    const spec = ROOM_SPECS[id];
    if (!spec) { out.push(`${id}: no scene`); continue; }
    const anchors = anchorsOf(spec, makeG(0, '#F4B45E', seedOf(id)));
    const sl = pickSlots(anchors, n, spec.slots);
    if (sl.length < n) out.push(`${id}: ${sl.length}/${n} anchors`);
    sl.forEach((a, i) => sl.slice(i + 1).forEach((b) => { if (!apart(a, b)) out.push(`${id}: « ${a.label} » and « ${b.label} » overlap`); }));
    sl.forEach((a) => { if (a.x < 24 || a.x > W - 24 || a.y < 48 || a.y > H - 40) out.push(`${id}: « ${a.label} » off screen (${a.x}, ${a.y})`); });
    const sp = spotsOf(id, n);
    for (const [what, pt] of [['objet caché', sp.hide], ['chiffre du sceau', sp.secret]] as const) {
      const near = sl.find((a) => Math.hypot(a.x - pt[0], a.y - pt[1]) < 34);
      if (near) out.push(`${id}: ${what} under « ${near.label} »`);
      if (pt[0] < 24 || pt[0] > W - 24 || pt[1] < 60 || pt[1] > H - 40) out.push(`${id}: ${what} off screen`);
    }
    if (Math.hypot(sp.hide[0] - sp.secret[0], sp.hide[1] - sp.secret[1]) < 40) out.push(`${id}: object and digit together`);
    const labels = sl.map((a) => a.label);
    labels.forEach((l, i) => { if (labels.indexOf(l) !== i) out.push(`${id}: label « ${l} » twice`); });
  }
  return out;
}

export interface Slot { x: number; y: number; label: string }

function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Every anchor of a room, in prop order. */
export function anchorsOf(spec: RoomSpec, g: G = makeG(0, '#F4B45E', 1)): Anchor[] {
  const out: Anchor[] = [];
  for (const [p, x, y, s, o] of [...spec.props, ...(spec.front ?? [])]) out.push(...p(g, x, y, s, o).a);
  return [...out, ...archAnchors(spec.arch, spec.ao)];
}

/** Two lantern places are never closer than one touch area (in scene units). */
const apart = (a: [number, number] | { x: number; y: number }, b: [number, number] | { x: number; y: number }) => {
  const ax = Array.isArray(a) ? a[0] : a.x, ay = Array.isArray(a) ? a[1] : a.y, bx = Array.isArray(b) ? b[0] : b.x, by = Array.isArray(b) ? b[1] : b.y;
  return Math.abs(ax - bx) >= 49 || Math.abs(ay - by) >= 53;
};

/** Picks n lantern places: the listed ones, then the anchors farthest from those already taken. */
export function pickSlots(anchors: Anchor[], n: number, wanted?: number[]): Slot[] {
  const chosen: Anchor[] = [];
  for (const i of wanted ?? []) if (anchors[i] && chosen.length < n) chosen.push(anchors[i]);
  const rest = anchors.filter((a) => !chosen.includes(a));
  while (chosen.length < n && rest.length) {
    // In prop order, the first anchor far enough from every chosen one.
    const idx = rest.findIndex((a) => chosen.every((c) => apart([a[0], a[1]], [c[0], c[1]])));
    if (idx < 0) break;
    chosen.push(rest.splice(idx, 1)[0]);
  }
  // Numbered in reading order (rows from the top, left to right), so « lanterne 7 » is easy to find.
  return disambiguate(chosen.map(([x, y, label]) => ({ x, y, label }))).sort((a, b) => (Math.floor(a.y / 120) - Math.floor(b.y / 120)) || (a.x - b.x));
}

/** Two lanterns never share a name: « l’applique, à gauche » / « l’applique, à droite ». */
function disambiguate(sl: Slot[]): Slot[] {
  const byLabel = new Map<string, Slot[]>();
  sl.forEach((a) => byLabel.set(a.label, [...(byLabel.get(a.label) ?? []), a]));
  for (const [label, group] of byLabel) {
    if (group.length < 2) continue;
    const base = label.replace(/, à (gauche|droite)$/, '');
    const xs = group.map((a) => a.x), ys = group.map((a) => a.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const third = (v: number, lo: number, hi: number) => (hi - lo < 28 ? 1 : Math.min(2, Math.floor(((v - lo) / (hi - lo + 1)) * 3)));
    for (const a of group) {
      const h = ['à gauche', '', 'à droite'][third(a.x, x0, x1)], v = ['en haut', '', 'en bas'][third(a.y, y0, y1)];
      a.label = `${base}, ${[v, h].filter(Boolean).join(' ') || 'au centre'}`;
    }
    // Still twins (rare): number them from the left.
    const seen = new Map<string, number>();
    [...group].sort((p, q) => p.x - q.x).forEach((a) => { const k = seen.get(a.label) ?? 0; seen.set(a.label, k + 1); if (k) a.label = `${a.label} (${k + 1})`; });
  }
  return sl;
}

const cache = new Map<string, Slot[]>();

/** Lantern places of a room (stable, independent of the light). */
export function roomSlotsOf(roomId: string, n: number): Slot[] {
  const key = `${roomId}:${n}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const spec = ROOM_SPECS[roomId];
  let out: Slot[];
  if (!spec) out = fallbackSlots(n);
  else out = pickSlots(anchorsOf(spec, makeG(0, '#F4B45E', seedOf(roomId))), n, spec.slots);
  while (out.length < n) out.push(fallbackSlots(n)[out.length]);
  cache.set(key, out);
  return out;
}

function fallbackSlots(n: number): Slot[] {
  return [...Array(n)].map((_, i) => ({ x: 60 + (i % 4) * 90, y: 140 + Math.floor(i / 4) * 110, label: 'la salle' }));
}

export interface SceneOpts {
  /** Fraction of lanterns lit. */
  t: number;
  lit: boolean[];
  complete: boolean;
  /** Object name, drawn at its hiding place (dim until the room is lit). */
  object?: string;
  objectFound?: boolean;
  /** Seal digit of this room, shown once the room is lit. */
  digit?: number | null;
}

export function sceneXml(roomId: string, n: number, o: SceneOpts): string {
  const spec = ROOM_SPECS[roomId];
  const seed = seedOf(roomId);
  const glow = spec?.glow ?? '#F4B45E';
  const g = makeG(o.t, glow, seed);
  const slots = roomSlotsOf(roomId, n);
  const hid = g.id('halo'), vid = g.id('vig');
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs><radialGradient id="${hid}"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${vid}" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#05060f" stop-opacity="0"/><stop offset="1" stop-color="#05060f" stop-opacity="${(0.7 - o.t * 0.35).toFixed(2)}"/></radialGradient></defs>`;
  if (!spec) return s + `<rect width="${W}" height="${H}" fill="#141833"/></svg>`;
  s += archXml(g, spec.arch, spec.ao);
  for (const [p, x, y, sc, po] of spec.props) s += p(g, x, y, sc, po).s;
  // The object, hidden in plain sight: barely visible in the dark, a soft glint once lit.
  const sp = spotsOf(roomId, n);
  if (o.object && !o.objectFound) s += objectInScene(o.object, sp.hide[0], sp.hide[1], 18, glow === '#F4B45E' ? '#FFD98E' : '#FFE6B0', o.complete ? 0.55 : 0.12);
  if (o.digit != null) {
    s += `<g opacity=".85"><circle cx="${sp.secret[0]}" cy="${sp.secret[1]}" r="15" fill="#FFD98E" opacity=".12"/><text x="${sp.secret[0]}" y="${r1(sp.secret[1] + 7)}" text-anchor="middle" font-family="${SVG_SERIF_ITALIC}" font-size="21" fill="#FFD98E">${o.digit}</text></g>`;
  }
  for (const [p, x, y, sc, po] of spec.front ?? []) s += p(g, x, y, sc, po).s;
  s += `<rect width="${W}" height="${H}" fill="url(#${vid})"/>`;
  slots.forEach((sl, i) => { if (o.lit[i]) s += `<circle cx="${sl.x}" cy="${sl.y}" r="78" fill="url(#${hid})" opacity=".6"/>`; });
  if (o.complete) s += `<rect width="${W}" height="${H}" fill="${glow}" opacity=".06"/>`;
  return s + '</svg>';
}

export const introOf = (roomId: string) => ROOM_SPECS[roomId]?.intro ?? '';

/** The nearest free spot to `want`: away from every lantern (and from `avoid`), inside the screen. */
function freeSpot(want: [number, number], slots: Slot[], avoid?: [number, number]): [number, number] {
  const ok = (x: number, y: number) => x >= 30 && x <= W - 30 && y >= 70 && y <= H - 44
    && slots.every((sl) => Math.hypot(sl.x - x, sl.y - y) >= 42) && (!avoid || Math.hypot(avoid[0] - x, avoid[1] - y) >= 46);
  if (ok(want[0], want[1])) return want;
  for (let r = 8; r < 260; r += 8) for (let a = 0; a < 16; a++) {
    const x = Math.round(want[0] + r * Math.cos((a * Math.PI) / 8)), y = Math.round(want[1] + r * Math.sin((a * Math.PI) / 8));
    if (ok(x, y)) return [x, y];
  }
  return want;
}
const spots = new Map<string, { hide: [number, number]; secret: [number, number] }>();
function spotsOf(roomId: string, n: number) {
  const key = `${roomId}:${n}`;
  const hit = spots.get(key);
  if (hit) return hit;
  const spec = ROOM_SPECS[roomId];
  const slots = roomSlotsOf(roomId, n);
  const hide = freeSpot(spec.hide, slots);
  const out = { hide, secret: freeSpot(spec.secret, slots, hide) };
  spots.set(key, out);
  return out;
}
export const hideOf = (roomId: string, n: number) => (ROOM_SPECS[roomId] ? spotsOf(roomId, n).hide : null);
export const secretOf = (roomId: string, n: number) => (ROOM_SPECS[roomId] ? spotsOf(roomId, n).secret : null);
