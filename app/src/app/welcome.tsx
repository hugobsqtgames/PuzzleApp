// Splash then onboarding (GAME_DESIGN § 14): 3 short pages, then the first
// puzzle. No account, no permission, no choice to make.
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize } from '../ui/layout';
import { useAnimatedValue } from '../ui/motion';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { LinearGradientBackdrop } from '../ui/Backdrop';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Nilo } from '../ui/components';
import { vesperWindowXml, DistrictView } from '../ui/art';
import { T, type } from '../ui/theme';
import { WORLD } from '../game/catalog';
import { infoOf } from '../game/views';
import { look } from '../game/rewards';
import { tr, translated } from '../i18n';

const TEXTS = translated(['Vesper s’est éteinte.', 'Chaque énigme rallume une lumière.', 'Nilo t’accompagne.']);
const SUBS = translated([
  'Une ville suspendue entre deux crépuscules. Son Allumeur a disparu.',
  'Résous un casse-tête : une lanterne s’allume, la ville se souvient.',
  'Il porte la dernière flamme de Vesper. Il t’aidera, sans jamais te presser.',
]);
export const TUTORIAL_LANTERN = 'phare.b1.r1.1';

function views(mode: 'dark' | 'phare'): DistrictView[] {
  return WORLD.districts.filter((d) => d.id !== 'grenier').map((d) => ({
    id: d.id, hue: infoOf(d).hue, name: infoOf(d).short, label: '',
    state: mode === 'phare' && d.id === 'phare' ? 'open' : 'locked', lit: mode === 'phare' && d.id === 'phare' ? 1 : 0, dark: mode === 'dark',
  }));
}

export default function Welcome() {
  const { state, openLantern } = useStore();
  const { width, height } = useContentSize();
  const [page, setPage] = useState(-1); // -1 = splash
  const fade = useAnimatedValue(0);
  const dark = useMemo(() => vesperWindowXml(views('dark'), 390, 470), []);
  const phare = useMemo(() => vesperWindowXml(views('phare'), 390, 470), []);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [fade, page]);
  // The splash moves on by itself after 2 s (a tap skips it).
  useEffect(() => {
    if (page !== -1) return;
    const id = setTimeout(() => setPage(0), 2200);
    return () => clearTimeout(id);
  }, [page]);

  const start = () => { if (openLantern(TUTORIAL_LANTERN)) router.replace('/puzzle'); else router.replace('/'); };

  if (page === -1) {
    return (
      <Pressable style={{ flex: 1, backgroundColor: '#05060f', alignItems: 'center', justifyContent: 'center', gap: 18 }} onPress={() => setPage(0)} accessibilityLabel={tr('Toucher pour continuer')}>
        <Animated.View style={{ opacity: fade, alignItems: 'center', gap: 18 }}>
          <Nilo size={180} look={look(state)} />
          <Text style={[type.display, { fontSize: 48, lineHeight: 52 }]}>{tr('Lampion')}</Text>
          <Text style={[type.dialogue, { color: T.gold }]}>{tr('Chaque énigme rallume une lumière.')}</Text>
        </Animated.View>
        <Text style={[type.foot, { position: 'absolute', bottom: 36, opacity: 0.6 }]}>{tr('Touche pour continuer')}</Text>
      </Pressable>
    );
  }

  return (
    <Screen place="night" padded={false}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 40, height: Math.min(470, height * 0.56), opacity: fade }}>
        {page < 2
          ? <SvgXml xml={page === 0 ? dark : phare} width={width} height={Math.min(470, height * 0.56)} />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Nilo size={230} mood="joy" look={look(state)} /></View>}
      </Animated.View>
      <LinearGradientBackdrop />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 40, gap: 14 }}>
        <Text style={[type.display, { fontSize: 34, lineHeight: 40 }]}>{TEXTS[page]}</Text>
        <Text style={[type.body, { color: T.tx2 }]}>{SUBS[page]}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
          {[0, 1, 2].map((k) => <View key={k} style={{ width: k === page ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === page ? T.amber : T.line }} />)}
        </View>
        {page < 2 ? <Button title={tr('Continuer')} onPress={() => setPage(page + 1)} /> : <Button title={tr('Allumer la première lanterne')} onPress={start} />}
        <Button title={tr('Passer')} kind="ghost" onPress={start} />
      </View>
    </Screen>
  );
}
