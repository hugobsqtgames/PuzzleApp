// How the Forge (tools/forge) builds a puzzle of each family at each tier:
// candidate parameters, best first. The app's mode Libre generates with the
// same ones, on the phone.
import { SILHOUETTES } from '../families/marquetry';

const SIL = Object.keys(SILHOUETTES);
const SMALL_SIL = ['lanterne', 'maison', 'phare', 'horloge'];
const LIE_EASY = ['liar', 'honest', 'atLeastOneLiar'];
const LIE_MID = ['liar', 'honest', 'atLeastOneLiar', 'exactlyLiars'];
const LIE_HARD = ['liar', 'honest', 'exactlyLiars', 'same', 'ifThen'];
const LIE_ALL = ['liar', 'honest', 'exactlyLiars', 'same', 'different', 'ifThen', 'allLiars'];
const EQ_DIRECT = ['has', 'at', 'hasNot', 'notAt'];
const EQ_ALL = ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'objectNotAt', 'either'];

/** Candidate parameters per family and tier (0–5), best first. */
export const FORGE_PARAMS: Record<string, unknown[][]> = {
  IN: [
    [{ rows: 3, columns: 3, presses: [2, 3] }, { rows: 2, columns: 2, presses: [1, 2] }],
    [{ rows: 3, columns: 3, presses: [3, 5] }, { rows: 4, columns: 4, presses: [4, 7] }, { rows: 3, columns: 3, pattern: 'diagonal', presses: [2, 4] }],
    [{ rows: 3, columns: 3, presses: [4, 6] }, { rows: 4, columns: 4, pattern: 'diagonal', presses: [4, 7] }, { rows: 4, columns: 4, presses: [5, 8] }, { rows: 3, columns: 3, pattern: 'ring', presses: [2, 4] }, { rows: 5, columns: 5, presses: [6, 10] }],
    [{ rows: 5, columns: 5, presses: [6, 10] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [8, 12] }, { rows: 4, columns: 4, pattern: 'ring', presses: [4, 7] }],
    [{ rows: 5, columns: 5, presses: [9, 13] }, { rows: 5, columns: 5, pattern: 'diagonal', presses: [10, 14] }, { rows: 5, columns: 5, pattern: 'ring', presses: [6, 10] }],
    [{ rows: 6, columns: 6, presses: [10, 14] }, { rows: 5, columns: 5, pattern: 'ring', presses: [8, 12] }, { rows: 6, columns: 6, pattern: 'diagonal', presses: [10, 14] }],
  ],
  CA: [
    [{ length: 3, clueCount: [3, 5] }],
    [{ length: 3, clueCount: [3, 5] }, { length: 3, clueCount: [4, 7] }],
    [{ length: 3, clueCount: [4, 7] }, { length: 4, clueCount: [4, 6] }],
    [{ length: 4, clueCount: [4, 7] }],
    [{ length: 4, allowsRepeats: true, clueCount: [5, 9] }, { length: 5, clueCount: [5, 9] }],
    [{ length: 5, clueCount: [5, 9] }, { length: 4, allowsRepeats: true, clueCount: [6, 10] }],
  ],
  LA: [
    [{ rows: 5, columns: 5 }, { rows: 4, columns: 4 }],
    [{ rows: 5, columns: 5 }, { rows: 6, columns: 6 }],
    [{ rows: 6, columns: 6 }, { rows: 5, columns: 5 }, { rows: 7, columns: 7 }],
    [{ rows: 7, columns: 7 }, { rows: 6, columns: 6 }],
    [{ rows: 7, columns: 7 }, { rows: 8, columns: 8 }, { rows: 6, columns: 6 }],
    [{ rows: 8, columns: 8 }, { rows: 7, columns: 7 }],
  ],
  EN: [
    [{ rows: 4, columns: 4 }],
    [{ rows: 4, columns: 4 }, { rows: 5, columns: 5 }],
    [{ rows: 5, columns: 5 }],
    [{ rows: 6, columns: 6 }],
    [{ rows: 7, columns: 7 }, { rows: 6, columns: 6, branchiness: 0.9 }],
    [{ rows: 7, columns: 7 }],
  ],
  SU: [
    [{ complexity: 1 }], [{ complexity: 1 }, { complexity: 1, letters: true }], [{ complexity: 2 }, { complexity: 3 }, { complexity: 2, letters: true }], [{ complexity: 3 }, { complexity: 3, letters: true }], [], [],
  ],
  MO: [[{ active: 1 }], [{ active: 1 }, { active: 2 }], [{ active: 2 }, { active: 2, distribution: true }], [{ active: 2, distribution: true }, { active: 3, distribution: true }], [{ active: 3, distribution: true }], []],
  ME: [
    [{ characters: 3, kinds: LIE_EASY }], [{ characters: 4, kinds: LIE_MID }, { characters: 3, kinds: LIE_EASY }], [{ characters: 4, kinds: LIE_MID }, { characters: 5, kinds: LIE_HARD }],
    [{ characters: 5, kinds: LIE_HARD }], [{ characters: 6, kinds: LIE_ALL }], [{ characters: 6, kinds: LIE_ALL }],
  ],
  FI: [
    [{ rows: 4, columns: 4, wallPercent: 20 }], [{ rows: 5, columns: 5, wallPercent: 25 }], [{ rows: 6, columns: 6, wallPercent: 20 }],
    [{ rows: 7, columns: 7, wallPercent: 15 }], [{ rows: 8, columns: 8, wallPercent: 15 }, { rows: 7, columns: 7, wallPercent: 5 }], [{ rows: 8, columns: 8, wallPercent: 10 }],
  ],
  MI: [
    [{ rows: 5, columns: 5, mirrors: 1, targets: 2, obstaclePercent: 10 }], [{ rows: 5, columns: 5, mirrors: 2, targets: 3, obstaclePercent: 12 }],
    [{ rows: 6, columns: 6, mirrors: 3, targets: 4, obstaclePercent: 12 }], [{ rows: 6, columns: 6, mirrors: 4, targets: 5, obstaclePercent: 12 }, { rows: 7, columns: 7, mirrors: 4, targets: 5, obstaclePercent: 12 }],
    [{ rows: 7, columns: 7, mirrors: 4, targets: 5, obstaclePercent: 12 }, { rows: 7, columns: 7, mirrors: 5, targets: 6, obstaclePercent: 12 }], [{ rows: 7, columns: 7, mirrors: 5, targets: 6, obstaclePercent: 12 }, { rows: 8, columns: 8, mirrors: 5, targets: 6, obstaclePercent: 12 }],
  ],
  EQ: [[{ size: 3, kinds: EQ_DIRECT }], [{ size: 3, kinds: EQ_ALL }], [{ size: 4, kinds: EQ_ALL }], [{ size: 4, kinds: EQ_ALL }], [{ size: 5, kinds: EQ_ALL }], [{ size: 5, kinds: EQ_ALL }]],
  MA: [
    [{ silhouettes: SMALL_SIL, pieceSize: [3, 4] }], [{ silhouettes: SIL, pieceSize: [3, 4] }, { silhouettes: SIL, pieceSize: [4, 5] }],
    [{ silhouettes: SIL, pieceSize: [3, 5], flips: true }, { silhouettes: SIL, pieceSize: [3, 4] }], [{ silhouettes: SIL, pieceSize: [3, 5], flips: true }, { silhouettes: SIL, pieceSize: [4, 5], flips: true }], [], [],
  ],
  CR: [
    [{ bells: 3, length: [3, 3] }], [{ bells: 4, length: [4, 4] }, { bells: 3, length: [3, 3], reverse: true }], [{ bells: 4, length: [5, 6] }, { bells: 4, length: [4, 4], reverse: true }],
    [{ bells: 5, length: [6, 7] }, { bells: 4, length: [5, 6], reverse: true }], [{ bells: 5, length: [8, 8] }, { bells: 5, length: [6, 7], reverse: true }], [{ bells: 6, length: [9, 10] }, { bells: 5, length: [8, 8], reverse: true }],
  ],
  VI: [
    [{ rows: 2, cols: 3 }], [{ rows: 3, cols: 4 }, { rows: 3, cols: 3 }, { rows: 3, cols: 3, veiled: 1 }], [{ rows: 4, cols: 4 }, { rows: 3, cols: 4, veiled: 2 }],
    [{ rows: 4, cols: 4 }, { rows: 4, cols: 4, veiled: 3 }], [{ rows: 4, cols: 5 }, { rows: 4, cols: 5, veiled: 3 }], [{ rows: 5, cols: 5 }, { rows: 5, cols: 5, veiled: 4 }],
  ],
  DI: [
    [{ items: [8, 9], diffs: 3, kinds: ['missing', 'glyph'] }], [{ items: [10, 11], diffs: 4, kinds: ['missing', 'glyph', 'color'] }], [{ items: [12, 13], diffs: 5 }],
    [{ items: [12, 13], diffs: 5 }, { items: [13, 15], diffs: 6 }], [{ items: [13, 15], diffs: 6 }, { items: [15, 17], diffs: 7 }], [{ items: [15, 17], diffs: 7 }, { items: [17, 18], diffs: 8, kinds: ['color', 'turn', 'size', 'glyph'] }],
  ],
  ET: [[{ n: 3 }, { n: 4 }], [{ n: 4 }, { n: 5 }], [{ n: 5 }, { n: 6 }], [{ n: 6 }, { n: 5 }], [{ n: 7 }, { n: 6 }], [{ n: 7 }]],
  OM: [
    [{ cells: [4, 5], options: 3 }], [{ cells: [5, 6], options: 4 }, { cells: [5, 5], options: 4, reflection: true }],
    [{ cells: [6, 6], options: 4, nearMisses: true }, { cells: [5, 6], options: 5, nearMisses: true, reflection: true }],
    [{ cells: [7, 7], options: 6, nearMisses: true }, { cells: [5, 6], options: 5, nearMisses: true, reflection: true }, { cells: [6, 7], options: 5, nearMisses: true }],
    [{ cells: [7, 7], options: 6, nearMisses: true }, { cells: [6, 7], options: 6, nearMisses: true, reflection: true }],
    [{ cells: [8, 9], options: 6, nearMisses: true }, { cells: [7, 8], options: 6, nearMisses: true, reflection: true }],
  ],
  SC: [[], [], [], [], [], []],
  BR: [
    [{ rows: 5, cols: 5, density: 0.6 }, { rows: 5, cols: 5, density: 0.6, symmetric: true }], [{ rows: 6, cols: 6, density: 0.55, symmetric: true }, { rows: 6, cols: 6, density: 0.6 }],
    [{ rows: 7, cols: 7, density: 0.55, symmetric: true }, { rows: 8, cols: 8, density: 0.55 }], [{ rows: 9, cols: 9, density: 0.55, symmetric: true }, { rows: 10, cols: 10, density: 0.55, symmetric: true }],
    [{ rows: 10, cols: 10, density: 0.5 }, { rows: 10, cols: 10, density: 0.55, symmetric: true }], [],
  ],
  SG: [
    [{ n: 4, startSigns: 6, extraGivens: 4 }], [{ n: 4, startSigns: 6 }, { n: 4, startSigns: 6, extraGivens: 2 }], [{ n: 5, startSigns: 10 }, { n: 5, startSigns: 6 }],
    [{ n: 5, startSigns: 6 }, { n: 6, startSigns: 14 }], [{ n: 6, startSigns: 14 }, { n: 6, startSigns: 8 }], [{ n: 7, startSigns: 20 }],
  ],
  TO: [[{ n: 4, keepClues: 12, extraGivens: 3 }], [{ n: 4, keepClues: 8 }], [{ n: 5, keepClues: 12 }], [{ n: 5, keepClues: 8 }], [{ n: 6, keepClues: 14 }], [{ n: 6, keepClues: 10 }]],
  GL: [
    [{ rows: 5, cols: 5, rocks: [3, 5], moves: [2, 3] }], [{ rows: 6, cols: 6, rocks: [5, 8], moves: [4, 5] }], [{ rows: 7, cols: 7, rocks: [7, 11], moves: [6, 7] }],
    [{ rows: 7, cols: 7, rocks: [7, 11], moves: [7, 8] }, { rows: 8, cols: 8, rocks: [9, 14], moves: [8, 9] }], [{ rows: 8, cols: 8, rocks: [9, 14], moves: [9, 11] }], [{ rows: 9, cols: 9, rocks: [12, 18], moves: [11, 14] }],
  ],
  TQ: [
    [{ rows: 2, cols: 3, moves: [5, 8] }], [{ rows: 2, cols: 3, moves: [10, 16] }, { rows: 3, cols: 3, moves: [10, 13] }], [{ rows: 3, cols: 3, moves: [12, 15] }],
    [{ rows: 3, cols: 3, moves: [17, 20] }, { rows: 3, cols: 3, moves: [21, 23] }], [{ rows: 3, cols: 3, moves: [24, 31] }, { rows: 2, cols: 4, moves: [25, 32] }], [],
  ],
  RU: [[{ rows: 5, cols: 5, pairs: [4, 5] }, { rows: 6, cols: 6, pairs: [5, 6] }], [{ rows: 7, cols: 7, pairs: [6, 7] }], [{ rows: 8, cols: 8, pairs: [7, 8] }], [{ rows: 8, cols: 8, pairs: [5, 6] }], [{ rows: 9, cols: 9, pairs: [7, 8] }], []],
  LU: [[{ rows: 5, cols: 5, posts: [4, 5] }, { rows: 6, cols: 6, posts: [6, 7] }], [{ rows: 7, cols: 7, posts: [8, 10] }], [{ rows: 8, cols: 8, posts: [11, 13] }], [{ rows: 8, cols: 8, posts: [11, 13] }, { rows: 9, cols: 9, posts: [14, 16] }], [{ rows: 9, cols: 9, posts: [14, 16] }], []],
  PA: [[{ rows: 5, cols: 5, islands: [4, 5] }, { rows: 6, cols: 6, islands: [6, 8] }], [{ rows: 7, cols: 7, islands: [9, 11] }], [{ rows: 8, cols: 8, islands: [12, 14] }], [{ rows: 9, cols: 9, islands: [15, 18] }], [{ rows: 10, cols: 10, islands: [18, 22] }], []],
  BA: [
    [{ unknowns: 2, maxWeight: 20 }],
    [{ unknowns: 2, maxWeight: 20 }],
    [{ unknowns: 3, maxWeight: 20 }],
    [{ unknowns: 3, maxWeight: 20 }, { unknowns: 4, maxWeight: 16 }],
    [{ unknowns: 4, maxWeight: 16 }],
    [{ unknowns: 4, maxWeight: 16 }],
  ],
};

