import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { MonthlySummaryScreen } from './src/screens/MonthlySummaryScreen';
import { Transaction, TransactionType } from './src/domain/types';
import { calculateMonthlyTotals, filterTransactionsByMonth } from './src/domain/summary';
import {
  initTransactionsRepo,
  insertTransaction,
  listTransactions,
} from './src/storage/transactionsRepo';

type Screen = 'entry' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');

  useEffect(() => {
    (async () => {
      try {
        await initTransactionsRepo();
        const existing = await listTransactions();
        setTransactions(existing);
      } catch {
        Alert.alert('Error', 'Could not initialize local database.');
      }
    })();
  }, []);

  const now = new Date();
  const monthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, now.getUTCFullYear(), now.getUTCMonth()),
    [transactions, now]
  );

  const totals = useMemo(() => calculateMonthlyTotals(monthlyTransactions), [monthlyTransactions]);

  const handleSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    const nowIso = new Date().toISOString();

    try {
      const tx = await insertTransaction({
        amount,
        type: selectedType,
        date: nowIso,
        createdAt: nowIso,
      });
      setTransactions((prev) => [tx, ...prev]);
      setAmountInput('');
      Alert.alert('Saved', `${selectedType} recorded successfully.`);
    } catch {
      Alert.alert('Error', 'Could not save transaction.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Frugeasy</Text>
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
          onChangeAmount={setAmountInput}
          onChangeType={setSelectedType}
          onSave={handleSave}
        />
      ) : (
        <MonthlySummaryScreen monthlyTransactions={monthlyTransactions} totals={totals} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  navRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  navButtonActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  navButtonText: { color: '#334155', fontWeight: '600' },
  navButtonTextActive: { color: 'white' },
});
