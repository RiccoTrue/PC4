import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { getMyTickets, getTicketMessages, createTicketMessage } from '../controllers/support.controller.js'

const router = Router()

router.get('/tickets/mine', authMiddleware, getMyTickets)
router.get('/tickets/:id/messages', authMiddleware, getTicketMessages)
router.post('/tickets/:id/messages', authMiddleware, createTicketMessage)

export default router
