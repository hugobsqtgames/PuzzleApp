// Boards of the six families, for every size the generators produce. Sizes
// follow the mockup at its reference width (358 pt) and scale down on
// narrower screens. Cells highlighted by a hint or an error get an outline.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { SvgXml } from 'react-native-svg';

import { T, R, ROUND, MONO } from './theme';
import { Icon } from './components';
import { lampXml, scalesBalanceXml, shapeXml, tileXml } from './art';
import { CellRef } from '../core/puzzlekit/types';
import { SwitchesFamily, SwitchesPuzzle, SwitchesState } from '../core/families/switches';
import { LocksPuzzle, LocksState } from '../core/families/locks';
import { LampsBoard, LampsFamily, LampsPuzzle, LampsState } from '../core/families/lamps';
import { GearsFamily, GearsPuzzle, GearsState, gearsLight } from '../core/families/gears';
import { SequencesPuzzle, SequencesState, termText } from '../core/families/sequences';
import { ScalesPuzzle, ScalesState } from '../core/families/scales';
import { FAMILIES } from '../game/catalog';
import { Session } from '../game/session';
import { Board2 } from './boards2';
import { Board3, sealRuleText } from './boards3';
import { Board4 } from './boards4';
import type { SealPuzzle } from '../core/families/seal';
import type { SpotPuzzle } from '../core/families/spot';
import type { ChimesPuzzle } from '../core/families/chimes';
import type { ShadowsPuzzle } from '../core/families/shadows';
import type { StainedPuzzle } from '../core/families/stained';
import { tr, trn } from '../i18n';

export interface BoardProps {
  s: Session;
  width: number;
  /** New board state from a player action. */
  onPlay: (next: any, countsAsMove?: boolean) => void;
  tap: () => void;
  /** Plays a bell of the Carillon. */
  note?: (i: number) => void;
  /** Leaves the puzzle to look at a room (the seal). */
  visitRoom?: (roomId: string) => void;
}

const box = { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l } as const;
const hasCell = (cells: CellRef[], r: number, c: number) => cells.some((x) => x.row === r && x.column === c);
const focusOf = (s: Session) => [...(s.hint.focus ?? []), ...(s.error?.focus ?? [])];
const outline = (on: boolean) => (on ? { borderWidth: 2, borderColor: T.moon } : null);

// ---------------------------------------------------------------- Interrupteurs
function Switches({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as SwitchesPuzzle, st = s.state as SwitchesState;
  const e = FAMILIES.IN.engine as SwitchesFamily;
  const gap = p.columns <= 3 ? 12 : 8;
  const sz = Math.min(p.rows * p.columns <= 4 ? 120 : 92, (width - 40 - gap * (p.columns - 1)) / p.columns);
  const focus = focusOf(s);
  return (
    <View style={[box, { alignItems: 'center', padding: 20 }]}>
      {Array.from({ length: p.rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap, marginBottom: r < p.rows - 1 ? gap : 0 }}>
          {Array.from({ length: p.columns }, (_, c) => {
            const i = r * p.columns + c, on = st.lit[i];
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${on ? tr('allumée') : tr('éteinte')}`}
                onPress={() => { tap(); onPlay(e.press(i, st, p)); }}
                style={[{
                  width: sz, height: sz, borderRadius: sz / 2, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? T.amber : '#141833', borderWidth: on ? 0 : 2, borderColor: '#3a4180',
                  shadowColor: T.amber, shadowOpacity: on ? 0.55 : 0, shadowRadius: 13,
                }, outline(hasCell(focus, r, c))]}
              >
                {on ? <View style={{ width: sz * 0.34, height: sz * 0.34, borderRadius: sz, backgroundColor: '#FFF3D6' }} /> : <Icon name="light" size={sz * 0.34} color="#3a4180" />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Lampes
function Lamps({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as LampsPuzzle, st = s.state as LampsState;
  const e = FAMILIES.LA.engine as LampsFamily;
  const b = new LampsBoard(p);
  const info = e.illumination(p, st);
  const gap = 4;
  const sz = Math.min(51, (width - 24 - gap * (b.columns - 1)) / b.columns);
  const focus = focusOf(s);
  const conflicts = new Set(info.conflicts), over = new Set(info.overfullWalls);
  const cycle = (i: number) => {
    const marks = st.marks.slice();
    marks[i] = ((marks[i] + 1) % 3) as never;
    onPlay({ ...st, marks });
  };
  return (
    <View style={[box, { alignItems: 'center', padding: 12 }]}>
      {Array.from({ length: b.rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap, marginBottom: r < b.rows - 1 ? gap : 0 }}>
          {Array.from({ length: b.columns }, (_, c) => {
            const i = r * b.columns + c;
            if (!b.white[i]) {
              const need = b.clue[i];
              const have = need === null ? 0 : b.neighbors[i].filter((j) => b.white[j] && st.marks[j] === 1).length;
              const col = need === null ? T.tx3 : have > need ? T.coral : have === need ? T.amber : T.tx;
              return (
                <View key={c} accessible accessibilityLabel={need === null ? tr('Mur') : trn(have, 'Mur {1}, touche {0} lampe', 'Mur {1}, touche {0} lampes', [have, need])}
                  style={[{ width: sz, height: sz, borderRadius: 8, backgroundColor: '#080914', alignItems: 'center', justifyContent: 'center', borderWidth: over.has(i) ? 2 : 0, borderColor: T.coral }, outline(hasCell(focus, r, c))]}>
                  {need !== null ? <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: sz * 0.44, color: col }}>{need}</Text> : null}
                </View>
              );
            }
            const v = st.marks[i], lit = info.lit[i], conf = conflicts.has(i);
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${v === 1 ? tr('lampe') + (conf ? tr(', en conflit') : '') : tr(v === 2 ? 'marquée vide' : lit ? 'éclairée' : 'sombre')}`}
                onPress={() => { tap(); cycle(i); }}
                style={[{ width: sz, height: sz, borderRadius: 8, backgroundColor: lit ? '#3a3040' : '#1B1F3A', alignItems: 'center', justifyContent: 'center', borderWidth: conf ? 2 : 0, borderColor: T.coral }, outline(hasCell(focus, r, c))]}
              >
                {v === 1 ? <SvgXml xml={lampXml(conf)} width={sz * 0.62} height={sz * 0.62} /> : null}
                {v === 2 ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.tx2 }} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Engrenages
function Gears({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as GearsPuzzle, st = s.state as GearsState;
  const e = FAMILIES.EN.engine as GearsFamily;
  const light = gearsLight(p, st.tiles);
  const gap = p.columns <= 4 ? 6 : 4;
  const sz = Math.min(74, (width - 30 - gap * (p.columns - 1)) / p.columns);
  const focus = focusOf(s);
  return (
    <View style={[box, { alignItems: 'center', padding: 14 }]}>
      {Array.from({ length: p.rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap, marginBottom: r < p.rows - 1 ? gap : 0 }}>
          {Array.from({ length: p.columns }, (_, c) => {
            const i = r * p.columns + c, m = st.tiles[i], lit = light.lit.has(i), src = i === p.source;
            const ends = [0, 1, 2, 3].filter((b) => (m >> b) & 1).length;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${tr(src ? 'source' : ends === 1 ? 'lanterne' : 'conduit')}, ${tr(lit ? 'éclairé' : 'dans le noir')}. ${tr('Toucher pour tourner.')}`}
                accessibilityActions={[{ name: 'activate', label: tr('Tourner à droite') }, { name: 'longpress', label: tr('Tourner à gauche') }]}
                onAccessibilityAction={(ev) => { tap(); onPlay(e.rotate(p, st, i, ev.nativeEvent.actionName === 'longpress' ? -1 : 1)); }}
                onPress={() => { tap(); onPlay(e.rotate(p, st, i, 1)); }}
                onLongPress={() => { tap(); onPlay(e.rotate(p, st, i, -1)); }}
                style={[{ width: sz, height: sz, borderRadius: sz * 0.16, backgroundColor: lit ? '#262036' : '#1B1F3A', overflow: 'hidden' }, outline(hasCell(focus, r, c))]}
              >
                <SvgXml xml={tileXml(m, lit, src)} width={sz} height={sz} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Cadenas
function Peg({ kind }: { kind: 'full' | 'hollow' | 'none' }) {
  return <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: kind === 'full' ? T.amber : 'transparent', borderWidth: kind === 'full' ? 0 : 2, borderColor: kind === 'none' ? '#4a5190' : T.amber, borderStyle: kind === 'none' ? 'dashed' : 'solid' }} />;
}
export const pegsText = (w: number, m: number) => {
  if (!w && !m) return tr('aucun chiffre juste');
  const a: string[] = [];
  if (w) a.push(trn(w, '{0} bien placé', '{0} bien placés'));
  if (m) a.push(trn(m, '{0} mal placé', '{0} mal placés'));
  return a.join(tr(' et '));
};

function Lock({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as LocksPuzzle, st = s.state as LocksState;
  const focus = focusOf(s);
  const digit = Math.min(32, (width - 180) / p.length);
  const wheelW = Math.min(64, (width - 14 * (p.length - 1)) / p.length);
  const turn = (i: number, d: number) => {
    const symbols = st.symbols.slice();
    symbols[i] = (((symbols[i] ?? 0) + d) % p.alphabet + p.alphabet) % p.alphabet;
    onPlay({ ...st, symbols });
  };
  return (
    <View>
      <View style={[box, { padding: 10, gap: 2 }]}>
        {p.clues.map((c, i) => {
          const bad = hasCell(focus, i, 0);
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: bad ? (s.error ? T.coral : T.moon) : 'transparent', backgroundColor: bad && s.error ? 'rgba(232,138,138,0.08)' : 'transparent' }}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {c.guess.map((d, j) => (
                  <View key={j} style={{ width: digit, height: digit + 2, borderRadius: 8, backgroundColor: T.s2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: ROUND, fontWeight: '700', fontSize: digit * 0.62, color: T.tx }}>{d}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={pegsText(c.wellPlaced, c.misplaced)}>
                {Array.from({ length: c.wellPlaced }, (_, j) => <Peg key={`f${j}`} kind="full" />)}
                {Array.from({ length: c.misplaced }, (_, j) => <Peg key={`h${j}`} kind="hollow" />)}
                {!c.wellPlaced && !c.misplaced ? <Peg kind="none" /> : null}
              </View>
              <Text style={{ fontSize: 12.5, color: T.tx2, flex: 1, lineHeight: 15 }}>{pegsText(c.wellPlaced, c.misplaced)}</Text>
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 8, paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Peg kind="full" /><Text style={{ fontSize: 13, color: T.tx2 }}>{tr('bien placé')}</Text></View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Peg kind="hollow" /><Text style={{ fontSize: 13, color: T.tx2 }}>{tr('mal placé')}</Text></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 10 }} accessibilityLabel={tr('Molettes du cadenas')}>
        {st.symbols.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={tr('Chiffre {0} : augmenter', [i + 1])} onPress={() => { tap(); turn(i, 1); }}
              style={{ width: wheelW, height: 32, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="up" size={18} color={T.tx2} sw={2} />
            </Pressable>
            <View accessible accessibilityLabel={tr('Chiffre {0} : {1}', [i + 1, d ?? '?'])} style={[{ width: wheelW, height: 52, borderRadius: 14, backgroundColor: '#0f1226', borderWidth: 1.5, borderColor: T.moon, alignItems: 'center', justifyContent: 'center' }, hasCell(focus, -1, i) ? { borderColor: T.gold, borderWidth: 2 } : null]}>
              <Text style={{ fontFamily: MONO, fontSize: 40, fontWeight: '600', color: T.tx }}>{d ?? 0}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={tr('Chiffre {0} : diminuer', [i + 1])} onPress={() => { tap(); turn(i, -1); }}
              style={{ width: wheelW, height: 32, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="down" size={18} color={T.tx2} sw={2} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Suites
function Sequence({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as SequencesPuzzle, st = s.state as SequencesState;
  const n = p.terms.length + 1;
  const cellW = Math.min(66, (width - 32 - 6 * (n - 1)) / n);
  const font = Math.min(22, cellW * 0.42);
  const cell = { width: cellW, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View>
      <View style={[box, { padding: 16, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}>
        {p.terms.map((v, i) => (
          <View key={i} style={[cell, { backgroundColor: T.s2 }]}><Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: ROUND, fontWeight: '800', fontSize: font, color: T.tx }}>{termText(p, v)}</Text></View>
        ))}
        <View style={[cell, { borderWidth: 2, borderStyle: 'dashed', borderColor: T.moon }]}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: ROUND, fontWeight: '800', fontSize: font, color: T.moon }}>{st.selected !== null ? termText(p, p.options[st.selected]) : '?'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {p.options.map((o, i) => {
          const wrong = st.ruledOut.includes(i), selected = st.selected === i;
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected, disabled: wrong }} accessibilityLabel={wrong ? termText(p, o) + tr(', écarté') : termText(p, o)} disabled={wrong}
              onPress={() => { tap(); onPlay({ ...st, selected: i }, false); }}
              style={{ width: '48%', flexGrow: 1, height: 64, borderRadius: R.m, backgroundColor: T.s2, borderWidth: selected ? 2 : 1, borderColor: wrong ? T.coral : selected ? T.moon : T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: ROUND, fontSize: 26, fontWeight: '700', color: wrong ? T.coral : T.tx, textDecorationLine: wrong ? 'line-through' : 'none' }}>{termText(p, o)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Balances
const SHAPE_NAMES: Record<string, [string, string]> = { circle: ['un cercle', '{0} cercles'], triangle: ['un triangle', '{0} triangles'], square: ['un carré', '{0} carrés'], diamond: ['un losange', '{0} losanges'] };
function describeSide(p: ScalesPuzzle, items: ScalesPuzzle['balances'][number]['left']): string {
  const counts = new Map<string, number>();
  for (const it of items) { const k = 'shape' in it ? p.shapes[it.shape] : `#${it.weight}`; counts.set(k, (counts.get(k) ?? 0) + 1); }
  return [...counts].map(([k, n]) => (k.startsWith('#') ? tr('un poids {0}', [k.slice(1)]) : trn(n, SHAPE_NAMES[k][0], SHAPE_NAMES[k][1]))).join(tr(' et '));
}

function Scales({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as ScalesPuzzle, st = s.state as ScalesState;
  const bw = width - 26, bh = bw * (80 / 300);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'];
  const press = (k: string) => {
    const entry = k === '⌫' ? st.entry.slice(0, -1) : k === 'C' ? '' : st.entry.length < 3 ? st.entry + k : st.entry;
    onPlay({ ...st, entry }, false);
  };
  return (
    <View>
      <View style={[box, { paddingVertical: 8, paddingHorizontal: 12 }]}>
        {p.balances.map((b, i) => (
          <View key={i} accessible accessibilityLabel={tr('Balance {0} : {1} pèsent autant que {2}.', [i + 1, describeSide(p, b.left), describeSide(p, b.right)])}>
            <SvgXml xml={scalesBalanceXml(p, b, i + 1)} width={bw} height={bh} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <SvgXml xml={shapeXml(p.shapes[p.question], 14)} width={30} height={30} />
        <Text style={{ fontSize: 22, color: T.tx }}>=</Text>
        <View accessible accessibilityLabel={tr('Réponse : {0}', [st.entry || tr('vide')])} style={{ minWidth: 96, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: T.moon, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: 28, color: T.tx }}>{st.entry || '?'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {keys.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={k === '⌫' ? 'Effacer' : k === 'C' ? 'Tout effacer' : k} onPress={() => { tap(); press(k); }}
            style={{ width: (width - 30) / 6, height: 52, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: ROUND, fontSize: 22, fontWeight: '700', color: T.tx }}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Board(props: BoardProps) {
  switch (props.s.code) {
    case 'IN': return <Switches {...props} />;
    case 'LA': return <Lamps {...props} />;
    case 'EN': return <Gears {...props} />;
    case 'CA': return <Lock {...props} />;
    case 'SU': return <Sequence {...props} />;
    case 'BA': return <Scales {...props} />;
    case 'CR': case 'VI': case 'DI': case 'ET': case 'OM': case 'SC': return <Board3 {...props} />;
    case 'BR': case 'SG': case 'TO': case 'GL': case 'TQ': case 'RU': case 'LU': case 'PA': return <Board4 {...props} />;
    default: return <Board2 {...props} />;
  }
}

/** Rule shown above the board (switch patterns change the wording). */
export function ruleFor(s: Session): string {
  if (s.code === 'IN') {
    const pat = (s.data as SwitchesPuzzle).pattern;
    if (pat === 'diagonal') return tr('Chaque bouton inverse sa lanterne et ses voisines en diagonale. Allume tout.');
    if (pat === 'ring') return tr('Chaque bouton inverse sa lanterne et ses huit voisines. Allume tout.');
  }
  if (s.code === 'CA') {
    const p = s.data as LocksPuzzle;
    return tr(p.allowsRepeats ? 'Trouve le code : {0} chiffres, qui peuvent se répéter.' : 'Trouve le code : {0} chiffres, tous différents.', [p.length]);
  }
  if (s.code === 'SC') return sealRuleText(s.data as SealPuzzle);
  if (s.code === 'DI') return tr('Trouve les {0} différences entre les deux images.', [(s.data as SpotPuzzle).diffs.length]);
  // Variants say so first: the player must notice the rule has changed.
  if (s.code === 'CR' && (s.data as ChimesPuzzle).reverse) return tr('À rebours : écoute la mélodie, puis rejoue-la en partant de la dernière note.');
  if (s.code === 'OM' && (s.data as ShadowsPuzzle).reflection) return tr('Reflet : quel reflet appartient à l’objet ? Dans un miroir, l’objet est retourné, et il peut aussi être tourné.');
  if (s.code === 'VI' && (s.data as StainedPuzzle).veiled?.length) return tr('Vitres voilées : chaque ligne et chaque colonne a un filtre rouge, jaune, bleu, ou aucun. Certaines vitres sont voilées, les autres suffisent. Retrouve les filtres.');
  if (s.code === 'SU' && (s.data as SequencesPuzzle).letters) return tr('Trouve la lettre suivante.');
  return FAMILIES[s.code].rule;
}

