// Tablets get a phone-like column: screens are laid out for at most MAX_W points, centred.
import { useWindowDimensions } from 'react-native';

export const MAX_W = 600;

/** The window size, with the width capped to the content column. */
export function useContentSize(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return { width: Math.min(width, MAX_W), height };
}
