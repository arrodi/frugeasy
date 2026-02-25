import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
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
  onSave: () => Promise<void>;
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
  const swipeY = useRef(new Animated.Value(0)).current;

  const onSwipeSave = async () => {
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 5 || Math.abs(gestureState.dx) > 5,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            swipeY.setValue(Math.max(gestureState.dy, -90));
          } else {
            swipeY.setValue(0);
          }
        },
        onPanResponderRelease: async (_, gestureState) => {
          const shouldSave = gestureState.dy < -70;
          Animated.spring(swipeY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
          if (shouldSave) {
            await onSwipeSave();
          }
        },
      }),
    [isSaving, amountInput, onSave, swipeY]
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.formArea}>
        <Text style={styles.sectionTitle}>✨ Add a transaction</Text>

        <TextInput
          value={amountInput}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          placeholder="Amount"
          placeholderTextColor="#4b635c"
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
            style={[
              styles.typeButton,
              selectedType === 'expense' && styles.typeButtonExpenseActive,
            ]}
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
      </View>

      <View style={styles.swipeZoneWrap}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.swipeZone, { transform: [{ translateY: swipeY }] }]}
        >
          <Text style={styles.swipeText}>{isSaving ? 'Saving…' : 'Swipe up to save'}</Text>
          <Text style={styles.swipeHint}>↑ drag up</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  formArea: {
    backgroundColor: '#eef5f2',
    borderWidth: 1,
    borderColor: '#d2e2dc',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f3b35' },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#bfd2cb',
    color: '#1f3b35',
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
    backgroundColor: '#f6faf8',
    borderWidth: 1,
    borderColor: '#d2e2dc',
  },
  typeButtonIncomeActive: { backgroundColor: '#48b183', borderColor: '#48b183' },
  typeButtonExpenseActive: { backgroundColor: '#6c7f9f', borderColor: '#6c7f9f' },
  typeButtonText: { color: 'white', fontWeight: '700' },
  label: { color: '#35544c', fontWeight: '600' },
  dropdownTrigger: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfd2cb',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerText: { color: '#1f3b35', fontWeight: '600' },
  dropdownChevron: { color: '#4b635c', fontSize: 14 },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c9dbd5',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3ece8',
  },
  dropdownOptionActive: {
    backgroundColor: '#edf5f1',
  },
  dropdownOptionText: { color: '#35544c', fontWeight: '600' },
  dropdownOptionTextActive: { color: '#1f3b35' },
  swipeZoneWrap: {
    paddingBottom: 4,
  },
  swipeZone: {
    backgroundColor: '#355f53',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b4b42',
  },
  swipeText: { color: 'white', fontWeight: '800', fontSize: 16 },
  swipeHint: { color: '#cfe2db', marginTop: 3, fontSize: 12, fontWeight: '600' },
});
