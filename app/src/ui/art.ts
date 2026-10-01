// Vector art of the prototype (prototype/index.html §§ 3–5), as SVG strings
// for react-native-svg's SvgXml. Shapes, colours and numbers are the
// prototype's; the Horlogerie drawings are generalised to every district
// (roof styles, colour, sleeping keeper) and every building and room.
import { T, SVG_SERIF_BOLD, SVG_SERIF_ITALIC } from './theme';
import { COSMETICS } from '../game/rewards';

import { hex2rgb, mix, rng } from './color';

let uidCounter = 0;
const uid = (p: string) => `${p}${++uidCounter}`;
export { hex2rgb, mix, rng };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

// MARK: - Icons (1.5 stroke, 24 grid)
export const IC: Record<string, string> = {
  SU: '<circle cx="5" cy="15.5" r="1.6"/><circle cx="11" cy="13.5" r="2.6"/><circle cx="18.5" cy="11" r="3.6"/>',
  LA: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 6.5v2"/><rect x="9.2" y="8.5" width="5.6" height="7.5" rx="1.8"/><path d="M10.2 17.5h3.6"/>',
  CA: '<path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"/><circle cx="12" cy="15" r="5.5"/><path d="M12 13v2.2"/>',
  EN: '<circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.8"/><path d="M12 3.5v2.2M12 18.3v2.2M4.6 7.75l1.9 1.1M17.5 15.15l1.9 1.1M4.6 16.25l1.9-1.1M17.5 8.85l1.9-1.1"/>',
  BA: '<path d="M12 4v15M4.5 7h15M8 20h8"/><path d="M4.5 7l-2 6h4zM19.5 7l-2 6h4z"/><path d="M2.5 13a2 2 0 0 0 4 0M17.5 13a2 2 0 0 0 4 0"/>',
  IN: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  EG: '<path d="M8.5 8.5a3.5 3.5 0 1 1 5.2 3.1c-1 .6-1.7 1.3-1.7 2.6v.8"/><path d="M12 19h.01"/>',
  MA: '<path d="M4 4h6v6h6v6H4z"/><path d="M13 4h7v7h-4"/>',
  ME: '<path d="M3.5 6.5c3-1.5 6-1.5 8 0v5a4 4 0 0 1-8 0z"/><path d="M12.5 9.5c2-1.5 5-1.5 8 0v5a4 4 0 0 1-8 0"/><path d="M6 10h.01M9 10h.01M15 13h.01M18 13h.01"/>',
  EQ: '<path d="M3.5 3.5h9v9h-9zM3.5 8h9M8 3.5v9"/><circle cx="15.5" cy="15.5" r="3.8"/><path d="M18.3 18.3l2.4 2.4"/>',
  MO: '<rect x="3.5" y="3.5" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="3.5" width="4.5" height="4.5" rx="1"/><rect x="16" y="3.5" width="4.5" height="4.5" rx="1"/><rect x="3.5" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="16" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="3.5" y="16" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="16" width="4.5" height="4.5" rx="1"/><rect x="16" y="16" width="4.5" height="4.5" rx="1" stroke-dasharray="2 2"/>',
  FI: '<path d="M4 19V9a3 3 0 0 1 6 0v6a3 3 0 0 0 6 0V5"/><circle cx="4" cy="19.5" r="1.3"/><circle cx="16" cy="4" r="1.3"/><path d="M20 4v16"/>',
  MI: '<path d="M3 13h8l4-8"/><path d="M8 18l8-8" stroke-width="2.2"/><path d="M15 5l1.6 3.4"/>',
  CR: '<path d="M6 16V11a6 6 0 0 1 12 0v5"/><path d="M4 16h16M12 16v3"/><circle cx="12" cy="20" r="1"/><path d="M20 5l1-1M4 5L3 4M12 3V2"/>',
  VI: '<path d="M5 21V10a7 7 0 0 1 14 0v11z"/><path d="M5 14h14M12 3v18"/>',
  DI: '<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/><circle cx="7" cy="10" r="1.6"/><circle cx="17" cy="14" r="2.4"/>',
  ET: '<path d="M3 19h18M3 11h18"/><rect x="5" y="5" width="3" height="6" rx=".8"/><rect x="10" y="7" width="4" height="4" rx="2"/><path d="M17 11l1.5-5 1.5 5"/><rect x="6" y="14" width="4" height="5" rx="1"/><rect x="13" y="13" width="3" height="6" rx=".8"/>',
  OM: '<path d="M4 5h5v5H4zM9 10h5v5H9"/><path d="M14 19h6v-6" stroke-dasharray="2 2"/>',
  SC: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>',
  BR: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8l3 3M11 8l-3 3M13 13l3 3M16 13l-3 3M13 8h3M8 16h3"/>',
  SG: '<rect x="3" y="7" width="7" height="10" rx="2"/><rect x="14" y="7" width="7" height="10" rx="2"/><path d="M12.8 10l-1.6 2 1.6 2"/>',
  TO: '<path d="M3 21V12l4-3 4 3v9M11 21V8l4-3 4 3v13M3 21h18"/><path d="M16 5V2"/>',
  GL: '<path d="M3 17c4 2 14 2 18 0"/><circle cx="8" cy="11" r="3"/><path d="M13 11h7M15 8h4M15 14h4"/>',
  TQ: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M15 17h5M17.5 14.5l2.5 2.5-2.5 2.5"/>',
  RU: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h6a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H11a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6"/>',
  LU: '<path d="M6 21V11M3 11h6l-1-4H4z"/><circle cx="16" cy="9" r="2.5"/><path d="M16 6.5c-2-3-5-2-4 0M16 6.5c2-3 5-2 4 0"/><path d="M14 16h.01M19 14h.01"/>',
  PA: '<circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="19" cy="19" r="3"/><path d="M8 5.2h8M8 6.8h8M19 9v7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pause: '<path d="M9 6v12M15 6v12"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  map: '<path d="M3 6l6-2.5 6 2.5 6-2.5v15L15 21l-6-2.5L3 21z"/><path d="M9 3.5v15M15 6v15"/>',
  shard: '<path d="M12 2.5l6.5 7.5L12 21.5 5.5 10z"/><path d="M5.5 10h13M12 2.5 9.5 10 12 21.5l2.5-11.5z"/>',
  light: '<path d="M12 21c-3.3 0-5.5-2.3-5.5-5.3 0-3.7 3.3-5.2 4.2-9.7 2.6 1.6 6.8 5.2 6.8 9.7 0 3-2.2 5.3-5.5 5.3z"/><path d="M12 21c-1.4 0-2.4-1-2.4-2.4 0-1.8 1.5-2.6 2.4-4.4.9 1.8 2.4 2.6 2.4 4.4 0 1.4-1 2.4-2.4 2.4z"/>',
  lock: '<path d="M8 10V8a4 4 0 0 1 8 0v2"/><rect x="5.5" y="10" width="13" height="10.5" rx="3"/><path d="M12 14v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M7 7l10 10M17 7L7 17"/>',
  whisper: '<path d="M4 16c0-5 3.5-9 8-11"/><path d="M8 18c0-3.5 2-6.5 5-8"/><path d="M12 20c0-2 1-4 3-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  star: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
  moonI: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  music: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  shield: '<path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  chev: '<path d="M9 5l7 7-7 7"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  hint: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  letter: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  share: '<path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
};
export const iconXml = (name: string, color: string, sw = 1.6) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[name] ?? ''}</svg>`;

// MARK: - Nilo

export type Mood = 'neutral' | 'curious' | 'think' | 'joy' | 'oops' | 'hint' | 'wonder' | 'sleep';
export interface Look { flame?: string; hat?: string; scarf?: string; comp?: string }

export const flameColor = (id = 'amber') => COSMETICS.find((c) => c.id === `flame.${id}`)?.color ?? T.amber;

const HATS: Record<string, string> = {
  none: '',
  bonnet: '<path d="M45 40q13-26 27-1q-13 5-27 1z" fill="#34407F"/><path d="M44 40q14 6 29 0" stroke="#F4B45E" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="60" cy="16" r="4.5" fill="#F4B45E"/>',
  glasses: '<circle cx="47" cy="66" r="10" fill="none" stroke="#D8B56A" stroke-width="2.2"/><circle cx="69" cy="66" r="10" fill="none" stroke="#D8B56A" stroke-width="2.2"/><path d="M57 65h2" stroke="#D8B56A" stroke-width="2.2"/>',
  ivy: '<g fill="#7FC8A9"><ellipse cx="46" cy="37" rx="5" ry="3" transform="rotate(-30 46 37)"/><ellipse cx="54" cy="34" rx="5" ry="3" transform="rotate(-10 54 34)"/><ellipse cx="63" cy="34" rx="5" ry="3" transform="rotate(10 63 34)"/><ellipse cx="71" cy="37" rx="5" ry="3" transform="rotate(30 71 37)"/></g>',
  astro: '<path d="M46 40a13 11 0 0 1 26 0z" fill="#2C4A7A"/><path d="M42 40h34" stroke="#8FB8F0" stroke-width="3" stroke-linecap="round"/><path d="M59 27l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#FFD98E"/>',
  loupe: '<path d="M79 60q6-10 4-22" stroke="#6b5a3c" stroke-width="2" fill="none"/><circle cx="69" cy="66" r="11" fill="#8FD3E0" opacity=".18"/><circle cx="69" cy="66" r="11" fill="none" stroke="#D8B56A" stroke-width="3"/>',
  straw: '<ellipse cx="59" cy="39" rx="25" ry="5" fill="#D9B45E"/><path d="M47 39q2-14 12-14t12 14z" fill="#E7C774"/><path d="M47.5 36h23" stroke="#B5553F" stroke-width="3"/>',
  mask: '<path d="M44 42q15-9 30 0q-2 8-8 7q-4-4-7 0q-3-4-7 0q-6 1-8-7z" fill="#EFE8D8"/><ellipse cx="52" cy="43" rx="3" ry="2" fill="#1E2347"/><ellipse cx="66" cy="43" rx="3" ry="2" fill="#1E2347"/>',
  crown: '<path d="M46 40l3-11 5 7 5-9 5 9 5-7 3 11z" fill="#FFD98E" stroke="#D9953F" stroke-width="1" stroke-linejoin="round"/><circle cx="59" cy="31" r="1.6" fill="#E88A8A"/>',
  beret: '<ellipse cx="61" cy="38" rx="15" ry="6" fill="#B5553F"/><path d="M47 40q14 4 28 0" stroke="#8a3d2d" stroke-width="1.5" fill="none"/><path d="M61 32v-4" stroke="#B5553F" stroke-width="2" stroke-linecap="round"/>',
  top: '<rect x="49" y="18" width="20" height="21" rx="2" fill="#1B1F3A"/><rect x="43" y="37" width="32" height="4" rx="2" fill="#1B1F3A"/><rect x="49" y="31" width="20" height="4" fill="#F4B45E"/>',
  nightcap: '<path d="M45 41q10-24 30-16q6 3 9 14" fill="#5C8FE0"/><path d="M44 41q15 5 31 0" stroke="#EFE8D8" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="85" cy="40" r="4" fill="#EFE8D8"/>',
  flowers: '<g><circle cx="45" cy="38" r="3.4" fill="#F29BC4"/><circle cx="52" cy="34" r="3.4" fill="#FFD98E"/><circle cx="60" cy="33" r="3.4" fill="#B79CE0"/><circle cx="68" cy="34" r="3.4" fill="#F29BC4"/><circle cx="75" cy="38" r="3.4" fill="#FFD98E"/></g><g fill="#FFF3D6"><circle cx="45" cy="38" r="1.2"/><circle cx="52" cy="34" r="1.2"/><circle cx="60" cy="33" r="1.2"/><circle cx="68" cy="34" r="1.2"/><circle cx="75" cy="38" r="1.2"/></g>',
  witch: '<path d="M42 41q17 5 34 0l-3-3q-14 3-28 0z" fill="#2a1030"/><path d="M48 39q5-14 10-24q4-6 12-6q-6 3-7 9l3 21q-9 2-18 0z" fill="#2a1030"/><path d="M48.5 36q9 2 17 0" stroke="#F28C28" stroke-width="2.6" fill="none"/><rect x="55" y="33" width="5" height="4" rx="1" fill="#FFD98E"/>',
  santa: '<path d="M45 41q8-22 26-18q8 2 12 14" fill="#D9473F"/><path d="M44 41q15 5 31 0" stroke="#FFF7EC" stroke-width="4.2" fill="none" stroke-linecap="round"/><circle cx="84" cy="38" r="4.4" fill="#FFF7EC"/>',
  cap: '<path d="M46 40a13 10 0 0 1 26 0z" fill="#EFE8D8"/><path d="M44 40h31" stroke="#1E2347" stroke-width="3" stroke-linecap="round"/><path d="M68 40q10 0 13 3" stroke="#1E2347" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 33l3 2 3-2" stroke="#3A4D8A" stroke-width="1.6" fill="none"/>',
};
const SCARVES: Record<string, string> = {
  none: '',
  knit: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#B5553F"/><path d="M70 88l6 16-7 1-4-15z" fill="#B5553F"/><path d="M34 86q24 10 49 0" stroke="#E8894A" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>',
  spice: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#C98A2E"/><path d="M40 90l-8 14 8-2 5-10z" fill="#C98A2E"/><g fill="#EE8A6B"><circle cx="45" cy="89" r="1.6"/><circle cx="58" cy="91" r="1.6"/><circle cx="71" cy="89" r="1.6"/></g>',
  ribbon: '<path d="M32 84q26 11 52 0l.5 5q-26 11-53 0z" fill="#8E5BA6"/><path d="M58 92l-9-7v12zM58 92l9-7v12z" fill="#C39BD3"/><circle cx="58" cy="92" r="2.6" fill="#8E5BA6"/>',
  stripes: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#3A4D8A"/><path d="M70 88l6 16-7 1-4-15z" fill="#3A4D8A"/><path d="M38 86l-1 8M48 88l-1 8M58 89v8M68 88l1 8M78 86l1 7" stroke="#EFE8D8" stroke-width="2"/>',
  star: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#22264A"/><path d="M40 90l-8 14 8-2 5-10z" fill="#22264A"/><g fill="#FFD98E"><circle cx="42" cy="88" r="1.3"/><circle cx="52" cy="91" r="1.8"/><circle cx="63" cy="90" r="1.3"/><circle cx="74" cy="88" r="1.8"/></g>',
  gold: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#D9953F"/><path d="M70 88l6 16-7 1-4-15z" fill="#D9953F"/><path d="M33 84q25 11 51 0" stroke="#FFE6B0" stroke-width="1.4" fill="none"/>',
  lavender: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#9A85C8"/><path d="M70 88l6 16-7 1-4-15z" fill="#9A85C8"/><path d="M34 86q24 10 49 0" stroke="#D8CCF0" stroke-width="1.2" fill="none"/>',
  bow: '<path d="M58 88l-10-7v14zM58 88l10-7v14z" fill="#E0625A"/><circle cx="58" cy="88" r="3" fill="#B5453F"/>',
  holly: '<path d="M31 82q27 13 54 0l1 9q-28 13-56 0z" fill="#2E7D5B"/><path d="M70 88l6 16-7 1-4-15z" fill="#2E7D5B"/><g fill="#7FC8A9"><ellipse cx="44" cy="89" rx="4" ry="2" transform="rotate(-20 44 89)"/><ellipse cx="51" cy="91" rx="4" ry="2" transform="rotate(20 51 91)"/></g><g fill="#E0625A"><circle cx="47" cy="90" r="1.8"/><circle cx="49" cy="88" r="1.8"/></g>',
};
const COMPANIONS: Record<string, string> = {
  none: '',
  firefly: '<circle cx="18" cy="40" r="7" fill="#FFE39A" opacity=".25"/><circle cx="18" cy="40" r="2.8" fill="#FFE39A"/>',
  leaf: '<path d="M14 44q6-12 16-8q-4 11-16 8z" fill="#7FC8A9"/><path d="M15 43l12-6" stroke="#3f7f66" stroke-width="1"/>',
  gear: '<g transform="translate(18 40)"><circle r="6.5" fill="none" stroke="#D8B56A" stroke-width="3" stroke-dasharray="3 2"/><circle r="2" fill="#D8B56A"/></g>',
  moth: '<g transform="translate(18 40)"><path d="M0 0q-9-8-10 1q4 5 10-1zM0 0q9-8 10 1q-4 5-10-1z" fill="#C8B8A0"/><path d="M0-3v7" stroke="#6b5a3c" stroke-width="1.6" stroke-linecap="round"/></g>',
  pumpkin: '<g transform="translate(18 42)"><ellipse rx="8" ry="6.5" fill="#F28C28"/><path d="M-3-6q3 4 0 12M3-6q-3 4 0 12" stroke="#C86A1A" stroke-width="1" fill="none"/><path d="M0-6v-4" stroke="#6b8f3a" stroke-width="2"/><path d="M-4 0l1.5-1.5 1.5 1.5M1 0l1.5-1.5 1.5 1.5M-3 3q3 2 6 0" stroke="#3b1640" stroke-width="1" fill="none"/></g>',
  snowflake: '<g transform="translate(18 40)" stroke="#EAF6FF" stroke-width="1.8" stroke-linecap="round"><path d="M0-8v16M-7-4l14 8M-7 4l14-8"/><path d="M-2-6l2 2 2-2M-2 6l2-2 2 2" fill="none"/></g>',
  comet: '<path d="M10 50l12-10" stroke="#8FB8F0" stroke-width="3" stroke-linecap="round" opacity=".5"/><path d="M22 36l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#FFD98E"/>',
  kite: '<path d="M12 28l8-8 8 8-8 10z" fill="#E88A8A"/><path d="M12 28h16M20 20v18" stroke="#b5553f" stroke-width=".8"/><path d="M20 38q-4 7 1 13q4 5 0 10" stroke="#EFE8D8" stroke-width="1" fill="none"/>',
  fish: '<g transform="translate(18 42)"><ellipse rx="7" ry="4" fill="#BFE6F0"/><path d="M6 0l5-4v8z" fill="#BFE6F0"/><circle cx="-3" cy="-1" r="1" fill="#0D0F1E"/></g>',
  butterfly: '<g transform="translate(18 40)"><path d="M0 0q-10-10-11 0q4 6 11 0zM0 0q10-10 11 0q-4 6-11 0z" fill="#8FB8F0"/><path d="M0 0q-7 4-6 9q4 0 6-9zM0 0q7 4 6 9q-4 0-6-9z" fill="#B79CE0"/><path d="M0-4v8" stroke="#1E2347" stroke-width="1.4" stroke-linecap="round"/></g>',
  cloud: '<g transform="translate(18 36)"><path d="M-9 4a5 5 0 0 1 2-9a6 6 0 0 1 11-1a5 5 0 0 1 5 10z" fill="#EFE8D8" opacity=".9"/><circle cx="-3" cy="0" r=".9" fill="#1E2347"/><circle cx="2" cy="0" r=".9" fill="#1E2347"/></g>',
  bird: '<g transform="translate(18 40)"><ellipse rx="6.5" ry="5" fill="#E88A8A"/><circle cx="4" cy="-3" r="3.4" fill="#E88A8A"/><path d="M7 -3l4 1-4 1.5z" fill="#F4B45E"/><circle cx="5" cy="-4" r=".9" fill="#0D0F1E"/><path d="M-3 0q-4-6-8-3q3 4 8 3z" fill="#B5553F"/></g>',
  lantern: '<g transform="translate(18 38)"><circle r="9" fill="#F4B45E" opacity=".25"/><rect x="-4" y="-6" width="8" height="11" rx="2.5" fill="#F4B45E"/><rect x="-2.5" y="-9" width="5" height="3" fill="#6b5a3c"/><circle cy="-1" r="1.8" fill="#FFF3D6"/></g>',
};

/** Pivots of Nilo's moving parts, in its 132 × 120 drawing. */
export const NILO_PIVOTS = { tail: [84, 96], flame: [104, 31], earL: [43, 50], earR: [73, 50], body: [58, 106], eyes: [58, 66] } as const;

export interface NiloParts { back: string; tail: string; flame: string; earL: string; earR: string; body: string; eyes: string; deco: string }

/** Nilo in separate layers (same drawing as the prototype), so that each part can move on its own. */
export function niloParts(mood: Mood = 'neutral', look: Look = {}): NiloParts {
  const fc = flameColor(look.flame);
  const id = uid('n');
  const body = '#1E2347', hi = '#2C3266', inner = '#3A4180';
  const M = ({
    neutral: { el: 0, er: 0, fs: 1 }, curious: { el: -8, er: 14, fs: 1.05 }, think: { el: -14, er: -14, fs: 0.8 },
    joy: { el: 8, er: -8, fs: 1.4 }, oops: { el: -28, er: 28, fs: 0.85 }, hint: { el: 0, er: -16, fs: 1.15 },
    wonder: { el: 12, er: -12, fs: 1.5 }, sleep: { el: -32, er: 32, fs: 0.6 },
  } as Record<Mood, { el: number; er: number; fs: number }>)[mood];
  const fcol = mood === 'sleep' ? '#E8744A' : mood === 'wonder' && !look.flame ? '#BFE6F0' : fc;
  const ey = '#FFE6B0';
  let eyes: string;
  if (mood === 'joy') eyes = `<path d="M42 67q5-7 10 0M64 67q5-7 10 0" stroke="${ey}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M53 79q5 5 10 0" stroke="${ey}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  else if (mood === 'sleep') eyes = `<path d="M42 68q5 3 10 0M64 68q5 3 10 0" stroke="${ey}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  else if (mood === 'oops') eyes = `<path d="M43 62l7 4.5-7 4.5M73 62l-7 4.5 7 4.5" stroke="${ey}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  else {
    const ry = ({ think: 2.6, wonder: 9, curious: 8 } as Record<string, number>)[mood] ?? 7, rx = mood === 'wonder' ? 6 : 5;
    eyes = `<ellipse cx="47" cy="66" rx="${rx + 4}" ry="${ry + 4}" fill="${ey}" opacity=".12"/><ellipse cx="69" cy="66" rx="${rx + 4}" ry="${ry + 4}" fill="${ey}" opacity=".12"/><ellipse cx="47" cy="66" rx="${rx}" ry="${ry}" fill="${ey}"/><ellipse cx="69" cy="66" rx="${rx}" ry="${ry}" fill="${ey}"/><circle cx="48.5" cy="${66 - ry * 0.35}" r="1.5" fill="#FFFFFF" opacity=".75"/><circle cx="70.5" cy="${66 - ry * 0.35}" r="1.5" fill="#FFFFFF" opacity=".75"/>`;
  }
  const sparkle = mood === 'joy' || mood === 'wonder'
    ? `<g fill="${T.gold}"><path d="M120 14l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/><path d="M90 12l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/><path d="M124 44l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></g>` : '';
  const zz = mood === 'sleep' ? `<text x="84" y="40" fill="${T.tx2}" font-family="${SVG_SERIF_ITALIC}" font-size="12">z</text><text x="92" y="30" fill="${T.tx2}" font-family="${SVG_SERIF_ITALIC}" font-size="9">z</text>` : '';
  const fs = M.fs;
  const svg = (inner: string) => `<svg viewBox="0 0 132 120">${inner}</svg>`;
  return {
    back: svg(COMPANIONS[look.comp ?? 'none'] ?? ''),
    tail: svg(`<path d="M84 94c18 2 28-14 22-30-4-10-6-18-2-24" stroke="${body}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`),
    flame: svg(`<defs><radialGradient id="${id}g"><stop offset="0" stop-color="${fcol}" stop-opacity=".75"/><stop offset=".45" stop-color="${fcol}" stop-opacity=".25"/><stop offset="1" stop-color="${fcol}" stop-opacity="0"/></radialGradient></defs>
      <circle cx="104" cy="31" r="${24 * fs}" fill="url(#${id}g)"/><circle cx="104" cy="31" r="${9 * fs}" fill="${fcol}"/><circle cx="104" cy="31" r="${4 * fs}" fill="#FFF3D6"/>`),
    earL: svg(`<g transform="rotate(${M.el} 43 50)"><path d="M36 54Q30 30 30 18q1-4 5-1q9 9 15 21z" fill="${body}"/><path d="M38 48Q34 32 34 24q6 7 10 16z" fill="${inner}"/></g>`),
    earR: svg(`<g transform="rotate(${M.er} 73 50)"><path d="M80 54Q86 30 86 18q-1-4-5-1q-9 9-15 21z" fill="${body}"/><path d="M78 48Q82 32 82 24q-6 7-10 16z" fill="${inner}"/></g>`),
    body: svg(`<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${body}"/></linearGradient></defs>
      <path d="M58 34c22 0 32 22 32 42s-14 28-32 28-32-8-32-28 10-42 32-42z" fill="url(#${id}b)"/>
      <ellipse cx="58" cy="90" rx="17" ry="11" fill="${hi}" opacity=".6"/><ellipse cx="47" cy="104" rx="7" ry="3.2" fill="${hi}"/><ellipse cx="69" cy="104" rx="7" ry="3.2" fill="${hi}"/>${SCARVES[look.scarf ?? 'none'] ?? ''}`),
    eyes: svg(eyes + (HATS[look.hat ?? 'none'] ?? '')),
    deco: svg(sparkle + zz),
  };
}

/** The whole of Nilo in one drawing (thumbnails, store). */
export function niloXml(mood: Mood = 'neutral', look: Look = {}): string {
  const p = niloParts(mood, look);
  const inner = (x: string) => x.replace(/^<svg viewBox="0 0 132 120">/, '').replace(/<\/svg>$/, '');
  const tilt = mood === 'curious' ? 'transform="rotate(-6 58 104)"' : '';
  return `<svg viewBox="0 0 132 120">${inner(p.back)}<g ${tilt}>${inner(p.tail)}${inner(p.earL)}${inner(p.earR)}${inner(p.body)}${inner(p.eyes)}</g>${inner(p.flame)}${inner(p.deco)}</svg>`;
}

// MARK: - Vesper building blocks

function stars(w: number, h: number, n: number, seed: number, dx = 0, dy = 0): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rr = r() * 1.2 + 0.4;
    r();
    s += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${rr.toFixed(2)}" fill="#EFE8D8" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

export type Roof = 'peak' | 'dome' | 'flat' | 'spire' | 'clock';

function bld(x: number, y: number, w: number, h: number, roof: Roof, hue: string, lit: number, seed: number): string {
  const r = rng(seed || 7), wallDark = T.dark2;
  const wall = lit > 0 ? mix(wallDark, mix(hue, '#2a2440', 0.55), Math.min(1, 0.25 + lit * 0.6)) : wallDark;
  const roofC = lit > 0 ? mix('#20254a', hue, 0.35) : '#171b36';
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>`;
  if (roof === 'peak') s += `<path d="M${x - 4} ${y}L${x + w / 2} ${y - w * 0.55}L${x + w + 4} ${y}z" fill="${roofC}"/>`;
  if (roof === 'spire') s += `<path d="M${x - 3} ${y}L${x + w / 2} ${y - w * 1.2}L${x + w + 3} ${y}z" fill="${roofC}"/>`;
  if (roof === 'dome') s += `<path d="M${x} ${y}a${w / 2} ${w / 2.2} 0 0 1 ${w} 0z" fill="${roofC}"/>`;
  if (roof === 'clock') s += `<path d="M${x - 4} ${y}L${x + w / 2} ${y - w * 0.6}L${x + w + 4} ${y}z" fill="${roofC}"/><circle cx="${x + w / 2}" cy="${y + w * 0.32}" r="${w * 0.22}" fill="${lit > 0 ? mix(hue, '#ffffff', 0.2) : '#232849'}"/><path d="M${x + w / 2} ${y + w * 0.32}v-${w * 0.14}M${x + w / 2} ${y + w * 0.32}h${w * 0.1}" stroke="${lit > 0 ? '#3a2f1c' : '#171b36'}" stroke-width="1.5"/>`;
  if (roof === 'flat') s += `<rect x="${x - 3}" y="${y - 5}" width="${w + 6}" height="5" fill="${roofC}"/>`;
  const cols = Math.max(1, Math.floor(w / 14)), rows = Math.max(1, Math.floor((h - (roof === 'clock' ? w * 0.6 : 6)) / 18));
  const y0 = y + (roof === 'clock' ? w * 0.6 : 8);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const on = r() < lit, wx = x + (w - cols * 14) / 2 + j * 14 + 4, wy = y0 + i * 18;
    s += `<rect x="${wx.toFixed(1)}" y="${wy}" width="6" height="9" rx="3" fill="${on ? mix(hue, '#FFE6B0', 0.45) : '#10132a'}"/>`;
    if (on) s += `<rect x="${(wx - 3).toFixed(1)}" y="${wy - 3}" width="12" height="15" rx="6" fill="${hue}" opacity=".18"/>`;
  }
  return s;
}

function lighthouse(x: number, y: number, s: number, lit: boolean): string {
  return `<path d="M${x - 9 * s} ${y}L${x - 6 * s} ${y - 60 * s}L${x + 6 * s} ${y - 60 * s}L${x + 9 * s} ${y}z" fill="${lit ? '#3a3558' : '#1B1F3A'}"/>
  <path d="M${x - 7.6 * s} ${y - 20 * s}h${15.2 * s}v${6 * s}h-${15.2 * s}zM${x - 6.8 * s} ${y - 42 * s}h${13.6 * s}v${6 * s}h-${13.6 * s}z" fill="${lit ? '#F4B45E' : '#262B52'}" opacity=".5"/>
  <rect x="${x - 7 * s}" y="${y - 68 * s}" width="${14 * s}" height="${8 * s}" rx="${2 * s}" fill="${lit ? '#FFE6B0' : '#232849'}"/>
  <path d="M${x - 8 * s} ${y - 68 * s}L${x} ${y - 76 * s}L${x + 8 * s} ${y - 68 * s}z" fill="${lit ? '#4a3f63' : '#1B1F3A'}"/>
  ${lit ? `<circle cx="${x}" cy="${y - 64 * s}" r="${22 * s}" fill="#F4B45E" opacity=".2"/><path d="M${x} ${y - 64 * s}L${x - 120 * s} ${y - 80 * s}L${x - 120 * s} ${y - 50 * s}z" fill="#F4B45E" opacity=".07"/>` : ''}`;
}

function island(cx: number, cy: number, w: number, lit: boolean, hue: string): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${w * 0.09}" fill="${lit ? mix('#141833', hue, 0.12) : '#11142a'}"/><ellipse cx="${cx}" cy="${cy + 3}" rx="${w / 2 - 6}" ry="${w * 0.06}" fill="#0a0c1c" opacity=".6"/>`;
}

function fog(cx: number, cy: number, w: number, h: number): string {
  const id = uid('f');
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#141733" stop-opacity=".96"/><stop offset=".55" stop-color="#11142c" stop-opacity=".88"/><stop offset="1" stop-color="#0D0F1E" stop-opacity="0"/></radialGradient></defs><g><ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="url(#${id})"/><ellipse cx="${cx - w * 0.22}" cy="${cy - h * 0.12}" rx="${w * 0.3}" ry="${h * 0.34}" fill="url(#${id})"/><ellipse cx="${cx + w * 0.22}" cy="${cy + h * 0.08}" rx="${w * 0.3}" ry="${h * 0.3}" fill="url(#${id})"/></g>`;
}

export interface DistrictView { id: string; hue: string; state: 'locked' | 'open' | 'current'; lit: number; label: string; name: string; /** Silhouette only ("Vesper s'est éteinte"). */ dark?: boolean }

/** A district drawn around a centre; `lit` (0–1) is the share of its lanterns lit. */
function districtArt(d: DistrictView, cx: number, cy: number, sc: number): string {
  const lit = d.state === 'locked' || d.dark ? 0 : Math.max(0.12, d.lit);
  const h = d.hue;
  let s = island(cx, cy + 2, 170 * sc, lit > 0, h);
  const B = (dx: number, dy: number, w: number, hh: number, roof: Roof, seed: number) => bld(cx + dx * sc, cy - hh * sc + dy * sc, w * sc, hh * sc, roof, h, lit, seed);
  if (d.id === 'phare') s += lighthouse(cx - 10 * sc, cy, sc * 1.1, d.state !== 'locked' && !d.dark) + bld(cx + 18 * sc, cy - 26 * sc, 30 * sc, 26 * sc, 'peak', h, lit, 3);
  if (d.id === 'biblio') s += B(-60, 0, 34, 58, 'peak', 11) + B(-22, 0, 44, 82, 'dome', 12) + B(26, 0, 30, 50, 'peak', 13) + B(58, 0, 22, 36, 'flat', 14);
  if (d.id === 'horlo') s += B(-62, 0, 30, 46, 'peak', 21) + B(-28, 0, 30, 96, 'clock', 22) + B(6, 0, 40, 56, 'flat', 23) + B(48, 0, 28, 70, 'spire', 24);
  if (d.id === 'serre') s += B(-60, 0, 50, 40, 'dome', 31) + B(-6, 0, 60, 54, 'dome', 32) + B(56, 0, 30, 34, 'peak', 33);
  if (d.id === 'marche') s += B(-60, 0, 26, 34, 'peak', 41) + B(-30, 0, 26, 42, 'peak', 42) + B(0, 0, 26, 30, 'peak', 43) + B(30, 0, 34, 46, 'flat', 44) + `<path d="M${cx - 80 * sc} ${cy + 4 * sc}q20 10 40 0" stroke="${lit ? h : '#262B52'}" stroke-width="${2 * sc}" fill="none"/>`;
  if (d.id === 'theatre') s += B(-50, 0, 100, 60, 'dome', 51) + B(-66, 0, 18, 74, 'spire', 52) + B(48, 0, 18, 74, 'spire', 53);
  if (d.id === 'obs') s += B(-30, 0, 60, 40, 'flat', 61) + `<path d="M${cx - 24 * sc} ${cy - 40 * sc}a${24 * sc} ${22 * sc} 0 0 1 ${48 * sc} 0z" fill="${lit ? mix('#20254a', h, 0.35) : '#171b36'}"/><path d="M${cx + 4 * sc} ${cy - 58 * sc}l${26 * sc} -${20 * sc}" stroke="${lit ? h : '#262B52'}" stroke-width="${6 * sc}" stroke-linecap="round"/>` + B(38, 0, 24, 54, 'spire', 62);
  if (d.state === 'locked' && !d.dark) s += fog(cx, cy - 30 * sc, 220 * sc, 120 * sc);
  return s;
}

/** Window on Vesper (home). */
/** The sky over Vesper follows the real time of day. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
export const skyPhase = (hour: number): SkyPhase => (hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'dusk' : 'night');
const SKIES: Record<SkyPhase, { stops: [string, string, string]; stars: number; body: 'moon' | 'sun'; sun?: [number, number, string] }> = {
  night: { stops: ['#080914', '#11142c', '#0D0F1E'], stars: 1, body: 'moon' },
  dawn: { stops: ['#1a1c3c', '#5b4370', '#d98f7a'], stars: 0.35, body: 'sun', sun: [0.2, 0.5, '#FFD3A0'] },
  day: { stops: ['#22385f', '#456691', '#7f9bbd'], stars: 0, body: 'sun', sun: [0.47, 0.13, '#FFF0C8'] },
  dusk: { stops: ['#121636', '#4a2d58', '#cc6a52'], stars: 0.55, body: 'sun', sun: [0.84, 0.46, '#FFB070'] },
};

export function vesperWindowXml(districts: DistrictView[], w: number, h: number, phase: SkyPhase = 'night'): string {
  const gid = uid('g'), glow = uid('s');
  const sky = SKIES[phase];
  const P: [string, number, number, number][] = [['phare', 0.12, 0.86, 0.62], ['biblio', 0.34, 0.7, 0.5], ['horlo', 0.58, 0.62, 0.5], ['serre', 0.8, 0.5, 0.42], ['marche', 0.35, 0.36, 0.34], ['theatre', 0.64, 0.24, 0.3], ['obs', 0.86, 0.14, 0.26]];
  let s = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.stops[0]}"/><stop offset=".7" stop-color="${sky.stops[1]}"/><stop offset="1" stop-color="${sky.stops[2]}"/></linearGradient>
  <radialGradient id="${glow}"><stop offset="0" stop-color="${sky.sun?.[2] ?? '#fff'}" stop-opacity=".55"/><stop offset="1" stop-color="${sky.sun?.[2] ?? '#fff'}" stop-opacity="0"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${gid})"/>`;
  if (sky.stars > 0) s += `<g opacity="${sky.stars}">${stars(w, h * 0.6, 40, 3)}</g>`;
  if (sky.body === 'moon') s += `<circle cx="${w * 0.82}" cy="${h * 0.16}" r="${h * 0.06}" fill="#EFE8D8" opacity=".85"/><circle cx="${w * 0.835}" cy="${h * 0.15}" r="${h * 0.06}" fill="#11142c"/>`;
  else if (sky.sun) {
    const [sx, sy, c] = sky.sun;
    s += `<circle cx="${w * sx}" cy="${h * sy}" r="${h * 0.22}" fill="url(#${glow})"/><circle cx="${w * sx}" cy="${h * sy}" r="${h * 0.055}" fill="${c}"/>`;
  }
  for (const [id, px, py, sc] of P.slice().reverse()) {
    const d = districts.find((x) => x.id === id);
    if (d) s += districtArt(d, px * w, py * h, sc * Math.min(w / 390, h / 230));
  }
  return s + `<rect y="${h * 0.93}" width="${w}" height="${h * 0.07}" fill="#0a0c1c"/></svg>`;
}

export const MAP_W = 390, MAP_H = 1180;
export const MAP_POS: Record<string, [number, number, number]> = {
  phare: [120, 1100, 0.75], biblio: [268, 940, 0.8], horlo: [118, 780, 0.8], serre: [272, 620, 0.75],
  marche: [118, 462, 0.75], theatre: [272, 308, 0.72], obs: [150, 160, 0.72],
};

export function mapXml(districts: DistrictView[]): string {
  const gid = uid('g');
  const W = MAP_W, H = MAP_H, pos = MAP_POS;
  let s = `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset=".5" stop-color="#0a0c1d"/><stop offset="1" stop-color="#101330"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#${gid})"/>${stars(W, H, 120, 9)}`;
  for (let i = 0; i < 14; i++) { const y = (i + 0.5) * H / 14; s += `<path d="M${(i * 53) % W} ${y}q14-4 28 0" stroke="#1d2247" stroke-width="1.2" fill="none"/>`; }
  const ordered = districts.filter((d) => pos[d.id]);
  for (let i = 0; i < ordered.length - 1; i++) {
    const [x1, y1] = pos[ordered[i].id], [x2, y2] = pos[ordered[i + 1].id];
    const on = ordered[i + 1].state !== 'locked';
    const d = `M${x1} ${y1 + 6}C${x1} ${(y1 + y2) / 2},${x2} ${(y1 + y2) / 2},${x2} ${y2 + 6}`;
    s += `<path d="${d}" stroke="${on ? '#6b5a3c' : '#1e2345'}" stroke-width="3" fill="none" ${on ? '' : 'stroke-dasharray="5 7"'}/>`;
    if (on) s += `<path d="${d}" stroke="#F4B45E" stroke-width="1" fill="none" opacity=".5" stroke-dasharray="2 10"/>`;
  }
  for (const d of ordered) {
    const [cx, cy, sc] = pos[d.id];
    s += districtArt(d, cx, cy, sc);
    // The district's resident: asleep until every lantern is lit, then awake and glowing.
    if (d.state !== 'locked') s += keeperArt(d.id, d.lit >= 1, d.hue, cx + (cx < W / 2 ? 58 : -96) * sc, cy - 26 * sc, 0.62);
    if (d.state === 'current') s += `<circle cx="${cx}" cy="${cy - 40 * sc}" r="${70 * sc}" fill="none" stroke="#F4B45E" stroke-width="1.5" opacity=".6"/>`;
    s += `<g transform="translate(${cx},${cy + 26})">
        <rect x="-86" y="-15" width="172" height="44" rx="14" fill="${d.state === 'locked' ? '#11142a' : '#171A2E'}" stroke="${d.state === 'current' ? '#F4B45E' : '#2E3360'}" opacity=".94"/>
        <text x="0" y="1" text-anchor="middle" fill="${d.state === 'locked' ? '#9CA2C6' : '#EFE8D8'}" font-family="${SVG_SERIF_BOLD}" font-size="14.5">${esc(d.name)}</text>
        <text x="0" y="19" text-anchor="middle" fill="${d.state === 'locked' ? '#7A80A8' : d.hue}" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="600">${esc(d.label)}</text>
      </g>`;
  }
  return s + '</svg>';
}

// MARK: - District panorama

export interface BuildingView { name: string; open: boolean; lit: number; selected?: boolean }
/** Building footprints per district (x, width, height, roof), from the Horlogerie of the mockup. */
export const PANORAMA: Record<string, [number, number, number, Roof][]> = {
  phare: [[40, 70, 150, 'peak'], [220, 80, 110, 'flat']],
  biblio: [[18, 70, 140, 'peak'], [104, 84, 190, 'dome'], [204, 64, 120, 'peak'], [284, 58, 160, 'flat']],
  horlo: [[18, 82, 150, 'peak'], [110, 66, 214, 'clock'], [188, 84, 128, 'flat'], [282, 60, 176, 'spire']],
  serre: [[16, 84, 120, 'dome'], [110, 96, 150, 'dome'], [216, 60, 110, 'peak'], [286, 58, 170, 'dome']],
  marche: [[14, 70, 110, 'peak'], [96, 76, 90, 'peak'], [184, 90, 150, 'flat'], [286, 60, 120, 'peak']],
  theatre: [[16, 64, 130, 'spire'], [92, 90, 140, 'dome'], [194, 70, 120, 'spire'], [274, 70, 180, 'dome']],
  obs: [[16, 80, 110, 'flat'], [108, 92, 150, 'dome'], [212, 58, 190, 'spire'], [282, 62, 120, 'flat']],
  grenier: [[120, 120, 170, 'peak']],
};

/** Sleeping (or awake) keeper of the district, at the foot of the buildings. */
function keeperArt(district: string, awake: boolean, hue: string, x = 150, y = 236, scale = 1): string {
  const eyes = awake ? `<circle cx="1" cy="15" r="1.6" fill="#FFE6B0"/>` : `<path d="M-1 15q2 2 4 0" stroke="#9CA2C6" stroke-width="1.2" fill="none"/>`;
  const zz = awake ? '' : `<text x="30" y="2" fill="#9CA2C6" font-family="${SVG_SERIF_ITALIC}" font-size="11">z</text><text x="37" y="-6" fill="#9CA2C6" font-family="${SVG_SERIF_ITALIC}" font-size="8">z</text>`;
  const bodies: Record<string, string> = {
    // Heron with glasses
    biblio: `<ellipse cx="18" cy="22" rx="16" ry="10" fill="#5a6488"/><path d="M8 18q-6-16 2-20" stroke="#5a6488" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="8" cy="-2" r="5" fill="#6b76a0"/><path d="M4 -2l-10 3" stroke="#D8B56A" stroke-width="2"/><circle cx="9" cy="-2" r="2.5" fill="none" stroke="#D8B56A" stroke-width="1"/>`,
    // Mole (the mockup's Horlogère)
    horlo: `<ellipse cx="20" cy="22" rx="24" ry="16" fill="#3a3350"/><ellipse cx="6" cy="18" rx="10" ry="8" fill="#443c5c"/><ellipse cx="-3" cy="19" rx="4" ry="3" fill="#a07a86" opacity=".7"/><circle cx="5" cy="15" r="5" fill="none" stroke="#D8B56A" stroke-width="1" opacity=".6"/>`,
    // Snail
    serre: `<path d="M-4 30h40q4-6-4-8H0z" fill="#6f8f7a"/><circle cx="20" cy="16" r="12" fill="#8a6f45"/><path d="M20 16m0-4a4 4 0 1 1-4 4 8 8 0 0 1 8-8" stroke="#D8B56A" stroke-width="1.6" fill="none"/><path d="M-2 22q-2-8 2-10" stroke="#6f8f7a" stroke-width="2" fill="none"/>`,
    // Otter
    marche: `<ellipse cx="20" cy="22" rx="22" ry="11" fill="#7a5a3c"/><circle cx="2" cy="16" r="8" fill="#8a6848"/><ellipse cx="-3" cy="18" rx="3" ry="2" fill="#d8b89a"/><path d="M40 24q10 2 12 -6" stroke="#7a5a3c" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    // Pangolin
    theatre: `<path d="M-2 26q8-24 36-18q10 4 8 18z" fill="#6b5a7a"/><path d="M6 20l6-6M14 17l6-6M22 16l6-6M30 17l5-5" stroke="#8a7a9a" stroke-width="2"/><circle cx="0" cy="20" r="5" fill="#7a6a8a"/>`,
    // Bat, upside down
    obs: `<path d="M18 -6v6" stroke="#6b76a0" stroke-width="1.5"/><ellipse cx="18" cy="12" rx="9" ry="12" fill="#3f4670"/><path d="M9 6q-10 4-8 16q4-4 8-4zM27 6q10 4 8 16q-4-4-8-4z" fill="#343a60"/>`,
  };
  const body = bodies[district];
  if (!body) return '';
  return `<g transform="translate(${x},${y}) scale(${scale})">${body}${district === 'obs' ? '' : eyes}${zz}${awake ? `<circle cx="18" cy="16" r="30" fill="${hue}" opacity=".08"/>` : ''}</g>`;
}

export function districtXml(districtId: string, hue: string, buildings: BuildingView[], keeperAwake: boolean): string {
  const gid = uid('g');
  let s = `<svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080914"/><stop offset="1" stop-color="#1a1a2e"/></linearGradient></defs>
  <rect width="360" height="300" fill="url(#${gid})"/>${stars(360, 120, 26, 21 + districtId.length)}
  <path d="M0 262h360v38H0z" fill="#121530"/><path d="M0 262h360" stroke="#3a3350" stroke-width="1"/>`;
  const plan = PANORAMA[districtId] ?? PANORAMA.horlo;
  buildings.forEach((b, i) => {
    const [x, w, h, roof] = plan[i] ?? plan[0];
    if (districtId === 'phare' && i === 0) s += lighthouse(x + w / 2, 262, 2.2, b.open) + '';
    else s += bld(x, 262 - h, w, h, roof, hue, b.open ? Math.max(0.1, b.lit) : 0, x + i);
    if (b.selected) s += `<rect x="${x - 4}" y="${262 - h - w * 0.7}" width="${w + 8}" height="${h + w * 0.7 + 4}" rx="8" fill="none" stroke="#F4B45E" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    if (!b.open) s += `<g transform="translate(${x + w / 2 - 11},${262 - h / 2 - 11})"><circle cx="11" cy="11" r="15" fill="#0D0F1E" opacity=".8"/><g stroke="#9CA2C6" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M7 10V8a4 4 0 0 1 8 0v2"/><rect x="4.5" y="10" width="13" height="10" rx="3"/></g></g>`;
  });
  s += keeperArt(districtId, keeperAwake, hue);
  return s + '</svg>';
}

// MARK: - Building cross-section

export interface RoomCell { label: string; sub: string; state: 'done' | 'current' | 'open' | 'locked'; lit: number; total: number; key?: boolean }
export interface CoupeRect { x: number; y: number; w: number; h: number }

/** Room rectangles of a building (4 rooms + keystone, 4 rooms, or 1 room). */
export function coupeRects(rooms: number, keystone: boolean): CoupeRect[] {
  if (rooms === 1) return [{ x: 30, y: 130, w: 300, h: 290 }];
  const r = [{ x: 30, y: 330, w: 300, h: 90 }, { x: 30, y: 230, w: 150, h: 100 }, { x: 180, y: 230, w: 150, h: 100 }, { x: 30, y: 130, w: 150, h: 100 }];
  r.push(keystone ? { x: 180, y: 130, w: 150, h: 100 } : { x: 180, y: 130, w: 150, h: 100 });
  return keystone ? r : [r[0], r[1], r[2], { x: 30, y: 130, w: 300, h: 100 }];
}

export function coupeXml(hue: string, cells: RoomCell[], rects: CoupeRect[]): string {
  let s = `<svg viewBox="0 0 360 440">
  <path d="M18 130L180 34 342 130z" fill="#1d2140"/><circle cx="180" cy="94" r="22" fill="${mix('#1d2140', hue, 0.5)}"/><circle cx="180" cy="94" r="12" fill="#1d2140"/>
  <rect x="24" y="128" width="312" height="298" rx="4" fill="#0f1228"/>`;
  cells.forEach((c, i) => {
    const r = rects[i];
    if (!r) return;
    const frac = c.key ? (c.state !== 'locked' ? 0.15 : 0) : c.total ? c.lit / c.total : 0;
    const fill = c.state === 'locked' ? '#0c0e20' : mix('#161a36', mix(hue, '#3a2c1c', 0.55), Math.min(1, 0.2 + frac * 0.8));
    s += `<rect x="${r.x + 4}" y="${r.y + 4}" width="${r.w - 8}" height="${r.h - 8}" rx="6" fill="${fill}" stroke="${c.state === 'current' ? '#F4B45E' : '#2E3360'}" stroke-width="${c.state === 'current' ? 2 : 1}"/>`;
    if (frac > 0) s += `<ellipse cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2}" rx="${r.w * 0.4}" ry="${r.h * 0.35}" fill="${hue}" opacity="${(0.06 + frac * 0.14).toFixed(2)}"/>`;
    if (!c.key && c.state !== 'locked' && c.total > 1) {
      const n = Math.min(c.total, 16), step = (r.w - 36) / (n - 1);
      for (let k = 0; k < n; k++) {
        const on = k < c.lit, cx = r.x + 18 + k * step, cy = r.y + r.h - 22;
        s += `<circle cx="${cx}" cy="${cy}" r="${on ? 4 : 3}" fill="${on ? '#F4B45E' : 'none'}" stroke="${on ? 'none' : '#4a5190'}" stroke-width="1.3"/>`;
        if (on) s += `<circle cx="${cx}" cy="${cy}" r="8" fill="#F4B45E" opacity=".18"/>`;
      }
    }
    s += `<text x="${r.x + 16}" y="${r.y + 28}" fill="${c.state === 'locked' ? '#7A80A8' : '#EFE8D8'}" font-family="${SVG_SERIF_BOLD}" font-size="16">${esc(c.label)}</text>
      <text x="${r.x + 16}" y="${r.y + 47}" fill="${c.state === 'locked' ? '#7A80A8' : '#9CA2C6'}" font-family="Helvetica,Arial,sans-serif" font-size="12.5" font-weight="600">${esc(c.sub)}</text>`;
    if (c.state === 'locked') s += `<g transform="translate(${r.x + r.w - 40},${r.y + 18})" stroke="#7A80A8" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M7 10V8a4 4 0 0 1 8 0v2"/><rect x="4.5" y="10" width="13" height="10" rx="3"/></g>`;
    if (c.key && c.state !== 'locked') s += `<g transform="translate(${r.x + r.w - 44},${r.y + 50})"><circle cx="12" cy="12" r="16" fill="#F4B45E" opacity=".15"/><path d="M8.5 8.5a3.5 3.5 0 1 1 5.2 3.1c-1 .6-1.7 1.3-1.7 2.6v.8M12 19h.01" stroke="#F4B45E" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  });
  return s + `<rect x="150" y="410" width="60" height="16" fill="#0a0c1c"/></svg>`;
}

// MARK: - Room

export function roomLanternXml(i: number, lit: boolean, key = false): string {
  const x = 30, y = 34;
  return `<svg viewBox="0 0 60 60">
      <path d="M${x} ${y - 19}v4" stroke="${lit ? '#c9a563' : '#4a5190'}" stroke-width="1.8"/>
      <rect x="${x - 9}" y="${y - 15}" width="18" height="25" rx="7" fill="${lit ? '#F4B45E' : '#141833'}" stroke="${lit ? '#FFE6B0' : key ? '#FFD98E' : '#5a62a8'}" stroke-width="1.6"/>
      ${lit ? `<circle cx="${x}" cy="${y - 2}" r="5" fill="#FFF3D6"/><circle cx="${x}" cy="${y - 2}" r="22" fill="#F4B45E" opacity=".2"/>` : `<path d="M${x - 4} ${y - 2}h8" stroke="#5a62a8" stroke-width="1.4" stroke-linecap="round"/>`}
      <path d="M${x - 6} ${y + 13}h12" stroke="${lit ? '#c9a563' : '#4a5190'}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${x + 13}" cy="${y - 15}" r="8" fill="#0D0F1E" stroke="${lit ? '#6b5a3c' : '#2E3360'}"/><text x="${x + 13}" y="${y - 11.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${lit ? '#F4B45E' : '#9CA2C6'}" font-family="Helvetica,Arial,sans-serif">${key ? '?' : i + 1}</text>
    </svg>`;
}

// MARK: - Puzzle pieces

export function tileXml(m: number, lit: boolean, isSource: boolean): string {
  const col = lit ? T.amber : '#3a4180';
  const bits = [0, 1, 2, 3].filter((b) => (m >> b) & 1);
  const ends = [[50, 0], [100, 50], [50, 100], [0, 50]];
  let s = '<svg viewBox="0 0 100 100">';
  if (lit) bits.forEach((b) => { s += `<line x1="50" y1="50" x2="${ends[b][0]}" y2="${ends[b][1]}" stroke="${T.amber}" stroke-width="30" stroke-linecap="butt" opacity=".16"/>`; });
  bits.forEach((b) => { s += `<line x1="50" y1="50" x2="${ends[b][0]}" y2="${ends[b][1]}" stroke="${col}" stroke-width="14"/>`; });
  s += `<circle cx="50" cy="50" r="9" fill="${col}"/>`;
  if (isSource) s += `<circle cx="50" cy="50" r="26" fill="${T.gold}" opacity=".25"/><circle cx="50" cy="50" r="17" fill="${T.gold}"/><circle cx="50" cy="50" r="8" fill="#FFF3D6"/>`;
  else if (bits.length === 1) s += `<rect x="36" y="32" width="28" height="38" rx="11" fill="${lit ? T.amber : '#141833'}" stroke="${lit ? '#FFE6B0' : '#5a62a8'}" stroke-width="4"/>${lit ? '<circle cx="50" cy="50" r="7" fill="#FFF3D6"/>' : ''}`;
  return s + '</svg>';
}

export function lampXml(conflict: boolean): string {
  const c = conflict ? T.coral : T.amber;
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${c}" opacity=".25"/><rect x="7.5" y="5" width="9" height="13" rx="3.5" fill="${c}"/><circle cx="12" cy="11" r="2.4" fill="#FFF3D6"/>${conflict ? `<path d="M3 3l18 18" stroke="${T.coral}" stroke-width="2"/>` : ''}</svg>`;
}

const SHAPE_ART: Record<string, (r: number) => string> = {
  circle: (r) => `<circle r="${r}" fill="#D8B56A"/>`,
  triangle: (r) => `<path d="M0 ${-r * 1.18}L${r * 1.09} ${r * 0.82}H${-r * 1.09}z" fill="#E7A98B"/>`,
  square: (r) => `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="3" fill="#8FB8F0"/>`,
  diamond: (r) => `<path d="M0 ${-r * 1.2}L${r * 1.1} 0L0 ${r * 1.2}L${-r * 1.1} 0z" fill="#7FC8A9"/>`,
};
export const shapeXml = (shape: string, r: number) => `<svg viewBox="${-r - 3} ${-r - 3} ${2 * r + 6} ${2 * r + 6}">${SHAPE_ART[shape]?.(r) ?? ''}</svg>`;

type PanItem = { shape: number } | { weight: number };
/** One balance of a Balances puzzle (the mockup's drawing, any content). */
export function scalesBalanceXml(p: { shapes: string[] }, b: { left: PanItem[]; right: PanItem[] }, n: number): string {
  const item = (it: PanItem) => ('shape' in it ? SHAPE_ART[p.shapes[it.shape]]?.(10) ?? ''
    : `<path d="M-12 11L-8 -9H8L12 11z" fill="#9CA2C6"/><text y="6" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="800" font-size="${it.weight >= 100 ? 9 : 12}" fill="#0D0F1E">${it.weight}</text>`);
  const put = (arr: PanItem[], x0: number) => {
    const step = arr.length > 3 ? 20 : 26;
    return arr.map((it, i) => `<g transform="translate(${x0 + i * step - ((arr.length - 1) * step) / 2},46)">${item(it)}</g>`).join('');
  };
  return `<svg viewBox="0 0 300 80"><text x="150" y="12" text-anchor="middle" font-size="9" fill="#7A80A8" font-family="Helvetica,Arial,sans-serif">${n}</text><path d="M150 18v54M120 76h60" stroke="#6b5a3c" stroke-width="4" stroke-linecap="round"/><path d="M40 20h220" stroke="#8a6f45" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="18" r="5" fill="#D8B56A"/><path d="M40 20l-24 40h48zM260 20l-24 40h48z" fill="none" stroke="#6b5a3c" stroke-width="1.5"/><path d="M4 60h72M224 60h72" stroke="#8a6f45" stroke-width="4" stroke-linecap="round"/>${put(b.left, 40)}${put(b.right, 260)}</svg>`;
}

export function bigLanternXml(): string {
  return `<svg viewBox="0 0 100 120"><circle cx="50" cy="62" r="48" fill="${T.amber}" opacity=".18"/><path d="M50 6v10" stroke="#c9a563" stroke-width="3"/><path d="M40 16h20" stroke="#c9a563" stroke-width="4" stroke-linecap="round"/><rect x="28" y="20" width="44" height="66" rx="18" fill="${T.amber}" stroke="#FFE6B0" stroke-width="3"/><circle cx="50" cy="52" r="12" fill="#FFF3D6"/><path d="M36 92h28" stroke="#c9a563" stroke-width="5" stroke-linecap="round"/></svg>`;
}

/** Ink drawings of the Allumeur, one per letter (drawn around 0,0, about 60 wide). */
const LETTER_VIGNETTES: Record<string, string> = {
  // The lighthouse, its beam reaching out
  phare: `<path d="M-6 22l3-30h6l3 30z"/><path d="M-5 -8h10v-6h-10z"/><path d="M0 -14v-4"/><path d="M6 -11l22-8M6 -11l22 0M-6 -11l-22-8M-6 -11l-22 0" opacity=".6"/><path d="M-30 24q15-4 30 0t30 0"/>`,
  // A pile of books, one open
  biblio: `<path d="M-22 22h44v-7h-44z"/><path d="M-18 15h36v-7h-36z"/><path d="M-20 8q10-5 20 0q10-5 20 0v-14q-10-5-20 0q-10-5-20 0z"/><path d="M0 8v-14"/><path d="M-15 -2h10M5 -2h10M-15 2h10M5 2h10" opacity=".5"/>`,
  // A stopped clock
  horlo: `<circle cx="0" cy="2" r="20"/><circle cx="0" cy="2" r="16" opacity=".5"/><path d="M0 2v-11M0 2l8 5"/><path d="M0 -18v3M0 22v-3M-20 2h3M20 2h-3"/><path d="M-6 -22h12" />`,
  // A seed of light, sprouting
  serre: `<path d="M-24 22q24-6 48 0"/><path d="M0 20q-2-16 0-26"/><path d="M0 4q-14-2-16-14q12 0 16 14z"/><path d="M0 -4q12-4 14-16q-12 2-14 16z"/><circle cx="0" cy="-10" r="3"/><path d="M-6 -16l-3-4M6 -16l3-4M0 -17v-5" opacity=".6"/>`,
  // The boat he traded his flame for
  marche: `<path d="M-24 10h48l-8 10h-32z"/><path d="M0 10v-30"/><path d="M0 -20l18 26h-18z"/><path d="M0 -16l-14 22h14" opacity=".7"/><path d="M-30 24q8-3 15 0t15 0t15 0t15 0"/>`,
  // Two masks, the play goes on elsewhere
  theatre: `<path d="M-22 -14q12-6 22 0q0 18-11 22q-11-4-11-22z"/><path d="M-16 -6l4 1M-6 -5l-4 0M-15 4q4-3 8 0"/><path d="M2 -8q12-6 22 0q0 18-11 22q-11-4-11-22z"/><path d="M8 0l4 1M18 1l-4 0M8 9q4 3 8 0"/>`,
  // The telescope, and a light blinking across the sea
  obs: `<path d="M-20 18l14-12"/><path d="M-10 10l18-20l6 5l-18 20z"/><path d="M-12 22l6-12l6 12"/><path d="M22 -12l2-5l2 5l5 2l-5 2l-2 5l-2-5l-5-2z"/><path d="M-30 24q15-3 30 0t30 0"/>`,
  // The top of the lighthouse, and the answer on the horizon
  grenier: `<path d="M-14 22v-18h10v18"/><path d="M-16 4h14l-7-8z"/><path d="M-30 24q15-3 30 0t30 0"/><circle cx="22" cy="10" r="2"/><path d="M16 10h-4M28 10h4M22 4v-4" opacity=".6"/>`,
};

/** A letter of the Allumeur: a sheet of paper with his ink drawing and a wax seal. */
export function letterArtXml(from?: string): string {
  const art = (from && LETTER_VIGNETTES[from]) || '';
  const lines = [0, 1, 2].map((i) => `<path d="M${64 + (i % 2) * 4} ${100 + i * 7}q18-2 36 0t${28 - i * 6} 0" stroke="#8a6d45" stroke-width="1.2" fill="none" opacity=".55"/>`).join('');
  return `<svg viewBox="0 0 200 150"><circle cx="100" cy="75" r="68" fill="${T.gold}" opacity=".1"/>
  <g transform="rotate(-3 100 75)"><rect x="50" y="18" width="100" height="116" rx="4" fill="#EFE8D8"/><rect x="50" y="18" width="100" height="116" rx="4" fill="none" stroke="#c9a563" stroke-width="1.2"/>
  <g transform="translate(100,58)" stroke="#6b4f2a" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">${art}</g>${lines}
  <circle cx="136" cy="120" r="10" fill="#B5553F"/><path d="M132 120l4-5 4 5-4 4z" fill="#E8894A"/></g></svg>`;
}
