import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllProducts, createProduct, deleteProduct, updateProduct } from '../controllers/product.controller.js'
import { getProductReviews } from '../controllers/reviews.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { query } from '../database/connection.js'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const productsDir = path.join(__dirname, '..', '..', 'uploads', 'products')

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productsDir)
  },
  filename: (req, file, cb) => {
    const { id } = req.params
    const productId = Number(id) || 'unknown'
    const timestamp = Date.now()
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
    cb(null, `${productId}-${timestamp}-${safeOriginal}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'))
    }
    cb(null, true)
  },
})

router.get('/', getAllProducts)
router.post('/', authMiddleware, createProduct)
router.put('/:id', authMiddleware, updateProduct)
router.delete('/:id', authMiddleware, deleteProduct)
router.get('/:id/reviews', getProductReviews)

router.post('/:id/images', authMiddleware, upload.array('images', 4), async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede subir imágenes de productos' })
    }

    const { id } = req.params
    const productId = Number(id)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido' })
    }

    const files = req.files
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'No se recibieron imágenes' })
    }

    const baseUrl = process.env.VITE_API_URL || process.env.API_URL || ''

    const maxImages = 4

    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM "IMAGENES_PRODUCTO" WHERE "id_producto" = $1',
      [productId],
    )
    const currentCount = countResult.rows[0]?.total ?? 0

    if (currentCount >= maxImages) {
      return res.status(400).json({ message: 'Este producto ya tiene el máximo de 4 imágenes' })
    }

    const availableSlots = maxImages - currentCount
    const filesArray = files.slice(0, availableSlots)

    // Verificar si ya existe una imagen principal
    const principalResult = await query(
      'SELECT EXISTS (SELECT 1 FROM "IMAGENES_PRODUCTO" WHERE "id_producto" = $1 AND "es_principal" = true) AS has_principal',
      [productId],
    )
    const hasPrincipal = principalResult.rows[0]?.has_principal === true

    const inserted = []
    for (const [index, file] of filesArray.entries()) {
      const filename = file.filename
      const urlPath = `/uploads/products/${filename}`
      const fullUrl = baseUrl ? `${baseUrl}${urlPath}` : urlPath

      const isPrincipal = !hasPrincipal && index === 0

      const result = await query(
        `INSERT INTO "IMAGENES_PRODUCTO" ("id_producto", "url_imagen", "es_principal", "orden")
         VALUES ($1, $2, $3, $4)
         RETURNING "id_imagen", "url_imagen", "es_principal", "orden"`,
        [productId, fullUrl, isPrincipal, 0],
      )

      inserted.push(result.rows[0])
    }

    return res.status(201).json({ images: inserted })
  } catch (error) {
    console.error('Error al subir imágenes de producto:', error)
    return res.status(500).json({ message: 'Error al subir imágenes de producto' })
  }
})

// Obtener imágenes de un producto (público)
router.get('/:id/images', async (req, res) => {
  try {
    const productId = Number(req.params.id)
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'ID de producto inválido' })
    }

    const result = await query(
      'SELECT "id_imagen", "id_producto", "url_imagen", "es_principal", "orden" FROM "IMAGENES_PRODUCTO" WHERE "id_producto" = $1 ORDER BY "es_principal" DESC, "id_imagen" ASC',
      [productId],
    )

    return res.json({ images: result.rows })
  } catch (error) {
    console.error('Error al obtener imágenes de producto:', error)
    return res.status(500).json({ message: 'Error al obtener imágenes de producto' })
  }
})

// Eliminar una imagen de producto
router.delete('/images/:imageId', authMiddleware, async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede eliminar imágenes de productos' })
    }

    const imageId = Number(req.params.imageId)
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ message: 'ID de imagen inválido' })
    }

    const imageResult = await query(
      'SELECT "id_producto", "url_imagen" FROM "IMAGENES_PRODUCTO" WHERE "id_imagen" = $1',
      [imageId],
    )

    if (imageResult.rowCount === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' })
    }

    const image = imageResult.rows[0]

    await query('DELETE FROM "IMAGENES_PRODUCTO" WHERE "id_imagen" = $1', [imageId])

    // Intentar borrar el archivo físico si existe
    try {
      const url = image.url_imagen
      const marker = '/uploads/products/'
      const idx = typeof url === 'string' ? url.indexOf(marker) : -1
      if (idx !== -1) {
        const filename = url.substring(idx + marker.length)
        const filePath = path.join(productsDir, path.basename(filename))
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
    } catch (fileError) {
      console.warn('No se pudo eliminar el archivo físico de la imagen:', fileError)
    }

    return res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar imagen de producto:', error)
    return res.status(500).json({ message: 'Error al eliminar imagen de producto' })
  }
})

// Marcar una imagen como principal
router.post('/images/:imageId/principal', authMiddleware, async (req, res) => {
  try {
    const role = req.user?.rol
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Solo un usuario Admin puede marcar imágenes como principales' })
    }

    const imageId = Number(req.params.imageId)
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ message: 'ID de imagen inválido' })
    }

    const imageResult = await query(
      'SELECT "id_producto" FROM "IMAGENES_PRODUCTO" WHERE "id_imagen" = $1',
      [imageId],
    )

    if (imageResult.rowCount === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' })
    }

    const { id_producto: productId } = imageResult.rows[0]

    await query('UPDATE "IMAGENES_PRODUCTO" SET "es_principal" = false WHERE "id_producto" = $1', [productId])
    const updated = await query(
      'UPDATE "IMAGENES_PRODUCTO" SET "es_principal" = true WHERE "id_imagen" = $1 RETURNING "id_imagen", "id_producto", "url_imagen", "es_principal", "orden"',
      [imageId],
    )

    return res.json({ image: updated.rows[0] })
  } catch (error) {
    console.error('Error al marcar imagen principal:', error)
    return res.status(500).json({ message: 'Error al marcar imagen principal' })
  }
})

export default router
