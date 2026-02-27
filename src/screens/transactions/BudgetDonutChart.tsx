import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Budget, CurrencyCode } from '../../domain/types';
import { formatCurrency } from '../../ui/format';

type Props = {
  budgets: Budget[];
  currency: CurrencyCode;
  darkMode?: boolean;
  styles: any;
};

const CHART_COLORS = ['#ff6b6b', '#f59e0b', '#facc15', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#84cc16', '#06b6d4'];

function BudgetDonutChartImpl({ budgets, currency, darkMode, styles }: Props) {
  const size = 160;
  const r = 58;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  const { total, slices } = useMemo(() => {
    const nextTotal = budgets.reduce((s, b) => s + b.amount, 0);
    let cumulative = 0;
    const nextSlices = nextTotal > 0
      ? budgets.map((b, i) => {
        const frac = b.amount / nextTotal;
        const start = cumulative;
        const mid = start + frac / 2;
        cumulative += frac;
        return { b, i, frac, mid };
      })
      : [];

    return { total: nextTotal, slices: nextSlices };
  }, [budgets]);

  let acc = 0;

  return (
    <View style={styles.chartWrap}>
      <Text style={[styles.totalBudgetText, darkMode && styles.textDark]}>Total Budget: {formatCurrency(total, currency)}</Text>
      <Svg width={size + 220} height={size + 80}>
        <G x={110} y={30}>
          <G rotation={-90} origin={`${center}, ${center}`}>
            {total > 0
              ? budgets.map((b, i) => {
                const frac = b.amount / total;
                const seg = c * frac;
                const dash = `${seg} ${c - seg}`;
                const off = -acc * c;
                acc += frac;
                return <Circle key={b.id} cx={center} cy={center} r={r} fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={20} strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt" />;
              })
              : <Circle cx={center} cy={center} r={r} fill="none" stroke={darkMode ? '#2e4d3b' : '#d1fae5'} strokeWidth={20} />}
          </G>
          {slices.map(({ b, i, frac, mid }) => {
            const angle = mid * Math.PI * 2 - Math.PI / 2;
            const x1 = center + Math.cos(angle) * (r + 10);
            const y1 = center + Math.sin(angle) * (r + 10);
            const x2 = center + Math.cos(angle) * (r + 28);
            const y2 = center + Math.sin(angle) * (r + 28);
            const right = Math.cos(angle) >= 0;
            const x3 = x2 + (right ? 24 : -24);
            const shortCategory = b.category.length > 10 ? `${b.category.slice(0, 10)}…` : b.category;
            const label = `${shortCategory} ${(frac * 100).toFixed(0)}%`;

            return (
              <G key={`callout-${b.id}`}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={1.5} />
                <Line x1={x2} y1={y2} x2={x3} y2={y2} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={1.5} />
                <SvgText x={x3 + (right ? 4 : -4)} y={y2 + 4} fontSize={10} fill={darkMode ? '#d6f5df' : '#14532d'} textAnchor={right ? 'start' : 'end'}>
                  {label}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

export const BudgetDonutChart = memo(BudgetDonutChartImpl);
