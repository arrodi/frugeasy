import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  currency: CurrencyCode;
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
  onUpdateTransaction: (input: {
    id: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    date: string;
  }) => Promise<void>;
};

export function TransactionsScreen({
  currency,
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
  onUpdateTransaction,
}: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Other');

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
        placeholderTextColor="#4f7a59"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((t) => (
          <Pressable key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => onTypeFilterChange(t)}>
            <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(['all', ...categoryOptions] as const).map((cat) => (
          <Pressable key={cat} style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]} onPress={() => onCategoryFilterChange(cat)}>
            <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {transactions.length === 0 ? <Text style={styles.empty}>No transactions for this view.</Text> : null}
      {transactions.map((item) => {
        const editing = editId === item.id;
        return (
          <View key={item.id} style={styles.listRow}>
            {!editing ? (
              <>
                <View>
                  <Text style={styles.listType}>{item.type === 'income' ? 'Income' : 'Expense'}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
                <View style={styles.rightRow}>
                  <Text style={styles.amount}>{formatCurrency(item.amount, currency)}</Text>
                  <View style={styles.inlineRow}>
                    <Pressable style={styles.actionBtn} onPress={() => {
                      setEditId(item.id); setEditAmount(String(item.amount)); setEditType(item.type); setEditCategory(item.category);
                    }}>
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => onDeleteTransaction(item.id)}>
                      <Text style={styles.actionBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ width: '100%', gap: 8 }}>
                <View style={styles.inlineRow}>
                  <TextInput value={editAmount} onChangeText={setEditAmount} style={styles.smallInput} keyboardType="decimal-pad" placeholder="Amount" />
                  <TextInput value={editCategory} onChangeText={(v) => setEditCategory(v as TransactionCategory)} style={styles.smallInput} placeholder="Category" />
                </View>
                <View style={styles.inlineRow}>
                  <Pressable style={[styles.filterChip, editType === 'income' && styles.filterChipActive]} onPress={() => setEditType('income')}><Text style={[styles.filterChipText, editType === 'income' && styles.filterChipTextActive]}>income</Text></Pressable>
                  <Pressable style={[styles.filterChip, editType === 'expense' && styles.filterChipActive]} onPress={() => setEditType('expense')}><Text style={[styles.filterChipText, editType === 'expense' && styles.filterChipTextActive]}>expense</Text></Pressable>
                  <Pressable style={styles.actionBtn} onPress={async () => {
                    const amount = Number(editAmount.replace(',', '.'));
                    if (!Number.isFinite(amount) || amount <= 0) return;
                    await onUpdateTransaction({ id: item.id, amount, type: editType, category: editCategory, date: item.date });
                    setEditId(null);
                  }}><Text style={styles.actionBtnText}>Save</Text></Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => setEditId(null)}><Text style={styles.actionBtnText}>Cancel</Text></Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  exportBtn: { backgroundColor: '#14b85a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#156530' },
  smallInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#156530' },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#a9e6b7', backgroundColor: '#f0fff4' },
  filterChipActive: { backgroundColor: '#14b85a', borderColor: '#14b85a' },
  filterChipText: { color: '#1e6e37', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
  empty: { color: '#2a7a42', marginTop: 8 },
  listRow: { backgroundColor: '#ecfff1', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#9ee5ab' },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  listType: { fontWeight: '700', color: '#1e6e37' },
  category: { color: '#3e7b52', fontSize: 12, marginTop: 2 },
  amount: { color: '#14632f', fontWeight: '700' },
  actionBtn: { backgroundColor: '#e6f8ec', borderWidth: 1, borderColor: '#a9e6b7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  actionBtnText: { color: '#2d7a43', fontSize: 12, fontWeight: '700' },
});
