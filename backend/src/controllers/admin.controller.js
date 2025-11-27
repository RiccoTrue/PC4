import bcrypt from 'bcrypt'
import { query } from '../database/connection.js'

const ensureAdminOrAgent = (req) => {
  const role = req.user?.rol
  if (role !== 'Admin' && role !== 'Agente') {
    const error = new Error('No autorizado')
    // @ts-ignore
    error.statusCode = 403
    throw error
  }
}

export const createPromotion = async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede crear promociones' })
    }

    const {
      codigo,
      descripcion,
      tipo_descuento,
      valor_descuento,
      fecha_inicio,
      fecha_fin,
      usos_maximos,
      activa = true,
      productIds,
    } = req.body

    if (!codigo || !tipo_descuento || !valor_descuento || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: 'Código, tipo de descuento, valor y fechas son obligatorios' })
    }

    if (!['Porcentaje', 'Monto_Fijo'].includes(tipo_descuento)) {
      return res.status(400).json({ message: 'Tipo de descuento inválido' })
    }

    const valor = Number(valor_descuento)
    if (!Number.isFinite(valor) || valor <= 0) {
      return res.status(400).json({ message: 'El valor de descuento debe ser mayor a 0' })
    }

    const productos = Array.isArray(productIds)
      ? [...new Set(productIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
      : []
    if (productos.length === 0) {
      return res.status(400).json({ message: 'Selecciona al menos un producto para la promoción' })
    }

    const insertPromo = await query(
      `INSERT INTO "PROMOCIONES" (
         "codigo",
         "descripcion",
         "tipo_descuento",
         "valor_descuento",
         "fecha_inicio",
         "fecha_fin",
         "usos_maximos",
         "activa"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING "id_promocion", "codigo", "descripcion", "tipo_descuento", "valor_descuento", "fecha_inicio", "fecha_fin", "usos_maximos", "usos_actuales", "activa"`,
      [codigo, descripcion ?? null, tipo_descuento, valor, fecha_inicio, fecha_fin, usos_maximos ?? null, Boolean(activa)],
    )

    const promo = insertPromo.rows[0]

    for (const idProducto of productos) {
      await query(
        `INSERT INTO "PRODUCTOS_PROMOCIONES" ("id_producto", "id_promocion")
         VALUES ($1, $2)
         ON CONFLICT ("id_producto", "id_promocion") DO NOTHING`,
        [idProducto, promo.id_promocion],
      )
    }

    return res.status(201).json(promo)
  } catch (error) {
    console.error('Error en createPromotion:', error)
    return res.status(500).json({ message: 'Error al crear la promoción' })
  }
}

export const getAllPromotions = async (req, res) => {
  try {
    ensureAdminOrAgent(req)

    const result = await query(
      `SELECT "id_promocion",
              "codigo",
              "descripcion",
              "tipo_descuento",
              "valor_descuento",
              "fecha_inicio",
              "fecha_fin",
              "usos_maximos",
              "usos_actuales",
              "activa"
       FROM "PROMOCIONES"
       ORDER BY "fecha_inicio" DESC, "id_promocion" DESC`,
    )

    return res.json(result.rows)
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para ver promociones' })
    }
    console.error('Error en getAllPromotions:', error)
    return res.status(500).json({ message: 'Error al obtener promociones' })
  }
}

export const getInventoryHistory = async (req, res) => {
  try {
    ensureAdminOrAgent(req)

    const limitParam = Number(req.query.limit)
    const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200 ? limitParam : 50

    const result = await query(
      `SELECT m."id_movimiento",
              m."id_producto",
              p."nombre" AS producto_nombre,
              m."tipo_movimiento",
              m."cantidad",
              m."fecha_movimiento",
              m."referencia_externa",
              u."id_usuario" AS id_usuario_registro,
              u."nombre" AS usuario_nombre,
              u."apellido" AS usuario_apellido
       FROM "MOVIMIENTOS_INVENTARIO" m
       JOIN "PRODUCTOS" p ON p."id_producto" = m."id_producto"
       JOIN "USUARIOS" u ON u."id_usuario" = m."id_usuario_registro"
       ORDER BY m."fecha_movimiento" DESC, m."id_movimiento" DESC
       LIMIT $1`,
      [limit],
    )

    return res.json(
      result.rows.map((row) => ({
        id_movimiento: row.id_movimiento,
        id_producto: row.id_producto,
        producto_nombre: row.producto_nombre,
        tipo_movimiento: row.tipo_movimiento,
        cantidad: row.cantidad,
        fecha_movimiento: row.fecha_movimiento,
        referencia_externa: row.referencia_externa,
        usuario: {
          id: row.id_usuario_registro,
          nombre: row.usuario_nombre,
          apellido: row.usuario_apellido,
        },
      })),
    )
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para ver el historial de inventario' })
    }
    console.error('Error en getInventoryHistory:', error)
    return res.status(500).json({ message: 'Error al obtener historial de inventario' })
  }
}

export const registerProductLot = async (req, res) => {
  try {
    const role = req.user?.rol
    const userId = req.user?.id
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede registrar lotes de productos' })
    }

    const productId = Number(req.params.id)
    const { cantidad, referencia } = req.body

    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido' })
    }

    const qty = Number(cantidad)
    if (!Number.isFinite(qty) || qty < 20) {
      return res.status(400).json({ message: 'La cantidad mínima por lote es 20 unidades' })
    }

    // 1) Actualizar stock en PRODUCTOS
    const productResult = await query(
      `UPDATE "PRODUCTOS"
       SET "stock" = "stock" + $1
       WHERE "id_producto" = $2
       RETURNING "id_producto", "stock"`,
      [qty, productId],
    )

    if (productResult.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    // 2) Actualizar/crear registro en INVENTARIO
    const invResult = await query(
      'SELECT "id_inventario", "cantidad_disponible", "stock_minimo" FROM "INVENTARIO" WHERE "id_producto" = $1',
      [productId],
    )

    if (invResult.rowCount === 0) {
      // Crear registro de inventario si no existe, con stock_minimo por defecto (ej: 10)
      await query(
        `INSERT INTO "INVENTARIO" ("id_producto", "cantidad_disponible", "cantidad_reservada", "stock_minimo")
         VALUES ($1, $2, 0, 10)`,
        [productId, qty],
      )
    } else {
      await query(
        `UPDATE "INVENTARIO"
         SET "cantidad_disponible" = "cantidad_disponible" + $1,
             "ultima_actualizacion" = CURRENT_TIMESTAMP
         WHERE "id_producto" = $2`,
        [qty, productId],
      )
    }

    // 3) Registrar movimiento en MOVIMIENTOS_INVENTARIO
    if (userId) {
      await query(
        `INSERT INTO "MOVIMIENTOS_INVENTARIO" (
           "id_producto",
           "tipo_movimiento",
           "cantidad",
           "id_usuario_registro",
           "referencia_externa"
         ) VALUES ($1, 'Entrada', $2, $3, $4)`,
        [productId, qty, userId, referencia ?? null],
      )
    }

    const row = productResult.rows[0]

    return res.json({
      message: 'Lote registrado correctamente',
      id_producto: row.id_producto,
      stock: row.stock,
    })
  } catch (error) {
    console.error('Error en registerProductLot:', error)
    return res.status(500).json({ message: 'Error al registrar lote de producto' })
  }
}

export const applyBatchDiscountToProducts = async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede aplicar descuentos masivos' })
    }

    const { productIds, discountPercent } = req.body

    if (!Array.isArray(productIds) || productIds.length < 1) {
      return res.status(400).json({ message: 'Debes enviar al menos un producto' })
    }

    const uniqueIds = [...new Set(productIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)))]
    if (uniqueIds.length === 0) {
      return res.status(400).json({ message: 'IDs de producto inválidos' })
    }

    const percent = Number(discountPercent)
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 90) {
      return res.status(400).json({ message: 'El porcentaje de descuento debe estar entre 1 y 89' })
    }

    const factor = 1 - percent / 100

    const placeholders = uniqueIds.map((_, idx) => `$${idx + 2}`).join(', ')

    const result = await query(
      `UPDATE "PRODUCTOS"
       SET "precio" = ROUND("precio" * $1, 2)
       WHERE "id_producto" IN (${placeholders})
       RETURNING "id_producto"`,
      [factor, ...uniqueIds],
    )

    return res.json({
      message: 'Descuento aplicado correctamente',
      updatedCount: result.rowCount,
      productIds: result.rows.map((r) => r.id_producto),
    })
  } catch (error) {
    console.error('Error en applyBatchDiscountToProducts:', error)
    return res.status(500).json({ message: 'Error al aplicar descuento masivo' })
  }
}

export const getOverviewStats = async (req, res) => {
  try {
    ensureAdminOrAgent(req)

    const [usersToday, usersWeek, usersMonth, productsToday, topProducts] = await Promise.all([
      // Usuarios registrados hoy
      query('SELECT COUNT(*)::int AS count FROM "USUARIOS" WHERE "fecha_registro" = CURRENT_DATE'),
      // Usuarios registrados en los últimos 7 días (incluye hoy)
      query(
        'SELECT COUNT(*)::int AS count FROM "USUARIOS" WHERE "fecha_registro" >= CURRENT_DATE - INTERVAL \'6 days\''
      ),
      // Usuarios registrados en el mes actual
      query(
        'SELECT COUNT(*)::int AS count FROM "USUARIOS" WHERE date_trunc(\'month\', "fecha_registro") = date_trunc(\'month\', CURRENT_DATE)'
      ),
      // Productos vendidos hoy (suma cantidades de DETALLE_PEDIDO cuyos pedidos son de hoy y tienen pago aprobado)
      query(
        `SELECT COALESCE(SUM(d."cantidad"), 0)::int AS total
         FROM "DETALLE_PEDIDO" d
         JOIN "PEDIDOS" p ON p."id_pedido" = d."id_pedido"
         JOIN "PAGOS" pg ON pg."id_pedido" = p."id_pedido" AND pg."estado" = 'Aprobado'
         WHERE p."fecha_pedido"::date = CURRENT_DATE`
      ),
      // Productos más vendidos en los últimos 30 días
      query(
        `SELECT d."id_producto",
                pr."nombre",
                COALESCE(SUM(d."cantidad"), 0)::int AS total_vendidos
         FROM "DETALLE_PEDIDO" d
         JOIN "PEDIDOS" p ON p."id_pedido" = d."id_pedido"
         JOIN "PAGOS" pg ON pg."id_pedido" = p."id_pedido" AND pg."estado" = 'Aprobado'
         JOIN "PRODUCTOS" pr ON pr."id_producto" = d."id_producto"
         WHERE p."fecha_pedido" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
         GROUP BY d."id_producto", pr."nombre"
         ORDER BY total_vendidos DESC
         LIMIT 5`
      ),
    ])

    return res.json({
      usuarios: {
        hoy: usersToday.rows[0]?.count ?? 0,
        semana: usersWeek.rows[0]?.count ?? 0,
        mes: usersMonth.rows[0]?.count ?? 0,
      },
      productos: {
        vendidosHoy: productsToday.rows[0]?.total ?? 0,
        masVendidos: topProducts.rows.map((row) => ({
          id_producto: row.id_producto,
          nombre: row.nombre,
          total_vendidos: row.total_vendidos,
        })),
      },
    })
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para ver estas estadísticas' })
    }
    console.error('Error en getOverviewStats:', error)
    return res.status(500).json({ message: 'Error al obtener estadísticas' })
  }
}

export const listUsers = async (req, res) => {
  try {
    ensureAdminOrAgent(req)

    const currentUserId = req.user?.id
    const { rol } = req.query

    const params = []
    let where = 'WHERE 1=1'

    if (currentUserId) {
      params.push(currentUserId)
      where += ` AND "id_usuario" <> $${params.length}`
    }

    if (rol && ['Cliente', 'Agente', 'Admin'].includes(String(rol))) {
      params.push(String(rol))
      where += ` AND "rol" = $${params.length}`
    }

    const result = await query(
      `SELECT "id_usuario", "email", "nombre", "apellido", "rol", "activo", "fecha_registro", "ultima_sesion", "telefono", "url_img"
       FROM "USUARIOS"
       ${where}
       ORDER BY "fecha_registro" DESC, "id_usuario" DESC`,
      params,
    )

    return res.json(
      result.rows.map((u) => ({
        id: u.id_usuario,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol,
        activo: u.activo,
        fecha_registro: u.fecha_registro,
        ultima_sesion: u.ultima_sesion,
        telefono: u.telefono,
        url_img: u.url_img,
      })),
    )
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para ver usuarios' })
    }
    console.error('Error en listUsers:', error)
    return res.status(500).json({ message: 'Error al obtener usuarios' })
  }
}

export const createUserByAdmin = async (req, res) => {
  try {
    // Solo el rol Admin puede crear usuarios
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede crear usuarios' })
    }

    const { email, password, nombre, apellido, telefono, rol } = req.body

    if (!email || !password || !nombre || !apellido || !rol) {
      return res.status(400).json({ message: 'Email, contraseña, nombre, apellido y rol son obligatorios' })
    }

    if (!['Cliente', 'Agente', 'Admin'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const existing = await query('SELECT 1 FROM "USUARIOS" WHERE "email" = $1', [normalizedEmail])
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const insertResult = await query(
      `INSERT INTO "USUARIOS" ("email", "password_hash", "nombre", "apellido", "telefono", "rol")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "id_usuario", "email", "nombre", "apellido", "rol", "activo", "fecha_registro", "ultima_sesion"`,
      [normalizedEmail, passwordHash, nombre, apellido, telefono || null, rol],
    )

    const user = insertResult.rows[0]

    return res.status(201).json({
      id: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
      activo: user.activo,
      fecha_registro: user.fecha_registro,
      ultima_sesion: user.ultima_sesion,
    })
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para crear usuarios' })
    }
    console.error('Error en createUserByAdmin:', error)
    return res.status(500).json({ message: 'Error al crear usuario' })
  }
}

export const deleteUserByAdmin = async (req, res) => {
  try {
    ensureAdminOrAgent(req)

    const currentUserId = req.user?.id
    const { id } = req.params
    const targetId = Number(id)

    if (!targetId || Number.isNaN(targetId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' })
    }

    if (currentUserId && targetId === Number(currentUserId)) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' })
    }

    const result = await query('DELETE FROM "USUARIOS" WHERE "id_usuario" = $1 RETURNING "id_usuario"', [targetId])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    return res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode === 403) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios' })
    }
    console.error('Error en deleteUserByAdmin:', error)
    return res.status(500).json({ message: 'Error al eliminar usuario' })
  }
}
