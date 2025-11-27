const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface UserProfile {
  id: number
  email: string
  nombre: string
  apellido: string
  telefono?: string | null
  fecha_registro?: string
  ultima_sesion?: string
  rol: string
   url_img?: string | null
}

export async function getMe(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error('No se pudo cargar el perfil')
  }

  return res.json()
}

export async function deleteAvatar(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo eliminar la imagen de perfil')
  }
}

export async function uploadAvatar(token: string, file: File): Promise<{ url_img: string }> {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo subir la imagen de perfil')
  }

  return res.json()
}

export async function updateMe(
  token: string,
  data: Pick<UserProfile, 'nombre' | 'apellido'> & { telefono?: string | null },
): Promise<UserProfile & { token?: string }> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('No se pudo actualizar el perfil')
  }

  return res.json()
}
