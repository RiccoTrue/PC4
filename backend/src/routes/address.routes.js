import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { getMyAddress, upsertMyAddress } from '../controllers/address.controller.js'

const router = Router()

router.get('/me', authMiddleware, getMyAddress)
router.post('/me', authMiddleware, upsertMyAddress)

export default router
