import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { getMyCart, addToCart, updateCartItem, removeFromCart } from '../controllers/cart.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getMyCart)
router.post('/', addToCart)
router.put('/:productId', updateCartItem)
router.delete('/:productId', removeFromCart)

export default router
