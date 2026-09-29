# Lampion (nom de travail)

Jeu de casse-têtes premium pour iPhone, iPad et Android : le joueur rallume, énigme après énigme, les lanternes de Vesper, une ville nocturne endormie. Hors ligne, sans compte, sans collecte de données, sans IA dans le produit.

## État du projet

Conception validée (phase 6). Développement en cours (phase 8), avec **Expo (React Native, TypeScript)** dans [`app/`](app). Le cœur du jeu est porté en TypeScript et testé ; il produit les mêmes puzzles, au bit près, que la version Swift d'origine. Les écrans sont en cours.

## App Expo

```
cd app
npm install
npm test            # tests du cœur (puzzles, progression, sauvegarde, son)
npm run typecheck
npx expo start      # puis scanner le QR code avec Expo Go sur le téléphone
```

| Document | Contenu |
|---|---|
| [PRODUCT_DISCOVERY.md](PRODUCT_DISCOVERY.md) | Vision, marché, concept, différenciation, naming, risques, roadmap |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Identité de marque, direction artistique « Encre & Lueur », tokens, composants, Nilo, icône |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Monde, déblocages, difficulté, 12 familles de puzzles, indices, économie, défi du jour, succès |
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
