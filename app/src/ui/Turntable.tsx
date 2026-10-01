// An object of the Carnet on a turntable: it turns slowly on itself, and the
// finger can spin it. A flat drawing given some depth: a darker back face
// that shows through as it turns, and a shadow that follows.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useAnimatedValue, useReducedMotion } from './motion';
import { tr } from '../i18n';

export function Turntable({ front, back, size = 120 }: { front: string; back: string; size?: number }) {
  const reduce = useReducedMotion();
  // The angle, in turns (1 = 360°), always moving forward.
  const turn = useAnimatedValue(0);
  const at = useRef(0);
  const spin = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const id = turn.addListener(({ value }) => { at.current = value; });
    return () => turn.removeListener(id);
  }, [turn]);

  const idle = React.useCallback(() => {
    spin.current?.stop();
    if (reduce) return;
    const from = at.current;
    // One turn every 9 seconds, endlessly (restarted from wherever it stands).
    spin.current = Animated.loop(Animated.timing(turn, { toValue: from + 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }), { resetBeforeIteration: true });
    turn.setValue(from);
    spin.current.start();
  }, [turn, reduce]);

  useEffect(() => { idle(); return () => spin.current?.stop(); }, [idle]);

  // The finger spins it: plain responder events, read only in the handlers.
  const drag = useRef({ x: 0, from: 0 });
  const grab = (x: number) => { spin.current?.stop(); drag.current = { x, from: at.current }; };
  const move = (x: number) => turn.setValue(drag.current.from + (x - drag.current.x) / 360);

  const rotateY = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  // The back face shows while the front is turned away (between a quarter and three quarters of a turn).
  const frac = Animated.modulo(turn, 1);
  const frontOpacity = frac.interpolate({ inputRange: [0, 0.24, 0.26, 0.74, 0.76, 1], outputRange: [1, 1, 0, 0, 1, 1] });
  const backOpacity = frac.interpolate({ inputRange: [0, 0.24, 0.26, 0.74, 0.76, 1], outputRange: [0, 0, 1, 1, 0, 0] });
  const shadow = frac.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.35, 1, 0.35, 1] });

  return (
    <View onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => grab(e.nativeEvent.pageX)} onResponderMove={(e) => move(e.nativeEvent.pageX)} onResponderRelease={idle} onResponderTerminate={idle}
      accessible accessibilityRole="image" accessibilityLabel={tr('Objet à faire tourner')}
      style={{ width: size * 1.5, height: size * 1.25, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', bottom: size * 0.04, width: size * 0.8, height: size * 0.07, borderRadius: size, backgroundColor: 'rgba(0,0,0,0.22)', transform: [{ scaleX: shadow }] }} />
      <Animated.View style={{ width: size, height: size, transform: [{ perspective: 600 }, { rotateY }] }}>
        <Animated.View style={{ position: 'absolute', opacity: frontOpacity }}><SvgXml xml={front} width={size} height={size} /></Animated.View>
        {/* Seen from behind, the object is mirrored, as a real one would be. */}
        <Animated.View style={{ position: 'absolute', opacity: backOpacity }}><SvgXml xml={back} width={size} height={size} /></Animated.View>
      </Animated.View>
    </View>
  );
}
