import React from 'react'

export type AdminSection = 'dashboard' | 'users' | 'products' | 'categories' | 'orders' | 'returns' | 'promotions' | 'profile'

interface AdminSidebarProps {
  activeSection: AdminSection
  onChangeSection: (section: AdminSection) => void
  onLogout: () => void
  role?: string
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onChangeSection, onLogout, role }) => {
  const isAgent = role === 'Agente'

  return (
    <aside className="w-52 md:w-64 flex-shrink-0 bg-card-light dark:bg-card-dark flex flex-col p-3 md:p-4 overflow-y-auto shadow-lg">
      <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white">
        <span className="material-symbols-outlined text-2xl">shield_lock</span>
        <span className="text-lg font-bold tracking-tight">Admin Panel</span>
      </div>

      <nav className="flex-grow mt-1">
        <ul>
          <li className="mb-2">
            <button
              type="button"
              onClick={() => onChangeSection('dashboard')}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent border-card-dark/40 text-text-light dark:text-text-dark hover:bg-card-dark/30'
              }`}
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="flex-1 text-xs">Dashboard Principal</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">HOY</span>
            </button>
          </li>
          {!isAgent && (
            <>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => onChangeSection('users')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-colors text-text-light dark:text-text-dark ${
                    activeSection === 'users'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-transparent border-card-dark/40 hover:bg-card-dark/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">group</span>
                    <span className="text-xs">Gestión de Usuarios</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => onChangeSection('products')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-colors text-text-light dark:text-text-dark ${
                    activeSection === 'products'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-transparent border-card-dark/40 hover:bg-card-dark/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">inventory_2</span>
                    <span className="text-xs">Gestión de Productos</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => onChangeSection('categories')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-colors text-text-light dark:text-text-dark ${
                    activeSection === 'categories'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-transparent border-card-dark/40 hover:bg-card-dark/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">category</span>
                    <span className="text-xs">Gestión de Categorías</span>
                  </div>
                </button>
              </li>
            </>
          )}
          <li className="mb-2">
            <button
              type="button"
              onClick={() => onChangeSection('orders')}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border bg-transparent border-card-dark/40 hover:bg-card-dark/30 transition-colors text-text-light dark:text-text-dark"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-primary">receipt_long</span>
                <span className="text-xs">Vista de Pedidos</span>
              </div>
            </button>
          </li>
          <li className="mb-2">
            <button
              type="button"
              onClick={() => onChangeSection('returns')}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border bg-transparent border-card-dark/40 hover:bg-card-dark/30 transition-colors text-text-light dark:text-text-dark"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-primary">assignment_return</span>
                <span className="text-xs">Vista de Devoluciones</span>
              </div>
            </button>
          </li>
          {!isAgent && (
            <li>
              <button
                type="button"
                onClick={() => onChangeSection('promotions')}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg border bg-transparent border-card-dark/40 hover:bg-card-dark/30 transition-colors text-text-light dark:text-text-dark"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">percent</span>
                  <span className="text-xs">Gestión de Descuentos</span>
                </div>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="mt-auto">
        <div className="border-t border-background-light dark:border-background-dark my-4" />
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-transparent text-muted-dark dark:text-muted-light hover:bg-card-dark/40 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-xs">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
