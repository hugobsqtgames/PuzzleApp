// Boards of Broderie, Signes, Toits, Glissade, Taquin, Rubans, Lucioles and Passerelles.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Text } from './Text';

import { T, R, ROUND } from './theme';
import { Icon, Nilo } from './components';
import { CellRef } from '../core/puzzlekit/types';
import { EmbroideryPuzzle, EmbroideryState, runsOf } from '../core/families/embroidery';
import { SignsPuzzle, SignsState } from '../core/families/signs';
import { RoofsPuzzle, RoofsState, seen } from '../core/families/roofs';
import { Dir, GlideFamily, GlidePuzzle, GlideState } from '../core/families/glide';
import { SliderPuzzle, SliderState, tapTile } from '../core/families/slider';
import { RibbonsFamily, RibbonsPuzzle, RibbonsState, pinColour } from '../core/families/ribbons';
import { FirefliesPuzzle, FirefliesState } from '../core/families/fireflies';
import { BridgesFamily, BridgesPuzzle, BridgesState, edgesOf, linkKey } from '../core/families/bridges';
import { useStore } from '../game/store';
import type { BoardProps } from './boards';
import { tr, trn, translated } from '../i18n';

const box = { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l } as const;
const focusOf = (s: BoardProps['s']): CellRef[] => [...(s.hint.focus ?? []), ...(s.error?.focus ?? [])];
const has = (cells: CellRef[], r: number, c: number) => cells.some((x) => x.row === r && x.column === c);

export function Board4(props: BoardProps) {
  switch (props.s.code) {
    case 'BR': return <Embroidery {...props} />;
    case 'SG': return <Signs {...props} />;
    case 'TO': return <Roofs {...props} />;
    case 'GL': return <Glide {...props} />;
    case 'TQ': return <Slider {...props} />;
    case 'RU': return <Ribbons {...props} />;
    case 'LU': return <Fireflies {...props} />;
    case 'PA': return <Bridges {...props} />;
    default: return null;
  }
}

/** Two choices side by side (a tool, a mode). */
function Segmented<K extends string>({ value, options, onChange }: { value: K; options: [K, string, string][]; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'center' }}>
      {options.map(([k, label, icon]) => (
        <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: value === k }} accessibilityLabel={label} onPress={() => onChange(k)}
          style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: value === k ? T.moon : T.line, backgroundColor: value === k ? T.s2 : 'transparent' }}>
          <Icon name={icon} size={16} color={value === k ? T.tx : T.tx2} />
          <Text style={{ color: value === k ? T.tx : T.tx2, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Broderie
function Embroidery({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as EmbroideryPuzzle, st = s.state as EmbroideryState;
  const [tool, setTool] = useState<'stitch' | 'cross'>('stitch');
  const focus = focusOf(s);
  const rowClueW = Math.max(...p.rowClues.map((c) => c.length)) * 13 + 8;
  const colClueH = Math.max(...p.colClues.map((c) => c.length)) * 14 + 6;
  const size = Math.floor(Math.min(36, (width - 28 - rowClueW) / p.cols));
  const stitched = st.cells.map((v) => v === 1);
  const rowDone = (r: number) => same(runsOf(stitched.slice(r * p.cols, r * p.cols + p.cols)), p.rowClues[r]);
  const colDone = (c: number) => same(runsOf([...Array(p.rows)].map((_, r) => stitched[r * p.cols + c])), p.colClues[c]);
  const press = (i: number) => {
    tap();
    const cells = st.cells.slice();
    cells[i] = tool === 'stitch' ? (cells[i] === 1 ? 0 : 1) : (cells[i] === 2 ? 0 : 2);
    onPlay({ cells });
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={[box, { padding: 14, alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', marginLeft: rowClueW }}>
          {p.colClues.map((c, k) => (
            <View key={k} style={{ width: size, height: colClueH, justifyContent: 'flex-end', alignItems: 'center' }}>
              {c.map((x, j) => <Text key={j} style={{ color: colDone(k) ? T.tx3 : T.gold, fontSize: 12, fontWeight: '700', lineHeight: 14 }}>{x}</Text>)}
            </View>
          ))}
        </View>
        {[...Array(p.rows)].map((_, r) => (
          <View key={r} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: rowClueW, flexDirection: 'row', justifyContent: 'flex-end', gap: 5, paddingRight: 6 }}>
              {p.rowClues[r].map((x, j) => <Text key={j} style={{ color: rowDone(r) ? T.tx3 : T.gold, fontSize: 12, fontWeight: '700' }}>{x}</Text>)}
            </View>
            {[...Array(p.cols)].map((__, c) => {
              const i = r * p.cols + c, v = st.cells[i], hot = has(focus, r, c);
              return (
                <Pressable key={c} accessibilityRole="button" accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${tr(v === 1 ? 'brodée' : v === 2 ? 'vide' : 'libre')}`} onPress={() => press(i)}
                  style={{ width: size, height: size, borderWidth: 0.5, borderColor: '#3a3f6a', borderRightWidth: (c + 1) % 5 === 0 && c + 1 < p.cols ? 1.5 : 0.5, borderBottomWidth: (r + 1) % 5 === 0 && r + 1 < p.rows ? 1.5 : 0.5, backgroundColor: hot ? 'rgba(143,211,224,0.25)' : '#12152b', alignItems: 'center', justifyContent: 'center' }}>
                  {v === 1 ? <View style={{ width: size - 6, height: size - 6, borderRadius: 4, backgroundColor: T.amber }}><Svg width={size - 6} height={size - 6}><Path d={`M3 ${size - 9}L${size - 9} 3M3 3L${size - 9} ${size - 9}`} stroke="#b0702a" strokeWidth={1.4} /></Svg></View> : null}
                  {v === 2 ? <Icon name="x" size={size * 0.4} color={T.tx3} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Segmented value={tool} onChange={(k) => { tap(); setTool(k); }} options={[['stitch', tr('Broder'), 'knit'], ['cross', tr('Marquer vide'), 'x']]} />
    </View>
  );
}
const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---------------------------------------------------------------- Signes & Toits
/**
 * Pencil notes (Signes, Toits): small candidate digits in a cell, as on paper.
 * Kept for the puzzle while the app runs (not in the save: they are scribbles).
 */
const NOTES = new Map<string, Map<number, number[]>>();
function usePencil(id: string) {
  const [pencil, setPencil] = useState(false);
  const [, bump] = useState(0);
  const notes = NOTES.get(id) ?? new Map<number, number[]>();
  if (!NOTES.has(id)) NOTES.set(id, notes);
  const toggle = (cell: number, v: number) => { const cur = notes.get(cell) ?? []; notes.set(cell, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].sort()); bump((x) => x + 1); };
  const clear = (cell: number) => { notes.delete(cell); bump((x) => x + 1); };
  return { pencil, setPencil, notes, toggle, clear };
}

/** The candidates noted in a cell, small, in a 3-wide grid. */
function CellNotes({ list, size }: { list?: number[]; size: number }) {
  if (!list?.length) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 3, right: 3, top: 2, bottom: 2, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center' }}>
      {list.map((v) => <Text key={v} style={{ width: '33%', textAlign: 'center', color: T.moon, fontSize: Math.max(9, size * 0.22), lineHeight: Math.max(11, size * 0.27), fontWeight: '700' }}>{v}</Text>)}
    </View>
  );
}

function NumberPad({ n, onPick, onErase, pencil, onPencil }: { n: number; onPick: (v: number) => void; onErase: () => void; pencil?: boolean; onPencil?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {onPencil ? (
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: !!pencil }} accessibilityLabel={tr('Crayon : noter des chiffres possibles')} onPress={onPencil}
          style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: pencil ? T.moon : 'transparent', borderWidth: 1, borderColor: pencil ? T.moon : T.line, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pencil" size={20} color={pencil ? T.bg : T.tx2} />
        </Pressable>
      ) : null}
      {[...Array(n)].map((_, k) => (
        <Pressable key={k} accessibilityRole="button" accessibilityLabel={tr('Chiffre {0}', [k + 1])} onPress={() => onPick(k + 1)}
          style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.tx, fontSize: 22, fontWeight: '700', fontFamily: ROUND }}>{k + 1}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel={tr('Effacer')} onPress={onErase}
        style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'transparent', borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="x" size={20} color={T.tx2} />
      </Pressable>
    </View>
  );
}

/** A square of digits: select a cell, then a digit. `decor` draws around each cell. */
function DigitSquare({ n, values, givens, size, focus, sel, onSelect, cellStyle, label, notes }: {
  n: number; values: number[]; givens: number[]; size: number; focus: CellRef[]; sel: number | null; onSelect: (i: number) => void;
  cellStyle?: (v: number) => object; label: (r: number, c: number, v: number) => string; notes?: Map<number, number[]>;
}) {
  return (
    <View>
      {[...Array(n)].map((_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {[...Array(n)].map((__, c) => {
            const i = r * n + c, v = values[i], given = !!givens[i], hot = has(focus, r, c);
            return (
              <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: sel === i, disabled: given }} accessibilityLabel={label(r, c, v)} disabled={given} onPress={() => onSelect(i)}
                style={[{ width: size, height: size, margin: 3, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12152b', borderWidth: sel === i ? 2.5 : 1, borderColor: hot ? T.coral : sel === i ? T.moon : T.line }, v ? cellStyle?.(v) : null]}>
                <Text style={{ color: given ? T.gold : T.tx, fontSize: size * 0.46, fontWeight: given ? '800' : '600', fontFamily: ROUND }}>{v || ''}</Text>
                {!v ? <CellNotes list={notes?.get(i)} size={size} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Signs({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as SignsPuzzle, st = s.state as SignsState;
  const [sel, setSel] = useState<number | null>(null);
  const pen = usePencil(s.id);
  const gap = 18, size = Math.floor(Math.min(52, (width - 28 - gap * (p.n - 1)) / p.n - 6));
  const step = size + 6 + gap;
  const put = (v: number) => {
    if (sel === null) return;
    tap();
    if (pen.pencil && v) { pen.toggle(sel, v); return; }
    if (!v) pen.clear(sel);
    const values = st.values.slice(); values[sel] = v; onPlay({ values });
  };
  return (
    <View style={{ gap: 14 }}>
      <View style={[box, { padding: 14, alignItems: 'center' }]}>
        <View style={{ width: p.n * step - gap, height: p.n * step - gap }}>
          {[...Array(p.n * p.n)].map((_, i) => {
            const r = Math.floor(i / p.n), c = i % p.n, v = st.values[i], given = !!p.givens[i], hot = has(focusOf(s), r, c);
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: sel === i, disabled: given }} accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${v || tr('vide')}`} disabled={given}
                onPress={() => { tap(); setSel(i); }}
                style={{ position: 'absolute', left: c * step, top: r * step, width: size + 6, height: size + 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12152b', borderWidth: sel === i ? 2.5 : 1, borderColor: hot ? T.coral : sel === i ? T.moon : T.line }}>
                <Text style={{ color: given ? T.gold : T.tx, fontSize: size * 0.5, fontWeight: given ? '800' : '600', fontFamily: ROUND }}>{v || ''}</Text>
                {!v ? <CellNotes list={pen.notes.get(i)} size={size} /> : null}
              </Pressable>
            );
          })}
          {p.less.map(([a, b], k) => {
            // The point of the sign faces the smaller cell.
            const ra = Math.floor(a / p.n), ca = a % p.n, rb = Math.floor(b / p.n), cb = b % p.n;
            const horizontal = ra === rb;
            const x = horizontal ? Math.max(ca, cb) * step - gap / 2 : ca * step + (size + 6) / 2;
            const y = horizontal ? ra * step + (size + 6) / 2 : Math.max(ra, rb) * step - gap / 2;
            const glyph = horizontal ? (ca < cb ? '<' : '>') : (ra < rb ? '∧' : '∨');
            return <Text key={k} pointerEvents="none" style={{ position: 'absolute', left: x - 8, top: y - 11, width: 16, textAlign: 'center', color: T.amber, fontSize: 17, fontWeight: '800', lineHeight: 22 }}>{glyph}</Text>;
          })}
        </View>
      </View>
      <NumberPad n={p.n} onPick={put} onErase={() => put(0)} pencil={pen.pencil} onPencil={() => { tap(); pen.setPencil(!pen.pencil); }} />
    </View>
  );
}

function Roofs({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as RoofsPuzzle, st = s.state as RoofsState;
  const [sel, setSel] = useState<number | null>(null);
  const pen = usePencil(s.id);
  const clue = 26, size = Math.floor(Math.min(52, (width - 28 - clue * 2) / p.n - 6));
  const put = (v: number) => {
    if (sel === null) return;
    tap();
    if (pen.pencil && v) { pen.toggle(sel, v); return; }
    if (!v) pen.clear(sel);
    const values = st.values.slice(); values[sel] = v; onPlay({ values });
  };
  const line = (cells: number[]) => cells.map((i) => st.values[i]);
  const ok = (cells: number[], want: number) => !want || !line(cells).every(Boolean) ? null : seen(line(cells)) === want;
  const Clue = ({ v, good }: { v: number; good: boolean | null }) => (
    <View style={{ width: clue, height: clue, alignItems: 'center', justifyContent: 'center' }}>
      {v ? <Text style={{ color: good === null ? T.gold : good ? T.tx3 : T.coral, fontSize: 15, fontWeight: '800' }}>{v}</Text> : null}
    </View>
  );
  const col = (c: number) => [...Array(p.n)].map((_, r) => r * p.n + c), row = (r: number) => [...Array(p.n)].map((_, c) => r * p.n + c);
  // Taller chimneys glow warmer.
  const shade = (v: number) => ({ backgroundColor: `rgba(244,180,94,${0.08 + (0.42 * v) / p.n})` });
  return (
    <View style={{ gap: 14 }}>
      <View style={[box, { padding: 14, alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', marginLeft: clue }}>{[...Array(p.n)].map((_, c) => <View key={c} style={{ width: size + 6, alignItems: 'center' }}><Clue v={p.top[c]} good={ok(col(c), p.top[c])} /></View>)}</View>
        <View style={{ flexDirection: 'row' }}>
          <View>{[...Array(p.n)].map((_, r) => <View key={r} style={{ height: size + 6, justifyContent: 'center' }}><Clue v={p.left[r]} good={ok(row(r), p.left[r])} /></View>)}</View>
          <DigitSquare n={p.n} values={st.values} givens={p.givens} size={size} focus={focusOf(s)} sel={sel} onSelect={(i) => { tap(); setSel(i); }} cellStyle={shade}
            label={(r, c, v) => `${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${v ? tr('cheminée de {0}', [v]) : tr('vide')}`} notes={pen.notes} />
          <View>{[...Array(p.n)].map((_, r) => <View key={r} style={{ height: size + 6, justifyContent: 'center' }}><Clue v={p.right[r]} good={ok([...row(r)].reverse(), p.right[r])} /></View>)}</View>
        </View>
        <View style={{ flexDirection: 'row', marginLeft: clue }}>{[...Array(p.n)].map((_, c) => <View key={c} style={{ width: size + 6, alignItems: 'center' }}><Clue v={p.bottom[c]} good={ok([...col(c)].reverse(), p.bottom[c])} /></View>)}</View>
      </View>
      <NumberPad n={p.n} onPick={put} onErase={() => put(0)} pencil={pen.pencil} onPencil={() => { tap(); pen.setPencil(!pen.pencil); }} />
    </View>
  );
}

// ---------------------------------------------------------------- Glissade
const glide = new GlideFamily();
const ARROWS: [Dir, string, string][] = translated([[0, 'up', 'Glisser vers le haut'], [3, 'back', 'Glisser vers la gauche'], [1, 'chev', 'Glisser vers la droite'], [2, 'down', 'Glisser vers le bas']]);

function Glide({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as GlidePuzzle, st = s.state as GlideState;
  const size = Math.floor(Math.min(46, (width - 28) / p.cols));
  const rocks = new Set(p.rocks);
  const [pos] = useState(() => new Animated.ValueXY({ x: (st.pos % p.cols) * size, y: Math.floor(st.pos / p.cols) * size }));
  useEffect(() => {
    Animated.timing(pos, { toValue: { x: (st.pos % p.cols) * size, y: Math.floor(st.pos / p.cols) * size }, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [st.pos, size, p.cols, pos]);
  const go = (d: Dir) => { const next = glide.move(p, st, d); if (next !== st) { tap(); onPlay(next); } };
  // A swipe on the ice slides Nilo too.
  const start = useRef<{ x: number; y: number } | null>(null);
  const onEnd = (e: GestureResponderEvent) => {
    if (!start.current) return;
    const dx = e.nativeEvent.pageX - start.current.x, dy = e.nativeEvent.pageY - start.current.y;
    start.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
  };
  return (
    <View style={{ gap: 14 }}>
      <View style={[box, { padding: 14, alignItems: 'center' }]}>
        <View onStartShouldSetResponder={() => true} onResponderGrant={(e) => { start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; }} onResponderRelease={onEnd}
          accessible accessibilityLabel={tr('Canal gelé. Nilo est ligne {0}, colonne {1}. La lanterne est ligne {2}, colonne {3}.', [Math.floor(st.pos / p.cols) + 1, (st.pos % p.cols) + 1, Math.floor(p.goal / p.cols) + 1, (p.goal % p.cols) + 1])}
          style={{ width: size * p.cols, height: size * p.rows, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1d3048' }}>
          {[...Array(p.rows * p.cols)].map((_, i) => {
            const r = Math.floor(i / p.cols), c = i % p.cols;
            return (
              <View key={i} pointerEvents="none" style={{ position: 'absolute', left: c * size, top: r * size, width: size, height: size, borderWidth: has(focusOf(s), r, c) ? 2.5 : 0.5, borderColor: has(focusOf(s), r, c) ? T.gold : 'rgba(191,230,240,0.12)', backgroundColor: (r + c) % 2 ? 'rgba(191,230,240,0.05)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {rocks.has(i) ? <View style={{ width: size - 6, height: size - 6, borderRadius: 6, backgroundColor: '#6b4f33', borderWidth: 2, borderColor: '#8a6a45' }} /> : null}
                {i === p.goal ? <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={11} fill="rgba(255,217,142,0.25)" /><Rect x={8} y={6} width={8} height={12} rx={3} fill={T.amber} /><Circle cx={12} cy={12} r={2.2} fill="#FFF3D6" /></Svg> : null}
              </View>
            );
          })}
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: pos.getTranslateTransform() }}>
            <Nilo size={size * 0.95} mood="curious" still />
          </Animated.View>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        {[[ARROWS[0]], [ARROWS[1], ARROWS[3], ARROWS[2]]].map((rowA, k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
            {rowA.map(([d, icon, label]) => (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={label} onPress={() => go(d)}
                style={{ width: 56, height: 48, borderRadius: 14, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={22} color={T.tx} />
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Taquin
function Slider({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as SliderPuzzle, st = s.state as SliderState;
  const size = Math.floor(Math.min(92, (width - 28) / p.cols - 6));
  const focus = focusOf(s);
  return (
    <View style={[box, { padding: 14, alignItems: 'center' }]}>
      {[...Array(p.rows)].map((_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {[...Array(p.cols)].map((__, c) => {
            const i = r * p.cols + c, v = st.tiles[i], home = v === i + 1;
            if (!v) return <View key={c} style={{ width: size, height: size, margin: 3 }} />;
            return (
              <Pressable key={c} accessibilityRole="button" accessibilityLabel={tr('Tuile {0}', [v])} onPress={() => { const t = tapTile(p.rows, p.cols, st.tiles, i); if (t !== st.tiles) { tap(); onPlay({ tiles: t }); } }}
                style={{ width: size, height: size, margin: 3, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: home ? '#3a2f22' : T.s2, borderWidth: has(focus, r, c) ? 2.5 : 1, borderColor: has(focus, r, c) ? T.gold : home ? '#8a6a45' : T.line }}>
                <Text style={{ color: home ? T.gold : T.tx, fontSize: size * 0.42, fontWeight: '800', fontFamily: ROUND }}>{v}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Rubans
export const RIBBON_COLORS = ['#F0E442', '#56B4E9', '#E69F00', '#2BB08A', '#D98CBF', '#E0622A', '#B7A6FF', '#FFFFFF', '#9CCB8A', '#C98A5A'];
const ribbons = new RibbonsFamily();

function Ribbons({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as RibbonsPuzzle, st = s.state as RibbonsState;
  const aid = useStore().settings.colorAid;
  const size = Math.floor(Math.min(44, (width - 28) / p.cols));
  const focus = focusOf(s);
  const center = (i: number) => [(i % p.cols) * size + size / 2, Math.floor(i / p.cols) * size + size / 2];
  const owner = (i: number) => st.paths.findIndex((r) => r.includes(i));
  const stRef = useRef(st);
  useEffect(() => { stRef.current = st; }, [st]);
  const last = useRef(-1);
  // A tap goes to the cell's button; a drag is taken over by the loom, which reads page positions.
  const loom = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const startAt = useRef<{ x: number; y: number } | null>(null);
  const measure = () => loom.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
  const cellAtPage = (px: number, py: number) => {
    const c = Math.floor((px - origin.current.x) / size), r = Math.floor((py - origin.current.y) / size);
    return r >= 0 && c >= 0 && r < p.rows && c < p.cols ? r * p.cols + c : -1;
  };
  const touch = (i: number) => {
    if (i < 0 || i === last.current) return;
    last.current = i;
    const next = ribbons.touch(p, stRef.current, i);
    if (next !== stRef.current) { stRef.current = next; tap(); onPlay(next); }
  };
  return (
    <View style={[box, { padding: 14, alignItems: 'center' }]}>
      <View ref={loom} onLayout={measure}
        onStartShouldSetResponderCapture={(e) => { measure(); startAt.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; return false; }}
        onMoveShouldSetResponderCapture={(e) => !!startAt.current && Math.hypot(e.nativeEvent.pageX - startAt.current.x, e.nativeEvent.pageY - startAt.current.y) > 8}
        onResponderGrant={(e) => { last.current = -1; if (startAt.current) touch(cellAtPage(startAt.current.x, startAt.current.y)); touch(cellAtPage(e.nativeEvent.pageX, e.nativeEvent.pageY)); }}
        onResponderMove={(e) => touch(cellAtPage(e.nativeEvent.pageX, e.nativeEvent.pageY))}
        onResponderRelease={() => { last.current = -1; startAt.current = null; }}
        onResponderTerminate={() => { last.current = -1; startAt.current = null; }}
        style={{ width: size * p.cols, height: size * p.rows, borderRadius: 10, backgroundColor: '#12152b' }}>
        <Svg width={size * p.cols} height={size * p.rows} pointerEvents="none">
          {[...Array(p.rows * p.cols)].map((_, i) => {
            const k = owner(i), r = Math.floor(i / p.cols), c = i % p.cols;
            return <Rect key={i} x={c * size + 0.5} y={r * size + 0.5} width={size - 1} height={size - 1} rx={4} fill={k >= 0 ? RIBBON_COLORS[k % 10] : 'transparent'} opacity={0.14} stroke={has(focus, r, c) ? T.gold : '#2a2f55'} strokeWidth={has(focus, r, c) ? 2 : 1} />;
          })}
          {st.paths.map((path, k) => path.length > 1 ? (
            <Path key={k} d={path.map((x, j) => { const [cx, cy] = center(x); return `${j ? 'L' : 'M'}${cx} ${cy}`; }).join('')} stroke={RIBBON_COLORS[k % 10]} strokeWidth={size * 0.34} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={st.active === k ? 1 : 0.9} />
          ) : null)}
          {p.ends.flatMap(([a, b], k) => [a, b].map((x) => { const [cx, cy] = center(x); return <Circle key={`${k}.${x}`} cx={cx} cy={cy} r={size * 0.36} fill={RIBBON_COLORS[k % 10]} stroke={st.active === k ? '#FFF' : '#0D0F1E'} strokeWidth={st.active === k ? 3 : 2} />; }))}
        </Svg>
        {/* Colour aid: each ribbon carries its letter all along, not only on its pins. */}
        {aid ? st.paths.flatMap((path, k) => path.filter((x) => pinColour(p, x) < 0).map((x) => (
          <Text key={`r${k}.${x}`} pointerEvents="none" style={{ position: 'absolute', left: (x % p.cols) * size, top: Math.floor(x / p.cols) * size + size / 2 - 7, width: size, textAlign: 'center', color: '#0D0F1E', fontSize: 10, fontWeight: '800', opacity: 0.85 }}>{String.fromCharCode(65 + k)}</Text>
        ))) : null}
        {aid ? p.ends.flatMap(([a, b], k) => [a, b].map((x) => (
          <Text key={`t${k}.${x}`} pointerEvents="none" style={{ position: 'absolute', left: (x % p.cols) * size, top: Math.floor(x / p.cols) * size + size / 2 - 9, width: size, textAlign: 'center', color: '#0D0F1E', fontSize: 13, fontWeight: '800' }}>{String.fromCharCode(65 + k)}</Text>
        ))) : null}
        {/* VoiceOver: the pins and cells as buttons, reading the ribbon they belong to. */}
        {[...Array(p.rows * p.cols)].map((_, i) => {
          const pin = pinColour(p, i), k = owner(i);
          return <Pressable key={`a${i}`} accessible accessibilityRole="button" accessibilityLabel={tr('Ligne {0}, colonne {1}', [Math.floor(i / p.cols) + 1, (i % p.cols) + 1]) + (pin >= 0 ? tr(', épingle {0}', [String.fromCharCode(65 + pin)]) : k >= 0 ? tr(', ruban {0}', [String.fromCharCode(65 + k)]) : tr(', libre'))}
            onPress={() => { last.current = -1; startAt.current = null; touch(i); }} style={{ position: 'absolute', left: (i % p.cols) * size, top: Math.floor(i / p.cols) * size, width: size, height: size }} />;
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Lucioles
function Fireflies({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as FirefliesPuzzle, st = s.state as FirefliesState;
  // Colour aid: a count already met is struck through, a cell at fault gets a dashed frame.
  const aid = useStore().settings.colorAid;
  const met = (done: boolean) => (done ? { color: T.tx3, ...(aid ? { textDecorationLine: 'line-through' as const } : null) } : { color: T.gold });
  const posts = new Set(p.posts), focus = focusOf(s);
  const size = Math.floor(Math.min(44, (width - 28 - 26) / p.cols));
  const count = (cells: number[]) => cells.filter((i) => st.cells[i] === 1).length;
  const press = (i: number) => { tap(); const cells = st.cells.slice(); cells[i] = (cells[i] + 1) % 3; onPlay({ cells }); };
  return (
    <View style={[box, { padding: 14, alignItems: 'center' }]}>
      {[...Array(p.rows)].map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {[...Array(p.cols)].map((__, c) => {
            const i = r * p.cols + c, v = st.cells[i], hot = has(focus, r, c);
            if (posts.has(i)) return (
              <View key={c} accessible accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${tr('lanterne')}`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2a24', borderWidth: 0.5, borderColor: '#2e4a3e' }}>
                <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24"><Rect x={11} y={10} width={2} height={13} fill="#6b5a3c" /><Rect x={7} y={2} width={10} height={10} rx={3} fill={T.amber} /><Circle cx={12} cy={7} r={2} fill="#FFF3D6" /></Svg>
              </View>
            );
            return (
              <Pressable key={c} accessibilityRole="button" accessibilityLabel={`${tr('Ligne {0}, colonne {1}', [r + 1, c + 1])} : ${tr(v === 1 ? 'luciole' : v === 2 ? 'herbe' : 'libre')}`} onPress={() => press(i)}
                style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', backgroundColor: hot ? 'rgba(232,138,138,0.25)' : v === 2 ? '#1d3a2c' : '#13241d', borderWidth: hot && aid ? 2 : 0.5, borderColor: hot && aid ? T.coral : '#2e4a3e', borderStyle: hot && aid ? 'dashed' : 'solid' }}>
                {v === 1 ? <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={10} fill="rgba(240,228,66,0.3)" /><Circle cx={12} cy={12} r={4.5} fill="#F0E442" /><Path d="M12 7c-3-4-7-3-6 0M12 7c3-4 7-3 6 0" stroke="#BFE6F0" strokeWidth={1.4} fill="none" /></Svg> : null}
                {v === 2 ? <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"><Path d="M6 20c1-6 1-9 0-13M12 20c0-7 1-11 3-15M18 20c-1-5 0-8 2-11" stroke="#4f8a5e" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg> : null}
              </Pressable>
            );
          })}
          <Text style={[{ width: 26, textAlign: 'center', fontSize: 15, fontWeight: '800' }, met(count([...Array(p.cols)].map((_, c) => r * p.cols + c)) === p.rowCounts[r])]}>{p.rowCounts[r]}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', marginRight: 26 }}>
        {p.colCounts.map((v, c) => <Text key={c} style={[{ width: size, textAlign: 'center', fontSize: 15, fontWeight: '800', marginTop: 4 }, met(count([...Array(p.rows)].map((_, r) => r * p.cols + c)) === v)]}>{v}</Text>)}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Passerelles
const bridgesFamily = new BridgesFamily();

function Bridges({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as BridgesPuzzle, st = s.state as BridgesState;
  const size = Math.floor(Math.min(40, (width - 28) / p.cols));
  const focus = focusOf(s);
  const xy = (pos: number) => [(pos % p.cols) * size + size / 2, Math.floor(pos / p.cols) * size + size / 2];
  const sums = p.islands.map(() => 0);
  const edges = edgesOf(p);
  for (const e of edges) { const v = st.links[linkKey(e.a, e.b)] ?? 0; sums[e.a] += v; sums[e.b] += v; }
  return (
    <View style={[box, { padding: 14, alignItems: 'center' }]}>
      <View style={{ width: size * p.cols, height: size * p.rows, borderRadius: 10, backgroundColor: '#12203a' }}>
        <Svg width={size * p.cols} height={size * p.rows} pointerEvents="none">
          {edges.map((e) => {
            const v = st.links[linkKey(e.a, e.b)] ?? 0;
            if (!v) return null;
            const [x1, y1] = xy(p.islands[e.a][0]), [x2, y2] = xy(p.islands[e.b][0]);
            const vertical = x1 === x2, o = v === 2 ? size * 0.12 : 0;
            return [-o, o].filter((d, j) => v === 2 || j === 0).map((d, j) => (
              <Line key={`${linkKey(e.a, e.b)}.${j}`} x1={vertical ? x1 + d : x1} y1={vertical ? y1 : y1 + d} x2={vertical ? x2 + d : x2} y2={vertical ? y2 : y2 + d} stroke="#c9a563" strokeWidth={3.2} strokeLinecap="round" />
            ));
          })}
        </Svg>
        {p.islands.map(([pos, need], k) => {
          const [x, y] = xy(pos), done = sums[k] === need, over = sums[k] > need, hot = has(focus, Math.floor(pos / p.cols), pos % p.cols), sel = st.selected === k;
          return (
            <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={trn(sums[k], 'Îlot {1}, {0} passerelle', 'Îlot {1}, {0} passerelles', [sums[k], need]) + (sel ? tr(', choisi') : '')}
              onPress={() => { tap(); onPlay(bridgesFamily.tapIsland(p, st, k), st.selected !== null && st.selected !== k); }}
              style={{ position: 'absolute', left: x - size * 0.44, top: y - size * 0.44, width: size * 0.88, height: size * 0.88, borderRadius: size, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#3a5a3e' : over ? '#5a2a2a' : T.s2, borderWidth: sel || hot ? 3 : 1.5, borderColor: sel ? T.moon : hot ? T.gold : done ? '#9CCB8A' : '#8a8fa8' }}>
              <Text style={{ color: T.tx, fontSize: size * 0.42, fontWeight: '800', fontFamily: ROUND }}>{need}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: T.tx3, fontSize: 12, marginTop: 10, textAlign: 'center' }}>{tr('Touche un îlot, puis un autre en face : 1, 2, puis aucune passerelle.')}</Text>
    </View>
  );
}
