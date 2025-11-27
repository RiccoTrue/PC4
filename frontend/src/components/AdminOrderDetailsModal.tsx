import React, { useEffect, useState } from 'react'
import type { OrderSummary, OrderDetailsResponse } from '../services/order'
import { getOrderDetails } from '../services/order'

interface AdminOrderDetailsModalProps {
  order: OrderSummary | null
  token: string | null
  onClose: () => void
}

const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({ order, token, onClose }) => {
  const [details, setDetails] = useState<OrderDetailsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDetails = async () => {
      if (!order || !token) return
      setLoading(true)
      setError(null)
      try {
        const data = await getOrderDetails(token, order.id_pedido)
        setDetails(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void loadDetails()
  }, [order, token])

  if (!order) return null

  const info = details?.order
  const items = details?.items ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-primary/40 p-6 relative"
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

        <h2 className="text-xl font-semibold mb-4">Detalles del pedido #{order.id_pedido}</h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Fecha</p>
            <p className="text-gray-800 dark:text-gray-300">{new Date(order.fecha_pedido).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Estado</p>
            <p className="text-gray-800 dark:text-gray-300">{order.estado}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Subtotal</p>
            <p className="text-gray-800 dark:text-gray-300">S/ {info?.subtotal ?? '...'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Impuestos</p>
            <p className="text-gray-800 dark:text-gray-300">S/ {info?.impuestos ?? '...'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Total</p>
            <p className="text-gray-800 dark:text-gray-300">S/ {info?.total ?? order.total}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Dirección</p>
            <p className="text-gray-800 dark:text-gray-300">
              {info
                ? `${info.direccion.calle ?? ''}, ${info.direccion.ciudad ?? ''} ${info.direccion.estado ?? ''} ${info.direccion.codigo_postal ?? ''}, ${info.direccion.pais ?? ''}`
                : '...'}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">Ítems del pedido</h3>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando ítems...</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark">
                  <th className="py-2 px-3 text-left font-semibold">Producto</th>
                  <th className="py-2 px-3 text-left font-semibold">Cantidad</th>
                  <th className="py-2 px-3 text-left font-semibold">Precio unitario</th>
                  <th className="py-2 px-3 text-left font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-center text-gray-500 dark:text-gray-400">
                      No hay ítems en este pedido.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id_detalle} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3">{it.producto_nombre}</td>
                      <td className="py-2 px-3">{it.cantidad}</td>
                      <td className="py-2 px-3">S/ {it.precio_unitario}</td>
                      <td className="py-2 px-3 font-semibold">S/ {it.subtotal}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrderDetailsModal
