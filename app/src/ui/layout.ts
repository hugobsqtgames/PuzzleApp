// Tablets get a phone-like column: screens are laid out for at most MAX_W points, centred.
// On wide screens (iPad), the main screens use two panes instead.
import { useWindowDimensions } from 'react-native';

export const MAX_W = 600;
/** From this width, the puzzle, the room and the home screen use two panes. */
export const WIDE_MIN = 900;
/** The two-pane screens stop growing here. */
export const WIDE_MAX = 1180;

/** The window size, with the width capped to the content column. */
export function useContentSize(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return { width: Math.min(width, MAX_W), height };
}

/** Whether to use two panes, and the width they share. */
export function useWide(): { wide: boolean; width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return { wide: width >= WIDE_MIN, width: Math.min(width, WIDE_MAX), height };
}
