// Tier reach of the new families' parameter sets.
import { CandidatePipeline } from '../../app/src/core/puzzlekit/pipeline';
import { ChimesFamily } from '../../app/src/core/families/chimes';
import { StainedFamily } from '../../app/src/core/families/stained';
import { SpotFamily } from '../../app/src/core/families/spot';
import { ShelfFamily } from '../../app/src/core/families/shelf';
import { ShadowsFamily } from '../../app/src/core/families/shadows';
const sets: [string, any, any[]][] = [
  ['CR', new ChimesFamily(), [{ bells: 3, length: [3, 3] }, { bells: 4, length: [4, 4] }, { bells: 4, length: [5, 6] }, { bells: 5, length: [6, 7] }, { bells: 5, length: [8, 8] }, { bells: 6, length: [9, 10] }]],
  ['VI', new StainedFamily(), [{ rows: 2, cols: 3 }, { rows: 3, cols: 3 }, { rows: 3, cols: 4 }, { rows: 4, cols: 4 }, { rows: 4, cols: 5 }, { rows: 5, cols: 5 }]],
  ['DI', new SpotFamily(), [{ items: [8, 9], diffs: 3, kinds: ['missing', 'glyph'] }, { items: [10, 11], diffs: 4, kinds: ['missing', 'glyph', 'color'] }, { items: [12, 13], diffs: 5 }, { items: [13, 15], diffs: 6 }, { items: [15, 17], diffs: 7 }, { items: [17, 18], diffs: 8, kinds: ['color', 'turn', 'size', 'glyph'] }]],
  ['ET', new ShelfFamily(), [{ n: 3 }, { n: 4 }, { n: 5 }, { n: 6 }, { n: 7 }]],
  ['OM', new ShadowsFamily(), [{ cells: [4, 5], options: 3 }, { cells: [5, 6], options: 4 }, { cells: [6, 6], options: 4, nearMisses: true }, { cells: [7, 7], options: 6, nearMisses: true }, { cells: [8, 9], options: 6, nearMisses: true }]],
];
for (const [code, fam, params] of sets) {
  for (const p of params) {
    const t0 = Date.now();
    const { accepted } = new CandidatePipeline(fam).generate(30, p, 7n, undefined, 3000);
    const h = [0, 0, 0, 0, 0, 0]; accepted.forEach((a: any) => h[a.tier]++);
    console.log(code, JSON.stringify(p), 'n=' + accepted.length, h.join(' '), `${Date.now() - t0}ms`);
  }
}
