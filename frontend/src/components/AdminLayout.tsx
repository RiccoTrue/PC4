import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../services/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getInitials = (user: AuthUser) => {
  const first = (user.nombre || '').trim().charAt(0)
  const last = (user.apellido || '').trim().charAt(0)
  const combined = `${first}${last}`.trim()
  if (combined) return combined.toUpperCase()
  return (user.email || '?').charAt(0).toUpperCase()
}

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
  })

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth')
      if (stored) {
        const parsed = JSON.parse(stored) as { user?: AuthUser | null }
        setAuthUser(parsed.user ?? null)
      } else {
        setAuthUser(null)
      }
    } catch {
      setAuthUser(null)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth')
    navigate('/intranet/login', { replace: true })
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="w-52 md:w-64 flex-shrink-0 bg-card-light dark:bg-card-dark flex flex-col p-3 md:p-4 overflow-y-auto shadow-lg">
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white">
            <span className="material-symbols-outlined text-3xl">shield_lock</span>
            <span className="text-xl font-bold tracking-tight">Admin Panel</span>
          </div>

          <nav className="flex-grow">
            <ul>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/admin')
                      ? 'bg-primary text-white'
                      : 'hover:bg-background-light dark:hover:bg-background-dark text-text-light dark:text-text-dark'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">dashboard</span>
                  <span className="flex-1 text-sm">Dashboard Principal</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">HOY</span>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/users')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">group</span>
                    <span className="text-sm">Gestión de Usuarios</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/admin/promotions')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/promotions')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">percent</span>
                    <span className="text-sm">Gestión de Descuentos</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/products')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">inventory_2</span>
                    <span className="text-sm">Gestión de Productos</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/categories')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/categories')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">category</span>
                    <span className="text-sm">Gestión de Categorías</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/orders')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">receipt_long</span>
                    <span className="text-sm">Vista de Pedidos</span>
                  </div>
                </button>
              </li>
              <li className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/returns')}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-text-light dark:text-text-dark ${
                    isActive('/admin/returns')
                      ? 'bg-background-light dark:bg-background-dark'
                      : 'hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">assignment_return</span>
                    <span className="text-sm">Vista de Devoluciones</span>
                  </div>
                </button>
              </li>
            </ul>
          </nav>

          <div className="mt-auto">
            <div className="border-t border-background-light dark:border-background-dark my-4" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors text-left"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-background-light/60 dark:bg-background-dark/60">
          <header className="flex justify-between items-center mb-8 pb-4 border-b border-accent/30">
            <h1 className="text-3xl font-bold text-primary dark:text-accent">Dashboard Principal</h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-card-light dark:bg-card-dark text-primary hover:bg-background-light dark:hover:bg-background-dark transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/profile')}
                className="flex items-center gap-2 group"
              >
                <span className="font-medium group-hover:underline">
                  {authUser ? `Bienvenido, ${authUser.nombre}` : 'Bienvenido'}
                </span>
                {authUser && authUser.url_img && authUser.foto ? (
                  <img
                    alt={authUser.nombre}
                    className="w-10 h-10 rounded-full object-cover border border-primary/40 group-hover:border-primary"
                    src={authUser.url_img.startsWith('http') ? authUser.url_img : `${API_URL}${authUser.url_img}`}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold border border-primary/20 group-hover:border-primary">
                    {authUser ? getInitials(authUser) : 'A'}
                  </div>
                )}
              </button>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
