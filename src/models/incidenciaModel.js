const { pool } = require('../config/db');

// Obtener salones por edificio
async function getSalonesByEdificio(edificioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT id, nombre FROM salones WHERE edificio_id = ? ORDER BY nombre', [edificioId]);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Crear nueva incidencia
async function createIncidencia(descripcion, usuarioId, salonId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO incidencias (descripcion, usuario_id, salon_id, estado) VALUES (?, ?, ?, "Pendiente")',
            [descripcion, usuarioId, salonId]
        );
        return result.insertId;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Obtener incidencias con filtro opcional por estado y detalles de salón/edificio
async function getIncidencias(filtroEstado = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        let query = `
            SELECT i.id, i.descripcion, i.estado, i.fecha_creacion,
                   u.nombre AS usuario_nombre,
                   s.nombre AS salon_nombre,
                   e.nombre AS edificio_nombre
            FROM incidencias i
            JOIN usuarios u ON i.usuario_id = u.id
            JOIN salones s ON i.salon_id = s.id
            JOIN edificios e ON s.edificio_id = e.id
        `;
        const params = [];
        if (filtroEstado) {
            query += ' WHERE i.estado = ?';
            params.push(filtroEstado);
        }
        query += ' ORDER BY i.fecha_creacion DESC';
        const rows = await conn.query(query, params);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Actualizar estado de una incidencia
async function updateEstadoIncidencia(id, nuevoEstado) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE incidencias SET estado = ? WHERE id = ?', [nuevoEstado, id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Estadísticas: cantidad de incidencias por edificio y estado (GROUP BY)
async function getEstadisticas() {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT e.nombre AS edificio, i.estado, COUNT(*) AS total
            FROM incidencias i
            JOIN salones s ON i.salon_id = s.id
            JOIN edificios e ON s.edificio_id = e.id
            GROUP BY e.id, i.estado
            ORDER BY e.nombre, i.estado
        `;
        const rows = await conn.query(query);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// CRUD Edificios
async function getEdificios() {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query('SELECT id, nombre FROM edificios ORDER BY nombre');
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function createEdificio(nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO edificios (nombre) VALUES (?)', [nombre]);
        return result.insertId;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function updateEdificio(id, nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE edificios SET nombre = ? WHERE id = ?', [nombre, id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function deleteEdificio(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM edificios WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Usuarios (para admin)
async function getUsuarios() {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT u.id, u.correo, u.nombre, r.nombre AS rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id
        `;
        return await conn.query(query);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// ========== CRUD SALONES (para admin) ==========
async function getAllSalones() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`
            SELECT s.id, s.nombre, s.edificio_id, e.nombre as edificio_nombre 
            FROM salones s 
            JOIN edificios e ON s.edificio_id = e.id 
            ORDER BY e.nombre, s.nombre
        `);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function createSalon(nombre, edificioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO salones (nombre, edificio_id) VALUES (?, ?)', [nombre, edificioId]);
        return result.insertId;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function updateSalon(id, nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE salones SET nombre = ? WHERE id = ?', [nombre, id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function deleteSalon(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        // Verificar si tiene incidencias asociadas
        const incidencias = await conn.query('SELECT id FROM incidencias WHERE salon_id = ? LIMIT 1', [id]);
        if (incidencias.length > 0) {
            throw new Error('No se puede eliminar el salón porque tiene incidencias asociadas.');
        }
        const result = await conn.query('DELETE FROM salones WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    getSalonesByEdificio,
    createIncidencia,
    getIncidencias,
    updateEstadoIncidencia,
    getEstadisticas,
    getEdificios,
    createEdificio,
    updateEdificio,
    deleteEdificio,
    getUsuarios,
    // Nuevas:
    getAllSalones,
    createSalon,
    updateSalon,
    deleteSalon
};