/**
 * The small side file (settings, found objects, house, album…), kept as safely as the game itself:
 * written to a temporary file then moved, with a copy of the previous version. Reading takes the
 * newest complete version (a temporary file left by an app killed while saving included), then the
 * copy; a damaged file is set aside, never written over; an unreadable one blocks writing.
 */
import type { FileSystem } from './saveStore';

export interface SideRead {
  /** The text to decode, or null (nothing saved yet, or nothing usable). */
  text: string | null;
  /** The file exists but cannot be read: nothing may be written this launch. */
  unreadable: boolean;
  source: 'main' | 'temporary' | 'backup' | 'none';
}

/** A side text is usable when it is a whole JSON object; its time comes from `at`. */
function parse(text: string): { at: number } | null {
  try {
    const o = JSON.parse(text) as unknown;
    if (typeof o !== 'object' || o === null || Array.isArray(o)) return null;
    const at = (o as { at?: unknown }).at;
    return { at: typeof at === 'string' ? Date.parse(at) || 0 : 0 };
  } catch { return null; }
}

export class SideFile {
  private queue: Promise<unknown> = Promise.resolve();
  private writable = false;

  constructor(private readonly fs: FileSystem, private readonly directory: string, private readonly name = 'profile') {}

  get path() { return `${this.directory}/${this.name}.json`; }
  get backupPath() { return `${this.directory}/${this.name}.backup.json`; }
  private isTemporary(n: string) { return n.startsWith(`${this.name}.`) && n.endsWith('.tmp'); }

  private serial<T>(op: () => Promise<T>): Promise<T> {
    const next = this.queue.then(op, op);
    this.queue = next.catch(() => undefined);
    return next;
  }

  read(): Promise<SideRead> {
    return this.serial(async () => {
      let mainText: string | null = null;
      if (await this.fs.exists(this.path).catch(() => false)) {
        try { mainText = await this.fs.read(this.path); } catch {
          this.writable = false;
          return { text: null, unreadable: true, source: 'none' };
        }
      }
      this.writable = true;
      const main = mainText !== null ? parse(mainText) : null;
      // Temporary files: one may be a complete save the app had no time to move.
      let best: { text: string; at: number; path: string } | null = null;
      const names = await this.fs.list(this.directory).catch(() => [] as string[]);
      for (const n of names) {
        if (!this.isTemporary(n)) continue;
        const path = `${this.directory}/${n}`;
        try {
          const text = await this.fs.read(path);
          const p = parse(text);
          if (p && p.at > 0 && (!best || p.at > best.at)) best = { text, at: p.at, path };
        } catch { /* unreadable leftover */ }
      }
      let out: SideRead;
      if (best && (!main || best.at > main.at)) {
        if (mainText !== null && !main) await this.setAside(this.path);
        try {
          if (main) { await this.fs.remove(this.backupPath).catch(() => undefined); await this.fs.copy(this.path, this.backupPath); }
          await this.fs.move(best.path, this.path);
        } catch { /* read it anyway */ }
        out = { text: best.text, unreadable: false, source: 'temporary' };
      } else if (main) {
        out = { text: mainText, unreadable: false, source: 'main' };
      } else {
        if (mainText !== null) await this.setAside(this.path);
        let backup: string | null = null;
        try { if (await this.fs.exists(this.backupPath)) backup = await this.fs.read(this.backupPath); } catch { /* none */ }
        out = backup !== null && parse(backup) ? { text: backup, unreadable: false, source: 'backup' } : { text: null, unreadable: false, source: 'none' };
      }
      for (const n of names) if (this.isTemporary(n)) await this.fs.remove(`${this.directory}/${n}`).catch(() => undefined);
      return out;
    });
  }

  /** Writes a new version (only after a successful read, never over an unreadable file). */
  write(text: string): Promise<void> {
    return this.serial(async () => {
      if (!this.writable) return;
      await this.fs.ensureDirectory(this.directory);
      const temp = `${this.directory}/${this.name}.${Date.now().toString(36)}${Math.random().toString(36).slice(2)}.tmp`;
      await this.fs.write(temp, text);
      // The previous version becomes the copy, if it is whole (a damaged one never replaces a good copy).
      if (await this.fs.exists(this.path)) {
        let prev: string | null = null;
        try { prev = await this.fs.read(this.path); } catch { /* keep the old copy */ }
        if (prev !== null && parse(prev)) {
          if (await this.fs.exists(this.backupPath)) await this.fs.remove(this.backupPath);
          await this.fs.copy(this.path, this.backupPath);
        }
      }
      try { await this.fs.move(temp, this.path); } catch (e) { await this.fs.remove(temp).catch(() => undefined); throw e; }
    });
  }

  private async setAside(path: string) {
    const target = `${this.directory}/corrupt-${Date.now()}-${path.split('/').pop()}`;
    await this.fs.move(path, target).catch(() => undefined);
  }
}
