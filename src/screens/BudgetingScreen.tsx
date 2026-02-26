import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Budget, CurrencyCode, TransactionCategory } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  budgets: Budget[];
  totals: { income: number; expense: number; net: number };
  budgetProgressRows: { category: string; budget: number; spent: number; usagePct: number }[];
  categoryOptions: TransactionCategory[];
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
};

export function BudgetingScreen({
  darkMode,
  currency,
  budgets,
  totals,
  budgetProgressRows,
  categoryOptions,
  onSaveBudget,
  onDeleteBudget,
}: Props) {
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [expandedBudgetAmount, setExpandedBudgetAmount] = useState('');
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategoryOpen, setBudgetCategoryOpen] = useState(false);

  return (
    <View style={[styles.screenContainer, darkMode && styles.screenDark]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, darkMode && styles.textDark]}>Budgeting</Text>

        <View style={styles.overviewRowHorizontal}>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Income</Text>
            <Text style={[styles.cardValue, styles.income]}>{formatCurrency(totals.income, currency)}</Text>
          </View>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Expenditure</Text>
            <Text style={[styles.cardValue, styles.expense]}>{formatCurrency(totals.expense, currency)}</Text>
          </View>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Net</Text>
            <Text style={[styles.cardValue, styles.net]}>{formatCurrency(totals.net, currency)}</Text>
          </View>
        </View>

        <View>
          {budgetProgressRows.length === 0 ? <Text style={[styles.ruleText, darkMode && styles.textDark]}>No budgets set yet.</Text> : null}
          {budgetProgressRows.map((row) => {
            const budget = budgets.find((b) => b.category === row.category);
            const expanded = budget?.id === expandedBudgetId;
            return (
              <Pressable
                key={`b-${row.category}`}
                style={[styles.budgetItem, darkMode && styles.budgetItemDark]}
                onPress={() => {
                  if (!budget) return;
                  if (expanded) {
                    setExpandedBudgetId(null);
                    return;
                  }
                  setExpandedBudgetId(budget.id);
                  setExpandedBudgetAmount(String(budget.amount));
                }}
              >
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetCat, darkMode && styles.textDark]}>{row.category}</Text>
                  <Text style={[styles.budgetAmt, darkMode && styles.textDark]}>
                    {formatCurrency(row.spent, currency)} / {formatCurrency(row.budget, currency)}
                  </Text>
                </View>
                <View style={[styles.progressTrack, darkMode && styles.progressTrackDark]}>
                  <View
                    style={[
                      styles.progressFill,
                      darkMode && styles.progressFillDark,
                      { width: `${Math.min(100, Math.max(0, row.usagePct))}%` },
                      row.usagePct > 100 && styles.progressOver,
                    ]}
                  />
                  <View style={styles.progressOverlayCenter}>
                    <Text style={[styles.progressInsideText, row.usagePct >= 55 ? styles.progressInsideOnFill : styles.progressInsideOffFill]}>
                      {row.usagePct.toFixed(0)}% used
                    </Text>
                  </View>
                </View>

                {expanded && budget ? (
                  <View style={styles.budgetActionsRow}>
                    <TextInput
                      value={expandedBudgetAmount}
                      onChangeText={setExpandedBudgetAmount}
                      style={[styles.input, styles.flex1, darkMode && styles.inputDark]}
                      keyboardType="decimal-pad"
                      placeholder="New amount"
                    />
                    <Pressable
                      style={styles.saveBtn}
                      onPress={async () => {
                        const amount = Number(expandedBudgetAmount.replace(',', '.'));
                        if (!Number.isFinite(amount) || amount <= 0) return;
                        await onSaveBudget(budget.category, amount);
                        setExpandedBudgetId(null);
                      }}
                    >
                      <Text style={styles.saveBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => onDeleteBudget(budget.id)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {showAddBudget ? (
          <View style={[styles.panel, darkMode && styles.panelDark]}>
            <Pressable style={[styles.dropdownTrigger, darkMode && styles.inputDark]} onPress={() => setBudgetCategoryOpen((p) => !p)}>
              <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{budgetCategory}</Text>
              <Text style={styles.dropdownChevron}>{budgetCategoryOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {budgetCategoryOpen ? (
              <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                {categoryOptions.map((cat) => (
                  <Pressable
                    key={cat}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setBudgetCategory(cat);
                      setBudgetCategoryOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="Budget amount"
              keyboardType="decimal-pad"
            />
            <Pressable
              style={styles.saveBtn}
              onPress={async () => {
                const amount = Number(budgetAmount.replace(',', '.'));
                if (!Number.isFinite(amount) || amount <= 0) return;
                await onSaveBudget(budgetCategory, amount);
                setBudgetAmount('');
                setShowAddBudget(false);
              }}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomActionWrap}>
        <Pressable
          style={styles.bigSaveBtn}
          onPress={() => {
            setShowAddBudget((v) => !v);
            setExpandedBudgetId(null);
          }}
        >
          <Text style={styles.bigSaveText}>Add New Budget</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 100 },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  textDark: { color: '#d6f5df' },

  panel: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 12, padding: 10, gap: 8 },
  panelDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },

  overviewRowHorizontal: { flexDirection: 'row', gap: 8 },
  card: { backgroundColor: '#eef5f2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#d2e2dc' },
  cardHorizontal: { flex: 1, minWidth: 0 },
  cardDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  cardLabel: { color: '#49635d', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800', color: '#1f3b35' },
  income: { color: '#1f8b63' },
  expense: { color: '#536c90' },
  net: { color: '#355f53' },

  budgetItem: { borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, padding: 10, backgroundColor: '#f6fff8', marginBottom: 10 },
  budgetItemDark: { backgroundColor: '#1a2d22', borderColor: '#2e4d3b' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCat: { fontWeight: '700', color: '#1e6e37' },
  budgetAmt: { color: '#14532d', fontWeight: '700' },

  progressTrack: { height: 24, backgroundColor: '#dcefe3', borderRadius: 999, overflow: 'hidden', marginTop: 6, justifyContent: 'center' },
  progressTrackDark: { backgroundColor: '#243b30' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#16a34a' },
  progressFillDark: { backgroundColor: '#22c55e' },
  progressOver: { backgroundColor: '#dc2626' },
  progressOverlayCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  progressInsideText: { fontWeight: '800', fontSize: 11 },
  progressInsideOnFill: { color: '#ffffff' },
  progressInsideOffFill: { color: '#14532d' },

  budgetActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, color: '#156530' },
  inputDark: { backgroundColor: '#0f1a14', borderColor: '#2e4d3b', color: '#d6f5df' },
  flex1: { flex: 1 },

  dropdownTrigger: { minHeight: 46, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#b7ebc3', backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { color: '#156530', fontWeight: '600' },
  dropdownChevron: { color: '#2d7a43' },
  dropdownMenu: { borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e3f6e8' },

  saveBtn: { backgroundColor: '#14b85a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  deleteBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText: { color: '#991b1b', fontWeight: '700', fontSize: 12 },

  bottomActionWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 8,
  },
  bigSaveBtn: { backgroundColor: '#14b85a', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  bigSaveText: { color: 'white', fontWeight: '800', fontSize: 18 },

  ruleText: { color: '#35544c', flex: 1, marginRight: 8 },
});
