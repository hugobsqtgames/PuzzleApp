// How each seasonal event looks and speaks: its scene, its drawing, Nilo's
// outfit and the few words that count its progress.
import { tr } from '../i18n';
import type { Look } from './art';
import type { EventId } from '../game/seasons';
import type { AmbiencePlace } from '../core/audio/director';
import { pumpkinXml, skyLanternXml, vigilXml } from './seasonArt';

export interface EventTheme {
  place: AmbiencePlace;
  background: string;
  particles: number;
  /** The drawing of one of its puzzles. */
  art: (lit: boolean, open: boolean) => string;
  /** Nilo dressed for the event, over what the player chose. */
  dress: (l: Look) => Look;
  count: (n: number, size: number) => string;
  milestone: (n: number) => string;
  next: (n: number) => string;
  complete: () => string;
  /** The success screen's title and gauge label. */
  solvedTitle: () => string;
  gauge: () => string;
}

export const EVENT_THEME: Record<EventId, EventTheme> = {
  lanternes: {
    place: 'glasshouse', background: '#140c24', particles: 14,
    art: (lit) => skyLanternXml(lit),
    dress: (l) => ({ ...l, hat: 'flowers', comp: 'skylantern' }),
    count: (n, size) => tr('{0} / {1} lanternes envolées', [n, size]),
    milestone: (n) => tr('{0} lanternes envolées', [n]),
    next: (n) => tr('Faire monter la lanterne {0}', [n]),
    complete: () => tr('Les neuf lanternes brillent dans le ciel. Joyeux printemps !'),
    solvedTitle: () => tr('Lanterne envolée'),
    gauge: () => tr('Lanternes envolées'),
  },
  halloween: {
    place: 'market', background: '#120818', particles: 7,
    art: (lit) => pumpkinXml(lit),
    dress: (l) => ({ ...l, costume: 'witch' }),
    count: (n, size) => tr('{0} / {1} citrouilles rallumées', [n, size]),
    milestone: (n) => tr('{0} citrouilles rallumées', [n]),
    next: (n) => tr('Rallumer la citrouille {0}', [n]),
    complete: () => tr('Toutes les citrouilles brillent. Joyeux Halloween !'),
    solvedTitle: () => tr('Citrouille rallumée'),
    gauge: () => tr('Citrouilles'),
  },
  noel: {
    place: 'lighthouse', background: '#0a1020', particles: 16,
    art: (lit, open) => vigilXml(lit ? 'lit' : open ? 'open' : 'later'),
    dress: (l) => ({ ...l, costume: 'santa' }),
    count: (n, size) => tr('{0} / {1} soirs de veillée', [n, size]),
    milestone: (n) => tr('{0} soirs de veillée', [n]),
    next: () => tr('Veiller ce soir'),
    complete: () => tr('Les douze soirs sont veillés. Joyeuses fêtes !'),
    solvedTitle: () => tr('Lanterne de la veillée allumée'),
    gauge: () => tr('Soirs de veillée'),
  },
};
