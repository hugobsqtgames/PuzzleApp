// Boards of the six prototype families. Sizes are the prototype's iPhone
// sizes, scaled down on narrow screens (`u` ≤ 1).

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { T, R, ROUND, MONO } from './theme';
import { Icon, tap } from './components';
import { balanceXml, lampXml, squareXml, tileXml } from './art';
import { GEARS, LAMPS, LOCK, SEQUENCE, gearsState, lampsState } from '../content/prototypePuzzles';
import { Puzzle, fmtPegs } from '../state/session';

export interface BoardActions {
  rotate: (r: number, c: number) => void;
  press: (r: number, c: number) => void;
  lamp: (r: number, c: number) => void;
  wheel: (i: number, d: 1 | -1) => void;
  option: (v: number) => void;
  key: (k: string) => void;
}

const boardBox = { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 14 } as const;

function Gears({ p, u, a }: { p: Puzzle; u: number; a: BoardActions }) {
  const st = gearsState(p.rot), sz = 74 * u;
  return (
    <View style={[boardBox, { alignItems: 'center' }]}>
      {p.rot.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 6 * u, marginBottom: r < 3 ? 6 * u : 0 }}>
          {row.map((m, c) => {
            const lit = st.lit.has(r * 4 + c), src = r === GEARS.source[0] && c === GEARS.source[1];
            const bits = [0, 1, 2, 3].filter((b) => (m >> b) & 1).length;
            const kind = src ? 'source' : bits === 1 ? 'lanterne' : 'conduit';
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`Ligne ${r + 1}, colonne ${c + 1} : ${kind}, ${lit ? 'éclairé' : 'dans le noir'}. Toucher pour tourner.`}
                accessibilityActions={[{ name: 'activate', label: 'Tourner à droite' }, { name: 'longpress', label: 'Tourner à gauche' }]}
                onPress={() => { tap(); a.rotate(r, c); }}
                onLongPress={() => { tap(); a.rotate(r, c); a.rotate(r, c); a.rotate(r, c); }}
                style={{ width: sz, height: sz, borderRadius: 12, backgroundColor: lit ? '#262036' : '#1B1F3A', overflow: 'hidden' }}
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

function Switches({ p, u, a }: { p: Puzzle; u: number; a: BoardActions }) {
  const n = p.b.length, sz = (p.kind === 'TUTO' ? 120 : 92) * u, gap = 12 * u;
  return (
    <View style={[boardBox, { alignItems: 'center', padding: 20 * u }]}>
      {p.b.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap, marginBottom: r < n - 1 ? gap : 0 }}>
          {row.map((on, c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Ligne ${r + 1}, colonne ${c + 1} : ${on ? 'allumée' : 'éteinte'}`}
              onPress={() => { tap(); a.press(r, c); }}
              style={{
                width: sz, height: sz, borderRadius: sz / 2, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? T.amber : '#141833', borderWidth: on ? 0 : 2, borderColor: '#3a4180',
                shadowColor: T.amber, shadowOpacity: on ? 0.55 : 0, shadowRadius: 13,
              }}
            >
              {on
                ? <View style={{ width: sz * 0.34, height: sz * 0.34, borderRadius: sz, backgroundColor: '#FFF3D6' }} />
                : <Icon name="light" size={sz * 0.34} color="#3a4180" />}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function Lamps({ p, u, a }: { p: Puzzle; u: number; a: BoardActions }) {
  const st = lampsState(p.c), sz = 51 * u;
  return (
    <View style={[boardBox, { alignItems: 'center', padding: 12 }]}>
      {LAMPS.grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 4, marginBottom: r < 5 ? 4 : 0 }}>
          {[...row].map((ch, c) => {
            const k = r * 6 + c;
            if (ch !== '.') {
              const w = st.walls.get(k);
              const col = !w ? T.tx3 : w.have > w.need ? T.coral : w.have === w.need ? T.amber : T.tx;
              return (
                <View key={c} accessible accessibilityLabel={`Mur${w ? ` ${w.need}, touche ${w.have} lampe${w.have > 1 ? 's' : ''}` : ''}`}
                  style={{ width: sz, height: sz, borderRadius: 8, backgroundColor: '#080914', alignItems: 'center', justifyContent: 'center', borderWidth: w && w.have > w.need ? 2 : 0, borderColor: T.coral }}>
                  {w ? <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: sz * 0.44, color: col }}>{w.need}</Text> : null}
                </View>
              );
            }
            const v = p.c[r][c], lit = st.lit.has(k), conf = st.conflicts.has(k);
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`Ligne ${r + 1}, colonne ${c + 1} : ${v === 1 ? `lampe${conf ? ', en conflit' : ''}` : v === 2 ? 'marquée vide' : lit ? 'éclairée' : 'sombre'}`}
                onPress={() => { tap(); a.lamp(r, c); }}
                style={{ width: sz, height: sz, borderRadius: 8, backgroundColor: lit ? '#3a3040' : '#1B1F3A', alignItems: 'center', justifyContent: 'center', borderWidth: conf ? 2 : 0, borderColor: T.coral }}
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

function Peg({ kind }: { kind: 'full' | 'hollow' | 'none' }) {
  return (
    <View style={{
      width: 14, height: 14, borderRadius: 7,
      backgroundColor: kind === 'full' ? T.amber : 'transparent',
      borderWidth: kind === 'full' ? 0 : 2, borderColor: kind === 'none' ? '#4a5190' : T.amber,
      borderStyle: kind === 'none' ? 'dashed' : 'solid',
    }} />
  );
}

function Lock({ p, a }: { p: Puzzle; a: BoardActions }) {
  return (
    <View>
      <View style={[boardBox, { padding: 10, gap: 2 }]}>
        {LOCK.clues.map(([g, wp, mp], i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: p.badClue === i ? T.coral : 'transparent', backgroundColor: p.badClue === i ? 'rgba(232,138,138,0.08)' : 'transparent' }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {g.split('').map((d, j) => (
                <View key={j} style={{ width: 32, height: 34, borderRadius: 8, backgroundColor: T.s2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: ROUND, fontWeight: '700', fontSize: 20, color: T.tx }}>{d}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 5 }} accessible accessibilityLabel={fmtPegs(wp, mp)}>
              {Array.from({ length: wp }, (_, j) => <Peg key={`f${j}`} kind="full" />)}
              {Array.from({ length: mp }, (_, j) => <Peg key={`h${j}`} kind="hollow" />)}
              {!wp && !mp ? <Peg kind="none" /> : null}
            </View>
            <Text style={{ fontSize: 13, color: T.tx2, flex: 1, lineHeight: 16 }}>{fmtPegs(wp, mp)}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 10, paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Peg kind="full" /><Text style={{ fontSize: 13, color: T.tx2 }}>bien placé</Text></View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Peg kind="hollow" /><Text style={{ fontSize: 13, color: T.tx2 }}>mal placé</Text></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 10 }} accessibilityLabel="Molettes du cadenas">
        {p.w.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Chiffre ${i + 1} : augmenter`} onPress={() => { tap(); a.wheel(i, 1); }}
              style={{ width: 64, height: 32, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="up" size={18} color={T.tx2} sw={2} />
            </Pressable>
            <View accessible accessibilityLabel={`Chiffre ${i + 1} : ${d}`} style={{ width: 64, height: 52, borderRadius: 14, backgroundColor: '#0f1226', borderWidth: 1.5, borderColor: T.moon, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: MONO, fontSize: 40, fontWeight: '600', color: T.tx }}>{d}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Chiffre ${i + 1} : diminuer`} onPress={() => { tap(); a.wheel(i, -1); }}
              style={{ width: 64, height: 32, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="down" size={18} color={T.tx2} sw={2} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function Sequence({ p, u, a }: { p: Puzzle; u: number; a: BoardActions }) {
  const cell = { minWidth: 52 * u, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 } as const;
  return (
    <View>
      <View style={[boardBox, { padding: 16, flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }]}>
        {SEQUENCE.sequence.map((n, i) => (
          <View key={i} style={[cell, { backgroundColor: T.s2 }]}>
            <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: 22 * u, color: T.tx }}>{n}</Text>
          </View>
        ))}
        <View style={[cell, { borderWidth: 2, borderStyle: 'dashed', borderColor: T.moon }]}>
          <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: 22 * u, color: T.moon }}>{p.sel ?? '?'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {SEQUENCE.options.map((o) => {
          const wrong = p.wrong.includes(o), selected = p.sel === o;
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: wrong }}
              accessibilityLabel={wrong ? `${o}, écarté` : String(o)}
              disabled={wrong}
              onPress={() => { tap(); a.option(o); }}
              style={{ width: '48%', flexGrow: 1, height: 64, borderRadius: R.m, backgroundColor: T.s2, borderWidth: selected ? 2 : 1, borderColor: wrong ? T.coral : selected ? T.moon : T.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: ROUND, fontSize: 26, fontWeight: '700', color: wrong ? T.coral : T.tx, textDecorationLine: wrong ? 'line-through' : 'none' }}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Scales({ p, width, a }: { p: Puzzle; width: number; a: BoardActions }) {
  const bw = width - 24 - 2, bh = bw * (80 / 300);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'];
  return (
    <View>
      <View style={[boardBox, { paddingVertical: 8, paddingHorizontal: 12 }]}>
        <View accessible accessibilityLabel="Balance 1 : deux cercles pèsent autant qu’un triangle."><SvgXml xml={balanceXml(['circ', 'circ'], ['tri'])} width={bw} height={bh} /></View>
        <View accessible accessibilityLabel="Balance 2 : un triangle et un cercle pèsent 12."><SvgXml xml={balanceXml(['tri', 'circ'], ['w12'])} width={bw} height={bh} /></View>
        <View accessible accessibilityLabel="Balance 3 : un carré pèse autant que deux triangles."><SvgXml xml={balanceXml(['sq'], ['tri', 'tri'])} width={bw} height={bh} /></View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <SvgXml xml={squareXml} width={30} height={30} />
        <Text style={{ fontSize: 22, color: T.tx }}>=</Text>
        <View accessible accessibilityLabel={`Réponse : ${p.val || 'vide'}`} style={{ minWidth: 96, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: T.moon, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: 28, color: T.tx }}>{p.val || '?'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {keys.map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'Effacer' : k === 'C' ? 'Tout effacer' : k}
            onPress={() => { tap(); a.key(k); }}
            style={{ width: (width - 30) / 6, height: 52, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: ROUND, fontSize: 22, fontWeight: '700', color: T.tx }}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Board({ p, width, a }: { p: Puzzle; width: number; a: BoardActions }) {
  switch (p.kind) {
    case 'EN': return <Gears p={p} a={a} u={Math.min(1, (width - 30) / (4 * 74 + 18))} />;
    case 'IN': case 'TUTO': return <Switches p={p} a={a} u={Math.min(1, (width - 42) / (3 * 92 + 24))} />;
    case 'LA': return <Lamps p={p} a={a} u={Math.min(1, (width - 46) / (6 * 51))} />;
    case 'CA': return <Lock p={p} a={a} />;
    case 'SU': return <Sequence p={p} a={a} u={Math.min(1, (width - 32) / 358)} />;
    case 'BA': return <Scales p={p} a={a} width={width} />;
  }
}
