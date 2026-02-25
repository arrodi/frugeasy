import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TransactionType } from '../domain/types';

type Props = {
  amountInput: string;
  selectedType: TransactionType;
  onChangeAmount: (value: string) => void;
  onChangeType: (value: TransactionType) => void;
  onSave: () => Promise<void>;
};

export function AddTransactionScreen({
  amountInput,
  selectedType,
  onChangeAmount,
  onChangeType,
  onSave,
}: Props) {
  const onPressSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0.');
      return;
    }
    await onSave();
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Add income / expense</Text>

      <TextInput
        value={amountInput}
        onChangeText={onChangeAmount}
        keyboardType="decimal-pad"
        placeholder="Amount"
        style={styles.input}
      />

      <View style={styles.typeRow}>
        <Pressable
          onPress={() => onChangeType('income')}
          style={[styles.typeButton, selectedType === 'income' && styles.typeButtonIncomeActive]}
        >
          <Text style={styles.typeButtonText}>Income</Text>
        </Pressable>
        <Pressable
          onPress={() => onChangeType('expense')}
          style={[styles.typeButton, selectedType === 'expense' && styles.typeButtonExpenseActive]}
        >
          <Text style={styles.typeButtonText}>Expense</Text>
        </Pressable>
      </View>

      <Pressable style={styles.saveButton} onPress={onPressSave}>
        <Text style={styles.saveButtonText}>Save transaction</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
