// Puzzles of the prototype (prototype/index.html § 6), ported as pure logic so
// the app plays exactly the same boards. Data was generated and proven unique
// by prototype/verification/*.py.

export type Cell = readonly [number, number];

// Direction bits: 0 = up, 1 = right, 2 = down, 3 = left.
export const DIRS: readonly Cell[] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

/** Rotates a 4-bit opening mask clockwise `k` quarter turns. */
export function rotateMask(mask: number, k: number): number {
  k = ((k % 4) + 4) % 4;
  let m = mask;
  for (let i = 0; i < k; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}

// MARK: - Engrenages (gears)

export const GEARS = {
  size: 4,
  solution: [[2, 14, 12, 4], [6, 9, 5, 5], [7, 8, 7, 9], [3, 8, 3, 8]],
  scramble: [[1, 2, 3, 1], [2, 1, 1, 3], [3, 2, 1, 2], [1, 3, 2, 1]],
  source: [0, 1] as Cell,
  hints: {
    fr: [
      'Commence par les coins : une tuile de coin ne peut pas regarder vers l’extérieur.',
      'La tuile en haut à gauche est une lanterne : sa seule ouverture doit regarder vers la source, à droite.',
      'La source (en haut, 2ᵉ colonne) envoie la lumière à gauche, à droite et vers le bas. Tourne-la pour qu’elle ne regarde pas vers le bord.',
    ],
  },
} as const;

export function gearsInitial(): number[][] {
  return GEARS.solution.map((row, r) => row.map((m, c) => rotateMask(m, GEARS.scramble[r][c])));
}

export interface GearsState {
  lit: Set<number>;
  open: Set<number>;
  ok: boolean;
}

export function gearsState(rot: readonly (readonly number[])[]): GearsState {
  const n = GEARS.size;
  const key = (r: number, c: number) => r * n + c;
  const lit = new Set<number>();
  const open = new Set<number>();
  const [sr, sc] = GEARS.source;
  const stack: Cell[] = [[sr, sc]];
  lit.add(key(sr, sc));
  const connected = (r: number, c: number, b: number): boolean => {
    const rr = r + DIRS[b][0], cc = c + DIRS[b][1];
    if (rr < 0 || cc < 0 || rr >= n || cc >= n) return false;
    return ((rot[rr][cc] >> ((b + 2) % 4)) & 1) === 1;
  };
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    for (let b = 0; b < 4; b++) {
      if (((rot[r][c] >> b) & 1) === 0) continue;
      if (!connected(r, c, b)) { open.add(key(r, c)); continue; }
      const rr = r + DIRS[b][0], cc = c + DIRS[b][1];
      if (!lit.has(key(rr, cc))) { lit.add(key(rr, cc)); stack.push([rr, cc]); }
    }
  }
  let ok = lit.size === n * n;
  if (ok) {
    for (let r = 0; r < n && ok; r++)
      for (let c = 0; c < n && ok; c++)
        for (let b = 0; b < 4; b++)
          if (((rot[r][c] >> b) & 1) === 1 && !connected(r, c, b)) { ok = false; break; }
  }
  return { lit, open, ok };
}

// MARK: - Interrupteurs (switches)

export const SWITCHES = {
  size: 3,
  presses: [[0, 0], [1, 2], [2, 1]] as Cell[],
  hints: {
    fr: [
      'Chaque bouton touche aussi ses voisins en croix. Commence par un coin.',
      'Le coin en haut à gauche éteint est bien placé pour tout rallumer autour de lui.',
      'Appuie sur le coin en haut à gauche, puis cherche les deux boutons restants au bord.',
    ],
  },
} as const;

/** Toggles (r, c) and its orthogonal neighbours, in place. */
export function toggleCross(board: number[][], r: number, c: number): void {
  for (const [dr, dc] of [[0, 0], ...DIRS]) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < board.length && cc < board[rr].length) board[rr][cc] ^= 1;
  }
}

export function switchesInitial(): number[][] {
  const n = SWITCHES.size;
  const b = Array.from({ length: n }, () => Array<number>(n).fill(1));
  for (const [r, c] of SWITCHES.presses) toggleCross(b, r, c);
  return b;
}

/** The two-button tutorial board. */
export function tutorialInitial(): number[][] {
  return [[0, 0], [0, 1]];
}

export const allOn = (b: readonly (readonly number[])[]) => b.every((row) => row.every((v) => v === 1));

// MARK: - Cadenas (lock)

export const LOCK = {
  code: '492',
  clues: [['261', 0, 1], ['349', 0, 2], ['976', 0, 1], ['347', 0, 1], ['185', 0, 0]] as [string, number, number][],
  hints: {
    fr: [
      'Compare les lignes 3 4 9 et 3 4 7.',
      'Si 3 et 4 étaient tous les deux dans le code, la ligne 3 4 7 aurait deux chiffres justes.',
      'Donc le 9 est dans le code. Avec 9 7 6, le 7 et le 6 sont exclus, et le 9 n’est ni au début ni à la fin : il est au milieu.',
    ],
  },
} as const;

/** [well placed, misplaced] for `guess` against `code`. */
export function lockPegs(code: string, guess: string): [number, number] {
  let wp = 0, mp = 0;
  for (let i = 0; i < 3; i++) {
    if (code[i] === guess[i]) wp++;
    else if (code.includes(guess[i])) mp++;
  }
  return [wp, mp];
}

export type LockCheck =
  | { kind: 'solved' }
  | { kind: 'repeatedDigits' }
  | { kind: 'contradicts'; clue: number; got: [number, number]; expected: [number, number] };

export function checkLock(guess: string): LockCheck {
  if (new Set(guess).size < 3) return { kind: 'repeatedDigits' };
  if (guess === LOCK.code) return { kind: 'solved' };
  const i = LOCK.clues.findIndex(([g, a, b]) => {
    const [x, y] = lockPegs(guess, g);
    return x !== a || y !== b;
  });
  const [g, a, b] = LOCK.clues[i];
  return { kind: 'contradicts', clue: i, got: lockPegs(guess, g), expected: [a, b] };
}

// MARK: - Lampes (lamps)

export const LAMPS = {
  grid: ['.X..XX', '..3...', 'XXXX..', '..XX2X', '...X..', 'X2..X.'],
  solution: [[0, 0], [0, 2], [1, 1], [1, 3], [2, 4], [3, 0], [4, 1], [4, 4], [5, 2], [5, 5]] as Cell[],
  hints: {
    fr: [
      'Regarde le mur marqué 3.',
      'Le mur 3 n’a que trois cases libres autour de lui : elles portent toutes une lampe.',
      'Place une lampe au-dessus, à gauche et à droite du 3. Fais de même avec le 2 de droite : ses deux seules cases libres sont au-dessus et en dessous.',
    ],
  },
} as const;

export interface LampsState {
  lit: Set<number>;
  conflicts: Set<number>;
  walls: Map<number, { need: number; have: number }>;
  over: { r: number; c: number; need: number; have: number } | null;
  ok: boolean;
}

/** `marks[r][c]`: 0 empty, 1 lamp, 2 dot (player's "no lamp" note). */
export function lampsState(marks: readonly (readonly number[])[]): LampsState {
  const g = LAMPS.grid, n = g.length;
  const lit = new Set<number>(), conflicts = new Set<number>();
  const open = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && g[r][c] === '.';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (marks[r][c] !== 1 || g[r][c] !== '.') continue;
    lit.add(r * n + c);
    for (const [dr, dc] of DIRS) {
      let rr = r + dr, cc = c + dc;
      while (open(rr, cc)) {
        lit.add(rr * n + cc);
        if (marks[rr][cc] === 1) { conflicts.add(r * n + c); conflicts.add(rr * n + cc); }
        rr += dr; cc += dc;
      }
    }
  }
  const walls = new Map<number, { need: number; have: number }>();
  let over: LampsState['over'] = null;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!'01234'.includes(g[r][c])) continue;
    const need = Number(g[r][c]);
    let have = 0;
    for (const [dr, dc] of DIRS) if (open(r + dr, c + dc) && marks[r + dr][c + dc] === 1) have++;
    walls.set(r * n + c, { need, have });
    if (have > need && over === null) over = { r, c, need, have };
  }
  let white = 0, litWhite = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] === '.') {
    white++;
    if (lit.has(r * n + c)) litWhite++;
  }
  const ok = litWhite === white && conflicts.size === 0 && [...walls.values()].every((w) => w.have === w.need);
  return { lit, conflicts, walls, over, ok };
}

export function lampsInitial(): number[][] {
  return LAMPS.grid.map((row) => [...row].map(() => 0));
}

// MARK: - Suites (sequences)

export const SEQUENCE = {
  sequence: [3, 5, 9, 17, 33],
  options: [49, 65, 66, 50],
  answer: 65,
  hints: {
    fr: [
      'Regarde l’écart entre deux nombres voisins.',
      'Les écarts sont 2, 4, 8, 16.',
      'Chaque écart double : le prochain écart est 32.',
    ],
  },
} as const;

// MARK: - Balances (scales, daily puzzle)
// Scale 1: 2 circles = triangle. Scale 2: triangle + circle = 12.
// Scale 3: square = 2 triangles. Question: the square.

export const SCALES = {
  answer: 16,
  hints: {
    fr: [
      'Commence par la balance 2 : elle contient un poids connu.',
      'Dans la balance 2, remplace le triangle par deux cercles (balance 1).',
      'Trois cercles pèsent 12 : un cercle pèse 4, un triangle 8.',
    ],
  },
} as const;
