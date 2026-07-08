export type View = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'reports'

const ITEMS: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Resumen', icon: '🏠' },
  { id: 'accounts', label: 'Cuentas', icon: '💳' },
  { id: 'transactions', label: 'Transacciones', icon: '📋' },
  { id: 'budgets', label: 'Presupuestos', icon: '🎯' },
  { id: 'reports', label: 'Reportes', icon: '📊' },
]

export default function Sidebar({ current, onNavigate }: { current: View; onNavigate: (v: View) => void }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">💰</span>
        <span>Mis Finanzas</span>
      </div>
      <ul className="sidebar-nav">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <button
              className={item.id === current ? 'sidebar-link active' : 'sidebar-link'}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
