# Vidéo de présentation App Store (App Preview)

`store/video/presentation-iphone.mp4` : 29 s, 886 × 1920, 30 i/s, H.264 High + AAC stéréo 44,1 kHz,
volume à −16 LUFS. C'est le format Apple des aperçus pour les iPhone 6,5" et 6,9".

Tout ce qu'on voit dans le téléphone est la vraie app, filmée en train d'être jouée :
le Carillon est vraiment rejoué à l'oreille, les passerelles vraiment construites. Les sons
sont ceux de l'app, placés aux instants filmés.

## Storyboard

| Temps | Scène | À l'écran | Texte |
|---|---|---|---|
| 0–3 s | Le besoin | Nuit étoilée ; une flamme s'allume | « Vesper s'est éteinte. » / « Une ville entière attend sa lumière. » |
| 3–6,4 s | Découverte | Le téléphone monte en tournant ; l'accueil du soir, Nilo touché qui réagit | LAMPION · « Chaque énigme rallume une lumière » |
| 6,4–9,4 s | La ville | Le téléphone pivote ; la carte de Vesper défile | UNE VILLE À RÉVEILLER · « Huit quartiers, une seule nuit » |
| 9,4–16,8 s | Une vraie partie | La salle, la lanterne, le Carillon ; la caméra s'approche des cloches, trois notes rejouées, la lanterne s'allume (halo derrière le téléphone) | DES ÉNIGMES JUSTES · « La logique, jamais le hasard » |
| 16,8–21,3 s | La variété | Trois téléphones en éventail : Passerelles construites en direct, Vitraux, Constellations, Carillon, Ombres | 26 FAMILLES D'ÉNIGMES · « Écoute, observe, déduis » |
| 21,3–24,8 s | Les saisons | Le Printemps des Lanternes (pétales), puis l'accueil fleuri avec Nilo | SAISONS ET FÊTES · « Vesper vit au fil de l'année » |
| 24,8–29 s | Conclusion | Le téléphone s'éloigne, des lanternes montent ; l'icône | « Lampion » · « Sans compte. Sans pub. Sans pistage. » · « Rallume Vesper. » |

Les textes reprennent ceux des captures App Store (mêmes polices, couleurs, cadre de téléphone),
pour que fiche et vidéo forment un tout.

## Refaire la vidéo

Depuis un dossier de travail qui contient les captures de `capture.js` (`store/app-*.png`) :

```sh
cd app && npx tsx ../tools/store/promo/plan.ts && cd -        # les énigmes jouées et leurs coups
node ../tools/store/spa.js web &                              # le build web sur :8768
node ../tools/store/promo/record.js                           # filme la vraie app → store/promo-clips/
FFMPEG=… node ../tools/store/promo/render.js                  # → store/out/promo-iphone.mp4
SNAP=3,10,16 node ../tools/store/promo/render.js              # quelques images pour vérifier un cadrage
# La version iPad (1200 × 1600, les mêmes scènes dans la mise en page iPad, captures store/ipad-*.png) :
IPAD=1 node ../tools/store/promo/record.js                    # → store/promo-clips-ipad/
IPAD=1 FFMPEG=… node ../tools/store/promo/render.js           # → store/out/promo-ipad.mp4
```

Le montage (moments, mouvements de caméra, textes) est dans `stage.html` (iPhone) et `stage-ipad.html`
(iPad : même histoire, une tablette, des coupes calées sur les scènes filmées en iPad), en tête du script :
`TEXTS`, `PHONES` (poses et plans de chaque téléphone), `camera`, `BLOOMS`.

## À savoir pour App Store Connect

- **Image d'affiche** : choisir un instant parlant (par exemple 4,5 s, l'accueil avec le titre).
- **Règle 2.3.4 d'Apple** : un aperçu ne doit montrer que des captures de l'app ; textes et
  narration sont permis. Ici chaque écran est réel. Le cadre de téléphone et la mise en scène
  restent une interprétation : s'il était refusé, `PHONES` peut passer en plein écran.
