import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMonthLabel } from '../domain/analysis';
import { formatCurrency } from '../ui/format';

type Props = {
  darkMode?: boolean;
  currency: string;
  budgetProgressRows: { category: string; budget: number; spent: number; usagePct: number }[];
  year: number;
  monthIndex: number;
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  analysisMode: boolean;
  onToggleAnalysisMode: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNextMonth: boolean;
};

export function MonthlySummaryScreen({
  darkMode,
  currency,
  budgetProgressRows,
  year,
  monthIndex,
  totals,
  analysisMode,
  onToggleAnalysisMode,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth,
}: Props) {
  const monthLabel = getMonthLabel(year, monthIndex);

  return (
    <ScrollView style={[styles.screenContainer, darkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.monthRow}>
        <Pressable style={styles.monthNavBtn} onPress={onPrevMonth}><Text style={styles.monthNavBtnText}>←</Text></Pressable>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>{monthLabel}</Text>
        <Pressable style={[styles.monthNavBtn, !canGoNextMonth && styles.monthNavBtnDisabled]} onPress={onNextMonth} disabled={!canGoNextMonth}><Text style={styles.monthNavBtnText}>→</Text></Pressable>
      </View>

      <View style={[styles.card, darkMode && styles.cardDark]}><Text style={[styles.cardLabel, darkMode && styles.textDark]} >Income</Text><Text style={[styles.cardValue, styles.income]}>{formatCurrency(totals.income, currency)}</Text></View>
      <View style={[styles.card, darkMode && styles.cardDark]}><Text style={[styles.cardLabel, darkMode && styles.textDark]}>Expenditure</Text><Text style={[styles.cardValue, styles.expense]}>{formatCurrency(totals.expense, currency)}</Text></View>
      <View style={[styles.card, darkMode && styles.cardDark]}><Text style={[styles.cardLabel, darkMode && styles.textDark]}>Net</Text><Text style={[styles.cardValue, styles.net]}>{formatCurrency(totals.net, currency)}</Text></View>

      <Pressable style={styles.actionBtn} onPress={onToggleAnalysisMode}>
        <Text style={styles.actionBtnText}>{analysisMode ? 'Hide analysis' : 'Analyze'}</Text>
      </Pressable>

      {analysisMode ? (
        <View style={[styles.analysisWrap, darkMode && styles.cardDark]}>
          <Text style={[styles.analysisTitle, darkMode && styles.textDark]}>Expenditure vs Budget by Category</Text>
          <View style={[styles.tableHeader, darkMode && styles.tableHeaderDark]}>
            <Text style={[styles.th, darkMode && styles.textDark, { flex: 1.4 }]}>Category</Text>
            <Text style={[styles.th, darkMode && styles.textDark]}>Spent</Text>
            <Text style={[styles.th, darkMode && styles.textDark]}>Budget</Text>
            <Text style={[styles.th, darkMode && styles.textDark]}>Use</Text>
          </View>
          {budgetProgressRows.length === 0 ? <Text style={[styles.note, darkMode && styles.textDark]}>No budgets set yet.</Text> : null}
          {budgetProgressRows.map((row) => (
            <View key={`b-${row.category}`} style={[styles.tableRowBlock, darkMode && styles.tableRowBlockDark]}>
              <View style={styles.tableRow}>
                <Text style={[styles.td, darkMode && styles.textDark, { flex: 1.4 }]}>{row.category}</Text>
                <Text style={[styles.td, darkMode && styles.textDark]}>{formatCurrency(row.spent, currency)}</Text>
                <Text style={[styles.td, darkMode && styles.textDark]}>{formatCurrency(row.budget, currency)}</Text>
                <Text style={[styles.td, row.usagePct > 100 ? styles.deltaUp : styles.deltaDown]}>{row.usagePct.toFixed(0)}%</Text>
              </View>
              <View style={[styles.progressTrack, darkMode && styles.progressTrackDark]}>
                <View style={[styles.progressFill, darkMode && styles.progressFillDark, { width: `${Math.min(100, Math.max(0, row.usagePct))}%` }, row.usagePct > 100 && styles.progressOver]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  screenDark: { backgroundColor: '#0f1a14' },
  cardDark: { backgroundColor: '#15251c', borderColor: '#2e4d3b' },
  textDark: { color: '#d6f5df' },
  contentContainer: { paddingHorizontal: 16, gap: 10, paddingTop: 4, paddingBottom: 24 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  monthNavBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eaf2ef', borderWidth: 1, borderColor: '#d2e2dc', alignItems: 'center', justifyContent: 'center' },
  monthNavBtnDisabled: { opacity: 0.45 },
  monthNavBtnText: { color: '#35544c', fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f3b35' },
  card: { backgroundColor: '#eef5f2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#d2e2dc' },
  cardLabel: { color: '#49635d', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#1f3b35' },
  income: { color: '#1f8b63' },
  expense: { color: '#536c90' },
  net: { color: '#355f53' },
  actionBtn: { backgroundColor: '#355f53', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: 'white', fontWeight: '700' },
  analysisWrap: { backgroundColor: '#f6faf8', borderWidth: 1, borderColor: '#d2e2dc', borderRadius: 14, padding: 12, gap: 6 },
  analysisTitle: { fontSize: 15, fontWeight: '800', color: '#1f3b35' },
  note: { color: '#49635d' },
  tableHeader: { flexDirection: 'row', paddingTop: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#d8e5df' },
  tableHeaderDark: { borderBottomColor: '#2e4d3b' },
  tableRowBlock: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e8f0ec' },
  tableRowBlockDark: { borderBottomColor: '#294235' },
  tableRow: { flexDirection: 'row', paddingVertical: 2 },
  progressTrack: { height: 8, backgroundColor: '#dcefe3', borderRadius: 999, overflow: 'hidden', marginTop: 4 },
  progressTrackDark: { backgroundColor: '#243b30' },
  progressFill: { height: '100%', backgroundColor: '#16a34a' },
  progressFillDark: { backgroundColor: '#22c55e' },
  progressOver: { backgroundColor: '#dc2626' },
  th: { flex: 1, color: '#35544c', fontWeight: '700', fontSize: 12 },
  td: { flex: 1, color: '#49635d', fontSize: 12 },
  deltaUp: { color: '#9b3a3a', fontWeight: '700' },
  deltaDown: { color: '#2f7a53', fontWeight: '700' },
});
