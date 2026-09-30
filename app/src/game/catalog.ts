// The game's content: the generated pack (world + puzzles + daily puzzles)
// and the six playable families, bound to their core engines.
import pack from '../content/generated/pack.json';
import { PuzzleFamily, Tier } from '../core/puzzlekit/types';
import { SeededRNG } from '../core/puzzlekit/rng';
import { CandidatePipeline } from '../core/puzzlekit/pipeline';
import { SwitchesFamily } from '../core/families/switches';
import { LocksFamily } from '../core/families/locks';
import { LampsFamily } from '../core/families/lamps';
import { GearsFamily } from '../core/families/gears';
import { SequencesFamily } from '../core/families/sequences';
import { ScalesFamily } from '../core/families/scales';
import { PatternsFamily } from '../core/families/patterns';
import { LiarsFamily } from '../core/families/liars';
import { ThreadsFamily } from '../core/families/threads';
import { MirrorsFamily } from '../core/families/mirrors';
import { InquiriesFamily } from '../core/families/inquiries';
import { MarquetryFamily } from '../core/families/marquetry';
import { ChimesFamily } from '../core/families/chimes';
import { StainedFamily } from '../core/families/stained';
import { SpotFamily } from '../core/families/spot';
import { ShelfFamily } from '../core/families/shelf';
import { ShadowsFamily } from '../core/families/shadows';
import { SealFamily } from '../core/families/seal';
import { EmbroideryFamily } from '../core/families/embroidery';
import { SignsFamily } from '../core/families/signs';
import { RoofsFamily } from '../core/families/roofs';
import { GlideFamily } from '../core/families/glide';
import { SliderFamily } from '../core/families/slider';
import { RibbonsFamily } from '../core/families/ribbons';
import { FirefliesFamily } from '../core/families/fireflies';
import { BridgesFamily } from '../core/families/bridges';
import { DailyPlanner } from '../core/game/daily';
import { DayKey, daysBetween } from '../core/game/dayKey';
import { Building, District, Lantern, Room, World } from '../core/game/world';
import { DistrictId, DISTRICT_BY_ID } from '../content/vesper';

export type Code = 'IN' | 'CA' | 'LA' | 'EN' | 'SU' | 'BA' | 'MO' | 'ME' | 'FI' | 'MI' | 'EQ' | 'MA' | 'CR' | 'VI' | 'DI' | 'ET' | 'OM' | 'BR' | 'SG' | 'TO' | 'GL' | 'TQ' | 'RU' | 'LU' | 'PA' | 'SC';
/** Families of the lanterns and of the evening challenge (the seal only closes buildings). */
export const CODES: Code[] = ['SU', 'LA', 'CA', 'EN', 'MA', 'ME', 'EQ', 'BA', 'MO', 'FI', 'IN', 'MI', 'CR', 'VI', 'DI', 'ET', 'OM', 'BR', 'SG', 'TO', 'GL', 'TQ', 'RU', 'LU', 'PA'];

export interface FamilyInfo {
  code: Code;
  name: string;
  /** Families with an answer to submit (Valider); the others validate themselves. */
  answer: boolean;
  rule: string;
  engine: PuzzleFamily<any, any, any, any>;
  /** Name of the "25 puzzles" achievement. */
  achievement: string;
}

export const FAMILIES: Record<Code, FamilyInfo> = {
  IN: { code: 'IN', name: 'Interrupteurs', answer: false, rule: 'Chaque bouton inverse sa lanterne et ses voisines. Allume tout.', engine: new SwitchesFamily(), achievement: 'Électricien' },
  CA: { code: 'CA', name: 'Cadenas', answer: true, rule: 'Trouve le code. ● : chiffre juste et bien placé. ○ : juste mais mal placé.', engine: new LocksFamily(), achievement: 'Crocheteur' },
  LA: { code: 'LA', name: 'Lampes', answer: false, rule: 'Éclaire toutes les cases. Deux lampes ne se voient jamais. Un mur numéroté touche autant de lampes.', engine: new LampsFamily(), achievement: 'Allumeur' },
  EN: { code: 'EN', name: 'Engrenages', answer: false, rule: 'Tourne les tuiles pour conduire la lumière à toutes les lanternes, sans fuite.', engine: new GearsFamily(), achievement: 'Horloger' },
  SU: { code: 'SU', name: 'Suites', answer: true, rule: 'Trouve le nombre suivant.', engine: new SequencesFamily(), achievement: 'Mathématicien' },
  BA: { code: 'BA', name: 'Balances', answer: true, rule: 'Les balances sont en équilibre. Combien pèse l’objet marqué ?', engine: new ScalesFamily(), achievement: 'Marchand' },
  MO: { code: 'MO', name: 'Motifs', answer: true, rule: 'Quelle pièce complète le tableau ?', engine: new PatternsFamily(), achievement: 'Cartographe' },
  ME: { code: 'ME', name: 'Menteurs', answer: true, rule: 'Chacun dit toujours la vérité ou ment toujours. Qui ment ?', engine: new LiarsFamily(), achievement: 'Juge de paix' },
  FI: { code: 'FI', name: 'Fil', answer: false, rule: 'Trace un seul fil qui passe par toutes les cases, d’une lanterne à l’autre.', engine: new ThreadsFamily(), achievement: 'Fileur' },
  MI: { code: 'MI', name: 'Miroirs', answer: false, rule: 'Place les miroirs pour que le rayon atteigne toutes les cibles.', engine: new MirrorsFamily(), achievement: 'Opticien' },
  EQ: { code: 'EQ', name: 'Enquêtes', answer: true, rule: 'Associe chaque habitant à son objet et à son lieu grâce aux indices.', engine: new InquiriesFamily(), achievement: 'Détective' },
  MA: { code: 'MA', name: 'Marqueterie', answer: false, rule: 'Remplis la silhouette avec toutes les pièces. Tu peux les tourner.', engine: new MarquetryFamily(), achievement: 'Ébéniste' },
  CR: { code: 'CR', name: 'Carillon', answer: false, rule: 'Écoute la mélodie des cloches, puis rejoue-la.', engine: new ChimesFamily(), achievement: 'Sonneur de cloches' },
  VI: { code: 'VI', name: 'Vitraux', answer: false, rule: 'Chaque ligne et chaque colonne a un filtre rouge, jaune, bleu, ou aucun. Chaque vitre mélange les deux. Retrouve les filtres.', engine: new StainedFamily(), achievement: 'Maître verrier' },
  DI: { code: 'DI', name: 'Différences', answer: false, rule: 'Trouve ce qui a changé dans la seconde image.', engine: new SpotFamily(), achievement: 'Œil de lynx' },
  ET: { code: 'ET', name: 'Étagère', answer: true, rule: 'Range les objets de gauche à droite en suivant les indices.', engine: new ShelfFamily(), achievement: 'Rangeur' },
  OM: { code: 'OM', name: 'Ombres', answer: true, rule: 'Quelle ombre appartient à l’objet ? Une ombre tourne, mais ne se retourne jamais.', engine: new ShadowsFamily(), achievement: 'Montreur d’ombres' },
  BR: { code: 'BR', name: 'Broderie', answer: false, rule: 'Brode le motif : les nombres donnent les groupes de points de chaque ligne et de chaque colonne.', engine: new EmbroideryFamily(), achievement: 'Brodeuse' },
  SG: { code: 'SG', name: 'Signes', answer: false, rule: 'Chaque chiffre une fois par ligne et par colonne. La pointe d’un signe désigne le plus petit.', engine: new SignsFamily(), achievement: 'Arithméticien' },
  TO: { code: 'TO', name: 'Toits', answer: false, rule: 'Chaque hauteur une fois par ligne et par colonne. Un nombre au bord compte les cheminées visibles depuis là.', engine: new RoofsFamily(), achievement: 'Couvreur' },
  GL: { code: 'GL', name: 'Glissade', answer: false, rule: 'Nilo glisse jusqu’à heurter quelque chose. Fais-le s’arrêter sur la lanterne.', engine: new GlideFamily(), achievement: 'Patineur' },
  TQ: { code: 'TQ', name: 'Taquin', answer: false, rule: 'Fais glisser les tuiles pour les remettre dans l’ordre.', engine: new SliderFamily(), achievement: 'Vitrier' },
  RU: { code: 'RU', name: 'Rubans', answer: false, rule: 'Relie chaque paire d’épingles par un ruban. Les rubans ne se croisent pas et couvrent tout.', engine: new RibbonsFamily(), achievement: 'Tisserand' },
  LU: { code: 'LU', name: 'Lucioles', answer: false, rule: 'Une luciole à côté de chaque lanterne. Elles ne se touchent jamais. Les nombres comptent les lucioles.', engine: new FirefliesFamily(), achievement: 'Veilleur de nuit' },
  PA: { code: 'PA', name: 'Passerelles', answer: false, rule: 'Relie les îlots par des passerelles qui ne se croisent pas. Chaque nombre dit combien en partent.', engine: new BridgesFamily(), achievement: 'Pontonnier' },
  SC: { code: 'SC', name: 'Sceau', answer: true, rule: 'Chaque salle éclairée cache un chiffre dans son décor. Retrouve-les pour ouvrir le sceau.', engine: new SealFamily(), achievement: 'Gardien des sceaux' },
};

export const TIER_NAMES = ['Étincelle', 'Lueur', 'Flamme', 'Brasier', 'Fanal', 'Astre'] as const;
export const REWARDS = [5, 8, 12, 16, 20, 25] as const;

interface PackLantern { id: string; family: Code; tier: Tier }
interface PackBuilding { id: string; rooms: { id: string; lanterns: PackLantern[] }[]; keystone?: PackLantern; keystoneGivesLetter?: boolean }
interface PackDistrict { id: string; unlock: District['unlock']; buildings: PackBuilding[] }
interface PackPuzzle { f: Code; t: Tier; p: unknown }

const P = pack as unknown as {
  version: number;
  world: { id: string; districts: PackDistrict[] };
  puzzles: Record<string, PackPuzzle>;
  daily: { first: DayKey; last: DayKey; puzzles: Record<string, PackPuzzle> };
};

const toLantern = (l: PackLantern): Lantern => ({ puzzle: l.id, family: l.family, tier: l.tier });

export const WORLD: World = {
  id: P.world.id,
  districts: P.world.districts.map((d) => ({
    id: d.id,
    unlock: d.unlock,
    buildings: d.buildings.map((b): Building => ({
      id: b.id,
      rooms: b.rooms.map((r): Room => ({ id: r.id, lanterns: r.lanterns.map(toLantern) })),
      keystone: b.keystone ? toLantern(b.keystone) : undefined,
      keystoneGivesLetter: b.keystoneGivesLetter,
    })),
  })),
};
export const CONTENT_VERSION = P.version;
/** Every lantern of the world, keystones included (as counted by totalLights): grows when an update adds districts. */
export const LANTERN_COUNT = P.world.districts.reduce((n, d) => n + d.buildings.reduce((m, b) => m + b.rooms.reduce((k, r) => k + r.lanterns.length, 0) + (b.keystone ? 1 : 0), 0), 0);
export const formatCount = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

export const districtInfo = (d: District) => DISTRICT_BY_ID[d.id as DistrictId];

export interface PlayablePuzzle { id: string; code: Code; tier: Tier; data: unknown }

const parsed = new Map<string, PlayablePuzzle>();

/** The puzzle of a lantern (parsed and checked once, then cached). */
export function puzzleFor(id: string): PlayablePuzzle | null {
  const hit = parsed.get(id);
  if (hit) return hit;
  const raw = P.puzzles[id];
  if (!raw || !(raw.f in FAMILIES)) return null;
  const data = FAMILIES[raw.f].engine.parse(raw.p);
  if (!data) return null;
  const out = { id, code: raw.f, tier: raw.t, data };
  parsed.set(id, out);
  return out;
}

// ---------------------------------------------------------------- daily

const planner = new DailyPlanner([...CODES], 'fr', P.version);
const DAILY_MAX_TIER: Record<Code, Tier> = { IN: 5, CA: 5, LA: 5, EN: 5, SU: 3, BA: 4, MO: 4, ME: 5, FI: 4, MI: 5, EQ: 4, MA: 3, CR: 4, VI: 4, DI: 4, ET: 4, OM: 4, BR: 4, SG: 4, TO: 3, GL: 4, TQ: 3, RU: 4, LU: 4, PA: 4, SC: 3 };
/** On-device fallback beyond the prepared range: light parameters only (fast). */
const DAILY_FALLBACK: Record<Code, unknown> = {
  IN: { rows: 4, columns: 4, presses: [4, 7] }, CA: { length: 3, clueCount: [4, 7] }, LA: { rows: 6, columns: 6 },
  EN: { rows: 5, columns: 5 }, SU: { complexity: 2 }, BA: { unknowns: 3, maxWeight: 20 },
  MO: { active: 2 }, ME: { characters: 4, kinds: ['liar', 'honest', 'atLeastOneLiar', 'exactlyLiars'] }, FI: { rows: 5, columns: 5, wallPercent: 25 },
  MI: { rows: 6, columns: 6, mirrors: 3, targets: 4, obstaclePercent: 12 }, EQ: { size: 4, kinds: ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'objectNotAt'] },
  MA: { silhouettes: ['lanterne', 'cle', 'theiere', 'maison', 'bateau', 'horloge'], pieceSize: [3, 5] },
  CR: { bells: 4, length: [5, 7] }, VI: { rows: 3, cols: 4 }, DI: { items: [11, 14], diffs: 5 }, ET: { n: 5 }, OM: { cells: [6, 7], options: 4 },
  BR: { rows: 7, cols: 7, density: 0.55, symmetric: true }, SG: { n: 5, startSigns: 8 }, TO: { n: 4, keepClues: 10 },
  GL: { rows: 7, cols: 7, rocks: [7, 11], moves: [5, 7] }, TQ: { rows: 3, cols: 3, moves: [12, 18] }, RU: { rows: 6, cols: 6, pairs: [5, 6] },
  LU: { rows: 7, cols: 7, posts: [8, 10] }, PA: { rows: 7, cols: 7, islands: [9, 11] },
  SC: { rooms: ['phare.b1.r1'] },
};

export function dailyPuzzle(day: DayKey): PlayablePuzzle | null {
  const id = `daily.${day}`;
  const hit = parsed.get(id);
  if (hit) return hit;
  const raw = P.daily.puzzles[day];
  if (raw) {
    const data = FAMILIES[raw.f]?.engine.parse(raw.p);
    if (data) { const out = { id, code: raw.f, tier: raw.t, data }; parsed.set(id, out); return out; }
  }
  // Outside the prepared years: same assignment (family, seed), generated here.
  const a = planner.assignment(day);
  const code = a.family as Code;
  const pipe = new CandidatePipeline(FAMILIES[code].engine);
  const rng = new SeededRNG(a.seed);
  for (let i = 0; i < 200; i++) {
    const out = pipe.evaluate(DAILY_FALLBACK[code], rng.next());
    if ('accepted' in out) {
      const p = { id, code, tier: Math.min(out.accepted.tier, DAILY_MAX_TIER[code]) as Tier, data: out.accepted.puzzle };
      parsed.set(id, p);
      return p;
    }
  }
  return null;
}

export const dailyRange = { first: P.daily.first, last: P.daily.last };
export const isPreparedDay = (day: DayKey) => daysBetween(day, P.daily.first) >= 0 && daysBetween(P.daily.last, day) >= 0;
