// Suggests free spots (floor first, then wall) in rooms that lack lantern places.
import pack from '../../app/src/content/generated/pack.json';
import { anchorsOf, auditScenes, roomSlotsOf, ROOM_SPECS } from '../../app/src/ui/scenes';
const counts: Record<string, number> = {};
for (const d of (pack as any).world.districts) for (const b of d.buildings) for (const r of b.rooms) counts[r.id] = r.lanterns.length;
const bad = [...new Set(auditScenes(counts).map((l) => l.split(':')[0]))];
const apart = (ax: number, ay: number, bx: number, by: number) => Math.abs(ax - bx) >= 52 || Math.abs(ay - by) >= 56;
for (const id of bad) {
  const all = [...anchorsOf(ROOM_SPECS[id]).map((a) => ({ x: a[0], y: a[1] })), ...roomSlotsOf(id, counts[id])];
  const free = (x: number, y: number) => all.every((a) => apart(a.x, a.y, x, y));
  const floor: number[][] = [], wall: number[][] = [];
  for (let x = 34; x <= 356; x += 8) if (free(x, 480)) floor.push([x, 520]);
  for (let y = 170; y <= 340; y += 10) for (let x = 40; x <= 350; x += 10) if (free(x, y - 4)) wall.push([x, y]);
  console.log(id, ROOM_SPECS[id].arch, 'wall', JSON.stringify(wall.slice(0, 3)), 'floor', JSON.stringify(floor.slice(0, 3)));
}
