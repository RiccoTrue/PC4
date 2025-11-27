import React from 'react'
import type { UserRole, AdminUser } from '../services/admin'

interface NewUserState {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
  rol: UserRole
}

interface AdminUsersSectionProps {
  users: AdminUser[]
  loadingUsers: boolean
  usersError: string | null
  roleFilter: UserRole | undefined
  onRoleFilterChange: (role: UserRole | undefined) => void
  onSelectUser: (user: AdminUser) => void
  onDeleteUser: (userId: number) => void
  newUser: NewUserState
  onChangeNewUser: (updater: (prev: NewUserState) => NewUserState) => void
  createError: string | null
  createSuccess: string | null
  onCreateUser: (e: React.FormEvent) => void
}

const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  users,
  loadingUsers,
  usersError,
  roleFilter,
  onRoleFilterChange,
  onSelectUser,
  onDeleteUser,
  newUser,
  onChangeNewUser,
  createError,
  createSuccess,
  onCreateUser,
}) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Usuarios registrados</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => onRoleFilterChange(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              !roleFilter
                ? 'bg-primary text-white border-primary'
                : 'bg-transparent border-card-dark/40 text-muted-dark dark:text-muted-light'
            }`}
          >
            Todos
          </button>
          {(['Cliente', 'Agente', 'Admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRoleFilterChange(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                roleFilter === r
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent border-card-dark/40 text-muted-dark dark:text-muted-light'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {usersError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {usersError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 text-left font-semibold">Nombre</th>
                <th className="py-2 pr-4 text-left font-semibold">Email</th>
                <th className="py-2 pr-4 text-left font-semibold">Rol</th>
                <th className="py-2 pr-4 text-left font-semibold">Estado</th>
                <th className="py-2 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron usuarios con el filtro actual.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">
                      <span className="font-medium">
                        {u.nombre} {u.apellido}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.rol}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.activo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => onSelectUser(u)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                      >
                        Ver detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u.id)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30 flex flex-col gap-3">
        {createError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {createError}
          </p>
        )}
        {createSuccess && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {createSuccess}
          </p>
        )}

        <form onSubmit={onCreateUser} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.nombre}
              onChange={(e) => onChangeNewUser((prev) => ({ ...prev, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Apellido</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.apellido}
              onChange={(e) => onChangeNewUser((prev) => ({ ...prev, apellido: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
            value={newUser.email}
            onChange={(e) => onChangeNewUser((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Teléfono (opcional)</label>
          <input
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
            value={newUser.telefono}
            onChange={(e) => onChangeNewUser((prev) => ({ ...prev, telefono: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
            value={newUser.password}
            onChange={(e) => onChangeNewUser((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Rol</label>
          <select
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
            value={newUser.rol}
            onChange={(e) => onChangeNewUser((prev) => ({ ...prev, rol: e.target.value as UserRole }))}
          >
            <option value="Cliente">Cliente</option>
            <option value="Agente">Agente</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
          >
            Crear usuario
          </button>
        </div>
        </form>
      </div>
    </section>
  )
}

export default AdminUsersSection
