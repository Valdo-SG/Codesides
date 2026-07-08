import { useEffect, useState } from 'react'
import Sidebar, { View } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Accounts from './components/Accounts'
import Transactions from './components/Transactions'
import Budgets from './components/Budgets'
import Reports from './components/Reports'
import type { Account, Category } from './types'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    window.api.accounts.list().then(setAccounts)
    window.api.categories.list().then(setCategories)
  }, [refreshKey])

  return (
    <div className="app-shell">
      <Sidebar current={view} onNavigate={setView} />
      <main className="app-content">
        {view === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {view === 'accounts' && <Accounts accounts={accounts} onChange={refresh} />}
        {view === 'transactions' && (
          <Transactions accounts={accounts} categories={categories} onChange={refresh} refreshKey={refreshKey} />
        )}
        {view === 'budgets' && <Budgets categories={categories} refreshKey={refreshKey} />}
        {view === 'reports' && <Reports refreshKey={refreshKey} />}
      </main>
    </div>
  )
}
