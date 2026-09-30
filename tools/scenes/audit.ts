// Lists scene problems: missing rooms, too few anchors, overlapping or off-screen lanterns, twin labels.
import pack from '../../app/src/content/generated/pack.json';
import { auditScenes } from '../../app/src/ui/scenes';
const counts: Record<string, number> = {};
for (const d of (pack as any).world.districts) for (const b of d.buildings) for (const r of b.rooms) counts[r.id] = r.lanterns.length;
const prefix = process.argv[2] ?? '';
const out = auditScenes(Object.fromEntries(Object.entries(counts).filter(([k]) => k.startsWith(prefix))));
out.forEach((l) => console.log(l));
console.log(out.length, 'problems');
