import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Budget, CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { BudgetDonutChart } from './transactions/BudgetDonutChart';
import { BudgetSwipeRow } from './transactions/BudgetSwipeRow';
import { TransactionTapRow } from './transactions/TransactionTapRow';

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

  const [reviewTab, setReviewTab] = useState<'transactions' | 'budgets'>('transactions');
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amountDesc' | 'amountAsc'>('newest');
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Other');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategoryOpen, setBudgetCategoryOpen] = useState(false);

  const reviewPagerRef = useRef<ScrollView>(null);
  const [activeSwipeBudgetId, setActiveSwipeBudgetId] = useState<string | null>(null);
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
    <View style={[styles.screenContainer, darkMode && styles.screenDark]}>
      <ScrollView
        ref={reviewPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onReviewPagerEnd}
        onScrollEndDrag={onReviewEndDrag}
      >
        <View style={[styles.reviewTransactionsPage, { width }]}>
          <View style={[styles.contentContainer, styles.transactionsPageContent]}>
            <TextInput value={searchQuery} onChangeText={onSearchQueryChange} placeholder="Search categories" placeholderTextColor="#4f7a59" style={[styles.searchInput, darkMode && styles.inputDark]} />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Pressable style={[styles.dropdown, darkMode && styles.inputDark]} onPress={() => setSortOpen((p) => !p)}><Text style={[styles.dropdownText, darkMode && styles.textDark]}>Sort by: {sortBy}</Text><Text>▾</Text></Pressable>
                {sortOpen ? (
                  <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                    {sortOptions.map((o) => (
                      <Pressable key={o} style={styles.dropdownOption} onPress={() => { setSortBy(o); setSortOpen(false); }}>
                        <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{o}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.flex1}>
                <Pressable style={[styles.dropdown, darkMode && styles.inputDark]} onPress={() => setFilterOpen((p) => !p)}><Text style={[styles.dropdownText, darkMode && styles.textDark]}>Filter: {typeFilter}/{categoryFilter}</Text><Text>▾</Text></Pressable>
                {filterOpen ? (
                  <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                    <Text style={styles.section}>Type</Text>
                    <View style={styles.filterRow}>{typeOptions.map((t) => <Pressable key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => onTypeFilterChange(t)}><Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text></Pressable>)}</View>
                    <Text style={styles.section}>Category</Text>
                    <View style={styles.filterRow}>{categoryFilterOptions.map((cat) => <Pressable key={cat} style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]} onPress={() => onCategoryFilterChange(cat)}><Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text></Pressable>)}</View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.tableWrap}>
              <ScrollView
                style={styles.transactionsListScroll}
                contentContainerStyle={styles.transactionsListContent}
                showsVerticalScrollIndicator={false}

              >
                <View style={[styles.tableHeaderRow, darkMode && styles.tableHeaderRowDark]}>
                  <Text style={[styles.tableHeaderText, darkMode && styles.metaDark]}>Name / Category</Text>
                  <Text style={[styles.tableHeaderText, darkMode && styles.metaDark]}>Date / Amount</Text>
                </View>
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
          <View style={styles.tableWrap}>
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}

            >
              <View style={[styles.panel, darkMode && styles.panelDark]}>
                <BudgetDonutChart budgets={budgets} currency={currency} darkMode={darkMode} styles={styles} />

                <View style={[styles.tableHeaderRow, darkMode && styles.tableHeaderRowDark]}>
                  <Text style={[styles.tableHeaderText, darkMode && styles.metaDark]}>Category</Text>
                  <Text style={[styles.tableHeaderText, darkMode && styles.metaDark]}>Amount</Text>
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
          <View style={styles.reviewAddBudgetWrapInPage}>
            <Pressable style={styles.reviewAddBudgetBtn} onPress={() => setShowAddBudget((v) => !v)}>
              <Text style={styles.reviewAddBudgetText}>Add New Budget</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {showAddBudget ? (
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={() => { setShowAddBudget(false); setBudgetCategoryOpen(false); }} />
          <View style={[styles.modalCard, darkMode && styles.panelDark]}>
            <Text style={[styles.name, darkMode && styles.textDark]}>Add New Budget</Text>
            <TextInput
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              style={[styles.smallInput, darkMode && styles.inputDark]}
              placeholder="Budget amount"
              keyboardType="decimal-pad"
            />
            <Pressable style={[styles.dropdown, darkMode && styles.inputDark]} onPress={() => setBudgetCategoryOpen((p) => !p)}>
              <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{budgetCategory}</Text>
              <Text>▾</Text>
            </Pressable>
            {budgetCategoryOpen ? (
              <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                {budgetCategoryOptions.map((cat) => (
                  <Pressable key={cat} style={styles.dropdownOption} onPress={() => { setBudgetCategory(cat); setBudgetCategoryOpen(false); }}>
                    <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable style={styles.reviewAddBudgetBtn} onPress={async () => {
              const amount = Number(budgetAmount.replace(',', '.'));
              if (!Number.isFinite(amount) || amount <= 0) return;
              await onSaveBudget(budgetCategory, amount);
              setBudgetAmount('');
              setShowAddBudget(false);
              setBudgetCategoryOpen(false);
            }}>
              <Text style={styles.reviewAddBudgetText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.reviewBottomTabs, darkMode && styles.reviewBottomTabsDark]}>
        {(['transactions', 'budgets'] as const).map((tab) => {
          const active = reviewTab === tab;
          const label = tab === 'transactions' ? 'Transactions' : 'Budgets';
          return (
            <Pressable key={tab} style={styles.reviewBottomTab} onPress={() => setReviewTab(tab)}>
              <View style={[styles.reviewBottomDot, active && styles.reviewBottomDotActive]} />
              <Text style={[styles.reviewBottomLabel, darkMode && styles.textDark, active && styles.reviewBottomLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  panelDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 88 },
  transactionsPageContent: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  textDark: { color: '#d6f5df' },
  exportBtn: { backgroundColor: '#14b85a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  reviewBottomTabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eaffef',
  },
  reviewBottomTabsDark: { backgroundColor: '#0f1a14' },
  reviewTransactionsPage: { flex: 1 },
  reviewBudgetsPage: { flex: 1 },
  reviewAddBudgetWrapInPage: { position: 'absolute', left: 16, right: 16, bottom: 56 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: 20, zIndex: 30 },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 14, padding: 12, gap: 10 },
  reviewAddBudgetBtn: { backgroundColor: '#14b85a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  reviewAddBudgetText: { color: 'white', fontWeight: '800', fontSize: 16 },
  tableWrap: { flex: 1, position: 'relative' },
  transactionsListScroll: { flex: 1 },
  transactionsListContent: { paddingBottom: 18 },

  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#d4eadb', marginBottom: 6 },
  tableHeaderRowDark: { borderBottomColor: '#2e4d3b' },
  tableHeaderText: { color: '#3e7b52', fontSize: 11, fontWeight: '700' },

  reviewBottomTab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 2 },
  reviewBottomDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#79d992' },
  reviewBottomDotActive: { backgroundColor: '#14b85a', width: 22 },
  reviewBottomLabel: { color: '#3e7b52', fontSize: 12 },
  reviewBottomLabelActive: { color: '#14632f', fontWeight: '800' },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#156530' },
  inputDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b', color: '#d6f5df' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  nameCol: { flex: 0.8 },
  inputCol: { flex: 1.2 },
  dropdown: { minHeight: 42, borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { color: '#1e6e37', fontWeight: '600', fontSize: 12 },
  dropdownMenu: { marginTop: 4, borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, padding: 8, gap: 6, backgroundColor: '#ecfff1' },
  dropdownOption: { paddingVertical: 6 },
  section: { fontSize: 12, color: '#2f7a43', fontWeight: '700' },
  smallInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#156530' },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#a9e6b7', backgroundColor: '#f0fff4' },
  filterChipActive: { backgroundColor: '#14b85a', borderColor: '#14b85a' },
  filterChipText: { color: '#1e6e37', fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: 'white' },
  transactionShell: { position: 'relative', overflow: 'hidden' },
  swipeShell: { position: 'relative', marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#9ee5ab', backgroundColor: '#ecfff1', overflow: 'hidden' },
  swipeShellDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  tapActionsBg: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'flex-end' },
  transactionActionsBg: { top: 8, bottom: 12 },
  tapActionsRight: { flexDirection: 'row', height: '100%', overflow: 'hidden' },
  transactionActionsRail: { alignItems: 'center', gap: 4 },
  transactionActionBtnCompact: { height: 36, borderRadius: 0 },
  updateFlatBtn: { backgroundColor: '#14b85a', justifyContent: 'center', alignItems: 'center', width: 60 },
  updateFlatBtnDark: { backgroundColor: '#14b85a' },
  deleteFlatBtn: { backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', width: 60 },
  deleteFlatBtnDark: { backgroundColor: '#dc2626' },
  flatBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  flatBtnTextDark: { color: '#ffffff' },
  listRow: { backgroundColor: '#ecfff1', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#9ee5ab' },
  listRowInner: { marginBottom: 0, borderWidth: 0, borderRadius: 0 },
  listRowDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  transactionRow: { backgroundColor: 'transparent', paddingHorizontal: 6, paddingTop: 10, paddingBottom: 8 },
  transactionRowDark: { backgroundColor: 'transparent' },
  recordSeparator: { marginTop: 10, height: StyleSheet.hairlineWidth, backgroundColor: '#cfe5d6' },
  recordSeparatorDark: { backgroundColor: '#2e4d3b' },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  name: { fontWeight: '700', color: '#1e6e37' },
  meta: { color: '#3e7b52', fontSize: 12, marginTop: 2 },
  metaDark: { color: '#9dc9ab' },
  amount: { color: '#14632f', fontWeight: '700' },
  actionBtn: { backgroundColor: '#e6f8ec', borderWidth: 1, borderColor: '#a9e6b7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  actionBtnText: { color: '#2d7a43', fontSize: 12, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText: { color: '#991b1b', fontWeight: '700', fontSize: 12 },
  panel: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 12, padding: 10, gap: 8 },
  budgetExpandedWrap: { gap: 10 },
  equalButtonRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  equalButton: { flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center' },
  chartWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  totalBudgetText: { color: '#14532d', fontWeight: '800', marginTop: 6 },
  legendWrap: { width: '100%', marginTop: 8, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#14532d', fontWeight: '600', fontSize: 12 },
});
