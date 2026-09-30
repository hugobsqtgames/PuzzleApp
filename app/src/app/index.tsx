import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize } from '../ui/layout';
import { Redirect, router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Card, Crumb, Gauge, GaugeRow, GlyphCircle, Icon, LightPill, Nilo, Rise, ShardPill, Twinkles, tap } from '../ui/components';
import { useReducedMotion } from '../ui/motion';
import { vesperWindowXml } from '../ui/art';
import { T, R, type } from '../ui/theme';
import { current, districtViews, infoOf, locateRoom, roomLabel, buildingName } from '../game/views';
import { FAMILIES, LANTERN_COUNT, TIER_NAMES, dailyPuzzle, WORLD, formatCount } from '../game/catalog';
import { ENDING_SEEN } from '../game/story';
import { look } from '../game/rewards';
import { dailyLabel, dateOfDay } from '../ui/dates';
import { addDays } from '../core/game/dayKey';

export const DAILY_UNLOCK_LIGHTS = 6;

export default function Home() {
  const { state, engine, openLantern, today } = useStore();
  const { width } = useContentSize();
  const reduce = useReducedMotion();
  const p = engine.progression;
  const winW = Math.min(width, 600) - 32;
  const total = p.totalLights(state);
  const views = useMemo(() => districtViews(p, state), [p, state]);
  const windowXml = useMemo(() => vesperWindowXml(views, 358, 210), [views]);
  const cur = current(p, state);
  if (!state.onboardingDone) return <Redirect href="/welcome" />;

  const loc = cur.lantern ? p.locate(cur.lantern.puzzle) : null;
  const room = loc?.room ? locateRoom(loc.room.id) : null;
  const next = WORLD.districts.find((d) => d.unlock.kind !== 'always' && !p.isDistrictUnlocked(d, total, p.letters(state)));
  const prevNeed = next ? (() => { const i = WORLD.districts.indexOf(next); const prev = WORLD.districts[i - 1]; return prev.unlock.kind === 'always' ? 0 : prev.unlock.lights; })() : 0;
  const nextNeed = next && next.unlock.kind !== 'always' ? next.unlock.lights : 0;

  const dailyOpen = total >= DAILY_UNLOCK_LIGHTS;
  const dailyDone = state.daily.completedDays.has(today);
  const daily = dailyOpen ? dailyPuzzle(today) : null;
  const tomorrow = dailyOpen ? dailyPuzzle(addDays(today, 1)) : null;

  const onContinue = () => {
    if (!cur.lantern) { router.push('/map'); return; }
    if (openLantern(cur.lantern.puzzle)) router.push('/puzzle');
  };

  return (
    <Screen scroll place="lighthouse">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${total} Lumières`} onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })}><LightPill n={total} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${state.wallet.balance} Éclats`} onPress={() => router.push('/shards')}><ShardPill n={state.wallet.balance} /></Pressable>
      </View>

      <View style={{ height: 210, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir la carte de Vesper" onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={windowXml} width={winW} height={210} />
          {!reduce ? <Twinkles w={winW} h={120} n={8} seed={3} /> : null}
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>Vesper</Text>
            <Text style={type.foot}>{total} / {formatCount(LANTERN_COUNT)} lanternes</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} /><Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>Carte</Text>
          </View>
        </Pressable>
        <View style={{ position: 'absolute', right: 4, bottom: -26 }}>
          <Nilo size={96} mood="curious" look={look(state)} onPress={() => router.push('/nilo')} />
        </View>
      </View>

      <Rise delay={80}><Card style={{ gap: 10 }}>
        {room ? (
          <>
            <Crumb parent={infoOf(room.district).short} current={buildingName(room.district, room.buildingIndex)} />
            <Text style={type.title2}>{roomLabel(room.district, room.buildingIndex, room.index)}</Text>
            <GaugeRow n={p.lights(room.room.lanterns, state)} total={room.room.lanterns.length} label="Salle" />
          </>
        ) : loc ? (
          <>
            <Crumb parent={infoOf(loc.district).short} current={buildingName(loc.district, loc.district.buildings.indexOf(loc.building))} />
            <Text style={type.title2}>Lanterne-clé</Text>
          </>
        ) : (
          <Text style={type.title2}>Vesper est entièrement éclairée.</Text>
        )}
        <Button title="Continuer" icon="light" onPress={onContinue} style={{ marginTop: 4 }} />
      </Card></Rise>

      {dailyOpen && daily ? (
        <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/daily'); }}
          style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}>
          <GlyphCircle icon={daily.code} color={dailyDone ? T.tx2 : T.amber} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{dailyDone ? 'Défi du soir réussi' : 'Défi du soir'}</Text>
            <Text style={type.sub}>{dailyDone && tomorrow ? `Demain : ${FAMILIES[tomorrow.code].name} · ${TIER_NAMES[tomorrow.tier]}` : `${dailyLabel(dateOfDay(today))} · ${FAMILIES[daily.code].name} · ${TIER_NAMES[daily.tier]}`}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Icon name="light" size={22} color={T.amber} />
            <Text style={{ color: T.tx, fontWeight: '700', fontSize: 15 }}>{state.daily.streak}</Text>
          </View>
          {dailyDone ? <Icon name="check" size={20} color={T.gold} sw={2} /> : null}
        </Pressable>
      ) : (
        <View style={{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 0.6 }}>
          <GlyphCircle icon="cal" color={T.tx2} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>Défi du soir</Text>
            <Text style={type.sub}>Disponible après {DAILY_UNLOCK_LIGHTS} lanternes</Text>
          </View>
          <Icon name="lock" size={20} color={T.tx2} />
        </View>
      )}

      {next ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })} style={{ flexDirection: 'row', gap: 12, paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center' }}>
          <Icon name="lock" size={20} color={T.tx2} />
          <View style={{ flex: 1 }}>
            <Text style={type.callout}>{total >= nextNeed ? `${infoOf(next).name} : il manque des lettres de l’Allumeur` : `Encore ${nextNeed - total} lumières pour ${infoOf(next).name.replace(/^(La|Le|L’) /, (m) => m.toLowerCase())}`}</Text>
            <View style={{ marginTop: 8 }}><Gauge n={total - prevNeed} total={Math.max(1, nextNeed - prevNeed)} height={5} /></View>
          </View>
        </Pressable>
      ) : null}

      {state.seenDialogue.has(ENDING_SEEN) ? (
        <Pressable accessibilityRole="button" accessibilityLabel="La suite : de l’autre côté de la mer. Revoir la fin du premier chapitre." onPress={() => { tap(); router.push('/ending'); }}
          style={{ backgroundColor: T.s1, borderWidth: 1, borderColor: 'rgba(255,217,142,0.35)', borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <GlyphCircle icon="light" color={T.gold} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>De l’autre côté de la mer</Text>
            <Text style={type.sub}>Une lumière a répondu. Le prochain chapitre arrivera avec une mise à jour.</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['map', 'Carte', '/map'], ['book', 'Carnet', '/carnet'], ['gear', 'Réglages', '/settings']] as const).map(([icon, label, to]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => { tap(); router.push(to); }}
            style={{ flex: 1, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
            <Icon name={icon} size={22} color={T.tx2} />
            <Text style={{ color: T.tx, fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

