import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, Icon, tap } from '../ui/components';
import { districtXml } from '../ui/art';
import { T, type } from '../ui/theme';
import { HBUILD, litCount } from '../content/vesperDemo';

export default function District() {
  const { game, showToast } = useGame();
  const { width } = useWindowDimensions();
  const artW = Math.min(width, 600) - 32;
  const xml = useMemo(() => districtXml(), []);
  // The panorama is 360×300, drawn bottom-aligned ("xMidYMax meet") in artW×250.
  const k = Math.min(artW / 360, 250 / 300);
  const ox = (artW - 360 * k) / 2, oy = 250 - 300 * k;

  const onBuilding = (id: string) => {
    const b = HBUILD.find((x) => x.id === id)!;
    if (!b.open) { tap('error'); showToast(`${b.need}.`); return; }
    tap();
    if (id === 'atelier') router.push('/building');
    else showToast('Seul l’Atelier des Ressorts est dessiné pour l’instant.');
  };

  return (
    <Screen scroll>
      <BackButton label="Vesper" onPress={() => router.back()} />
      <Crumb parent="Vesper" current="Horlogerie" />
      <Text style={type.title1}>L’Horlogerie</Text>
      <GaugeRow n={game.lights - 142} total={160} label="Lanternes du quartier" />
      <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: T.line, height: 250 }}>
        <SvgXml xml={xml} width={artW} height={250} />
        {HBUILD.map((b) => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={`${b.name}, ${b.open ? `${b.lanterns} sur 40` : 'verrouillé'}`}
            onPress={() => onBuilding(b.id)}
            style={{ position: 'absolute', left: ox + b.x * k, top: oy + (262 - b.h - b.w * 0.7) * k, width: b.w * k, height: (b.h + b.w * 0.7) * k }}
          />
        ))}
      </View>
      <View>
        {HBUILD.map((b) => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            onPress={() => onBuilding(b.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, minHeight: 52 }}
          >
            {b.open
              ? <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: T.amber, opacity: 0.3 + b.lit, shadowColor: T.amber, shadowOpacity: 0.8, shadowRadius: 8 }} />
              : <Icon name="lock" size={20} color={T.tx3} />}
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, !b.open && { color: T.tx2 }]}>{b.name}</Text>
              <Text style={type.foot}>{b.open ? `${b.id === 'atelier' ? 24 + litCount(game) : b.lanterns} / 40 lanternes` : b.need}</Text>
            </View>
            <Icon name="chev" size={18} color={T.tx3} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="moonI" size={18} color={T.tx2} />
        <Text style={[type.foot, { flex: 1 }]}>L’Horlogère dort devant la tour. Éclaire tout le quartier pour la réveiller.</Text>
      </View>
      <Button title="Entrer · Atelier des Ressorts" onPress={() => router.push('/building')} style={{ marginTop: 4 }} />
    </Screen>
  );
}

