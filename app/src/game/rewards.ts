// Achievements (GAME_DESIGN § 9) and cosmetics (§ 11), computed from the
// real game state. Nothing here is stored twice: an achievement is "done"
// because the state says so; its shards are credited once (transaction id).
import { translated } from '../i18n';
import { GameState, isClairvoyant } from '../core/game/state';
import { Progression } from '../core/game/progression';
import { buildingLanterns, districtLanterns, Lantern } from '../core/game/world';
import { Tier } from '../core/puzzlekit/types';
import { CODES, Code, FAMILIES, WORLD } from './catalog';

export interface Profile {
  /** Counters that the save does not keep (GameState stays the core's format). */
  murmures: number;
  oops: number;
  thrifty: number;
  catchUps: number;
  hatDrops: number;
  /** Secrets of Vesper found (easter eggs), by id. */
  eggs: string[];
  /** Last time the app was opened (ISO), for Nilo's welcome back. */
  lastSeen: string | null;
  themes: string[];
  visited: string[];
  /** Solve durations in seconds, per tier (last 100). */
  durations: number[][];
  /** Shard history for the Éclats screen (last 30). */
  history: { label: string; amount: number; at: string }[];
  /** Rooms whose object the player has found by searching the lit room. */
  picked: string[];
  /** The app version whose « Quoi de neuf » was seen (null: fresh install, nothing to announce). */
  seenVersion: string | null;
  /** The App Store rating was asked once (after a district fully lit). */
  reviewAsked: boolean;
  /** The album: a photo of each district fully lit, with its date. */
  photos: { d: string; at: string }[];
  /** The player's own little house in Vesper: its name and the objects on its shelves (room ids). */
  house: { name: string; shelf: (string | null)[]; decor: Record<string, string> };
}
export const HOUSE_SLOTS = 8;
export const newProfile = (): Profile => ({ murmures: 0, oops: 0, thrifty: 0, catchUps: 0, hatDrops: 0, eggs: [], lastSeen: null, themes: [], visited: [], durations: [[], [], [], [], [], []], history: [], picked: [], seenVersion: null, reviewAsked: false, photos: [], house: { name: '', shelf: Array(HOUSE_SLOTS).fill(null), decor: {} } });

export interface Achievement { id: string; name: string; description: string; reward: number; hidden?: boolean; progress: (c: Ctx) => [number, number] }
interface Ctx { s: GameState; p: Progression; profile: Profile; solvedByFamily: Record<string, Lantern[]> }

const lanternOf = new Map<string, Lantern>();
for (const d of WORLD.districts) for (const l of districtLanterns(d)) lanternOf.set(l.puzzle, l);

function solvedLanterns(s: GameState): Lantern[] {
  const out: Lantern[] = [];
  for (const id of s.solved.keys()) { const l = lanternOf.get(id); if (l) out.push(l); }
  return out;
}

const districtDone = (id: string, name: string, title: string): Achievement => ({
  id: `district.${id}`, name: title, description: `Éclaire ${name} en entier.`, reward: 30,
  progress: ({ s, p }) => { const d = WORLD.districts.find((x) => x.id === id)!; const all = districtLanterns(d); return [p.lights(all, s), all.length]; },
});

const ACHIEVEMENTS_FR: Achievement[] = [
  // Exploration
  { id: 'first', name: 'Première lueur', description: 'Allume ta première lanterne.', reward: 10, progress: ({ s }) => [Math.min(1, solvedLanterns(s).length), 1] },
  districtDone('phare', 'le Phare', 'Gardien du Phare'),
  districtDone('biblio', 'la Bibliothèque', 'Rat de bibliothèque'),
  districtDone('horlo', 'l’Horlogerie', 'Remonteur'),
  districtDone('serre', 'la Serre de Verre', 'Main verte'),
  districtDone('marche', 'le Marché Flottant', 'Bon marché'),
  districtDone('theatre', 'le Théâtre d’Ombres', 'Rappel'),
  districtDone('obs', 'l’Observatoire', 'Tête dans les étoiles'),
  { id: 'visitAll', name: 'Un quartier par soir', description: 'Entre dans chaque quartier de Vesper.', reward: 20, progress: ({ profile }) => [Math.min(7, profile.visited.filter((v) => v !== 'grenier').length), 7] },
  { id: 'allBuildings', name: 'Tous les chemins', description: 'Ouvre tous les bâtiments de la ville.', reward: 30, progress: ({ s, p }) => {
    let open = 0, total = 0;
    const lights = p.totalLights(s), letters = p.letters(s);
    for (const d of WORLD.districts) d.buildings.forEach((_, bi) => { total++; if (p.isDistrictUnlocked(d, lights, letters) && p.isBuildingOpen(d, bi, s)) open++; });
    return [open, total];
  } },
  { id: 'finale', name: 'Vesper s’éveille', description: 'Éclaire le Grenier de l’Allumeur.', reward: 50, progress: ({ s, p }) => { const d = WORLD.districts.find((x) => x.id === 'grenier')!; const all = districtLanterns(d); return [p.lights(all, s), all.length]; } },
  // Maîtrise
  { id: 'clairvoyant', name: 'Clairvoyant', description: '10 lanternes d’affilée sans indice payant ni erreur.', reward: 25, progress: ({ s }) => {
    const records = [...s.solved.entries()].filter(([id]) => lanternOf.has(id)).map(([, r]) => r).sort((a, b) => a.solvedAt.localeCompare(b.solvedAt));
    let best = 0, run = 0;
    for (const r of records) { run = isClairvoyant(r) ? run + 1 : 0; best = Math.max(best, run); }
    return [Math.min(10, best), 10];
  } },
  { id: 'beacon', name: 'Premier Fanal', description: 'Allume une lanterne de palier Fanal.', reward: 20, progress: ({ s }) => [Math.min(1, solvedLanterns(s).filter((l) => l.tier >= Tier.Beacon).length), 1] },
  { id: 'astronomer', name: 'Astronome', description: 'Allume 10 lanternes de palier Astre.', reward: 40, progress: ({ s }) => [Math.min(10, solvedLanterns(s).filter((l) => l.tier === Tier.Star).length), 10] },
  { id: 'thrifty', name: 'Économe', description: 'Résous 10 Interrupteurs en nombre minimal de coups.', reward: 25, progress: ({ profile }) => [Math.min(10, profile.thrifty), 10] },
  { id: 'noNet', name: 'Sans filet', description: 'Éclaire un bâtiment entier sans indice payant.', reward: 30, progress: ({ s }) => {
    for (const d of WORLD.districts) for (const b of d.buildings) {
      const all = buildingLanterns(b);
      if (all.every((l) => { const r = s.solved.get(l.puzzle); return r && r.paidHints === 0 && !r.usedSolution; })) return [1, 1];
    }
    return [0, 1];
  } },
  // Familles
  ...CODES.map((code): Achievement => ({
    id: `family.${code}`, name: FAMILIES[code].achievement, description: `Résous 25 puzzles ${/^[AEIOUÉÈ]/.test(FAMILIES[code].name) ? 'd’' : 'de '}${FAMILIES[code].name}.`, reward: 20,
    progress: ({ solvedByFamily }) => [Math.min(25, (solvedByFamily[code] ?? []).length), 25],
  })),
  { id: 'polymath', name: 'Polymathe', description: 'Allume au moins un Brasier dans chaque famille.', reward: 40, progress: ({ solvedByFamily }) => [CODES.filter((c) => (solvedByFamily[c] ?? []).some((l) => l.tier >= Tier.Blaze)).length, CODES.length] },
  // Rituel
  { id: 'streak7', name: 'Flamme du soir', description: 'Une série de 7 soirs.', reward: 20, progress: ({ s }) => [Math.min(7, s.daily.bestStreak), 7] },
  { id: 'streak30', name: 'Veilleur', description: 'Une série de 30 soirs.', reward: 40, progress: ({ s }) => [Math.min(30, s.daily.bestStreak), 30] },
  { id: 'streak100', name: 'Gardien de la flamme', description: 'Une série de 100 soirs.', reward: 50, progress: ({ s }) => [Math.min(100, s.daily.bestStreak), 100] },
  { id: 'catchUp', name: 'Rattrapage', description: 'Joue un défi d’un soir passé.', reward: 10, progress: ({ profile }) => [Math.min(1, profile.catchUps), 1] },
  // Malice
  { id: 'hush', name: 'Chut', description: 'Utilise 50 Murmures. L’aide fait partie du jeu.', reward: 15, progress: ({ profile }) => [Math.min(50, profile.murmures), 50] },
  { id: 'oops', name: 'Oups', description: 'Te tromper, puis réussir au coup suivant.', reward: 10, progress: ({ profile }) => [Math.min(1, profile.oops), 1] },
  { id: 'clumsy', name: 'Maladroit', description: 'Touche Nilo cinq fois de suite quand il porte un chapeau.', reward: 15, progress: ({ profile }) => [Math.min(1, profile.hatDrops), 1] },
  { id: 'melomane', name: 'Mélomane', description: 'Écoute l’ambiance de 5 lieux de Vesper.', reward: 15, progress: ({ profile }) => [Math.min(5, profile.themes.length), 5] },
];
/** Achievements, read in the current language. */
export const ACHIEVEMENTS = translated(ACHIEVEMENTS_FR);

export function achievementContext(s: GameState, p: Progression, profile: Profile): Ctx {
  const solvedByFamily: Record<string, Lantern[]> = {};
  for (const l of solvedLanterns(s)) (solvedByFamily[l.family] ??= []).push(l);
  return { s, p, profile, solvedByFamily };
}

export function achievementStatus(ctx: Ctx) {
  return ACHIEVEMENTS.map((a) => { const [n, total] = a.progress(ctx); return { a, n, total, done: n >= total }; });
}

// ---------------------------------------------------------------- cosmetics

export type Slot = 'flame' | 'hat' | 'scarf' | 'comp';
export interface Cosmetic { id: string; slot: Slot; name: string; price?: number; earn?: { text: string; when: (c: Ctx) => boolean }; color?: string }

const lit = (district: string) => ({ s, p }: Ctx) => { const d = WORLD.districts.find((x) => x.id === district)!; const all = districtLanterns(d); return p.lights(all, s) === all.length; };
/** A milestone of a seasonal event, kept forever once reached (GameState.seenDialogue). */
const flag = (id: string) => ({ s }: Ctx) => s.seenDialogue.has(id);
const building = (id: string) => ({ s, p }: Ctx) => { for (const d of WORLD.districts) for (const b of d.buildings) if (b.id === id) { const all = buildingLanterns(b); return p.lights(all, s) === all.length; } return false; };
const ach = (id: string) => (c: Ctx) => { const a = ACHIEVEMENTS.find((x) => x.id === id)!; const [n, t] = a.progress(c); return n >= t; };

const COSMETICS_FR: Cosmetic[] = [
  { id: 'flame.amber', slot: 'flame', name: 'Ambre', price: 0, color: '#F4B45E' },
  { id: 'flame.moon', slot: 'flame', name: 'Clair de lune', price: 0, color: '#BFE6F0' },
  { id: 'flame.ember', slot: 'flame', name: 'Braise', price: 0, color: '#E8744A' },
  { id: 'flame.dawn', slot: 'flame', name: 'Aurore', price: 120, color: '#F29BC4' },
  { id: 'flame.gold', slot: 'flame', name: 'Or', price: 200, color: '#FFD98E' },
  { id: 'flame.paper', slot: 'flame', name: 'Rose de papier', price: 160, color: '#E7A98B' },
  { id: 'flame.verdigris', slot: 'flame', name: 'Vert-de-gris', earn: { text: 'Éclaire la Serre de Verre', when: lit('serre') }, color: '#7FC8A9' },
  { id: 'flame.plum', slot: 'flame', name: 'Prune', earn: { text: 'Éclaire le Théâtre d’Ombres', when: lit('theatre') }, color: '#C39BD3' },
  { id: 'flame.glacier', slot: 'flame', name: 'Glacier', earn: { text: 'Éclaire l’Observatoire', when: lit('obs') }, color: '#8FB8F0' },
  { id: 'flame.emerald', slot: 'flame', name: 'Émeraude', price: 250, color: '#3FC9A0' },
  { id: 'flame.night', slot: 'flame', name: 'Nuit bleue', price: 300, color: '#5C8FE0' },
  { id: 'flame.copper', slot: 'flame', name: 'Cuivre', price: 350, color: '#C98A5A' },
  { id: 'flame.pearl', slot: 'flame', name: 'Nacre', price: 450, color: '#EDE3F7' },
  { id: 'flame.mint', slot: 'flame', name: 'Menthe', price: 180, color: '#9CE0C4' },
  { id: 'flame.lilac', slot: 'flame', name: 'Lilas', price: 220, color: '#B79CE0' },
  { id: 'flame.ruby', slot: 'flame', name: 'Rubis', price: 380, color: '#E0625A' },
  { id: 'flame.blossom', slot: 'flame', name: 'Fleur de cerisier', earn: { text: 'Fais monter les 9 lanternes du Printemps des Lanternes', when: flag('event.lanternes.complete') }, color: '#F7A8C8' },
  { id: 'flame.star', slot: 'flame', name: 'Blanc d’étoile', earn: { text: 'Éclaire le Grenier de l’Allumeur', when: lit('grenier') }, color: '#FFF3D6' },
  { id: 'hat.none', slot: 'hat', name: 'Aucun', price: 0 },
  { id: 'hat.glasses', slot: 'hat', name: 'Lunettes de l’Archiviste', earn: { text: 'Éclaire la Salle de Lecture', when: building('biblio.b4') } },
  { id: 'hat.bonnet', slot: 'hat', name: 'Bonnet d’allumeur', earn: { text: 'Réveille Maître Ressort (Atelier des Ressorts)', when: building('horlo.b1') } },
  { id: 'hat.loupe', slot: 'hat', name: 'Loupe de l’Horlogère', earn: { text: 'Éclaire l’Horlogerie', when: lit('horlo') } },
  { id: 'hat.ivy', slot: 'hat', name: 'Couronne de lierre', earn: { text: 'Réveille le Jardinier (Palmarium)', when: building('serre.b4') } },
  { id: 'hat.straw', slot: 'hat', name: 'Chapeau de paille du Marché', price: 150 },
  { id: 'hat.mask', slot: 'hat', name: 'Masque de théâtre', earn: { text: 'Réveille le Souffleur (Grande Scène)', when: building('theatre.b4') } },
  { id: 'hat.astro', slot: 'hat', name: 'Casquette d’astronome', price: 180 },
  { id: 'hat.beret', slot: 'hat', name: 'Béret de peintre', price: 300 },
  { id: 'hat.crown', slot: 'hat', name: 'Couronne de papier', price: 400 },
  { id: 'hat.top', slot: 'hat', name: 'Haut-de-forme de l’Allumeur', price: 600 },
  { id: 'hat.witch', slot: 'hat', name: 'Chapeau de sorcière', earn: { text: 'Allume les 7 citrouilles de la Nuit des Citrouilles', when: flag('event.halloween.complete') } },
  { id: 'hat.santa', slot: 'hat', name: 'Bonnet de Père Noël', earn: { text: 'Veille 6 soirs pendant la Veillée de Vesper', when: flag('event.noel.half') } },
  { id: 'hat.nightcap', slot: 'hat', name: 'Bonnet de nuit', price: 140 },
  { id: 'hat.flowers', slot: 'hat', name: 'Couronne de fleurs', price: 220 },
  { id: 'hat.cap', slot: 'hat', name: 'Casquette de marin', price: 260 },
  { id: 'scarf.none', slot: 'scarf', name: 'Aucune', price: 0 },
  { id: 'scarf.knit', slot: 'scarf', name: 'Écharpe tricotée', price: 60 },
  { id: 'scarf.spice', slot: 'scarf', name: 'Foulard d’épices', price: 90 },
  { id: 'scarf.stripes', slot: 'scarf', name: 'Écharpe rayée', price: 250 },
  { id: 'scarf.star', slot: 'scarf', name: 'Écharpe étoilée', price: 400 },
  { id: 'scarf.gold', slot: 'scarf', name: 'Écharpe dorée', price: 500 },
  { id: 'scarf.bow', slot: 'scarf', name: 'Nœud papillon', price: 160 },
  { id: 'scarf.lavender', slot: 'scarf', name: 'Écharpe lavande', price: 200 },
  { id: 'scarf.holly', slot: 'scarf', name: 'Écharpe de houx', earn: { text: 'Veille les 12 soirs de la Veillée de Vesper', when: flag('event.noel.complete') } },
  { id: 'scarf.ribbon', slot: 'scarf', name: 'Ruban de scène', earn: { text: 'Succès « Rappel » : éclaire le Théâtre', when: lit('theatre') } },
  { id: 'comp.none', slot: 'comp', name: 'Aucun', price: 0 },
  { id: 'comp.leaf', slot: 'comp', name: 'Feuille flottante', price: 150 },
  { id: 'comp.fish', slot: 'comp', name: 'Poisson de lune', price: 450 },
  { id: 'comp.kite', slot: 'comp', name: 'Petit cerf-volant', price: 500 },
  { id: 'comp.lantern', slot: 'comp', name: 'Lanterne de poche', price: 800 },
  { id: 'comp.butterfly', slot: 'comp', name: 'Papillon', price: 350 },
  { id: 'comp.cloud', slot: 'comp', name: 'Petit nuage', price: 420 },
  { id: 'comp.bird', slot: 'comp', name: 'Petit oiseau', price: 600 },
  { id: 'comp.pumpkin', slot: 'comp', name: 'Petite citrouille', earn: { text: 'Allume 4 citrouilles de la Nuit des Citrouilles', when: flag('event.halloween.half') } },
  { id: 'comp.snowflake', slot: 'comp', name: 'Flocon', earn: { text: 'Veille 3 soirs pendant la Veillée de Vesper', when: flag('event.noel.start') } },
  { id: 'comp.skylantern', slot: 'comp', name: 'Lanterne volante', earn: { text: 'Fais monter 3 lanternes du Printemps des Lanternes', when: flag('event.lanternes.start') } },
  { id: 'comp.gear', slot: 'comp', name: 'Petit engrenage', earn: { text: 'Succès « Horloger » : 25 Engrenages', when: ach('family.EN') } },
  { id: 'comp.firefly', slot: 'comp', name: 'Luciole', earn: { text: 'Succès « Veilleur » : série de 30 soirs', when: ach('streak30') } },
  { id: 'comp.moth', slot: 'comp', name: 'Papillon de nuit', earn: { text: 'Succès « Clairvoyant »', when: ach('clairvoyant') } },
  { id: 'comp.comet', slot: 'comp', name: 'Comète miniature', earn: { text: 'Succès « Astronome » : 10 Astres', when: ach('astronomer') } },
];
/** Nilo's wardrobe, read in the current language. */
export const COSMETICS = translated(COSMETICS_FR);

export const SLOT_NAMES: Record<Slot, string> = translated({ flame: 'Flamme', hat: 'Tête', scarf: 'Écharpe', comp: 'Compagnon' });
export const DEFAULT_LOOK: Record<Slot, string> = { flame: 'flame.amber', hat: 'hat.none', scarf: 'scarf.none', comp: 'comp.none' };

export function owns(c: Cosmetic, s: GameState, ctx: Ctx): boolean {
  if (c.price === 0) return true;
  if (c.earn) return c.earn.when(ctx);
  return s.ownedCosmetics.has(c.id);
}

export function look(s: GameState): { flame: string; hat: string; scarf: string; comp: string } {
  const get = (slot: Slot) => (s.equippedCosmetics.get(slot) ?? DEFAULT_LOOK[slot]).split('.')[1];
  return { flame: get('flame'), hat: get('hat'), scarf: get('scarf'), comp: get('comp') };
}

export type { Ctx as RewardContext };
export { CODES as ALL_CODES };
export type { Code as FamilyCode };

/** Mastery of a lantern: ★ lit, ★★ without any hint, ★★★ without hint or mistake. Replays keep the best. */
export function starsOf(r: { paidHints: number; wrongAnswers: number; usedSolution: boolean } | undefined): 0 | 1 | 2 | 3 {
  if (!r) return 0;
  if (r.usedSolution || r.paidHints > 0) return 1;
  return r.wrongAnswers > 0 ? 2 : 3;
}
