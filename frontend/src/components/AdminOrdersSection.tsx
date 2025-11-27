import React from 'react'
import type { OrderSummary } from '../services/order'

interface AdminOrdersSectionProps {
  orders: OrderSummary[]
  loadingOrders: boolean
  ordersError: string | null
  onSelectOrder: (order: OrderSummary) => void
  onChangeStatus?: (orderId: number, newStatus: string) => void
  updatingStatusId?: number | null
}

const AdminOrdersSection: React.FC<AdminOrdersSectionProps> = ({
  orders,
  loadingOrders,
  ordersError,
  onSelectOrder,
  onChangeStatus,
  updatingStatusId,
}) => {
  return (
    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow border border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Vista de pedidos</h2>
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
              <th className="py-2 pr-4 text-left font-semibold">Items</th>
              <th className="py-2 pr-4 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando pedidos...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay pedidos registrados.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id_pedido} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4">{o.id_pedido}</td>
                  <td className="py-2 pr-4">{new Date(o.fecha_pedido).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {onChangeStatus ? (
                      <select
                        className="rounded-md border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark px-2 py-1 text-xs"
                        value={o.estado}
                        disabled={updatingStatusId === o.id_pedido}
                        onChange={(e) => onChangeStatus(o.id_pedido, e.target.value)}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Procesando">Procesando</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : (
                      o.estado
                    )}
                  </td>
                  <td className="py-2 pr-4 font-semibold">S/ {o.total}</td>
                  <td className="py-2 pr-4">{o.total_items}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => onSelectOrder(o)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                    >
                      Ver detalles
                    </button>
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

export default AdminOrdersSection
