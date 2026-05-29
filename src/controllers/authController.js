// Controlador: authController.js
// Maneja el login/registro automático de usuarios usando correo y rol desde el frontend

const { pool } = require('../config/db');      // Pool de conexiones a MariaDB
const { generarToken } = require('../config/jwt'); // Función para crear JWT

async function login(req, res) {
    // El frontend envía correo, nombre y rol (por ejemplo, después de autenticación con Google)
    const { correo, nombre, rol } = req.body;

    // Validación básica: todos los campos son obligatorios
    if (!correo || !nombre || !rol) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    let conn; // Variable para mantener la conexión y liberarla en finally
    try {
        // 1. Obtener una conexión del pool
        conn = await pool.getConnection();

        // 2. Buscar si el usuario ya existe por su correo
        let users = await conn.query('SELECT id, nombre, rol_id FROM usuarios WHERE correo = ?', [correo]);
        let user = users[0]; // puede ser undefined si no existe

        // 3. Mapear el rol que viene del frontend (string) al id de rol en la BD
        let rolId;
        if (rol === 'Admin') rolId = 1;
        else if (rol === 'Revisor') rolId = 2;
        else rolId = 3; // rol 'Usuario' por defecto

        // 4. Si el usuario NO existe en BD, lo creamos con el rol recibido
        if (!user) {
            const result = await conn.query(
                'INSERT INTO usuarios (correo, nombre, rol_id) VALUES (?, ?, ?)',
                [correo, nombre, rolId]
            );
            // Construimos objeto user simulado con los datos insertados
            user = { id: result.insertId, nombre, rol_id: rolId };
        } else {
            // 5. Si el usuario existe pero su rol en BD es distinto al que envía el frontend,
            //    lo actualizamos (por ejemplo, si un usuario cambió de rol en el sistema externo)
            if (user.rol_id !== rolId) {
                await conn.query('UPDATE usuarios SET rol_id = ? WHERE id = ?', [rolId, user.id]);
                user.rol_id = rolId;
            }
        }

        // 6. Obtener el nombre del rol desde la tabla 'roles' para incluirlo en el token
        const rolObj = await conn.query('SELECT nombre FROM roles WHERE id = ?', [user.rol_id]);

        // 7. Construir el objeto completo del usuario que irá dentro del token
        const usuarioCompleto = {
            id: user.id,
            nombre: user.nombre,
            correo,
            rol: rolObj[0].nombre  // 'admin', 'revisor' o 'usuario'
        };

        // 8. Generar el JWT con vigencia de 8 horas (definida en jwt.js)
        const token = generarToken(usuarioCompleto);

        // 9. Devolver los datos del usuario junto con el token
        res.json({ ...usuarioCompleto, token });
    } catch (err) {
        // Cualquier error de BD o de consulta se captura aquí
        console.error(err);
        res.status(500).json({ error: 'Error en el login' });
    } finally {
        // SIEMPRE liberar la conexión al pool para evitar fugas
        if (conn) conn.release();
    }
}

module.exports = { login };