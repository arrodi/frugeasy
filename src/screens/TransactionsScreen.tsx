import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Budget, CurrencyCode, Transaction, TransactionCategory, TransactionType } from '../domain/types';
import { formatCurrency } from '../ui/format';

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

type BudgetSwipeRowProps = { budget: Budget; currency: CurrencyCode; darkMode?: boolean; onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>; onDeleteBudget: (id: string) => Promise<void>; activeSwipeBudgetId: string | null; setActiveSwipeBudgetId: (id: string | null) => void };

type TransactionTapRowProps = {
  item: Transaction;
  currency: CurrencyCode;
  darkMode?: boolean;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction: (input: { id: string; amount: number; type: TransactionType; category: TransactionCategory; name: string; date: string }) => Promise<void>;
  showSeparator: boolean;
};

function TransactionTapRow({ item, currency, darkMode, activeId, setActiveId, onDeleteTransaction, onUpdateTransaction, showSeparator }: TransactionTapRowProps) {
  const reveal = useRef(new Animated.Value(0)).current;
  const opened = activeId === item.id;
  const dateLabel = new Date(item.date).toLocaleDateString();

  useEffect(() => {
    Animated.timing(reveal, { toValue: opened ? 132 : 0, duration: 180, useNativeDriver: false }).start();
  }, [opened]);

  return (
    <Pressable style={[styles.swipeShell, darkMode && styles.swipeShellDark]} onPress={() => setActiveId(opened ? null : item.id)}>
      <View style={styles.tapActionsBg} pointerEvents="box-none">
        <View style={styles.tapActionsRight}>
          <Pressable
            style={[styles.updateFlatBtn, darkMode && styles.updateFlatBtnDark]}
            onPress={(e) => {
              e.stopPropagation?.();
              Alert.prompt(
                'Update transaction amount',
                `${item.category} • ${item.name || '—'}`,
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
          <Pressable style={[styles.deleteFlatBtn, darkMode && styles.deleteFlatBtnDark]} onPress={(e) => { e.stopPropagation?.(); onDeleteTransaction(item.id); }}>
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Delete</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.transactionRow, darkMode && styles.transactionRowDark, { marginRight: reveal }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.name, darkMode && styles.textDark]}>{item.name?.trim() ? item.name : '—'}</Text>
            <Text style={[styles.meta, darkMode && styles.metaDark]}>{item.category}</Text>
          </View>
          <View style={styles.rightRow}>
            <Text style={[styles.meta, darkMode && styles.metaDark]}>{dateLabel}</Text>
            <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(item.amount, currency)}</Text>
          </View>
        </View>
        {showSeparator ? <View style={[styles.recordSeparator, darkMode && styles.recordSeparatorDark]} /> : null}
      </Animated.View>
    </Pressable>
  );
}

function BudgetSwipeRow({ budget, currency, darkMode, onSaveBudget, onDeleteBudget, activeSwipeBudgetId, setActiveSwipeBudgetId }: BudgetSwipeRowProps) {
  const reveal = useRef(new Animated.Value(0)).current;

  const opened = activeSwipeBudgetId === budget.id;

  const animateTo = (v: number) => Animated.timing(reveal, { toValue: v, duration: 180, useNativeDriver: false }).start();

  useEffect(() => {
    animateTo(opened ? 132 : 0);
  }, [opened]);

  return (
    <Pressable
      style={[styles.swipeShell, darkMode && styles.swipeShellDark]}
      onPress={() => setActiveSwipeBudgetId(opened ? null : budget.id)}
    >
      <View style={styles.tapActionsBg} pointerEvents="box-none">
        <View style={styles.tapActionsRight}>
          <Pressable
            style={[styles.updateFlatBtn, darkMode && styles.updateFlatBtnDark]}
            onPress={(e) => {
              e.stopPropagation?.();
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
            }}
          >
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Update</Text>
          </Pressable>
          <Pressable style={[styles.deleteFlatBtn, darkMode && styles.deleteFlatBtnDark]} onPress={(e) => { e.stopPropagation?.(); onDeleteBudget(budget.id); }}>
            <Text style={[styles.flatBtnText, darkMode && styles.flatBtnTextDark]}>Delete</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.listRow, styles.listRowInner, darkMode && styles.listRowDark, { marginRight: reveal }]}>
        <View style={styles.topRow}>
          <Text style={[styles.name, darkMode && styles.textDark]}>{budget.category}</Text>
          <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(budget.amount, currency)}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

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

  const onReviewPagerEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setReviewTab(next === 0 ? 'transactions' : 'budgets');
  };

  const onReviewEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement, velocity } = event.nativeEvent;
    const atStart = contentOffset.x <= 1;
    const atEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 1;
    const fastEnough = Math.abs(velocity?.x ?? 0) > 0.2;

    if (reviewTab === 'transactions' && atStart && fastEnough) onSwipeBeyondLeft();
    if (reviewTab === 'budgets' && atEnd && fastEnough) onSwipeBeyondRight();
  };

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
                    {(['newest', 'oldest', 'amountDesc', 'amountAsc'] as const).map((o) => (
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
                    <View style={styles.filterRow}>{(['all', 'income', 'expense'] as const).map((t) => <Pressable key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => onTypeFilterChange(t)}><Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text></Pressable>)}</View>
                    <Text style={styles.section}>Category</Text>
                    <View style={styles.filterRow}>{(['all', ...categoryOptions] as const).map((cat) => <Pressable key={cat} style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]} onPress={() => onCategoryFilterChange(cat)}><Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text></Pressable>)}</View>
                  </View>
                ) : null}
              </View>
            </View>

            <ScrollView
              style={styles.transactionsListScroll}
              contentContainerStyle={styles.transactionsListContent}
              showsVerticalScrollIndicator
              indicatorStyle={darkMode ? 'white' : 'black'}
              scrollIndicatorInsets={{ right: 1 }}
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
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.reviewBudgetsPage, { width }]}> 
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={[styles.panel, darkMode && styles.panelDark]}>
              {(() => {
                const total = budgets.reduce((s,b)=>s+b.amount,0);
                const size=160; const r=58; const c=2*Math.PI*r;
                let acc=0;
                const colors=['#ff6b6b','#f59e0b','#facc15','#22c55e','#14b8a6','#0ea5e9','#6366f1','#a855f7','#ec4899','#f97316','#84cc16','#06b6d4'];
                const center=size/2;
                let cumulative=0;
                const slices = total > 0 ? budgets.map((b,i)=>{ const frac=b.amount/total; const start=cumulative; const mid=start+frac/2; cumulative+=frac; return { b, i, frac, mid }; }) : [];
                return (
                  <View style={styles.chartWrap}>
                    <Text style={[styles.totalBudgetText, darkMode && styles.textDark]}>Total Budget: {formatCurrency(total, currency)}</Text>
                    <Svg width={size+220} height={size+80}><G x={110} y={30}><G rotation={-90} origin={`${center}, ${center}`}>
                      {total>0 ? budgets.map((b,i)=>{ const frac=b.amount/total; const seg=c*frac; const dash=`${seg} ${c-seg}`; const off=-acc*c; acc+=frac; return <Circle key={b.id} cx={center} cy={center} r={r} fill="none" stroke={colors[i%colors.length]} strokeWidth={20} strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt"/>; }) : <Circle cx={center} cy={center} r={r} fill="none" stroke={darkMode ? '#2e4d3b' : '#d1fae5'} strokeWidth={20}/>}
                    </G>
                    {slices.map(({ b, i, frac, mid }) => { const angle = mid * Math.PI * 2 - Math.PI/2; const x1 = center + Math.cos(angle) * (r + 10); const y1 = center + Math.sin(angle) * (r + 10); const x2 = center + Math.cos(angle) * (r + 28); const y2 = center + Math.sin(angle) * (r + 28); const right = Math.cos(angle) >= 0; const x3 = x2 + (right ? 24 : -24); const shortCategory = b.category.length > 10 ? `${b.category.slice(0, 10)}…` : b.category; const label = `${shortCategory} ${(frac*100).toFixed(0)}%`; return (<G key={`callout-${b.id}`}><Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors[i%colors.length]} strokeWidth={1.5} /><Line x1={x2} y1={y2} x2={x3} y2={y2} stroke={colors[i%colors.length]} strokeWidth={1.5} /><SvgText x={x3 + (right ? 4 : -4)} y={y2 + 4} fontSize={10} fill={darkMode ? '#d6f5df' : '#14532d'} textAnchor={right ? 'start' : 'end'}>{label}</SvgText></G>); })}
                    </G></Svg>
                  </View>
                );
              })()}

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
                />
              ))}

            </View>
          </ScrollView>
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
  swipeShell: { position: 'relative', marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#9ee5ab', backgroundColor: '#ecfff1', overflow: 'hidden' },
  swipeShellDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  tapActionsBg: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'flex-end' },
  tapActionsRight: { flexDirection: 'row', height: '100%' },
  updateFlatBtn: { backgroundColor: '#14b85a', justifyContent: 'center', alignItems: 'center', width: 66 },
  updateFlatBtnDark: { backgroundColor: '#14b85a' },
  deleteFlatBtn: { backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', width: 66 },
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
