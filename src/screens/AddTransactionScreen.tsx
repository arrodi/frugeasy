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
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    await onSave();
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>💖 Add a money note</Text>

        <TextInput
          value={amountInput}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          placeholder="Amount"
          placeholderTextColor="#be185d"
          style={styles.input}
        />

        <View style={styles.typeRow}>
          <Pressable
            onPress={() => onChangeType('income')}
            style={[styles.typeButton, selectedType === 'income' && styles.typeButtonIncomeActive]}
          >
            <Text style={styles.typeButtonText}>🌱 Income</Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeType('expense')}
            style={[
              styles.typeButton,
              selectedType === 'expense' && styles.typeButtonExpenseActive,
            ]}
          >
            <Text style={styles.typeButtonText}>🍓 Expense</Text>
          </Pressable>
        </View>

        <Pressable style={styles.saveButton} onPress={onPressSave}>
          <Text style={styles.saveButtonText}>Save transaction ✨</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  block: {
    backgroundColor: '#fff0f7',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#831843' },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    color: '#831843',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fce7f3',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  typeButtonIncomeActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  typeButtonExpenseActive: { backgroundColor: '#fb7185', borderColor: '#fb7185' },
  typeButtonText: { color: 'white', fontWeight: '700' },
  saveButton: {
    marginTop: 2,
    backgroundColor: '#ec4899',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontWeight: '800' },
});
