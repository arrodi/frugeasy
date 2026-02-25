import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Transaction } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  monthlyTransactions: Transaction[];
  totals: {
    income: number;
    expense: number;
    net: number;
  };
};

export function MonthlySummaryScreen({ monthlyTransactions, totals }: Props) {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Current month summary</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Income</Text>
        <Text style={[styles.cardValue, styles.income]}>{formatCurrency(totals.income)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Expenditure</Text>
        <Text style={[styles.cardValue, styles.expense]}>{formatCurrency(totals.expense)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Net</Text>
        <Text style={styles.cardValue}>{formatCurrency(totals.net)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Transactions (this month)</Text>
      <FlatList
        data={monthlyTransactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <Text style={styles.listType}>{item.type.toUpperCase()}</Text>
            <Text>{formatCurrency(item.amount)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLabel: { color: '#475569', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
  empty: { color: '#64748b', marginTop: 8 },
  listRow: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listType: { fontWeight: '700', color: '#334155' },
});
