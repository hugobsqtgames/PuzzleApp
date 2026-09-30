// French texts of the puzzle engine (hints, errors, deduction steps). The
// engine never writes text itself: it returns a key and arguments.
import type { LocalizedTemplate } from '../core/puzzlekit/types';

import { CHARACTERS } from '../core/families/liars';
import { OBJECTS, PEOPLE, PLACES } from '../core/families/inquiries';

export const FR: Record<string, string> = {
  // Lampes
  'lamps.error.seeEachOther': 'Ces lampes se voient : une seule peut rester.',
  'lamps.error.wallOver': 'Ce mur veut {0} lampe(s), il en a {1}.',
  'lamps.hint.checkMistake': 'Vérifie cette case.',
  'lamps.hint.reveal': 'Une lampe va ici.',
  'lamps.hint.reveal.lead': 'Une lampe se trouve à la croisée de la ligne {0} et de la colonne {1}.',
  'lamps.hint.reveal.whisper': 'Regarde la ligne {0} : une lampe s’y cache.',
  'lamps.hint.solution': 'Voici la grille éclairée.',
  'lamps.hint.whisper.chainedContradiction': 'Essaie mentalement une lampe ici et suis les conséquences.',
  'lamps.hint.whisper.directContradiction': 'Regarde cette case : que se passerait-il avec une lampe ?',
  'lamps.hint.whisper.onlySource': 'Cette case ne peut être éclairée que d’un seul endroit.',
  'lamps.hint.whisper.wallSatisfied': 'Regarde ce mur : il a déjà son compte.',
  'lamps.hint.whisper.wallSaturated': 'Regarde ce mur et ses cases libres.',
  'lamps.hint.wrongDot': 'Cette case doit porter une lampe.',
  'lamps.hint.wrongLamp': 'Cette lampe n’est pas à sa place.',
  'lamps.step.lampRequired': 'Sans lampe ici, une case ne pourrait plus être éclairée.',
  'lamps.step.lampWouldBreak': 'Une lampe ici rendrait la grille impossible : cette case reste vide.',
  'lamps.step.onlySource': 'Une seule case peut éclairer celle-ci : la lampe y est obligatoire.',
  'lamps.step.wallSatisfied': 'Ce mur {0} a déjà toutes ses lampes : ses autres voisines restent vides.',
  'lamps.step.wallSaturated': 'Ce mur {0} n’a que {1} case(s) libre(s) : elles portent toutes une lampe.',
  // Cadenas
  'locks.error.clue': 'Avec {0}, la ligne {1} donnerait {2} bien placé(s) et {3} mal placé(s), au lieu de {4} et {5}.',
  'locks.error.repeatedSymbols': 'Les chiffres du code sont tous différents.',
  'locks.hint.insight': 'Le chiffre n° {0} est un {1}.',
  'locks.hint.lead.compare': 'Compare la ligne {0} avec les autres : quels chiffres ont-elles en commun ?',
  'locks.hint.lead.noneWellPlaced': '{0} : aucun chiffre n’est à sa place. Chacun est exclu de sa position.',
  'locks.hint.lead.nothing': '{0} : aucun chiffre juste. Tu peux les barrer partout.',
  'locks.hint.solution': 'Le code est {0}.',
  'locks.hint.whisper': 'Commence par la ligne {0}.',
  'locks.step.crossReasoning': 'Croise les lignes pour réduire les possibilités.',
  'locks.step.noneWellPlaced': '{0} : aucun chiffre à sa place.',
  'locks.step.nothingCorrect': '{0} : aucun chiffre juste, on les exclut.',
  // Interrupteurs
  'switches.hint.insight': 'Appuie sur le bouton de la ligne {0}, colonne {1}.',
  'switches.hint.lead': 'Un bouton de la ligne {0} fait partie de la solution. Il reste {1} coups au minimum.',
  'switches.hint.solution': 'Solution en {0} coups.',
  'switches.hint.whisper': 'Regarde la ligne {0}.',
  // Engrenages
  'gears.hint.whisper': 'Regarde la tuile de la ligne {0}, colonne {1}.',
  'gears.hint.whisper.border': 'Regarde le bord, ligne {0}, colonne {1} : une tuile ne peut pas regarder vers l’extérieur.',
  'gears.hint.lead': 'La tuile de la ligne {0}, colonne {1} doit s’ouvrir vers : {2}.',
  'gears.hint.insight': 'La tuile de la ligne {0}, colonne {1} est maintenant dans le bon sens.',
  'gears.hint.solution': 'Voici le circuit complet.',
  // Suites
  'sequences.error.wrong': 'Pas celle-ci. Regarde comment évoluent les écarts.',
  'sequences.hint.solution': 'La réponse est {0}.',
  'sequences.letters.add.whisper': 'Compte de combien de places on avance dans l’alphabet d’une lettre à la suivante.',
  'sequences.letters.add.lead': 'Les sauts dans l’alphabet sont {0}.',
  'sequences.letters.add.insight': 'Le saut est toujours le même : avance encore de {3} lettres.',
  'sequences.letters.addGrowing.whisper': 'Compte de combien de places on avance dans l’alphabet d’une lettre à la suivante.',
  'sequences.letters.addGrowing.lead': 'Les sauts dans l’alphabet sont {0} : ils grandissent.',
  'sequences.letters.addGrowing.insight': 'Les sauts augmentent de {2} à chaque fois : le prochain est de {3} lettres.',
  'sequences.letters.alternate.whisper': 'Regarde les sauts dans l’alphabet, un sur deux.',
  'sequences.letters.alternate.lead': 'Les sauts sont {0} (un saut négatif recule dans l’alphabet) : ils alternent.',
  'sequences.letters.alternate.insight': 'Deux sauts alternent : le prochain est {3}.',
  'sequences.letters.interleaved.whisper': 'Lis la suite une lettre sur deux.',
  'sequences.letters.interleaved.lead': 'Deux suites de lettres sont mélangées : les places paires et les places impaires.',
  'sequences.letters.interleaved.insight': 'Une suite avance de {1} en {1}, l’autre recule de {2} en {2}. La prochaine lettre continue celle qui commence la suite.',
  'sequences.hint.add.whisper': 'Regarde l’écart entre deux nombres voisins.',
  'sequences.hint.add.lead': 'Les écarts sont {0}.',
  'sequences.hint.add.insight': 'L’écart est toujours le même : le prochain est encore +{3}.',
  'sequences.hint.multiply.whisper': 'Compare chaque nombre au précédent : ce n’est pas une addition.',
  'sequences.hint.multiply.lead': 'Chaque nombre est un multiple du précédent.',
  'sequences.hint.multiply.insight': 'On multiplie par {1} à chaque fois.',
  'sequences.hint.addGrowing.whisper': 'Regarde l’écart entre deux nombres voisins.',
  'sequences.hint.addGrowing.lead': 'Les écarts sont {0} : ils grandissent eux aussi.',
  'sequences.hint.addGrowing.insight': 'Les écarts augmentent de {2} à chaque fois : le prochain écart est +{3}.',
  'sequences.hint.addDoubling.whisper': 'Regarde l’écart entre deux nombres voisins.',
  'sequences.hint.addDoubling.lead': 'Les écarts sont {0}.',
  'sequences.hint.addDoubling.insight': 'Chaque écart double : le prochain écart est +{3}.',
  'sequences.hint.addTripling.whisper': 'Regarde l’écart entre deux nombres voisins.',
  'sequences.hint.addTripling.lead': 'Les écarts sont {0}.',
  'sequences.hint.addTripling.insight': 'Chaque écart est multiplié par 3 : le prochain écart est +{3}.',
  'sequences.hint.fibonacci.whisper': 'Regarde trois nombres voisins ensemble.',
  'sequences.hint.fibonacci.lead': 'Chaque nombre dépend des deux précédents.',
  'sequences.hint.fibonacci.insight': 'Chaque nombre est la somme des deux précédents.',
  'sequences.hint.squares.whisper': 'Ces nombres te disent quelque chose ? Pense aux multiplications.',
  'sequences.hint.squares.lead': 'Chaque nombre est un nombre multiplié par lui-même.',
  'sequences.hint.squares.insight': 'Ce sont des carrés qui se suivent : le prochain écart est +{3}.',
  'sequences.hint.cubes.whisper': 'Ces nombres grandissent très vite. Pense aux multiplications.',
  'sequences.hint.cubes.lead': 'Chaque nombre est un nombre multiplié trois fois par lui-même.',
  'sequences.hint.cubes.insight': 'Ce sont des cubes qui se suivent : le prochain écart est +{3}.',
  'sequences.hint.multiplyAdd.whisper': 'Compare chaque nombre au précédent : il y a deux opérations.',
  'sequences.hint.multiplyAdd.lead': 'On multiplie par {1}, puis on ajuste un peu.',
  'sequences.hint.multiplyAdd.insight': 'Chaque nombre est le précédent × {1}, puis {2} de plus.',
  'sequences.hint.alternate.whisper': 'Regarde les écarts, un sur deux.',
  'sequences.hint.alternate.lead': 'Les écarts sont {0} : ils alternent.',
  'sequences.hint.alternate.insight': 'Deux écarts alternent : le prochain est +{3}.',
  'sequences.hint.interleaved.whisper': 'Lis la suite un nombre sur deux.',
  'sequences.hint.interleaved.lead': 'Deux suites sont mélangées : les places paires et les places impaires.',
  'sequences.hint.interleaved.insight': 'Une suite avance de {1} en {1}, l’autre recule de {2} en {2}. Le prochain nombre continue celle qui commence la suite.',
  // Balances
  'scales.error.wrong': '{0} ne tient pas l’équilibre. Vérifie les balances une par une.',
  'scales.hint.whisper': 'Commence par la balance {0}.',
  'scales.hint.lead': 'Trouve d’abord le poids {0} : la balance {1} suffit.',
  'scales.hint.insight': '{0} pèse {1}.',
  'scales.hint.solution': '{0} pèse {1}.',
  'scales.shape.circle': 'du cercle',
  'scales.shape.triangle': 'du triangle',
  'scales.shape.square': 'du carré',
  'scales.shape.diamond': 'du losange',
  'scales.step': 'Une balance donne un poids.',
  // Motifs
  'patterns.error.wrong': 'Pas celle-ci. Regarde bien {0}.',
  'patterns.hint.whisper': 'Regarde une seule chose à la fois : {0}.',
  'patterns.hint.lead.row': 'Dans chaque ligne, {0} ne change pas.',
  'patterns.hint.lead.column': 'Dans chaque colonne, {0} ne change pas.',
  'patterns.hint.lead.progression': 'Le long de chaque ligne, {0} avance d’un cran.',
  'patterns.hint.lead.distribution': 'Chaque ligne contient les trois mêmes valeurs de {0}, dans un autre ordre.',
  'patterns.hint.lead.constant': 'Regarde {0} dans tout le tableau.',
  'patterns.hint.insight': 'Pour {0}, la case manquante a : {1}. Les pièces qui ne l’ont pas sont écartées.',
  'patterns.hint.solution': 'Voici la pièce qui complète le tableau.',
  'patterns.attr.shape': 'la forme', 'patterns.attr.count': 'le nombre', 'patterns.attr.fill': 'le remplissage', 'patterns.attr.size': 'la taille', 'patterns.attr.rotation': 'l’orientation',
  'patterns.value.shape.0': 'un cercle', 'patterns.value.shape.1': 'un triangle', 'patterns.value.shape.2': 'un carré', 'patterns.value.shape.3': 'un losange',
  'patterns.value.count.0': 'une forme', 'patterns.value.count.1': 'deux formes', 'patterns.value.count.2': 'trois formes',
  'patterns.value.fill.0': 'plein', 'patterns.value.fill.1': 'rayé', 'patterns.value.fill.2': 'vide',
  'patterns.value.size.0': 'petit', 'patterns.value.size.1': 'moyen', 'patterns.value.size.2': 'grand',
  'patterns.value.rotation.0': 'pointe vers le haut', 'patterns.value.rotation.1': 'pointe vers la droite', 'patterns.value.rotation.2': 'pointe vers le bas', 'patterns.value.rotation.3': 'pointe vers la gauche',
  // Menteurs
  'liars.error.honestButFalse': 'Si {0} dit la vérité, sa phrase devrait être vraie. Avec ta réponse, elle est fausse.',
  'liars.error.liarButTrue': 'Si {0} ment, sa phrase devrait être fausse. Avec ta réponse, elle est vraie.',
  'liars.hint.whisper': 'Commence par la phrase de {0}.',
  'liars.hint.checkMark': 'Vérifie ta réponse pour {0}.',
  'liars.hint.lead': 'Suppose que {0} dit la vérité, puis qu’il ou elle ment : une des deux hypothèses mène à une contradiction.',
  'liars.hint.insight.honest': '{0} dit la vérité.',
  'liars.hint.insight.liar': '{0} ment.',
  'liars.hint.solution': 'Voici qui ment et qui dit vrai.',
  // Fil
  'threads.hint.whisper': 'Regarde les cases qui n’ont que deux sorties : le fil y passe forcément par là.',
  'threads.hint.lead': 'Le fil continue vers la case ligne {0}, colonne {1}.',
  'threads.hint.insight': 'Le fil avance jusqu’à la case ligne {0}, colonne {1}.',
  'threads.hint.backtrack': 'D’ici, le fil ne peut plus passer partout. Reviens à la case ligne {0}, colonne {1}.',
  'threads.hint.solution': 'Voici un fil qui passe partout.',
  // Miroirs
  'mirrors.error.tooMany': 'Tu n’as que {0} miroirs.',
  'mirrors.hint.whisper': 'Le rayon doit passer par la cible ligne {0}, colonne {1}.',
  'mirrors.hint.lead': 'Un miroir va sur la ligne {0}.',
  'mirrors.hint.insight': 'Un miroir {2} va ligne {0}, colonne {1}.',
  'mirrors.hint.wrong': 'Le miroir de la ligne {0}, colonne {1} n’est pas le bon.',
  'mirrors.hint.solution': 'Voici le chemin du rayon.',
  // Enquêtes
  'inquiries.error.sameObject': 'Deux habitants ont le même objet.',
  'inquiries.error.samePlace': 'Deux habitants sont au même endroit.',
  'inquiries.error.clue': 'L’indice {0} n’est pas respecté.',
  'inquiries.hint.whisper': 'Commence par l’indice {0}.',
  'inquiries.hint.lead': 'Barre ce que chaque indice exclut : quand il ne reste qu’une possibilité, elle est juste.',
  'inquiries.hint.insight.object': '{0} a {1}.',
  'inquiries.hint.insight.place': '{0} est {1}.',
  'inquiries.hint.wrong': 'Revois ta réponse pour {0}.',
  'inquiries.hint.solution': 'Voici le tableau complet.',
  // Marqueterie
  'marquetry.hint.whisper': 'Commence par les coins et les parties les plus étroites de la silhouette.',
  'marquetry.hint.lead': 'Essaie de placer la pièce {0}.',
  'marquetry.hint.insight': 'La pièce {0} est posée à sa place.',
  'marquetry.hint.wrong': 'La pièce {0} empêche de tout remplir.',
  'marquetry.hint.solution': 'Voici la silhouette remplie.',
  // Sceau
  'seal.wrong.up': 'Le sceau ne bouge pas. Les chiffres se lisent de la Salle 1 à la Salle 4.',
  'seal.wrong.down': 'Le sceau ne bouge pas. Les chiffres se lisent de la Salle 4 à la Salle 1.',
  'seal.wrong.sum': 'Le sceau ne bouge pas. Il attend la somme des chiffres des salles.',
  'seal.wrong.pairs': 'Le sceau ne bouge pas. Additionne les salles deux par deux, et garde le dernier chiffre.',
  'seal.hint.whisper': 'Chaque salle éclairée montre un chiffre peint dans son décor. Va les chercher.',
  'seal.hint.lead': 'Le chiffre de la Salle {0} est {1}.',
  'seal.hint.insight': 'Les chiffres des salles : {0}.',
  'seal.hint.solution': 'Le code du sceau est {0}.',
  // Carillon
  'chimes.wrong': 'La note n° {0} n’est pas la bonne. Écoute encore, puis recommence.',
  'chimes.hint.whisper': 'La mélodie compte {0} notes. Écoute-la autant de fois que tu veux.',
  'chimes.hint.whisper.reverse': 'Commence par la dernière note de la mélodie, puis remonte jusqu’à la première. Elle compte {0} notes.',
  'chimes.hint.lead': 'La note n° {0} est sur cette cloche.',
  'chimes.hint.insight': 'Nilo joue la note n° {0} pour toi.',
  'chimes.hint.solution': 'Voici toute la mélodie.',
  // Vitraux
  'stained.error.extra': 'Ce vitrail a une couleur en trop.',
  'stained.hint.whisper': 'Le vert vient du jaune et du bleu, l’orange du rouge et du jaune, le violet du rouge et du bleu.',
  'stained.hint.lead.row': 'Regarde la ligne {0} : que partagent toutes ses vitres ?',
  'stained.hint.lead.col': 'Regarde la colonne {0} : que partagent toutes ses vitres ?',
  'stained.hint.insight.row': 'La ligne {0} prend {1}.',
  'stained.hint.insight.col': 'La colonne {0} prend {1}.',
  'stained.hint.solution': 'Voici le vitrail rallumé.',
  'stained.filter.0': 'aucun filtre', 'stained.filter.1': 'le filtre rouge', 'stained.filter.2': 'le filtre jaune', 'stained.filter.4': 'le filtre bleu',
  // Différences
  'spot.hint.whisper': 'Il reste {0} différence(s). Regarde {1}.',
  'spot.hint.lead': 'Une différence se cache dans ce cercle.',
  'spot.hint.insight.color': 'Cet objet a changé de couleur.',
  'spot.hint.insight.missing': 'Cet objet a disparu.',
  'spot.hint.insight.glyph': 'Cet objet a été remplacé.',
  'spot.hint.insight.turn': 'Cet objet a tourné.',
  'spot.hint.insight.size': 'Cet objet a changé de taille.',
  'spot.hint.solution': 'Voici toutes les différences.',
  'spot.zone.top.left': 'en haut à gauche', 'spot.zone.top.middle': 'en haut, au milieu', 'spot.zone.top.right': 'en haut à droite',
  'spot.zone.bottom.left': 'en bas à gauche', 'spot.zone.bottom.middle': 'en bas, au milieu', 'spot.zone.bottom.right': 'en bas à droite',
  // Étagère
  'shelf.wrong': 'L’indice {0} n’est pas respecté.',
  'shelf.hint.whisper': 'Commence par les indices qui placent un objet à un endroit précis.',
  'shelf.hint.whisper.clue': 'Commence par l’indice {0}.',
  'shelf.hint.lead': 'La place n° {0} n’a pas le bon objet.',
  'shelf.hint.insight': '{0} va à la place n° {1}.',
  'shelf.hint.solution': 'Voici l’étagère rangée.',
  // Ombres
  'shadows.wrong.flipped': 'Presque : cette ombre est retournée, comme dans un miroir. Une ombre tourne, elle ne se retourne pas.',
  'shadows.wrong.other': 'Compte les carrés et regarde leurs coins : cette ombre n’a pas la même forme.',
  'shadows.hint.whisper': 'Une ombre tourne, elle ne se retourne jamais. Méfie-toi des images en miroir.',
  'shadows.wrong.unflipped': 'Presque : c’est l’objet simplement tourné. Dans un miroir, il apparaît retourné.',
  'shadows.hint.whisper.reflection': 'Un reflet est l’objet retourné, comme une page vue par transparence. Il peut aussi être tourné.',
  'shadows.hint.lead': 'Nilo écarte une ombre qui ne va pas.',
  'shadows.hint.insight': 'Nilo écarte deux ombres qui ne vont pas.',
  'shadows.hint.solution': 'Voici la bonne ombre.',

  // Broderie
  'embroidery.error.row': 'La ligne {0} a plus de points que ses nombres n’en demandent.',
  'embroidery.error.col': 'La colonne {0} a plus de points que ses nombres n’en demandent.',
  'embroidery.hint.whisper': 'Commence par les lignes aux grands nombres : leurs points se chevauchent forcément au milieu.',
  'embroidery.hint.mistake': 'Cette case n’est pas juste. Défais-la.',
  'embroidery.hint.row': 'La ligne {0} en dit plus qu’il n’y paraît : compte les places possibles pour ses points.',
  'embroidery.hint.col': 'La colonne {0} en dit plus qu’il n’y paraît : compte les places possibles pour ses points.',
  'embroidery.hint.row.insight': 'Voici ce que la ligne {0} permet de broder à coup sûr.',
  'embroidery.hint.col.insight': 'Voici ce que la colonne {0} permet de broder à coup sûr.',
  'embroidery.hint.solution': 'Voici la broderie terminée.',

  // Signes
  'signs.error.repeat': 'Un chiffre apparaît deux fois dans la même ligne ou la même colonne.',
  'signs.error.sign': 'Ces deux cases ne respectent pas leur signe : la pointe désigne le plus petit.',
  'signs.hint.whisper': 'Un signe « < » dit qui est le plus petit. Une case entourée de pointes est souvent un 1 ou le plus grand chiffre.',
  'signs.hint.mistake': 'Ce chiffre n’est pas le bon. Efface-le.',
  'signs.hint.lead.single': 'La case ligne {0}, colonne {1} n’a plus qu’un chiffre possible.',
  'signs.hint.lead.row': 'Dans la ligne {0}, un chiffre n’a plus qu’une place : la case colonne {1}.',
  'signs.hint.lead.col': 'Dans la colonne {1}, un chiffre n’a plus qu’une place : la case ligne {0}.',
  'signs.hint.insight': 'Ligne {0}, colonne {1} : c’est un {2}.',
  'signs.hint.solution': 'Voici le carré complet.',

  // Toits
  'roofs.error.repeat': 'Deux cheminées de même hauteur dans la même ligne ou la même colonne.',
  'roofs.error.seen': 'Depuis ce bord, on ne voit pas le bon nombre de cheminées.',
  'roofs.hint.whisper': 'Un 1 au bord : la plus haute cheminée est juste devant. Un nombre égal à la taille : elles montent une à une.',
  'roofs.hint.mistake': 'Cette hauteur n’est pas la bonne. Efface-la.',
  'roofs.hint.lead.single': 'La case ligne {0}, colonne {1} n’a plus qu’une hauteur possible.',
  'roofs.hint.lead.row': 'Dans la ligne {0}, une hauteur n’a plus qu’une place : la case colonne {1}.',
  'roofs.hint.lead.col': 'Dans la colonne {1}, une hauteur n’a plus qu’une place : la case ligne {0}.',
  'roofs.hint.insight': 'Ligne {0}, colonne {1} : une cheminée de {2}.',
  'roofs.hint.solution': 'Voici les toits de Vesper.',

  // Glissade
  'glide.dir.0': 'vers le haut', 'glide.dir.1': 'vers la droite', 'glide.dir.2': 'vers le bas', 'glide.dir.3': 'vers la gauche',
  'glide.hint.whisper': 'La lanterne peut être atteinte en {0} glissades. Cherche d’abord où Nilo peut s’arrêter à côté d’elle.',
  'glide.hint.lead': 'Nilo devrait glisser {0}.',
  'glide.hint.insight': 'Nilo glisse {0}.',
  'glide.hint.stuck': 'D’ici, la lanterne est hors d’atteinte. Nilo repart du début.',
  'glide.hint.solution': 'Nilo retrouve le chemin jusqu’à la lanterne.',

  // Taquin
  'slider.hint.whisper': 'Il reste {0} glissements au plus court. Range la première ligne, puis la suivante.',
  'slider.hint.whisper.far': 'Range la première ligne d’abord, sans toucher ensuite à ses tuiles.',
  'slider.hint.lead': 'Fais glisser la tuile {0}.',
  'slider.hint.insight': 'La tuile {0} glisse à sa place.',
  'slider.hint.solution': 'Voici le vitrail remis en ordre.',

  // Rubans
  'ribbons.error.empty': 'Les rubans sont reliés, mais des cases restent vides : ils doivent couvrir tout le métier.',
  'ribbons.hint.whisper': 'Commence par les rubans coincés dans un coin ou le long d’un bord : ils n’ont souvent qu’un chemin.',
  'ribbons.hint.off': 'Ce ruban prend un chemin qui bloquera les autres. Reprends-le ici.',
  'ribbons.hint.lead': 'Ce ruban-ci est le suivant à tisser.',
  'ribbons.hint.insight': 'Voici ce ruban tissé.',
  'ribbons.hint.solution': 'Voici le métier tissé.',

  // Lucioles
  'fireflies.error.touch': 'Deux lucioles se touchent : elles ne se posent jamais côte à côte, même en diagonale.',
  'fireflies.error.row': 'La ligne {0} a trop de lucioles.',
  'fireflies.error.col': 'La colonne {0} a trop de lucioles.',
  'fireflies.error.alone': 'Cette luciole n’est à côté d’aucune lanterne.',
  'fireflies.hint.whisper': 'Une case loin de toute lanterne reste vide. Une ligne marquée 0 aussi.',
  'fireflies.hint.mistake': 'Cette case n’est pas juste. Défais-la.',
  'fireflies.hint.far': 'Ces cases ne touchent aucune lanterne : aucune luciole n’y viendra.',
  'fireflies.hint.far.insight': 'Nilo marque d’herbe les cases loin des lanternes.',
  'fireflies.hint.touch': 'Ces cases touchent déjà une luciole : elles restent vides.',
  'fireflies.hint.touch.insight': 'Nilo marque d’herbe les cases autour des lucioles.',
  'fireflies.hint.full': 'Ces lignes ou colonnes ont déjà toutes leurs lucioles.',
  'fireflies.hint.full.insight': 'Nilo marque d’herbe le reste de ces lignes et colonnes.',
  'fireflies.hint.lead': 'Une luciole se pose ici.',
  'fireflies.hint.insight': 'Nilo pose une luciole.',
  'fireflies.hint.solution': 'Voici le jardin et toutes ses lucioles.',

  // Passerelles
  'bridges.error.over': 'Cet îlot a plus de passerelles que son nombre.',
  'bridges.error.apart': 'Chaque îlot a ses passerelles, mais tous ne sont pas reliés ensemble.',
  'bridges.hint.whisper': 'Un îlot qui demande autant de passerelles que ses voisins peuvent en porter n’a pas le choix : commence par lui.',
  'bridges.hint.mistake': 'Il y a une passerelle en trop entre ces deux îlots.',
  'bridges.hint.lead': 'Ces deux îlots sont reliés par une passerelle.',
  'bridges.hint.lead.two': 'Ces deux îlots sont reliés par deux passerelles.',
  'bridges.hint.insight': 'Nilo pose les passerelles entre ces deux îlots.',
  'bridges.hint.solution': 'Voici toutes les passerelles du marché.',
  // Paliers
  'tier.spark': 'Étincelle', 'tier.glow': 'Lueur', 'tier.flame': 'Flamme', 'tier.blaze': 'Brasier', 'tier.beacon': 'Fanal', 'tier.star': 'Astre',
};
/** Objects of the Étagère (same order as ui/boards3 SHELF_ART). */
export const SHELF_NAMES = ['le sablier', 'la théière', 'le livre', 'la bougie', 'la clé', 'le coquillage', 'la loupe', 'le vase', 'la boussole', 'la plume'];
SHELF_NAMES.forEach((n, i) => { FR[`shelf.item.${i}`] = n; });
CHARACTERS.forEach((n, i) => { FR[`liars.name.${i}`] = n; });
PEOPLE.forEach((n, i) => { FR[`inquiries.person.${i}`] = n; });
OBJECTS.forEach((n, i) => { FR[`inquiries.object.${i}`] = n; });
PLACES.forEach((n, i) => { FR[`inquiries.place.${i}`] = n; });

/** Nested shape names read naturally at the start of a sentence ("Le cercle pèse 4."). */
const CAPITALISED: Record<string, string> = {
  'scales.shape.circle': 'Le cercle', 'scales.shape.triangle': 'Le triangle', 'scales.shape.square': 'Le carré', 'scales.shape.diamond': 'Le losange',
};

export function t(tp: LocalizedTemplate | string): string {
  const key = typeof tp === 'string' ? tp : tp.key;
  const args = typeof tp === 'string' ? [] : tp.args;
  const text = FR[key] ?? key;
  return text.replace(/\{(\d+)\}/g, (_, i) => {
    const a = args[Number(i)] ?? '';
    if (a in FR) {
      if (!text.startsWith(`{${i}}`)) return FR[a];
      return CAPITALISED[a] ?? FR[a].charAt(0).toUpperCase() + FR[a].slice(1);
    }
    return a;
  });
}
