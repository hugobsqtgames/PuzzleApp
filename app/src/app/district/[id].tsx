import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Text';
import { useContentSize } from '../../ui/layout';
import { goBack } from '../../ui/nav';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../../game/store';
import { Screen } from '../../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, Icon, tap } from '../../ui/components';
import { PANORAMA, districtXml } from '../../ui/art';
import { T, type } from '../../ui/theme';
import { BuildingRow, buildingRows, current, districtById, infoOf, unlockText } from '../../game/views';
import { districtLanterns } from '../../core/game/world';
import { tr } from '../../i18n';

export default function DistrictScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, engine, showToast, play } = useStore();
  const { width } = useContentSize();
  const p = engine.progression;
  const d = districtById(id ?? 'phare');
  const info = infoOf(d);
  // French agrees the keeper's words with her or him (L’Horlogère, La Marchande…).
  const keeperFeminine = !!info.keeper && (info.keeper.name.startsWith('La ') || info.keeper.name === 'L’Horlogère');
  // The Grenier de l'Allumeur is at the top of the Phare: shown with it.
  const grenier = d.id === 'phare' ? districtById('grenier') : null;
  const rows = buildingRows(p, state, d);
  const all = districtLanterns(d), lit = p.lights(all, state);
  const complete = lit === all.length;
  const artW = Math.min(width, 600) - 32;
  const buildings = [...rows.map((r) => ({ name: r.name, open: r.open, lit: r.lit / r.total })),
    ...(grenier ? [{ name: 'Grenier', open: p.isDistrictUnlocked(grenier, p.totalLights(state), p.letters(state)), lit: p.lights(districtLanterns(grenier), state) / 16 }] : [])];
  const xml = districtXml(d.id, info.hue, buildings, complete);
  const k = Math.max(artW / 360, 250 / 300);
  const ox = (artW - 360 * k) / 2, oy = 250 - 300 * k;
  const plan = PANORAMA[d.id] ?? PANORAMA.horlo;
  const here = current(p, state).lantern;
  const hereBuilding = here ? p.locate(here.puzzle)?.building.id : undefined;
  const target = rows.find((r) => r.building.id === hereBuilding) ?? rows.find((r) => r.open && !r.complete) ?? rows[0];

  const openBuilding = (r: BuildingRow) => {
    if (!r.open) { tap('error'); play('locked'); showToast(`${r.lockText}.`, 'lock'); return; }
    tap();
    router.push({ pathname: '/building/[id]', params: { id: r.building.id } });
  };
  const openGrenier = () => {
    if (!grenier) return;
    if (!p.isDistrictUnlocked(grenier, p.totalLights(state), p.letters(state))) {
      tap('error'); play('locked');
      showToast(tr('Grenier de l’Allumeur : {0}', [unlockText(grenier, p.totalLights(state), p.letters(state))]), 'lock');
      return;
    }
    router.push({ pathname: '/building/[id]', params: { id: grenier.buildings[0].id } });
  };

  return (
    <Screen scroll place={info.sound}>
      <BackButton label={tr('Vesper')} onPress={() => goBack()} />
      <Crumb parent={tr('Vesper')} current={info.short} />
      <Text style={type.title1}>{info.name}</Text>
      <GaugeRow n={lit} total={all.length} label={tr('Lanternes du quartier')} />
      <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: T.line, height: 250 }}>
        <SvgXml xml={xml} width={artW} height={250} />
        {buildings.map((b, i) => {
          const [x, w, h] = plan[i] ?? plan[0];
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={b.name} onPress={() => (i < rows.length ? openBuilding(rows[i]) : openGrenier())}
              style={{ position: 'absolute', left: ox + x * k, top: oy + (262 - h - w * 0.7) * k, width: w * k, height: (h + w * 0.7) * k }} />
          );
        })}
      </View>
      <View>
        {rows.map((r) => (
          <Pressable key={r.building.id} accessibilityRole="button" onPress={() => openBuilding(r)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, minHeight: 52 }}>
            {r.open
              ? <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: T.amber, opacity: 0.3 + 0.7 * (r.lit / r.total), shadowColor: T.amber, shadowOpacity: 0.8, shadowRadius: 8 }} />
              : <Icon name="lock" size={20} color={T.tx3} />}
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, !r.open && { color: T.tx2 }]}>{r.name}</Text>
              <Text style={type.foot}>{r.open ? tr('{0} / {1} lanternes', [r.lit, r.total]) + (r.complete ? tr(' · habitant réveillé') : '') : r.lockText}</Text>
            </View>
            <Icon name="chev" size={18} color={T.tx3} />
          </Pressable>
        ))}
        {grenier ? (
          <Pressable accessibilityRole="button" onPress={openGrenier} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 52 }}>
            <Icon name={p.isDistrictUnlocked(grenier, p.totalLights(state), p.letters(state)) ? 'star' : 'lock'} size={20} color={T.gold} />
            <View style={{ flex: 1 }}>
              <Text style={type.headline}>{tr('Le Grenier de l’Allumeur')}</Text>
              <Text style={type.foot}>{p.isDistrictUnlocked(grenier, p.totalLights(state), p.letters(state)) ? tr('{0} / {1} lanternes', [p.lights(districtLanterns(grenier), state), 16]) : tr('590 lumières et 4 lettres de l’Allumeur · {0} / 6 lettres', [p.letters(state)])}</Text>
            </View>
            <Icon name="chev" size={18} color={T.tx3} />
          </Pressable>
        ) : null}
      </View>
      {info.keeper ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="moonI" size={18} color={T.tx2} />
          <Text style={[type.foot, { flex: 1 }]}>
            {complete ? `${tr(keeperFeminine ? '{0} est réveillée.' : '{0} est réveillé.', [info.keeper.name])} ${info.keeper.line}` : tr(keeperFeminine ? '{0} dort. Éclaire tout le quartier pour la réveiller.' : '{0} dort. Éclaire tout le quartier pour le réveiller.', [info.keeper.name])}
          </Text>
        </View>
      ) : null}
      {target ? <Button title={tr('Entrer · {0}', [target.name])} onPress={() => openBuilding(target)} style={{ marginTop: 4 }} /> : null}
    </Screen>
  );
}
