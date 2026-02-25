import { useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TransactionCategory, TransactionType } from '../domain/types';

type Props = {
  amountInput: string;
  selectedType: TransactionType;
  selectedCategory: TransactionCategory;
  categoryOptions: TransactionCategory[];
  onChangeAmount: (value: string) => void;
  onChangeType: (value: TransactionType) => void;
  onChangeCategory: (value: TransactionCategory) => void;
  onSave: () => Promise<boolean>;
};

export function AddTransactionScreen({
  amountInput,
  selectedType,
  selectedCategory,
  categoryOptions,
  onChangeAmount,
  onChangeType,
  onChangeCategory,
  onSave,
}: Props) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const amountAccessoryId = 'amountKeyboardAccessory';

  const onPressSave = async () => {
    const amount = Number(amountInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (isSaving) return;
    try {
      setIsSaving(true);
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.formArea}>
        <Text style={styles.sectionTitle}>Add transaction</Text>

        <TextInput
          value={amountInput}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
          inputAccessoryViewID={Platform.OS === 'ios' ? amountAccessoryId : undefined}
          placeholder="Amount"
          placeholderTextColor="#3e5f47"
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

        <Text style={styles.label}>Category</Text>
        <View>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => setCategoryOpen((prev) => !prev)}
          >
            <Text style={styles.dropdownTriggerText}>{selectedCategory}</Text>
            <Text style={styles.dropdownChevron}>{categoryOpen ? '▴' : '▾'}</Text>
          </Pressable>

          {categoryOpen ? (
            <View style={styles.dropdownMenu}>
              {categoryOptions.map((category) => {
                const active = category === selectedCategory;
                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      onChangeCategory(category);
                      setCategoryOpen(false);
                    }}
                    style={[styles.dropdownOption, active && styles.dropdownOptionActive]}
                  >
                    <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Pressable style={styles.saveBtn} onPress={onPressSave}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save transaction'}</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={amountAccessoryId}>
          <View style={styles.accessoryBar}>
            <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneTypingButton}>
              <Text style={styles.doneTypingText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  formArea: {
    flex: 1,
    backgroundColor: '#ecfff1',
    borderWidth: 1,
    borderColor: '#9ee5ab',
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  sectionTitle: { fontSize: 30, fontWeight: '900', color: '#14632f' },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#6fdd87',
    color: '#14632f',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 34,
    fontWeight: '700',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#dffbe7',
    borderWidth: 1,
    borderColor: '#8cdca0',
  },
  typeButtonIncomeActive: { backgroundColor: '#1fbf67', borderColor: '#1fbf67' },
  typeButtonExpenseActive: { backgroundColor: '#59a86e', borderColor: '#59a86e' },
  typeButtonText: { color: 'white', fontWeight: '800', fontSize: 22 },
  label: { color: '#1c6b34', fontWeight: '800', fontSize: 20, marginTop: 6 },
  dropdownTrigger: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8fdca2',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerText: { color: '#14632f', fontWeight: '700', fontSize: 22 },
  dropdownChevron: { color: '#2b7a42', fontSize: 20 },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b0e8be',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f6e8',
  },
  dropdownOptionActive: { backgroundColor: '#e4fce9' },
  dropdownOptionText: { color: '#1e6e37', fontWeight: '700', fontSize: 20 },
  dropdownOptionTextActive: { color: '#14632f' },
  saveBtn: {
    marginTop: 'auto',
    backgroundColor: '#14b85a',
    borderWidth: 1,
    borderColor: '#10994b',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '900', fontSize: 24 },
  accessoryBar: {
    backgroundColor: '#e5faeb',
    borderTopWidth: 1,
    borderTopColor: '#b9ebc7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  doneTypingButton: {
    backgroundColor: '#d2f5dc',
    borderWidth: 1,
    borderColor: '#98dda9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneTypingText: { color: '#14632f', fontWeight: '700' },
});
