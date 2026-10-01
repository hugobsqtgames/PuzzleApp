// The decoration of the player's house: rugs, lamps, paintings, plants,
// earned by lighting Vesper (nothing is bought).
import type { GameState } from '../core/game/state';
import type { Progression } from '../core/game/progression';
import { districtLanterns } from '../core/game/world';
import { WORLD } from './catalog';

export type DecorSlot = 'rug' | 'lamp' | 'painting' | 'plant';
export const DECOR_SLOTS: DecorSlot[] = ['rug', 'painting', 'lamp', 'plant'];

export interface Decor { id: string; slot: DecorSlot; name: string; earn?: { text: string; when: (p: Progression, s: GameState) => boolean } }

const lit = (district: string) => (p: Progression, s: GameState) => { const d = WORLD.districts.find((x) => x.id === district)!; const all = districtLanterns(d); return p.lights(all, s) === all.length; };
const lights = (n: number) => (p: Progression, s: GameState) => p.totalLights(s) >= n;

export const DECOR: Decor[] = [
  { id: 'rug.red', slot: 'rug', name: 'Tapis bordeaux' },
  { id: 'rug.blue', slot: 'rug', name: 'Tapis bleu nuit', earn: { text: 'Éclaire la Bibliothèque', when: lit('biblio') } },
  { id: 'rug.green', slot: 'rug', name: 'Tapis de mousse', earn: { text: 'Éclaire la Serre de Verre', when: lit('serre') } },
  { id: 'rug.gold', slot: 'rug', name: 'Tapis doré', earn: { text: 'Allume 600 lanternes', when: lights(600) } },
  { id: 'painting.none', slot: 'painting', name: 'Aucun' },
  { id: 'painting.phare', slot: 'painting', name: 'Tableau du Phare', earn: { text: 'Éclaire le Phare', when: lit('phare') } },
  { id: 'painting.masks', slot: 'painting', name: 'Affiche du Théâtre', earn: { text: 'Éclaire le Théâtre d’Ombres', when: lit('theatre') } },
  { id: 'painting.sky', slot: 'painting', name: 'Carte du ciel', earn: { text: 'Éclaire l’Observatoire', when: lit('obs') } },
  { id: 'lamp.none', slot: 'lamp', name: 'Aucune' },
  { id: 'lamp.brass', slot: 'lamp', name: 'Lampe de laiton', earn: { text: 'Éclaire l’Horlogerie', when: lit('horlo') } },
  { id: 'lamp.paper', slot: 'lamp', name: 'Lampion de papier', earn: { text: 'Éclaire le Marché Flottant', when: lit('marche') } },
  { id: 'plant.none', slot: 'plant', name: 'Aucune' },
  { id: 'plant.fern', slot: 'plant', name: 'Fougère', earn: { text: 'Allume 100 lanternes', when: lights(100) } },
  { id: 'plant.glow', slot: 'plant', name: 'Fleur lumineuse', earn: { text: 'Allume 300 lanternes', when: lights(300) } },
];

export const DEFAULT_DECOR: Record<DecorSlot, string> = { rug: 'rug.red', painting: 'painting.none', lamp: 'lamp.none', plant: 'plant.none' };

export const decorOwned = (d: Decor, p: Progression, s: GameState) => !d.earn || d.earn.when(p, s);

/** The drawings of the decoration, placed in the room of size w × h. */
export function decorXml(decor: Record<DecorSlot, string>, w: number, h: number): string {
  const rugs: Record<string, string> = { 'rug.red': '#8E3B46', 'rug.blue': '#2E3F7A', 'rug.green': '#3E6B4E', 'rug.gold': '#B08A3E' };
  const rug = `<ellipse cx="${w * 0.6}" cy="${h * 0.91}" rx="${w * 0.3}" ry="${h * 0.06}" fill="${rugs[decor.rug] ?? rugs['rug.red']}" opacity=".85"/><ellipse cx="${w * 0.6}" cy="${h * 0.91}" rx="${w * 0.25}" ry="${h * 0.045}" fill="none" stroke="#EFE8D8" stroke-opacity=".25" stroke-width="2"/>`;
  const px = w * 0.08, py = h * 0.05, pw = w * 0.3, ph = h * 0.17;
  const frame = (inner: string) => `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="3" fill="#0d0f1e" stroke="#B08A3E" stroke-width="4"/><svg x="${px}" y="${py}" width="${pw}" height="${ph}" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  const paintings: Record<string, string> = {
    'painting.phare': frame('<rect width="100" height="60" fill="#151936"/><rect x="44" y="18" width="10" height="34" fill="#EFE8D8"/><rect x="44" y="26" width="10" height="5" fill="#B5553F"/><rect x="42" y="12" width="14" height="7" fill="#F4B45E"/><path d="M56 15l40-8v14z" fill="#F4B45E" opacity=".35"/><rect y="50" width="100" height="10" fill="#1d2a50"/>'),
    'painting.masks': frame('<rect width="100" height="60" fill="#3b1f4a"/><path d="M28 16q12-6 22 0q0 18-11 22q-11-4-11-22z" fill="#EFE8D8"/><path d="M52 20q12-6 22 0q0 18-11 22q-11-4-11-22z" fill="#C39BD3"/>'),
    'painting.sky': frame('<rect width="100" height="60" fill="#0b1030"/><circle cx="20" cy="15" r="1.5" fill="#fff"/><circle cx="40" cy="25" r="1.5" fill="#fff"/><circle cx="60" cy="12" r="1.5" fill="#fff"/><circle cx="78" cy="30" r="1.5" fill="#fff"/><path d="M20 15L40 25L60 12L78 30" stroke="#8FB8F0" stroke-width=".8" fill="none"/><circle cx="85" cy="12" r="6" fill="#EFE8D8"/>'),
  };
  const lamps: Record<string, string> = {
    'lamp.brass': `<g transform="translate(${w * 0.1} ${h * 0.97 - h * 0.16 + 10})"><circle cy="-6" r="${w * 0.07}" fill="#F4B45E" opacity=".18"/><path d="M-10 -14h20l-5 -12h-10z" fill="#D8B56A"/><rect x="-1.5" y="-14" width="3" height="${h * 0.16}" fill="#8a6d45"/><rect x="-9" y="${h * 0.16 - 15}" width="18" height="4" rx="2" fill="#8a6d45"/></g>`,
    'lamp.paper': `<g transform="translate(${w * 0.5} ${h * 0.16})"><path d="M0 -40v18" stroke="#8a6d45" stroke-width="1.5"/><circle r="${w * 0.08}" fill="#E8744A" opacity=".18"/><ellipse rx="12" ry="15" fill="#E8744A"/><path d="M-12 0h24M-10 -8h20M-10 8h20" stroke="#B5553F" stroke-width="1"/><circle r="4" fill="#FFE6B0"/></g>`,
  };
  const plants: Record<string, string> = {
    'plant.fern': `<g transform="translate(${w * 0.9} ${h * 0.9})"><rect x="-12" y="-6" width="24" height="20" rx="3" fill="#8a5a3c"/><path d="M0 -6q-16-20-22-30M0 -6q-4-24 0-38M0 -6q14-20 22-30M0 -6q-20-10-26-14M0 -6q20-10 26-14" stroke="#5f9a6e" stroke-width="3" fill="none" stroke-linecap="round"/></g>`,
    'plant.glow': `<g transform="translate(${w * 0.9} ${h * 0.9})"><rect x="-12" y="-6" width="24" height="20" rx="3" fill="#5a4a7a"/><path d="M0 -6v-26" stroke="#5f9a6e" stroke-width="3"/><circle cy="-36" r="14" fill="#BFE6F0" opacity=".2"/><circle cy="-36" r="7" fill="#BFE6F0"/><circle cy="-36" r="3" fill="#fff"/></g>`,
  };
  return rug + (paintings[decor.painting] ?? '') + (lamps[decor.lamp] ?? '') + (plants[decor.plant] ?? '');
}
