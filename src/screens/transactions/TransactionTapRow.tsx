import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../../domain/types';
import { formatCurrency } from '../../ui/format';
import { SwipeRevealRow } from './SwipeRevealRow';

type Props = {
  item: Transaction;
  currency: CurrencyCode;
  darkMode?: boolean;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction: (input: { id: string; amount: number; type: TransactionType; category: TransactionCategory; name: string; date: string }) => Promise<void>;
  showSeparator: boolean;
  styles: any;
};

export function TransactionTapRow({ item, currency, darkMode, activeId, setActiveId, onDeleteTransaction, onUpdateTransaction, showSeparator, styles }: Props) {
  const opened = activeId === item.id;
  const dateLabel = new Date(item.date).toLocaleDateString();

  return (
    <SwipeRevealRow
      id={item.id}
      activeId={activeId}
      setActiveId={setActiveId}
      shellStyle={styles.transactionShell}
      actionsBackgroundStyle={[styles.tapActionsBg, styles.transactionActionsBg]}
      actionsRailStyle={[styles.tapActionsRight, styles.transactionActionsRail]}
      contentStyle={[styles.transactionRow, darkMode && styles.transactionRowDark]}
      actions={() => (
        <>
          <Pressable
            style={[styles.updateFlatBtn, styles.transactionActionBtnCompact, darkMode && styles.updateFlatBtnDark]}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!opened) return;
              Alert.prompt(
                'Update transaction amount',
                `${item.category} • ${item.name || '-'}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Save',
                    onPress: async (value?: string) => {
                      const amount = Number((value ?? '').replace(',', '.'));
                      if (!Number.isFinite(amount) || amount <= 0) return;
                      await onUpdateTransaction({ id: item.id, amount, type: item.type, category: item.category, name: item.name, date: item.date });
                      setActiveId(null);
                    },
                  },
                ],
                'plain-text',
                String(item.amount),
                'decimal-pad'
              );
            }}
          >
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Update</Text>
          </Pressable>
          <Pressable
            style={[styles.deleteFlatBtn, styles.transactionActionBtnCompact, darkMode && styles.deleteFlatBtnDark]}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!opened) return;
              onDeleteTransaction(item.id);
            }}
          >
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Delete</Text>
          </Pressable>
        </>
      )}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.name, darkMode && styles.textDark]}>{item.name?.trim() ? item.name : '-'}</Text>
          <Text style={[styles.meta, darkMode && styles.metaDark]}>{item.category}</Text>
        </View>
        <View style={styles.rightRow}>
          <Text style={[styles.meta, darkMode && styles.metaDark]}>{dateLabel}</Text>
          <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(item.amount, currency)}</Text>
        </View>
      </View>
      {showSeparator ? <View style={[styles.recordSeparator, darkMode && styles.recordSeparatorDark]} /> : null}
    </SwipeRevealRow>
  );
}
