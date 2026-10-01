// The end of the first chapter: at the top of the Phare, Nilo lifts the
// flame; the beam sweeps the sea, and far away, a light answers.
import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../ui/Text';
import { Button, Nilo, Twinkles } from '../ui/components';
import { T, type } from '../ui/theme';
import { useContentSize } from '../ui/layout';
import { useAnimatedValue, useReducedMotion } from '../ui/motion';
import { useStore } from '../game/store';
import { look } from '../game/rewards';

import { ENDING_SEEN } from '../game/story';
import { tr, translated } from '../i18n';

const LINES = translated([
  'Vesper brille de nouveau, rue après rue.',
  'Au sommet du Phare, Nilo lève sa flamme.',
  'Et là-bas, de l’autre côté de la mer, une lumière répond.',
]);

export default function Ending() {
  const { state, markSeen, enterPlace, play } = useStore();
  const { width, height } = useContentSize();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const beam = useAnimatedValue(reduce ? 1 : 0);
  const answer = useAnimatedValue(0);
  const [texts] = useState(() => LINES.map(() => new Animated.Value(reduce ? 1 : 0)));
  const outro = useAnimatedValue(reduce ? 1 : 0);
  const [done, setDone] = useState(reduce);
  const w = Math.min(width, 600), h = Math.min(height * 0.62, 560);
  const horizon = h * 0.64, lampX = w * 0.2, lampY = h * 0.3;

  useEffect(() => {
    markSeen(ENDING_SEEN);
    enterPlace('lighthouse');
    if (reduce) { const soft = Animated.loop(Animated.sequence([Animated.timing(answer, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(answer, { toValue: 0.3, duration: 700, useNativeDriver: true })])); soft.start(); return () => soft.stop(); }
    const t = (v: Animated.Value, to: number, duration: number, delay = 0) => Animated.timing(v, { toValue: to, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const blink = Animated.sequence([t(answer, 1, 260), t(answer, 0.15, 420), t(answer, 1, 260), t(answer, 0.15, 420), t(answer, 1, 260)]);
    Animated.sequence([
      t(texts[0], 1, 900, 400),
      t(texts[1], 1, 900, 900),
      t(beam, 1, 3200),
      Animated.parallel([blink, t(texts[2], 1, 1200, 300)]),
      t(outro, 1, 1000, 600),
    ]).start(({ finished }) => { if (finished) { setDone(true); play('roomCompleted'); } });
    // The far light keeps answering, softly.
    const glow = Animated.loop(Animated.sequence([t(answer, 0.35, 1400), t(answer, 1, 900)]));
    const id = setTimeout(() => glow.start(), 9800);
    // Leaving the scene stops everything it started.
    return () => { clearTimeout(id); glow.stop(); beam.stopAnimation(); answer.stopAnimation(); outro.stopAnimation(); texts.forEach((v) => v.stopAnimation()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The beam turns from the town towards the sea.
  const rotate = beam.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '14deg'] });
  return (
    <View style={{ flex: 1, backgroundColor: '#05060f', paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, alignItems: 'center' }}>
      <View style={{ width: w, height: h }} accessible accessibilityLabel={tr('Le Phare de Vesper dans la nuit. Son faisceau balaie la mer, et une lumière lui répond au loin.')}>
        <Svg width={w} height={h} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#05060f" /><Stop offset="1" stopColor="#1b2146" /></LinearGradient>
            <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#141a3a" /><Stop offset="1" stopColor="#05060f" /></LinearGradient>
            <RadialGradient id="far"><Stop offset="0" stopColor="#FFF3D6" stopOpacity="1" /><Stop offset="1" stopColor="#8FD3E0" stopOpacity="0" /></RadialGradient>
          </Defs>
          <Rect width={w} height={horizon} fill="url(#sky)" />
          <Rect y={horizon} width={w} height={h - horizon} fill="url(#sea)" />
          {[0.1, 0.22, 0.38, 0.6].map((k, i) => <Path key={i} d={`M${w * (0.35 + i * 0.1)} ${horizon + (h - horizon) * k}h${w * (0.18 - i * 0.03)}`} stroke="#2e3a6a" strokeWidth={1.4} strokeLinecap="round" />)}
          {/* The town, lit, behind the Phare. */}
          {[...Array(14)].map((_, i) => { const x = w * 0.02 + i * w * 0.028, hh = 14 + ((i * 37) % 26); return <Rect key={i} x={x} y={horizon - hh} width={w * 0.024} height={hh} fill="#151936" />; })}
          {[...Array(14)].map((_, i) => <Rect key={`l${i}`} x={w * 0.028 + i * w * 0.028} y={horizon - 10 - ((i * 13) % 12)} width={3} height={4} fill="#F4B45E" opacity={0.85} />)}
          {/* The Phare. */}
          <Path d={`M${lampX - 16} ${horizon + 6}L${lampX - 9} ${lampY + 20}H${lampX + 9}L${lampX + 16} ${horizon + 6}z`} fill="#262B52" />
          <Path d={`M${lampX - 12} ${lampY + 60}h24M${lampX - 14} ${lampY + 110}h28`} stroke="#E88A8A" strokeWidth={6} opacity={0.6} />
          <Rect x={lampX - 13} y={lampY + 6} width={26} height={16} rx={3} fill="#1B1F3A" />
          <Circle cx={lampX} cy={lampY + 14} r={22} fill="#F4B45E" opacity={0.22} />
        </Svg>
        {/* The beam, on its own layer to turn natively. */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: lampX, top: lampY + 14 - 60, width: w, height: 120, opacity: beam.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.9, 0.9] }), transform: [{ translateX: -w / 2 }, { rotate }, { translateX: w / 2 }] }}>
          <Svg width={w} height={120}><Defs><LinearGradient id="bm" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FFE6B0" stopOpacity="0.75" /><Stop offset="1" stopColor="#FFE6B0" stopOpacity="0" /></LinearGradient></Defs><Path d={`M0 60L${w} 0V120z`} fill="url(#bm)" /></Svg>
        </Animated.View>
        {/* Far away, the answer. */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w * 0.84 - 18, top: horizon - 22, width: 36, height: 36, opacity: answer }}>
          <Svg width={36} height={36}><Circle cx={18} cy={18} r={18} fill="url(#far)" /><Circle cx={18} cy={18} r={3} fill="#FFF3D6" /></Svg>
        </Animated.View>
        {/* Nilo at the top, with his flame. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: lampX - 22, top: lampY - 38 }}>
          <Nilo size={44} mood={done ? 'joy' : 'wonder'} look={look(state)} />
        </View>
        {!reduce ? <Twinkles w={w} h={horizon * 0.8} n={16} seed={4} /> : null}
      </View>
      <View style={{ flex: 1, width: '100%', maxWidth: 600, paddingHorizontal: 24, gap: 10, justifyContent: 'center' }}>
        {LINES.map((l, i) => (
          <Animated.View key={i} style={{ opacity: texts[i], transform: [{ translateY: texts[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
            <Text style={[type.dialogue, { textAlign: 'center', color: i === 2 ? T.gold : T.tx }]}>{l}</Text>
          </Animated.View>
        ))}
        <Animated.View style={{ opacity: outro, gap: 6, marginTop: 8 }}>
          <Text style={[type.title2, { textAlign: 'center' }]}>{tr('Fin du premier chapitre')}</Text>
          <Text style={[type.foot, { textAlign: 'center' }]}>{tr('Merci d’avoir rallumé Vesper. Le voyage de Nilo continuera de l’autre côté de la mer.')}</Text>
        </Animated.View>
      </View>
      <View style={{ width: '100%', maxWidth: 600, paddingHorizontal: 24 }}>
        <Button title={tr('Revenir à Vesper')} disabled={!done} onPress={() => router.dismissTo('/')} />
        <Button title={tr('Crédits')} kind="ghost" disabled={!done} onPress={() => router.push('/credits')} />
      </View>
    </View>
  );
}
