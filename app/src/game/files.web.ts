// Web build (previews): the same SaveStore, backed by localStorage.
import type { FileSystem } from '../core/persistence/saveStore';

export const SAVE_DIRECTORY = 'lampion';
const PREFIX = 'fs:';

const store = {
  get(k: string) { try { return localStorage.getItem(PREFIX + k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(PREFIX + k, v); } catch { /* blocked */ } },
  del(k: string) { try { localStorage.removeItem(PREFIX + k); } catch { /* blocked */ } },
  keys() { try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length)); } catch { return []; } },
};

export const deviceFS: FileSystem = {
  async exists(path) { return store.get(path) !== null; },
  async read(path) { const v = store.get(path); if (v === null) throw new Error('missing'); return v; },
  async write(path, text) { store.set(path, text); },
  async move(from, to) { const v = store.get(from); if (v === null) throw new Error('missing'); store.set(to, v); store.del(from); },
  async copy(from, to) { const v = store.get(from); if (v === null) throw new Error('missing'); store.set(to, v); },
  async remove(path) { store.del(path); },
  async list(directory) { return store.keys().filter((k) => k.startsWith(directory + '/')).map((k) => k.slice(directory.length + 1)); },
  async ensureDirectory() { /* flat */ },
};
