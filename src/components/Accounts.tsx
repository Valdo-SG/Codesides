import { useState } from 'react'
import type { Account, AccountType } from '../types'
import { formatCurrency } from '../format'

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'banco', label: 'Cuenta bancaria' },
  { value: 'tarjeta', label: 'Tarjeta de crédito' },
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'otro', label: 'Otro' },
]

const emptyForm = { name: '', type: 'banco' as AccountType, initial_balance: '0', currency: 'ARS' }

export default function Accounts({ accounts, onChange }: { accounts: Account[]; onChange: () => void }) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const startEdit = (a: Account) => {
    setEditingId(a.id)
    setForm({ name: a.name, type: a.type, initial_balance: String(a.initial_balance), currency: a.currency })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      type: form.type,
      initial_balance: Number(form.initial_balance) || 0,
      currency: form.currency.trim() || 'ARS',
    }
    if (editingId) {
      await window.api.accounts.update(editingId, payload)
    } else {
      await window.api.accounts.create(payload)
    }
    resetForm()
    onChange()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta? También se borrarán sus transacciones asociadas.')) return
    await window.api.accounts.delete(id)
    onChange()
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Cuentas</h1>
        <p className="page-subtitle">Efectivo, bancos, tarjetas y ahorros</p>
      </header>

      <section className="panel">
        <h2>{editingId ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Banco Galicia" required />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saldo inicial
            <input
              type="number"
              step="0.01"
              value={form.initial_balance}
              onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
            />
          </label>
          <label>
            Moneda
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={3} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Guardar cambios' : 'Agregar cuenta'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Todas las cuentas</h2>
        {accounts.length === 0 ? (
          <p className="empty-state">Todavía no hay cuentas creadas.</p>
        ) : (
          <ul className="account-list">
            {accounts.map((a) => (
              <li key={a.id} className="account-list-item">
                <div>
                  <span className="account-name">{a.name}</span>
                  <span className="account-type">{ACCOUNT_TYPES.find((t) => t.value === a.type)?.label ?? a.type}</span>
                </div>
                <div className="row-actions">
                  <span className={a.balance >= 0 ? 'account-balance positive' : 'account-balance negative'}>
                    {formatCurrency(a.balance, a.currency)}
                  </span>
                  <button className="btn-icon" onClick={() => startEdit(a)} title="Editar">
                    ✏️
                  </button>
                  <button className="btn-icon" onClick={() => remove(a.id)} title="Eliminar">
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
