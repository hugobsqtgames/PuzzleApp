import React from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from './theme';
import { Toast } from './components';
import { useGame } from '../state/GameContext';

/** Night background, safe areas, 16 pt gutters and the shared toast. */
export function Screen({ children, scroll = false, background = T.bg, padded = true, style }: {
  children: React.ReactNode; scroll?: boolean; background?: string; padded?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { toast } = useGame();
  const pad: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingBottom: insets.bottom + 12,
    paddingHorizontal: padded ? 16 : 0,
  };
  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, { gap: 14 }, style]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, style]}>{children}</View>
      )}
      <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top - 40 }} pointerEvents="none">
        <Toast text={toast} />
      </View>
    </View>
  );
}
