import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryTotal, getMonthLabel } from '../domain/analysis';
import { Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  year: number;
  monthIndex: number;
  monthlyTransactions: Transaction[];
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  previousTotals: {
    income: number;
    expense: number;
    net: number;
  };
  analysisMode: boolean;
  onToggleAnalysisMode: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNextMonth: boolean;
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (value: 'all' | TransactionType) => void;
  categoryFilter: 'all' | TransactionCategory;
  onCategoryFilterChange: (value: 'all' | TransactionCategory) => void;
  categoryOptions: TransactionCategory[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  expenseCategoryTotals: CategoryTotal[];
  incomeCategoryTotals: CategoryTotal[];
  weeklyBurnRate: number;
  projectedExpense: number;
  largestTransactions: Transaction[];
  unusualTransactions: Transaction[];
  nudges: string[];
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCsv: () => Promise<void>;
};

export function MonthlySummaryScreen({
  year,
  monthIndex,
  monthlyTransactions,
  totals,
  previousTotals,
  analysisMode,
  onToggleAnalysisMode,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  searchQuery,
  onSearchQueryChange,
  expenseCategoryTotals,
  incomeCategoryTotals,
  weeklyBurnRate,
  projectedExpense,
  largestTransactions,
  unusualTransactions,
  nudges,
  onDeleteTransaction,
  onExportCsv,
}: Props) {
  const monthLabel = getMonthLabel(year, monthIndex);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.contentContainer}>
      <View style={styles.monthRow}>
        <Pressable style={styles.monthNavBtn} onPress={onPrevMonth}>
          <Text style={styles.monthNavBtnText}>←</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>{monthLabel}</Text>
        <Pressable
          style={[styles.monthNavBtn, !canGoNextMonth && styles.monthNavBtnDisabled]}
          onPress={onNextMonth}
          disabled={!canGoNextMonth}
        >
          <Text style={styles.monthNavBtnText}>→</Text>
        </Pressable>
      </View>

      <View style={styles.card}><Text style={styles.cardLabel}>Income</Text><Text style={[styles.cardValue, styles.income]}>{formatCurrency(totals.income)}</Text></View>
      <View style={styles.card}><Text style={styles.cardLabel}>Expenditure</Text><Text style={[styles.cardValue, styles.expense]}>{formatCurrency(totals.expense)}</Text></View>
      <View style={styles.card}><Text style={styles.cardLabel}>Net</Text><Text style={[styles.cardValue, styles.net]}>{formatCurrency(totals.net)}</Text></View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={onToggleAnalysisMode}>
          <Text style={styles.actionBtnText}>{analysisMode ? 'Hide analysis' : 'Analyze'}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onExportCsv}>
          <Text style={styles.actionBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      {analysisMode ? (
        <View style={styles.analysisWrap}>
          <Text style={styles.analysisTitle}>Insights</Text>
          <Text style={styles.note}>Previous month expense: {formatCurrency(previousTotals.expense)}</Text>
          <Text style={styles.note}>Weekly burn rate: {formatCurrency(weeklyBurnRate)}</Text>
          <Text style={styles.note}>Projected month-end expense: {formatCurrency(projectedExpense)}</Text>

          {nudges.map((nudge) => (
            <Text key={nudge} style={styles.nudge}>• {nudge}</Text>
          ))}

          <Text style={styles.subTitle}>Top expense categories</Text>
          {expenseCategoryTotals.slice(0, 5).map((item) => (
            <Text key={`ex-${item.category}`} style={styles.note}>{item.category}: {formatCurrency(item.total)}</Text>
          ))}

          <Text style={styles.subTitle}>Top income categories</Text>
          {incomeCategoryTotals.slice(0, 5).map((item) => (
            <Text key={`in-${item.category}`} style={styles.note}>{item.category}: {formatCurrency(item.total)}</Text>
          ))}

          <Text style={styles.subTitle}>Largest transactions</Text>
          {largestTransactions.map((item) => (
            <Text key={`lg-${item.id}`} style={styles.note}>{item.category} • {formatCurrency(item.amount)}</Text>
          ))}

          {unusualTransactions.length > 0 ? <Text style={styles.subTitle}>Unusual transactions</Text> : null}
          {unusualTransactions.map((item) => (
            <Text key={`un-${item.id}`} style={styles.note}>{item.category} • {formatCurrency(item.amount)}</Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Transactions</Text>
      <TextInput
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        placeholder="Search by category or amount"
        placeholderTextColor="#6b7f78"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
            onPress={() => onTypeFilterChange(t)}
          >
            <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(['all', ...categoryOptions] as const).map((cat) => (
          <Pressable
            key={cat}
            style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
            onPress={() => onCategoryFilterChange(cat)}
          >
            <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {monthlyTransactions.length === 0 ? <Text style={styles.empty}>No transactions for this view.</Text> : null}
      {monthlyTransactions.map((item) => (
        <View key={item.id} style={styles.listRow}>
          <View>
            <Text style={styles.listType}>{item.type === 'income' ? 'Income' : 'Expense'}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
          <View style={styles.rightRow}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <Pressable style={styles.deleteBtn} onPress={() => onDeleteTransaction(item.id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 4, paddingBottom: 24 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eaf2ef',
    borderWidth: 1,
    borderColor: '#d2e2dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnDisabled: { opacity: 0.45 },
  monthNavBtnText: { color: '#35544c', fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f3b35' },
  card: {
    backgroundColor: '#eef5f2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2e2dc',
  },
  cardLabel: { color: '#49635d', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#1f3b35' },
  income: { color: '#1f8b63' },
  expense: { color: '#536c90' },
  net: { color: '#355f53' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#355f53',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: 'white', fontWeight: '700' },
  analysisWrap: {
    backgroundColor: '#f6faf8',
    borderWidth: 1,
    borderColor: '#d2e2dc',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  analysisTitle: { fontSize: 15, fontWeight: '800', color: '#1f3b35' },
  subTitle: { marginTop: 8, fontWeight: '700', color: '#35544c' },
  note: { color: '#49635d' },
  nudge: { color: '#2f5d50', fontWeight: '600' },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d2e2dc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1f3b35',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c9dbd5',
    backgroundColor: '#f6faf8',
  },
  filterChipActive: { backgroundColor: '#4a7a6c', borderColor: '#4a7a6c' },
  filterChipText: { color: '#35544c', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
  empty: { color: '#49635d', marginTop: 8 },
  listRow: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#d2e2dc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  listType: { fontWeight: '700', color: '#35544c' },
  category: { color: '#6b7f78', fontSize: 12, marginTop: 2 },
  amount: { color: '#1f3b35', fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#e9eff4',
    borderWidth: 1,
    borderColor: '#c8d5e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: { color: '#3c556e', fontSize: 12, fontWeight: '700' },
});
