import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO string
  createdAt: string;
};

type Screen = 'entry' | 'summary';

const STORAGE_KEY = 'frugeasy.transactions.v1';

function isCurrentMonth(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth()
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Transaction[];
        setTransactions(parsed);
      } catch {
        Alert.alert('Error', 'Could not load saved transactions.');
      }
    })();
  }, []);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => isCurrentMonth(t.date)),
    [transactions]
  );

  const totals = useMemo(() => {
    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, net: income - expense };
  }, [monthlyTransactions]);

  const persistTransactions = async (next: Transaction[]) => {
    setTransactions(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0.');
      return;
    }

    const nextTx: Transaction = {
      id: `${Date.now()}`,
      amount,
      type: selectedType,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const next = [nextTx, ...transactions];
      await persistTransactions(next);
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
        <View style={styles.screenContainer}>
          <Text style={styles.sectionTitle}>Add income / expense</Text>

          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="decimal-pad"
            placeholder="Amount"
            style={styles.input}
          />

          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setSelectedType('income')}
              style={[
                styles.typeButton,
                selectedType === 'income' && styles.typeButtonIncomeActive,
              ]}
            >
              <Text style={styles.typeButtonText}>Income</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedType('expense')}
              style={[
                styles.typeButton,
                selectedType === 'expense' && styles.typeButtonExpenseActive,
              ]}
            >
              <Text style={styles.typeButtonText}>Expense</Text>
            </Pressable>
          </View>

          <Pressable style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Save transaction</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.screenContainer}>
          <Text style={styles.sectionTitle}>Current month summary</Text>

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
            <Text style={styles.cardValue}>{formatCurrency(totals.net)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Transactions (this month)</Text>
          <FlatList
            data={monthlyTransactions}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <Text style={styles.listType}>{item.type.toUpperCase()}</Text>
                <Text>{formatCurrency(item.amount)}</Text>
              </View>
            )}
          />
        </View>
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
  screenContainer: { flex: 1, paddingHorizontal: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  typeButtonIncomeActive: { backgroundColor: '#22c55e' },
  typeButtonExpenseActive: { backgroundColor: '#ef4444' },
  typeButtonText: { color: 'white', fontWeight: '700' },
  saveButton: {
    marginTop: 4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontWeight: '700' },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLabel: { color: '#475569', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
  empty: { color: '#64748b', marginTop: 8 },
  listRow: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listType: { fontWeight: '700', color: '#334155' },
});
