const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Review {
  id_resena: number
  calificacion: number
  titulo: string | null
  comentario: string | null
  compra_verificada: boolean
  votos_utiles: number
  votos_no_utiles: number
  fecha_publicacion: string
  nombre_usuario: string
  apellido_usuario: string
  imagenes: string[]
}

export interface ProductReviewsResponse {
  promedio: number
  total: number
  resenas: Review[]
}

export async function getProductReviews(productId: number): Promise<ProductReviewsResponse> {
  const res = await fetch(`${API_URL}/api/products/${productId}/reviews`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudieron cargar las reseñas')
  }

  return res.json()
}

export interface OrderReviewStatusItem {
  id_detalle: number
  id_producto: number
  producto_nombre: string
  ya_resenado: boolean
}

export async function getOrderReviewsStatus(
  token: string,
  orderId: number,
): Promise<OrderReviewStatusItem[]> {
  const res = await fetch(`${API_URL}/api/reviews/order/${orderId}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo obtener el estado de reseñas del pedido')
  }

  return res.json()
}

export async function createReviewFromOrder(
  token: string,
  params: { id_pedido: number; id_producto: number; calificacion: number; titulo?: string; comentario?: string },
): Promise<{ id_resena: number }> {
  const res = await fetch(`${API_URL}/api/reviews/from-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo registrar la reseña')
  }

  return res.json()
}
