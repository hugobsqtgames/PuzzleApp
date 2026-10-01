// Mode Libre: any family already met, at the chosen difficulty, as many
// puzzles as wanted. Nothing to win; every hint free.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, GlyphCircle, Nilo, TierBars, tap } from '../ui/components';
import { T, R, type } from '../ui/theme';
import { FAMILIES, TIER_NAMES, WORLD, type Code } from '../game/catalog';
import { FREE_CODES, freeTiers, makeFreePuzzle } from '../game/free';
import { worldLanterns } from '../core/game/world';
import { look } from '../game/rewards';
import { tr } from '../i18n';
import type { Tier } from '../core/puzzlekit/types';

export default function Free() {
  const { state, openFree, showToast } = useStore();
  // Only the families the player has met (one lantern of theirs solved).
  const met = new Set(worldLanterns(WORLD).filter((l) => state.solved.has(l.puzzle)).map((l) => l.family as Code));
  const codes = FREE_CODES.filter((c) => met.has(c));
  const [code, setCode] = useState<Code | null>(codes[0] ?? null);
  const tiers = code ? freeTiers(code) : [];
  const [tier, setTier] = useState<Tier>(1);
  const shownTier = tiers.includes(tier) ? tier : tiers[0];
  const [making, setMaking] = useState(false);
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);

  const play = () => {
    if (!code || shownTier === undefined || making) return;
    tap();
    setMaking(true);
    cancel.current = makeFreePuzzle(code, shownTier, (p) => {
      setMaking(false);
      if (!p) { showToast(tr('Nilo n’a pas réussi à préparer cette énigme. Réessaie, ou change de difficulté.'), 'info'); return; }
      openFree(p);
      router.push('/puzzle');
    });
  };

  return (
    <Screen scroll place="night" style={{ gap: 16 }}>
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <Text style={type.title1}>{tr('Mode Libre')}</Text>
      <Text style={[type.body, { color: T.tx2 }]}>{tr('Rejoue n’importe quelle famille déjà rencontrée, à la difficulté de ton choix. Rien à gagner : juste le plaisir, et tous les indices sont offerts.')}</Text>

      {!codes.length ? (
        <Card style={{ alignItems: 'center', gap: 10, padding: 22 }}>
          <Nilo size={80} mood="think" look={look(state)} still />
          <Text style={[type.body, { textAlign: 'center', color: T.tx2 }]}>{tr('Allume tes premières lanternes : chaque famille rencontrée viendra ici.')}</Text>
        </Card>
      ) : (
        <>
          <Text style={type.cap}>{tr('Famille')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {codes.map((c) => {
              const on = c === code;
              return (
                <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={FAMILIES[c].name} onPress={() => { tap(); setCode(c); }}
                  style={{ width: '30%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: R.m, backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.amber : T.line }}>
                  <GlyphCircle icon={c} size={40} color={on ? T.amber : T.tx2} />
                  <Text style={{ color: on ? T.tx : T.tx2, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{FAMILIES[c].name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={type.cap}>{tr('Difficulté')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tiers.map((t) => {
              const on = t === shownTier;
              return (
                <Pressable key={t} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={TIER_NAMES[t]} onPress={() => { tap(); setTier(t); }}
                  style={{ flexGrow: 1, minWidth: '28%', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: R.m, backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.amber : T.line }}>
                  <TierBars tier={t} />
                  <Text style={{ color: on ? T.tx : T.tx2, fontSize: 13, fontWeight: '600' }}>{TIER_NAMES[t]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button title={making ? tr('Nilo prépare l’énigme…') : tr('Jouer')} icon="light" disabled={making || !code} onPress={play} style={{ marginTop: 6 }} />
        </>
      )}
    </Screen>
  );
}
