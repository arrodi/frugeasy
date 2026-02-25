import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { MonthlySummaryScreen } from './src/screens/MonthlySummaryScreen';
import { calculateMonthlyTotals, filterTransactionsByMonth } from './src/domain/summary';
import { Transaction, TransactionCategory, TransactionType } from './src/domain/types';
import {
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('Food');

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
  const monthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, now.getUTCFullYear(), now.getUTCMonth()),
    [transactions, now]
  );

  const totals = useMemo(() => calculateMonthlyTotals(monthlyTransactions), [monthlyTransactions]);

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
      setAmountInput('');
      Alert.alert('Saved ✨', `${selectedType} recorded successfully.`);
      return true;
    } catch {
      Alert.alert('Oops', 'Could not save transaction.');
      return false;
    }
  };

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
        <MonthlySummaryScreen monthlyTransactions={monthlyTransactions} totals={totals} />
      )}
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
});
