import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { MonthlySummaryScreen } from './src/screens/MonthlySummaryScreen';
import {
  categoryTotals,
  largestTransactions,
  projectedMonthEnd,
  smartNudges,
  unusualTransactions,
  weeklyBurn,
} from './src/domain/analysis';
import { calculateMonthlyTotals, filterTransactionsByMonth } from './src/domain/summary';
import { Transaction, TransactionCategory, TransactionType } from './src/domain/types';
import {
  deleteTransaction,
  initTransactionsRepo,
  insertTransaction,
  listTransactions,
} from './src/storage/transactionsRepo';

type Screen = 'entry' | 'summary';

const INCOME_CATEGORIES: TransactionCategory[] = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Other',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Other',
];

function categoriesFor(type: TransactionType): TransactionCategory[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function monthWindow(now: Date, offsetMonths: number) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function toCsv(transactions: Transaction[]): string {
  const header = ['id', 'amount', 'type', 'category', 'date', 'createdAt'];
  const rows = transactions.map((t) => [t.id, String(t.amount), t.type, t.category, t.date, t.createdAt]);
  return [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('Food');
  const [analysisMode, setAnalysisMode] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TransactionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initTransactionsRepo();
        const existing = await listTransactions();
        setTransactions(existing);
      } catch {
        Alert.alert('Oops', 'Could not initialize local database.');
      }
    })();
  }, []);

  const now = new Date();
  const selectedWindow = monthWindow(now, monthOffset);
  const previousWindow = monthWindow(now, monthOffset - 1);

  const baseMonthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedWindow.year, selectedWindow.month),
    [transactions, selectedWindow.year, selectedWindow.month]
  );

  const previousMonthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, previousWindow.year, previousWindow.month),
    [transactions, previousWindow.year, previousWindow.month]
  );

  const filteredTransactions = useMemo(() => {
    return baseMonthlyTransactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${t.category} ${t.type} ${t.amount}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [baseMonthlyTransactions, typeFilter, categoryFilter, searchQuery]);

  const totals = useMemo(() => calculateMonthlyTotals(baseMonthlyTransactions), [baseMonthlyTransactions]);
  const previousTotals = useMemo(
    () => calculateMonthlyTotals(previousMonthlyTransactions),
    [previousMonthlyTransactions]
  );

  const expenseCategoryBreakdown = useMemo(
    () => categoryTotals(baseMonthlyTransactions, 'expense'),
    [baseMonthlyTransactions]
  );
  const incomeCategoryBreakdown = useMemo(
    () => categoryTotals(baseMonthlyTransactions, 'income'),
    [baseMonthlyTransactions]
  );

  const daysElapsed = new Date().getUTCDate();
  const daysInMonth = new Date(Date.UTC(selectedWindow.year, selectedWindow.month + 1, 0)).getUTCDate();
  const weeklyBurnRate = weeklyBurn(totals.expense, daysElapsed);
  const projectedExpense = projectedMonthEnd(totals.expense, daysElapsed, daysInMonth);

  const biggest = useMemo(() => largestTransactions(baseMonthlyTransactions), [baseMonthlyTransactions]);
  const unusual = useMemo(() => unusualTransactions(baseMonthlyTransactions), [baseMonthlyTransactions]);
  const nudges = useMemo(
    () => smartNudges(baseMonthlyTransactions, previousMonthlyTransactions),
    [baseMonthlyTransactions, previousMonthlyTransactions]
  );

  const onChangeType = (nextType: TransactionType) => {
    setSelectedType(nextType);
    setSelectedCategory(categoriesFor(nextType)[0]);
  };

  const handleSave = async (): Promise<boolean> => {
    const amount = Number(amountInput.replace(',', '.'));
    const nowIso = new Date().toISOString();

    try {
      const tx = await insertTransaction({
        amount,
        type: selectedType,
        category: selectedCategory,
        date: nowIso,
        createdAt: nowIso,
      });
      setTransactions((prev) => [tx, ...prev]);
      setLastSavedId(tx.id);
      setAmountInput('');
      Alert.alert('Saved ✨', `${selectedType} recorded successfully.`);
      return true;
    } catch {
      Alert.alert('Oops', 'Could not save transaction.');
      return false;
    }
  };

  const handleUndoLastSave = async () => {
    if (!lastSavedId) return;
    try {
      await deleteTransaction(lastSavedId);
      setTransactions((prev) => prev.filter((t) => t.id !== lastSavedId));
      setLastSavedId(null);
      Alert.alert('Done', 'Last transaction removed.');
    } catch {
      Alert.alert('Oops', 'Could not undo last save.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      Alert.alert('Oops', 'Could not delete transaction.');
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = toCsv(filteredTransactions);
      const fileUri = `${FileSystem.cacheDirectory}frugeasy-${selectedWindow.year}-${selectedWindow.month + 1}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
      } else {
        Alert.alert('Exported', `CSV saved to ${fileUri}`);
      }
    } catch {
      Alert.alert('Oops', 'Could not export CSV.');
    }
  };

  const categoryOptions = Array.from(new Set(baseMonthlyTransactions.map((t) => t.category))).sort();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.headerCard}>
        <Text style={styles.title}>✨ Frugeasy</Text>
        <Text style={styles.subtitle}>Simple money tracking, cozy and clear</Text>

        <View style={styles.navRow}>
          <Pressable
            style={[styles.navButton, screen === 'entry' && styles.navButtonActive]}
            onPress={() => setScreen('entry')}
          >
            <Text
              style={[styles.navButtonText, screen === 'entry' && styles.navButtonTextActive]}
            >
              Add
            </Text>
          </Pressable>
          <Pressable
            style={[styles.navButton, screen === 'summary' && styles.navButtonActive]}
            onPress={() => setScreen('summary')}
          >
            <Text
              style={[
                styles.navButtonText,
                screen === 'summary' && styles.navButtonTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
        </View>
      </View>

      {screen === 'entry' ? (
        <AddTransactionScreen
          amountInput={amountInput}
          selectedType={selectedType}
          selectedCategory={selectedCategory}
          categoryOptions={categoriesFor(selectedType)}
          onChangeAmount={setAmountInput}
          onChangeType={onChangeType}
          onChangeCategory={setSelectedCategory}
          onSave={handleSave}
        />
      ) : (
        <MonthlySummaryScreen
          year={selectedWindow.year}
          monthIndex={selectedWindow.month}
          monthlyTransactions={filteredTransactions}
          totals={totals}
          previousTotals={previousTotals}
          analysisMode={analysisMode}
          onToggleAnalysisMode={() => setAnalysisMode((prev) => !prev)}
          onPrevMonth={() => setMonthOffset((prev) => prev - 1)}
          onNextMonth={() => setMonthOffset((prev) => Math.min(prev + 1, 0))}
          canGoNextMonth={monthOffset < 0}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categoryOptions={categoryOptions}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          expenseCategoryTotals={expenseCategoryBreakdown}
          incomeCategoryTotals={incomeCategoryBreakdown}
          weeklyBurnRate={weeklyBurnRate}
          projectedExpense={projectedExpense}
          largestTransactions={biggest}
          unusualTransactions={unusual}
          nudges={nudges}
          onDeleteTransaction={handleDeleteTransaction}
          onExportCsv={handleExportCsv}
        />
      )}

      {screen === 'entry' && lastSavedId ? (
        <View style={styles.undoWrap}>
          <Pressable style={styles.undoBtn} onPress={handleUndoLastSave}>
            <Text style={styles.undoText}>Undo last save</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7faf9' },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#eaf2ef',
    borderWidth: 1,
    borderColor: '#d1e2dc',
    borderRadius: 18,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1f3b35' },
  subtitle: { marginTop: 2, fontSize: 13, color: '#49635d' },
  navRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#b8cec6',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
  },
  navButtonActive: { backgroundColor: '#4a7a6c', borderColor: '#4a7a6c' },
  navButtonText: { color: '#35544c', fontWeight: '700' },
  navButtonTextActive: { color: 'white' },
  undoWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  undoBtn: {
    backgroundColor: '#e6efeb',
    borderWidth: 1,
    borderColor: '#c8d9d2',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  undoText: { color: '#35544c', fontWeight: '700' },
});
