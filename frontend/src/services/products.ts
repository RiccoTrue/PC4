const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Product {
  id: number
  nombre: string
  descripcion: string | null
  precio: string
  stock: number
  sku: string
  marca: string | null
  calificacion_promedio: number | string | null
  activo: boolean
  id_categoria: number
  // Campo opcional por si el backend envía la categoría del producto
  categoria?: string | null
  imagenes_count?: number
  imagen_principal?: string | null
  total_resenas?: number
}

export interface ProductImage {
  id_imagen: number
  id_producto: number
  url_imagen: string
  es_principal: boolean
  orden: number
}

export interface CreateProductPayload {
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  sku: string
  marca?: string | null
  id_categoria: number
  activo?: boolean
}

export interface UpdateProductPayload {
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  sku: string
  marca?: string | null
  id_categoria: number
  activo?: boolean
}

export async function getProducts(token?: string): Promise<Product[]> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/api/products`, { headers })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener productos')
  }

  return res.json()
}

export async function updateProduct(
  token: string,
  id: number,
  payload: UpdateProductPayload,
): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al actualizar producto')
  }

  return data as Product
}

export async function createProduct(token: string, payload: CreateProductPayload): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al crear producto')
  }

  return data
}

export async function deleteProduct(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al eliminar producto')
  }
}

export async function uploadProductImages(
  token: string,
  id: number,
  files: FileList,
): Promise<{ images: Array<{ id_imagen: number; url_imagen: string; es_principal: boolean; orden: number }> }> {
  const formData = new FormData()
  Array.from(files)
    .slice(0, 4)
    .forEach((file) => {
      formData.append('images', file)
    })

  const res = await fetch(`${API_URL}/api/products/${id}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al subir imágenes del producto')
  }

  return data
}

export async function getProductImages(token: string | undefined, id: number): Promise<ProductImage[]> {
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/api/products/${id}/images`, {
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener imágenes del producto')
  }

  return (data.images ?? []) as ProductImage[]
}

export async function deleteProductImage(token: string, imageId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/products/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al eliminar imagen del producto')
  }
}

export async function setProductMainImage(token: string, imageId: number): Promise<ProductImage> {
  const res = await fetch(`${API_URL}/api/products/images/${imageId}/principal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Error al marcar imagen principal')
  }

  return data.image as ProductImage
}

export async function getProductById(id: number | string): Promise<Product> {
  const response = await fetch(`${API_URL}/api/products/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener el producto');
  }
  return response.json();
}
