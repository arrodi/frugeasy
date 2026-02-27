import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Other');
  const [editName, setEditName] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amountDesc' | 'amountAsc'>('newest');

  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [expandedBudgetAmount, setExpandedBudgetAmount] = useState('');
  const reviewPagerRef = useRef<ScrollView>(null);
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
        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <TextInput value={searchQuery} onChangeText={onSearchQueryChange} placeholder="Search by category, name or amount" placeholderTextColor="#4f7a59" style={[styles.searchInput, darkMode && styles.inputDark]} />

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

            {shownTransactions.map((item) => {
              const editing = editId === item.id;
              return (
                <View key={item.id} style={[styles.listRow, darkMode && styles.listRowDark]}>
                  {!editing ? (
                    <>
                      <View>
                        <Text style={[styles.name, darkMode && styles.textDark]}>{item.name?.trim() ? item.name : "—"}</Text>
                        <Text style={styles.meta}>{item.category} • {new Date(item.date).toLocaleString()}</Text>
                      </View>
                      <View style={styles.rightRow}>
                        <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(item.amount, currency)}</Text>
                        <View style={styles.inlineRow}>
                          <Pressable style={styles.actionBtn} onPress={() => { setEditId(item.id); setEditAmount(String(item.amount)); setEditType(item.type); setEditCategory(item.category); setEditName(item.name); }}><Text style={styles.actionBtnText}>Edit</Text></Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => onDeleteTransaction(item.id)}><Text style={styles.actionBtnText}>Delete</Text></Pressable>
                        </View>
                      </View>
                    </>
                  ) : (
                    <View style={{ width: '100%', gap: 8 }}>
                      <TextInput value={editName} onChangeText={setEditName} style={[styles.smallInput, darkMode && styles.inputDark]} placeholder="Name" />
                      <View style={styles.inlineRow}><TextInput value={editAmount} onChangeText={setEditAmount} style={[styles.smallInput, darkMode && styles.inputDark]} keyboardType="decimal-pad" placeholder="Amount" /><TextInput value={editCategory} onChangeText={(v) => setEditCategory(v as TransactionCategory)} style={[styles.smallInput, darkMode && styles.inputDark]} placeholder="Category" /></View>
                      <View style={styles.inlineRow}><Pressable style={[styles.filterChip, editType === 'income' && styles.filterChipActive]} onPress={() => setEditType('income')}><Text style={[styles.filterChipText, editType === 'income' && styles.filterChipTextActive]}>income</Text></Pressable><Pressable style={[styles.filterChip, editType === 'expense' && styles.filterChipActive]} onPress={() => setEditType('expense')}><Text style={[styles.filterChipText, editType === 'expense' && styles.filterChipTextActive]}>expense</Text></Pressable><Pressable style={styles.actionBtn} onPress={async () => { const amount = Number(editAmount.replace(',', '.')); if (!Number.isFinite(amount) || amount <= 0) return; await onUpdateTransaction({ id: item.id, amount, type: editType, category: editCategory, name: editName.trim() || 'Untitled', date: item.date }); setEditId(null); }}><Text style={styles.actionBtnText}>Save</Text></Pressable></View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <Pressable
              style={[styles.panel, darkMode && styles.panelDark]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedBudgetId(null);
              }}
            >
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

              {budgets.map((b) => {
                const expanded = expandedBudgetId === b.id;
                return (
                  <Pressable
                    key={b.id}
                    style={[styles.listRow, darkMode && styles.listRowDark]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setExpandedBudgetId(expanded ? null : b.id);
                      setExpandedBudgetAmount(String(b.amount));
                    }}
                  >
                    {!expanded ? (
                      <View style={styles.topRow}>
                        <Text style={[styles.name, darkMode && styles.textDark]}>{b.category}</Text>
                        <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(b.amount, currency)}</Text>
                      </View>
                    ) : (
                      <View style={styles.budgetExpandedWrap}>
                        <View style={styles.inlineRow}>
                          <Text style={[styles.name, darkMode && styles.textDark, styles.nameCol]}>{b.category}</Text>
                          <TextInput
                            value={expandedBudgetAmount}
                            onChangeText={setExpandedBudgetAmount}
                            style={[styles.smallInput, darkMode && styles.inputDark, styles.inputCol]}
                            keyboardType="decimal-pad"
                            placeholder="New amount"
                          />
                        </View>
                        <View style={styles.equalButtonRow}>
                          <Pressable style={[styles.deleteBtn, styles.equalButton]} onPress={() => onDeleteBudget(b.id)}>
                            <Text style={styles.deleteBtnText}>Delete</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.actionBtn, styles.equalButton]}
                            onPress={async () => {
                              const amount = Number(expandedBudgetAmount.replace(',', '.'));
                              if (!Number.isFinite(amount) || amount <= 0) return;
                              await onSaveBudget(b.category, amount);
                              setExpandedBudgetId(null);
                            }}
                          >
                            <Text style={styles.actionBtnText}>Update</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>
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
  reviewBottomTab: { flex: 1, alignItems: 'center', gap: 4 },
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
  listRow: { backgroundColor: '#ecfff1', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#9ee5ab' },
  listRowDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  rightRow: { alignItems: 'flex-end', gap: 6 },
  name: { fontWeight: '700', color: '#1e6e37' },
  meta: { color: '#3e7b52', fontSize: 12, marginTop: 2 },
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
