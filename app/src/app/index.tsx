import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { Button, Card, Crumb, Gauge, GaugeRow, GlyphCircle, Icon, LightPill, Nilo, ShardPill, tap } from '../ui/components';
import { vesperWindowXml } from '../ui/art';
import { T, R, type } from '../ui/theme';
import { litCount } from '../content/vesperDemo';
import { dailyLabel } from '../ui/dates';

export default function Home() {
  const { game, showToast, openLantern } = useGame();
  const { width } = useWindowDimensions();
  const winW = Math.min(width, 600) - 32;
  const n = litCount(game);
  const windowXml = useMemo(() => vesperWindowXml(game, 358, 210), [game.lights]); // eslint-disable-line react-hooks/exhaustive-deps
  const goal = game.lights >= 206 ? 'La Serre de Verre est ouverte' : `Encore ${206 - game.lights} lumières pour la Serre de Verre`;

  const onContinue = () => {
    const i = game.room.findIndex((l) => !l.lit);
    if (i < 0) { router.push('/room'); return; }
    openLantern(i);
    router.push('/puzzle');
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <LightPill n={game.lights} />
        <ShardPill n={game.shards} />
      </View>

      <View style={{ height: 210, marginBottom: 6 }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Ouvrir la carte de Vesper"
          onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}
        >
          <SvgXml xml={windowXml} width={winW} height={210} />
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>Vesper</Text>
            <Text style={type.foot}>{game.lights} / 1 000 lanternes</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} />
            <Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>Carte</Text>
          </View>
        </Pressable>
        <View style={{ position: 'absolute', right: 4, bottom: -26 }}>
          <Nilo size={96} mood="curious" flame={game.flame} hat={game.hat} />
        </View>
      </View>

      <Card style={{ gap: 10 }}>
        <Crumb parent="Horlogerie" current="Atelier des Ressorts" />
        <Text style={type.title2}>Salle 2 · L’Établi</Text>
        <GaugeRow n={n} total={10} label="Salle" />
        <Button title="Continuer" icon="light" onPress={onContinue} style={{ marginTop: 4 }} />
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => { tap(); router.push('/daily'); }}
        style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}
      >
        <GlyphCircle icon="BA" color={game.dailyDone ? T.tx2 : T.amber} />
        <View style={{ flex: 1 }}>
          <Text style={type.headline}>{game.dailyDone ? 'Défi du soir réussi' : 'Défi du soir'}</Text>
          <Text style={type.sub}>{game.dailyDone ? 'Demain : Cadenas · Brasier' : `${dailyLabel()} · Balances · Flamme`}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Icon name="light" size={22} color={T.amber} />
          <Text style={{ color: T.tx, fontWeight: '700', fontSize: 15 }}>{game.streak}</Text>
        </View>
        {game.dailyDone ? <Icon name="check" size={20} color={T.gold} sw={2} /> : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => showToast('La progression détaillée de Vesper arrive dans une prochaine version.')}
        style={{ flexDirection: 'row', gap: 12, paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center' }}
      >
        <Icon name="lock" size={20} color={T.tx2} />
        <View style={{ flex: 1 }}>
          <Text style={type.callout}>{goal}</Text>
          <View style={{ marginTop: 8 }}><Gauge n={game.lights - 110} total={96} height={5} /></View>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['map', 'Carte', '/map'], ['book', 'Carnet', null], ['gear', 'Réglages', null]] as const).map(([icon, label, to]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => { tap(); if (to) router.push(to); else showToast(`${label} : arrive dans une prochaine version.`); }}
            style={{ flex: 1, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}
          >
            <Icon name={icon} size={22} color={T.tx2} />
            <Text style={{ color: T.tx, fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
