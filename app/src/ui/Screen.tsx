import React, { useCallback } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from './theme';
import { Toast } from './components';
import { useStore } from '../game/store';
import type { AmbiencePlace } from '../core/audio/director';

/** Night background, safe areas, 16 pt gutters, the shared toast, and the ambience of the place. */
export function Screen({ children, scroll = false, background = T.bg, padded = true, style, place }: {
  children: React.ReactNode; scroll?: boolean; background?: string; padded?: boolean; style?: StyleProp<ViewStyle>; place?: AmbiencePlace;
}) {
  const insets = useSafeAreaInsets();
  const { toast, enterPlace } = useStore();
  useFocusEffect(useCallback(() => { if (place) enterPlace(place); }, [place, enterPlace]));
  const pad: ViewStyle = { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingHorizontal: padded ? 16 : 0 };
  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, { gap: 14 }, style]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, style]}>{children}</View>
      )}
      <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top - 40 }} pointerEvents="none">
        <Toast text={toast?.text ?? null} icon={toast?.icon} />
      </View>
    </View>
  );
}
