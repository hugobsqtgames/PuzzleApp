import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, GlyphCircle, Icon, Pill, TierBars } from '../ui/components';
import { T, type } from '../ui/theme';
import { dailyLabel } from '../ui/dates';

export default function Daily() {
  const { game, openDaily } = useGame();
  const done = game.dailyDone;
  return (
    <Screen scroll>
      <BackButton label="Accueil" onPress={() => router.back()} />
      <Text style={type.title1}>Défi du soir</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 64, alignItems: 'center' }}><Icon name="light" size={34} color={T.amber} /></View>
        <View style={{ flex: 1 }}>
          <Text style={type.title2}>{game.streak} soirs</Text>
          <Text style={type.foot}>Flamme du soir · record {game.best}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <Icon name="moonI" size={18} color={T.moon} sw={1.8} />
            <Icon name="moonI" size={18} color={T.line} sw={1.8} />
          </View>
          <Text style={type.foot}>{game.nightlights} veilleuse</Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <GlyphCircle icon="BA" size={48} color={done ? T.tx2 : T.amber} />
          <View style={{ flex: 1 }}>
            <Text style={type.cap}>{dailyLabel()}</Text>
            <Text style={type.title3}>Balances</Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TierBars tier={2} />
              <Text style={type.foot}>Flamme</Text>
            </View>
          </View>
          <Pill icon="shard" iconColor={T.moon}>+15 · +{Math.min(10, game.streak)}</Pill>
        </View>
        {done ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={22} color={T.gold} sw={2} />
            <Text style={[type.callout, { flex: 1 }]}>Réussi. Demain : Cadenas, palier Brasier.</Text>
          </View>
        ) : (
          <Button title="Jouer le défi" onPress={() => { openDaily(); router.push('/puzzle'); }} />
        )}
        <Text style={type.foot}>Même énigme pour tous les joueurs en français ce soir. Générée sur ton appareil, sans connexion.</Text>
      </Card>
    </Screen>
  );
}
