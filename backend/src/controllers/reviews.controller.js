import { query } from '../database/connection.js'

export const getProductReviews = async (req, res) => {
  const productId = Number(req.params.id)

  if (!productId || Number.isNaN(productId)) {
    return res.status(400).json({ message: 'Producto inválido' })
  }

  try {
    const statsResult = await query(
      `SELECT
         COUNT(*)::int       AS total,
         COALESCE(AVG("calificacion"), 0)::numeric(10,2) AS promedio
       FROM "RESENAS"
       WHERE "id_producto" = $1 AND "estado" = 'Aprobada'`,
      [productId],
    )

    const stats = statsResult.rows[0] || { total: 0, promedio: 0 }

    const reviewsResult = await query(
      `SELECT
         r."id_resena",
         r."calificacion",
         r."titulo",
         r."comentario",
         r."compra_verificada",
         r."votos_utiles",
         r."votos_no_utiles",
         r."fecha_publicacion",
         u."nombre" AS nombre_usuario,
         u."apellido" AS apellido_usuario,
         COALESCE(json_agg(ir."url_imagen") FILTER (WHERE ir."id_imagen_resena" IS NOT NULL), '[]') AS imagenes
       FROM "RESENAS" r
       JOIN "USUARIOS" u ON u."id_usuario" = r."id_usuario"
       LEFT JOIN "IMAGENES_RESENA" ir ON ir."id_resena" = r."id_resena"
       WHERE r."id_producto" = $1 AND r."estado" = 'Aprobada'
       GROUP BY r."id_resena", u."nombre", u."apellido"
       ORDER BY r."fecha_publicacion" DESC`,
      [productId],
    )

    return res.json({
      promedio: Number(stats.promedio) || 0,
      total: stats.total || 0,
      resenas: reviewsResult.rows,
    })
  } catch (error) {
    console.error('Error al obtener reseñas:', error)
    return res.status(500).json({ message: 'Error al obtener reseñas' })
  }
}

export const getOrderReviewsStatus = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { id } = req.params
    const orderId = Number(id)

    if (!orderId) {
      return res.status(400).json({ message: 'ID de pedido inválido' })
    }

    const orderResult = await query(
      'SELECT "id_pedido", "id_usuario", "estado" FROM "PEDIDOS" WHERE "id_pedido" = $1',
      [orderId],
    )

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' })
    }

    const order = orderResult.rows[0]

    if (order.id_usuario !== userId) {
      return res.status(403).json({ message: 'No autorizado para ver este pedido' })
    }

    const itemsResult = await query(
      `SELECT d."id_detalle",
              d."id_producto",
              pr."nombre" AS producto_nombre,
              EXISTS (
                SELECT 1 FROM "RESENAS" r
                WHERE r."id_producto" = d."id_producto"
                  AND r."id_usuario" = $1
                  AND r."id_pedido" = d."id_pedido"
              ) AS ya_resenado
       FROM "DETALLE_PEDIDO" d
       JOIN "PRODUCTOS" pr ON pr."id_producto" = d."id_producto"
       WHERE d."id_pedido" = $2
       ORDER BY d."id_detalle" ASC`,
      [userId, orderId],
    )

    return res.json(itemsResult.rows)
  } catch (error) {
    console.error('Error al obtener estado de reseñas del pedido:', error)
    return res.status(500).json({ message: 'Error al obtener estado de reseñas del pedido' })
  }
}

export const createReviewFromOrder = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { id_pedido, id_producto, calificacion, titulo, comentario } = req.body

    const orderId = Number(id_pedido)
    const productId = Number(id_producto)
    const rating = Number(calificacion)

    if (!orderId || !productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Datos de reseña inválidos' })
    }

    const orderResult = await query(
      'SELECT "id_pedido", "id_usuario", "estado" FROM "PEDIDOS" WHERE "id_pedido" = $1',
      [orderId],
    )

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' })
    }

    const order = orderResult.rows[0]

    if (order.id_usuario !== userId) {
      return res.status(403).json({ message: 'No autorizado para reseñar este pedido' })
    }

    if (order.estado !== 'Entregado') {
      return res.status(400).json({ message: 'Solo puedes reseñar productos de pedidos entregados' })
    }

    const itemResult = await query(
      'SELECT 1 FROM "DETALLE_PEDIDO" WHERE "id_pedido" = $1 AND "id_producto" = $2 LIMIT 1',
      [orderId, productId],
    )

    if (itemResult.rowCount === 0) {
      return res.status(400).json({ message: 'El producto no pertenece a este pedido' })
    }

    const existingResult = await query(
      'SELECT 1 FROM "RESENAS" WHERE "id_usuario" = $1 AND "id_producto" = $2 AND "id_pedido" = $3 LIMIT 1',
      [userId, productId, orderId],
    )

    if (existingResult.rowCount > 0) {
      return res.status(400).json({ message: 'Ya has reseñado este producto en este pedido' })
    }

    const insertResult = await query(
      `INSERT INTO "RESENAS" (
         "id_producto", "id_usuario", "id_pedido", "calificacion", "titulo", "comentario", "compra_verificada", "estado"
       ) VALUES ($1, $2, $3, $4, $5, $6, true, 'Pendiente')
       RETURNING "id_resena"`,
      [productId, userId, orderId, rating, titulo || null, comentario || null],
    )

    const id_resena = insertResult.rows[0]?.id_resena

    return res.status(201).json({ id_resena })
  } catch (error) {
    console.error('Error al crear reseña desde pedido:', error)
    return res.status(500).json({ message: 'No se pudo registrar la reseña' })
  }
}
