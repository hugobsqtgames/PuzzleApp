# Images App Store

Les images finales sont dans `store/iphone-6.3/` (1206 × 2622, iPhone 6,1"/6,3", la taille demandée par App Store Connect pour « iPhone avec Dynamic Island »), `store/iphone-6.5/` (1284 × 2778, iPhone 6,5"), `store/iphone-6.9/` (1320 × 2868) et `store/ipad-13/` (2064 × 2752). Les 6,5" sont la même composition que les 6,9", dessinée 12 px plus courte (fond vide en bas) et mise à 97,3 % : textes, écrans et mise en page identiques.
Chaque image montre une vraie capture de l'app (rien n'est retouché). Le script cherche lui-même les énigmes de chaque famille dans le contenu, rejoue un vrai carillon pour l'écran de réussite, et fixe la date pour les trois événements.

Pour les régénérer, depuis un dossier de travail :

```sh
cd app && npx expo export -p web --output-dir ../work/web && cd ../work && mkdir -p store/out
node ../tools/store/spa.js web &            # sert le build sur http://localhost:8768
node ../tools/store/capture.js               # captures iPhone 430 × 932 @3x → store/app-*.png
W=1032 H=1376 DSF=2 PREFIX=ipad node ../tools/store/capture.js   # idem pour l'iPad
node ../tools/store/compose.js iphone        # → store/out/iphone-01…10.png
node ../tools/store/compose.js iphone65      # → store/out/iphone65-01…10.png (6,5")
node ../tools/store/compose.js iphone63      # → store/out/iphone63-01…10.png (6,3", 1206 × 2622)
node ../tools/store/compose.js ipad          # → store/out/ipad-01…10.png
```

Il faut Playwright (`PLAYWRIGHT=/chemin/vers/playwright`, `CHROMIUM=/chemin/vers/chromium` si besoin).
`saveMock.json` reproduit la progression de la maquette (184 lumières), `save800.json` une partie avancée.

## Vidéo de présentation

Voir `promo/README.md` (storyboard, commandes, conseils App Store Connect).
