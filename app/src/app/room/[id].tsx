import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { goBack } from '../../ui/nav';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../../game/store';
import { Screen } from '../../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, GlyphCircle, Icon, Pill, Sheet, TierBars, tap } from '../../ui/components';
import { ROOM_H, ROOM_W, roomLanternXml, roomSlots, roomXml, slotObject } from '../../ui/art';
import { T, type } from '../../ui/theme';
import { FAMILIES, REWARDS, TIER_NAMES } from '../../game/catalog';
import { buildingName, collectibleOf, infoOf, locateRoom, roomName } from '../../game/views';

function PulseRing({ size }: { size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: T.amber, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }] }} />;
}

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, engine, openLantern, settings } = useStore();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const at = locateRoom(id ?? '');
  const p = engine.progression;
  const lanterns = at?.room.lanterns ?? [];
  const lit = lanterns.map((l) => state.solved.has(l.puzzle));
  const n = lit.filter(Boolean).length;
  const slots = roomSlots(lanterns.length);
  const info = at ? infoOf(at.district) : null;
  const complete = n === lanterns.length && lanterns.length > 0;
  const xml = useMemo(() => (info ? roomXml(info.hue, slots.filter((_, i) => lit[i]), n / Math.max(1, lanterns.length), complete) : ''), [info, n, complete]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!at || !info) return <Screen><BackButton label="Vesper" onPress={() => goBack()} /></Screen>;
  const { district: d, buildingIndex: bi, index: ri } = at;
  const rec = lit.findIndex((x) => !x);
  const k = box.w ? Math.min(box.w / ROOM_W, box.h / ROOM_H) : 0;
  const ox = (box.w - ROOM_W * k) / 2, oy = (box.h - ROOM_H * k) / 2;
  const L = 60 * k;
  const object = info.buildings[bi].rooms[ri].object;
  const found = state.collectibles.has(collectibleOf(at.room.id));
  const open = p.isPlayable(lanterns[0]?.puzzle ?? '', state);

  const play = (i: number) => {
    setSelected(null);
    if (openLantern(lanterns[i].puzzle)) router.push('/puzzle');
  };
  const choose = (i: number) => { tap(); if (settings.direct) play(i); else setSelected(i); };
  const sel = selected !== null ? lanterns[selected] : null;

  return (
    <Screen background="#0b0d1d" style={{ gap: 6 }} place={info.sound}>
      <BackButton label={buildingName(d, bi)} onPress={() => goBack()} />
      <Crumb parent={buildingName(d, bi)} current={lanterns.length === 16 ? 'Finale' : `Salle ${ri + 1}`} />
      <Text style={type.title1}>{roomName(d, bi, ri)}</Text>
      <GaugeRow n={n} total={lanterns.length} label="Lanternes de la salle" />

      <View style={{ flex: 1, marginHorizontal: -16, marginVertical: 6 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {k > 0 ? (
          <>
            <View style={{ position: 'absolute', left: ox, top: oy }}><SvgXml xml={xml} width={ROOM_W * k} height={ROOM_H * k} /></View>
            {lanterns.map((l, i) => {
              const [x, y] = slots[i];
              return (
                <Pressable key={l.puzzle} accessibilityRole="button"
                  accessibilityLabel={`Lanterne ${i + 1} sur ${slotObject(lanterns.length, i)} : ${FAMILIES[l.family as keyof typeof FAMILIES].name}, ${TIER_NAMES[l.tier]}, ${lit[i] ? 'allumée' : 'éteinte'}${i === rec ? ', recommandée' : ''}`}
                  disabled={!open}
                  onPress={() => choose(i)}
                  style={{ position: 'absolute', left: ox + x * k - L / 2, top: oy + y * k - L * (34 / 60), width: L, height: L, alignItems: 'center', justifyContent: 'center' }}>
                  {i === rec && open ? <PulseRing size={34 * k} /> : null}
                  <SvgXml xml={roomLanternXml(i, lit[i])} width={L} height={L} style={{ position: 'absolute', left: 0, top: 0 }} />
                </Pressable>
              );
            })}
          </>
        ) : null}
      </View>

      <Pressable accessibilityRole={found ? 'button' : undefined} disabled={!found} onPress={() => router.push({ pathname: '/carnet', params: { tab: 'objets' } })} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {found ? <Icon name="star" size={18} color={T.gold} /> : <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.tx3 }} />}
        <Text style={type.foot}>{found ? `Objet trouvé : ${object.name}` : `Un objet se cache ici. Allume les ${lanterns.length} lanternes.`}</Text>
      </Pressable>
      {rec >= 0
        ? <Button title={`Allumer la lanterne ${rec + 1} · ${FAMILIES[lanterns[rec].family as keyof typeof FAMILIES].name}`} onPress={() => choose(rec)} style={{ marginTop: 6 }} disabled={!open} />
        : <Button title="Retour au bâtiment" kind="secondary" onPress={() => goBack()} style={{ marginTop: 6 }} />}

      <Sheet visible={sel !== null} onClose={() => setSelected(null)}>
        {sel && selected !== null ? (
          <View>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <GlyphCircle icon={sel.family} size={56} color={lit[selected] ? T.gold : T.amber} />
              <View style={{ flex: 1 }}>
                <Text style={type.cap}>Lanterne {selected + 1} · {slotObject(lanterns.length, selected)}</Text>
                <Text style={type.title2}>{FAMILIES[sel.family as keyof typeof FAMILIES].name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><TierBars tier={sel.tier} /><Text style={type.sub}>{TIER_NAMES[sel.tier]}</Text></View>
              <Pill icon="shard" iconColor={T.moon}>+{REWARDS[sel.tier]}</Pill>
              {lit[selected] ? <Pill icon="check" iconColor={T.gold} color={T.gold}>Résolue</Pill> : null}
            </View>
            <Text style={[type.sub, { marginBottom: 16 }]}>{FAMILIES[sel.family as keyof typeof FAMILIES].rule}</Text>
            <Button title={lit[selected] ? 'Rejouer' : state.inProgress.has(sel.puzzle) ? 'Reprendre' : 'Allumer'} onPress={() => play(selected)} />
            <Button title="Plus tard" kind="ghost" onPress={() => setSelected(null)} style={{ marginTop: 4 }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
