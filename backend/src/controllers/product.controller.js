import { query } from '../database/connection.js'

export const updateProductStock = async (productId, quantityChange) => {
  try {
    // Asegurarse de que la cantidad sea un número entero
    const parsedQuantity = Math.floor(Number(quantityChange));
    if (isNaN(parsedQuantity) || parsedQuantity === 0) {
      console.error('Cantidad inválida para actualizar stock:', quantityChange);
      return false;
    }

    // Actualizar el stock del producto
    const result = await query(
      `UPDATE "PRODUCTOS" 
       SET "stock" = GREATEST(0, "stock" + $1) 
       WHERE "id_producto" = $2 
       RETURNING "stock"`,
      [parsedQuantity, productId]
    );

    if (result.rowCount === 0) {
      console.error('Producto no encontrado para actualizar stock:', productId);
      return false;
    }

    console.log(`Stock actualizado para producto ${productId}. Cambio: ${parsedQuantity}. Nuevo stock: ${result.rows[0].stock}`);
    return true;
  } catch (error) {
    console.error('Error al actualizar stock del producto:', error);
    return false;
  }
};

export const getAllProducts = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                p."id_producto" AS id,
                p."nombre",
                p."descripcion",
                p."precio",
                p."stock",
                p."sku",
                p."marca",
                COALESCE((
                  SELECT AVG(r."calificacion") 
                  FROM "RESENAS" r 
                  WHERE r."id_producto" = p."id_producto" 
                  AND r."estado" = 'Aprobada'
                ), 0) AS calificacion_promedio,
                (
                  SELECT COUNT(*)
                  FROM "RESENAS" r
                  WHERE r."id_producto" = p."id_producto"
                  AND r."estado" = 'Aprobada'
                ) AS total_resenas,
                p."activo",
                p."id_categoria",
                (
                  SELECT COUNT(*)
                  FROM "IMAGENES_PRODUCTO" img
                  WHERE img."id_producto" = p."id_producto"
                ) AS imagenes_count,
                (
                  SELECT img."url_imagen"
                  FROM "IMAGENES_PRODUCTO" img
                  WHERE img."id_producto" = p."id_producto"
                  ORDER BY img."es_principal" DESC, img."id_imagen" ASC
                  LIMIT 1
                ) AS imagen_principal
            FROM "PRODUCTOS" p
            JOIN "CATEGORIAS" c ON c."id_categoria" = p."id_categoria"
            WHERE p."activo" = true
              AND c."activa" = true
            ORDER BY calificacion_promedio DESC NULLS LAST, p."fecha_creacion" DESC
        `)

        // Convertir la calificación a número y redondear a 1 decimal
        const products = result.rows.map(product => {
            // Asegurarse de que calificacion_promedio sea un número
            const calificacion = product.calificacion_promedio !== null 
                ? parseFloat(product.calificacion_promedio) 
                : 0;
                
            return {
                ...product,
                calificacion_promedio: calificacion.toFixed(1)
            };
        });

        res.json(products)
    } catch (error) {
        console.error('Error al obtener productos:', error)
        res.status(500).json({ message: 'Error al obtener productos' })
    }
}

export const createProduct = async (req, res) => {
    try {
        const role = req.user?.rol
        if (role !== 'Admin') {
            return res.status(403).json({ message: 'Solo un usuario Admin puede crear productos' })
        }

        const { nombre, descripcion, precio, stock, sku, marca, id_categoria, activo } = req.body

        if (!nombre || !precio || typeof stock === 'undefined' || !sku || !id_categoria) {
            return res.status(400).json({ message: 'Nombre, precio, stock, SKU e id_categoria son obligatorios' })
        }

        const parsedPrecio = Number(precio)
        const parsedStock = Number(stock)
        const parsedCategoria = Number(id_categoria)

        if (!Number.isFinite(parsedPrecio) || parsedPrecio <= 0) {
            return res.status(400).json({ message: 'Precio inválido' })
        }

        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ message: 'Stock inválido' })
        }

        if (!Number.isInteger(parsedCategoria) || parsedCategoria <= 0) {
            return res.status(400).json({ message: 'ID de categoría inválido' })
        }

        const result = await query(
            `INSERT INTO "PRODUCTOS" (
                "nombre",
                "descripcion",
                "precio",
                "stock",
                "sku",
                "marca",
                "activo",
                "id_categoria"
            ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true), $8)
            RETURNING 
                "id_producto" AS id,
                "nombre",
                "descripcion",
                "precio",
                "stock",
                "sku",
                "marca",
                "calificacion_promedio",
                "activo",
                "id_categoria"`,
            [
                nombre,
                descripcion ?? null,
                parsedPrecio,
                parsedStock,
                sku,
                marca ?? null,
                typeof activo === 'boolean' ? activo : true,
                parsedCategoria,
            ],
        )

        const product = result.rows[0]
        return res.status(201).json(product)
    } catch (error) {
        console.error('Error al crear producto:', error)
        return res.status(500).json({ message: 'Error al crear producto' })
    }
}

export const updateProduct = async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede actualizar productos' })
    }

    const { id } = req.params
    const productId = Number(id)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido' })
    }

    const { nombre, descripcion, precio, stock, sku, marca, id_categoria, activo } = req.body

    if (!nombre || !precio || typeof stock === 'undefined' || !sku || !id_categoria) {
      return res.status(400).json({ message: 'Nombre, precio, stock, SKU e id_categoria son obligatorios' })
    }

    const parsedPrecio = Number(precio)
    const parsedStock = Number(stock)
    const parsedCategoria = Number(id_categoria)

    if (!Number.isFinite(parsedPrecio) || parsedPrecio <= 0) {
      return res.status(400).json({ message: 'Precio inválido' })
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Stock inválido' })
    }

    if (!Number.isInteger(parsedCategoria) || parsedCategoria <= 0) {
      return res.status(400).json({ message: 'ID de categoría inválido' })
    }

    const result = await query(
      `UPDATE "PRODUCTOS"
       SET "nombre" = $1,
           "descripcion" = $2,
           "precio" = $3,
           "stock" = $4,
           "sku" = $5,
           "marca" = $6,
           "activo" = COALESCE($7, "activo"),
           "id_categoria" = $8
       WHERE "id_producto" = $9
       RETURNING 
         "id_producto" AS id,
         "nombre",
         "descripcion",
         "precio",
         "stock",
         "sku",
         "marca",
         "calificacion_promedio",
         "activo",
         "id_categoria"`,
      [
        nombre,
        descripcion ?? null,
        parsedPrecio,
        parsedStock,
        sku,
        marca ?? null,
        typeof activo === 'boolean' ? activo : null,
        parsedCategoria,
        productId,
      ],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const product = result.rows[0]
    return res.json(product)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return res.status(500).json({ message: 'Error al actualizar producto' })
  }
}

export const deleteProduct = async (req, res) => {
    try {
        const role = req.user?.rol
        if (role !== 'Admin') {
            return res.status(403).json({ message: 'Solo un usuario Admin puede eliminar productos' })
        }

        const { id } = req.params
        const productId = Number(id)

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({ message: 'ID de producto inválido' })
        }

        const result = await query(
            `UPDATE "PRODUCTOS"
             SET "activo" = false
             WHERE "id_producto" = $1 AND "activo" = true
             RETURNING "id_producto"`,
            [productId],
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o ya inactivo' })
        }

        return res.json({ message: 'Producto eliminado correctamente' })
    } catch (error) {
        console.error('Error al eliminar producto:', error)
        return res.status(500).json({ message: 'Error al eliminar producto' })
    }
}
