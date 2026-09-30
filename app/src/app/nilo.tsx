import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Nilo } from '../ui/components';
import { Mood } from '../ui/art';
import { T, type } from '../ui/theme';
import { look } from '../game/rewards';
import { tr, translated } from '../i18n';

const MOODS: Mood[] = ['curious', 'joy', 'oops', 'sleep', 'wonder', 'hint', 'think', 'neutral'];
const MOOD_FR: Record<Mood, string> = translated({ curious: 'Curieux', joy: 'Joie', oops: 'Oups', sleep: 'Sommeil', neutral: 'Neutre', think: 'Réflexion', hint: 'Indice', wonder: 'Émerveillement' });

export default function NiloScreen() {
  const { state, engine, showToast, noteProfile } = useStore();
  const [mood, setMood] = useState<Mood>('curious');
  const [hatFell, setHatFell] = useState(false);
  const taps = useRef<number[]>([]);
  const lk = look(state);

  const pet = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    // Tapped five times in a row with a hat on: the hat falls (achievement "Maladroit").
    if (taps.current.length >= 5 && lk.hat !== 'none' && !hatFell) {
      setHatFell(true);
      setMood('oops');
      showToast(tr('Oups ! Le chapeau de Nilo est tombé.'), 'star');
      noteProfile((p) => ({ ...p, hatDrops: p.hatDrops + 1 }));
      setTimeout(() => setHatFell(false), 3000);
      return;
    }
    const next = MOODS[(MOODS.indexOf(mood) + 1) % MOODS.length];
    setMood(next);
    showToast(`Nilo : ${MOOD_FR[next]}`, 'light');
  };

  return (
    <Screen style={{ gap: 12 }} place="lighthouse">
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Nilo size={250} mood={mood} look={hatFell ? { ...lk, hat: 'none' } : lk} onPress={pet} />
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={type.title1}>{tr('Nilo')}</Text>
        <Text style={[type.dialogue, { color: T.tx2 }]}>{tr('Apprenti de l’Allumeur. Dernière flamme de Vesper.')}</Text>
        <Text style={type.sub}>{tr('Vous avez allumé')} <Text style={{ color: T.tx, fontWeight: '700' }}>{engine.progression.totalLights(state)}</Text> {tr('lanternes ensemble.')}</Text>
        <Text style={type.foot}>{tr('Touche Nilo pour voir ses humeurs.')}</Text>
      </View>
      <Button title={tr('Personnaliser')} onPress={() => router.push('/custom')} />
      <Button title={tr('Retour')} kind="ghost" onPress={() => goBack()} />
    </Screen>
  );
}
