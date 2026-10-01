// Mode Libre: puzzles of any family met so far, at the chosen difficulty,
// made on the phone with the Forge's own parameters. Nothing to win: no
// Shards, no lights, every hint free. Generation runs in small slices so the
// screen never freezes, and gives up after a few seconds.
import { CandidatePipeline } from '../core/puzzlekit/pipeline';
import { StableHash } from '../core/puzzlekit/rng';
import type { Tier } from '../core/puzzlekit/types';
import { FORGE_PARAMS } from '../core/content/forgeParams';
import { FAMILIES, WORLD, puzzleFor, type Code, type PlayablePuzzle } from './catalog';
import { worldLanterns } from '../core/game/world';

/** Families that can be played freely (the seal of the buildings cannot). */
export const FREE_CODES = (Object.keys(FAMILIES) as Code[]).filter((c) => c !== 'SC' && (FORGE_PARAMS[c] ?? []).some((l) => l.length));

/** Tiers this family can be made at. */
export const freeTiers = (c: Code): Tier[] => (FORGE_PARAMS[c] ?? []).map((l, t) => (l.length ? t : -1)).filter((t) => t >= 0) as Tier[];

const made = new Map<string, PlayablePuzzle>();
/** A free puzzle made earlier in this run of the app (to start it again). */
export const freePuzzle = (id: string) => made.get(id) ?? null;

/** When making one takes too long (big puzzles on an older phone): one of the game's own, same family, same difficulty. */
function fromTheGame(code: Code, tier: Tier): PlayablePuzzle | null {
  const pool = worldLanterns(WORLD).filter((l) => l.family === code && l.tier === tier);
  const near = pool.length ? pool : worldLanterns(WORLD).filter((l) => l.family === code).sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier)).slice(0, 20);
  if (!near.length) return null;
  const pick = puzzleFor(near[Math.floor(Math.random() * near.length)].puzzle);
  if (!pick) return null;
  const p: PlayablePuzzle = { ...pick, id: `free.${code}.g${Date.now().toString(36)}` };
  made.set(p.id, p);
  return p;
}

/** Makes a puzzle; calls back with it (or one of the game's own if it takes too long), or null. Returns a cancel function. */
export function makeFreePuzzle(code: Code, tier: Tier, onDone: (p: PlayablePuzzle | null) => void, budgetMs = 5000): () => void {
  // Too slow to make on a phone (several seconds even on a computer): straight to the game's own.
  if (code === 'BA' && tier >= 4) { const t = setTimeout(() => onDone(fromTheGame(code, tier)), 0); return () => clearTimeout(t); }
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
