// A seasonal event: Le Printemps des Lanternes (nine sky lanterns), La Nuit des
// Citrouilles (seven pumpkins), both at your own pace, or La Veillée de Vesper
// (twelve evenings, one more each night).
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, Gauge, Icon, Nilo, tap } from '../ui/components';
import { T, R, type } from '../ui/theme';
import { FAMILIES, eventPuzzle, eventSize } from '../game/catalog';
import { COSMETICS, achievementContext, look, owns } from '../game/rewards';
import { EVENTS, type EventId, type SeasonEvent, eventDone, eventEnd, eventOn, nextStart } from '../game/seasons';
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const running = eventOn(now);
  // Every festival can be played at any date: its dates only bring its mood and its place on
  // the home screen. Nothing in the game is held back by the date.
  const edition = (ev: SeasonEvent) => (running && running.event.id === ev.id ? running.year : nextStart(ev, now).getFullYear());

  if (!id || !(id in EVENTS)) {
    return (
      <Screen scroll place="lighthouse" style={{ gap: 16 }}>
        <BackButton label={tr('Accueil')} onPress={() => goBack()} />
        <Text style={type.title1}>{tr('Fêtes de Vesper')}</Text>
        <Text style={[type.body, { color: T.tx2 }]}>{tr('Chaque fête revient à ses dates, avec son ambiance. Ses énigmes, elles, se jouent toute l’année.')}</Text>
        {Object.values(EVENTS).map((ev) => {
          const y = edition(ev), n = eventSize(ev.id), lit = eventDone(state, ev.id, y, n).filter(Boolean).length;
          const from = new Date(y, Math.floor(ev.from / 100) - 1, ev.from % 100);
          const now_ = running?.event.id === ev.id;
          return (
            <Pressable key={ev.id} accessibilityRole="button" onPress={() => { tap(); router.push({ pathname: '/event', params: { id: ev.id } }); }}
              style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: now_ ? ev.flame : T.line, borderRadius: R.l, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}>
              <SvgXml xml={EVENT_THEME[ev.id].art(lit > 0, true)} width={48} height={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.cap, { color: ev.flame }]}>{now_ ? tr('En ce moment') : tr('Du {0} au {1}', [dayMonth(from), dayMonth(eventEnd(ev, y))])}</Text>
                <Text style={type.headline}>{tr(ev.name)}</Text>
                <Text style={type.sub}>{EVENT_THEME[ev.id].count(lit, n)}</Text>
              </View>
              <Icon name="chev" size={18} color={T.tx3} />
            </Pressable>
          );
        })}
      </Screen>
    );
  }

  const e = EVENTS[id as EventId];
  const live = running?.event.id === e.id;
  const year = edition(e);
  const size = eventSize(e.id);
  const done = eventDone(state, e.id, year, size);
  const solved = done.filter(Boolean).length;
  const next = done.findIndex((d) => !d);
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
        <Text style={[type.cap, { color: e.flame, textAlign: 'center' }]}>{live ? tr('Événement · jusqu’au {0}', [dayMonth(eventEnd(e, year))]) : tr('Du {0} au {1}', [dayMonth(start), dayMonth(eventEnd(e, year))])}</Text>
        <Text style={[type.display, { fontSize: 32, lineHeight: 38, textAlign: 'center' }]}>{tr(e.name)}</Text>
        <Text style={[type.body, { color: T.tx2, textAlign: 'center' }]}>{tr(e.story)}</Text>
      </View>

      <Card style={{ gap: 14, borderColor: e.flame }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {done.map((lit, n) => {
            const code = eventPuzzle(e.id, n)?.code;
            const label = lit ? tr('{0}, rallumée', [n + 1]) : tr('{0}, à rallumer : {1}', [n + 1, code ? FAMILIES[code].name : '']);
            return (
              <Pressable key={n} accessibilityRole="button" accessibilityLabel={label} onPress={() => play(n)}
                style={({ pressed }) => [{ width: cell, alignItems: 'center', gap: 4 }, pressed ? { opacity: 0.7 } : null]}>
                <SvgXml xml={th.art(lit, true)} width={cell * 0.8} height={cell * 0.8} />
                <Text style={[type.foot, { color: lit ? T.gold : T.tx }]}>{n + 1}</Text>
              </Pressable>
            );
          })}
        </View>
        <Gauge n={solved} total={size} height={6} />
        <Text style={[type.foot, { textAlign: 'center' }]}>{th.count(solved, size)}</Text>
      </Card>

      {next >= 0 ? <Button title={th.next(next + 1)} icon="light" onPress={() => play(next)} />
        : <Text style={[type.dialogue, { textAlign: 'center', color: T.gold }]}>{th.complete()}</Text>}

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
