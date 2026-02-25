import { Transaction, TransactionCategory, TransactionType } from './types';
import { calculateMonthlyTotals } from './summary';

export type CategoryTotal = {
  category: TransactionCategory;
  total: number;
};

export type DailyPoint = {
  day: number;
  income: number;
  expense: number;
};

export type CategoryComparison = {
  category: TransactionCategory;
  current: number;
  previous: number;
  deltaPct: number;
};

export function getMonthLabel(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function categoryTotals(transactions: Transaction[], type: TransactionType): CategoryTotal[] {
  const map = new Map<TransactionCategory, number>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function weeklyBurn(expenseTotal: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return (expenseTotal / daysElapsed) * 7;
}

export function projectedMonthEnd(expenseTotal: number, daysElapsed: number, daysInMonth: number): number {
  if (daysElapsed <= 0) return expenseTotal;
  return (expenseTotal / daysElapsed) * daysInMonth;
}

export function largestTransactions(transactions: Transaction[], limit = 5): Transaction[] {
  return [...transactions].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export function unusualTransactions(transactions: Transaction[]): Transaction[] {
  if (transactions.length < 3) return [];
  const amounts = transactions.map((t) => t.amount).sort((a, b) => a - b);
  const median = amounts[Math.floor(amounts.length / 2)] ?? 0;
  if (median <= 0) return [];
  return transactions.filter((t) => t.amount >= median * 2).sort((a, b) => b.amount - a.amount);
}

export function dailySeries(transactions: Transaction[], year: number, monthIndex: number): DailyPoint[] {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const points: DailyPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const t of transactions) {
    const d = new Date(t.date);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== monthIndex) continue;
    const idx = d.getUTCDate() - 1;
    if (idx < 0 || idx >= points.length) continue;
    if (t.type === 'income') points[idx].income += t.amount;
    else points[idx].expense += t.amount;
  }

  return points;
}

export function categoryComparison(current: Transaction[], previous: Transaction[]): CategoryComparison[] {
  const cur = new Map<TransactionCategory, number>();
  const prev = new Map<TransactionCategory, number>();

  for (const t of current) cur.set(t.category, (cur.get(t.category) ?? 0) + t.amount);
  for (const t of previous) prev.set(t.category, (prev.get(t.category) ?? 0) + t.amount);

  const keys = new Set<TransactionCategory>([...cur.keys(), ...prev.keys()]);
  return [...keys]
    .map((category) => {
      const c = cur.get(category) ?? 0;
      const p = prev.get(category) ?? 0;
      return { category, current: c, previous: p, deltaPct: deltaPct(c, p) };
    })
    .sort((a, b) => b.current - a.current);
}

export function smartNudges(current: Transaction[], previous: Transaction[]): string[] {
  const c = calculateMonthlyTotals(current);
  const p = calculateMonthlyTotals(previous);

  const nudges: string[] = [];
  const expenseDelta = deltaPct(c.expense, p.expense);
  if (expenseDelta > 10) nudges.push(`Spending is up ${expenseDelta.toFixed(0)}% vs last month.`);
  if (expenseDelta < -10) nudges.push(`Nice! Spending is down ${Math.abs(expenseDelta).toFixed(0)}% vs last month.`);

  if (c.net > 0) nudges.push(`You are net positive this month by ${c.net.toFixed(2)}.`);
  if (c.net < 0) nudges.push(`You are net negative this month by ${Math.abs(c.net).toFixed(2)}.`);

  const topCategory = categoryTotals(current, 'expense')[0];
  if (topCategory) nudges.push(`Top expense category: ${topCategory.category} (${topCategory.total.toFixed(2)}).`);

  return nudges.slice(0, 4);
}
