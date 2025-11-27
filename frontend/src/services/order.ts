const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export type PaymentMethod = 'Tarjeta' | 'PayPal' | 'Transferencia'

export interface OrderItemInput {
  id_producto: number
  cantidad: number
  precio_unitario: number
}

export interface CreateOrderInput {
  id_direccion: number
  subtotal: number
  impuestos: number
  total: number
  metodo_pago: PaymentMethod
  notas?: string | null
  items: OrderItemInput[]
}

export interface OrderSummary {
  id_pedido: number
  fecha_pedido: string
  estado: string
  total: number
  producto_nombre: string | null
  producto_imagen: string | null
  total_items: number
  tiene_devolucion?: boolean
}

export interface OrderDetailItem {
  id_detalle: number
  id_producto: number
  producto_nombre: string
  producto_imagen: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface OrderDetailsResponse {
  order: {
    id_pedido: number
    fecha_pedido: string
    estado: string
    subtotal: number
    impuestos: number
    total: number
    direccion: {
      calle: string | null
      ciudad: string | null
      estado: string | null
      codigo_postal: string | null
      pais: string | null
    }
  }
  items: OrderDetailItem[]
}

export interface ReturnSummary {
  id_devolucion: number
  id_pedido: number
  motivo: string
  estado: string
  monto_reembolso: number | null
  fecha_solicitud: string
  fecha_resolucion: string | null
  total_pedido: number
}

export interface CreateReturnResponse {
  id_devolucion: number
  id_pedido: number
  message: string
}

export interface OrderReturnDetails {
  id_devolucion: number
  id_pedido: number
  motivo: string
  estado: string
  monto_reembolso: number | null
  fecha_solicitud: string
  fecha_resolucion: string | null
}

export async function updateReturnStatusService(
  token: string,
  returnId: number,
  estado: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/returns/${returnId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo actualizar el estado de la devolución')
  }
}

export async function createOrder(token: string, data: CreateOrderInput): Promise<{ id_pedido: number }> {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo crear el pedido')
  }

  return res.json()
}

export async function getMyOrderReturn(
  token: string,
  orderId: number,
): Promise<OrderReturnDetails> {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/return`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo obtener la devolución del pedido')
  }

  return res.json()
}

export async function getMyOrderDetails(token: string, orderId: number): Promise<OrderDetailsResponse> {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar los detalles del pedido')
  }

  return res.json()
}

export async function requestReturn(
  token: string,
  orderId: number,
  motivo: string,
  motivoTipo?: 'Defectuoso' | 'No_esperado' | 'Error_en_pedido' | 'Otro',
): Promise<CreateReturnResponse> {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ motivo, motivo_tipo: motivoTipo }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo registrar la solicitud de devolución')
  }

  return res.json()
}

export async function updateOrderStatus(token: string, orderId: number, estado: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo actualizar el estado del pedido')
  }
}

export async function getAllReturns(token: string): Promise<ReturnSummary[]> {
  const res = await fetch(`${API_URL}/api/admin/returns`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar las devoluciones')
  }

  return res.json()
}

export async function getOrderDetails(token: string, orderId: number): Promise<OrderDetailsResponse> {
  const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar los detalles del pedido')
  }

  return res.json()
}

export async function getAllOrders(token: string): Promise<OrderSummary[]> {
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar los pedidos')
  }

  return res.json()
}

export async function getMyOrders(token: string): Promise<OrderSummary[]> {
  const res = await fetch(`${API_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar los pedidos')
  }

  return res.json()
}
