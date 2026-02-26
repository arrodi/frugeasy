import {
  categoryComparison,
  categoryTotals,
  dailySeries,
  deltaPct,
  projectedMonthEnd,
  smartNudges,
  weeklyBurn,
} from './analysis';
import { Transaction } from './types';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: overrides.id ?? '1',
  amount: overrides.amount ?? 0,
  type: overrides.type ?? 'expense',
  category: overrides.category ?? 'Other',
  name: overrides.name ?? 'Test',
  date: overrides.date ?? '2026-02-01T00:00:00.000Z',
  createdAt: overrides.createdAt ?? '2026-02-01T00:00:00.000Z',
});

describe('analysis helpers', () => {
  it('computes category totals sorted desc', () => {
    const totals = categoryTotals(
      [
        tx({ type: 'expense', category: 'Food', amount: 10 }),
        tx({ type: 'expense', category: 'Food', amount: 5 }),
        tx({ type: 'expense', category: 'Transport', amount: 20 }),
      ],
      'expense'
    );
    expect(totals[0]).toEqual({ category: 'Transport', total: 20 });
    expect(totals[1]).toEqual({ category: 'Food', total: 15 });
  });

  it('computes weekly burn and projection', () => {
    expect(weeklyBurn(700, 7)).toBe(700);
    expect(projectedMonthEnd(100, 5, 30)).toBe(600);
  });

  it('returns sensible delta percentages', () => {
    expect(deltaPct(200, 100)).toBe(100);
    expect(deltaPct(0, 0)).toBe(0);
  });

  it('creates daily series and category comparison', () => {
    const current = [
      tx({ date: '2026-02-01T00:00:00.000Z', type: 'expense', category: 'Food', amount: 20 }),
      tx({ date: '2026-02-01T00:00:00.000Z', type: 'income', category: 'Salary', amount: 100 }),
      tx({ date: '2026-02-03T00:00:00.000Z', type: 'expense', category: 'Transport', amount: 10 }),
    ];
    const previous = [tx({ date: '2026-01-02T00:00:00.000Z', type: 'expense', category: 'Food', amount: 10 })];

    const series = dailySeries(current, 2026, 1);
    expect(series[0].expense).toBe(20);
    expect(series[0].income).toBe(100);

    const comparison = categoryComparison(current, previous);
    expect(comparison.length).toBeGreaterThan(0);
  });

  it('creates nudges', () => {
    const current = [tx({ type: 'expense', category: 'Food', amount: 200 }), tx({ type: 'income', amount: 500, category: 'Salary' })];
    const previous = [tx({ type: 'expense', amount: 100 })];
    const nudges = smartNudges(current, previous);
    expect(nudges.length).toBeGreaterThan(0);
  });
});
