// The way through Vesper: a player who always taps « Suivant » / « Continuer » lights every
// lantern, one place after the other. Never a jump to another room, building or district while
// something is still to do where they are; never back to an earlier district.
import { GameEngine } from '../game/engine';
import { newGameState } from '../game/state';
import { WORLD } from '../../game/catalog';
import { nextStep, current } from '../../game/views';
import { worldLanterns } from '../game/world';

const engine = new GameEngine(WORLD);
const p = engine.progression;
const rec = { solvedAt: '2026-10-01T20:00:00.000Z', paidHints: 0, wrongAnswers: 0, usedSolution: false };

test('en suivant « Suivant », les 1 000 lanternes s’allument un endroit après l’autre', () => {
  const s = newGameState();
  s.onboardingDone = true;
  const where = (id: string) => { const l = p.locate(id)!; return { d: WORLD.districts.indexOf(l.district), b: l.district.buildings.indexOf(l.building), r: l.room ? l.building.rooms.indexOf(l.room) : -1, l }; };
  // What is still playable and unlit in a place (as the player would see it).
  const leftIn = (pred: (w: ReturnType<typeof where>) => boolean) => worldLanterns(WORLD).filter((x) => !s.solved.has(x.puzzle) && p.isPlayable(x.puzzle, s) && pred(where(x.puzzle))).length;
  const problems: string[] = [];
  let last: string | null = null;
  const order: string[] = [];
  for (let guard = 0; guard < 2000; guard++) {
    // From a success: « Suivant » (nextStep); with no lantern played yet: « Continuer » on the home screen.
    let id: string | null;
    if (!last) id = current(p, s).lantern?.puzzle ?? null;
    else {
      const step = nextStep(p, s, last);
      if (step.kind === 'home') { id = current(p, s).lantern?.puzzle ?? null; if (id) problems.push(`retour à l’accueil alors qu’il reste ${id}`); }
      else if (step.kind === 'puzzle') id = step.puzzle;
      else id = p.recommended(s)?.puzzle ?? null; // the room / building opened shows this lantern first
    }
    if (!id) break;
    if (last) {
      const a = where(last), b = where(id);
      if (b.d < a.d) problems.push(`retour en arrière : ${last} → ${id}`);
      if (b.d !== a.d && leftIn((w) => w.d === a.d) > 0) problems.push(`quitte le quartier ${a.l.district.id} avec ${leftIn((w) => w.d === a.d)} lanternes jouables : ${last} → ${id}`);
      else if (b.d === a.d && b.b !== a.b && leftIn((w) => w.d === a.d && w.b === a.b) > 0) problems.push(`quitte le bâtiment ${a.l.building.id} trop tôt : ${last} → ${id}`);
      else if (b.d === a.d && b.b === a.b && a.r >= 0 && b.r !== a.r && leftIn((w) => w.d === a.d && w.b === a.b && w.r === a.r) > 0) problems.push(`quitte la salle trop tôt : ${last} → ${id}`);
    }
    engine.puzzleSolved(id, rec, s);
    order.push(id);
    last = id;
  }
  expect(problems).toEqual([]);
  // Everything was lit, each once.
  expect(new Set(order).size).toBe(order.length);
  expect(order.length).toBe(worldLanterns(WORLD).length);
  // Inside a building, the rooms come in their order (room 1, then 2…), the key lantern last.
  const rooms = order.map((id) => p.locate(id)!).map((l) => `${l.building.id}:${l.room ? l.building.rooms.indexOf(l.room) : 99}`).filter((r, i, a) => r !== a[i - 1]);
  for (let i = 1; i < rooms.length; i++) {
    const [b0, r0] = rooms[i - 1].split(':'), [b1, r1] = rooms[i].split(':');
    if (b0 === b1) expect(Number(r1)).toBeGreaterThan(Number(r0));
  }
  // The districts come in their order, each finished before the next.
  const districtOrder = order.map((id) => p.locate(id)!.district.id).filter((d, i, a) => d !== a[i - 1]);
  expect(districtOrder).toEqual(WORLD.districts.map((d) => d.id));
});
