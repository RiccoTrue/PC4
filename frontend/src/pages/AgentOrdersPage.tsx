import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../services/auth'
import type { OrderSummary } from '../services/order'
import { getAllOrders, updateOrderStatus } from '../services/order'
import AdminOrderDetailsModal from '../components/AdminOrderDetailsModal'

const AgentOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<
  | 'ALL'
  | 'Pendiente'
  | 'Procesando'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado'
  | 'Solicitud_Devolucion'
>('ALL')
  const [detailsOrder, setDetailsOrder] = useState<OrderSummary | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth')
      if (!stored) {
        navigate('/intranet/login', { replace: true })
        return
      }

      const parsed = JSON.parse(stored) as { user?: AuthUser | null; token?: string }
      if (!parsed.user || !parsed.token || parsed.user.rol !== 'Agente') {
        navigate('/intranet/login', { replace: true })
        return
      }

      setAuthUser(parsed.user)
      setToken(parsed.token)
    } catch {
      navigate('/intranet/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return
      setLoadingOrders(true)
      setOrdersError(null)
      try {
        const data = await getAllOrders(token)
        setOrders(data)
        const initialDrafts: Record<number, string> = {}
        data.forEach((o) => {
          initialDrafts[o.id_pedido] = o.estado
        })
        setStatusDrafts(initialDrafts)
      } catch (error) {
        setOrdersError((error as Error).message)
      } finally {
        setLoadingOrders(false)
      }
    }

    void loadOrders()
  }, [token])

  const handleChangeStatus = async (orderId: number, newStatus: string) => {
    if (!token) return
    setUpdatingStatusId(orderId)
    try {
      await updateOrderStatus(token, orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id_pedido === orderId ? { ...o, estado: newStatus } : o)),
      )
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  if (!authUser || !token) {
    return null
  }

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.estado === statusFilter)

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 min-h-screen">
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.03em]">
                Gestión de Pedidos
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sesión iniciada como agente: {authUser.nombre} {authUser.apellido}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('auth')
                navigate('/intranet/login', { replace: true })
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Cerrar sesión
            </button>
          </header>

          {ordersError && (
            <p className="mb-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {ordersError}
            </p>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex-grow">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-gray-400 flex border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    placeholder="Buscar por ID, nombre de cliente..."
                    value=""
                    readOnly
                  />
                </div>
              </label>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 text-sm font-medium leading-normal transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Todos</p>
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Entregado')}
                className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 text-sm font-medium leading-normal transition-colors ${
                  statusFilter === 'Entregado'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Entregado</p>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Procesando')}
                className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 text-sm font-medium leading-normal transition-colors ${
                  statusFilter === 'Procesando'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-medium leading-normal">En Proceso</p>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Cancelado')}
                className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 text-sm font-medium leading-normal transition-colors ${
                  statusFilter === 'Cancelado'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Cancelado</p>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Solicitud_Devolucion')}
                className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 text-sm font-medium leading-normal transition-colors ${
                  statusFilter === 'Solicitud_Devolucion'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Solicitudes devolución</p>
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        ID Pedido
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Fecha
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Estado
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Total
                      </th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loadingOrders ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 md:px-6 py-6 text-center text-gray-500 dark:text-gray-400 text-sm"
                        >
                          Cargando pedidos...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 md:px-6 py-6 text-center text-gray-500 dark:text-gray-400 text-sm"
                        >
                          No hay pedidos registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr
                          key={o.id_pedido}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                            #{o.id_pedido}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(o.fecha_pedido).toLocaleString()}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col gap-1">
                              <span
                                className={
                                  o.estado === 'Entregado'
                                    ? 'inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1 text-xs font-semibold text-green-800 dark:text-green-300'
                                    : o.estado === 'Enviado'
                                      ? 'inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300'
                                      : o.estado === 'Procesando'
                                        ? 'inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 text-xs font-semibold text-yellow-800 dark:text-yellow-300'
                                        : o.estado === 'Cancelado'
                                          ? 'inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/50 px-3 py-1 text-xs font-semibold text-red-800 dark:text-red-300'
                                          : o.estado === 'Solicitud_Devolucion'
                                            ? 'inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300'
                                            : 'inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200'
                                }
                              >
                                {o.estado}
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-[11px] text-gray-800 dark:text-gray-200"
                                  value={statusDrafts[o.id_pedido] ?? o.estado}
                                  disabled={updatingStatusId === o.id_pedido || o.estado === 'Solicitud_Devolucion'}
                                  onChange={(e) =>
                                    setStatusDrafts((prev) => ({
                                      ...prev,
                                      [o.id_pedido]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="Pendiente">Pendiente</option>
                                  <option value="Procesando">Procesando</option>
                                  <option value="Enviado">Enviado</option>
                                  <option value="Entregado">Entregado</option>
                                  <option value="Cancelado">Cancelado</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={
                                    updatingStatusId === o.id_pedido ||
                                    o.estado === 'Solicitud_Devolucion' ||
                                    (statusDrafts[o.id_pedido] ?? o.estado) === o.estado
                                  }
                                  onClick={() =>
                                    handleChangeStatus(o.id_pedido, statusDrafts[o.id_pedido] ?? o.estado)
                                  }
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold border border-primary text-primary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Actualizar
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
                            S/ {o.total}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailsOrder(o)}
                                className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-9 px-3 text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                                Ver detalles
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/support?pedido=${o.id_pedido}`)
                                }}
                                className="flex items-center justify-center gap-2 rounded-lg bg-primary h-9 px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
                              >
                                <span className="material-symbols-outlined text-base">chat_bubble</span>
                                Contactar cliente
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Mostrando <span className="font-medium">1</span> a{' '}
                  <span className="font-medium">{Math.min(filteredOrders.length, 10)}</span> de{' '}
                  <span className="font-medium">{filteredOrders.length}</span> resultados
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-8 h-8 md:w-10 md:h-10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    disabled
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-8 h-8 md:w-10 md:h-10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {detailsOrder && (
            <AdminOrderDetailsModal order={detailsOrder} token={token} onClose={() => setDetailsOrder(null)} />
          )}
        </div>
      </main>
    </div>
  )
}

export default AgentOrdersPage
