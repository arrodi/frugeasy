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
      <Text style={styles.sectionTitle}>🌿 Monthly summary</Text>

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
        <Text style={[styles.cardValue, styles.net]}>{formatCurrency(totals.net)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Transactions this month</Text>
      <FlatList
        data={monthlyTransactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet — add your first one ✨</Text>}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <View>
              <Text style={styles.listType}>{item.type === 'income' ? 'Income' : 'Expense'}</Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 16, gap: 10, paddingTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f3b35', marginTop: 8 },
  card: {
    backgroundColor: '#eef5f2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2e2dc',
  },
  cardLabel: { color: '#49635d', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#1f3b35' },
  income: { color: '#1f8b63' },
  expense: { color: '#536c90' },
  net: { color: '#355f53' },
  empty: { color: '#49635d', marginTop: 8 },
  listRow: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#d2e2dc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listType: { fontWeight: '700', color: '#35544c' },
  category: { color: '#6b7f78', fontSize: 12, marginTop: 2 },
  amount: { color: '#1f3b35', fontWeight: '700' },
});
