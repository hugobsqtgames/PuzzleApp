# TECHNICAL ARCHITECTURE — Lampion

> Phase 7 (anticipée pour valider la faisabilité avant la maquette finale).
> Les extraits de code sont des **esquisses d'interfaces** destinées à fixer les contrats ; ils ne sont pas encore implémentés.

---

## Sommaire

1. [Principes](#1-principes)
2. [Stack et cibles](#2-stack-et-cibles)
3. [Structure du dépôt](#3-structure-du-dépôt)
4. [Modules et dépendances](#4-modules-et-dépendances)
5. [Moteur de puzzles (PuzzleKit)](#5-moteur-de-puzzles-puzzlekit)
6. [Aléatoire déterministe](#6-aléatoire-déterministe)
7. [Contenu : modèle de données](#7-contenu--modèle-de-données)
8. [ContentForge : pipeline de génération](#8-contentforge--pipeline-de-génération)
9. [GameCore : progression, économie, récompenses](#9-gamecore--progression-économie-récompenses)
10. [Persistance et migrations](#10-persistance-et-migrations)
11. [Couche application (SwiftUI)](#11-couche-application-swiftui)
12. [Services plateforme](#12-services-plateforme)
13. [Localisation](#13-localisation)
14. [Accessibilité](#14-accessibilité)
15. [Extensibilité commerciale future](#15-extensibilité-commerciale-future)
16. [Confidentialité](#16-confidentialité)
17. [Performance et énergie](#17-performance-et-énergie)
18. [Stratégie de tests](#18-stratégie-de-tests)
19. [CI et release](#19-ci-et-release)
20. [Guides d'extension (résumé)](#20-guides-dextension-résumé)

---

## 1. Principes

1. **Le cœur est du Swift pur.** Toute la logique (puzzles, progression, économie, sauvegarde) est indépendante de SwiftUI/UIKit : testable en ligne de commande, sur macOS comme sur Linux.
2. **Les données décrivent le monde, le code décrit les règles.** Ajouter un quartier, une salle, un cosmétique ou un puzzle ne demande aucun changement de code.
3. **Tout est injecté.** Horloge, calendrier, stockage, audio, haptique, notifications : derrière des protocoles, remplaçables en test.
4. **Aucune dépendance tierce en V1.**
5. **Déterminisme partout où il y a du hasard.**
6. **Idempotence partout où il y a une récompense.**

---

## 2. Stack et cibles

| Élément | Choix | Raison |
|---|---|---|
| Langage | Swift 6, mode de concurrence strict | Sécurité des données entre threads vérifiée à la compilation |
| UI | SwiftUI | Demandé ; adapté aux mises en page adaptatives et à l'accessibilité |
| État observable | Observation (`@Observable`) | Moderne, performant, moins de code que Combine |
| Cible minimale | iOS / iPadOS 18 (à reconfirmer au lancement du dev) | APIs SwiftUI récentes (transitions de navigation, `ViewThatFits`, `sensoryFeedback`, String Catalogs) |
| Stockage | Fichier JSON versionné (Codable), écriture atomique | Simple, transparent, migrable, testable |
| Architecture UI | MV + ViewModels `@Observable` par écran + services injectés via `Environment` | Évite la sur-ingénierie (pas de framework tiers type TCA) tout en séparant les responsabilités |
| Build | Projet Xcode fin + **package Swift local** multi-cibles | Modularité, compilation incrémentale, tests hors app |
| Outils | CLI Swift `ContentForge` | Génération/validation du contenu au build |

**Environnement :** l'app iOS se compile sur macOS + Xcode. Les cibles Swift pures (PuzzleKit, familles, GameCore, Persistence, ContentForge) se compilent aussi sur Linux (toolchain Swift officiel), ce qui permet de faire tourner la validation de contenu et les tests de génération massifs sur n'importe quelle CI.

---

## 3. Structure du dépôt

```
PuzzleApp/
├─ App/                          # Cible iOS (Xcode)
│  ├─ LampionApp.swift           # point d'entrée, composition des dépendances
│  ├─ Resources/                 # Assets.xcassets, Localizable.xcstrings, sons
│  └─ Info.plist, PrivacyInfo.xcprivacy
├─ Packages/LampionKit/          # Package Swift local
│  ├─ Package.swift
│  ├─ Sources/
│  │  ├─ PuzzleKit/              # protocoles, RNG, registre, types communs
│  │  ├─ Families/
│  │  │  ├─ Sequences/ Lanterns/ Locks/ Gears/ Marquetry/ Liars/
│  │  │  ├─ Inquiries/ Scales/ Patterns/ Thread/ Switches/ Mirrors/ Riddles/
│  │  ├─ GameCore/               # progression, économie, récompenses, défi du jour, succès
│  │  ├─ Persistence/            # SaveStore, schéma, migrations
│  │  ├─ ContentModel/           # modèles du monde, chargement des packs
│  │  ├─ Platform/               # protocoles Clock, Audio, Haptics, Notifications, Entitlements
│  │  ├─ DesignSystem/           # tokens, composants, Nilo (SwiftUI)
│  │  ├─ FamilyViews/            # une vue SwiftUI par famille (SwiftUI)
│  │  └─ Features/               # écrans : Home, Map, District, Building, Room, Puzzle, Notebook, Settings…
│  └─ Tests/
│     ├─ PuzzleKitTests/ FamiliesTests/ GameCoreTests/ PersistenceTests/
│     ├─ ContentTests/           # validation des packs livrés
│     └─ SoakTests/              # génération massive (longue durée, hors CI rapide)
├─ Tools/ContentForge/           # CLI : generate / validate / place / report
├─ Content/                      # packs de contenu versionnés (JSON) + rapports
│  ├─ world/vesper.json          # quartiers, bâtiments, salles, seuils
│  ├─ puzzles/<famille>/*.json   # puzzles figés
│  ├─ riddles/fr/*.json, riddles/en/*.json
│  ├─ cosmetics.json, achievements.json, collectibles.json, dialogue/*.json
│  └─ daily-pool/*.json          # pool de repli du défi du jour
├─ AppUITests/                   # tests UI XCTest
├─ prototype/                    # maquette HTML navigable
└─ docs/                         # guides (ajouter un puzzle, une famille, une langue…)
```

---

## 4. Modules et dépendances

```
                 ┌──────────────┐
                 │  App (iOS)   │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │   Features   │ SwiftUI
                 └─┬───┬────┬───┘
         ┌─────────┘   │    └──────────┐
 ┌───────▼──────┐ ┌────▼──────┐ ┌──────▼──────┐
 │ DesignSystem │ │FamilyViews│ │  Platform   │
 └──────────────┘ └────┬──────┘ └──────┬──────┘
                       │               │
            ┌──────────▼───┐   ┌───────▼──────┐
            │   Families   │   │   GameCore   │─────┐
            └──────┬───────┘   └───┬──────┬───┘     │
                   │               │      │         │
            ┌──────▼───────┐ ┌─────▼────┐ │  ┌──────▼──────┐
            │  PuzzleKit   │◄┤ContentMdl│ └─►│ Persistence │
            └──────────────┘ └──────────┘    └─────────────┘

 Swift pur (Linux OK) : PuzzleKit, Families, ContentModel, GameCore, Persistence, Platform(protocoles)
 SwiftUI              : DesignSystem, FamilyViews, Features, App
```

Règles vérifiées en CI (script de dépendances) : aucun module Swift pur n'importe SwiftUI/UIKit ; `Features` ne dépend jamais directement d'une famille concrète (passe par le registre).

---

## 5. Moteur de puzzles (PuzzleKit)

### 5.1 Contrat d'une famille

```swift
public protocol PuzzleFamily: Sendable {
    associatedtype Puzzle: PuzzleDefinition
    associatedtype State: PuzzlePlayerState          // état du joueur, sauvegardé en continu
    associatedtype Parameters: Codable & Sendable    // paramètres de génération

    static var id: FamilyID { get }                  // "lanterns", "locks"…
    static var formatVersion: Int { get }            // version du format de données

    func generate(_ parameters: Parameters, rng: inout SeededRNG) -> Puzzle?
    func solve(_ puzzle: Puzzle, limit: Int) -> SolveReport<Puzzle>   // solutions (≤ limit) + trace
    func validate(_ puzzle: Puzzle, state: State) -> ValidationResult  // correct / incomplet / erreurs localisées
    func rate(_ report: SolveReport<Puzzle>) -> DifficultyScore
    func hint(_ puzzle: Puzzle, state: State, level: HintLevel) -> Hint?
    func initialState(for puzzle: Puzzle) -> State
    func fingerprint(_ puzzle: Puzzle) -> Fingerprint  // canonique (symétries), pour la déduplication
}

public struct SolveReport<P> {
    public let solutionCount: Int                    // borné par `limit` (2 suffit pour tester l'unicité)
    public let trace: [DeductionStep]                // étapes du solveur « humain »
    public let searchNodes: Int                      // effort du solveur complet
}

public struct DeductionStep: Codable, Sendable {
    public let technique: TechniqueID                // classée par niveau
    public let focus: [CellRef]                      // zone concernée (pour le Murmure)
    public let effect: StepEffect                    // conclusion (pour l'Éclairage)
    public let explanationKey: LocalizedTemplate     // texte localisé paramétré (pour la Piste)
}
```

### 5.2 Registre

`FamilyRegistry` associe `FamilyID` → famille (logique) et, côté app, `FamilyID` → vue (`FamilyViewProvider`). Les puzzles sont stockés sous forme d'enveloppe typée :

```swift
public struct PuzzleEnvelope: Codable, Sendable {
    public let id: PuzzleID            // "clockworks.b2.r3.07" — stable pour toujours
    public let family: FamilyID
    public let formatVersion: Int
    public let tier: Tier
    public let score: DifficultyScore
    public let payload: Data           // Puzzle encodé de la famille
    public let reward: RewardSpec
    public let localizationSlot: String? // pour les Énigmes dépendantes de la langue
}
```

### 5.3 Validation de contenu (commune à toutes les familles)

```
accept(puzzle) ⇔
    solve(puzzle, limit: 2).solutionCount == (family.requiresUniqueness ? 1 : ≥ 1)
  ∧ validate(puzzle, state: solutionState) == .correct
  ∧ rate(report).tier == tierCible
  ∧ fingerprint(puzzle) ∉ déjàAcceptés
  ∧ contraintesSpécifiques(famille)     // ex. Suites : aucun distracteur explicable
  ∧ contraintesAffichage(puzzle)        // ex. grille ≤ 8×8 sur iPhone pour ce palier
```

---

## 6. Aléatoire déterministe

- `SeededRNG` : implémentation **Xoshiro256\*\*** initialisée via **SplitMix64**, conforme à `RandomNumberGenerator`.
- Interdit dans le code de génération : `SystemRandomNumberGenerator`, `.randomElement()` sans générateur explicite, itération sur `Set`/`Dictionary` (ordre dépendant d'une graine de hachage aléatoire par processus), `Double` pour les décisions structurelles, `Date()` implicite.
- Aides : `rng.pick(from: [T])`, `rng.shuffle(&array)`, `rng.int(in:)` — toutes **définies par nous** (l'algorithme de `shuffle` de la bibliothèque standard n'est pas garanti stable entre versions de Swift).
- Test de reproductibilité : pour 10 000 seeds et chaque famille, `encode(generate(seed))` est comparé à un **instantané** (hash) enregistré ; toute divergence fait échouer la CI (et impose d'incrémenter `formatVersion`/version du générateur).
- Seeds dérivées : `seed(daily, date, lang, genVersion) = SplitMix64(FNV1a64("daily|2026-09-29|fr|3"))`.

---

## 7. Contenu : modèle de données

### 7.1 Monde (`Content/world/vesper.json`, extrait)

```json
{
  "id": "vesper",
  "districts": [
    {
      "id": "clockworks",
      "nameKey": "district.clockworks.name",
      "hue": "district.clockworks",
      "unlock": { "totalLights": 110 },
      "music": "clockworks_theme",
      "buildings": [
        {
          "id": "clockworks.b1",
          "nameKey": "building.springs_workshop.name",
          "unlock": { "previousBuildingLights": 20 },
          "resident": "resident.clockmaker_apprentice",
          "rooms": [
            {
              "id": "clockworks.b1.r1",
              "unlock": { "previousRoomLights": 6 },
              "art": "room_springs_01",
              "collectible": "collectible.broken_key",
              "lanterns": [
                { "puzzle": "clockworks.b1.r1.01", "anchor": "object.pendulum", "position": [0.22, 0.61] }
              ]
            }
          ],
          "keystone": { "puzzle": "clockworks.b1.key", "unlock": { "buildingLights": 30 } }
        }
      ]
    }
  ]
}
```

### 7.2 Validation structurelle (ContentTests)

- Chaque `puzzle` référencé existe, chaque puzzle existant est placé une et une seule fois.
- Chaque clé de localisation existe dans **toutes** les langues.
- Seuils cohérents (monotones, atteignables) ; garantie « ≥ 3 lanternes jouables » vérifiée par simulation de tous les ordres de résolution plausibles (BFS sur des états agrégés).
- Distribution de paliers par quartier conforme à GAME_DESIGN § 4.2 (tolérance ±3 points).
- Jamais 3 puzzles consécutifs de la même famille dans l'ordre recommandé d'une salle.

---

## 8. ContentForge : pipeline de génération

```
contentforge generate --family lanterns --tier flame --count 500 --seed-base 1000
contentforge validate Content/           # revalide tout (appelé en CI)
contentforge place   --world Content/world/vesper.json   # remplit les salles selon la courbe
contentforge report  --out Content/reports/               # histogrammes, doublons, rejets
```

Pipeline par candidat :

```
seed → GENERATE → SOLVE(limit 2) → UNIQUE? → VALIDATE(solution) → RATE → TIER OK?
     → FINGERPRINT unique? → CONTRAINTES famille/affichage → ACCEPT (écrit JSON) | REJECT (motif journalisé)
```

- Parallélisé (tâches Swift concurrency), budget de temps par candidat, compteur de rejets par motif.
- **Seuils d'alerte** : taux de rejet > 90 % pour un couple famille/palier → le générateur est mal paramétré (signalé dans le rapport).
- Les puzzles acceptés sont **écrits dans le dépôt** (données complètes, pas seulement la seed) ; une revue humaine d'échantillons est faite avant intégration.
- Les lanternes-clés et Énigmes sont écrites à la main dans le même format, validées par les mêmes tests (hors solveur pour les Énigmes).

---

## 9. GameCore : progression, économie, récompenses

### 9.1 Modèle

```swift
public struct GameState: Codable, Sendable {
    public var solved: [PuzzleID: SolveRecord]        // date, indices utilisés, erreurs, clairvoyance
    public var inProgress: [PuzzleID: Data]           // état joueur encodé (reprise exacte)
    public var wallet: Wallet                         // solde Éclats + journal de transactions (ids)
    public var grantedRewards: Set<RewardID>          // idempotence
    public var cosmetics: CosmeticsState              // possédés + équipés
    public var achievements: [AchievementID: AchievementProgress]
    public var daily: DailyState                      // dates résolues, veilleuses, record, maxSeenDate
    public var collectibles: Set<CollectibleID>
    public var seenDialogue: Set<DialogueID>
    public var lastLocation: LocationRef?             // pour « Continuer »
}
```

Remarque : `Set` est autorisé ici (état, pas génération) ; l'encodage JSON trie les clés et les ensembles pour des sauvegardes stables et comparables.

### 9.2 Services (purs, testables)

| Service | Responsabilité |
|---|---|
| `ProgressionService` | Lumières totales, états de verrouillage (salle/bâtiment/quartier/lanterne-clé), « prochain objectif », lanterne recommandée pour *Continuer* |
| `RewardService` | Calcule et **attribue une seule fois** les récompenses d'un événement (`RewardID` = hash de l'événement) ; met en file les célébrations |
| `EconomyService` | Crédit/débit d'Éclats, transactions idempotentes, jamais de solde négatif |
| `HintService` | Déblocage des niveaux, coût, recharge du Murmure, journalisation dans `SolveRecord` |
| `DailyService` | Seed du jour, rotation famille/palier, série, veilleuses, rattrapage, cas d'horloge |
| `AchievementService` | Évalue les succès à partir d'événements de domaine |
| `CosmeticsService` | Possession, équipement, contraintes de compatibilité |

Toutes les actions passent par des **événements de domaine** (`PuzzleSolved`, `HintUsed`, `DailyCompleted`…) traités par un `GameEngine` unique qui produit le nouvel état + une liste d'effets (célébrations, sons, sauvegarde). Cela rend la logique **déterministe et rejouable** en test.

### 9.3 Horloge et calendrier

`Clock` (maintenant) et `Calendar` (fuseau, locale) sont injectés. Le « jour » est toujours calculé via `calendar.dateComponents([.year, .month, .day], from: now)` dans le fuseau courant. Tests paramétrés sur fuseaux, DST, changements de date.

---

## 10. Persistance et migrations

- Fichier `Application Support/Lampion/save.json` + `save.backup.json`.
- **Écriture :** encodage → écriture dans un fichier temporaire → `replaceItemAt` atomique → rotation de la sauvegarde précédente vers `backup`. Exécutée sur un acteur dédié (`SaveStore`), hors thread principal, **coalescée** (au plus une écriture toutes les 2 s, plus une écriture immédiate lors d'une récompense et au passage en arrière-plan).
- **Enveloppe versionnée :**

```json
{ "schemaVersion": 1, "appVersion": "1.0.0", "savedAt": "2026-09-29T20:14:03Z", "state": { … } }
```

- **Migrations :** `Migration_1_to_2`, `Migration_2_to_3`… appliquées en chaîne, chacune testée avec des **fixtures** (vraies sauvegardes de chaque version publiée, conservées à vie dans `Tests/PersistenceTests/Fixtures`).
- **Robustesse :** fichier illisible → backup → sinon décodage « tolérant » champ par champ (chaque champ a une valeur par défaut) → sinon nouvel état + fichier corrompu conservé à part (jamais écrasé) pour diagnostic. Jamais de crash au démarrage.
- **Contenu retiré ou renommé :** les `PuzzleID` sont stables pour toujours ; un puzzle retiré conserve sa lumière (table d'alias dans le contenu).
- **iCloud (post-V1) :** synchronisation du même document via CloudKit (base privée) avec fusion par champ (union des ensembles, max des compteurs, journal de transactions fusionné par id). Le modèle d'état est **déjà conçu pour être fusionnable** (ensembles et journaux plutôt que compteurs bruts).

---

## 11. Couche application (SwiftUI)

### 11.1 Navigation

- `AppRouter` `@Observable` : pile de routes typées (`enum Route { case map, district(ID), building(ID), room(ID), puzzle(PuzzleID), notebook, settings, cosmetics, daily }`).
- iPhone : `NavigationStack(path:)` + transitions spatiales (`matchedGeometryEffect` / transitions de zoom).
- iPad : même pile, mais écrans composés en **deux ou trois colonnes** selon la largeur (`ViewThatFits` + tailles de conteneur), panneaux latéraux à la place des feuilles.
- Restauration : la route courante est sauvegardée (`lastLocation`) → relance au même endroit, puzzle compris (état exact via `inProgress`).

### 11.2 Écran de puzzle générique

`PuzzleScreen` ne connaît aucune famille : il affiche consigne, plateau (fourni par `FamilyViewProvider`), barre d'actions (indice, annuler, pause), et orchestre validation → événement → célébration. Chaque vue de famille reçoit un `Binding<State>` et un `PuzzleInteractionContext` (sons, haptique, accessibilité).

### 11.3 Célébrations

`CelebrationQueue` : file d'effets produits par le `GameEngine` (lanterne, salle, bâtiment, déblocage, succès), joués **l'un après l'autre**, interruptibles. L'état est **déjà sauvegardé avant** l'animation : quitter l'app en pleine animation ne perd rien et ne rejoue pas la récompense (seule l'animation peut être rejouée au retour, sans double crédit).

---

## 12. Services plateforme

| Protocole | Implémentation V1 | Notes |
|---|---|---|
| `AudioService` | `AVAudioEngine` : bus musique + bus effets, fondus | Respecte le mode silencieux pour la musique (catégorie *ambient*), réglages musique / effets séparés |
| `HapticsService` | `UIFeedbackGenerator` / `sensoryFeedback` | Désactivable ; aucune haptique si le système les coupe |
| `NotificationService` | `UNUserNotificationCenter`, notifications locales | Reprogrammation à chaque passage en arrière-plan ; plafond 1/jour |
| `EntitlementService` | Toujours « gratuit complet » en V1 | Point d'entrée du futur Premium |
| `StoreService` | `NoOpStoreService` | Futur StoreKit 2 |
| `AdService` | `NoOpAdService` | Aucun SDK dans le binaire V1 |

---

## 13. Localisation

- Interface : **String Catalogs** (`Localizable.xcstrings`), FR = langue de développement, EN complète. Aucune chaîne en dur dans les vues (règle de lint : littéraux de texte interdits hors `LocalizedStringResource`).
- Contenu : clés dans les JSON de contenu → tables `Content.xcstrings` (noms de lieux, répliques, objets, succès).
- Puzzles textuels générés (Menteurs, Enquêtes) : **gabarits par langue** avec variables typées (`{creature}`, `{count}`) et accords gérés par la grammaire de chaque langue (pluriels via les règles CLDR des String Catalogs ; genre porté par l'entité : chaque créature a un genre grammatical *par langue*).
- Énigmes : fichiers par langue ; résolution par `localizationSlot`.
- Ajouter une langue = ajouter une colonne au catalogue + les gabarits + les énigmes de cette langue + tests de complétude automatiques.
- Changement de langue système : l'app relit la langue au lancement ; l'état n'est jamais indexé par un texte.

---

## 14. Accessibilité

- Tous les composants du DesignSystem ont libellé, valeur, indication et traits VoiceOver.
- Chaque famille fournit un **modèle d'accessibilité** : description de l'élément focalisé, actions personnalisées (`accessibilityAction(named:)`), annonces de changement (`AccessibilityNotification.Announcement`).
- Dynamic Type jusqu'à AX5 : mises en page alternatives vérifiées par snapshot.
- Réduction des animations, transparence réduite, contraste augmenté : lus depuis l'`Environment`, chaque animation signature a sa variante.
- Tests : audit d'accessibilité automatisé dans les tests UI (`performAccessibilityAudit`) sur chaque écran.

---

## 15. Extensibilité commerciale future

Préparé, **non activé**, **non présent dans l'interface V1** :

- `EconomyService` distingue déjà l'origine des Éclats (`earned` / `purchased` futur).
- `EntitlementService.has(.premium)` : un seul point de lecture.
- `AdPolicy` (futur) : plafond de fréquence (ex. 1 interstitielle / 20 min et jamais avant 3 puzzles), **jamais** pendant un puzzle ni sur l'écran de réussite immédiate, récompensée uniquement à l'initiative du joueur ; désactivée si Premium. Testée unitairement avant toute activation.
- `StoreService` : catalogue de produits piloté par les données ; aucun contenu de progression achetable (règle vérifiée par test sur le catalogue).
- Nouveaux mondes : packs de contenu ; potentiellement livrés via *On-Demand Resources* / *Background Assets* d'Apple (sans serveur propriétaire).

---

## 16. Confidentialité

- **Aucune donnée** ne quitte l'appareil en V1 : pas de réseau, pas d'analytics, pas de crash reporter tiers.
- `PrivacyInfo.xcprivacy` : déclare les **API à justification requise** réellement utilisées (ex. `UserDefaults` pour les préférences, horodatages de fichiers) avec les motifs officiels ; aucune donnée collectée.
- Étiquette App Store visée : « Données non collectées » — **à confirmer au moment de la soumission** en fonction du binaire réel (y compris les rapports de plantage Apple, qui relèvent du consentement de l'utilisateur au niveau du système).
- Test automatisé : aucune cible ne lie `Network`/`URLSession` en V1 (vérification des symboles dans la CI).
- La politique de confidentialité sera **rédigée à partir de ce comportement vérifié**, pas l'inverse, et devra être relue par vous (et idéalement un juriste).

---

## 17. Performance et énergie

| Budget | Cible |
|---|---|
| Lancement à froid → accueil interactif | < 1,0 s sur l'iPhone le plus ancien supporté |
| Ouverture d'un puzzle | < 100 ms (données pré-décodées par salle) |
| Génération du défi du jour sur l'appareil | < 1,5 s, hors thread principal, sinon repli sur pool |
| Écriture de sauvegarde | < 20 ms, hors thread principal |
| Mémoire en jeu | < 150 Mo |
| Taille de l'app | < 150 Mo (illustrations vectorielles, sons compressés) |
| Images par seconde | 60 fps stables, 120 fps visé sur ProMotion |

Énergie : aucune boucle de rendu permanente (`TimelineView` seulement quand l'écran est visible et animé), animations ambiantes suspendues en arrière-plan / économie d'énergie / mouvement réduit, aucun timer actif hors puzzle, aucune tâche d'arrière-plan.

---

## 18. Stratégie de tests

| Niveau | Contenu | Où |
|---|---|---|
| **Unitaires — familles** | Pour chaque famille : générateur (déterminisme, bornes), solveur (cas connus, puzzles à 0/1/n solutions construits à la main), validateur (cas limites), indices (l'indice mène toujours à un état plus proche de la solution), rater (monotonie sur des exemples ordonnés) | Linux + macOS |
| **Propriétés** | Pour N seeds : `validate(solution) == correct` ; `solve(generate(s))` unique quand requis ; `fingerprint` invariant par symétrie ; Suites : aucun distracteur explicable | Linux + macOS |
| **Soak (longue durée)** | `contentforge soak --family all --hours 8` : génère des millions de candidats, statistiques de rejet, recherche de contre-exemples | Nuit / manuel |
| **GameCore** | Déblocages, seuils, garantie « ≥ 3 jouables », double récompense impossible, économie (profils simulés), série (fuseaux, DST, horloge avancée/reculée, minuit pendant un puzzle), succès | Linux + macOS |
| **Persistance** | Aller-retour, migrations sur fixtures, fichier tronqué, JSON invalide, champs manquants/inconnus, disque plein (écriture échouée → état mémoire conservé, nouvel essai) | Linux + macOS |
| **Contenu** | Références, localisation complète, distribution, re-validation de tous les puzzles livrés | CI à chaque commit |
| **UI (XCTest)** | Onboarding, navigation complète, puzzle → réussite, erreur, indices (4 niveaux), pause, reprise après fermeture forcée, réglages, défi du jour, rotation iPad, changement de langue, tailles de texte | macOS |
| **Snapshots visuels** | Chaque écran × {iPhone SE, iPhone standard, iPhone Pro Max, iPad 11", iPad 13"} × {Dynamic Type L, AX3} × {normal, contraste élevé} | macOS |
| **Performance** | `XCTMetric` : lancement, ouverture de puzzle, génération quotidienne, écriture de sauvegarde | macOS |
| **Manuels** | VoiceOver de bout en bout, mémoire faible, arrière-plan pendant animation, manipulations rapides | Appareils réels |

---

## 19. CI et release

- **CI rapide (chaque commit)** : build Linux des modules purs + tests unitaires + validation de contenu ; build macOS + tests UI essentiels + snapshots.
- **CI nocturne** : soak tests de génération, tests UI complets sur plusieurs simulateurs, audit d'accessibilité.
- **Release** : numéro de version sémantique ; `schemaVersion` incrémenté à tout changement de sauvegarde (avec migration + fixture) ; contenu figé et taggé ; TestFlight → App Store.

---

## 20. Guides d'extension (résumé)

Les guides complets seront dans `docs/` pendant le développement.

| Je veux… | Étapes |
|---|---|
| **Ajouter un puzzle** | Générer via ContentForge ou écrire le JSON → `contentforge validate` → le placer dans `world/*.json` → tests de contenu |
| **Créer une famille** | Cible `Families/<Nom>` implémentant `PuzzleFamily` → vue dans `FamilyViews` → enregistrement dans les registres → tests (unitaires + propriétés) → glyphe + textes de règles + démonstration |
| **Créer un monde / quartier** | Ajouter l'entrée dans `world/*.json` + illustrations modulaires + clés de localisation + puzzles placés → tests de contenu (seuils, distribution) |
| **Ajouter une langue** | Colonne dans les String Catalogs + gabarits des familles textuelles + énigmes de la langue → tests de complétude |
| **Ajouter un cosmétique** | Entrée dans `cosmetics.json` + rendu vectoriel dans le DesignSystem + source d'obtention → test de compatibilité avec toutes les expressions |
| **Modifier la difficulté** | Ajuster les seuils de palier de la famille (config) ou les paramètres de génération → régénérer → rapport → revue |
| **Modifier la sauvegarde** | Nouveau champ avec valeur par défaut ; si changement de structure : `schemaVersion + 1`, migration, fixture |
