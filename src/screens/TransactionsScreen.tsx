import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Budget, CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { BudgetDonutChart } from './transactions/BudgetDonutChart';
import { BudgetSwipeRow } from './transactions/BudgetSwipeRow';
import { TransactionTapRow } from './transactions/TransactionTapRow';
import { getThemeColors, radii, spacing, typography } from '../ui/themeTokens';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  transactions: Transaction[];
  budgets: Budget[];
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (value: 'all' | TransactionType) => void;
  categoryFilter: 'all' | TransactionCategory;
  onCategoryFilterChange: (value: 'all' | TransactionCategory) => void;
  categoryOptions: TransactionCategory[];
  budgetCategoryOptions: TransactionCategory[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction: (input: { id: string; amount: number; type: TransactionType; category: TransactionCategory; name: string; date: string }) => Promise<void>;
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onSwipeBeyondLeft: () => void;
  onSwipeBeyondRight: () => void;
};

export function TransactionsScreen(props: Props) {
  const {
    darkMode,
    currency,
    transactions,
    budgets,
    typeFilter,
    onTypeFilterChange,
    categoryFilter,
    onCategoryFilterChange,
    categoryOptions,
    budgetCategoryOptions,
    searchQuery,
    onSearchQueryChange,
    onDeleteTransaction,
    onUpdateTransaction,
    onSaveBudget,
    onDeleteBudget,
    onSwipeBeyondLeft,
    onSwipeBeyondRight,
  } = props;
  const colors = getThemeColors(darkMode);

  const [reviewTab, setReviewTab] = useState<'transactions' | 'budgets'>('transactions');
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amountDesc' | 'amountAsc'>('newest');
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Other');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [activeSwipeBudgetId, setActiveSwipeBudgetId] = useState<string | null>(null);

  const reviewPagerRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const sortOptions = useMemo(() => ['newest', 'oldest', 'amountDesc', 'amountAsc'] as const, []);
  const typeOptions = useMemo(() => ['all', 'income', 'expense'] as const, []);
  const categoryFilterOptions = useMemo(() => ['all', ...categoryOptions] as const, [categoryOptions]);

  const shownTransactions = useMemo(() => {
    const arr = [...transactions];
    if (sortBy === 'newest') arr.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sortBy === 'oldest') arr.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (sortBy === 'amountDesc') arr.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amountAsc') arr.sort((a, b) => a.amount - b.amount);
    return arr;
  }, [transactions, sortBy]);

  useEffect(() => {
    reviewPagerRef.current?.scrollTo({ x: (reviewTab === 'transactions' ? 0 : 1) * width, animated: true });
  }, [reviewTab, width]);

  const onReviewPagerEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setReviewTab(next === 0 ? 'transactions' : 'budgets');
  }, [width]);

  const onReviewEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement, velocity } = event.nativeEvent;
    const atStart = contentOffset.x <= 1;
    const atEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 1;
    const fastEnough = Math.abs(velocity?.x ?? 0) > 0.2;

    if (reviewTab === 'transactions' && atStart && fastEnough) onSwipeBeyondLeft();
    if (reviewTab === 'budgets' && atEnd && fastEnough) onSwipeBeyondRight();
  }, [onSwipeBeyondLeft, onSwipeBeyondRight, reviewTab]);

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.bg }]}> 
      <ScrollView
        ref={reviewPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onReviewPagerEnd}
        onScrollEndDrag={onReviewEndDrag}
      >
        <View style={[styles.reviewTransactionsPage, { width }]}> 
          <View style={styles.contentContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              placeholder="Search by name"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsBar}>
              {sortOptions.map((o) => (
                <Pressable key={o} style={[styles.filterChip, { borderColor: colors.border, backgroundColor: sortBy === o ? colors.primary : colors.chip }]} onPress={() => setSortBy(o)}>
                  <Text style={[styles.filterChipText, { color: sortBy === o ? '#fff' : colors.text }]}>{o}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Type</Text>
              <View style={styles.inlineWrap}>
                {typeOptions.map((t) => (
                  <Pressable key={t} style={[styles.filterChip, { borderColor: colors.border, backgroundColor: typeFilter === t ? colors.primary : colors.chip }]} onPress={() => onTypeFilterChange(t)}>
                    <Text style={[styles.filterChipText, { color: typeFilter === t ? '#fff' : colors.text }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Category</Text>
              <View style={styles.inlineWrap}>
                {categoryFilterOptions.map((cat) => (
                  <Pressable key={cat} style={[styles.filterChip, { borderColor: colors.border, backgroundColor: categoryFilter === cat ? colors.primary : colors.chip }]} onPress={() => onCategoryFilterChange(cat)}>
                    <Text style={[styles.filterChipText, { color: categoryFilter === cat ? '#fff' : colors.text }]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.tableWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={[styles.tableHeaderRow, { borderColor: colors.border }]}> 
                <Text style={[styles.tableHeaderText, { color: colors.textMuted }]}>Name / Category</Text>
                <Text style={[styles.tableHeaderText, { color: colors.textMuted }]}>Date / Amount</Text>
              </View>
              <ScrollView style={styles.transactionsListScroll} contentContainerStyle={styles.transactionsListContent} showsVerticalScrollIndicator={false}>
                {shownTransactions.map((item, index) => (
                  <TransactionTapRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    darkMode={darkMode}
                    activeId={activeTransactionId}
                    setActiveId={setActiveTransactionId}
                    onDeleteTransaction={onDeleteTransaction}
                    onUpdateTransaction={onUpdateTransaction}
                    showSeparator={index < shownTransactions.length - 1}
                    styles={styles}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={[styles.reviewBudgetsPage, { width }]}> 
          <View style={styles.contentContainer}>
            <View style={[styles.tableWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView contentContainerStyle={styles.transactionsListContent} showsVerticalScrollIndicator={false}>
                <View style={styles.panel}>
                  <BudgetDonutChart budgets={budgets} currency={currency} darkMode={darkMode} styles={styles} />
                  <View style={[styles.tableHeaderRow, { borderColor: colors.border }]}> 
                    <Text style={[styles.tableHeaderText, { color: colors.textMuted }]}>Category</Text>
                    <Text style={[styles.tableHeaderText, { color: colors.textMuted }]}>Amount</Text>
                  </View>
                  {budgets.map((b) => (
                    <BudgetSwipeRow
                      key={b.id}
                      budget={b}
                      currency={currency}
                      darkMode={darkMode}
                      onSaveBudget={onSaveBudget}
                      onDeleteBudget={onDeleteBudget}
                      activeSwipeBudgetId={activeSwipeBudgetId}
                      setActiveSwipeBudgetId={setActiveSwipeBudgetId}
                      styles={styles}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <Pressable style={[styles.reviewAddBudgetBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddBudget((v) => !v)}>
              <Text style={styles.reviewAddBudgetText}>{showAddBudget ? 'Close' : 'Add budget'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {showAddBudget ? (
        <View style={styles.modalBackdrop}>
          <Pressable style={[styles.modalScrim, { backgroundColor: colors.overlay }]} onPress={() => setShowAddBudget(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.name, { color: colors.text }]}>New budget</Text>
            <TextInput
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              style={[styles.smallInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="Budget amount"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineWrap}>
              {budgetCategoryOptions.map((cat) => (
                <Pressable key={cat} style={[styles.filterChip, { borderColor: colors.border, backgroundColor: budgetCategory === cat ? colors.primary : colors.chip }]} onPress={() => setBudgetCategory(cat)}>
                  <Text style={[styles.filterChipText, { color: budgetCategory === cat ? '#fff' : colors.text }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.reviewAddBudgetBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                const amount = Number(budgetAmount.replace(',', '.'));
                if (!Number.isFinite(amount) || amount <= 0) return;
                await onSaveBudget(budgetCategory, amount);
                setBudgetAmount('');
                setShowAddBudget(false);
              }}
            >
              <Text style={styles.reviewAddBudgetText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.reviewBottomTabs, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {(['transactions', 'budgets'] as const).map((tab) => {
          const active = reviewTab === tab;
          const label = tab === 'transactions' ? 'Transactions' : 'Budgets';
          return (
            <Pressable key={tab} style={styles.reviewBottomTab} onPress={() => setReviewTab(tab)}>
              <View style={[styles.reviewBottomDot, { backgroundColor: active ? colors.primary : colors.tabIdle, width: active ? 22 : 8 }]} />
              <Text style={[styles.reviewBottomLabel, { color: active ? colors.text : colors.textMuted, fontWeight: active ? '800' : '500' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  panelDark: {},
  contentContainer: { flex: 1, padding: spacing.md, gap: spacing.sm, paddingBottom: 84 },
  reviewTransactionsPage: { flex: 1 },
  reviewBudgetsPage: { flex: 1 },

  searchInput: { borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: typography.body },
  chipsBar: { gap: spacing.xs, paddingVertical: spacing.xs },
  sectionBlock: { gap: spacing.xs },
  sectionTitle: { fontSize: typography.caption, fontWeight: '700' },
  inlineWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterChip: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1 },
  filterChipText: { fontWeight: '700', textTransform: 'capitalize', fontSize: typography.caption },

  tableWrap: { flex: 1, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  transactionsListScroll: { flex: 1 },
  transactionsListContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, marginBottom: spacing.xs },
  tableHeaderText: { fontSize: typography.caption, fontWeight: '700' },

  panel: { gap: spacing.xs },
  reviewAddBudgetBtn: { borderRadius: radii.md, paddingVertical: 13, alignItems: 'center', marginTop: spacing.xs },
  reviewAddBudgetText: { color: '#fff', fontWeight: '800', fontSize: typography.body },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: spacing.lg, zIndex: 30 },
  modalScrim: { ...StyleSheet.absoluteFillObject },
  modalCard: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  smallInput: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 10 },

  reviewBottomTabs: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  reviewBottomTab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 2 },
  reviewBottomDot: { width: 8, height: 8, borderRadius: 4 },
  reviewBottomLabel: { fontSize: typography.caption },

  transactionShell: { position: 'relative', overflow: 'hidden' },
  tapActionsBg: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'flex-end' },
  transactionActionsBg: { top: 6, bottom: 8 },
  tapActionsRight: { flexDirection: 'row', height: '100%', overflow: 'hidden' },
  transactionActionsRail: { alignItems: 'center', gap: 4 },
  transactionActionBtnCompact: { height: 42, borderRadius: 0 },
  updateFlatBtn: { backgroundColor: '#2f7a4d', justifyContent: 'center', alignItems: 'center', width: 70 },
  updateFlatBtnDark: { backgroundColor: '#2f7a4d' },
  deleteFlatBtn: { backgroundColor: '#bf3b3b', justifyContent: 'center', alignItems: 'center', width: 70 },
  deleteFlatBtnDark: { backgroundColor: '#bf3b3b' },
  flatBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.caption },
  flatBtnTextDark: { color: '#fff' },

  transactionRow: { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  transactionRowDark: { backgroundColor: 'transparent' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightRow: { alignItems: 'flex-end', gap: 4 },
  name: { fontWeight: '700', color: '#1c2d24' },
  textDark: { color: '#e4efe7' },
  meta: { color: '#5d6f63', fontSize: typography.caption, marginTop: 2 },
  metaDark: { color: '#a8b8ac' },
  amount: { color: '#1c2d24', fontWeight: '700' },
  recordSeparator: { marginTop: spacing.sm, height: StyleSheet.hairlineWidth, backgroundColor: '#d4ddd6' },
  recordSeparatorDark: { backgroundColor: '#2d3a31' },

  chartWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  totalBudgetText: { color: '#1c2d24', fontWeight: '800', marginTop: 6 },
});
