/** Déblocages — portage de GameCore/Progression.swift. On débloque par quantité de lumière, jamais par un puzzle précis. */
import { GameState } from './state';
import { Building, District, Lantern, World, buildingLanterns, regularLanterns, worldLanterns } from './world';

export interface ProgressionRules { roomUnlockPercent: number; previousBuildingLights: number; keystoneLights: number }
export const STANDARD_RULES: ProgressionRules = { roomUnlockPercent: 60, previousBuildingLights: 20, keystoneLights: 30 };
export const lightsToOpenNextRoom = (size: number, rules = STANDARD_RULES) => Math.floor((size * rules.roomUnlockPercent + 99) / 100);

interface Place { district: number; building: number; room: number | null }

export class Progression {
  private readonly places = new Map<string, Place>();
  private readonly roomOf = new Map<string, number[]>();
  private readonly allLanterns: Lantern[];

  constructor(readonly world: World, readonly rules: ProgressionRules = STANDARD_RULES) {
    world.districts.forEach((d, di) => d.buildings.forEach((b, bi) => {
      b.rooms.forEach((r, ri) => r.lanterns.forEach((l) => this.places.set(l.puzzle, { district: di, building: bi, room: ri })));
      if (b.keystone) this.places.set(b.keystone.puzzle, { district: di, building: bi, room: null });
    }));
    this.allLanterns = worldLanterns(world);
  }

  lights(lanterns: Lantern[], s: GameState) { let n = 0; for (const l of lanterns) if (s.solved.has(l.puzzle)) n++; return n; }
  totalLights(s: GameState) { return this.lights(this.allLanterns, s); }
  letters(s: GameState) {
    let n = 0;
    for (const d of this.world.districts) for (const b of d.buildings) if (b.keystoneGivesLetter && b.keystone && s.solved.has(b.keystone.puzzle)) n++;
    return n;
  }

  isDistrictUnlocked(d: District, total: number, letters: number) {
    switch (d.unlock.kind) {
      case 'always': return true;
      case 'totalLights': return total >= d.unlock.lights;
      case 'totalLightsAndLetters': return total >= d.unlock.lights && letters >= d.unlock.letters;
    }
  }
  isBuildingOpen(d: District, bi: number, s: GameState) {
    return bi === 0 || this.lights(buildingLanterns(d.buildings[bi - 1]), s) >= this.rules.previousBuildingLights;
  }
  isRoomOpen(b: Building, ri: number, s: GameState) {
    if (ri === 0) return true;
    const prev = b.rooms[ri - 1];
    return this.lights(prev.lanterns, s) >= lightsToOpenNextRoom(prev.lanterns.length, this.rules);
  }
  isKeystoneOpen(b: Building, s: GameState) {
    const regular = regularLanterns(b);
    return this.lights(regular, s) >= Math.min(this.rules.keystoneLights, regular.length);
  }

  playableLanterns(s: GameState): Lantern[] {
    const total = this.totalLights(s), letters = this.letters(s), out: Lantern[] = [];
    for (const d of this.world.districts) {
      if (!this.isDistrictUnlocked(d, total, letters)) continue;
      d.buildings.forEach((b, bi) => {
        if (!this.isBuildingOpen(d, bi, s)) return;
        b.rooms.forEach((r, ri) => { if (this.isRoomOpen(b, ri, s)) out.push(...r.lanterns); });
        if (b.keystone && this.isKeystoneOpen(b, s)) out.push(b.keystone);
      });
    }
    return out;
  }
  playableUnsolved(s: GameState) { return this.playableLanterns(s).filter((l) => !s.solved.has(l.puzzle)); }

  isPlayable(id: string, s: GameState): boolean {
    const p = this.places.get(id);
    if (!p) return false;
    const d = this.world.districts[p.district];
    if (!this.isDistrictUnlocked(d, this.totalLights(s), this.letters(s)) || !this.isBuildingOpen(d, p.building, s)) return false;
    const b = d.buildings[p.building];
    return p.room === null ? this.isKeystoneOpen(b, s) : this.isRoomOpen(b, p.room, s);
  }

  /** « Continuer » : même salle → même bâtiment → même quartier → suite du monde. */
  recommended(s: GameState): Lantern | null {
    const open = this.playableUnsolved(s);
    const here = s.lastPuzzle ? this.places.get(s.lastPuzzle) : undefined;
    if (!here) return open[0] ?? null;
    const at = (l: Lantern) => this.places.get(l.puzzle)!;
    return (here.room !== null ? open.find((l) => at(l).district === here.district && at(l).building === here.building && at(l).room === here.room) : undefined)
      ?? open.find((l) => at(l).district === here.district && at(l).building === here.building)
      ?? open.find((l) => at(l).district === here.district)
      ?? open.find((l) => at(l).district > here.district)
      ?? open[0] ?? null;
  }

  locate(id: string): { district: District; building: import('./world').Building; room: import('./world').Room | null; lantern: Lantern } | null {
    const p = this.places.get(id);
    if (!p) return null;
    const district = this.world.districts[p.district], building = district.buildings[p.building];
    const room = p.room === null ? null : building.rooms[p.room];
    const lantern = room ? room.lanterns.find((l) => l.puzzle === id)! : building.keystone!;
    return { district, building, room, lantern };
  }
}
