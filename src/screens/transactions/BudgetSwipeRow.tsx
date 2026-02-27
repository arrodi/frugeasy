import { memo, useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Budget, CurrencyCode, TransactionCategory } from '../../domain/types';
import { formatCurrency } from '../../ui/format';
import { SwipeRevealRow } from './SwipeRevealRow';

type Props = {
  budget: Budget;
  currency: CurrencyCode;
  darkMode?: boolean;
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  activeSwipeBudgetId: string | null;
  setActiveSwipeBudgetId: (id: string | null) => void;
  styles: any;
};

function BudgetSwipeRowImpl({ budget, currency, darkMode, onSaveBudget, onDeleteBudget, activeSwipeBudgetId, setActiveSwipeBudgetId, styles }: Props) {
  const opened = activeSwipeBudgetId === budget.id;

  const onPressUpdate = useCallback((e: any) => {
    e.stopPropagation?.();
    if (!opened) return;
    Alert.prompt(
      'Update budget',
      budget.category,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const raw = (value ?? '').trim();
            if (!raw) return;
            if (!/^\d+(?:[.,]\d+)?$/.test(raw)) {
              Alert.alert('Invalid amount', 'Use numbers only (e.g. 120 or 120.50).');
              return;
            }
            const amount = Number(raw.replace(',', '.'));
            if (!Number.isFinite(amount) || amount <= 0) return;
            await onSaveBudget(budget.category, amount);
            setActiveSwipeBudgetId(null);
          },
        },
      ],
      'plain-text',
      String(budget.amount),
      'decimal-pad'
    );
  }, [budget.amount, budget.category, onSaveBudget, opened, setActiveSwipeBudgetId]);

  const onPressDelete = useCallback((e: any) => {
    e.stopPropagation?.();
    if (!opened) return;
    onDeleteBudget(budget.id);
  }, [budget.id, onDeleteBudget, opened]);

  return (
    <SwipeRevealRow
      id={budget.id}
      activeId={activeSwipeBudgetId}
      setActiveId={setActiveSwipeBudgetId}
      shellStyle={styles.transactionShell}
      actionsBackgroundStyle={[styles.tapActionsBg, styles.transactionActionsBg]}
      actionsRailStyle={[styles.tapActionsRight, styles.transactionActionsRail]}
      contentStyle={[styles.transactionRow, darkMode && styles.transactionRowDark]}
      actions={() => (
        <>
          <Pressable
            style={[styles.updateFlatBtn, styles.transactionActionBtnCompact, darkMode && styles.updateFlatBtnDark]}
            onPress={onPressUpdate}
          >
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Update</Text>
          </Pressable>
          <Pressable
            style={[styles.deleteFlatBtn, styles.transactionActionBtnCompact, darkMode && styles.deleteFlatBtnDark]}
            onPress={onPressDelete}
          >
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Delete</Text>
          </Pressable>
        </>
      )}
    >
      <View style={styles.topRow}>
        <Text style={[styles.name, darkMode && styles.textDark]}>{budget.category}</Text>
        <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(budget.amount, currency)}</Text>
      </View>
      <View style={[styles.recordSeparator, darkMode && styles.recordSeparatorDark]} />
    </SwipeRevealRow>
  );
}

export const BudgetSwipeRow = memo(BudgetSwipeRowImpl);
