import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, GlyphCircle, Icon, IconButton, Pill, TierBars, tap } from '../ui/components';
import { T, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES, dailyPuzzle } from '../game/catalog';
import { addDays, daysBetween, dayKey } from '../core/game/dayKey';
import { dailyLabel, dateOfDay, monthName } from '../ui/dates';
import { STANDARD_STREAK } from '../core/game/daily';
import { STANDARD_ECONOMY } from '../core/game/engine';
import { tr, trn } from '../i18n';

export default function Daily() {
  const { state, today, openDaily, showToast } = useStore();
  const now = dateOfDay(today);
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const p = dailyPuzzle(today);
  const done = state.daily.completedDays.has(today);
  const tomorrow = dailyPuzzle(addDays(today, 1));
  const bonus = Math.min(STANDARD_ECONOMY.dailyStreakBonusCap, state.daily.streak + 1);
  const missed = Array.from({ length: STANDARD_STREAK.catchUpWindowDays }, (_, i) => addDays(today, -(i + 1)))
    .filter((d) => !state.daily.completedDays.has(d) && !state.daily.catchUpDays.has(d) && dailyPuzzle(d));

  const play = (day: string) => { if (openDaily(day)) router.push('/puzzle'); else showToast(tr('Ce défi n’a pas pu être préparé.'), 'info'); };

  // Calendar: Monday first.
  const first = new Date(month.y, month.m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.y, month.m, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth() + 1;

  return (
    <Screen scroll place="market">
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <Text style={type.title1}>{tr('Défi du soir')}</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 64, alignItems: 'center' }}><Icon name="light" size={34} color={T.amber} /></View>
        <View style={{ flex: 1 }}>
          <Text style={type.title2}>{trn(state.daily.streak, '{0} soir', '{0} soirs')}</Text>
          <Text style={type.foot}>{tr('Flamme du soir · record {0}', [state.daily.bestStreak])}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: STANDARD_STREAK.maxNightlights }, (_, i) => <Icon key={i} name="moonI" size={18} color={i < state.daily.nightlights ? T.moon : T.line} sw={1.8} />)}
          </View>
          <Text style={type.foot}>{trn(state.daily.nightlights, '{0} veilleuse', '{0} veilleuses')}</Text>
        </View>
      </Card>

      {p ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <GlyphCircle icon={p.code} size={48} color={done ? T.tx2 : T.amber} />
            <View style={{ flex: 1 }}>
              <Text style={type.cap}>{dailyLabel(now)}</Text>
              <Text style={type.title3}>{FAMILIES[p.code].name}</Text>
              {/* The reward sits under the name: with large text, a side column would crush it. */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><TierBars tier={p.tier} /><Text style={type.foot}>{TIER_NAMES[p.tier]}</Text></View>
                <Pill icon="shard" iconColor={T.moon}>+{STANDARD_ECONOMY.dailyReward} · +{bonus}</Pill>
              </View>
            </View>
          </View>
          {done ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icon name="check" size={22} color={T.gold} sw={2} />
              <Text style={[type.callout, { flex: 1 }]}>{tr('Réussi.')}{tomorrow ? ' ' + tr('Demain : {0}, palier {1}.', [FAMILIES[tomorrow.code].name, TIER_NAMES[tomorrow.tier]]) : ''}</Text>
            </View>
          ) : <Button title={tr('Jouer le défi')} onPress={() => play(today)} />}
          <Text style={type.foot}>{tr('Même énigme pour tous les joueurs ce soir. Préparée à l’avance, jouable sans connexion.')}</Text>
        </Card>
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <IconButton name="back" label={tr('Mois précédent')} size={36} onPress={() => setMonth(({ y, m }) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }))} />
          <Text style={type.headline}>{monthName(month.m)} {month.y}</Text>
          <IconButton name="chev" label={tr('Mois suivant')} size={36} disabled={isCurrentMonth} onPress={() => setMonth(({ y, m }) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }))} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <Text key={i} style={[type.foot, { flex: 1, textAlign: 'center' }]}>{d}</Text>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={{ width: `${100 / 7}%`, height: 38 }} />;
            const key = dayKey(month.y, month.m, d);
            const solved = state.daily.completedDays.has(key), caught = state.daily.catchUpDays.has(key);
            const isToday = key === today, future = daysBetween(key, today) > 0;
            return (
              <View key={i} accessible accessibilityLabel={`${d} ${monthName(month.m)}${solved ? tr(', réussi') : caught ? tr(', rattrapé') : ''}`}
                style={{ width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: isToday ? 1.5 : 0, borderColor: T.amber, opacity: future ? 0.35 : 1 }}>
                <Text style={{ fontSize: 13, color: T.tx, fontVariant: ['tabular-nums'] }}>{d}</Text>
                {solved ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.amber, marginTop: 2 }} /> : caught ? <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: T.amber, marginTop: 2 }} /> : null}
              </View>
            );
          })}
        </View>
      </Card>

      {missed.length ? (
        <View>
          <Text style={[type.cap, { marginBottom: 6 }]}>{tr('Rattrapage')}</Text>
          {missed.map((d) => (
            <Pressable key={d} accessibilityRole="button" onPress={() => { tap(); play(d); }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
              <Icon name="cal" size={20} color={T.tx2} />
              <Text style={[type.body, { flex: 1 }]}>{tr('Rattraper le {0}', [dailyLabel(dateOfDay(d)).toLowerCase()])}</Text>
              <Icon name="chev" size={18} color={T.tx3} />
            </Pressable>
          ))}
          <Text style={[type.foot, { marginTop: 6 }]}>{tr('Récompense de base. Un rattrapage ne compte pas pour la série.')}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
