// What the screens show, derived from the real state (never stored twice).
import { GameState } from '../core/game/state';
import { Progression, lightsToOpenNextRoom } from '../core/game/progression';
import { Building, District, Lantern, Room, buildingLanterns, districtLanterns, regularLanterns } from '../core/game/world';
import { DistrictView } from '../ui/art';
import { DISTRICT_BY_ID, DistrictId } from '../content/vesper';
import { WORLD } from './catalog';

export const districtById = (id: string) => WORLD.districts.find((d) => d.id === id)!;
export const infoOf = (d: District) => DISTRICT_BY_ID[d.id as DistrictId];
export const buildingIndex = (d: District, id: string) => d.buildings.findIndex((b) => b.id === id);

export function locateBuilding(id: string): { district: District; building: Building; index: number } | null {
  for (const d of WORLD.districts) {
    const index = d.buildings.findIndex((b) => b.id === id);
    if (index >= 0) return { district: d, building: d.buildings[index], index };
  }
  return null;
}

export function locateRoom(id: string): { district: District; building: Building; buildingIndex: number; room: Room; index: number } | null {
  for (const d of WORLD.districts) for (let bi = 0; bi < d.buildings.length; bi++) {
    const index = d.buildings[bi].rooms.findIndex((r) => r.id === id);
    if (index >= 0) return { district: d, building: d.buildings[bi], buildingIndex: bi, room: d.buildings[bi].rooms[index], index };
  }
  return null;
}

export const buildingName = (d: District, bi: number) => infoOf(d).buildings[bi]?.name ?? '';
export const roomName = (d: District, bi: number, ri: number) => infoOf(d).buildings[bi]?.rooms[ri]?.name ?? `Salle ${ri + 1}`;
export const roomLabel = (d: District, bi: number, ri: number) => `Salle ${ri + 1} · ${roomName(d, bi, ri)}`;

/** Where "Continuer" leads, and the district the player is in. */
export function current(p: Progression, s: GameState): { lantern: Lantern | null; district: District } {
  const lantern = p.recommended(s);
  const place = lantern ? p.locate(lantern.puzzle) : s.lastPuzzle ? p.locate(s.lastPuzzle) : null;
  return { lantern, district: place?.district ?? WORLD.districts[0] };
}

export function districtState(p: Progression, s: GameState, d: District, currentId: string): 'locked' | 'open' | 'current' {
  if (!p.isDistrictUnlocked(d, p.totalLights(s), p.letters(s))) return 'locked';
  return d.id === currentId ? 'current' : 'open';
}

export function districtViews(p: Progression, s: GameState): DistrictView[] {
  const cur = current(p, s).district.id;
  const total = p.totalLights(s);
  return WORLD.districts.map((d) => {
    const all = districtLanterns(d), lit = p.lights(all, s), info = infoOf(d);
    const state = districtState(p, s, d, cur);
    const need = d.unlock.kind === 'always' ? 0 : d.unlock.lights;
    return {
      id: d.id, hue: info.hue, state, lit: lit / all.length, name: info.short,
      label: state === 'locked' ? `◌ ${need} lumières` : `${lit} / ${all.length}`,
      total, need,
    } as DistrictView & { total: number; need: number };
  });
}

export function unlockText(d: District, total: number, letters: number): string {
  if (d.unlock.kind === 'always') return '';
  if (d.unlock.kind === 'totalLights') return `S’ouvre à ${d.unlock.lights} lumières. Encore ${Math.max(0, d.unlock.lights - total)}.`;
  const parts: string[] = [];
  if (total < d.unlock.lights) parts.push(`${d.unlock.lights - total} lumières`);
  if (letters < d.unlock.letters) parts.push(`${d.unlock.letters - letters} lettre${d.unlock.letters - letters > 1 ? 's' : ''} de l’Allumeur`);
  return parts.length ? `Il manque encore ${parts.join(' et ')}.` : '';
}

export interface BuildingRow { building: Building; index: number; name: string; open: boolean; lit: number; total: number; lockText: string; complete: boolean }

export function buildingRows(p: Progression, s: GameState, d: District): BuildingRow[] {
  const unlocked = p.isDistrictUnlocked(d, p.totalLights(s), p.letters(s));
  return d.buildings.map((b, i) => {
    const all = buildingLanterns(b), lit = p.lights(all, s);
    const open = unlocked && p.isBuildingOpen(d, i, s);
    const prev = i > 0 ? buildingName(d, i - 1) : '';
    return {
      building: b, index: i, name: buildingName(d, i), open, lit, total: all.length, complete: lit === all.length,
      lockText: !unlocked ? unlockText(d, p.totalLights(s), p.letters(s)) : open ? '' : `Allume ${p.rules.previousBuildingLights} lanternes à ${prev}`,
    };
  });
}

export interface RoomRow { room: Room | null; index: number; label: string; lit: number; total: number; state: 'done' | 'current' | 'open' | 'locked'; lockText: string; key: boolean }

export function roomRows(p: Progression, s: GameState, d: District, bi: number, currentLantern: Lantern | null): RoomRow[] {
  const b = d.buildings[bi];
  const rows: RoomRow[] = b.rooms.map((r, ri) => {
    const lit = p.lights(r.lanterns, s), open = p.isRoomOpen(b, ri, s);
    const isCurrent = !!currentLantern && r.lanterns.some((l) => l.puzzle === currentLantern.puzzle);
    const prev = ri > 0 ? b.rooms[ri - 1] : null;
    return {
      room: r, index: ri, label: b.rooms.length === 1 ? roomName(d, bi, ri) : `Salle ${ri + 1}`, lit, total: r.lanterns.length, key: false,
      state: !open ? 'locked' : lit === r.lanterns.length ? 'done' : isCurrent ? 'current' : 'open',
      lockText: open || !prev ? '' : `${lightsToOpenNextRoom(prev.lanterns.length, p.rules)} lanternes en Salle ${ri}`,
    };
  });
  if (b.keystone) {
    const open = p.isKeystoneOpen(b, s), lit = s.solved.has(b.keystone.puzzle) ? 1 : 0;
    rows.push({ room: null, index: rows.length, label: 'Lanterne-clé', lit, total: 1, key: true, state: !open ? 'locked' : lit ? 'done' : 'open', lockText: open ? '' : `${Math.min(p.rules.keystoneLights, regularLanterns(b).length)} lanternes dans le bâtiment` });
  }
  return rows;
}

/** Collectible id of a room (as credited by the engine). */
export const collectibleOf = (roomId: string) => `collectible.${roomId}`;

/** Every room of the world, in order, with its object. */
export function allRooms(): { district: District; bi: number; ri: number; room: Room; object: { name: string; story: string } }[] {
  const out: { district: District; bi: number; ri: number; room: Room; object: { name: string; story: string } }[] = [];
  for (const d of WORLD.districts) d.buildings.forEach((b, bi) => b.rooms.forEach((room, ri) => {
    out.push({ district: d, bi, ri, room, object: infoOf(d).buildings[bi].rooms[ri].object });
  }));
  return out;
}
