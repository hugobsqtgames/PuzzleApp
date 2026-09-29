// French texts of the puzzle engine (hints, errors, deduction steps). The
// engine never writes text itself: it returns a key and arguments.
import type { LocalizedTemplate } from '../core/puzzlekit/types';

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
  // Paliers
  'tier.spark': 'Étincelle', 'tier.glow': 'Lueur', 'tier.flame': 'Flamme', 'tier.blaze': 'Brasier', 'tier.beacon': 'Fanal', 'tier.star': 'Astre',
};

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
    if (a in FR) return text.startsWith(`{${i}}`) && CAPITALISED[a] ? CAPITALISED[a] : FR[a];
    return a;
  });
}
