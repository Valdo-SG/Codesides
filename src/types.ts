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
  spent: number
  category_name: string
  category_color: string
}

export interface Summary {
  income: number
  expense: number
  net: number
  totalBalance: number
  accounts: Account[]
}

export interface CategoryExpense {
  category_id: string
  name: string
  color: string
  total: number
}

export interface MonthlyTrend {
  period: string
  income: number
  expense: number
}

export interface FinanceApi {
  accounts: {
    list: () => Promise<Account[]>
    create: (input: Omit<Account, 'id' | 'created_at' | 'balance'>) => Promise<Account>
    update: (id: string, input: Partial<Omit<Account, 'id' | 'created_at' | 'balance'>>) => Promise<Account>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  categories: {
    list: () => Promise<Category[]>
    create: (input: Omit<Category, 'id'>) => Promise<Category>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  transactions: {
    list: (filters?: { accountId?: string; categoryId?: string; from?: string; to?: string }) => Promise<Transaction[]>
    create: (input: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>
    update: (id: string, input: Partial<Omit<Transaction, 'id' | 'created_at'>>) => Promise<Transaction>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  budgets: {
    list: (period: string) => Promise<Budget[]>
    upsert: (input: { id?: string; category_id: string; period: string; limit_amount: number }) => Promise<unknown>
    delete: (id: string) => Promise<{ ok: boolean }>
  }
  reports: {
    summary: (period: string) => Promise<Summary>
    byCategory: (period: string) => Promise<CategoryExpense[]>
    monthly: (months: number) => Promise<MonthlyTrend[]>
  }
}

declare global {
  interface Window {
    api: FinanceApi
  }
}
