# AUDIT REPORT — Lampion (29 septembre 2026)

> Audit adversarial du dépôt : cœur Swift `LampionKit`, maquette `prototype/index.html`, contenu et documents.
> **Il n'existe pas encore d'app iOS** (ni projet Xcode ni code SwiftUI) : tout ce qui relève d'iOS, des appareils,
> de SwiftUI, des notifications et de l'App Store est **NON TESTABLE** à ce stade et fait l'objet de la checklist finale.

## Méthode

1. Inventaire complet ; compilation debug avec avertissements traités en erreurs, compilation release.
2. Red team : chaque hypothèse de bug a d'abord été **reproduite** (tests « exit » pour les crashs), puis corrigée, puis couverte par un test de non-régression.
3. Attaque massive des générateurs (`contentforge audit`) : ~6 000 candidats, 21 configurations, invariants vérifiés un par un.
4. Fuzz : 20 000 opérations sur la série, 18 000 actions aléatoires sur le moteur, 600 sauvegardes corrompues, 32 000 instants autour de minuit et des changements d'heure dans 8 fuseaux.
5. Red team de la maquette dans Chromium (rafales de taps, double validation, rejouer, réinitialiser pendant une transition, navigation frénétique).
6. Deux passes de non-régression complètes après corrections.

## Problèmes trouvés : 24 — corrigés : 20 — restants : 4 (INFO, choix de réglage)

### CRITICAL (4, tous corrigés)
| # | Problème | Reproduction | Correction |
|---|---|---|---|
| C1 | Une seule entrée abîmée dans la sauvegarde effaçait **toute** la progression (0 lanterne) ; un identifiant de transaction invalide remettait le solde à 0 | JSON avec une date invalide → `solved: 0`, `balance: 0` | Décodage élément par élément (`Lossy.swift`), valeurs bornées |
| C2 | Un fichier **illisible** (appareil verrouillé) était traité comme **abîmé** : mis de côté, jeu repris à zéro, puis écrasé à la prochaine sauvegarde | Fichier remplacé par un dossier (lecture impossible) | `LoadSource.unavailable`, rien n'est déplacé, écriture bloquée ; écrire avant de charger est refusé |
| C3 | Principal **partiellement** lisible : entrées écartées en silence, puis la copie de secours intacte écrasée à la sauvegarde suivante → perte définitive | Trouvé par le fuzz (5 cas sur 600) | Comptage des pertes au décodage, fusion avec la copie de secours ; le fuzz vérifie désormais 0 perte sur 600 corruptions |
| C4 | Crash à la reprise d'un puzzle si l'état sauvegardé n'a pas la bonne taille (Interrupteurs, Cadenas, Lampes) | Tests « exit » : processus tué | Toutes les opérations vérifient la cohérence état/puzzle et échouent proprement |

### HIGH (4, tous corrigés)
| # | Problème | Correction |
|---|---|---|
| H1 | Lampes : une lampe posée **sur un mur** faisait valider une grille fausse | Marques hors cases blanches ignorées partout |
| H2 | Crash au décodage de contenu malformé (grille non rectangulaire, taille incohérente, seuils de paliers invalides) | Validation de forme au décodage (erreur, pas de crash) |
| H3 | Maquette : rejouer une lanterne allumée redonnait des Éclats (farming) | Récompense uniquement à la première résolution |
| H4 | Maquette : rejouer le défi du jour redonnait la récompense et augmentait la série | Idem, écran « déjà réussi » |

### MEDIUM (6, tous corrigés)
| # | Problème | Correction |
|---|---|---|
| M1 | Une lanterne verrouillée ou inconnue pouvait être « résolue » et payée | Le moteur vérifie qu'elle est jouable |
| M2 | « Continuer » renvoyait au Phare au lieu de la salle suivante | Recommandation par proximité (salle → bâtiment → quartier → suite) |
| M3 | Indice de secours : le Murmure révélait la case exacte d'une lampe | Révélation progressive (ligne → croisement → case) |
| M4 | Difficulté : des Lampes 4×4 classées Fanal | Décote des petites grilles ; audit refait |
| M5 | Maquette : erreurs JavaScript en tapant pendant l'animation de victoire ou en validant plusieurs fois | Fin de puzzle idempotente, actions ignorées sans puzzle actif |
| M6 | Une sauvegarde d'une version plus récente perdait ses champs inconnus à la réécriture | Copie conservée avant réécriture |

### LOW (6, tous corrigés)
Dates impossibles acceptées (30 février) · familles en double cassant la rotation du défi · dépassement numérique du portefeuille (crash) · générateur aléatoire sur l'intervalle entier (crash) · fichiers temporaires orphelins · Google Fonts dans la maquette (requête tierce, contraire à la privacy) · réinitialisation pendant une transition (écran périmé) · score de difficulté non borné au décodage.

### INFO (4, non corrigés : réglages de contenu)
- Lampes avec peu de murs (< 10 %) : 1 grille acceptée sur 300 → ne pas utiliser ces paramètres.
- Lampes 10×10 : 15 % d'acceptation (génération hors appareil, acceptable).
- Interrupteurs 2×2 : seulement 15 grilles distinctes possibles → réservé au tutoriel.
- Cadenas 3 chiffres : tous au palier Flamme → la variété viendra de la longueur, des symboles et des répétitions.

## Puzzles
- **Maquette** : 6 puzzles vérifiés par solveur (Lampes, Cadenas, Engrenages uniques ; Interrupteurs unique en 3 coups ; Suites ; Balances).
- **Générateurs** : ~6 000 candidats audités, 0 violation d'invariant (unicité, validité, déterminisme, aller-retour JSON, état initial non résolu, chaîne d'indices convergente, Murmure sans effet).
- **Empreintes de référence** : les puzzles générés sont figés par test (toute dérive d'un générateur est détectée).
- Aucun contenu final n'existe encore (les 1 000 puzzles seront générés en phase 9).

## Tests
- 99 tests Swift (+ plusieurs milliers de cas paramétrés et de fuzz), 0 avertissement en mode strict, release OK.
- `contentforge audit` : AUDIT OK. CI GitHub : build, tests, soak et audit sur Linux.
- Maquette : parcours complet + 7 scénarios red team, 0 erreur JavaScript, 0 débordement horizontal.

## Statut par domaine
| Domaine | Statut |
|---|---|
| Moteur de puzzles, générateurs, solveurs, indices | TESTÉ |
| Progression, économie, récompenses, défi du jour, série | TESTÉ |
| Sauvegarde (corruption, migration, schéma récent, écriture atomique) | TESTÉ (Linux ; APFS/iOS non testé) |
| Dates, fuseaux, minuit, heure d'été | TESTÉ |
| Localisation FR/EN des textes du moteur | TESTÉ (présence, paramètres) ; longueur à l'écran NON TESTÉ |
| Maquette HTML (navigation, puzzles, abus) | TESTÉ dans Chromium |
| Privacy du code | INSPECTÉ STATIQUEMENT (aucun réseau, aucune dépendance, aucun secret) |
| App iOS, SwiftUI, cycle de vie, iPhone/iPad, VoiceOver, notifications, performances sur appareil, App Store | NON TESTABLE (n'existe pas encore ; nécessite macOS/Xcode/appareils) |
