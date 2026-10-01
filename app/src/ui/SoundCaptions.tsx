// Sound captions: for those who play without sound or do not hear it, a small
// caption tells what the important sounds said (a lantern lit, a mistake…).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Icon } from './components';
import { useAnimatedValue } from './motion';
import { T } from './theme';
import { useStore } from '../game/store';
import { tr } from '../i18n';
import type { SoundEvent } from '../core/audio/director';

/** What each important sound says (the others, like a move or a tap, stay silent here). */
const CAPTIONS: Partial<Record<SoundEvent, [string, () => string]>> = {
  lanternLit: ['light', () => tr('Lanterne allumée')],
  error: ['info', () => tr('Pas tout à fait')],
  shards: ['shard', () => tr('Éclats gagnés')],
  roomCompleted: ['star', () => tr('Salle entièrement éclairée')],
  buildingCompleted: ['star', () => tr('Bâtiment entièrement éclairé')],
  unlock: ['light', () => tr('Quelque chose s’ouvre')],
  newDistrict: ['map', () => tr('Un nouveau quartier')],
  hint: ['whisper', () => tr('Indice')],
  locked: ['lock', () => tr('Pas encore ouvert')],
};

export function SoundCaptions() {
  const { settings, onSound } = useStore();
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<{ icon: string; text: string; id: number } | null>(null);
  const v = useAnimatedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!settings.soundCaptions) return;
    const off = onSound((e) => {
      const c = CAPTIONS[e];
      if (!c) return;
      setShown({ icon: c[0], text: c[1](), id: Date.now() });
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShown(null)), 1800);
    });
    return () => { off(); if (timer.current) clearTimeout(timer.current); };
  }, [settings.soundCaptions, onSound, v]);
  if (!shown) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: 12, top: insets.top + 54, alignItems: 'flex-end' }}>
      <Animated.View accessibilityLiveRegion="polite" style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }], flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: 'rgba(23,26,46,0.94)', borderWidth: 1, borderColor: T.line }}>
        <Icon name="sound" size={14} color={T.tx2} />
        <Icon name={shown.icon} size={14} color={T.gold} />
        <Text style={{ color: T.tx, fontSize: 13, fontWeight: '600' }}>{shown.text}</Text>
      </Animated.View>
    </View>
  );
}
