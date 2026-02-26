import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Budget, CurrencyCode, RecurringRule, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  budgets: Budget[];
  categoryOptions: TransactionCategory[];
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

export function BudgetingScreen({
  darkMode,
  currency,
  budgets,
  categoryOptions,
  onSaveBudget,
  recurringRules,
  onAddRecurringRule,
  onToggleRecurringRule,
}: Props) {
  const [tab, setTab] = useState<'budgets' | 'recurring'>('budgets');
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
    <ScrollView style={[styles.screenContainer, darkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Budgeting</Text>

      <View style={styles.switchWrap}>
        <Pressable style={[styles.switchOption, tab === 'budgets' && styles.switchOptionActive]} onPress={() => setTab('budgets')}>
          <Text style={[styles.switchText, tab === 'budgets' && styles.switchTextActive]}>Budgets</Text>
        </Pressable>
        <Pressable style={[styles.switchOption, tab === 'recurring' && styles.switchOptionActive]} onPress={() => setTab('recurring')}>
          <Text style={[styles.switchText, tab === 'recurring' && styles.switchTextActive]}>Recurring</Text>
        </Pressable>
      </View>

      {tab === 'budgets' ? (
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
      ) : (
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  switchWrap: { flexDirection: 'row', backgroundColor: '#e8f8ee', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#b6e9c3', gap: 4 },
  switchOption: { flex: 1, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  switchOptionActive: { backgroundColor: '#14b85a' },
  switchText: { color: '#1e6e37', fontWeight: '700' },
  switchTextActive: { color: 'white' },
  panel: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 12, padding: 10, gap: 8 },
  panelTitle: { fontWeight: '700', color: '#1e6e37' },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#156530' },
  smallInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#156530' },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: { backgroundColor: '#14b85a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleText: { color: '#35544c', flex: 1, marginRight: 8 },
  miniPill: { color: '#1e6e37', backgroundColor: '#f0fff4', borderColor: '#a9e6b7', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#a9e6b7', backgroundColor: '#f0fff4' },
  filterChipActive: { backgroundColor: '#14b85a', borderColor: '#14b85a' },
  filterChipText: { color: '#1e6e37', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
  deleteBtn: { backgroundColor: '#e9f8ed', borderWidth: 1, borderColor: '#b5e8c2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText: { color: '#2d7a43', fontSize: 12, fontWeight: '700' },
});
