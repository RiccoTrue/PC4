import { Router } from 'express'
import { getAllCategories, createCategory, deleteCategory } from '../controllers/category.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.get('/', getAllCategories)
router.post('/', authMiddleware, createCategory)
router.delete('/:id', authMiddleware, deleteCategory)

export default router
