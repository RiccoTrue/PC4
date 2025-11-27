const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Promotion {
  id_promocion: number
  codigo: string
  descripcion: string | null
  tipo_descuento: 'Porcentaje' | 'Monto_Fijo'
  valor_descuento: number
  fecha_inicio: string
  fecha_fin: string
  usos_maximos: number | null
  usos_actuales: number
  activa: boolean
}

export async function getAllPromotions(token: string): Promise<Promotion[]> {
  const res = await fetch(`${API_URL}/api/admin/promotions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudieron cargar las promociones')
  }

  return res.json()
}

export interface CreatePromotionInput {
  codigo: string
  descripcion?: string | null
  tipo_descuento: 'Porcentaje' | 'Monto_Fijo'
  valor_descuento: number
  fecha_inicio: string
  fecha_fin: string
  usos_maximos?: number | null
  activa?: boolean
  productIds: number[]
}

export async function createPromotionApi(token: string, data: CreatePromotionInput): Promise<Promotion> {
  const res = await fetch(`${API_URL}/api/admin/promotions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || 'No se pudo crear la promoción')
  }

  return res.json()
}
