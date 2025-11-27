import { query } from '../database/connection.js'

export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const result = await query(
      `SELECT w."id_lista", w."id_producto", w."fecha_agregado",
              p."id_producto" AS id, p."nombre", p."descripcion", p."precio", p."stock", p."sku", p."marca"
       FROM "LISTA_DESEOS" w
       JOIN "PRODUCTOS" p ON p."id_producto" = w."id_producto"
       WHERE w."id_usuario" = $1
       ORDER BY w."fecha_agregado" DESC`,
      [userId],
    )

    const items = result.rows.map((row) => ({
      id_lista: row.id_lista,
      id_producto: row.id_producto,
      fecha_agregado: row.fecha_agregado,
      producto: {
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        precio: row.precio,
        stock: row.stock,
        sku: row.sku,
        marca: row.marca,
      },
    }))

    return res.json(items)
  } catch (error) {
    console.error('Error al obtener lista de deseos:', error)
    return res.status(500).json({ message: 'Error al obtener lista de deseos' })
  }
}

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const { id_producto } = req.body
    if (!id_producto) {
      return res.status(400).json({ message: 'Producto inválido' })
    }

    await query(
      `INSERT INTO "LISTA_DESEOS" ("id_usuario", "id_producto")
       VALUES ($1, $2)
       ON CONFLICT ("id_usuario", "id_producto") DO NOTHING`,
      [userId, id_producto],
    )

    return res.status(201).json({ message: 'Producto añadido a la lista de deseos' })
  } catch (error) {
    console.error('Error al añadir a la lista de deseos:', error)
    return res.status(500).json({ message: 'Error al añadir a la lista de deseos' })
  }
}

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })

    const productId = Number(req.params.productId)
    if (!productId) {
      return res.status(400).json({ message: 'Producto inválido' })
    }

    await query('DELETE FROM "LISTA_DESEOS" WHERE "id_usuario" = $1 AND "id_producto" = $2', [userId, productId])

    return res.json({ message: 'Producto eliminado de la lista de deseos' })
  } catch (error) {
    console.error('Error al eliminar de la lista de deseos:', error)
    return res.status(500).json({ message: 'Error al eliminar de la lista de deseos' })
  }
}
