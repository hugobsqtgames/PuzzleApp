// Credits: who made Lampion, and who it is for.
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Card, Nilo } from '../ui/components';
import { T, type } from '../ui/theme';
import { look } from '../game/rewards';
import { tr } from '../i18n';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text style={[type.cap, { color: T.gold }]}>{title}</Text>
      {children}
    </View>
  );
}

const Line = ({ children, strong }: { children: React.ReactNode; strong?: boolean }) => (
  <Text style={[strong ? type.title3 : type.body, { textAlign: 'center', color: strong ? T.tx : T.tx2 }]}>{children}</Text>
);

export default function Credits() {
  const { state } = useStore();
  return (
    <Screen scroll place="lighthouse" style={{ gap: 26 }}>
      <BackButton label={tr('Retour')} onPress={() => goBack()} />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Nilo size={130} mood="joy" look={look(state)} />
        <Text style={[type.display, { fontSize: 44, lineHeight: 50 }]}>Lampion</Text>
        <Text style={[type.dialogue, { color: T.tx2 }]}>{tr('Chaque énigme rallume une lumière.')}</Text>
      </View>

      <Block title={tr('Un jeu imaginé et créé par')}>
        {/* The author's name is the same in every language. */}
        <Text style={[type.display, { fontSize: 32, lineHeight: 38, textAlign: 'center' }]}>Hugo BUSQUET</Text>
        <Line>{tr('Histoire, monde, Nilo et chacune des 1 000 lanternes.')}</Line>
      </Block>

      <Card style={{ gap: 18, paddingVertical: 22 }}>
        <Block title={tr('Merci')}>
          <Line strong>{tr('À ma femme')}</Line>
          <Line>{tr('Pour sa patience pendant les soirées passées à rallumer Vesper, et pour ses idées.')}</Line>
        </Block>
        <Block title={tr('Et aussi')}>
          <Line strong>{tr('À ma famille')}</Line>
          <Line>{tr('Pour m’avoir appris à aimer les énigmes.')}</Line>
          <Line strong>{tr('À mes amis')}</Line>
          <Line>{tr('Les premiers à avoir allumé une lanterne, et à m’avoir dit ce qui clochait.')}</Line>
        </Block>
      </Card>

      <Block title={tr('Fabrication')}>
        <Line>{tr('Police des titres : Newsreader (Production Type), licence SIL Open Font.')}</Line>
        <Line>{tr('Musiques et sons composés pour Lampion.')}</Line>
        <Line>{tr('Construit avec Expo et React Native, logiciels libres.')}</Line>
      </Block>

      <Block title={tr('Ta vie privée')}>
        <Line>{tr('Pas de compte, pas de publicité, pas de suivi. Ta progression reste sur ton téléphone.')}</Line>
      </Block>

      <Text style={[type.dialogue, { textAlign: 'center', color: T.gold, marginBottom: 24 }]}>{tr('Merci d’avoir joué.')}</Text>
    </Screen>
  );
}
