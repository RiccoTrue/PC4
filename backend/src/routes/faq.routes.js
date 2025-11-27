import { Router } from 'express'
import { getPublicFaqs } from '../controllers/faq.controller.js'

const router = Router()

router.get('/', getPublicFaqs)

export default router
