import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middlewares/auth.js'
import { getMe, updateMe, updateLastSession } from '../controllers/user.controller.js'
import { query } from '../database/connection.js'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir)
  },
  filename: (req, _file, cb) => {
    const userId = req.user?.id
    cb(null, `${userId}.jpg`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'))
    }
    cb(null, true)
  },
})

router.get('/me', authMiddleware, getMe)
router.put('/me', authMiddleware, updateMe)
router.post('/me/last-session', authMiddleware, updateLastSession)

router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' })
    }

    const baseUrl = process.env.VITE_API_URL || process.env.API_URL || ''
    const urlPath = `/uploads/avatars/${userId}.jpg`
    const fullUrl = baseUrl ? `${baseUrl}${urlPath}` : urlPath

    await query('UPDATE "USUARIOS" SET "url_img" = $1 WHERE "id_usuario" = $2', [fullUrl, userId])

    return res.json({ url_img: fullUrl })
  } catch (error) {
    console.error('Error al subir avatar:', error)
    return res.status(500).json({ message: 'Error al subir la imagen de perfil' })
  }
})

router.delete('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const avatarPath = path.join(avatarsDir, `${userId}.jpg`)

    if (fs.existsSync(avatarPath)) {
      try {
        fs.unlinkSync(avatarPath)
      } catch (fileError) {
        console.error('Error al eliminar archivo de avatar:', fileError)
        // continuamos, ya que lo importante es limpiar la referencia en la BD
      }
    }

    await query('UPDATE "USUARIOS" SET "url_img" = $2 WHERE "id_usuario" = $1', [userId, ''])

    return res.json({ message: 'Avatar eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar avatar:', error)
    return res.status(500).json({ message: 'Error al eliminar la imagen de perfil' })
  }
})

export default router
