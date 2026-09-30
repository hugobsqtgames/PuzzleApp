// Rooms of the Marché Flottant and of the Théâtre d’Ombres.
import type { RoomSpec } from './index';
import * as P from './props1';
import * as Q from './props2';
import * as S from './props3';

export const MARCHE_THEATRE: Record<string, RoomSpec> = {
  // ---------------------------------------------------------------- Pont des Épices
  'marche.b1.r1': { // Les Étals
    arch: 'deck', glow: '#E8C07A',
    props: [[Q.lampions, 0, 90, 1, { w: 390, c: 1 }], [Q.stall, 100, 470, 1.15, { c: 1 }], [Q.stall, 295, 470, 1.15, { c: 4 }], [P.breadBasket, 195, 505, 1.2], [P.barrel, 40, 510, 0.9], [P.crate, 360, 510, 0.9], [Q.coins, 250, 505, 0.8]],
    hide: [150, 430], secret: [195, 250],
    intro: 'Les étals sentent la cannelle et le poivre de lune. Aucun marchand, mais tout est rangé.',
  },
  'marche.b1.r2': { // Les Balances
    arch: 'deck', glow: '#E8C07A',
    props: [[Q.lampions, 0, 70, 1, { w: 390, c: 3 }], [Q.scaleStand, 195, 470, 1.3], [Q.weights, 90, 505, 1.2], [Q.coins, 320, 505], [P.crate, 330, 450, 0.8], [Q.stall, 322, 470, 0.8, { c: 6 }], [P.hang, 195, 90], [Q.buoy, 250, 440, 0.8], [P.sack, 40, 440, 0.8]],
    hide: [260, 505], secret: [195, 200],
    intro: 'Deux plateaux, un seul équilibre. Sur l’un, quelqu’un a laissé un poids de cuivre.',
  },
  'marche.b1.r3': { // Les Sacs
    arch: 'deck', glow: '#E8C07A',
    props: [[Q.lampions, 0, 80, 1, { w: 390, c: 5 }], [Q.spiceSacks, 110, 500, 1.2], [Q.spiceSacks, 290, 490, 1, { f: true }], [P.sack, 200, 510, 1.1, { c: 2 }], [P.barrel, 360, 430, 0.9], [P.crate, 40, 430, 0.9], [Q.scaleStand, 195, 400, 0.6]],
    hide: [60, 510], secret: [300, 250],
    intro: 'Dans un sac, du poivre qui brille un peu. Le marchand l’appelait « poivre de lune ».',
  },
  'marche.b1.r4': { // Le Parapet
    arch: 'balcony', ao: { wx: 300 }, glow: '#E8C07A',
    props: [[Q.lampions, 0, 110, 1, { w: 390, c: 2 }], [Q.ropeCoil, 70, 505, 1.1], [Q.bollard, 180, 505, 1.2], [Q.lamppost, 330, 480, 1], [P.crate, 260, 510, 0.9], [Q.buoy, 40, 430], [Q.fishCrate, 120, 450, 0.8], [P.barrel, 350, 520, 0.8], [Q.lampions, 0, 180, 1, { w: 390, c: 4, v: 1, l: ['la guirlande du parapet'] }]],
    hide: [220, 470], secret: [195, 220],
    intro: 'Accoudé au parapet, on regarde l’eau noire. Un cordage salé traîne, encore humide.',
  },

  // ---------------------------------------------------------------- Barque du Changeur
  'marche.b2.r1': { // La Proue
    arch: 'deck', ao: { wx: 90 }, glow: '#E8C07A',
    props: [[Q.figurehead, 260, 470, 1.2], [Q.mast, 90, 500, 1], [Q.ropeCoil, 180, 505], [Q.bollard, 340, 505], [Q.lampions, 90, 110, 1, { w: 300, c: 4 }], [Q.buoy, 40, 505, 0.9], [P.barrel, 350, 440, 0.8], [P.crate, 130, 440, 0.7]],
    hide: [300, 320], secret: [195, 360],
    intro: 'La figure de proue regarde toujours vers l’autre rive. On dit qu’elle sait nager.',
  },
  'marche.b2.r2': { // Le Comptoir
    arch: 'hold', ao: { win: 'porthole', wx: 300, wy: 150 }, glow: '#F4B45E',
    props: [[Q.counter, 180, 490, 1.2, { w: 240 }], [Q.abacus, 110, 382, 1.2], [Q.coins, 220, 382, 1.1], [Q.ledger, 290, 386], [P.hang, 180, 200], [P.shelf, 90, 230, 1, { c: 3 }], [P.chest, 350, 510, 0.8]],
    hide: [60, 500], secret: [195, 290],
    intro: 'Le changeur échangeait tout : une pièce contre une histoire, une histoire contre une idée.',
  },
  'marche.b2.r3': { // La Cale
    arch: 'hold', ao: { win: 'none' }, glow: '#F4B45E',
    props: [[P.barrel, 70, 490, 1.2], [P.barrel, 130, 500, 1], [P.crate, 280, 495, 1.3], [P.crate, 290, 438, 1], [P.chest, 195, 510, 1], [P.sack, 355, 505, 1, { c: 0 }], [P.hang, 195, 200], [Q.ropeCoil, 40, 400, 0.8], [P.oilCan, 350, 430]],
    hide: [220, 440], secret: [100, 240],
    intro: 'Il fait sombre dans la cale. Un coffret de sel tinte quand la barque tangue.',
  },
  'marche.b2.r4': { // La Poupe
    arch: 'deck', ao: { wx: 300 }, glow: '#E8C07A',
    props: [[Q.rudder, 290, 430, 1.3], [Q.lamppost, 80, 490, 1.1], [Q.ropeCoil, 180, 505], [Q.bollard, 340, 510], [P.chest, 60, 510, 0.8], [Q.lampions, 0, 90, 1, { w: 390, c: 6, v: 1 }], [Q.buoy, 200, 440], [P.crate, 130, 440, 0.8], [Q.fishCrate, 250, 520, 0.8]],
    hide: [140, 470], secret: [195, 250],
    intro: 'À l’arrière de la barque, une petite lanterne pour voir d’où l’on vient.',
  },

  // ---------------------------------------------------------------- Halle aux Poids
  'marche.b3.r1': { // Le Grand Plateau
    arch: 'hall', ao: { wx: 195, wy: 100 }, glow: '#D8B56A',
    props: [[Q.bigScale, 195, 490, 1.05], [Q.weights, 76, 510], [Q.weights, 314, 510, 1, { f: true }], [P.hang, 100, 180], [P.hang, 290, 180]],
    hide: [270, 505], secret: [195, 400],
    intro: 'Sur le grand plateau, on pesait les choses qui ne pèsent rien. Une plume de plomb y dort.',
  },
  'marche.b3.r2': { // Les Étalons
    arch: 'hall', ao: { wx: 195, wy: 100 }, glow: '#D8B56A',
    props: [[P.shelf, 100, 260, 1.3, { w: 110 }], [P.shelf, 290, 260, 1.3, { w: 110 }], [Q.weights, 100, 256, 0.8], [Q.weights, 290, 256, 0.7], [Q.weights, 195, 505, 1.4], [P.table, 195, 470, 0.9, { w: 150 }], [P.hang, 195, 180], [P.chest, 340, 510, 0.9], [P.stool, 50, 505]],
    hide: [60, 380], secret: [290, 150],
    intro: 'Chaque poids a son nom gravé. Le poids-étalon, lui, n’a qu’un chiffre : le vrai.',
  },
  'marche.b3.r3': { // Le Registre
    arch: 'study', ao: { win: 'tall', wx: 300, wy: 140, tint: '#3a3040' }, glow: '#F4B45E',
    props: [[P.desk, 150, 470, 1.4], [Q.ledger, 120, 368, 1.3], [P.candle, 200, 368], [P.chair, 50, 486, 1.1], [P.drawers, 320, 490, 0.9], [P.hang, 150, 200], [P.bookStack, 250, 510, 0.9]],
    hide: [360, 330], secret: [70, 200],
    intro: 'Le livre des comptes est juste, au centime près. Il manque seulement la dernière ligne.',
  },
  'marche.b3.r4': { // La Galerie
    arch: 'hall', ao: { wx: 195, wy: 90 }, glow: '#D8B56A',
    props: [[Q.walkway, 195, 280], [Q.scaleStand, 100, 270, 0.6], [Q.weights, 300, 270, 0.7], [Q.bench, 195, 505, 1.1], [Q.lamppost, 50, 510], [Q.lamppost, 340, 510, 1, { f: true }], [P.crate, 195, 440, 0.7]],
    hide: [260, 250], secret: [195, 380],
    intro: 'De la galerie, on voit toute la halle. Une balance de poche a glissé entre deux barreaux.',
  },

  // ---------------------------------------------------------------- Quai des Lampions
  'marche.b4.r1': { // Le Quai
    arch: 'deck', glow: '#E8C07A',
    props: [[Q.lampions, 0, 70, 1, { w: 390, c: 0, v: 1 }], [Q.lampions, 0, 140, 1, { w: 390, c: 3 }], [Q.lamppost, 60, 500, 1.1], [Q.bollard, 195, 505, 1.2], [Q.ropeCoil, 300, 505], [P.crate, 360, 460, 0.8], [Q.fishCrate, 120, 505, 0.9], [Q.buoy, 250, 440], [P.barrel, 30, 440, 0.7]],
    hide: [260, 460], secret: [195, 280],
    intro: 'Des centaines de lampions de papier, éteints. Le quai attend la fête qui n’a jamais eu lieu.',
  },
  'marche.b4.r2': { // Les Amarres
    arch: 'deck', glow: '#E8C07A',
    props: [[Q.bollard, 80, 505, 1.3], [Q.bollard, 300, 505, 1.3], [Q.ropeCoil, 190, 505, 1.2], [Q.rowboat, 195, 420, 0.9], [Q.lamppost, 360, 470, 0.9, { f: true }], [Q.buoy, 40, 440], [Q.lampions, 0, 100, 1, { w: 390, c: 5, v: 1 }], [P.crate, 250, 440, 0.7]],
    hide: [140, 430], secret: [300, 240],
    intro: 'Les barques tirent doucement sur leurs amarres. Un nœud de marin tient bon depuis quarante ans.',
  },
  'marche.b4.r3': { // La Criée
    arch: 'hall', ao: { wx: 195, wy: 110 }, glow: '#8FD3E0',
    props: [[Q.fishCrate, 90, 480, 1.3], [Q.fishCrate, 300, 480, 1.3], [Q.fishCrate, 195, 510, 1.1], [Q.shell, 50, 510], [Q.shell, 340, 515, 0.8], [P.hang, 110, 200], [P.hang, 280, 200], [P.barrel, 195, 440, 0.8]],
    hide: [250, 505], secret: [195, 300],
    intro: 'Ici, on criait les prix à la volée. Un coquillage garde encore l’écho des voix.',
  },
  'marche.b4.r4': { // Le Bout du quai
    arch: 'deck', ao: { wx: 90 }, glow: '#E8C07A',
    props: [[Q.booth, 280, 480, 1.1], [Q.lamppost, 80, 500, 1.2], [Q.bollard, 180, 510], [Q.ropeCoil, 360, 515, 0.8], [Q.buoy, 40, 450], [Q.lampions, 0, 80, 1, { w: 250, c: 2, v: 1 }], [P.barrel, 360, 440, 0.7]],
    hide: [150, 450], secret: [280, 250],
    intro: 'Au bout du quai, une guérite vend des billets pour l’autre rive. Personne ne sait où elle est.',
  },

  // ---------------------------------------------------------------- Foyer
  'theatre.b1.r1': { // Le Vestiaire
    arch: 'foyer', glow: '#F4B45E',
    props: [[Q.counter, 195, 500, 1.1, { w: 260, v: 1 }], [S.coatRack, 60, 420, 1], [S.coatRack, 330, 420, 1, { c: 2 }], [P.coatHook, 195, 230, 1.3], [P.hang, 195, 110], [S.mask, 110, 405], [P.candle, 290, 405], [P.plant, 360, 520, 0.8]],
    hide: [250, 405], secret: [195, 330],
    intro: 'Tous les manteaux attendent leurs propriétaires. Le ticket numéro 0 n’a jamais été rendu.',
  },
  'theatre.b1.r2': { // Le Grand Escalier
    arch: 'foyer', glow: '#FFD98E',
    props: [[S.grandStair, 195, 500, 1.2], [P.chandelier, 195, 110, 1.1], [S.portrait, 60, 230], [S.portrait, 330, 230, 1, { c: 2 }], [P.plant, 40, 505], [P.plant, 350, 505], [P.sconce, 110, 150], [P.sconce, 280, 150]],
    hide: [120, 470], secret: [195, 300],
    intro: 'Le grand escalier monte vers les loges. Sur une marche, un gant de velours tombé en courant.',
  },
  'theatre.b1.r3': { // Le Bar
    arch: 'foyer', ao: { tint: '#4a2a3a' }, glow: '#E8C07A',
    props: [[S.barCounter, 195, 505, 1.1], [S.bottleShelf, 195, 230, 1.2], [P.stool, 60, 505], [P.stool, 330, 505], [P.hang, 100, 110], [P.hang, 290, 110]],
    hide: [300, 360], secret: [195, 140],
    intro: 'Les verres sont rangés, sauf un. Un verre de cristal, encore posé au bout du comptoir.',
  },
  'theatre.b1.r4': { // Les Loges
    arch: 'foyer', glow: '#F4B45E',
    props: [[S.boxSeat, 100, 260, 1], [S.boxSeat, 290, 260, 1], [S.boxSeat, 195, 440, 1.1], [P.hang, 195, 90], [P.candle, 40, 505], [P.candle, 350, 505]],
    hide: [60, 180], secret: [290, 170],
    intro: 'Des loges vides, rideaux tirés. Sur un fauteuil, un programme jauni de la dernière représentation.',
  },

  // ---------------------------------------------------------------- Coulisses
  'theatre.b2.r1': { // Les Cintres
    arch: 'backstage', glow: '#E8C07A',
    props: [[S.pulley, 90, 130], [S.pulley, 300, 140], [S.sandbags, 70, 300, 1.1], [S.sandbags, 320, 260, 1.1], [S.sandbags, 190, 200], [Q.ropeCoil, 195, 505, 1.2], [P.crate, 330, 505], [P.stool, 60, 505], [P.hang, 195, 110]],
    hide: [260, 470], secret: [195, 360],
    intro: 'Tout là-haut, les cordes tiennent les décors suspendus. Une poulie grince quand on respire.',
  },
  'theatre.b2.r2': { // Les Décors
    arch: 'backstage', glow: '#B8C8D8',
    props: [[S.flat, 90, 470, 1.1], [S.flat, 290, 470, 1.1, { v: 1 }], [S.cardMoon, 195, 180, 0.9], [P.crate, 195, 505], [P.stool, 360, 510, 0.9], [P.hang, 60, 120], [P.crate, 30, 440, 0.8], [Q.ropeCoil, 250, 520, 0.8]],
    hide: [40, 480], secret: [290, 330],
    intro: 'Des forêts peintes, des mers en carton. La lune du dernier acte pend encore au bout de son fil.',
  },
  'theatre.b2.r3': { // Les Accessoires
    arch: 'backstage', glow: '#E8C07A',
    props: [[S.propShelf, 110, 440, 1.2], [P.chest, 300, 505, 1.2, { v: 1 }], [S.mask, 300, 420], [P.hang, 250, 160], [S.coatRack, 360, 440, 0.9], [P.candle, 200, 510]],
    hide: [150, 360], secret: [300, 250],
    intro: 'Une couronne de papier, une épée en bois, un masque. Chaque objet attend son rôle.',
  },
  'theatre.b2.r4': { // La Machinerie
    arch: 'backstage', glow: '#D8B56A',
    props: [[S.winch, 110, 490, 1.3], [P.gearWall, 280, 300, 1, { w: 60 }], [P.gearWall, 330, 200, 1, { w: 30, c: 1 }], [S.crank, 300, 460, 0.8, { l: ['la roue de la trappe'] }], [P.oilCan, 200, 510], [P.hang, 200, 130]],
    hide: [60, 330], secret: [195, 420],
    intro: 'Sous la scène, les machines qui font voler les fantômes. Une manivelle manque à l’appel.',
  },

  // ---------------------------------------------------------------- Loge du Souffleur
  'theatre.b3.r1': { // Le Trou
    arch: 'stage', ao: { tint: '#2a2440' }, glow: '#F4B45E',
    props: [[S.prompterBox, 195, 470, 1.4], [S.footlights, 195, 500, 1], [P.bookStack, 60, 510, 0.9], [S.musicStand, 320, 470, 0.9], [P.hang, 195, 140], [P.candle, 110, 510], [S.boxSeat, 70, 250, 0.6], [S.boxSeat, 320, 250, 0.6]],
    hide: [240, 440], secret: [195, 260],
    intro: 'Le souffleur soufflait les répliques oubliées. Son cahier est ouvert à la bonne page.',
  },
  'theatre.b3.r2': { // Le Miroir
    arch: 'dressing', glow: '#FFE6B0',
    props: [[S.vanity, 195, 490, 1.2], [P.stool, 195, 510, 0.9], [S.coatRack, 50, 460, 0.9], [P.plant, 350, 510], [S.mask, 340, 250], [S.portrait, 50, 250]],
    hide: [150, 380], secret: [40, 150],
    intro: 'Le miroir aux ampoules. Les comédiens s’y maquillaient en se racontant qui ils allaient être.',
  },
  'theatre.b3.r3': { // La Malle
    arch: 'dressing', ao: { tint: '#3a2c44' }, glow: '#E7A98B',
    props: [[P.chest, 195, 500, 1.6, { v: 1 }], [S.mask, 150, 380, 1.1], [S.mask, 240, 380, 0.9], [S.coatRack, 50, 470], [P.hang, 195, 130], [P.candle, 340, 510], [S.portrait, 330, 230], [P.shelf, 80, 250, 1, { v: 2 }]],
    hide: [90, 505], secret: [195, 250],
    intro: 'Une malle pleine de visages. Un seul masque n’en a pas : on peut y mettre le sien.',
  },
  'theatre.b3.r4': { // Le Recoin
    arch: 'dressing', ao: { win: 'tall', wx: 300, wy: 150 }, glow: '#F4B45E',
    props: [[P.armchair, 110, 500, 1.2, { c: 5 }], [P.candle, 250, 505, 1.3], [P.bookStack, 330, 510], [P.shelf, 100, 250, 1, { v: 2 }], [P.hang, 195, 110], [S.coatRack, 340, 440, 0.8]],
    hide: [60, 440], secret: [200, 300],
    intro: 'Un coin tranquille pour répéter à la bougie. La chandelle a brûlé jusqu’au dernier mot.',
  },

  // ---------------------------------------------------------------- Grande Scène
  'theatre.b4.r1': { // L’Avant-scène
    arch: 'stage', glow: '#FFD98E',
    props: [[S.footlights, 195, 460, 1.2], [S.prompterBox, 195, 470, 0.8], [P.chandelier, 195, 130, 1], [S.boxSeat, 70, 330, 0.7], [S.boxSeat, 320, 330, 0.7]],
    hide: [120, 420], secret: [195, 280],
    intro: 'Le rideau de soie attend le premier rang. Il ne se lèvera que si toute la salle est éclairée.',
  },
  'theatre.b4.r2': { // La Fosse
    arch: 'stage', glow: '#FFD98E',
    props: [[S.musicStand, 90, 490, 1.2], [S.musicStand, 195, 500, 1.2], [S.musicStand, 300, 490, 1.2], [P.stool, 60, 520, 0.9], [P.stool, 330, 520, 0.9], [S.footlights, 195, 440, 1], [P.hang, 195, 160]],
    hide: [250, 510], secret: [195, 280],
    intro: 'Les pupitres de l’orchestre sont ouverts sur la même page. Le chef a laissé sa baguette.',
  },
  'theatre.b4.r3': { // Les Projecteurs
    arch: 'stage', glow: '#FFE6B0',
    props: [[S.spotlight, 70, 490, 1.2], [S.spotlight, 320, 490, 1.2, { f: true }], [S.footlights, 195, 450, 1], [P.hang, 195, 120], [P.crate, 195, 510], [S.musicStand, 120, 520, 0.7], [P.stool, 280, 520, 0.8], [P.candle, 350, 520]],
    hide: [260, 520], secret: [195, 260],
    intro: 'Deux projecteurs se regardent en chiens de faïence. Un filtre de couleur est tombé entre eux.',
  },
  'theatre.b4.r4': { // Le Plateau
    arch: 'stage', glow: '#EFE0C0',
    props: [[S.shadowScreen, 195, 440, 1.2], [S.spotlight, 60, 510, 0.9], [S.footlights, 195, 500, 1], [P.candle, 340, 510], [P.hang, 195, 110]],
    hide: [320, 470], secret: [195, 250],
    intro: 'Derrière l’écran, les ombres chinoises attendaient leur entrée. L’une d’elles est restée.',
  },
};
