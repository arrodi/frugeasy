import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyCode } from '../domain/types';

type Props = {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => Promise<void>;
};

export function SettingsScreen({ currency, onCurrencyChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.panel}>
        <Text style={styles.label}>Default currency</Text>
        <View style={styles.row}>
          {(['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'UAH'] as CurrencyCode[]).map((c) => (
            <Pressable key={c} style={[styles.chip, currency === c && styles.chipActive]} onPress={() => onCurrencyChange(c)}>
              <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#156530' },
  panel: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 12, padding: 12, gap: 10 },
  label: { color: '#1e6e37', fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#a9e6b7', backgroundColor: '#f0fff4' },
  chipActive: { backgroundColor: '#14b85a', borderColor: '#14b85a' },
  chipText: { color: '#1e6e37', fontWeight: '600' },
  chipTextActive: { color: 'white' },
});
