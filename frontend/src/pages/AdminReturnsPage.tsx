import React, { useEffect, useState } from 'react'
import type { ReturnSummary } from '../services/order'
import { getAllReturns, updateReturnStatusService } from '../services/order'
import type { AuthUser } from '../services/auth'

const AdminReturnsPage: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [returns, setReturns] = useState<ReturnSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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
    const loadReturns = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const data = await getAllReturns(token)
        setReturns(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void loadReturns()
  }, [token])

  const handleUpdateStatus = async (id: number, estado: 'Aprobada' | 'Rechazada') => {
    if (!token) return
    setUpdatingId(id)
    setError(null)
    try {
      await updateReturnStatusService(token, id, estado)
      setReturns((prev) =>
        prev.map((r) =>
          r.id_devolucion === id
            ? {
                ...r,
                estado,
                fecha_resolucion: new Date().toISOString(),
              }
            : r,
        ),
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Vista de devoluciones</h2>
        {authUser && <span className="text-xs text-gray-500 dark:text-gray-400">Usuario: {authUser.email}</span>}
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 text-left font-semibold">ID Devolución</th>
              <th className="py-2 pr-4 text-left font-semibold">ID Pedido</th>
              <th className="py-2 pr-4 text-left font-semibold">Motivo</th>
              <th className="py-2 pr-4 text-left font-semibold">Estado</th>
              <th className="py-2 pr-4 text-left font-semibold">Monto reembolso</th>
              <th className="py-2 pr-4 text-left font-semibold">Fecha solicitud</th>
              <th className="py-2 pr-4 text-left font-semibold">Fecha resolución</th>
              <th className="py-2 pr-4 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando devoluciones...
                </td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay devoluciones registradas.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id_devolucion} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{r.id_devolucion}</td>
                  <td className="py-2 pr-4">{r.id_pedido}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={r.motivo}>{r.motivo}</td>
                  <td className="py-2 pr-4">{r.estado}</td>
                  <td className="py-2 pr-4">{r.monto_reembolso != null ? `S/ ${r.monto_reembolso}` : '—'}</td>
                  <td className="py-2 pr-4">{new Date(r.fecha_solicitud).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.fecha_resolucion ? new Date(r.fecha_resolucion).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-4">
                    {r.estado === 'Solicitada' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={updatingId === r.id_devolucion}
                          onClick={() => handleUpdateStatus(r.id_devolucion, 'Aprobada')}
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === r.id_devolucion}
                          onClick={() => handleUpdateStatus(r.id_devolucion, 'Rechazada')}
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminReturnsPage
