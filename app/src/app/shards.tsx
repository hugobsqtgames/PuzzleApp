import React from 'react';
import { Text, View } from 'react-native';
import { goBack } from '../ui/nav';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Card, Icon } from '../ui/components';
import { T, type } from '../ui/theme';
import { dailyLabel } from '../ui/dates';

export default function Shards() {
  const { state, profile } = useStore();
  const w = state.wallet;
  const history = [...profile.history].reverse();
  const today = new Date().toDateString();
  const when = (iso: string) => { const d = new Date(iso); return d.toDateString() === today ? 'Aujourd’hui' : dailyLabel(d); };
  return (
    <Screen scroll place="lighthouse">
      <BackButton label="Accueil" onPress={() => goBack()} />
      <Text style={type.title1}>Éclats</Text>
      <Card style={{ alignItems: 'center', gap: 6, padding: 26 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(143,211,224,0.08)', alignItems: 'center', justifyContent: 'center' }}><Icon name="shard" size={36} color={T.moon} sw={1.5} /></View>
        <Text style={type.display}>{w.balance}</Text>
        <Text style={type.sub}>Éclats</Text>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}><Text style={type.foot}>Gagnés</Text><Text style={type.title3}>{w.earned}</Text></Card>
        <Card style={{ flex: 1 }}><Text style={type.foot}>Dépensés</Text><Text style={type.title3}>{w.spent}</Text></Card>
      </View>
      <Text style={type.sub}>Les Éclats se gagnent en jouant. Ils servent aux indices et à la personnalisation de Nilo. Ils ne se perdent jamais et n’ouvrent aucun lieu : seule la lumière fait avancer.</Text>
      <Text style={[type.cap, { marginTop: 4 }]}>Historique</Text>
      {!history.length ? (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
          <Icon name="shard" size={26} color={T.tx3} />
          <Text style={[type.sub, { textAlign: 'center' }]}>Rien pour l’instant. Chaque lanterne allumée, chaque défi du soir et chaque succès apparaîtront ici.</Text>
        </Card>
      ) : null}
      {history.length ? (
        <Card style={{ paddingVertical: 4 }}>
          {history.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: T.line }}>
              <View style={{ flex: 1 }}><Text style={type.body}>{h.label}</Text><Text style={type.foot}>{when(h.at)}</Text></View>
              <Text style={{ fontWeight: '700', color: h.amount > 0 ? T.moon : T.tx2, fontVariant: ['tabular-nums'] }}>{h.amount > 0 ? `+${h.amount}` : `−${-h.amount}`}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
