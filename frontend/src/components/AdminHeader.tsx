import React from 'react'
import type { AuthUser } from '../services/auth'

interface AdminHeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  authUser: AuthUser | null
  apiUrl: string
  getInitials: (user: AuthUser) => string
  onOpenProfile: () => void
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ theme, onToggleTheme, authUser, apiUrl, getInitials, onOpenProfile }) => {
  return (
    <header className="flex justify-between items-center mb-8 pb-4 border-b border-accent/30">
      <div className="flex items-center gap-3">
        <img
          src="/img/logo.png"
          alt="TechMate Admin"
          className="h-10 w-auto object-contain"
        />
        <h1 className="text-3xl font-bold text-primary dark:text-accent">Dashboard Principal</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-card-light dark:bg-card-dark text-primary hover:bg-background-light dark:hover:bg-background-dark transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-transparent text-text-light dark:text-text-dark hover:bg-card-dark/30 transition-colors group"
        >
          <span className="font-medium group-hover:underline">
            {authUser ? `Bienvenido, ${authUser.nombre}` : 'Bienvenido'}
          </span>
          {authUser && authUser.url_img && authUser.foto ? (
            <img
              alt={authUser.nombre}
              className="w-10 h-10 rounded-full object-cover border border-primary/40 group-hover:border-primary"
              src={authUser.url_img.startsWith('http') ? authUser.url_img : `${apiUrl}${authUser.url_img}`}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold border border-primary/20 group-hover:border-primary">
              {authUser ? getInitials(authUser) : 'A'}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}

export default AdminHeader
