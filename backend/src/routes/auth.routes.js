import { Router } from 'express'
import { login, register, changePassword } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.post('/change-password', authMiddleware, changePassword)

export default router
