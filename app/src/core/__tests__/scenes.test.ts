import pack from '../../content/generated/pack.json';
import { HIT_H, HIT_W, auditScenes, placeOnScreen, roomSlotsOf, sceneXml } from '../../ui/scenes';
import { objectGlyph } from '../../ui/scenes/objects';
import { DISTRICT_INFO } from '../../content/vesper';

const rooms: [string, number][] = [];
for (const d of (pack as any).world.districts) for (const b of d.buildings) for (const r of b.rooms) rooms.push([r.id, r.lanterns.length]);

describe('room scenes', () => {
  test('every room has its own scene, with enough spaced lantern places, all on screen', () => {
    expect(rooms).toHaveLength(101);
    expect(auditScenes(Object.fromEntries(rooms))).toEqual([]);
  });

  // Phone sizes (scene area): SE, 15, 15 Pro Max, iPad mini portrait.
  test.each([[375, 470], [393, 520], [430, 600], [744, 700]])('no two lanterns share a touch area on a %i × %i scene', (w, h) => {
    for (const [id, n] of rooms) {
      const p = roomSlotsOf(id, n).map((s) => placeOnScreen(s, w, h));
      for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
        const k = Math.min(1, Math.max(w / 390, h / 560));
        const overlap = Math.abs(p[i].x - p[j].x) < HIT_W * k && Math.abs(p[i].y - p[j].y) < HIT_H * k;
        if (overlap) throw new Error(`${id}: lanterns ${i + 1} and ${j + 1} overlap on ${w}×${h}`);
      }
    }
  });

  test('scenes change with the light, and lanterns have distinct names', () => {
    const [id, n] = rooms[10];
    const dark = sceneXml(id, n, { t: 0, lit: Array(n).fill(false), complete: false });
    const lit = sceneXml(id, n, { t: 1, lit: Array(n).fill(true), complete: true });
    expect(dark).not.toEqual(lit);
    for (const [rid, k] of rooms) { const names = roomSlotsOf(rid, k).map((s) => s.label); expect(new Set(names).size).toBe(names.length); }
  });

  test('every object of Vesper has its own picture', () => {
    const objects = DISTRICT_INFO.flatMap((d) => d.buildings.flatMap((b) => b.rooms.map((r) => r.object.name)));
    for (const o of objects) expect(objectGlyph(o)).toBeTruthy();
  });
});
