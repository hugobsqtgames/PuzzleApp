// Rooms of the Observatoire and the Grenier de l’Allumeur.
import type { RoomSpec } from './index';
import * as P from './props1';
import * as Q from './props2';
import * as S from './props3';

export const OBS_GRENIER: Record<string, RoomSpec> = {
  // ---------------------------------------------------------------- Salle des Lentilles
  'obs.b1.r1': { // Le Polissoir
    arch: 'lab', ao: { wx: 300, wy: 150 }, glow: '#BFE6F0',
    props: [[S.polishBench, 150, 480, 1.35], [P.shelf, 110, 250, 1.2, { w: 120, c: 3 }], [S.mirrorStand, 330, 505, 0.9], [P.stool, 260, 510], [P.hang, 150, 150], [P.candle, 60, 505], [P.bookStack, 40, 440, 0.8], [P.sconce, 40, 200], [S.developer, 230, 520, 0.8]],
    hide: [90, 395], secret: [300, 330],
    intro: 'On polissait ici les lentilles de l’Astronome. La plus parfaite n’a jamais quitté l’établi.',
  },
  'obs.b1.r2': { // Le Prisme
    arch: 'lab', ao: { win: 'none', tint: '#1f2440' }, glow: '#EFE8D8',
    props: [[S.prism, 110, 420, 1.2], [P.table, 110, 480, 1.1, { w: 150 }], [S.mirrorStand, 330, 505, 1, { v: 20 }], [P.hang, 70, 150], [P.stool, 50, 510], [P.shelf, 300, 230, 1, { c: 5 }], [P.candle, 360, 520], [P.sconce, 200, 200]],
    hide: [290, 450], secret: [80, 280],
    intro: 'Un rayon entre, sept couleurs sortent. Quelqu’un en a mis un peu en bouteille.',
  },
  'obs.b1.r3': { // Les Miroirs
    arch: 'lab', ao: { win: 'tall', wx: 195, wy: 140 }, glow: '#BFE6F0',
    props: [[S.mirrorStand, 70, 490, 1.3, { v: -10, l: ['le grand miroir, à gauche'] }], [S.mirrorStand, 195, 510, 1.1, { v: 0, l: ['le miroir du milieu'] }], [S.mirrorStand, 320, 490, 1.3, { v: 15, l: ['le grand miroir, à droite'] }], [S.mirrorStand, 130, 400, 0.8, { v: 30, l: ['le petit miroir, à gauche'] }], [S.mirrorStand, 260, 400, 0.8, { v: -30, l: ['le petit miroir, à droite'] }], [P.hang, 90, 160], [P.hang, 300, 160], [P.bookStack, 360, 520, 0.8], [P.stool, 30, 520, 0.8]],
    hide: [360, 520], secret: [195, 300],
    intro: 'Les miroirs se renvoient une lumière qui n’existe plus. L’un d’eux est assez petit pour une poche.',
  },
  'obs.b1.r4': { // Le Banc d’optique
    arch: 'lab', ao: { wx: 300, wy: 140 }, glow: '#BFE6F0',
    props: [[S.opticalBench, 195, 490, 1], [P.shelf, 90, 230, 1.1, { c: 1 }], [P.stool, 60, 520], [P.candle, 340, 520], [P.hang, 195, 180], [S.starChart, 90, 330, 0.6], [S.celestialGlobe, 330, 432, 0.6], [P.sconce, 60, 440], [P.bookStack, 250, 525, 0.7]],
    hide: [200, 380], secret: [300, 330],
    intro: 'Sur le banc d’optique, un rayon a été capturé entre deux lentilles. Il tourne en rond, patiemment.',
  },

  // ---------------------------------------------------------------- Coupole
  'obs.b2.r1': { // Le Télescope
    arch: 'dome', glow: '#8FB8F0',
    props: [[S.bigTelescope, 210, 480, 1.1], [P.stool, 60, 510], [P.lectern, 340, 505, 0.9], [S.celestialGlobe, 110, 520, 0.7], [P.candle, 270, 520], [P.hang, 100, 250], [S.starChart, 300, 250, 0.6]],
    hide: [320, 410], secret: [80, 250],
    intro: 'Le grand télescope pointe vers une étoile qui n’est pas encore née.',
  },
  'obs.b2.r2': { // La Rotonde
    arch: 'dome', glow: '#8FB8F0',
    props: [[S.starChart, 100, 300, 0.9], [S.starChart, 290, 300, 0.9], [S.armillary, 195, 480, 1.2], [P.chair, 60, 510], [P.chair, 330, 510, 1, { f: true }], [P.hang, 195, 180], [P.candle, 140, 520], [P.candle, 250, 520]],
    hide: [120, 470], secret: [195, 360],
    intro: 'Les murs de la rotonde sont couverts d’étoiles. Une seule carte manque : celle du ciel de ce soir.',
  },
  'obs.b2.r3': { // Le Mécanisme
    arch: 'dome', glow: '#D8B56A',
    props: [[S.crank, 110, 380, 1.1], [P.gearWall, 290, 300, 1, { w: 60, c: 1 }], [P.gearWall, 330, 420, 1, { w: 30 }], [P.gearWall, 60, 250, 1, { w: 24 }], [P.oilCan, 195, 520], [P.toolBoard, 250, 180, 0.9], [P.stool, 300, 520], [P.candle, 40, 520]],
    hide: [60, 500], secret: [195, 260],
    intro: 'Cette manivelle fait tourner toute la coupole. Il faut tourner quatre cents fois pour un tour.',
  },
  'obs.b2.r4': { // L’Ouverture
    arch: 'dome', glow: '#EFE8D8',
    props: [[S.domeSlit, 195, 380, 1], [P.ladder, 110, 520, 1.1], [S.bigTelescope, 290, 520, 0.6], [P.stool, 360, 520, 0.8], [P.candle, 40, 520]],
    hide: [250, 140], secret: [300, 250],
    intro: 'Par la fente de la coupole, il tombe une poussière d’étoile. On peut la ramasser à la cuillère.',
  },

  // ---------------------------------------------------------------- Bibliothèque des Astres
  'obs.b3.r1': { // Les Almanachs
    arch: 'library', ao: { win: 'round', wx: 195, wy: 120, tint: '#24306a' }, glow: '#8FB8F0',
    props: [[S.almanacs, 90, 470, 1.1], [S.almanacs, 300, 470, 1.1], [P.stool, 195, 510], [P.hang, 195, 250], [P.candle, 195, 440]],
    hide: [300, 260], secret: [195, 330],
    intro: 'Un almanach pour chaque année. Le dernier est daté de l’an prochain, et il est déjà écrit.',
  },
  'obs.b3.r2': { // Les Globes célestes
    arch: 'library', ao: { win: 'none', tint: '#24306a' }, glow: '#8FB8F0',
    props: [[S.celestialGlobe, 90, 480, 1.3], [S.celestialGlobe, 300, 480, 1.3], [S.armillary, 195, 440, 0.9], [P.hang, 195, 180], [P.stool, 195, 520, 0.8], [P.stool, 50, 520, 0.8], [P.candle, 340, 520], [P.shelf, 195, 290, 1, { v: 2 }], [P.sconce, 60, 250], [P.sconce, 330, 250]],
    hide: [60, 330], secret: [195, 260],
    intro: 'Les globes montrent le ciel vu de dehors, comme si on était une étoile qui regarde Vesper.',
  },
  'obs.b3.r3': { // Les Registres
    arch: 'study', ao: { win: 'tall', wx: 300, wy: 140, tint: '#24306a' }, glow: '#F4B45E',
    props: [[P.desk, 150, 480, 1.4], [Q.ledger, 110, 378, 1.2], [P.candle, 190, 378], [P.chair, 40, 496], [P.bookStack, 320, 510], [S.starChart, 150, 200, 0.8], [P.drawers, 300, 480, 0.8], [P.hang, 290, 200], [P.sconce, 360, 330], [P.stool, 230, 525, 0.8]],
    hide: [240, 520], secret: [70, 280],
    intro: 'Le journal de bord de l’Astronome : « Nuit 14 602. Rien. Nuit 14 603. Une lueur, au Phare ! »',
  },
  'obs.b3.r4': { // Le Pupitre
    arch: 'study', ao: { win: 'round', wx: 195, wy: 130, tint: '#24306a' }, glow: '#8FB8F0',
    props: [[P.lectern, 195, 490, 1.4], [S.armillary, 60, 505, 0.8], [S.celestialGlobe, 330, 505, 0.8], [P.sconce, 80, 250], [P.sconce, 310, 250], [P.candle, 260, 520]],
    hide: [140, 510], secret: [195, 280],
    intro: 'Sur le pupitre, un compas d’étoiles attend qu’on trace la prochaine constellation.',
  },

  // ---------------------------------------------------------------- Chambre Noire
  'obs.b4.r1': { // Le Sténopé
    arch: 'dark', glow: '#E8744A',
    props: [[S.pinhole, 110, 460, 1.3], [P.table, 110, 490, 1.1, { w: 150 }], [S.plateRack, 320, 505, 0.8], [S.safelight, 250, 120], [P.stool, 220, 520], [S.clothesline, 20, 200, 1, { w: 350 }], [S.developer, 330, 432], [P.candle, 360, 520], [P.shelf, 100, 300, 1, { c: 5 }], [P.sconce, 30, 400]],
    hide: [340, 330], secret: [195, 250],
    intro: 'Une boîte percée d’un trou d’épingle. Dedans, l’image de Vesper, la tête en bas.',
  },
  'obs.b4.r2': { // Les Plaques
    arch: 'dark', glow: '#E8744A',
    props: [[S.plateRack, 100, 490, 1.2], [S.plateRack, 300, 490, 1.2], [S.safelight, 195, 110], [P.stool, 195, 520], [S.clothesline, 20, 190, 1, { w: 350 }], [S.developer, 195, 432], [P.candle, 40, 520], [P.candle, 350, 520], [P.shelf, 195, 300, 1, { v: 2 }]],
    hide: [250, 380], secret: [100, 250],
    intro: 'Des plaques de verre où la nuit s’est imprimée. Sur l’une, on devine le visage de l’Allumeur.',
  },
  'obs.b4.r3': { // Le Bain
    arch: 'dark', glow: '#E8744A',
    props: [[S.trays, 195, 490, 1.2], [S.safelight, 100, 120], [S.safelight, 290, 120], [S.developer, 195, 300, 1.2], [P.stool, 50, 520], [S.clothesline, 20, 190, 1, { w: 350 }], [P.candle, 340, 520], [P.shelf, 195, 310, 1.2, { w: 140, v: 2 }]],
    hide: [320, 520], secret: [195, 200],
    intro: 'Dans les bains, les images apparaissent lentement. Un flacon contient un peu de nuit.',
  },
  'obs.b4.r4': { // Le Rideau
    arch: 'dark', glow: '#EFE8D8',
    props: [[S.heavyCurtain, 250, 480, 1], [P.chair, 70, 500], [S.safelight, 80, 140], [P.candle, 140, 520], [S.clothesline, 20, 190, 1, { w: 180 }], [S.developer, 90, 420, 0.8], [P.stool, 50, 520, 0.9], [P.shelf, 100, 330, 1, { v: 2 }]],
    hide: [120, 420], secret: [80, 300],
    intro: 'Par la fente du rideau passe un rayon de lune. Quelqu’un l’a plié en quatre pour le garder.',
  },

  // ---------------------------------------------------------------- Grenier de l’Allumeur
  'grenier.b1.r1': { // Le Grenier
    arch: 'attic', ao: { wx: 195, wy: 90 }, glow: '#FFD98E',
    props: [[P.rug, 195, 510, 1, { w: 260 }], [S.rockingChair, 90, 490, 1.2], [P.chest, 300, 505, 1.2], [S.letters, 300, 438], [S.oldLamp, 195, 520, 1.1], [P.bookStack, 360, 440, 0.8], [P.hang, 110, 190], [P.hang, 280, 190],
      [P.coatHook, 195, 200], [S.portrait, 330, 300, 0.9], [P.wallClock, 60, 300, 0.8], [P.crate, 30, 520, 0.8], [P.candle, 240, 520], [P.shelf, 195, 290, 1, { v: 2 }], [P.barrel, 360, 520, 0.8], [P.stool, 150, 520, 0.8], [S.almanacs, 40, 432, 0.5], [P.oilCan, 250, 470]],
    hide: [160, 330], secret: [195, 250],
    intro: 'Le grenier de l’Allumeur. Tout est resté comme au dernier soir : la lampe, les lettres, le fauteuil qui se balance encore.',
  },
};
