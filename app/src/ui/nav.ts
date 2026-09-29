import { router } from 'expo-router';

/** Back, or home when there is nothing behind (after a replace chain). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
