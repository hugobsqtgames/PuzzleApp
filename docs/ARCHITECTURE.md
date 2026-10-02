# Architecture de Lampion

App Expo (SDK 57, React Native, TypeScript, Expo Router), entièrement hors ligne. Aucun serveur, aucun compte, aucune donnée envoyée.

## Vue d'ensemble

```
app/src/
  core/            le jeu sans interface (testé par Jest)
    puzzlekit/     aléatoire déterministe, contrat d'une famille, pipeline d'acceptation, paliers
    families/      25 familles de puzzles + le Sceau + Constellations (mode Libre seulement, pas encore dans les lanternes livrées) (génération, résolution, validation, note, indices)
    game/          monde, progression, économie, défi du soir, état sauvegardé
    persistence/   sauvegarde robuste (écriture atomique, copie de secours, décodage tolérant)
    audio/         directeur son et haptique
  game/            la liaison entre le cœur et l'app : catalogue, session de jeu, store React, récompenses
  ui/              composants, plateaux (boards*.tsx), scènes des salles (scenes/), Nilo, thème
  app/             les écrans (Expo Router : un fichier = un écran)
  content/         textes (strings.ts), monde de Vesper (vesper.ts), contenu généré (generated/pack.json)
tools/
  forge/           génère pack.json : 1000 lanternes et les défis du soir, vérifiés et notés
  scenes/ audio/ icons/ store/   outils de production (décors, sons, icônes, images App Store)
```

## Une famille de puzzles

Chaque famille (`core/families/*.ts`) respecte `PuzzleFamily` (`core/puzzlekit/types.ts`) :

- `generate(params, rng)` : un candidat, déterministe à partir de la graine ;
- `solve(puzzle, limit)` : les solutions (au plus `limit`) et l'effort de recherche ;
- `validate(puzzle, state)` : `correct`, `incomplete` ou `invalid` (avec les cases fautives et un texte) ;
- `rate(puzzle, report)` : une note de 0 à 100, convertie en palier (Étincelle → Astre) ;
- `hint(puzzle, state, level)` : Murmure, Piste, Éclairage, Solution ;
- `parse(raw)` : contrôle de forme de toute donnée venue de l'extérieur (jamais de plantage).

Le pipeline (`core/puzzlekit/pipeline.ts`) n'accepte un puzzle que s'il a une solution unique (quand la famille l'exige), une solution valide, le bon palier et pas de doublon.

Pour ajouter une famille : le fichier du cœur, son plateau dans `ui/boards4.tsx` (ou un nouveau fichier), son entrée dans `game/catalog.ts` (nom, règle, succès), son icône dans `ui/art.ts`, son aide dans `app/puzzle.tsx`, ses textes dans `content/strings.ts`, ses paramètres par palier dans `tools/forge/forge.ts`, et ses tests (`core/__tests__/moreFamilies.test.ts` montre le contrat commun).

## Le contenu

`tools/forge/forge.ts` place les lanternes dans le monde (8 quartiers, 101 salles), choisit la famille de chacune (jamais deux fois de suite la même, au plus 4 sur 20, chaque quartier ses familles principales), génère et vérifie chaque puzzle, puis prépare les défis du soir jusqu'à fin 2028 (au-delà, l'appareil les génère lui-même).

```
cd app
npm run content:build     # tout, depuis zéro (avant la première sortie seulement)
npm run content:extend    # une mise à jour : garde tout ce qui est publié, génère le nouveau
npm run content:lock      # à chaque sortie : enregistre tools/forge/released.json
```

Le fichier est déterministe : même code, même `pack.json`, octet pour octet. Les tests vérifient que chaque puzzle livré se termine avec l'indice « Solution », que la répartition des familles est respectée et, dès qu'un `released.json` existe, qu'aucun puzzle publié n'a changé.

## La sauvegarde

`core/persistence/saveStore.ts` écrit l'état dans un fichier temporaire puis le renomme, garde une copie de secours, et décode élément par élément : une entrée abîmée est écartée sans perdre le reste. Les réglages, le profil (objets trouvés, historique d'éclats, personnalisation) sont dans un second fichier. Une partie en cours n'est restaurée que sur le puzzle exact où elle a été commencée (empreinte des données du puzzle).

Les identifiants de lanternes ne changent jamais : une sauvegarde reste valide quand le contenu grandit.

## Les langues

Le jeu est écrit en français ; l'anglais est un dictionnaire dont les clés sont les textes français (`src/i18n/en/*.ts` : `engine`, `ui`, `world`, `scenes`).

- Dans le code, un texte affiché passe par `tr('Salle {0}', [n])` ou `trn(n, 'un', 'plusieurs')`. Les données (quartiers, lettres, garde-robe…) passent par `translated(...)`, qui les lit dans la langue courante.
- La langue suit le téléphone (français pour un appareil en français, anglais sinon) ; le joueur peut la forcer dans Réglages › Langue.
- L'historique des Éclats est enregistré en français et traduit à l'affichage : changer de langue ne mélange rien.
- `src/core/__tests__/i18n.test.ts` échoue si un texte n'a pas sa traduction ou si les `{0}` ne correspondent pas. `I18N_DUMP=manquants.json npx jest i18n` écrit la liste de ce qui manque.
- Une nouvelle langue : un dictionnaire de plus dans `src/i18n/`, une entrée dans `Lang`, `resolveLang` et le sélecteur des Réglages.

## Saisons et événements

`src/game/seasons.ts` lit la date du téléphone : quatre saisons (couleur de flamme, ce qui tombe devant la fenêtre de l'accueil, phrase du jour, tenue de Nilo s'il n'en porte pas) et trois événements annuels : le Printemps des Lanternes (28 mars → 10 avril, 9 énigmes), la Nuit des Citrouilles (25 octobre → 2 novembre, 7 énigmes) et la Veillée de Vesper (15 décembre → 6 janvier, une énigme de plus chaque soir, 12 en tout). L'habillage de chaque événement (dessin, tenue de Nilo, textes) est dans `src/ui/eventTheme.ts`.

- Les énigmes d'événement sont dans `pack.json` (`events`), créées par la Forge (`EVENTS` dans `tools/forge/forge.ts`) et verrouillées comme les autres : tout marche hors ligne et revient chaque année.
- La progression d'une année est rangée dans `GameState.seenDialogue` (`event.<id>.<année>.<n>`), les paliers une fois pour toutes (`event.halloween.complete`…) : ils donnent les objets de Nilo (`rewards.ts`).
- L'icône de l'app change avec la saison (`src/game/appIcon.ts`, module `expo-alternate-app-icons`, icônes rendues par `node tools/icons/render.js`). **Uniquement dans une build de développement ou App Store** : Expo Go ne peut pas changer son icône. Réglage « Icône de saison » pour garder l'icône classique.

## Le widget iPhone

`app/targets/widget/` : un widget SwiftUI (petit et moyen format) qui affiche la série du soir et l'état du défi. L'app lui écrit quelques valeurs dans un App Group partagé (`src/game/widget.ts`, groupe `group.app.lampion.game`), le widget ne fait que les lire. Rien ne quitte le téléphone.

Pour le compiler (build de développement ou App Store, jamais dans Expo Go) :
1. `appleTeamId` est dans `ios` de `app.json` (fait : `336SM4755V`).
2. Sur developer.apple.com, créer l'App Group `group.app.lampion.game` et le cocher pour l'app (`app.lampion.game`) et pour le widget. EAS peut le faire seul à la première build.
3. `eas build -p ios`. Le widget est produit par `@bacons/apple-targets` à la prébuild.

## Ajouter un chapitre (mise à jour de contenu)

La fin du premier chapitre (`app/ending.tsx`) annonce la suite « de l'autre côté de la mer ». Pour l'ajouter :

1. **Le monde** : un quartier dans `content/vesper.ts` (nom, bâtiments, salles, habitants, gardien, lettre) et dans `PLAN` de `tools/forge/forge.ts` (familles, paliers, condition d'ouverture, par exemple `totalLightsAndLetters`).
2. **Les décors** : une `RoomSpec` par salle dans `ui/scenes/rooms-*.ts` (`npx tsx tools/scenes/audit.ts` vérifie qu'aucune lanterne ne se chevauche). Une salle sans décor s'affiche sur un fond neutre : rien ne casse, mais ce n'est pas publiable.
3. **La carte** : la position du quartier dans `MAP_POS` (`ui/art.ts`), son ambiance sonore.
4. **Le contenu** : `npm run content:extend` (les 1000 lanternes publiées ne bougent pas), puis `npm run content:lock` au moment de la sortie.
5. **L'histoire** : une nouvelle scène de fin ou d'ouverture, sur le modèle de `app/ending.tsx`, et une clé dans `game/story.ts`.
6. **L'anglais** : les nouveaux textes dans `src/i18n/en/` (le test i18n liste ceux qui manquent).
7. **Vérifier** : `npm test`, `npx tsc --noEmit`, `npx expo lint`, puis les parcours web de `tools/store` et un essai sur iPhone.

## Qualité

```
cd app
npm test              # cœur, contenu livré, sauvegarde, scènes
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

Les parcours de bout en bout (nouveau joueur, chaque famille résolue depuis sa salle, à la main et par indices, tailles d'écran) tournent sur le build web avec Playwright ; voir `tools/store/README.md` pour servir le build.
