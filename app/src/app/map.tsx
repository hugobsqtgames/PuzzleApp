import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGame } from '../state/GameContext';
import { BackButton, LightPill, Nilo, Toast, tap } from '../ui/components';
import { MAP_H, MAP_POS, MAP_W, mapXml } from '../ui/art';
import { type } from '../ui/theme';
import { DISTRICTS, distLights, distState } from '../content/vesperDemo';

export default function MapScreen() {
  const { game, showToast, toast } = useGame();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / MAP_W;
  const xml = useMemo(() => mapXml(game), [game.lights]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDistrict = (id: string) => {
    const d = DISTRICTS.find((x) => x.id === id)!;
    if (distState(game, d) === 'locked') {
      tap('error');
      showToast(`${d.short ?? d.name} s’ouvre à ${d.need} lumières. Encore ${d.need - game.lights}.`);
      return;
    }
    tap();
    if (id === 'horlo') router.push('/district');
    else showToast('Seule l’Horlogerie est dessinée pour l’instant.');
  };

  const [hx, hy] = MAP_POS.horlo;
  return (
    <View style={{ flex: 1, backgroundColor: '#080914' }}>
      <ScrollView contentOffset={{ x: 0, y: 520 * k }} showsVerticalScrollIndicator={false}>
        <View style={{ width, height: MAP_H * k }}>
          <SvgXml xml={xml} width={width} height={MAP_H * k} />
          {DISTRICTS.map((d) => {
            const [cx, cy, sc] = MAP_POS[d.id];
            const st = distState(game, d);
            const top = (cy - 120 * sc - 20) * k;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                accessibilityLabel={`${d.name}, ${st === 'locked' ? `verrouillé, il faut ${d.need} lumières` : `${distLights(game, d)} lanternes allumées sur ${d.total}`}`}
                onPress={() => onDistrict(d.id)}
                style={{ position: 'absolute', left: (cx - 100) * k, top, width: 200 * k, height: (120 * sc + 80) * k }}
              />
            );
          })}
          <View style={{ position: 'absolute', left: (hx + 62) * k, top: (hy - 38) * k }} pointerEvents="none">
            <Nilo size={120 * 0.36 * k} mood="curious" flame={game.flame} hat={game.hat} />
          </View>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: 'rgba(8,9,20,0.88)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton label="Accueil" onPress={() => router.back()} />
        <Text style={[type.title2, { position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center' }]} pointerEvents="none">Vesper</Text>
        <LightPill n={game.lights} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8 }} pointerEvents="none">
        <Toast text={toast} />
      </View>
    </View>
  );
}

