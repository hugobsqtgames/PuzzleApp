# Mettre Lampion sur TestFlight (puis l'App Store)

À faire depuis ton ordinateur, dans le dossier `app/` du projet. La compilation se fait sur les
serveurs d'Expo (EAS) : pas besoin de Xcode ni de Mac puissant. Tes identifiants Apple ne sont
tapés que par toi, dans ton terminal.

Déjà réglé dans le projet : identifiant d'app `app.lampion.game`, Team ID `336SM4755V`,
App Group `group.app.lampion.game` (pour le widget), numéro de build qui monte tout seul.

## Une seule fois

1. Un compte Expo (gratuit) sur https://expo.dev si tu n'en as pas.
2. Dans `app/` :
   ```sh
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   `init` relie le projet à ton compte Expo et ajoute un `projectId` dans `app.json` :
   pousse ce changement (ou envoie-moi la ligne, je l'ajoute).

## Chaque version de test

```sh
npx eas-cli@latest build -p ios --profile production
```
- Il te demande de te connecter à ton compte Apple Developer : réponds oui pour qu'EAS crée
  lui-même les certificats, les profils, l'identifiant `app.lampion.game`, celui du widget
  (`app.lampion.game.widget`) et l'App Group.
- La compilation dure en général 15 à 30 minutes (le forfait gratuit d'Expo a une file d'attente
  et un nombre limité de builds par mois).

Puis l'envoi à Apple :
```sh
npx eas-cli@latest submit -p ios --latest
```
La première fois, il propose de créer la fiche de l'app sur App Store Connect (nom « Lampion »).

## Installer sur ton iPhone

1. App Store Connect → ton app → **TestFlight** : après 10 à 30 minutes de traitement, la build
   apparaît. Ajoute-toi (et tes proches) dans **Tests internes** (jusqu'à 100 personnes, sans
   validation d'Apple).
2. Sur l'iPhone : l'app **TestFlight** (gratuite sur l'App Store), puis installe Lampion.

## À vérifier sur l'iPhone (impossible dans Expo Go ou le navigateur)

- Le widget (appui long sur l'écran d'accueil → « + » → Lampion).
- L'icône de saison qui change (Réglages de Lampion → icône de saison).
- Les vibrations, le son, les volumes musique / effets.
- Le zoom à deux doigts sur une grande grille.
- La demande de note (après un quartier entièrement éclairé, une seule fois).
- Le mode Libre et Constellations, une fête (en changeant la date du téléphone).

## Le jour de la sortie

Dans App Store Connect, tout le contenu est prêt dans `store/` : textes (`FICHE_APP_STORE.md`),
images (`iphone-6.9/`, `ipad-13/`), vidéo (`video/`), confidentialité « Aucune donnée collectée »,
âge 4+, gratuit. Choisis la build TestFlight voulue et envoie en vérification.
