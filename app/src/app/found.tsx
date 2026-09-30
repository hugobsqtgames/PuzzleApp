// What a success reveals, one screen at a time: the room's object, the
// resident who wakes up, the district keeper, a letter of the Allumeur, a
// new district.
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize } from '../ui/layout';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Icon, Nilo, Pill, ShardPill } from '../ui/components';
import { districtXml, letterArtXml } from '../ui/art';
import { objectSvg } from '../ui/scenes/objects';
import { T, type } from '../ui/theme';
import { LETTERS } from '../content/vesper';
import { achievementContext, COSMETICS, look } from '../game/rewards';
import { allRooms, buildingName, districtById, infoOf, locateBuilding, locateRoom, roomName } from '../game/views';
import { WORLD } from '../game/catalog';
import { followUps } from './success';

const kindOf = (steps: string[], step?: string) => (steps[Math.max(0, Number(step ?? 0))] ?? '').split(':')[0];
const idOf = (steps: string[], step?: string) => (steps[Math.max(0, Number(step ?? 0))] ?? '').split(':')[1] ?? '';

export default function Found() {
  const { step, object: objectParam } = useLocalSearchParams<{ step?: string; object?: string }>();
  const { state, engine, profile, result, play, equip, openLantern } = useStore();
  const { width } = useContentSize();
  const steps = useMemo(() => (objectParam ? [`object:${objectParam}`] : followUps(result)), [result, objectParam]);
  const i = Math.max(0, Number(step ?? 0));
  const [kind, id] = (steps[i] ?? '').split(':');
  const pickedHere = kindOf(steps, step) === 'object' && profile.picked.includes(idOf(steps, step));

  useEffect(() => {
    if (kind === 'object' && pickedHere) play('roomCompleted');
    if (kind === 'resident' || kind === 'keeper') play('unlock');
    if (kind === 'district') play('newDistrict');
    if (kind === 'letter') play('hint');
  }, [kind, id, play, pickedHere]);

  const next = () => {
    if (objectParam) { router.back(); return; }
    if (i + 1 < steps.length) { router.replace({ pathname: '/found', params: { step: String(i + 1) } }); return; }
    const cur = engine.progression.recommended(state);
    if (kind === 'district' || kind === 'keeper' || !cur) { router.dismissTo('/'); return; }
    if (openLantern(cur.puzzle)) router.replace('/puzzle'); else router.dismissTo('/');
  };

  let body: React.ReactNode = null;
  let buttons: React.ReactNode = <Button title="Continuer" onPress={next} />;

  if (kind === 'object') {
    const at = locateRoom(id);
    if (at) {
      const info = infoOf(at.district);
      const obj = info.buildings[at.buildingIndex].rooms[at.index].object;
      const where = at.room.lanterns.length === 16 ? 'Le Grenier' : `Salle ${at.index + 1} · ${roomName(at.district, at.buildingIndex, at.index)}`;
      if (!pickedHere) {
        // The room is lit: its object glints somewhere in the scenery. The player finds it.
        body = (
          <>
            <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,217,142,0.08)' }} />
              <Icon name="star" size={56} color={T.gold} sw={1.2} />
            </View>
            <Text style={[type.cap, { color: T.gold }]}>{where}</Text>
            <Text style={[type.title1, { textAlign: 'center' }]}>La salle est éclairée</Text>
            <Text style={[type.sub, { maxWidth: 320, textAlign: 'center' }]}>Maintenant que tout est allumé, quelque chose brille dans le décor. Retrouve l’objet caché.</Text>
          </>
        );
        buttons = (
          <>
            <Button title="Chercher l’objet" icon="star" onPress={() => router.replace({ pathname: '/room/[id]', params: { id, search: '1', step: String(i) } })} />
            <Button title="Plus tard" kind="ghost" onPress={next} />
          </>
        );
      } else {
        body = (
          <>
            <View style={{ width: 200, height: 170, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,217,142,0.10)' }} />
              <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: info.hue, opacity: 0.12 }} />
              <SvgXml xml={objectSvg(obj.name, T.gold, 1.4)} width={96} height={96} />
            </View>
            <Text style={[type.cap, { color: T.gold }]}>{where}</Text>
            <Text style={type.title1}>Objet trouvé</Text>
            <Text style={[type.title3, { textAlign: 'center' }]}>{obj.name}</Text>
            <Text style={[type.dialogue, { maxWidth: 320, textAlign: 'center', color: T.tx2 }]}>{obj.story}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}><ShardPill n="+20" /><Pill icon="book">Carnet · {profile.picked.length} / {allRooms().length}</Pill></View>
          </>
        );
      }
    }
  }

  if (kind === 'resident') {
    const at = locateBuilding(id);
    if (at) {
      const ctx = achievementContext(state, engine.progression, profile);
      const reward = COSMETICS.find((c) => c.earn && c.earn.when(ctx) && c.earn.text.includes(buildingName(at.district, at.index)));
      body = (
        <>
          <Nilo size={150} mood="wonder" look={look(state)} />
          <Text style={[type.cap, { color: T.gold }]}>Bâtiment entièrement éclairé</Text>
          <Text style={[type.title1, { textAlign: 'center' }]}>{buildingName(at.district, at.index)}</Text>
          <Text style={[type.dialogue, { textAlign: 'center' }]}>{infoOf(at.district).buildings[at.index].residentAwake}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ShardPill n="+50" />
            {reward ? <Pill icon="star" iconColor={T.gold}>{reward.name}</Pill> : null}
          </View>
        </>
      );
      if (reward) buttons = (<><Button title={`Porter : ${reward.name}`} onPress={() => { equip(reward.slot, reward.id); next(); }} /><Button title="Plus tard" kind="ghost" onPress={next} /></>);
    }
  }

  if (kind === 'keeper') {
    const d = districtById(id);
    const info = infoOf(d);
    body = (
      <>
        <View style={{ width: width - 32, height: 200, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={districtXml(d.id, info.hue, d.buildings.map((_, bi) => ({ name: buildingName(d, bi), open: true, lit: 1 })), true)} width={width - 32} height={200} />
        </View>
        <Text style={[type.cap, { color: info.hue }]}>Quartier entièrement éclairé</Text>
        <Text style={[type.title1, { textAlign: 'center' }]}>{info.name}</Text>
        {info.keeper ? <Text style={[type.dialogue, { textAlign: 'center' }]}>{info.keeper.name} se réveille. {info.keeper.line}</Text> : null}
        <ShardPill n="+100" />
      </>
    );
  }

  if (kind === 'letter') {
    const from = id.split('.')[0];
    const letter = LETTERS.find((l) => l.from === from);
    if (letter) body = (
      <>
        <SvgXml xml={letterArtXml()} width={200} height={150} />
        <Text style={[type.cap, { color: T.gold }]}>Lettre de l’Allumeur</Text>
        <Text style={type.title1}>{letter.title}</Text>
        <Text style={[type.dialogue, { textAlign: 'center', maxWidth: 340 }]}>« {letter.text} »</Text>
      </>
    );
  }

  if (kind === 'district') {
    const d = WORLD.districts.find((x) => x.id === id)!;
    const info = infoOf(d);
    const families = [...new Set(d.buildings.flatMap((b) => b.rooms.flatMap((r) => r.lanterns.map((l) => l.family))))];
    body = (
      <>
        <View style={{ width: width - 32, height: 220, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={districtXml(d.id, info.hue, d.buildings.map((_, bi) => ({ name: buildingName(d, bi), open: bi === 0, lit: 0.15 })), false)} width={width - 32} height={220} />
        </View>
        <Text style={[type.cap, { color: info.hue }]}>Nouveau quartier</Text>
        <Text style={[type.display, { fontSize: 34, lineHeight: 40, textAlign: 'center' }]}>{info.name}</Text>
        <Text style={[type.dialogue, { color: T.tx2 }]}>{info.tagline}</Text>
        <Text style={[type.sub, { textAlign: 'center' }]}>{families.length} familles de casse-têtes t’y attendent.</Text>
      </>
    );
    buttons = (
      <>
        <Button title="Entrer" onPress={() => { router.dismissTo('/'); router.push({ pathname: '/district/[id]', params: { id: d.id === 'grenier' ? 'phare' : d.id } }); }} />
        {i + 1 < steps.length ? <Button title="Continuer" kind="ghost" onPress={next} /> : <Button title="Plus tard" kind="ghost" onPress={() => router.dismissTo('/')} />}
      </>
    );
  }

  return (
    <Screen style={{ gap: 12, paddingTop: 72 }} place={kind === 'district' ? 'glasshouse' : undefined}>
      <View style={{ alignItems: 'center', gap: 12 }}>{body}</View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 4 }}>{buttons}</View>
    </Screen>
  );
}
