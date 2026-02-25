export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investment'
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Other';

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO
  createdAt: string; // ISO
};

export type MonthlyTotals = {
  income: number;
  expense: number;
  net: number;
};
