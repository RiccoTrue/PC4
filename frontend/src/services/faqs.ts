const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Faq {
  id: number
  pregunta: string
  respuesta: string
  orden: number
}

export async function getFaqs(): Promise<Faq[]> {
  const res = await fetch(`${API_URL}/api/faqs`)
  const data = await res.json().catch(() => [])

  if (!res.ok) {
    throw new Error((data as any).message || 'Error al obtener preguntas frecuentes')
  }

  return data as Faq[]
}
