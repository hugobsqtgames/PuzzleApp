import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize, useWide } from '../ui/layout';
import { Redirect, router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Card, Crumb, Gauge, GaugeRow, GlyphCircle, Icon, LightPill, Nilo, Rise, ShardPill, Twinkles, tap } from '../ui/components';
import { useReducedMotion } from '../ui/motion';
import { vesperWindowXml } from '../ui/art';
import { T, R, type } from '../ui/theme';
import { current, districtViews, infoOf, locateRoom, roomLabel, buildingName, lowerArticle } from '../game/views';
import { districtLanterns } from '../core/game/world';
import { FAMILIES, LANTERN_COUNT, TIER_NAMES, dailyPuzzle, WORLD, formatCount } from '../game/catalog';
import { ENDING_SEEN } from '../game/story';
import { look } from '../game/rewards';
import { dailyLabel, dateOfDay } from '../ui/dates';
import { addDays } from '../core/game/dayKey';
import { tr } from '../i18n';

export const DAILY_UNLOCK_LIGHTS = 6;

export default function Home() {
  const { state, engine, openLantern, today } = useStore();
  const { width } = useContentSize();
  const reduce = useReducedMotion();
  const p = engine.progression;
  const { wide, width: wideWidth } = useWide();
  // iPad: Vesper and the next room on the left (large), the rest on the right.
  const winW = wide ? Math.floor((wideWidth - 56 - 28) * 0.58) : Math.min(width, 600) - 32;
  const winH = wide ? 380 : 210;
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
    <Screen scroll place="lighthouse" wide={wide}>
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
          <View style={{ width: winW, gap: 14 }}>
      <View style={{ height: winH, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Ouvrir la carte de Vesper')} onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={windowXml} width={winW} height={winH} />
          {!reduce ? <Twinkles w={winW} h={winH * 0.57} n={wide ? 14 : 8} seed={3} /> : null}
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>{tr('Vesper')}</Text>
            <Text style={type.foot}>{tr('{0} / {1} lanternes', [total, formatCount(LANTERN_COUNT)])}</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} /><Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{tr('Carte')}</Text>
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
            <GaugeRow n={p.lights(room.room.lanterns, state)} total={room.room.lanterns.length} label={tr('Salle')} />
          </>
        ) : loc ? (
          <>
            <Crumb parent={infoOf(loc.district).short} current={buildingName(loc.district, loc.district.buildings.indexOf(loc.building))} />
            <Text style={type.title2}>{tr('Lanterne-clé')}</Text>
          </>
        ) : (
          <Text style={type.title2}>{tr('Vesper est entièrement éclairée.')}</Text>
        )}
        <Button title={tr('Continuer')} icon="light" onPress={onContinue} style={{ marginTop: 4 }} />
      </Card></Rise>
          </View>
          <View style={{ flex: 1, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Lumières', [total])} onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })}><LightPill n={total} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Éclats', [state.wallet.balance])} onPress={() => router.push('/shards')}><ShardPill n={state.wallet.balance} /></Pressable>
      </View>


      {dailyOpen && daily ? (
        <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/daily'); }}
          style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}>
          <GlyphCircle icon={daily.code} color={dailyDone ? T.tx2 : T.amber} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{dailyDone ? tr('Défi du soir réussi') : tr('Défi du soir')}</Text>
            <Text style={type.sub}>{dailyDone && tomorrow ? tr('Demain : {0} · {1}', [FAMILIES[tomorrow.code].name, TIER_NAMES[tomorrow.tier]]) : `${dailyLabel(dateOfDay(today))} · ${FAMILIES[daily.code].name} · ${TIER_NAMES[daily.tier]}`}</Text>
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
            <Text style={type.headline}>{tr('Défi du soir')}</Text>
            <Text style={type.sub}>{tr('Disponible après {0} lanternes', [DAILY_UNLOCK_LIGHTS])}</Text>
          </View>
          <Icon name="lock" size={20} color={T.tx2} />
        </View>
      )}

      {next ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })} style={{ flexDirection: 'row', gap: 12, paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center' }}>
          <Icon name="lock" size={20} color={T.tx2} />
          <View style={{ flex: 1 }}>
            <Text style={type.callout}>{total >= nextNeed ? tr('{0} : il manque des lettres de l’Allumeur', [infoOf(next).name]) : tr('Encore {0} lumières pour {1}', [nextNeed - total, lowerArticle(infoOf(next).name)])}</Text>
            <View style={{ marginTop: 8 }}><Gauge n={total - prevNeed} total={Math.max(1, nextNeed - prevNeed)} height={5} /></View>
          </View>
        </Pressable>
      ) : null}

      {state.seenDialogue.has(ENDING_SEEN) ? (
        <Pressable accessibilityRole="button" accessibilityLabel={tr('La suite : de l’autre côté de la mer. Revoir la fin du premier chapitre.')} onPress={() => { tap(); router.push('/ending'); }}
          style={{ backgroundColor: T.s1, borderWidth: 1, borderColor: 'rgba(255,217,142,0.35)', borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <GlyphCircle icon="light" color={T.gold} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{tr('De l’autre côté de la mer')}</Text>
            <Text style={type.sub}>{tr('Une lumière a répondu. Le prochain chapitre arrivera avec une mise à jour.')}</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['map', tr('Carte'), '/map'], ['book', tr('Carnet'), '/carnet'], ['gear', tr('Réglages'), '/settings']] as const).map(([icon, label, to]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => { tap(); router.push(to); }}
            style={{ flex: 1, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
            <Icon name={icon} size={22} color={T.tx2} />
            <Text style={{ color: T.tx, fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
            {/* iPad: every district at a glance, to open it straight away. */}
            <Card style={{ paddingVertical: 4 }}>
              {views.map((v) => {
                const d = WORLD.districts.find((x) => x.id === v.id)!;
                const all = districtLanterns(d), lit = p.lights(all, state), locked = v.state === 'locked';
                return (
                  <Pressable key={v.id} accessibilityRole="button" disabled={locked} accessibilityLabel={`${infoOf(d).name}, ${locked ? tr('fermé') : tr('{0} lanternes sur {1}', [lit, all.length])}`}
                    onPress={() => { tap(); router.push({ pathname: '/district/[id]', params: { id: v.id === 'grenier' ? 'phare' : v.id } }); }}
                    style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: locked ? 'transparent' : v.hue, borderWidth: 1.5, borderColor: v.hue }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.headline, locked && { color: T.tx2 }]}>{infoOf(d).short}</Text>
                      {locked ? null : <View style={{ marginTop: 6 }}><Gauge n={lit} total={all.length} height={5} /></View>}
                    </View>
                    {locked ? <Icon name="lock" size={16} color={T.tx3} /> : <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{lit} / {all.length}</Text>}
                  </Pressable>
                );
              })}
            </Card>
          </View>
        </View>
      ) : (
        <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Lumières', [total])} onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })}><LightPill n={total} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Éclats', [state.wallet.balance])} onPress={() => router.push('/shards')}><ShardPill n={state.wallet.balance} /></Pressable>
      </View>

      <View style={{ height: winH, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Ouvrir la carte de Vesper')} onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={windowXml} width={winW} height={winH} />
          {!reduce ? <Twinkles w={winW} h={winH * 0.57} n={wide ? 14 : 8} seed={3} /> : null}
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>{tr('Vesper')}</Text>
            <Text style={type.foot}>{tr('{0} / {1} lanternes', [total, formatCount(LANTERN_COUNT)])}</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} /><Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{tr('Carte')}</Text>
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
            <GaugeRow n={p.lights(room.room.lanterns, state)} total={room.room.lanterns.length} label={tr('Salle')} />
          </>
        ) : loc ? (
          <>
            <Crumb parent={infoOf(loc.district).short} current={buildingName(loc.district, loc.district.buildings.indexOf(loc.building))} />
            <Text style={type.title2}>{tr('Lanterne-clé')}</Text>
          </>
        ) : (
          <Text style={type.title2}>{tr('Vesper est entièrement éclairée.')}</Text>
        )}
        <Button title={tr('Continuer')} icon="light" onPress={onContinue} style={{ marginTop: 4 }} />
      </Card></Rise>

      {dailyOpen && daily ? (
        <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/daily'); }}
          style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}>
          <GlyphCircle icon={daily.code} color={dailyDone ? T.tx2 : T.amber} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{dailyDone ? tr('Défi du soir réussi') : tr('Défi du soir')}</Text>
            <Text style={type.sub}>{dailyDone && tomorrow ? tr('Demain : {0} · {1}', [FAMILIES[tomorrow.code].name, TIER_NAMES[tomorrow.tier]]) : `${dailyLabel(dateOfDay(today))} · ${FAMILIES[daily.code].name} · ${TIER_NAMES[daily.tier]}`}</Text>
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
            <Text style={type.headline}>{tr('Défi du soir')}</Text>
            <Text style={type.sub}>{tr('Disponible après {0} lanternes', [DAILY_UNLOCK_LIGHTS])}</Text>
          </View>
          <Icon name="lock" size={20} color={T.tx2} />
        </View>
      )}

      {next ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })} style={{ flexDirection: 'row', gap: 12, paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center' }}>
          <Icon name="lock" size={20} color={T.tx2} />
          <View style={{ flex: 1 }}>
            <Text style={type.callout}>{total >= nextNeed ? tr('{0} : il manque des lettres de l’Allumeur', [infoOf(next).name]) : tr('Encore {0} lumières pour {1}', [nextNeed - total, lowerArticle(infoOf(next).name)])}</Text>
            <View style={{ marginTop: 8 }}><Gauge n={total - prevNeed} total={Math.max(1, nextNeed - prevNeed)} height={5} /></View>
          </View>
        </Pressable>
      ) : null}

      {state.seenDialogue.has(ENDING_SEEN) ? (
        <Pressable accessibilityRole="button" accessibilityLabel={tr('La suite : de l’autre côté de la mer. Revoir la fin du premier chapitre.')} onPress={() => { tap(); router.push('/ending'); }}
          style={{ backgroundColor: T.s1, borderWidth: 1, borderColor: 'rgba(255,217,142,0.35)', borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <GlyphCircle icon="light" color={T.gold} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{tr('De l’autre côté de la mer')}</Text>
            <Text style={type.sub}>{tr('Une lumière a répondu. Le prochain chapitre arrivera avec une mise à jour.')}</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['map', tr('Carte'), '/map'], ['book', tr('Carnet'), '/carnet'], ['gear', tr('Réglages'), '/settings']] as const).map(([icon, label, to]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => { tap(); router.push(to); }}
            style={{ flex: 1, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
            <Icon name={icon} size={22} color={T.tx2} />
            <Text style={{ color: T.tx, fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
        </>
      )}
    </Screen>
  );
}

