import React, { useEffect, useState } from 'react'
import type { UserProfile } from '../services/user'
import { getMe, updateMe } from '../services/user'

interface AdminProfileModalProps {
  open: boolean
  token: string | null
  onClose: () => void
}

const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ open, token, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!open || !token) return
      setLoading(true)
      setError(null)
      try {
        const data = await getMe(token)
        setProfile(data)
        setNombre(data.nombre)
        setApellido(data.apellido)
        setTelefono(data.telefono ?? '')
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [open, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateMe(token, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
      })
      setProfile(updated)
      setSuccess('Perfil actualizado correctamente')

      // Actualizar también localStorage.auth para que el saludo cambie
      const stored = localStorage.getItem('auth')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { user?: any; token?: string }
          localStorage.setItem(
            'auth',
            JSON.stringify({
              ...parsed,
              user: {
                ...parsed.user,
                nombre: updated.nombre,
                apellido: updated.apellido,
                telefono: updated.telefono,
              },
            }),
          )
        } catch {
          // ignoramos errores de parseo
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-primary/40 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 bg-transparent text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-xl font-semibold mb-4">Editar perfil</h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando perfil...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Apellido</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Teléfono</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-3 py-2 text-sm"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex w-full justify-center items-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AdminProfileModal
