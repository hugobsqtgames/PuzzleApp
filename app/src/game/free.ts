// Mode Libre: puzzles of any family met so far, at the chosen difficulty,
// made on the phone with the Forge's own parameters. Nothing to win: no
// Shards, no lights, every hint free. Generation runs in small slices so the
// screen never freezes, and gives up after a few seconds.
import { CandidatePipeline } from '../core/puzzlekit/pipeline';
import { StableHash } from '../core/puzzlekit/rng';
import type { Tier } from '../core/puzzlekit/types';
import { FORGE_PARAMS } from '../core/content/forgeParams';
import { FAMILIES, shippedOf, type Code, type PlayablePuzzle } from './catalog';

/** Families that can be played freely (the seal of the buildings cannot). */
export const FREE_CODES = (Object.keys(FAMILIES) as Code[]).filter((c) => c !== 'SC' && (FORGE_PARAMS[c] ?? []).some((l) => l.length));

/** Tiers this family can be made at. */
export const freeTiers = (c: Code): Tier[] => (FORGE_PARAMS[c] ?? []).map((l, t) => (l.length ? t : -1)).filter((t) => t >= 0) as Tier[];

const made = new Map<string, PlayablePuzzle>();
/** A free puzzle made earlier in this run of the app (to start it again). */
export const freePuzzle = (id: string) => made.get(id) ?? null;

/**
 * Families and difficulties too slow to make on a phone: a single try can take whole seconds,
 * and the screen would freeze meanwhile. They are drawn from the game's own puzzles instead
 * (its lanterns and evening challenges). Measured: free.test.ts keeps every other one quick.
 */
export const FROM_THE_GAME: Partial<Record<Code, Tier[]>> = { BA: [4, 5], CA: [4, 5], FI: [3, 4, 5], SG: [3, 4, 5], TO: [4, 5] };
const fromTheGameOnly = (code: Code, tier: Tier) => !!FROM_THE_GAME[code]?.includes(tier);

/** One of the game's own puzzles, same family, same difficulty (or the nearest). */
function fromTheGame(code: Code, tier: Tier): PlayablePuzzle | null {
  const all = shippedOf(code);
  if (!all.length) return null;
  const same = all.filter((x) => x.tier === tier);
  const pool = same.length ? same : all.slice().sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier)).slice(0, 40);
  for (let k = 0; k < 5; k++) {
    const pick = pool[Math.floor(Math.random() * pool.length)].open();
    if (!pick) continue;
    const p: PlayablePuzzle = { ...pick, id: `free.${code}.g${Date.now().toString(36)}${k}` };
    made.set(p.id, p);
    return p;
  }
  return null;
}

/** Makes a puzzle; calls back with it (or one of the game's own if it takes too long), or null. Returns a cancel function. */
export function makeFreePuzzle(code: Code, tier: Tier, onDone: (p: PlayablePuzzle | null) => void, budgetMs = 5000): () => void {
  if (fromTheGameOnly(code, tier)) { const t = setTimeout(() => onDone(fromTheGame(code, tier)), 0); return () => clearTimeout(t); }
  const pipe = new CandidatePipeline(FAMILIES[code].engine as never);
  const list = FORGE_PARAMS[code]?.[tier] ?? [];
  const base = StableHash.seed('libre', code, String(tier), String(Date.now()));
  const started = Date.now();
  let i = 0, cancelled = false;
  const slice = () => {
    if (cancelled) return;
    const sliceStart = Date.now();
    while (Date.now() - sliceStart < 30) {
      if (!list.length || Date.now() - started > budgetMs) { onDone(fromTheGame(code, tier)); return; }
      const out = pipe.evaluate(list[i % list.length] as never, base + BigInt(i));
      i++;
      if ('accepted' in out) {
        const p: PlayablePuzzle = { id: `free.${code}.${base.toString(36)}`, code, tier, data: out.accepted.puzzle };
        made.set(p.id, p);
        onDone(p);
        return;
      }
    }
    setTimeout(slice, 0);
  };
  setTimeout(slice, 0);
  return () => { cancelled = true; };
}
