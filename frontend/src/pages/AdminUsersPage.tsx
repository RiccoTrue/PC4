import React, { useEffect, useState } from 'react'
import type { UserRole, AdminUser } from '../services/admin'
import { getAdminUsers, createAdminUser, deleteAdminUser } from '../services/admin'
import type { AuthUser } from '../services/auth'

const AdminUsersPage: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined)

  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'Cliente' as UserRole,
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth')
      if (stored) {
        const parsed = JSON.parse(stored) as { user?: AuthUser | null; token?: string }
        setAuthUser(parsed.user ?? null)
        setToken(parsed.token ?? null)
      } else {
        setAuthUser(null)
        setToken(null)
      }
    } catch {
      setAuthUser(null)
      setToken(null)
    }
  }, [])

  useEffect(() => {
    const loadUsers = async () => {
      if (!token) return
      setLoadingUsers(true)
      setUsersError(null)
      try {
        const data = await getAdminUsers(token, roleFilter)
        const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
        setUsers(filtered)
      } catch (error) {
        setUsersError((error as Error).message)
      } finally {
        setLoadingUsers(false)
      }
    }

    void loadUsers()
  }, [token, roleFilter, authUser])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.nombre.trim() || !newUser.apellido.trim()) {
      setCreateError('Completa nombre, apellido, email y contraseña')
      return
    }

    setCreatingUser(true)
    setCreateError(null)
    setCreateSuccess(null)
    try {
      await createAdminUser(token, {
        email: newUser.email.trim(),
        password: newUser.password,
        nombre: newUser.nombre.trim(),
        apellido: newUser.apellido.trim(),
        telefono: newUser.telefono.trim() || undefined,
        rol: newUser.rol,
      })

      setCreateSuccess('Usuario creado correctamente')
      setNewUser({ nombre: '', apellido: '', email: '', telefono: '', password: '', rol: 'Cliente' })

      const data = await getAdminUsers(token, roleFilter)
      const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
      setUsers(filtered)
    } catch (error) {
      setCreateError((error as Error).message)
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!token) return
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este usuario?')
    if (!confirmDelete) return

    try {
      await deleteAdminUser(token, userId)
      const data = await getAdminUsers(token, roleFilter)
      const filtered = authUser ? data.filter((u) => u.id !== authUser.id) : data
      setUsers(filtered)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Usuarios registrados</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRoleFilter(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              !roleFilter
                ? 'bg-primary text-white border-primary'
                : 'bg-card-dark text-muted-light border-card-dark'
            }`}
          >
            Todos
          </button>
          {(['Cliente', 'Agente', 'Admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                roleFilter === r
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card-dark text-muted-light border-card-dark'
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
                        onClick={() => setSelectedUser(u)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                      >
                        Ver detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
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

      <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Agregar nuevo usuario</h2>
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

        <form onSubmit={handleCreateUser} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
                value={newUser.nombre}
                onChange={(e) => setNewUser((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Apellido</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
                value={newUser.apellido}
                onChange={(e) => setNewUser((prev) => ({ ...prev, apellido: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.email}
              onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Teléfono (opcional)</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.telefono}
              onChange={(e) => setNewUser((prev) => ({ ...prev, telefono: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Rol</label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm text-black dark:text-white"
              value={newUser.rol}
              onChange={(e) => setNewUser((prev) => ({ ...prev, rol: e.target.value as UserRole }))}
            >
              <option value="Cliente">Cliente</option>
              <option value="Agente">Agente</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creatingUser}
            className="mt-2 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creatingUser ? 'Creando usuario...' : 'Crear usuario'}
          </button>
        </form>

        {selectedUser && (
          <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-xs">
            <p className="font-semibold mb-1">Detalles del usuario seleccionado</p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-medium">Nombre:</span> {selectedUser.nombre} {selectedUser.apellido}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-medium">Email:</span> {selectedUser.email}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-medium">Rol:</span> {selectedUser.rol}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-medium">Estado:</span> {selectedUser.activo ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default AdminUsersPage
