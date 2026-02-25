export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO
  createdAt: string; // ISO
};

export type MonthlyTotals = {
  income: number;
  expense: number;
  net: number;
};
