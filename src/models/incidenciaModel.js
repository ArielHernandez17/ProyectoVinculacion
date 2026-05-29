const { pool } = require('../config/db');

// ========== FUNCIONES ORIGINALES ==========
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

async function getIncidencias(filtroEstado = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        let query = `
            SELECT i.id, i.descripcion, i.estado, i.comentario, i.imagen_path, i.fecha_creacion,
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

// Versión original (sin historial) - se mantiene por si acaso
async function updateEstadoIncidencia(id, nuevoEstado, comentario = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT estado FROM incidencias WHERE id = ?', [id]);
        if (rows.length === 0) return false;
        const estadoActual = rows[0].estado;
        if (estadoActual === 'Resuelto') {
            throw new Error('No se puede modificar una incidencia que ya está resuelta');
        }
        let query = 'UPDATE incidencias SET estado = ?';
        const params = [nuevoEstado];
        if (comentario !== null) {
            query += ', comentario = ?';
            params.push(comentario);
        }
        query += ' WHERE id = ?';
        params.push(id);
        const result = await conn.query(query, params);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

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

// ========== CRUD SALONES ==========
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

// ========== NUEVAS FUNCIONES PARA MEJORAS ==========

// Paginación de incidencias
async function getIncidenciasPaginadas(filtroEstado = null, pagina = 1, limite = 5) {
    let conn;
    try {
        conn = await pool.getConnection();
        const offset = (pagina - 1) * limite;
        let queryCount = 'SELECT COUNT(*) as total FROM incidencias i';
        let queryData = `
            SELECT i.id, i.descripcion, i.estado, i.comentario, i.imagen_path, i.fecha_creacion,
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
            queryCount += ' WHERE i.estado = ?';
            queryData += ' WHERE i.estado = ?';
            params.push(filtroEstado);
        }
        queryData += ' ORDER BY i.fecha_creacion DESC LIMIT ? OFFSET ?';
        const rows = await conn.query(queryData, [...params, limite, offset]);
        const totalResult = await conn.query(queryCount, params);
        const total = totalResult[0].total;
        return {
            data: rows,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite)
        };
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Historial de cambios
async function registrarHistorial(incidenciaId, estadoAnterior, estadoNuevo, comentario, usuarioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            `INSERT INTO incidencias_historial 
             (incidencia_id, estado_anterior, estado_nuevo, comentario, usuario_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [incidenciaId, estadoAnterior, estadoNuevo, comentario, usuarioId]
        );
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function obtenerHistorial(incidenciaId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SELECT h.*, u.nombre as usuario_nombre 
             FROM incidencias_historial h
             JOIN usuarios u ON h.usuario_id = u.id
             WHERE h.incidencia_id = ?
             ORDER BY h.fecha_cambio DESC`,
            [incidenciaId]
        );
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Actualizar estado con historial automático
async function updateEstadoIncidenciaConHistorial(id, nuevoEstado, comentario, usuarioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT estado FROM incidencias WHERE id = ?', [id]);
        if (rows.length === 0) return false;
        const estadoActual = rows[0].estado;
        if (estadoActual === 'Resuelto') {
            throw new Error('No se puede modificar una incidencia ya resuelta');
        }
        if (estadoActual === nuevoEstado) {
            throw new Error('El estado ya es el mismo');
        }
        await conn.query('UPDATE incidencias SET estado = ?, comentario = ? WHERE id = ?', 
                         [nuevoEstado, comentario, id]);
        await registrarHistorial(id, estadoActual, nuevoEstado, comentario, usuarioId);
        return true;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Exportación CSV
async function getIncidenciasParaExportar(filtroEstado = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        let query = `
            SELECT i.id, i.descripcion, i.estado, i.comentario, i.fecha_creacion,
                   u.nombre AS usuario, s.nombre AS salon, e.nombre AS edificio
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

// Guardar ruta de imagen
async function guardarRutaImagen(incidenciaId, rutaImagen) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('UPDATE incidencias SET imagen_path = ? WHERE id = ?', [rutaImagen, incidenciaId]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Paginación de salones
async function getSalonesPaginados(pagina = 1, limite = 10, edificioId = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        const offset = (pagina - 1) * limite;
        let queryCount = 'SELECT COUNT(*) as total FROM salones';
        let queryData = `
            SELECT s.id, s.nombre, s.edificio_id, e.nombre as edificio_nombre 
            FROM salones s 
            JOIN edificios e ON s.edificio_id = e.id
        `;
        const params = [];
        if (edificioId) {
            queryCount += ' WHERE edificio_id = ?';
            queryData += ' WHERE s.edificio_id = ?';
            params.push(edificioId);
        }
        queryData += ' ORDER BY e.nombre, s.nombre LIMIT ? OFFSET ?';
        const rows = await conn.query(queryData, [...params, limite, offset]);
        const totalResult = await conn.query(queryCount, edificioId ? [edificioId] : []);
        const total = totalResult[0].total;
        return {
            data: rows,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite)
        };
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// ========== EXPORTAR TODAS LAS FUNCIONES ==========
module.exports = {
    // Originales
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
    getAllSalones,
    createSalon,
    updateSalon,
    deleteSalon,
    // Nuevas
    getIncidenciasPaginadas,
    registrarHistorial,
    obtenerHistorial,
    updateEstadoIncidenciaConHistorial,
    getIncidenciasParaExportar,
    guardarRutaImagen,
    getSalonesPaginados
};