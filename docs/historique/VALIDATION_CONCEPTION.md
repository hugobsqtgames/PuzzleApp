# VALIDATION — revue de conception (phase 6)

> Revue critique de PRODUCT_DISCOVERY, DESIGN_SYSTEM, GAME_DESIGN, TECHNICAL_ARCHITECTURE, WIREFRAMES et de la maquette, avant le développement.
> Méthode : relecture croisée des documents, vérification des chiffres, tests automatisés de la maquette (Playwright/Chromium : 24 écrans × variantes × iPhone/iPad, parcours complet), vérification par solveur des puzzles de la maquette.
> Chaque problème trouvé est **corrigé** dans les documents concernés, pas seulement signalé.

---

## 1. Problèmes trouvés et corrections

| # | Axe | Problème | Gravité | Correction appliquée |
|---|---|---|---|---|
| V1 | Cohérence / UX | **« Lanterne » avait trois sens** : l'objet-puzzle du monde, une famille (« Lanternes », genre Akari) et un palier de difficulté. Un écran aurait affiché « Lanterne 9 · Lanternes · Lanterne ». | Haute | Palier 4 → **Brasier** (*Blaze*). Famille → **Lampes** (*Lamps*). « Lanterne » ne désigne plus que le puzzle dans le monde. |
| V2 | Cohérence | **« Phare » avait deux sens** : le quartier-hub et le palier 5. | Moyenne | Palier 5 → **Fanal** (*Beacon*), le feu d'un phare : la gradation Étincelle → Lueur → Flamme → Brasier → Fanal → Astre reste une montée en intensité. |
| V3 | Progression | La règle « salle suivante si ≥ 6 / 10 » ne fonctionnait pas au Phare, dont les salles ont **6** lanternes : il aurait fallu les finir à 100 %. | Moyenne | Règle proportionnelle : **≥ 60 % de la salle précédente, arrondi au supérieur** (4 / 6 au Phare). |
| V4 | Cohérence | Nombre de lanternes par bâtiment ambigu (4 × 10 + lanterne-clé = 41 ? ou 40 ?). La maquette montrait 4 salles sur 10 **plus** une lanterne-clé. | Moyenne | Bâtiment = **40** : salles 1–3 à 10, salle 4 à 9 + la lanterne-clé. Condition de la clé « 30 / 39 » inchangée et désormais exacte. Maquette alignée. |
| V5 | Game design | La maquette comptait les conflits en direct des Lampes comme des **erreurs**, ce qui faisait perdre le bonus Clairvoyance pour de l'exploration normale. Contraire au pilier « l'erreur est une information ». | Moyenne | Clairvoyance = aucun indice payant **et**, pour les seules familles à réponse, aucune validation fausse. Les retours en direct des familles à état ne comptent jamais. Maquette corrigée. |
| V6 | Technique / maquette | Vignettes de la planche construites en `<button>` contenant d'autres `<button>` : le navigateur recasait une feuille « Pause » par-dessus toute la page mobile. | Haute (maquette) | Vignettes en `div role="button"` + clavier. Test automatique ajouté : aucune feuille hors de son écran. |
| V7 | Technique / maquette | Motif de grain dans un attribut `style` : les guillemets de l'URL fermaient l'attribut, un voile couvrait la page. | Haute (maquette) | Motif déplacé dans une classe CSS. |
| V8 | Performance | Brouillard des quartiers verrouillés rendu par **flou gaussien** : coûteux (et le serait aussi en SwiftUI), teinte parasite. | Moyenne | Brouillard en **dégradés radiaux** sans flou. À reprendre tel quel dans l'app (pas de `blur` animé sur la carte). |
| V9 | UX iPhone | Le Cadenas débordait sur iPhone quand le message d'erreur (3 lignes) s'affichait : les molettes passaient sous le message. | Moyenne | Lignes d'indices compactées, « chiffres tous différents » déplacé dans la consigne, zone de plateau défilable avec centrage sûr. Règle générale ajoutée au design : **le plateau doit tenir avec un message de 3 lignes sur iPhone SE**. |
| V10 | UX iPad | Accueil iPad : la fenêtre sur Vesper en colonne verticale laissait 60 % de ciel vide. Plateau de puzzle trop large pour la colonne centrale. | Moyenne | Accueil iPad recomposé (bandeau panoramique + 3 colonnes). Tailles de cases iPad recalculées pour la grille 250 / centre / 300. |
| V11 | Juridique | Les noms de genres « Akari » et « Lights Out » apparaissent dans les documents. « Lights Out » est une marque déposée (jeu électronique des années 1990). | Faible | Ces noms restent **uniquement** dans la documentation interne comme référence de genre. Dans l'app : « Lampes », « Interrupteurs ». Règle ajoutée : aucun nom de jeu tiers dans les textes du produit ni dans les métadonnées App Store. |
| V12 | Accessibilité | Engrenages : la rotation anti-horaire était un appui long, non découvrable, et absent de VoiceOver. | Faible | Deux actions VoiceOver explicites (« tourner à droite », « tourner à gauche ») ; l'appui long reste un raccourci, jamais nécessaire (4 taps horaires suffisent toujours). |
| V13 | Progression | Trouvé par le test automatique « jamais bloqué » (parties simulées complètes) : le Grenier exigeait **les 6** lettres, donc 6 lanternes-clés précises. Bloqué sur une seule, le joueur ne pouvait plus finir le jeu. | Haute | Grenier : **4 lettres sur 6**. Le test simule désormais des parties complètes à chaque exécution. |

---

## 2. Vérifications passées sans correction

| Axe | Vérification | Résultat |
|---|---|---|
| **Identité** | La métaphore « résoudre = éclairer » est présente dans chaque écran (accueil, carte, salle, succès, icône, notifications) | ✓ |
| **Identité** | Aucune ressemblance directe avec les mascottes citées (pas de hibou, pas d'humain, pas de forme géométrique pure) | ✓ |
| **Navigation** | Accueil → puzzle : 1 tap (Continuer) ou 4 taps (carte → quartier → bâtiment → salle) | ✓ testé |
| **Navigation** | Chaque écran a un titre ou un fil d'Ariane et un retour spatial logique | ✓ |
| **UX** | Aucun écran d'échec, aucune popup à l'ouverture, aucune permission au 1ᵉʳ lancement | ✓ |
| **Progression** | Jamais bloqué : seuils à 60 % du contenu disponible ; un puzzle précis n'est jamais requis | ✓ (test automatique prévu : ≥ 3 lanternes jouables dans tout état atteignable) |
| **Difficulté** | Distribution par quartier : chaque ligne somme à 100 % ; montée monotone du palier médian | ✓ |
| **Économie** | Catalogue boutique (~6 000 Éclats) < solde du profil « dépendant » (~12 500) | ✓ |
| **Puzzles de la maquette** | Lampes 6×6, Cadenas 492, Engrenages 4×4 : générés puis prouvés à solution unique ; Interrupteurs 3×3 : matrice inversible sur GF(2), solution unique en 3 coups ; Suites : aucun distracteur expliqué par une règle simple | ✓ scripts reproductibles |
| **Contrastes** | Texte essentiel ≥ 4,5:1 partout ; « Brume sourde » interdite sur `surface.2` (3,8:1) | ✓ mesuré |
| **Faisabilité** | Tout le cœur (puzzles, progression, économie, sauvegarde) est du Swift pur → compilable et testable sur Linux ; la couche SwiftUI demandera macOS/Xcode | ✓ toolchain Swift 6.2.1 installée dans l'environnement |
| **Performance potentielle** | Illustrations vectorielles paramétrées (éteint → allumé par interpolation, pas de doubles assets) ; pas d'animation permanente ; génération à la volée limitée au défi du jour | ✓ |
| **Confidentialité** | Aucune fonctionnalité ne nécessite réseau, compte, localisation, micro, caméra ou contacts | ✓ |

---

## 3. Risques restants (acceptés, à surveiller)

1. **Calibration de la difficulté sans télémétrie** : dépend de tests de jeu volontaires. Plan dans GAME_DESIGN § 15.
2. **Coût des illustrations** : la maquette valide la composition, pas le rendu final. Un illustrateur sera nécessaire avant la bêta.
3. **Accessibilité de la Marqueterie** : famille la moins adaptée à VoiceOver ; alternative « case par case » à valider avec des utilisateurs de VoiceOver.
4. **Nom** : « Lampion » non vérifié juridiquement.
5. **Volume** : 12 familles complètes est ambitieux. L'architecture permet de sortir avec 8–10 familles sans rien changer d'autre.

---

## 4. Verdict

La conception est **cohérente et prête pour le développement**. Les deux problèmes de vocabulaire (V1, V2) étaient les plus importants : ils auraient contaminé les textes, la localisation et le code (noms de types). Ils sont corrigés avant la première ligne de code.

Ordre de développement retenu (tranches verticales, TECHNICAL_ARCHITECTURE § 18–20) :

1. **Socle Swift pur** : aléatoire déterministe, contrat `PuzzleFamily`, pipeline de validation, paliers.
2. **Premières familles complètes** (génération → solveur → validation → difficulté → indices → tests massifs) : Interrupteurs, Cadenas, Lampes.
3. **GameCore** : progression, déblocages, économie idempotente, défi du jour et série.
4. **Persistance** : sauvegarde versionnée, écriture atomique, migrations, récupération.
5. Puis les familles suivantes, ContentForge, et la couche SwiftUI (sur Mac).
