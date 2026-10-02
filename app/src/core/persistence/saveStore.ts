/**
 * Sauvegarde locale robuste.
 * Écriture atomique (fichier temporaire puis renommage), copie de secours, décodage tolérant,
 * fusion avec le secours en cas de relecture partielle, fichiers illisibles jamais écrasés.
 */
import { GameState, Losses, checksum, decodeState, encodeState, mergeWithBackup, newGameState, recoverFromBackup } from '../game/state';

/** Accès fichiers minimal : implémenté par expo-file-system sur l'appareil, par le disque ou la mémoire en test. */
export interface FileSystem {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, text: string): Promise<void>;
  /** Remplace la destination de façon atomique. */
  move(from: string, to: string): Promise<void>;
  copy(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
  list(directory: string): Promise<string[]>;
  ensureDirectory(directory: string): Promise<void>;
}

export type LoadSource = 'main' | 'backup' | 'fresh' | 'unavailable';
export interface LoadResult { state: GameState; source: LoadSource; quarantined: string[]; migrated: boolean; mergedWithBackup: boolean }
export type Migration = (json: Record<string, unknown>) => void;
export class SaveError extends Error { constructor(readonly reason: 'notLoaded') { super(reason); } }

export const CURRENT_SCHEMA_VERSION = 1;


export class SaveStore {
  private writable = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly fs: FileSystem,
    private readonly directory: string,
    private readonly appVersion: string,
    private readonly migrations: Map<number, Migration> = new Map(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  get mainPath() { return `${this.directory}/save.json`; }
  get backupPath() { return `${this.directory}/save.backup.json`; }

  /** Les opérations sont sérialisées : deux sauvegardes simultanées ne s'entrelacent jamais. */
  private serial<T>(op: () => Promise<T>): Promise<T> {
    const next = this.queue.then(op, op);
    this.queue = next.catch(() => undefined);
    return next;
  }

  save(state: GameState): Promise<void> { return this.write(state, false); }

  /**
   * Replaces the whole game (reset, import): the backup copy becomes this game too, so the
   * previous game can never be merged back into it later.
   */
  replace(state: GameState): Promise<void> { return this.write(state, true); }

  private write(state: GameState, replace: boolean): Promise<void> {
    return this.serial(async () => {
      if (!this.writable) throw new SaveError('notLoaded');
      await this.fs.ensureDirectory(this.directory);
      const encoded = encodeState(state);
      const envelope = { appVersion: this.appVersion, checksum: checksum(JSON.stringify(encoded)), savedAt: this.now().toISOString(), schemaVersion: CURRENT_SCHEMA_VERSION, state: encoded };
      const temp = `${this.directory}/save.${Date.now().toString(36)}${Math.random().toString(36).slice(2)}.tmp`;
      await this.fs.write(temp, JSON.stringify(envelope));
      if (!replace && await this.fs.exists(this.mainPath)) {
        if (await this.fs.exists(this.backupPath)) await this.fs.remove(this.backupPath);
        await this.fs.copy(this.mainPath, this.backupPath);
      }
      // On the phone, replacing a file is « delete, then move »: if the app dies in between,
      // the complete temporary file is found again at the next launch (see recoverTemporary).
      try { await this.fs.move(temp, this.mainPath); } catch (e) { await this.fs.remove(temp).catch(() => undefined); throw e; }
      if (replace) {
        if (await this.fs.exists(this.backupPath)) await this.fs.remove(this.backupPath);
        await this.fs.copy(this.mainPath, this.backupPath);
      }
    });
  }

  load(): Promise<LoadResult> {
    return this.serial(async () => {
      const quarantined: string[] = [];
      // A main file that exists but cannot be read (not damaged: unreadable) is never touched or written over.
      let mainUnreadable = false;
      if (await this.fs.exists(this.mainPath).catch(() => false)) {
        try { await this.fs.read(this.mainPath); } catch { mainUnreadable = true; }
      }
      if (!mainUnreadable) {
        const recovered = await this.recoverTemporary();
        if (recovered) quarantined.push(...recovered);
        await this.removeStaleTemporaryFiles();
      }
      let unreadable = mainUnreadable;
      for (const [path, source] of [[this.mainPath, 'main'], [this.backupPath, 'backup']] as const) {
        if (!(await this.fs.exists(path).catch(() => false))) continue;
        let text: string;
        try { text = await this.fs.read(path); } catch { unreadable = true; continue; } // illisible ≠ abîmé : on ne touche à rien
        try {
          const decoded = this.decode(text);
          if (decoded.schema > CURRENT_SCHEMA_VERSION) await this.preserveNewer(path, decoded.schema);
          // The main file could not be read: its backup is shown, but nothing is written until a launch reads it.
          if (mainUnreadable) { this.writable = false; return { state: decoded.state, source: 'unavailable', quarantined, migrated: decoded.migrated, mergedWithBackup: false }; }
          this.writable = true;
          if (source === 'main' && (decoded.losses > 0 || !decoded.intact) && (await this.fs.exists(this.backupPath).catch(() => false))) {
            try {
              const backup = this.decode(await this.fs.read(this.backupPath));
              const state = decoded.intact ? mergeWithBackup(decoded.state, backup.state) : recoverFromBackup(decoded.state, backup.state);
              return { state, source, quarantined, migrated: decoded.migrated, mergedWithBackup: true };
            } catch { /* secours inutilisable : on garde ce qui a été lu */ }
          }
          return { state: decoded.state, source, quarantined, migrated: decoded.migrated, mergedWithBackup: false };
        } catch {
          const moved = await this.quarantine(path);
          if (moved) quarantined.push(moved);
        }
      }
      if (unreadable) { this.writable = false; return { state: newGameState(), source: 'unavailable', quarantined, migrated: false, mergedWithBackup: false }; }
      this.writable = true;
      return { state: newGameState(), source: 'fresh', quarantined, migrated: false, mergedWithBackup: false };
    });
  }

  /**
   * The app died while saving: a complete temporary file newer than the main one (whole, checksum
   * right, nothing lost) is the latest save. It becomes the main file; the previous main becomes the
   * backup (or, if damaged, is set aside). Returns the files set aside.
   */
  private async recoverTemporary(): Promise<string[] | null> {
    const names = await this.fs.list(this.directory).catch(() => [] as string[]);
    let best: { path: string; savedAt: number } | null = null;
    for (const n of names) {
      if (!n.startsWith('save.') || !n.endsWith('.tmp')) continue;
      const path = `${this.directory}/${n}`;
      try {
        const d = this.decode(await this.fs.read(path));
        if (!d.intact || d.losses > 0 || d.migrated || !d.savedAt) continue;
        if (!best || d.savedAt > best.savedAt) best = { path, savedAt: d.savedAt };
      } catch { /* incomplete: the app died while writing it */ }
    }
    if (!best) return null;
    let main: { savedAt: number; ok: boolean } | null = null;
    if (await this.fs.exists(this.mainPath).catch(() => false)) {
      try { const d = this.decode(await this.fs.read(this.mainPath)); main = { savedAt: d.savedAt, ok: d.intact && d.losses === 0 }; } catch { main = { savedAt: 0, ok: false }; }
    }
    if (main && main.ok && main.savedAt >= best.savedAt) return null;
    const setAside: string[] = [];
    try {
      if (main && main.ok) {
        if (await this.fs.exists(this.backupPath)) await this.fs.remove(this.backupPath);
        await this.fs.copy(this.mainPath, this.backupPath);
      } else if (main) {
        const moved = await this.quarantine(this.mainPath);
        if (moved) setAside.push(moved);
      }
      await this.fs.move(best.path, this.mainPath);
    } catch { /* left as it was: the usual reading below still applies */ }
    return setAside;
  }

  private decode(text: string): { state: GameState; migrated: boolean; schema: number; losses: number; intact: boolean; savedAt: number } {
    const json = JSON.parse(text) as unknown;
    if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('corrupt');
    const obj = json as Record<string, unknown>;
    const original = typeof obj.schemaVersion === 'number' && Number.isInteger(obj.schemaVersion) ? obj.schemaVersion : 0;
    let version = original, migrated = false;
    if (version <= CURRENT_SCHEMA_VERSION) {
      while (version < CURRENT_SCHEMA_VERSION) {
        const migration = this.migrations.get(version);
        if (!migration) throw new Error('missing migration');
        migration(obj);
        version++;
        obj.schemaVersion = version;
        migrated = true;
      }
    }
    if (!('state' in obj)) throw new Error('corrupt');
    // Somme de contrôle globale (absente dans les anciens fichiers ou après migration : non vérifiable).
    const intact = typeof obj.checksum !== 'string' || migrated || checksum(JSON.stringify(obj.state)) === obj.checksum;
    const losses = new Losses();
    const state = decodeState(obj.state, losses);
    const savedAt = typeof obj.savedAt === 'string' ? Date.parse(obj.savedAt) || 0 : 0;
    return { state, migrated, schema: original, losses: losses.count, intact, savedAt };
  }

  private async removeStaleTemporaryFiles() {
    const names = await this.fs.list(this.directory).catch(() => [] as string[]);
    for (const n of names) if (n.startsWith('save.') && n.endsWith('.tmp')) await this.fs.remove(`${this.directory}/${n}`).catch(() => undefined);
  }

  private async preserveNewer(path: string, schema: number) {
    const copy = `${this.directory}/save.schema${schema}.preserved.json`;
    if (!(await this.fs.exists(copy).catch(() => true))) await this.fs.copy(path, copy).catch(() => undefined);
  }

  private async quarantine(path: string): Promise<string | null> {
    const name = path.split('/').pop()!;
    const target = `${this.directory}/corrupt-${this.now().getTime()}-${name}`;
    try { await this.fs.move(path, target); return target; } catch { return null; }
  }
}
