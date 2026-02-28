import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CurrencyCode } from '../domain/types';
import { getThemeColors, radii, spacing, typography } from '../ui/themeTokens';

type Props = {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => Promise<void>;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => Promise<void>;
  onExportCsv: () => Promise<void>;
};

export function SettingsScreen({ currency, onCurrencyChange, darkMode, onDarkModeChange, onExportCsv }: Props) {
  const colors = getThemeColors(darkMode);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.groupTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.rowItem}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark mode</Text>
          <Switch value={darkMode} onValueChange={onDarkModeChange} />
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.groupTitle, { color: colors.text }]}>Currency</Text>
        <View style={styles.chipsRow}>
          {(['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'UAH'] as CurrencyCode[]).map((c) => {
            const active = currency === c;
            return (
              <Pressable key={c} style={[styles.chip, { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.chip }]} onPress={() => onCurrencyChange(c)}>
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={[styles.exportBtn, { backgroundColor: colors.primary }]} onPress={onExportCsv}>
        <Text style={styles.exportBtnText}>Export CSV</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 88 },
  title: { fontSize: typography.title, fontWeight: '800' },
  group: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  groupTitle: { fontSize: typography.section, fontWeight: '700' },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: typography.body, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1 },
  chipText: { fontWeight: '700' },
  exportBtn: { borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontWeight: '800', fontSize: typography.body },
});
