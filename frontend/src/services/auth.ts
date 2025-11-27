const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface AuthUser {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
  url_img?: string | null
  foto?: boolean
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export async function login(
  email: string,
  password: string,
  options?: { portal?: 'client' | 'admin' },
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portal: options?.portal }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al iniciar sesión')
  }

  return res.json()
}

export async function changePassword(
  token: string,
  params: { currentPassword: string; newPassword: string; confirmPassword: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al cambiar la contraseña')
  }
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  nombre: string,
  apellido: string,
  telefono?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword, nombre, apellido, telefono }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al registrar usuario')
  }

  return res.json()
}
