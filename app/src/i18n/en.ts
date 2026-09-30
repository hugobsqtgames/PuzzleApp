// English texts, keyed by the French source. Split by area for readability.
import { EN_UI } from './en/ui';
import { EN_ENGINE } from './en/engine';
import { EN_WORLD } from './en/world';
import { EN_SCENES } from './en/scenes';

export const EN: Record<string, string> = { ...EN_SCENES, ...EN_WORLD, ...EN_ENGINE, ...EN_UI };
