# Mettre Lampion sur TestFlight (puis l'App Store)

À faire depuis ton ordinateur (Mac, Windows ou Linux), dans le dossier `app/` du projet. La
compilation se fait sur les serveurs d'Expo (EAS) : pas besoin de Xcode. Tes identifiants Apple ne
sont tapés que par toi, dans ton terminal.

Déjà réglé et vérifié dans le projet : identifiant d'app `app.lampion.game`, Team ID `336SM4755V`,
widget `app.lampion.game.widget`, App Group `group.app.lampion.game`, numéro de build qui monte tout
seul, chiffrement déclaré « aucun » (pas de question export à chaque build), aucune autorisation
« notifications push » (seulement des rappels locaux). Le projet iOS se génère sans erreur et
`expo-doctor` passe ses 21 vérifications.

## 0. Ce qu'il te faut

- Node.js 20 ou plus récent (https://nodejs.org), et le projet à jour : `git pull`, puis dans
  `app/` : `npm ci` (jamais `npm install`, qui réécrit `package-lock.json` selon la version de npm du Mac, et le serveur de build le refuse ensuite).
- Ton compte Apple Developer payant (99 €/an) actif.
- Un compte Expo gratuit : https://expo.dev/signup

## 1. Une seule fois : relier le projet à Expo

```sh
cd app
npx eas-cli@latest login      # ton compte Expo
npx eas-cli@latest init       # crée le projet « lampion » sur expo.dev
```
`init` ajoute une ligne `"extra": { "eas": { "projectId": "…" } }` dans `app.json`.
Garde-la : commite et pousse ce changement (ou envoie-moi la ligne, je l'ajoute).

## 2. Une seule fois : créer la fiche sur App Store Connect

https://appstoreconnect.apple.com → **Apps** → **+** → **Nouvelle app** :
- Plateforme iOS, nom **Lampion** (s'il est pris : « Lampion – Énigmes »), langue principale
  **Français**, identifiant de lot **app.lampion.game**, SKU au choix (ex. `lampion-1`),
  accès complet.
- Si l'identifiant n'apparaît pas encore dans la liste, fais d'abord l'étape 3 : EAS le crée,
  puis reviens ici.

## 3. Le premier build

```sh
npx eas-cli@latest build -p ios --profile production
```
Réponds aux questions ainsi :
- « Log in to your Apple account? » → **Yes**, puis ton identifiant Apple et ton mot de passe
  (et le code à 6 chiffres reçu sur ton iPhone).
- « Generate a new Apple Distribution Certificate? » → **Yes**.
- « Generate a new Apple Provisioning Profile? » → **Yes** (il le fait pour l'app **et** pour le
  widget, et crée l'App Group).
- S'il propose de pousser des notifications / une clé push → **No** (Lampion n'en a pas besoin).

La compilation dure en général 15 à 30 minutes (le forfait gratuit d'Expo a une file d'attente).
Tu peux fermer le terminal : le suivi est sur https://expo.dev → ton projet → **Builds**.

## 4. L'envoyer à Apple

```sh
npx eas-cli@latest submit -p ios --latest
```
- Il demande ton compte Apple, puis l'app App Store Connect à utiliser : choisis **Lampion**.
- Il peut proposer de créer une **clé API App Store Connect** : réponds oui, c'est ce qui évite de
  retaper ton mot de passe les fois suivantes.

Astuce pour les fois suivantes, les deux d'un coup :
```sh
npx eas-cli@latest build -p ios --profile production --auto-submit
```

## 5. L'installer sur ton iPhone (TestFlight)

1. App Store Connect → Lampion → **TestFlight** : après 10 à 30 minutes de traitement, la build
   apparaît. Crée un groupe dans **Tests internes**, ajoute-toi (et jusqu'à 100 personnes de ton
   équipe App Store Connect), sans validation d'Apple.
2. Sur l'iPhone : installe l'app **TestFlight** (gratuite), ouvre l'invitation, installe Lampion.

Attention : c'est une autre app qu'Expo Go, avec sa propre sauvegarde. Ta partie d'Expo Go n'y est
pas : utilise **Réglages → Exporter ma progression** dans Expo Go, puis **Importer une progression** dans la version
TestFlight.

## 6. À vérifier sur l'iPhone (impossible dans Expo Go ou le navigateur)

- Le widget (appui long sur l'écran d'accueil → « + » → Lampion).
- L'icône de saison qui change (Réglages de Lampion → icône de saison).
- Les rappels du soir (les accepter, puis attendre l'heure choisie).
- Les vibrations, le son, les volumes musique / effets, le mode silencieux.
- Le zoom à deux doigts sur une grande grille.
- La demande de note (après un quartier entièrement éclairé, une seule fois).
- Quitter l'app de force en pleine énigme, la relancer : la partie est là.
- Le mode Libre et Constellations, une fête (en changeant la date du téléphone).

## 7. Le jour de la sortie

Dans App Store Connect → Lampion → la version **1.0** :
- Textes : tout est dans `store/FICHE_APP_STORE.md` (sous-titre, description, mots-clés, notes
  de version, texte promotionnel).
- Captures : `store/iphone-6.9/` (obligatoire), `store/iphone-6.5/`, `store/ipad-13/`.
- Vidéo : `store/video/presentation-iphone.mp4` (aperçu iPhone ; image d'affiche vers 4,5 s).
- Confidentialité : **Aucune donnée collectée**. Âge : **4+**. Prix : **gratuit**.
- URL de confidentialité : la page `confidentialite.html` du site GitHub Pages du projet.
- URL d'assistance (obligatoire) : la page d'accueil du site. Apple veut un moyen de te joindre :
  dis-moi quelle adresse de contact y mettre et je l'ajoute.
- Choisis la build TestFlight, puis **Ajouter pour vérification** → **Envoyer**. La vérification
  d'Apple prend en général 1 à 3 jours.

## Les versions suivantes

Change `"version"` dans `app.json` (ex. `1.0.1`) seulement quand tu publies une nouvelle version
sur l'App Store ; le numéro de build, lui, monte tout seul à chaque `build`.
