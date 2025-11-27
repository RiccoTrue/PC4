import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { getMyWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getMyWishlist)
router.post('/', addToWishlist)
router.delete('/:productId', removeFromWishlist)

export default router
