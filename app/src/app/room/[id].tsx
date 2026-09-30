import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { goBack } from '../../ui/nav';
import { useStore } from '../../game/store';
import { Screen } from '../../ui/Screen';
import { BackButton, Button, Crumb, GaugeRow, GlyphCircle, Icon, Nilo, Pill, Sheet, TierBars, tap } from '../../ui/components';
import { look } from '../../game/rewards';
import type { Mood } from '../../ui/art';
import { RoomScene } from '../../ui/RoomScene';
import { introOf, roomSlotsOf } from '../../ui/scenes';
import { T, type } from '../../ui/theme';
import { FAMILIES, REWARDS, TIER_NAMES, Code } from '../../game/catalog';
import { buildingName, collectibleOf, infoOf, locateRoom, roomName, roomRows } from '../../game/views';
import { sealDigitOf } from '../../game/seal';
import { followUps } from '../success';
import { lightsToOpenNextRoom } from '../../core/game/progression';

const BG = '#0b0d1d';
/** Lanterns already celebrated in their room (once per lighting). */
const celebrated = new Set<string>();

function Fade({ top, height }: { top: boolean; height: number }) {
  const id = top ? 'rfT' : 'rfB';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, height, [top ? 'top' : 'bottom']: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1={top ? '0' : '1'} x2="0" y2={top ? '1' : '0'}>
            <Stop offset="0" stopColor={BG} stopOpacity="1" />
            <Stop offset="1" stopColor={BG} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export default function RoomScreen() {
  const { id, search: searchParam, step } = useLocalSearchParams<{ id: string; search?: string; step?: string }>();
  const { state, engine, openLantern, settings, profile, result, pickObject, play, haptic } = useStore();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [searching, setSearching] = useState(searchParam === '1');
  const [feedback, setFeedback] = useState<string | null>(null);
  // Nilo's face: wonder when entering, then calm; he follows the search.
  const [niloMood, setNiloMood] = useState<Mood>('wonder');
  useEffect(() => { const t = setTimeout(() => setNiloMood('neutral'), 1800); return () => clearTimeout(t); }, [id]);
  const at = locateRoom(id ?? '');
  const p = engine.progression;
  const lanterns = at?.room.lanterns ?? [];
  const lit = lanterns.map((l) => state.solved.has(l.puzzle));
  const n = lit.filter(Boolean).length;
  const info = at ? infoOf(at.district) : null;
  const complete = n === lanterns.length && lanterns.length > 0;
  const lanternKeys = lanterns.map((l) => ({ key: l.puzzle }));

  // The lantern just lit in this room (coming back from its success screen) pops once.
  const [justLit] = useState(() => {
    if (!result || result.session.kind !== 'lantern' || result.replay || celebrated.has(result.session.id)) return -1;
    return lanterns.findIndex((l) => l.puzzle === result.session.id);
  });
  useEffect(() => { if (justLit >= 0 && result) celebrated.add(result.session.id); }, [justLit, result]);

  if (!at || !info) return <Screen><BackButton label="Vesper" onPress={() => goBack()} /></Screen>;
  const { district: d, buildingIndex: bi, index: ri } = at;
  const rec = lit.findIndex((x) => !x);
  const object = info.buildings[bi].rooms[ri].object;
  const credited = state.collectibles.has(collectibleOf(at.room.id));
  const picked = profile.picked.includes(at.room.id);
  const canSearch = complete && credited && !picked;
  const open = p.isPlayable(lanterns[0]?.puzzle ?? '', state);
  const lockHint = open ? '' : (roomRows(p, state, at.district, at.buildingIndex, null)[at.index]?.lockText || 'Allume d’abord le bâtiment précédent') + '.';
  const title = roomName(d, bi, ri);
  // The building's seal digit appears once the room is 60 % lit (it is then needed by the keystone).
  const digitShown = sealDigitOf(at.room.id) !== null && n >= lightsToOpenNextRoom(lanterns.length);

  const play_ = (i: number) => {
    setSelected(null);
    if (openLantern(lanterns[i].puzzle)) router.push('/puzzle');
  };
  const choose = (i: number) => { tap(); if (settings.direct) play_(i); else setSelected(i); };
  const sel = selected !== null ? lanterns[selected] : null;
  const fam = (c: string) => FAMILIES[c as Code];

  const found = () => {
    haptic('success');
    setNiloMood('joy');
    play('roomCompleted');
    pickObject(at.room.id);
    setSearching(false);
    setFeedback(null);
    if (step !== undefined) router.replace({ pathname: '/found', params: { step } });
    else router.push({ pathname: '/found', params: { object: at.room.id } });
  };
  const miss = (near: boolean) => {
    haptic('selection');
    setNiloMood(near ? 'hint' : 'think');
    setFeedback(near ? 'Tout près ! Regarde bien autour.' : 'Pas ici… Cherche ce qui brille un peu.');
  };
  const leaveSearch = () => {
    setSearching(false);
    setFeedback(null);
    // Coming from a success: carry on with what comes next (resident, letter, new district…).
    if (step === undefined) return;
    const nextStep = Number(step) + 1;
    if (nextStep < followUps(result).length) router.replace({ pathname: '/found', params: { step: String(nextStep) } });
    else router.setParams({ search: undefined, step: undefined });
  };

  return (
    <Screen background={BG} padded={false} place={info.sound} scroll style={{ flexGrow: 1, gap: 0 }}>
      <View style={{ paddingHorizontal: 16, gap: 6, zIndex: 2 }}>
        <BackButton label={searching && step !== undefined ? 'Plus tard' : buildingName(d, bi)} onPress={() => (searching && step !== undefined ? leaveSearch() : goBack())} />
        <Crumb parent={buildingName(d, bi)} current={lanterns.length === 16 ? 'Finale' : `Salle ${ri + 1}`} />
        <Text style={type.title1} accessibilityRole="header">{title}</Text>
        <GaugeRow n={n} total={lanterns.length} label="Lanternes de la salle" />
        <Text style={[type.dialogue, { fontSize: 15, lineHeight: 21, color: T.tx2 }]} numberOfLines={3}>{introOf(at.room.id)}</Text>
        {digitShown ? <Text style={[type.foot, { color: T.gold }]}>La lumière a fait apparaître un chiffre dans la salle. La lanterne-clé du bâtiment en aura besoin.</Text> : null}
      </View>

      <View style={{ flex: 1, minHeight: 470, marginTop: -8, marginBottom: -8 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {box.w > 0 ? (
          <RoomScene roomId={at.room.id} w={box.w} h={box.h} lanterns={lanternKeys} lit={lit} recommended={rec} justLit={justLit} open={open}
            object={object.name} objectFound={picked} digit={digitShown ? sealDigitOf(at.room.id) : null} glow={info.hue}
            labelOf={(i, sl) => `Lanterne ${i + 1} sur ${sl.label} : ${fam(lanterns[i].family).name}, ${TIER_NAMES[lanterns[i].tier]}, ${lit[i] ? 'allumée' : 'éteinte'}${i === rec ? ', recommandée' : ''}`}
            onLantern={choose}
            search={{ active: searching && canSearch, onFound: found, onMiss: miss, hintAfter: 3 }} />
        ) : null}
        <Fade top height={28} />
        <Fade top={false} height={36} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Nilo size={50} look={look(state)} mood={searching && canSearch && niloMood === 'neutral' ? 'curious' : complete && niloMood === 'neutral' ? 'joy' : niloMood} onPress={() => { tap(); setNiloMood((m) => (m === 'joy' ? 'curious' : 'joy')); }} />
          <View style={{ flex: 1 }}>
        {searching && canSearch ? (
          <View style={{ backgroundColor: 'rgba(255,217,142,0.07)', borderColor: 'rgba(255,217,142,0.35)', borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 }} accessibilityLiveRegion="polite">
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Icon name="star" size={18} color={T.gold} />
              <Text style={[type.headline, { color: T.gold }]}>Quelque chose brille ici</Text>
            </View>
            <Text style={type.sub}>Touche l’objet caché dans la salle : <Text style={{ color: T.tx, fontWeight: '600' }}>{object.name}</Text>.</Text>
            {feedback ? <Text style={[type.foot, { color: T.moon }]}>{feedback}</Text> : null}
          </View>
        ) : (
          <Pressable accessibilityRole={credited ? 'button' : undefined} disabled={!credited}
            onPress={() => (canSearch ? setSearching(true) : router.push({ pathname: '/carnet', params: { tab: 'objets' } }))}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 32 }}>
            {picked ? <Icon name="star" size={18} color={T.gold} /> : <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderStyle: 'dashed', borderColor: canSearch ? T.gold : T.tx3 }} />}
            <Text style={[type.foot, canSearch ? { color: T.gold } : null]}>
              {picked ? `Objet trouvé : ${object.name}` : canSearch ? 'La salle est éclairée : un objet s’y cache. Cherche-le !' : `Un objet se cache ici. Allume les ${lanterns.length} lanternes.`}
            </Text>
          </Pressable>
        )}
          </View>
        </View>
        {searching && canSearch
          ? (step === undefined ? <Button title="Chercher plus tard" kind="ghost" onPress={() => { setSearching(false); setFeedback(null); }} /> : null)
          : rec >= 0
            ? open
              ? <Button title={`Allumer la lanterne ${rec + 1} · ${fam(lanterns[rec].family).name}`} onPress={() => choose(rec)} />
              : <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: T.line }}><Icon name="lock" size={20} color={T.tx2} /><Text style={[type.sub, { flex: 1 }]}>Salle encore fermée. {lockHint}</Text></View>
            : canSearch
              ? <Button title="Chercher l’objet caché" icon="star" onPress={() => { tap(); setSearching(true); }} />
              : <Button title="Retour au bâtiment" kind="secondary" onPress={() => goBack()} />}
      </View>

      <Sheet visible={sel !== null} onClose={() => setSelected(null)}>
        {sel && selected !== null ? (
          <View>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <GlyphCircle icon={sel.family} size={56} color={lit[selected] ? T.gold : T.amber} />
              <View style={{ flex: 1 }}>
                <Text style={type.cap}>Lanterne {selected + 1} · {slotLabel(at.room.id, lanterns.length, selected)}</Text>
                <Text style={type.title2}>{fam(sel.family).name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><TierBars tier={sel.tier} /><Text style={type.sub}>{TIER_NAMES[sel.tier]}</Text></View>
              <Pill icon="shard" iconColor={T.moon}>+{REWARDS[sel.tier]}</Pill>
              {lit[selected] ? <Pill icon="check" iconColor={T.gold} color={T.gold}>Résolue</Pill> : null}
            </View>
            <Text style={[type.sub, { marginBottom: 16 }]}>{fam(sel.family).rule}</Text>
            <Button title={lit[selected] ? 'Rejouer' : state.inProgress.has(sel.puzzle) ? 'Reprendre' : 'Allumer'} onPress={() => play_(selected)} />
            <Button title="Plus tard" kind="ghost" onPress={() => setSelected(null)} style={{ marginTop: 4 }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const slotLabel = (roomId: string, n: number, i: number) => roomSlotsOf(roomId, n)[i]?.label ?? '';
