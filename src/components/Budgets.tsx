import { useEffect, useState } from 'react'
import type { Budget, Category } from '../types'
import { currentPeriod, formatCurrency, periodLabel } from '../format'

export default function Budgets({ categories, refreshKey }: { categories: Category[]; refreshKey: number }) {
  const [period, setPeriod] = useState(currentPeriod())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')
  const [localRefresh, setLocalRefresh] = useState(0)

  const expenseCategories = categories.filter((c) => c.kind === 'gasto')

  useEffect(() => {
    window.api.budgets.list(period).then(setBudgets)
  }, [period, refreshKey, localRefresh])

  useEffect(() => {
    if (!categoryId && expenseCategories.length > 0) setCategoryId(expenseCategories[0].id)
  }, [categories])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const limitAmount = Number(limit)
    if (!categoryId || !limitAmount || limitAmount <= 0) return
    await window.api.budgets.upsert({ category_id: categoryId, period, limit_amount: limitAmount })
    setLimit('')
    setLocalRefresh((k) => k + 1)
  }

  const remove = async (id: string) => {
    await window.api.budgets.delete(id)
    setLocalRefresh((k) => k + 1)
  }

  const shiftMonth = (delta: number) => {
    const [y, m] = period.split('-').map(Number)
    const date = new Date(y, m - 1 + delta, 1)
    setPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Presupuestos</h1>
        <p className="page-subtitle">Límites de gasto por categoría</p>
      </header>

      <section className="panel">
        <div className="panel-header-row">
          <h2>Período</h2>
          <div className="period-nav">
            <button className="btn-icon" onClick={() => shiftMonth(-1)}>
              ←
            </button>
            <span>{periodLabel(period)}</span>
            <button className="btn-icon" onClick={() => shiftMonth(1)}>
              →
            </button>
          </div>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Categoría
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Límite mensual
            <input type="number" step="0.01" min="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Guardar presupuesto
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Progreso del mes</h2>
        {budgets.length === 0 ? (
          <p className="empty-state">Todavía no definiste presupuestos para este período.</p>
        ) : (
          <ul className="budget-list">
            {budgets.map((b) => {
              const pct = Math.min(100, (b.spent / b.limit_amount) * 100)
              const over = b.spent > b.limit_amount
              return (
                <li key={b.id} className="budget-item">
                  <div className="budget-item-header">
                    <span>
                      <span className="dot" style={{ backgroundColor: b.category_color }} />
                      {b.category_name}
                    </span>
                    <span>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit_amount)}
                    </span>
                    <button className="btn-icon" onClick={() => remove(b.id)} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                  <div className="progress-track">
                    <div
                      className={over ? 'progress-fill over' : 'progress-fill'}
                      style={{ width: `${pct}%`, backgroundColor: over ? undefined : b.category_color }}
                    />
                  </div>
                  {over && <span className="budget-warning">Superaste el límite en {formatCurrency(b.spent - b.limit_amount)}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
