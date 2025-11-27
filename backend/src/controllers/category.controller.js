import { query } from '../database/connection.js'

export const getAllCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        "id_categoria" AS id,
        "nombre" AS nombre,
        "descripcion",
        "categoria_padre" AS parent_id,
        "activa" AS activo
      FROM "CATEGORIAS"
      WHERE "activa" = true
      ORDER BY "id_categoria" ASC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener categorías:', error?.message || error)
    res.status(500).json({ message: 'Error al obtener categorías' })
  }
}

export const createCategory = async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede crear categorías' })
    }

    const { nombre, descripcion, parent_id } = req.body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' })
    }

    const trimmedName = nombre.trim()
    const trimmedDesc = typeof descripcion === 'string' ? descripcion.trim() : null
    const parentIdNum = parent_id == null ? null : Number(parent_id)
    if (parentIdNum != null && (!Number.isInteger(parentIdNum) || parentIdNum <= 0)) {
      return res.status(400).json({ message: 'ID de categoría padre inválido' })
    }

    const result = await query(
      `INSERT INTO "CATEGORIAS" ("nombre", "descripcion", "categoria_padre", "activa")
       VALUES ($1, $2, $3, true)
       RETURNING "id_categoria" AS id, "nombre", "descripcion", "categoria_padre" AS parent_id, "activa" AS activo`,
      [trimmedName, trimmedDesc, parentIdNum],
    )

    return res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error al crear categoría:', error?.message || error)
    return res.status(500).json({ message: 'Error al crear categoría' })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede eliminar categorías' })
    }

    const { id } = req.params
    const categoryId = Number(id)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: 'ID de categoría inválido' })
    }

    // Comprobar si existe la categoría
    const existingResult = await query(
      'SELECT "id_categoria", "activa" FROM "CATEGORIAS" WHERE "id_categoria" = $1',
      [categoryId],
    )

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    const categoria = existingResult.rows[0]

    // Verificar si tiene subcategorías activas o inactivas
    const childrenResult = await query(
      'SELECT 1 FROM "CATEGORIAS" WHERE "categoria_padre" = $1 LIMIT 1',
      [categoryId],
    )

    // Verificar si tiene productos activos asociados
    const productsResult = await query(
      'SELECT 1 FROM "PRODUCTOS" WHERE "id_categoria" = $1 AND "activo" = true LIMIT 1',
      [categoryId],
    )

    const hasChildren = childrenResult.rowCount > 0
    const hasProducts = productsResult.rowCount > 0

    if (!hasChildren && !hasProducts) {
      // No tiene dependencias: podemos eliminar definitivamente la categoría
      await query('DELETE FROM "CATEGORIAS" WHERE "id_categoria" = $1', [categoryId])
      return res.json({ message: 'Categoría eliminada definitivamente' })
    }

    // Tiene dependencias: solo marcar como inactiva
    if (categoria.activa === false) {
      return res.status(400).json({
        message:
          'No se puede eliminar la categoría porque tiene subcategorías o productos asociados. Desactívala o reubica los productos primero.',
      })
    }

    await query('UPDATE "CATEGORIAS" SET "activa" = false WHERE "id_categoria" = $1', [categoryId])

    return res.json({
      message:
        'La categoría tiene subcategorías o productos asociados, por lo que se ha marcado como inactiva en lugar de eliminarla.',
    })
  } catch (error) {
    console.error('Error al eliminar categoría:', error?.message || error)
    return res.status(500).json({ message: 'Error al eliminar categoría' })
  }
}
