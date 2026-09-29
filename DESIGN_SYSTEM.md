# DESIGN SYSTEM — Lampion · « Encre & Lueur »

> Phase 2 + 4 : identité de marque, direction artistique, charte graphique, design tokens.
> Source de vérité pour la maquette (`prototype/index.html`) et, plus tard, pour le module Swift `DesignSystem`.
> Statut : v0.1, avant tests de lisibilité sur appareil réel.

---

## Sommaire

1. [Identité de marque](#1-identité-de-marque)
2. [Concept de la direction artistique](#2-concept-de-la-direction-artistique)
3. [Couleurs](#3-couleurs)
4. [Typographie](#4-typographie)
5. [Espacement, grille, dimensions](#5-espacement-grille-dimensions)
6. [Formes, bordures, profondeur](#6-formes-bordures-profondeur)
7. [Textures et fonds](#7-textures-et-fonds)
8. [Iconographie](#8-iconographie)
9. [Illustration](#9-illustration)
10. [Composants](#10-composants)
11. [États](#11-états)
12. [Style des puzzles](#12-style-des-puzzles)
13. [Mascotte — Nilo](#13-mascotte--nilo)
14. [Animation et transitions](#14-animation-et-transitions)
15. [Son et haptique](#15-son-et-haptique)
16. [Icône de l'application](#16-icône-de-lapplication)
17. [Règles d'interface (checklist)](#17-règles-dinterface-checklist)
18. [Tokens — nomenclature Swift](#18-tokens--nomenclature-swift)

---

## 1. Identité de marque

| Élément | Définition |
|---|---|
| **Nom** | Lampion |
| **Slogan** | FR *Chaque énigme rallume une lumière.* · EN *Every puzzle brings back a light.* |
| **Tagline (sous-titre App Store, provisoire)** | FR *Casse-têtes à la lueur des lanternes* · EN *Puzzles by lantern light* |
| **Promesse** | Des puzzles justes, un monde qui s'allume grâce à vous, un espace calme et respectueux. |
| **Archétype** | Le *Sage bienveillant* teinté d'*Explorateur* : cultivé, curieux, jamais condescendant. |
| **Personnalité (5 mots)** | Mystérieux · Chaleureux · Malicieux · Calme · Précis |
| **Ce que Lampion n'est pas** | Bruyant, pressé, infantilisant, compétitif, culpabilisant. |

### 1.1 Ton rédactionnel

| Règle | ✅ Oui | ❌ Non |
|---|---|---|
| Phrases courtes, une idée par phrase | « Allume toutes les cases. » | « Ton objectif dans ce niveau sera d'essayer d'allumer l'ensemble des cases de la grille. » |
| Tutoiement (FR), *you* direct (EN) | « Tu y es presque. » | « Vous y êtes presque. » |
| Le vocabulaire du lieu | « Nouvelle salle éclairée » | « Niveau 12 terminé » |
| L'erreur est une information | « Ce mur veut 2 lampes, il en a 3. » | « Faux ! » / « Échec » |
| Pas d'emphase artificielle | « Bien vu. » | « INCROYABLE !!! 🎉🎉 » |
| L'humour vient des personnages | L'Horlogère : « Je suis en retard… depuis quarante ans. » | Blagues de l'interface |
| Pas de flatterie intellectuelle | « Joli raisonnement. » | « Tu es un génie ! » |

### 1.2 Lexique maison

| Concept | FR | EN |
|---|---|---|
| Puzzle (dans le monde) | Lanterne | Lantern |
| Puzzle (générique, réglages) | Énigme | Puzzle |
| Progression | Lumières | Lights |
| Monnaie | Éclats | Shards |
| Indice niveau 1 → 4 | Murmure · Piste · Éclairage · Solution | Whisper · Lead · Insight · Solution |
| Jour de grâce de série | Veilleuse | Nightlight |
| Série | Flamme du soir | Evening flame |
| Succès + collection + stats | Carnet | Notebook |
| Objets de collection | Objets trouvés | Lost & found |
| Puzzle de fin de bâtiment | Lanterne-clé | Keystone |
| Paliers | Étincelle · Lueur · Flamme · Brasier · Fanal · Astre | Spark · Glow · Flame · Blaze · Beacon · Star |
| Famille « Akari » | Lampes | Lamps |

---

## 2. Concept de la direction artistique

**Nom :** **Encre & Lueur** (*Ink & Glow*).

**Idée :** Vesper est dessinée à l'encre bleu nuit. La seule chaleur visible est celle que le joueur rallume. Tout élément « éteint » est froid, désaturé, plat. Tout élément « allumé » devient chaud, lumineux, et **émet** (halo) plutôt que de projeter une ombre.

**Trois règles fondatrices :**

1. **La lumière est une récompense, pas une décoration.** L'ambre n'est jamais utilisé gratuitement : il signale ce qui est allumé, ce qui est actionnable en priorité, ou ce qui vient d'être gagné.
2. **Le noir est un matériau.** Grandes surfaces sombres, beaucoup d'air, peu d'éléments par écran. Le vide est voulu.
3. **Géométrie douce.** Formes simples, courbes continues, aucun angle agressif. Architecture stylisée (arches, coupoles, toits pointus), jamais réaliste.

**Mots-clés visuels :** papier découpé, théâtre d'ombres, vitrail sombre, lanterne en papier, carte ancienne, nuit bleue.

---

## 3. Couleurs

### 3.1 Palette de base

| Token | Nom | Hex | Rôle |
|---|---|---|---|
| `color.bg.base` | Encre de nuit | `#0D0F1E` | Fond principal de toutes les vues |
| `color.bg.deep` | Abysse | `#080914` | Vignettage, fonds de carte, zones non découvertes |
| `color.surface.1` | Ardoise | `#171A2E` | Cartes, panneaux, plateau de puzzle |
| `color.surface.2` | Brume haute | `#22264A` | Feuilles modales, éléments survolés/pressés |
| `color.line` | Trait | `#2E3360` | Bordures fines, séparateurs, grilles de puzzle |
| `color.text.primary` | Parchemin | `#EFE8D8` | Titres, texte courant |
| `color.text.secondary` | Brume | `#9CA2C6` | Légendes, métadonnées |
| `color.text.tertiary` | Brume sourde | `#7A80A8` | Uniquement sur `bg.base` / `surface.1`, texte non essentiel |
| `color.accent.light` | **Ambre** | `#F4B45E` | Lumière, action principale, progression |
| `color.accent.lightPressed` | Ambre profond | `#D9953F` | État pressé de l'action principale |
| `color.accent.cool` | Clair de lune | `#8FD3E0` | Sélection, focus, curseur de puzzle |
| `color.state.success` | Or pâle | `#FFD98E` | Réussite (toujours + icône/halo) |
| `color.state.error` | Corail fané | `#E88A8A` | Erreur (toujours + forme/mouvement) |
| `color.state.locked` | — | `#171A2E` @ 60 % + icône | Verrouillé |

### 3.2 Contrastes mesurés (WCAG 2.x)

Calculés sur les valeurs ci-dessus :

| Texte ↓ / Fond → | `bg.base` | `surface.1` | `surface.2` |
|---|---|---|---|
| Parchemin | **15.6** | **14.1** | **11.9** |
| Brume | 7.6 | 6.9 | 5.8 |
| Brume sourde | 5.0 | 4.5 | ⚠️ 3.8 (interdit) |
| Ambre | 10.4 | 9.4 | 8.0 |
| Clair de lune | 11.4 | 10.3 | 8.7 |
| Or pâle | 14.1 | 12.7 | 10.8 |
| Corail | 7.6 | 6.9 | 5.8 |
| Encre sur Ambre (bouton principal) | **10.4** | | |

→ Tout le texte essentiel dépasse AA (4.5:1) ; le texte courant dépasse AAA (7:1) sur les fonds principaux. **Brume sourde est interdite sur `surface.2`.**

### 3.3 Couleurs de quartier (« la couleur rendue »)

Chaque quartier éteint est bleu-gris. Une fois éclairé, il retrouve **sa** couleur. Toutes mesurées ≥ 5.9:1 sur `surface.2`.

| Quartier | Token | Hex | Nom |
|---|---|---|---|
| Le Phare | `color.district.lighthouse` | `#F4B45E` | Ambre |
| Bibliothèque Murmurante | `color.district.library` | `#E7A98B` | Sépia rose |
| Horlogerie | `color.district.clockworks` | `#D8B56A` | Laiton |
| Serre de Verre | `color.district.glasshouse` | `#7FC8A9` | Vert-de-gris |
| Marché Flottant | `color.district.market` | `#EE8A6B` | Vermillon doux |
| Théâtre d'Ombres | `color.district.theatre` | `#C39BD3` | Prune |
| Observatoire | `color.district.observatory` | `#8FB8F0` | Glacier |

Règle : la couleur de quartier est utilisée **pour le décor et les halos** ; l'action principale reste toujours ambre (cohérence d'apprentissage).

### 3.4 Variante « Contraste élevé »

Activée automatiquement si *Augmenter le contraste* est actif dans iOS, ou manuellement :
- `text.secondary` → `#C9CDE6`, `line` → `#5A6199`, bordures 1 pt → 2 pt ;
- halos remplacés par des contours pleins 2 pt ;
- textures désactivées.

### 3.5 Couleur et daltonisme

**Jamais d'information portée par la couleur seule.** Doublage systématique :
- succès = or + ✓ + halo ; erreur = corail + ✕ + secousse ;
- familles à couleurs (Engrenages bicolores, Miroirs à filtres) : chaque couleur a un **motif** (plein / rayé / pointillé) et un **symbole** ;
- cadenas « bien placé / mal placé » : pastille pleine vs pastille creuse, pas vert/orange.

### 3.6 Mode clair

Pas de mode clair : l'identité est nocturne (décision validée). L'app force `preferredColorScheme(.dark)`. Les tests visuels vérifient que les composants système (feuilles, alertes, clavier) restent cohérents quand le système est en mode clair.

---

## 4. Typographie

Polices **système Apple uniquement** (licence incluse, Dynamic Type natif, poids d'app nul).

| Famille | Usage |
|---|---|
| **New York** (serif) | Titres, noms de lieux, répliques des personnages, grands chiffres de célébration |
| **SF Pro** | Interface, consignes, boutons, corps |
| **SF Pro Rounded** | Chiffres dans les puzzles (Cadenas, Balances, murs de Lampes), badges |
| **SF Mono** | Uniquement les codes de Cadenas en grand format (chiffres à chasse fixe) |

### 4.1 Échelle (taille par défaut « Large »)

Chaque style est lié à un **style Dynamic Type** : il grandit avec le réglage de l'utilisateur.

| Token | Police | Taille / interligne | Graisse | Dynamic Type | Usage |
|---|---|---|---|---|---|
| `type.display` | New York | 40 / 46 | Semibold | `.largeTitle` (×1.18) | Splash, nouveau quartier |
| `type.title1` | New York | 28 / 34 | Semibold | `.title` | Titres d'écran, nom de salle |
| `type.title2` | New York | 22 / 28 | Medium | `.title2` | Titres de section, noms de bâtiment |
| `type.title3` | SF Pro | 20 / 25 | Semibold | `.title3` | Titres de carte |
| `type.headline` | SF Pro | 17 / 22 | Semibold | `.headline` | Boutons, étiquettes importantes |
| `type.body` | SF Pro | 17 / 24 | Regular | `.body` | Consignes, texte courant |
| `type.callout` | SF Pro | 16 / 21 | Regular | `.callout` | Indices |
| `type.subhead` | SF Pro | 15 / 20 | Regular | `.subheadline` | Métadonnées |
| `type.footnote` | SF Pro | 13 / 18 | Regular | `.footnote` | Légendes |
| `type.caption` | SF Pro | 12 / 16 | Medium, +2 % tracking, petites capitales | `.caption` | Sur-titres (« QUARTIER »), badges |
| `type.dialogue` | New York | 17 / 25 | Regular Italic | `.body` | Répliques des personnages |
| `type.puzzleNumeral` | SF Pro Rounded | 22 / 22 | Bold | `.title2` | Chiffres dans les cases |

### 4.2 Règles

- Longueur de ligne max : ~60 caractères (consignes).
- Aux tailles d'accessibilité (AX1–AX5), les mises en page horizontales **basculent en vertical** (`ViewThatFits` / `dynamicTypeSize` ≥ `.accessibility1`).
- Le texte ne doit **jamais** être tronqué sur les consignes, indices et répliques. Troncature autorisée uniquement sur des noms dans des vignettes, avec texte complet en VoiceOver.
- Chiffres tabulaires (`monospacedDigit()`) dans les compteurs (Éclats, lumières) pour éviter le tremblement lors des animations.

---

## 5. Espacement, grille, dimensions

### 5.1 Échelle d'espacement (base 4 pt)

| Token | Valeur | Usage |
|---|---|---|
| `space.xxs` | 2 | Icône ↔ badge |
| `space.xs` | 4 | Éléments très liés |
| `space.s` | 8 | Icône ↔ libellé, lignes de liste serrées |
| `space.m` | 12 | Padding interne des chips |
| `space.l` | 16 | **Marge latérale iPhone**, padding de carte |
| `space.xl` | 24 | Entre blocs d'un même écran |
| `space.xxl` | 32 | Entre sections, **marge latérale iPad** |
| `space.xxxl` | 48 | Respiration des écrans de célébration |

### 5.2 Grilles de mise en page

| Appareil | Colonnes | Marge | Gouttière | Largeur de lecture max |
|---|---|---|---|---|
| iPhone portrait | 4 | 16 pt (20 pt sur Pro Max) | 12 pt | pleine largeur |
| iPad paysage | 12 | 32 pt | 24 pt | 640 pt pour le texte |
| iPad portrait / fenêtre étroite | 8 | 24 pt | 16 pt | 560 pt |

Classes de taille : la mise en page choisit sa composition sur la **largeur disponible**, pas sur le modèle d'appareil (compatibilité fenêtres iPadOS).

### 5.3 Cibles tactiles

- Minimum absolu : **44 × 44 pt** (règle Apple).
- Cases de puzzle : **≥ 44 pt** sur iPhone ; si une grille ne tient pas (ex. 10×10 sur iPhone SE), le plateau devient zoomable/déplaçable et le palier est limité (les grilles > 8×8 sont réservées à l'iPad ou au zoom).
- Espacement entre cibles adjacentes non liées : ≥ 8 pt.

### 5.4 Zones sûres

- Aucune action principale dans les 20 pt supérieurs (encoche / Dynamic Island) ni dans l'indicateur d'accueil.
- iPhone : action principale **dans le tiers inférieur** (zone du pouce).

---

## 6. Formes, bordures, profondeur

### 6.1 Rayons (coins continus « squircle »)

| Token | Valeur | Usage |
|---|---|---|
| `radius.xs` | 6 | Cases de grille, pastilles |
| `radius.s` | 10 | Chips, petits boutons |
| `radius.m` | 16 | Boutons, champs |
| `radius.l` | 24 | Cartes |
| `radius.xl` | 32 | Feuilles modales, panneaux iPad |
| `radius.full` | 999 | Boutons ronds, jauges |

### 6.2 Bordures

- `stroke.hairline` 1 pt `color.line` — séparation de surfaces.
- `stroke.focus` 2 pt `accent.cool` — focus clavier / sélection dans un puzzle.
- `stroke.lit` 1.5 pt `accent.light` @ 70 % — élément allumé.

### 6.3 Profondeur : la lumière remplace l'ombre

| Token | Définition | Usage |
|---|---|---|
| `elevation.flat` | aucune | Éléments éteints, désactivés |
| `elevation.raised` | surface + 1 pt hairline + ombre noire 0/8/24 @ 40 % | Cartes, feuilles |
| `glow.soft` | halo ambre, rayon 16, opacité 35 % | Élément actionnable principal |
| `glow.strong` | halo ambre, rayon 32, opacité 60 % + noyau clair | Lanterne tout juste allumée |
| `glow.district` | halo couleur de quartier, rayon 24, 40 % | Décor éclairé |

Pas d'ombres portées colorées ; pas de *glassmorphism* lourd (coûteux et peu lisible sur fond sombre). Le flou (`.ultraThinMaterial`) est réservé à la barre de pause et aux feuilles.

---

## 7. Textures et fonds

- **Grain papier** : bruit monochrome ≤ 3 % d'opacité, statique (image tuilée 256 px), désactivé en contraste élevé.
- **Dégradé de nuit** : `bg.deep` en haut → `bg.base` en bas, très subtil (évite l'effet « aplat numérique »).
- **Étoiles** : sur la carte et l'accueil uniquement ; 30–60 points, scintillement très lent (période 4–8 s), **arrêté** si *Réduire les animations* ou mode économie d'énergie.
- **Vignettage** : léger assombrissement des bords sur la carte, pour focaliser.

---

## 8. Iconographie

- Base : **SF Symbols** (poids *Regular*, rendu *hierarchical*) pour l'interface standard (réglages, fermer, partager, son…).
- Icônes maison (*Lanterne*, *Éclat*, *Lumière*, *Veilleuse*, *Murmure*, familles de puzzles) : **trait 1.5 pt, extrémités arrondies**, grille 24 pt, zone utile 20 pt, construites à partir de formes simples, exportées en SF Symbol personnalisé (support des graisses et de Dynamic Type).
- Chaque famille de puzzle a un **glyphe** (utilisé sur les lanternes du décor et dans le carnet) :

| Famille | Glyphe |
|---|---|
| Suites | trois points croissants → |
| Lampes | petite lampe dans une case |
| Cadenas | cadenas rond à molettes |
| Engrenages | roue dentée à 6 dents |
| Marqueterie | deux polyominos imbriqués |
| Menteurs | deux masques (vrai/faux) |
| Enquêtes | loupe sur grille |
| Balances | balance à plateaux |
| Motifs | grille 3×3 avec case vide |
| Fil | ligne sinueuse continue |
| Interrupteurs | bouton rond à rayons |
| Miroirs | rayon brisé par un miroir |
| Énigmes | point d'interrogation calligraphié |

- Les emoji ne sont **pas** utilisés dans l'interface (ni dans les notifications — contrairement au brief, voir GAME_DESIGN § 13).

---

## 9. Illustration

- **Style** : vectoriel plat, formes géométriques simples, **deux valeurs par forme** (face + ombre), pas de dégradés complexes, pas de contours noirs.
- **Perspective** : frontale, légèrement surélevée (dioramas en coupe) ; pas d'isométrie stricte (plus simple à produire, plus lisible sur petit écran).
- **Éteint / allumé** : même dessin, deux palettes. Éteint = bleus `#1B1F3A → #2A2F57`. Allumé = teinte du quartier + fenêtres chaudes + halos. Le passage est une **interpolation**, pas un changement d'image.
- **Construction modulaire** : bâtiments assemblés à partir d'une bibliothèque de modules (murs, fenêtres, toits, arches, escaliers, lanternes, mobilier) → coût de production maîtrisé, rendu SwiftUI natif possible.
- **Personnages** : mêmes règles que Nilo (formes simples, yeux lumineux, pas de bouche au repos).
- **Interdits** : réalisme, textures photo, dégradés arc-en-ciel, contours épais « cartoon », surcharge de détails.

---

## 10. Composants

### 10.1 Boutons

| Composant | Apparence | Usage | Hauteur |
|---|---|---|---|
| **LanternButton** (principal) | Fond ambre, texte encre `type.headline`, `radius.m`, `glow.soft` ; petite flamme à gauche optionnelle | 1 seul par écran : Continuer, Suivant, Valider | 56 pt |
| **SecondaryButton** | Fond `surface.2`, texte parchemin, hairline | Actions secondaires : Retour à la salle, Réessayer | 48 pt |
| **GhostButton** | Texte ambre, sans fond | Actions tertiaires : Passer, Plus tard | 44 pt |
| **IconButton** | Cercle 44 pt, `surface.1`, SF Symbol parchemin | Pause, indice, fermer | 44 pt |
| **HintButton** | IconButton + petite oreille de Nilo ; pastille de niveau d'indice disponible | Écran puzzle | 44 pt |

États : normal · pressé (échelle 0.97 + couleur `pressed`, 80 ms) · désactivé (opacité 40 %, pas de halo, non focalisable si non pertinent) · chargement (flamme qui pulse à la place du libellé, libellé conservé pour VoiceOver).

### 10.2 Cartes

| Composant | Contenu | Détails |
|---|---|---|
| **ContinueCard** | Vignette de la salle, nom, jauge salle, LanternButton « Continuer » | Accueil, toujours en haut |
| **DailyCard** | Date, glyphe de la famille du jour, flamme de série, état (à faire / fait) | Accueil |
| **DistrictCard** | Illustration, nom, jauge, seuil (« 40 lumières ») ou état verrouillé | Carte (iPad : panneau latéral) |
| **RoomTile** | Fenêtre de la salle dans la coupe du bâtiment, compteur « 7/10 », objet trouvé | Bâtiment |
| **CollectibleCard** | Objet (silhouette si non trouvé), nom, lieu | Carnet |
| **AchievementRow** | Glyphe, titre, description, progression | Carnet |

### 10.3 Éléments de monde

| Composant | Description |
|---|---|
| **LanternNode** | Lanterne posée sur un objet de la salle. États : éteinte · recommandée (légère pulsation) · en cours (braise) · allumée · lanterne-clé (plus grande, cadre ouvragé) · verrouillée (rare, lanterne-clé seulement) |
| **ProgressGauge** | Jauge en forme de mèche qui se consume *à l'envers* (se remplit de lumière). Libellé chiffré toujours présent. |
| **ThresholdMarker** | « Encore 4 lumières » + icône du lieu à débloquer |
| **Breadcrumb** | Vesper › Horlogerie › Atelier des Ressorts — tappable, `type.caption` |
| **CurrencyPill** | Icône Éclat + nombre, tabulaire ; anime les gains par comptage (300 ms) |
| **Nilo** | Composant vectoriel paramétré (humeur, cosmétiques, taille) |
| **DialogueBubble** | Bulle `surface.2`, `type.dialogue`, portrait du personnage, tap pour avancer |

### 10.4 Conteneurs

- **Sheet** (iPhone) : `radius.xl` en haut, poignée, détents `.medium`/`.large`. Utilisée pour : indices, pause, détail d'objet.
- **SidePanel** (iPad) : panneau fixe 320–380 pt ; remplace les sheets quand la largeur le permet.
- **Toast** : bandeau court en haut (2 s), jamais bloquant ; ex. « Veilleuse utilisée — ta série continue ».
- **Aucune alerte modale** sauf confirmation destructive (réinitialiser la progression).

---

## 11. États

Matrice appliquée à tous les composants concernés :

| État | Traitement visuel | Traitement non visuel |
|---|---|---|
| **Normal** | Selon composant | — |
| **Pressé** | Échelle 0.97, couleur `pressed` | Haptique `selection` (boutons de puzzle uniquement) |
| **Désactivé** | 40 % d'opacité, pas de halo | VoiceOver : « indisponible » + raison si utile |
| **Verrouillé** | Désaturé, silhouette, icône cadenas-lanterne, condition affichée (« 40 lumières ») | VoiceOver lit la condition |
| **Déverrouillé (moment)** | Le cadenas fond en lumière, halo `glow.strong`, 900 ms | Haptique `success` léger + son *unlock* |
| **Recommandé** | Pulsation lente (2.4 s) du halo | VoiceOver : « recommandé » |
| **Erreur** | Corail + ✕ + secousse horizontale 3× 6 pt (240 ms) ; élément fautif entouré | Haptique `error` (une fois) ; message explicite |
| **Succès** | Or + ✓ + `glow.strong` | Haptique `success` + son |
| **Chargement** | Flamme de Nilo qui pulse ; **jamais** de spinner système sur fond plein | VoiceOver : « chargement » |
| **Vide** | Illustration de Nilo endormi + phrase + action (« Pas encore d'objet trouvé. Explore une salle. ») | — |
| **Focus (accessibilité)** | `stroke.focus` Clair de lune | Géré par VoiceOver / clavier |

---

## 12. Style des puzzles

- Le plateau est une **surface `surface.1`** posée au centre, `radius.l`, avec grille `line`.
- **Éléments éteints** : bleu-gris ; **éléments allumés / corrects** : ambre ; **sélection** : clair de lune ; **erreur** : corail.
- Les puzzles d'éclairage (Lampes, Engrenages, Miroirs, Interrupteurs) utilisent **réellement** la lumière : les cases éclairées reçoivent un léger halo ambre qui se propage (animation 120 ms par case).
- Consigne : 1 phrase, `type.body`, au-dessus (iPhone) ou à gauche (iPad) du plateau, toujours visible. Une icône ⓘ ouvre la règle complète avec animation de démonstration.
- **Aucun chronomètre visible** par défaut. Un temps est mesuré localement (statistiques du Carnet), jamais affiché pendant la résolution.
- Validation :
  - Familles « état final » (Interrupteurs, Engrenages, Fil, Marqueterie, Lampes, Miroirs) : **validation automatique** dès que l'état est correct (pas de bouton).
  - Familles « réponse » (Suites, Motifs, Cadenas, Balances, Menteurs, Enquêtes, Énigmes) : bouton **Valider** explicite.
- Annuler / Rétablir : présents sur toutes les familles à manipulation. Réinitialiser : dans le menu pause.

---

## 13. Mascotte — Nilo

### 13.1 Construction

| Élément | Forme | Couleur |
|---|---|---|
| Corps | Goutte / galet, plus large en bas, légèrement asymétrique | Encre `#1E2347` avec reflet `#2C3266` sur le haut |
| Ventre | Ovale plus clair (optionnel, petites tailles : supprimé) | `#2C3266` |
| Oreilles | 2 triangles arrondis, légèrement écartés | Corps ; intérieur `#3A4180` |
| Yeux | 2 ellipses verticales, sans pupille, **lumineuses** | `#FFE6B0` + halo |
| Queue | Courbe fine en S, partant du bas-arrière | Corps |
| Flamme | Sphère/lanterne au bout de la queue, noyau clair | Ambre `#F4B45E` → noyau `#FFF3D6` |
| Pattes | 2 petits ovales, visibles seulement en mouvement | Corps |

Proportions : hauteur totale = 1 ; corps 0.62 ; oreilles 0.18 ; la flamme a un diamètre de 0.16 et culmine au niveau des oreilles.

**Test de silhouette** : reconnaissable en noir plein à 32 px et à 16 px (goutte + 2 pointes + boule).

### 13.2 Expressions

Définies dans PRODUCT_DISCOVERY § 11.3. Paramètres d'animation :

| Paramètre | Plage | Porte |
|---|---|---|
| `earAngle` | -30° (tombantes) → +15° (dressées) | Humeur générale |
| `eyeShape` | ouverts · plissés · arcs (joie) · fermés · grands | Émotion |
| `flameScale` | 0.6 (braise) → 1.6 (joie) | Énergie |
| `flameFlicker` | période 0.4 s (vacille) → 3 s (calme) | Stress / calme |
| `flameHue` | teinte de base ± 20° | Cosmétique / émerveillement |
| `bodySquash` | 0.9 → 1.1 | Rebonds (joie, atterrissage) |

### 13.3 Règles

- Nilo **ne parle pas** par bulles de texte longues. Il réagit. Les textes viennent de l'interface ou des personnages. (Exception : l'onboarding, 1 phrase par écran.)
- Nilo n'est **jamais** triste à cause du joueur (pas de culpabilisation).
- Nilo n'occupe jamais plus de ~15 % de l'écran pendant un puzzle (iPhone : coin inférieur ; iPad : panneau latéral).
- Les cosmétiques respectent la zone protégée : yeux, oreilles, flamme (voir PRODUCT_DISCOVERY § 11.4).

---

## 14. Animation et transitions

### 14.1 Tokens de mouvement

| Token | Valeur | Usage |
|---|---|---|
| `motion.instant` | 80 ms, easeOut | Pressé |
| `motion.quick` | 160 ms, easeOut | Sélection, bascule |
| `motion.standard` | 280 ms, spring(response 0.35, damping 0.85) | Apparition d'éléments, feuilles |
| `motion.emphasis` | 450 ms, spring(0.5, 0.75) | Changement d'écran spatial (entrer dans un lieu) |
| `motion.celebrate` | 1 200 ms, séquence | Lanterne allumée |
| `motion.reveal` | 2 400 ms, séquence | Nouveau quartier (interruptible) |
| `motion.ambient` | 3–8 s, easeInOut, boucle | Scintillement (coupé si réduit) |

### 14.2 Animations signature

| Animation | Séquence | Version « mouvement réduit » |
|---|---|---|
| **Allumage** (réussite) | 0 ms : l'élément final du puzzle devient or → 150 ms : onde de lumière qui traverse le plateau → 400 ms : la lanterne du décor s'allume (échelle 0.6→1.1→1, halo fort) → 600 ms : Nilo saute, flamme ×1.6 → 900 ms : compteurs Éclats/Lumières s'incrémentent → 1 200 ms : bouton Suivant apparaît | Fondu enchaîné 250 ms vers l'état allumé, compteurs mis à jour sans comptage |
| **Erreur** | Secousse 3× 6 pt (240 ms) + contour corail sur l'élément fautif + oreilles de Nilo en arrière (300 ms) | Contour corail + ✕ sans secousse |
| **Entrer dans un lieu** | Zoom vers la fenêtre / porte tapée (`matchedGeometryEffect`) 450 ms, l'arrière-plan s'assombrit | Fondu 200 ms |
| **Déblocage** | Cadenas-lanterne fond en particules de lumière (700 ms), puis halo | Fondu + icône ✓ |
| **Nouveau quartier** | La caméra glisse sur la carte vers le quartier, le brouillard se retire, les fenêtres s'allument en cascade (2.4 s), titre en New York | Image fixe du quartier + titre |
| **Indice** | La flamme de Nilo se détache, glisse vers la zone concernée et l'éclaire (500 ms) | Surbrillance directe |
| **Récompense cosmétique** | Nilo essaie l'objet (rebond) | Aperçu statique |

### 14.3 Règles

1. Toute animation de plus de 600 ms est **interruptible** au tap.
2. Jamais deux célébrations simultanées : elles sont **mises en file** (lanterne → salle complète → bâtiment complet).
3. Pas d'animation en boucle hors écran ; les animations ambiantes s'arrêtent en arrière-plan, en mode économie d'énergie et avec *Réduire les animations*.
4. 60 fps minimum (120 fps ProMotion quand disponible) ; toute animation doit tenir sur un iPhone de la gamme la plus ancienne supportée.

---

## 15. Son et haptique

### 15.1 Palette sonore (intention)

- **Instrumentation** : célesta, harpe, glockenspiel doux, cordes pincées, drones de pad chauds ; ambiances nocturnes (eau, vent léger, grillons lointains).
- **Musique** : une boucle d'ambiance par quartier (2–4 min, sans percussion marquée), jouée à faible volume, fondus de 2 s entre lieux.
- **Sons d'interface** : courts (< 300 ms), accordés dans la même tonalité par quartier (les réussites « sonnent juste » avec la musique).

| Événement | Son | Haptique |
|---|---|---|
| Tap bouton | tic feutré (optionnel, off par défaut) | aucune |
| Manipulation de puzzle (tourner, placer) | clic de bois / verre selon quartier | `selection` (léger) |
| Erreur | note grave douce, pas de buzzer | `error` (1 fois) |
| Lanterne allumée | arpège montant 3 notes | `success` |
| Salle complète | accord + scintillement | `success` + `impact(.soft)` |
| Déblocage | cadenas + souffle lumineux | `impact(.medium)` |
| Nouveau quartier | thème court (4 s) | `impact(.soft)` ×2 espacés |
| Éclats gagnés | cliquetis cristallin décroissant | aucune |

> **Implémentation.** Esquisse audible dans la maquette (synthèse Web Audio, section « Son ») ; décisions son + haptique dans le module Swift `GameAudio` (testé) ; fichiers définitifs à produire selon `Content/audio/SOUND_BRIEF.md`.

### 15.2 Règles haptiques

- **Jamais** d'haptique répétée à haute fréquence (pas de vibration par case survolée).
- Réglage *Vibrations* ON/OFF ; respect de l'option système.
- Chaque événement a au plus une haptique.

---

## 16. Icône de l'application

### 16.1 Concept retenu : « La lanterne dans la nuit »

- Fond : dégradé vertical `#080914 → #171A2E`, léger grain.
- Sujet : **la silhouette de Nilo de trois-quarts dos**, sombre sur sombre (lisible par un fin liseré de lumière), qui regarde **sa flamme** au premier plan à droite — la flamme est le seul point lumineux, ambre à noyau blanc.
- À petite taille (≤ 40 px), seule la flamme et la ligne des oreilles restent perceptibles → reconnaissable à la **tache de lumière chaude** sur un écran d'icônes souvent colorées et claires.

### 16.2 Alternatives étudiées

| Concept | Verdict |
|---|---|
| Nilo de face, yeux lumineux | Plus « mignon », mais concurrence avec d'innombrables mascottes ; moins mystérieux |
| Lanterne de papier seule | Élégant mais générique (confusion avec apps de fêtes / lampes) |
| Fenêtre éclairée dans une tour | Poétique, mais illisible en petit |

### 16.3 Contraintes Apple

- Carré plein 1024 × 1024 sans transparence ; iOS applique le masque.
- Variantes **sombre**, **teintée** et **claire** d'iOS : la variante teintée conserve la flamme comme zone lumineuse principale ; la variante sombre est quasiment l'icône par défaut. *(À réaliser avec les outils Apple en vigueur au moment de la production — le format des icônes a évolué récemment ; vérifier la documentation.)*
- Pas de texte, pas de capture d'écran dans l'icône.

---

## 17. Règles d'interface (checklist)

À vérifier sur chaque écran :

- [ ] Un seul bouton ambre (action principale).
- [ ] Le joueur sait où il est (titre ou fil d'Ariane).
- [ ] Le joueur sait quoi faire ensuite (action principale explicite).
- [ ] Toutes les cibles ≥ 44 pt.
- [ ] Aucune information portée par la couleur seule.
- [ ] Tous les textes via clés localisées ; aucun texte tronqué en FR (langue la plus longue des deux).
- [ ] Mise en page correcte en AX5 (Dynamic Type maximal).
- [ ] Labels VoiceOver sur tous les éléments interactifs ; ordre de lecture logique.
- [ ] Version mouvement réduit de chaque animation.
- [ ] iPhone SE (plus petit écran supporté) et iPad 13" paysage vérifiés.
- [ ] Pas de popup non sollicitée à l'ouverture.
- [ ] État vide et état de chargement prévus.

---

## 18. Tokens — nomenclature Swift

Nomenclature cible du module `DesignSystem` (conception, pas encore implémentée) :

```
Theme.Color.bgBase / bgDeep / surface1 / surface2 / line
Theme.Color.textPrimary / textSecondary / textTertiary
Theme.Color.accentLight / accentLightPressed / accentCool
Theme.Color.success / error
Theme.Color.district(.library)            // couleur rendue d'un quartier

Theme.Font.display / title1 / title2 / title3 / headline / body / callout
           / subhead / footnote / caption / dialogue / puzzleNumeral
                                           // tous adossés à un TextStyle Dynamic Type

Theme.Space.xxs … xxxl                     // 2 … 48
Theme.Radius.xs … xl, full
Theme.Stroke.hairline / focus / lit
Theme.Glow.soft / strong / district(_:)
Theme.Motion.instant / quick / standard / emphasis / celebrate / reveal
Theme.Haptic.selection / success / error / unlock
Theme.Sound.tap / manipulate / error / lanternLit / roomComplete / unlock / newDistrict
```

Les valeurs vivent dans un seul fichier de définition ; la variante *Contraste élevé* est un second jeu de valeurs sélectionné par l'environnement (`colorSchemeContrast`).
