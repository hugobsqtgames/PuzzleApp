// The app icon follows the season (and the two yearly events) on iPhone and iPad.
// Needs a development or App Store build: Expo Go cannot change its icon, so
// nothing happens there. iOS shows a short notice when the icon changes,
// which happens at most six times a year.
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { eventOn, seasonOn } from './seasons';

const NAMES: Record<string, string> = { printemps: 'Printemps', ete: 'Ete', automne: 'Automne', hiver: 'Hiver', lanternes: 'Lanternes', halloween: 'Halloween', noel: 'Noel' };

/** The icon for this date: the event's if one is running, otherwise the season's. */
export const seasonIconName = (d: Date) => NAMES[eventOn(d)?.event.id ?? seasonOn(d).id];

export async function syncAppIcon(seasonal: boolean, now = new Date()): Promise<void> {
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    // Loaded here only: the native module is missing from Expo Go and the web.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const icons = require('expo-alternate-app-icons') as typeof import('expo-alternate-app-icons');
    if (!icons.supportsAlternateIcons) return;
    const want = seasonal ? seasonIconName(now) : null;
    if (icons.getAppIconName() !== want) await icons.setAlternateAppIcon(want as never);
  } catch { /* no alternate icons here */ }
}
