import jwt from 'jsonwebtoken'
import { config } from '../config/configuration.js'

const JWT_SECRET = config.security.jwtSecret

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' })
    }
}

export const generateToken = (payload, options = {}) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1h',
        ...options,
    })
}
