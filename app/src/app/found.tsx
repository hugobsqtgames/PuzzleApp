// What a success reveals, one screen at a time: the room's object, the
// resident who wakes up, the district keeper, a letter of the Allumeur, a
// new district.
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '../ui/Text';
import { useContentSize } from '../ui/layout';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { Button, Icon, Nilo, Pill, Rise, ShardPill } from '../ui/components';
import { useAnimatedValue, useReducedMotion } from '../ui/motion';
import { districtXml, letterArtXml, type Look } from '../ui/art';
import { objectSvg } from '../ui/scenes/objects';
import { T, type } from '../ui/theme';
import { LETTERS } from '../content/vesper';
import { achievementContext, COSMETICS, look, starsOf } from '../game/rewards';
import { allRooms, buildingName, districtById, infoOf, locateBuilding, locateRoom, lowerArticle, nextStep, roomName } from '../game/views';
import { FAMILIES, WORLD } from '../game/catalog';
import { followUps } from './success';
import { inFrench, lang, tr, trn } from '../i18n';
import { districtLanterns } from '../core/game/world';
import { askReview } from '../game/review';

/**
 * A short cinematic for a district: the camera settles on the panorama while
 * its windows light up one building after the other (frame by frame).
 */
function DistrictReel({ frames, width, height, label }: { frames: string[]; width: number; height: number; label: string }) {
  const reduce = useReducedMotion();
  const [f, setF] = useState(0);
  const cam = useAnimatedValue(0);
  // The frames are rebuilt at each render: only their number drives the reel.
  const n = frames.length;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(cam, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ids = Array.from({ length: n - 1 }, (_, k) => setTimeout(() => setF(k + 1), 500 + k * 380));
    return () => ids.forEach(clearTimeout);
  }, [cam, n, reduce]);
  const shown = reduce ? frames.length - 1 : f;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width, height, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: T.line, backgroundColor: '#080914' }}>
      <Animated.View style={reduce ? null : { opacity: cam.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }), transform: [{ scale: cam.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1] }) }, { translateY: cam.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <SvgXml xml={frames[shown]} width={width} height={height} />
      </Animated.View>
    </View>
  );
}

/** Between two districts: Nilo crosses the bridge over the water, little hops, his flame bobbing. */
function Crossing({ width, hue, look: lk }: { width: number; hue: string; look: Look }) {
  const reduce = useReducedMotion();
  const walk = useAnimatedValue(reduce ? 1 : 0);
  const bob = useAnimatedValue(0);
  useEffect(() => {
    if (reduce) return;
    Animated.timing(walk, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]), { iterations: 7 });
    loop.start();
    return () => loop.stop();
  }, [walk, bob, reduce]);
  const h = 96, n = 46;
  const scene = `<svg viewBox="0 0 ${width} ${h}">
    <rect width="${width}" height="${h}" fill="#0b0e22"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${(i * 71) % width} ${h - 14 + (i % 3) * 4}q10-4 20 0" stroke="#2a3060" stroke-width="1.5" fill="none"/>`).join('')}
    <path d="M0 ${h - 34}Q${width / 2} ${h - 62} ${width} ${h - 34}" stroke="#6b5a3c" stroke-width="6" fill="none"/>
    <path d="M0 ${h - 34}Q${width / 2} ${h - 62} ${width} ${h - 34}" stroke="#8a6d45" stroke-width="2" fill="none" transform="translate(0 -9)"/>
    ${[0.12, 0.37, 0.63, 0.88].map((t) => { const x = t * width, y = h - 34 - 28 * (1 - Math.pow(2 * t - 1, 2)) * (4 / 4); return `<path d="M${x} ${y}v-16" stroke="#8a6d45" stroke-width="2"/><circle cx="${x}" cy="${y - 19}" r="4" fill="${hue}"/><circle cx="${x}" cy="${y - 19}" r="9" fill="${hue}" opacity=".18"/>`; }).join('')}
  </svg>`;
  // Nilo follows the arch of the bridge: up in the middle, down at the ends.
  const x = walk.interpolate({ inputRange: [0, 1], outputRange: [-n * 0.2, width - n * 0.9] });
  const arch = walk.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -26, 0] });
  const hop = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('Nilo traverse le pont vers le nouveau quartier')} style={{ width, height: h, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: T.line }}>
      <SvgXml xml={scene} width={width} height={h} />
      <Animated.View style={{ position: 'absolute', left: 0, top: h - 34 - n * 0.95, transform: [{ translateX: x }, { translateY: Animated.add(arch, hop) }] }}>
        <Nilo size={n} mood="joy" look={lk} still />
      </Animated.View>
    </View>
  );
}

/** What the player went through in a district now fully lit: the days, the stars, their family, the help taken. */
function DistrictRecap({ districtId }: { districtId: string }) {
  const { state } = useStore();
  const d = districtById(districtId);
  const records = districtLanterns(d).map((l) => ({ l, r: state.solved.get(l.puzzle) })).filter((x) => x.r);
  if (!records.length) return null;
  const dates = records.map((x) => Date.parse(x.r!.solvedAt)).filter((t) => !Number.isNaN(t)).sort((a, b) => a - b);
  const fmt = (t: number) => new Date(t).toLocaleDateString(lang() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' });
  const days = dates.length ? Math.max(1, Math.round((dates[dates.length - 1] - dates[0]) / 86_400_000) + 1) : 0;
  const three = records.filter((x) => starsOf(x.r) === 3).length;
  const counts = new Map<string, number>();
  records.forEach((x) => counts.set(x.l.family, (counts.get(x.l.family) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const helped = records.filter((x) => x.r!.paidHints > 0 || x.r!.usedSolution).length;
  const rows: [string, string][] = [
    ...(dates.length ? [[tr('Ton voyage'), days > 1 ? tr('du {0} au {1}, en {2} jours', [fmt(dates[0]), fmt(dates[dates.length - 1]), days]) : tr('en une seule journée, le {0}', [fmt(dates[0])])]] as [string, string][] : []),
    [tr('Lanternes à 3 étoiles'), `${three} / ${records.length}`],
    ...(top ? [[tr('Ta famille dans ce quartier'), `${FAMILIES[top[0] as keyof typeof FAMILIES].name} · ${top[1]}`]] as [string, string][] : []),
    [tr('Avec un coup de pouce'), helped ? trn(helped, '{0} lanterne', '{0} lanternes') : tr('aucune : bravo !')],
  ];
  return (
    <View style={{ backgroundColor: T.s1, borderRadius: 18, borderWidth: 1, borderColor: T.line, padding: 14, gap: 8 }}>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <Text style={type.foot}>{k}</Text>
          <Text style={[type.sub, { color: T.tx, flexShrink: 1, textAlign: 'right' }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

const kindOf = (steps: string[], step?: string) => (steps[Math.max(0, Number(step ?? 0))] ?? '').split(':')[0];
const idOf = (steps: string[], step?: string) => (steps[Math.max(0, Number(step ?? 0))] ?? '').split(':')[1] ?? '';

export default function Found() {
  const { step, object: objectParam } = useLocalSearchParams<{ step?: string; object?: string }>();
  const { state, engine, profile, result, play, equip, openLantern, noteProfile } = useStore();
  const { width } = useContentSize();
  const steps = useMemo(() => (objectParam ? [`object:${objectParam}`] : followUps(result)), [result, objectParam]);
  const i = Math.max(0, Number(step ?? 0));
  const [kind, id] = (steps[i] ?? '').split(':');
  const pickedHere = kindOf(steps, step) === 'object' && profile.picked.includes(idOf(steps, step));

  // A district fully lit: its photo goes in the album, and (once ever) the App Store rating is asked, a moment later.
  useEffect(() => {
    if (kind !== 'keeper' || !id) return;
    noteProfile((p) => (p.photos.some((x) => x.d === id) ? p : { ...p, photos: [...p.photos, { d: id, at: new Date().toISOString() }] }));
    if (profile.reviewAsked) return;
    const t = setTimeout(() => { noteProfile((p) => ({ ...p, reviewAsked: true })); void askReview(); }, 2500);
    return () => clearTimeout(t);
  }, [kind, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (kind === 'object' && pickedHere) play('roomCompleted');
    if (kind === 'resident' || kind === 'keeper') play('unlock');
    if (kind === 'district') play('newDistrict');
    if (kind === 'letter') play('hint');
  }, [kind, id, play, pickedHere]);

  const next = () => {
    if (objectParam) { router.back(); return; }
    // The last letter leads to the top of the Phare.
    if (steps[i + 1]?.startsWith('ending')) { router.replace('/ending'); return; }
    if (i + 1 < steps.length) { router.replace({ pathname: '/found', params: { step: String(i + 1) } }); return; }
    // Carry on where the player was (a new district waits on the map, it never takes them away).
    const step = nextStep(engine.progression, state, result?.session.kind === 'lantern' ? result.session.id : null);
    if (step.kind === 'puzzle' && openLantern(step.puzzle)) { router.replace('/puzzle'); return; }
    if (step.kind === 'room') { router.replace({ pathname: '/room/[id]', params: { id: step.id } }); return; }
    if (step.kind === 'building') { router.replace({ pathname: '/building/[id]', params: { id: step.id } }); return; }
    router.dismissTo('/');
  };

  let body: React.ReactNode = null;
  let buttons: React.ReactNode = <Button title={tr('Continuer')} onPress={next} />;

  if (kind === 'object') {
    const at = locateRoom(id);
    if (at) {
      const info = infoOf(at.district);
      const obj = info.buildings[at.buildingIndex].rooms[at.index].object;
      const where = at.room.lanterns.length === 16 ? tr('Le Grenier') : tr('Salle {0} · {1}', [at.index + 1, roomName(at.district, at.buildingIndex, at.index)]);
      if (!pickedHere) {
        // The room is lit: its object glints somewhere in the scenery. The player finds it.
        body = (
          <>
            <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,217,142,0.08)' }} />
              <Icon name="star" size={56} color={T.gold} sw={1.2} />
            </View>
            <Text style={[type.cap, { color: T.gold }]}>{where}</Text>
            <Text style={[type.title1, { textAlign: 'center' }]}>{tr('La salle est éclairée')}</Text>
            <Text style={[type.sub, { maxWidth: 320, textAlign: 'center' }]}>{tr('Maintenant que tout est allumé, quelque chose brille dans le décor. Retrouve l’objet caché.')}</Text>
          </>
        );
        buttons = (
          <>
            <Button title={tr('Chercher l’objet')} icon="star" onPress={() => router.replace({ pathname: '/room/[id]', params: { id, search: '1', step: String(i) } })} />
            <Button title={tr('Plus tard')} kind="ghost" onPress={next} />
          </>
        );
      } else {
        body = (
          <>
            <View style={{ width: 200, height: 170, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,217,142,0.10)' }} />
              <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: info.hue, opacity: 0.12 }} />
              <SvgXml xml={objectSvg(obj.name, T.gold, 1.4)} width={96} height={96} />
            </View>
            <Text style={[type.cap, { color: T.gold }]}>{where}</Text>
            <Text style={type.title1}>{tr('Objet trouvé')}</Text>
            <Text style={[type.title3, { textAlign: 'center' }]}>{obj.name}</Text>
            <Text style={[type.dialogue, { maxWidth: 320, textAlign: 'center', color: T.tx2 }]}>{obj.story}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}><ShardPill n={`+${engine.economy.roomBonus}`} /><Pill icon="book">{tr('Carnet')} · {profile.picked.length} / {allRooms().length}</Pill></View>
          </>
        );
      }
    }
  }

  if (kind === 'resident') {
    const at = locateBuilding(id);
    if (at) {
      const ctx = achievementContext(state, engine.progression, profile);
      // The wardrobe names the building its prize comes from (compared in French, the language they are written in).
      const reward = COSMETICS.find((c) => c.earn && c.earn.when(ctx) && inFrench(() => c.earn!.text.includes(buildingName(at.district, at.index))));
      body = (
        <>
          <Nilo size={150} mood="wonder" look={look(state)} />
          <Text style={[type.cap, { color: T.gold }]}>{tr('Bâtiment entièrement éclairé')}</Text>
          <Text style={[type.title1, { textAlign: 'center' }]}>{buildingName(at.district, at.index)}</Text>
          <Text style={[type.dialogue, { textAlign: 'center' }]}>{infoOf(at.district).buildings[at.index].residentAwake}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ShardPill n={`+${engine.economy.buildingBonus}`} />
            {reward ? <Pill icon="star" iconColor={T.gold}>{reward.name}</Pill> : null}
          </View>
        </>
      );
      if (reward) buttons = (<><Button title={tr('Porter : {0}', [reward.name])} onPress={() => { equip(reward.slot, reward.id); next(); }} /><Button title={tr('Plus tard')} kind="ghost" onPress={next} /></>);
    }
  }

  if (kind === 'keeper') {
    const d = districtById(id);
    const info = infoOf(d);
    body = (
      <>
        <DistrictReel width={width - 32} height={200} label={tr('{0}, toutes ses fenêtres allumées', [info.name])} frames={d.buildings.map((_, upTo) => districtXml(d.id, info.hue, d.buildings.map((__, bi) => ({ name: buildingName(d, bi), open: true, lit: bi <= upTo ? 1 : 0.3 })), false))
          .concat(districtXml(d.id, info.hue, d.buildings.map((_, bi) => ({ name: buildingName(d, bi), open: true, lit: 1 })), true))} />
        <Rise delay={300}><Text style={[type.cap, { color: info.hue, textAlign: 'center' }]}>{tr('Quartier entièrement éclairé')}</Text></Rise>
        <Rise delay={500}><Text style={[type.title1, { textAlign: 'center' }]}>{info.name}</Text></Rise>
        {info.keeper ? <Rise delay={500 + d.buildings.length * 380}><Text style={[type.dialogue, { textAlign: 'center' }]}>{tr('{0} se réveille.', [info.keeper.name])} {info.keeper.line}</Text></Rise> : null}
        <Rise delay={700 + d.buildings.length * 380}><ShardPill n={`+${engine.economy.districtBonus}`} /></Rise>
        <Rise delay={900 + d.buildings.length * 380} style={{ alignSelf: 'stretch' }}><DistrictRecap districtId={d.id} /></Rise>
      </>
    );
  }

  if (kind === 'letter') {
    const from = id.split('.')[0];
    const letter = LETTERS.find((l) => l.from === from);
    if (letter) body = (
      <>
        <SvgXml xml={letterArtXml(from)} width={200} height={150} />
        <Text style={[type.cap, { color: T.gold }]}>{tr('Lettre de l’Allumeur')}</Text>
        <Text style={type.title1}>{letter.title}</Text>
        <Text style={[type.dialogue, { textAlign: 'center', maxWidth: 340 }]}>« {letter.text} »</Text>
      </>
    );
    if (steps[i + 1]?.startsWith('ending')) buttons = <Button title={tr('Monter au sommet du Phare')} icon="light" onPress={next} />;
  }

  if (kind === 'district') {
    const d = WORLD.districts.find((x) => x.id === id)!;
    const info = infoOf(d);
    const families = [...new Set(d.buildings.flatMap((b) => b.rooms.flatMap((r) => r.lanterns.map((l) => l.family))))];
    body = (
      <>
        <Crossing width={width - 32} hue={info.hue} look={look(state)} />
        {/* Out of the dark, the first building lights its first windows. */}
        <DistrictReel width={width - 32} height={220} label={tr('{0}, une première fenêtre s’allume', [info.name])} frames={[0, 0.15].map((lit) => districtXml(d.id, info.hue, d.buildings.map((_, bi) => ({ name: buildingName(d, bi), open: bi === 0, lit: bi === 0 ? lit : 0 })), false))} />
        <Rise delay={400}><Text style={[type.cap, { color: info.hue, textAlign: 'center' }]}>{tr('Nouveau quartier')}</Text></Rise>
        <Rise delay={650}><Text style={[type.display, { fontSize: 34, lineHeight: 40, textAlign: 'center' }]}>{info.name}</Text></Rise>
        <Rise delay={1000}><Text style={[type.dialogue, { color: T.tx2, textAlign: 'center' }]}>{info.tagline}</Text></Rise>
        <Rise delay={1300}><Text style={[type.sub, { textAlign: 'center' }]}>{tr('{0} familles de casse-têtes t’y attendent.', [families.length])}</Text></Rise>
      </>
    );
    buttons = (
      <>
        {/* Continuing is the main way: the new district waits on the map. */}
        <Button title={tr('Continuer')} onPress={next} />
        <Button title={tr('Visiter {0}', [lowerArticle(info.name)])} kind="ghost" onPress={() => { router.dismissTo('/'); router.push({ pathname: '/district/[id]', params: { id: d.id === 'grenier' ? 'phare' : d.id } }); }} />
      </>
    );
  }

  return (
    <Screen scroll style={{ gap: 12, paddingTop: 72, flexGrow: 1 }} place={kind === 'district' ? infoOf(districtById(id)).sound : undefined}>
      <View style={{ alignItems: 'center', gap: 12 }}>{body}</View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 4 }}>{buttons}</View>
    </Screen>
  );
}
