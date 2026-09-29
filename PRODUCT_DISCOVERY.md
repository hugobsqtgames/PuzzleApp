# PRODUCT DISCOVERY — Projet « Lampion » (nom de travail)

> Phase 1 — Recherche, concept et différenciation.
> Statut : **proposition à valider**. Aucun code n'a été écrit.
> Date : 29 septembre 2026.

Ce document pose les fondations du produit. Les documents suivants (`DESIGN_SYSTEM.md`, `GAME_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`, `WIREFRAMES.md`, prototype) en découleront **après** validation de ce document.

---

## Sommaire

0. [Résumé exécutif](#0-résumé-exécutif)
1. [Vision](#1-vision)
2. [Problème](#2-problème)
3. [Proposition de valeur](#3-proposition-de-valeur)
4. [Public cible](#4-public-cible)
5. [Boucle de gameplay](#5-boucle-de-gameplay)
6. [Différenciation](#6-différenciation)
7. [Univers](#7-univers)
8. [Types de puzzles](#8-types-de-puzzles)
9. [Progression](#9-progression)
10. [Gamification](#10-gamification)
11. [Mascotte](#11-mascotte)
12. [Naming](#12-naming)
13. [Direction artistique (intention)](#13-direction-artistique-intention)
14. [Architecture UX](#14-architecture-ux)
15. [Architecture technique (vue d'ensemble)](#15-architecture-technique-vue-densemble)
16. [Risques](#16-risques)
17. [Solutions](#17-solutions)
18. [Roadmap](#18-roadmap)
19. [Points où je contredis le brief](#19-points-où-je-contredis-le-brief)
20. [Décisions à valider](#20-décisions-à-valider)

---

## 0. Résumé exécutif

**Concept :** *Lampion* est un jeu de casse-têtes dans lequel le joueur rallume, énigme après énigme, les lanternes d'une ville nocturne endormie : **Vesper**. Chaque casse-tête résolu rallume une lumière. Chaque lumière rend un peu de couleur, de vie et de mémoire à la ville.

**L'idée centrale — une seule métaphore qui fait tout le travail :**

> **Résoudre = éclairer.**

Cette métaphore unique sert simultanément :

| Besoin produit | Comment la lumière y répond |
|---|---|
| Direction artistique sombre et premium | Le monde est nuit ; l'accent ambré est *gagné* par le joueur |
| Progression visible | La carte s'allume littéralement au fil des puzzles |
| Récompense | Chaque réussite = une lanterne qui s'allume (animation courte, satisfaisante) |
| Curiosité | Les zones non éclairées sont suggérées mais non visibles → « qu'y a-t-il dans le noir ? » |
| Mascotte | Un petit allumeur de réverbères, créature dont la queue porte une flamme |
| Types de puzzles | Beaucoup de mécaniques se rattachent naturellement à la lumière (lanternes, miroirs, circuits, interrupteurs, ombres) |
| Marque | Une icône = une lanterne dans la nuit. Reconnaissable sans le nom |

**Mascotte :** **Nilo**, un *lampyre* — petite créature ronde couleur d'encre, deux oreilles pointues, une longue queue terminée par une flamme-lanterne qui exprime ses émotions.

**Slogan (FR) :** *Chaque énigme rallume une lumière.*
**Slogan (EN) :** *Every puzzle brings back a light.*

**V1 :** iPhone + iPad, 100 % hors ligne, aucune collecte de données, aucun compte, aucune IA, aucune pub, aucun achat. ~1 000 puzzles répartis sur 12 familles, un défi quotidien déterministe, une mascotte personnalisable.

---

## 1. Vision

Créer **un lieu** plutôt qu'une application : un endroit calme, beau et mystérieux où l'on revient chaque soir « juste pour un puzzle », et où chaque réussite laisse une trace visible.

Principes directeurs :

1. **Complexité invisible, simplicité visible.** Le moteur (générateurs, solveurs, validation, difficulté) est sophistiqué ; l'écran ne montre qu'une ville, une lumière et un bouton « Continuer ».
2. **Respect du joueur.** Pas de manipulation, pas de minuteur anxiogène, pas de punition, pas de données collectées. Le jeu gagne sa place par sa qualité.
3. **Chaque puzzle est juste.** Une solution, clairement définie, vérifiée par une machine avant d'être montrée à un humain.
4. **La progression se voit.** Le joueur doit pouvoir *montrer* sa ville à quelqu'un.
5. **Une marque, pas un catalogue.** Univers, mascotte et DA doivent être reconnaissables sans logo.

---

## 2. Problème

> Note de méthode : cette analyse repose sur ma connaissance du marché des jeux de réflexion mobiles et sur les retours publics typiques (avis App Store, communautés). Je n'ai **pas** mené d'étude quantitative ni consulté de données de marché payantes. Les tendances ci-dessous sont des constats qualitatifs, pas des chiffres vérifiés.

### 2.1 Panorama des catégories existantes

| Catégorie | Exemples de type | Force | Faiblesse récurrente |
|---|---|---|---|
| **Collections de puzzles logiques** (sudoku, nonogrammes, grilles) | apps « 1000 puzzles » | Contenu infini, profondeur | Aucune âme, listes numérotées, interfaces utilitaires |
| **Brain-training** (« entraîne ton cerveau ») | apps de mini-jeux chronométrés | Sessions courtes, habitude quotidienne | Promesses pseudo-scientifiques, chronos stressants, mini-jeux superficiels |
| **Puzzle games narratifs / premium** (dioramas, jeux d'ambiance) | jeux à la Monument Valley, escape games | Beauté, émotion, identité | Contenu court (2–4 h), peu rejouables, une seule mécanique |
| **Aventure-énigmes** (à la Layton) | jeux console, portages | Univers + variété de puzzles | Casse-têtes écrits à la main → contenu fini, énigmes textuelles parfois ambiguës, très peu présent sur mobile natif |
| **Casual « hyper-monétisés »** (match-3, « sort » puzzles) | nombreux | Boucle addictive très efficace | Pubs agressives, vies, murs de paiement, niveaux truqués pour vendre des boosters |
| **Casse-têtes quotidiens** (jeux de mots/logique du jour) | jeux quotidiens de presse | Rituel, partage, rareté | Un seul puzzle par jour, pas de progression |

### 2.2 Ce qui rend les joueurs accros (dans le bon sens)

- **Petites victoires fréquentes** : un puzzle court se termine en 1–4 minutes.
- **Progression visible et cumulée** : une collection qui se remplit, une carte qui se découvre.
- **Un « prochain objectif » toujours visible** : « encore 3 lumières pour ouvrir l'Horlogerie ».
- **Le rituel** : un défi quotidien, léger, qui crée un rendez-vous.
- **Le sentiment d'être intelligent** : le « déclic » (« aha ! ») est la récompense principale d'un casse-tête. Tout le reste est secondaire.
- **La variété** : changer de mécanique évite la fatigue.

### 2.3 Ce qui provoque la désinstallation

| Cause | Fréquence perçue | Réponse Lampion |
|---|---|---|
| Publicités intrusives / forcées | Très élevée | Aucune pub en V1 ; règles strictes pour le futur (§ 17) |
| Mur de difficulté / puzzle bloquant | Élevée | Aucun puzzle n'est bloquant : les zones s'ouvrent par *nombre* de lumières, pas par puzzle précis |
| Puzzles ambigus ou « injustes » | Élevée (surtout suites et énigmes textuelles) | Validation machine systématique, QCM pour les suites, unicité prouvée |
| Ennui (trop facile, répétitif) | Élevée | 12 familles, montée en difficulté mesurée, alternance des mécaniques |
| Compte obligatoire / demandes de permissions | Moyenne | Aucun compte, aucune permission au lancement |
| Streaks culpabilisantes | Moyenne | Série avec « veilleuses » (jours de grâce) automatiques |
| Notifications spam | Moyenne | Max 1/jour, opt-in contextuel, désactivable |
| Onboarding long | Moyenne | 3 écrans max, puis premier puzzle jouable en < 30 s |
| Perte de progression | Rare mais fatale | Sauvegarde atomique, versionnée, migrations testées |

### 2.4 Mécaniques surutilisées à éviter

- Vies / énergie qui se recharge.
- Coffres aléatoires (loot boxes), roues de la fortune.
- Chronomètres par défaut.
- « Brain age » et scores de QI.
- Étoiles 1-2-3 sur chaque niveau qui poussent à rejouer ad nauseam.
- Popups de récompenses empilées à l'ouverture.

### 2.5 Le problème en une phrase

> Les joueurs qui aiment réfléchir doivent choisir entre des **collections de puzzles sans âme** mais infinies, et des **jeux beaux et singuliers** mais courts — souvent pollués par la monétisation. Il n'existe presque pas de jeu mobile natif qui offre **à la fois** un univers mémorable, une grande variété de casse-têtes *justes*, et une quantité de contenu qui dure des mois.

---

## 3. Proposition de valeur

**Pour** les adultes et adolescents qui aiment réfléchir quelques minutes par jour,
**Lampion** est **un jeu de casse-têtes d'exploration**
**qui** transforme chaque énigme résolue en lumière rendue à une ville mystérieuse,
**contrairement aux** collections de puzzles utilitaires et aux jeux casual monétisés,
**Lampion** offre un univers singulier, des centaines de casse-têtes variés et prouvés justes, sans pub, sans compte et sans collecte de données.

Trois promesses, dans cet ordre :

1. **Des puzzles justes et malins.** (la fondation)
2. **Un monde qui s'allume grâce à vous.** (la motivation)
3. **Un espace calme et respectueux.** (la confiance)

---

## 4. Public cible

### 4.1 Cœur de cible

| Persona | Description | Ce qu'elle cherche | Ce qu'elle fuit |
|---|---|---|---|
| **Claire, 34 ans** | Joue le soir, 10–20 min, dans le canapé ou au lit. A aimé les jeux d'énigmes sur console. | Détente active, beauté, sentiment d'accomplissement | Pubs, chronos, jeux « criards » |
| **Karim, 27 ans** | Trajets en transports, sessions de 3–5 min. Fait des sudokus. | Du contenu quasi infini, de la variété, un défi réel | Puzzles trop faciles, grind |
| **Martine, 58 ans** | Joue sur iPad, texte agrandi. Mots croisés, logique. | Lisibilité, calme, pas de jargon | Interfaces confuses, petits boutons, stress |
| **Léo, 15 ans** | Curieux, aime collectionner et personnaliser. | Mascotte, cosmétiques, succès, défi quotidien | Contenu « scolaire » |

### 4.2 Implications de conception

- **Âge :** PEGI 3 / 4+ visé. Pas de violence, pas de texte sensible.
- **Accessibilité non négociable** : Dynamic Type, VoiceOver sur la majorité des familles, pas d'information portée par la couleur seule. Martine est une cible réelle, pas un cas limite.
- **Sessions courtes :** un puzzle doit pouvoir être commencé et fini en moins de 5 min pour les niveaux normaux ; l'état est sauvegardé en continu.
- **Pas de lecture obligatoire :** l'histoire est légère et facultative. Le jeu doit fonctionner même si on ne lit rien.

### 4.3 Hors cible (assumé)

- Joueurs compétitifs cherchant classements et PvP (V1 sans serveur).
- Enfants < 7 ans (puzzles trop abstraits).

---

## 5. Boucle de gameplay

### 5.1 Micro-boucle (30 s – 5 min) : le puzzle

```
Toucher une lanterne éteinte dans une salle
        ↓
Lire la consigne (1 phrase) + comprendre visuellement
        ↓
Réfléchir / manipuler  ←──  Indice (optionnel, 4 niveaux)
        ↓
Valider
   ├─ Faux → réaction douce de Nilo, erreur localisée, on réessaie
   └─ Juste → la lanterne s'allume (animation 1,2 s) + Éclats gagnés
        ↓
« Suivant » (1 tap) — ou retour à la salle
```

### 5.2 Méso-boucle (10 – 30 min) : la salle et le bâtiment

```
Salle sombre (≈ 10 lanternes)
   → chaque lanterne allumée révèle une partie du décor
   → salle entièrement allumée : couleur restaurée + objet trouvé (collection)
   → toutes les salles du bâtiment : l'habitant se réveille (personnage, 2–3 répliques)
      + « puzzle-clé » écrit à la main
      + récompense cosmétique
```

### 5.3 Macro-boucle (jours / semaines) : la ville

```
Lumières cumulées  →  seuil atteint  →  nouveau quartier de Vesper s'éclaire
                                       →  nouvelles familles de puzzles introduites
                                       →  nouveau fragment de l'histoire (lettres de l'Allumeur)
```

### 5.4 Boucle quotidienne (rituel)

```
Notification douce (si activée) ou ouverture spontanée
   → Défi du jour (1 puzzle, identique pour tous dans la même langue/version)
   → Série +1 (flamme de la série grandit)
   → Récompense
   → « Tant que tu es là… » → Continuer la ville
```

### 5.5 Boucle complète demandée dans le brief, adaptée

```
PUZZLE → LUMIÈRE (récompense immédiate, visuelle)
      → ÉCLATS (monnaie douce)
      → SALLE RESTAURÉE (progression locale)
      → NOUVEAU QUARTIER (exploration)
      → NOUVELLES MÉCANIQUES (renouvellement)
      → COSMÉTIQUE / OBJET (personnalisation, collection)
      → PUZZLE suivant
```

### 5.6 Le « encore un » — d'où vient-il concrètement ?

| Pensée du joueur | Mécanisme qui la provoque |
|---|---|
| « Je vais juste faire un puzzle. » | Bouton **Continuer** en accueil, reprend exactement là où on était. Aucun menu à traverser. |
| « Bon allez, encore un. » | Écran de réussite avec **Suivant** en action principale, puzzle suivant pré-chargé, durée courte. |
| « Je veux débloquer la prochaine salle. » | Jauge de salle visible en permanence : « 7/10 ». Les 3 dernières lanternes sont visibles et leur décor à moitié révélé. |
| « OK, encore un dernier. » | Le seuil du quartier suivant est affiché : « Encore 4 lumières pour ouvrir l'Observatoire ». |

**Garde-fou éthique :** aucun de ces mécanismes n'utilise la perte, la peur de manquer ou la rareté artificielle. On montre ce qui est *à gagner*, jamais ce qui est *à perdre*.

---

## 6. Différenciation

### 6.1 Honnêteté sur l'existant

Le thème « rallumer la lumière dans un monde sombre » **n'est pas inédit**. Des recherches rapides (non exhaustives) montrent des jeux existants autour de la lumière : un jeu de miroirs et lentilles (*lumen.*), des jeux indépendants d'allumeur de réverbères (*Lamplighter*, *The Lowly Lamplighter*, qui propage la lumière de quartier en quartier), de nombreux puzzles « allumer toutes les lampes ». Le thème seul ne suffit donc **pas** à nous différencier.

### 6.2 Ce qui nous différencie réellement : la combinaison

| Axe | Collections de puzzles | Jeux premium narratifs | Jeux d'éclairage existants | **Lampion** |
|---|---|---|---|---|
| Univers explorable | ✗ | ✓ | partiel | ✓ Ville en dioramas, salles, habitants |
| Variété de mécaniques | moyenne | ✗ (1 mécanique) | ✗ (1 mécanique) | ✓ 12 familles |
| Quantité de contenu | ✓✓ | ✗ | ✗ | ✓ ~1 000 + défi quotidien infini |
| Puzzles prouvés justes | parfois | à la main | à la main | ✓ Génération + solveur + validation systématique |
| Indices intelligents | ✗ ou « solution » | rarement | rarement | ✓ Indices dérivés du raisonnement du solveur (pas juste la réponse) |
| Respect de la vie privée | variable | ✓ | variable | ✓ Zéro collecte, zéro compte, hors ligne |
| Mascotte et marque | ✗ | parfois | ✗ | ✓ Nilo |

### 6.3 Les trois différenciateurs à défendre

1. **La progression lumineuse.** La carte de Vesper est l'écran le plus important de l'app. Elle doit être *belle à regarder* et *personnelle* : aucune ville n'est allumée dans le même ordre.
2. **Les indices « maître d'échecs ».** Pour la majorité des familles, les indices sont générés à partir de la trace d'un solveur « humain » (qui raisonne par techniques, pas par force brute). L'indice 2 dit *quelle déduction faire*, pas *quelle est la réponse*. C'est rare dans le genre et c'est ce qui rend le jeu intelligent plutôt que frustrant.
3. **La confiance.** « Votre progression reste sur votre appareil. » Pas de compte, pas de pub, pas de tracker. C'est un argument commercial réel face au marché casual.

---

## 7. Univers

### 7.1 Pitch narratif

> Vesper est une ville suspendue entre deux crépuscules, faite de ponts, de tours et de canaux. Ses habitants — des créatures discrètes — vivent au rythme de ses lanternes.
> Une nuit, le vieil **Allumeur** a disparu. Une à une, les lanternes se sont éteintes, et avec elles la mémoire des lieux : les habitants se sont endormis, les couleurs ont pâli.
> Il ne reste qu'une flamme : celle qui brûle au bout de la queue de **Nilo**, son apprenti.
> Mais les lanternes de Vesper ne s'allument pas avec du feu. Elles s'allument avec **une idée juste**.

**Le fil rouge léger :** qu'est-il arrivé à l'Allumeur ? Chaque quartier contient une **lettre** de lui (objet de collection). Les lettres forment une histoire courte, poétique, jamais obligatoire. La résolution du mystère arrive à la fin de la V1 et ouvre la porte aux saisons suivantes (d'autres villes, au-delà du brouillard).

**Ton :** doux, mystérieux, un peu mélancolique, jamais triste. Humour discret des personnages. Pas de méchant.

### 7.2 Structure spatiale

Le brief propose `Monde → Ville → Quartier → Bâtiment → Pièce → Objet → Puzzle` (7 niveaux). **C'est trop profond pour du tactile** (voir § 19). Je recommande **3 niveaux visibles** + le puzzle :

```
VESPER (la carte de la ville, écran principal d'exploration)
  └── QUARTIER  (ex. L'Horlogerie)       — 6 en V1 + le Phare (hub/tutoriel)
        └── BÂTIMENT vu en COUPE (diorama) — 4 par quartier ; les salles sont
              visibles directement dans la coupe, pas d'écran « liste de salles »
              └── SALLE (plein écran)       — ~10 lanternes = ~10 puzzles
                    └── PUZZLE
```

Le « monde » (Vesper) est la saison 1. D'autres villes = futures saisons. L'« objet » n'est pas un niveau de navigation : chaque lanterne est posée *sur* un objet du décor (une horloge, un coffre, un tableau), ce qui donne le sens sans ajouter d'écran.

### 7.3 Les quartiers de la V1

| # | Quartier | Ambiance | Familles principales | Habitant·e·s (créatures) |
|---|---|---|---|---|
| 0 | **Le Phare** | Hub côtier, tutoriel, maison de Nilo | Introduction de toutes les familles, Interrupteurs, Lanternes | — (la maison de l'Allumeur, vide) |
| 1 | **La Bibliothèque Murmurante** | Rayonnages infinis, papier, poussière dorée | Suites, Motifs, Énigmes | L'Archiviste (un héron à lunettes) |
| 2 | **L'Horlogerie** | Engrenages, laiton, tic-tac | Engrenages (rotation), Cadenas (codes) | L'Horlogère (une taupe) |
| 3 | **La Serre de Verre** | Verrières, plantes lumineuses, vapeur | Fil (chemins), Marqueterie (placement) | Le Jardinier (un escargot très lent) |
| 4 | **Le Marché Flottant** | Barques, étals, balances, lanternes de papier | Balances (calcul), Cadenas | La Marchande (une loutre) |
| 5 | **Le Théâtre d'Ombres** | Rideaux, silhouettes, projecteurs | Menteurs (logique), Enquêtes (déduction) | Le Souffleur (un pangolin ; cf. § 11.5) |
| 6 | **L'Observatoire** | Coupole, étoiles, lentilles | Miroirs, Motifs, puzzles finaux mélangés | L'Astronome (une chauve-souris) |

Chaque quartier a **2 familles principales**, mais accueille aussi des familles « invitées » déjà apprises, pour éviter la monotonie et entretenir les acquis.

### 7.4 Personnages

Des **créatures**, pas des humains, cohérentes avec Nilo. Chaque habitant·e :
- dort tant que son bâtiment est sombre (silhouette visible, respiration lente) ;
- se réveille quand le bâtiment est entièrement allumé ;
- dit 2–3 répliques (localisées, courtes) ;
- offre un cosmétique pour Nilo lié à son métier (lunettes de l'Archiviste, loupe de l'Horlogère…) ;
- apparaît ensuite ponctuellement pour présenter les puzzles-clés.

### 7.5 Extensibilité de l'univers

- **Nouvelles villes** (saisons) : une ville = un pack de contenu (données + illustrations), sans changement de code.
- **Événements** : une « Nuit des lampions » saisonnière (salle temporaire hors ligne, datée localement).
- **Nouveaux personnages / cosmétiques** : données déclaratives.
- **Déclinaisons hors app** : illustrations de Vesper, peluche de Nilo, livre de casse-têtes papier — l'univers le permet.

---

## 8. Types de puzzles

### 8.1 Critères d'admission d'une famille

Une famille n'entre dans la V1 que si elle coche **tous** ces critères :

1. Règles expliquables en **une phrase + une animation** de démonstration.
2. **Profondeur** : au moins 5 paliers de difficulté distincts et intéressants.
3. **Génération procédurale fiable** OU corpus écrit à la main de qualité.
4. **Validation automatique** possible (solveur ou vérificateur de règles).
5. **Agréable au doigt** : pas de glisser-déposer minuscule, cibles ≥ 44 pt.
6. **Accessible** : jouable avec VoiceOver ou avec alternative, pas d'information par couleur seule.
7. **Localisable** : pas (ou peu) dépendant de la langue.

### 8.2 Les 12 familles V1

Les noms sont des noms de travail « in-universe » ; la catégorie du brief est indiquée entre parenthèses.

| # | Famille | Catégorie du brief | Principe (1 phrase) | Génération | Validation | Solution unique ? |
|---|---|---|---|---|---|---|
| 1 | **Suites** | Suites logiques | Trouve l'élément suivant d'une suite (nombres, formes, positions). | Grammaire de règles composables | Banque de règles + QCM : une seule option cohérente | Oui (via QCM) |
| 2 | **Lanternes** | Grilles | Place des lanternes pour éclairer toutes les cases ; deux lanternes ne se voient jamais ; les murs numérotés imposent leur nombre de voisines. *(règles du genre « Akari », genre public)* | Placement aléatoire + ajout d'indices jusqu'à unicité | Solveur par propagation + backtracking | Oui |
| 3 | **Cadenas** | Codes / combinaisons | Trouve le code à partir d'indices du type « 6 8 2 : un chiffre juste et bien placé ». | Code aléatoire + indices générés puis minimisés | Énumération exhaustive (10ⁿ) | Oui |
| 4 | **Engrenages** | Rotation | Tourne les tuiles pour conduire la lumière de la source à toutes les lanternes, sans fuite. | Arbre couvrant aléatoire, puis rotations mélangées | Solveur de contraintes | Oui (on rejette les ambigus) |
| 5 | **Marqueterie** | Placement / Tetris-like | Remplis la silhouette avec toutes les pièces (polyominos), rotation autorisée. | Découpage aléatoire d'une forme | Couverture exacte (Algorithm X) — compte les solutions | Non requis : toute solution valide est acceptée |
| 6 | **Menteurs** | Logique pure | Chaque personnage dit la vérité ou ment ; qui ment ? | Attribution aléatoire + énoncés générés | Énumération des 2ⁿ mondes | Oui |
| 7 | **Enquêtes** | Déduction | Grille de déduction (qui / quoi / où) à partir d'indices. *(genre « zebra puzzle »)* | Solution aléatoire → indices générés → suppression des indices redondants | Solveur de contraintes | Oui |
| 8 | **Balances** | Calcul mental | Des balances en équilibre relient des objets ; combien pèse l'objet mystère ? | Valeurs aléatoires → équations → système | Résolution d'un système linéaire + vérification des entiers | Oui |
| 9 | **Motifs** | Reconnaissance de motifs | Matrice 3×3 de symboles : quelle case manque ? | Attributs (forme, nombre, rotation, remplissage) + règle par ligne/colonne | Chaque option testée contre les règles | Oui (une seule option cohérente) |
| 10 | **Fil** | Chemins | Trace un fil unique qui passe par toutes les cases, de la lanterne à la lanterne. | Chemin hamiltonien aléatoire (algorithme « backbite ») + murs/indices | Vérification des règles | Non requis : tout fil valide est accepté |
| 11 | **Interrupteurs** | Interrupteurs / logique | Chaque interrupteur inverse lui-même et ses voisins ; allume tout. *(genre « Lights Out »)* | État final atteignable par combinaison aléatoire | Algèbre linéaire sur GF(2) : solvabilité + nombre minimal de coups | Solvable garanti ; toute solution acceptée |
| 12 | **Miroirs** | Symétrie / optique / spatial | Place des miroirs pour conduire le rayon vers chaque cible. | Trajet construit à rebours | Recherche exhaustive bornée | Oui (on rejette les ambigus) |
| — | **Énigmes** | Énigmes écrites à la main | Casse-têtes narratifs écrits pour les moments-clés (fin de bâtiment). | **Écrites à la main**, par langue | Relecture humaine + réponse normalisée | Oui |

**Répartition cible (~1 000 puzzles) :**

| Famille | Nb | Famille | Nb |
|---|---|---|---|
| Suites | 90 | Menteurs | 70 |
| Lanternes | 95 | Enquêtes | 70 |
| Cadenas | 90 | Balances | 85 |
| Engrenages | 90 | Motifs | 90 |
| Marqueterie | 85 | Fil | 85 |
| Interrupteurs | 70 | Miroirs | 75 |
| Énigmes (écrites) | ~25 | **Total** | **~1 020** |

Aucune famille ne dépasse ~10 % du total. Le défi quotidien, lui, est généré à la volée (quantité illimitée).

### 8.3 Familles écartées de la V1 (et pourquoi)

| Famille | Décision | Raison |
|---|---|---|
| **Mémoire** (Simon, mémoriser une scène) | Reportée | Repose sur le temps et la pression ; contraire au ton calme ; mauvaise accessibilité. Peut revenir en mode *facultatif*. |
| **Observation / différences** | Reportée | Nécessite une illustration unique par puzzle → coût d'assets énorme ; non générable. |
| **Ombres / vues 3D** (« quelle forme projette cette ombre ? ») | V1.1 | Excellente idée thématique, mais rendu 3D / isométrique coûteux à valider visuellement. Candidat n°1 pour la mise à jour suivante. |
| **Glissières** (blocs coulissants) | V1.1 | Très bonne mécanique (BFS = difficulté parfaite) mais proche d'un produit connu ; à retravailler pour trouver une variante propre. |
| **Jeux de mots** | Rejetée en générique | Intraduisibles. Autorisés uniquement comme Énigmes écrites par langue (cf. § 15.6). |
| **Logique temporelle** (ordonner des événements) | Intégrée | Absorbée par *Enquêtes* (indices du type « avant / après »). |
| **Couleurs / mélanges** | Intégrée | Absorbée comme *variante* d'Engrenages et Miroirs (filtres colorés), toujours doublée d'un motif. |

### 8.4 Renouvellement à l'intérieur d'une famille

Chaque famille a des **variantes** introduites progressivement, pour qu'un joueur voie une nouveauté environ toutes les 20–30 minutes de jeu. Exemples :

- *Lanternes* : grille 5×5 → 7×7 → murs sans nombre → lanternes colorées (deux couleurs qui ne doivent pas se croiser).
- *Engrenages* : tuiles droites/coudes → croisements → tuiles bloquées → deux sources de couleurs.
- *Balances* : 2 balances → 3–4 balances → balances déséquilibrées (« plus lourd que ») → poids fractionnaires (niveau Astre uniquement).
- *Cadenas* : 3 chiffres → 4 chiffres → symboles → indices « aucun chiffre juste ».

---

## 9. Progression

### 9.1 Deux ressources, pas une

C'est un choix important. Voir aussi § 19.

| Ressource | Nom (FR / EN) | Nature | Usage |
|---|---|---|---|
| **Lumières** | Lumières / Lights | Progression. **Jamais dépensables.** 1 puzzle résolu = 1 lumière. | Ouvrent les quartiers et bâtiments (seuils). |
| **Éclats** | Éclats / Shards | Monnaie douce. Gagnée en jouant. | Indices, cosmétiques. Futur : achat possible (jamais obligatoire). |

**Pourquoi :** si la monnaie servait aussi à progresser, un joueur qui dépense ses pièces en indices se bloquerait lui-même. Avec deux ressources, **demander de l'aide ne ralentit jamais la progression**.

> Nom de la monnaie : le brief propose « pièces ». En français, **« pièce » désigne aussi une salle** — or les salles sont au cœur de notre navigation. « Entre dans la pièce » vs « gagne 10 pièces » crée une confusion réelle. Je recommande **Éclats** (éclats de lumière) — cohérent avec l'univers et sans ambiguïté.

### 9.2 Déblocage par seuils, jamais par puzzle précis

- Un quartier s'ouvre quand le joueur a **N lumières au total** (ex. Horlogerie à 40, Serre à 100…).
- Un bâtiment s'ouvre quand **X % du bâtiment précédent** est allumé (ex. 60 %).
- Dans une salle, toutes les lanternes sont accessibles dès l'entrée ; un ordre est **recommandé** (flèche douce), pas imposé.

→ Un joueur bloqué sur un puzzle **peut toujours faire autre chose** qui le fait avancer. C'est la règle anti-frustration n°1.

Les seuils sont calibrés pour qu'environ **65–70 %** des puzzles d'un quartier suffisent à ouvrir le suivant. Les 30 % restants sont le contenu des complétionnistes (et les objets de collection y sont souvent cachés).

### 9.3 Difficulté

**Paliers (in-universe) :**

| Palier | FR | EN | Intention | Temps cible indicatif |
|---|---|---|---|---|
| 1 | **Étincelle** | Spark | « Ah OK, je vois comment ça marche. » Une seule déduction. | < 1 min |
| 2 | **Lueur** | Glow | Application directe des règles. | 1–2 min |
| 3 | **Flamme** | Flame | « Là il faut réfléchir. » Enchaînement de déductions. | 2–4 min |
| 4 | **Lanterne** | Lantern | Une technique non évidente est nécessaire. | 3–6 min |
| 5 | **Phare** | Beacon | « Celui-là est vraiment intéressant. » Plusieurs techniques combinées. | 5–10 min |
| 6 | **Astre** | Star | Maîtrise. Facultatif, jamais sur le chemin critique. | 10 min + |

Le palier est affiché par une petite icône de flamme de taille croissante (et son nom, pour l'accessibilité), jamais par un chiffre anxiogène.

**Mesure objective :** chaque famille dispose d'un **solveur « humain »** qui résout par *techniques classées* (de la plus simple à la plus avancée) plutôt que par force brute. Le score de difficulté combine :

- la technique la plus avancée nécessaire (poids fort) ;
- le nombre d'étapes de déduction ;
- le nombre d'étapes où plusieurs techniques avancées sont nécessaires ;
- le besoin (ou non) d'hypothèse / retour en arrière ;
- la taille de l'espace de recherche (pour les familles QCM/codes) ;
- pour Interrupteurs / Miroirs : nombre minimal de coups (calculé exactement).

Le score brut est converti en palier par des **seuils calibrés par famille**. La calibration initiale se fait par tests de jeu (TestFlight, feedback volontaire et explicite des testeurs). **Aucune télémétrie** n'est utilisée pour calibrer — c'est le prix de la vie privée, et je l'assume.

**Courbe globale : en dents de scie.** Chaque bâtiment commence facile et monte ; le bâtiment suivant redescend un peu puis monte plus haut. Le « puzzle-clé » de fin de bâtiment est le sommet local. Cela évite le mur de difficulté et crée des moments de respiration.

```
difficulté
  ▲                                   ╱╲
  │                    ╱╲       ╱╲  ╱  ╲
  │         ╱╲   ╱╲  ╱  ╲  ╱╲ ╱  ╲╱
  │   ╱╲  ╱  ╲ ╱  ╲╱    ╲╱  ╲╱
  │ ╱  ╲╱    ╲╱
  └──────────────────────────────────────▶ progression
    Phare  Biblio.  Horlog.  Serre  Marché  Théâtre  Obs.
```

### 9.4 Indices : 4 niveaux

| Niveau | Nom | Contenu | Coût (proposé) |
|---|---|---|---|
| 1 | **Murmure** | Orientation : « Regarde la colonne de droite. » / met en surbrillance une zone | **Gratuit, toujours** |
| 2 | **Piste** | La déduction à faire, sans la conclure : « Le mur marqué 3 n'a que 3 cases libres autour de lui. » | 5 Éclats |
| 3 | **Éclairage** | La déduction + sa conséquence appliquée (une case remplie / une option éliminée, avec explication) | 10 Éclats |
| 4 | **Solution** | La solution complète, animée pas à pas. Le puzzle compte comme résolu (lumière gagnée) mais sans bonus. | 20 Éclats |

- Pour les familles à solveur « humain », les niveaux 1–3 sont **générés automatiquement** à partir de la trace du solveur *sur l'état actuel du joueur* (si le joueur a déjà avancé, l'indice part de là où il en est).
- Pour les Suites / Motifs / Énigmes : indices rédigés à partir de la règle (générés pour Suites/Motifs, écrits pour Énigmes).
- **Filet de sécurité :** après 2 erreurs ou ~3 min d'inactivité sur un palier Étincelle/Lueur, Nilo propose (discrètement, une seule fois) un Murmure.
- Si le joueur n'a plus d'Éclats : le Murmure reste gratuit, et il peut toujours aller jouer un autre puzzle. Pas de blocage possible.

### 9.5 Économie (esquisse, détaillée dans GAME_DESIGN.md)

- Gain : 5 (Étincelle) → 25 (Astre) Éclats par puzzle, +50 % si résolu sans indice ni erreur (« Clairvoyance »).
- Salle complète : +20 ; bâtiment complet : +50 + cosmétique ; défi du jour : +15 (+ bonus de série plafonné).
- Cible d'équilibrage : un joueur moyen peut s'offrir **un indice niveau 2 environ tous les 3 puzzles** sans jamais épargner. L'économie doit être *généreuse* en V1 — il n'y a rien à vendre.

---

## 10. Gamification

| Système | Forme dans Lampion | Garde-fou |
|---|---|---|
| **Progression** | La ville qui s'allume ; jauges salle / bâtiment / quartier | Toujours visible, jamais punitive |
| **Récompenses** | Lumière (immédiate), Éclats, décor restauré, objets, cosmétiques | Pas de hasard, pas de coffre aléatoire |
| **Collection** | *Objets trouvés* (1 par salle, ~170), *Lettres de l'Allumeur* (1 par quartier) | Consultables dans un carnet illustré |
| **Succès** | « Le Carnet de Nilo » : ~50 succès, dont des succès *malicieux* (« Résoudre un puzzle Phare sans indice ») | Aucun succès n'exige de jouer à heure fixe ou longtemps d'affilée |
| **Série** | Flamme de série sur le défi quotidien | **Veilleuses** : 1 jour de grâce gagné automatiquement par semaine de série (max 2 en réserve). Rater un jour ne détruit pas la série si une veilleuse est dispo. |
| **Défi quotidien** | 1 puzzle/jour, déterministe, historique local, calendrier | Rattrapage des 7 derniers jours possible (sans bonus de série) |
| **Objectifs** | « Prochain objectif » unique en accueil (pas une liste de 12 quêtes) | Un seul objectif affiché à la fois |
| **Personnalisation** | Cosmétiques de Nilo, couleur de sa flamme, décoration de la maison du Phare | Tous gagnables en jouant |
| **Exploration** | Zones sombres suggérées, silhouettes, portes entrouvertes | — |

**Ce que nous refusons :** vies, énergie, roue de la fortune, coffres aléatoires, compte à rebours de « promo », classement global en V1, notifications de relance culpabilisantes (« Nilo est triste que tu sois parti »).

---

## 11. Mascotte

### 11.1 Nilo, le lampyre

- **Espèce :** un *lampyre* (créature inventée, clin d'œil au nom savant de la luciole, *Lampyridae*).
- **Silhouette :** un corps en forme de goutte / galet arrondi, couleur encre bleu nuit, deux oreilles pointues légèrement inclinées, deux grands yeux sans pupille visible (lueur douce), pas de bouche dessinée en temps normal (elle apparaît pour les émotions fortes). Une **longue queue fine** qui se termine par une **flamme-lanterne** ronde.
- **Test de silhouette :** reconnaissable en noir plein à 32 px (goutte + 2 oreilles + queue à boule lumineuse).
- **Rôle :** apprenti de l'Allumeur disparu. Curieux, un peu maladroit, jamais moralisateur.

### 11.2 Pourquoi cette conception

| Exigence | Réponse |
|---|---|
| Attachante | Proportions « bébé » (grosse tête = corps, petits membres), yeux expressifs |
| Simple / animable | 5 éléments : corps, 2 oreilles, 2 yeux, queue, flamme. Animable en vectoriel ou en Rive/Lottie-like natif (SwiftUI Canvas / Shapes), pas besoin de sprites lourds |
| Expressive **sans visage complexe** | **La flamme est l'organe émotionnel** : taille, couleur, rythme de scintillement. Les oreilles font le reste. |
| Icône | Nilo tient dans un carré ; sa flamme est le point focal lumineux sur fond nuit |
| Cohérente avec l'univers | Elle *est* la dernière lumière de Vesper |
| Originale | Ni hibou (Duolingo), ni personnage humain (Layton), ni forme géométrique (Monument Valley), ni créature « à attraper ». Référence la plus proche à surveiller : les créatures lumineuses de jeux d'ambiance (esprits, lucioles) — Nilo se distingue par sa queue-lanterne et son rôle d'allumeur. |

### 11.3 Grammaire émotionnelle

| Émotion | Oreilles | Yeux | Flamme | Usage |
|---|---|---|---|---|
| Neutre / attente | droites | ouverts, clignements lents | douce, scintillement lent | Menus |
| Curiosité | une oreille penchée | légèrement agrandis | penche vers l'objet | Exploration, nouvelle salle |
| Réflexion | baissées | plissés | petite, stable | Pendant un puzzle (très discret) |
| Joie | dressées, petit rebond | fermés en arcs | grandit, étincelles | Réussite |
| Oups (erreur) | se plient vers l'arrière | clignent | vacille brièvement, *ne s'éteint jamais* | Erreur — **jamais de moquerie** |
| Indice | une oreille levée | ouverts | éclaire une zone du puzzle | Indices : Nilo *pointe littéralement* avec sa lumière |
| Émerveillement | très droites | grands ouverts | flamme qui change de couleur | Nouveau quartier |
| Sommeil | tombantes | fermés | braise | Écran de pause, app inactive |

### 11.4 Personnalisation (cohérente avec la DA)

- **Couleur de flamme** (ambre par défaut, puis : lune, braise, aurore, vert-de-gris…).
- **Accessoires de tête** : bonnet d'allumeur, lunettes de l'Archiviste, loupe de l'Horlogère, couronne de lierre du Jardinier…
- **Écharpes / capes** (petites, pour ne pas casser la silhouette).
- **Compagnons** : une petite luciole qui suit Nilo, une feuille flottante…
- **Lanterne de queue** : forme de la lanterne (ronde, papier plissé, étoile…).

Règle : **aucun cosmétique ne masque les yeux, les oreilles ou la flamme** (lisibilité émotionnelle préservée).

### 11.5 Note sur les habitants

Pour éviter de reproduire la mascotte-hibou d'une app d'apprentissage connue, **aucun hibou** dans le casting. Le Souffleur du Théâtre est un pangolin (écailles = rideau de scène, se roule en boule quand il a le trac).

---

## 12. Naming

### 12.1 Critères

International · prononçable en FR et EN · court (≤ 8 lettres idéalement) · mémorable · premium · évocateur sans être littéral · non limité à un type de puzzle · cohérent avec l'univers lumière/nuit · déposable (a priori).

### 12.2 Les 32 propositions

Légende potentiel international : ★ faible · ★★ moyen · ★★★ fort.

| # | Nom | Prononciation | Signification | Pourquoi ça marche | Slogan potentiel | Personnalité | Risques | Intl |
|---|---|---|---|---|---|---|---|---|
| 1 | **Lampion** | FR *lɑ̃.pjɔ̃* / EN *LAM-pee-on* | Lanterne de papier (FR, DE, NL, PL…) | Concret, chaleureux, visuel, existe dans plusieurs langues, forme d'icône évidente | Chaque énigme rallume une lumière | Chaleureux, poétique | FR : connotation fête populaire (14 juillet) ; argot « s'en mettre plein le lampion » (marginal) | ★★★ |
| 2 | **Gloam** | *glohm* | « Crépuscule » (anglais poétique) | Court, mystérieux, sonne premium | Puzzles for the in-between hours | Mystérieux, littéraire | Inconnu des francophones ; proche de *gloom* | ★★ |
| 3 | **Vesper** | *VES-per* | Étoile du soir ; office du soir | Élégant, latin, lisible partout | Une énigme avant la nuit | Élégant, calme | Très utilisé (scooters Vespa proche, cocktails, marques diverses) | ★★ |
| 4 | **Candela** | *kan-DÉ-la* | Unité d'intensité lumineuse ; « bougie » (ES/IT) | Scientifique + poétique | L'intelligence, en candelas | Précis, lumineux | Marque de lasers médicaux, jeux indés homonymes | ★★★ |
| 5 | **Lumora** | *lou-MO-ra* | Néologisme (lumière + aurora) | Doux, déposable potentiellement | Là où les idées s'allument | Doux, onirique | Sonne « générique app » ; déjà utilisé par diverses petites marques (non vérifié en détail) | ★★★ |
| 6 | **Nilo** | *NI-lo* | Nom de la mascotte | Marque = mascotte (stratégie forte) | Nilo rallume la ville | Attachant | « Nile » en ES/IT ; limite la marque à la mascotte | ★★★ |
| 7 | **Wick** | *wik* | Mèche de bougie | Court, graphique | Light the wick | Minimal | Association *John Wick* ; nom de famille courant | ★★ |
| 8 | **Ember** | *EM-ber* | Braise | Chaleureux | Keep the ember alive | Chaleureux | Extrêmement utilisé (framework, marques) | ★ |
| 9 | **Lanterna** | *lan-TER-na* | Lanterne (IT/PT/LA) | Clair | — | Classique | App VPN existante du même nom (collision directe) | ★ |
| 10 | **Umbra** | *OUM-bra* | Ombre (latin) | Mystérieux | Solve your way to the light | Sombre | Trop sombre, nombreux usages existants | ★★ |
| 11 | **Glimmer** | *GLI-mer* | Lueur faible | Doux | A glimmer of genius | Léger | Imprononçable proprement en FR | ★ |
| 12 | **Faro** | *FA-ro* | Phare (ES/IT/PT) | Court, lié au Phare hub | Suis la lumière | Solide | Ville du Portugal, jeu de cartes, marque industrielle | ★★ |
| 13 | **Luciole** | *lu-SJOL* | Luciole (FR) | Très joli en FR | — | Tendre | Difficile en EN, dessert/produits existants | ★ |
| 14 | **Noctua** | *NOK-tu-a* | Chouette (latin) | Sonne premium | — | Sérieux | Marque de ventilateurs PC connue ; chouette = à éviter | ✗ |
| 15 | **Nocturne** | *nok-TURN* | Pièce musicale nocturne | Élégant | — | Musical | Très utilisé ; générique | ★ |
| 16 | **Kindle** | — | Allumer | Parfait sémantiquement | — | — | Marque Amazon — exclu | ✗ |
| 17 | **Solace** | *SO-lis* | Réconfort | Ton apaisant | — | Apaisant | Aucun lien puzzle ; prononciation FR | ★ |
| 18 | **Lucent** | *LOU-sent* | Lumineux, clair | Idée de clarté mentale | Think in the light | Clair, intelligent | Entreprise télécom historique (Lucent) | ★ |
| 19 | **Glint** | *glint* | Reflet bref | Court, vif | — | Vif | Plusieurs marques tech ; son dur en FR | ★★ |
| 20 | **Mèche** | *mèch* | Mèche | FR joli | — | — | Imprononçable/ambigu en EN ; « mèche » de cheveux | ✗ |
| 21 | **Oriel** | *O-ri-el* | Fenêtre en encorbellement | Élégant, architectural | Une fenêtre sur l'énigme | Raffiné | Peu connu ; déjà prénom et marques | ★★ |
| 22 | **Lampwright** | *LAMP-rait* | Artisan de lampes | Évoque l'artisanat | — | Artisan | Long, imprononçable en FR | ✗ |
| 23 | **Veille** | *vèy* | La veille, rester éveillé | Double sens FR | — | Intime | Imprononçable en EN, « mode veille » | ✗ |
| 24 | **Halo** | *HA-lo* | Halo lumineux | Universel | — | Doux | Franchise Xbox Halo — exclu | ✗ |
| 25 | **Aurel** | *o-REL* | De *aurum*, or | Doux, premium | — | Précieux | Prénom ; peu de sens puzzle | ★★ |
| 26 | **Lumen** | *LOU-mèn* | Unité de flux lumineux | Parfait sémantiquement | — | Scientifique | Jeu de puzzle lumière existant (*lumen.*) — collision | ✗ |
| 27 | **Wisp** | *wisp* | Feu follet | Mystérieux, court | Follow the wisp | Espiègle | Nombreux usages (logiciels, jeux) | ★★ |
| 28 | **Tinder** | — | Amadou | — | — | — | App de rencontre — exclu | ✗ |
| 29 | **Brasero** | *bra-zé-RO* | Brasero | Chaleureux | — | Rustique | Pas premium ; objet utilitaire | ★ |
| 30 | **Quinquet** | *kin-KÈ* | Lampe à huile ancienne (FR) | Original, désuet charmant | — | Rétro | Inconnu hors FR ; « quinquets » = yeux (argot) | ✗ |
| 31 | **Nyxel** | *NIK-sel* | Nyx (nuit) + pixel | Néologisme déposable | — | Tech | Froid, « gaming » ; pas premium | ★★ |
| 32 | **Lumelle** | *lu-MEL* | Néologisme (lumière + -elle) | Doux, féminin | — | Délicat | Fade, peut sonner cosmétique | ★★ |

### 12.3 Short-list

| Rang | Nom | Verdict |
|---|---|---|
| **1** | **Lampion** | **Recommandé.** Objet concret et poétique (on *voit* l'icône en entendant le nom), compris dans de nombreuses langues européennes, prononçable en anglais, chaleureux + mystérieux, pas lié à un type de puzzle, cohérent avec « chaque énigme rallume une lumière ». |
| 2 | **Gloam** | Plan B « premium anglo ». Très élégant, mais opaque pour le public francophone (langue principale du projet). |
| 3 | **Candela** | Plan B « international ». Bel équilibre science/poésie, mais collisions de marques plus probables. |
| 4 | **Nilo** | Plan B « marque-mascotte ». Stratégie forte si la mascotte devient le cœur de la marque. |
| 5 | **Lumora** | Plan C « néologisme ». Plus facilement déposable, mais moins de caractère. |

Pour l'App Store, le nom seul sera probablement insuffisant (noms courts souvent pris). Format recommandé : **« Lampion — Casse-têtes »** (FR) / **« Lampion: Puzzle Lanterns »** (EN), à ajuster selon disponibilité.

### 12.4 ⚠️ Vérifications — état réel

Ce qui a été fait :
- Recherches web rapides (29/09/2026) sur *Lampion*, *Gloam*, *Candela*, *Lumora*, *Lampwick/Veilleur*.
- **Aucune app nommée exactement « Lampion »** n'est apparue dans ces résultats ; de nombreux jeux de « lampes » existent (thème commun).
- *Lumen* : un jeu de puzzle de lumière (*lumen.*) existe → exclu.
- *Candela* : jeux indépendants homonymes sur itch.io → risque de confusion.
- *Lanterna* : app VPN existante → exclu.

Ce qui **n'a pas** été vérifié (à faire avant tout engagement) :
- ❌ Disponibilité du nom dans App Store Connect (seule preuve fiable : tenter de réserver le nom).
- ❌ Recherche de marques INPI (FR), EUIPO (UE), USPTO (US), WIPO (international), en classes 9 (logiciels/jeux) et 41 (divertissement), voire 28 (jouets, pour les produits dérivés).
- ❌ Disponibilité des noms de domaine et des comptes réseaux sociaux.
- ❌ Connotations dans les langues non européennes.

**Je ne prétends pas que « Lampion » est disponible juridiquement.** Une recherche d'antériorité par un conseil en propriété industrielle est recommandée avant le lancement.

### 12.5 Identité de marque (synthèse — détaillée dans DESIGN_SYSTEM.md)

| Élément | Proposition |
|---|---|
| Nom | **Lampion** |
| Slogan FR | *Chaque énigme rallume une lumière.* |
| Slogan EN | *Every puzzle brings back a light.* |
| Tagline App Store | FR : *Casse-têtes à la lueur des lanternes* · EN : *Puzzles by lantern light* |
| Personnalité | Le **bibliothécaire bienveillant d'une ville nocturne** : cultivé, calme, un brin malicieux, jamais condescendant. |
| Ton rédactionnel | Phrases courtes. Tutoiement en FR (chaleur, public large). Vocabulaire de la lumière : *allumer, éclairer, lueur, veiller*. Jamais de jargon (« niveau », « stage », « boost » → remplacés par *salle*, *lanterne*, *indice*). Aucun point d'exclamation en série. |
| Vocabulaire interdit | « Génie », « QI », « cerveau », « entraîner ton cerveau », « facile ! », « échec », « perdu ». |
| Vocabulaire maison | Lumière, Éclat, Salle, Lanterne, Murmure (indice), Veilleuse (jour de grâce), Carnet (succès), Objets trouvés. |

---

## 13. Direction artistique (intention)

> La charte complète (tokens, composants, états, animations) sera livrée dans `DESIGN_SYSTEM.md` et affichée en tête de la maquette. Ici : l'intention.

### 13.1 Nom de la DA : **« Encre & Lueur »** (*Ink & Glow*)

**Concept visuel :** un monde dessiné à l'encre bleu nuit, où la seule source de chaleur est la lumière que le joueur rallume. Les zones éteintes sont monochromes (bleus profonds, gris ardoise) ; les zones allumées retrouvent des couleurs chaudes et douces. **Le contraste chaud/froid EST la progression.**

### 13.2 Palette d'intention

| Rôle | Nom | Valeur proposée | Usage |
|---|---|---|---|
| Fond | Encre de nuit | `#0D0F1E` | Arrière-plan principal |
| Surface | Ardoise | `#171A2E` | Cartes, panneaux |
| Surface élevée | Brume haute | `#22264A` | Feuilles, modales |
| Texte principal | Parchemin | `#EFE8D8` | Titres, corps |
| Texte secondaire | Brume | `#9CA2C6` | Légendes |
| **Accent principal** | **Ambre** | `#F4B45E` | Lumière, action principale, progression |
| Accent froid | Clair de lune | `#8FD3E0` | Sélection, focus, éléments de puzzle |
| Succès | Or pâle | `#FFD98E` + halo | Réussite (toujours accompagné d'une icône) |
| Erreur | Corail fané | `#E27D7D` | Erreur (toujours accompagnée d'une forme / d'un mouvement) |
| Désactivé / verrouillé | Ardoise 40 % | — | Verrouillé = désaturé + icône cadenas-lanterne |

Contrastes : texte principal/fond ≈ 15:1, secondaire/fond ≈ 7:1 (à revalider outil en main) ; objectif WCAG AA minimum partout, AAA pour le texte courant.

**Mode clair :** l'identité est nocturne par nature. Je recommande **un seul thème sombre** en V1, avec une variante **« contraste élevé »** pour l'accessibilité — plutôt qu'un mode clair qui trahirait la DA. Voir § 19.

### 13.3 Typographies (intention)

- **Titres :** *New York* (serif système d'Apple) — élégant, littéraire, gratuit, supporte Dynamic Type nativement.
- **Interface / corps :** *SF Pro* (Text / Display).
- **Chiffres, codes, grilles :** *SF Pro Rounded* ou *SF Mono* (chiffres tabulaires, lisibilité des Cadenas et Balances).

Aucune police tierce → pas de licence, poids d'app minimal, support natif de l'accessibilité.

### 13.4 Formes et matières

- Coins arrondis continus (squircle Apple), rayons généreux.
- Profondeur par **lumière** plutôt que par ombres portées : les éléments actifs *émettent* un halo ambré léger ; les inactifs sont plats.
- Texture très subtile de papier/grain sur les fonds (≤ 3 % d'opacité), pour éviter le « plat numérique ».
- Illustrations : **dioramas en coupe**, perspective frontale légèrement isométrique, formes géométriques simples, peu de détails, beaucoup de noir. Inspiration de principe (pas de copie) : architecture impossible douce, papier découpé, théâtre d'ombres.

### 13.5 Animation (principes)

1. **La lumière est le mouvement principal** : les choses s'allument, s'éteignent, scintillent. Peu de translations.
2. **Courtes** : 150–300 ms pour les interactions, 800–1 400 ms pour les célébrations.
3. **Physiques** : ressorts doux (spring), jamais de rebond cartoon excessif.
4. **Interruptibles** : toute animation de récompense est « tapable » pour être passée.
5. **Réduction des animations** : chaque animation a une version *fondu simple* utilisée si l'utilisateur a activé *Réduire les animations*.
6. **Aucune animation permanente coûteuse** : le scintillement ambiant est ralenti / arrêté en arrière-plan et en mode économie d'énergie.

---

## 14. Architecture UX

### 14.1 Principes

- **Le joueur est toujours à 1 tap de jouer** (bouton *Continuer*).
- **Profondeur max : 3 niveaux** sous l'accueil avant un puzzle.
- **Pas de tab bar chargée.** Navigation spatiale (on *entre* dans les lieux) + un accès permanent à 3 éléments : Accueil, Carnet, Réglages.
- **Un seul appel à l'action principal par écran.**
- **Toujours savoir où l'on est :** fil d'Ariane visuel discret (Vesper › Horlogerie › Atelier des Ressorts › Salle 2).

### 14.2 Arborescence

```
Lancement
 ├─ (1er lancement) Onboarding — 3 écrans max → premier puzzle Étincelle immédiatement
 └─ ACCUEIL (la maison de Nilo au Phare, fenêtre sur Vesper)
      ├─ [Continuer] ─────────────────────────────▶ PUZZLE (dernier en cours ou suivant recommandé)
      ├─ Défi du jour ─────────────────────────────▶ PUZZLE quotidien → Calendrier / historique
      ├─ Carte de Vesper
      │    └─ Quartier (vue d'ensemble, bâtiments)
      │         └─ Bâtiment en coupe (salles visibles)
      │              └─ Salle (lanternes sur objets)
      │                   └─ PUZZLE
      │                        ├─ Indices (feuille)
      │                        ├─ Pause (feuille)
      │                        ├─ Réussite → Récompense → [Suivant] / [Salle]
      │                        └─ Erreur (inline, pas d'écran dédié)
      ├─ Nilo (personnalisation) ← tap sur Nilo
      ├─ Carnet (succès · objets trouvés · lettres · statistiques locales)
      └─ Réglages (son, musique, haptique, notifications, accessibilité, langue, confidentialité, sauvegarde)
```

> « Profil local » (demandé dans le brief) n'est pas un écran séparé : sans compte, un « profil » n'a pas de sens propre. Ses contenus (statistiques, série, succès) vivent dans le **Carnet**, et Nilo *est* l'avatar. Moins d'écrans, même information. Voir § 19.

> « Puzzle échoué » n'est pas un écran : un casse-tête ne s'échoue pas, on se trompe et on réessaie. L'erreur est un **état inline** du puzzle (secousse, marque sur l'élément fautif, réaction de Nilo). La maquette montrera cet état.

### 14.3 iPhone (portrait) vs iPad (paysage)

| Écran | iPhone portrait | iPad paysage |
|---|---|---|
| Accueil | Empilé : fenêtre sur Vesper en haut, Nilo, *Continuer*, défi du jour | Deux colonnes : grande fenêtre sur Vesper à gauche (≈ 60 %), colonne Nilo + actions à droite |
| Carte | Plein écran, défilement vertical de la ville | Plein écran, ville entière visible, panneau latéral d'infos du quartier sélectionné |
| Bâtiment | Coupe verticale défilante | Coupe complète + aperçu de la salle sélectionnée à côté (master/detail) |
| Puzzle | Plateau en haut, consigne et actions en bas (zone du pouce) | Plateau centré grand format, consigne à gauche, indices/Nilo à droite (plus de feuilles modales : panneaux fixes) |
| Carnet | Liste → détail | Grille + détail côte à côte |

### 14.4 Le test des 10 secondes (premier lancement)

1. **0–3 s** : splash — la flamme de Nilo s'allume dans le noir, le nom apparaît.
2. **3–10 s** : écran 1 d'onboarding — « Vesper s'est éteinte. Chaque énigme rallume une lumière. » + [Commencer].
3. **~15 s** : premier puzzle (Interrupteurs 2×2, une seule action possible). Le joueur apprend en jouant.
4. **~40 s** : la première lanterne s'allume. Nilo saute. Le décor du Phare se colore.
5. 2 autres puzzles Étincelle ; puis l'accueil apparaît, déjà « à soi ».

Pas de formulaire, pas de permission demandée. La demande de notifications n'intervient **qu'après le premier défi quotidien terminé**, avec une explication.

---

## 15. Architecture technique (vue d'ensemble)

> Le détail sera dans `TECHNICAL_ARCHITECTURE.md`. Ici : les décisions structurantes.

### 15.1 Stack

- **Swift 6** (concurrence stricte), **SwiftUI**, **Observation** (`@Observable`).
- Cible minimale proposée : **iOS / iPadOS 18** (bon compromis entre APIs modernes et parc installé en 2026 ; à reconfirmer au moment du développement).
- **Aucune dépendance tierce** en V1 : simplifie le *privacy manifest*, la sécurité, la maintenance.
- Localisation : **String Catalogs** (`.xcstrings`) + catalogues de contenu séparés pour les puzzles.
- Audio : `AVAudioEngine` / `AVAudioPlayer` derrière une abstraction `AudioService`.
- Haptique : `sensoryFeedback` SwiftUI / `UIFeedbackGenerator` derrière `HapticsService`.
- Notifications : `UserNotifications`, **locales uniquement**.

### 15.2 Modularisation (Swift Package local, multi-cibles)

```
LampionApp (cible iOS)          → assemblage, injection des dépendances
 ├─ Features/*                  → écrans SwiftUI (Home, Map, Room, Puzzle, Notebook, Settings…)
 ├─ DesignSystem                → tokens, composants, animations, Nilo (rendu vectoriel)
 ├─ GameCore                    → progression, économie, déblocages, succès, série, défi du jour (Swift pur)
 ├─ Persistence                 → sauvegarde locale versionnée + migrations (Swift pur)
 ├─ PuzzleKit                   → protocoles communs : Puzzle, Generator, Solver, Validator, HintProvider, DifficultyRater, RNG déterministe
 ├─ PuzzleFamilies/*            → une cible par famille (modèle + générateur + solveur + validateur + indices + vue)
 ├─ Content                     → packs de contenu (JSON), manifestes de mondes, textes localisés
 ├─ Platform                    → Audio, Haptics, Notifications, Clock (abstraites, mockables)
 └─ Monetization (vide en V1)   → protocoles StoreService / AdService avec implémentations « NoOp »

Tools/ContentForge (CLI Swift)  → génère, résout, valide, mesure et exporte les packs de puzzles
```

**Règle de dépendance :** `PuzzleKit`, `PuzzleFamilies` (logique), `GameCore` et `Persistence` n'importent **ni SwiftUI ni UIKit** → testables en ligne de commande, sur Linux comme sur macOS, rapides en CI.

### 15.3 Le contrat d'une famille de puzzles (conceptuel)

```
Famille
  ├─ Puzzle          : données immuables, Codable, versionnées
  ├─ PlayerState     : l'état du joueur sur ce puzzle (sauvegardé en continu)
  ├─ Generator       : (seed, paramètres) → Puzzle candidat         [déterministe]
  ├─ Solver          : Puzzle → solutions (0, 1, n) + trace de déduction
  ├─ Validator       : (Puzzle, PlayerState) → correct / erreurs localisées
  ├─ DifficultyRater : trace du solveur → score → palier
  ├─ HintProvider    : (Puzzle, PlayerState, niveau) → indice
  └─ Renderer        : vue SwiftUI + accessibilité (côté app uniquement)
```

Ajouter une famille = créer une cible qui implémente ce contrat et l'enregistrer dans un registre. Aucun autre module à modifier.

### 15.4 Pipeline de contenu : **générer hors ligne, livrer figé**

```
ContentForge (au moment du build, pas sur l'appareil)
  GENERATE (seed) → SOLVE → VERIFY (unicité, validité) → MEASURE (difficulté)
  → DEDUPLICATE (empreinte canonique, symétries comprises) → ACCEPT / REJECT
  → placement dans le monde selon la courbe de difficulté
  → export JSON + rapport statistique
```

- Les ~1 000 puzzles de la campagne sont **générés à l'avance**, relus, versionnés dans le dépôt, et **re-validés à chaque exécution de la CI**.
- L'app embarque les **données** des puzzles (pas seulement leur *seed*) : une évolution future d'un générateur ne peut pas modifier en silence un puzzle déjà joué.
- **Sur l'appareil**, la génération n'est utilisée que pour le **défi du jour** et un futur mode « Atelier infini ». Elle s'exécute hors du thread principal, avec budget de temps et repli sur un pool de puzzles pré-validés embarqué.

### 15.5 Déterminisme — piège identifié

- Le générateur aléatoire standard de Swift n'est **pas** initialisable par graine → implémentation d'un PRNG propre (ex. *SplitMix64* / *Xoshiro256*), identique sur toutes les plateformes.
- L'ordre d'itération de `Set` / `Dictionary` en Swift est **aléatoire d'un lancement à l'autre** → interdit dans les générateurs (tests dédiés : même seed ⇒ même puzzle, octet pour octet, sur 10 000 seeds).
- Pas de `Double` dans les calculs qui décident de la structure d'un puzzle (arrondis dépendants de la plateforme).
- Défi du jour : `seed = hash(date locale AAAA-MM-JJ, langue, version du générateur)`.

### 15.6 Localisation du contenu

- Interface : String Catalogs FR (source) + EN.
- Puzzles non textuels (la très grande majorité) : seules les consignes sont localisées.
- Puzzles textuels générés (Menteurs, Enquêtes) : **gabarits de phrases par langue** avec gestion du genre/nombre, pas de traduction mot à mot.
- Énigmes écrites : **contenu par langue** ; une énigme peut exister en FR sans équivalent EN — l'emplacement dans le monde reçoit alors une énigme *différente* dans l'autre langue (notion de « slot » d'énigme, rempli par langue).

### 15.7 Sauvegarde

- Document de sauvegarde **unique, Codable, versionné** (`schemaVersion`), écrit de façon **atomique** (fichier temporaire + remplacement) dans *Application Support*, avec **copie de sécurité** de la version précédente.
- Migrations explicites `v1 → v2 → …`, chacune testée avec des sauvegardes réelles figées dans les tests.
- Sauvegarde corrompue → restauration de la copie de sécurité → à défaut, récupération partielle champ par champ → jamais de crash.
- Idempotence des récompenses : chaque récompense a un **identifiant** ; une récompense déjà attribuée ne peut pas l'être deux fois (double tap, relance pendant l'animation).
- **iCloud (post-V1) :** envisageable via CloudKit (base privée de l'utilisateur) — les données restent dans le compte iCloud de l'utilisateur, nous n'y avons pas accès. Non nécessaire en V1.

> Pourquoi pas SwiftData / Core Data ? Pour ce volume (quelques dizaines de Ko), un document Codable versionné est plus simple, plus transparent, trivialement testable et migrable. SwiftData reste une option si l'historique local grossit fortement.

### 15.8 Évolutivité commerciale (préparée, non activée)

- `EconomyService` : toutes les transactions d'Éclats passent par un registre typé (source → gain/dépense, identifiant idempotent).
- `StoreService` (StoreKit 2) et `AdService` : **protocoles uniquement**, implémentation `NoOp` en V1. Aucun SDK publicitaire dans le binaire V1.
- `EntitlementService` : « Premium » = un droit parmi d'autres, lu par les features (pas de `if premium` dispersés).
- `AdPolicy` (futur) : plafond de fréquence, jamais pendant un puzzle, jamais à la réussite immédiate, désactivé par Premium — codé dès que les pubs arrivent, et testé.

### 15.9 Contrainte d'environnement de développement

L'environnement actuel de ce projet est Linux, **sans Xcode**. Conséquences :
- Les modules Swift purs (PuzzleKit, familles, GameCore, Persistence, ContentForge) peuvent être développés et testés ici **si un toolchain Swift pour Linux est installé** (à configurer dans l'environnement).
- L'app SwiftUI, les tests UI, les snapshots visuels et la compilation iOS **nécessitent macOS + Xcode** (poste local ou CI macOS).
- La **maquette/prototype** sera réalisée en HTML/CSS/JS interactif (visualisable immédiatement dans un navigateur, sans build iOS), fidèle aux tokens du design system.

---

## 16. Risques

| # | Risque | Probabilité | Impact |
|---|---|---|---|
| R1 | **Puzzles de suites ambigus** (toute suite finie admet une infinité de continuations) | Élevée | Élevé (frustration, avis négatifs) |
| R2 | Générateurs produisant des puzzles **répétitifs** (« tous pareils ») | Élevée | Élevé |
| R3 | **Difficulté mal calibrée** sans télémétrie | Élevée | Élevé |
| R4 | **Coût des illustrations** (7 quartiers × 4 bâtiments × salles, états éteint/allumé) | Élevée | Élevé (délais) |
| R5 | Thème lumière déjà exploité → **différenciation insuffisante** | Moyenne | Moyen |
| R6 | Nom indisponible (App Store / marque) | Moyenne | Moyen |
| R7 | **Perte de sauvegarde** lors d'une mise à jour | Faible | Critique |
| R8 | Non-déterminisme des générateurs (défi du jour différent selon les appareils) | Moyenne | Moyen |
| R9 | **Accessibilité** des familles spatiales (Engrenages, Miroirs, Marqueterie) avec VoiceOver | Élevée | Moyen |
| R10 | iPad : verrouillage paysage incompatible avec le fenêtrage d'iPadOS récent | Élevée | Moyen |
| R11 | Localisation des puzzles textuels (accords, genres, tournures) | Moyenne | Moyen |
| R12 | Scope creep (12 familles × générateur + solveur + indices + vue) | Élevée | Élevé |
| R13 | Économie trop avare ou trop généreuse | Moyenne | Faible en V1 |
| R14 | Streak et notifications perçus comme manipulateurs | Faible | Moyen |
| R15 | Manipulation de la date système pour « tricher » au défi du jour | Moyenne | Faible (aucun enjeu compétitif en V1) |

---

## 17. Solutions

| Risque | Solution |
|---|---|
| R1 Suites ambiguës | Toujours en **QCM (4 options)**. Le générateur teste chaque option contre une **banque de règles de complexité ≤ k** : le puzzle est rejeté si une option fausse est expliquée par une règle aussi simple que la bonne. Formulation « Quelle suite de règle simple… ». |
| R2 Répétitivité | Empreinte canonique (symétries, rotations, renommages) + distance minimale entre puzzles d'une même salle ; diversité imposée des « techniques » requises ; variantes introduites régulièrement ; revue humaine d'échantillons. |
| R3 Calibration | Solveur « humain » par techniques ; tests de jeu TestFlight avec formulaire de retour volontaire ; statistiques **locales uniquement**, jamais transmises ; courbe en dents de scie qui tolère les erreurs de calibration. |
| R4 Illustrations | **Système modulaire** : bâtiments composés d'éléments réutilisables (fenêtres, toits, escaliers, lanternes) + palettes par quartier. Rendu **vectoriel natif** (SwiftUI Shapes/Canvas) : l'état éteint/allumé est un paramètre, pas un second asset. Illustrations « héros » uniquement pour les écrans-clés. |
| R5 Différenciation | S'appuyer sur la *combinaison* (§ 6.2) et la qualité (indices intelligents, justesse). Tester les impressions sur la maquette. |
| R6 Nom | Plan B/C prêts (§ 12.3) ; vérifications juridiques avant toute production graphique définitive du logo. |
| R7 Sauvegarde | Écriture atomique + copie de sécurité + migrations testées + fixtures de sauvegardes de chaque version publiée conservées à vie dans les tests. |
| R8 Déterminisme | PRNG maison, interdiction de `Set`/`Dictionary` ordonnés implicitement, tests de reproductibilité, version du générateur incluse dans la seed. |
| R9 Accessibilité | Chaque famille définit sa **représentation VoiceOver** (grille navigable case par case, actions personnalisées « tourner », « placer ») ; les familles non adaptables ont une alternative (ex. Motifs décrits textuellement). Ordre de conception : l'accessibilité est un critère d'admission (§ 8.1). |
| R10 iPad | Composer l'iPad **d'abord pour le paysage**, mais rester **adaptatif** (portrait et fenêtres redimensionnées dégradent proprement). Voir § 19. |
| R11 Localisation | Gabarits par langue + tests automatiques (chaque gabarit rendu dans chaque langue, pas de clé manquante, pas de texte tronqué) + relecture native EN. |
| R12 Scope | Livrer par **tranches verticales** (1 famille complète de bout en bout avant la suivante) ; V1 peut sortir avec 8–10 familles si nécessaire, sans changer l'architecture. |
| R13 Économie | Simulateur d'économie en test unitaire (joueur « prudent », « moyen », « dépensier ») ; économie généreuse en V1. |
| R14 Éthique | Veilleuses automatiques, 1 notification max/jour, ton jamais culpabilisant, tout désactivable. |
| R15 Date | Accepté : le défi est calculé sur la date locale ; aucune vérification réseau. On protège seulement la **série** contre les incohérences (retour dans le passé = pas de double récompense). |

---

## 18. Roadmap

Estimation qualitative ; les durées dépendent des ressources (développeur·se·s, illustrateur·rice, sound designer).

| Phase | Contenu | Livrables | Point de validation |
|---|---|---|---|
| **1. Discovery** ✅ (ce document) | Recherche, concept, différenciation, naming | `PRODUCT_DISCOVERY.md` | **Validation du concept, du nom de travail et des arbitrages § 20** |
| 2. Naming & marque | Approfondissement identité, vérifications juridiques (par vous / un conseil) | Section marque de `DESIGN_SYSTEM.md` | Nom validé |
| 3. Game design | Économie chiffrée, seuils, contenu par salle, succès, défi du jour, chaque famille détaillée (règles, variantes, techniques de solveur, indices) | `GAME_DESIGN.md` | |
| 4. Direction artistique | Charte complète, tokens, composants, états, Nilo (planche d'expressions), icône | `DESIGN_SYSTEM.md` | |
| 5. Maquette | 24 écrans + variantes d'état, prototype HTML navigable iPhone + iPad, DA en tête | `WIREFRAMES.md` + prototype | **Validation visuelle et UX (arrêt demandé § 54)** |
| 6. Validation | Revue critique cohérence / UX / faisabilité ; corrections | Notes de revue | |
| 7. Architecture | Détail technique, contrats, schéma de sauvegarde, stratégie de tests | `TECHNICAL_ARCHITECTURE.md` | |
| 8. Développement | Tranches verticales : ① socle (PuzzleKit, Persistence, GameCore) → ② 1 famille complète + écran puzzle → ③ monde (carte, bâtiment, salle) → ④ familles suivantes → ⑤ Nilo, cosmétiques, carnet → ⑥ défi du jour, notifications | Code + tests | Démo à chaque tranche |
| 9. Contenu | ContentForge, ~1 000 puzzles, Énigmes écrites, placement | Packs validés + rapport | |
| 10. Tests | Unitaires, UI, génération massive (longue durée), visuels, performance | Rapports | |
| 11. Polish | Micro-interactions, typo, spacing, performance, accessibilité | Build candidate | |
| 12. App Store | Métadonnées, captures, politique de confidentialité (rédigée à partir du comportement réel de l'app), étiquette de confidentialité | Dossier de soumission | |

---

## 19. Points où je contredis le brief

Conformément à la règle de non-complaisance :

1. **« Pièces » comme nom de monnaie** → ambigu en français avec « pièce » (salle). **Recommandation : Éclats.**
2. **Une seule monnaie pour tout** → risque d'auto-blocage. **Recommandation : Lumières (progression, non dépensables) + Éclats (dépensables).**
3. **Hiérarchie à 7 niveaux** (Monde → … → Objet → Puzzle) → trop de taps, désorientation. **Recommandation : Carte → Quartier → Bâtiment en coupe (salles visibles) → Salle → Puzzle** ; l'« objet » est un support visuel de la lanterne, pas un écran.
4. **« Suites logiques » en saisie libre** → ambiguïté mathématique inévitable. **Recommandation : QCM avec vérification d'unicité par banque de règles.**
5. **Écran « Puzzle échoué »** → un casse-tête ne s'échoue pas ; un écran d'échec est punitif. **Recommandation : état d'erreur inline**, bienveillant, avec réessai immédiat. (Il sera bien présent dans la maquette, en tant qu'état.)
6. **Écran « Profil local »** → sans compte, un profil est un écran vide de sens. **Recommandation : fusionner dans le Carnet** (statistiques, série, succès) ; Nilo sert d'avatar.
7. **iPad strictement paysage** → les versions récentes d'iPadOS généralisent le fenêtrage redimensionnable ; le mécanisme historique pour forcer le plein écran est en voie de dépréciation *(à revérifier dans la documentation Apple au moment du développement)*. Verrouiller le paysage risque le rejet ou une mauvaise expérience. **Recommandation : conception paysage-first sur iPad, mais mise en page adaptative** qui reste correcte en portrait et en fenêtre. Sur iPhone, le portrait strict reste pertinent.
8. **Mode clair** (implicite dans « Dark Mode » des tests visuels) → la DA est nocturne par essence. **Recommandation : thème sombre unique + variante contraste élevé.** Les tests visuels vérifieront que l'app ignore correctement le réglage clair du système sans casser les composants système.
9. **Puzzles de mémoire** → pression temporelle contraire au ton ; peu accessibles. **Recommandation : exclus de la V1**, éventuellement facultatifs plus tard.
10. **1 000 puzzles tous « sur le chemin »** → campagne interminable et monotone. **Recommandation : ~65–70 % suffisent à progresser, le reste est optionnel** (complétion, objets cachés) ; le volume sert la liberté, pas l'obligation.
11. **Défi du jour « identique pour tous »** → en V1 hors ligne, « identique » ne peut être garanti qu'à **langue + version de générateur égales** ; changer de langue change le puzzle textuel. C'est acceptable et assumé.
12. **Génération procédurale sur l'appareil pour la campagne** (implicite) → risque qualité et déterminisme. **Recommandation : génération au build, contenu figé et relu** ; génération à la volée seulement pour le défi du jour (avec repli).

---

## 20. Décisions à valider

Avant de passer à la suite (`DESIGN_SYSTEM.md`, `GAME_DESIGN.md`, maquette), j'ai besoin de votre accord — ou de vos objections — sur :

1. **Le concept** « Résoudre = éclairer » et l'univers de **Vesper**.
2. **Le nom de travail « Lampion »** (sous réserve des vérifications juridiques que je ne peux pas faire).
3. **La mascotte Nilo** (lampyre à queue-lanterne).
4. **Les 12 familles V1** et les familles écartées.
5. **Lumières + Éclats** (deux ressources) et le renommage de la monnaie.
6. **La DA « Encre & Lueur »**, thème sombre unique.
7. **L'iPad adaptatif paysage-first** plutôt que verrouillé.
8. **La génération au build** (contenu figé) plutôt qu'à la volée pour la campagne.
9. **Le prototype en HTML interactif** (puisque l'environnement actuel ne permet pas de compiler une app iOS).

Une fois ces points validés, j'enchaîne sur les phases 2 à 5 (identité, game design détaillé, charte graphique complète, maquette navigable), puis je m'arrête pour la revue demandée au § 54 du brief.
