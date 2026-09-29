// Content of the prototype's playable slice: the Horlogerie, the Atelier des
// Ressorts and its Salle 2 "L'Établi". Same data as prototype/index.html.

export type FamilyCode = 'SU' | 'LA' | 'CA' | 'EN' | 'IN' | 'BA';
export type PuzzleKind = FamilyCode | 'TUTO';

export const FAMILIES: Record<FamilyCode, { name: string; rule: string }> = {
  SU: { name: 'Suites', rule: 'Trouve le nombre suivant.' },
  LA: { name: 'Lampes', rule: 'Éclaire toutes les cases. Deux lampes ne se voient jamais.' },
  CA: { name: 'Cadenas', rule: 'Trouve le code : trois chiffres, tous différents.' },
  EN: { name: 'Engrenages', rule: 'Tourne les tuiles pour conduire la lumière à toutes les lanternes.' },
  IN: { name: 'Interrupteurs', rule: 'Chaque bouton inverse sa lanterne et ses voisines. Allume tout.' },
  BA: { name: 'Balances', rule: 'Combien pèse l’objet marqué ?' },
};

export const TIERS = ['Étincelle', 'Lueur', 'Flamme', 'Brasier', 'Fanal', 'Astre'] as const;
export const REWARD = [5, 8, 12, 16, 20, 25] as const;
export const HINT_COST = [0, 5, 10, 20] as const;
export const HINT_NAMES = ['Murmure', 'Piste', 'Éclairage', 'Solution'] as const;

export interface District { id: string; name: string; short?: string; hue: string; need: number; total: number }

export const DISTRICTS: District[] = [
  { id: 'phare', name: 'Le Phare', hue: '#F4B45E', need: 0, total: 24 },
  { id: 'biblio', name: 'La Bibliothèque Murmurante', short: 'Bibliothèque', hue: '#E7A98B', need: 14, total: 160 },
  { id: 'horlo', name: "L'Horlogerie", short: 'Horlogerie', hue: '#D8B56A', need: 110, total: 160 },
  { id: 'serre', name: 'La Serre de Verre', short: 'Serre de Verre', hue: '#7FC8A9', need: 206, total: 160 },
  { id: 'marche', name: 'Le Marché Flottant', short: 'Marché Flottant', hue: '#EE8A6B', need: 302, total: 160 },
  { id: 'theatre', name: "Le Théâtre d'Ombres", short: "Théâtre d'Ombres", hue: '#C39BD3', need: 398, total: 160 },
  { id: 'obs', name: "L'Observatoire", short: 'Observatoire', hue: '#8FB8F0', need: 494, total: 160 },
];

export const ROOM_SLOTS = [
  { x: 62, y: 150, obj: 'la pendule' }, { x: 195, y: 70, obj: 'la suspension' }, { x: 104, y: 96, obj: 'la roue murale' },
  { x: 328, y: 126, obj: "l'étagère haute" }, { x: 196, y: 196, obj: 'le rebord de fenêtre' }, { x: 150, y: 318, obj: "l'établi, à gauche" },
  { x: 246, y: 318, obj: "l'établi, à droite" }, { x: 326, y: 236, obj: "l'étagère basse" }, { x: 326, y: 396, obj: 'le coffre' },
  { x: 70, y: 414, obj: 'le tabouret' },
];

export interface HBuilding {
  id: string; name: string; x: number; w: number; h: number;
  roof: 'peak' | 'clock' | 'flat' | 'spire'; lit: number; lanterns: number;
  open: boolean; need?: string;
}

export const HBUILD: HBuilding[] = [
  { id: 'atelier', name: 'Atelier des Ressorts', x: 18, w: 82, h: 150, roof: 'peak', lit: 0.75, lanterns: 30, open: true },
  { id: 'carillon', name: 'Tour du Carillon', x: 110, w: 66, h: 214, roof: 'clock', lit: 0.3, lanterns: 12, open: true },
  { id: 'pendules', name: 'Salle des Pendules', x: 188, w: 84, h: 128, roof: 'flat', lit: 0, lanterns: 0, open: false, need: 'Allume 20 lanternes à la Tour du Carillon' },
  { id: 'automates', name: 'Chambre des Automates', x: 282, w: 60, h: 176, roof: 'spire', lit: 0, lanterns: 0, open: false, need: 'Allume 20 lanternes à la Salle des Pendules' },
];

export const FLAMES: Record<string, { color: string; name: string }> = {
  amber: { color: '#F4B45E', name: 'Ambre' },
  moon: { color: '#BFE6F0', name: 'Clair de lune' },
  ember: { color: '#E8744A', name: 'Braise' },
  dawn: { color: '#F29BC4', name: 'Aurore' },
  verdigris: { color: '#7FC8A9', name: 'Vert-de-gris' },
  plum: { color: '#C39BD3', name: 'Prune' },
  gold: { color: '#FFD98E', name: 'Or' },
  glacier: { color: '#8FB8F0', name: 'Glacier' },
};

export interface RoomLantern { family: FamilyCode; tier: number; lit: boolean }

export interface DemoGame {
  lights: number;
  shards: number;
  streak: number;
  best: number;
  nightlights: number;
  dailyDone: boolean;
  /** Local day (YYYY-MM-DD) of the last daily success; `dailyDone` only counts for that day. */
  dailyDay: string;
  room: RoomLantern[];
  roomRewarded: boolean;
  justLit: number;
  flame: string;
  hat: string;
}

export function freshGame(): DemoGame {
  const L = (family: FamilyCode, tier: number, lit: boolean): RoomLantern => ({ family, tier, lit });
  return {
    lights: 184, shards: 236, streak: 12, best: 31, nightlights: 1, dailyDone: false, dailyDay: '',
    room: [L('IN', 0, true), L('SU', 0, true), L('EN', 1, true), L('CA', 1, true), L('SU', 1, true), L('LA', 1, true),
      L('EN', 1, false), L('IN', 1, false), L('CA', 2, false), L('LA', 2, false)],
    roomRewarded: false,
    justLit: -1,
    flame: 'amber',
    hat: 'none',
  };
}

export const litCount = (g: DemoGame) => g.room.filter((l) => l.lit).length;
export const distState = (g: DemoGame, d: District): 'locked' | 'current' | 'open' =>
  g.lights < d.need ? 'locked' : d.id === 'horlo' ? 'current' : 'open';
export const distLights = (g: DemoGame, d: District): number =>
  ({ phare: 24, biblio: 118, horlo: g.lights - 142 } as Record<string, number>)[d.id] ?? 0;
