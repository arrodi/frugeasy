import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryComparison, CategoryTotal, DailyPoint, getMonthLabel } from '../domain/analysis';
import { Transaction } from '../domain/types';
import { formatCurrency } from '../ui/format';

type Props = {
  year: number;
  monthIndex: number;
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
  expenseCategoryTotals: CategoryTotal[];
  incomeCategoryTotals: CategoryTotal[];
  categoryCompareRows: CategoryComparison[];
  dailyPoints: DailyPoint[];
  weeklyBurnRate: number;
  projectedExpense: number;
  largestTransactions: Transaction[];
  unusualTransactions: Transaction[];
  nudges: string[];
};

function MiniBars({ points }: { points: DailyPoint[] }) {
  const recent = points.slice(-14);
  const max = Math.max(1, ...recent.map((p) => Math.max(p.income, p.expense)));
  return (
    <View style={styles.chartWrap}>
      {recent.map((p) => (
        <View key={p.day} style={styles.dayCol}>
          <View style={[styles.barIncome, { height: Math.max(2, (p.income / max) * 42) }]} />
          <View style={[styles.barExpense, { height: Math.max(2, (p.expense / max) * 42) }]} />
          <Text style={styles.dayLabel}>{p.day}</Text>
        </View>
      ))}
    </View>
  );
}

export function MonthlySummaryScreen({
  year,
  monthIndex,
  totals,
  previousTotals,
  analysisMode,
  onToggleAnalysisMode,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth,
  expenseCategoryTotals,
  incomeCategoryTotals,
  categoryCompareRows,
  dailyPoints,
  weeklyBurnRate,
  projectedExpense,
  largestTransactions,
  unusualTransactions,
  nudges,
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

      <Pressable style={styles.actionBtn} onPress={onToggleAnalysisMode}>
        <Text style={styles.actionBtnText}>{analysisMode ? 'Hide analysis' : 'Analyze'}</Text>
      </Pressable>

      {analysisMode ? (
        <View style={styles.analysisWrap}>
          <Text style={styles.analysisTitle}>Dashboard</Text>
          <Text style={styles.note}>Previous month expense: {formatCurrency(previousTotals.expense)}</Text>
          <Text style={styles.note}>Weekly burn rate: {formatCurrency(weeklyBurnRate)}</Text>
          <Text style={styles.note}>Projected month-end expense: {formatCurrency(projectedExpense)}</Text>

          <Text style={styles.subTitle}>Time series (last 14 days)</Text>
          <MiniBars points={dailyPoints} />

          {nudges.map((nudge) => (
            <Text key={nudge} style={styles.nudge}>• {nudge}</Text>
          ))}

          <Text style={styles.subTitle}>Category comparison table</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.4 }]}>Category</Text>
            <Text style={styles.th}>Current</Text>
            <Text style={styles.th}>Prev</Text>
            <Text style={styles.th}>Δ%</Text>
          </View>
          {categoryCompareRows.slice(0, 8).map((row) => (
            <View key={row.category} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.4 }]}>{row.category}</Text>
              <Text style={styles.td}>{formatCurrency(row.current)}</Text>
              <Text style={styles.td}>{formatCurrency(row.previous)}</Text>
              <Text style={[styles.td, row.deltaPct > 0 ? styles.deltaUp : styles.deltaDown]}>
                {row.deltaPct.toFixed(0)}%
              </Text>
            </View>
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
  actionBtn: {
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
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingVertical: 6,
  },
  dayCol: { alignItems: 'center', width: 14 },
  barIncome: { width: 5, backgroundColor: '#1f8b63', borderRadius: 2 },
  barExpense: { width: 5, backgroundColor: '#536c90', borderRadius: 2, marginTop: 2 },
  dayLabel: { fontSize: 8, color: '#6b7f78', marginTop: 2 },
  tableHeader: { flexDirection: 'row', paddingTop: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#d8e5df' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e8f0ec' },
  th: { flex: 1, color: '#35544c', fontWeight: '700', fontSize: 12 },
  td: { flex: 1, color: '#49635d', fontSize: 12 },
  deltaUp: { color: '#9b3a3a', fontWeight: '700' },
  deltaDown: { color: '#2f7a53', fontWeight: '700' },
});
