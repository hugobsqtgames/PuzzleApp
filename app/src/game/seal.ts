// Seal digits in the rooms (see core/families/seal.ts).
import { sealDigit } from '../core/families/seal';
import { WORLD } from './catalog';

const withSeal = new Set<string>();
for (const d of WORLD.districts) for (const b of d.buildings) if (b.keystone) b.rooms.forEach((r) => withSeal.add(r.id));

/** Digit painted in a room, or null when its building has no seal. */
export const sealDigitOf = (roomId: string): number | null => (withSeal.has(roomId) ? sealDigit(roomId) : null);
