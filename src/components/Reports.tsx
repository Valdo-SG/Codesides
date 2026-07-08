import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import type { CategoryExpense, MonthlyTrend } from '../types'
import { currentPeriod, formatCurrency, periodLabel } from '../format'

export default function Reports({ refreshKey }: { refreshKey: number }) {
  const [period, setPeriod] = useState(currentPeriod())
  const [byCategory, setByCategory] = useState<CategoryExpense[]>([])
  const [monthly, setMonthly] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    window.api.reports.byCategory(period).then(setByCategory)
  }, [period, refreshKey])

  useEffect(() => {
    window.api.reports.monthly(6).then(setMonthly)
  }, [refreshKey])

  const shiftMonth = (delta: number) => {
    const [y, m] = period.split('-').map(Number)
    const date = new Date(y, m - 1 + delta, 1)
    setPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const totalExpense = byCategory.reduce((sum, c) => sum + c.total, 0)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Reportes</h1>
        <p className="page-subtitle">Visualizá tus hábitos de gasto</p>
      </header>

      <section className="panel">
        <div className="panel-header-row">
          <h2>Gastos por categoría</h2>
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
        {byCategory.length === 0 ? (
          <p className="empty-state">No hay gastos registrados en este período.</p>
        ) : (
          <div className="chart-row">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {byCategory.map((c) => (
                    <Cell key={c.category_id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend-list">
              {byCategory.map((c) => (
                <li key={c.category_id}>
                  <span className="dot" style={{ backgroundColor: c.color }} />
                  <span className="legend-name">{c.name}</span>
                  <span className="legend-value">{formatCurrency(c.total)}</span>
                  <span className="legend-pct">{totalExpense ? Math.round((c.total / totalExpense) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Ingresos vs. gastos (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
            <XAxis dataKey="period" stroke="#8b93a3" />
            <YAxis stroke="#8b93a3" />
            <Tooltip formatter={(value: unknown) => formatCurrency(Number(value ?? 0))} />
            <Legend />
            <Bar dataKey="income" name="Ingresos" fill="#2fae60" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Gastos" fill="#e0633f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
