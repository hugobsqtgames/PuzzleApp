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

Contenu de l'app :

- **17 familles de puzzles** pour les lanternes : Interrupteurs, Cadenas, Lampes, Engrenages, Suites, Balances, Motifs, Menteurs, Fil, Miroirs, Enquêtes, Marqueterie, Carillon (mélodie à rejouer), Vitraux (filtres de couleur à déduire), Différences, Étagère (rangement par indices), Ombres (rotation sans retournement). Plus le **Sceau** des lanternes-clés : un code fait des chiffres cachés dans le décor des salles du bâtiment.
- **101 salles, toutes dessinées différemment** (`app/src/ui/scenes/`) : 23 architectures, une centaine d'accessoires, une courte histoire par salle ; le décor s'éclaire à mesure que ses lanternes s'allument, puis révèle un chiffre et un objet caché à chercher soi-même.
- Les 7 quartiers de Vesper et le Grenier : 1000 lanternes générées et vérifiées à l'avance par `tools/forge`, le défi du soir jusqu'à fin 2028 (puis généré sur l'appareil).
- **Nilo vivant** : calques animés (respiration, clignements, regards, oreilles, queue, flamme), humeurs et réactions au jeu et au toucher ; respecte « Réduire les animations ».
- Indices, annulation, pause, réussite, objets, habitants, gardiens et lettres, carnet (objets, succès, statistiques, Vesper), éclats et personnalisation de Nilo, réglages, introduction et tutoriel, son (effets, cloches et ambiances rendus par `tools/audio`), rappels locaux. La progression est sauvegardée sur l'appareil.
- Sur iPad, les écrans gardent une colonne centrée de 600 pt.

Images App Store : `store/iphone-6.9/` et `store/ipad-13/`, régénérables avec [`tools/store`](tools/store/README.md).

Qualité : `npm test` (226 tests : puzzles, solution unique, progression, sauvegarde, scènes sans zones tactiles qui se chevauchent), `npm run typecheck`, `npx expo lint`, `npx expo-doctor`.

Limites actuelles : français seulement ; la police des titres est Georgia (système) ; l'identifiant `app.lampion.game` est à remplacer par le vôtre avant publication ; l'app a été testée sur le build web et par export natif, **pas encore sur un vrai iPhone**.

| Document | Contenu |
|---|---|
| [PRODUCT_DISCOVERY.md](PRODUCT_DISCOVERY.md) | Vision, marché, concept, différenciation, naming, risques, roadmap |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Identité de marque, direction artistique « Encre & Lueur », tokens, composants, Nilo, icône |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Monde, déblocages, difficulté, familles de puzzles (conception d'origine : 12), indices, économie, défi du jour, succès |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Modules Swift, moteur de puzzles, pipeline de contenu, sauvegarde, tests, confidentialité |
| [WIREFRAMES.md](WIREFRAMES.md) | Les 24 écrans, leurs états et la navigation |
| [VALIDATION.md](VALIDATION.md) | Revue critique de la conception et corrections appliquées |
| [app/](app) | App Expo : cœur TypeScript (`src/core/`) et écrans |
| [Packages/LampionKit](Packages/LampionKit) | Archivé : cœur d'origine en Swift pur : moteur de puzzles, familles, progression, économie, défi du jour, sauvegarde |
| [prototype/index.html](prototype/index.html) | Maquette navigable : direction artistique puis 24 écrans iPhone et iPad, puzzles jouables |

## Ouvrir la maquette

Ouvrir `prototype/index.html` dans un navigateur récent (aucune installation). Les polices système Apple sont utilisées sur iPhone, iPad et Mac ; ailleurs, des polices de repli proches sont chargées.

La maquette a un **son synthétisé** (bouton « Son », coupé par défaut ; section « Son » de la charte pour tout écouter). Le cahier des charges du sound designer est dans [`Content/audio/SOUND_BRIEF.md`](Content/audio/SOUND_BRIEF.md).

Les puzzles jouables de la maquette ont été générés puis vérifiés (solution unique) par les scripts de `prototype/verification/` :

```
python3 prototype/verification/generate_lanterns_and_lock.py
python3 prototype/verification/generate_gears.py
```

## Cœur Swift (LampionKit) — archivé

Implémentation de référence, gardée pour comparaison et plus mise à jour : l'app utilise le portage TypeScript de `app/src/core/`. Swift pur, compile sur macOS comme sur Linux.

```
cd Packages/LampionKit
swift test                                  # tests unitaires et de propriétés
swift run -c release contentforge soak 200  # génère, résout, valide et mesure 200 puzzles par famille
```

| Module | Rôle |
|---|---|
| `PuzzleKit` | Aléatoire déterministe, contrat `PuzzleFamily`, pipeline d'acceptation, paliers, empreintes |
| `FamilySwitches` | Interrupteurs : résolveur exact GF(2), nombre minimal de coups |
| `FamilyLocks` | Cadenas : solution unique, indices minimaux, erreurs précises |
| `FamilyLamps` | Lampes : résolveur exhaustif + résolveur « humain » par techniques (difficulté, indices) |
| `GameCore` | Monde, déblocages, portefeuille idempotent, récompenses, défi du jour, série et veilleuses |
| `Persistence` | Sauvegarde versionnée, écriture atomique, secours, migrations, décodage tolérant |
| `GameAudio` | Directeur son et haptique : ambiances par lieu, fondus, anti-rafale, réglages, arrière-plan |
| `ContentForge` | Outil en ligne de commande de génération et de validation du contenu |
