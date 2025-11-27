import { config } from './config/configuration.js'
import { testConnection } from './database/connection.js'
import app from './app.js'

const PORT = config.app.port || 3000

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)

    try {
        await testConnection()
        console.log('Conexión a la base de datos exitosa')
    } catch (error) {
        console.error('No se pudo conectar a la base de datos')
    }
})
