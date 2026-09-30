import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Text';
import { useContentSize } from '../../ui/layout';
import { goBack } from '../../ui/nav';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../../game/store';
import { Screen } from '../../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, Icon, tap } from '../../ui/components';
import { coupeRects, coupeXml, RoomCell } from '../../ui/art';
import { T, type } from '../../ui/theme';
import { RoomRow, buildingName, current, infoOf, locateBuilding, roomName, roomRows } from '../../game/views';
import { buildingLanterns } from '../../core/game/world';
import { tr } from '../../i18n';

export default function BuildingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, engine, showToast, play, openLantern } = useStore();
  const { width } = useContentSize();
  const p = engine.progression;
  const at = locateBuilding(id ?? '');
  const here = current(p, state).lantern;
  const rows = useMemo(() => (at ? roomRows(p, state, at.district, at.index, here) : []), [p, state, at, here]);
  if (!at) return <Screen><BackButton label={tr('Vesper')} onPress={() => goBack()} /></Screen>;
  const { district: d, building: b, index: bi } = at;
  const info = infoOf(d);
  const all = buildingLanterns(b), lit = p.lights(all, state);
  const complete = lit === all.length;
  const w = Math.min(width, 600) - 32, k = w / 360;
  const rects = coupeRects(b.rooms.length, !!b.keystone);
  const cells: RoomCell[] = rows.map((r) => ({
    label: r.key ? tr('Lanterne-clé') : r.label, key: r.key, lit: r.lit, total: r.total, state: r.state,
    sub: r.state === 'locked' ? tr('Verrouillée') : r.key ? (r.lit ? tr('Allumée') : tr('Ouverte')) : r.state === 'done' ? tr('Complète') : `${r.lit} / ${r.total}`,
  }));
  const xml = coupeXml(info.hue, cells, rects);

  const openRow = (r: RoomRow) => {
    if (r.state === 'locked') { tap('error'); play('locked'); showToast(tr('Salle verrouillée. {0}.', [r.lockText]), 'lock'); return; }
    tap();
    if (r.key && b.keystone) { if (openLantern(b.keystone.puzzle)) router.push('/puzzle'); return; }
    if (r.room) router.push({ pathname: '/room/[id]', params: { id: r.room.id } });
  };
  const target = rows.find((r) => r.state === 'current') ?? rows.find((r) => r.state === 'open') ?? rows[0];

  return (
    <Screen scroll place={info.sound}>
      <BackButton label={d.id === 'grenier' ? 'Le Phare' : info.short} onPress={() => goBack()} />
      <Crumb parent={info.short} current={buildingName(d, bi)} />
      <Text style={type.title1}>{buildingName(d, bi)}</Text>
      <GaugeRow n={lit} total={all.length} label={tr('Lanternes du bâtiment')} />
      <View style={{ width: w, height: 440 * k }}>
        <SvgXml xml={xml} width={w} height={440 * k} />
        {rows.map((r, i) => {
          const rc = rects[i];
          if (!rc) return null;
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${r.key ? tr('Lanterne-clé') : roomName(d, bi, r.index)}, ${r.state === 'locked' ? tr('verrouillée') : tr('{0} sur {1}', [r.lit, r.total])}`}
              onPress={() => openRow(r)} style={{ position: 'absolute', left: rc.x * k, top: rc.y * k, width: rc.w * k, height: rc.h * k }} />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="moonI" size={18} color={T.tx2} />
        <Text style={[type.foot, { flex: 1 }]}>{complete ? info.buildings[bi].residentAwake : info.buildings[bi].resident}</Text>
      </View>
      {target ? (
        <Button
          title={target.key ? tr('Lanterne-clé') : `${target.label} · ${roomName(d, bi, target.index)} · ${target.lit} / ${target.total}`}
          onPress={() => openRow(target)}
        />
      ) : null}
    </Screen>
  );
}
