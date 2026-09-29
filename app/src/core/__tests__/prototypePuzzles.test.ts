import {
  GEARS, gearsInitial, gearsState, rotateMask,
  switchesInitial, toggleCross, allOn, SWITCHES, tutorialInitial,
  LOCK, checkLock, lockPegs,
  LAMPS, lampsInitial, lampsState,
  SEQUENCE, SCALES,
} from '../../content/prototypePuzzles';

describe('prototype puzzles', () => {
  test('gears: scrambled board is unsolved, the solution lights everything', () => {
    expect(gearsState(gearsInitial()).ok).toBe(false);
    const solved = GEARS.solution.map((row) => [...row]);
    const st = gearsState(solved);
    expect(st.ok).toBe(true);
    expect(st.lit.size).toBe(16);
    expect(st.open.size).toBe(0);
  });

  test('gears: four quarter turns are the identity', () => {
    for (let m = 0; m < 16; m++) expect(rotateMask(m, 4)).toBe(m);
    expect(rotateMask(1, 1)).toBe(2);
    expect(rotateMask(8, 1)).toBe(1);
    expect(rotateMask(2, -1)).toBe(1);
  });

  test('gears: the solution is unique (brute force over all rotations)', () => {
    const start = gearsInitial();
    const n = GEARS.size;
    // Distinct rotations per tile (symmetric tiles have fewer).
    const options = start.map((row) => row.map((m) => [...new Set([0, 1, 2, 3].map((k) => rotateMask(m, k)))]));
    let solutions = 0;
    const board = start.map((row) => [...row]);
    // Row-major search, pruning any tile whose openings don't match its
    // already-placed top/left neighbours or that points off the board.
    const fits = (r: number, c: number, m: number): boolean => {
      if (r === 0 && (m & 1)) return false;
      if (c === n - 1 && (m & 2)) return false;
      if (r === n - 1 && (m & 4)) return false;
      if (c === 0 && (m & 8)) return false;
      if (r > 0 && ((m & 1) !== 0) !== ((board[r - 1][c] & 4) !== 0)) return false;
      if (c > 0 && ((m & 8) !== 0) !== ((board[r][c - 1] & 2) !== 0)) return false;
      return true;
    };
    const rec = (i: number) => {
      if (i === n * n) { if (gearsState(board).ok) solutions++; return; }
      const r = Math.floor(i / n), c = i % n;
      for (const m of options[r][c]) if (fits(r, c, m)) { board[r][c] = m; rec(i + 1); }
    };
    rec(0);
    expect(solutions).toBe(1);
  });

  test('switches: the documented presses solve the board', () => {
    const b = switchesInitial();
    expect(allOn(b)).toBe(false);
    for (const [r, c] of SWITCHES.presses) toggleCross(b, r, c);
    expect(allOn(b)).toBe(true);
    const t = tutorialInitial();
    toggleCross(t, 0, 0);
    expect(allOn(t)).toBe(true);
  });

  test('lock: the code satisfies every clue and is the only one', () => {
    for (const [g, a, b] of LOCK.clues) expect(lockPegs(LOCK.code, g)).toEqual([a, b]);
    const valid: string[] = [];
    for (let x = 0; x < 1000; x++) {
      const s = String(x).padStart(3, '0');
      if (new Set(s).size === 3 && LOCK.clues.every(([g, a, b]) => {
        const [p, q] = lockPegs(s, g);
        return p === a && q === b;
      })) valid.push(s);
    }
    expect(valid).toEqual([LOCK.code]);
    expect(checkLock('492')).toEqual({ kind: 'solved' });
    expect(checkLock('442')).toEqual({ kind: 'repeatedDigits' });
    const wrong = checkLock('123');
    expect(wrong.kind).toBe('contradicts');
  });

  test('lamps: the solution is valid; an empty board is not', () => {
    expect(lampsState(lampsInitial()).ok).toBe(false);
    const m = lampsInitial();
    for (const [r, c] of LAMPS.solution) m[r][c] = 1;
    const st = lampsState(m);
    expect(st.conflicts.size).toBe(0);
    expect(st.ok).toBe(true);
  });

  test('lamps: lamps that see each other conflict, walls report overflow', () => {
    const m = lampsInitial();
    m[1][0] = 1; m[1][1] = 1;
    const st = lampsState(m);
    expect(st.conflicts.has(6)).toBe(true);
    expect(st.conflicts.has(7)).toBe(true);
    const w = lampsInitial();
    // Wall "2" at (5,1): its only open neighbours are (4,1) and (5,2).
    w[4][1] = 1; w[5][2] = 1; w[4][0] = 1;
    expect(lampsState(w).walls.get(5 * 6 + 1)).toEqual({ need: 2, have: 2 });
  });

  test('lamps: a mark on a wall cell is ignored', () => {
    const m = lampsInitial();
    for (const [r, c] of LAMPS.solution) m[r][c] = 1;
    m[0][1] = 1; // wall
    expect(lampsState(m).ok).toBe(true);
  });

  test('sequence and scales answers follow their rules', () => {
    const s = SEQUENCE.sequence;
    const gaps = s.slice(1).map((v, i) => v - s[i]);
    expect(gaps).toEqual([2, 4, 8, 16]);
    expect(s[s.length - 1] + gaps[gaps.length - 1] * 2).toBe(SEQUENCE.answer);
    expect(SEQUENCE.options).toContain(SEQUENCE.answer);
    // circle c, triangle t: 2c = t, t + c = 12, square = 2t.
    const c = 12 / 3, t = 2 * c;
    expect(2 * t).toBe(SCALES.answer);
  });
});
