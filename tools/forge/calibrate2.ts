import { CandidatePipeline } from '../../app/src/core/puzzlekit/pipeline';
import { PatternsFamily } from '../../app/src/core/families/patterns';
import { LiarsFamily } from '../../app/src/core/families/liars';
import { ThreadsFamily } from '../../app/src/core/families/threads';
import { MirrorsFamily } from '../../app/src/core/families/mirrors';
import { InquiriesFamily } from '../../app/src/core/families/inquiries';
import { MarquetryFamily, SILHOUETTES } from '../../app/src/core/families/marquetry';

function measure(name: string, family: any, params: any, n = 20, attempts = 3000) {
  const t0 = Date.now();
  const { accepted } = new CandidatePipeline(family).generate(n, params, 9n, undefined, attempts);
  const hist = [0, 0, 0, 0, 0, 0];
  accepted.forEach((a: any) => hist[a.tier]++);
  const sc = accepted.map((a: any) => a.score).sort((x: number, y: number) => x - y);
  const q = (f: number) => sc[Math.min(sc.length - 1, Math.floor(f * sc.length))];
  console.log(`${name.padEnd(30)} n=${String(accepted.length).padStart(2)} tiers=${hist.join(' ')} score ${q(0)}/${q(0.25)}/${q(0.5)}/${q(0.75)}/${q(0.99)} ${((Date.now() - t0) / Math.max(1, accepted.length)).toFixed(0)}ms`);
}
const only = process.argv[2];
const run = (f: string, fn: () => void) => { if (!only || only === f) fn(); };
run('MO', () => { const f = new PatternsFamily(); measure('MO 1', f, { active: 1 }); measure('MO 2', f, { active: 2 }); measure('MO 2d', f, { active: 2, distribution: true }); measure('MO 3d', f, { active: 3, distribution: true }); });
run('ME', () => {
  const f = new LiarsFamily();
  measure('ME 3 simple', f, { characters: 3, kinds: ['liar', 'honest'] });
  measure('ME 4', f, { characters: 4, kinds: ['liar', 'honest', 'atLeastOneLiar', 'exactlyLiars'] });
  measure('ME 5', f, { characters: 5, kinds: ['liar', 'honest', 'exactlyLiars', 'same', 'ifThen'] });
  measure('ME 6', f, { characters: 6, kinds: ['liar', 'honest', 'exactlyLiars', 'same', 'different', 'ifThen'] }, 10, 8000);
});
run('FI', () => { const f = new ThreadsFamily(); for (const [r, w] of [[4, 20], [5, 30], [5, 10], [6, 25], [6, 10], [7, 15]]) measure(`FI ${r}x${r} w${w}`, f, { rows: r, columns: r, wallPercent: w }, 12, 300); });
run('MI', () => { const f = new MirrorsFamily(); for (const [s, m] of [[5, 2], [6, 3], [6, 4], [7, 4], [7, 5], [8, 5]]) measure(`MI ${s}x${s} m${m}`, f, { rows: s, columns: s, mirrors: m, targets: m + 1, obstaclePercent: 12 }, 10, 6000); });
run('EQ', () => { const f = new InquiriesFamily(); const all = ['has', 'hasNot', 'at', 'notAt', 'objectAt', 'objectNotAt', 'either'];
  measure('EQ 3 direct', f, { size: 3, kinds: ['has', 'at', 'hasNot', 'notAt'] }); measure('EQ 3 all', f, { size: 3, kinds: all }); measure('EQ 4 all', f, { size: 4, kinds: all }, 10, 400); measure('EQ 5 all', f, { size: 5, kinds: all }, 5, 200); });
run('MA', () => { const f = new MarquetryFamily(); const all = Object.keys(SILHOUETTES);
  measure('MA 3-4', f, { silhouettes: all, pieceSize: [3, 4] }); measure('MA 4-5', f, { silhouettes: all, pieceSize: [4, 5] }); measure('MA 4-5 flips', f, { silhouettes: all, pieceSize: [4, 5], flips: true }); measure('MA 3-5 flips', f, { silhouettes: all, pieceSize: [3, 5], flips: true }); });
