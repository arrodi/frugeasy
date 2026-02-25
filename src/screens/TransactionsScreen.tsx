import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  transactions: Transaction[];
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (value: 'all' | TransactionType) => void;
  categoryFilter: 'all' | TransactionCategory;
  onCategoryFilterChange: (value: 'all' | TransactionCategory) => void;
  categoryOptions: TransactionCategory[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCsv: () => Promise<void>;
};

export function TransactionsScreen({
  transactions,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  searchQuery,
  onSearchQueryChange,
  onDeleteTransaction,
  onExportCsv,
}: Props) {
  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable style={styles.exportBtn} onPress={onExportCsv}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        placeholder="Search by category or amount"
        placeholderTextColor="#6b7f78"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
            onPress={() => onTypeFilterChange(t)}
          >
            <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(['all', ...categoryOptions] as const).map((cat) => (
          <Pressable
            key={cat}
            style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
            onPress={() => onCategoryFilterChange(cat)}
          >
            <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {transactions.length === 0 ? <Text style={styles.empty}>No transactions for this view.</Text> : null}
      {transactions.map((item) => (
        <View key={item.id} style={styles.listRow}>
          <View>
            <Text style={styles.listType}>{item.type === 'income' ? 'Income' : 'Expense'}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
          <View style={styles.rightRow}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <Pressable style={styles.deleteBtn} onPress={() => onDeleteTransaction(item.id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#1f3b35' },
  exportBtn: {
    backgroundColor: '#355f53',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d2e2dc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1f3b35',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c9dbd5',
    backgroundColor: '#f6faf8',
  },
  filterChipActive: { backgroundColor: '#4a7a6c', borderColor: '#4a7a6c' },
  filterChipText: { color: '#35544c', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
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
  },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  listType: { fontWeight: '700', color: '#35544c' },
  category: { color: '#6b7f78', fontSize: 12, marginTop: 2 },
  amount: { color: '#1f3b35', fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#e9eff4',
    borderWidth: 1,
    borderColor: '#c8d5e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: { color: '#3c556e', fontSize: 12, fontWeight: '700' },
});
