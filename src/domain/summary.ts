import { MonthlyTotals, Transaction } from './types';

export function isInMonth(isoDate: string, year: number, monthIndex: number): boolean {
  const d = new Date(isoDate);
  return d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex;
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  year: number,
  monthIndex: number
): Transaction[] {
  return transactions.filter((t) => isInMonth(t.date, year, monthIndex));
}

export function calculateMonthlyTotals(transactions: Transaction[]): MonthlyTotals {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    net: income - expense,
  };
}
