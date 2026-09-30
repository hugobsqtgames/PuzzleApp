// Evening reminder (GAME_DESIGN § 13): local only, one per day at most, only
// if the daily puzzle is not done. Each time the app opens, the next 3
// reminders are scheduled; if the app is not opened for 3 reminders, nothing
// more is scheduled ("auto-silence") until the next opening.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { tr, translated } from '../i18n';

export interface ReminderPlan { enabled: boolean; hour: number; minute: number; doneToday: boolean; streak: number }

const MESSAGES = translated([
  'Le défi du soir t’attend.',
  'Une nouvelle énigme brille sur Vesper ce soir.',
  'Nilo garde une énigme pour toi ce soir.',
]);

let handlerSet = false;

export async function permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  try { return (await Notifications.getPermissionsAsync()).status as 'granted' | 'denied' | 'undetermined'; } catch { return 'denied'; }
}

export async function askPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try { return (await Notifications.requestPermissionsAsync()).status === 'granted'; } catch { return false; }
}

/** Reminder dates for the plan, from `now` (pure, tested). */
export function reminderDates(plan: ReminderPlan, now: Date, count = 3): Date[] {
  if (!plan.enabled) return [];
  const out: Date[] = [];
  for (let day = 0; out.length < count && day < count + 1; day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, plan.hour, plan.minute, 0, 0);
    if (day === 0 && (plan.doneToday || d.getTime() <= now.getTime())) continue;
    out.push(d);
  }
  return out;
}

export async function scheduleReminders(plan: ReminderPlan, now = new Date()): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: true }),
      });
      handlerSet = true;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!plan.enabled || (await permissionStatus()) !== 'granted') return;
    const dates = reminderDates(plan, now);
    for (const [i, date] of dates.entries()) {
      const body = plan.streak >= 3 && i === 0
        ? tr('Ta flamme du soir brûle depuis {0} jours. Le défi d’aujourd’hui est prêt.', [plan.streak])
        : MESSAGES[(date.getDate() + i) % MESSAGES.length];
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Lampion', body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  } catch {
    // A reminder is never worth an error message.
  }
}
