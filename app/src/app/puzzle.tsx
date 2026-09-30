import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize, useWide } from '../ui/layout';
import { Scaled } from '../ui/Scaled';
import { useAnimatedValue } from '../ui/motion';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, GlyphCircle, Icon, IconButton, Nilo, Sheet, ShardPill, TierBars, ToggleRow, tap } from '../ui/components';
import { Board, ruleFor } from '../ui/boards';
import { T, R, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES, dailyPuzzle, puzzleFor } from '../game/catalog';
import { HINT_COSTS, MURMURE_COOLDOWN_MS, Session, canSubmit, isComplete, murmureWait, nextHintLevel, play as playMove, redo, startSession, submit, undo } from '../game/session';
import { t } from '../content/strings';
import { look } from '../game/rewards';
import { buildingName, infoOf, locateRoom } from '../game/views';
import { dailyLabel, dateOfDay } from '../ui/dates';
import { roomSlotsOf, slotText } from '../ui/scenes';
import { HintLevel } from '../core/puzzlekit/types';
import { tr, trn, translated } from '../i18n';

const HINT_NAMES = translated(['Murmure', 'Piste', 'Éclairage', 'Solution']);
const HINT_ICONS = ['whisper', 'hint', 'light', 'star'];

/** iPad: width of the left pane, and the phone width the board is drawn at. */
const SIDE_W = 340, BOARD_BASE = 400;

export default function PuzzleScreen() {
  const store = useStore();
  const { state, engine, session, updateSession, finishSession, buyHint, leaveSession, showToast, play, haptic, settings, setSettings, note } = store;
  const { width } = useContentSize();
  const { wide, width: wideWidth } = useWide();
  const [sheet, setSheet] = useState<'hints' | 'pause' | 'rule' | null>(null);
  const [offered, setOffered] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const shake = useAnimatedValue(0);
  const finishing = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Re-render once per second while the Murmure is cooling down.
  useEffect(() => {
    if (!session || session.hint.murmureAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) return <Screen><BackButton label={tr('Accueil')} onPress={() => router.replace('/')} /></Screen>;
  const s = session;
  const fam = FAMILIES[s.code];
  const where = s.kind === 'lantern' ? engine.progression.locate(s.id) : null;
  const info = where ? infoOf(where.district) : null;
  const roomAt = where?.room ? locateRoom(where.room.id) : null;
  const backLabel = s.kind === 'daily' ? tr('Défi du soir') : where?.room ? tr('Salle {0}', [roomAt ? roomAt.index + 1 : '']) : where ? buildingName(where.district, where.district.buildings.indexOf(where.building)) : tr('Accueil');
  const subtitle = s.kind === 'daily'
    ? dailyLabel(dateOfDay(s.id.slice(6)))
    : where?.room && roomAt ? tr('Lanterne {0} · {1}', [where.room.lanterns.findIndex((l) => l.puzzle === s.id) + 1, slotText(roomSlotsOf(where.room.id, where.room.lanterns.length)[where.room.lanterns.findIndex((l) => l.puzzle === s.id)]?.label ?? '')]) : tr('Lanterne-clé');
  // On iPad the board is drawn at its phone size, then scaled up: taps scale with it.
  const boardScale = wide ? Math.min(1.5, (wideWidth - 56 - SIDE_W - 32) / BOARD_BASE) : 1;
  const boardWidth = wide ? BOARD_BASE : Math.min(width, 600) - 32;
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const end = (q: Session, delay: number) => {
    if (finishing.current) return;
    finishing.current = true;
    setCelebrating(true);
    later(() => {
      const r = finishSession(q);
      if (!r) { finishing.current = false; setCelebrating(false); return; }
      play('lanternLit');
      if (r.celebrations.some((c) => (c.kind === 'lanternLit' && c.shards > 0) || (c.kind === 'dailyCompleted' && c.shards > 0))) later(() => play('shards'), 750);
      later(() => router.replace('/success'), 420);
    }, delay);
  };

  const onPlay = (next: any, countsAsMove = true) => {
    if (s.solved || finishing.current) return;
    const q = playMove(s, next, countsAsMove);
    updateSession(q);
    play('manipulate');
    if (isComplete(q)) end(q, 0);
    else if (!fam.answer && engine.progression && FAMILIES[q.code].engine.validate(q.data, q.state).kind === 'invalid') haptic('selection');
  };

  const onSubmit = () => {
    if (finishing.current) return;
    const r = submit(s);
    if (r.correct) { end(s, 0); return; }
    play('error');
    updateSession(r.session);
    Animated.sequence([6, -6, 4, -4, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 60, useNativeDriver: true }))).start();
    if (r.session.wrongAnswers >= 2 && !offered) {
      setOffered(true);
      later(() => showToast(tr('Besoin d’un coup de pouce ? Le Murmure est gratuit.'), 'whisper'), 1200);
    }
  };

  const level = nextHintLevel(s);
  const wait = Math.min(MURMURE_COOLDOWN_MS, murmureWait(s, now));
  const onBuyHint = () => {
    if (level === null) return;
    const r = buyHint(s, level);
    if (!r) return;
    if ('missing' in r) { showToast(tr('Il te manque {0} Éclats. Le Murmure reste gratuit.', [r.missing]), 'shard'); return; }
    play('hint');
    setSheet(null);
    if (level === HintLevel.Solution) {
      const q = r.session;
      if (fam.answer) later(() => end(q, 0), 700);
      else if (isComplete(q)) end(q, 700);
    }
  };

  const leave = () => { leaveSession(); goBack(); };
  const restart = () => {
    const p = s.kind === 'daily' ? dailyPuzzle(s.id.slice(6)) : puzzleFor(s.id);
    if (p) updateSession({ ...startSession(p, s.kind, new Date()), id: s.id, paidHints: s.paidHints, wrongAnswers: s.wrongAnswers, usedSolution: s.usedSolution });
    setSheet(null);
  };

  // Feedback: an error first, then live warnings (state families), then the current hint.
  let feedback: React.ReactNode = null;
  const live = !fam.answer ? fam.engine.validate(s.data, s.state) : null;
  if (s.error) feedback = <Message tone="error" text={s.error.text} />;
  else if (live && live.kind === 'invalid' && live.issues[0]) feedback = <Message tone="error" text={t(live.issues[0].message)} />;
  else if (s.hint.texts.length && !s.hint.stale) feedback = <Message tone="hint" icon={HINT_ICONS[s.hint.level - 1]} title={HINT_NAMES[s.hint.level - 1]} text={s.hint.texts[s.hint.texts.length - 1]} />;
  else if (s.id === 'phare.b1.r1.1') feedback = <Message tone="hint" icon="whisper" text={tr('Touche la lanterne éteinte en haut à gauche.')} />;
  else if (s.code === 'IN') feedback = <Text style={[type.foot, { textAlign: 'center' }]}>{trn(s.moves, '{0} coup', '{0} coups')}</Text>;
  const oops = !!s.error || (live?.kind === 'invalid');
  const mood = celebrating ? 'joy' : oops ? 'oops' : s.hint.level > 0 && !s.hint.stale ? 'hint' : 'think';
  const hintButton = <IconButton name="hint" label={tr('Indices')} size={52} color={T.moon} borderColor="#3d4f7a" onPress={() => setSheet('hints')} />;

  const topBar = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <BackButton label={backLabel} onPress={leave} />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <ShardPill n={state.wallet.balance} />
        <IconButton name="pause" label={tr('Pause')} onPress={() => setSheet('pause')} />
      </View>
    </View>
  );
  const header = (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <GlyphCircle icon={s.code} size={40} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={type.headline}>{fam.name}</Text>
          <TierBars tier={s.tier} />
          <Text style={type.foot}>{TIER_NAMES[s.tier]}</Text>
        </View>
        <Text style={type.foot}>{subtitle}</Text>
      </View>
    </View>
  );
  const rule = (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Text style={[type.body, { flex: 1 }]}>{s.id === 'phare.b1.r1.1' ? tr('Chaque lanterne inverse ses voisines. Allume les quatre.') : ruleFor(s)}</Text>
      <IconButton name="info" label={tr('Règle complète')} onPress={() => setSheet('rule')} />
    </View>
  );
  const board = (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Board s={s} width={boardWidth} onPlay={onPlay} tap={() => tap()} note={note}
        visitRoom={(roomId) => { leaveSession(); router.push({ pathname: '/room/[id]', params: { id: roomId } }); }} />
    </Animated.View>
  );
  const controls = fam.answer ? (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {hintButton}
      <View style={{ flex: 1 }}><Button title={tr('Valider')} disabled={!canSubmit(s)} onPress={onSubmit} /></View>
    </View>
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton name="undo" label={tr('Annuler')} disabled={!s.history.length} onPress={() => updateSession(undo(s))} />
        <IconButton name="redo" label={tr('Rétablir')} disabled={!s.future.length} onPress={() => { const q = redo(s); updateSession(q); if (isComplete(q)) end(q, 0); }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <Nilo size={64} mood={mood} look={look(state)} />
        {hintButton}
      </View>
    </View>
  );

  return (
    <Screen wide={wide} style={{ gap: 12 }} place={s.kind === 'daily' ? 'market' : info?.sound ?? 'lighthouse'}>
      {topBar}
      {wide ? (
        // iPad: the words on the left, the board large on the right.
        <View style={{ flex: 1, flexDirection: 'row', gap: 32 }}>
          <View style={{ width: SIDE_W, gap: 16 }}>
            {header}
            {rule}
            <View style={{ flex: 1 }} />
            <View style={{ minHeight: 48, justifyContent: 'center' }}>{feedback}</View>
            {controls}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
            <Scaled base={BOARD_BASE} k={boardScale}>{board}</Scaled>
          </ScrollView>
        </View>
      ) : (
        <>
          {header}
          {rule}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
            {board}
          </ScrollView>
          <View style={{ minHeight: 48, justifyContent: 'center' }}>{feedback}</View>
          {controls}
        </>
      )}

      <Sheet visible={sheet === 'hints'} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={type.title2}>{tr('Indices')}</Text>
          <ShardPill n={state.wallet.balance} />
        </View>
        {HINT_NAMES.map((name, i) => {
          const reached = !s.hint.stale && s.hint.level > i;
          const isNext = level === i + 1;
          const cost = HINT_COSTS[i], afford = state.wallet.balance >= cost;
          const cooling = i === 0 && wait > 0;
          return (
            <View key={name} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, opacity: !reached && !isNext ? 0.45 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Icon name={HINT_ICONS[i]} size={20} color={reached ? T.moon : T.tx2} />
                  <Text style={type.headline}>{name}</Text>
                </View>
                {reached ? <Icon name="check" size={16} color={T.gold} sw={2} />
                  : isNext ? (
                    <Pressable accessibilityRole="button" disabled={!afford || cooling} onPress={() => { tap(); onBuyHint(); }}
                      style={{ height: 38, paddingHorizontal: 14, borderRadius: R.m, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: afford && !cooling ? 1 : 0.5 }}>
                      {cost ? <Icon name="shard" size={16} color={T.moon} /> : null}
                      <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{cooling ? `${Math.ceil(wait / 1000)} s` : cost ? cost : tr('Gratuit')}</Text>
                    </Pressable>
                  ) : <Text style={type.foot}>{cost ? tr('{0} Éclats', [cost]) : tr('Gratuit')}</Text>}
              </View>
              {reached && s.hint.texts[i] && i < 3 ? <Text style={[type.callout, { marginTop: 8 }]}>{s.hint.texts[i]}</Text> : null}
              {isNext && !afford ? <Text style={[type.foot, { marginTop: 6 }]}>{tr('Il te manque {0} Éclats. Le Murmure reste gratuit, et tu peux jouer une autre lanterne.', [cost - state.wallet.balance])}</Text> : null}
              {isNext && i === 3 ? <Text style={[type.foot, { marginTop: 6 }]}>{tr('La lumière est gagnée, sans le bonus Clairvoyance.')}</Text> : null}
            </View>
          );
        })}
        {s.hint.stale && s.hint.texts.length ? <Text style={[type.foot, { marginTop: 8 }]}>{tr('Tu as avancé : le prochain indice part de ta nouvelle position.')}</Text> : null}
        <Button title={tr('Revenir au puzzle')} kind="ghost" onPress={() => setSheet(null)} style={{ marginTop: 8 }} />
      </Sheet>

      <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 10 }]}>{tr('Pause')}</Text>
        <Button title={tr('Reprendre')} onPress={() => setSheet(null)} />
        <Row icon="info" label={tr('Revoir la règle')} onPress={() => setSheet('rule')} />
        <Row icon="undo" label={tr('Recommencer ce puzzle')} onPress={restart} />
        <ToggleRow icon="music" label={tr('Musique')} value={settings.music} onChange={(v) => setSettings({ music: v })} />
        <ToggleRow icon="sound" label={tr('Effets sonores')} value={settings.effects} onChange={(v) => setSettings({ effects: v })} />
        <Button title={s.kind === 'daily' ? tr('Retour au défi') : where?.room ? tr('Retour à la salle') : tr('Retour au bâtiment')} kind="secondary" onPress={() => { setSheet(null); leave(); }} style={{ marginTop: 12 }} />
        <Text style={[type.foot, { marginTop: 10, textAlign: 'center' }]}>{s.kind === 'daily' ? tr('Le défi reste jouable toute la soirée.') : tr('Ta progression dans ce puzzle est gardée.')}</Text>
      </Sheet>

      <Sheet visible={sheet === 'rule'} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <GlyphCircle icon={s.code} size={48} />
          <Text style={type.title2}>{fam.name}</Text>
        </View>
        <Text style={[type.body, { marginBottom: 10 }]}>{ruleFor(s)}</Text>
        <Text style={[type.sub, { marginBottom: 14 }]}>{RULE_DETAILS[s.code]}</Text>
        <Button title={tr('Compris')} onPress={() => setSheet(null)} />
      </Sheet>
    </Screen>
  );
}

const RULE_DETAILS: Record<string, string> = translated({
  IN: 'Touche un bouton : il change d’état, avec ses voisins. Le compteur montre tes coups ; le nombre minimal s’affiche une fois la lanterne allumée.',
  CA: 'Chaque ligne est un essai. ● : un chiffre juste à la bonne place. ○ : un chiffre juste à la mauvaise place. Tourne les molettes, puis Valider.',
  LA: 'Touche une case : une lampe. Touche encore : un point (« pas de lampe ici »), pour t’aider. Une lampe éclaire sa ligne et sa colonne jusqu’au premier mur.',
  EN: 'Touche une tuile pour la tourner d’un quart de tour (appui long : dans l’autre sens). La lumière suit les conduits reliés. Aucune ouverture ne doit rester dans le vide.',
  SU: 'Trouve la règle qui relie les nombres : écarts, multiplications, suites mêlées… Une seule réponse suit une règle simple. Parfois ce sont des lettres : compte les sauts dans l’alphabet (A = 1, B = 2…).',
  BA: 'Chaque balance est en équilibre : les deux plateaux pèsent autant. Les objets identiques pèsent pareil. Les poids gris indiquent leur valeur.',
  MO: 'Chaque case a une forme, un nombre, un remplissage, une taille. Ligne par ligne, chacun suit sa règle : il reste pareil, avance d’un cran, ou reprend les trois mêmes valeurs dans un autre ordre.',
  ME: 'Touche un personnage pour dire s’il dit vrai ou s’il ment. Un menteur dit toujours faux, jamais à moitié. Quand tout le monde est choisi, Valider.',
  FI: 'Touche une case voisine pour avancer le fil. Touche une case déjà traversée pour revenir en arrière jusqu’à elle. Les traits bruns sont des murs.',
  MI: 'Touche une case vide : miroir /, puis miroir \\, puis rien. Le rayon rebondit sur les miroirs. Les cibles s’allument quand il les traverse.',
  EQ: 'Touche un indice pour le barrer quand tu l’as utilisé. Touche l’objet ou le lieu d’un habitant pour le changer. Chaque objet et chaque lieu ne sert qu’une fois.',
  MA: 'Choisis une pièce en bas, tourne-la si besoin, puis touche une case de la silhouette pour la poser. Touche une pièce posée pour la reprendre.',
  CR: 'La mélodie joue quand tu arrives. Touche les cloches dans le même ordre. Tu peux la réécouter autant de fois que tu veux ; après une fausse note, recommence du début. « À rebours » : rejoue-la en partant de la dernière note.',
  VI: 'Touche le rond au bout d’une ligne ou d’une colonne pour changer son filtre : aucun, rouge, jaune, bleu. Chaque vitre prend la couleur de sa ligne mélangée à celle de sa colonne. Le rond au centre de chaque vitre montre sa couleur d’origine. Les filtres à cadenas sont déjà posés. Une vitre voilée ne montre pas sa couleur : les autres suffisent pour tout retrouver. Réglages › Aide aux couleurs ajoute un motif à chaque couleur.',
  DI: 'Compare les deux images. Touche un endroit où quelque chose a changé : une couleur, un objet, sa taille, son sens, ou un objet qui a disparu. Réglages › Aide aux couleurs donne aussi à chaque couleur son propre trait.',
  ET: 'Chaque indice parle des objets de gauche à droite. Touche deux objets pour les échanger. Quand l’étagère te semble rangée, Valider.',
  OM: 'L’ombre peut avoir tourné d’un quart, d’un demi ou de trois quarts de tour. Elle n’est jamais retournée comme dans un miroir. « Reflet » : c’est l’inverse, le reflet est toujours retourné, et il peut aussi avoir tourné.',
  SC: 'Chaque salle du bâtiment, une fois assez éclairée, montre un chiffre peint dans son décor. Va les chercher, puis compose le code selon la règle du sceau.',
  BR: 'Les nombres d’une ligne sont ses groupes de points, dans l’ordre, avec au moins une case vide entre deux groupes. « Broder » pose un point, « Marquer vide » une croix pour t’en souvenir. Les nombres pâlissent quand leur ligne est juste.',
  SG: 'Chaque chiffre de 1 à la taille du carré apparaît une fois par ligne et une fois par colonne. Un signe entre deux cases dit laquelle est la plus petite : la pointe la désigne. Touche une case, puis un chiffre.',
  TO: 'Chaque hauteur de cheminée apparaît une fois par ligne et une fois par colonne. Un nombre au bord dit combien de cheminées on voit en regardant depuis là : une grande cache toutes les plus petites derrière elle. Touche une case, puis une hauteur.',
  GL: 'Nilo glisse sur la glace jusqu’à ce qu’une caisse ou le bord l’arrête. Il doit s’arrêter pile sur la lanterne. Glisse le doigt sur le canal, ou touche les flèches. Annuler revient d’une glissade.',
  TQ: 'Touche une tuile à côté de la case vide pour la faire glisser. Touche une tuile plus loin sur la même ligne ou colonne : toute la rangée glisse. Range les tuiles de 1 à la dernière, la case vide à la fin.',
  RU: 'Touche une épingle, puis fais glisser le doigt (ou touche case après case) jusqu’à l’épingle de même couleur. Les rubans ne se croisent jamais et doivent couvrir tout le métier. Touche un ruban pour le reprendre à cet endroit.',
  LU: 'Chaque lanterne a sa luciole juste à côté : au-dessus, en dessous, à gauche ou à droite. Deux lucioles ne se touchent jamais, même par un coin. Les nombres comptent les lucioles de chaque ligne et colonne. Touche une case : luciole, puis herbe, puis libre.',
  PA: 'Relie les îlots par des passerelles droites, une ou deux entre deux îlots, qui ne se croisent jamais. Le nombre d’un îlot est son nombre de passerelles. À la fin, tous les îlots doivent être reliés ensemble. Touche un îlot, puis un autre en face.',
});

function Row({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.line }}>
      <Icon name={icon} size={20} color={T.tx2} /><Text style={type.body}>{label}</Text>
    </Pressable>
  );
}

function Message({ tone, text, icon, title }: { tone: 'error' | 'hint'; text: string; icon?: string; title?: string }) {
  const err = tone === 'error';
  return (
    <View accessibilityLiveRegion="polite" style={{
      flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: R.m, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1,
      backgroundColor: err ? 'rgba(232,138,138,0.1)' : 'rgba(143,211,224,0.08)', borderColor: err ? 'rgba(232,138,138,0.5)' : 'rgba(143,211,224,0.45)',
    }}>
      <Icon name={err ? 'x' : icon ?? 'whisper'} size={20} color={err ? T.coral : T.moon} sw={err ? 2 : 1.6} />
      <Text style={{ color: T.tx, fontSize: 15, flex: 1, lineHeight: 20 }}>{title ? <Text style={{ fontWeight: '600' }}>{title} · </Text> : null}{text}</Text>
    </View>
  );
}
