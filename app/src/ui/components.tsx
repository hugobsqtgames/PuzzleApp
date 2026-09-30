import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleProp, StyleSheet, Switch, Text, View, ViewStyle, useAnimatedValue } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { T, R, type } from './theme';
import { iconXml, niloXml, Mood, Look } from './art';
import { NiloLive } from './NiloLive';
import { TIER_NAMES as TIERS } from '../game/catalog';

let hapticsOn = true;
/** Follows the "Vibrations" setting. */
export function setHapticsEnabled(on: boolean) { hapticsOn = on; }

export function tap(kind: 'light' | 'success' | 'error' = 'light') {
  if (!hapticsOn) return;
  // Haptics can be unavailable (web, some Android devices): never fail a tap.
  try {
    if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch { /* ignore */ }
}

export function Icon({ name, size = 22, color = T.tx, sw = 1.6 }: { name: string; size?: number; color?: string; sw?: number }) {
  const xml = useMemo(() => iconXml(name, color, sw), [name, color, sw]);
  return <SvgXml xml={xml} width={size} height={size} />;
}

/** Nilo. Alive by default (see NiloLive); `still` for small thumbnails in lists. */
export function Nilo({ size = 120, mood = 'neutral', look = {}, onPress, still = false }: { size?: number; mood?: Mood; look?: Look; onPress?: () => void; still?: boolean }) {
  const xml = useMemo(() => (still ? niloXml(mood, look) : ''), [still, mood, look.flame, look.hat, look.scarf, look.comp]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!still) return <NiloLive size={size} mood={mood} look={look} onPress={onPress} />;
  return <View accessible accessibilityLabel="Nilo"><SvgXml xml={xml} width={size} height={size * (120 / 132)} /></View>;
}

export function Pill({ icon, iconColor, children, color, borderColor }: { icon?: string; iconColor?: string; children: React.ReactNode; color?: string; borderColor?: string }) {
  return (
    <View style={[s.pill, borderColor ? { borderColor } : null]}>
      {icon ? <Icon name={icon} size={16} color={iconColor ?? T.tx} /> : null}
      <Text style={[s.pillText, color ? { color } : null]}>{children}</Text>
    </View>
  );
}

export const LightPill = ({ n }: { n: number | string }) => <Pill icon="light" iconColor={T.amber}>{n}</Pill>;
export const ShardPill = ({ n }: { n: number | string }) => <Pill icon="shard" iconColor={T.moon}>{n}</Pill>;

type BtnKind = 'primary' | 'secondary' | 'ghost';

/** One press at a time: a double tap never opens two screens or pays twice. */
function useOnce(fn?: () => void, ms = 450) {
  const last = useRef(0);
  return () => { const now = Date.now(); if (now - last.current < ms) return; last.current = now; fn?.(); };
}

/** Springy press feedback (native driver). */
function usePress(to = 0.96) {
  const v = useAnimatedValue(1);
  return {
    scale: v,
    onPressIn: () => Animated.spring(v, { toValue: to, friction: 7, tension: 320, useNativeDriver: true }).start(),
    onPressOut: () => Animated.spring(v, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }).start(),
  };
}

export function Button({ title, onPress, kind = 'primary', icon, disabled, style }: {
  title: string; onPress?: () => void; kind?: BtnKind; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const base = kind === 'primary' ? s.btnP : kind === 'secondary' ? s.btnS : s.btnG;
  const color = kind === 'primary' ? '#0D0F1E' : kind === 'secondary' ? T.tx : T.amber;
  const press = usePress(0.97);
  const once = useOnce(onPress);
  return (
    <Animated.View style={[{ transform: [{ scale: press.scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPressIn={press.onPressIn} onPressOut={press.onPressOut}
        onPress={() => { tap(); once(); }}
        style={({ pressed }) => [s.btn, base, pressed && kind === 'primary' ? { backgroundColor: T.amberP } : null, pressed && kind !== 'primary' ? { opacity: 0.8 } : null, disabled ? { opacity: 0.4 } : null]}
      >
        {icon ? <Icon name={icon} size={20} color={color} sw={1.8} /> : null}
        <Text style={[s.btnText, { color }]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ name, onPress, label, disabled, size = 44, color = T.tx, borderColor }: {
  name: string; onPress: () => void; label: string; disabled?: boolean; size?: number; color?: string; borderColor?: string;
}) {
  const press = usePress(0.9);
  const once = useOnce(onPress, 300);
  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        accessibilityRole="button" accessibilityLabel={label} disabled={disabled} hitSlop={4}
        onPressIn={press.onPressIn} onPressOut={press.onPressOut}
        onPress={() => { tap(); once(); }}
        style={[s.btnI, { width: size, height: size, borderRadius: size / 2 }, borderColor ? { borderColor } : null, disabled ? { opacity: 0.4 } : null]}
      >
        <Icon name={name} size={size * 0.46} color={color} />
      </Pressable>
    </Animated.View>
  );
}

/** A few stars twinkling over a night picture (off with Reduce Motion). */
export function Twinkles({ w, h, n = 7, seed = 1 }: { w: number; h: number; n?: number; seed?: number }) {
  const stars = useMemo(() => [...Array(n)].map((_, i) => {
    const r = (k: number) => ((Math.sin((i + 1) * 12.9898 * (seed + k)) * 43758.5453) % 1 + 1) % 1;
    return { x: r(1) * w, y: r(2) * h, s: 1.5 + r(3) * 2, d: 1400 + r(4) * 2600, delay: r(5) * 3000, v: new Animated.Value(0) };
  }), [n, w, h, seed]);
  useEffect(() => {
    const loops = stars.map((st) => Animated.loop(Animated.sequence([
      Animated.delay(st.delay),
      Animated.timing(st.v, { toValue: 1, duration: st.d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(st.v, { toValue: 0, duration: st.d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [stars]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
      {stars.map((st, i) => <Animated.View key={i} style={{ position: 'absolute', left: st.x, top: st.y, width: st.s, height: st.s, borderRadius: st.s, backgroundColor: '#EFE8D8', opacity: st.v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.95] }), transform: [{ scale: st.v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }] }} />)}
    </View>
  );
}

/** Content that rises gently into place (entering a screen, a reward appearing). */
export function Rise({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useAnimatedValue(0);
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v, delay]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }, style]}>{children}</Animated.View>;
}

export function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const once = useOnce(onPress);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Retour : ${label}`} onPress={() => { tap(); once(); }} style={({ pressed }) => [s.back, pressed ? { opacity: 0.6 } : null]} hitSlop={8}>
      <Icon name="back" size={20} color={T.amber} />
      <Text style={{ color: T.amber, fontSize: 17 }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Gauge({ n, total, height = 8, from }: { n: number; total: number; height?: number; from?: number }) {
  const pct = Math.max(0, Math.min(100, (100 * n) / Math.max(1, total)));
  const [v] = useState(() => new Animated.Value(from !== undefined ? Math.max(0, (100 * from) / Math.max(1, total)) : pct));
  useEffect(() => { Animated.timing(v, { toValue: pct, duration: from !== undefined ? 1100 : 700, delay: from !== undefined ? 900 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={[s.gauge, { height }]}>
      <Animated.View style={[s.gaugeFill, { width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

export function GaugeRow({ n, total, label, from }: { n: number; total: number; label: string; from?: number }) {
  return (
    <View style={s.gaugeRow} accessible accessibilityLabel={`${label} ${n} sur ${total}`}>
      <View style={{ flex: 1 }}><Gauge n={n} total={total} from={from} /></View>
      <Text style={s.gaugeText}>{n} / {total}</Text>
    </View>
  );
}

export function TierBars({ tier }: { tier: number }) {
  return (
    <View style={s.tier} accessible accessibilityLabel={`Palier ${TIERS[tier]}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: 6, height: 6 + i * 2.4, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderRadius: 1, backgroundColor: i <= tier ? T.amber : '#2e3360' }} />
      ))}
    </View>
  );
}

export function GlyphCircle({ icon, size = 44, color = T.amber }: { icon: string; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.52} color={color} />
    </View>
  );
}

export function Crumb({ parent, current }: { parent: string; current: string }) {
  return (
    <Text style={s.crumb}>{parent.toUpperCase()} › <Text style={{ color: T.tx }}>{current.toUpperCase()}</Text></Text>
  );
}

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  // Stays mounted while it slides away; the backdrop fades on its own.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  const v = useAnimatedValue(0);
  useEffect(() => {
    if (visible) {
      Animated.spring(v, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
    } else if (shown) {
      Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => { if (finished) setShown(false); });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]}>
        <Pressable style={s.sheetBackdrop} onPress={onClose} accessibilityLabel="Fermer" />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
        <View style={s.grab} />
        {children}
      </Animated.View>
    </Modal>
  );
}

export function Toast({ text, icon = 'moonI' }: { text: string | null; icon?: string }) {
  // Keeps the last text while sliding out, so the card never empties mid-animation.
  const [shown, setShown] = useState<{ text: string; icon: string } | null>(null);
  if (text && (shown?.text !== text || shown.icon !== icon)) setShown({ text, icon });
  const v = useAnimatedValue(0);
  useEffect(() => {
    if (text) {
      v.setValue(0);
      Animated.spring(v, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => { if (finished) setShown(null); });
    }
  }, [text, icon, v]);
  if (!shown) return null;
  return (
    <Animated.View style={[s.toast, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]} accessibilityLiveRegion="polite" pointerEvents="none">
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(143,211,224,0.1)', alignItems: 'center', justifyContent: 'center' }}><Icon name={shown.icon} size={18} color={T.moon} /></View>
      <Text style={{ color: T.tx, fontSize: 15, flex: 1, lineHeight: 20 }}>{shown.text}</Text>
    </Animated.View>
  );
}

export function ToggleRow({ icon, label, value, onChange, sub }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, minHeight: 52 }}>
      <Icon name={icon} size={20} color={T.tx2} />
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{label}</Text>
        {sub ? <Text style={type.foot}>{sub}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: T.line, true: T.amber }} thumbColor={T.tx} {...({ activeThumbColor: T.tx } as object)} />
    </View>
  );
}


export const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, alignSelf: 'flex-start' },
  pillText: { color: T.tx, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: R.m },
  btnP: { height: 56, backgroundColor: T.amber, alignSelf: 'stretch', shadowColor: T.amber, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  btnS: { height: 48, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, alignSelf: 'stretch' },
  btnG: { height: 44, paddingHorizontal: 12, alignSelf: 'center' },
  btnText: { fontSize: 17, fontWeight: '600' },
  btnI: { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start', paddingRight: 8 },
  card: { backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16 },
  gauge: { borderRadius: 999, backgroundColor: '#1d2140', overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 999, backgroundColor: T.amber },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gaugeText: { fontSize: 14, fontVariant: ['tabular-nums'], color: T.tx2, fontWeight: '600' },
  tier: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  crumb: { ...type.cap },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(5,6,15,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92%', backgroundColor: T.s2, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 34 },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: T.line, alignSelf: 'center', marginBottom: 14 },
  toast: { position: 'absolute', left: 16, right: 16, top: 58, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, borderRadius: R.m, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'center', zIndex: 40, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
