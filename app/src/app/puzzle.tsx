import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, GlyphCircle, Icon, IconButton, Nilo, Sheet, ShardPill, TierBars, ToggleRow, tap } from '../ui/components';
import { Board, ruleFor } from '../ui/boards';
import { T, R, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES } from '../game/catalog';
import { HINT_COSTS, Session, canSubmit, isComplete, murmureWait, nextHintLevel, play as playMove, redo, startSession, submit, undo } from '../game/session';
import { t } from '../content/strings';
import { look } from '../game/rewards';
import { buildingName, infoOf, locateRoom } from '../game/views';
import { dailyLabel, dateOfDay } from '../ui/dates';
import { slotObject } from '../ui/art';
import { puzzleFor, dailyPuzzle } from '../game/catalog';
import { HintLevel } from '../core/puzzlekit/types';

const HINT_NAMES = ['Murmure', 'Piste', 'Éclairage', 'Solution'];
const HINT_ICONS = ['whisper', 'hint', 'light', 'star'];

export default function PuzzleScreen() {
  const store = useStore();
  const { state, engine, session, updateSession, finishSession, buyHint, leaveSession, showToast, play, haptic, settings, setSettings } = store;
  const { width } = useWindowDimensions();
  const [sheet, setSheet] = useState<'hints' | 'pause' | 'rule' | null>(null);
  const [offered, setOffered] = useState(false);
  const [, force] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;
  const finishing = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Re-render once per second while the Murmure is cooling down.
  useEffect(() => {
    if (!session || murmureWait(session, Date.now()) === 0) return;
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) return <Screen><BackButton label="Accueil" onPress={() => router.replace('/')} /></Screen>;
  const s = session;
  const fam = FAMILIES[s.code];
  const where = s.kind === 'lantern' ? engine.progression.locate(s.id) : null;
  const info = where ? infoOf(where.district) : null;
  const roomAt = where?.room ? locateRoom(where.room.id) : null;
  const backLabel = s.kind === 'daily' ? 'Défi du soir' : where?.room ? `Salle ${roomAt ? roomAt.index + 1 : ''}` : where ? buildingName(where.district, where.district.buildings.indexOf(where.building)) : 'Accueil';
  const subtitle = s.kind === 'daily'
    ? dailyLabel(dateOfDay(s.id.slice(6)))
    : where?.room && roomAt ? `Lanterne ${where.room.lanterns.findIndex((l) => l.puzzle === s.id) + 1} · ${slotObject(where.room.lanterns.length, where.room.lanterns.findIndex((l) => l.puzzle === s.id))}` : 'Lanterne-clé';
  const boardWidth = Math.min(width, 600) - 32;
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const end = (q: Session, delay: number) => {
    if (finishing.current) return;
    finishing.current = true;
    later(() => {
      const r = finishSession(q);
      if (!r) { finishing.current = false; return; }
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
      later(() => showToast('Besoin d’un coup de pouce ? Le Murmure est gratuit.', 'whisper'), 1200);
    }
  };

  const level = nextHintLevel(s);
  const wait = murmureWait(s, Date.now());
  const onBuyHint = () => {
    if (level === null) return;
    const r = buyHint(s, level);
    if (!r) return;
    if ('missing' in r) { showToast(`Il te manque ${r.missing} Éclats. Le Murmure reste gratuit.`, 'shard'); return; }
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
  else if (s.id === 'phare.b1.r1.1') feedback = <Message tone="hint" icon="whisper" text="Touche la lanterne éteinte en haut à gauche." />;
  else if (s.code === 'IN') feedback = <Text style={[type.foot, { textAlign: 'center' }]}>{s.moves} coup{s.moves > 1 ? 's' : ''}</Text>;
  const oops = !!s.error || (live?.kind === 'invalid');
  const mood = oops ? 'oops' : s.hint.level > 0 && !s.hint.stale ? 'hint' : 'think';
  const hintButton = <IconButton name="hint" label="Indices" size={52} color={T.moon} borderColor="#3d4f7a" onPress={() => setSheet('hints')} />;

  return (
    <Screen style={{ gap: 12 }} place={s.kind === 'daily' ? 'market' : info?.sound ?? 'lighthouse'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton label={backLabel} onPress={leave} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ShardPill n={state.wallet.balance} />
          <IconButton name="pause" label="Pause" onPress={() => setSheet('pause')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <GlyphCircle icon={s.code} size={40} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={type.headline}>{fam.name}</Text>
            <TierBars tier={s.tier} />
            <Text style={type.foot}>{TIER_NAMES[s.tier]}</Text>
          </View>
          <Text style={type.foot}>{subtitle}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Text style={[type.body, { flex: 1 }]}>{s.id === 'phare.b1.r1.1' ? 'Chaque lanterne inverse ses voisines. Allume les quatre.' : ruleFor(s)}</Text>
        <IconButton name="info" label="Règle complète" onPress={() => setSheet('rule')} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          <Board s={s} width={boardWidth} onPlay={onPlay} tap={() => tap()} />
        </Animated.View>
      </ScrollView>

      <View style={{ minHeight: 48, justifyContent: 'center' }}>{feedback}</View>

      {fam.answer ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {hintButton}
          <View style={{ flex: 1 }}><Button title="Valider" disabled={!canSubmit(s)} onPress={onSubmit} /></View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton name="undo" label="Annuler" disabled={!s.history.length} onPress={() => updateSession(undo(s))} />
            <IconButton name="redo" label="Rétablir" disabled={!s.future.length} onPress={() => { const q = redo(s); updateSession(q); if (isComplete(q)) end(q, 0); }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Nilo size={64} mood={mood} look={look(state)} />
            {hintButton}
          </View>
        </View>
      )}

      <Sheet visible={sheet === 'hints'} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={type.title2}>Indices</Text>
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
                      <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{cooling ? `${Math.ceil(wait / 1000)} s` : cost ? cost : 'Gratuit'}</Text>
                    </Pressable>
                  ) : <Text style={type.foot}>{cost ? `${cost} Éclats` : 'Gratuit'}</Text>}
              </View>
              {reached && s.hint.texts[i] && i < 3 ? <Text style={[type.callout, { marginTop: 8 }]}>{s.hint.texts[i]}</Text> : null}
              {isNext && !afford ? <Text style={[type.foot, { marginTop: 6 }]}>Il te manque {cost - state.wallet.balance} Éclats. Le Murmure reste gratuit, et tu peux jouer une autre lanterne.</Text> : null}
              {isNext && i === 3 ? <Text style={[type.foot, { marginTop: 6 }]}>La lumière est gagnée, sans le bonus Clairvoyance.</Text> : null}
            </View>
          );
        })}
        {s.hint.stale && s.hint.texts.length ? <Text style={[type.foot, { marginTop: 8 }]}>Tu as avancé : le prochain indice part de ta nouvelle position.</Text> : null}
        <Button title="Revenir au puzzle" kind="ghost" onPress={() => setSheet(null)} style={{ marginTop: 8 }} />
      </Sheet>

      <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 10 }]}>Pause</Text>
        <Button title="Reprendre" onPress={() => setSheet(null)} />
        <Row icon="info" label="Revoir la règle" onPress={() => setSheet('rule')} />
        <Row icon="undo" label="Recommencer ce puzzle" onPress={restart} />
        <ToggleRow icon="music" label="Musique" value={settings.music} onChange={(v) => setSettings({ music: v })} />
        <ToggleRow icon="sound" label="Effets sonores" value={settings.effects} onChange={(v) => setSettings({ effects: v })} />
        <Button title={s.kind === 'daily' ? 'Retour au défi' : 'Retour à la salle'} kind="secondary" onPress={() => { setSheet(null); leave(); }} style={{ marginTop: 12 }} />
        <Text style={[type.foot, { marginTop: 10, textAlign: 'center' }]}>{s.kind === 'daily' ? 'Le défi reste jouable toute la soirée.' : 'Ta progression dans ce puzzle est gardée.'}</Text>
      </Sheet>

      <Sheet visible={sheet === 'rule'} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <GlyphCircle icon={s.code} size={48} />
          <Text style={type.title2}>{fam.name}</Text>
        </View>
        <Text style={[type.body, { marginBottom: 10 }]}>{ruleFor(s)}</Text>
        <Text style={[type.sub, { marginBottom: 14 }]}>{RULE_DETAILS[s.code]}</Text>
        <Button title="Compris" onPress={() => setSheet(null)} />
      </Sheet>
    </Screen>
  );
}

const RULE_DETAILS: Record<string, string> = {
  IN: 'Touche un bouton : il change d’état, avec ses voisins. Le compteur montre tes coups ; le nombre minimal s’affiche une fois la lanterne allumée.',
  CA: 'Chaque ligne est un essai. ● : un chiffre juste à la bonne place. ○ : un chiffre juste à la mauvaise place. Tourne les molettes, puis Valider.',
  LA: 'Touche une case : une lampe. Touche encore : un point (« pas de lampe ici »), pour t’aider. Une lampe éclaire sa ligne et sa colonne jusqu’au premier mur.',
  EN: 'Touche une tuile pour la tourner d’un quart de tour (appui long : dans l’autre sens). La lumière suit les conduits reliés. Aucune ouverture ne doit rester dans le vide.',
  SU: 'Trouve la règle qui relie les nombres : écarts, multiplications, suites mêlées… Une seule réponse suit une règle simple.',
  BA: 'Chaque balance est en équilibre : les deux plateaux pèsent autant. Les objets identiques pèsent pareil. Les poids gris indiquent leur valeur.',
};

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
