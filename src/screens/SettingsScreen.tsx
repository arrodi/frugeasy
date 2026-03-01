import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CurrencyCode } from '../domain/types';

type Props = {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => Promise<void>;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => Promise<void>;
  onExportCsv: () => Promise<void>;
  onResetAllData: () => Promise<void>;
};

export function SettingsScreen({ currency, onCurrencyChange, darkMode, onDarkModeChange, onExportCsv, onResetAllData }: Props) {
  return (
    <ScrollView style={[styles.container, darkMode && styles.containerDark]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, darkMode && styles.textDark]}>Settings</Text>
      <View style={[styles.group, darkMode && styles.groupDark]}>
        <Text style={[styles.groupTitle, darkMode && styles.textDark]}>Appearance</Text>
        <View style={styles.rowItem}>
          <Text style={[styles.rowLabel, darkMode && styles.textDark]}>Dark mode</Text>
          <Switch value={darkMode} onValueChange={onDarkModeChange} />
        </View>
      </View>
      <View style={[styles.group, darkMode && styles.groupDark]}>
        <Text style={[styles.groupTitle, darkMode && styles.textDark]}>Currency</Text>
        <View style={styles.chipsRow}>
          {(['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'UAH'] as CurrencyCode[]).map((c) => (
            <Pressable key={c} style={[styles.chip, currency === c && styles.chipActive]} onPress={() => onCurrencyChange(c)}>
              <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable style={styles.exportBtn} onPress={onExportCsv}>
        <Text style={styles.exportBtnText}>Export CSV</Text>
      </Pressable>
      <Pressable style={styles.resetBtn} onPress={onResetAllData}>
        <Text style={styles.resetBtnText}>Reset All Data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaffef' },
  containerDark: { backgroundColor: '#08170f' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#156530' },
  textDark: { color: '#d6f5df' },
  group: { backgroundColor: '#e6f4ea', borderWidth: 1, borderColor: '#a7e6b4', borderRadius: 12, padding: 12, gap: 10 },
  groupDark: { backgroundColor: '#102117', borderColor: '#26523a' },
  groupTitle: { color: '#0f5a36', fontWeight: '700' },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { color: '#0f5a36', fontSize: 16, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#a9e6b7', backgroundColor: '#e6f4ea' },
  chipActive: { backgroundColor: '#14b85a', borderColor: '#14b85a' },
  chipText: { color: '#0f5a36', fontWeight: '600' },
  chipTextActive: { color: '#e6f4ea' },
  exportBtn: { backgroundColor: '#14b85a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' },
  exportBtnText: { color: '#e6f4ea', fontWeight: '700' },
  resetBtn: { backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' },
  resetBtnText: { color: '#ffffff', fontWeight: '800' },
});
