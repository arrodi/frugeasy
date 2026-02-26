import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { CurrencyCode } from '../domain/types';

type Props = {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => Promise<void>;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => Promise<void>;
};

export function SettingsScreen({ currency, onCurrencyChange, darkMode, onDarkModeChange }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Appearance</Text>
        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={onDarkModeChange} />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Regional</Text>
        <Text style={styles.rowLabel}>Default Currency</Text>
        <View style={styles.chipsRow}>
          {(['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'UAH'] as CurrencyCode[]).map((c) => (
            <Pressable key={c} style={[styles.chip, currency === c && styles.chipActive]} onPress={() => onCurrencyChange(c)}>
              <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f7' },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4 },
  group: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 10,
  },
  groupTitle: { color: '#6b7280', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { color: '#111827', fontSize: 16, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: 'white' },
});
