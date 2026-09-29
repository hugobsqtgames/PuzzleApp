# Cahier des charges sonore — Lampion

> Pour le sound designer / compositeur. Les noms de fichiers sont ceux attendus par le code
> (`GameAudio/SoundManifest.standard`). La maquette (`prototype/index.html`, section « Son ») fait entendre
> une **esquisse synthétisée** de chaque son : c'est une intention, pas une référence à imiter note pour note.

## Direction
- Nocturne, chaleureux, mystérieux, jamais pressant. Instruments : célesta, harpe, glockenspiel doux, cordes pincées, nappes chaudes ; textures de nuit (eau, vent, grillons lointains).
- **Les réussites sonnent « juste » avec l'ambiance** : chaque quartier a une gamme (tableau ci-dessous) ; les effets de réussite sont livrés dans une tonalité compatible avec toutes les ambiances, ou déclinés par quartier (préféré).
- **Jamais de buzzer, jamais de son culpabilisant.** L'erreur est une information : deux notes douces descendantes.
- Aucun son en boucle agressif ; aucune percussion marquée dans les ambiances.

## Ambiances (boucles sans couture, 2–4 min)
| Fichier | Lieu | Gamme / couleur | Texture |
|---|---|---|---|
| `amb_night` | Démarrage, onboarding | ré, pentatonique ouverte | vent, grillons très lointains |
| `amb_lighthouse` | Le Phare, accueil, carte | ré majeur pentatonique | mer calme, grillons |
| `amb_library` | Bibliothèque Murmurante | fa lydien, papier, souffle | pages, horloge lointaine |
| `amb_clockworks` | Horlogerie | la mineur pentatonique | tic-tac feutré, laiton |
| `amb_glasshouse` | Serre de Verre | fa lydien lumineux | gouttes, vapeur, feuillage |
| `amb_market` | Marché Flottant, défi du jour | do majeur pentatonique | clapotis, bois des barques |
| `amb_theatre` | Théâtre d'Ombres | ré dorien | rideaux, salle vide |
| `amb_observatory` | Observatoire | mi, quartes et quintes | silence étoilé, bourdon grave |

## Effets
| Fichier | Événement | Durée | Vibration associée (côté code) |
|---|---|---|---|
| `sfx_manipulate` | tourner, placer, appuyer dans un puzzle (très fréquent) | < 120 ms | sélection |
| `sfx_error_soft` | validation fausse | ~ 400 ms | erreur |
| `sfx_lantern_lit` | lanterne allumée (arpège montant) | 1–1,5 s | succès |
| `sfx_shards` | Éclats gagnés (cristallin, décroissant) | ~ 300 ms | — |
| `sfx_room_complete` | salle complète (accord + scintillement) | 2–2,5 s | succès |
| `sfx_building_complete` | bâtiment complet, habitant réveillé | 2–3 s | impact doux |
| `sfx_unlock` | déblocage (souffle lumineux montant) | ~ 1 s | impact moyen |
| `sfx_new_district_theme` | nouveau quartier (thème court) | ~ 4 s | impact doux |
| `sfx_hint_whisper` | indice (souffle + note) | ~ 600 ms | — |
| `sfx_locked` | toucher un lieu verrouillé (sourd, bref) | < 250 ms | — |
| `sfx_ui_tap` | clic d'interface (coupé par défaut) | < 60 ms | — |

## Spécifications techniques
- Livraison : WAV 48 kHz / 24 bits (maîtres) ; le build convertit en CAF/AAC.
- Niveaux : ambiances ≈ −23 LUFS intégrés ; effets ≈ −18 LUFS, crêtes ≤ −3 dBFS ; `sfx_manipulate` nettement plus discret (−26 LUFS).
- Boucles : points de bouclage sans clic, fondu interne ; mono ou stéréo étroite (écoute sur haut-parleur de téléphone).
- Tester sur haut-parleur d'iPhone : rien d'important en dessous de 200 Hz.

## Droits
- Œuvres originales, cession des droits d'exploitation pour l'app, ses mises à jour, sa promotion (captures vidéo, bandes-annonces) et ses déclinaisons.
- Si des banques de sons sont utilisées : licence compatible avec une app commerciale, sans attribution obligatoire dans l'interface, **sans** composant soumis à redevance ou à suivi. Fournir la liste des sources et licences (`Content/audio/LICENSES.md`).
