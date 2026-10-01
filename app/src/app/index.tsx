import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize, useWide } from '../ui/layout';
import { Redirect, router } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Sheet, Button, Card, Crumb, Gauge, GaugeRow, GlyphCircle, Icon, LightPill, Nilo, Rise, ShardPill, Twinkles, tap } from '../ui/components';
import { useReducedMotion } from '../ui/motion';
import { SkyPhase, skyPhase, vesperWindowXml } from '../ui/art';
import { useNow } from '../ui/useNow';
import { APP_VERSION, whatsNewFor } from '../content/whatsNew';
import { Fog, SeasonFall } from '../ui/SeasonFall';
import { pumpkinXml, vigilXml } from '../ui/seasonArt';
import { eventDone, eventEnd, eventOn, seasonOn, weatherOn } from '../game/seasons';
import { T, R, type } from '../ui/theme';
import { current, districtViews, infoOf, locateRoom, roomLabel, buildingName, lowerArticle } from '../game/views';
import { districtLanterns } from '../core/game/world';
import { FAMILIES, LANTERN_COUNT, TIER_NAMES, dailyPuzzle, eventSize, WORLD, formatCount } from '../game/catalog';
import { ENDING_SEEN } from '../game/story';
import { look } from '../game/rewards';
import { dailyLabel, dateOfDay } from '../ui/dates';
import { addDays } from '../core/game/dayKey';
import { lang, tr, trn } from '../i18n';
import { STANDARD_STREAK } from '../core/game/daily';
import { DailyState } from '../core/game/state';

/** The first evening the player could have played: no catch-up offered before they started. */
const firstDailyDay = (d: DailyState) => [...d.completedDays, ...d.catchUpDays].sort()[0] ?? d.maxSeenDay ?? '9999-12-31';

export const DAILY_UNLOCK_LIGHTS = 6;

const phaseLabel = (p: SkyPhase) => (p === 'dawn' ? tr('à l’aube') : p === 'day' ? tr('en plein jour') : p === 'dusk' ? tr('au crépuscule') : tr('la nuit'));

export default function Home() {
  const { state, engine, openLantern, today, findEgg, daysAway, profile, noteProfile } = useStore();
  const { width } = useContentSize();
  const reduce = useReducedMotion();
  const p = engine.progression;
  const { wide, width: wideWidth } = useWide();
  // iPad: Vesper and the next room on the left (large), the rest on the right.
  const winW = wide ? Math.floor((wideWidth - 56 - 28) * 0.58) : Math.min(width, 600) - 32;
  const winH = wide ? 380 : 210;
  const total = p.totalLights(state);
  const views = useMemo(() => districtViews(p, state), [p, state]);
  // The sky of the window follows the real time of day.
  const now = useNow();
  const hour = now.getHours();
  const phase = skyPhase(hour);
  // The season and the yearly events follow the phone's date.
  const season = seasonOn(now);
  const running = eventOn(now);
  const weather = weatherOn(now);
  const fall = running ? { kind: running.event.particle, accent: running.event.flame } : weather === 'rain' ? { kind: 'rain' as const, accent: '#9FC3E8' } : { kind: season.particle, accent: season.accent };
  // Touching Nilo: he reacts (a purr, a sneeze, his flame flaring…); a long press opens his wardrobe.
  const [reaction, setReaction] = useState<{ mood: 'joy' | 'oops' | 'wonder' | 'curious'; text: string } | null>(null);
  const pokes = useRef(0);
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (pokeTimer.current) clearTimeout(pokeTimer.current); }, []);
  const poke = () => {
    pokes.current += 1;
    const all: { mood: 'joy' | 'oops' | 'wonder' | 'curious'; text: string }[] = [
      { mood: 'joy', text: tr('Rrrrrr…') },
      { mood: 'oops', text: tr('Atchoum ! Pardon, c’est la poussière des lanternes.') },
      { mood: 'wonder', text: tr('Regarde, ma flamme brille plus fort !') },
      { mood: 'joy', text: tr('Hé, ça chatouille !') },
      { mood: 'curious', text: tr('On rallume une lanterne ensemble ?') },
    ];
    // The second touch tells how to reach the wardrobe (it used to open with a touch).
    const r = pokes.current === 2 ? { mood: 'curious' as const, text: tr('Appuie longtemps sur moi pour ma garde-robe.') } : all[Math.floor(Math.random() * all.length)];
    setReaction(r);
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setReaction(null), 2600);
  };
  // Nilo follows the hour: a coffee in the morning, yawns late in the evening (asleep after midnight, see below).
  const morning = hour >= 6 && hour < 10, late = hour >= 22;
  // In season, Nilo wears what fits, unless the player dressed him already.
  const dressed = look(state);
  // During the events, Nilo is in costume: a witch for the pumpkins, Father Christmas for the Vigil.
  const baseLook = running ? { ...dressed, costume: running.event.id === 'noel' ? 'santa' as const : 'witch' as const } : { ...dressed, hat: dressed.hat === 'none' && season.wear.hat ? season.wear.hat : dressed.hat, scarf: dressed.scarf === 'none' && season.wear.scarf ? season.wear.scarf : dressed.scarf };
  const niloLook = morning && dressed.comp === 'none' ? { ...baseLook, comp: 'coffee' } : baseLook;
  const windowXml = useMemo(() => vesperWindowXml(views, 358, 210, phase), [views, phase]);
  const cur = current(p, state);
  // Secret: between midnight and one, Nilo has fallen asleep on the window sill.
  const midnight = hour === 0;
  useEffect(() => { if (midnight) findEgg('midnight'); }, [midnight, findEgg]);
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

  // Missed evening challenges still within reach: a quiet reminder, never a red badge.
  const missed = dailyOpen ? Array.from({ length: STANDARD_STREAK.catchUpWindowDays }, (_, i) => addDays(today, -(i + 1)))
    .filter((d) => !state.daily.completedDays.has(d) && !state.daily.catchUpDays.has(d) && state.daily.maxSeenDay !== null && d >= firstDailyDay(state.daily) && dailyPuzzle(d)).length : 0;
  const catchUp = missed ? (
    <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/daily'); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
      <Icon name="cal" size={20} color={T.amber} />
      <Text style={[type.callout, { flex: 1 }]}>{trn(missed, '{0} défi du soir manqué à rattraper', '{0} défis du soir manqués à rattraper')}</Text>
      <Icon name="chev" size={18} color={T.tx3} />
    </Pressable>
  ) : null;

  const evSize = running ? eventSize(running.event.id) : 0;
  const evSolved = running ? eventDone(state, running.event.id, running.year, evSize).filter(Boolean).length : 0;
  const eventCard = running && evSize ? (
    <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/event'); }}
      style={({ pressed }) => [{ backgroundColor: T.s1, borderWidth: 1, borderColor: running.event.flame, borderRadius: R.l, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed ? { opacity: 0.85 } : null]}>
      <SvgXml xml={running.event.id === 'halloween' ? pumpkinXml(true) : vigilXml('lit')} width={48} height={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.cap, { color: running.event.flame }]}>{tr('Événement · jusqu’au {0}', [eventEnd(running.event, running.year).toLocaleDateString(lang() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' })])}</Text>
        <Text style={type.headline}>{tr(running.event.name)}</Text>
        <Text style={type.sub}>{running.event.id === 'halloween' ? tr('{0} / {1} citrouilles rallumées', [evSolved, evSize]) : tr('{0} / {1} soirs de veillée', [evSolved, evSize])}</Text>
      </View>
      <Icon name="chev" size={18} color={T.tx3} />
    </Pressable>
  ) : null;

  // After an update: what is new, once.
  const news = profile.seenVersion !== null && profile.seenVersion !== APP_VERSION ? whatsNewFor(APP_VERSION) : null;
  const seenNews = () => noteProfile((p) => ({ ...p, seenVersion: APP_VERSION }));
  const newsSheet = (
    <Sheet visible={!!news} onClose={seenNews}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Nilo size={90} mood="joy" look={niloLook} still />
        <Text style={[type.cap, { color: T.gold }]}>{tr('Quoi de neuf · version {0}', [APP_VERSION])}</Text>
        {news?.lines.map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
            <Icon name="light" size={18} color={T.amber} />
            <Text style={[type.body, { flex: 1 }]}>{tr(l)}</Text>
          </View>
        ))}
        <Button title={tr('Super !')} onPress={seenNews} style={{ alignSelf: 'stretch', marginTop: 6 }} />
      </View>
    </Sheet>
  );

  const onContinue = () => {
    if (!cur.lantern) { router.push('/map'); return; }
    if (openLantern(cur.lantern.puzzle)) router.push('/puzzle');
  };

  return (
    <Screen scroll place="lighthouse" wide={wide}>
      {/* The logo follows the season. */}
      <View accessible accessibilityRole="header" accessibilityLabel={`Lampion, ${tr('{0} à Vesper', [tr(season.name).toLowerCase()])}`} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: -4 }}>
        <Text style={[type.title2, { fontSize: 26, lineHeight: 32 }]}>Lampion</Text>
        <Text style={[type.dialogue, { color: running ? running.event.flame : season.flame }]}>{running ? tr(running.event.name) : tr('{0} à Vesper', [tr(season.name).toLowerCase()])}</Text>
      </View>
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
          <View style={{ width: winW, gap: 14 }}>
      <View style={{ height: winH, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Ouvrir la carte de Vesper')} onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={windowXml} width={winW} height={winH} />
          {!reduce && (phase === 'night' || phase === 'dusk') ? <Twinkles w={winW} h={winH * 0.57} n={wide ? 14 : 8} seed={3} /> : null}
          <SeasonFall kind={fall.kind} accent={fall.accent} w={winW} h={winH} n={fall.kind === 'bat' ? 5 : fall.kind === 'rain' ? 26 : wide ? 16 : 10} />
          {weather === 'fog' && !running ? <Fog w={winW} h={winH} /> : null}
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>{tr('Vesper')} · {phaseLabel(phase)}</Text>
            <Text style={type.foot}>{tr('{0} / {1} lanternes', [total, formatCount(LANTERN_COUNT)])}</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} /><Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{tr('Carte')}</Text>
          </View>
        </Pressable>
        <View style={{ position: 'absolute', right: 4, bottom: -26 }}>
          <Nilo size={96} mood={reaction?.mood ?? (midnight ? 'sleep' : late ? 'think' : 'curious')} look={niloLook} onPress={poke} onLongPress={() => router.push('/nilo')} longLabel={tr('Garde-robe de Nilo')} />
          {reaction ? <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: 96, maxWidth: 220, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 14, borderBottomRightRadius: 4, paddingVertical: 7, paddingHorizontal: 11 }}><Text style={[type.callout, { color: T.tx }]}>{reaction.text}</Text></View> : null}
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
        <Button title={tr('Où en suis-je ?')} kind="ghost" onPress={() => router.push('/progress')} />
      </Card></Rise>
          </View>
          <View style={{ flex: 1, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Lumières', [total])} onPress={() => router.push({ pathname: '/carnet', params: { tab: 'vesper' } })}><LightPill n={total} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('{0} Éclats', [state.wallet.balance])} onPress={() => router.push('/shards')}><ShardPill n={state.wallet.balance} /></Pressable>
      </View>
      {midnight ? <Text style={[type.foot, { textAlign: 'center', color: T.tx2 }]}>{tr('Minuit passé. Nilo s’est endormi… mais les lanternes t’attendent.')}</Text>
        : daysAway >= 3 ? <Text style={[type.callout, { textAlign: 'center', color: T.gold }]}>{tr('Te revoilà ! Vesper t’attendait depuis {0} jours.', [daysAway])}</Text>
        : morning ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Nilo boit son café. Une petite énigme avant de commencer la journée ?')}</Text>
        : late ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Nilo bâille… Encore une lanterne, et au lit ?')}</Text>
        : weather === 'rain' && !running ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Il pleut sur Vesper. Les lanternes n’en brillent que mieux.')}</Text>
        : weather === 'fog' && !running ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Le brouillard monte du port. Suis les lanternes.')}</Text>
        : <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr(season.line)}</Text>}


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

      {eventCard}
      {catchUp}
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
        {([['map', tr('Carte'), '/map'], ['hint', tr('Libre'), '/free'], ['book', tr('Carnet'), '/carnet'], ['gear', tr('Réglages'), '/settings']] as const).map(([icon, label, to]) => (
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
      {midnight ? <Text style={[type.foot, { textAlign: 'center', color: T.tx2 }]}>{tr('Minuit passé. Nilo s’est endormi… mais les lanternes t’attendent.')}</Text>
        : daysAway >= 3 ? <Text style={[type.callout, { textAlign: 'center', color: T.gold }]}>{tr('Te revoilà ! Vesper t’attendait depuis {0} jours.', [daysAway])}</Text>
        : morning ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Nilo boit son café. Une petite énigme avant de commencer la journée ?')}</Text>
        : late ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Nilo bâille… Encore une lanterne, et au lit ?')}</Text>
        : weather === 'rain' && !running ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Il pleut sur Vesper. Les lanternes n’en brillent que mieux.')}</Text>
        : weather === 'fog' && !running ? <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr('Le brouillard monte du port. Suis les lanternes.')}</Text>
        : <Text style={[type.foot, { textAlign: 'center', fontStyle: 'italic', color: T.tx2 }]}>{tr(season.line)}</Text>}

      <View style={{ height: winH, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Ouvrir la carte de Vesper')} onPress={() => { tap(); router.push('/map'); }}
          style={{ flex: 1, borderRadius: R.l, overflow: 'hidden', backgroundColor: '#080914', borderWidth: 1, borderColor: T.line }}>
          <SvgXml xml={windowXml} width={winW} height={winH} />
          {!reduce && (phase === 'night' || phase === 'dusk') ? <Twinkles w={winW} h={winH * 0.57} n={wide ? 14 : 8} seed={3} /> : null}
          <SeasonFall kind={fall.kind} accent={fall.accent} w={winW} h={winH} n={fall.kind === 'bat' ? 5 : fall.kind === 'rain' ? 26 : wide ? 16 : 10} />
          {weather === 'fog' && !running ? <Fog w={winW} h={winH} /> : null}
          <View style={{ position: 'absolute', left: 14, bottom: 12, gap: 2 }}>
            <Text style={[type.cap, { color: T.tx }]}>{tr('Vesper')} · {phaseLabel(phase)}</Text>
            <Text style={type.foot}>{tr('{0} / {1} lanternes', [total, formatCount(LANTERN_COUNT)])}</Text>
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line }}>
            <Icon name="map" size={16} /><Text style={{ color: T.tx, fontSize: 15, fontWeight: '600' }}>{tr('Carte')}</Text>
          </View>
        </Pressable>
        <View style={{ position: 'absolute', right: 4, bottom: -26 }}>
          <Nilo size={96} mood={reaction?.mood ?? (midnight ? 'sleep' : late ? 'think' : 'curious')} look={niloLook} onPress={poke} onLongPress={() => router.push('/nilo')} longLabel={tr('Garde-robe de Nilo')} />
          {reaction ? <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: 96, maxWidth: 220, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 14, borderBottomRightRadius: 4, paddingVertical: 7, paddingHorizontal: 11 }}><Text style={[type.callout, { color: T.tx }]}>{reaction.text}</Text></View> : null}
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
        <Button title={tr('Où en suis-je ?')} kind="ghost" onPress={() => router.push('/progress')} />
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

      {eventCard}
      {catchUp}
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
        {([['map', tr('Carte'), '/map'], ['hint', tr('Libre'), '/free'], ['book', tr('Carnet'), '/carnet'], ['gear', tr('Réglages'), '/settings']] as const).map(([icon, label, to]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => { tap(); router.push(to); }}
            style={{ flex: 1, backgroundColor: T.s1, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
            <Icon name={icon} size={22} color={T.tx2} />
            <Text style={{ color: T.tx, fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
        </>
      )}
      {newsSheet}
    </Screen>
  );
}

