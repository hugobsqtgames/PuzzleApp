// The App Store rating, asked once in the app's life, after a happy moment
// (a district fully lit), never in the middle of a puzzle. iOS itself decides
// whether to show it (at most three times a year), and shows nothing in Expo Go.
import * as StoreReview from 'expo-store-review';

export async function askReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
  } catch { /* not available here */ }
}
