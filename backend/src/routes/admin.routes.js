import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import {
  getOverviewStats,
  listUsers,
  createUserByAdmin,
  deleteUserByAdmin,
  applyBatchDiscountToProducts,
  registerProductLot,
  getInventoryHistory,
  getAllPromotions,
  createPromotion,
} from '../controllers/admin.controller.js'
import { getAllOrders, getOrderDetails, getAllReturns, updateOrderStatus, updateReturnStatus } from '../controllers/order.controller.js'

const router = Router()

router.get('/stats/overview', authMiddleware, getOverviewStats)

router.get('/users', authMiddleware, listUsers)
router.post('/users', authMiddleware, createUserByAdmin)
router.delete('/users/:id', authMiddleware, deleteUserByAdmin)

router.post('/products/batch-discount', authMiddleware, applyBatchDiscountToProducts)
router.post('/products/:id/lot', authMiddleware, registerProductLot)

router.get('/inventory/history', authMiddleware, getInventoryHistory)

router.get('/orders', authMiddleware, getAllOrders)
router.get('/orders/:id', authMiddleware, getOrderDetails)
router.patch('/orders/:id/status', authMiddleware, updateOrderStatus)

router.get('/returns', authMiddleware, getAllReturns)
router.patch('/returns/:id/status', authMiddleware, updateReturnStatus)

router.get('/promotions', authMiddleware, getAllPromotions)
router.post('/promotions', authMiddleware, createPromotion)

export default router
