// Measures the tiers each generator produces for candidate parameters.
import { CandidatePipeline } from '../../app/src/core/puzzlekit/pipeline';
import { SwitchesFamily } from '../../app/src/core/families/switches';
import { LocksFamily } from '../../app/src/core/families/locks';
import { LampsFamily } from '../../app/src/core/families/lamps';
import { GearsFamily } from '../../app/src/core/families/gears';
import { SequencesFamily } from '../../app/src/core/families/sequences';
import { ScalesFamily } from '../../app/src/core/families/scales';

function measure(name: string, family: any, params: any, n = 30, attempts = 400) {
  const t0 = Date.now();
  const { accepted } = new CandidatePipeline(family).generate(n, params, 9n, undefined, attempts);
  const hist = [0, 0, 0, 0, 0, 0];
  accepted.forEach((a: any) => hist[a.tier]++);
  const sc = accepted.map((a: any) => a.score).sort((x: number, y: number) => x - y);
  const q = (f: number) => sc[Math.min(sc.length - 1, Math.floor(f * sc.length))];
  const ms = (Date.now() - t0) / Math.max(1, accepted.length);
  console.log(`${name.padEnd(34)} n=${String(accepted.length).padStart(2)} tiers=${hist.join(' ')} score ${q(0)}/${q(0.25)}/${q(0.5)}/${q(0.75)}/${q(0.99)}  ${ms.toFixed(0)}ms/puzzle`);
}
const only = process.argv[2];
const run = (f: string, fn: () => void) => { if (!only || only === f) fn(); };
run('switches', () => {
  const f = new SwitchesFamily();
  measure('switches 2x2 [1,2]', f, { rows: 2, columns: 2, presses: [1, 2] });
  measure('switches 3x3 [2,3]', f, { rows: 3, columns: 3, presses: [2, 3] });
  measure('switches 3x3 [3,5]', f, { rows: 3, columns: 3, presses: [3, 5] });
  measure('switches 4x4 [4,7]', f, { rows: 4, columns: 4, presses: [4, 7] });
  measure('switches 5x5 [6,10]', f, { rows: 5, columns: 5, presses: [6, 10] });
  measure('switches 5x5 [9,13]', f, { rows: 5, columns: 5, presses: [9, 13] });
  measure('switches 5x5 diag [8,12]', f, { rows: 5, columns: 5, pattern: 'diagonal', presses: [8, 12] });
  measure('switches 6x6 [10,14]', f, { rows: 6, columns: 6, presses: [10, 14] });
});
run('locks', () => {
  const f = new LocksFamily();
  measure('locks 3 [3,5]', f, { length: 3, clueCount: [3, 5] });
  measure('locks 3 [4,7]', f, { length: 3, clueCount: [4, 7] });
  measure('locks 4 [4,7]', f, { length: 4, clueCount: [4, 7] });
  measure('locks 4 rep [5,9]', f, { length: 4, allowsRepeats: true, clueCount: [5, 9] });
  measure('locks 5 [5,9]', f, { length: 5, clueCount: [5, 9] }, 10);
});
run('lamps', () => {
  const f = new LampsFamily();
  measure('lamps 5x5', f, { rows: 5, columns: 5 });
  measure('lamps 6x6', f, { rows: 6, columns: 6 });
  measure('lamps 7x7', f, { rows: 7, columns: 7 }, 15);
  measure('lamps 8x8', f, { rows: 8, columns: 8 }, 10);
});
run('gears', () => {
  const f = new GearsFamily();
  measure('gears 4x4', f, { rows: 4, columns: 4 });
  measure('gears 5x5', f, { rows: 5, columns: 5 });
  measure('gears 6x6', f, { rows: 6, columns: 6 }, 15);
  measure('gears 7x7', f, { rows: 7, columns: 7 }, 10);
});
run('sequences', () => {
  const f = new SequencesFamily();
  for (const k of [1, 2, 3]) measure(`sequences k=${k}`, f, { complexity: k });
});
run('scales', () => {
  const f = new ScalesFamily();
  measure('scales 2', f, { unknowns: 2, maxWeight: 20 });
  measure('scales 3', f, { unknowns: 3, maxWeight: 20 }, 15);
  measure('scales 4', f, { unknowns: 4, maxWeight: 16 }, 6, 3000);
});
