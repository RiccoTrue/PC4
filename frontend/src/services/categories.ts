const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Category {
  id: number
  nombre: string
  descripcion: string | null
  parent_id: number | null
  activo: boolean
}

export interface CreateCategoryPayload {
  nombre: string
  descripcion?: string | null
  parent_id?: number | null
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener categorías')
  }

  return res.json()
}

export async function createCategory(token: string, payload: CreateCategoryPayload): Promise<Category> {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al crear categoría')
  }

  return data
}

export async function deleteCategory(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al eliminar categoría')
  }
}
