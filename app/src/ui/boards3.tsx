// Boards of Carillon, Vitraux, Différences, Étagère, Ombres and the Sceau.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, View } from 'react-native';
import { Text } from './Text';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { T, R, ROUND, SERIF_ITALIC } from './theme';
import { Icon } from './components';
import { glyphByKey } from './scenes/objects';
import { CellRef } from '../core/puzzlekit/types';
import { ChimesPuzzle, ChimesState, goodPrefix } from '../core/families/chimes';
import { StainedPuzzle, StainedState, shows } from '../core/families/stained';
import { SPOT_H, SPOT_W, SpotItem, SpotPuzzle, SpotState, changed, diffAt } from '../core/families/spot';
import { ShelfClue, ShelfPuzzle, ShelfState } from '../core/families/shelf';
import { Cells, ShadowsPuzzle, ShadowsState } from '../core/families/shadows';
import { SealPuzzle, SealState, sealCode } from '../core/families/seal';
import { SHELF_NAMES } from '../content/strings';
import { WORLD } from '../game/catalog';
import { roomName } from '../game/views';
import type { BoardProps } from './boards';
import { useStore } from '../game/store';

const box = { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l } as const;
const focusOf = (s: BoardProps['s']): CellRef[] => [...(s.hint.focus ?? []), ...(s.error?.focus ?? [])];
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** A glyph from the object drawings, stroked, in a box of `size`. */
function Glyph({ k, size, color, sw = 1.7, dash }: { k: string; size: number; color: string; sw?: number; dash?: string }) {
  const d = glyphByKey(k);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash}>
        {/* The drawings are small SVG fragments: parse the few element kinds they use. */}
        {parseFragment(d)}
      </G>
    </Svg>
  );
}

function parseFragment(d: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /<(path|circle|rect|ellipse)\s([^>]*)\/>/g;
  let m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(d))) {
    const attrs: Record<string, string> = {};
    m[2].replace(/([\w-]+)="([^"]*)"/g, (_, k: string, v: string) => { attrs[k.replace(/-([a-z])/g, (__, c: string) => c.toUpperCase())] = v; return ''; });
    const props: any = { key: i++, ...attrs };
    if (m[1] === 'path') out.push(<Path {...props} />);
    else if (m[1] === 'circle') out.push(<Circle {...props} />);
    else if (m[1] === 'rect') out.push(<Rect {...props} />);
    else out.push(<Circle key={props.key} cx={attrs.cx} cy={attrs.cy} r={attrs.rx} />);
  }
  return out;
}

// ---------------------------------------------------------------- Carillon
const BELL_COLORS = ['#E88A8A', '#F4B45E', '#FFD98E', '#9CCB8A', '#8FB8F0', '#B79CE0'];

function Bell({ i, size, lit, focus, onPress, swing }: { i: number; size: number; lit: boolean; focus: boolean; onPress: () => void; swing: Animated.Value }) {
  const c = BELL_COLORS[i % BELL_COLORS.length];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Cloche ${i + 1}`} onPress={onPress} hitSlop={4}
      style={{ width: size, height: size * 1.25, alignItems: 'center', justifyContent: 'flex-start' }}>
      <Animated.View style={{ transformOrigin: 'top', transform: [{ rotate: swing.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] }) }] }}>
        <Svg width={size} height={size * 1.15} viewBox="0 0 60 70">
          {lit ? <Circle cx="30" cy="36" r="30" fill={c} opacity={0.22} /> : null}
          <Path d="M30 2v8" stroke={T.tx3} strokeWidth={2} />
          <Path d="M8 52q2-36 22-40q20 4 22 40z" fill={lit ? c : '#262B52'} stroke={focus ? T.gold : c} strokeWidth={focus ? 3 : 2} />
          <Rect x="5" y="50" width="50" height="7" rx="3.5" fill={lit ? c : '#2E3360'} />
          <Circle cx="30" cy="62" r="5" fill={lit ? '#FFF3D6' : '#3a4180'} />
        </Svg>
      </Animated.View>
      <Text style={{ color: T.tx3, fontSize: 12, fontWeight: '700', marginTop: -4 }}>{i + 1}</Text>
    </Pressable>
  );
}

function Chimes({ s, width, onPlay, tap, note }: BoardProps) {
  const p = s.data as ChimesPuzzle, st = s.state as ChimesState;
  const [swings] = useState(() => [...Array(p.bells)].map(() => new Animated.Value(0)));
  const [lit, setLit] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const focus = focusOf(s);
  const size = Math.min(84, (width - 40) / p.bells - 8);
  const ring = (i: number) => {
    note?.(i);
    setLit(i);
    swings[i].setValue(0);
    Animated.sequence([
      Animated.timing(swings[i], { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(swings[i], { toValue: -0.6, duration: 180, useNativeDriver: true }),
      Animated.spring(swings[i], { toValue: 0, friction: 3, useNativeDriver: true }),
    ]).start();
    timers.current.push(setTimeout(() => setLit((x) => (x === i ? null : x)), 380));
  };
  const listen = () => {
    if (listening) return;
    setListening(true);
    p.melody.forEach((b, k) => timers.current.push(setTimeout(() => ring(b), 450 + k * 620)));
    timers.current.push(setTimeout(() => setListening(false), 450 + p.melody.length * 620));
  };
  // The melody plays once when the puzzle opens.
  useEffect(() => { const all = timers.current; if (!st.played.length) all.push(setTimeout(listen, 0)); return () => all.forEach(clearTimeout); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const k = goodPrefix(p, st.played);
  const wrong = k < st.played.length;
  const press = (i: number) => {
    if (listening) return;
    tap();
    ring(i);
    // After a wrong note, the next one starts the melody again.
    onPlay({ played: wrong ? [i] : [...st.played, i] });
  };
  return (
    <View style={[box, { padding: 16, gap: 18, alignItems: 'center' }]}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'flex-end' }}>
        {[...Array(p.bells)].map((_, i) => (
          <View key={i} style={{ marginBottom: Math.abs(i - (p.bells - 1) / 2) * -6 + 12 }}>
            <Bell i={i} size={size} lit={lit === i} focus={focus.some((f) => f.column === i)} onPress={() => press(i)} swing={swings[i]} />
          </View>
        ))}
      </View>
      {p.reverse ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: 'rgba(143,184,240,0.14)' }}>
          <Icon name="undo" size={14} color={T.moon} />
          <Text style={{ color: T.moon, fontSize: 13, fontWeight: '700' }}>À rebours : de la dernière note à la première</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }} accessible accessibilityLabel={`${k} note${k > 1 ? 's' : ''} sur ${p.melody.length}`}>
        {p.melody.map((_, i) => (
          <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i < k ? T.amber : wrong && i === k ? T.coral : 'transparent', borderWidth: 1.5, borderColor: i < k ? T.amber : wrong && i === k ? T.coral : T.tx3 }} />
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => { tap(); listen(); }} disabled={listening}
        style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 18, height: 44, borderRadius: 22, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, opacity: listening ? 0.5 : 1 }}>
        <Icon name="music" size={18} color={T.moon} />
        <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{listening ? 'Écoute…' : 'Réécouter la mélodie'}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------- Vitraux
export const GLASS: Record<number, string> = { 0: '#2a2f55', 1: '#E0625A', 2: '#F2C65A', 4: '#5C8FE0', 3: '#F0924A', 5: '#A070D0', 6: '#6DBE7A', 7: '#8a6a4a' };
const FILTER_NAME: Record<number, string> = { 0: 'aucun filtre', 1: 'rouge', 2: 'jaune', 4: 'bleu' };
const NEXT_FILTER: Record<number, number> = { 0: 1, 1: 2, 2: 4, 4: 0 };

/**
 * Colour-blind aid: each filter has its own mark, and a mix shows both.
 * Red = diagonal stripes, yellow = dots, blue = horizontal lines.
 */
export function GlassMarks({ bits, size, round = false }: { bits: number; size: number; round?: boolean }) {
  if (!bits) return null;
  const ink = 'rgba(13,15,30,0.55)', n = 4, step = size / n, sw = Math.max(1.2, size / 26);
  const marks: React.ReactNode[] = [];
  if (bits & 1) for (let i = -n; i <= n; i++) marks.push(<Path key={`r${i}`} d={`M${i * step} ${size}L${i * step + size} 0`} stroke={ink} strokeWidth={sw} />);
  if (bits & 4) for (let i = 1; i < n; i++) marks.push(<Path key={`b${i}`} d={`M0 ${i * step}H${size}`} stroke={ink} strokeWidth={sw} />);
  if (bits & 2) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) marks.push(<Circle key={`y${i}.${j}`} cx={(i + 0.5) * step} cy={(j + 0.5) * step} r={Math.max(1.1, size / 22)} fill={ink} />);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: round ? size / 2 : 0, overflow: 'hidden' }}>
      <Svg width={size} height={size}>{marks}</Svg>
    </View>
  );
}

function FilterButton({ f, given, focus, onPress, label, size, aid }: { f: number; given: boolean; focus: boolean; onPress: () => void; label: string; size: number; aid: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} : ${FILTER_NAME[f]}${given ? ', fixé' : '. Toucher pour changer.'}`} disabled={given} onPress={onPress}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: f ? GLASS[f] : 'transparent', borderWidth: focus ? 3 : 2, borderColor: focus ? T.gold : given ? '#8a8fa8' : T.line, alignItems: 'center', justifyContent: 'center', borderStyle: f ? 'solid' : 'dashed' }}>
      {aid ? <GlassMarks bits={f} size={size - 4} round /> : null}
      {given ? <Icon name="lock" size={size * 0.4} color={f ? '#0D0F1E' : T.tx3} /> : null}
    </Pressable>
  );
}

function Stained({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as StainedPuzzle, st = s.state as StainedState;
  const aid = useStore().settings.colorAid;
  const focus = focusOf(s);
  const sel = Math.min(40, (width - 40) / (p.cols + 1.4));
  const pane = Math.min(74, (width - 40 - sel - 12) / p.cols - 6);
  const set = (kind: 'r' | 'c', i: number) => {
    tap();
    const next = { rowF: st.rowF.slice(), colF: st.colF.slice() };
    if (kind === 'r') next.rowF[i] = NEXT_FILTER[next.rowF[i]]; else next.colF[i] = NEXT_FILTER[next.colF[i]];
    onPlay(next);
  };
  return (
    <View style={[box, { padding: 14, alignItems: 'center' }]}>
      <View style={{ flexDirection: 'row', gap: 6, marginLeft: sel + 12, marginBottom: 8 }}>
        {st.colF.map((f, c) => (
          <View key={c} style={{ width: pane, alignItems: 'center' }}>
            <FilterButton f={f} size={sel} given={p.givenCols[c] !== null} focus={focus.some((x) => x.row === -1 && x.column === c)} onPress={() => set('c', c)} label={`Colonne ${c + 1}`} aid={aid} />
          </View>
        ))}
      </View>
      {st.rowF.map((rf, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <View style={{ width: sel, marginRight: 6 }}>
            <FilterButton f={rf} size={sel} given={p.givenRows[r] !== null} focus={focus.some((x) => x.row === r && x.column === -1)} onPress={() => set('r', r)} label={`Ligne ${r + 1}`} aid={aid} />
          </View>
          {st.colF.map((cf, c) => {
            const now = rf | cf, want = p.target[r * p.cols + c], ok = now === want, bad = focus.some((x) => x.row === r && x.column === c);
            if (!shows(p, r * p.cols + c)) return (
              // A frosted pane: the light passes, the model does not show.
              <View key={c} accessible accessibilityLabel={`Vitre ligne ${r + 1}, colonne ${c + 1} : voilée, maintenant ${colorWord(now)}`}
                style={{ width: pane, height: pane * 1.15, borderRadius: 10, overflow: 'hidden', backgroundColor: '#0a0c1e', borderWidth: 2, borderColor: '#3a3f6a', borderStyle: 'dashed' }}>
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: GLASS[now], opacity: now ? 0.5 : 0.25 }} />
                {aid ? <GlassMarks bits={now} size={pane * 1.15} /> : null}
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(220,226,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: pane * 0.34, fontWeight: '800' }}>?</Text>
                </View>
              </View>
            );
            return (
              <View key={c} accessible accessibilityLabel={`Vitre ligne ${r + 1}, colonne ${c + 1} : modèle ${colorWord(want)}, maintenant ${colorWord(now)}`}
                style={{ width: pane, height: pane * 1.15, borderRadius: 10, overflow: 'hidden', backgroundColor: '#0a0c1e', borderWidth: 2, borderColor: bad ? T.coral : ok ? '#c9a563' : '#3a3f6a' }}>
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: GLASS[now], opacity: now ? 0.92 : 0.35 }} />
                {aid ? <GlassMarks bits={now} size={pane * 1.15} /> : null}
                {/* The window as it was: its colour, in the middle. */}
                <View style={{ position: 'absolute', left: pane / 2 - pane * 0.19, top: pane * 0.575 - pane * 0.19, width: pane * 0.38, height: pane * 0.38, borderRadius: pane, backgroundColor: GLASS[want], borderWidth: 2, borderColor: ok ? '#FFE6B0' : '#0D0F1E', alignItems: 'center', justifyContent: 'center' }}>
                  {aid ? <GlassMarks bits={want} size={pane * 0.38 - 4} round /> : null}
                  {ok ? <Icon name="check" size={pane * 0.22} color="#0D0F1E" sw={2.4} /> : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        {(aid ? [[1, 'rouge'], [2, 'jaune'], [4, 'bleu'], [3, 'rouge + jaune'], [6, 'jaune + bleu'], [5, 'rouge + bleu']] : [[3, 'rouge + jaune'], [6, 'jaune + bleu'], [5, 'rouge + bleu']]).map(([c, l]) => {
          const d = aid ? 20 : 12;
          return (
            <View key={c as number} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: GLASS[c as number], overflow: 'hidden' }}>{aid ? <GlassMarks bits={c as number} size={d} round /> : null}</View>
              <Text style={{ color: T.tx2, fontSize: 12 }}>{l as string}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const colorWord = (c: number) => ({ 0: 'clair', 1: 'rouge', 2: 'jaune', 4: 'bleu', 3: 'orange', 5: 'violet', 6: 'vert', 7: 'brun' } as Record<number, string>)[c];

// ---------------------------------------------------------------- Différences
const SPOT_KEYS = ['key', 'feather', 'hourglass', 'bell', 'moon', 'orange', 'drop', 'fish', 'lantern', 'crown', 'mask', 'candle', 'compass', 'book', 'shell', 'flower'];
// Okabe–Ito colours, lightened for the night: told apart by most colour-blind players.
const SPOT_PAL = ['#F0E442', '#E0622A', '#56B4E9', '#2BB08A', '#D98CBF', '#E69F00'];
/** Colour-blind aid: each colour also has its own stroke. */
const SPOT_DASH = [undefined, '3 1.6', '0.2 1.8', '5 1.4 1 1.4', '1.6 1.6', '6 2.4'];

function SpotPicture({ items, w, found, p, hintAt, onTap, label, aid }: { items: (SpotItem | null)[]; w: number; found: number[]; p: SpotPuzzle; hintAt: CellRef | null; onTap: (x: number, y: number) => void; label: string; aid: boolean }) {
  const k = w / SPOT_W, h = SPOT_H * k;
  const tapHere = (e: GestureResponderEvent) => onTap(e.nativeEvent.locationX / k, e.nativeEvent.locationY / k);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={tapHere} style={{ width: w, height: h, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1d2140', borderWidth: 1, borderColor: T.line }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: h * 0.52, height: 2, backgroundColor: '#2a2f55' }} />
      {items.map((it, i) => it ? (
        <View key={i} pointerEvents="none" style={{ position: 'absolute', left: (it.x - 5 * it.s) * k, top: (it.y - 5 * it.s) * k, width: 10 * it.s * k, height: 10 * it.s * k, transform: [{ rotate: `${it.r}deg` }] }}>
          <Glyph k={SPOT_KEYS[it.g]} size={10 * it.s * k} color={SPOT_PAL[it.c]} dash={aid ? SPOT_DASH[it.c] : undefined} sw={aid ? 2 : 1.7} />
        </View>
      ) : null)}
      {found.map((d) => { const it = p.items[p.diffs[d].i]; return <View key={`f${d}`} pointerEvents="none" style={{ position: 'absolute', left: (it.x - 8) * k, top: (it.y - 8) * k, width: 16 * k, height: 16 * k, borderRadius: 8 * k, borderWidth: 2.5, borderColor: T.gold }} />; })}
      {hintAt ? <View pointerEvents="none" style={{ position: 'absolute', left: (hintAt.column - 12) * k, top: (hintAt.row - 12) * k, width: 24 * k, height: 24 * k, borderRadius: 12 * k, borderWidth: 2, borderStyle: 'dashed', borderColor: T.moon }} /> : null}
    </Pressable>
  );
}

function Spot({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as SpotPuzzle, st = s.state as SpotState;
  const aid = useStore().settings.colorAid;
  const after = useMemo(() => changed(p), [p]);
  // Both pictures on screen at once, whatever the phone: the height decides.
  const w = Math.min(width - 28, 196 / (SPOT_H / SPOT_W));
  const hint = s.hint.focus?.[0] && !s.hint.stale ? s.hint.focus[0] : null;
  const [miss, setMiss] = useState(0);
  const onTap = (x: number, y: number) => {
    const d = diffAt(p, x, y);
    if (d >= 0 && !st.found.includes(d)) { tap(); onPlay({ ...st, found: [...st.found, d] }); return; }
    if (d < 0) { setMiss((m) => m + 1); onPlay({ ...st, misses: st.misses + 1 }, false); }
  };
  return (
    <View style={[box, { padding: 14, gap: 8, alignItems: 'center' }]}>
      <Text style={{ color: T.tx2, fontSize: 12, letterSpacing: 1.2, fontWeight: '600', alignSelf: 'flex-start' }}>AVANT</Text>
      <SpotPicture items={p.items} w={w} found={st.found} p={p} hintAt={hint} onTap={onTap} label="Première image. Toucher une différence." aid={aid} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch' }}>
        <Text style={{ color: T.tx2, fontSize: 12, letterSpacing: 1.2, fontWeight: '600' }}>MAINTENANT</Text>
        <Text style={{ color: T.gold, fontSize: 14, fontWeight: '700' }} accessibilityLiveRegion="polite">{st.found.length} / {p.diffs.length}{miss ? '' : ''}</Text>
      </View>
      <SpotPicture items={after} w={w} found={st.found} p={p} hintAt={hint} onTap={onTap} label="Seconde image. Toucher une différence." aid={aid} />
    </View>
  );
}

// ---------------------------------------------------------------- Étagère
const SHELF_ART = ['hourglass', 'teapot', 'book', 'candle', 'key', 'shell', 'loupe', 'vase', 'compass', 'feather'];
const SHELF_COLORS = ['#FFD98E', '#E7A98B', '#8FB8F0', '#FFE6B0', '#D8B56A', '#F0C8B0', '#BFE6F0', '#9CCB8A', '#E8C07A', '#B79CE0'];

export function shelfClueText(c: ShelfClue, p: ShelfPuzzle): string {
  const n = (i: number) => SHELF_NAMES[p.items[i]];
  switch (c.k) {
    case 'left': return `${cap(n(c.a))} est quelque part à gauche de ${n(c.b)}.`;
    case 'next': return `${cap(n(c.a))} est juste à côté de ${n(c.b)}.`;
    case 'notNext': return `${cap(n(c.a))} n’est pas à côté de ${n(c.b)}.`;
    case 'end': return `${cap(n(c.a))} est à un bout de l’étagère.`;
    case 'pos': return `${cap(n(c.a))} est à la place n° ${c.p + 1}, en partant de la gauche.`;
    case 'notPos': return `${cap(n(c.a))} n’est pas à la place n° ${c.p + 1}.`;
    case 'between': return `${cap(n(c.a))} est entre ${n(c.b)} et ${n(c.c)}.`;
  }
}

function Shelf({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as ShelfPuzzle, st = s.state as ShelfState;
  const [picked, setPicked] = useState<number | null>(null);
  const [struck, setStruck] = useState<number[]>([]);
  const focus = focusOf(s);
  const n = p.items.length, slot = Math.min(64, (width - 28 - (n - 1) * 6) / n);
  const choose = (i: number) => {
    tap();
    if (picked === null) { setPicked(i); return; }
    if (picked !== i) { const order = st.order.slice(); [order[picked], order[i]] = [order[i], order[picked]]; onPlay({ order }); }
    setPicked(null);
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={[box, { padding: 12, gap: 2 }]}>
        {p.clues.map((c, i) => {
          const bad = focus.some((f) => f.row === i && f.column === -1), off = struck.includes(i);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Indice ${i + 1} : ${shelfClueText(c, p)}${off ? ', barré' : ''}`} onPress={() => { tap(); setStruck((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i])); }}
              style={{ flexDirection: 'row', gap: 10, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: bad ? (s.error ? T.coral : T.moon) : 'transparent' }}>
              <Text style={{ color: T.tx3, fontWeight: '700', width: 18 }}>{i + 1}.</Text>
              <Text style={{ color: off ? T.tx3 : T.tx, fontSize: 15, flex: 1, textDecorationLine: off ? 'line-through' : 'none' }}>{shelfClueText(c, p)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[box, { paddingVertical: 14, paddingHorizontal: 14 }]}>
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {st.order.map((item, i) => {
            const sel = picked === i, hint = focus.some((f) => f.row === -1 && f.column === i);
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={`Place ${i + 1} : ${SHELF_NAMES[p.items[item]]}${sel ? ', choisi' : ''}`} onPress={() => choose(i)}
                style={{ width: slot, alignItems: 'center', gap: 4 }}>
                <View style={{ width: slot, height: slot * 1.1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? 'rgba(143,211,224,0.12)' : 'transparent', borderWidth: sel || hint ? 2 : 0, borderColor: hint ? T.gold : T.moon, transform: [{ translateY: sel ? -6 : 0 }] }}>
                  <Glyph k={SHELF_ART[p.items[item]]} size={slot * 0.72} color={SHELF_COLORS[p.items[item]]} sw={1.5} />
                </View>
                <Text style={{ color: T.tx2, fontSize: 10.5, textAlign: 'center' }} numberOfLines={2}>{SHELF_NAMES[p.items[item]].replace(/^(le |la |l’)/, '')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 8, borderRadius: 3, backgroundColor: '#6d5230', marginTop: 4 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          {st.order.map((_, i) => <Text key={i} style={{ width: slot, textAlign: 'center', color: T.tx3, fontSize: 11 }}>{i + 1}</Text>)}
        </View>
      </View>
      <Text style={{ color: T.tx3, fontSize: 13, textAlign: 'center' }}>Touche deux objets pour les échanger. Touche un indice pour le barrer.</Text>
    </View>
  );
}

// ---------------------------------------------------------------- Ombres
function CellsArt({ cells, size, color, shadow }: { cells: Cells; size: number; color: string; shadow?: boolean }) {
  const rows = Math.max(...cells.map((c) => c[0])) + 1, cols = Math.max(...cells.map((c) => c[1])) + 1;
  const u = size / Math.max(rows, cols, 3);
  const ox = (size - cols * u) / 2, oy = (size - rows * u) / 2;
  return (
    <Svg width={size} height={size}>
      {cells.map(([r, c], i) => <Rect key={i} x={ox + c * u + (shadow ? 0 : 1)} y={oy + r * u + (shadow ? 0 : 1)} width={u - (shadow ? 0 : 2)} height={u - (shadow ? 0 : 2)} rx={shadow ? 1 : 3} fill={color} />)}
    </Svg>
  );
}

function Shadows({ s, width, onPlay, tap }: BoardProps) {
  const p = s.data as ShadowsPuzzle, st = s.state as ShadowsState;
  const cols = p.options.length > 4 ? 3 : 2;
  const cell = (width - 28 - (cols - 1) * 10) / cols;
  return (
    <View style={{ gap: 12 }}>
      <View style={[box, { padding: 14, alignItems: 'center', flexDirection: 'row', gap: 14 }]}>
        <View style={{ width: 110, height: 110, borderRadius: 16, backgroundColor: '#1d2140', alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`L’objet : ${p.shape.length} carrés`}>
          <CellsArt cells={p.shape} size={92} color={T.amber} />
        </View>
        <Text style={{ color: T.tx2, fontSize: 14, flex: 1, lineHeight: 20 }}>{p.reflection ? 'Voici l’objet. Dans le miroir, il est retourné, et il peut avoir tourné. Quel reflet est le sien ?' : 'Voici l’objet. Sous la lampe, son ombre peut avoir tourné. Laquelle est la sienne ?'}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {p.options.map((o, i) => {
          const sel = st.selected === i, out = st.ruledOut.includes(i);
          return (
            <Pressable key={i} disabled={out} accessibilityRole="button" accessibilityState={{ selected: sel, disabled: out }} accessibilityLabel={`${p.reflection ? 'Reflet' : 'Ombre'} ${i + 1}${out ? ', écarté' + (p.reflection ? '' : 'e') : ''}`}
              onPress={() => { tap(); onPlay({ ...st, selected: i }); }}
              style={{ width: cell, height: cell * 0.8, borderRadius: 16, backgroundColor: p.reflection ? '#9FB6D6' : '#E8DCC0', opacity: out ? 0.3 : 1, alignItems: 'center', justifyContent: 'center', borderWidth: sel ? 3 : 0, borderColor: T.moon }}>
              <CellsArt cells={o} size={cell * 0.62} color={p.reflection ? '#F6E7C4' : '#1a1630'} shadow={!p.reflection} />
              {out ? <View style={{ position: 'absolute', right: 8, top: 8 }}><Icon name="x" size={18} color="#1a1630" sw={2} /></View> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Sceau
const RULE_TEXT: Record<SealPuzzle['rule'], string> = {
  up: 'Le code : les chiffres des salles, de la Salle 1 à la dernière.',
  down: 'Le code : les chiffres des salles, de la dernière à la Salle 1.',
  sum: 'Le code : la somme de tous les chiffres des salles, en deux chiffres.',
  pairs: 'Le code : Salle 1 + Salle 2, puis Salle 3 + Salle 4. Pour chaque somme, garde le dernier chiffre.',
};
export const sealRuleText = (p: SealPuzzle) => RULE_TEXT[p.rule];

function Seal({ s, width, onPlay, tap, visitRoom }: BoardProps) {
  const p = s.data as SealPuzzle, st = s.state as SealState;
  const code = sealCode(p);
  const wheelW = Math.min(64, (width - 14 * (code.length - 1)) / code.length);
  const turn = (i: number, d: number) => { tap(); const wheels = st.wheels.slice(); wheels[i] = (wheels[i] + d + 10) % 10; onPlay({ wheels }); };
  const place = (roomId: string) => {
    for (const d of WORLD.districts) for (const [bi, b] of d.buildings.entries()) { const ri = b.rooms.findIndex((r) => r.id === roomId); if (ri >= 0) return { d, bi, ri }; }
    return null;
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={[box, { padding: 10, gap: 2 }]}>
        {p.rooms.map((id, i) => {
          const at = place(id);
          return (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 6 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,217,142,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: SERIF_ITALIC, fontSize: 18, color: T.gold }}>?</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>Salle {i + 1}</Text>
                <Text style={{ color: T.tx2, fontSize: 13 }}>{at ? roomName(at.d, at.bi, at.ri) : ''} · un chiffre peint dans le décor</Text>
              </View>
              {visitRoom ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Aller voir la Salle ${i + 1}`} onPress={() => { tap(); visitRoom(id); }}
                  style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, justifyContent: 'center' }}>
                  <Text style={{ color: T.moon, fontSize: 14, fontWeight: '600' }}>Aller voir</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }} accessibilityLabel="Molettes du sceau">
        {st.wheels.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Chiffre ${i + 1} : augmenter`} onPress={() => turn(i, 1)} style={{ width: wheelW, height: 36, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}><Icon name="up" size={18} color={T.tx2} sw={2} /></Pressable>
            <View accessible accessibilityLabel={`Chiffre ${i + 1} : ${d}`} style={{ width: wheelW, height: 56, borderRadius: 14, backgroundColor: '#0f1226', borderWidth: 1.5, borderColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: ROUND, fontWeight: '800', fontSize: 30, color: T.tx }}>{d}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Chiffre ${i + 1} : diminuer`} onPress={() => turn(i, -1)} style={{ width: wheelW, height: 36, borderRadius: 12, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}><Icon name="down" size={18} color={T.tx2} sw={2} /></Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Board3(props: BoardProps) {
  switch (props.s.code) {
    case 'CR': return <Chimes {...props} />;
    case 'VI': return <Stained {...props} />;
    case 'DI': return <Spot {...props} />;
    case 'ET': return <Shelf {...props} />;
    case 'OM': return <Shadows {...props} />;
    case 'SC': return <Seal {...props} />;
    default: return null;
  }
}
