// The app can be killed at any instant, even in the middle of a save. A disk that behaves like the
// phone's (a replace is « delete, then move »; a file can be left half written) is stopped at every
// single step of a save; the next launch must find the game as it was before, or as it was being
// saved: never less, never a mix, never a fresh game.
import { SeededRNG } from '../puzzlekit/rng';
import { GameState, credit, encodeState, newGameState } from '../game/state';
import { FileSystem, SaveStore } from '../persistence/saveStore';
import { SideFile } from '../persistence/sideFile';
import { exportText, parseImport } from '../../game/saveText';

class Killed extends Error {}

/** In-memory disk with the phone's behaviour; `killAt` stops everything at that operation. */
class PhoneDisk {
  files = new Map<string, string>();
  unreadable = new Set<string>();
  ops = 0;
  killAt = Infinity;
  private step() { if (++this.ops >= this.killAt) throw new Killed(); }
  fs(): FileSystem {
    const f = this.files;
    return {
      exists: async (p) => f.has(p),
      read: async (p) => { if (this.unreadable.has(p)) throw new Error('locked'); const v = f.get(p); if (v === undefined) throw new Error('missing'); return v; },
      // Not atomic: half the text first, then all of it.
      write: async (p, t) => { this.step(); f.set(p, t.slice(0, Math.floor(t.length / 2))); this.step(); f.set(p, t); },
      // expo-file-system with overwrite: delete the destination, then move.
      move: async (a, b) => { const v = f.get(a); if (v === undefined) throw new Error('missing'); if (f.has(b)) { this.step(); f.delete(b); } this.step(); f.set(b, v); f.delete(a); },
      copy: async (a, b) => { const v = f.get(a); if (v === undefined) throw new Error('missing'); if (f.has(b)) { this.step(); f.delete(b); } this.step(); f.set(b, v); },
      remove: async (p) => { this.step(); f.delete(p); },
      list: async (d) => [...f.keys()].filter((k) => k.startsWith(d + '/')).map((k) => k.slice(d.length + 1)),
      ensureDirectory: async () => undefined,
    };
  }
  /** A new launch: the disk as the dead app left it. */
  relaunch() { this.killAt = Infinity; this.ops = 0; }
}

const DIR = 'lampion';
const game = (lights: number, shards = lights * 10) => {
  const s = newGameState();
  for (let i = 0; i < lights; i++) s.solved.set(`phare.b1.r${1 + Math.floor(i / 6)}.${1 + (i % 6)}`, { solvedAt: new Date(Date.UTC(2026, 8, 1, 0, i)).toISOString(), paidHints: i % 2, wrongAnswers: 0, usedSolution: false });
  credit(s.wallet, shards, `seed:${shards}`);
  s.onboardingDone = true;
  return s;
};
const enc = (s: GameState) => JSON.stringify(encodeState(s));

/** Saves `before` cleanly, then `after` killed at step k; returns what the next launch reads. */
async function crashDuring(before: GameState, after: GameState, k: number, mode: 'save' | 'replace' = 'save', clock = { t: 0 }) {
  const disk = new PhoneDisk();
  const now = () => new Date(Date.UTC(2026, 9, 1) + (clock.t += 1000));
  const a = new SaveStore(disk.fs(), DIR, 'v', new Map(), now);
  await a.load(); await a.save(before); await a.save(before);
  disk.ops = 0; disk.killAt = k;
  let finished = true;
  try { await (mode === 'save' ? a.save(after) : a.replace(after)); } catch (e) { if (!(e instanceof Killed)) throw e; finished = false; }
  disk.relaunch();
  const loaded = await new SaveStore(disk.fs(), DIR, 'v', new Map(), now).load();
  return { loaded, finished, disk };
}

describe('L’app est tuée pendant une sauvegarde', () => {
  test('à chaque étape d’une sauvegarde : la partie d’avant ou la nouvelle, jamais moins, jamais un mélange', async () => {
    const before = game(10), after = game(11);
    let steps = 0, gotNew = 0;
    for (let k = 1; k < 40; k++) {
      const { loaded, finished } = await crashDuring(before, after, k);
      const text = enc(loaded.state);
      expect([enc(before), enc(after)]).toContain(text);
      if (finished) { expect(text).toBe(enc(after)); steps = k; break; }
      if (text === enc(after)) gotNew++;
    }
    expect(steps).toBeGreaterThan(5); // the save really went through every step
    expect(gotNew).toBeGreaterThan(0); // and a save cut after its file was whole is kept
  });

  test('« Tout effacer » ou import (remplacement) : l’ancienne partie ou la nouvelle, jamais un mélange', async () => {
    const before = game(30), after = game(2, 5);
    for (let k = 1; k < 40; k++) {
      const { loaded, finished } = await crashDuring(before, after, k, 'replace');
      expect([enc(before), enc(after)]).toContain(enc(loaded.state));
      if (finished) { expect(enc(loaded.state)).toBe(enc(after)); break; }
    }
  });

  test('après « Tout effacer », la copie de secours ne fait jamais revenir l’ancienne partie', async () => {
    for (const thenPlay of [false, true]) {
      const disk = new PhoneDisk();
      const a = new SaveStore(disk.fs(), DIR, 'v');
      await a.load(); await a.save(game(40)); await a.save(game(40));
      await a.replace(game(0, 25)); // reset (with the welcome gift)
      if (thenPlay) await a.save(game(1, 35));
      // Then the main file gets slightly damaged.
      const main = disk.files.get(`${DIR}/save.json`)!;
      disk.files.set(`${DIR}/save.json`, main.replace(/"balance":\d+/, '"balance":7'));
      const loaded = await new SaveStore(disk.fs(), DIR, 'v').load();
      expect(loaded.state.solved.size).toBeLessThanOrEqual(1);
    }
  });

  test('suite de 300 sauvegardes tuées au hasard : la progression ne recule jamais', async () => {
    const rng = new SeededRNG(2026n);
    const disk = new PhoneDisk();
    let t = 0;
    const now = () => new Date(Date.UTC(2026, 9, 1) + (t += 1000));
    let store = new SaveStore(disk.fs(), DIR, 'v', new Map(), now);
    await store.load();
    let saved = 0; // lights of the last save that finished
    let lights = 0;
    for (let i = 0; i < 300; i++) {
      lights++;
      disk.ops = 0; disk.killAt = rng.below(4) === 0 ? 1 + rng.below(16) : Infinity;
      try { await store.save(game(lights)); saved = lights; } catch (e) {
        if (!(e instanceof Killed)) throw e;
        disk.relaunch();
        store = new SaveStore(disk.fs(), DIR, 'v', new Map(), now);
        const loaded = await store.load();
        expect(loaded.source).not.toBe('fresh');
        const got = loaded.state.solved.size;
        expect(got === saved || got === lights).toBe(true);
        expect(enc(loaded.state)).toBe(enc(game(got)));
        lights = got; saved = got;
      }
    }
  });

  test('sauvegarde illisible (iPhone verrouillé) : on montre la copie, mais rien n’est écrit', async () => {
    const disk = new PhoneDisk();
    const a = new SaveStore(disk.fs(), DIR, 'v');
    await a.load(); await a.save(game(5)); await a.save(game(6));
    disk.unreadable.add(`${DIR}/save.json`);
    const b = new SaveStore(disk.fs(), DIR, 'v');
    const loaded = await b.load();
    expect(loaded.source).toBe('unavailable');
    expect(loaded.state.solved.size).toBe(5);
    const files = new Map(disk.files);
    await expect(b.save(game(1))).rejects.toThrow();
    expect(disk.files).toEqual(files);
  });
});

describe('Le fichier des réglages et des objets trouvés', () => {
  const text = (n: number, at: number) => JSON.stringify({ v: 1, at: new Date(Date.UTC(2026, 9, 1) + at * 1000).toISOString(), settings: {}, profile: { picked: Array.from({ length: n }, (_, i) => `r${i}`) } });
  const picked = (t: string | null) => (t === null ? -1 : (JSON.parse(t) as { profile: { picked: string[] } }).profile.picked.length);

  test('tué à chaque étape d’une écriture : l’ancienne version ou la nouvelle, jamais rien', async () => {
    for (let k = 1; k < 30; k++) {
      const disk = new PhoneDisk();
      const a = new SideFile(disk.fs(), DIR);
      await a.read(); await a.write(text(3, 1)); await a.write(text(3, 1));
      disk.ops = 0; disk.killAt = k;
      let finished = true;
      try { await a.write(text(4, 2)); } catch (e) { if (!(e instanceof Killed)) throw e; finished = false; }
      disk.relaunch();
      const got = await new SideFile(disk.fs(), DIR).read();
      expect([3, 4]).toContain(picked(got.text));
      if (finished) { expect(picked(got.text)).toBe(4); break; }
    }
  });

  test('fichier abîmé : la copie est reprise, l’abîmé mis de côté (jamais écrasé)', async () => {
    const disk = new PhoneDisk();
    const a = new SideFile(disk.fs(), DIR);
    await a.read(); await a.write(text(5, 1)); await a.write(text(6, 2));
    disk.files.set(`${DIR}/profile.json`, '{"v":1,"settings":{"mus');
    const got = await new SideFile(disk.fs(), DIR).read();
    expect(got.source).toBe('backup');
    expect(picked(got.text)).toBe(5);
    expect([...disk.files.keys()].some((k) => k.includes('corrupt-'))).toBe(true);
  });

  test('fichier illisible : rien n’est écrit par-dessus', async () => {
    const disk = new PhoneDisk();
    const a = new SideFile(disk.fs(), DIR);
    await a.read(); await a.write(text(5, 1));
    disk.unreadable.add(`${DIR}/profile.json`);
    const b = new SideFile(disk.fs(), DIR);
    expect((await b.read()).unreadable).toBe(true);
    await b.write(text(0, 3));
    disk.unreadable.clear();
    expect(picked(disk.files.get(`${DIR}/profile.json`)!)).toBe(5);
  });

  test('ancien fichier (avant cette version) relu tel quel', async () => {
    const disk = new PhoneDisk();
    disk.files.set(`${DIR}/profile.json`, JSON.stringify({ v: 1, settings: { music: false }, profile: { picked: ['a', 'b'] } }));
    disk.files.set(`${DIR}/profile.json.tmp`, '{"v":1,"set');
    const got = await new SideFile(disk.fs(), DIR).read();
    expect(got.source).toBe('main');
    expect(picked(got.text)).toBe(2);
    expect(disk.files.has(`${DIR}/profile.json.tmp`)).toBe(false);
  });
});

describe('Exporter / importer', () => {
  test('un texte modifié en route est refusé en entier (jamais importé à moitié)', () => {
    const t = exportText(game(12), []);
    expect(parseImport(t)!.state.solved.size).toBe(12);
    expect(parseImport(t.replace('"balance":120', '"balance":999'))).toBeNull();
    expect(parseImport(t.replace('"paidHints":1', '"paidHints":0'))).toBeNull();
  });
  test('un ancien export (sans somme de contrôle) reste accepté s’il est intact', () => {
    const o = JSON.parse(exportText(game(3), [])); delete o.checksum;
    expect(parseImport(JSON.stringify(o))!.state.solved.size).toBe(3);
  });
});
