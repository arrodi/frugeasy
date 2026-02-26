import * as SQLite from 'expo-sqlite';

import {
  Budget,
  RecurringRule,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../domain/types';

const DB_NAME = 'frugeasy.db';
const TX_TABLE = 'transactions';
const BUDGET_TABLE = 'budgets';
const RECURRING_TABLE = 'recurring_rules';
const SETTINGS_TABLE = 'app_settings';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export async function initTransactionsRepo(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TX_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      name TEXT NOT NULL DEFAULT 'Untitled',
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${BUDGET_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      monthKey TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${RECURRING_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      dayOfMonth INTEGER NOT NULL,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  try {
    await db.execAsync(`ALTER TABLE ${TX_TABLE} ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';`);
  } catch {
    // column exists
  }
  try {
    await db.execAsync(`ALTER TABLE ${TX_TABLE} ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled';`);
  } catch {
    // column exists
  }
}

export async function insertTransaction(input: {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  name: string;
  date: string;
  createdAt: string;
}): Promise<Transaction> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  await db.runAsync(
    `INSERT INTO ${TX_TABLE} (id, amount, type, category, name, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, input.amount, input.type, input.category, input.name, input.date, input.createdAt]
  );
  return { id, ...input };
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    `SELECT id, amount, type, COALESCE(category, 'Other') as category, COALESCE(name, 'Untitled') as name, date, createdAt FROM ${TX_TABLE} ORDER BY createdAt DESC;`
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TX_TABLE} WHERE id = ?;`, [id]);
}

export async function updateTransaction(input: {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  name: string;
  date: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE ${TX_TABLE} SET amount = ?, type = ?, category = ?, name = ?, date = ? WHERE id = ?;`,
    [input.amount, input.type, input.category, input.name, input.date, input.id]
  );
}

export async function upsertBudget(input: {
  category: TransactionCategory;
  amount: number;
  monthKey: string;
}): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${BUDGET_TABLE} WHERE category = ? AND monthKey = ? LIMIT 1;`,
    [input.category, input.monthKey]
  );

  if (existing?.id) {
    await db.runAsync(`UPDATE ${BUDGET_TABLE} SET amount = ? WHERE id = ?;`, [input.amount, existing.id]);
  } else {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    await db.runAsync(
      `INSERT INTO ${BUDGET_TABLE} (id, category, amount, monthKey) VALUES (?, ?, ?, ?);`,
      [id, input.category, input.amount, input.monthKey]
    );
  }
}

export async function listBudgets(monthKey: string): Promise<Budget[]> {
  const db = await getDb();
  return db.getAllAsync<Budget>(
    `SELECT id, category, amount, monthKey FROM ${BUDGET_TABLE} WHERE monthKey = ? ORDER BY category ASC;`,
    [monthKey]
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${BUDGET_TABLE} WHERE id = ?;`, [id]);
}

export async function insertRecurringRule(input: {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  dayOfMonth: number;
  label: string;
}): Promise<void> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  await db.runAsync(
    `INSERT INTO ${RECURRING_TABLE} (id, type, category, amount, dayOfMonth, label, active) VALUES (?, ?, ?, ?, ?, ?, 1);`,
    [id, input.type, input.category, input.amount, input.dayOfMonth, input.label]
  );
}

type RecurringRuleRow = Omit<RecurringRule, 'active'> & { active: number };

export async function listRecurringRules(): Promise<RecurringRule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RecurringRuleRow>(
    `SELECT id, type, category, amount, dayOfMonth, label, active FROM ${RECURRING_TABLE} ORDER BY dayOfMonth ASC;`
  );
  return rows.map((r) => ({ ...r, active: Boolean(r.active) }));
}

export async function toggleRecurringRule(id: string, active: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE ${RECURRING_TABLE} SET active = ? WHERE id = ?;`, [active ? 1 : 0, id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM ${SETTINGS_TABLE} WHERE key = ? LIMIT 1;`,
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ${SETTINGS_TABLE} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value]
  );
}

export async function applyRecurringRulesForMonth(year: number, monthIndex: number): Promise<void> {
  const db = await getDb();
  const rules = await db.getAllAsync<RecurringRuleRow>(
    `SELECT id, type, category, amount, dayOfMonth, label, active FROM ${RECURRING_TABLE} WHERE active = 1;`
  );

  for (const rule of rules) {
    const day = Math.max(1, Math.min(28, rule.dayOfMonth));
    const date = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
    const dateIso = date.toISOString();
    const exists = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${TX_TABLE} WHERE type = ? AND category = ? AND amount = ? AND date = ? LIMIT 1;`,
      [rule.type, rule.category, rule.amount, dateIso]
    );
    if (exists?.id) continue;

    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    await db.runAsync(
      `INSERT INTO ${TX_TABLE} (id, amount, type, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?);`,
      [id, rule.amount, rule.type, rule.category, dateIso, new Date().toISOString()]
    );
  }
}
