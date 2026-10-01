// What falls (or flutters) past Vesper's window: petals, fireflies, leaves,
// snow, or bats for the Nuit des Citrouilles. Each particle drifts down on its
// own loop (native driver); with reduced motion they stay still.
import React, { memo, useEffect, useMemo } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useAnimatedValue, useReducedMotion } from './motion';
import { particleXml } from './seasonArt';
import type { Particle } from '../game/seasons';

/** A small repeatable random, so the particles keep their places between renders. */
const rand = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

const Bit = memo(function Bit({ kind, accent, k, w, h, still }: { kind: Particle; accent: string; k: number; w: number; h: number; still: boolean }) {
  const v = useAnimatedValue(rand(k + 1));
  const x = rand(k + 11) * w, size = 12 + rand(k + 21) * 8;
  // Fireflies and bats wander; the rest falls.
  const floats = kind === 'firefly' || kind === 'bat';
  const ms = kind === 'rain' ? 900 + rand(k + 31) * 500 : (floats ? 7000 : 9000) + rand(k + 31) * 6000;
  useEffect(() => {
    if (still) return;
    const from = rand(k + 1);
    v.setValue(from);
    const first = Animated.timing(v, { toValue: 1, duration: ms * (1 - from), easing: Easing.linear, useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true })]));
    const all = Animated.sequence([first, loop]);
    all.start();
    return () => all.stop();
  }, [v, ms, k, still]);
  const xml = useMemo(() => `<svg viewBox="-10 -10 20 20">${particleXml(kind, accent, k)}</svg>`, [kind, accent, k]);
  const sway = kind === 'rain' ? 2 : 8 + rand(k + 41) * 14;
  const translateY = floats
    ? v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [h * (0.15 + rand(k + 51) * 0.4), h * (0.05 + rand(k + 61) * 0.4), h * (0.15 + rand(k + 51) * 0.4)] })
    : v.interpolate({ inputRange: [0, 1], outputRange: [-size, h + size] });
  const translateX = v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: floats ? [0, sway * 2, 0, -sway * 2, 0] : [0, sway, 0, -sway, 0] });
  const opacity = kind === 'firefly' ? v.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0.2, 1, 0.4, 1, 0.3, 0.2] }) : 1;
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: 0, width: size, height: size, opacity, transform: [{ translateX }, { translateY }] }}>
      <SvgXml xml={xml} width={size} height={size} />
    </Animated.View>
  );
});

export function SeasonFall({ kind, accent, w, h, n = 12 }: { kind: Particle; accent: string; w: number; h: number; n?: number }) {
  const reduce = useReducedMotion();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden' }}>
      {Array.from({ length: n }, (_, k) => <Bit key={`${kind}${k}`} kind={kind} accent={accent} k={k} w={w} h={h} still={reduce} />)}
    </View>
  );
}

/** Fog: two pale veils drifting slowly across the window. */
export function Fog({ w, h }: { w: number; h: number }) {
  const reduce = useReducedMotion();
  const v = useAnimatedValue(0);
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);
  const veil = `<svg viewBox="0 0 200 40"><defs><radialGradient id="fogv"><stop offset="0" stop-color="#C9D3E8" stop-opacity=".38"/><stop offset="1" stop-color="#C9D3E8" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="20" rx="100" ry="20" fill="url(#fogv)"/></svg>`;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', left: -w * 0.3, top: h * 0.45, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, w * 0.3] }) }] }}><SvgXml xml={veil} width={w * 1.3} height={h * 0.3} /></Animated.View>
      <Animated.View style={{ position: 'absolute', left: -w * 0.1, top: h * 0.62, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -w * 0.25] }) }] }}><SvgXml xml={veil} width={w * 1.4} height={h * 0.32} /></Animated.View>
    </View>
  );
}
