import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Budget, CurrencyCode, RecurringRule, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => Promise<void>;
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
  budgets: Budget[];
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  recurringRules: RecurringRule[];
  onAddRecurringRule: (input: {
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    dayOfMonth: number;
    label: string;
  }) => Promise<void>;
  onToggleRecurringRule: (id: string, active: boolean) => Promise<void>;
};

export function TransactionsScreen({
  currency,
  onCurrencyChange,
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
  budgets,
  onSaveBudget,
  recurringRules,
  onAddRecurringRule,
  onToggleRecurringRule,
}: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Other');

  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Food');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [ruleLabel, setRuleLabel] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleType, setRuleType] = useState<TransactionType>('expense');
  const [ruleCategory, setRuleCategory] = useState<TransactionCategory>('Food');
  const [ruleDay, setRuleDay] = useState('1');

  const budgetMap = useMemo(() => {
    const map = new Map<TransactionCategory, number>();
    for (const b of budgets) map.set(b.category, b.amount);
    return map;
  }, [budgets]);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable style={styles.exportBtn} onPress={onExportCsv}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Currency</Text>
        <View style={styles.filterRow}>
          {(['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'UAH'] as CurrencyCode[]).map((c) => (
            <Pressable key={c} style={[styles.filterChip, currency === c && styles.filterChipActive]} onPress={() => onCurrencyChange(c)}>
              <Text style={[styles.filterChipText, currency === c && styles.filterChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Budgets (this month)</Text>
        <View style={styles.inlineRow}>
          <TextInput value={budgetCategory} onChangeText={(v) => setBudgetCategory(v as TransactionCategory)} style={styles.smallInput} placeholder="Category" />
          <TextInput value={budgetAmount} onChangeText={setBudgetAmount} style={styles.smallInput} placeholder="Amount" keyboardType="decimal-pad" />
          <Pressable
            style={styles.saveBtn}
            onPress={async () => {
              const amount = Number(budgetAmount.replace(',', '.'));
              if (!Number.isFinite(amount) || amount <= 0) return;
              await onSaveBudget(budgetCategory, amount);
              setBudgetAmount('');
            }}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          {categoryOptions.map((cat) => (
            <Text key={cat} style={styles.miniPill}>{cat}: {formatCurrency(budgetMap.get(cat) ?? 0, currency)}</Text>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recurring</Text>
        <TextInput value={ruleLabel} onChangeText={setRuleLabel} style={styles.searchInput} placeholder="Label (e.g. Rent)" />
        <View style={styles.inlineRow}>
          <TextInput value={ruleAmount} onChangeText={setRuleAmount} style={styles.smallInput} placeholder="Amount" keyboardType="decimal-pad" />
          <TextInput value={ruleDay} onChangeText={setRuleDay} style={styles.smallInput} placeholder="Day" keyboardType="number-pad" />
        </View>
        <View style={styles.inlineRow}>
          <Pressable style={[styles.filterChip, ruleType === 'income' && styles.filterChipActive]} onPress={() => setRuleType('income')}><Text style={[styles.filterChipText, ruleType === 'income' && styles.filterChipTextActive]}>income</Text></Pressable>
          <Pressable style={[styles.filterChip, ruleType === 'expense' && styles.filterChipActive]} onPress={() => setRuleType('expense')}><Text style={[styles.filterChipText, ruleType === 'expense' && styles.filterChipTextActive]}>expense</Text></Pressable>
          <TextInput value={ruleCategory} onChangeText={(v) => setRuleCategory(v as TransactionCategory)} style={styles.smallInput} placeholder="Category" />
          <Pressable
            style={styles.saveBtn}
            onPress={async () => {
              const amount = Number(ruleAmount.replace(',', '.'));
              const day = Number(ruleDay);
              if (!ruleLabel.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(day)) return;
              await onAddRecurringRule({
                label: ruleLabel.trim(),
                amount,
                dayOfMonth: Math.max(1, Math.min(28, Math.round(day))),
                type: ruleType,
                category: ruleCategory,
              });
              setRuleLabel('');
              setRuleAmount('');
              setRuleDay('1');
            }}
          >
            <Text style={styles.saveBtnText}>Add</Text>
          </Pressable>
        </View>
        {recurringRules.map((r) => (
          <View key={r.id} style={styles.ruleRow}>
            <Text style={styles.ruleText}>{r.label} • day {r.dayOfMonth} • {formatCurrency(r.amount, currency)} • {r.category}</Text>
            <Pressable style={styles.deleteBtn} onPress={() => onToggleRecurringRule(r.id, !r.active)}>
              <Text style={styles.deleteBtnText}>{r.active ? 'On' : 'Off'}</Text>
            </Pressable>
          </View>
        ))}
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
                    <Pressable style={styles.deleteBtn} onPress={() => {
                      setEditId(item.id); setEditAmount(String(item.amount)); setEditType(item.type); setEditCategory(item.category);
                    }}>
                      <Text style={styles.deleteBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => onDeleteTransaction(item.id)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
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
                  <Pressable style={styles.saveBtn} onPress={async () => {
                    const amount = Number(editAmount.replace(',', '.'));
                    if (!Number.isFinite(amount) || amount <= 0) return;
                    await onUpdateTransaction({ id: item.id, amount, type: editType, category: editCategory, date: item.date });
                    setEditId(null);
                  }}><Text style={styles.saveBtnText}>Save</Text></Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => setEditId(null)}><Text style={styles.deleteBtnText}>Cancel</Text></Pressable>
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
  title: { fontSize: 17, fontWeight: '700', color: '#1f3b35' },
  panel: { backgroundColor: '#eef5f2', borderWidth: 1, borderColor: '#d2e2dc', borderRadius: 12, padding: 10, gap: 8 },
  panelTitle: { fontWeight: '700', color: '#35544c' },
  exportBtn: { backgroundColor: '#355f53', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d2e2dc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1f3b35' },
  smallInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#d2e2dc', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#1f3b35' },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: { backgroundColor: '#355f53', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleText: { color: '#35544c', flex: 1, marginRight: 8 },
  miniPill: { color: '#35544c', backgroundColor: '#f6faf8', borderColor: '#c9dbd5', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#c9dbd5', backgroundColor: '#f6faf8' },
  filterChipActive: { backgroundColor: '#4a7a6c', borderColor: '#4a7a6c' },
  filterChipText: { color: '#35544c', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
  empty: { color: '#49635d', marginTop: 8 },
  listRow: { backgroundColor: 'white', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#d2e2dc' },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  listType: { fontWeight: '700', color: '#35544c' },
  category: { color: '#6b7f78', fontSize: 12, marginTop: 2 },
  amount: { color: '#1f3b35', fontWeight: '700' },
  deleteBtn: { backgroundColor: '#e9eff4', borderWidth: 1, borderColor: '#c8d5e0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText: { color: '#3c556e', fontSize: 12, fontWeight: '700' },
});
