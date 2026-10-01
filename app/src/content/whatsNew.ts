// « Quoi de neuf » : shown once after an update, never on a fresh install.
// Add the new version first; keep each line short (three lines or so).
import Constants from 'expo-constants';

export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

export const WHATS_NEW: { version: string; lines: string[] }[] = [
  {
    version: '1.0.0',
    lines: [
      'Bienvenue à Vesper : 1 000 lanternes à rallumer.',
      'Chaque soir, un nouveau défi.',
      'Nilo t’attend sur le quai du Phare.',
    ],
  },
];

export const whatsNewFor = (version: string) => WHATS_NEW.find((w) => w.version === version) ?? null;
