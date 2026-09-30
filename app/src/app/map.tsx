import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize } from '../ui/layout';
import { goBack } from '../ui/nav';
import { router, useFocusEffect } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../game/store';
import { BackButton, LightPill, Nilo, Toast, tap } from '../ui/components';
import { MAP_H, MAP_POS, MAP_W, mapXml } from '../ui/art';
import { type } from '../ui/theme';
import { current, districtById, districtViews, infoOf, lowerFirst, unlockText } from '../game/views';
import { look } from '../game/rewards';
import { tr } from '../i18n';

export default function MapScreen() {
  const { state, engine, showToast, toast, play, enterPlace } = useStore();
  useFocusEffect(useCallback(() => { enterPlace('night'); }, [enterPlace]));
  const { width, height } = useContentSize();
  const insets = useSafeAreaInsets();
  const p = engine.progression;
  const k = width / MAP_W;
  const views = useMemo(() => districtViews(p, state).filter((v) => MAP_POS[v.id]), [p, state]);
  const xml = useMemo(() => mapXml(views), [views]);
  const here = current(p, state).district.id;
  const [hx, hy] = MAP_POS[here === 'grenier' ? 'phare' : here] ?? MAP_POS.phare;
  // Opens on the current district, a little below the middle: Vesper reads from the bottom up.
  const startY = Math.min(Math.max(0, MAP_H * k - height), Math.max(0, hy * k - height * 0.58));
  const scroller = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  const onDistrict = (id: string) => {
    const v = views.find((x) => x.id === id)!;
    if (v.state === 'locked') {
      tap('error');
      play('locked');
      showToast(`${infoOf(districtById(id)).short} ${lowerFirst(unlockText(districtById(id), p.totalLights(state), p.letters(state)))}`, 'lock');
      return;
    }
    tap();
    router.push({ pathname: '/district/[id]', params: { id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080914' }}>
      <ScrollView ref={scroller} onContentSizeChange={() => { if (!scrolled.current) { scrolled.current = true; scroller.current?.scrollTo({ y: startY, animated: false }); } }} contentOffset={{ x: 0, y: startY }} showsVerticalScrollIndicator={false}>
        <View style={{ width, height: MAP_H * k, alignSelf: 'center' }}>
          <SvgXml xml={xml} width={width} height={MAP_H * k} />
          {views.map((d) => {
            const [cx, cy, sc] = MAP_POS[d.id];
            return (
              <Pressable key={d.id} accessibilityRole="button"
                accessibilityLabel={`${infoOf(districtById(d.id)).name}, ${d.state === 'locked' ? tr('verrouillé') : d.label.replace('/', tr('sur'))}`}
                onPress={() => onDistrict(d.id)}
                style={{ position: 'absolute', left: (cx - 100) * k, top: (cy - 120 * sc - 20) * k, width: 200 * k, height: (120 * sc + 80) * k }} />
            );
          })}
          <View style={{ position: 'absolute', left: (hx + 62) * k, top: (hy - 38) * k }} pointerEvents="none">
            <Nilo size={120 * 0.36 * k} mood="curious" look={look(state)} />
          </View>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: 'rgba(8,9,20,0.88)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton label={tr('Accueil')} onPress={() => goBack()} />
        <Text style={[type.title2, { position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center' }]} pointerEvents="none">{tr('Vesper')}</Text>
        <LightPill n={p.totalLights(state)} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8 }} pointerEvents="none">
        <Toast text={toast?.text ?? null} icon={toast?.icon} />
      </View>
    </View>
  );
}
