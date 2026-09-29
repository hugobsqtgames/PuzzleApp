import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { Button, Card, GaugeRow, Icon, LightPill, Nilo, Pill } from '../ui/components';
import { bigLanternXml } from '../ui/art';
import { T, type } from '../ui/theme';
import { FAMILIES, TIERS, litCount } from '../content/vesperDemo';

function Wave({ color, delay }: { color: string; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={{
      position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: color,
      opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
    }} />
  );
}

export default function Success() {
  const { game, last, openLantern } = useGame();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, delay: 350, friction: 5, useNativeDriver: true }).start();
  }, [pop]);

  if (!last) {
    return <Screen><Button title="Accueil" onPress={() => router.replace('/')} /></Screen>;
  }
  const n = litCount(game);
  const title = last.replay ? (last.daily ? 'Défi déjà réussi' : 'Lanterne déjà allumée')
    : last.daily ? 'Défi du soir réussi' : last.tuto ? 'Ta première lumière' : 'Lanterne allumée';
  const roomDone = !last.daily && !last.tuto && n === 10;

  const next = () => {
    const i = game.room.findIndex((l) => !l.lit);
    if (i < 0) { router.replace('/room'); return; }
    openLantern(i);
    router.replace('/puzzle');
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
        <Text style={[type.cap, { color: T.gold }]}>{FAMILIES[last.family].name} · {TIERS[last.tier]}</Text>
        <Text style={type.title1}>{title}</Text>
        {last.replay
          ? <Text style={[type.sub, { textAlign: 'center' }]}>Bien joué. Les récompenses ne se gagnent qu’une fois.</Text>
          : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {last.tuto ? null : <LightPill n="+1" />}
              {last.reward ? <Pill icon="shard" iconColor={T.moon}>+{last.reward}</Pill> : null}
              {last.bonus ? <Pill icon="star" iconColor={T.gold} color={T.gold} borderColor="#6b5a3c">Clairvoyance +{last.bonus}</Pill> : null}
            </View>
          )}
        {last.family === 'IN' && last.moves > 0 && !last.tuto ? <Text style={type.foot}>Résolu en {last.moves} coups · minimum possible : 3</Text> : null}
        {last.usedSolution ? <Text style={type.foot}>Solution consultée : la lumière est gagnée, sans bonus.</Text> : null}
      </View>

      {last.daily ? (
        <Card style={{ alignItems: 'center', gap: 4, alignSelf: 'stretch' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="light" size={22} color={T.amber} />
            <Text style={type.title3}>{game.streak} soirs</Text>
          </View>
          <Text style={type.foot}>Ta flamme du soir continue. Record : {game.best}.</Text>
        </Card>
      ) : last.tuto ? null : (
        <View style={{ alignSelf: 'stretch' }}>
          <GaugeRow n={n} total={10} label="Salle 2" />
          <Text style={[type.foot, { marginTop: 6, textAlign: 'center' }]}>
            {roomDone ? 'Salle entièrement éclairée !' : `Salle 2 · encore ${10 - n} lanterne${10 - n > 1 ? 's' : ''} avant l’objet caché`}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }} />
      <View style={{ alignSelf: 'stretch' }}>
        <View style={{ position: 'absolute', right: 0, bottom: 8 }}>
          <Nilo size={84} mood="joy" flame={game.flame} hat={game.hat} />
        </View>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        {last.daily || last.tuto
          ? <Button title="Continuer" onPress={() => router.dismissTo('/')} />
          : roomDone
            ? <Button title="Continuer" onPress={() => router.replace('/reward')} />
            : <Button title="Suivant" onPress={next} />}
        {last.daily || last.tuto ? null : <Button title="Retour à la salle" kind="ghost" onPress={() => router.dismissTo('/room')} />}
      </View>
    </Screen>
  );
}
