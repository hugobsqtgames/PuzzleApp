import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, Icon, Nilo, tap } from '../ui/components';
import { atelierRooms, COUPE_RECTS, coupeXml } from '../ui/art';
import { T, type } from '../ui/theme';
import { litCount } from '../content/vesperDemo';

export default function Building() {
  const { game, showToast } = useGame();
  const { width } = useWindowDimensions();
  const w = Math.min(width, 600) - 32;
  const k = w / 360;
  const xml = useMemo(() => coupeXml(game), [game]);
  const B = atelierRooms(game);
  const n = litCount(game);

  const onRoom = (i: number) => {
    if (i === 4) {
      if (!B.keyOpen) { tap('error'); showToast('Verrouillée : 30 lanternes dans l’atelier.'); return; }
      showToast('Lanterne-clé : une énigme écrite à la main, sommet du bâtiment.');
      return;
    }
    if (i !== 1) { showToast('Seule la Salle 2 est dessinée pour l’instant.'); return; }
    tap();
    router.push('/room');
  };

  return (
    <Screen scroll>
      <BackButton label="Horlogerie" onPress={() => router.back()} />
      <Crumb parent="Horlogerie" current="Atelier des Ressorts" />
      <Text style={type.title1}>Atelier des Ressorts</Text>
      <GaugeRow n={B.total} total={40} label="Lanternes du bâtiment" />
      <View style={{ width: w, height: 440 * k }}>
        <SvgXml xml={xml} width={w} height={440 * k} />
        {COUPE_RECTS.map((r, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={i === 4 ? 'Lanterne-clé' : B.rooms[i].name}
            onPress={() => onRoom(i)}
            style={{ position: 'absolute', left: r.x * k, top: r.y * k, width: r.w * k, height: r.h * k }}
          />
        ))}
        {B.rooms[1].state === 'current' ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: (180 - 58) * k, top: (230 + 8) * k }}>
            <Nilo size={132 * 0.36 * k} flame={game.flame} hat={game.hat} />
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="moonI" size={18} color={T.tx2} />
        <Text style={[type.foot, { flex: 1 }]}>Maître Ressort, le grillon de l’atelier, dort sous l’établi.</Text>
      </View>
      <Button title={`Salle 2 · ${n} / 10`} onPress={() => router.push('/room')} />
    </Screen>
  );
}
