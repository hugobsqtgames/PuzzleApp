import React, { useState } from 'react';
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
import { keeperLine } from '../../content/keepers';
import { tr } from '../../i18n';

export default function DistrictScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, engine, showToast, play } = useStore();
  const { width } = useContentSize();
  const p = engine.progression;
  const d = districtById(id ?? 'phare');
  const info = infoOf(d);
  // French agrees the keeper's words with her or him (L’Horlogère, La Marchande…).
  const [talk, setTalk] = useState(0);
  const keeperFeminine = !!info.keeper && (info.keeper.name.startsWith('La ') || info.keeper.name === 'L’Horlogère');
  // The Grenier de l'Allumeur is at the top of the Phare: shown with it, but only once the
  // last district (the Observatoire) has opened. Before that it stays a surprise.
  const total = p.totalLights(state), letters = p.letters(state);
  const grenierDistrict = d.id === 'phare' ? districtById('grenier') : null;
  const grenierOpen = !!grenierDistrict && p.isDistrictUnlocked(grenierDistrict, total, letters);
  const grenier = grenierDistrict && (grenierOpen || p.isDistrictUnlocked(districtById('obs'), total, letters)) ? grenierDistrict : null;
  const rows = buildingRows(p, state, d);
  const all = districtLanterns(d), lit = p.lights(all, state);
  const complete = lit === all.length;
  const artW = Math.min(width, 600) - 32;
  const buildings = [...rows.map((r) => ({ name: r.name, open: r.open, lit: r.lit / r.total })),
    ...(grenier ? [{ name: 'Grenier', open: grenierOpen, lit: p.lights(districtLanterns(grenier), state) / 16 }] : [])];
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
    if (!grenierOpen) {
      tap('error'); play('locked');
      showToast(tr('Grenier de l’Allumeur : {0}', [unlockText(grenier, total, letters)]), 'lock');
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
            <Icon name={grenierOpen ? 'star' : 'lock'} size={20} color={T.gold} />
            <View style={{ flex: 1 }}>
              <Text style={type.headline}>{tr('Le Grenier de l’Allumeur')}</Text>
              <Text style={type.foot}>{grenierOpen ? tr('{0} / {1} lanternes', [p.lights(districtLanterns(grenier), state), 16]) : unlockText(grenier, total, letters)}</Text>
            </View>
            <Icon name="chev" size={18} color={T.tx3} />
          </Pressable>
        ) : null}
      </View>
      {info.keeper ? (
        // Touch the keeper: a word from them (in their sleep, until the district is lit).
        <Pressable accessibilityRole="button" accessibilityHint={tr('Toucher pour lui parler')} onPress={() => { tap(); setTalk((n) => n + 1); }}
          style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name={complete ? 'star' : 'moonI'} size={18} color={complete ? T.gold : T.tx2} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={type.foot}>
              {complete ? `${tr(keeperFeminine ? '{0} est réveillée.' : '{0} est réveillé.', [info.keeper.name])} ${info.keeper.line}` : tr(keeperFeminine ? '{0} dort. Éclaire tout le quartier pour la réveiller.' : '{0} dort. Éclaire tout le quartier pour le réveiller.', [info.keeper.name])}
            </Text>
            {talk > 0 && keeperLine(d.id, complete, lit / all.length, talk - 1) ? (
              <View style={{ alignSelf: 'flex-start', backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 14, borderTopLeftRadius: 4, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={[type.dialogue, { color: complete ? T.tx : T.tx2 }]}>{tr(keeperLine(d.id, complete, lit / all.length, talk - 1)!)}</Text>
              </View>
            ) : <Text style={[type.foot, { color: T.tx3 }]}>{tr('Touche pour lui parler.')}</Text>}
          </View>
        </Pressable>
      ) : null}
      {target ? <Button title={tr('Entrer · {0}', [target.name])} onPress={() => openBuilding(target)} style={{ marginTop: 4 }} /> : null}
    </Screen>
  );
}
