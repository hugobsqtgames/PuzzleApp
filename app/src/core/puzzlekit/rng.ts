/**
 * Générateurs pseudo-aléatoires déterministes — portage exact du cœur Swift (PuzzleKit/SeededRNG.swift).
 * Toute l'arithmétique 64 bits passe par BigInt : mêmes graines ⇒ mêmes nombres ⇒ mêmes puzzles,
 * sur iOS, Android et dans les outils. Ne jamais utiliser Math.random() pour la structure d'un puzzle.
 */
const MASK = (1n << 64n) - 1n;

export class SplitMix64 {
  state: bigint;
  constructor(seed: bigint) {
    this.state = seed & MASK;
  }
  next(): bigint {
    this.state = (this.state + 0x9e3779b97f4a7c15n) & MASK;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK;
    return z ^ (z >> 31n);
  }
}

const rotl = (x: bigint, k: bigint) => ((x << k) | (x >> (64n - k))) & MASK;

/** Xoshiro256** */
export class SeededRNG {
  private s0: bigint;
  private s1: bigint;
  private s2: bigint;
  private s3: bigint;

  constructor(seed: bigint) {
    const sm = new SplitMix64(seed);
    this.s0 = sm.next();
    this.s1 = sm.next();
    this.s2 = sm.next();
    this.s3 = sm.next();
  }

  next(): bigint {
    const result = (rotl((this.s1 * 5n) & MASK, 7n) * 9n) & MASK;
    const t = (this.s1 << 17n) & MASK;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 45n);
    return result;
  }

  /** Entier uniforme dans 0..<bound (rejet, sans biais — algorithme figé). */
  below64(bound: bigint): bigint {
    if (bound <= 0n) throw new RangeError('bound must be positive');
    const limit = MASK - (MASK % bound);
    for (;;) {
      const x = this.next();
      if (x < limit) return x % bound;
    }
  }

  below(bound: number): number {
    if (!Number.isInteger(bound) || bound <= 0) throw new RangeError('bound must be a positive integer');
    return Number(this.below64(BigInt(bound)));
  }

  /** Entier uniforme dans l'intervalle fermé [lo, hi]. */
  int(lo: number, hi: number): number {
    if (hi < lo) throw new RangeError('empty range');
    return lo + Number(this.below64(BigInt(hi) - BigInt(lo) + 1n));
  }

  /** Vrai avec une probabilité numerator/denominator (sans flottant). */
  chance(numerator: number, denominator: number): boolean {
    return this.below(denominator) < numerator;
  }

  bool(): boolean {
    return (this.next() & 1n) === 1n;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('cannot pick from an empty array');
    return items[this.below(items.length)];
  }

  /** Fisher–Yates, implémentation figée (identique au Swift). */
  shuffle<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.below(i + 1);
      if (i !== j) [items[i], items[j]] = [items[j], items[i]];
    }
  }

  shuffled<T>(items: readonly T[]): T[] {
    const copy = items.slice();
    this.shuffle(copy);
    return copy;
  }
}

function utf8(text: string): number[] {
  const bytes: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return bytes;
}

export const StableHash = {
  /** FNV-1a 64 bits sur l'UTF-8 du texte. */
  fnv1a64(text: string): bigint {
    let hash = 0xcbf29ce484222325n;
    for (const b of utf8(text)) {
      hash ^= BigInt(b);
      hash = (hash * 0x100000001b3n) & MASK;
    }
    return hash;
  },
  /** Graine dérivée de composants séparés par « | ». */
  seed(...components: string[]): bigint {
    return new SplitMix64(StableHash.fnv1a64(components.join('|'))).next();
  },
};
