const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Si la respuesta es 401, el token es inválido o expiró
    if (response.status === 401) {
      // Limpiar el token inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirigir al login
      window.location.href = '/auth';
      throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error en la petición');
    }

    return response.json();
  } catch (error) {
    console.error('Error en la petición:', error);
    throw error;
  }
}
