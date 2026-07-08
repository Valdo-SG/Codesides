import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'

export type AccountType = 'efectivo' | 'banco' | 'tarjeta' | 'ahorro' | 'otro'
export type TransactionType = 'ingreso' | 'gasto' | 'transferencia'
export type CategoryKind = 'ingreso' | 'gasto'

export interface Account {
  id: string
  name: string
  type: AccountType
  initial_balance: number
  currency: string
  created_at: string
  balance: number
}

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  color: string
}

export interface Transaction {
  id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  date: string
  description: string
  transfer_account_id: string | null
  created_at: string
}

export interface Budget {
  id: string
  category_id: string
  period: string
  limit_amount: number
}

const DEFAULT_CATEGORIES: Array<{ name: string; kind: CategoryKind; color: string }> = [
  { name: 'Sueldo', kind: 'ingreso', color: '#2fae60' },
  { name: 'Otros ingresos', kind: 'ingreso', color: '#5cc98a' },
  { name: 'Alimentación', kind: 'gasto', color: '#e0633f' },
  { name: 'Transporte', kind: 'gasto', color: '#e0a13f' },
  { name: 'Vivienda', kind: 'gasto', color: '#c94f6d' },
  { name: 'Servicios', kind: 'gasto', color: '#8e5be0' },
  { name: 'Salud', kind: 'gasto', color: '#3f9ee0' },
  { name: 'Ocio', kind: 'gasto', color: '#e0d23f' },
  { name: 'Educación', kind: 'gasto', color: '#3fe0c4' },
  { name: 'Otros gastos', kind: 'gasto', color: '#9aa0ab' },
]

export class FinanceRepository {
  constructor(private db: Database.Database) {}

  // ---------- Accounts ----------
  listAccounts(): Account[] {
    const accounts = this.db.prepare('SELECT * FROM accounts ORDER BY created_at ASC').all() as Omit<Account, 'balance'>[]
    const balanceStmt = this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount
                          WHEN type = 'gasto' THEN -amount
                          WHEN type = 'transferencia' THEN -amount
                          ELSE 0 END), 0) AS delta
      FROM transactions WHERE account_id = ?
    `)
    const incomingTransferStmt = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
      WHERE transfer_account_id = ? AND type = 'transferencia'
    `)
    return accounts.map((a) => {
      const delta = (balanceStmt.get(a.id) as { delta: number }).delta
      const incoming = (incomingTransferStmt.get(a.id) as { total: number }).total
      return { ...a, balance: a.initial_balance + delta + incoming }
    })
  }

  createAccount(input: { name: string; type: AccountType; initial_balance: number; currency: string }): Account {
    const id = randomUUID()
    const created_at = new Date().toISOString()
    this.db
      .prepare('INSERT INTO accounts (id, name, type, initial_balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, input.name, input.type, input.initial_balance, input.currency, created_at)
    return { id, created_at, balance: input.initial_balance, ...input }
  }

  updateAccount(id: string, input: Partial<{ name: string; type: AccountType; initial_balance: number; currency: string }>) {
    const current = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined
    if (!current) throw new Error('Cuenta no encontrada')
    const merged = { ...current, ...input }
    this.db
      .prepare('UPDATE accounts SET name = ?, type = ?, initial_balance = ?, currency = ? WHERE id = ?')
      .run(merged.name, merged.type, merged.initial_balance, merged.currency, id)
    return this.listAccounts().find((a) => a.id === id)
  }

  deleteAccount(id: string) {
    this.db.prepare('DELETE FROM transactions WHERE account_id = ? OR transfer_account_id = ?').run(id, id)
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
    return { ok: true }
  }

  // ---------- Categories ----------
  listCategories(): Category[] {
    return this.db.prepare('SELECT * FROM categories ORDER BY kind ASC, name ASC').all() as Category[]
  }

  createCategory(input: { name: string; kind: CategoryKind; color: string }): Category {
    const id = randomUUID()
    this.db
      .prepare('INSERT INTO categories (id, name, kind, color) VALUES (?, ?, ?, ?)')
      .run(id, input.name, input.kind, input.color)
    return { id, ...input }
  }

  deleteCategory(id: string) {
    this.db.prepare('DELETE FROM budgets WHERE category_id = ?').run(id)
    this.db.prepare('UPDATE transactions SET category_id = NULL WHERE category_id = ?').run(id)
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { ok: true }
  }

  // ---------- Transactions ----------
  listTransactions(filters?: { accountId?: string; categoryId?: string; from?: string; to?: string }): Transaction[] {
    const clauses: string[] = []
    const params: unknown[] = []
    if (filters?.accountId) {
      clauses.push('account_id = ?')
      params.push(filters.accountId)
    }
    if (filters?.categoryId) {
      clauses.push('category_id = ?')
      params.push(filters.categoryId)
    }
    if (filters?.from) {
      clauses.push('date >= ?')
      params.push(filters.from)
    }
    if (filters?.to) {
      clauses.push('date <= ?')
      params.push(filters.to)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return this.db
      .prepare(`SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC`)
      .all(...params) as Transaction[]
  }

  createTransaction(input: {
    account_id: string
    category_id: string | null
    type: TransactionType
    amount: number
    date: string
    description: string
    transfer_account_id: string | null
  }): Transaction {
    const id = randomUUID()
    const created_at = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO transactions (id, account_id, category_id, type, amount, date, description, transfer_account_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.account_id,
        input.category_id,
        input.type,
        input.amount,
        input.date,
        input.description ?? '',
        input.transfer_account_id,
        created_at
      )
    return { id, created_at, ...input }
  }

  updateTransaction(id: string, input: Partial<Omit<Transaction, 'id' | 'created_at'>>) {
    const current = this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined
    if (!current) throw new Error('Transacción no encontrada')
    const merged = { ...current, ...input }
    this.db
      .prepare(
        `UPDATE transactions SET account_id = ?, category_id = ?, type = ?, amount = ?, date = ?, description = ?, transfer_account_id = ?
         WHERE id = ?`
      )
      .run(
        merged.account_id,
        merged.category_id,
        merged.type,
        merged.amount,
        merged.date,
        merged.description,
        merged.transfer_account_id,
        id
      )
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction
  }

  deleteTransaction(id: string) {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return { ok: true }
  }

  // ---------- Budgets ----------
  listBudgets(period: string): Array<Budget & { spent: number; category_name: string; category_color: string }> {
    const budgets = this.db.prepare('SELECT * FROM budgets WHERE period = ?').all(period) as Budget[]
    const spentStmt = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
      WHERE category_id = ? AND type = 'gasto' AND substr(date, 1, 7) = ?
    `)
    const categories = new Map(this.listCategories().map((c) => [c.id, c]))
    return budgets.map((b) => {
      const spent = (spentStmt.get(b.category_id, period) as { spent: number }).spent
      const category = categories.get(b.category_id)
      return { ...b, spent, category_name: category?.name ?? 'Sin categoría', category_color: category?.color ?? '#9aa0ab' }
    })
  }

  upsertBudget(input: { id?: string; category_id: string; period: string; limit_amount: number }) {
    const existing = this.db
      .prepare('SELECT * FROM budgets WHERE category_id = ? AND period = ?')
      .get(input.category_id, input.period) as Budget | undefined
    if (existing) {
      this.db.prepare('UPDATE budgets SET limit_amount = ? WHERE id = ?').run(input.limit_amount, existing.id)
      return { ...existing, limit_amount: input.limit_amount }
    }
    const id = randomUUID()
    this.db
      .prepare('INSERT INTO budgets (id, category_id, period, limit_amount) VALUES (?, ?, ?, ?)')
      .run(id, input.category_id, input.period, input.limit_amount)
    return { id, category_id: input.category_id, period: input.period, limit_amount: input.limit_amount }
  }

  deleteBudget(id: string) {
    this.db.prepare('DELETE FROM budgets WHERE id = ?').run(id)
    return { ok: true }
  }

  // ---------- Reports ----------
  getSummary(period: string) {
    const income = (
      this.db
        .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'ingreso' AND substr(date, 1, 7) = ?`)
        .get(period) as { total: number }
    ).total
    const expense = (
      this.db
        .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'gasto' AND substr(date, 1, 7) = ?`)
        .get(period) as { total: number }
    ).total
    const accounts = this.listAccounts()
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    return { income, expense, net: income - expense, totalBalance, accounts }
  }

  getExpensesByCategory(period: string) {
    const rows = this.db
      .prepare(
        `SELECT c.id AS category_id, c.name, c.color, COALESCE(SUM(t.amount), 0) AS total
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE t.type = 'gasto' AND substr(t.date, 1, 7) = ?
         GROUP BY c.id
         ORDER BY total DESC`
      )
      .all(period)
    return rows
  }

  getMonthlyTrend(months: number) {
    const rows = this.db
      .prepare(
        `SELECT substr(date, 1, 7) AS period,
                COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) AS expense
         FROM transactions
         GROUP BY period
         ORDER BY period DESC
         LIMIT ?`
      )
      .all(months)
    return rows.reverse()
  }
}

export function createDatabase(filePath: string): FinanceRepository {
  const db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ARS',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      transfer_account_id TEXT REFERENCES accounts(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      period TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      UNIQUE(category_id, period)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `)

  const categoryCount = (db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number }).count
  if (categoryCount === 0) {
    const insert = db.prepare('INSERT INTO categories (id, name, kind, color) VALUES (?, ?, ?, ?)')
    const seed = db.transaction(() => {
      for (const c of DEFAULT_CATEGORIES) {
        insert.run(randomUUID(), c.name, c.kind, c.color)
      }
    })
    seed()
  }

  return new FinanceRepository(db)
}
