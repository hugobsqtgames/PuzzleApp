// The city of Vesper: places, names and texts (GAME_DESIGN §§ 2, 10, 12).
// The structure (which lantern is where, which family, which tier) comes
// from the generated content pack; this file only names things.

export type DistrictId = 'phare' | 'biblio' | 'horlo' | 'serre' | 'marche' | 'theatre' | 'obs' | 'grenier';

export interface RoomInfo { name: string; object: { name: string; story: string } }
export interface BuildingInfo { name: string; resident: string; residentAwake: string; rooms: RoomInfo[] }
export interface DistrictInfo {
  id: DistrictId;
  name: string;
  short: string;
  hue: string;
  tagline: string;
  /** Main character, woken up when the whole district is lit. */
  keeper?: { name: string; creature: string; line: string };
  buildings: BuildingInfo[];
  sound: 'lighthouse' | 'library' | 'clockworks' | 'glasshouse' | 'market' | 'theatre' | 'observatory';
}

const R = (name: string, object: string, story: string): RoomInfo => ({ name, object: { name: object, story } });

export const DISTRICT_INFO: DistrictInfo[] = [
  {
    id: 'phare', name: 'Le Phare', short: 'Phare', hue: '#F4B45E', tagline: 'Là où tout recommence.', sound: 'lighthouse',
    buildings: [{
      name: 'Le Phare', resident: 'Nilo y a grandi.', residentAwake: 'Le Phare veille à nouveau sur la baie.',
      rooms: [
        R('La Cuisine', 'Clé qui n’ouvre rien', 'Une clé qui n’ouvre aucune porte de Vesper. Pour l’instant.'),
        R('L’Escalier', 'Plume d’encre bleue', 'L’Allumeur écrivait avec. L’encre n’a jamais séché.'),
        R('La Chambre de veille', 'Carte du brouillard', 'Une carte de Vesper où tout est blanc, sauf le Phare.'),
        R('La Lanterne', 'Mèche d’argent', 'La mèche de la grande lanterne. Elle sent encore la fumée.'),
      ],
    }],
  },
  {
    id: 'biblio', name: 'La Bibliothèque Murmurante', short: 'Bibliothèque', hue: '#E7A98B', tagline: 'Là où les livres parlent tout bas.', sound: 'library',
    keeper: { name: 'L’Archiviste', creature: 'Héron à lunettes', line: '« Tout est écrit quelque part. Le problème, c’est où. »' },
    buildings: [
      { name: 'Salle des Cartes', resident: 'Une souris cartographe dort sur un atlas.', residentAwake: 'La souris cartographe redessine la côte.', rooms: [
        R('Le Globe', 'Boussole sans nord', 'Elle indique toujours la lumière la plus proche.'),
        R('Les Portulans', 'Règle de laiton', 'Graduée en pas de héron.'),
        R('La Table des vents', 'Rose des vents brodée', 'Il y manque un vent. On ne sait pas lequel.'),
        R('Le Balcon', 'Longue-vue ébréchée', 'On y voit le Phare à l’envers.'),
      ] },
      { name: 'Scriptorium', resident: 'Un scarabée copiste dort sur son pupitre.', residentAwake: 'Le scarabée copiste reprend sa ligne là où il l’avait laissée.', rooms: [
        R('Les Pupitres', 'Encrier sans fond', 'On y trempe la plume, on n’en touche jamais le fond.'),
        R('L’Atelier d’enluminure', 'Feuille d’or', 'Si fine qu’un soupir l’emporterait.'),
        R('La Reliure', 'Aiguille courbe', 'Pour coudre les livres qui refusent de se fermer.'),
        R('Le Cabinet des brouillons', 'Page arrachée', 'Il y est écrit : « Ne pas oublier de revenir. »'),
      ] },
      { name: 'Tour des Archives', resident: 'Une chouette archiviste dort sur une pile de registres.', residentAwake: 'La chouette range enfin les registres de l’année dernière.', rooms: [
        R('Le Pied de la tour', 'Registre des lumières', 'Chaque lanterne de Vesper y a une ligne.'),
        R('Les Rayonnages', 'Étiquette effacée', 'On devine encore « Ne pas ouvrir avant ».'),
        R('L’Échelle', 'Marque-page de cuir', 'Il marque une page qui n’existe plus.'),
        R('Le Sommet', 'Loupe fêlée', 'Elle grossit surtout les détails qui comptent.'),
      ] },
      { name: 'Salle de Lecture', resident: 'L’Archiviste dort, un livre ouvert sur le bec.', residentAwake: 'L’Archiviste reprend sa lecture, là où la nuit l’avait arrêtée.', rooms: [
        R('Les Fauteuils', 'Coussin de velours', 'Il garde la forme de quelqu’un qui lisait longtemps.'),
        R('La Cheminée', 'Braise endormie', 'Elle se rallume si on lui raconte une histoire.'),
        R('Les Vitraux', 'Éclat de vitrail bleu', 'La lune le traverse et devient verte.'),
        R('La Réserve', 'Livre qui n’existe pas', 'Ses pages sont blanches. Il cherche son auteur.'),
      ] },
    ],
  },
  {
    id: 'horlo', name: 'L’Horlogerie', short: 'Horlogerie', hue: '#D8B56A', tagline: 'Là où le temps s’est arrêté.', sound: 'clockworks',
    keeper: { name: 'L’Horlogère', creature: 'Taupe', line: '« Je suis en retard… depuis quarante ans. »' },
    buildings: [
      { name: 'Atelier des Ressorts', resident: 'Maître Ressort, le grillon de l’atelier, dort sous l’établi.', residentAwake: 'Maître Ressort s’étire et reprend son chant.', rooms: [
        R('La Forge', 'Sablier vide', 'Le sable est parti. Le temps, lui, est resté.'),
        R('L’Établi', 'Ressort qui chante', 'Il vibre quand on s’approche d’une énigme.'),
        R('Le Magasin', 'Boîte à vis', 'Chaque vis porte un numéro. Il en manque une : la 7.'),
        R('La Mansarde', 'Clé de remontoir', 'Elle remonte n’importe quelle horloge. Même les cœurs.'),
      ] },
      { name: 'Tour du Carillon', resident: 'Le carillon attend qu’on le remonte.', residentAwake: 'Le carillon sonne une heure qui n’existe pas encore.', rooms: [
        R('Le Vestibule', 'Corde de cloche', 'Tressée de fil d’or et de patience.'),
        R('Les Rouages', 'Engrenage d’argent', 'Il tourne dans les deux sens à la fois.'),
        R('La Salle des Cloches', 'Battant de bronze', 'Il fredonne quand personne n’écoute.'),
        R('Le Belvédère', 'Aiguille des minutes', 'Tombée du cadran le soir où tout s’est arrêté.'),
      ] },
      { name: 'Salle des Pendules', resident: 'Un loir dort dans le coffre d’une pendule.', residentAwake: 'Le loir remonte les pendules une à une, en bâillant.', rooms: [
        R('Le Balancier', 'Poids de pendule', 'Il pèse exactement le temps qu’on lui donne.'),
        R('Le Cadran', 'Chiffre romain VII', 'Détaché d’un cadran. Il cherche sa place.'),
        R('Le Coucou', 'Plume de coucou', 'Le coucou ne sort plus. Il a laissé ceci.'),
        R('L’Horloge lunaire', 'Lune de laiton', 'Elle affiche une phase qu’on ne voit jamais au ciel.'),
      ] },
      { name: 'Chambre des Automates', resident: 'L’Horlogère dort devant la tour.', residentAwake: 'L’Horlogère se réveille… en retard, bien sûr.', rooms: [
        R('Les Poupées', 'Bobine de fil d’or', 'Elle ne se déroule que vers la lumière.'),
        R('Le Joueur d’échecs', 'Cavalier d’ébène', 'Il ne se déplace qu’en L. Même dans une poche.'),
        R('La Danseuse', 'Clé de musique', 'Elle joue trois notes. Toujours les mêmes, jamais dans le même ordre.'),
        R('Le Cœur de l’automate', 'Cœur de laiton', 'Il bat une fois par soir.'),
      ] },
    ],
  },
  {
    id: 'serre', name: 'La Serre de Verre', short: 'Serre de Verre', hue: '#7FC8A9', tagline: 'Là où la lumière pousse.', sound: 'glasshouse',
    keeper: { name: 'Le Jardinier', creature: 'Escargot', line: '« Les plantes ne se pressent pas. Et pourtant, elles arrivent en haut. »' },
    buildings: [
      { name: 'Orangerie', resident: 'Une abeille dort au cœur d’une fleur fermée.', residentAwake: 'L’abeille repart butiner les fleurs de lumière.', rooms: [
        R('Les Orangers', 'Orange de verre', 'Elle ne mûrit qu’au clair de lune.'),
        R('La Fontaine', 'Goutte figée', 'Une goutte d’eau qui a oublié de tomber.'),
        R('Les Bancs', 'Graine de lumière', 'Elle ne pousse que si quelqu’un d’autre l’arrose.'),
        R('La Verrière', 'Carreau irisé', 'Il décompose la lumière en couleurs qu’on n’a pas de nom.'),
      ] },
      { name: 'Bassin aux Nénuphars', resident: 'Une grenouille dort sur une feuille de nénuphar.', residentAwake: 'La grenouille chante la lune, sans fausse note.', rooms: [
        R('La Rive', 'Galet chaud', 'Il garde la chaleur d’un soleil qu’on n’a pas vu depuis longtemps.'),
        R('Le Ponton', 'Rame miniature', 'Pour une barque qui n’existe pas encore.'),
        R('Les Nénuphars', 'Fleur de nénuphar', 'Elle s’ouvre quand on chuchote.'),
        R('Le Fond du bassin', 'Poisson de verre', 'Il nage dans la paume, sans eau.'),
      ] },
      { name: 'Pépinière', resident: 'Un hérisson dort dans un pot de terre.', residentAwake: 'Le hérisson rempote les jeunes pousses avec soin.', rooms: [
        R('Les Semis', 'Sachet de graines', 'L’étiquette dit : « Surprise ».'),
        R('Les Boutures', 'Sécateur rouillé', 'Il ne coupe que ce qui doit repousser.'),
        R('Le Terreau', 'Ver luisant', 'Il a éclairé la pépinière tout seul pendant quarante ans.'),
        R('La Serre chaude', 'Arrosoir percé', 'Il arrose quand même. Autrement.'),
      ] },
      { name: 'Palmarium', resident: 'Le Jardinier dort sous une palme.', residentAwake: 'Le Jardinier se réveille. Lentement. Très lentement.', rooms: [
        R('Les Palmiers', 'Noix de coco creuse', 'On y entend la mer. Une mer lointaine.'),
        R('Les Lianes', 'Liane nouée', 'Chaque nœud est un souvenir.'),
        R('La Passerelle', 'Coquille d’escargot', 'Le Jardinier l’a laissée là. Il en a une autre.'),
        R('La Canopée', 'Fleur de minuit', 'Elle ne fleurit qu’une fois. Ce soir.'),
      ] },
    ],
  },
  {
    id: 'marche', name: 'Le Marché Flottant', short: 'Marché Flottant', hue: '#EE8A6B', tagline: 'Là où tout s’échange.', sound: 'market',
    keeper: { name: 'La Marchande', creature: 'Loutre', line: '« Tout s’échange. Même une bonne idée. Surtout une bonne idée. »' },
    buildings: [
      { name: 'Pont des Épices', resident: 'Un raton laveur dort entre deux sacs de cannelle.', residentAwake: 'Le raton laveur trie les épices par couleur.', rooms: [
        R('Les Étals', 'Bâton de cannelle', 'Il sent le soir d’hiver.'),
        R('Les Balances', 'Poids de cuivre', 'Il pèse un peu plus lourd le mardi.'),
        R('Les Sacs', 'Poivre de lune', 'Une pincée, et les rêves ont du goût.'),
        R('Le Parapet', 'Cordage salé', 'Il retient les barques et les souvenirs.'),
      ] },
      { name: 'Barque du Changeur', resident: 'Un martin-pêcheur dort sur la proue.', residentAwake: 'Le martin-pêcheur recompte ses pièces étrangères.', rooms: [
        R('La Proue', 'Pièce trouée', 'D’un pays dont personne ne se souvient.'),
        R('Le Comptoir', 'Boulier de nacre', 'Il compte juste, même quand on se trompe.'),
        R('La Cale', 'Coffret de sel', 'Le sel de la mer d’en face.'),
        R('La Poupe', 'Lanterne de barque', 'Elle éclaire toujours l’autre rive.'),
      ] },
      { name: 'Halle aux Poids', resident: 'Un blaireau dort sur une balance.', residentAwake: 'Le blaireau vérifie chaque poids, deux fois.', rooms: [
        R('Le Grand Plateau', 'Plume de plomb', 'Aussi lourde qu’une plume. C’est-à-dire très.'),
        R('Les Étalons', 'Poids-étalon', 'Le poids exact d’une promesse tenue.'),
        R('Le Registre', 'Livre des comptes', 'Toutes les dettes y sont effacées.'),
        R('La Galerie', 'Balance de poche', 'Elle penche toujours du côté de la vérité.'),
      ] },
      { name: 'Quai des Lampions', resident: 'La Marchande dort dans sa barque.', residentAwake: 'La Marchande se réveille… et te propose déjà un marché.', rooms: [
        R('Le Quai', 'Lampion de papier', 'Plié par quelqu’un qui attendait un bateau.'),
        R('Les Amarres', 'Nœud de marin', 'Il se défait tout seul quand il faut partir.'),
        R('La Criée', 'Coquillage à écouter', 'On y entend les enchères d’il y a cent ans.'),
        R('Le Bout du quai', 'Billet pour l’autre rive', 'Aller simple. Date illisible.'),
      ] },
    ],
  },
  {
    id: 'theatre', name: 'Le Théâtre d’Ombres', short: 'Théâtre d’Ombres', hue: '#C39BD3', tagline: 'Là où les ombres jouent.', sound: 'theatre',
    keeper: { name: 'Le Souffleur', creature: 'Pangolin', line: '« Je ne mens jamais. Sauf sur scène. Et parfois dans les coulisses. »' },
    buildings: [
      { name: 'Foyer', resident: 'Une chatte ouvreuse dort sur un fauteuil rouge.', residentAwake: 'La chatte ouvreuse te montre ta place, au premier rang.', rooms: [
        R('Le Vestiaire', 'Ticket numéro 0', 'Pour une représentation qui n’a pas encore eu lieu.'),
        R('Le Grand Escalier', 'Gant de velours', 'Un seul. L’autre est peut-être sur scène.'),
        R('Le Bar', 'Verre de cristal', 'Il sonne comme un rideau qui s’ouvre.'),
        R('Les Loges', 'Programme jauni', 'La distribution est écrite à l’encre invisible.'),
      ] },
      { name: 'Coulisses', resident: 'Une araignée machiniste dort dans les cintres.', residentAwake: 'L’araignée machiniste retend tous les fils du décor.', rooms: [
        R('Les Cintres', 'Poulie grinçante', 'Elle grince juste au bon moment.'),
        R('Les Décors', 'Lune en carton', 'Plus brillante que la vraie, les soirs de première.'),
        R('Les Accessoires', 'Couronne de papier', 'Elle fait de n’importe qui un roi. Pour un acte.'),
        R('La Machinerie', 'Manivelle', 'Elle fait tourner le décor… et parfois la tête.'),
      ] },
      { name: 'Loge du Souffleur', resident: 'Un loriot dort dans le trou du souffleur.', residentAwake: 'Le loriot répète toutes les répliques, en chantant.', rooms: [
        R('Le Trou', 'Cahier de répliques', 'Toutes les répliques oubliées de Vesper.'),
        R('Le Miroir', 'Pinceau de maquillage', 'Il dessine des sourires qui tiennent toute la nuit.'),
        R('La Malle', 'Masque sans visage', 'Il prend le visage de celui qui le porte.'),
        R('Le Recoin', 'Chandelle de répétition', 'Elle ne brûle que pendant les répétitions.'),
      ] },
      { name: 'Grande Scène', resident: 'Le Souffleur dort, roulé en boule.', residentAwake: 'Le Souffleur déroule sa carapace et souffle la réplique suivante.', rooms: [
        R('L’Avant-scène', 'Rideau de soie', 'Un morceau de rideau, doux comme un applaudissement.'),
        R('La Fosse', 'Baguette de chef', 'Elle dirige même le silence.'),
        R('Les Projecteurs', 'Filtre de couleur', 'Il transforme la nuit en aube.'),
        R('Le Plateau', 'Ombre chinoise', 'Une ombre découpée. Elle bouge quand on ne regarde pas.'),
      ] },
    ],
  },
  {
    id: 'obs', name: 'L’Observatoire', short: 'Observatoire', hue: '#8FB8F0', tagline: 'Là où l’on voit loin.', sound: 'observatory',
    keeper: { name: 'L’Astronome', creature: 'Chauve-souris', line: '« D’ici, c’est vous qui êtes la tête en bas. »' },
    buildings: [
      { name: 'Salle des Lentilles', resident: 'Une libellule dort sur une lentille.', residentAwake: 'La libellule polit les lentilles avec ses ailes.', rooms: [
        R('Le Polissoir', 'Lentille parfaite', 'Elle montre les choses telles qu’elles pourraient être.'),
        R('Le Prisme', 'Arc-en-ciel en poudre', 'À manipuler avec précaution.'),
        R('Les Miroirs', 'Miroir de poche', 'Il reflète la lumière qu’on n’a pas encore allumée.'),
        R('Le Banc d’optique', 'Rayon captif', 'Un rayon de lumière, enfermé dans du verre.'),
      ] },
      { name: 'Coupole', resident: 'Une chouette effraie dort sur le télescope.', residentAwake: 'La chouette effraie ouvre la coupole sur les étoiles.', rooms: [
        R('Le Télescope', 'Oculaire de cuivre', 'On y voit une ville lointaine, allumée.'),
        R('La Rotonde', 'Carte du ciel', 'Une étoile y est entourée à l’encre bleue.'),
        R('Le Mécanisme', 'Manivelle de coupole', 'Elle fait tourner le ciel. Un peu.'),
        R('L’Ouverture', 'Poussière d’étoile', 'Elle brille encore, dans un flacon.'),
      ] },
      { name: 'Bibliothèque des Astres', resident: 'Un hibou astronome dort sur un almanach.', residentAwake: 'Le hibou recommence à compter les étoiles.', rooms: [
        R('Les Almanachs', 'Almanach de l’an prochain', 'Toutes les pages sont vides, sauf une.'),
        R('Les Globes célestes', 'Constellation de verre', 'Elle ne correspond à aucun ciel connu.'),
        R('Les Registres', 'Journal de bord', 'La dernière entrée : « Une lumière, de l’autre côté. »'),
        R('Le Pupitre', 'Compas d’étoiles', 'Il trace des cercles parfaits entre deux étoiles.'),
      ] },
      { name: 'Chambre Noire', resident: 'L’Astronome dort la tête en bas.', residentAwake: 'L’Astronome se réveille et te salue, la tête en bas.', rooms: [
        R('Le Sténopé', 'Épingle de lumière', 'Un trou si fin qu’il laisse passer le monde entier.'),
        R('Les Plaques', 'Plaque photographique', 'Elle montre le Phare allumé. Avant ou après ?'),
        R('Le Bain', 'Flacon de nuit', 'Une nuit liquide, sans étoiles.'),
        R('Le Rideau', 'Rayon de lune plié', 'On le déplie les soirs sans lune.'),
      ] },
    ],
  },
  {
    id: 'grenier', name: 'Le Grenier de l’Allumeur', short: 'Grenier', hue: '#FFD98E', tagline: 'Là où tout a commencé.', sound: 'lighthouse',
    buildings: [{
      name: 'Le Grenier', resident: 'Le Grenier attend depuis longtemps.', residentAwake: 'Le Grenier s’est souvenu.',
      rooms: [R('Le Grenier', 'Flamme de l’Allumeur', 'La première flamme de Vesper. Elle attendait Nilo.')],
    }],
  },
];

export const DISTRICT_BY_ID = Object.fromEntries(DISTRICT_INFO.map((d) => [d.id, d])) as Record<DistrictId, DistrictInfo>;

/**
 * Letters of the Lamplighter (GAME_DESIGN § 12.3). The Phare letter is found
 * when the Phare is fully lit; one letter per district (Bibliothèque →
 * Observatoire) with the keystone of its 4th building — these six open the
 * Grenier (4 of 6 needed); the last one is the finale.
 * Design fix: the arc listed 7 letters but 6 districts give one, and the
 * Observatoire had none; it now has its own.
 */
export const LETTERS: { from: DistrictId; title: string; text: string }[] = [
  { from: 'phare', title: 'Première lettre', text: 'Si tu lis ceci, c’est que ta flamme tient bon. Je savais que quelqu’un finirait par monter l’escalier. Rallume la ville, doucement. Elle t’attendra.' },
  { from: 'biblio', title: 'Deuxième lettre', text: 'J’ai cherché dans toute la Bibliothèque un livre qui n’existe pas : la carte de ce qu’il y a au-delà du brouillard. Je ne l’ai pas trouvé. Alors j’ai décidé de l’écrire moi-même.' },
  { from: 'horlo', title: 'Troisième lettre', text: 'J’ai arrêté les horloges. Pas pour toujours : juste le temps que la ville m’attende. Quand tu les entendras repartir, c’est que tu seras presque arrivé.' },
  { from: 'serre', title: 'Quatrième lettre', text: 'J’ai planté une graine de lumière dans la Serre. Elle ne pousse que si quelqu’un d’autre l’arrose. Merci de l’avoir arrosée.' },
  { from: 'marche', title: 'Cinquième lettre', text: 'La Marchande m’a fait un bon prix. J’ai échangé ma flamme contre un bateau. C’était la seule façon de traverser. Ne lui en veux pas : elle a gardé la flamme pour toi.' },
  { from: 'theatre', title: 'Sixième lettre', text: 'Je n’ai pas disparu. Je suis parti rallumer une autre ville, de l’autre côté de la mer. Quand Vesper brillera assez fort, je la verrai d’ici.' },
  { from: 'obs', title: 'Septième lettre', text: 'Depuis la Coupole, j’ai vu une lumière de l’autre côté de la mer. Elle clignote, comme si elle cherchait quelqu’un. Je crois qu’elle me cherche. Je crois qu’un jour, elle te cherchera aussi.' },
  { from: 'grenier', title: 'Dernière lettre', text: 'Je savais que tu y arriverais. Monte au sommet du Phare, et laisse ta flamme faire le reste. Regarde la mer. Quelqu’un va te répondre.' },
];
