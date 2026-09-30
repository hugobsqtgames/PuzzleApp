import React, { useCallback } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from './theme';
import { MAX_W, WIDE_MAX } from './layout';
import { Toast } from './components';
import { useStore } from '../game/store';
import type { AmbiencePlace } from '../core/audio/director';

/** Night background, safe areas, 16 pt gutters, a centred column on tablets, the shared toast, and the ambience of the place. */
export function Screen({ children, scroll = false, background = T.bg, padded = true, style, place, wide = false }: {
  children: React.ReactNode; scroll?: boolean; background?: string; padded?: boolean; style?: StyleProp<ViewStyle>; place?: AmbiencePlace;
  /** Two panes on a tablet: the column may grow to WIDE_MAX. */
  wide?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { toast, enterPlace } = useStore();
  useFocusEffect(useCallback(() => { if (place) enterPlace(place); }, [place, enterPlace]));
  const pad: ViewStyle = { width: '100%', maxWidth: wide ? WIDE_MAX : MAX_W, alignSelf: 'center', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingHorizontal: padded ? (wide ? 28 : 16) : 0 };
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
