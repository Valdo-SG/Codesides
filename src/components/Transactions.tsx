import { useEffect, useState } from 'react'
import type { Account, Category, Transaction, TransactionType } from '../types'
import { formatCurrency, formatDate, todayIso } from '../format'

const emptyForm = {
  type: 'gasto' as TransactionType,
  account_id: '',
  category_id: '',
  transfer_account_id: '',
  amount: '',
  date: todayIso(),
  description: '',
}

export default function Transactions({
  accounts,
  categories,
  onChange,
  refreshKey,
}: {
  accounts: Account[]
  categories: Category[]
  onChange: () => void
  refreshKey: number
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState(emptyForm)
  const [filterAccount, setFilterAccount] = useState('')

  useEffect(() => {
    window.api.transactions.list(filterAccount ? { accountId: filterAccount } : undefined).then(setTransactions)
  }, [refreshKey, filterAccount])

  useEffect(() => {
    if (!form.account_id && accounts.length > 0) {
      setForm((f) => ({ ...f, account_id: accounts[0].id }))
    }
  }, [accounts])

  const availableCategories = categories.filter((c) => (form.type === 'ingreso' ? c.kind === 'ingreso' : c.kind === 'gasto'))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.account_id || !amount || amount <= 0) return
    if (form.type === 'transferencia' && (!form.transfer_account_id || form.transfer_account_id === form.account_id)) return

    await window.api.transactions.create({
      account_id: form.account_id,
      category_id: form.type === 'transferencia' ? null : form.category_id || null,
      type: form.type,
      amount,
      date: form.date,
      description: form.description,
      transfer_account_id: form.type === 'transferencia' ? form.transfer_account_id : null,
    })
    setForm({ ...emptyForm, account_id: form.account_id, date: form.date })
    onChange()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return
    await window.api.transactions.delete(id)
    onChange()
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? '—'
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="page">
      <header className="page-header">
        <h1>Transacciones</h1>
        <p className="page-subtitle">Ingresos, gastos y transferencias entre cuentas</p>
      </header>

      <section className="panel">
        <h2>Nueva transacción</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType, category_id: '' })}>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <label>
            Cuenta {form.type === 'transferencia' ? 'origen' : ''}
            <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} required>
              <option value="" disabled>
                Seleccioná una cuenta
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          {form.type === 'transferencia' ? (
            <label>
              Cuenta destino
              <select value={form.transfer_account_id} onChange={(e) => setForm({ ...form, transfer_account_id: e.target.value })} required>
                <option value="" disabled>
                  Seleccioná una cuenta
                </option>
                {accounts
                  .filter((a) => a.id !== form.account_id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <label>
              Categoría
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sin categoría</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Monto
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </label>
          <label>
            Fecha
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>
          <label className="form-grid-wide">
            Descripción
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Agregar
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2>Historial</h2>
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        {transactions.length === 0 ? (
          <p className="empty-state">No hay transacciones para mostrar.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cuenta</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    <span className={`badge badge-${t.type}`}>{t.type}</span>
                  </td>
                  <td>
                    {accountName(t.account_id)}
                    {t.type === 'transferencia' && t.transfer_account_id ? ` → ${accountName(t.transfer_account_id)}` : ''}
                  </td>
                  <td>{t.type === 'transferencia' ? '—' : categoryName(t.category_id)}</td>
                  <td>{t.description || '—'}</td>
                  <td className={t.type === 'ingreso' ? 'amount positive' : t.type === 'gasto' ? 'amount negative' : 'amount'}>
                    {t.type === 'ingreso' ? '+' : t.type === 'gasto' ? '-' : ''}
                    {formatCurrency(t.amount)}
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => remove(t.id)} title="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
