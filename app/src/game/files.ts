// expo-file-system adapter for the core SaveStore (and small side files).
// Everything stays in the app's private documents folder.
import { Directory, File, Paths } from 'expo-file-system';

import type { FileSystem } from '../core/persistence/saveStore';

export const SAVE_DIRECTORY = 'lampion';

const file = (path: string) => new File(Paths.document, path);
const dir = (path: string) => new Directory(Paths.document, path);

export const deviceFS: FileSystem = {
  async exists(path) { return file(path).exists; },
  async read(path) { return file(path).textSync(); },
  async write(path, text) {
    const f = file(path);
    if (!f.exists) f.create();
    f.write(text);
  },
  async move(from, to) { file(from).moveSync(file(to), { overwrite: true }); },
  async copy(from, to) { file(from).copySync(file(to), { overwrite: true }); },
  async remove(path) { const f = file(path); if (f.exists) f.delete(); },
  async list(directory) {
    const d = dir(directory);
    if (!d.exists) return [];
    return d.list().map((e) => e.name);
  },
  async ensureDirectory(directory) {
    const d = dir(directory);
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
  },
};
