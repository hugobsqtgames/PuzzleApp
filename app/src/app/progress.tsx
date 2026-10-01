// « Où en suis-je ? » : where the player is, and the whole way through Vesper.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, Crumb, Gauge, Icon, tap } from '../ui/components';
import { T, type } from '../ui/theme';
import { WORLD } from '../game/catalog';
import { buildingName, buildingRows, current, districtState, infoOf, locateRoom, roomLabel, unlockText } from '../game/views';
import { districtLanterns } from '../core/game/world';
import { tr } from '../i18n';

export default function Progress() {
  const { state, engine, openLantern } = useStore();
  const p = engine.progression;
  const cur = current(p, state);
  const total = p.totalLights(state), letters = p.letters(state);
  const loc = cur.lantern ? p.locate(cur.lantern.puzzle) : null;
  const room = loc?.room ? locateRoom(loc.room.id) : null;
  const go = () => {
    if (!cur.lantern) return;
    if (openLantern(cur.lantern.puzzle)) router.push('/puzzle');
  };

  return (
    <Screen scroll place="night" style={{ gap: 16 }}>
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <Text style={type.title1}>{tr('Où en suis-je ?')}</Text>

      {/* Here, now. */}
      <Card style={{ gap: 10 }}>
        <Text style={[type.cap, { color: T.gold }]}>{tr('Tu es ici')}</Text>
        {loc ? (
          <>
            <Crumb parent={infoOf(loc.district).short} current={buildingName(loc.district, loc.district.buildings.indexOf(loc.building))} />
            <Text style={type.title2}>{room ? roomLabel(room.district, room.buildingIndex, room.index) : tr('Lanterne-clé')}</Text>
            {room ? <Text style={type.foot}>{tr('{0} / {1} lanternes dans cette salle', [p.lights(room.room.lanterns, state), room.room.lanterns.length])}</Text> : null}
            <Button title={tr('Continuer ici')} icon="light" onPress={go} />
          </>
        ) : <Text style={type.body}>{tr('Vesper est entièrement éclairée.')}</Text>}
      </Card>

      {/* The whole way, district after district. */}
      <Text style={type.cap}>{tr('Le chemin')}</Text>
      <View style={{ gap: 0 }}>
        {WORLD.districts.map((d, i) => {
          const all = districtLanterns(d), lit = p.lights(all, state);
          const st = districtState(p, state, d, cur.district.id);
          const done = lit === all.length;
          const info = infoOf(d);
          const color = st === 'locked' ? T.tx3 : done ? T.gold : st === 'current' ? T.amber : info.hue;
          const last = i === WORLD.districts.length - 1;
          return (
            <View key={d.id} style={{ flexDirection: 'row', gap: 14 }}>
              {/* The line of the path, with a stop per district. */}
              <View style={{ width: 28, alignItems: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, marginTop: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? T.gold : st === 'current' ? T.amber : 'transparent', borderWidth: 2, borderColor: color }}>
                  {done ? <Icon name="check" size={13} color={T.bg} sw={2.4} /> : st === 'locked' ? <Icon name="lock" size={11} color={T.tx3} /> : null}
                </View>
                {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: done ? T.gold : T.line }} /> : null}
              </View>
              <Pressable accessibilityRole="button" disabled={st === 'locked'} onPress={() => { tap(); router.push({ pathname: '/district/[id]', params: { id: d.id === 'grenier' ? 'phare' : d.id } }); }}
                style={{ flex: 1, paddingBottom: 18, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={[type.headline, { flex: 1, color: st === 'locked' ? T.tx2 : T.tx }]}>{info.short}</Text>
                  <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{lit} / {all.length}</Text>
                </View>
                {st === 'locked' ? <Text style={type.foot}>{unlockText(d, total, letters)}</Text> : <Gauge n={lit} total={all.length} height={5} />}
                {/* The district the player is in: its buildings. */}
                {st === 'current' ? (
                  <View style={{ gap: 6, marginTop: 8 }}>
                    {buildingRows(p, state, d).map((b) => (
                      <View key={b.building.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon name={b.complete ? 'check' : b.open ? 'light' : 'lock'} size={14} color={b.complete ? T.gold : b.open ? T.amber : T.tx3} />
                        <Text style={[type.sub, { flex: 1, color: b.open ? T.tx : T.tx3 }]}>{b.name}</Text>
                        <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{b.lit} / {b.total}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="letter" size={22} color={T.gold} />
        <Text style={[type.body, { flex: 1 }]}>{tr('Lettres de l’Allumeur : {0} / {1}', [letters, 6])}</Text>
      </Card>
    </Screen>
  );
}
