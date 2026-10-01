import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '../ui/Text';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore, Result } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Card, GaugeRow, Icon, LightPill, Nilo, Pill, Rise, Sheet, Stars } from '../ui/components';
import { useReducedMotion, useAnimatedValue } from '../ui/motion';
import { bigLanternXml } from '../ui/art';
import { R, T, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES } from '../game/catalog';
import { COSMETICS, look, starsOf } from '../game/rewards';
import { askPermission } from '../game/reminders';
import { TUTORIAL_LANTERN } from './welcome';
import { tr, trn } from '../i18n';
import { nextStep } from '../game/views';
import { EVENTS, EventId } from '../game/seasons';

/** Slow rays of light behind the lantern. */
function Rays() {
  const v = useAnimatedValue(0);
  const o = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    Animated.timing(o, { toValue: 1, duration: 900, delay: 300, useNativeDriver: true }).start();
    return () => loop.stop();
  }, [v, o]);
  const rays = [...Array(12)].map((_, i) => `<path d="M100 100L${(100 + 100 * Math.cos((i * 30 - 4) * Math.PI / 180)).toFixed(1)} ${(100 + 100 * Math.sin((i * 30 - 4) * Math.PI / 180)).toFixed(1)}L${(100 + 100 * Math.cos((i * 30 + 4) * Math.PI / 180)).toFixed(1)} ${(100 + 100 * Math.sin((i * 30 + 4) * Math.PI / 180)).toFixed(1)}z" fill="#FFD98E" opacity="${i % 2 ? 0.05 : 0.09}"/>`).join('');
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 260, height: 260, opacity: o, transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <SvgXml xml={`<svg viewBox="0 0 200 200">${rays}</svg>`} width={260} height={260} />
    </Animated.View>
  );
}

/** A burst of sparks when the lantern catches. */
function Sparks() {
  const [sparks] = useState(() => [...Array(10)].map((_, i) => ({ a: (i / 10) * Math.PI * 2 + (i % 2) * 0.3, d: 70 + (i % 3) * 22, v: new Animated.Value(0) })));
  useEffect(() => { Animated.stagger(25, sparks.map((sp) => Animated.timing(sp.v, { toValue: 1, duration: 1000, delay: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start(); }, [sparks]);
  return (
    <>
      {sparks.map((sp, i) => (
        <Animated.View key={i} pointerEvents="none" style={{
          position: 'absolute', width: i % 3 ? 5 : 7, height: i % 3 ? 5 : 7, borderRadius: 4, backgroundColor: i % 2 ? T.gold : T.amber,
          opacity: sp.v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateX: sp.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(sp.a) * sp.d] }) }, { translateY: sp.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(sp.a) * sp.d] }) }],
        }} />
      ))}
    </>
  );
}

function Wave({ color, delay }: { color: string; delay: number }) {
  const v = useAnimatedValue(0);
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [v, delay]);
  return <Animated.View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: color, opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }] }} />;
}

/** Screens that follow a success, in order (object, resident, letter, new district). */
export function followUps(r: Result | null): string[] {
  if (!r) return [];
  const out: string[] = [];
  for (const c of r.celebrations) {
    if (c.kind === 'roomCompleted') out.push(`object:${c.roomID}`);
    if (c.kind === 'buildingCompleted') out.push(`resident:${c.buildingID}`);
    if (c.kind === 'letterFound') out.push(`letter:${c.buildingID}`);
    if (c.kind === 'districtCompleted') out.push(`keeper:${c.districtID}`);
    if (c.kind === 'districtUnlocked') out.push(`district:${c.districtID}`);
  }
  // The Phare's own letter comes with its last room.
  if (r.celebrations.some((c) => c.kind === 'districtCompleted' && c.districtID === 'phare')) out.push('letter:phare');
  if (r.celebrations.some((c) => c.kind === 'districtCompleted' && c.districtID === 'grenier')) out.push('letter:grenier', 'ending:1');
  return out;
}

export default function Success() {
  const { state, engine, result, openLantern, completeOnboarding, showToast, settings, setSettings } = useStore();
  const pop = useAnimatedValue(0);
  const reduce = useReducedMotion();
  const [offer, setOffer] = useState(false);
  const [shownAt] = useState(() => Date.now());
  useEffect(() => { Animated.spring(pop, { toValue: 1, delay: 350, friction: 5, useNativeDriver: true }).start(); }, [pop]);
  const isTutorial = result?.session.id === TUTORIAL_LANTERN;
  useEffect(() => { if (isTutorial) completeOnboarding(); }, [isTutorial, completeOnboarding]);
  useEffect(() => {
    if (result?.newAchievements.length) result.newAchievements.forEach((n, i) => setTimeout(() => showToast(tr('Succès : {0}', [n]), 'star'), 1400 + i * 3000));
  }, [result, showToast]);

  if (!result) return <Screen><Button title={tr('Accueil')} onPress={() => router.replace('/')} /></Screen>;
  const s = result.session;
  const lit = result.celebrations.find((c) => c.kind === 'lanternLit');
  const daily = result.celebrations.find((c) => c.kind === 'dailyCompleted');
  // A seasonal event's puzzle (see store.finishSession).
  const evc = result.celebrations.find((c) => (c.kind as string) === 'eventLit') as unknown as { event: EventId; solved: number; total: number; shards: number; gift: string | null } | undefined;
  const evInfo = evc ? EVENTS[evc.event] : null;
  const where = s.kind === 'lantern' ? engine.progression.locate(s.id) : null;
  const room = where?.room ?? null;
  const n = room ? engine.progression.lights(room.lanterns, state) : 0;
  const follow = followUps(result);
  const title = evInfo ? (result.replay ? tr('Déjà rallumée') : evInfo.id === 'halloween' ? tr('Citrouille rallumée') : tr('Lanterne de la veillée allumée')) : tr(result.replay ? (s.kind === 'daily' ? 'Défi déjà réussi' : 'Lanterne déjà allumée') : s.kind === 'daily' ? 'Défi du soir réussi' : isTutorial ? 'Ta première lumière' : room ? 'Lanterne allumée' : 'Lanterne-clé allumée');

  const secs = (shownAt - Date.parse(s.startedAt)) / 1000;
  const clear = s.paidHints === 0 && s.wrongAnswers === 0 && !s.usedSolution;
  const niloLine = result.replay || isTutorial ? null
    : s.usedSolution ? tr('On apprend aussi en regardant. La prochaine sera pour toi.')
      : clear && secs < 60 ? tr('Rapide, et sans aide. Je suis impressionné !')
        : clear ? tr('Sans indice et sans erreur. Belle lumière.')
          : s.wrongAnswers > 0 ? tr('Tu t’es trompé, puis tu as trouvé. C’est comme ça qu’on apprend.')
            : tr('Un coup de pouce, et c’est allumé. Bien joué !');

  let dailyText = '';
  if (daily && daily.kind === 'dailyCompleted') {
    const r = daily.result;
    if (r.kind === 'streakContinued') dailyText = r.nightlightsUsed ? tr('Une veilleuse a protégé ta série.') + (r.nightlightEarned ? ' ' + tr('Tu en gagnes une nouvelle.') : '') : r.nightlightEarned ? tr('Tu gagnes une veilleuse : elle protégera ta série un soir d’absence.') : tr('Ta flamme du soir continue.');
    if (r.kind === 'streakRestarted') dailyText = tr('Ta série repart à 1. Ce n’est pas grave : la flamme se rallume.');
    if (r.kind === 'caughtUp') dailyText = tr('Rattrapage : récompense de base, sans compter pour la série.');
    if (r.kind === 'catchUpTooOld') dailyText = tr('Ce défi est trop ancien pour être rattrapé.');
  }

  const next = () => {
    if (follow.length) { router.replace({ pathname: '/found', params: { step: '0' } }); return; }
    if (s.kind === 'event') { router.dismissTo('/event'); return; }
    if (s.kind === 'daily') {
      if (!settings.reminderOffered && !result.replay) { setOffer(true); return; }
      router.dismissTo('/');
      return;
    }
    if (isTutorial) { showToast(tr('Tu peux revenir ici quand tu veux.'), 'light'); }
    const step = nextStep(engine.progression, state, s.id);
    if (step.kind === 'puzzle' && openLantern(step.puzzle)) { router.replace('/puzzle'); return; }
    if (step.kind === 'room') { router.replace({ pathname: '/room/[id]', params: { id: step.id } }); return; }
    if (step.kind === 'building') { router.replace({ pathname: '/building/[id]', params: { id: step.id } }); return; }
    router.dismissTo('/');
  };
  const reminderAnswer = async (yes: boolean) => {
    setOffer(false);
    const granted = yes ? await askPermission() : false;
    setSettings({ reminderOffered: true, reminder: granted });
    if (yes && !granted) showToast(tr('Les notifications sont désactivées pour Lampion dans les réglages du téléphone.'), 'bell');
    router.dismissTo('/');
  };

  return (
    <Screen style={{ alignItems: 'center', gap: 14, paddingTop: 80 }}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        {!reduce ? <Rays /> : null}
        {!reduce ? <Sparks /> : null}
        <Wave color={T.gold} delay={200} />
        <Wave color={T.amber} delay={500} />
        <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <SvgXml xml={bigLanternXml()} width={120} height={144} />
        </Animated.View>
      </View>

      <Rise delay={500} style={{ alignItems: 'center', gap: 10 }}>
        <Text style={[type.cap, { color: T.gold }]}>{FAMILIES[s.code].name} · {TIER_NAMES[s.tier]}</Text>
        <Text style={[type.title1, { textAlign: 'center' }]}>{title}</Text>
        {s.kind === 'lantern' && !isTutorial ? <Stars n={starsOf({ paidHints: s.paidHints, wrongAnswers: s.wrongAnswers, usedSolution: s.usedSolution })} size={24} /> : null}
        {result.replay
          ? <Text style={[type.sub, { textAlign: 'center' }]}>{tr('Bien joué. Les récompenses ne se gagnent qu’une fois.')}</Text>
          : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {s.kind === 'lantern' ? <LightPill n="+1" /> : null}
              {lit && lit.kind === 'lanternLit' && lit.shards ? <Pill icon="shard" iconColor={T.moon}>+{lit.shards}</Pill> : null}
              {lit && lit.kind === 'lanternLit' && lit.clairvoyanceBonus ? <Pill icon="star" iconColor={T.gold} color={T.gold} borderColor="#6b5a3c">{tr('Clairvoyance')} +{lit.clairvoyanceBonus}</Pill> : null}
              {daily && daily.kind === 'dailyCompleted' && daily.shards ? <Pill icon="shard" iconColor={T.moon}>+{daily.shards}</Pill> : null}
              {evc && evc.shards ? <Pill icon="shard" iconColor={T.moon}>+{evc.shards}</Pill> : null}
            </View>
          )}
        {s.code === 'IN' && result.minimalMoves && !s.usedSolution ? <Text style={type.foot}>{trn(s.state.moves, 'Résolu en {0} coup · minimum possible : {1}', 'Résolu en {0} coups · minimum possible : {1}', [s.state.moves, result.minimalMoves])}</Text> : null}
        {s.usedSolution ? <Text style={type.foot}>{tr('Solution consultée : la lumière est gagnée, sans bonus.')}</Text> : null}
      </Rise>

      {evc && evInfo ? (
        <Card style={{ alignItems: 'center', gap: 6, alignSelf: 'stretch', borderColor: evInfo.flame }}>
          <Text style={[type.cap, { color: evInfo.flame }]}>{tr(evInfo.name)}</Text>
          <GaugeRow n={evc.solved} total={evc.total} label={evInfo.id === 'halloween' ? tr('Citrouilles') : tr('Soirs de veillée')} from={result.replay ? undefined : evc.solved - 1} />
          {evc.gift ? <Text style={[type.callout, { color: T.gold, textAlign: 'center' }]}>{tr('Nouveau pour Nilo : {0}', [COSMETICS.find((c) => c.id === evc.gift)?.name ?? ''])}</Text> : null}
        </Card>
      ) : s.kind === 'daily' ? (
        <Card style={{ alignItems: 'center', gap: 4, alignSelf: 'stretch' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="light" size={22} color={T.amber} />
            <Text style={type.title3}>{trn(state.daily.streak, '{0} soir', '{0} soirs')}</Text>
          </View>
          <Text style={[type.foot, { textAlign: 'center' }]}>{dailyText} {tr('Record : {0}.', [state.daily.bestStreak])}</Text>
        </Card>
      ) : room ? (
        <Rise delay={750} style={{ alignSelf: 'stretch' }}>
          <GaugeRow n={n} total={room.lanterns.length} label={tr('Salle')} from={result.replay ? undefined : n - 1} />
          <Text style={[type.foot, { marginTop: 6, textAlign: 'center' }]}>{n === room.lanterns.length ? tr('Salle entièrement éclairée !') : trn(room.lanterns.length - n, 'Encore {0} lanterne avant l’objet caché', 'Encore {0} lanternes avant l’objet caché')}</Text>
        </Rise>
      ) : null}

      <View style={{ flex: 1 }} />
      {/* Nilo says a word that fits how it went. */}
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {niloLine ? (
            <View style={{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.m, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={[type.callout, { color: T.tx }]}>{niloLine}</Text>
            </View>
          ) : null}
        </View>
        <Nilo size={84} mood="joy" look={look(state)} />
      </View>
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        <Button title={follow.length || s.kind !== 'lantern' || isTutorial ? tr('Continuer') : tr('Suivant')} onPress={next} />
        {s.kind === 'lantern' && room && !follow.length ? <Button title={tr('Retour à la salle')} kind="ghost" onPress={() => router.dismissTo({ pathname: '/room/[id]', params: { id: room.id } })} /> : null}
        {s.kind === 'lantern' && !isTutorial ? <Button title={tr('Accueil')} kind="ghost" onPress={() => router.dismissTo('/')} /> : null}
      </View>

      <Sheet visible={offer} onClose={() => reminderAnswer(false)}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={34} color={T.amber} />
          <Text style={[type.title2, { textAlign: 'center' }]}>{tr('Un rappel le soir ?')}</Text>
          <Text style={[type.sub, { textAlign: 'center' }]}>{tr('Un rappel par soir, pas plus, seulement si le défi n’est pas fait. Tu peux l’arrêter à tout moment dans les Réglages.')}</Text>
          <Text style={[type.foot, { textAlign: 'center' }]}>{tr('Heure : {0} h {1} (modifiable dans les Réglages)', [String(settings.reminderHour).padStart(2, '0'), String(settings.reminderMinute).padStart(2, '0')])}</Text>
        </View>
        <Button title={tr('Oui, me le rappeler')} onPress={() => reminderAnswer(true)} style={{ marginTop: 16 }} />
        <Button title={tr('Non merci')} kind="ghost" onPress={() => reminderAnswer(false)} />
      </Sheet>
    </Screen>
  );
}
