const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface OverviewStats {
  usuarios: {
    hoy: number
    semana: number
    mes: number
  }
  productos: {
    vendidosHoy: number
    masVendidos: {
      id_producto: number
      nombre: string
      total_vendidos: number
    }[]
  }
}

export async function getOverviewStats(token: string): Promise<OverviewStats> {
  const res = await fetch(`${API_URL}/api/admin/stats/overview`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener estadísticas del dashboard')
  }

  return res.json()
}

export type UserRole = 'Cliente' | 'Agente' | 'Admin'

export interface AdminUser {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: UserRole
  activo: boolean
  fecha_registro?: string
  ultima_sesion?: string | null
  telefono?: string | null
  url_img?: string | null
}

export interface InventoryMovementUser {
  id: number
  nombre: string
  apellido: string
}

export type InventoryMovementType =
  | 'Entrada'
  | 'Salida'
  | 'Ajuste_Positivo'
  | 'Ajuste_Negativo'
  | 'Devolucion_Cliente'

export interface InventoryMovement {
  id_movimiento: number
  id_producto: number
  producto_nombre: string
  tipo_movimiento: InventoryMovementType
  cantidad: number
  fecha_movimiento: string
  referencia_externa?: string | null
  usuario: InventoryMovementUser
}

export async function registerProductLot(
  token: string,
  productId: number,
  cantidad: number,
): Promise<{ message: string; id_producto: number; stock: number }> {
  const res = await fetch(`${API_URL}/api/admin/products/${productId}/lot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cantidad }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Error al registrar lote de producto')
  }
  return data
}

export async function getInventoryHistory(
  token: string,
  limit = 50,
): Promise<InventoryMovement[]> {
  const url = new URL(`${API_URL}/api/admin/inventory/history`)
  if (limit) {
    url.searchParams.set('limit', String(limit))
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener historial de inventario')
  }
  return data
}

export async function applyBatchDiscount(
  token: string,
  payload: { productIds: number[]; discountPercent: number },
): Promise<{ message: string; updatedCount: number; productIds: number[] }> {
  const res = await fetch(`${API_URL}/api/admin/products/batch-discount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Error al aplicar descuento masivo')
  }
  return data
}

export async function getAdminUsers(token: string, rol?: UserRole): Promise<AdminUser[]> {
  const url = new URL(`${API_URL}/api/admin/users`)
  if (rol) {
    url.searchParams.set('rol', rol)
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener usuarios')
  }

  return res.json()
}

export async function createAdminUser(
  token: string,
  payload: { email: string; password: string; nombre: string; apellido: string; telefono?: string; rol: UserRole },
): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al crear usuario')
  }

  return res.json()
}

export async function deleteAdminUser(token: string, userId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al eliminar usuario')
  }
}
