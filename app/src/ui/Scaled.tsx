// Draws its content at a base width, scaled by k (the layout keeps the scaled size).
// Used on iPad to show a phone-sized board larger, with its touch areas scaled too.
import React, { useState } from 'react';
import { View } from 'react-native';

export function Scaled({ base, k, children }: { base: number; k: number; children: React.ReactNode }) {
  const [h, setH] = useState(0);
  if (k === 1) return <>{children}</>;
  return (
    <View style={{ width: base * k, height: h * k, alignSelf: 'center' }}>
      <View onLayout={(e) => setH(e.nativeEvent.layout.height)} style={{ width: base, transformOrigin: 'top left', transform: [{ scale: k }] }}>{children}</View>
    </View>
  );
}
