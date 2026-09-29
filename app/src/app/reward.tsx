import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { Button, Pill, ShardPill } from '../ui/components';
import { springXml } from '../ui/art';
import { T, type } from '../ui/theme';

export default function Reward() {
  const { claimRoomReward, showToast } = useGame();
  // Given once: claimRoomReward is idempotent.
  useEffect(() => { claimRoomReward(); }, [claimRoomReward]);

  return (
    <Screen style={{ gap: 12, paddingTop: 96 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <SvgXml xml={springXml()} width={220} height={176} />
        <Text style={[type.cap, { color: T.gold }]}>Salle 2 · entièrement éclairée</Text>
        <Text style={type.title1}>Objet trouvé</Text>
        <Text style={type.title3}>Le Ressort qui chante</Text>
        <Text style={[type.sub, { maxWidth: 300, textAlign: 'center' }]}>Il vibre quand on s’approche d’une énigme. Rangé dans ton Carnet.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ShardPill n="+20" />
          <Pill icon="book">Carnet · 7 / 101</Pill>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <Button title="Continuer" onPress={() => router.dismissTo('/room')} />
      <Button title="Voir le Carnet" kind="ghost" onPress={() => showToast('Le Carnet arrive dans une prochaine version.')} />
    </Screen>
  );
}
