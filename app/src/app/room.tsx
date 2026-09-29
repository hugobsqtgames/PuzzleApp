import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useGame } from '../state/GameContext';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, GlyphCircle, Icon, Pill, Sheet, TierBars, tap } from '../ui/components';
import { ROOM_H, ROOM_W, roomLanternXml, roomXml } from '../ui/art';
import { T, type } from '../ui/theme';
import { FAMILIES, REWARD, ROOM_SLOTS, TIERS, litCount } from '../content/vesperDemo';

function PulseRing({ size }: { size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: T.amber,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
      }}
    />
  );
}

export default function Room() {
  const { game, openLantern } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const n = litCount(game);
  const rec = game.room.findIndex((l) => !l.lit);
  const xml = useMemo(() => roomXml(game), [game]);

  // "xMidYMid meet" placement of the 390×470 room inside the available box.
  const k = box.w ? Math.min(box.w / ROOM_W, box.h / ROOM_H) : 0;
  const ox = (box.w - ROOM_W * k) / 2, oy = (box.h - ROOM_H * k) / 2;
  const L = 60 * k;

  const play = (i: number) => {
    setSelected(null);
    openLantern(i);
    router.push('/puzzle');
  };

  const sel = selected != null ? game.room[selected] : null;
  return (
    <Screen background="#0b0d1d" style={{ gap: 6 }}>
      <BackButton label="Atelier des Ressorts" onPress={() => router.back()} />
      <Crumb parent="Atelier des Ressorts" current="Salle 2" />
      <Text style={type.title1}>L’Établi</Text>
      <GaugeRow n={n} total={10} label="Lanternes de la salle" />

      <View style={{ flex: 1, marginHorizontal: -16, marginVertical: 6 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {k > 0 ? (
          <>
            <View style={{ position: 'absolute', left: ox, top: oy }}>
              <SvgXml xml={xml} width={ROOM_W * k} height={ROOM_H * k} />
            </View>
            {game.room.map((l, i) => {
              const p = ROOM_SLOTS[i];
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`Lanterne ${i + 1} sur ${p.obj} : ${FAMILIES[l.family].name}, ${TIERS[l.tier]}, ${l.lit ? 'allumée' : 'éteinte'}${i === rec ? ', recommandée' : ''}`}
                  onPress={() => { tap(); setSelected(i); }}
                  style={{ position: 'absolute', left: ox + p.x * k - L / 2, top: oy + p.y * k - L * (34 / 60), width: L, height: L, alignItems: 'center', justifyContent: 'center' }}
                >
                  {i === rec ? <PulseRing size={34 * k} /> : null}
                  <SvgXml xml={roomLanternXml(i, l.lit)} width={L} height={L} style={{ position: 'absolute', left: 0, top: 0 }} />
                </Pressable>
              );
            })}
          </>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {n === 10
          ? <Icon name="star" size={18} color={T.gold} />
          : <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.tx3 }} />}
        <Text style={type.foot}>{n === 10 ? 'Objet trouvé : le Ressort qui chante' : 'Un objet se cache ici. Allume les 10 lanternes.'}</Text>
      </View>
      {rec >= 0
        ? <Button title={`Allumer la lanterne ${rec + 1} · ${FAMILIES[game.room[rec].family].name}`} onPress={() => setSelected(rec)} style={{ marginTop: 6 }} />
        : <Button title="Voir l’objet trouvé" onPress={() => router.push('/reward')} style={{ marginTop: 6 }} />}

      <Sheet visible={sel != null} onClose={() => setSelected(null)}>
        {sel && selected != null ? (
          <View>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <GlyphCircle icon={sel.family} size={56} color={sel.lit ? T.gold : T.amber} />
              <View style={{ flex: 1 }}>
                <Text style={type.cap}>Lanterne {selected + 1} · {ROOM_SLOTS[selected].obj}</Text>
                <Text style={type.title2}>{FAMILIES[sel.family].name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TierBars tier={sel.tier} />
                <Text style={type.sub}>{TIERS[sel.tier]}</Text>
              </View>
              <Pill icon="shard" iconColor={T.moon}>+{REWARD[sel.tier]}</Pill>
              {sel.lit ? <Pill icon="check" iconColor={T.gold} color={T.gold}>Résolue</Pill> : null}
            </View>
            <Text style={[type.sub, { marginBottom: 16 }]}>{FAMILIES[sel.family].rule}</Text>
            <Button title={sel.lit ? 'Rejouer' : 'Allumer'} onPress={() => play(selected)} />
            <Button title="Plus tard" kind="ghost" onPress={() => setSelected(null)} style={{ marginTop: 4 }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
