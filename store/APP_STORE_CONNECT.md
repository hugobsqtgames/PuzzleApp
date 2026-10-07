# Remplir App Store Connect pour Lampion, case par case

Ordre conseillé : 0 → 7. Les noms des menus sont en français (avec l'anglais entre parenthèses,
si ton App Store Connect est en anglais). Chaque texte à coller est donné **en français** et
**en anglais** ; les textes longs (description…) sont dans [`FICHE_APP_STORE.md`](FICHE_APP_STORE.md),
à copier tels quels.

---

## 0. D'abord : un nouveau build (n° 3)

Deux petites corrections ont été faites après ton build n° 2, il faut les embarquer avant
d'envoyer l'app à Apple :
- l'**icône de saison** est maintenant **désactivée par défaut** (avant, l'icône changeait toute
  seule au premier lancement et iOS affichait une alerte « Vous avez modifié l'icône » : un
  vérificateur d'Apple aurait pu prendre ça pour un bug, et Apple veut que ce changement vienne
  du joueur). Elle reste dans Réglages → Icône de saison ;
- un libellé anglais (« Import progress »).

Sur le Mac, dans `PuzzleApp/app` :
```sh
git pull
npm ci
npx eas-cli build --platform ios --profile production --auto-submit
```
Puis attends l'e-mail d'Apple (build **1.0.0 (3)** traitée). C'est elle que tu choisiras à
l'étape 5.

---

## 1. Informations sur l'app (App Information)

Colonne de gauche → **Général** → **Informations sur l'app**.

### Langue principale (Primary Language)
**Français (France)**. EAS a peut-être créé l'app en anglais : vérifie et change-la. La langue
principale sert de secours dans les pays dont la langue n'est pas fournie.

### Ajouter l'anglais
En haut à droite de la page, menu des langues (« Français ») → **Ajouter une langue** →
**Anglais (États-Unis)**. Puis, si tu veux, ajoute aussi **Anglais (Royaume-Uni)** avec les
mêmes textes. Chaque langue a ses propres champs Nom / Sous-titre (ici) et Description /
Mots-clés… (à l'étape 5) : passe d'une langue à l'autre avec ce même menu.

### Nom et sous-titre (pour chaque langue)

| Champ | Français | English |
|---|---|---|
| Nom (Name, 30 max) | `Lampion : énigmes de lumière` | `Lampion: Puzzles of Light` |
| Sous-titre (Subtitle, 30 max) | `Rallume une ville endormie` | `Relight a sleeping city` |

(Si Apple dit que le nom est déjà pris, mets `Lampion – énigmes de lumière`.)

### Le reste de la page

| Champ | Quoi mettre |
|---|---|
| Identifiant de lot (Bundle ID) | déjà rempli : `app.lampion.game` (ne pas toucher) |
| SKU | déjà rempli (ne pas toucher) |
| Catégorie principale (Primary category) | **Jeux** (Games). Deux cases « sous-catégories » apparaissent alors : **Réflexion** (Puzzle) et **Famille** (Family) |
| Catégorie secondaire (Secondary, facultatif) | **vide** (elle doit être autre chose que « Jeux », et aucune ne convient vraiment) |
| Droits sur le contenu (Content Rights) | « Non, elle ne contient, n'affiche ni n'accède à aucun contenu de tiers » (*No, it does not contain, show, or access third-party content*). Tout (énigmes, dessins, musiques, textes) a été créé pour Lampion ; la police Newsreader est sous licence libre OFL, ça ne compte pas comme « contenu tiers ». |
| Contrat de licence (License Agreement) | laisser le **contrat standard d'Apple** |

### Classification par âge (Age Rating) → **Modifier**
Le questionnaire d'Apple : réponds à **tout** « Aucun / Non » (*None / No*) :
- violence (dessin animé, réaliste…), peur / horreur, contenu sexuel ou nudité, grossièretés,
  drogues / alcool / tabac, thèmes adultes, contenu médical : **Aucun** (la fête d'Halloween
  n'a que des citrouilles et des chauves-souris mignonnes : ce n'est pas de l'horreur) ;
- jeux d'argent, jeux de hasard simulés, concours, coffres à butin (*loot boxes*) : **Non** ;
- accès Internet sans restriction, contenu créé par les utilisateurs, messagerie / chat,
  publicité : **Non** ;
- contrôle parental, vérification de l'âge : **Non**.

Résultat attendu : **4+**.

### Statut de commerçant dans l'UE (Digital Services Act)
Si la page (ou **Accords / Business**) te demande ton statut pour l'Union européenne : pour une
app **gratuite, sans achat, sans pub et sans revenu**, tu peux te déclarer **non-commerçant**
(*not a trader*). Si tu te déclares commerçant, Apple affiche publiquement ton adresse, ton
téléphone et ton e-mail sur la fiche dans l'UE. C'est ta décision ; dans le doute, non-commerçant
pour cette première version.

---

## 2. Tarifs et disponibilité (Pricing and Availability)

| Champ | Quoi mettre |
|---|---|
| Prix (Price) | **Gratuit** (*Free*, 0,00 €) |
| Disponibilité (Availability) | **Tous les pays ou régions** (*All countries or regions*). L'app est en français et en anglais, elle fonctionne partout. |
| Précommande (Pre-order) | non |
| Mac avec puce Apple / Apple Vision Pro | **décoche** « Rendre disponible » : Lampion n'a été pensée que pour iPhone et iPad |

---

## 3. Confidentialité de l'app (App Privacy)

Colonne de gauche → **Confidentialité de l'app**.

| Champ | Quoi mettre |
|---|---|
| URL de la politique de confidentialité (FR) | `https://hugobsqtgames.github.io/PuzzleApp/confidentialite.html` |
| Privacy Policy URL (English) | `https://hugobsqtgames.github.io/PuzzleApp/en/privacy.html` |
| URL des choix de confidentialité | vide |

Puis **Commencer** (Get Started) → « Collectez-vous des données à partir de cette app ? » →
**Non, nous ne collectons pas de données** (*No, we do not collect data from this app*) →
**Publier**. L'étiquette affichera « **Aucune donnée collectée** » (*Data Not Collected*).

C'est vrai et vérifiable : aucune requête réseau, aucune analyse, aucune pub, aucun SDK tiers,
les rappels sont locaux, la sauvegarde reste sur l'appareil.

---

## 4. TestFlight

Déjà fait par EAS (groupe « Team (Expo) »). Si App Store Connect demande des
**informations de test** pour TestFlight :
- Description (*Beta App Description*) : `Jeu d'énigmes calme et hors ligne : rallume les 1 000 lanternes de Vesper.` / `A calm, offline puzzle game: relight the 1,000 lanterns of Vesper.`
- E-mail de retour : ton adresse (elle n'est vue que par tes testeurs).

---

## 5. La version 1.0 (page « iOS App » → 1.0 « Prête à être soumise »)

Colonne de gauche → **iOS App** → **1.0**. Tout en haut, le menu des langues : remplis la page
une fois en **Français**, puis repasse en **English** pour les champs marqués « par langue ».

### 5.1 Aperçus et captures d'écran (par langue)

Chaque langue a ses propres images : remplis l'onglet de chaque appareil une fois en
**Français**, puis repasse en **English** (menu des langues en haut à droite) et recommence avec
les images anglaises. Glisse les 10 images d'un coup, puis vérifie l'ordre 01 → 10.

| Onglet dans App Store Connect | Français | English |
|---|---|---|
| **iPhone avec Dynamic Island (écran moyen)**, 1206 × 2622 | `store/iphone-6.3/` | `store/en/iphone-6.3/` |
| **iPhone Duo**, 1398 × 2034 | `store/iphone-duo/` | `store/en/iphone-duo/` |
| **iPad – Écran de 13 pouces**, 2064 × 2752 | `store/ipad-13/` | `store/en/ipad-13/` |
| Apple Watch | rien | rien |
| (si une taille « grand écran » 6,9" ou 6,5" est demandée) | `store/iphone-6.9/`, `store/iphone-6.5/` | `store/en/iphone-6.9/`, `store/en/iphone-6.5/` |

Vidéos (aperçus d'app), les mêmes pour les deux langues (elles sont en français) :

| Onglet | Fichier |
|---|---|
| iPhone avec Dynamic Island **et** iPhone Duo | `store/video/presentation-iphone.mp4` (886 × 1920) |
| iPad – 13 pouces | `store/video/presentation-ipad.mp4` (1200 × 1600) |

Pour la vidéo : une fois envoyée, clique sur **Modifier l'image d'affiche** (*Poster Frame*) et
choisis vers **4,5 s** (le téléphone avec l'accueil de Lampion bien visible).

### 5.2 Textes (par langue)

Tout est dans [`FICHE_APP_STORE.md`](FICHE_APP_STORE.md), partie **Français** puis **English** :

| Champ | Où le prendre |
|---|---|
| Texte promotionnel (Promotional Text) | « Texte promotionnel » / « Promotional text » |
| Description | « Description » (en entier, avec les titres en majuscules) |
| Nouveautés (What's New) | **n'apparaît pas pour la 1re version**, c'est normal |
| Mots-clés (Keywords) | « Mots-clés » / « Keywords » (une seule ligne, virgules sans espace) |
| URL d'assistance (Support URL) | FR : `https://hugobsqtgames.github.io/PuzzleApp/` — EN : `https://hugobsqtgames.github.io/PuzzleApp/en/` |
| URL marketing (Marketing URL) | facultatif : les mêmes adresses que ci-dessus |

**Important pour l'URL d'assistance** : Apple veut pouvoir y trouver un moyen de te contacter.
Il manque encore une adresse e-mail de contact sur le site : donne-la-moi (une adresse dédiée
comme `lampion.app@…` est une bonne idée) et je l'ajoute avant que tu envoies l'app.

### 5.3 Général (une seule fois, pas par langue)

| Champ | Quoi mettre |
|---|---|
| Version | `1.0` (déjà rempli) |
| Copyright | `2026 Hugo Busquet` |
| Routage (Routing App Coverage) | rien |

### 5.4 Build

Section **Build** → **Ajouter une build** (+) → choisis **1.0.0 (3)** (celle de l'étape 0).
C'est à ce moment-là que **le logo apparaît** dans App Store Connect.

S'il demande pour le chiffrement (*Export Compliance*) : normalement non, c'est déjà déclaré dans
l'app (« aucun chiffrement autre que celui d'iOS »). Si la question apparaît quand même :
**Aucun des algorithmes mentionnés** / *None of the algorithms mentioned above*.

### 5.5 Game Center
Décoché (Lampion n'utilise pas Game Center).

### 5.6 Informations pour la vérification de l'app (App Review Information)

| Champ | Quoi mettre |
|---|---|
| Connexion requise (Sign-in required) | **décoché** (il n'y a aucun compte) |
| Prénom / Nom (Contact) | `Hugo` / `Busquet` |
| Téléphone | ton numéro, au format international (`+33 6 …`). Seul Apple le voit, en cas de question. |
| E-mail | ton adresse. Seul Apple la voit. |
| Notes | **le texte anglais ci-dessous, en entier** (les vérificateurs lisent l'anglais) |
| Pièce jointe | rien |

#### Notes à coller (anglais, 3 295 caractères sur 4 000 autorisés)

```
Thank you for reviewing Lampion.

WHAT IT IS
Lampion is a calm, offline logic-puzzle game for iPhone and iPad, in English and French (it follows the device language). The city of Vesper has gone dark; the player relights its 1,000 lanterns by solving puzzles (26 kinds: switches, codes, sliding tiles, bridges, a melody to play back, etc.). No timer, no lives.

NO ACCOUNT, NO SIGN-IN, NO NETWORK
- No login of any kind: the app opens straight into the game. No demo account is needed.
- The app makes no network request. All content is inside the app. It works in airplane mode.
- No ads, no analytics, no tracking, no third-party SDK. Privacy label: Data Not Collected.

NO IN-APP PURCHASES
"Shards" are an in-game reward earned only by playing (puzzles, evening challenge, achievements). They pay for hints and cosmetic items for the mascot, Nilo. They can never be bought with real money and have no value outside the game.

HOW TO TRY IT (about 3 minutes)
1. First launch: a short story (a few screens, "Skip" available), then "Enter Vesper" leads to the home screen.
2. Home > "Start the adventure" (later "Continue") opens the next puzzle. Each new kind of puzzle starts with a short explanation of its rules. In a room, tap any lantern, then "Light" to play it.
3. Stuck? The bulb button ("Hints") gives hints: free whispers first, then hints paid in Shards. The last level shows the full solution, so every puzzle can be finished.
4. Home > "Evening challenge": one puzzle a day, the same for everyone.
5. Bottom bar: Map (the city), Free play (choose a puzzle type and difficulty among those already met), Notebook (achievements, statistics, found objects), Settings.
6. Language: Settings > Language (English or French).

PROGRESSIVE CONTENT (expected behaviour)
Districts open with the number of lanterns lit: the Lighthouse first, the Library at 24 lanterns, then the others up to 494. A locked district shows how many lanterns are still needed. The final district appears late in the game. This is the game's progression, not a missing feature.

SEASONAL EVENTS
Three yearly festivals appear automatically by date: spring lanterns (28 Mar - 10 Apr), Halloween (25 Oct - 2 Nov), winter (15 Dec - 6 Jan). Outside these dates they are not shown. To see one, set the device date within a festival period.

PERMISSIONS AND SYSTEM FEATURES
- Notifications: local only (an evening reminder). Never requested at launch: after the first evening challenge, the app asks in its own words whether the player wants a reminder, and the iOS permission appears only if the player says yes. Changeable in Settings.
- Seasonal app icon: off by default. If the player turns it on in Settings > "Seasonal icon", the icon follows the season and iOS shows its standard "icon changed" notice.
- Home-screen widget: tonight's challenge and the evening streak.
- Rating request: at most once, after a whole district is lit, never during a puzzle.
- Settings > "Export my progress" opens the iOS share sheet with a text backup; "Import progress" restores it. The app itself sends nothing anywhere.

ACCESSIBILITY
VoiceOver labels on every control, Dynamic Type, colour aid (symbols on colours), sound captions, Reduce Motion respected.

Contact details are in the App Review Information section. Thank you!
```

#### La même chose en français (pour toi, à ne pas coller)

> **Ce que c'est.** Un jeu d'énigmes logiques calme et hors ligne, iPhone et iPad, en anglais et
> en français (suit la langue du téléphone). Vesper s'est éteinte ; le joueur rallume ses 1 000
> lanternes en résolvant des énigmes (26 sortes). Pas de chrono, pas de vies.
>
> **Pas de compte, pas de connexion, pas de réseau.** Aucun identifiant, aucun compte de démo
> nécessaire. Aucune requête réseau, tout est dans l'app, ça marche en mode avion. Pas de pub,
> pas d'analyse, pas de pistage, aucun SDK tiers. Étiquette : Aucune donnée collectée.
>
> **Pas d'achat intégré.** Les « Éclats » se gagnent uniquement en jouant ; ils paient les
> indices et des accessoires pour Nilo. Jamais achetables avec de l'argent réel.
>
> **Comment l'essayer (3 min).** Histoire courte (« Passer » possible) → « Entrer dans Vesper »
> → accueil. « Commencer l'aventure » / « Continuer » ouvre l'énigme suivante, chaque nouvelle
> sorte d'énigme est expliquée. Ampoule « Indices » : murmures gratuits, puis indices en Éclats,
> le dernier niveau montre la solution. « Défi du soir » : une énigme par jour. Barre du bas :
> Carte, Libre, Carnet, Réglages. Langue dans Réglages.
>
> **Contenu progressif (normal).** Les quartiers s'ouvrent avec le nombre de lanternes allumées
> (Bibliothèque à 24, … jusqu'à 494) ; le dernier quartier apparaît tard. Ce n'est pas un manque.
>
> **Fêtes.** Trois fêtes selon la date (28 mars–10 avril, 25 oct.–2 nov., 15 déc.–6 janv.).
> Pour en voir une, changer la date du téléphone.
>
> **Autorisations.** Notifications locales seulement, demandées après le premier défi du soir et
> seulement si le joueur dit oui dans l'app. Icône de saison désactivée par défaut. Widget. Note
> demandée au plus une fois, après un quartier entièrement éclairé. Export/import par la feuille
> de partage d'iOS, l'app n'envoie rien.
>
> **Accessibilité.** VoiceOver, texte dynamique, aide aux couleurs, sous-titres des sons,
> animations réduites respectées.

### 5.7 Publication de la version (Version Release)
Choisis **Publier manuellement cette version** (*Manually release this version*) : quand Apple
l'aura acceptée, c'est toi qui appuies sur « Publier », au moment que tu veux. (Ou
« automatiquement » si tu préfères qu'elle sorte dès l'acceptation.)

### 5.8 Publication progressive (Phased Release)
Pas utile pour une première version : laisse **Publier pour tous les utilisateurs
immédiatement**.

---

## 6. Envoyer

En haut à droite : **Enregistrer**, puis **Ajouter pour vérification** (*Add for Review*) →
**Envoyer pour vérification** (*Submit for Review*).

S'il reste un champ manquant, App Store Connect l'indique en rouge en haut de la page : envoie-moi
une capture.

Délai habituel : 24 à 48 heures. Tu reçois un e-mail à chaque changement d'état
(« En attente de vérification » → « En cours de vérification » → « Prête à être publiée »).

---

## 7. Si Apple refuse

Pas de panique : c'est fréquent pour une première app, et ça se règle en général en une
réponse. Le message arrive dans **App Review** (centre de résolution, *Resolution Center*) avec
le numéro de la règle (par ex. « Guideline 2.1 »). Copie-moi le message entier : je te prépare
la réponse et, si besoin, la correction et un nouveau build.
