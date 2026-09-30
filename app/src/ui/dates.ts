import { lang } from '../i18n';

const DAYS = { fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "Mardi 29 septembre" / "Tuesday 29 September" for the player's local day. */
export function dailyLabel(date: Date = new Date()): string {
  return `${DAYS[lang()][date.getDay()]} ${date.getDate()} ${MONTHS[lang()][date.getMonth()]}`;
}

/** Name of month m (1–12), capitalised as a heading. */
/** Initials of the week, Monday first (the calendar's header). */
export const weekInitials = () => (lang() === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']);

export function monthName(m: number): string {
  const n = MONTHS[lang()][m - 1];
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Local Date of a day key "YYYY-MM-DD" (noon, safe from DST edges). */
export function dateOfDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
