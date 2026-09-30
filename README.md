# Lampion (nom de travail)

Jeu de casse-têtes premium pour iPhone, iPad et Android : le joueur rallume, énigme après énigme, les lanternes de Vesper, une ville nocturne endormie. Hors ligne, sans compte, sans collecte de données, sans IA dans le produit.

## État du projet

Conception validée (phase 6). Développement en cours (phase 8), avec **Expo (React Native, TypeScript)** dans [`app/`](app). Le cœur du jeu est en TypeScript et testé. L'app est complète en français ; elle n'a pas encore été essayée sur un vrai téléphone.

## App Expo

```
cd app
npm install
npm test            # tests du cœur (puzzles, progression, sauvegarde, son)
npm run typecheck
npx expo start      # puis scanner le QR code avec Expo Go sur le téléphone
```

### Voir la vraie icône et l'écran de démarrage

Expo Go est une seule app : sur l'écran d'accueil, c'est toujours son logo, quel que soit le projet ouvert. L'icône de Lampion (avec ses variantes sombre et teintée d'iOS 18) et son écran de démarrage n'apparaissent que dans une vraie build :

```
cd app
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform ios   # build installable sur ton iPhone (compte Apple Developer requis)
```

`eas.json` contient deux profils : `preview` (installation directe sur tes appareils enregistrés) et `production` (App Store / TestFlight, avec `npx eas-cli@latest submit`).

Contenu de l'app :

- **17 familles de puzzles** pour les lanternes : Interrupteurs, Cadenas, Lampes, Engrenages, Suites, Balances, Motifs, Menteurs, Fil, Miroirs, Enquêtes, Marqueterie, Carillon (mélodie à rejouer), Vitraux (filtres de couleur à déduire), Différences, Étagère (rangement par indices), Ombres (rotation sans retournement). Plus le **Sceau** des lanternes-clés : un code fait des chiffres cachés dans le décor des salles du bâtiment.
- **Variantes** qui changent la façon de réfléchir : Carillon à rebours, Ombres « Reflet » (l'image dans un miroir), Vitraux voilés, Suites de lettres, Interrupteurs en diagonale ou à huit voisines.
- **Répartition** vérifiée par les tests : jamais deux fois le même type de suite, au plus 4 du même type sur 20 lanternes, 8 types dès le Phare, chaque type entre 36 et 74 lanternes.
- **101 salles, toutes dessinées différemment** (`app/src/ui/scenes/`) : 23 architectures, une centaine d'accessoires, une courte histoire par salle ; le décor s'éclaire à mesure que ses lanternes s'allument, puis révèle un chiffre et un objet caché à chercher soi-même.
- Les 7 quartiers de Vesper et le Grenier : 1000 lanternes générées et vérifiées à l'avance par `tools/forge`, le défi du soir jusqu'à fin 2028 (puis généré sur l'appareil).
- **Nilo vivant** : calques animés (respiration, clignements, regards, oreilles, queue, flamme), humeurs et réactions au jeu et au toucher ; respecte « Réduire les animations ».
- Indices, annulation, pause, réussite, objets, habitants, gardiens et lettres, carnet (objets, succès, statistiques, Vesper), éclats et personnalisation de Nilo, réglages, introduction et tutoriel, son (effets, cloches et ambiances rendus par `tools/audio`), rappels locaux. La progression est sauvegardée sur l'appareil.
- Sur iPad, les écrans gardent une colonne centrée de 600 pt.

Images App Store : `store/iphone-6.9/` et `store/ipad-13/`, régénérables avec [`tools/store`](tools/store/README.md).

Qualité : `npm test` (265 tests : puzzles et variantes, solution unique, indice « Solution » vérifié sur chacun des 1853 puzzles livrés, répartition des types, progression, sauvegarde, scènes sans zones tactiles qui se chevauchent), `npm run typecheck`, `npx expo lint`, `npx expo-doctor`.

Limites actuelles : français seulement ; la police des titres est Georgia (système) ; l'identifiant `app.lampion.game` est à remplacer par le vôtre avant publication ; l'app a été testée sur le build web et par export natif, **pas encore sur un vrai iPhone**.

| Document | Contenu |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture de l'app Expo : cœur, contenu, écrans, sauvegarde, tests, mises à jour de contenu |
| [docs/PRODUCT_DISCOVERY.md](docs/PRODUCT_DISCOVERY.md) | Vision, marché, concept, différenciation, naming, risques, roadmap |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Identité de marque, direction artistique « Encre & Lueur », tokens, composants, Nilo, icône |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Monde, déblocages, difficulté, familles de puzzles (conception d'origine : 12), indices, économie, défi du jour, succès |
| [docs/WIREFRAMES.md](docs/WIREFRAMES.md) | Les 24 écrans, leurs états et la navigation |
| [docs/historique/](docs/historique) | Archives : l'ancienne architecture et l'audit du cœur Swift (retiré), la revue de conception |
| [app/](app) | App Expo : cœur TypeScript (`src/core/`) et écrans |
| [prototype/index.html](prototype/index.html) | Maquette navigable : direction artistique puis 24 écrans iPhone et iPad, puzzles jouables |

## Ouvrir la maquette

Ouvrir `prototype/index.html` dans un navigateur récent (aucune installation). Les polices système Apple sont utilisées sur iPhone, iPad et Mac ; ailleurs, des polices de repli proches sont chargées.

La maquette a un **son synthétisé** (bouton « Son », coupé par défaut ; section « Son » de la charte pour tout écouter). Le cahier des charges du sound designer est dans [`Content/audio/SOUND_BRIEF.md`](Content/audio/SOUND_BRIEF.md).

Les puzzles jouables de la maquette ont été générés puis vérifiés (solution unique) par les scripts de `prototype/verification/` :

```
python3 prototype/verification/generate_lanterns_and_lock.py
python3 prototype/verification/generate_gears.py
```
