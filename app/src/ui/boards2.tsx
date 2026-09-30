// Boards of Motifs, Menteurs, Fil, Miroirs, Enquêtes and Marqueterie.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Polyline, Rect } from 'react-native-svg';

import { T, R, SERIF } from './theme';
import { Icon } from './components';
import { CellRef } from '../core/puzzlekit/types';
import { Cell as PatternCell, PatternsPuzzle, PatternsState } from '../core/families/patterns';
import { CHARACTERS, LiarsPuzzle, LiarsState, statementText } from '../core/families/liars';
import { ThreadsFamily, ThreadsPuzzle, ThreadsState } from '../core/families/threads';
import { MirrorsFamily, MirrorsPuzzle, MirrorsState, trace } from '../core/families/mirrors';
import { InquiriesPuzzle, InquiriesState, OBJECTS, PEOPLE, PLACES, clueText } from '../core/families/inquiries';
import { MarquetryFamily, MarquetryPuzzle, MarquetryState, orientation, orientations } from '../core/families/marquetry';
import { FAMILIES } from '../game/catalog';
import type { BoardProps } from './boards';

const box = { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l } as const;
const hasCell = (cells: CellRef[], r: number, c: number) => cells.some((x) => x.row === r && x.column === c);
const focusOf = (s: BoardProps['s']) => [...(s.hint.focus ?? []), ...(s.error?.focus ?? [])];
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

// ---------------------------------------------------------------- Motifs
const SHAPE_COLORS = ['#D8B56A', '#E7A98B', '#8FB8F0', '#7FC8A9'];

/** One cell of a Motifs table, drawn in a 100×100 box. */
export function PatternGlyph({ c, size, id }: { c: PatternCell; size: number; id: string }) {
  const color = SHAPE_COLORS[c.shape];
  const scale = [0.55, 0.75, 0.95][c.size];
  const r = 13 * scale;
  const positions = c.count === 0 ? [[50, 50]] : c.count === 1 ? [[32, 50], [68, 50]] : [[50, 28], [30, 66], [70, 66]];
  const fill = c.fill === 0 ? color : c.fill === 1 ? `url(#st${id})` : 'none';
  const shape = (x: number, y: number, k: number) => {
    const common = { fill, stroke: color, strokeWidth: 3 };
    if (c.shape === 0) return <Circle key={k} cx={x} cy={y} r={r} {...common} />;
    if (c.shape === 2) return <Rect key={k} x={x - r} y={y - r} width={2 * r} height={2 * r} rx={3} {...common} />;
    if (c.shape === 3) return <Path key={k} d={`M${x} ${y - r * 1.25}L${x + r * 1.1} ${y}L${x} ${y + r * 1.25}L${x - r * 1.1} ${y}z`} {...common} />;
    return <Path key={k} d={`M${x} ${y - r * 1.2}L${x + r * 1.1} ${y + r * 0.85}H${x - r * 1.1}z`} transform={`rotate(${c.rotation * 90} ${x} ${y})`} {...common} />;
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <Pattern id={`st${id}`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={3} />
        </Pattern>
      </Defs>
      {positions.map(([x, y], k) => shape(x, y, k))}
    </Svg>
  );
}

const PATTERN_WORDS = {
  shape: ['cercle', 'triangle', 'carré', 'losange'], fill: ['plein', 'rayé', 'vide'], size: ['petit', 'moyen', 'grand'],
};
export const describePattern = (c: PatternCell) => `${c.count + 1} ${PATTERN_WORDS.shape[c.shape]}${c.count ? 's' : ''} ${PATTERN_WORDS.size[c.size]}${c.count ? 's' : ''}, ${PATTERN_WORDS.fill[c.fill]}${c.count ? 's' : ''}`;

function Patterns({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as PatternsPuzzle, st = s.state as PatternsState;
  const cellW = Math.min(96, (width - 40) / 3);
  const optW = Math.min(100, (width - 20) / 3);
  return (
    <View>
      <View style={[box, { padding: 12, alignItems: 'center' }]}>
        {[0, 1, 2].map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 6, marginBottom: r < 2 ? 6 : 0 }}>
            {[0, 1, 2].map((c) => {
              const i = r * 3 + c;
              if (i === 8) {
                return (
                  <View key={c} style={{ width: cellW, height: cellW, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: T.moon, alignItems: 'center', justifyContent: 'center' }}>
                    {st.selected !== null ? <PatternGlyph c={p.options[st.selected]} size={cellW * 0.9} id={`m${c}`} /> : <Text style={{ color: T.moon, fontSize: 28, fontFamily: SERIF }}>?</Text>}
                  </View>
                );
              }
              return (
                <View key={c} accessible accessibilityLabel={describePattern(p.cells[i])} style={{ width: cellW, height: cellW, borderRadius: 12, backgroundColor: T.s2, alignItems: 'center', justifyContent: 'center' }}>
                  <PatternGlyph c={p.cells[i]} size={cellW * 0.9} id={`c${i}`} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' }}>
        {p.options.map((o, i) => {
          const wrong = st.ruledOut.includes(i), selected = st.selected === i;
          return (
            <Pressable key={i} disabled={wrong} accessibilityRole="button" accessibilityState={{ selected, disabled: wrong }} accessibilityLabel={`${describePattern(o)}${wrong ? ', écarté' : ''}`}
              onPress={() => { tap(); onPlay({ ...st, selected: i }, false); }}
              style={{ width: optW, height: optW * 0.8, borderRadius: R.m, backgroundColor: T.s2, borderWidth: selected ? 2 : 1, borderColor: wrong ? T.coral : selected ? T.moon : T.line, alignItems: 'center', justifyContent: 'center', opacity: wrong ? 0.35 : 1 }}>
              <PatternGlyph c={o} size={optW * 0.7} id={`o${i}`} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Menteurs
const CREATURE_COLORS = ['#EE8A6B', '#8FB8F0', '#C39BD3', '#7FC8A9', '#D8B56A', '#E7A98B', '#9CD37F', '#B8A0E0'];

function Liars({ s, onPlay, tap }: BoardProps) {
  const p = s.data as LiarsPuzzle, st = s.state as LiarsState;
  const focus = focusOf(s);
  const name = (i: number) => CHARACTERS[p.names[i]];
  const cycle = (i: number) => {
    const marks = st.marks.slice();
    marks[i] = marks[i] === null ? true : marks[i] === true ? false : null;
    onPlay({ marks }, false);
  };
  return (
    <View style={{ gap: 8 }}>
      {p.statements.map((stmt, i) => {
        const m = st.marks[i];
        const hi = hasCell(focus, i, 0);
        return (
          <View key={i} style={[box, { padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', borderColor: hi ? (s.error ? T.coral : T.moon) : T.line }]}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: CREATURE_COLORS[p.names[i] % CREATURE_COLORS.length], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#0D0F1E', fontWeight: '800', fontSize: 16 }}>{name(i).split(' ')[1]?.charAt(0) ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.tx2, fontSize: 13, fontWeight: '600' }}>{cap(name(i))}</Text>
              <Text style={{ color: T.tx, fontSize: 16, lineHeight: 21, fontStyle: 'italic' }}>« {statementText(stmt, name, p.statements.length)} »</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${cap(name(i))} : ${m === null ? 'inconnu' : m ? 'dit vrai' : 'ment'}. Toucher pour changer.`}
              onPress={() => { tap(); cycle(i); }}
              style={{ width: 74, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: m === null ? T.s2 : m ? 'rgba(143,211,224,0.15)' : 'rgba(232,138,138,0.15)', borderWidth: 1.5, borderColor: m === null ? T.line : m ? T.moon : T.coral }}>
              <Text style={{ color: m === null ? T.tx2 : m ? T.moon : T.coral, fontWeight: '700', fontSize: 14 }}>{m === null ? '?' : m ? 'Vrai' : 'Ment'}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- Fil
function Threads({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as ThreadsPuzzle, st = s.state as ThreadsState;
  const e = FAMILIES.FI.engine as ThreadsFamily;
  const cellW = Math.min(64, (width - 28) / p.columns);
  const W = cellW * p.columns, H = cellW * p.rows;
  const focus = focusOf(s);
  const center = (i: number) => [(i % p.columns + 0.5) * cellW, (Math.floor(i / p.columns) + 0.5) * cellW];
  const onPath = new Set(st.path);
  return (
    <View style={[box, { padding: 12, alignItems: 'center' }]}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          {Array.from({ length: p.rows * p.columns }, (_, i) => {
            const [x, y] = center(i);
            return <Rect key={i} x={x - cellW / 2 + 2} y={y - cellW / 2 + 2} width={cellW - 4} height={cellW - 4} rx={8} fill={onPath.has(i) ? '#262036' : T.dark2} stroke={hasCell(focus, Math.floor(i / p.columns), i % p.columns) ? T.moon : 'none'} strokeWidth={2} />;
          })}
          <Polyline points={st.path.map((i) => center(i).join(',')).join(' ')} fill="none" stroke={T.amber} strokeWidth={cellW * 0.18} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          {p.walls.map((w) => {
            const [a, b] = w.split('-').map(Number);
            const [ax, ay] = center(a), [bx, by] = center(b);
            const mx = (ax + bx) / 2, my = (ay + by) / 2, vertical = ay === by;
            return <Line key={w} x1={vertical ? mx : mx - cellW / 2} y1={vertical ? my - cellW / 2 : my} x2={vertical ? mx : mx + cellW / 2} y2={vertical ? my + cellW / 2 : my} stroke="#6b5a3c" strokeWidth={5} strokeLinecap="round" />;
          })}
          {[p.start, p.end].map((i, k) => {
            const [x, y] = center(i);
            const lit = k === 0 || (st.path.length === p.rows * p.columns && st.path[st.path.length - 1] === p.end);
            return (
              <G key={k}>
                <Circle cx={x} cy={y} r={cellW * 0.3} fill={lit ? T.amber : '#141833'} opacity={lit ? 0.3 : 1} />
                <Rect x={x - cellW * 0.12} y={y - cellW * 0.17} width={cellW * 0.24} height={cellW * 0.32} rx={cellW * 0.09} fill={lit ? T.amber : '#141833'} stroke={lit ? '#FFE6B0' : '#5a62a8'} strokeWidth={2} />
              </G>
            );
          })}
        </Svg>
        {Array.from({ length: p.rows * p.columns }, (_, i) => (
          <Pressable key={i} accessibilityRole="button"
            accessibilityLabel={`Ligne ${Math.floor(i / p.columns) + 1}, colonne ${(i % p.columns) + 1}${i === p.start ? ', départ' : i === p.end ? ', arrivée' : ''}${onPath.has(i) ? ', sur le fil' : ''}`}
            onPress={() => { tap(); onPlay(e.touch(p, st, i)); }}
            style={{ position: 'absolute', left: (i % p.columns) * cellW, top: Math.floor(i / p.columns) * cellW, width: cellW, height: cellW }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Miroirs
function Mirrors({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as MirrorsPuzzle, st = s.state as MirrorsState;
  const e = FAMILIES.MI.engine as MirrorsFamily;
  const cellW = Math.min(52, (width - 40) / (p.columns + 1));
  const pad = cellW * 0.6;
  const W = cellW * p.columns + pad * 2, H = cellW * p.rows + pad * 2;
  const tr = trace(p, st.marks);
  const focus = focusOf(s);
  const center = (i: number) => [pad + (i % p.columns + 0.5) * cellW, pad + (Math.floor(i / p.columns) + 0.5) * cellW];
  const [sx, sy] = center(p.source.cell);
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  const from = [sx - DC[p.source.dir] * cellW * 0.9, sy - DR[p.source.dir] * cellW * 0.9];
  const pts = [from, ...tr.cells.map(center)];
  if (tr.ends === 'out' && tr.cells.length) {
    // Extend the ray to the edge it leaves by.
    const last = tr.cells[tr.cells.length - 1];
    let d = p.source.dir;
    { let i = p.source.cell; for (const c of tr.cells) { i = c; const m = st.marks[i]; d = m === 1 ? [1, 0, 3, 2][d] : m === 2 ? [3, 2, 1, 0][d] : d; } }
    const [lx, ly] = center(last);
    pts.push([lx + DC[d] * cellW * 0.8, ly + DR[d] * cellW * 0.8]);
  }
  const used = st.marks.filter(Boolean).length;
  return (
    <View style={[box, { padding: 8, alignItems: 'center' }]}>
      <Text style={{ color: used > p.mirrors ? T.coral : T.tx2, fontSize: 13, marginBottom: 4 }}>Miroirs : {used} / {p.mirrors}</Text>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          {Array.from({ length: p.rows * p.columns }, (_, i) => {
            const [x, y] = center(i), ch = p.cells[i];
            const hi = hasCell(focus, Math.floor(i / p.columns), i % p.columns);
            return (
              <G key={i}>
                <Rect x={x - cellW / 2 + 1.5} y={y - cellW / 2 + 1.5} width={cellW - 3} height={cellW - 3} rx={6} fill={ch === '#' ? '#080914' : T.dark2} stroke={hi ? T.moon : 'none'} strokeWidth={2} />
                {ch === 'T' ? <Circle cx={x} cy={y} r={cellW * 0.22} fill={tr.hits.has(i) ? T.amber : '#141833'} stroke={tr.hits.has(i) ? '#FFE6B0' : '#5a62a8'} strokeWidth={2} /> : null}
              </G>
            );
          })}
          <Polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={T.amber} strokeWidth={3} strokeLinejoin="round" opacity={0.85} />
          {st.marks.map((m, i) => {
            if (!m) return null;
            const [x, y] = center(i), k = cellW * 0.34;
            return <Line key={i} x1={m === 1 ? x - k : x - k} y1={m === 1 ? y + k : y - k} x2={m === 1 ? x + k : x + k} y2={m === 1 ? y - k : y + k} stroke="#BFE6F0" strokeWidth={4} strokeLinecap="round" />;
          })}
          <Circle cx={from[0]} cy={from[1]} r={cellW * 0.22} fill={T.gold} />
        </Svg>
        {Array.from({ length: p.rows * p.columns }, (_, i) => (
          <Pressable key={i} disabled={p.cells[i] !== '.'} accessibilityRole="button"
            accessibilityLabel={`Ligne ${Math.floor(i / p.columns) + 1}, colonne ${(i % p.columns) + 1} : ${p.cells[i] === '#' ? 'obstacle' : p.cells[i] === 'T' ? (tr.hits.has(i) ? 'cible éclairée' : 'cible') : st.marks[i] === 1 ? 'miroir /' : st.marks[i] === 2 ? 'miroir \\' : 'vide'}`}
            onPress={() => { tap(); onPlay(e.touch(p, st, i)); }}
            style={{ position: 'absolute', left: pad + (i % p.columns) * cellW, top: pad + Math.floor(i / p.columns) * cellW, width: cellW, height: cellW }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Enquêtes
function Inquiries({ s, onPlay, tap }: BoardProps) {
  const p = s.data as InquiriesPuzzle, st = s.state as InquiriesState;
  const focus = focusOf(s);
  const cycle = (kind: 'object' | 'place', who: number) => {
    const cur = st[kind][who];
    const next = cur === null ? 0 : cur + 1 >= p.size ? null : cur + 1;
    const arr = st[kind].slice(); arr[who] = next;
    onPlay({ ...st, [kind]: arr }, false);
  };
  const strike = (i: number) => onPlay({ ...st, crossed: st.crossed.includes(i) ? st.crossed.filter((x) => x !== i) : [...st.crossed, i] }, false);
  return (
    <View style={{ gap: 10 }}>
      <View style={[box, { padding: 10, gap: 2 }]}>
        {p.clues.map((c, i) => {
          const crossed = st.crossed.includes(i), hi = hasCell(focus, i, 0);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Indice ${i + 1} : ${clueText(c, p)}${crossed ? ', barré' : ''}`} onPress={() => { tap(); strike(i); }}
              style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: hi ? (s.error ? T.coral : T.moon) : 'transparent' }}>
              <Text style={{ color: T.tx3, width: 20, fontWeight: '700' }}>{i + 1}.</Text>
              <Text style={{ flex: 1, color: crossed ? T.tx3 : T.tx, fontSize: 15, lineHeight: 20, textDecorationLine: crossed ? 'line-through' : 'none' }}>{clueText(c, p)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[box, { padding: 10, gap: 8 }]}>
        {p.people.map((who, i) => (
          <View key={i} style={{ gap: 6 }}>
            <Text style={{ color: T.tx, fontWeight: '700', fontSize: 15 }}>{cap(PEOPLE[who])}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['object', 'place'] as const).map((kind) => {
                const v = st[kind][i];
                const label = v === null ? (kind === 'object' ? 'Objet ?' : 'Lieu ?') : kind === 'object' ? cap(OBJECTS[p.objects[v]]) : cap(PLACES[p.places[v]]);
                return (
                  <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`${cap(PEOPLE[who])}, ${kind === 'object' ? 'objet' : 'lieu'} : ${v === null ? 'non choisi' : label}. Toucher pour changer.`}
                    onPress={() => { tap(); cycle(kind, i); }}
                    style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: v === null ? T.line : T.moon, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: v === null ? T.tx2 : T.tx, fontSize: 14 }}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Marqueterie
const PIECE_COLORS = ['#D8B56A', '#E7A98B', '#8FB8F0', '#7FC8A9', '#C39BD3', '#EE8A6B', '#F29BC4', '#BFE6F0', '#9CD37F', '#FFD98E', '#B8A0E0', '#E8744A'];

function PieceIcon({ shape, color, size }: { shape: [number, number][]; color: string; size: number }) {
  const h = Math.max(...shape.map((x) => x[0])) + 1, w = Math.max(...shape.map((x) => x[1])) + 1;
  const k = size / Math.max(h, w, 3);
  return (
    <Svg width={w * k} height={h * k}>
      {shape.map(([r, c], i) => <Rect key={i} x={c * k + 1} y={r * k + 1} width={k - 2} height={k - 2} rx={3} fill={color} />)}
    </Svg>
  );
}

function Marquetry({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as MarquetryPuzzle, st = s.state as MarquetryState;
  const e = FAMILIES.MA.engine as MarquetryFamily;
  const [sel, setSel] = useState<number | null>(null);
  const [rot, setRot] = useState(0);
  const R_ = p.mask.length, C = p.mask[0].length;
  const cellW = Math.min(46, (width - 28) / C);
  const { grid } = e.coverage(p, st);
  const choose = (i: number) => { tap(); setSel(i); setRot(st.placed[i]?.rot ?? 0); };
  const rotate = () => {
    if (sel === null) return;
    const all = orientations(p.pieces[sel], p.flips);
    const k = all.indexOf(rot);
    setRot(all[(k + 1) % all.length]);
  };
  const tapCell = (r: number, c: number) => {
    const owner = grid[r][c];
    if (owner >= 0) {
      // Pick the piece up again.
      onPlay({ placed: st.placed.map((x, k) => (k === owner ? null : x)) });
      setSel(owner); setRot(st.placed[owner]!.rot);
      return;
    }
    if (sel === null || owner !== -1) return;
    // Try each cell of the piece as the anchor: the first placement that fits wins.
    const shape = orientation(p.pieces[sel], rot);
    for (let a = 0; a < shape.length; a++) {
      const next = e.place(p, st, sel, rot, a, r, c);
      if (next) { onPlay(next); setSel(st.placed.findIndex((x, k) => !x && k !== sel) >= 0 ? st.placed.findIndex((x, k) => !x && k !== sel) : null); setRot(0); return; }
    }
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={[box, { padding: 12, alignItems: 'center' }]}>
        {Array.from({ length: R_ }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {Array.from({ length: C }, (_, c) => {
              const v = grid[r][c];
              if (v === -2) return <View key={c} style={{ width: cellW, height: cellW }} />;
              return (
                <Pressable key={c} accessibilityRole="button" accessibilityLabel={`Ligne ${r + 1}, colonne ${c + 1} : ${v >= 0 ? `pièce ${v + 1}` : 'vide'}`} onPress={() => { tap(); tapCell(r, c); }}
                  style={{ width: cellW, height: cellW, padding: 1.5 }}>
                  <View style={{ flex: 1, borderRadius: 6, backgroundColor: v >= 0 ? PIECE_COLORS[v % PIECE_COLORS.length] : T.dark2, borderWidth: v >= 0 ? 0 : 1, borderColor: T.line }} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {p.pieces.map((shape, i) => {
          const placed = !!st.placed[i];
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: sel === i }} accessibilityLabel={`Pièce ${i + 1}${placed ? ', posée' : ''}`} onPress={() => choose(i)}
              style={{ minWidth: 58, height: 58, padding: 6, borderRadius: 12, backgroundColor: T.s1, borderWidth: sel === i ? 2 : 1, borderColor: sel === i ? T.moon : T.line, alignItems: 'center', justifyContent: 'center', opacity: placed && sel !== i ? 0.35 : 1 }}>
              <PieceIcon shape={sel === i ? orientation(shape, rot) : shape} color={PIECE_COLORS[i % PIECE_COLORS.length]} size={40} />
            </Pressable>
          );
        })}
      </View>
      {sel !== null ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <Pressable accessibilityRole="button" onPress={() => { tap(); rotate(); }} style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="redo" size={18} color={T.tx} /><Text style={{ color: T.tx, fontWeight: '600' }}>Tourner{p.flips ? ' / retourner' : ''}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function Board2(props: BoardProps) {
  switch (props.s.code) {
    case 'MO': return <Patterns {...props} />;
    case 'ME': return <Liars {...props} />;
    case 'FI': return <Threads {...props} />;
    case 'MI': return <Mirrors {...props} />;
    case 'EQ': return <Inquiries {...props} />;
    case 'MA': return <Marquetry {...props} />;
    default: return null;
  }
}
