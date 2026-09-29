import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider, useStore } from '../game/store';
import { setHapticsEnabled } from '../ui/components';
import { T } from '../ui/theme';

function Navigator() {
  const { ready, settings } = useStore();
  useEffect(() => { setHapticsEnabled(settings.haptics); }, [settings.haptics]);
  // Until the save is read, only the night: no flash of an empty game.
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#05060f' }} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg }, animation: 'fade' }}>
      <Stack.Screen name="puzzle" options={{ gestureEnabled: false }} />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="found" options={{ gestureEnabled: false }} />
      <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'none' }} />
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
