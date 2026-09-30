import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider, useStore } from '../game/store';
import { setHapticsEnabled } from '../ui/components';
import { FONTS, T } from '../ui/theme';

function Navigator() {
  const { ready, settings } = useStore();
  // The title font is bundled; if it ever fails to load, the system serif stands in.
  const [fontsLoaded, fontError] = useFonts(FONTS);
  useEffect(() => { setHapticsEnabled(settings.haptics); }, [settings.haptics]);
  // Until the save and the font are read, only the night: no flash of an empty game.
  if (!ready || (!fontsLoaded && !fontError)) return <View style={{ flex: 1, backgroundColor: '#05060f' }} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg }, animation: 'slide_from_right', animationDuration: 320 }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="puzzle" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 280 }} />
      <Stack.Screen name="success" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 380 }} />
      <Stack.Screen name="found" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 380 }} />
      <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="ending" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 900 }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <Navigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
