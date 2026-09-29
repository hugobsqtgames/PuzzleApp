import { Tier } from '../puzzlekit/types';
import { District, Lantern, Room, UnlockRule, World } from '../game/world';

/** Monde de test aux proportions de la V1 : Phare 4 × 6, 6 quartiers × 4 bâtiments × (10, 10, 10, 9 + clé), Grenier 16. */
const lantern = (id: string, tier = Tier.Glow): Lantern => ({ puzzle: id, family: 'lamps', tier });
const room = (id: string, n: number): Room => ({ id, lanterns: Array.from({ length: n }, (_, i) => lantern(`${id}.${i + 1}`)) });
const unlocks: UnlockRule[] = [14, 110, 206, 302, 398, 494].map((lights) => ({ kind: 'totalLights', lights }));
const districts: District[] = ['biblio', 'horlo', 'serre', 'marche', 'theatre', 'obs'].map((name, i) => ({
  id: name, unlock: unlocks[i],
  buildings: [1, 2, 3, 4].map((b) => ({
    id: `${name}.b${b}`, rooms: [10, 10, 10, 9].map((n, r) => room(`${name}.b${b}.r${r + 1}`, n)),
    keystone: lantern(`${name}.b${b}.key`, Tier.Beacon), keystoneGivesLetter: b === 4,
  })),
}));
export const FIXTURE_WORLD: World = {
  id: 'vesper',
  districts: [
    { id: 'phare', unlock: { kind: 'always' }, buildings: [{ id: 'phare.b1', rooms: [1, 2, 3, 4].map((r) => room(`phare.b1.r${r}`, 6)) }] },
    ...districts,
    { id: 'grenier', unlock: { kind: 'totalLightsAndLetters', lights: 590, letters: 4 }, buildings: [{ id: 'grenier.b1', rooms: [room('grenier.b1.r1', 16)] }] },
  ],
};
