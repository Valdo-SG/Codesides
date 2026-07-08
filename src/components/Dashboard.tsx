import { useEffect, useState } from 'react'
import type { Summary } from '../types'
import { currentPeriod, formatCurrency, periodLabel } from '../format'

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const period = currentPeriod()

  useEffect(() => {
    window.api.reports.summary(period).then(setSummary)
  }, [refreshKey, period])

  if (!summary) return <div className="page">Cargando...</div>

  return (
    <div className="page">
      <header className="page-header">
        <h1>Resumen</h1>
        <p className="page-subtitle">{periodLabel(period)}</p>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Balance total</span>
          <span className="stat-value">{formatCurrency(summary.totalBalance)}</span>
        </div>
        <div className="stat-card stat-positive">
          <span className="stat-label">Ingresos del mes</span>
          <span className="stat-value">{formatCurrency(summary.income)}</span>
        </div>
        <div className="stat-card stat-negative">
          <span className="stat-label">Gastos del mes</span>
          <span className="stat-value">{formatCurrency(summary.expense)}</span>
        </div>
        <div className={summary.net >= 0 ? 'stat-card stat-positive' : 'stat-card stat-negative'}>
          <span className="stat-label">Balance del mes</span>
          <span className="stat-value">{formatCurrency(summary.net)}</span>
        </div>
      </section>

      <section className="panel">
        <h2>Cuentas</h2>
        {summary.accounts.length === 0 ? (
          <p className="empty-state">Todavía no creaste ninguna cuenta. Andá a la sección Cuentas para agregar una.</p>
        ) : (
          <ul className="account-list">
            {summary.accounts.map((a) => (
              <li key={a.id} className="account-list-item">
                <div>
                  <span className="account-name">{a.name}</span>
                  <span className="account-type">{a.type}</span>
                </div>
                <span className={a.balance >= 0 ? 'account-balance positive' : 'account-balance negative'}>
                  {formatCurrency(a.balance, a.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
