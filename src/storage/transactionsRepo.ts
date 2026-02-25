import * as SQLite from 'expo-sqlite';

import { Transaction, TransactionCategory, TransactionType } from '../domain/types';

const DB_NAME = 'frugeasy.db';
const TABLE = 'transactions';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initTransactionsRepo(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Migration for existing installations created before category column existed.
  try {
    await db.execAsync(`ALTER TABLE ${TABLE} ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';`);
  } catch {
    // ignore: column already exists
  }
}

export async function insertTransaction(input: {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  createdAt: string;
}): Promise<Transaction> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  await db.runAsync(
    `INSERT INTO ${TABLE} (id, amount, type, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.amount, input.type, input.category, input.date, input.createdAt]
  );

  return {
    id,
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date,
    createdAt: input.createdAt,
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Transaction>(
    `SELECT id, amount, type, COALESCE(category, 'Other') as category, date, createdAt FROM ${TABLE} ORDER BY createdAt DESC;`
  );
  return rows;
}
