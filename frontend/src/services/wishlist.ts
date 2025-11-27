const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface WishlistProduct {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  stock?: number | null
  sku?: string | null
  marca?: string | null
}

export interface WishlistItem {
  id_lista: number
  id_producto: number
  fecha_agregado: string
  producto: WishlistProduct
}

export async function getMyWishlist(token: string): Promise<WishlistItem[]> {
  const res = await fetch(`${API_URL}/api/wishlist`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error('No se pudo cargar la lista de deseos')
  }

  return res.json()
}

export async function addToWishlist(token: string, id_producto: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/wishlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id_producto }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo añadir a la lista de deseos')
  }
}

export async function removeFromWishlist(token: string, id_producto: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/wishlist/${id_producto}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo eliminar de la lista de deseos')
  }
}
