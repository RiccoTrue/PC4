import { query } from '../database/connection.js'

export const getMyAddress = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const result = await query(
      'SELECT "id_direccion", "id_usuario", "nombre_direccion", "calle", "ciudad", "estado", "codigo_postal", "pais", "es_principal" FROM "DIRECCIONES" WHERE "id_usuario" = $1 ORDER BY "es_principal" DESC, "id_direccion" ASC LIMIT 1',
      [userId],
    )

    if (result.rowCount === 0) {
      return res.json(null)
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('Error en getMyAddress:', error)
    return res.status(500).json({ message: 'Error en el servidor' })
  }
}

export const upsertMyAddress = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { nombre_direccion, calle, ciudad, estado, codigo_postal, pais } = req.body

    const existing = await query(
      'SELECT "id_direccion" FROM "DIRECCIONES" WHERE "id_usuario" = $1 ORDER BY "es_principal" DESC, "id_direccion" ASC LIMIT 1',
      [userId],
    )

    const esPrincipal = existing.rowCount === 0

    if (existing.rowCount === 0) {
      const insert = await query(
        'INSERT INTO "DIRECCIONES" ("id_usuario", "nombre_direccion", "calle", "ciudad", "estado", "codigo_postal", "pais", "es_principal") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "id_direccion", "id_usuario", "nombre_direccion", "calle", "ciudad", "estado", "codigo_postal", "pais", "es_principal"',
        [userId, nombre_direccion ?? null, calle, ciudad, estado ?? null, codigo_postal, pais || 'Perú', esPrincipal],
      )
      return res.status(201).json(insert.rows[0])
    }

    const idDireccion = existing.rows[0].id_direccion

    const update = await query(
      'UPDATE "DIRECCIONES" SET "nombre_direccion" = $1, "calle" = $2, "ciudad" = $3, "estado" = $4, "codigo_postal" = $5, "pais" = $6 WHERE "id_direccion" = $7 RETURNING "id_direccion", "id_usuario", "nombre_direccion", "calle", "ciudad", "estado", "codigo_postal", "pais", "es_principal"',
      [nombre_direccion ?? null, calle, ciudad, estado ?? null, codigo_postal, pais || 'Perú', idDireccion],
    )

    return res.json(update.rows[0])
  } catch (error) {
    console.error('Error en upsertMyAddress:', error)
    return res.status(500).json({ message: 'Error en el servidor' })
  }
}
