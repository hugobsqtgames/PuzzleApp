import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore, Result } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Card, GaugeRow, Icon, LightPill, Nilo, Pill, Sheet } from '../ui/components';
import { bigLanternXml } from '../ui/art';
import { T, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES } from '../game/catalog';
import { look } from '../game/rewards';
import { askPermission } from '../game/reminders';
import { TUTORIAL_LANTERN } from './welcome';

function Wave({ color, delay }: { color: string; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
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
  if (r.celebrations.some((c) => c.kind === 'districtCompleted' && c.districtID === 'grenier')) out.push('letter:grenier');
  return out;
}

export default function Success() {
  const { state, engine, result, openLantern, completeOnboarding, showToast, settings, setSettings } = useStore();
  const pop = useRef(new Animated.Value(0)).current;
  const [offer, setOffer] = useState(false);
  useEffect(() => { Animated.spring(pop, { toValue: 1, delay: 350, friction: 5, useNativeDriver: true }).start(); }, [pop]);
  const isTutorial = result?.session.id === TUTORIAL_LANTERN;
  useEffect(() => { if (isTutorial) completeOnboarding(); }, [isTutorial, completeOnboarding]);
  useEffect(() => {
    if (result?.newAchievements.length) result.newAchievements.forEach((n, i) => setTimeout(() => showToast(`Succès : ${n}`, 'star'), 1400 + i * 3000));
  }, [result, showToast]);

  if (!result) return <Screen><Button title="Accueil" onPress={() => router.replace('/')} /></Screen>;
  const s = result.session;
  const lit = result.celebrations.find((c) => c.kind === 'lanternLit');
  const daily = result.celebrations.find((c) => c.kind === 'dailyCompleted');
  const where = s.kind === 'lantern' ? engine.progression.locate(s.id) : null;
  const room = where?.room ?? null;
  const n = room ? engine.progression.lights(room.lanterns, state) : 0;
  const follow = followUps(result);
  const title = result.replay ? (s.kind === 'daily' ? 'Défi déjà réussi' : 'Lanterne déjà allumée') : s.kind === 'daily' ? 'Défi du soir réussi' : isTutorial ? 'Ta première lumière' : room ? 'Lanterne allumée' : 'Lanterne-clé allumée';

  let dailyText = '';
  if (daily && daily.kind === 'dailyCompleted') {
    const r = daily.result;
    if (r.kind === 'streakContinued') dailyText = r.nightlightsUsed ? `Une veilleuse a protégé ta série.${r.nightlightEarned ? ' Tu en gagnes une nouvelle.' : ''}` : r.nightlightEarned ? 'Tu gagnes une veilleuse : elle protégera ta série un soir d’absence.' : 'Ta flamme du soir continue.';
    if (r.kind === 'streakRestarted') dailyText = 'Ta série repart à 1. Ce n’est pas grave : la flamme se rallume.';
    if (r.kind === 'caughtUp') dailyText = 'Rattrapage : récompense de base, sans compter pour la série.';
    if (r.kind === 'catchUpTooOld') dailyText = 'Ce défi est trop ancien pour être rattrapé.';
  }

  const next = () => {
    if (follow.length) { router.replace({ pathname: '/found', params: { step: '0' } }); return; }
    if (s.kind === 'daily') {
      if (!settings.reminderOffered && !result.replay) { setOffer(true); return; }
      router.dismissTo('/');
      return;
    }
    if (isTutorial) { showToast('Tu peux revenir ici quand tu veux.', 'light'); }
    const cur = engine.progression.recommended(state);
    if (!cur) { router.dismissTo('/'); return; }
    if (openLantern(cur.puzzle)) router.replace('/puzzle');
  };
  const reminderAnswer = async (yes: boolean) => {
    setOffer(false);
    const granted = yes ? await askPermission() : false;
    setSettings({ reminderOffered: true, reminder: granted });
    if (yes && !granted) showToast('Les notifications sont désactivées pour Lampion dans les réglages du téléphone.', 'bell');
    router.dismissTo('/');
  };

  return (
    <Screen style={{ alignItems: 'center', gap: 14, paddingTop: 80 }}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Wave color={T.gold} delay={200} />
        <Wave color={T.amber} delay={500} />
        <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <SvgXml xml={bigLanternXml()} width={120} height={144} />
        </Animated.View>
      </View>

      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text style={[type.cap, { color: T.gold }]}>{FAMILIES[s.code].name} · {TIER_NAMES[s.tier]}</Text>
        <Text style={[type.title1, { textAlign: 'center' }]}>{title}</Text>
        {result.replay
          ? <Text style={[type.sub, { textAlign: 'center' }]}>Bien joué. Les récompenses ne se gagnent qu’une fois.</Text>
          : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {s.kind === 'lantern' ? <LightPill n="+1" /> : null}
              {lit && lit.kind === 'lanternLit' && lit.shards ? <Pill icon="shard" iconColor={T.moon}>+{lit.shards}</Pill> : null}
              {lit && lit.kind === 'lanternLit' && lit.clairvoyanceBonus ? <Pill icon="star" iconColor={T.gold} color={T.gold} borderColor="#6b5a3c">Clairvoyance +{lit.clairvoyanceBonus}</Pill> : null}
              {daily && daily.kind === 'dailyCompleted' && daily.shards ? <Pill icon="shard" iconColor={T.moon}>+{daily.shards}</Pill> : null}
            </View>
          )}
        {s.code === 'IN' && result.minimalMoves && !s.usedSolution ? <Text style={type.foot}>Résolu en {s.state.moves} coup{s.state.moves > 1 ? 's' : ''} · minimum possible : {result.minimalMoves}</Text> : null}
        {s.usedSolution ? <Text style={type.foot}>Solution consultée : la lumière est gagnée, sans bonus.</Text> : null}
      </View>

      {s.kind === 'daily' ? (
        <Card style={{ alignItems: 'center', gap: 4, alignSelf: 'stretch' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="light" size={22} color={T.amber} />
            <Text style={type.title3}>{state.daily.streak} soir{state.daily.streak > 1 ? 's' : ''}</Text>
          </View>
          <Text style={[type.foot, { textAlign: 'center' }]}>{dailyText} Record : {state.daily.bestStreak}.</Text>
        </Card>
      ) : room ? (
        <View style={{ alignSelf: 'stretch' }}>
          <GaugeRow n={n} total={room.lanterns.length} label="Salle" />
          <Text style={[type.foot, { marginTop: 6, textAlign: 'center' }]}>{n === room.lanterns.length ? 'Salle entièrement éclairée !' : `Encore ${room.lanterns.length - n} lanterne${room.lanterns.length - n > 1 ? 's' : ''} avant l’objet caché`}</Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      <View style={{ alignSelf: 'stretch' }}>
        <View style={{ position: 'absolute', right: 0, bottom: 8 }}><Nilo size={84} mood="joy" look={look(state)} /></View>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        <Button title={follow.length || s.kind === 'daily' || isTutorial ? 'Continuer' : 'Suivant'} onPress={next} />
        {s.kind === 'lantern' && room && !follow.length ? <Button title="Retour à la salle" kind="ghost" onPress={() => router.dismissTo({ pathname: '/room/[id]', params: { id: room.id } })} /> : null}
        {s.kind === 'lantern' && !isTutorial ? <Button title="Accueil" kind="ghost" onPress={() => router.dismissTo('/')} /> : null}
      </View>

      <Sheet visible={offer} onClose={() => reminderAnswer(false)}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={34} color={T.amber} />
          <Text style={[type.title2, { textAlign: 'center' }]}>Un rappel le soir ?</Text>
          <Text style={[type.sub, { textAlign: 'center' }]}>Un rappel par soir, pas plus, seulement si le défi n’est pas fait. Tu peux l’arrêter à tout moment dans les Réglages.</Text>
          <Text style={[type.foot, { textAlign: 'center' }]}>Heure : {String(settings.reminderHour).padStart(2, '0')} h {String(settings.reminderMinute).padStart(2, '0')} (modifiable dans les Réglages)</Text>
        </View>
        <Button title="Oui, me le rappeler" onPress={() => reminderAnswer(true)} style={{ marginTop: 16 }} />
        <Button title="Non merci" kind="ghost" onPress={() => reminderAnswer(false)} />
      </Sheet>
    </Screen>
  );
}
