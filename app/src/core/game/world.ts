/** Modèle du monde — portage de GameCore/World.swift. Les identifiants de puzzles ne changent jamais. */
import { Tier } from '../puzzlekit/types';

export interface Lantern { puzzle: string; family: string; tier: Tier }
export interface Room { id: string; lanterns: Lantern[] }
export interface Building { id: string; rooms: Room[]; keystone?: Lantern; keystoneGivesLetter?: boolean }
export type UnlockRule = { kind: 'always' } | { kind: 'totalLights'; lights: number } | { kind: 'totalLightsAndLetters'; lights: number; letters: number };
export interface District { id: string; unlock: UnlockRule; buildings: Building[] }
export interface World { id: string; districts: District[] }

export const regularLanterns = (b: Building) => b.rooms.flatMap((r) => r.lanterns);
export const buildingLanterns = (b: Building) => [...regularLanterns(b), ...(b.keystone ? [b.keystone] : [])];
export const districtLanterns = (d: District) => d.buildings.flatMap(buildingLanterns);
export const worldLanterns = (w: World) => w.districts.flatMap(districtLanterns);

export function duplicatePuzzleIDs(w: World): string[] {
  const seen = new Set<string>(), dup: string[] = [];
  for (const l of worldLanterns(w)) { if (seen.has(l.puzzle)) dup.push(l.puzzle); seen.add(l.puzzle); }
  return dup;
}
