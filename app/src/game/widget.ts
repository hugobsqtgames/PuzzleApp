// Feeds the home-screen widget (targets/widget): a few values in the shared
// App Group, then a reload. iOS builds only; nothing happens in Expo Go or on
// the web. Nothing leaves the phone.
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const WIDGET_GROUP = 'group.app.lampion.game';

export interface WidgetData { streak: number; dailyDone: boolean; dailyFamily: string; dailyDay: string; lights: number; lang: 'fr' | 'en' }

let last = '';

export function syncWidget(data: WidgetData): void {
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  const key = JSON.stringify(data);
  if (key === last) return;
  last = key;
  try {
    // Loaded here only: the native module is missing from Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    const storage = new ExtensionStorage(WIDGET_GROUP);
    storage.set('streak', data.streak);
    storage.set('dailyDone', data.dailyDone ? 1 : 0);
    storage.set('dailyFamily', data.dailyFamily);
    storage.set('dailyDay', data.dailyDay);
    storage.set('lights', data.lights);
    storage.set('lang', data.lang);
    ExtensionStorage.reloadWidget();
  } catch { /* no widget here */ }
}
