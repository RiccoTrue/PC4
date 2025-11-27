import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OrderSummary, OrderDetailsResponse, OrderReturnDetails } from '../services/order'
import { getMyOrders, requestReturn, getMyOrderDetails, getMyOrderReturn } from '../services/order'
import type { OrderReviewStatusItem } from '../services/reviews'
import { getOrderReviewsStatus, createReviewFromOrder } from '../services/reviews'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface StoredAuth {
  token: string
}

const OrdersPage: FC = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROCESS' | 'ENVIADO' | 'ENTREGADO'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailsResponse | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedOrderReturn, setSelectedOrderReturn] = useState<OrderReturnDetails | null>(null)
  const [orderReviewsStatus, setOrderReviewsStatus] = useState<OrderReviewStatusItem[]>([])
  const [returnOrder, setReturnOrder] = useState<OrderSummary | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnReasonType, setReturnReasonType] = useState<'Defectuoso' | 'No_esperado' | 'Error_en_pedido' | 'Otro'>('No_esperado')
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    id_producto: number | null
    producto_nombre: string
    calificacion: number
    titulo: string
    comentario: string
  }>({ open: false, id_producto: null, producto_nombre: '', calificacion: 5, titulo: '', comentario: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (!raw) {
      navigate('/auth', { replace: true, state: { from: '/orders' } })
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredAuth
      if (!parsed.token) {
        navigate('/auth', { replace: true, state: { from: '/orders' } })
        return
      }
      setToken(parsed.token)
    } catch {
      navigate('/auth', { replace: true, state: { from: '/orders' } })
    }
  }, [navigate])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const data = await getMyOrders(token)
        setOrders(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token])

  useEffect(() => {
    const loadDetails = async () => {
      if (!token || !selectedOrder) return
      setDetailsLoading(true)
      setDetailsError(null)
      setSelectedOrderReturn(null)
      setOrderReviewsStatus([])
      try {
        const data = await getMyOrderDetails(token, selectedOrder.id_pedido)
        setSelectedOrderDetails(data)
        try {
          const returnData = await getMyOrderReturn(token, selectedOrder.id_pedido)
          setSelectedOrderReturn(returnData)
        } catch {
          // Si no hay devolución o hay error, simplemente no mostramos sección de devolución
          setSelectedOrderReturn(null)
        }
        try {
          const reviewsStatus = await getOrderReviewsStatus(token, selectedOrder.id_pedido)
          setOrderReviewsStatus(reviewsStatus)
        } catch {
          setOrderReviewsStatus([])
        }
      } catch (e) {
        setDetailsError((e as Error).message)
        setSelectedOrderDetails(null)
      } finally {
        setDetailsLoading(false)
      }
    }

    void loadDetails()
  }, [token, selectedOrder])

  if (!token) return null

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const canReviewProduct = (productId: number) => {
    const status = orderReviewsStatus.find((s) => s.id_producto === productId)
    return status ? !status.ya_resenado : true
  }

  const formatCurrency = (value: number) => {
    return `S/ ${Number(value || 0).toFixed(2)}`
  }

  const getStatusBadgeClasses = (estado: string) => {
    switch (estado) {
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400'
      case 'Enviado':
      case 'Procesando':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
      case 'Solicitud_Devolucion':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400'
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400'
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'IN_PROCESS') {
      // Consideramos "En Proceso" como estados Pendiente o Procesando
      return order.estado === 'Pendiente' || order.estado === 'Procesando'
    }
    if (statusFilter === 'ENVIADO') {
      return order.estado === 'Enviado'
    }
    if (statusFilter === 'ENTREGADO') {
      return order.estado === 'Entregado'
    }
    return true
  })

  return (
    <div className="layout-container flex h-full grow flex-col">
      <div className="flex flex-1">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8">
            {/* Encabezado */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-black dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Mis Pedidos
              </h1>
            </div>

            {/* Filtros (solo UI por ahora) */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* SearchBar */}
              <div className="flex-grow">
                <label className="flex flex-col min-w-40 h-12 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-xl h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center pl-4">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-black dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary focus:ring-inset border-none bg-transparent h-full placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 pl-2 text-base font-normal leading-normal"
                      placeholder="Buscar por producto o nº de pedido"
                      value=""
                      readOnly
                    />
                  </div>
                </label>
              </div>

              {/* Chips de estado */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 text-sm font-medium leading-normal ${{
                    ALL: 'bg-primary text-white',
                    IN_PROCESS:
                      'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                    ENVIADO:
                      'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                    ENTREGADO:
                      'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                  }[statusFilter]}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_PROCESS')}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 text-sm font-medium leading-normal ${
                    statusFilter === 'IN_PROCESS'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  En Proceso
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ENVIADO')}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 text-sm font-medium leading-normal ${
                    statusFilter === 'ENVIADO'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Enviado
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ENTREGADO')}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 text-sm font-medium leading-normal ${
                    statusFilter === 'ENTREGADO'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Entregado
                </button>
              </div>
            </div>

            {/* Tabla de pedidos */}
            <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">
                      Producto
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium">
                      Nº de Pedido
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium text-right">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                        Cargando pedidos...
                      </td>
                    </tr>
                  )}

            {/* Modal de reseña de producto */}
            {selectedOrder && reviewModal.open && reviewModal.id_producto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                onClick={() => {
                  if (!reviewSubmitting) {
                    setReviewModal((prev) => ({ ...prev, open: false }))
                    setReviewError(null)
                    setReviewSuccess(null)
                  }
                }}
              >
                <div
                  className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={reviewSubmitting}
                    onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    aria-label="Cerrar reseña"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 pr-8">
                    Añadir reseña
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {reviewModal.producto_nombre}
                  </p>

                  {reviewError && (
                    <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {reviewError}
                    </p>
                  )}
                  {reviewSuccess && (
                    <p className="mb-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      {reviewSuccess}
                    </p>
                  )}

                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Calificación</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={reviewModal.calificacion}
                      onChange={(e) =>
                        setReviewModal((prev) => ({ ...prev, calificacion: Number(e.target.value) || 5 }))
                      }
                      disabled={reviewSubmitting}
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>{`${v} estrella${v === 1 ? '' : 's'}`}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Título (opcional)</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={reviewModal.titulo}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, titulo: e.target.value }))}
                      disabled={reviewSubmitting}
                    />
                  </label>

                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Comentario (opcional)</span>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={reviewModal.comentario}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, comentario: e.target.value }))}
                      disabled={reviewSubmitting}
                    />
                  </label>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}
                      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={async () => {
                        if (!token || !selectedOrder || !reviewModal.id_producto) return
                        setReviewSubmitting(true)
                        setReviewError(null)
                        setReviewSuccess(null)
                        try {
                          await createReviewFromOrder(token, {
                            id_pedido: selectedOrder.id_pedido,
                            id_producto: reviewModal.id_producto,
                            calificacion: reviewModal.calificacion,
                            titulo: reviewModal.titulo || undefined,
                            comentario: reviewModal.comentario || undefined,
                          })
                          setReviewSuccess('Reseña enviada correctamente. Será visible cuando sea aprobada.')
                          setOrderReviewsStatus((prev) =>
                            prev.map((s) =>
                              s.id_producto === reviewModal.id_producto
                                ? { ...s, ya_resenado: true }
                                : s,
                            ),
                          )
                        } catch (e) {
                          setReviewError((e as Error).message)
                        } finally {
                          setReviewSubmitting(false)
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Enviar reseña
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de solicitud de devolución */}
            {returnOrder && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                onClick={() => {
                  if (!submittingReturn) {
                    setReturnOrder(null)
                  }
                }}
              >
                <div
                  className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={submittingReturn}
                    onClick={() => setReturnOrder(null)}
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    aria-label="Cerrar solicitud de devolución"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 pr-8">
                    Solicitar devolución
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Pedido #{returnOrder.id_pedido} — {formatCurrency(returnOrder.total)}
                  </p>

                  {returnError && (
                    <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {returnError}
                    </p>
                  )}
                  {returnSuccess && (
                    <p className="mb-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      {returnSuccess}
                    </p>
                  )}

                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Motivo principal
                    </span>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={returnReasonType}
                      onChange={(e) => setReturnReasonType(e.target.value as typeof returnReasonType)}
                      disabled={submittingReturn}
                    >
                      <option value="No_esperado">No era lo que esperaba</option>
                      <option value="Defectuoso">Producto defectuoso o con falla</option>
                      <option value="Error_en_pedido">Error en el pedido (producto equivocado, faltante, etc.)</option>
                      <option value="Otro">Otro motivo</option>
                    </select>
                  </label>

                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Detalle del motivo
                    </span>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Describe brevemente el motivo de la devolución (mínimo 5 caracteres)"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      disabled={submittingReturn}
                    />
                    {returnReasonType === 'Defectuoso' && (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Para productos defectuosos podemos evaluar tu caso incluso si han pasado más de 10 días hábiles.
                      </p>
                    )}
                  </label>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={submittingReturn}
                      onClick={() => setReturnOrder(null)}
                      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={
                        submittingReturn || !returnReason.trim() || returnReason.trim().length < 5
                      }
                      onClick={async () => {
                        if (!token || !returnOrder) return
                        setSubmittingReturn(true)
                        setReturnError(null)
                        setReturnSuccess(null)
                        try {
                          await requestReturn(token, returnOrder.id_pedido, returnReason.trim(), returnReasonType)
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id_pedido === returnOrder.id_pedido
                                ? { ...o, estado: 'Solicitud_Devolucion' }
                                : o,
                            ),
                          )
                          setReturnSuccess('Solicitud de devolución enviada correctamente.')
                          // Opcional: recargar pedidos para reflejar cambios en admin más adelante
                        } catch (e) {
                          setReturnError((e as Error).message)
                        } finally {
                          setSubmittingReturn(false)
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Enviar solicitud
                    </button>
                  </div>
                </div>
              </div>
            )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-red-500 text-sm">
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                        Aún no tienes pedidos registrados.
                      </td>
                    </tr>
                  )}

                  {!loading && !error &&
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id_pedido}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-black dark:text-white">
                          <span className="text-sm text-slate-800 dark:text-slate-200">
                            Detalles del pedido disponibles en "Ver Detalles"
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">#{order.id_pedido}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {formatDate(order.fecha_pedido)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                                order.estado,
                              )}`}
                            >
                              <span className="w-2 h-2 mr-1.5 bg-current rounded-full" />
                              {order.estado}
                            </span>
                            {order.tiene_devolucion && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                                Devolución asociada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-black dark:text-white text-right">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="font-semibold text-primary text-sm bg-transparent hover:bg-transparent hover:underline px-0 shadow-none border-0"
                            >
                              Ver Detalles
                            </button>
                            {order.estado === 'Entregado' && !order.tiene_devolucion && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReturnOrder(order)
                                  setReturnReason('')
                                  setReturnReasonType('No_esperado')
                                  setReturnError(null)
                                  setReturnSuccess(null)
                                }}
                                className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-transparent hover:bg-transparent hover:underline px-0 shadow-none border-0"
                              >
                                Solicitar devolución
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal de detalles de pedido */}
            {selectedOrder && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                onClick={() => {
                  setSelectedOrder(null)
                  setSelectedOrderDetails(null)
                  setDetailsError(null)
                }}
              >
                <div
                  className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(null)
                      setSelectedOrderDetails(null)
                      setDetailsError(null)
                    }}
                    className="absolute right-4 top-4 rounded-full p-1 bg-transparent hover:bg-transparent text-slate-400 hover:text-slate-200 border-0 shadow-none"
                    aria-label="Cerrar detalles de pedido"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 pr-8">
                    Detalles del pedido #{selectedOrder.id_pedido}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Realizado el {formatDate(selectedOrder.fecha_pedido)}
                  </p>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Estado:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                          selectedOrder.estado,
                        )}`}
                      >
                        <span className="w-2 h-2 mr-1.5 bg-current rounded-full" />
                        {selectedOrder.estado}
                      </span>
                      {selectedOrderReturn && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                          {selectedOrderReturn.estado === 'Completada'
                            ? 'Devolución completada'
                            : 'Devolución en proceso'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Productos:</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedOrder.total_items}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(null)
                          setSelectedOrderDetails(null)
                          setDetailsError(null)
                          navigate(`/support?pedido=${selectedOrder.id_pedido}`)
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold bg-white text-black hover:bg-slate-100"
                      >
                        Ver soporte
                      </button>
                    </div>
                  </div>

                  {selectedOrder.estado === 'Cancelado' && selectedOrder.tiene_devolucion && (
                    <p className="mb-4 text-xs sm:text-sm text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                      Este pedido ha sido devuelto. El estado se muestra como cancelado porque la devolución fue procesada.
                    </p>
                  )}

                  {selectedOrderReturn && (
                    <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-semibold mb-1">Información de devolución</p>
                      <p>
                        Estado de la devolución: <span className="font-medium">{selectedOrderReturn.estado}</span>
                      </p>
                      {selectedOrderReturn.monto_reembolso != null && (
                        <p>
                          Monto estimado de reembolso:{' '}
                          <span className="font-medium">{formatCurrency(selectedOrderReturn.monto_reembolso)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Ítems del pedido
                    </h3>
                    {detailsError && (
                      <p className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {detailsError}
                      </p>
                    )}
                    {detailsLoading ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Cargando ítems...</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mt-2">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                              <th className="py-2 px-3 text-left font-semibold">Imagen</th>
                              <th className="py-2 px-3 text-left font-semibold">Producto</th>
                              <th className="py-2 px-3 text-left font-semibold">Cantidad</th>
                              <th className="py-2 px-3 text-left font-semibold">Precio unitario</th>
                              <th className="py-2 px-3 text-left font-semibold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrderDetails?.items?.length ? (
                              selectedOrderDetails.items.map((it) => (
                                <tr
                                  key={it.id_detalle}
                                  className="border-t border-slate-100 dark:border-slate-800"
                                >
                                  <td className="py-2 px-3">
                                    {it.producto_imagen && resolveImageUrl(it.producto_imagen) ? (
                                      <img
                                        className="h-10 w-10 object-cover rounded-md"
                                        src={resolveImageUrl(it.producto_imagen) as string}
                                        alt={it.producto_nombre}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300">
                                        {it.producto_nombre.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-col gap-1">
                                      <span>{it.producto_nombre}</span>
                                      {selectedOrder.estado === 'Entregado' && canReviewProduct(it.id_producto) && (
                                        <button
                                          type="button"
                                          className="self-start text-[11px] font-semibold text-primary bg-transparent hover:underline px-0 border-0 shadow-none"
                                          onClick={() => {
                                            setReviewError(null)
                                            setReviewSuccess(null)
                                            setReviewModal({
                                              open: true,
                                              id_producto: it.id_producto,
                                              producto_nombre: it.producto_nombre,
                                              calificacion: 5,
                                              titulo: '',
                                              comentario: '',
                                            })
                                          }}
                                        >
                                          Añadir reseña
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">{it.cantidad}</td>
                                  <td className="py-2 px-3">S/ {it.precio_unitario}</td>
                                  <td className="py-2 px-3 font-semibold">S/ {it.subtotal}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="py-3 px-3 text-center text-slate-500 dark:text-slate-400"
                                >
                                  No hay ítems en este pedido.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage
