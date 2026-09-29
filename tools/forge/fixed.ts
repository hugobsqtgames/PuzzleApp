// Puzzles placed by hand: the onboarding tutorial (GAME_DESIGN § 14) and the
// prototype's Salle 2 of the Atelier des Ressorts, so the app keeps the exact
// boards of the approved mockup (prototype/index.html, `PZ`).
import { Tier } from '../../app/src/core/puzzlekit/types';
import { rotateMask } from '../../app/src/core/families/gears';
import type { Code } from './forge';

/** A fixed lantern; without `p`, only its family and tier are fixed and the puzzle is generated. */
export interface Fixed { f: Code; t: Tier; p?: unknown }

const PROTO_GEARS = {
  sol: [[2, 14, 12, 4], [6, 9, 5, 5], [7, 8, 7, 9], [3, 8, 3, 8]],
  scr: [[1, 2, 3, 1], [2, 1, 1, 3], [3, 2, 1, 2], [1, 3, 2, 1]],
};

/** 3×3 cross switches, all lit, after the prototype's presses (0,0), (1,2), (2,1). */
function protoSwitches(): boolean[] {
  const lit = Array(9).fill(true);
  for (const [r, c] of [[0, 0], [1, 2], [2, 1]]) {
    for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < 3 && cc < 3) lit[rr * 3 + cc] = !lit[rr * 3 + cc];
    }
  }
  return lit;
}

export const TUTORIAL: Record<string, Fixed> = {
  // First puzzle of the game: 2×2 switches, a single press lights everything.
  'phare.b1.r1.1': { f: 'IN', t: Tier.Spark, p: { rows: 2, columns: 2, pattern: 'cross', initiallyLit: [false, false, false, true] } },
};

export const PROTOTYPE_ROOM: Record<string, Fixed> = {
  // Same families and tiers as the mockup's room: IN SU EN CA SU LA EN IN CA LA.
  'horlo.b1.r2.1': { f: 'IN', t: Tier.Spark },
  'horlo.b1.r2.2': { f: 'SU', t: Tier.Spark },
  'horlo.b1.r2.3': { f: 'EN', t: Tier.Glow },
  'horlo.b1.r2.4': { f: 'CA', t: Tier.Glow },
  'horlo.b1.r2.6': { f: 'LA', t: Tier.Glow },
  'horlo.b1.r2.5': { f: 'SU', t: Tier.Glow, p: { terms: [3, 5, 9, 17, 33], options: [49, 65, 66, 50], answer: 1, rule: { kind: 'addDoubling', a: 2, b: 0 } } },
  'horlo.b1.r2.7': { f: 'EN', t: Tier.Glow, p: { rows: 4, columns: 4, source: 1, tiles: PROTO_GEARS.sol.flatMap((row, r) => row.map((m, c) => rotateMask(m, PROTO_GEARS.scr[r][c]))) } },
  'horlo.b1.r2.8': { f: 'IN', t: Tier.Glow, p: { rows: 3, columns: 3, pattern: 'cross', initiallyLit: protoSwitches() } },
  'horlo.b1.r2.9': { f: 'CA', t: Tier.Flame, p: { length: 3, alphabet: 10, allowsRepeats: false, clues: [
    { guess: [2, 6, 1], wellPlaced: 0, misplaced: 1 }, { guess: [3, 4, 9], wellPlaced: 0, misplaced: 2 }, { guess: [9, 7, 6], wellPlaced: 0, misplaced: 1 },
    { guess: [3, 4, 7], wellPlaced: 0, misplaced: 1 }, { guess: [1, 8, 5], wellPlaced: 0, misplaced: 0 },
  ] } },
  'horlo.b1.r2.10': { f: 'LA', t: Tier.Flame, p: { layout: ['.X..XX', '..3...', 'XXXX..', '..XX2X', '...X..', 'X2..X.'] } },
};

/** Prototype's daily puzzle (Balances), kept for the first day of the app. */
export const PROTOTYPE_DAILY: Fixed = { f: 'BA', t: Tier.Flame, p: {
  shapes: ['square', 'triangle', 'circle'], question: 0, maxWeight: 20, balances: [
    { left: [{ shape: 2 }, { shape: 2 }], right: [{ shape: 1 }] },
    { left: [{ shape: 1 }, { shape: 2 }], right: [{ weight: 12 }] },
    { left: [{ shape: 0 }], right: [{ shape: 1 }, { shape: 1 }] },
  ] } };
