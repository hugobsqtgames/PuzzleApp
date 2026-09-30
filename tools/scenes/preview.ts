// Renders room scenes to an HTML contact sheet (dark and lit), for review.
// cd app && npx tsx ../tools/scenes/preview.ts out.html [prefix]
import { writeFileSync } from 'fs';
import { sceneXml, roomSlotsOf, ROOM_SPECS } from '../../app/src/ui/scenes';

const [out, prefix = ''] = process.argv.slice(2);
const ids = Object.keys(ROOM_SPECS).filter((id) => id.startsWith(prefix));
const n = (id: string) => (id.startsWith('phare') ? 6 : id.startsWith('grenier') ? 16 : id.endsWith('r4') ? 9 : 10);
let html = '<html><body style="margin:0;background:#222;display:flex;flex-wrap:wrap;gap:6px;padding:6px;font:11px sans-serif;color:#ddd">';
for (const id of ids) {
  const k = n(id);
  for (const t of [0.2, 1]) {
    const lit = [...Array(k)].map((_, i) => i < Math.round(k * t));
    const svg = sceneXml(id, k, { t, lit, complete: t === 1, object: 'Clé qui n’ouvre rien', digit: 7 }).replace('<svg ', '<svg width="234" height="336" ');
    const slots = roomSlotsOf(id, k);
    const marks = slots.map((s, i) => `<div style="position:absolute;left:${s.x * .6 - 7}px;top:${s.y * .6 - 10}px;width:14px;height:19px;border-radius:6px;background:${lit[i] ? '#F4B45E' : '#141833'};border:1.5px solid ${lit[i] ? '#FFE6B0' : '#5a62a8'};font-size:8px;color:${lit[i] ? '#000' : '#aaa'};text-align:center;line-height:18px" title="${s.label}">${i + 1}</div>`).join('');
    html += `<div><div style="position:relative;width:234px;height:336px;overflow:hidden">${svg}${marks}</div><div style="width:234px">${id} ${t === 1 ? 'lit' : ''}<br>${t === 1 ? slots.map((s) => s.label).join(' · ') : ''}</div></div>`;
  }
}
writeFileSync(out, html + '</body></html>');
console.log(ids.length, 'rooms');
