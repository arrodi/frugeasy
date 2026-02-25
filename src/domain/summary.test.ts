import { calculateMonthlyTotals, filterTransactionsByMonth } from './summary';
import { Transaction } from './types';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: overrides.id ?? '1',
  amount: overrides.amount ?? 0,
  type: overrides.type ?? 'expense',
  category: overrides.category ?? 'Other',
  date: overrides.date ?? '2026-02-01T00:00:00.000Z',
  createdAt: overrides.createdAt ?? '2026-02-01T00:00:00.000Z',
});

describe('filterTransactionsByMonth', () => {
  it('keeps only transactions in requested UTC month', () => {
    const data: Transaction[] = [
      tx({ id: 'a', date: '2026-02-01T10:00:00.000Z' }),
      tx({ id: 'b', date: '2026-02-28T22:00:00.000Z' }),
      tx({ id: 'c', date: '2026-03-01T00:00:00.000Z' }),
    ];

    const filtered = filterTransactionsByMonth(data, 2026, 1);
    expect(filtered.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('calculateMonthlyTotals', () => {
  it('computes income, expense, and net correctly', () => {
    const data: Transaction[] = [
      tx({ type: 'income', amount: 1000 }),
      tx({ type: 'income', amount: 250.5 }),
      tx({ type: 'expense', amount: 100 }),
      tx({ type: 'expense', amount: 25.25 }),
    ];

    const totals = calculateMonthlyTotals(data);
    expect(totals.income).toBeCloseTo(1250.5);
    expect(totals.expense).toBeCloseTo(125.25);
    expect(totals.net).toBeCloseTo(1125.25);
  });

  it('returns zeros for empty data', () => {
    const totals = calculateMonthlyTotals([]);
    expect(totals).toEqual({ income: 0, expense: 0, net: 0 });
  });
});
