import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useContentSize } from '../ui/layout';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, Gauge, Icon, Nilo, Sheet, tap } from '../ui/components';
import { objectSvg } from '../ui/scenes/objects';
import { T, SERIF, type } from '../ui/theme';
import { CODES, FAMILIES, LANTERN_COUNT, TIER_NAMES, WORLD, formatCount } from '../game/catalog';
import { ENDING_SEEN } from '../game/story';
import { achievementContext, achievementStatus, look } from '../game/rewards';
import { allRooms, collectibleOf, districtViews, infoOf, roomName, unlockText } from '../game/views';
import { LETTERS } from '../content/vesper';
import { districtLanterns, worldLanterns } from '../core/game/world';
import { isClairvoyant } from '../core/game/state';

type Tab = 'objets' | 'succes' | 'stats' | 'vesper';
const TABS: [Tab, string][] = [['objets', 'Objets'], ['succes', 'Succès'], ['stats', 'Statistiques'], ['vesper', 'Vesper']];

export default function Carnet() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>((TABS.find(([k]) => k === params.tab)?.[0]) ?? 'objets');
  return (
    <Screen scroll place="library">
      <BackButton label="Accueil" onPress={() => goBack()} />
      <Text style={type.title1}>Carnet</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {TABS.map(([k, l]) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: k === tab }} onPress={() => { tap(); setTab(k); }}
            style={{ flexGrow: 1, minWidth: '18%', minHeight: 36, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: k === tab ? T.s2 : 'transparent', borderWidth: 1, borderColor: k === tab ? T.moon : T.line }}>
            <Text style={{ color: k === tab ? T.tx : T.tx2, fontSize: 13, fontWeight: '600' }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'objets' ? <Objects /> : tab === 'succes' ? <Achievements /> : tab === 'stats' ? <Stats /> : <VesperTab />}
    </Screen>
  );
}

function Objects() {
  const { width } = useContentSize();
  const { state, engine, profile } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [letter, setLetter] = useState<number | null>(null);
  const rooms = useMemo(() => allRooms(), []);
  // Found = picked up in the lit room. Lit but not picked yet = it glints there, waiting.
  const found = rooms.map((r) => profile.picked.includes(r.room.id));
  const waiting = rooms.map((r, i) => !found[i] && state.collectibles.has(collectibleOf(r.room.id)));
  const count = found.filter(Boolean).length;
  const p = engine.progression;
  const letterOwned = (from: string) => {
    if (from === 'phare' || from === 'grenier') { const d = WORLD.districts.find((x) => x.id === from)!; const all = districtLanterns(d); return p.lights(all, state) === all.length; }
    const d = WORLD.districts.find((x) => x.id === from)!;
    const key = d.buildings[3]?.keystone;
    return !!key && state.solved.has(key.puzzle);
  };
  const letters = LETTERS.map((l, i) => ({ ...l, i, owned: letterOwned(l.from) }));
  if (count === 0 && !waiting.some(Boolean)) {
    return (
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: 40 }}>
        <Nilo size={150} mood="sleep" look={look(state)} />
        <Text style={type.title3}>Pas encore d’objet trouvé</Text>
        <Text style={[type.sub, { maxWidth: 280, textAlign: 'center' }]}>Éclaire une salle entière : un objet de Vesper s’y révélera.</Text>
      </View>
    );
  }
  // Found objects first, then the next unknown ones.
  const firstUnknown = found.findIndex((f, i) => !f && !waiting[i]);
  const visible = rooms.map((r, i) => ({ r, i })).filter(({ i }) => found[i] || waiting[i] || (firstUnknown >= 0 && i >= firstUnknown && i < firstUnknown + 6));
  // Three cards a row, whatever the width (percentages plus gaps overflow on small phones).
  const cardW = Math.floor((width - 32 - 20) / 3);
  return (
    <>
      <Text style={type.sub}>{count} / {rooms.length} objets trouvés{waiting.some(Boolean) ? ` · ${waiting.filter(Boolean).length} à chercher dans leur salle` : ''}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {visible.map(({ r, i }) => (
          <Pressable key={r.room.id} accessibilityRole={found[i] || waiting[i] ? 'button' : undefined} disabled={!found[i] && !waiting[i]}
            accessibilityLabel={waiting[i] ? `Objet à chercher dans ${roomName(r.district, r.bi, r.ri)}` : undefined}
            onPress={() => (found[i] ? setOpen(i) : router.push({ pathname: '/room/[id]', params: { id: r.room.id, search: '1' } }))}
            style={{ width: cardW, minHeight: 120, borderRadius: 24, borderWidth: 1, borderColor: waiting[i] ? 'rgba(255,217,142,0.45)' : T.line, borderStyle: found[i] || waiting[i] ? 'solid' : 'dashed', backgroundColor: found[i] ? T.s1 : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 }}>
            {found[i] ? (
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,217,142,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <SvgXml xml={objectSvg(r.object.name, T.gold)} width={28} height={28} />
              </View>
            ) : waiting[i] ? (
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,217,142,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={24} color={T.gold} />
              </View>
            ) : (
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#12152c', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: SERIF, fontSize: 24, color: T.tx3 }}>?</Text>
              </View>
            )}
            <Text style={{ color: found[i] ? T.tx : waiting[i] ? T.gold : T.tx2, fontSize: found[i] ? 13 : 12, textAlign: 'center' }}>{found[i] ? r.object.name : waiting[i] ? `À chercher : ${roomName(r.district, r.bi, r.ri)}` : `${infoOf(r.district).short}`}</Text>
          </Pressable>
        ))}
      </View>
      <Card style={{ gap: 4, padding: 4 }}>
        <Text style={[type.cap, { margin: 12, marginBottom: 4 }]}>Lettres de l’Allumeur · {letters.filter((l) => l.owned).length} / {letters.length}</Text>
        {letters.map((l) => (
          <Pressable key={l.i} accessibilityRole="button" accessibilityState={{ disabled: !l.owned }} disabled={!l.owned} onPress={() => setLetter(l.i)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 }}>
            <Icon name={l.owned ? 'letter' : 'lock'} size={20} color={l.owned ? T.amber : T.tx3} />
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, !l.owned && { color: T.tx2 }]}>{l.title}</Text>
              <Text style={type.foot} numberOfLines={1}>{l.owned ? `« ${l.text} »` : l.from === 'phare' ? 'Éclaire tout le Phare' : l.from === 'grenier' ? 'Éclaire le Grenier de l’Allumeur' : `Lanterne-clé de ${infoOf(WORLD.districts.find((d) => d.id === l.from)!).buildings[3].name}`}</Text>
            </View>
          </Pressable>
        ))}
      </Card>
      <Sheet visible={open !== null} onClose={() => setOpen(null)}>
        {open !== null ? (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <SvgXml xml={objectSvg(rooms[open].object.name, T.gold, 1.4)} width={64} height={64} />
            <Text style={type.title2}>{rooms[open].object.name}</Text>
            <Text style={[type.dialogue, { textAlign: 'center' }]}>{rooms[open].object.story}</Text>
            <Text style={type.foot}>{infoOf(rooms[open].district).short} · {infoOf(rooms[open].district).buildings[rooms[open].bi].name}</Text>
          </View>
        ) : null}
      </Sheet>
      <Sheet visible={letter !== null} onClose={() => setLetter(null)}>
        {letter !== null ? (
          <View style={{ gap: 10 }}>
            <Text style={type.title2}>{LETTERS[letter].title}</Text>
            <Text style={type.dialogue}>« {LETTERS[letter].text} »</Text>
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

function Achievements() {
  const { state, engine, profile } = useStore();
  const status = achievementStatus(achievementContext(state, engine.progression, profile));
  const done = status.filter((x) => x.done).length;
  return (
    <>
      <Text style={type.sub}>{done} / {status.length} succès</Text>
      <Card style={{ paddingVertical: 4 }}>
        {status.map(({ a, n, total, done: d }) => (
          <View key={a.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
            <Icon name="star" size={24} color={d ? T.gold : T.tx3} />
            <View style={{ flex: 1 }}>
              <Text style={type.headline}>{a.hidden && !d ? '???' : a.name}</Text>
              <Text style={type.foot}>{a.description}</Text>
              {!d && total > 1 ? <View style={{ marginTop: 8 }}><Gauge n={n} total={total} height={5} /></View> : null}
            </View>
            {d ? <Icon name="check" size={18} color={T.gold} sw={2} /> : <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{total > 1 ? `${n} / ${total}` : `+${a.reward}`}</Text>}
          </View>
        ))}
      </Card>
    </>
  );
}

const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

function Stats() {
  const { state, engine, profile } = useStore();
  const lanterns = worldLanterns(WORLD).filter((l) => state.solved.has(l.puzzle));
  const records = lanterns.map((l) => state.solved.get(l.puzzle)!);
  const clair = records.length ? Math.round((100 * records.filter(isClairvoyant).length) / records.length) : 0;
  const perFamily = CODES.map((c) => [c, lanterns.filter((l) => l.family === c).length] as const);
  const max = Math.max(1, ...perFamily.map(([, n]) => n));
  const tiles: [string, string][] = [['Lanternes', String(engine.progression.totalLights(state))], ['Clairvoyance', `${clair} %`], ['Série record', `${state.daily.bestStreak} soir${state.daily.bestStreak > 1 ? 's' : ''}`], ['Murmures', String(profile.murmures)]];
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map(([l, v]) => (
          <Card key={l} style={{ width: '48%', padding: 14 }}><Text style={type.foot}>{l}</Text><Text style={[type.title2, { marginTop: 2 }]}>{v}</Text></Card>
        ))}
      </View>
      <Card style={{ gap: 10 }}>
        <Text style={type.cap}>Lanternes par famille</Text>
        {perFamily.map(([c, n]) => (
          <View key={c} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name={c} size={18} color={T.tx2} />
            <Text style={{ width: 100, fontSize: 14, color: T.tx }}>{FAMILIES[c].name}</Text>
            <View style={{ flex: 1, height: 10, backgroundColor: '#1d2140', borderRadius: 6, overflow: 'hidden' }}>
              <View style={{ width: `${(100 * n) / max}%`, height: '100%', backgroundColor: T.amber, borderRadius: 6 }} />
            </View>
            <Text style={[type.foot, { width: 28, textAlign: 'right' }]}>{n}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={[type.cap, { marginBottom: 4 }]}>Temps médian par palier</Text>
        {TIER_NAMES.map((t, i) => {
          const m = median(profile.durations[i] ?? []);
          return (
            <View key={t} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={type.sub}>{t}</Text><Text style={{ color: T.tx, fontVariant: ['tabular-nums'] }}>{m === null ? '—' : fmt(m)}</Text>
            </View>
          );
        })}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="shield" size={20} color={T.moon} />
        <Text style={[type.foot, { flex: 1 }]}>Ces statistiques restent sur ton appareil. Rien n’est envoyé.</Text>
      </View>
    </>
  );
}

function VesperTab() {
  const { state, engine } = useStore();
  const p = engine.progression;
  const views = districtViews(p, state);
  const lanterns = worldLanterns(WORLD).filter((l) => state.solved.has(l.puzzle));
  const byTier = TIER_NAMES.map((_, t) => lanterns.filter((l) => l.tier === t).length);
  const maxTier = Math.max(1, ...byTier);
  return (
    <>
      <Card style={{ alignItems: 'center', gap: 4, padding: 20 }}>
        <Text style={type.cap}>Vesper</Text>
        <Text style={type.display}>{p.totalLights(state)}<Text style={[type.title2, { color: T.tx2 }]}> / {formatCount(LANTERN_COUNT)}</Text></Text>
        <Text style={type.foot}>Lettres de l’Allumeur : {p.letters(state)} / 6</Text>
      </Card>
      {state.seenDialogue.has(ENDING_SEEN) ? <Button title="Revoir la fin du premier chapitre" kind="ghost" icon="light" onPress={() => router.push('/ending')} /> : null}
      <Card style={{ paddingVertical: 4 }}>
        {views.map((v) => {
          const d = WORLD.districts.find((x) => x.id === v.id)!;
          const all = districtLanterns(d), lit = p.lights(all, state);
          return (
            <View key={v.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: v.state === 'locked' ? 'transparent' : v.hue, borderWidth: 1.5, borderColor: v.hue }} />
              <View style={{ flex: 1 }}>
                <Text style={[type.headline, v.state === 'locked' && { color: T.tx2 }]}>{infoOf(d).short}</Text>
                {v.state === 'locked' ? <Text style={type.foot}>{unlockText(d, p.totalLights(state), p.letters(state))}</Text> : <View style={{ marginTop: 8 }}><Gauge n={lit} total={all.length} height={5} /></View>}
              </View>
              {v.state === 'locked' ? <Icon name="lock" size={16} color={T.tx3} /> : <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{lit} / {all.length}</Text>}
            </View>
          );
        })}
      </Card>
      <Card>
        <Text style={[type.cap, { marginBottom: 10 }]}>Par palier</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 110 }}>
          {TIER_NAMES.map((t, i) => (
            <View key={t} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={[type.foot, { fontVariant: ['tabular-nums'] }]}>{byTier[i]}</Text>
              <View style={{ width: '100%', height: Math.max(3, (70 * byTier[i]) / maxTier), backgroundColor: T.amber, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: byTier[i] ? 1 : 0.3 }} />
              <Text style={{ fontSize: 10, color: T.tx2 }}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}
