import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { MonthlySummaryScreen } from './src/screens/MonthlySummaryScreen';
import { calculateMonthlyTotals, filterTransactionsByMonth } from './src/domain/summary';
import { Transaction, TransactionType } from './src/domain/types';
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
      Alert.alert('Saved ✨', `${selectedType} recorded successfully.`);
    } catch {
      Alert.alert('Oops', 'Could not save transaction.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.headerCard}>
        <Text style={styles.title}>🌸 Frugeasy</Text>
        <Text style={styles.subtitle}>Money tracking made gentle</Text>

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
  safeArea: { flex: 1, backgroundColor: '#fff7fb' },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffe4f1',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    borderRadius: 18,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#831843' },
  subtitle: { marginTop: 2, fontSize: 13, color: '#9d174d' },
  navRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff0f7',
  },
  navButtonActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  navButtonText: { color: '#9d174d', fontWeight: '700' },
  navButtonTextActive: { color: 'white' },
});
