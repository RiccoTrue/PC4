import React, { useEffect, useState } from 'react'
import type { OrderSummary } from '../services/order'
import { getAllOrders } from '../services/order'
import type { AuthUser } from '../services/auth'

const AdminOrdersPage: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

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
    const loadOrders = async () => {
      if (!token) return
      setLoadingOrders(true)
      setOrdersError(null)
      try {
        const data = await getAllOrders(token)
        setOrders(data)
      } catch (error) {
        setOrdersError((error as Error).message)
      } finally {
        setLoadingOrders(false)
      }
    }

    void loadOrders()
  }, [token])

  return (
    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Vista de pedidos</h2>
        {authUser && <span className="text-xs text-gray-500 dark:text-gray-400">Usuario: {authUser.email}</span>}
      </div>

      {ordersError && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {ordersError}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 text-left font-semibold">ID Pedido</th>
              <th className="py-2 pr-4 text-left font-semibold">Fecha</th>
              <th className="py-2 pr-4 text-left font-semibold">Estado</th>
              <th className="py-2 pr-4 text-left font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando pedidos...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay pedidos registrados.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id_pedido} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{o.id_pedido}</td>
                  <td className="py-2 pr-4">{new Date(o.fecha_pedido).toLocaleString()}</td>
                  <td className="py-2 pr-4">{o.estado}</td>
                  <td className="py-2 pr-4 font-semibold">S/ {o.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminOrdersPage
