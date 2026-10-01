// Drawings of the seasons and events: what falls past the window, pumpkins, the vigil's lanterns.
import type { Particle } from '../game/seasons';

/** One particle, drawn around 0,0 (about 10 wide). */
export function particleXml(kind: Particle, accent: string, k = 0): string {
  switch (kind) {
    case 'petal': return `<ellipse rx="4" ry="2.2" fill="${accent}" opacity=".9" transform="rotate(${(k * 47) % 180})"/>`;
    case 'firefly': return `<circle r="6" fill="${accent}" opacity=".2"/><circle r="2" fill="${accent}"/>`;
    case 'leaf': return `<path d="M-5 0q5-5 10 0q-5 5-10 0z" fill="${['#E8744A', '#C8553D', '#E8B04A'][k % 3]}" transform="rotate(${(k * 61) % 180})"/>`;
    case 'snow': return `<circle r="${1.6 + (k % 3) * 0.7}" fill="#FFFFFF" opacity=".9"/>`;
    case 'rain': return `<path d="M1-6l-2 12" stroke="#9FC3E8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
    case 'bat': return `<path d="M-8 0q3-4 5-1q1 2 3 0q2 2 3 0q2-3 5 1q-4 1-8 4q-4-3-8-4z" fill="#0a0410" stroke="#3b1640" stroke-width=".6"/>`;
  }
}

/** A pumpkin lantern of the Nuit des Citrouilles, lit or not. */
export function pumpkinXml(lit: boolean): string {
  return `<svg viewBox="0 0 40 40">${lit ? '<circle cx="20" cy="22" r="19" fill="#F28C28" opacity=".18"/>' : ''}<ellipse cx="20" cy="23" rx="15" ry="13" fill="${lit ? '#F28C28' : '#2a1a30'}" stroke="${lit ? '#FFB25A' : '#5a3a62'}" stroke-width="1.6"/><path d="M14 11q-2 12 0 24M26 11q2 12 0 24" stroke="${lit ? '#C86A1A' : '#4a2a52'}" stroke-width="1.2" fill="none"/><path d="M20 10v-6" stroke="#6b8f3a" stroke-width="3" stroke-linecap="round"/>${lit ? '<path d="M12 21l3-3 3 3M22 21l3-3 3 3M12 27q8 6 16 0" stroke="#3b1640" stroke-width="2" fill="none" stroke-linejoin="round"/>' : ''}</svg>`;
}

/** A lantern of the Veillée de Vesper, lit, open or still to come. */
export function vigilXml(state: 'lit' | 'open' | 'later'): string {
  const lit = state === 'lit';
  return `<svg viewBox="0 0 40 40">${lit ? '<circle cx="20" cy="22" r="18" fill="#FFE6B0" opacity=".2"/>' : ''}<path d="M20 4v5" stroke="#9CA2C6" stroke-width="1.5"/><path d="M13 9h14l-2 4h-10z" fill="#E0625A"/><rect x="12" y="13" width="16" height="17" rx="4" fill="${lit ? '#FFE6B0' : '#1d2140'}" stroke="${state === 'open' ? '#FFE6B0' : lit ? '#F4B45E' : '#2E3360'}" stroke-width="1.6" ${state === 'open' ? 'stroke-dasharray="3 2"' : ''}/>${lit ? '<circle cx="20" cy="21.5" r="3.5" fill="#FFF7E4"/>' : ''}<path d="M13 30h14l-2 4h-10z" fill="#E0625A"/><path d="M17 30l-3 6M23 30l3 6" stroke="#2E7D5B" stroke-width="1.4"/></svg>`;
}

/** A sky lantern of the Printemps des Lanternes: risen and glowing, ready to rise, or still to come. */
export function skyLanternXml(lit: boolean): string {
  return `<svg viewBox="0 0 40 40">${lit ? '<circle cx="20" cy="18" r="18" fill="#F7A8C8" opacity=".2"/>' : ''}<path d="M11 6h18l-3 24h-12z" fill="${lit ? '#F7A8C8' : '#2a1f3a'}" stroke="${lit ? '#FFD6E6' : '#5a4a72'}" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 6l-1 24M24 6l1 24" stroke="${lit ? '#E07FA8' : '#4a3a62'}" stroke-width="1"/><ellipse cx="20" cy="30" rx="6" ry="2" fill="${lit ? '#FFF3D6' : '#3a2f4a'}"/>${lit ? '<circle cx="20" cy="22" r="3.5" fill="#FFF7E4"/>' : ''}</svg>`;
}
