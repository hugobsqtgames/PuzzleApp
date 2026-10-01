// Every French text the app can show, gathered for the English check (i18n.test.ts).
import * as fs from 'fs';
import * as path from 'path';
import { FR, SHELF_NAMES } from '../../content/strings';
import { DISTRICT_INFO, LETTERS } from '../../content/vesper';
import { ACHIEVEMENTS, COSMETICS, SLOT_NAMES } from '../../game/rewards';
import { CODES, FAMILIES, TIER_NAMES, WORLD } from '../../game/catalog';
import { CHARACTERS } from '../families/liars';
import { OBJECTS, PEOPLE, PLACES } from '../families/inquiries';
import { ROOM_SPECS, roomSlotsOf } from '../../ui/scenes';
import { setLang } from '../../i18n';
import { EVENTS, SEASONS } from '../../game/seasons';
import { WHATS_NEW } from '../../content/whatsNew';
import { KEEPER_TALK } from '../../content/keepers';
import { DECOR } from '../../game/house';

/** A data string that is shown (not an id, a colour or a path). */
const isText = (s: string) => /\p{L}/u.test(s) && !/^[a-z][\w.-]*$/.test(s) && !/^#[0-9a-f]{3,8}$/i.test(s) && !/^[A-Z]{2}$/.test(s) && !/^[A-Za-z]+\.[\w.]+$/.test(s) && !/[<>]/.test(s);

/** The string literals of the call's arguments `pick` (0-based), with nesting and ternaries. */
function argLiterals(src: string, open: number, pick: number[]): string[] {
  const out: string[] = [];
  let depth = 0, arg = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '`' || ch === '"') {
      let j = i + 1, body = '';
      while (j < src.length && src[j] !== ch) { if (src[j] === '\\') { body += src[j + 1] === 'n' ? '\n' : src[j + 1]; j += 2; } else body += src[j++]; }
      // A literal compared with (`kind === 'daily' ? …`) is code, not text.
      const compared = /[=!]==\s*$/.test(src.slice(Math.max(0, i - 6), i));
      if (ch === "'" && pick.includes(arg) && body && !compared) out.push(body);
      i = j;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { depth--; if (depth === 0) break; }
    else if (ch === ',' && depth === 1) arg++;
  }
  return out;
}

/** Literals given to tr(), trn() and translated() in the app's source. */
export function literalsInSource(): string[] {
  const root = path.resolve(__dirname, '../..');
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) { if (!['__tests__', 'generated', 'i18n'].includes(f)) walk(p); continue; }
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/\b(tr|trn|translated)\(/g)) {
        const open = m.index! + m[0].length - 1;
        const lits = m[1] === 'tr' ? argLiterals(src, open, [0]) : m[1] === 'trn' ? argLiterals(src, open, [1, 2]) : argLiterals(src, open, [0]).filter(isText);
        lits.forEach((l) => out.add(l));
      }
    }
  };
  walk(root);
  return [...out];
}

function strings(v: unknown, out: Set<string>, seen = new Set<unknown>()) {
  if (typeof v === 'string') { if (isText(v)) out.add(v); return; }
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  for (const x of Object.values(v)) strings(x, out, seen);
}

/** Texts held in data: districts, letters, wardrobe, puzzle names, room scenes… */
export function dataTexts(): string[] {
  setLang('fr');
  const out = new Set<string>();
  strings([DISTRICT_INFO, LETTERS, ACHIEVEMENTS.map((a) => [a.name, a.description]), COSMETICS, SLOT_NAMES, TIER_NAMES], out);
  for (const c of CODES) for (const k of ['name', 'rule', 'achievement'] as const) { const s = FAMILIES[c][k]; if (s) out.add(s); }
  [...CHARACTERS, ...PEOPLE, ...OBJECTS, ...PLACES, ...SHELF_NAMES].forEach((s) => out.add(s));
  for (const spec of Object.values(ROOM_SPECS)) if (spec.intro) out.add(spec.intro);
  for (const x of Object.values(SEASONS)) { out.add(x.name); out.add(x.line); }
  for (const e of Object.values(EVENTS)) { out.add(e.name); out.add(e.story); }
  for (const w of WHATS_NEW) w.lines.forEach((l) => out.add(l));
  for (const d of DECOR) { out.add(d.name); if (d.earn) out.add(d.earn.text); }
  for (const k of Object.values(KEEPER_TALK)) [...k.asleep, ...k.awake].forEach((l) => out.add(l));
  for (const d of WORLD.districts) for (const b of d.buildings) for (const r of b.rooms) {
    for (const sl of roomSlotsOf(r.id, r.lanterns.length)) for (const part of sl.label.replace(/ \(\d+\)$/, '').split(', ')) out.add(part);
  }
  return [...out];
}

/** The puzzle engine's texts. */
export const engineTexts = () => [...new Set(Object.values(FR))];
