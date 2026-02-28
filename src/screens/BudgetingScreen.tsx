import { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { CurrencyCode, Transaction, TransactionCategory } from '../domain/types';
import { formatCurrency } from '../ui/format';
import { getThemeColors, radii, spacing, typography } from '../ui/themeTokens';

type Props = {
  darkMode?: boolean;
  currency: CurrencyCode;
  budgets: { id: string; category: string; amount: number; monthKey: string }[];
  totals: { income: number; expense: number; net: number };
  budgetProgressRows: { category: string; budget: number; spent: number; usagePct: number }[];
  transactions: Transaction[];
  onSaveBudget: (category: TransactionCategory, amount: number) => Promise<void>;
  categoryOptions: TransactionCategory[];
};

const CHART_COLORS = ['#9fc5a8', '#7ab38a', '#5da678', '#4e9a82', '#6f9e9a', '#8fb0a0', '#98b99f', '#7fa58f'];

export function BudgetingScreen({ darkMode, currency, totals, budgetProgressRows, transactions }: Props) {
  const colors = getThemeColors(darkMode);
  const [expandedBudgetKey, setExpandedBudgetKey] = useState<string | null>(null);

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

    return [...base, ...withNoBudget].sort((a, b) => b.spent - a.spent);
  })();

  const chartData = displayedBudgetRows.filter((r) => r.spent > 0);
  const totalSpent = chartData.reduce((s, row) => s + row.spent, 0);
  const size = 148;
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.summaryRow, { borderColor: colors.border }]}> 
        {[['Income', totals.income], ['Spent', totals.expense], ['Net', totals.net]].map(([label, value]) => (
          <View key={label} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(Number(value), currency)}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.cardTitle, { color: colors.text }]}>Spending split</Text>
        <View style={styles.chartArea}>
          <Svg width={size} height={size}>
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              {totalSpent > 0 ? chartData.map((row, i) => {
                const frac = row.spent / totalSpent;
                const seg = c * frac;
                const dash = `${seg} ${c - seg}`;
                const off = -acc * c;
                acc += frac;
                return <Circle key={row.category} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={18} strokeDasharray={dash} strokeDashoffset={off} />;
              }) : <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.chartEmpty} strokeWidth={18} />}
            </G>
          </Svg>
          <View style={styles.legendWrap}>
            {chartData.slice(0, 6).map((row, i) => (
              <View key={row.category} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>{row.category}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {displayedBudgetRows.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>No budget data this month.</Text> : null}
        {displayedBudgetRows.map((row) => {
          const expanded = row.category === expandedBudgetKey;
          const recent = transactions
            .filter((t) => t.type === 'expense' && t.category === row.category)
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .slice(0, 4);

          return (
            <Pressable
              key={row.category}
              style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedBudgetKey(expanded ? null : row.category);
              }}
            >
              <View style={styles.itemHead}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{row.category}</Text>
                <Text style={[styles.itemAmount, { color: colors.text }]}> 
                  {row.budgetMissing ? formatCurrency(row.spent, currency) : `${formatCurrency(row.spent, currency)} / ${formatCurrency(row.budget, currency)}`}
                </Text>
              </View>

              {!row.budgetMissing ? (
                <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                  <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, row.usagePct))}%`, backgroundColor: row.usagePct > 100 ? colors.danger : colors.primary }]} />
                  <Text style={[styles.trackLabel, { color: row.usagePct > 60 ? '#fff' : colors.text }]}>{`${row.usagePct.toFixed(0)}% used`}</Text>
                </View>
              ) : null}

              {expanded ? (
                <View style={[styles.history, { borderColor: colors.border }]}> 
                  {recent.length === 0 ? <Text style={[styles.historyText, { color: colors.textMuted }]}>No recent transactions.</Text> : null}
                  {recent.map((t) => (
                    <View key={t.id} style={styles.historyRow}>
                      <Text style={[styles.historyText, { color: colors.text }]}>{t.name?.trim() ? t.name : '—'}</Text>
                      <Text style={[styles.historyText, { color: colors.text }]}>{formatCurrency(t.amount, currency)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: { flex: 1, borderRadius: radii.md, borderWidth: 1, padding: spacing.sm },
  summaryLabel: { fontSize: typography.caption, fontWeight: '600' },
  summaryValue: { marginTop: 4, fontSize: typography.body, fontWeight: '800' },
  chartCard: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  cardTitle: { fontSize: typography.section, fontWeight: '700', marginBottom: spacing.sm },
  chartArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legendWrap: { flex: 1, gap: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: typography.caption, fontWeight: '600' },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  item: { borderRadius: radii.md, borderWidth: 1, padding: spacing.sm, marginBottom: spacing.sm },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontWeight: '700', fontSize: typography.body },
  itemAmount: { fontWeight: '700', fontSize: typography.caption },
  track: { marginTop: spacing.xs, borderRadius: radii.pill, minHeight: 24, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  trackLabel: { textAlign: 'center', fontWeight: '700', fontSize: typography.caption },
  history: { marginTop: spacing.sm, borderTopWidth: 1, paddingTop: spacing.xs, gap: spacing.xs },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyText: { fontSize: typography.caption },
});
