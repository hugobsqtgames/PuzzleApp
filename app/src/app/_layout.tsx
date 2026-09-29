import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from '../state/GameContext';
import { T } from '../ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: T.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="puzzle" options={{ gestureEnabled: false }} />
          <Stack.Screen name="success" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </GameProvider>
    </SafeAreaProvider>
  );
}
