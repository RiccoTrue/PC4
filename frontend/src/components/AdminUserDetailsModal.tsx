import React from 'react'
import type { AdminUser } from '../services/admin'

interface AdminUserDetailsModalProps {
  selectedUser: AdminUser | null
  apiUrl: string
  onClose: () => void
}

const AdminUserDetailsModal: React.FC<AdminUserDetailsModalProps> = ({ selectedUser, apiUrl, onClose }) => {
  if (!selectedUser) return null

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-w-xl w-full bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-primary/40 p-6 relative"
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

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
            {selectedUser.url_img ? (
              <img
                src={selectedUser.url_img.startsWith('http') ? selectedUser.url_img : `${apiUrl}${selectedUser.url_img}`}
                alt={selectedUser.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {selectedUser.nombre.charAt(0).toUpperCase()}
                {selectedUser.apellido.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {selectedUser.nombre} {selectedUser.apellido}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{selectedUser.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Rol</p>
            <p className="text-gray-800 dark:text-gray-300">{selectedUser.rol}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Estado</p>
            <p className="text-gray-800 dark:text-gray-300">{selectedUser.activo ? 'Activo' : 'Inactivo'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Teléfono</p>
            <p className="text-gray-800 dark:text-gray-300">{selectedUser.telefono || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Fecha de registro</p>
            <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedUser.fecha_registro)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Última sesión</p>
            <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedUser.ultima_sesion)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUserDetailsModal
