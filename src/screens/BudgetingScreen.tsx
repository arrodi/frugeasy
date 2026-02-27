import { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Budget, CurrencyCode, Transaction, TransactionCategory } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  budgets: Budget[];
  totals: { income: number; expense: number; net: number };
  budgetProgressRows: { category: string; budget: number; spent: number; usagePct: number }[];
  transactions: Transaction[];
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  categoryOptions: TransactionCategory[];
};

export function BudgetingScreen({ darkMode, currency, budgets, totals, budgetProgressRows, transactions, onSaveBudget, categoryOptions }: Props) {
  const [expandedBudgetKey, setExpandedBudgetKey] = useState<string | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('Food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategoryOpen, setBudgetCategoryOpen] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);


  const displayedBudgetRows = (() => {
    const expenseByCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      expenseByCategory.set(t.category, (expenseByCategory.get(t.category) ?? 0) + t.amount);
    }

    const base = budgetProgressRows.map((row) => ({ ...row, budgetMissing: false }));
    const withNoBudget = [...expenseByCategory.entries()]
      .filter(([category, spent]) => spent > 0 && !budgetProgressRows.some((row) => row.category === category))
      .map(([category, spent]) => ({ category, budget: 0, spent, usagePct: 0, budgetMissing: true }));

    return [...base, ...withNoBudget].sort((a, b) => {
      if (a.budgetMissing !== b.budgetMissing) return a.budgetMissing ? 1 : -1;
      return b.spent - a.spent;
    });
  })();

  const fadeColor = darkMode ? '#0f1a14' : '#f6fff8';

  return (
    <View style={[styles.screenContainer, darkMode && styles.screenDark]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, darkMode && styles.textDark]}>Budgeting</Text>

        <View style={styles.overviewRowHorizontal}>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Income</Text>
            <Text style={[styles.cardValue, styles.income]}>{formatCurrency(totals.income, currency)}</Text>
          </View>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Expenditure</Text>
            <Text style={[styles.cardValue, styles.expense]}>{formatCurrency(totals.expense, currency)}</Text>
          </View>
          <View style={[styles.card, styles.cardHorizontal, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.textDark]}>Net</Text>
            <Text style={[styles.cardValue, styles.net]}>{formatCurrency(totals.net, currency)}</Text>
          </View>
        </View>

        {(() => {
          const expenseTx = transactions.filter((t) => t.type === 'expense');
          const byCat = new Map<string, number>();
          for (const t of expenseTx) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
          const entries = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
          const total = entries.reduce((s, [, v]) => s + v, 0);
          const size = 160;
          const r = 58;
          const c = 2 * Math.PI * r;
          const colors = ['#ff6b6b','#f59e0b','#facc15','#22c55e','#14b8a6','#0ea5e9','#6366f1','#a855f7','#ec4899','#f97316','#84cc16','#06b6d4'];
          let acc = 0;
          let cumulative = 0;
          const slices = total > 0 ? entries.map(([category, amount], i) => {
            const frac = amount / total;
            const start = cumulative;
            const mid = start + frac / 2;
            cumulative += frac;
            return { category, amount, i, frac, mid };
          }) : [];

          return (
            <View style={styles.expenseChartWrap}>
              <Svg width={size + 220} height={size + 80}>
                <G x={110} y={30}>
                  <G rotation={-90} origin={`${size/2}, ${size/2}`}>
                    {total > 0 ? entries.map(([_, amount], i) => {
                      const frac = amount / total;
                      const seg = c * frac;
                      const dash = `${seg} ${c - seg}`;
                      const off = -acc * c;
                      acc += frac;
                      return <Circle key={`ex-${i}`} cx={size/2} cy={size/2} r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth={20} strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt" />;
                    }) : <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={darkMode ? '#2e4d3b' : '#d1fae5'} strokeWidth={20} />}
                  </G>

                  {slices.map(({ category, frac, i, mid }) => {
                    const angle = mid * Math.PI * 2 - Math.PI / 2;
                    const x1 = size/2 + Math.cos(angle) * (r + 10);
                    const y1 = size/2 + Math.sin(angle) * (r + 10);
                    const x2 = size/2 + Math.cos(angle) * (r + 28);
                    const y2 = size/2 + Math.sin(angle) * (r + 28);
                    const right = Math.cos(angle) >= 0;
                    const x3 = x2 + (right ? 24 : -24);
                    const shortCategory = category.length > 10 ? `${category.slice(0, 10)}…` : category;
                    const label = `${shortCategory} ${(frac * 100).toFixed(0)}%`;
                    return (
                      <G key={`ex-l-${category}-${i}`}>
                        <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors[i % colors.length]} strokeWidth={1.5} />
                        <Line x1={x2} y1={y2} x2={x3} y2={y2} stroke={colors[i % colors.length]} strokeWidth={1.5} />
                        <SvgText x={x3 + (right ? 4 : -4)} y={y2 + 4} fontSize={10} fill={darkMode ? '#d6f5df' : '#14532d'} textAnchor={right ? 'start' : 'end'}>{label}</SvgText>
                      </G>
                    );
                  })}
                </G>
              </Svg>
            </View>
          );
        })()}

        <View style={styles.entriesScrollWrap}>
          <ScrollView
            style={styles.entriesScroll}
            contentContainerStyle={styles.entriesScrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const y = contentOffset.y;
              setShowTopFade(y > 4);
              const distanceFromBottom = contentSize.height - (y + layoutMeasurement.height);
              setShowBottomFade(distanceFromBottom > 4);
            }}
          >
            {displayedBudgetRows.length === 0 ? <Text style={[styles.ruleText, darkMode && styles.textDark]}>No budgets set yet.</Text> : null}
            {displayedBudgetRows.map((row) => {
            const expanded = row.category === expandedBudgetKey;
            const recent = transactions
              .filter((t) => t.type === 'expense' && t.category === row.category)
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 5);

            return (
              <Pressable
                key={`b-${row.category}`}
                style={[styles.budgetItem, darkMode && styles.budgetItemDark]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedBudgetKey(expanded ? null : row.category);
                }}
              >
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetCat, darkMode && styles.textDark]}>{row.category}</Text>
                  <Text style={[styles.budgetAmt, darkMode && styles.textDark]}>
                    {row.budgetMissing ? formatCurrency(row.spent, currency) : `${formatCurrency(row.spent, currency)} / ${formatCurrency(row.budget, currency)}`}
                  </Text>
                </View>
                <View style={[styles.progressTrack, darkMode && styles.progressTrackDark]}>
                  <View
                    style={[
                      styles.progressFill,
                      darkMode && styles.progressFillDark,
                      { width: `${Math.min(100, Math.max(0, row.usagePct))}%` },
                      row.usagePct > 100 && styles.progressOver,
                    ]}
                  />
                  <View style={styles.progressOverlayCenter}>
                    <Text style={[styles.progressInsideText, row.usagePct >= 55 ? styles.progressInsideOnFill : styles.progressInsideOffFill]}>
                      {row.budgetMissing ? 'Budget not set' : `${row.usagePct.toFixed(0)}% used`}
                    </Text>
                  </View>
                </View>

                {expanded ? (
                  <View style={styles.historyWrap}>
                    {recent.length === 0 ? <Text style={[styles.historyItem, darkMode && styles.textDark]}>No transactions yet.</Text> : null}
                    {recent.map((t) => (
                      <View key={t.id} style={styles.historyRow}>
                        <Text style={[styles.historyItem, darkMode && styles.textDark]}>{t.name?.trim() ? t.name : '—'}</Text>
                        <Text style={[styles.historyItem, darkMode && styles.textDark]}>{formatCurrency(t.amount, currency)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          </ScrollView>
          {showTopFade ? (
            <LinearGradient
              pointerEvents="none"
              colors={[fadeColor, 'transparent']}
              style={[styles.edgeFade, styles.edgeFadeTop]}
            />
          ) : null}
          {showBottomFade ? (
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', fadeColor]}
              style={[styles.edgeFade, styles.edgeFadeBottom]}
            />
          ) : null}
        </View>

        {showAddBudget ? (
          <View style={[styles.panel, darkMode && styles.panelDark]}>
            <Pressable style={[styles.dropdownTrigger, darkMode && styles.inputDark]} onPress={() => setBudgetCategoryOpen((p) => !p)}>
              <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{budgetCategory}</Text>
              <Text style={styles.dropdownChevron}>{budgetCategoryOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {budgetCategoryOpen ? (
              <View style={[styles.dropdownMenu, darkMode && styles.panelDark]}>
                {categoryOptions.map((cat) => (
                  <Pressable key={cat} style={styles.dropdownOption} onPress={() => { setBudgetCategory(cat); setBudgetCategoryOpen(false); }}>
                    <Text style={[styles.dropdownText, darkMode && styles.textDark]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput value={budgetAmount} onChangeText={setBudgetAmount} style={[styles.input, darkMode && styles.inputDark]} placeholder="Budget amount" keyboardType="decimal-pad" />
            <Pressable style={styles.saveBtn} onPress={async () => {
              const amount = Number(budgetAmount.replace(',', '.'));
              if (!Number.isFinite(amount) || amount <= 0) return;
              await onSaveBudget(budgetCategory, amount);
              setBudgetAmount('');
              setShowAddBudget(false);
            }}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomActionWrap}>
        <Pressable style={styles.bigSaveBtn} onPress={() => setShowAddBudget((v) => !v)}>
          <Text style={styles.bigSaveText}>Add New Budget</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  contentContainer: { flex: 1, paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 120 },
  entriesScrollWrap: { flex: 1, position: 'relative' },
  entriesScroll: { flex: 1 },
  entriesScrollContent: { paddingBottom: 8 },
  edgeFade: { position: 'absolute', left: 0, right: 0, height: 18 },
  edgeFadeTop: { top: 0 },
  edgeFadeBottom: { bottom: 0 },
  title: { fontSize: 17, fontWeight: '700', color: '#156530' },
  panelTitle: { fontSize: 14, fontWeight: '700', color: '#14532d', marginBottom: 6 },
  textDark: { color: '#d6f5df' },
  overviewRowHorizontal: { flexDirection: 'row', gap: 8 },
  card: { backgroundColor: '#eef5f2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#d2e2dc' },
  cardHorizontal: { flex: 1, minWidth: 0 },
  cardDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  cardLabel: { color: '#49635d', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800', color: '#1f3b35' },
  income: { color: '#1f8b63' },
  expense: { color: '#536c90' },
  net: { color: '#355f53' },
  budgetItem: { borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, padding: 10, backgroundColor: '#f6fff8', marginBottom: 10 },
  budgetItemDark: { backgroundColor: '#1a2d22', borderColor: '#2e4d3b' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCat: { fontWeight: '700', color: '#1e6e37' },
  budgetAmt: { color: '#14532d', fontWeight: '700' },
  progressTrack: { height: 24, backgroundColor: '#dcefe3', borderRadius: 999, overflow: 'hidden', marginTop: 6, justifyContent: 'center' },
  progressTrackDark: { backgroundColor: '#243b30' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#16a34a' },
  progressFillDark: { backgroundColor: '#22c55e' },
  progressOver: { backgroundColor: '#dc2626' },
  progressOverlayCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  progressInsideText: { fontWeight: '800', fontSize: 11 },
  progressInsideOnFill: { color: '#ffffff' },
  progressInsideOffFill: { color: '#14532d' },
  historyWrap: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#b7ebc3', paddingTop: 10, gap: 10 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyItem: { color: '#35544c', fontSize: 12 },
  ruleText: { color: '#35544c' },

  panel: { backgroundColor: '#ecfff1', borderWidth: 1, borderColor: '#9ee5ab', borderRadius: 12, padding: 10, gap: 8, marginTop: 8 },
  expenseChartWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  totalBudgetText: { color: '#14532d', fontWeight: '800', marginTop: 6 },
  panelDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, color: '#156530' },
  inputDark: { backgroundColor: '#0f1a14', borderColor: '#2e4d3b', color: '#d6f5df' },
  dropdownTrigger: { minHeight: 46, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#b7ebc3', backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { color: '#156530', fontWeight: '600' },
  dropdownChevron: { color: '#2d7a43' },
  dropdownMenu: { borderWidth: 1, borderColor: '#b7ebc3', borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e3f6e8' },
  saveBtn: { backgroundColor: '#14b85a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  bottomActionWrap: { position: 'absolute', left: 16, right: 16, bottom: 8 },
  bigSaveBtn: { backgroundColor: '#14b85a', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  bigSaveText: { color: 'white', fontWeight: '800', fontSize: 18 },
});
