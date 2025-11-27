import { query } from '../database/connection.js'

export const getPublicFaqs = async (_req, res) => {
  try {
    const result = await query(
      'SELECT "id_faq" AS id, "pregunta", "respuesta", "orden" FROM "FAQS" WHERE "activa" = true ORDER BY "orden" ASC, "id_faq" ASC',
    )

    return res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener FAQs:', error)
    return res.status(500).json({ message: 'Error al obtener preguntas frecuentes' })
  }
}
