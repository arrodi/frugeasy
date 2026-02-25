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

export type Budget = {
  id: string;
  category: TransactionCategory;
  amount: number;
  monthKey: string; // YYYY-MM
};

export type RecurringRule = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  dayOfMonth: number;
  label: string;
  active: boolean;
};
