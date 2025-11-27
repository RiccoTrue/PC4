import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { createOrder, getMyOrders, createReturnRequest, getMyOrderDetails, getMyOrderReturn } from '../controllers/order.controller.js'

const router = Router()

router.get('/', authMiddleware, getMyOrders)
router.get('/:id', authMiddleware, getMyOrderDetails)
router.post('/', authMiddleware, createOrder)
router.post('/:id/return', authMiddleware, createReturnRequest)
router.get('/:id/return', authMiddleware, getMyOrderReturn)

export default router
