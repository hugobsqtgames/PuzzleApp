import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Icon, Nilo, ShardPill, tap } from '../ui/components';
import { T, type } from '../ui/theme';
import { COSMETICS, DEFAULT_LOOK, SLOT_NAMES, Slot, achievementContext, look, owns } from '../game/rewards';
import { tr } from '../i18n';

const SLOTS: Slot[] = ['flame', 'hat', 'scarf', 'comp'];

export default function Custom() {
  const { state, engine, profile, buyCosmetic, equip, play, showToast } = useStore();
  const [slot, setSlot] = useState<Slot>('flame');
  const worn = (s: Slot) => state.equippedCosmetics.get(s) ?? DEFAULT_LOOK[s];
  const [sel, setSel] = useState<string>(worn('flame'));
  const ctx = achievementContext(state, engine.progression, profile);
  const items = COSMETICS.filter((c) => c.slot === slot);
  const item = COSMETICS.find((c) => c.id === sel) ?? items[0];
  const isOwned = owns(item, state, ctx);
  const preview = { ...look(state), [slot]: item.id.split('.')[1] };

  const choose = (s: Slot) => { setSlot(s); setSel(worn(s)); };
  const buy = () => {
    if (buyCosmetic(item.id)) { play('unlock'); showToast(tr('{0} : acheté et porté.', [item.name]), 'check'); }
  };

  return (
    <Screen style={{ gap: 12 }} place="market">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton label={tr('Nilo')} onPress={() => goBack()} />
        <ShardPill n={state.wallet.balance} />
      </View>
      <View style={{ height: 210, borderRadius: 26, backgroundColor: '#161a36', borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
        <Nilo size={190} mood="curious" look={preview} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SLOTS.map((s) => (
          <Pressable key={s} accessibilityRole="tab" accessibilityState={{ selected: s === slot }} onPress={() => { tap(); choose(s); }}
            style={{ flexGrow: 1, minWidth: '18%', minHeight: 36, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: s === slot ? T.s2 : 'transparent', borderWidth: 1, borderColor: s === slot ? T.moon : T.line }}>
            <Text style={{ color: s === slot ? T.tx : T.tx2, fontSize: 13, fontWeight: '600' }}>{SLOT_NAMES[s]}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((c) => {
          const o = owns(c, state, ctx), on = worn(slot) === c.id, isSel = sel === c.id;
          return (
            <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${c.name}${on ? tr(', porté') : o ? tr(', possédé') : c.earn ? tr(', à gagner : {0}', [c.earn.text]) : tr(', {0} Éclats', [c.price ?? 0])}`}
              onPress={() => { tap(); setSel(c.id); }}
              style={{ width: '31.5%', minHeight: 112, backgroundColor: T.s1, borderWidth: 1.5, borderColor: isSel ? T.moon : T.line, borderRadius: 18, padding: 8, alignItems: 'center', gap: 6, opacity: !o && c.earn ? 0.55 : 1 }}>
              {slot === 'flame'
                ? <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.color, shadowColor: c.color, shadowOpacity: 0.9, shadowRadius: 10, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF3D6' }} /></View>
                : <Nilo size={52} still look={{ ...look(state), [slot]: c.id.split('.')[1] }} />}
              <Text style={{ color: T.tx, fontSize: 12.5, textAlign: 'center' }}>{c.name}</Text>
              <Text style={[type.foot, { fontSize: 11.5 }]}>{on ? tr('Porté') : o ? tr('Possédé') : c.earn ? tr('À gagner') : tr('{0} Éclats', [c.price ?? 0])}</Text>
              {!o && c.earn ? <View style={{ position: 'absolute', top: 8, right: 8 }}><Icon name="lock" size={14} color={T.tx2} /></View> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {isOwned
        ? <Button title={worn(slot) === item.id ? tr('Porté') : tr('Porter')} disabled={worn(slot) === item.id} onPress={() => { equip(slot, item.id); play('unlock'); }} />
        : item.earn
          ? <Button kind="secondary" icon="lock" title={item.earn.text} disabled />
          : <Button title={tr('Acheter · {0} Éclats', [item.price ?? 0])} disabled={state.wallet.balance < (item.price ?? 0)} onPress={buy} />}
    </Screen>
  );
}
