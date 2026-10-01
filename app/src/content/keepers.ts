// What each district's keeper says when touched. Asleep, they talk in their
// sleep (the line follows how far the district is lit); awake, a few lines
// in turn. French first; English in i18n/en/world.ts.
export const KEEPER_TALK: Record<string, { asleep: [string, string, string]; awake: string[] }> = {
  biblio: {
    asleep: ['« …chapitre un… il faisait nuit… »', '« …ne pliez pas les pages… merci… »', '« …j’entends tourner des pages… quelqu’un lit ? »'],
    awake: ['« Un livre n’est jamais fini. Il attend qu’on le relise. »', '« J’ai rangé tes lanternes par ordre alphabétique. Enfin, presque. »', '« Chut… les livres du fond dorment encore. »', '« L’Allumeur empruntait toujours des cartes. Il ne les rendait jamais. »'],
  },
  horlo: {
    asleep: ['« …tic… tac… tic… »', '« …encore cinq minutes… ou cinquante ans… »', '« …les rouages chantent… c’est bientôt l’heure ? »'],
    awake: ['« Tu es à l’heure. C’est rare, ici. »', '« Une horloge arrêtée a raison deux fois par jour. Pas moi. »', '« J’ai remonté toutes les pendules. Elles se disputent déjà. »', '« Le temps passe vite quand on rallume une ville. »'],
  },
  serre: {
    asleep: ['« …pousse… doucement… »', '« …quelqu’un a arrosé ? je sens l’eau… »', '« …il fait plus clair… les feuilles s’ouvrent… »'],
    awake: ['« Prends ton temps. Moi, je prends le mien. »', '« Cette fleur a mis trois ans à éclore. Elle avait raison d’attendre. »', '« La lumière, c’est comme l’eau : il en faut un peu chaque jour. »', '« Je suis arrivé en haut de la serre hier. Parti il y a deux ans. »'],
  },
  marche: {
    asleep: ['« …trois pommes contre une chanson… »', '« …dernier prix… vraiment le dernier… »', '« …ça s’anime sur les quais… on ouvre bientôt ? »'],
    awake: ['« Une énigme contre un sourire ? Marché conclu. »', '« Ici, tout se troque. Même les mauvaises idées : on les échange contre des bonnes. »', '« Ta flamme vaut une fortune. Ne la vends jamais. »', '« Le bateau de l’Allumeur ? Je l’ai vu partir. Il chantait. »'],
  },
  theatre: {
    asleep: ['« …le rideau… pas encore… »', '« …qui a soufflé ma réplique ?… »', '« …j’entends le public… il y a du monde ? »'],
    awake: ['« Bravo ! Enfin… c’était toi l’acteur, ce soir. »', '« Chaque ombre a son rôle. Même la tienne. »', '« Psst. La réponse, c’est… non, je ne souffle qu’aux comédiens. »', '« La pièce finit bien. Elles finissent toujours bien, ici. »'],
  },
  obs: {
    asleep: ['« …une étoile… deux étoiles… »', '« …la nuit est trop sombre… quelqu’un rallume le ciel ?… »', '« …je vois une lueur… de l’autre côté… »'],
    awake: ['« La tête en bas, on voit mieux le ciel. Essaie. »', '« Chaque lanterne allumée, je la note dans mon carnet d’étoiles. »', '« La lumière de l’autre côté de la mer clignote plus fort depuis que tu es là. »', '« L’Allumeur regardait ici tous les soirs. Toi aussi, maintenant. »'],
  },
};

/** What the keeper says at the n-th touch: asleep, by how far the district is lit (0–1). */
export function keeperLine(district: string, awake: boolean, share: number, n: number): string | null {
  const t = KEEPER_TALK[district];
  if (!t) return null;
  if (!awake) return t.asleep[share < 1 / 3 ? 0 : share < 2 / 3 ? 1 : 2];
  return t.awake[n % t.awake.length];
}
