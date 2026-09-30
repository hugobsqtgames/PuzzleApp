// Nilo, alive. Separate layers (tail + flame, ears, body, eyes) move on their
// own: breathing, blinks (sometimes twice), glances, ear twitches, a tail that
// sways, a flame that flickers. Never on a fixed loop: every pause is drawn
// at random, so it never looks mechanical. Mood changes play a reaction
// (joy: hops and wags; oops: a shiver and ears down; hint: the flame swells
// and Nilo looks at it; wonder: a little rise), and so does a tap.
// Native-driver transforms only (runs on the UI thread).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Look, Mood, NILO_PIVOTS, niloParts } from './art';
import { useReducedMotion } from './motion';

type Pivot = readonly [number, number];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Transform that rotates / scales a full-size layer around a point of the drawing. */
function around(p: Pivot, S: number, W: number, H: number, t: object[]) {
  const dx = p[0] * S - W / 2, dy = p[1] * S - H / 2;
  return [{ translateX: dx }, { translateY: dy }, ...t, { translateX: -dx }, { translateY: -dy }] as any;
}

export function NiloLive({ size = 120, mood = 'neutral', look = {}, onPress, label = 'Nilo' }: { size?: number; mood?: Mood; look?: Look; onPress?: () => void; label?: string }) {
  const reduce = useReducedMotion();
  const S = size / 132, W = size, H = size * (120 / 132);
  const parts = useMemo(() => niloParts(mood, look), [mood, look.flame, look.hat, look.scarf, look.comp]); // eslint-disable-line react-hooks/exhaustive-deps

  const v = useState(() => ({
    breathe: new Animated.Value(0), blink: new Animated.Value(1), lookX: new Animated.Value(0), lookY: new Animated.Value(0),
    earL: new Animated.Value(0), earR: new Animated.Value(0), tail: new Animated.Value(0), flame: new Animated.Value(1),
    hop: new Animated.Value(0), shake: new Animated.Value(0), tilt: new Animated.Value(0), deco: new Animated.Value(0),
  }))[0];
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => { const id = setTimeout(() => { if (alive.current) fn(); }, ms); timers.current.push(id); };

  useEffect(() => { alive.current = true; return () => { alive.current = false; timers.current.forEach(clearTimeout); timers.current = []; }; }, []);

  // ---------------------------------------------------------------- idle life
  useEffect(() => {
    const sleeping = mood === 'sleep';
    const loops: Animated.CompositeAnimation[] = [];
    let stop = false;
    const run = (a: Animated.CompositeAnimation, next?: () => void) => a.start(({ finished }) => { if (finished && !stop && alive.current) next?.(); });

    // Breathing: slow, deeper when asleep.
    const bd = sleeping ? 2600 : 1700;
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(v.breathe, { toValue: 1, duration: bd, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v.breathe, { toValue: 0, duration: bd * 1.1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    if (!reduce) { breathe.start(); loops.push(breathe); }

    // Blinks, now and then; sometimes twice.
    const blink = () => {
      if (stop || sleeping) return;
      const once = [Animated.timing(v.blink, { toValue: 0.08, duration: 70, useNativeDriver: true }), Animated.timing(v.blink, { toValue: 1, duration: 110, useNativeDriver: true })];
      run(Animated.sequence(Math.random() < 0.25 ? [...once, Animated.delay(120), ...once] : once), () => later(rand(2200, 6200), blink));
    };
    later(rand(900, 3000), blink);
    if (reduce) return () => { stop = true; loops.forEach((l) => l.stop()); };

    // The flame never keeps still.
    const flick = () => { if (stop) return; run(Animated.timing(v.flame, { toValue: rand(0.93, 1.08), duration: rand(220, 650), easing: Easing.inOut(Easing.sin), useNativeDriver: true }), flick); };
    flick();
    // The tail sways, slowly, never the same way twice.
    const sway = () => { if (stop) return; run(Animated.timing(v.tail, { toValue: rand(-0.35, 0.5) * (sleeping ? 0.3 : 1), duration: rand(1300, 2600), easing: Easing.inOut(Easing.sin), useNativeDriver: true }), sway); };
    sway();
    if (sleeping) return () => { stop = true; loops.forEach((l) => l.stop()); };
    // Glances around, then back.
    const glance = () => {
      if (stop) return;
      const x = rand(-1, 1) > 0 ? rand(1.4, 2.4) : -rand(1.4, 2.4), y = rand(-0.6, 0.6);
      run(Animated.sequence([
        Animated.parallel([Animated.timing(v.lookX, { toValue: x, duration: 220, useNativeDriver: true }), Animated.timing(v.lookY, { toValue: y, duration: 220, useNativeDriver: true })]),
        Animated.delay(rand(700, 1700)),
        Animated.parallel([Animated.timing(v.lookX, { toValue: 0, duration: 260, useNativeDriver: true }), Animated.timing(v.lookY, { toValue: 0, duration: 260, useNativeDriver: true })]),
      ]), () => later(rand(4000, 10000), glance));
    };
    later(rand(2500, 6000), glance);
    // An ear twitches.
    const twitch = () => {
      if (stop) return;
      const ear = Math.random() < 0.5 ? v.earL : v.earR, dir = ear === v.earL ? -1 : 1;
      run(Animated.sequence([
        Animated.timing(ear, { toValue: dir, duration: 90, useNativeDriver: true }), Animated.timing(ear, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(ear, { toValue: dir * 0.6, duration: 80, useNativeDriver: true }), Animated.spring(ear, { toValue: 0, friction: 4, useNativeDriver: true }),
      ]), () => later(rand(5500, 13000), twitch));
    };
    later(rand(3000, 8000), twitch);
    return () => { stop = true; loops.forEach((l) => l.stop()); };
  }, [mood, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- reactions
  const hop = (n = 2) => Animated.sequence([...Array(n)].flatMap(() => [
    Animated.timing(v.hop, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(v.hop, { toValue: 0, duration: 190, easing: Easing.in(Easing.quad), useNativeDriver: true }),
  ]));
  const wag = (n = 3) => Animated.sequence([...[...Array(n)].flatMap(() => [
    Animated.timing(v.tail, { toValue: 1, duration: 110, useNativeDriver: true }), Animated.timing(v.tail, { toValue: -0.8, duration: 110, useNativeDriver: true }),
  ]), Animated.spring(v.tail, { toValue: 0, friction: 4, useNativeDriver: true })]);
  const pulse = (to: number) => Animated.sequence([Animated.timing(v.flame, { toValue: to, duration: 220, useNativeDriver: true }), Animated.spring(v.flame, { toValue: 1, friction: 3, useNativeDriver: true })]);
  const ears = (to: number) => Animated.parallel([Animated.spring(v.earL, { toValue: -to, friction: 5, useNativeDriver: true }), Animated.spring(v.earR, { toValue: to, friction: 5, useNativeDriver: true })]);

  const prevMood = useRef<Mood | null>(null);
  useEffect(() => {
    const was = prevMood.current;
    prevMood.current = mood;
    if (reduce || was === null || was === mood) {
      if (was === null && mood === 'curious') Animated.spring(v.tilt, { toValue: -1, friction: 6, useNativeDriver: true }).start();
      return;
    }
    Animated.spring(v.tilt, { toValue: mood === 'curious' ? -1 : 0, friction: 6, useNativeDriver: true }).start();
    v.deco.setValue(0);
    Animated.timing(v.deco, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    if (mood === 'joy') Animated.parallel([hop(2), wag(3), pulse(1.3)]).start();
    else if (mood === 'oops') Animated.parallel([
      Animated.sequence([3, -3, 2.4, -2, 1, 0].map((x) => Animated.timing(v.shake, { toValue: x, duration: 55, useNativeDriver: true }))),
      Animated.sequence([ears(1.4), Animated.delay(700), ears(0)]),
      pulse(0.75),
    ]).start();
    else if (mood === 'hint') Animated.parallel([
      pulse(1.4),
      Animated.sequence([Animated.parallel([Animated.timing(v.lookX, { toValue: 2.4, duration: 200, useNativeDriver: true }), Animated.timing(v.lookY, { toValue: -2, duration: 200, useNativeDriver: true })]), Animated.delay(1100),
        Animated.parallel([Animated.timing(v.lookX, { toValue: 0, duration: 260, useNativeDriver: true }), Animated.timing(v.lookY, { toValue: 0, duration: 260, useNativeDriver: true })])]),
    ]).start();
    else if (mood === 'wonder') Animated.parallel([Animated.sequence([Animated.timing(v.hop, { toValue: 0.5, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(v.hop, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true })]), pulse(1.3)]).start();
    else if (mood === 'think') Animated.sequence([Animated.timing(v.tail, { toValue: 0.6, duration: 300, useNativeDriver: true }), Animated.timing(v.tail, { toValue: 0.2, duration: 400, useNativeDriver: true })]).start();
  }, [mood, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = () => {
    if (!reduce) {
      const r = Math.random();
      if (r < 0.3) Animated.parallel([hop(1), wag(2)]).start();
      else if (r < 0.55) Animated.sequence([ears(1), ears(-0.6), ears(0)]).start();
      else if (r < 0.8) Animated.parallel([pulse(1.45), Animated.sequence([Animated.timing(v.blink, { toValue: 0.08, duration: 70, useNativeDriver: true }), Animated.timing(v.blink, { toValue: 1, duration: 110, useNativeDriver: true })])]).start();
      else Animated.sequence([Animated.spring(v.tilt, { toValue: 1, friction: 5, useNativeDriver: true }), Animated.delay(500), Animated.spring(v.tilt, { toValue: mood === 'curious' ? -1 : 0, friction: 5, useNativeDriver: true })]).start();
    }
    onPress?.();
  };

  // ---------------------------------------------------------------- layers
  const P = NILO_PIVOTS;
  const layer = { position: 'absolute' as const, left: 0, top: 0, width: W, height: H };
  const all = [
    { translateY: v.hop.interpolate({ inputRange: [0, 1], outputRange: [0, -H * 0.12] }) },
    { translateX: Animated.multiply(v.shake, S) },
  ];
  const content = (
    <View style={{ width: W, height: H }} pointerEvents={onPress ? 'box-only' : 'none'}>
      <View style={layer}><SvgXml xml={parts.back} width={W} height={H} /></View>
      <Animated.View style={[layer, { transform: [...all, ...around(P.body, S, W, H, [{ rotate: v.tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] }) }])] }]}>
        <Animated.View style={[layer, { transform: around(P.tail, S, W, H, [{ rotate: v.tail.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] }) }]) }]}>
          <View style={layer}><SvgXml xml={parts.tail} width={W} height={H} /></View>
          <Animated.View style={[layer, { transform: around(P.flame, S, W, H, [{ scale: v.flame }]) }]}><SvgXml xml={parts.flame} width={W} height={H} /></Animated.View>
        </Animated.View>
        <Animated.View style={[layer, { transform: around(P.body, S, W, H, [{ scaleY: v.breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }, { scaleX: v.breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] }) }]) }]}>
          <Animated.View style={[layer, { transform: around(P.earL, S, W, H, [{ rotate: v.earL.interpolate({ inputRange: [-2, 2], outputRange: ['-30deg', '30deg'] }) }]) }]}><SvgXml xml={parts.earL} width={W} height={H} /></Animated.View>
          <Animated.View style={[layer, { transform: around(P.earR, S, W, H, [{ rotate: v.earR.interpolate({ inputRange: [-2, 2], outputRange: ['-30deg', '30deg'] }) }]) }]}><SvgXml xml={parts.earR} width={W} height={H} /></Animated.View>
          <View style={layer}><SvgXml xml={parts.body} width={W} height={H} /></View>
          <Animated.View style={[layer, { transform: [{ translateX: Animated.multiply(v.lookX, S) }, { translateY: Animated.multiply(v.lookY, S) }, ...around(P.eyes, S, W, H, [{ scaleY: v.blink }])] }]}><SvgXml xml={parts.eyes} width={W} height={H} /></Animated.View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[layer, { opacity: mood === 'joy' || mood === 'wonder' || mood === 'sleep' ? v.deco.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }) : 0, transform: [{ translateY: v.deco.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
        <SvgXml xml={parts.deco} width={W} height={H} />
      </Animated.View>
    </View>
  );
  // The deco of an initial mood shows at once.
  useEffect(() => { v.deco.setValue(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!onPress) return <View accessible accessibilityLabel={label}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onTap} hitSlop={8}>{content}</Pressable>;
}
