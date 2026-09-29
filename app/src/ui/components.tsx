import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated, Easing, Modal, Pressable, StyleProp, StyleSheet, Switch, Text, View, ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { T, R, type } from './theme';
import { iconXml, niloXml, Mood, Look } from './art';
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

export function Nilo({ size = 120, mood = 'neutral', look = {}, onPress }: { size?: number; mood?: Mood; look?: Look; onPress?: () => void }) {
  const xml = useMemo(() => niloXml(mood, look), [mood, look.flame, look.hat, look.scarf, look.comp]); // eslint-disable-line react-hooks/exhaustive-deps
  const bob = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    // Gentle breathing (joy hops a little more) and the flame's flicker. Stopped on unmount.
    const amp = mood === 'joy' ? 1 : 0.35;
    const d = mood === 'joy' ? 450 : 1500;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: amp, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);
  useEffect(() => {
    const d = mood === 'oops' ? 220 : 1500;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flick, { toValue: 1.04, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flick, { toValue: 0.98, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [flick, mood]);
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.06] });
  const h = size * (120 / 132);
  const body = (
    <Animated.View style={{ width: size, height: h, transform: [{ translateY }, { scale: flick }] }}>
      <SvgXml xml={xml} width={size} height={h} />
    </Animated.View>
  );
  if (!onPress) return <View accessible accessibilityLabel="Nilo">{body}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel="Nilo" onPress={onPress}>{body}</Pressable>;
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

export function Button({ title, onPress, kind = 'primary', icon, disabled, style }: {
  title: string; onPress?: () => void; kind?: BtnKind; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const base = kind === 'primary' ? s.btnP : kind === 'secondary' ? s.btnS : s.btnG;
  const color = kind === 'primary' ? '#0D0F1E' : kind === 'secondary' ? T.tx : T.amber;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => [s.btn, base, pressed && kind === 'primary' ? { backgroundColor: T.amberP } : null, pressed ? { transform: [{ scale: 0.98 }] } : null, disabled ? { opacity: 0.4 } : null, style]}
    >
      {icon ? <Icon name={icon} size={20} color={color} sw={1.8} /> : null}
      <Text style={[s.btnText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, disabled, size = 44, color = T.tx, borderColor }: {
  name: string; onPress: () => void; label: string; disabled?: boolean; size?: number; color?: string; borderColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.btnI, { width: size, height: size, borderRadius: size / 2 }, borderColor ? { borderColor } : null, disabled ? { opacity: 0.4 } : null, pressed ? { transform: [{ scale: 0.95 }] } : null]}
    >
      <Icon name={name} size={size * 0.46} color={color} />
    </Pressable>
  );
}

export function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Retour : ${label}`} onPress={() => { tap(); onPress(); }} style={s.back} hitSlop={8}>
      <Icon name="back" size={20} color={T.amber} />
      <Text style={{ color: T.amber, fontSize: 17 }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Gauge({ n, total, height = 8 }: { n: number; total: number; height?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((100 * n) / total)));
  return (
    <View style={[s.gauge, { height }]}>
      <View style={[s.gaugeFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function GaugeRow({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <View style={s.gaugeRow} accessible accessibilityLabel={`${label} ${n} sur ${total}`}>
      <View style={{ flex: 1 }}><Gauge n={n} total={total} /></View>
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.sheetBackdrop} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={s.sheet}>
        <View style={s.grab} />
        {children}
      </View>
    </Modal>
  );
}

export function Toast({ text, icon = 'moonI' }: { text: string | null; icon?: string }) {
  if (!text) return null;
  return (
    <View style={s.toast} accessibilityLiveRegion="polite" pointerEvents="none">
      <Icon name={icon} size={20} color={T.moon} />
      <Text style={{ color: T.tx, fontSize: 15, flex: 1 }}>{text}</Text>
    </View>
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
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: T.line, true: T.amber }} thumbColor={T.tx} />
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
  sheet: { backgroundColor: T.s2, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 34 },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: T.line, alignSelf: 'center', marginBottom: 14 },
  toast: { position: 'absolute', left: 16, right: 16, top: 58, backgroundColor: T.s2, borderWidth: 1, borderColor: T.line, borderRadius: R.m, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 10, alignItems: 'center', zIndex: 40 },
});
