// Save file on the device (iOS / Android), in the app's private documents
// folder. Nothing leaves the phone.
//
// Write: save.tmp → rename over save.json (atomic), after copying the last
// good save.json to save.bak. Read: save.json, else save.bak, else a new game.

import { File, Paths } from 'expo-file-system';

import { DemoGame } from '../content/vesperDemo';
import { decodeDemo, encodeDemo } from './demoSave';

const main = () => new File(Paths.document, 'lampion-save.json');
const backup = () => new File(Paths.document, 'lampion-save.bak');
const temp = () => new File(Paths.document, 'lampion-save.tmp');

function readFile(f: File): DemoGame | null {
  try { return f.exists ? decodeDemo(f.textSync()) : null; } catch { return null; }
}

export function loadDemo(): DemoGame | null {
  return readFile(main()) ?? readFile(backup());
}

export function saveDemo(g: DemoGame): void {
  try {
    const m = main();
    // Keep the previous save as backup, but only if it is readable.
    if (m.exists && readFile(m)) m.copySync(backup(), { overwrite: true });
    const t = temp();
    if (!t.exists) t.create();
    t.write(encodeDemo(g));
    t.moveSync(m, { overwrite: true });
  } catch {
    // Never crash the game because of storage; the next save retries.
  }
}
