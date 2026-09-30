# Images App Store

Les images finales sont dans `store/iphone-6.9/` (1320 × 2868) et `store/ipad-13/` (2064 × 2752).
Chaque image montre une vraie capture de l'app, avec une partie jouée à la main pour le carillon et le vitrail.

Pour les régénérer, depuis un dossier de travail :

```sh
cd app && npx expo export -p web --output-dir ../work/web && cd ../work && mkdir -p store/out
node ../tools/store/spa.js web &            # sert le build sur http://localhost:8768
node ../tools/store/capture.js               # captures iPhone 430 × 932 @3x → store/app-*.png
node ../tools/store/capture2.js              # une vraie réussite (carillon) et un vitrail commencé
node ../tools/store/capture3.js              # salles
W=1032 H=1376 DSF=2 PREFIX=ipad node ../tools/store/capture.js   # idem pour l'iPad (et capture2, capture3)
node ../tools/store/compose.js iphone        # → store/out/iphone-01…09.png
node ../tools/store/compose.js ipad          # → store/out/ipad-01…09.png
```

Il faut Playwright (`PLAYWRIGHT=/chemin/vers/playwright`, `CHROMIUM=/chemin/vers/chromium` si besoin).
`saveMock.json` reproduit la progression de la maquette (184 lumières), `save800.json` une partie avancée.
