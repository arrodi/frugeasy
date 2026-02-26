import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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
  onExportCsv: () => Promise<void>;
  onUpdateTransaction: (input: { id: string; amount: number; type: TransactionType; category: TransactionCategory; name: string; date: string }) => Promise<void>;
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
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
    onExportCsv,
    onUpdateTransaction,
    onSaveBudget,
    onDeleteBudget,
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

  const shownTransactions = useMemo(() => {
    const arr = [...transactions];
    if (sortBy === 'newest') arr.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sortBy === 'oldest') arr.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (sortBy === 'amountDesc') arr.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amountAsc') arr.sort((a, b) => a.amount - b.amount);
    return arr;
  }, [transactions, sortBy]);

  return (
    <ScrollView style={[styles.screenContainer, darkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topRow}>
        <Text style={[styles.title, darkMode && styles.textDark]}>Review</Text>
        <Pressable style={styles.exportBtn} onPress={onExportCsv}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      <View style={[styles.reviewSwitchWrap, darkMode && styles.reviewSwitchWrapDark]}>
        <Pressable style={[styles.reviewSwitchOption, darkMode && styles.reviewSwitchOptionDark, reviewTab === 'transactions' && styles.reviewSwitchOptionActive]} onPress={() => setReviewTab('transactions')}>
          <Text style={[styles.reviewSwitchText, darkMode && styles.textDark, reviewTab === 'transactions' && styles.reviewSwitchTextActive]}>Transactions</Text>
        </Pressable>
        <Pressable style={[styles.reviewSwitchOption, darkMode && styles.reviewSwitchOptionDark, reviewTab === 'budgets' && styles.reviewSwitchOptionActive]} onPress={() => setReviewTab('budgets')}>
          <Text style={[styles.reviewSwitchText, darkMode && styles.textDark, reviewTab === 'budgets' && styles.reviewSwitchTextActive]}>Budgets</Text>
        </Pressable>
      </View>

      {reviewTab === 'transactions' ? (
        <>
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
        </>
      ) : (
        <View style={[styles.panel, darkMode && styles.panelDark]}>
          {(() => {
            const total = budgets.reduce((s,b)=>s+b.amount,0);
            const size=160; const r=58; const c=2*Math.PI*r;
            let acc=0;
            const colors=['#ef4444','#f59e0b','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16','#a855f7'];
            return (
              <View style={styles.chartWrap}>
                <Svg width={size} height={size}>
                  <G rotation={-90} origin={`${size/2}, ${size/2}`}>
                    {total>0 ? budgets.map((b,i)=>{
                      const frac=b.amount/total;
                      const seg=c*frac;
                      const dash=`${seg} ${c-seg}`;
                      const off=-acc*c; acc+=frac;
                      return <Circle key={b.id} cx={size/2} cy={size/2} r={r} fill="none" stroke={colors[i%colors.length]} strokeWidth={20} strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt"/>;
                    }) : <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={darkMode ? '#2e4d3b' : '#d1fae5'} strokeWidth={20}/>}
                  </G>
                </Svg>
                <Text style={[styles.totalBudgetText, darkMode && styles.textDark]}>Total Budget: {formatCurrency(total, currency)}</Text>
                <View style={styles.legendWrap}>
                  {budgets.map((b, i) => (
                    <View key={`lg-${b.id}`} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: colors[i % colors.length] }]} />
                      <Text style={[styles.legendText, darkMode && styles.textDark]}>{b.category}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
          {budgets.map((b) => {
            const expanded = expandedBudgetId === b.id;
            return (
              <Pressable key={b.id} style={[styles.listRow, darkMode && styles.listRowDark]} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedBudgetId(expanded ? null : b.id);
                setExpandedBudgetAmount(String(b.amount));
              }}>
                {!expanded ? (
                  <View style={styles.topRow}>
                    <Text style={[styles.name, darkMode && styles.textDark]}>{b.category}</Text>
                    <Text style={[styles.amount, darkMode && styles.textDark]}>{formatCurrency(b.amount, currency)}</Text>
                  </View>
                ) : (
                  <View style={styles.inlineRow}>
                    <TextInput value={expandedBudgetAmount} onChangeText={setExpandedBudgetAmount} style={[styles.smallInput, darkMode && styles.inputDark, styles.flex1]} keyboardType="decimal-pad" placeholder="New amount" />
                    <Pressable style={styles.actionBtn} onPress={async () => {
                      const amount = Number(expandedBudgetAmount.replace(',', '.'));
                      if (!Number.isFinite(amount) || amount <= 0) return;
                      await onSaveBudget(b.category, amount);
                      setExpandedBudgetId(null);
                    }}><Text style={styles.actionBtnText}>Edit</Text></Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => onDeleteBudget(b.id)}><Text style={styles.deleteBtnText}>Delete</Text></Pressable>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  panelDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  textDark: { color: '#d6f5df' },
  exportBtn: { backgroundColor: '#14b85a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  reviewSwitchWrap: { flexDirection: 'row', backgroundColor: '#e8f8ee', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#b6e9c3', gap: 4 },
  reviewSwitchWrapDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  reviewSwitchOption: { flex: 1, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  reviewSwitchOptionDark: { backgroundColor: '#1a2d22' },
  reviewSwitchOptionActive: { backgroundColor: '#14b85a' },
  reviewSwitchText: { color: '#1e6e37', fontWeight: '700' },
  reviewSwitchTextActive: { color: 'white' },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#156530' },
  inputDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b', color: '#d6f5df' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flex1: { flex: 1 },
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
  chartWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  totalBudgetText: { color: '#14532d', fontWeight: '800', marginTop: 6 },
  legendWrap: { width: '100%', marginTop: 8, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#14532d', fontWeight: '600', fontSize: 12 },
});
