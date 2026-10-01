// A seasonal event: Le Printemps des Lanternes (nine sky lanterns), La Nuit des
// Citrouilles (seven pumpkins), both at your own pace, or La Veillée de Vesper
// (twelve evenings, one more each night).
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, Gauge, Icon, Nilo, tap } from '../ui/components';
import { T, R, type } from '../ui/theme';
import { FAMILIES, eventPuzzle, eventSize } from '../game/catalog';
import { COSMETICS, achievementContext, look, owns } from '../game/rewards';
import { eventDone, eventEnd, eventOn, eventOpen } from '../game/seasons';
import { SeasonFall } from '../ui/SeasonFall';
import { EVENT_THEME } from '../ui/eventTheme';
import { useNow } from '../ui/useNow';
import { useContentSize } from '../ui/layout';
import { lang, tr } from '../i18n';

const dayMonth = (d: Date) => d.toLocaleDateString(lang() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' });

export default function EventScreen() {
  const { state, engine, profile, openEvent, showToast } = useStore();
  const now = useNow();
  const { width } = useContentSize();
  const running = eventOn(now);

  if (!running) {
    return (
      <Screen scroll place="lighthouse" style={{ gap: 16 }}>
        <BackButton label={tr('Accueil')} onPress={() => goBack()} />
        <Text style={type.title1}>{tr('Événements')}</Text>
        <Text style={[type.body, { color: T.tx2 }]}>{tr('Aucun événement en ce moment. Le Printemps des Lanternes revient le 28 mars, la Nuit des Citrouilles le 25 octobre, la Veillée de Vesper le 15 décembre.')}</Text>
      </Screen>
    );
  }

  const { event: e, year } = running;
  const size = eventSize(e.id);
  const done = eventDone(state, e.id, year, size);
  const open = eventOpen(e, year, now, size);
  const solved = done.filter(Boolean).length;
  const next = done.findIndex((d, i) => !d && i < open);
  const ctx = achievementContext(state, engine.progression, profile);
  const play = (n: number) => { tap(); if (openEvent(e.id, year, n)) router.push('/puzzle'); else showToast(tr('Cette énigme n’a pas pu être préparée.'), 'info'); };
  const th = EVENT_THEME[e.id];
  const start = new Date(year, Math.floor(e.from / 100) - 1, e.from % 100);
  const cols = 4;
  const cell = Math.floor((Math.min(width, 600) - 32 - 36 - (cols - 1) * 12) / cols);

  return (
    <Screen scroll place={th.place} background={th.background} style={{ gap: 16 }}>
      <SeasonFall kind={e.particle} accent={e.flame} w={Math.min(width, 600)} h={320} n={th.particles} />
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Nilo size={110} mood="joy" look={th.dress(look(state))} still />
        <Text style={[type.cap, { color: e.flame, textAlign: 'center' }]}>{tr('Événement · jusqu’au {0}', [dayMonth(eventEnd(e, year))])}</Text>
        <Text style={[type.display, { fontSize: 32, lineHeight: 38, textAlign: 'center' }]}>{tr(e.name)}</Text>
        <Text style={[type.body, { color: T.tx2, textAlign: 'center' }]}>{tr(e.story)}</Text>
      </View>

      <Card style={{ gap: 14, borderColor: e.flame }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {done.map((lit, n) => {
            const available = n < open;
            const opensOn = new Date(start.getTime() + n * 86_400_000);
            const code = eventPuzzle(e.id, n)?.code;
            const label = lit ? tr('{0}, rallumée', [n + 1]) : available ? tr('{0}, à rallumer : {1}', [n + 1, code ? FAMILIES[code].name : '']) : tr('{0}, s’ouvre le {1}', [n + 1, dayMonth(opensOn)]);
            return (
              <Pressable key={n} accessibilityRole="button" accessibilityLabel={label} disabled={!available} onPress={() => play(n)}
                style={({ pressed }) => [{ width: cell, alignItems: 'center', gap: 4, opacity: available ? 1 : 0.5 }, pressed ? { opacity: 0.7 } : null]}>
                <SvgXml xml={th.art(lit, available)} width={cell * 0.8} height={cell * 0.8} />
                <Text style={[type.foot, { color: lit ? T.gold : available ? T.tx : T.tx3 }]}>{available || lit ? n + 1 : dayMonth(opensOn)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Gauge n={solved} total={size} height={6} />
        <Text style={[type.foot, { textAlign: 'center' }]}>{th.count(solved, size)}</Text>
      </Card>

      {next >= 0 ? <Button title={th.next(next + 1)} icon="light" onPress={() => play(next)} />
        : solved === size ? <Text style={[type.dialogue, { textAlign: 'center', color: T.gold }]}>{th.complete()}</Text>
          : <Text style={[type.dialogue, { textAlign: 'center', color: T.tx2 }]}>{tr('Reviens demain soir : une nouvelle lanterne t’attend.')}</Text>}

      <Text style={type.cap}>{tr('Récompenses')}</Text>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {e.milestones.map(([n, , id]) => {
          const c = COSMETICS.find((x) => x.id === id)!;
          const got = owns(c, state, ctx);
          return (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
              <View style={{ width: 40, height: 40, borderRadius: R.m, alignItems: 'center', justifyContent: 'center', backgroundColor: got ? 'rgba(255,217,142,0.12)' : T.s1 }}>
                <Icon name={got ? 'check' : 'star'} size={20} color={got ? T.gold : T.tx3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.headline}>{c.name}</Text>
                <Text style={type.foot}>{th.milestone(n)}{got ? ` · ${tr('à toi pour toujours')}` : ''}</Text>
              </View>
            </View>
          );
        })}
      </Card>
      <Text style={[type.foot, { textAlign: 'center', marginBottom: 12 }]}>{tr('Les énigmes sont dans l’app : elles se jouent hors ligne. L’événement revient chaque année.')}</Text>
    </Screen>
  );
}
