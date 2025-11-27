import bcrypt from 'bcrypt'
import { query } from '../database/connection.js'
import { generateToken } from '../middlewares/auth.js'

export const login = async (req, res) => {
    const { email, password, portal } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    try {
        const result = await query(
            'SELECT "id_usuario", "email", "password_hash", "nombre", "apellido", "rol", "activo", "url_img" FROM "USUARIOS" WHERE "email" = $1',
            [normalizedEmail]
        )

        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' })
        }

        const user = result.rows[0]

        if (!user.activo) {
            return res.status(403).json({ message: 'Usuario inactivo' })
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash)

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' })
        }

        if (portal === 'client' && user.rol !== 'Cliente') {
            return res.status(403).json({ message: 'No cuentas con una cuenta válida para iniciar sesión en esta plataforma' })
        }

        const token = generateToken({
            id: user.id_usuario,
            email: user.email,
            rol: user.rol,
        })

        return res.json({
            token,
            user: {
                id: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                url_img: user.url_img,
                foto: !!user.url_img,
            },
        })
    } catch (error) {
        console.error('Error en login:', error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

export const register = async (req, res) => {
    const { email, password, confirmPassword, nombre, apellido, telefono } = req.body

    if (!email || !password || !nombre || !apellido) {
        return res.status(400).json({ message: 'Email, contraseña, nombre y apellido son obligatorios' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' })
    }

    const passwordIsStrong =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)

    if (!passwordIsStrong) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        })
    }

    try {
        const existing = await query(
            'SELECT 1 FROM "USUARIOS" WHERE "email" = $1',
            [normalizedEmail]
        )

        if (existing.rowCount > 0) {
            return res.status(409).json({ message: 'El email ya está registrado' })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const insertResult = await query(
            `INSERT INTO "USUARIOS" ("email", "password_hash", "nombre", "apellido", "telefono")
             VALUES ($1, $2, $3, $4, $5)
             RETURNING "id_usuario", "email", "nombre", "apellido", "rol", "url_img"`,
            [normalizedEmail, passwordHash, nombre, apellido, telefono || null]
        )

        const user = insertResult.rows[0]

        const token = generateToken({
            id: user.id_usuario,
            email: user.email,
            rol: user.rol,
        })

        return res.status(201).json({
            token,
            user: {
                id: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                url_img: user.url_img,
                foto: !!user.url_img,
            },
        })
    } catch (error) {
        console.error('Error en registro:', error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

export const changePassword = async (req, res) => {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' })
    }

    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Debes completar todos los campos de contraseña' })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas nuevas no coinciden' })
    }

    const passwordIsStrong =
        newPassword.length >= 8 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword)

    if (!passwordIsStrong) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        })
    }

    try {
        const result = await query(
            'SELECT "password_hash" FROM "USUARIOS" WHERE "id_usuario" = $1',
            [userId]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const user = result.rows[0]
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

        if (!isValidPassword) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' })
        }

        const newHash = await bcrypt.hash(newPassword, 10)

        await query(
            'UPDATE "USUARIOS" SET "password_hash" = $1 WHERE "id_usuario" = $2',
            [newHash, userId]
        )

        return res.json({ message: 'Contraseña actualizada correctamente' })
    } catch (error) {
        console.error('Error en changePassword:', error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}
