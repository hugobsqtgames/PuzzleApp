// A room, full bleed: its scene, its lanterns on their objects, the light
// that warms it lantern after lantern, a little dust in the air, and the
// search for the hidden object once everything is lit.
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { roomLanternXml } from './art';
import { HIT_H as HIT_HEIGHT, HIT_W as HIT_WIDTH, SCENE_H, SCENE_W, Slot, hideOf, placeOnScreen, roomSlotsOf, sceneFit, sceneXml } from './scenes';
import { T } from './theme';
import { useReducedMotion, useAnimatedValue } from './motion';
import { tr } from '../i18n';

export { sceneFit };

/** Scale and offset that show the scene as large as possible without cutting a lantern. */
function PulseRing({ size, color = T.amber }: { size: number; color?: string }) {
  const v = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }} />;
}

/** Floating motes of light: calm, slow, never in the way (none with Reduce Motion). */
const Motes = memo(function Motes({ w, h, color, n, strength }: { w: number; h: number; color: string; n: number; strength: number }) {
  const motes = useMemo(() => [...Array(n)].map((_, i) => ({
    x: ((i * 97) % 100) / 100 * w, y: (0.2 + ((i * 53) % 70) / 100) * h, r: 1.5 + (i % 3), d: 5200 + (i % 5) * 1300, delay: i * 700, v: new Animated.Value(0),
  })), [n, w, h]);
  useEffect(() => {
    const loops = motes.map((m) => Animated.loop(Animated.sequence([
      Animated.delay(m.delay % 3000),
      Animated.timing(m.v, { toValue: 1, duration: m.d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(m.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [motes]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
      {motes.map((m, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: m.x, top: m.y, width: m.r * 2, height: m.r * 2, borderRadius: m.r, backgroundColor: color,
          opacity: m.v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.55 * strength, 0.4 * strength, 0] }),
          transform: [{ translateY: m.v.interpolate({ inputRange: [0, 1], outputRange: [0, -60 - (i % 4) * 20] }) }, { translateX: m.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (i % 2 ? 12 : -12), 0] }) }],
        }} />
      ))}
    </View>
  );
});

/** The warm halo of a lit lantern: it breathes like a flame, each at its own pace. */
function Halo({ size, index }: { size: number; index: number }) {
  const v = useAnimatedValue(0);
  useEffect(() => {
    const ms = 1700 + ((index * 337) % 900);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: ms * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, index]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.8] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }] }}>
      <SvgXml xml={HALO} width={size} height={size} />
    </Animated.View>
  );
}
const HALO = `<svg viewBox="0 0 100 100"><defs><radialGradient id="lampHalo"><stop offset="0" stop-color="#FFD98E" stop-opacity=".55"/><stop offset=".45" stop-color="#F4B45E" stop-opacity=".18"/><stop offset="1" stop-color="#F4B45E" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#lampHalo)"/></svg>`;

/** A lantern on its object. Pops and sends a wave of light the moment it is lit. */
function Lantern({ index, slot, lit, isKey, recommended, justLit, k, hw, hh, disabled, label, onPress, reduce }: {
  index: number; slot: Slot; lit: boolean; isKey?: boolean; recommended: boolean; justLit: boolean; k: number; hw: number; hh: number; disabled: boolean; label: string; onPress: () => void; reduce: boolean;
}) {
  const HIT_W = hw, HIT_H = hh;
  const L = Math.max(52, 60 * k);
  const pop = useAnimatedValue(justLit && !reduce ? 0 : 1);
  const wave = useAnimatedValue(0);
  const press = useAnimatedValue(1);
  useEffect(() => {
    if (!justLit || reduce) return;
    Animated.sequence([Animated.delay(350), Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.timing(wave, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ])]).start();
  }, [justLit, reduce, pop, wave]);
  const xml = useMemo(() => roomLanternXml(index, lit, isKey), [index, lit, isKey]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      onPressIn={() => Animated.spring(press, { toValue: 0.88, friction: 6, tension: 300, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start()}
      // The touch area hugs the lantern (46 × 50 pt): two neighbours never steal each other's taps.
      style={{ position: 'absolute', left: slot.x - HIT_W / 2, top: slot.y - HIT_H / 2 - 4, width: HIT_W, height: HIT_H, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: HIT_W / 2 - L / 2, top: HIT_H / 2 + 4 - L * (34 / 60), width: L, height: L, alignItems: 'center', justifyContent: 'center' }}>
        {justLit && !reduce ? <Animated.View style={{ position: 'absolute', width: L * 0.9, height: L * 0.9, borderRadius: L, borderWidth: 2, borderColor: T.gold, opacity: wave.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }), transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.6, 4] }) }] }} /> : null}
        {lit && !reduce ? <Halo size={L * 2.1} index={index} /> : null}
        {recommended && !reduce ? <PulseRing size={34 * Math.max(1, k)} /> : null}
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: L, height: L, transform: [{ scale: Animated.multiply(press, pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.15, 1] })) }] }}>
          <SvgXml xml={xml} width={L} height={L} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export interface SearchState { active: boolean; onFound(): void; onMiss(near: boolean): void; hintAfter: number }

export function RoomScene({ roomId, w, h, lanterns, lit, recommended, justLit, open, object, objectFound, digit, labelOf, onLantern, search, glow }: {
  roomId: string; w: number; h: number;
  lanterns: { key: string; isKey?: boolean }[]; lit: boolean[]; recommended: number; justLit: number;
  open: boolean; object?: string; objectFound: boolean; digit?: number | null; glow: string;
  labelOf(i: number, slot: Slot): string; onLantern(i: number, at: { x: number; y: number }): void;
  search?: SearchState;
}) {
  const reduce = useReducedMotion();
  const n = lanterns.length;
  const slots = useMemo(() => roomSlotsOf(roomId, n), [roomId, n]);
  const litKey = lit.map((x) => (x ? 1 : 0)).join('');
  const count = lit.filter(Boolean).length;
  const complete = count === n && n > 0;
  // While the new lantern pops, the room keeps its previous light, then warms up.
  const [shownKey, setShownKey] = useState(litKey);
  useEffect(() => {
    if (shownKey === litKey) return;
    const id = setTimeout(() => setShownKey(litKey), justLit >= 0 && !reduce ? 700 : 0);
    return () => clearTimeout(id);
  }, [litKey, shownKey, justLit, reduce]);
  const shownLit = useMemo(() => shownKey.split('').map((c) => c === '1'), [shownKey]);
  const shownCount = shownLit.filter(Boolean).length;
  const xml = useMemo(() => sceneXml(roomId, n, { t: shownCount / Math.max(1, n), lit: shownLit, complete: shownCount === n && n > 0, object, objectFound, digit }), [roomId, n, shownKey, object, objectFound, digit]); // eslint-disable-line react-hooks/exhaustive-deps
  const fade = useAnimatedValue(1);
  const prevXml = useRef(xml);
  const [under, setUnder] = useState<string | null>(null);
  useEffect(() => {
    if (prevXml.current === xml) return;
    if (!reduce) {
      setUnder(prevXml.current);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => setUnder(null));
    }
    prevXml.current = xml;
  }, [xml, fade, reduce]);

  const { k, ox, oy } = sceneFit(w, h);
  // Always fully on screen and easy to touch, whatever the phone's shape.
  const at = (s: Slot): Slot => placeOnScreen(s, w, h);
  // Touch areas shrink only with the scene (tests/scenes.test.ts checks they never overlap).
  const hk = Math.min(1, Math.max(w / SCENE_W, h / SCENE_H));

  // Search: taps on the scene, near the hidden object or not.
  const [misses, setMisses] = useState(0);
  const [tapAt, setTapAt] = useState<{ x: number; y: number; id: number } | null>(null);
  const ripple = useAnimatedValue(0);
  const hide = hideOf(roomId, n);
  const onSceneTap = (e: GestureResponderEvent) => {
    if (!search?.active || !hide) return;
    const { locationX, locationY } = e.nativeEvent;
    const sx = (locationX - ox) / k, sy = (locationY - oy) / k;
    const d = Math.hypot(sx - hide[0], sy - hide[1]);
    if (d < 38) { search.onFound(); return; }
    setTapAt({ x: locationX, y: locationY, id: Date.now() });
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    setMisses((m) => m + 1);
    search.onMiss(d < 100);
  };
  const showHint = !!search?.active && !!hide && misses >= search.hintAfter;

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }}>
      <Pressable accessible={!!search?.active} accessibilityRole={search?.active ? 'button' : 'none'} accessibilityLabel={search?.active ? tr('Chercher l’objet caché dans la salle') : undefined} onPress={onSceneTap} disabled={!search?.active} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
        {under ? <View style={{ position: 'absolute', left: ox, top: oy }} pointerEvents="none"><SvgXml xml={under} width={SCENE_W * k} height={SCENE_H * k} /></View> : null}
        <Animated.View style={{ position: 'absolute', left: ox, top: oy, opacity: fade }} pointerEvents="none"><SvgXml xml={xml} width={SCENE_W * k} height={SCENE_H * k} /></Animated.View>
      </Pressable>
      {!reduce ? <Motes w={w} h={h} color={glow} n={complete ? 14 : 8} strength={0.35 + (count / Math.max(1, n)) * 0.65} /> : null}
      {tapAt ? (
        <Animated.View key={tapAt.id} pointerEvents="none" style={{ position: 'absolute', left: tapAt.x - 20, top: tapAt.y - 20, width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: T.moon, opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }] }} />
      ) : null}
      {showHint && hide ? <View pointerEvents="none" style={{ position: 'absolute', left: ox + hide[0] * k - 40, top: oy + hide[1] * k - 40, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}><PulseRing size={46} color={T.gold} /></View> : null}
      {lanterns.map((l, i) => (
        <Lantern key={l.key} index={i} slot={at(slots[i])} lit={lit[i]} isKey={l.isKey} recommended={i === recommended && open && !search?.active} justLit={i === justLit} k={k} hw={HIT_WIDTH * hk} hh={HIT_HEIGHT * hk}
          disabled={!open} reduce={reduce} label={labelOf(i, slots[i])} onPress={() => onLantern(i, at(slots[i]))} />
      ))}
    </View>
  );
}
