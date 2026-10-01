// The player's own little house in Vesper: name it, and put the objects found
// in the rooms on its shelves. Nilo lives there too.
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text, TextInput } from '../ui/Text';
import { goBack } from '../ui/nav';
import { SvgXml } from 'react-native-svg';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Icon, Nilo, Sheet, tap } from '../ui/components';
import { T, R, SERIF, type } from '../ui/theme';
import { HOUSE_SLOTS, look } from '../game/rewards';
import { allRooms } from '../game/views';
import { objectSvg } from '../ui/scenes/objects';
import { useContentSize } from '../ui/layout';
import { tr } from '../i18n';

/** The room: wooden walls, a window on the night, two shelves, a rug. */
const roomXml = (w: number, h: number) => `<svg viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a26"/><stop offset="1" stop-color="#2a1e1c"/></linearGradient>
  <radialGradient id="hl" cx=".5" cy=".3"><stop offset="0" stop-color="#F4B45E" stop-opacity=".22"/><stop offset="1" stop-color="#F4B45E" stop-opacity="0"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#hw)"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${(i + 1) * w / 10} 0v${h * 0.78}" stroke="#46332e" stroke-width="1.5"/>`).join('')}
  <rect x="${w * 0.62}" y="${h * 0.04}" width="${w * 0.3}" height="${h * 0.17}" rx="6" fill="#0c0f24" stroke="#6b4f2a" stroke-width="4"/>
  <circle cx="${w * 0.84}" cy="${h * 0.09}" r="${h * 0.025}" fill="#EFE8D8" opacity=".85"/>
  <path d="M${w * 0.77} ${h * 0.04}v${h * 0.17}M${w * 0.62} ${h * 0.125}h${w * 0.3}" stroke="#6b4f2a" stroke-width="3"/>
  <rect x="${w * 0.05}" y="${h * 0.45}" width="${w * 0.9}" height="8" rx="3" fill="#8a6d45"/>
  <rect x="${w * 0.05}" y="${h * 0.7}" width="${w * 0.9}" height="8" rx="3" fill="#8a6d45"/>
  <rect y="${h * 0.8}" width="${w}" height="${h * 0.2}" fill="#4a3324"/>
  <ellipse cx="${w * 0.6}" cy="${h * 0.91}" rx="${w * 0.3}" ry="${h * 0.06}" fill="#8E3B46" opacity=".8"/>
  <rect width="${w}" height="${h}" fill="url(#hl)"/>
</svg>`;

export default function House() {
  const { state, profile, noteProfile } = useStore();
  const { width } = useContentSize();
  const rooms = useMemo(() => allRooms(), []);
  const found = rooms.filter((r) => profile.picked.includes(r.room.id));
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState(profile.house.name);
  const W = Math.min(width, 600) - 32, H = Math.round(W * 0.95);
  const cell = (W * 0.9) / 4;
  const objectOf = (roomId: string | null) => (roomId ? rooms.find((r) => r.room.id === roomId)?.object.name ?? null : null);
  const put = (roomId: string | null) => {
    if (slot === null) return;
    tap();
    noteProfile((p) => {
      const shelf = p.house.shelf.map((x) => (x === roomId ? null : x));
      shelf[slot] = roomId;
      return { ...p, house: { ...p.house, shelf } };
    });
    setSlot(null);
  };
  const saveName = () => noteProfile((p) => ({ ...p, house: { ...p.house, name: name.trim().slice(0, 30) } }));

  return (
    <Screen scroll place="lighthouse" style={{ gap: 14 }}>
      <BackButton label={tr('Retour')} onPress={() => goBack()} />
      <TextInput value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} maxLength={30} placeholder={tr('Nomme ta maison')} placeholderTextColor={T.tx3}
        accessibilityLabel={tr('Nom de ta maison')} style={{ fontFamily: SERIF, fontSize: 30, color: T.tx, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.line }} />
      <Text style={[type.foot]}>{tr('Touche une place sur les étagères pour y poser un objet trouvé.')}</Text>

      <View style={{ width: W, height: H, borderRadius: R.l, overflow: 'hidden', borderWidth: 1, borderColor: T.line, alignSelf: 'center' }}>
        <SvgXml xml={roomXml(W, H)} width={W} height={H} />
        {Array.from({ length: HOUSE_SLOTS }, (_, i) => {
          const row = Math.floor(i / 4), col = i % 4;
          const obj = objectOf(profile.house.shelf[i]);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={obj ? tr('Étagère, place {0} : {1}', [i + 1, obj]) : tr('Étagère, place {0} : vide', [i + 1])} onPress={() => { tap(); setSlot(i); }}
              style={{ position: 'absolute', left: W * 0.05 + col * cell, top: (row === 0 ? H * 0.45 : H * 0.7) - cell * 0.82, width: cell, height: cell * 0.82, alignItems: 'center', justifyContent: 'flex-end' }}>
              {obj ? <SvgXml xml={objectSvg(obj, T.gold, 1.2)} width={cell * 0.62} height={cell * 0.62} />
                : <View style={{ width: cell * 0.4, height: cell * 0.4, marginBottom: 6, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(239,232,216,0.25)' }} />}
            </Pressable>
          );
        })}
        <View style={{ position: 'absolute', left: W * 0.48, top: H * 0.74 }} pointerEvents="box-none">
          <Nilo size={Math.round(W * 0.24)} mood="joy" look={look(state)} />
        </View>
      </View>

      <Sheet visible={slot !== null} onClose={() => setSlot(null)}>
        <Text style={[type.title2, { marginBottom: 10 }]}>{tr('Poser un objet')}</Text>
        {!found.length ? <Text style={[type.body, { color: T.tx2, marginBottom: 12 }]}>{tr('Tu n’as encore trouvé aucun objet. Éclaire une salle en entier, puis cherche ce qui brille.')}</Text> : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {found.map((r) => {
              const here = slot !== null && profile.house.shelf[slot] === r.room.id;
              return (
                <Pressable key={r.room.id} accessibilityRole="button" accessibilityLabel={r.object.name} onPress={() => put(r.room.id)}
                  style={{ width: '30%', flexGrow: 1, alignItems: 'center', gap: 4, padding: 8, borderRadius: R.m, backgroundColor: T.s1, borderWidth: here ? 2 : 1, borderColor: here ? T.gold : T.line }}>
                  <SvgXml xml={objectSvg(r.object.name, T.gold, 1.2)} width={40} height={40} />
                  <Text style={{ color: T.tx2, fontSize: 12, textAlign: 'center' }} numberOfLines={2}>{r.object.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {slot !== null && profile.house.shelf[slot] ? (
          <Pressable accessibilityRole="button" onPress={() => put(null)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
            <Icon name="undo" size={16} color={T.coral} /><Text style={{ color: T.coral, fontSize: 15 }}>{tr('Libérer cette place')}</Text>
          </Pressable>
        ) : null}
        <Button title={tr('Fermer')} kind="ghost" onPress={() => setSlot(null)} />
      </Sheet>
    </Screen>
  );
}
