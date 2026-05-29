const mariadb = require('mariadb');
const dotenv = require('dotenv');
dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'incidencias_db',
    connectionLimit: 5
});

// Función para obtener conexión y manejar errores
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        throw err;
    }
}

module.exports = { pool, getConnection };