import { query } from '../database/connection.js'
import { generateToken } from '../middlewares/auth.js'

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const result = await query(
      'SELECT "id_usuario", "email", "nombre", "apellido", "telefono", "fecha_registro", "ultima_sesion", "rol", "url_img" FROM "USUARIOS" WHERE "id_usuario" = $1',
      [userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const user = result.rows[0]

    return res.json({
      id: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      fecha_registro: user.fecha_registro,
      ultima_sesion: user.ultima_sesion,
      rol: user.rol,
      url_img: user.url_img,
    })
  } catch (error) {
    console.error('Error en getMe:', error)
    return res.status(500).json({ message: 'Error en el servidor' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const { nombre, apellido, telefono } = req.body

    const result = await query(
      'UPDATE "USUARIOS" SET "nombre" = $1, "apellido" = $2, "telefono" = $3 WHERE "id_usuario" = $4 RETURNING "id_usuario", "email", "nombre", "apellido", "telefono", "fecha_registro", "ultima_sesion", "rol", "url_img"',
      [nombre, apellido, telefono ?? null, userId],
    )

    const user = result.rows[0]

    const token = generateToken({
      id: user.id_usuario,
      email: user.email,
      rol: user.rol,
    })

    return res.json({
      id: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      fecha_registro: user.fecha_registro,
      ultima_sesion: user.ultima_sesion,
      rol: user.rol,
      url_img: user.url_img,
      token,
    })
  } catch (error) {
    console.error('Error en updateMe:', error)
    return res.status(500).json({ message: 'Error en el servidor' })
  }
}

export const updateLastSession = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    await query('UPDATE "USUARIOS" SET "ultima_sesion" = CURRENT_TIMESTAMP WHERE "id_usuario" = $1', [userId])

    return res.json({ message: 'Última sesión actualizada' })
  } catch (error) {
    console.error('Error al actualizar última sesión:', error)
    return res.status(500).json({ message: 'Error al actualizar última sesión' })
  }
}
