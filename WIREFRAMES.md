# WIREFRAMES — Lampion

> Phase 5 (partie écrite). Spécification des 24 écrans demandés, de leurs états et de la navigation.
> La version visuelle et navigable est dans `prototype/index.html` (ouvrir dans un navigateur).

---

## 0. Carte de navigation

```
                    ┌──────────┐
                    │ 1 Splash │
                    └────┬─────┘
          1er lancement  │  lancements suivants
             ┌───────────┴────────────┐
      ┌──────▼───────┐                │
      │ 2 Onboarding │ (3 écrans)     │
      └──────┬───────┘                │
             ▼                        ▼
      9 Puzzle (tuto) ──────────▶ 3 ACCUEIL ◀──────────────────────────────┐
                                  │  │  │  │                                │
          ┌───────────────────────┘  │  │  └────────────┐                   │
          │ Continuer                │  │ Nilo          │ Carnet / Réglages │
          ▼                          │  ▼               ▼                   │
      9 Puzzle ◀── 8 Salle ◀── 7 Bâtiment ◀── 5 Quartier ◀── 4 Carte        │
          │         ▲                                                       │
          │         └──────── Retour à la salle ───────┐                    │
          ├──▶ 12 Indices (feuille / panneau)          │                    │
          ├──▶ 24 Pause (feuille)  ── Quitter ─────────┼───────────────────▶┤
          ├──▶ 11 Erreur (état inline)                 │                    │
          └──▶ 10 Réussite ──▶ 23 Récompense ──▶ [Suivant]→9 / [Salle]→8   │
                                   └──▶ 22 Nouveau quartier ──▶ 4 Carte    │
                                                                            │
  3 Accueil ──▶ 18 Défi du jour ──▶ 9 Puzzle ──▶ 10 ──▶ 23 ─────────────────┘
  3 Accueil ──▶ 15 Nilo ──▶ 16 Personnalisation
  3 Accueil ──▶ 13 Inventaire (Carnet : objets) · 17 Succès · 19 Profil local (Carnet : stats) · 21 Progression
  3 Accueil ──▶ 20 Réglages (── Confidentialité)
  Tout écran porteur d'Éclats ──▶ 14 Éclats (détail du solde, historique)
```

**Profondeur maximale Accueil → Puzzle :** 1 tap (Continuer) ou 4 taps (Carte → Quartier → Bâtiment → Salle → lanterne).

---

## 1. Conventions

- Chaque écran : **But** · **Contenu** (ordre de lecture) · **Action principale** · **iPhone** · **iPad** · **États**.
- « ◉ » = action principale (bouton ambre, un seul par écran).
- Les numéros correspondent à la liste du brief (§ 14).

---

## 2. Écrans

### 1 · Splash

- **But :** installer l'ambiance en 2 s, masquer le chargement.
- **Contenu :** noir total → une petite flamme apparaît au centre, grandit, révèle la silhouette de Nilo → « Lampion » en New York, slogan en dessous.
- **Action :** aucune (tap = passer).
- **iPhone/iPad :** centré, identique.
- **États :** *chargement long* (> 2 s) → la flamme continue de respirer, aucun spinner. *Sauvegarde restaurée depuis backup* → toast discret à l'accueil.

### 2 · Onboarding (3 écrans)

```
┌─────────────────────────┐
│                         │
│   [ville sombre]        │
│                         │
│        (Nilo)           │
│                         │
│  Vesper s'est éteinte.  │
│                         │
│  ● ○ ○                  │
│  [ ◉ Continuer ]        │
│  Passer                 │
└─────────────────────────┘
```
- Écran 1 : « Vesper s'est éteinte. » · Écran 2 : « Chaque énigme rallume une lumière. » (une lanterne s'allume) · Écran 3 : « Nilo t'accompagne. » (Nilo salue) → ◉ **Allumer la première lanterne**.
- **iPad :** illustration pleine largeur, texte en bas à gauche, bouton en bas à droite.
- **États :** *mouvement réduit* : pas de parallaxe, fondus simples.

### 3 · Accueil (Home)

```
┌─────────────────────────┐
│ ✦ 184 Lumières   ◈ 236  │ ← barre discrète
│                         │
│  ┌───────────────────┐  │
│  │  [Vesper, vue du  │  │ ← « fenêtre » sur la ville : parties allumées
│  │   Phare, la nuit] │  │    = progression réelle, tappable → Carte
│  └───────────────────┘  │
│  HORLOGERIE             │
│  Atelier des Ressorts   │
│  Salle 2 · ▰▰▰▰▰▰▱▱▱▱ 6/10│
│  [ ◉ Continuer ]        │
│                         │
│  ┌─ Défi du jour ──────┐│
│  │ Mar. 29 sept · 🔥12 ││ ← glyphe famille, flamme de série
│  └─────────────────────┘│
│  Encore 26 lumières     │
│  pour la Serre de Verre │ ← prochain objectif (un seul)
│            (Nilo)       │
│  [Carte] [Carnet] [⚙]   │
└─────────────────────────┘
```
- **But :** en 3 s, savoir *où j'en suis* et *quoi faire*.
- **Action principale :** ◉ Continuer (lanterne recommandée).
- **iPad paysage :** fenêtre sur Vesper à gauche (60 %), colonne droite : carte « Continuer », défi, objectif, Nilo.
- **États :** *premier retour* (aucun défi débloqué) → le bloc défi montre « Disponible après 6 lanternes » ; *défi fait* → carte défi atténuée avec ✓ et « Demain : Brasier » ; *tout le contenu fini* → Continuer devient « Défi du jour » et l'objectif « Rejouer vos salles préférées ».

### 4 · Carte du monde (Vesper)

- **But :** montrer la ville entière, ce qui est allumé, ce qui attend.
- **Contenu :** illustration de la ville (îlots reliés par des ponts), le Phare en bas ; chaque quartier = silhouette + jauge ; quartiers verrouillés dans le brouillard avec leur seuil ; position de Nilo.
- **Action principale :** tap sur un quartier (le quartier recommandé pulse doucement).
- **iPhone :** carte verticale défilante (Phare en bas → Observatoire en haut : on « monte »).
- **iPad :** ville entière visible + panneau latéral du quartier sélectionné (nom, jauge, bâtiments, ◉ Entrer).
- **États :** *verrouillé* (brouillard + « 206 lumières ») · *déverrouillé non visité* (fenêtres éteintes, contour lumineux) · *en cours* · *complet* (entièrement coloré, étoile).

### 5 · Ville / Quartier

- **But :** choisir un bâtiment.
- **Contenu :** panorama du quartier (couleur du quartier si éclairé), 4 bâtiments en façade, jauge par bâtiment, personnage principal endormi/éveillé, titre + fil d'Ariane.
- **Action principale :** ◉ Entrer dans le bâtiment recommandé (ou tap sur un bâtiment).
- **iPad :** panorama large, fiche du bâtiment sélectionné à droite.
- **États :** bâtiment *verrouillé* (« Allume 20 lanternes à l'Atelier des Ressorts »), *en cours*, *complet* (habitant éveillé).

### 6 · Bâtiment (coupe)

```
┌─────────────────────────┐
│ ‹ Horlogerie            │
│ Atelier des Ressorts    │
│ ▰▰▰▰▰▱▱▱ 21/40          │
│   ┌───────────────┐     │
│   │  ▲ toit       │     │
│   ├───────┬───────┤     │
│   │Salle 4│ Clé 🔒│     │ ← salles = fenêtres éclairées à proportion
│   ├───────┼───────┤     │
│   │Salle 3│Salle 2│     │
│   ├───────┴───────┤     │
│   │   Salle 1 ✓   │     │
│   └───────────────┘     │
│ (habitant endormi)      │
│ [ ◉ Salle 2 — 6/10 ]    │
└─────────────────────────┘
```
- **But :** voir toutes les salles d'un coup (pas d'écran « liste »).
- **iPad :** coupe à gauche, aperçu de la salle sélectionnée à droite (miniature + lanternes).
- **États :** salle *verrouillée* (fenêtre noire + condition), *en cours*, *complète* (objet trouvé visible), *lanterne-clé verrouillée/ouverte*.

### 7 · Chambre / Salle

- **But :** l'endroit où vivent les lanternes.
- **Contenu :** illustration plein écran de la salle ; 10 lanternes posées sur des objets (état visible), numérotées discrètement dans l'ordre recommandé ; objet caché (silhouette) ; jauge 6/10.
- **Action principale :** ◉ lanterne recommandée (pulsation) ; tap sur n'importe quelle lanterne.
- **iPad :** salle au centre, liste des lanternes à droite (famille, palier, état) — utile pour choisir.
- **États :** *salle complète* → couleurs totales + objet trouvé en évidence ; *première visite* → Nilo entre et regarde autour (1 s).

### 8 · Sélection de puzzle (aperçu de lanterne)

- **But :** confirmer sans friction ; informer.
- **Contenu (feuille courte) :** glyphe + nom de famille, palier (flammes + nom), récompense (◈ 12), état (« commencé » / « résolu » + meilleure performance), ◉ **Allumer** (ou **Reprendre** / **Rejouer**).
- **iPhone :** feuille `.medium`. **iPad :** popover ancré sur la lanterne.
- **Option réglage :** « Ouvrir directement les puzzles » (saute cet écran).

### 9 · Puzzle en cours

```
┌─────────────────────────┐
│ ‹ Salle 2   ◈ 236   ⏸   │
│ Lampes · Flamme ▲▲▲     │
│ Éclaire toutes les cases│
│ blanches.            ⓘ  │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │     PLATEAU         │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│ [↶] [↷]      (Nilo) [💡]│ ← zone du pouce
└─────────────────────────┘
```
- **iPad :** consigne + règles à gauche, plateau centré grand, colonne droite : indices déjà obtenus + Nilo.
- **États :** *en cours* · *erreur* (11) · *indice actif* (zone éclairée par la flamme de Nilo) · *repris* (état restauré exactement) · *validation* (familles à réponse : bouton ◉ Valider, désactivé tant que la réponse est incomplète).

### 10 · Puzzle réussi

- Séquence d'allumage (DESIGN_SYSTEM § 14.2), puis carte : « Lanterne allumée », ◈ +12 (+6 Clairvoyance), jauge de salle qui avance (7/10), ◉ **Suivant**, lien « Retour à la salle ».
- Si Interrupteurs : « Résolu en 7 coups — minimum : 5 » (information, pas jugement).
- **iPad :** la carte apparaît dans le panneau droit, le plateau reste visible (le joueur admire sa solution).

### 11 · Puzzle échoué → **état d'erreur inline**

- Pas d'écran dédié (décision validée). Sur validation fausse : secousse, élément fautif entouré (corail + ✕), message précis (« Ce mur veut 2 lampes, il en a 3. ») ou, pour un QCM, « Pas celle-ci. » + option barrée ; Nilo : oreilles en arrière.
- Après 2 erreurs : Nilo propose un Murmure (une fois).
- Aucune perte, aucun compteur d'essais affiché.

### 12 · Système d'indices

```
┌─────────────────────────┐
│ ── Indices ──────────── │
│ ✓ Murmure       Gratuit │ « Regarde le mur en haut à droite. »
│ ◯ Piste           ◈ 5   │
│ ◯ Éclairage      ◈ 10   │
│ ◯ Solution       ◈ 20   │
│ Solde : ◈ 236           │
└─────────────────────────┘
```
- Niveaux débloqués dans l'ordre ; un niveau obtenu reste lisible.
- **iPad :** panneau latéral permanent (pas de feuille).
- **États :** *solde insuffisant* (niveau grisé « il te manque ◈ 3 », Murmure rappelé) · *Murmure en recharge* (compte à rebours 20 s) · *aucune nouvelle déduction* (puzzle presque fini : « Tu as tout ce qu'il faut. »).

### 13 · Inventaire (Carnet › Objets trouvés)

- Grille d'objets (silhouette si non trouvé + lieu où chercher), lettres de l'Allumeur, portraits.
- **État vide :** Nilo endormi sur une étagère vide, « Pas encore d'objet trouvé. Éclaire une salle entière. »

### 14 · Éclats (monnaie)

- Détail du solde : total, gagnés, dépensés ; derniers mouvements (« Lanterne — Atelier des Ressorts +12 ») ; explication en 2 lignes (« Les Éclats se gagnent en jouant. Ils servent aux indices et aux cosmétiques. »).
- Pas de bouton d'achat en V1.

### 15 · Mascotte (Nilo)

- Nilo en grand, animé, humeur « curieux » ; tap = petite réaction ; accès à Personnalisation ; phrase de contexte (« Nilo a allumé 184 lanternes avec toi. »).

### 16 · Personnalisation

- Nilo en aperçu permanent (haut) ; onglets : Flamme · Chapeau · Écharpe · Lanterne · Compagnon · Phare ; grille d'éléments : *possédé* / *à gagner* (condition affichée : « Réveille l'Horlogère ») / *boutique* (◈ 120).
- ◉ Porter / Acheter (selon l'élément sélectionné).
- **iPad :** Nilo à gauche en grand, catalogue à droite.

### 17 · Succès (Carnet › Succès)

- Liste par catégorie ; progression (« 18 / 25 ») ; succès secrets affichés « ? » avec un indice poétique.

### 18 · Défi du jour

- Calendrier du mois (jours faits = flamme, veilleuses = petite lune) ; défi du jour : famille, palier, récompense ; série actuelle + record ; ◉ **Jouer le défi** ; rattrapage des 7 derniers jours.
- **États :** *fait* (« Revenez demain — Brasier »), *série sauvée par une veilleuse* (toast), *indisponible* (avant 6 lanternes).

### 19 · Profil local → **Carnet › Statistiques**

- Pas de profil séparé (décision validée). Statistiques locales : lanternes allumées par famille, paliers, Clairvoyance, temps moyen par palier, série record ; mention « Ces statistiques restent sur ton appareil. »

### 20 · Paramètres

- Son : Musique · Effets · Vibrations. Jeu : Ouvrir directement les puzzles · Valider automatiquement (familles d'état). Notifications : Rappel du soir (heure). Accessibilité : Réduire les animations (suit le système par défaut) · Contraste élevé · Taille des grilles. Langue (renvoie aux réglages iOS). Confidentialité : texte clair. Sauvegarde : exporter (fichier), importer, réinitialiser (confirmation). À propos, crédits.

### 21 · Écran de progression (Carnet › Vesper)

- Vue synthétique : 7 quartiers × jauges, total 184 / 1 000, répartition par palier, prochains seuils. Accessible aussi en tapant sur le compteur de lumières.

### 22 · Nouveau quartier débloqué

- Séquence plein écran (2,4 s, interruptible) : la carte glisse vers le quartier, le brouillard se retire, les fenêtres s'allument, titre « L'Horlogerie », sous-titre poétique, personnage principal en silhouette ; ◉ **Entrer**, lien « Plus tard ».

### 23 · Récompense

- Utilisé pour : salle complète (objet trouvé), bâtiment complet (habitant réveillé + cosmétique), succès, jalon de série.
- Contenu : illustration de la récompense, titre New York, 1 phrase, gains ; ◉ **Continuer** (ou **Porter** pour un cosmétique).
- File : plusieurs récompenses = plusieurs cartes successives, jamais empilées.

### 24 · Pause

- Feuille : Reprendre ◉ · Règles de la famille · Recommencer le puzzle · Son/Musique (bascules rapides) · Retour à la salle. Le plateau est flouté derrière (évite de réfléchir « en pause »… et c'est joli).

---

## 3. Matrice des états transverses

| État | Où | Traitement |
|---|---|---|
| **Normal** | partout | — |
| **Verrouillé** | quartier, bâtiment, salle, lanterne-clé, cosmétique | Désaturé + cadenas-lanterne + condition chiffrée |
| **Déverrouillé** | idem | Animation de déblocage une fois, puis état normal avec contour lumineux « nouveau » jusqu'à la première visite |
| **Erreur** | puzzle, sauvegarde | Puzzle : inline. Sauvegarde : toast « Ta progression a été restaurée depuis la dernière copie. » |
| **Succès** | puzzle, salle, bâtiment | Séquences dédiées |
| **Chargement** | splash, défi du jour (génération) | Flamme de Nilo qui respire, jamais de spinner |
| **Absence de contenu** | carnet vide, succès vides, historique du défi vide | Nilo endormi + phrase + action |

---

## 4. Checklist de validation UX (appliquée à la maquette)

- [x] Accueil : action principale unique et évidente.
- [x] ≤ 4 taps de l'accueil à n'importe quel puzzle ; 1 tap vers le puzzle recommandé.
- [x] Toujours un titre / fil d'Ariane.
- [x] Aucun écran d'échec punitif.
- [x] Aucun compte, aucune permission au premier lancement.
- [x] Un seul objectif affiché à la fois.
- [x] iPad : compositions en colonnes, pas d'iPhone étiré.
- [ ] À vérifier sur appareil : lisibilité des grilles 8×8 sur iPhone SE, AX5 sur l'écran puzzle.
