import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useLocales } from 'expo-localization';
import { resolveLang, setLang } from '../i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider, useStore } from '../game/store';
import { setHapticsEnabled } from '../ui/components';
import { FONTS, T } from '../ui/theme';
import { SoundCaptions } from '../ui/SoundCaptions';
import { AccentCtx } from '../ui/accent';
import { current } from '../game/views';
import { DISTRICT_BY_ID } from '../content/vesper';

function Navigator() {
  const { ready, settings, state, engine } = useStore();
  // Buttons take the colour of the district the player is in (setting « Couleur du quartier »).
  const accent = settings.districtTint ? DISTRICT_BY_ID[current(engine.progression, state).district.id as keyof typeof DISTRICT_BY_ID]?.hue ?? T.amber : T.amber;
  // The title font is bundled; if it ever fails to load, the system serif stands in.
  const [fontsLoaded, fontError] = useFonts(FONTS);
  useEffect(() => { setHapticsEnabled(settings.haptics); }, [settings.haptics]);
  // Until the save and the font are read, only the night: no flash of an empty game.
  const device = useLocales()[0]?.languageCode;
  // The language is set before the screens render; changing it remounts them in the new one.
  const language = resolveLang(settings.language, device);
  setLang(language);
  if (!ready || (!fontsLoaded && !fontError)) return <View style={{ flex: 1, backgroundColor: '#05060f' }} />;
  return (
    <AccentCtx.Provider value={accent}>
    <Stack key={language} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg }, animation: 'slide_from_right', animationDuration: 320 }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="puzzle" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 280 }} />
      <Stack.Screen name="success" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 380 }} />
      <Stack.Screen name="found" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 380 }} />
      <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="ending" options={{ gestureEnabled: false, animation: 'fade', animationDuration: 900 }} />
    </Stack>
    <SoundCaptions />
    </AccentCtx.Provider>
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
