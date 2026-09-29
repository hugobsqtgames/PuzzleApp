import { promises as fsp } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SeededRNG } from '../puzzlekit/rng';
import { credit, encodeState, newGameState } from '../game/state';
import { FileSystem, SaveError, SaveStore } from '../persistence/saveStore';

/** Implémentation sur disque réel (Node) du système de fichiers de la sauvegarde. */
const nodeFS: FileSystem = {
  exists: (p) => fsp.stat(p).then(() => true, () => false),
  read: (p) => fsp.readFile(p, 'utf8'),
  write: (p, t) => fsp.writeFile(p, t, 'utf8'),
  move: (a, b) => fsp.rename(a, b),
  copy: (a, b) => fsp.copyFile(a, b),
  remove: (p) => fsp.rm(p, { recursive: true, force: true }),
  list: (d) => fsp.readdir(d),
  ensureDirectory: (d) => fsp.mkdir(d, { recursive: true }).then(() => undefined),
};
const tempDir = () => fsp.mkdtemp(path.join(os.tmpdir(), 'lampion-'));
const sample = () => {
  const s = newGameState();
  s.solved.set('phare.b1.r1.1', { solvedAt: '2026-09-21T14:13:20.000Z', paidHints: 1, wrongAnswers: 0, usedSolution: false });
  credit(s.wallet, 42, 'puzzle:phare.b1.r1.1');
  s.daily.completedDays.add('2026-09-29'); s.daily.streak = 3; s.daily.bestStreak = 3;
  s.equippedCosmetics.set('hat', 'bonnet'); s.onboardingDone = true;
  return s;
};
const same = (a: ReturnType<typeof newGameState>, b: ReturnType<typeof newGameState>) => expect(encodeState(a)).toEqual(encodeState(b));

describe('Sauvegarde', () => {
  test('aller-retour exact, aucun fichier temporaire', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await store.load();
    await store.save(sample()); await store.save(sample());
    const loaded = await new SaveStore(nodeFS, dir, '1.0.0').load();
    expect(loaded.source).toBe('main');
    same(loaded.state, sample());
    expect((await fsp.readdir(dir)).sort()).toEqual(['save.backup.json', 'save.json']);
  });
  test('écrire avant d’avoir chargé est refusé', async () => {
    await expect(new SaveStore(nodeFS, await tempDir(), '1.0.0').save(newGameState())).rejects.toBeInstanceOf(SaveError);
  });
  test('principal abîmé → copie de secours, fichier abîmé mis de côté', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await store.load();
    const s = sample(); await store.save(s);
    s.onboardingDone = false; await store.save(s);
    await fsp.writeFile(store.mainPath, '{ tronqué');
    const loaded = await new SaveStore(nodeFS, dir, '1.0.0').load();
    expect(loaded.source).toBe('backup');
    expect(loaded.state.onboardingDone).toBe(true);
    expect(loaded.quarantined).toHaveLength(1);
  });
  test('fichier illisible : rien n’est déplacé, écriture bloquée', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await fsp.mkdir(store.mainPath); // un dossier à la place du fichier : lecture impossible
    const loaded = await store.load();
    expect(loaded.source).toBe('unavailable');
    expect(loaded.quarantined).toEqual([]);
    expect((await fsp.stat(store.mainPath)).isDirectory()).toBe(true);
    await expect(store.save(newGameState())).rejects.toBeInstanceOf(SaveError);
  });
  test('migrations en chaîne ; migration manquante → secours', async () => {
    const dir = await tempDir();
    const store = new SaveStore(nodeFS, dir, '1.0.0', new Map([[0, (json) => {
      const st = json.state as Record<string, unknown>; st.onboardingDone = st.tutorialFinished; delete st.tutorialFinished;
    }]]));
    await fsp.writeFile(path.join(dir, 'save.json'), JSON.stringify({ schemaVersion: 0, state: { tutorialFinished: true } }));
    const loaded = await store.load();
    expect(loaded.migrated && loaded.state.onboardingDone).toBe(true);
    const dir2 = await tempDir(), s2 = new SaveStore(nodeFS, dir2, '1.0.0');
    await s2.load(); await s2.save(sample()); await s2.save(sample());
    await fsp.writeFile(s2.mainPath, JSON.stringify({ schemaVersion: 0, state: {} }));
    expect((await new SaveStore(nodeFS, dir2, '1.0.0').load()).source).toBe('backup');
  });
  test('schéma plus récent : lisible et copie conservée', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await fsp.writeFile(store.mainPath, JSON.stringify({ schemaVersion: 3, state: { onboardingDone: true, future: 1 } }));
    const loaded = await store.load();
    expect(loaded.state.onboardingDone).toBe(true);
    await store.save(loaded.state);
    expect(await fsp.readFile(path.join(dir, 'save.schema3.preserved.json'), 'utf8')).toContain('future');
  });
  test('fichiers temporaires orphelins supprimés', async () => {
    const dir = await tempDir();
    await fsp.writeFile(path.join(dir, 'save.ABC.tmp'), 'x');
    await new SaveStore(nodeFS, dir, '1.0.0').load();
    expect(await fsp.readdir(dir)).toEqual([]);
  });
  test('relecture partielle complétée par la copie de secours', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await store.load();
    const s = newGameState();
    for (let i = 0; i < 5; i++) s.solved.set(`p${i}`, { solvedAt: '2026-09-20T00:00:00.000Z', paidHints: 0, wrongAnswers: 0, usedSolution: false });
    credit(s.wallet, 50, 'a');
    await store.save(s);
    s.solved.set('p5', { solvedAt: '2026-09-21T00:00:00.000Z', paidHints: 0, wrongAnswers: 0, usedSolution: false });
    await store.save(s);
    const text = (await fsp.readFile(store.mainPath, 'utf8')).replace('"p2":{"solvedAt":"2026-', '"p2":{"solvedAt":"XXXX-');
    await fsp.writeFile(store.mainPath, text);
    const loaded = await new SaveStore(nodeFS, dir, '1.0.0').load();
    expect(loaded.mergedWithBackup).toBe(true);
    expect(loaded.state.solved.size).toBe(6);
    expect(loaded.state.wallet.balance).toBe(50);
  });
  test('sauvegardes concurrentes : jamais entrelacées', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await store.load();
    const s = sample();
    await Promise.all(Array.from({ length: 50 }, (_, i) => { s.seenDialogue.add(`d${i}`); const copy = { ...s, seenDialogue: new Set(s.seenDialogue) }; return store.save(copy); }));
    const loaded = await new SaveStore(nodeFS, dir, '1.0.0').load();
    expect(loaded.state.seenDialogue.size).toBe(50);
    expect((await fsp.readdir(dir)).filter((n) => n.endsWith('.tmp'))).toEqual([]);
  });
  test('fuzz : 300 fichiers principaux abîmés, jamais de perte ni de lanterne inventée', async () => {
    const dir = await tempDir(), store = new SaveStore(nodeFS, dir, '1.0.0');
    await store.load();
    const good = newGameState();
    for (let i = 0; i < 40; i++) good.solved.set(`p${i}`, { solvedAt: '2026-09-20T00:00:00.000Z', paidHints: 0, wrongAnswers: 0, usedSolution: false });
    credit(good.wallet, 321, 'seed');
    await store.save(good); await store.save(good);
    const pristine = await fsp.readFile(store.mainPath), backup = await fsp.readFile(store.backupPath);
    const rng = new SeededRNG(99n);
    const sources: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      let bytes = Buffer.from(pristine);
      const mode = rng.below(3);
      if (mode === 0) for (let k = rng.int(1, 8); k > 0; k--) bytes[rng.below(bytes.length)] = rng.below(256);
      else if (mode === 1) bytes = bytes.subarray(0, rng.below(bytes.length));
      else { const at = rng.below(bytes.length); bytes = Buffer.concat([bytes.subarray(0, at), Buffer.from('"}]'), bytes.subarray(at)]); }
      await fsp.writeFile(store.mainPath, bytes);
      await fsp.writeFile(store.backupPath, backup);
      const loaded = await new SaveStore(nodeFS, dir, '1.0.0').load();
      sources[loaded.source] = (sources[loaded.source] ?? 0) + 1;
      // Ni perte ni progression inventée : exactement les 40 lanternes d'origine.
      expect([...loaded.state.solved.keys()].sort()).toEqual([...good.solved.keys()].sort());
      expect(loaded.state.wallet.balance).toBe(321);
      for (const q of loaded.quarantined) await fsp.rm(q, { force: true });
    }
    expect(sources.fresh ?? 0).toBe(0);
  }, 60000);
});
