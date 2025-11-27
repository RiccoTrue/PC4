import dotenv from 'dotenv'

dotenv.config()

export const config = {
    app: {
        port: process.env.PORT,
        env: process.env.NODE_ENV
    },

    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT
    },

    security: {
        jwtSecret: process.env.JWT_SECRET,
    }
}