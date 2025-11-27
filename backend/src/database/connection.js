import pkg from 'pg'
import { config } from '../config/configuration.js'

const { Pool } = pkg

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
})

export const query = (text, params) => pool.query(text, params)

export const testConnection = async () => {
    try {
        const result = await pool.query('SELECT 1')
        return result.rows[0]
    } catch (error) {
        console.error('Error al probar la conexión a la base de datos:', error)
        throw error
    }
}
