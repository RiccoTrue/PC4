import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { createReviewFromOrder, getOrderReviewsStatus } from '../controllers/reviews.controller.js'

const router = Router()

router.get('/order/:id/status', authMiddleware, getOrderReviewsStatus)
router.post('/from-order', authMiddleware, createReviewFromOrder)

export default router
