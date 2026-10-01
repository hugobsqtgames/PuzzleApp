// Privacy policy and legal notice, in the app itself (also in docs/PRIVACY.md for the App Store).
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';

import { Screen } from '../ui/Screen';
import { BackButton, Card, Icon } from '../ui/components';
import { T, type } from '../ui/theme';
import { tr } from '../i18n';

function Part({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={20} color={T.moon} />
        <Text style={[type.headline, { flex: 1 }]}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}
const P = ({ children }: { children: React.ReactNode }) => <Text style={[type.body, { color: T.tx2 }]}>{children}</Text>;

export default function Privacy() {
  return (
    <Screen scroll place="lighthouse" style={{ gap: 14 }}>
      <BackButton label={tr('Retour')} onPress={() => goBack()} />
      <Text style={type.title1}>{tr('Confidentialité')}</Text>
      <Text style={[type.dialogue, { color: T.tx2 }]}>{tr('En bref : Lampion ne collecte rien. Aucune donnée ne quitte ton téléphone, sauf si tu l’envoies toi-même.')}</Text>

      <Part icon="shield" title={tr('Ce que Lampion ne fait pas')}>
        <P>{tr('Pas de compte, pas de publicité, pas de mesure d’audience, pas de pisteur, pas de serveur. L’app fonctionne entièrement hors ligne et ne contient aucun outil d’une autre entreprise qui suivrait ce que tu fais.')}</P>
      </Part>

      <Part icon="book" title={tr('Ce qui reste sur ton téléphone')}>
        <P>{tr('Ta progression (lanternes, Éclats, série, objets, succès) et tes réglages sont enregistrés dans l’espace privé de l’app, sur ton appareil. Personne d’autre n’y a accès, pas même l’auteur du jeu.')}</P>
        <P>{tr('Le widget de l’écran d’accueil lit ta série et le défi du soir dans un petit espace que l’app et le widget partagent, sur ton téléphone. Rien n’en sort.')}</P>
      </Part>

      <Part icon="share" title={tr('Sauvegarde et transfert')}>
        <P>{tr('Si la sauvegarde iCloud de ton iPhone est activée, Apple y inclut ta progression comme celle de tes autres apps : elle revient quand tu restaures ou changes de téléphone. Lampion n’y lit ni n’y envoie rien lui-même.')}</P>
        <P>{tr('« Exporter ma progression » crée un texte que tu partages où tu veux. Rien n’est envoyé sans ton geste.')}</P>
      </Part>

      <Part icon="bell" title={tr('Notifications')}>
        <P>{tr('Le rappel du défi du soir est programmé par ton téléphone lui-même. Il est désactivé par défaut et ne passe par aucun serveur.')}</P>
      </Part>

      <Part icon="star" title={tr('Enfants')}>
        <P>{tr('Lampion convient à tous les âges : aucune donnée n’est collectée, aucun achat n’est proposé, aucun lien ne mène hors de l’app.')}</P>
      </Part>

      <Part icon="letter" title={tr('Mentions légales')}>
        <P>{tr('Éditeur et auteur : Hugo BUSQUET. Lampion n’utilise aucun hébergement : tout le jeu est dans l’app.')}</P>
        <P>{tr('Pour toute question, passe par la page de Lampion sur l’App Store.')}</P>
        <P>{tr('Dernière mise à jour de cette page : octobre 2026.')}</P>
      </Part>
    </Screen>
  );
}
