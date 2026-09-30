// Rooms of the Horlogerie and of the Serre de Verre.
import type { RoomSpec } from './index';
import * as P from './props1';
import * as Q from './props2';
import * as S from './props3';

export const HORLO_SERRE: Record<string, RoomSpec> = {
  // ---------------------------------------------------------------- Atelier des Ressorts
  'horlo.b1.r1': { // La Forge
    arch: 'workshop', ao: { win: 'none' }, glow: '#E8744A',
    props: [[P.forge, 110, 460, 1.3], [P.anvil, 270, 486, 1.3], [P.bellows, 200, 380, 1.1], [P.toolBoard, 300, 210, 1.1], [P.barrel, 360, 486, 0.9], [P.hang, 260, 120], [P.sconce, 40, 150, 1.2],
      [Q.coins, 40, 510, 0.8], [P.hourglass, 230, 150, 1.1], [P.crate, 180, 510, 0.9]],
    hide: [320, 470], secret: [120, 120],
    intro: 'La forge a gardé une odeur de fer chaud. Sur l’enclume, un sablier attend qu’on le retourne.',
  },
  'horlo.b1.r2': { // L’Établi — the prototype's room
    arch: 'workshop', ao: { win: 'arch', wx: 196, wy: 150 },
    props: [[P.grandfather, 63, 332], [P.hang, 195, 70], [P.gearWall, 104, 96], [P.shelf, 330, 150], [P.workbench, 195, 400], [P.shelf, 330, 258, 1, { c: 4 }], [P.chest, 328, 440], [P.stool, 70, 462]],
    slots: [0, 1, 2, 3, 12, 4, 5, 6, 7, 8],
    hide: [150, 450], secret: [250, 200],
    intro: 'L’établi de l’Horlogère. Chaque tiroir contient une pièce qui n’a pas encore trouvé sa montre.',
  },
  'horlo.b1.r3': { // Le Magasin
    arch: 'workshop', ao: { win: 'none' }, glow: '#F4B45E',
    props: [[P.drawers, 90, 470, 1.25], [P.drawers, 300, 470, 1.25, { f: true }], [P.crate, 195, 500, 1.2], [P.crate, 195, 447, 0.9], [P.hang, 195, 160], [P.shelf, 195, 300, 1.1, { c: 2 }],
      [P.gearWall, 195, 80, 1, { w: 20 }], [P.sconce, 30, 180], [P.sconce, 360, 180]],
    hide: [260, 505], secret: [195, 230],
    intro: 'Mille tiroirs, mille petites choses. L’inventaire s’arrête à la vis numéro 4 211.',
  },
  'horlo.b1.r4': { // La Mansarde
    arch: 'attic', ao: { wx: 195, wy: 90 }, glow: '#F4B45E',
    props: [[P.rug, 195, 505, 1, { w: 220 }], [P.bed, 120, 486, 1.1], [P.chest, 300, 490, 1.1], [P.candle, 300, 432], [P.coatHook, 195, 230], [P.wallClock, 80, 250, 0.8], [P.stool, 360, 500, 0.9], [P.bookStack, 250, 510, 0.8], [P.plant, 220, 432, 0.8]],
    hide: [60, 470], secret: [300, 230],
    intro: 'Sous le toit, une clé de remontoir pend à un clou. Elle remonte quelque chose, mais quoi ?',
  },

  // ---------------------------------------------------------------- Tour du Carillon
  'horlo.b2.r1': { // Le Vestibule
    arch: 'belfry', ao: { win: 'none' }, glow: '#E8C07A',
    props: [[P.door, 195, 440, 1.15], [Q.bench, 70, 490], [Q.ropeCoil, 330, 500], [P.sconce, 120, 240, 1.2], [P.sconce, 270, 240, 1.2], [P.coatHook, 320, 180], [S.sandbags, 60, 300], [P.hang, 195, 110], [P.crate, 360, 440, 0.8]],
    hide: [150, 505], secret: [70, 180],
    intro: 'Une corde descend du plafond. En tirant, on entend très loin une cloche qui répond.',
  },
  'horlo.b2.r2': { // Les Rouages
    arch: 'workshop', ao: { win: 'round', wx: 300, wy: 110 }, glow: '#D8B56A',
    props: [[P.gearWall, 110, 200, 1, { w: 70 }], [P.gearWall, 230, 300, 1, { w: 50, c: 1 }], [P.gearWall, 320, 230, 1, { w: 34 }], [P.gearWall, 90, 360, 1, { w: 30, c: 1 }], [P.gearWall, 330, 380, 1, { w: 44 }],
      [P.gearWall, 190, 120, 1, { w: 26, c: 1 }], [S.crank, 195, 470, 0.8, { l: ['la manivelle'] }], [P.oilCan, 60, 500], [P.vise, 340, 510]],
    hide: [260, 480], secret: [165, 380],
    intro: 'Les rouages tournent au ralenti, comme un cœur qui dort. Un engrenage d’argent s’est détaché.',
  },
  'horlo.b2.r3': { // La Salle des Cloches
    arch: 'belfry', ao: { win: 'twin', wx: 195, wy: 330 }, glow: '#D8B56A',
    props: [[P.bell, 195, 170, 1.4], [P.bell, 80, 240, 0.9, { c: 1 }], [P.bell, 310, 240, 0.9], [P.bell, 140, 110, 0.6], [P.bell, 255, 110, 0.6, { c: 1 }], [Q.ropeCoil, 60, 500], [P.stool, 330, 500]],
    hide: [240, 480], secret: [195, 420],
    intro: 'Cinq cloches, cinq notes. Autrefois, elles jouaient l’heure en chantant.',
  },
  'horlo.b2.r4': { // Le Belvédère
    arch: 'balcony', ao: { wx: 90 }, glow: '#E8C07A',
    props: [[P.clockFace, 280, 230, 0.75], [P.spyglass, 120, 470, 1.1], [Q.bench, 290, 500, 0.9], [P.plant, 40, 380], [P.candle, 200, 500], [P.hang, 110, 120]],
    hide: [60, 480], secret: [280, 230],
    intro: 'Le dos de la grande horloge donne sur la ville. L’aiguille des minutes est tombée ici.',
  },

  // ---------------------------------------------------------------- Salle des Pendules
  'horlo.b3.r1': { // Le Balancier
    arch: 'clockhall', glow: '#D8B56A',
    props: [[P.bigPendulum, 195, 330, 1.3], [P.grandfather, 60, 440, 1], [P.grandfather, 330, 440, 1], [P.wallClock, 120, 150], [P.wallClock, 270, 150, 1, { c: 1, v: 3 }], [P.stool, 195, 505], [P.candle, 110, 505], [P.candle, 280, 505]],
    hide: [240, 470], secret: [195, 150],
    intro: 'Le grand balancier ne bat plus. Toutes les pendules de la salle attendent son signal.',
  },
  'horlo.b3.r2': { // Le Cadran
    arch: 'clockhall', glow: '#FFD98E',
    props: [[P.clockFace, 195, 250, 1.1], [P.ladder, 330, 500, 0.9], [P.stool, 60, 505], [P.oilCan, 110, 505], [P.candle, 250, 505], [P.sconce, 40, 150], [P.sconce, 350, 150]],
    hide: [120, 380], secret: [290, 150],
    intro: 'Un cadran plus grand qu’une porte. Le VII a disparu : il reste sa trace plus claire.',
  },
  'horlo.b3.r3': { // Le Coucou
    arch: 'clockhall', glow: '#E8C07A', ao: { tint: '#2f3a30' },
    props: [[P.cuckoo, 90, 200, 1.1], [P.cuckoo, 300, 180], [P.cuckoo, 195, 300, 1.2], [P.cuckoo, 70, 380, 0.8], [P.cuckoo, 320, 350, 0.9], [P.chair, 195, 505], [P.plant, 340, 505], [P.stool, 60, 505], [P.hang, 195, 150], [P.wallClock, 330, 470, 0.7], [P.candle, 120, 505]],
    hide: [260, 250], secret: [195, 150],
    intro: 'Tous les coucous sont sortis en même temps, le soir où Vesper s’est éteinte. Aucun n’est rentré.',
  },
  'horlo.b3.r4': { // L’Horloge lunaire
    arch: 'clockhall', ao: { win: 'round', wx: 300, wy: 130 }, glow: '#BFE6F0',
    props: [[P.moonClock, 140, 470, 1.25], [S.starChart, 310, 290, 0.7], [P.lectern, 310, 500], [P.candle, 60, 505], [P.stool, 250, 505]],
    hide: [60, 300], secret: [310, 290],
    intro: 'Elle ne donne pas l’heure : elle donne la lune. Ce soir, elle indique « pleine ».',
  },

  // ---------------------------------------------------------------- Chambre des Automates
  'horlo.b4.r1': { // Les Poupées
    arch: 'study', ao: { win: 'none', tint: '#3a2c44' }, glow: '#E7A98B',
    props: [[P.shelf, 100, 180, 1.2, { w: 120 }], [P.shelf, 290, 260, 1.2, { w: 120 }], [P.doll, 70, 180, 1, { c: 2 }], [P.doll, 130, 180, 1, { c: 5 }], [P.doll, 260, 260, 1, { c: 0 }], [P.doll, 320, 260, 1, { c: 3 }],
      [P.doll, 195, 505, 1.4, { c: 1 }], [P.rug, 195, 510, 1, { w: 200 }], [P.chest, 320, 505], [P.hang, 195, 110], [P.stool, 70, 505]],
    hide: [60, 470], secret: [195, 330],
    intro: 'Les poupées ont toutes la tête tournée vers la porte, comme si elles attendaient quelqu’un.',
  },
  'horlo.b4.r2': { // Le Joueur d’échecs
    arch: 'study', ao: { win: 'tall', wx: 300, wy: 140 }, glow: '#F4B45E',
    props: [[P.chessAutomaton, 150, 470, 1.3], [P.chair, 50, 486, 1.1], [P.candle, 320, 505], [P.hang, 110, 150], [P.shelf, 300, 300, 1, { v: 2 }], [P.wallClock, 60, 250, 0.7]],
    hide: [280, 480], secret: [195, 150],
    intro: 'La partie s’est arrêtée au milieu. Il manque un cavalier noir sur l’échiquier.',
  },
  'horlo.b4.r3': { // La Danseuse
    arch: 'dressing', ao: { tint: '#3a2c44' }, glow: '#E7A98B',
    props: [[P.table, 195, 486, 1.3, { v: 1, w: 150 }], [P.musicBox, 195, 400, 1.3], [P.sconce, 60, 220], [P.sconce, 330, 220], [S.portrait, 195, 150], [P.armchair, 50, 510, 0.9], [P.candle, 340, 505], [P.plant, 330, 432, 0.8]],
    hide: [120, 505], secret: [300, 150],
    intro: 'La danseuse s’est arrêtée sur la pointe d’un pied. Il faudrait la clé de sa musique.',
  },
  'horlo.b4.r4': { // Le Cœur de l’automate
    arch: 'workshop', ao: { win: 'none' }, glow: '#E88A8A',
    props: [[P.mechHeart, 195, 320, 1.3], [P.gearWall, 60, 440, 1, { w: 30 }], [P.gearWall, 330, 440, 1, { w: 36, c: 1 }], [P.oilCan, 195, 505], [P.toolBoard, 330, 150, 0.8], [P.stool, 120, 505], [P.vise, 270, 510]],
    hide: [60, 150], secret: [195, 440],
    intro: 'Le plus grand automate de Vesper n’a pas de corps. Juste un cœur, qui a oublié comment battre.',
  },

  // ---------------------------------------------------------------- Orangerie
  'serre.b1.r1': { // Les Orangers
    arch: 'glass', glow: '#F09A4A',
    props: [[Q.orangeTree, 90, 470, 1.15, { v: 2 }], [Q.orangeTree, 300, 470, 1.15], [Q.orangeTree, 195, 400, 0.8, { v: 4 }], [Q.wateringCan, 195, 505, 1.1], [Q.pot, 360, 505, 0.8, { v: 2 }], [Q.pot, 30, 505, 0.8, { v: 2, c: 3 }]],
    hide: [128, 318], secret: [195, 470],
    intro: 'Les orangers ont gardé leurs fruits tout l’hiver. L’un d’eux est en verre, et il sonne quand on le touche.',
  },
  'serre.b1.r2': { // La Fontaine
    arch: 'glass', glow: '#8FD3E0',
    props: [[Q.fountain, 195, 480, 1.2], [Q.pot, 50, 440, 1.1], [Q.pot, 340, 440, 1.1, { v: 2 }], [Q.bench, 60, 510, 0.8], [Q.frog, 300, 500], [Q.lilypad, 150, 464, 0.6]],
    hide: [260, 460], secret: [195, 250],
    intro: 'La fontaine s’est arrêtée au milieu d’un jet. Une goutte est restée suspendue, là, en l’air.',
  },
  'serre.b1.r3': { // Les Bancs
    arch: 'garden', glow: '#9CCB8A',
    props: [[Q.bench, 100, 480, 1.1], [Q.bench, 290, 480, 1.1, { f: true }], [Q.pot, 195, 480, 1, { v: 1 }], [Q.lamppost, 30, 510, 0.9], [Q.lamppost, 360, 510, 0.9, { f: true }], [Q.wateringCan, 195, 515], [Q.moonFlower, 150, 420, 0.8], [Q.pot, 250, 430, 0.8, { v: 2 }]],
    hide: [140, 500], secret: [195, 200],
    intro: 'Sur chaque banc, une plaque : « Assieds-toi, et regarde pousser. » Quelqu’un a planté une graine qui brille.',
  },
  'serre.b1.r4': { // La Verrière
    arch: 'glass', glow: '#B79CE0', ao: { tint: '#4a3a7a' },
    props: [[Q.walkway, 195, 200], [Q.vine, 60, 0, 1, { w: 180 }], [Q.vine, 330, 0, 1, { w: 140 }], [Q.pot, 90, 470, 1.2, { v: 2, c: 5 }], [Q.pot, 300, 470, 1.2], [Q.wateringCan, 195, 505], [P.ladder, 195, 432, 0.8]],
    hide: [320, 150], secret: [195, 120],
    intro: 'Un carreau de la verrière décompose la lune en couleurs. Il n’y a pas de nom pour certaines d’entre elles.',
  },

  // ---------------------------------------------------------------- Bassin aux Nénuphars
  'serre.b2.r1': { // La Rive
    arch: 'pond', ao: { floor: 440 }, glow: '#7FC8A9',
    props: [[Q.reeds, 60, 480, 1.2], [Q.reeds, 340, 470], [Q.rock, 150, 500, 1.3], [Q.rock, 270, 510], [Q.lilypad, 220, 400, 0.8], [Q.lilypad, 110, 360, 0.6, { v: 1 }], [Q.frog, 150, 440], [Q.lamppost, 330, 360, 0.8, { f: true }], [Q.shell, 330, 520, 0.8], [Q.lilypad, 300, 450, 0.7], [Q.reeds, 250, 330, 0.6]],
    hide: [220, 470], secret: [300, 300],
    intro: 'Un galet est tiède sous la main. Il se souvient d’un soleil que personne n’a vu depuis longtemps.',
  },
  'serre.b2.r2': { // Le Ponton
    arch: 'pond', ao: { floor: 440 }, glow: '#7FC8A9',
    props: [[Q.pier, 150, 430, 1.1], [Q.rowboat, 290, 490, 1.1], [Q.lamppost, 60, 430, 0.9], [Q.bollard, 250, 430], [Q.lilypad, 80, 510, 0.6], [Q.reeds, 350, 400, 0.8], [Q.ropeCoil, 110, 470, 0.7], [Q.buoy, 200, 520], [Q.frog, 330, 440], [Q.lilypad, 320, 360, 0.6, { v: 1 }]],
    hide: [190, 470], secret: [60, 250],
    intro: 'La barque attend une rame. La grenouille jure qu’elle l’a vue passer, toute petite.',
  },
  'serre.b2.r3': { // Les Nénuphars
    arch: 'pond', ao: { floor: 440 }, glow: '#F0B8C8',
    props: [[Q.lilypad, 80, 470, 1.1, { v: 1 }], [Q.lilypad, 210, 420, 1], [Q.lilypad, 320, 490, 1.2, { v: 1 }], [Q.lilypad, 150, 520, 0.9], [Q.lilypad, 300, 380, 0.7, { v: 1 }], [Q.lilypad, 90, 360, 0.6], [Q.frog, 210, 410], [Q.reeds, 30, 360, 0.8], [Q.reeds, 352, 330, 0.7], [Q.lilypad, 230, 330, 0.5, { v: 1 }], [Q.rock, 40, 520, 0.8]],
    hide: [260, 500], secret: [195, 250],
    intro: 'Les fleurs de nénuphar s’ouvrent quand on leur chuchote quelque chose. Nilo essaie « s’il te plaît ».',
  },
  'serre.b2.r4': { // Le Fond du bassin
    arch: 'under', glow: '#8FD3E0',
    props: [[Q.seaweed, 60, 470, 1.2], [Q.seaweed, 330, 460], [Q.fish, 150, 200, 1.3, { c: 1 }], [Q.fish, 280, 280, 1, { c: 3, f: true }], [Q.fish, 110, 330, 0.8, { c: 4 }], [Q.rock, 195, 480, 1.3], [Q.shell, 280, 470], [Q.shell, 110, 490, 0.8], [P.chest, 250, 505, 0.8], [Q.fish, 300, 150, 0.8, { c: 6, f: true }]],
    hide: [150, 490], secret: [195, 360],
    intro: 'Au fond du bassin, la lumière arrive en longs rubans. Un poisson de verre y nage sans eau.',
  },

  // ---------------------------------------------------------------- Pépinière
  'serre.b3.r1': { // Les Semis
    arch: 'glass', glow: '#9CCB8A',
    props: [[Q.seedTable, 195, 470, 1.3], [Q.pot, 50, 505, 0.9], [Q.pot, 340, 505, 0.9, { v: 1 }], [Q.wateringCan, 110, 510], [P.shelf, 195, 250, 1.2, { w: 140, c: 6 }], [P.sack, 280, 510, 0.9], [P.sconce, 340, 250]],
    hide: [240, 380], secret: [80, 200],
    intro: 'Chaque plateau porte une étiquette. Sur l’une d’elles, en tout petit : « Surprise ».',
  },
  'serre.b3.r2': { // Les Boutures
    arch: 'glass', glow: '#9CCB8A',
    props: [[P.table, 195, 480, 1.25, { w: 220 }], [Q.pot, 130, 400, 0.8], [Q.pot, 195, 400, 0.8, { v: 2 }], [Q.pot, 260, 400, 0.8, { v: 1 }], [Q.pot, 50, 505, 1.1, { v: 1 }], [Q.pot, 340, 505, 1.1], [Q.wateringCan, 300, 510, 0.9], [P.shelf, 195, 240, 1.1, { c: 1 }]],
    hide: [90, 470], secret: [300, 200],
    intro: 'On coupe une branche, on la plante, et elle repousse ailleurs. Le sécateur connaît le secret.',
  },
  'serre.b3.r3': { // Le Terreau
    arch: 'garden', glow: '#E8C07A',
    props: [[Q.wheelbarrow, 150, 490, 1.3], [P.sack, 300, 490, 1.2, { c: 7 }], [P.sack, 345, 470, 1, { c: 6 }], [Q.pot, 60, 505, 0.9], [Q.wateringCan, 240, 510], [Q.lamppost, 360, 420, 0.8, { f: true }], [Q.pot, 250, 430, 0.8, { v: 1 }], [P.crate, 40, 440, 0.8], [Q.rock, 300, 525, 0.7]],
    hide: [100, 500], secret: [195, 250],
    intro: 'Un ver luisant a éclairé la pépinière tout seul pendant quarante ans. Il est fatigué.',
  },
  'serre.b3.r4': { // La Serre chaude
    arch: 'glass', glow: '#E8744A', ao: { tint: '#7a4a3a' },
    props: [[Q.greenhouseStove, 90, 470, 1.2], [Q.bigLeaf, 280, 470, 1.3], [Q.bigLeaf, 330, 440, 0.9, { f: true }], [Q.pot, 195, 505, 1.1, { v: 1 }], [Q.wateringCan, 40, 510], [Q.vine, 200, 0, 1, { w: 150 }], [Q.pot, 150, 432, 0.8, { v: 2, c: 2 }]],
    hide: [260, 505], secret: [120, 200],
    intro: 'Il fait bon, ici. L’arrosoir est percé, mais il arrose quand même. Autrement.',
  },

  // ---------------------------------------------------------------- Palmarium
  'serre.b4.r1': { // Les Palmiers
    arch: 'glass', glow: '#9CCB8A', ao: { tint: '#2f6a4a' },
    props: [[Q.palm, 90, 490, 1.1], [Q.palm, 300, 470, 0.95, { f: true }], [Q.bigLeaf, 195, 500, 0.9], [Q.pot, 360, 510, 0.8, { v: 2 }], [Q.wateringCan, 30, 515, 0.8], [Q.frog, 250, 515, 0.8]],
    hide: [196, 420], secret: [195, 120],
    intro: 'Dans une noix de coco creuse, on entend la mer. Une mer très lointaine.',
  },
  'serre.b4.r2': { // Les Lianes
    arch: 'glass', glow: '#9CCB8A', ao: { tint: '#2f6a4a' },
    props: [[Q.vine, 60, 0, 1, { w: 300 }], [Q.vine, 150, 0, 1, { w: 200 }], [Q.vine, 240, 0, 1, { w: 360 }], [Q.vine, 330, 0, 1, { w: 240 }], [Q.bigLeaf, 90, 500], [Q.bigLeaf, 320, 510, 1, { f: true }], [Q.pot, 195, 510, 0.9, { v: 1 }], [Q.frog, 250, 510]],
    hide: [285, 160], secret: [195, 440],
    intro: 'Les lianes se sont nouées entre elles. Chaque nœud, dit le Jardinier, est un souvenir.',
  },
  'serre.b4.r3': { // La Passerelle
    arch: 'glass', glow: '#9CCB8A',
    props: [[Q.walkway, 195, 260, 1], [Q.palm, 70, 500, 0.8], [Q.bigLeaf, 320, 500, 1.1], [Q.pot, 195, 505, 1, { v: 2, c: 4 }], [Q.vine, 195, 0, 1, { w: 120 }], [Q.frog, 250, 256, 0.9]],
    hide: [120, 250], secret: [290, 380],
    intro: 'Tout en haut de la passerelle, le Jardinier a oublié sa coquille. Il en a une autre, dit-il.',
  },
  'serre.b4.r4': { // La Canopée
    arch: 'garden', glow: '#EFE8D8', ao: { floor: 470 },
    props: [[Q.palm, 60, 560, 1.2], [Q.palm, 340, 560, 1.1, { f: true }], [Q.moonFlower, 195, 460, 1.5], [Q.bigLeaf, 130, 540], [Q.bigLeaf, 270, 540, 1, { f: true }], [Q.vine, 195, 0, 1, { w: 110 }], [Q.frog, 200, 540, 0.8], [Q.vine, 100, 0, 1, { w: 200 }], [Q.vine, 290, 0, 1, { w: 170 }]],
    hide: [300, 240], secret: [195, 140],
    intro: 'La fleur de minuit ne fleurit qu’une fois. Elle a attendu la lumière pour choisir ce soir.',
  },
};
