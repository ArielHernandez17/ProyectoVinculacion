// ----------------------------------------------------------------------
// MÓDULO: conexion.js
// Propósito: Configurar y exportar un pool de conexiones a MariaDB
// ----------------------------------------------------------------------

// Importamos la librería oficial de MariaDB para Node.js
// Esta librería permite conexiones asíncronas con promesas y manejo de pools
const mariadb = require('mariadb');

// Importamos dotenv para cargar variables de entorno desde un archivo .env
// Esto mantiene la configuración sensible (contraseñas, hosts) fuera del código fuente
const dotenv = require('dotenv');

// Ejecutamos la configuración de dotenv para que process.env tenga los valores del archivo .env
dotenv.config();

// Creamos un pool de conexiones. Un pool mantiene varias conexiones abiertas listas para usar,
// lo que mejora el rendimiento en aplicaciones web con muchas peticiones concurrentes.
const pool = mariadb.createPool({
    // Host de la base de datos: si no existe la variable de entorno, usamos 'localhost'
    host: process.env.DB_HOST || 'localhost',
    // Puerto de MariaDB: por defecto 3306
    port: process.env.DB_PORT || 3306,
    // Usuario de la BD: por defecto 'root'
    user: process.env.DB_USER || 'root',
    // Contraseña: por defecto vacía (solo para desarrollo local)
    password: process.env.DB_PASSWORD || '',
    // Nombre de la base de datos a usar
    database: process.env.DB_NAME || 'incidencias_db',
    // Número máximo de conexiones simultáneas que el pool puede mantener
    // Valor conservador (5) para no saturar la BD en despliegues pequeños
    connectionLimit: 5
});

// Función auxiliar asíncrona para obtener una conexión del pool de forma segura
// Maneja errores de conexión de manera centralizada
async function getConnection() {
    try {
        // Intentamos obtener una conexión del pool
        // pool.getConnection() devuelve una promesa que resuelve en un objeto conexión
        return await pool.getConnection();
    } catch (err) {
        // Si hay error (por ejemplo: BD caída, credenciales incorrectas, límite excedido),
        // lo registramos en consola y lo relanzamos para que quien llame a esta función
        // pueda manejarlo (por ejemplo, devolviendo un error 500 en una API)
        console.error('Error al conectar con la base de datos:', err);
        throw err;  // Relanzamos el error para que no pase desapercibido
    }
}

// Exportamos tanto el pool (para consultas directas con pool.query() si se desea)
// como la función getConnection (recomendada para operaciones que requieren transacciones
// o múltiples consultas en la misma conexión)
module.exports = { pool, getConnection };