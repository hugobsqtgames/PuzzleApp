# GAME DESIGN — Lampion

> Phase 3. Règles du jeu, contenu, progression chiffrée, économie, familles de puzzles, défi du jour, succès, cosmétiques, narration.
> Tous les chiffres sont des **valeurs de départ** à ajuster en test de jeu. Ils vivent dans des fichiers de configuration, pas dans le code.

---

## Sommaire

1. [Piliers](#1-piliers)
2. [Structure du monde et volumes](#2-structure-du-monde-et-volumes)
3. [Règles de déblocage](#3-règles-de-déblocage)
4. [Difficulté](#4-difficulté)
5. [Familles de puzzles — spécifications](#5-familles-de-puzzles--spécifications)
6. [Indices](#6-indices)
7. [Économie](#7-économie)
8. [Défi du jour et série](#8-défi-du-jour-et-série)
9. [Succès (Carnet)](#9-succès-carnet)
10. [Collection](#10-collection)
11. [Cosmétiques](#11-cosmétiques)
12. [Narration et personnages](#12-narration-et-personnages)
13. [Notifications](#13-notifications)
14. [Onboarding](#14-onboarding)
15. [Procédure d'équilibrage](#15-procédure-déquilibrage)

---

## 1. Piliers

1. **Le déclic avant tout.** Chaque puzzle doit contenir une idée. Un puzzle qui ne demande que de l'exécution est rejeté.
2. **Jamais bloqué.** À tout moment, il existe au moins 3 lanternes jouables qui font progresser.
3. **Visible et cumulatif.** Chaque action réussie change durablement quelque chose à l'écran.
4. **Aider sans humilier.** Les indices font partie du jeu ; les utiliser ne coûte jamais de progression.
5. **Court par défaut, profond si on veut.** Puzzles de 1–5 min sur le chemin principal ; les Astres sont facultatifs.

---

## 2. Structure du monde et volumes

### 2.1 Hiérarchie

```
Vesper (saison 1)
 ├─ Le Phare (hub + tutoriel)          1 bâtiment · 4 salles · 24 lanternes
 ├─ 6 quartiers                         × 4 bâtiments · × 4 salles · 10 lanternes/salle
 │                                        = 160 lanternes par quartier (dont 4 lanternes-clés)
 │                                        Salles 1–3 : 10 lanternes · Salle 4 : 9 lanternes + la lanterne-clé du bâtiment
 └─ Le Grenier de l'Allumeur (finale)   1 salle · 16 lanternes
```

**Total : 24 + 6 × 160 + 16 = 1 000 lanternes.**

### 2.2 Quartiers, bâtiments, familles

Familles : SU Suites · LA Lampes · CA Cadenas · EN Engrenages · MA Marqueterie · ME Menteurs · EQ Enquêtes · BA Balances · MO Motifs · FI Fil · IN Interrupteurs · MI Miroirs · ÉN Énigmes (écrites).

| Quartier | Bâtiments | Familles introduites | Familles principales (≈ 60 %) | Invitées (≈ 40 %) |
|---|---|---|---|---|
| **Le Phare** | Le Phare (Cuisine, Escalier, Chambre de veille, Lanterne) | IN, LA, SU | IN, LA, SU | — |
| **Bibliothèque Murmurante** | Salle des Cartes · Scriptorium · Tour des Archives · Salle de Lecture | MO, CA | SU, MO | IN, LA, CA |
| **Horlogerie** | Atelier des Ressorts · Tour du Carillon · Salle des Pendules · Chambre des Automates | EN | EN, CA | SU, MO, LA, IN |
| **Serre de Verre** | Orangerie · Bassin aux Nénuphars · Pépinière · Palmarium | FI, MA | FI, MA | EN, LA, MO |
| **Marché Flottant** | Pont des Épices · Barque du Changeur · Halle aux Poids · Quai des Lampions | BA | BA, CA | MA, FI, SU, EN |
| **Théâtre d'Ombres** | Foyer · Coulisses · Loge du Souffleur · Grande Scène | ME, EQ | ME, EQ | BA, MO, FI |
| **Observatoire** | Salle des Lentilles · Coupole · Bibliothèque des Astres · Chambre Noire | MI | MI, MO | toutes |
| **Grenier de l'Allumeur** | (finale) | — | toutes, paliers Fanal/Astre | — |

Chaque bâtiment se termine par une **lanterne-clé** : une Énigme écrite à la main (24 au total), ou un puzzle d'une famille principale conçu à la main. Les 24 lanternes-clés sont les seules à être entièrement écrites/choisies par un humain ; les ~976 autres sont générées puis sélectionnées (voir `TECHNICAL_ARCHITECTURE.md` § 8).

### 2.3 Répartition par famille (après placement)

| SU | LA | CA | EN | MA | ME | EQ | BA | MO | FI | IN | MI | ÉN | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 90 | 95 | 90 | 90 | 85 | 70 | 70 | 85 | 90 | 85 | 70 | 70 | 20* | 1 000 |

\* 24 lanternes-clés, dont ~20 Énigmes écrites et ~4 puzzles de famille conçus à la main (FI, MA, MI, EN spectaculaires).

---

## 3. Règles de déblocage

Règle d'or : **on débloque par quantité de lumière, jamais par un puzzle précis.**

| Élément | Condition d'ouverture |
|---|---|
| Lanternes d'une salle | Toutes jouables dès l'entrée (ordre recommandé affiché) |
| Salle suivante d'un bâtiment | Salle précédente ≥ **60 %** de ses lanternes, arrondi au supérieur (6 / 10 ; 4 / 6 au Phare) |
| Lanterne-clé | Bâtiment ≥ **30 / 39** |
| Bâtiment suivant d'un quartier | Bâtiment précédent ≥ **20 / 40** |
| Quartier suivant | Lumières **totales** ≥ seuil ci-dessous |

| Quartier | Seuil (lumières totales) | Lanternes disponibles avant | Part requise |
|---|---|---|---|
| Bibliothèque | 14 | 24 | 58 % |
| Horlogerie | 110 | 184 | 60 % |
| Serre | 206 | 344 | 60 % |
| Marché | 302 | 504 | 60 % |
| Théâtre | 398 | 664 | 60 % |
| Observatoire | 494 | 824 | 60 % |
| Grenier | 590 **+ 4 lettres de l'Allumeur sur 6** | 984 | 60 % |

Les lettres sont obtenues en allumant la lanterne-clé du 4ᵉ bâtiment de chaque quartier → la finale demande d'avoir *visité* la plupart des quartiers en profondeur, sans exiger la perfection. **4 lettres sur 6 suffisent** : exiger les 6 aurait rendu la fin dépendante de 6 énigmes précises (Fanal), contraire à la règle d'or. Ce défaut a été trouvé par le test automatique « jamais bloqué » (VALIDATION V13).

**Garantie testée automatiquement :** pour tout état de sauvegarde atteignable, le nombre de lanternes jouables non résolues est ≥ 3 (sauf fin de jeu).

---

## 4. Difficulté

### 4.1 Paliers et score

Chaque puzzle reçoit un **score brut** calculé par le `DifficultyRater` de sa famille (§ 5), converti en palier par seuils propres à la famille :

| Palier | Score normalisé | Intention |
|---|---|---|
| Étincelle | 0–15 | Une seule déduction, découverte des règles |
| Lueur | 15–30 | Règles appliquées directement |
| Flamme | 30–50 | Enchaînement de déductions |
| Brasier | 50–70 | Une technique non évidente |
| Fanal | 70–85 | Techniques combinées |
| Astre | 85–100 | Maîtrise ; jamais nécessaire pour progresser |

### 4.2 Distribution par quartier (en %)

| Quartier | Étincelle | Lueur | Flamme | Brasier | Fanal | Astre |
|---|---|---|---|---|---|---|
| Phare | 70 | 30 | | | | |
| Bibliothèque | 25 | 45 | 25 | 5 | | |
| Horlogerie | 10 | 35 | 35 | 15 | 5 | |
| Serre | 5 | 25 | 40 | 20 | 10 | |
| Marché | | 15 | 35 | 30 | 15 | 5 |
| Théâtre | | 10 | 30 | 30 | 20 | 10 |
| Observatoire | | | 25 | 30 | 30 | 15 |
| Grenier | | | | 25 | 45 | 30 |

**Exception d'introduction :** les 3 premières lanternes d'une famille nouvelle sont toujours Étincelle, quel que soit le quartier, et contiennent la démonstration animée des règles.

### 4.3 Courbe dans un bâtiment (dents de scie)

Salle 1 : paliers bas → Salle 4 : paliers hauts → lanterne-clé = sommet. Le bâtiment suivant commence un palier en dessous du sommet précédent. Dans une salle, les 10 lanternes sont ordonnées par difficulté croissante (ordre recommandé), avec une alternance des familles (jamais 3 fois la même famille d'affilée).

---

## 5. Familles de puzzles — spécifications

Les références « Akari », « Lights Out », « zebra puzzle » désignent des **genres** et restent internes : aucun nom de jeu tiers n'apparaît dans les textes de l'app ni dans les métadonnées App Store.

Format pour chaque famille : **Règle** (telle qu'affichée) · **Interaction** · **Paramètres de difficulté** · **Génération** · **Solveur et techniques** · **Validation / unicité** · **Indices** · **Accessibilité** · **Variantes**.

### 5.1 Suites (SU)

- **Règle :** « Quelle est la suite logique ? Choisis la bonne réponse. »
- **Interaction :** suite de 4–7 éléments affichée ; 4 options en QCM ; bouton Valider.
- **Types d'éléments :** nombres, formes (nombre de côtés, rotation, remplissage), positions sur une petite grille, horloges.
- **Grammaire de règles :** arithmétique (+k), géométrique (×k), différences d'ordre 2, alternance de deux règles, somme des deux précédents, règles par attribut (forme : rotation +90°, couleur cyclique, nombre de points +1), combinaisons de 2 règles indépendantes (attributs).
- **Paramètres :** complexité de la règle (nombre de primitives), nombre d'attributs indépendants, longueur visible, taille des nombres (bornée à 3 chiffres hors Astre ; aucune multiplication > 12×12 avant Brasier).
- **Validation (anti-ambiguïté) :** banque de règles `R` énumérée jusqu'à une complexité `k+1` ; le puzzle est accepté seulement si : (1) la bonne réponse est expliquée par une règle de complexité `k` ; (2) **aucun** distracteur n'est expliqué par une règle de complexité ≤ `k+1` ; (3) les distracteurs sont plausibles (erreurs typiques : mauvaise opération, décalage d'un cran, un seul attribut faux).
- **Difficulté :** complexité `k` de la règle, nombre d'attributs, « distance » des distracteurs.
- **Indices :** Murmure « Regarde l'écart entre deux termes voisins. » · Piste « Les écarts eux-mêmes augmentent. » · Éclairage « Les écarts sont +2, +4, +6 : le suivant est +8. » · Solution.
- **Accessibilité :** nombres lus nativement ; formes décrites (« triangle plein tourné vers la droite »).

### 5.2 Lampes (LA) — règles du genre « Akari »

- **Règle :** « Place des lanternes pour éclairer toutes les cases blanches. Deux lanternes ne doivent pas se voir. Un mur numéroté touche exactement ce nombre de lanternes. »
- **Interaction :** tap = lanterne · second tap = marque « pas de lanterne » (point) · troisième = vide. Glisser pour marquer plusieurs cases. Annuler/Rétablir. Validation automatique.
- **Paramètres :** taille (5×5 → 10×10), densité de murs, proportion de murs numérotés, techniques requises.
- **Génération :** murs placés avec symétrie de rotation (esthétique) → solution aléatoire valide → tous les murs reçoivent leur nombre → **suppression gloutonne** des nombres tant que la solution reste unique → vérification de la difficulté cible.
- **Solveur « humain » (techniques classées) :**
  1. *Mur saturé* (mur N avec N cases libres adjacentes) ;
  2. *Mur satisfait* (mur ayant déjà N lanternes → voisins marqués) ;
  3. *Case isolée* (une seule case peut encore l'éclairer) ;
  4. *Interaction mur/ligne* (deux options du mur éclaireraient la même case obligatoire) ;
  5. *Hypothèse courte* (contradiction en ≤ 3 pas) ;
  6. *Hypothèse longue* (réservé Astre).
- **Unicité :** solveur complet par backtracking + propagation → exactement 1 solution.
- **Difficulté :** technique maximale (poids 60 %), nombre d'étapes « ≥ technique 3 » (25 %), taille (15 %).
- **Indices :** issus de la prochaine étape du solveur humain à partir de l'état *actuel* du joueur ; si le joueur a une erreur, l'indice 1 la signale d'abord (« Une de tes lanternes n'est pas à la bonne place. »).
- **Accessibilité :** grille navigable case par case (« ligne 3, colonne 2, mur 2, touche 1 lanterne »), actions personnalisées « poser », « marquer », « effacer ».
- **Variantes :** lanternes bicolores (Observatoire), murs à forme spéciale (Fanal+).

### 5.3 Cadenas (CA)

- **Règle :** « Trouve le code. Chaque ligne indique combien de chiffres sont justes et bien placés (●) ou justes mais mal placés (○). »
- **Interaction :** molettes (3–5), balayage vertical ou tap ± ; possibilité de **barrer** des chiffres dans un bloc-notes intégré. Bouton Valider.
- **Paramètres :** longueur du code (3–5), alphabet (chiffres 0–9, puis symboles), répétitions autorisées (Brasier+), nombre et type d'indices (lignes « rien de juste » faciles, lignes mixtes difficiles).
- **Génération :** code aléatoire → génération de candidats d'indices → ajout jusqu'à unicité → suppression des indices redondants → vérification que **chaque** indice restant est nécessaire.
- **Solveur :** énumération exhaustive (≤ 10⁵ codes) pour l'unicité ; solveur humain par élimination (techniques : « aucun juste » → barre ; « un bien placé » → position ; croisement de lignes ; raisonnement par cas).
- **Difficulté :** nombre de lignes nécessaires, nombre de croisements requis, présence de raisonnement par cas.
- **Indices :** désignent la ligne la plus informative, puis la déduction, puis un chiffre fixé.
- **Accessibilité :** lignes lues (« 6, 8, 2 : un juste bien placé »), molettes ajustables par balayage VoiceOver.

### 5.4 Engrenages (EN) — rotation

- **Règle :** « Tourne les tuiles pour conduire la lumière de la source à toutes les lanternes, sans aucune fuite. »
- **Interaction :** tap = rotation 90° horaire (appui long = anti-horaire). La lumière se propage en temps réel dans les conduits connectés. Validation automatique quand tout est connecté sans extrémité libre.
- **Paramètres :** taille (4×4 → 9×9), types de tuiles (droite, coude, T, croix, extrémité), tuiles fixes, présence de boucles interdites, plusieurs sources (couleurs + motifs).
- **Génération :** arbre couvrant aléatoire (Wilson / Prim randomisé) sur la grille → conversion en tuiles → rotations aléatoires → vérification d'unicité.
- **Solveur :** propagation de contraintes par bords (un bord est ouvert/fermé) + backtracking ; techniques humaines : bords de grille, extrémités, droites contraintes, interdiction de boucle, hypothèse.
- **Unicité :** requise (on rejette sinon) — garantit que les indices ont un sens.
- **Difficulté :** taille, proportion de tuiles T/croix, technique max, nombre d'hypothèses.
- **Accessibilité :** chaque tuile décrite (« coude, ouvert vers le haut et la droite, éclairé ») ; deux actions VoiceOver « tourner à droite » et « tourner à gauche ». L'appui long (anti-horaire) n'est qu'un raccourci : 4 taps suffisent toujours.
- **Variantes :** tuiles verrouillées, deux couleurs de lumière (motif plein / rayé), tuiles-ponts.

### 5.5 Marqueterie (MA) — placement

- **Règle :** « Remplis entièrement la silhouette avec toutes les pièces. Tu peux les tourner. »
- **Interaction :** glisser-déposer des pièces depuis un plateau inférieur, tap pour tourner, double-tap pour retourner (Brasier+). Aimantation à la grille. Validation automatique.
- **Paramètres :** nombre de pièces (3 → 10), taille des pièces (tromino → pentomino), forme cible (simple → irrégulière, avec trous), retournement autorisé.
- **Génération :** forme cible choisie dans une bibliothèque de silhouettes thématiques (lanterne, clé, théière…) → découpage aléatoire en polyominos → rejet si pièces trop semblables ou trop de solutions « triviales ».
- **Solveur :** couverture exacte (Algorithm X / Dancing Links), **compte** les solutions.
- **Validation :** toute couverture valide est acceptée (pas d'unicité requise) ; le nombre de solutions est une mesure de difficulté (peu de solutions = plus difficile).
- **Difficulté :** nombre de pièces, nombre de solutions (inverse), nombre de nœuds explorés par le solveur.
- **Accessibilité :** mode alternatif « case par case » : choisir une pièce, une orientation, puis une case d'ancrage dans une liste. C'est la famille la moins accessible → alternative testée spécifiquement.

### 5.6 Menteurs (ME) — logique pure

- **Règle :** « Chaque personnage dit toujours la vérité ou ment toujours. Qui ment ? »
- **Interaction :** 3–6 personnages avec une réplique chacun ; tap sur un personnage pour basculer vrai/menteur/inconnu ; bouton Valider.
- **Paramètres :** nombre de personnages, types d'énoncés (sur un autre, sur un groupe « au moins un de nous ment », conditionnels « si A ment, B dit vrai », comptages « exactement deux menteurs »).
- **Génération :** attribution aléatoire vrai/menteur → génération d'énoncés à partir de **gabarits par langue** (cohérents avec l'attribution) → énumération des 2ⁿ mondes → acceptation si exactement 1 monde cohérent.
- **Solveur humain :** implications directes, contradiction d'un énoncé auto-référent, raisonnement par cas sur un personnage, comptage.
- **Difficulté :** n, types d'énoncés, nombre de cas nécessaires.
- **Localisation :** gabarits FR/EN écrits à la main avec gestion genre/nombre ; noms de personnages = créatures de Vesper (pas de genre grammatical ambigu : « la Loutre », « le Héron » cohérents avec leurs pronoms dans chaque langue).
- **Accessibilité :** entièrement textuel → excellent support VoiceOver.

### 5.7 Enquêtes (EQ) — déduction

- **Règle :** « Associe chaque habitant à son objet et à son lieu grâce aux indices. »
- **Interaction :** grille de déduction classique (croix / ronds) + liste d'indices que l'on peut barrer ; vue « réponse » pour remplir le tableau final ; bouton Valider.
- **Paramètres :** 3×3 → 5×4 (catégories × éléments), types d'indices (direct, négatif, relatif « juste avant / après », conditionnel « soit… soit… »).
- **Génération :** solution aléatoire → pool d'indices vrais → ajout jusqu'à unicité (solveur de contraintes) → **minimisation** (chaque indice restant est nécessaire).
- **Solveur humain :** élimination directe, unicité ligne/colonne, transitivité, indices relatifs, raisonnement par cas.
- **Localisation :** gabarits par langue.
- **Accessibilité :** grille navigable + mode « liste » (« Le Héron : objet ? lieu ? ») plus agréable avec VoiceOver.

### 5.8 Balances (BA) — calcul

- **Règle :** « Les balances sont en équilibre. Combien pèse l'objet marqué d'un « ? » ? »
- **Interaction :** 2–5 balances illustrées (objets empilés sur les plateaux) ; pavé numérique ; bouton Valider.
- **Paramètres :** nombre d'inconnues, nombre de balances, valeurs (1–20 avant Brasier), balances déséquilibrées (inégalités) au Fanal+.
- **Génération :** poids entiers aléatoires → équations construites en combinant les objets → vérification : système de rang plein pour l'inconnue demandée, solution entière positive, aucune équation redondante, pas de « raccourci » trivial (l'inconnue n'apparaît pas seule).
- **Solveur :** élimination de Gauss exacte (rationnels) + calcul de la plus courte chaîne de substitutions (mesure humaine).
- **Difficulté :** nombre de substitutions nécessaires, taille des nombres, présence d'inégalités.
- **Accessibilité :** chaque balance lue comme une phrase (« 2 poires et 1 pomme pèsent autant que 3 citrons »).

### 5.9 Motifs (MO) — matrices

- **Règle :** « Quelle pièce complète le tableau ? »
- **Interaction :** matrice 3×3 (case manquante en bas à droite) ; 6 options ; bouton Valider.
- **Attributs :** forme, nombre, taille, rotation, remplissage, position ; **règles** par ligne : constante, progression, distribution de trois valeurs, addition/soustraction de formes (XOR).
- **Génération :** choix de 1–3 attributs actifs avec une règle chacun → rendu de la matrice → distracteurs = bonne réponse avec **un seul** attribut modifié (et quelques-uns à deux) → rejet si un distracteur satisfait aussi toutes les règles.
- **Difficulté :** nombre d'attributs actifs, types de règles (XOR = difficile), similitude des distracteurs.
- **Accessibilité :** chaque case décrite par ses attributs ; les motifs de remplissage sont doublés (plein, rayé, vide) et jamais seulement colorés.

### 5.10 Fil (FI) — chemins

- **Règle :** « Trace un seul fil qui passe par toutes les cases, de la lanterne de départ à celle d'arrivée. »
- **Interaction :** tracé au doigt (glisser) ; revenir en arrière en repassant sur le fil ; validation automatique.
- **Paramètres :** taille (4×4 → 9×9), murs internes, cases obligatoires en virage / en ligne droite (marqueurs), cases vides interdites.
- **Génération :** chemin hamiltonien aléatoire (algorithme *backbite*) → ajout de murs sur des arêtes non utilisées → ajout de marqueurs jusqu'à forcer la difficulté visée.
- **Validation :** tout chemin respectant les règles est accepté (pas d'unicité requise). Le solveur mesure le nombre de solutions et la profondeur de recherche.
- **Difficulté :** taille, nombre de solutions (inverse), nombre de retours arrière nécessaires au solveur humain (coins, cases à 2 voisins, parité).
- **Accessibilité :** mode alternatif : choisir la direction case par case (actions « haut / bas / gauche / droite »).

### 5.11 Interrupteurs (IN) — genre « Lights Out »

- **Règle :** « Chaque bouton inverse sa lanterne et celles qui la touchent. Allume toutes les lanternes. »
- **Interaction :** tap = appui ; compteur de coups ; Annuler ; validation automatique. Affichage discret du « nombre de coups minimal » après réussite (pas avant).
- **Paramètres :** taille (2×2 → 6×6), motif d'influence (croix, diagonales, ligne entière, motif propre à chaque bouton), grilles non carrées, boutons inactifs.
- **Génération :** partir de l'état tout allumé, appliquer un ensemble aléatoire d'appuis → état initial. Garantit la solvabilité.
- **Solveur :** algèbre linéaire sur GF(2) → toutes les solutions, **nombre minimal de coups exact** (énumération du noyau).
- **Difficulté :** nombre minimal de coups, taille du noyau, motif d'influence, absence de méthode « chasse » applicable.
- **Accessibilité :** grille navigable, état de chaque lanterne lu, résultat de l'appui annoncé (« 3 lanternes allumées, 2 éteintes »).

### 5.12 Miroirs (MI)

- **Règle :** « Place les miroirs pour que le rayon atteigne toutes les cibles. »
- **Interaction :** tap sur une case = miroir « / » · second tap « \ » · troisième = vide. Le rayon est tracé en temps réel. Nombre de miroirs disponibles affiché. Validation automatique.
- **Paramètres :** taille (5×5 → 9×9), nombre de miroirs, obstacles, cibles, filtres de couleur (doublés de motifs), séparateurs de faisceau (Fanal+).
- **Génération :** construction d'un trajet à rebours depuis les cibles, placement des miroirs sur le trajet, ajout d'obstacles et de fausses pistes.
- **Solveur :** recherche exhaustive bornée avec élagage (le nombre de miroirs est petit) → unicité requise.
- **Difficulté :** nombre de miroirs, nombre de fausses pistes plausibles, nœuds explorés.
- **Accessibilité :** description du trajet actuel du rayon (« le rayon part vers l'est, est dévié vers le nord en ligne 3… »).

### 5.13 Énigmes (ÉN) — écrites à la main

- **Format :** texte court + illustration ; réponse par QCM, nombre ou manipulation simple. **Jamais de saisie de texte libre** (évite les problèmes d'orthographe et de synonymes).
- **Qualité :** chaque énigme a une fiche : réponse, justification complète, 3 indices écrits, relecteur, statut de test (≥ 5 testeurs, ≥ 60 % de réussite sans solution).
- **Localisation :** par « emplacement » : une énigme FR peut être remplacée par une énigme EN différente au même emplacement si elle repose sur la langue.

### 5.14 Critère transverse : le rejet

Un puzzle généré est rejeté si : invalide · non unique (quand l'unicité est requise) · hors palier visé · trop proche d'un puzzle déjà accepté (empreinte canonique) · ne mobilise aucune technique au-delà de la plus basse pour un palier ≥ Flamme (« puzzle d'exécution ») · dépasse le budget d'affichage (grille trop grande pour iPhone sans zoom au palier concerné).

---

## 6. Indices

| Niveau | Nom | Coût | Contenu |
|---|---|---|---|
| 1 | Murmure | **0** | Où regarder (zone surlignée par la flamme de Nilo + une phrase) |
| 2 | Piste | 5 | Quelle déduction faire, sans la conclure |
| 3 | Éclairage | 10 | La déduction appliquée (une case / un chiffre / une option éliminée) avec explication |
| 4 | Solution | 20 | Solution animée pas à pas ; la lumière est gagnée, sans bonus Clairvoyance |

Règles :
- Les niveaux se débloquent **dans l'ordre** pour un même état du puzzle ; si le joueur avance, on repart au niveau 1 pour la déduction suivante (les indices déjà achetés pour cette étape restent visibles).
- Pour les familles « état » (LA, EN, FI, IN, MI, MA), l'indice part de l'**état actuel** ; si l'état contient une erreur, l'indice 1 la signale d'abord.
- Le Murmure gratuit a un délai de recharge de 20 s par puzzle (évite le « spam » d'indices gratuits qui deviendrait une solution déguisée pour les familles pas-à-pas).
- **Offre proactive** (une seule fois par puzzle) : après 2 validations fausses, ou 3 min sans action utile sur un palier ≤ Lueur.
- Solde insuffisant : le bouton affiche le coût manquant et rappelle que le Murmure est gratuit. Jamais de message de « boutique ».

---

## 7. Économie

### 7.1 Gains

| Source | Éclats |
|---|---|
| Lanterne Étincelle / Lueur / Flamme / Brasier / Fanal / Astre | 5 / 8 / 12 / 16 / 20 / 25 |
| Bonus Clairvoyance : aucun indice payant, et aucune validation fausse pour les familles à réponse (Suites, Cadenas, Balances, Motifs, Menteurs, Enquêtes, Énigmes). Pour les familles à état (Lampes, Engrenages, Fil, Interrupteurs, Miroirs, Marqueterie), les retours en direct sont de l'exploration : ils ne comptent jamais comme erreurs. | +50 % |
| Salle entièrement éclairée | +20 |
| Bâtiment entièrement éclairé | +50 (+ cosmétique de l'habitant) |
| Quartier entièrement éclairé | +100 (+ cosmétique rare) |
| Défi du jour | +15, + bonus de série (+1 par jour de série, plafonné à +10) |
| Succès | 10 à 50 selon le succès |

### 7.2 Dépenses

| Usage | Coût |
|---|---|
| Piste / Éclairage / Solution | 5 / 10 / 20 |
| Cosmétiques de la boutique de la Marchande | 40 à 300 |
| Décorations de la maison du Phare | 30 à 150 |

Les cosmétiques liés aux habitants, aux quartiers et aux succès ne s'achètent pas : ils se **gagnent**. La boutique ne contient que des variantes (couleurs de flamme, écharpes…).

### 7.3 Garde-fous

- Les Éclats ne peuvent **pas** être perdus (pas de pénalité, pas d'expiration).
- Aucun contenu de progression n'est achetable.
- Chaque transaction a un identifiant unique (idempotence) ; le solde ne peut pas devenir négatif.

### 7.4 Simulation cible (tests unitaires d'économie)

Hypothèse : 1 000 lanternes, palier moyen ≈ Flamme (~12 Éclats), ~100 défis du jour, ~40 succès. Base commune ≈ 12 000 (lanternes) + 4 000 (salles, bâtiments, quartiers) + 3 000 (défis, succès) ; seul le bonus Clairvoyance varie selon le profil.

| Profil | Clairvoyance | Gains totaux estimés | Dépenses indices | Solde disponible pour cosmétiques |
|---|---|---|---|---|
| Prudent (indice payant 1 puzzle / 10) | ~60 % | ≈ 22 500 | ≈ 800 | ≈ 21 700 |
| Moyen (Piste sur 1 / 3, parfois Éclairage) | ~40 % | ≈ 21 000 | ≈ 3 000 | ≈ 18 000 |
| Dépendant (Piste + Éclairage sur 1 / 2) | ~20 % | ≈ 20 000 | ≈ 7 500 | ≈ 12 500 |

Catalogue boutique total ≈ **6 000 Éclats** → tous les profils peuvent tout acheter en finissant le jeu, le profil « dépendant » un peu plus tard. Test automatisé : aucun profil ne descend sous 20 Éclats plus de 5 % du temps.

---

## 8. Défi du jour et série

### 8.1 Le défi

- Disponible après les 6 premières lanternes du Phare.
- Un puzzle par **date locale** (calendrier de l'appareil).
- `seed = hash("daily", AAAA-MM-JJ, langue du contenu, version du générateur)` → identique pour tous les joueurs de même langue et même version.
- **Rotation hebdomadaire de difficulté :** lun Lueur · mar Lueur · mer Flamme · jeu Flamme · ven Brasier · sam Brasier · dim Fanal.
- **Rotation des familles :** cycle pseudo-aléatoire déterministe sur les 12 familles, sans répétition à moins de 5 jours d'écart.
- Une famille jamais rencontrée affiche sa carte de règles + démonstration avant de commencer.
- Si la génération sur l'appareil échoue ou dépasse 1,5 s : repli sur un **pool embarqué** de 400 défis pré-validés, indexé par la même seed.

### 8.2 Série (« flamme du soir »)

- +1 par jour où le défi du jour est résolu (indices autorisés).
- **Veilleuses :** +1 tous les 7 jours de série consécutifs, réserve max 2.
- À la résolution du jour D, si le dernier jour résolu est D−k avec k ≥ 2 : si la réserve ≥ k−1, on consomme k−1 veilleuses et la série continue ; sinon, la série repart à 1. Un toast explique ce qui s'est passé.
- **Rattrapage :** les 7 derniers jours sont rejouables depuis le calendrier ; récompense de base, pas de bonus de série, **ne comptent pas** pour la série.
- Record de série conservé dans le Carnet.

### 8.3 Cas limites

| Cas | Comportement |
|---|---|
| Changement de fuseau horaire | Le jour est celui de l'appareil au moment de la résolution ; un voyage vers l'est peut « sauter » un jour → couvert par une veilleuse si disponible |
| Horloge avancée manuellement | Le défi futur est jouable (aucun enjeu compétitif) ; la récompense est liée à la date → pas de double récompense |
| Horloge reculée | On mémorise la plus grande date vue ; les dates déjà récompensées ne le sont plus ; la série n'est jamais cassée rétroactivement |
| Minuit pendant un puzzle | Le puzzle en cours reste celui de sa date et compte pour cette date s'il est fini dans les 2 h ; sinon il compte comme rattrapage |
| Changement de langue | Le défi du jour de la nouvelle langue est un autre puzzle ; la date reste « résolue » si l'un des deux l'a été |

---

## 9. Succès (Carnet)

~40 succès en V1, en 5 catégories. Jamais de succès lié à une durée de jeu continue, à une heure précise ou à un nombre de jours de connexion.

| Catégorie | Exemples |
|---|---|
| **Exploration** | *Première lueur* (1ʳᵉ lanterne) · *Rat de bibliothèque* (Bibliothèque éclairée à 100 %) · *Un quartier par soir* (entrer dans chaque quartier) · *Tous les chemins* (ouvrir tous les bâtiments) · *Vesper s'éveille* (finale) |
| **Maîtrise** | *Clairvoyant* (10 Clairvoyances d'affilée) · *Premier Fanal* (1ᵉʳ palier Fanal) · *Astronome* (10 Astres) · *Économe* (Interrupteurs résolu en nombre minimal de coups, ×10) · *Sans filet* (un bâtiment entier sans indice payant) |
| **Familles** | Un succès par famille : 25 puzzles de la famille (*Horloger*, *Cartographe*, *Marchand*…) · *Polymathe* (au moins 1 Fanal dans chaque famille) |
| **Rituel** | *Flamme du soir* (série 7) · *Veilleur* (série 30) · *Gardien du phare* (série 100) · *Rattrapage* (jouer un défi passé) |
| **Malice** | *Chut* (utiliser 50 Murmures — l'aide est normale) · *Oups* (se tromper puis réussir au coup suivant) · *Maladroit* (faire tomber le chapeau de Nilo en le secouant) · *Mélomane* (écouter les 7 thèmes de quartier) |

---

## 10. Collection

- **Objets trouvés :** 1 par salle (4 + 96 + 1 = **101 objets**). Chaque objet apparaît quand la salle est entièrement éclairée ; fiche illustrée + 1 phrase d'histoire (ex. « Une clé qui n'ouvre aucune porte de Vesper. Pour l'instant. »).
- **Lettres de l'Allumeur :** 7 (une par quartier via la lanterne-clé du bâtiment 4, la dernière dans le Grenier).
- **Portraits des habitants :** 6 personnages principaux + 24 habitants secondaires, révélés au réveil.

---

## 11. Cosmétiques

Catalogue V1 ≈ **60 éléments**.

| Catégorie | Nb | Exemples | Obtention |
|---|---|---|---|
| Couleurs de flamme | 10 | Ambre (défaut), Lune, Braise, Aurore, Vert-de-gris, Prune, Glacier, Or, Rose de papier, Blanc d'étoile | 6 quartiers + boutique |
| Chapeaux | 12 | Bonnet d'allumeur, Lunettes de l'Archiviste, Loupe de l'Horlogère, Couronne de lierre, Chapeau de paille du Marché, Masque de théâtre (sur le front), Casquette d'astronome… | Habitants + succès + boutique |
| Écharpes | 8 | Écharpe tricotée, Foulard d'épices, Ruban de scène… | Boutique + succès |
| Lanternes de queue | 8 | Ronde, Papier plissé, Étoile, Lampion, Cage de laiton, Bourgeon… | Quartiers + boutique |
| Compagnons | 6 | Luciole, Feuille flottante, Petit engrenage, Papillon de nuit, Poisson-lune, Comète miniature | Succès rares |
| Décorations du Phare | 16 | Tapis, étagères, plantes, cartes, horloge, télescope… | Boutique + objets |

Contraintes : aucun cosmétique ne masque yeux / oreilles / flamme ; tous lisibles à 64 px ; tous testés sur les 8 expressions.

---

## 12. Narration et personnages

### 12.1 Principes

- Jamais plus de **3 répliques d'affilée**, toujours passables.
- Toute l'histoire est **facultative** : on peut finir le jeu sans lire.
- Ton : doux, drôle par petites touches, mystérieux.

### 12.2 Personnages principaux

| Quartier | Personnage | Créature | Trait | Réplique type |
|---|---|---|---|---|
| Bibliothèque | L'Archiviste | Héron à lunettes | Pédant mais tendre | « Tout est écrit quelque part. Le problème, c'est *où*. » |
| Horlogerie | L'Horlogère | Taupe | Pressée, toujours en retard | « Je suis en retard… depuis quarante ans. » |
| Serre | Le Jardinier | Escargot | Très lent, très sage | « Les plantes ne se pressent pas. Et pourtant, elles arrivent en haut. » |
| Marché | La Marchande | Loutre | Joueuse, négociatrice | « Tout s'échange. Même une bonne idée. Surtout une bonne idée. » |
| Théâtre | Le Souffleur | Pangolin | Timide, connaît tous les rôles | « Je ne mens jamais. Sauf sur scène. Et parfois dans les coulisses. » |
| Observatoire | L'Astronome | Chauve-souris | Rêveuse, voit à l'envers | « D'ici, c'est vous qui êtes la tête en bas. » |

### 12.3 Les lettres de l'Allumeur (arc)

1. **Phare** — « Si tu lis ceci, c'est que ta flamme tient bon. »
2. **Bibliothèque** — Il cherchait un livre qui n'existe pas : la carte de ce qu'il y a au-delà du brouillard.
3. **Horlogerie** — Il a arrêté les horloges pour que la ville l'attende.
4. **Serre** — Il a planté une graine de lumière qui ne pousse que si quelqu'un d'autre l'arrose.
5. **Marché** — Il a échangé sa flamme contre un bateau.
6. **Théâtre** — Il n'a pas disparu : il est parti rallumer une autre ville, de l'autre côté de la mer.
7. **Grenier (finale)** — Il savait que Nilo y arriverait. La flamme de Nilo monte au sommet du Phare, qui s'allume. Au loin, sur la mer, **une lumière répond**. → ouverture de la saison 2.

---

## 13. Notifications

- **Opt-in contextuel** : la demande système n'apparaît qu'après la résolution du **premier défi du jour**, précédée d'un écran explicatif (« Un rappel par soir, pas plus. Tu peux l'arrêter à tout moment. ») avec choix de l'heure (défaut 19 h 30).
- **Types :**
  - rappel du défi du jour — seulement s'il n'est pas encore résolu ce jour-là ;
  - rien d'autre en V1 (pas de relance « tu nous manques », pas de notification de déblocage : les déblocages arrivent en jouant).
- **Plafond :** 1 notification par jour maximum.
- **Auto-silence :** si l'app n'a pas été ouverte depuis 3 rappels, on arrête de programmer jusqu'à la prochaine ouverture.
- **Textes** (sans emoji — contrairement à l'exemple du brief, pour rester cohérent avec le ton premium ; à rediscuter si vous y tenez) :
  - « Le défi du soir t'attend à la Bibliothèque. »
  - « Une nouvelle énigme brille au Marché Flottant ce soir. »
  - « Ta flamme du soir brûle depuis 12 jours. Le défi d'aujourd'hui est prêt. »
- Tout est **local** (`UNUserNotificationCenter`), aucun serveur.

---

## 14. Onboarding

| Étape | Écran | Durée cible |
|---|---|---|
| 1 | Splash : obscurité, la flamme de Nilo s'allume, « Lampion » apparaît | 2 s (tap pour passer) |
| 2 | « Vesper s'est éteinte. » — silhouette de la ville dans le noir, Nilo au premier plan | lecture 3 s |
| 3 | « Chaque énigme rallume une lumière. » — une lanterne s'allume, la ville se colore un instant | lecture 3 s → [Commencer] |
| 4 | **Premier puzzle** : Interrupteurs 2×2, un seul coup possible. Consigne en 1 ligne. | 10–20 s |
| 5 | Allumage (animation complète) → la Cuisine du Phare s'éclaire partiellement | 2 s |
| 6 | 2 autres puzzles Étincelle (LA 4×4 guidé, SU nombres simples) | ~2 min |
| 7 | Arrivée dans l'Accueil : bouton Continuer mis en avant, un seul toast « Tu peux revenir ici quand tu veux. » | — |

Pas de choix de langue (système), pas de permission, pas de compte, pas de tutoriel sur l'économie : les Éclats et indices sont introduits **au moment où ils servent** (premier gain, premier indice proposé).

---

## 15. Procédure d'équilibrage

1. **Génération** d'un large pool par famille et palier (≥ 5× le besoin).
2. **Mesure** automatique (score solveur) → histogrammes par famille.
3. **Échantillonnage humain** : 10 % des puzzles de chaque palier revus par un humain (qualité du « déclic », esthétique, clarté).
4. **Tests de jeu** (TestFlight, testeurs volontaires) : l'app enregistre **localement** temps, erreurs et indices ; le testeur peut **exporter volontairement** un fichier de résultats (partage iOS standard). Rien n'est envoyé automatiquement.
5. **Recalibrage** des seuils de palier par famille : objectif médian de temps par palier (§ 4.1 de PRODUCT_DISCOVERY).
6. **Gel** du contenu : packs versionnés, re-validés en CI à chaque commit.
