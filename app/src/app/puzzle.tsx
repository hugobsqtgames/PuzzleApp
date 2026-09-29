import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { BackButton, Button, GlyphCircle, Icon, IconButton, Nilo, Sheet, ShardPill, TierBars, tap } from '../ui/components';
import { Board, BoardActions } from '../ui/boards';
import { T, R, type } from '../ui/theme';
import { FAMILIES, HINT_COST, HINT_NAMES, ROOM_SLOTS, TIERS } from '../content/vesperDemo';
import { lampsState } from '../content/prototypePuzzles';
import {
  ANSWER_KINDS, Puzzle, buyHint, canValidate, checkAuto, chooseOption, cycleLamp, hintText,
  makePuzzle, pressSwitch, redo, rotateTile, turnWheel, typeKey, undo, validateAnswer,
} from '../state/session';
import { dailyLabel } from '../ui/dates';

const HINT_ICONS = ['whisper', 'hint', 'light', 'star'];

export default function PuzzleScreen() {
  const { game, puzzle, setPuzzle, complete, spend, showToast } = useGame();
  const { width } = useWindowDimensions();
  const [sheet, setSheet] = useState<'hints' | 'pause' | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const finishing = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!puzzle) {
    return (
      <Screen>
        <BackButton label="Accueil" onPress={() => router.replace('/')} />
      </Screen>
    );
  }
  const p = puzzle;
  const fam = FAMILIES[p.family];
  const isAnswer = ANSWER_KINDS.includes(p.kind);
  const backLabel = p.daily ? 'Défi du soir' : p.tuto ? 'Le Phare' : 'Salle 2';
  const boardWidth = Math.min(width, 600) - 32;

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const end = (q: Puzzle, delay: number) => {
    if (finishing.current) return;
    finishing.current = true;
    later(() => {
      if (complete(q)) {
        tap('success');
        later(() => router.replace('/success'), 420);
      }
    }, delay);
  };

  const move = (q: Puzzle) => {
    if (p.solved || finishing.current) return;
    setPuzzle(q);
    if (checkAuto(q)) end(q, 0);
  };

  const actions: BoardActions = {
    rotate: (r, c) => move(rotateTile(p, r, c)),
    press: (r, c) => move(pressSwitch(p, r, c)),
    lamp: (r, c) => move(cycleLamp(p, r, c)),
    wheel: (i, d) => move(turnWheel(p, i, d)),
    option: (v) => move(chooseOption(p, v)),
    key: (k) => move(typeKey(p, k)),
  };

  const onValidate = () => {
    if (finishing.current) return;
    const res = validateAnswer(p);
    if (res.ok) { end(p, 0); return; }
    tap('error');
    setPuzzle(res.puzzle);
    Animated.sequence([6, -6, 4, -4, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 60, useNativeDriver: true }))).start();
  };

  const onBuyHint = () => {
    const res = buyHint(p, game.shards);
    if (!res) return;
    spend(res.cost);
    setPuzzle(res.puzzle);
    if (res.puzzle.hl === 4) { setSheet(null); end(res.puzzle, 700); }
    else setSheet(null);
  };

  // Feedback line (errors first, then the current hint, then helpers).
  let feedback: React.ReactNode = null;
  const lampState = p.kind === 'LA' ? lampsState(p.c) : null;
  if (p.err) feedback = <Message tone="error" text={p.err} />;
  else if (lampState && lampState.conflicts.size) feedback = <Message tone="error" text="Ces deux lampes se voient : une seule peut rester." />;
  else if (lampState && lampState.over) feedback = <Message tone="error" text={`Ce mur veut ${lampState.over.need} lampe${lampState.over.need > 1 ? 's' : ''}, il en a ${lampState.over.have}.`} />;
  else if (p.hl > 0 && p.hl < 4) feedback = <Message tone="hint" icon={HINT_ICONS[p.hl - 1]} title={HINT_NAMES[p.hl - 1]} text={hintText(p, p.hl - 1)} />;
  else if (p.kind === 'TUTO') feedback = <Message tone="hint" icon="whisper" text="Touche la lanterne éteinte en haut à gauche." />;
  else if (p.kind === 'IN') feedback = <Text style={[type.foot, { textAlign: 'center' }]}>{p.moves} coup{p.moves > 1 ? 's' : ''}</Text>;

  const oops = !!p.err || !!(lampState && (lampState.conflicts.size || lampState.over));
  const mood = oops ? 'oops' : p.hl > 0 && p.hl < 4 ? 'hint' : 'think';
  const hintButton = <IconButton name="hint" label="Indices" size={52} color={T.moon} borderColor="#3d4f7a" onPress={() => setSheet('hints')} />;

  return (
    <Screen style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton label={backLabel} onPress={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ShardPill n={game.shards} />
          <IconButton name="pause" label="Pause" onPress={() => setSheet('pause')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <GlyphCircle icon={p.family} size={40} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={type.headline}>{fam.name}</Text>
            <TierBars tier={p.tier} />
            <Text style={type.foot}>{TIERS[p.tier]}</Text>
          </View>
          <Text style={type.foot}>{p.slot != null ? `Lanterne ${p.slot + 1} · ${ROOM_SLOTS[p.slot].obj}` : p.daily ? dailyLabel() : 'Première lanterne'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Text style={[type.body, { flex: 1 }]}>{p.kind === 'TUTO' ? 'Chaque lanterne inverse ses voisines. Allume les quatre.' : fam.rule}</Text>
        <IconButton name="info" label="Règle complète" onPress={() => showToast('Règle complète et démonstration animée : dans une prochaine version.')} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          <Board p={p} width={boardWidth} a={actions} />
        </Animated.View>
      </ScrollView>

      <View style={{ minHeight: 48, justifyContent: 'center' }}>{feedback}</View>

      {isAnswer ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {hintButton}
          <View style={{ flex: 1 }}><Button title="Valider" disabled={!canValidate(p)} onPress={onValidate} /></View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton name="undo" label="Annuler" disabled={!p.history.length} onPress={() => setPuzzle(undo(p))} />
            <IconButton name="redo" label="Rétablir" disabled={!p.future.length} onPress={() => move(redo(p))} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Nilo size={64} mood={mood} flame={game.flame} hat={game.hat} />
            {hintButton}
          </View>
        </View>
      )}

      <Sheet visible={sheet === 'hints'} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={type.title2}>Indices</Text>
          <ShardPill n={game.shards} />
        </View>
        {HINT_NAMES.map((name, i) => {
          const got = p.hl > i, next = p.hl === i, cost = HINT_COST[i], afford = game.shards >= cost;
          return (
            <View key={name} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, opacity: !got && !next ? 0.45 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Icon name={HINT_ICONS[i]} size={20} color={got ? T.moon : T.tx2} />
                  <Text style={type.headline}>{name}</Text>
                </View>
                {got ? <Icon name="check" size={16} color={T.gold} sw={2} />
                  : next ? (
                    <Pressable
                      accessibilityRole="button" disabled={!afford} onPress={() => { tap(); onBuyHint(); }}
                      style={{ height: 38, paddingHorizontal: 14, borderRadius: R.m, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: afford ? 1 : 0.5 }}
                    >
                      {cost ? <Icon name="shard" size={16} color={T.moon} /> : null}
                      <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{cost ? cost : 'Gratuit'}</Text>
                    </Pressable>
                  ) : <Text style={type.foot}>{cost ? `${cost} Éclats` : 'Gratuit'}</Text>}
              </View>
              {got && i < 3 ? <Text style={[type.callout, { marginTop: 8 }]}>{hintText(p, i)}</Text> : null}
              {next && !afford ? <Text style={[type.foot, { marginTop: 6 }]}>Il te manque {cost - game.shards} Éclats. Le Murmure reste gratuit, et tu peux jouer une autre lanterne.</Text> : null}
            </View>
          );
        })}
        <Button title="Revenir au puzzle" kind="ghost" onPress={() => setSheet(null)} style={{ marginTop: 8 }} />
      </Sheet>

      <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 10 }]}>Pause</Text>
        <Button title="Reprendre" onPress={() => setSheet(null)} />
        <Pressable accessibilityRole="button" onPress={() => { tap(); setSheet(null); showToast('Règle et démonstration : dans une prochaine version.'); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.line, marginTop: 8 }}>
          <Icon name="info" size={20} color={T.tx2} /><Text style={type.body}>Revoir la règle</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => { tap(); setSheet(null); setPuzzle(makePuzzle(p.kind, { slot: p.slot, tier: p.tier, daily: p.daily, tuto: p.tuto })); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14 }}>
          <Icon name="undo" size={20} color={T.tx2} /><Text style={type.body}>Recommencer ce puzzle</Text>
        </Pressable>
        <Button title={p.daily ? 'Retour au défi' : 'Retour à la salle'} kind="secondary" onPress={() => { setSheet(null); router.back(); }} style={{ marginTop: 12 }} />
        <Text style={[type.foot, { marginTop: 10, textAlign: 'center' }]}>Ta progression dans ce puzzle est gardée.</Text>
      </Sheet>
    </Screen>
  );
}

function Message({ tone, text, icon, title }: { tone: 'error' | 'hint'; text: string; icon?: string; title?: string }) {
  const err = tone === 'error';
  return (
    <View accessibilityLiveRegion="polite" style={{
      flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: R.m, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1,
      backgroundColor: err ? 'rgba(232,138,138,0.1)' : 'rgba(143,211,224,0.08)',
      borderColor: err ? 'rgba(232,138,138,0.5)' : 'rgba(143,211,224,0.45)',
    }}>
      <Icon name={err ? 'x' : icon ?? 'whisper'} size={20} color={err ? T.coral : T.moon} sw={err ? 2 : 1.6} />
      <Text style={{ color: T.tx, fontSize: 15, flex: 1, lineHeight: 20 }}>
        {title ? <Text style={{ fontWeight: '600' }}>{title} · </Text> : null}{text}
      </Text>
    </View>
  );
}
