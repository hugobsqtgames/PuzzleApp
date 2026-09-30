import React, { useState } from 'react';
import { Alert, Platform, Pressable, Share, View } from 'react-native';
import { Text, TextInput } from '../ui/Text';
import { goBack } from '../ui/nav';
import { router } from 'expo-router';

import { useStore } from '../game/store';
import { Screen } from '../ui/Screen';
import { BackButton, Button, Card, Icon, Sheet, ToggleRow, tap } from '../ui/components';
import { T, R, type } from '../ui/theme';
import { askPermission, permissionStatus } from '../game/reminders';
import { CONTENT_VERSION } from '../game/catalog';

const TIMES = [[18, 0], [18, 30], [19, 0], [19, 30], [20, 0], [20, 30], [21, 0], [21, 30]];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={[type.cap, { marginTop: 14, marginBottom: 6, marginHorizontal: 4 }]}>{title}</Text>
      <Card style={{ paddingVertical: 0 }}>{children}</Card>
    </View>
  );
}

function LinkRow({ label, onPress, color = T.tx, icon = 'chev' }: { label: string; onPress: () => void; color?: string; icon?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: T.line }}>
      <Text style={[type.body, { flex: 1, color }]}>{label}</Text>
      <Icon name={icon} size={18} color={T.tx3} />
    </Pressable>
  );
}

export default function Settings() {
  const { settings, setSettings, resetProgress, exportProgress, importProgress, showToast, readOnly } = useStore();
  const [sheet, setSheet] = useState<'time' | 'import' | null>(null);
  const [text, setText] = useState('');
  const hh = (n: number) => String(n).padStart(2, '0');

  const toggleReminder = async (on: boolean) => {
    if (!on) { setSettings({ reminder: false, reminderOffered: true }); return; }
    const ok = (await permissionStatus()) === 'granted' || (await askPermission());
    setSettings({ reminder: ok, reminderOffered: true });
    if (!ok) showToast('Les notifications sont désactivées pour Lampion dans les réglages du téléphone.', 'bell');
  };
  const doExport = async () => {
    try { await Share.share({ message: exportProgress(), title: 'Ma progression Lampion' }); } catch { showToast('Le partage n’est pas disponible ici.', 'info'); }
  };
  const doImport = () => {
    if (importProgress(text.trim())) { setSheet(null); setText(''); showToast('Progression importée.', 'check'); }
    else showToast('Ce texte n’est pas une progression Lampion.', 'x');
  };
  const confirmReset = () => {
    const reset = () => { void resetProgress(); showToast('Progression réinitialisée.', 'check'); router.dismissTo('/'); };
    // Alert does nothing in a browser: the web build asks with the browser's own dialog.
    if (Platform.OS === 'web') { if (typeof window !== 'undefined' && window.confirm('Réinitialiser la progression ? Toutes les lanternes, les Éclats, la série et les objets seront effacés. C’est définitif.')) reset(); return; }
    Alert.alert('Réinitialiser la progression ?', 'Toutes les lanternes, les Éclats, la série et les objets seront effacés. Les réglages sont gardés. C’est définitif.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout effacer', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <Screen scroll style={{ gap: 0 }} place="lighthouse">
      <BackButton label="Accueil" onPress={() => goBack()} />
      <Text style={type.title1}>Réglages</Text>
      {readOnly ? (
        <Card style={{ marginTop: 12, borderColor: T.coral }}>
          <Text style={type.body}>Ta sauvegarde n’a pas pu être lue. Pour ne rien abîmer, rien n’est enregistré jusqu’au prochain lancement.</Text>
        </Card>
      ) : null}
      <Group title="Son">
        <ToggleRow icon="music" label="Musique" value={settings.music} onChange={(v) => setSettings({ music: v })} />
        <ToggleRow icon="sound" label="Effets sonores" value={settings.effects} onChange={(v) => setSettings({ effects: v })} />
        <ToggleRow icon="light" label="Vibrations" value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
      </Group>
      <Group title="Jeu">
        <ToggleRow icon="chev" label="Ouvrir directement les puzzles" sub="Sans l’aperçu de la lanterne" value={settings.direct} onChange={(v) => setSettings({ direct: v })} />
      </Group>
      <Group title="Rappel">
        <ToggleRow icon="bell" label="Rappel du défi du soir" sub="Un seul par jour, seulement s’il n’est pas fait" value={settings.reminder} onChange={(v) => { void toggleReminder(v); }} />
        {settings.reminder ? <LinkRow label={`Heure : ${hh(settings.reminderHour)} h ${hh(settings.reminderMinute)}`} onPress={() => setSheet('time')} /> : null}
      </Group>
      <Group title="Accessibilité">
        <ToggleRow icon="eye" label="Aide aux couleurs" sub="Motifs sur les vitraux, traits sur les différences" value={settings.colorAid} onChange={(v) => setSettings({ colorAid: v })} />
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: T.line, gap: 12 }}>
          <Icon name="light" size={20} color={T.tx2} />
          <View style={{ flex: 1 }}><Text style={type.body}>Réduire les animations</Text><Text style={type.foot}>Suit le réglage du téléphone</Text></View>
          <Text style={type.foot}>Système</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12 }}>
          <Icon name="book" size={20} color={T.tx2} />
          <Text style={[type.body, { flex: 1 }]}>Langue</Text>
          <Text style={type.foot}>Français</Text>
        </View>
      </Group>
      <Group title="Confidentialité">
        <View style={{ paddingVertical: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="shield" size={26} color={T.moon} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>Ta progression reste sur cet appareil.</Text>
            <Text style={[type.foot, { marginTop: 4 }]}>Pas de compte, pas de publicité, pas de suivi, pas de serveur. Rien n’est envoyé, sauf si tu exportes toi-même ta progression.</Text>
          </View>
        </View>
      </Group>
      <Group title="Sauvegarde">
        <LinkRow label="Exporter ma progression" icon="share" onPress={doExport} />
        <LinkRow label="Importer une progression" onPress={() => setSheet('import')} />
        <LinkRow label="Réinitialiser la progression" color={T.coral} onPress={confirmReset} />
      </Group>
      <Text style={[type.foot, { textAlign: 'center', marginTop: 16, marginBottom: 8 }]}>Lampion 1.0 · contenu v{CONTENT_VERSION}</Text>

      <Sheet visible={sheet === 'time'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 12 }]}>Heure du rappel</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIMES.map(([h, m]) => {
            const on = settings.reminderHour === h && settings.reminderMinute === m;
            return (
              <Pressable key={`${h}${m}`} onPress={() => { tap(); setSettings({ reminderHour: h, reminderMinute: m }); setSheet(null); }}
                style={{ width: '23%', flexGrow: 1, height: 48, borderRadius: R.m, alignItems: 'center', justifyContent: 'center', backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.moon : T.line }}>
                <Text style={{ color: T.tx, fontWeight: '600' }}>{hh(h)}:{hh(m)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
      <Sheet visible={sheet === 'import'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 8 }]}>Importer une progression</Text>
        <Text style={[type.foot, { marginBottom: 10 }]}>Colle le texte exporté depuis Lampion. Ta progression actuelle sera remplacée.</Text>
        <TextInput value={text} onChangeText={setText} multiline placeholder="Texte exporté…" placeholderTextColor={T.tx3}
          style={{ minHeight: 110, maxHeight: 200, color: T.tx, backgroundColor: T.bg, borderRadius: R.m, borderWidth: 1, borderColor: T.line, padding: 12, textAlignVertical: 'top' }} />
        <Button title="Importer" disabled={!text.trim()} onPress={doImport} style={{ marginTop: 12 }} />
      </Sheet>
    </Screen>
  );
}
