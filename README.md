# Lampion (nom de travail)

Jeu iOS de casse-têtes premium : le joueur rallume, énigme après énigme, les lanternes de Vesper, une ville nocturne endormie. Hors ligne, sans compte, sans collecte de données, sans IA dans le produit.

## État du projet

Phase de conception. **Aucun code d'application n'a encore été écrit.**

| Document | Contenu |
|---|---|
| [PRODUCT_DISCOVERY.md](PRODUCT_DISCOVERY.md) | Vision, marché, concept, différenciation, naming, risques, roadmap |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Identité de marque, direction artistique « Encre & Lueur », tokens, composants, Nilo, icône |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Monde, déblocages, difficulté, 12 familles de puzzles, indices, économie, défi du jour, succès |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Modules Swift, moteur de puzzles, pipeline de contenu, sauvegarde, tests, confidentialité |
| [WIREFRAMES.md](WIREFRAMES.md) | Les 24 écrans, leurs états et la navigation |
| [prototype/index.html](prototype/index.html) | Maquette navigable : direction artistique puis 24 écrans iPhone et iPad, puzzles jouables |

## Ouvrir la maquette

Ouvrir `prototype/index.html` dans un navigateur récent (aucune installation). Les polices système Apple sont utilisées sur iPhone, iPad et Mac ; ailleurs, des polices de repli proches sont chargées.

Les puzzles jouables de la maquette ont été générés puis vérifiés (solution unique) par les scripts de `prototype/verification/` :

```
python3 prototype/verification/generate_lanterns_and_lock.py
python3 prototype/verification/generate_gears.py
```
