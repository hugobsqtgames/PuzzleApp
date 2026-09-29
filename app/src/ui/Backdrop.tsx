import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { T } from './theme';

/** Night gradient rising from the bottom of the screen, so text reads over art. */
export function LinearGradientBackdrop({ height = 420, color = T.bg, solid = 0.55 }: { height?: number; color?: string; solid?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bd" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset={String(solid)} stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bd)" />
      </Svg>
    </View>
  );
}
