// Web build (used for previews): same format, kept in localStorage.
import { DemoGame } from '../content/vesperDemo';
import { decodeDemo, encodeDemo } from './demoSave';

const KEY = 'lampion-save', BAK = 'lampion-save.bak';

function read(key: string): DemoGame | null {
  try { const t = localStorage.getItem(key); return t ? decodeDemo(t) : null; } catch { return null; }
}

export function loadDemo(): DemoGame | null {
  return read(KEY) ?? read(BAK);
}

export function saveDemo(g: DemoGame): void {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev && decodeDemo(prev)) localStorage.setItem(BAK, prev);
    localStorage.setItem(KEY, encodeDemo(g));
  } catch { /* private mode or storage blocked */ }
}
