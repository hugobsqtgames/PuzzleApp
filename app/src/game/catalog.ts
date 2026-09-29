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
import { DailyPlanner } from '../core/game/daily';
import { DayKey, daysBetween } from '../core/game/dayKey';
import { Building, District, Lantern, Room, World } from '../core/game/world';
import { DistrictId, DISTRICT_BY_ID } from '../content/vesper';

export type Code = 'IN' | 'CA' | 'LA' | 'EN' | 'SU' | 'BA';
export const CODES: Code[] = ['IN', 'CA', 'LA', 'EN', 'SU', 'BA'];

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
const DAILY_MAX_TIER: Record<Code, Tier> = { IN: 5, CA: 5, LA: 5, EN: 5, SU: 3, BA: 4 };
/** On-device fallback beyond the prepared range: light parameters only (fast). */
const DAILY_FALLBACK: Record<Code, unknown> = {
  IN: { rows: 4, columns: 4, presses: [4, 7] }, CA: { length: 3, clueCount: [4, 7] }, LA: { rows: 6, columns: 6 },
  EN: { rows: 5, columns: 5 }, SU: { complexity: 2 }, BA: { unknowns: 3, maxWeight: 20 },
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
