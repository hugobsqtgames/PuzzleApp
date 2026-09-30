// Rooms of the Phare and of the Bibliothèque Murmurante.
import type { RoomSpec } from './index';
import * as P from './props1';
import * as Q from './props2';
import * as S from './props3';

export const PHARE_BIBLIO: Record<string, RoomSpec> = {
  // ---------------------------------------------------------------- Le Phare
  'phare.b1.r1': { // La Cuisine
    arch: 'tower', ao: { win: 'porthole', wx: 300, wy: 120 },
    props: [[P.rug, 205, 510, 1, { w: 260 }], [P.stove, 76, 440, 1.35], [P.potRack, 185, 70, 1.15], [P.shelf, 300, 250, 1.2, { w: 100 }], [P.table, 222, 480, 1.25, { w: 170 }],
      [P.teapot, 262, 397, 1.2], [P.breadBasket, 184, 397, 1.2], [P.chair, 352, 490, 1.1], [P.wallClock, 110, 150, 0.9], [P.plant, 330, 250, 0.9]],
    slots: [0, 2, 4, 7, 8, 9],
    hide: [104, 480], secret: [196, 190],
    intro: 'La bouilloire attend sur le poêle froid. Nilo reconnaît l’odeur du thé de l’Allumeur.',
  },
  'phare.b1.r2': { // L’Escalier
    arch: 'tower', ao: { win: 'porthole', wx: 92, wy: 120 },
    props: [[P.spiral, 210, 450, 1.15], [P.sconce, 58, 262, 1.2], [P.sconce, 340, 140, 1.2], [P.crate, 330, 486, 1.2], [P.oilCan, 60, 486, 1.2], [P.bookStack, 124, 490]],
    hide: [300, 230], secret: [262, 360],
    intro: 'Cent douze marches. Nilo les a montées chaque soir avec la mèche, sans jamais en rater une.',
  },
  'phare.b1.r3': { // La Chambre de veille
    arch: 'tower', ao: { win: 'porthole', wx: 195, wy: 112 },
    props: [[P.rug, 190, 510, 1, { w: 220, v: 1 }], [P.bed, 110, 486, 1.25], [P.desk, 290, 450, 1.25], [P.candle, 256, 362, 1.2], [P.coatHook, 72, 205, 1.1], [P.chair, 342, 496, 1.1], [S.starChart, 312, 205, 0.85]],
    hide: [60, 450], secret: [195, 210],
    intro: 'Le carnet de veille s’arrête au milieu d’une phrase : « Ce soir, la lumière ».',
  },
  'phare.b1.r4': { // La Lanterne
    arch: 'lamp', glow: '#FFD98E',
    props: [[Q.ropeCoil, 70, 496], [P.lensBig, 195, 452, 1.15], [P.oilCan, 330, 496, 1.2, { c: 3 }], [P.stool, 336, 446], [P.oilCan, 52, 446]],
    slots: [1, 2, 3, 5, 0, 6],
    hide: [120, 480], secret: [300, 300],
    intro: 'La grande lentille est éteinte. Toute la baie attend qu’elle se rallume.',
  },

  // ---------------------------------------------------------------- Salle des Cartes
  'biblio.b1.r1': { // Le Globe
    arch: 'library', ao: { win: 'arch', wx: 195, wy: 130 }, glow: '#E7A98B',
    props: [[P.rug, 195, 505, 1, { w: 280 }], [P.globe, 195, 470, 1.45], [P.stool, 70, 490, 1.1], [P.bookStack, 330, 490, 1.1], [P.hang, 90, 240], [P.hang, 300, 240], [P.chair, 330, 440],
      [P.candle, 70, 436]],
    hide: [262, 470], secret: [120, 312],
    intro: 'Le grand globe tourne encore d’un quart de tour quand on entre. Personne ne le pousse.',
  },
  'biblio.b1.r2': { // Les Portulans
    arch: 'library', ao: { win: 'tall', wx: 195, wy: 150 }, glow: '#E7A98B',
    props: [[P.mapTable, 195, 480, 1.35], [P.drawers, 328, 480, 0.9], [P.bookStack, 250, 508, 0.9], [P.sconce, 330, 240], [P.hang, 195, 250], [P.stool, 60, 492], [S.starChart, 64, 260, 0.7], [P.candle, 110, 381]],
    hide: [300, 360], secret: [300, 250],
    intro: 'Des cartes de côtes qui n’existent plus. Ou pas encore, dit l’Archiviste.',
  },
  'biblio.b1.r3': { // La Table des vents
    arch: 'study', ao: { win: 'round', wx: 195, wy: 120 }, glow: '#E7A98B',
    props: [[P.table, 195, 470, 1.5, { v: 1, w: 200 }], [P.windrose, 195, 372, 0.85], [P.chair, 60, 486, 1.1], [P.chair, 330, 486, 1.1, { f: true }], [P.sconce, 64, 220, 1.2], [P.sconce, 326, 220, 1.2], [P.hang, 195, 250]],
    slots: [2, 0, 1, 3, 4, 5, 6, 7, 8],
    hide: [150, 480], secret: [300, 150],
    intro: 'Quatre vents brodés autour de la table. Le cinquième, celui du nord, a été découpé.',
  },
  'biblio.b1.r4': { // Le Balcon
    arch: 'balcony', ao: { wx: 300 }, glow: '#E7A98B',
    props: [[P.spyglass, 250, 470, 1.35], [P.chair, 80, 486, 1.15], [P.plant, 30, 380], [P.plant, 360, 380, 1, { f: true }], [P.lectern, 150, 486], [P.candle, 340, 480], [P.hang, 195, 120, 0.9], [S.celestialGlobe, 330, 508, 0.7], [Q.lamppost, 372, 440, 0.8, { f: true }], [P.bookStack, 250, 525, 0.7]],
    hide: [110, 440], secret: [195, 240],
    intro: 'D’ici, on voit tout Vesper. Il manque encore beaucoup de fenêtres allumées.',
  },

  // ---------------------------------------------------------------- Scriptorium
  'biblio.b2.r1': { // Les Pupitres
    arch: 'study', ao: { win: 'tall', wx: 195, wy: 140 }, glow: '#F4B45E',
    props: [[P.writingDesk, 90, 470, 1.25], [P.writingDesk, 300, 470, 1.25, { f: true }], [P.candle, 60, 377], [P.candle, 330, 377], [P.hang, 195, 280], [P.stool, 195, 500, 1.1], [P.bookStack, 360, 500, 0.9]],
    hide: [195, 410], secret: [70, 230],
    intro: 'Deux pupitres se font face. Sur l’un, une plume est encore posée comme si on allait revenir.',
  },
  'biblio.b2.r2': { // L’Atelier d’enluminure
    arch: 'study', ao: { win: 'arch', wx: 290, wy: 140 }, glow: '#FFD98E',
    props: [[P.easel, 110, 480, 1.35], [P.table, 280, 480, 1.2, { w: 150 }], [P.paintPots, 280, 400, 1.1], [P.shelf, 280, 260, 1.1, { v: 0, c: 4 }], [P.candle, 330, 400], [P.stool, 180, 500], [P.bookStack, 360, 508, 0.8], [P.hang, 195, 190], [P.sconce, 60, 300]],
    hide: [240, 400], secret: [60, 240],
    intro: 'La feuille d’or ne se colle qu’en retenant son souffle. Le moindre murmure l’emporte.',
  },
  'biblio.b2.r3': { // La Reliure
    arch: 'study', ao: { win: 'none' }, glow: '#E7A98B',
    props: [[P.bookPress, 110, 470, 1.3], [P.table, 280, 480, 1.25, { w: 160 }], [P.bookStack, 250, 400], [P.bookStack, 316, 400, 0.9, { c: 3 }], [P.shelf, 280, 230, 1.2, { v: 2 }], [P.shelf, 100, 200, 1.1, { v: 2, c: 4 }], [P.hang, 195, 220]],
    hide: [50, 490], secret: [195, 150],
    intro: 'Des livres en attente d’une couverture. Certains n’ont que la première page.',
  },
  'biblio.b2.r4': { // Le Cabinet des brouillons
    arch: 'study', ao: { win: 'tall', wx: 80, wy: 160 }, glow: '#E7A98B',
    props: [[P.drawers, 300, 480, 1.1], [P.wastebasket, 180, 490, 1.2], [P.writingDesk, 90, 480, 1.1], [P.candle, 64, 400], [P.hang, 195, 230], [S.letters, 210, 432]],
    hide: [150, 470], secret: [195, 150],
    intro: 'Mille brouillons froissés. L’Archiviste dit qu’un seul contient la bonne idée.',
  },

  // ---------------------------------------------------------------- Tour des Archives
  'biblio.b3.r1': { // Le Pied de la tour
    arch: 'tower', ao: { win: 'none' }, glow: '#E7A98B',
    props: [[P.door, 195, 440, 1.2], [P.lectern, 80, 480, 1.2], [Q.ledger, 80, 358], [P.sconce, 110, 230, 1.2], [P.sconce, 280, 230, 1.2], [P.crate, 320, 486], [P.bookStack, 360, 440, 0.8], [P.coatHook, 316, 150], [P.stool, 140, 508], [P.hang, 195, 110], [P.barrel, 40, 400, 0.8]],
    hide: [260, 480], secret: [320, 330],
    intro: 'Le registre des lumières est ouvert à la dernière page. Chaque lanterne allumée y laisse une ligne.',
  },
  'biblio.b3.r2': { // Les Rayonnages
    arch: 'library', ao: { win: 'none' }, glow: '#E7A98B',
    props: [[P.bookcase, 80, 470, 1.1], [P.bookcase, 195, 450, 1.05], [P.bookcase, 310, 470, 1.1], [P.stool, 140, 505], [P.bookStack, 260, 505, 0.9]],
    slots: [0, 1, 2, 3, 4, 5, 6, 7],
    hide: [62, 330], secret: [195, 120],
    intro: 'Les étiquettes sont effacées. Il faut ouvrir chaque livre pour savoir ce qu’il raconte.',
  },
  'biblio.b3.r3': { // L’Échelle
    arch: 'library', ao: { win: 'tall', wx: 195, wy: 130 }, glow: '#E7A98B',
    props: [[P.ladder, 250, 460, 1.2], [P.bookcase, 60, 470, 1.1], [P.bookcase, 340, 470, 1.1, { w: 80 }], [P.bookStack, 170, 490], [P.hang, 195, 260]],
    hide: [60, 250], secret: [150, 330],
    intro: 'L’échelle roule le long des murs. Tout en haut, un marque-page attend une main assez grande.',
  },
  'biblio.b3.r4': { // Le Sommet
    arch: 'tower', ao: { win: 'round', wx: 195, wy: 130 }, glow: '#E7A98B',
    props: [[P.desk, 195, 470, 1.35], [P.candle, 150, 374, 1.1], [P.hourglass, 230, 374, 1.1], [P.chair, 70, 486, 1.1], [P.bookStack, 340, 490], [P.sconce, 60, 230, 1.2], [P.sconce, 330, 230, 1.2], [S.starChart, 300, 140, 0.6]],
    hide: [262, 360], secret: [195, 250],
    intro: 'La plus haute pièce de la tour. L’Archiviste y venait lire ce qu’il ne fallait pas oublier.',
  },

  // ---------------------------------------------------------------- Salle de Lecture
  'biblio.b4.r1': { // Les Fauteuils
    arch: 'study', ao: { win: 'tall', wx: 195, wy: 150 }, glow: '#F4B45E',
    props: [[P.rug, 195, 505, 1, { w: 300 }], [P.armchair, 90, 480, 1.3], [P.armchair, 300, 480, 1.3, { f: true, c: 3 }], [P.floorLamp, 195, 480, 1.1], [P.bookStack, 195, 505, 0.8], [P.sconce, 60, 220], [P.sconce, 330, 220], [S.portrait, 340, 330]],
    hide: [60, 420], secret: [300, 270],
    intro: 'Deux fauteuils creusés par des années de lecture. L’un d’eux garde encore la forme d’un chat.',
  },
  'biblio.b4.r2': { // La Cheminée
    arch: 'study', ao: { win: 'none' }, glow: '#E8744A',
    props: [[P.fireplace, 195, 450, 1.3], [P.armchair, 60, 500, 1.1], [S.portrait, 195, 150, 1.1], [P.candle, 100, 272], [P.candle, 290, 272], [P.armchair, 330, 500, 1.1, { f: true, c: 5 }], [P.shelf, 60, 330, 1, { v: 2 }], [P.shelf, 330, 330, 1, { v: 2, c: 3 }], [P.bookStack, 130, 510, 0.8]],
    hide: [250, 440], secret: [60, 200],
    intro: 'Sous les cendres, une braise refuse de s’éteindre depuis des années.',
  },
  'biblio.b4.r3': { // Les Vitraux
    arch: 'study', ao: { win: 'stained', wx: 195, wy: 160 }, glow: '#8FB8F0',
    props: [[P.vitrail, 70, 280, 1.3], [P.vitrail, 320, 280, 1.3, { c: 2 }], [P.lectern, 195, 480, 1.2], [P.chair, 90, 486], [P.chair, 300, 486, 1, { f: true }], [P.candle, 150, 470], [P.candle, 240, 470]],
    hide: [320, 150], secret: [195, 300],
    intro: 'Quand la lune passe derrière les vitraux, la salle se couvre de couleurs. Il manque un éclat bleu.',
  },
  'biblio.b4.r4': { // La Réserve
    arch: 'library', ao: { win: 'none' }, glow: '#E7A98B',
    props: [[P.crate, 70, 480, 1.3], [P.crate, 90, 424, 1.1], [P.chest, 300, 486, 1.3], [P.bookStack, 200, 490], [P.bookStack, 240, 440, 0.8, { c: 5 }], [P.hang, 195, 240], [P.barrel, 360, 420, 0.9]],
    hide: [180, 470], secret: [300, 150],
    intro: 'Des caisses de livres jamais rangés. Dans l’une d’elles, un livre qui n’existe dans aucun catalogue.',
  },
};
