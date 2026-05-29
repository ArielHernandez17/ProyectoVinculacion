const { pool } = require('../config/db');

async function login(req, res) {
    const { correo, nombre, rol } = req.body;
    if (!correo || !nombre || !rol) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        // Buscar si el usuario ya existe por correo
        let [user] = await conn.query('SELECT id, nombre, rol_id FROM usuarios WHERE correo = ?', [correo]);
        let rolId;
        if (rol === 'Admin') rolId = 1;
        else if (rol === 'Revisor') rolId = 2;
        else rolId = 3;

        if (!user) {
            // Registrar nuevo usuario
            const result = await conn.query(
                'INSERT INTO usuarios (correo, nombre, rol_id) VALUES (?, ?, ?)',
                [correo, nombre, rolId]
            );
            user = { id: result.insertId, nombre, rol_id: rolId };
        } else {
            // Si ya existe, se puede actualizar rol por si acaso (opcional)
            if (user.rol_id !== rolId) {
                await conn.query('UPDATE usuarios SET rol_id = ? WHERE id = ?', [rolId, user.id]);
                user.rol_id = rolId;
            }
        }

        // Obtener nombre del rol
        const [rolObj] = await conn.query('SELECT nombre FROM roles WHERE id = ?', [user.rol_id]);
        res.json({
            id: user.id,
            nombre: user.nombre,
            correo,
            rol: rolObj.nombre
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el login' });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { login };