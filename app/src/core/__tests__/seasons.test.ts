// The seasons and yearly events follow the date; an event's progress and rewards are kept.
import { EVENTS, eventDone, eventKey, eventOn, eventOpen, nextEvent, seasonOn } from '../../game/seasons';
import { FAMILIES, eventPuzzle, eventSize } from '../../game/catalog';
import { canSubmit, giveHint, hintAvailable, isComplete, startSession, submit } from '../../game/session';
import { HintLevel } from '../puzzlekit/types';
import { newGameState } from '../game/state';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 20, 0);

test('saisons aux bonnes dates', () => {
  expect(seasonOn(d(2027, 3, 20)).id).toBe('hiver');
  expect(seasonOn(d(2027, 3, 21)).id).toBe('printemps');
  expect(seasonOn(d(2027, 6, 21)).id).toBe('ete');
  expect(seasonOn(d(2026, 9, 23)).id).toBe('automne');
  expect(seasonOn(d(2026, 12, 21)).id).toBe('hiver');
  expect(seasonOn(d(2027, 1, 1)).id).toBe('hiver');
});

test('Halloween du 25 octobre au 2 novembre ; Noël du 15 décembre au 6 janvier, compté sur l’année où il commence', () => {
  expect(eventOn(d(2026, 10, 24))).toBeNull();
  expect(eventOn(d(2026, 10, 25))).toMatchObject({ event: { id: 'halloween' }, year: 2026 });
  expect(eventOn(d(2026, 11, 2))).toMatchObject({ event: { id: 'halloween' }, year: 2026 });
  expect(eventOn(d(2026, 11, 3))).toBeNull();
  expect(eventOn(d(2026, 12, 14))).toBeNull();
  expect(eventOn(d(2026, 12, 15))).toMatchObject({ event: { id: 'noel' }, year: 2026 });
  expect(eventOn(d(2027, 1, 6))).toMatchObject({ event: { id: 'noel' }, year: 2026 });
  expect(eventOn(d(2027, 1, 7))).toBeNull();
});

test('le Printemps des Lanternes du 28 mars au 10 avril, tout ouvert d’un coup', () => {
  expect(eventOn(d(2027, 3, 27))).toBeNull();
  expect(eventOn(d(2027, 3, 28))).toMatchObject({ event: { id: 'lanternes' }, year: 2027 });
  expect(eventOn(d(2027, 4, 10))).toMatchObject({ event: { id: 'lanternes' }, year: 2027 });
  expect(eventOn(d(2027, 4, 11))).toBeNull();
  expect(eventOpen(EVENTS.lanternes, 2027, d(2027, 3, 28), eventSize('lanternes'))).toBe(9);
});

test('la Veillée ouvre une lanterne par soir, même à cheval sur le nouvel an', () => {
  const size = eventSize('noel');
  expect(size).toBe(12);
  expect(eventOpen(EVENTS.noel, 2026, d(2026, 12, 15), size)).toBe(1);
  expect(eventOpen(EVENTS.noel, 2026, d(2026, 12, 31), size)).toBe(12);
  expect(eventOpen(EVENTS.noel, 2026, d(2026, 12, 20), size)).toBe(6);
  expect(eventOpen(EVENTS.halloween, 2026, d(2026, 10, 25), eventSize('halloween'))).toBe(7);
});

test('chaque énigme d’événement est livrée et jouable', () => {
  const sizes = { lanternes: 9, halloween: 7, noel: 12 } as const;
  for (const id of ['lanternes', 'halloween', 'noel'] as const) {
    expect(eventSize(id)).toBe(sizes[id]);
    for (let n = 0; n < eventSize(id); n++) expect(eventPuzzle(id, n)).not.toBeNull();
  }
});

test('la progression d’un événement est rangée par année', () => {
  const s = newGameState();
  s.seenDialogue.add(eventKey('halloween', 2026, 0));
  s.seenDialogue.add(eventKey('halloween', 2026, 3));
  expect(eventDone(s, 'halloween', 2026, 7)).toEqual([true, false, false, true, false, false, false]);
  expect(eventDone(s, 'halloween', 2027, 7).some(Boolean)).toBe(false);
});

type Ev = 'lanternes' | 'halloween' | 'noel';
const EVENT_CASES: [Ev, number][] = (['lanternes', 'halloween', 'noel'] as const).flatMap((id) => [...Array(eventSize(id)).keys()].map((n): [Ev, number] => [id, n]));
test.each(EVENT_CASES)('%s %i : les indices mènent à la solution', (id, n) => {
  const p = eventPuzzle(id, n)!;
  let s = startSession(p, 'event', new Date('2026-10-26T20:00:00'));
  for (let guard = 0; guard < 40; guard++) {
    if (isComplete(s)) break;
    if (FAMILIES[p.code].answer && canSubmit(s) && submit(s).correct) break;
    if (!hintAvailable(s, HintLevel.Solution)) break;
    const next = giveHint(s, HintLevel.Solution, 20);
    expect(next).not.toBeNull();
    s = next!;
  }
  if (FAMILIES[p.code].answer) expect(submit(s).correct).toBe(true);
  else expect(isComplete(s)).toBe(true);
});

test('entre deux fêtes, la prochaine est annoncée avec sa date (rien n’est caché par la date)', () => {
  const at = (y: number, m: number, d: number) => { const n = nextEvent(new Date(y, m - 1, d, 20)); return [n.event.id, n.start.getFullYear(), n.start.getMonth() + 1, n.start.getDate()]; };
  expect(at(2026, 10, 9)).toEqual(['halloween', 2026, 10, 25]);
  expect(at(2026, 11, 5)).toEqual(['noel', 2026, 12, 15]);
  expect(at(2027, 1, 10)).toEqual(['lanternes', 2027, 3, 28]);
  expect(at(2027, 4, 20)).toEqual(['halloween', 2027, 10, 25]);
  expect(at(2026, 12, 31)).toEqual(['lanternes', 2027, 3, 28]);
});
