import React, { useRef, useState } from 'react';
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
import { APP_VERSION } from '../content/whatsNew';
import { CHIME_THEMES, ChimeTheme } from '../audio/engine';
import { LangSetting, tr } from '../i18n';

const LANGS: LangSetting[] = ['auto', 'fr', 'en'];
/** Each language is named in itself, so it can be found whatever the current one. */
const langLabel = (l: LangSetting) => (l === 'fr' ? 'Français' : l === 'en' ? 'English' : tr('Langue du téléphone'));

const chimeLabel = (c: ChimeTheme) => (c === 'xylo' ? tr('Xylophone') : c === 'harp' ? tr('Harpe') : tr('Cloches'));

const TIMES = [[18, 0], [18, 30], [19, 0], [19, 30], [20, 0], [20, 30], [21, 0], [21, 30]];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={[type.cap, { marginTop: 14, marginBottom: 6, marginHorizontal: 4 }]}>{title}</Text>
      <Card style={{ paddingVertical: 0 }}>{children}</Card>
    </View>
  );
}

/** Four steps of volume (25 % to 100 %), as large touch targets. */
function VolumeRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const steps = [0.25, 0.5, 0.75, 1];
  return (
    <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: `${Math.round(value * 100)} %` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => { const i = steps.findIndex((x) => x >= value - 0.01); onChange(steps[Math.max(0, Math.min(3, i + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))]); }}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingLeft: 34, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
      {steps.map((v, i) => (
        <Pressable key={v} accessibilityRole="button" accessibilityLabel={`${label} ${Math.round(v * 100)} %`} onPress={() => { tap(); onChange(v); }} hitSlop={6}
          style={{ flex: 1, height: 10 + i * 6, borderRadius: 4, backgroundColor: v <= value + 0.01 ? T.amber : T.s2, borderWidth: 1, borderColor: T.line }} />
      ))}
      <Text style={[type.foot, { width: 44, textAlign: 'right' }]}>{Math.round(value * 100)} %</Text>
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
  const { settings, setSettings, note, resetProgress, exportProgress, importProgress, showToast, readOnly, findEgg } = useStore();
  const [sheet, setSheet] = useState<'time' | 'import' | 'lang' | 'chime' | null>(null);
  const [text, setText] = useState('');
  const hh = (n: number) => String(n).padStart(2, '0');
  const versionTaps = useRef<number[]>([]);
  const tapVersion = () => {
    const now = Date.now();
    versionTaps.current = [...versionTaps.current.filter((t) => now - t < 4000), now];
    if (versionTaps.current.length >= 7) {
      versionTaps.current = [];
      findEgg('version');
      showToast(tr('Mode développeur ? Il n’y en a pas. Mais merci d’avoir cherché.'), 'star');
    }
  };

  const toggleReminder = async (on: boolean) => {
    if (!on) { setSettings({ reminder: false, reminderOffered: true }); return; }
    const ok = (await permissionStatus()) === 'granted' || (await askPermission());
    setSettings({ reminder: ok, reminderOffered: true });
    if (!ok) showToast(tr('Les notifications sont désactivées pour Lampion dans les réglages du téléphone.'), 'bell');
  };
  const doExport = async () => {
    try { await Share.share({ message: exportProgress(), title: tr('Ma progression Lampion') }); } catch { showToast(tr('Le partage n’est pas disponible ici.'), 'info'); }
  };
  const doImport = () => {
    if (importProgress(text.trim())) { setSheet(null); setText(''); showToast(tr('Progression importée.'), 'check'); }
    else showToast(tr('Ce texte n’est pas une progression Lampion.'), 'x');
  };
  const confirmReset = () => {
    const reset = () => { void resetProgress(); showToast(tr('Progression réinitialisée.'), 'check'); router.dismissTo('/'); };
    // Alert does nothing in a browser: the web build asks with the browser's own dialog.
    if (Platform.OS === 'web') { if (typeof window !== 'undefined' && window.confirm(tr('Réinitialiser la progression ? Toutes les lanternes, les Éclats, la série et les objets seront effacés. C’est définitif.'))) reset(); return; }
    Alert.alert(tr('Réinitialiser la progression ?'), tr('Toutes les lanternes, les Éclats, la série et les objets seront effacés. Les réglages sont gardés. C’est définitif.'), [
      { text: tr('Annuler'), style: 'cancel' },
      { text: tr('Tout effacer'), style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <Screen scroll style={{ gap: 0 }} place="lighthouse">
      <BackButton label={tr('Accueil')} onPress={() => goBack()} />
      <Text style={type.title1}>{tr('Réglages')}</Text>
      {readOnly ? (
        <Card style={{ marginTop: 12, borderColor: T.coral }}>
          <Text style={type.body}>{tr('Ta sauvegarde n’a pas pu être lue. Pour ne rien abîmer, rien n’est enregistré jusqu’au prochain lancement.')}</Text>
        </Card>
      ) : null}
      <Group title={tr('Son')}>
        <ToggleRow icon="music" label={tr('Musique')} value={settings.music} onChange={(v) => setSettings({ music: v })} />
        {settings.music ? <VolumeRow label={tr('Volume de la musique')} value={settings.musicVolume} onChange={(v) => setSettings({ musicVolume: v })} /> : null}
        <ToggleRow icon="sound" label={tr('Effets sonores')} value={settings.effects} onChange={(v) => setSettings({ effects: v })} />
        {settings.effects ? <VolumeRow label={tr('Volume des effets')} value={settings.effectsVolume} onChange={(v) => { setSettings({ effectsVolume: v }); note(2); }} /> : null}
        <ToggleRow icon="light" label={tr('Vibrations')} value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
        <Pressable accessibilityRole="button" accessibilityLabel={`${tr('Instrument du Carillon')} : ${chimeLabel(settings.chime)}`} onPress={() => { tap(); setSheet('chime'); }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 8, gap: 12 }}>
          <Icon name="bell" size={20} color={T.tx2} />
          <Text style={[type.body, { flex: 1 }]}>{tr('Instrument du Carillon')}</Text>
          <Text style={type.foot}>{chimeLabel(settings.chime)}</Text>
          <Icon name="chev" size={18} color={T.tx3} />
        </Pressable>
      </Group>
      <Group title={tr('Apparence')}>
        <ToggleRow icon="map" label={tr('Couleur du quartier')} sub={tr('Les boutons prennent la teinte du quartier où tu es')} value={settings.districtTint} onChange={(v) => setSettings({ districtTint: v })} />
        <ToggleRow icon="star" label={tr('Icône de saison')} sub={tr('L’icône de Lampion change avec les saisons et les fêtes')} value={settings.seasonIcon} onChange={(v) => setSettings({ seasonIcon: v })} />
      </Group>
      <Group title={tr('Jeu')}>
        <ToggleRow icon="chev" label={tr('Ouvrir directement les puzzles')} sub={tr('Sans l’aperçu de la lanterne')} value={settings.direct} onChange={(v) => setSettings({ direct: v })} />
      </Group>
      <Group title={tr('Notifications')}>
        <ToggleRow icon="bell" label={tr('Rappel du défi du soir')} sub={tr('Un seul par jour, seulement s’il n’est pas fait')} value={settings.reminder} onChange={(v) => { void toggleReminder(v); }} />
        {settings.reminder ? <LinkRow label={tr('Heure : {0} h {1}', [hh(settings.reminderHour), hh(settings.reminderMinute)])} onPress={() => setSheet('time')} /> : null}
      </Group>
      <Group title={tr('Accessibilité')}>
        <ToggleRow icon="sound" label={tr('Sous-titres des sons')} sub={tr('Une petite légende à l’écran pour les sons importants')} value={settings.soundCaptions} onChange={(v) => setSettings({ soundCaptions: v })} />
        <ToggleRow icon="eye" label={tr('Aide aux couleurs')} sub={tr('Motifs, lettres et repères en plus des couleurs')} value={settings.colorAid} onChange={(v) => setSettings({ colorAid: v })} />
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: T.line, gap: 12 }}>
          <Icon name="light" size={20} color={T.tx2} />
          <View style={{ flex: 1 }}><Text style={type.body}>{tr('Réduire les animations')}</Text><Text style={type.foot}>{tr('Suit le réglage du téléphone')}</Text></View>
          <Text style={type.foot}>{tr('Système')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${tr('Langue')} : ${langLabel(settings.language)}`} onPress={() => { tap(); setSheet('lang'); }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 8, gap: 12 }}>
          <Icon name="book" size={20} color={T.tx2} />
          <Text style={[type.body, { flex: 1 }]}>{tr('Langue')}</Text>
          <Text style={type.foot}>{langLabel(settings.language)}</Text>
          <Icon name="chev" size={18} color={T.tx3} />
        </Pressable>
      </Group>
      <Group title={tr('Confidentialité')}>
        <View style={{ paddingVertical: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="shield" size={26} color={T.moon} />
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{tr('Ta progression reste sur cet appareil.')}</Text>
            <Text style={[type.foot, { marginTop: 4 }]}>{tr('Pas de compte, pas de publicité, pas de suivi, pas de serveur. Rien n’est envoyé, sauf si tu exportes toi-même ta progression.')}</Text>
          </View>
        </View>
        <LinkRow label={tr('Confidentialité et mentions légales')} onPress={() => router.push('/privacy')} />
      </Group>
      <Group title={tr('Sauvegarde')}>
        <LinkRow label={tr('Exporter ma progression')} icon="share" onPress={doExport} />
        <LinkRow label={tr('Importer une progression')} onPress={() => setSheet('import')} />
        <LinkRow label={tr('Réinitialiser la progression')} color={T.coral} onPress={confirmReset} />
        <Text style={[type.foot, { paddingVertical: 12 }]}>{tr('Si la sauvegarde iCloud de ton iPhone est activée, ta progression y est comprise : elle te suit quand tu changes de téléphone.')}</Text>
      </Group>
      <Group title={tr('Lampion')}>
        <LinkRow label={tr('Crédits')} icon="star" onPress={() => router.push('/credits')} />
      </Group>
      {/* Secret: the version tapped seven times. */}
      <Pressable onPress={tapVersion} accessibilityRole="text">
        <Text style={[type.foot, { textAlign: 'center', marginTop: 16, marginBottom: 8 }]}>Lampion {APP_VERSION} · {tr('contenu')} v{CONTENT_VERSION}</Text>
      </Pressable>

      <Sheet visible={sheet === 'time'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 12 }]}>{tr('Heure du rappel')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIMES.map(([h, m]) => {
            const on = settings.reminderHour === h && settings.reminderMinute === m;
            return (
              <Pressable key={`${h}${m}`} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={tr('{0} h {1}', [hh(h), hh(m)])} onPress={() => { tap(); setSettings({ reminderHour: h, reminderMinute: m }); setSheet(null); }}
                style={{ width: '23%', flexGrow: 1, height: 48, borderRadius: R.m, alignItems: 'center', justifyContent: 'center', backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.moon : T.line }}>
                <Text style={{ color: T.tx, fontWeight: '600' }}>{hh(h)}:{hh(m)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
      <Sheet visible={sheet === 'lang'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 12 }]}>{tr('Langue')}</Text>
        {LANGS.map((l) => {
          const on = settings.language === l;
          return (
            <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { tap(); setSheet(null); setSettings({ language: l }); }}
              style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 8, borderRadius: R.m, backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.moon : T.line }}>
              <Text style={[type.body, { flex: 1 }]}>{langLabel(l)}</Text>
              {on ? <Icon name="check" size={18} color={T.moon} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
      <Sheet visible={sheet === 'chime'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 4 }]}>{tr('Instrument du Carillon')}</Text>
        <Text style={[type.foot, { marginBottom: 12 }]}>{tr('Touche un instrument pour l’écouter.')}</Text>
        {CHIME_THEMES.map((c) => {
          const on = settings.chime === c;
          return (
            <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { setSettings({ chime: c }); [0, 2, 4].forEach((n, k) => setTimeout(() => note(n), k * 180)); }}
              style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 8, borderRadius: R.m, backgroundColor: T.s1, borderWidth: on ? 2 : 1, borderColor: on ? T.moon : T.line }}>
              <Text style={[type.body, { flex: 1 }]}>{chimeLabel(c)}</Text>
              {on ? <Icon name="check" size={18} color={T.moon} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
      <Sheet visible={sheet === 'import'} onClose={() => setSheet(null)}>
        <Text style={[type.title2, { marginBottom: 8 }]}>{tr('Importer une progression')}</Text>
        <Text style={[type.foot, { marginBottom: 10 }]}>{tr('Colle le texte exporté depuis Lampion. Ta progression actuelle sera remplacée.')}</Text>
        <TextInput value={text} onChangeText={setText} multiline placeholder={tr('Texte exporté…')} placeholderTextColor={T.tx3}
          style={{ minHeight: 110, maxHeight: 200, color: T.tx, backgroundColor: T.bg, borderRadius: R.m, borderWidth: 1, borderColor: T.line, padding: 12, textAlignVertical: 'top' }} />
        <Button title={tr('Importer')} disabled={!text.trim()} onPress={doImport} style={{ marginTop: 12 }} />
      </Sheet>
    </Screen>
  );
}
