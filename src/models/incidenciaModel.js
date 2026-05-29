// Modelo: incidenciaModel.js
// Capa de acceso a datos: todas las consultas SQL a MariaDB usando pool de conexiones

const { pool } = require('../config/db');  // Pool de conexiones (reutilizable)

// ==================== FUNCIONES ORIGINALES (básicas) ====================

// Obtener salones de un edificio específico (sin paginación)
async function getSalonesByEdificio(edificioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT id, nombre FROM salones WHERE edificio_id = ? ORDER BY nombre', [edificioId]);
        return rows;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Crear una nueva incidencia con estado inicial "Pendiente"
async function createIncidencia(descripcion, usuarioId, salonId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO incidencias (descripcion, usuario_id, salon_id, estado) VALUES (?, ?, ?, "Pendiente")',
            [descripcion, usuarioId, salonId]
        );
        return result.insertId;  // Devuelve el ID autogenerado
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Listar incidencias con JOINs para mostrar nombres de usuario, salón y edificio (opcional filtro por estado)
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
        return await conn.query(query, params);
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Actualizar estado de incidencia (versión SIN historial, se conserva por compatibilidad)
async function updateEstadoIncidencia(id, nuevoEstado, comentario = null) {
    let conn;
    try {
        conn = await pool.getConnection();
        // Verificar si existe y si ya está Resuelto (no se puede cambiar)
        const rows = await conn.query('SELECT estado FROM incidencias WHERE id = ?', [id]);
        if (rows.length === 0) return false;
        if (rows[0].estado === 'Resuelto') {
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
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Obtener estadísticas: cantidad de incidencias por edificio y estado
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
        return await conn.query(query);
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// CRUD Edificios
async function getEdificios() {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query('SELECT id, nombre FROM edificios ORDER BY nombre');
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function createEdificio(nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO edificios (nombre) VALUES (?)', [nombre]);
        return result.insertId;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function updateEdificio(id, nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE edificios SET nombre = ? WHERE id = ?', [nombre, id]);
        return result.affectedRows > 0;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function deleteEdificio(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM edificios WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Listar usuarios con su rol (JOIN con tabla roles)
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
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// ========== CRUD SALONES ==========
async function getAllSalones() {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query(`
            SELECT s.id, s.nombre, s.edificio_id, e.nombre as edificio_nombre 
            FROM salones s 
            JOIN edificios e ON s.edificio_id = e.id 
            ORDER BY e.nombre, s.nombre
        `);
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function createSalon(nombre, edificioId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO salones (nombre, edificio_id) VALUES (?, ?)', [nombre, edificioId]);
        return result.insertId;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function updateSalon(id, nombre) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE salones SET nombre = ? WHERE id = ?', [nombre, id]);
        return result.affectedRows > 0;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}
async function deleteSalon(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        // Evitar eliminar salón que tiene incidencias asociadas (integridad referencial)
        const incidencias = await conn.query('SELECT id FROM incidencias WHERE salon_id = ? LIMIT 1', [id]);
        if (incidencias.length > 0) {
            throw new Error('No se puede eliminar el salón porque tiene incidencias asociadas.');
        }
        const result = await conn.query('DELETE FROM salones WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// ========== NUEVAS FUNCIONES PARA MEJORAS (paginación, historial, exportación, imágenes) ==========

// Paginación de incidencias con filtro opcional por estado
async function getIncidenciasPaginadas(filtroEstado = null, pagina = 1, limite = 5) {
    let conn;
    try {
        conn = await pool.getConnection();
        const offset = (pagina - 1) * limite;
        // Query para contar total de registros (mismo filtro)
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
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Registrar un cambio en la tabla historial
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
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Obtener el historial completo de una incidencia (con nombre del usuario que hizo el cambio)
async function obtenerHistorial(incidenciaId) {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query(
            `SELECT h.*, u.nombre as usuario_nombre 
             FROM incidencias_historial h
             JOIN usuarios u ON h.usuario_id = u.id
             WHERE h.incidencia_id = ?
             ORDER BY h.fecha_cambio DESC`,
            [incidenciaId]
        );
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Actualizar estado y automáticamente registrar en historial (versión mejorada)
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
        // Actualizar incidencia (también guarda comentario)
        await conn.query('UPDATE incidencias SET estado = ?, comentario = ? WHERE id = ?', 
                         [nuevoEstado, comentario, id]);
        // Registrar el cambio en historial
        await registrarHistorial(id, estadoActual, nuevoEstado, comentario, usuarioId);
        return true;
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Obtener datos planos para exportar a CSV (con JOINs simples)
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
        return await conn.query(query, params);
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Guardar la ruta de la imagen subida para una incidencia
async function guardarRutaImagen(incidenciaId, rutaImagen) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('UPDATE incidencias SET imagen_path = ? WHERE id = ?', [rutaImagen, incidenciaId]);
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Paginación de salones (con filtro por edificio opcional)
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
    } catch (err) { throw err; }
    finally { if (conn) conn.release(); }
}

// Exportar todo
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
    getAllSalones,
    createSalon,
    updateSalon,
    deleteSalon,
    getIncidenciasPaginadas,
    registrarHistorial,
    obtenerHistorial,
    updateEstadoIncidenciaConHistorial,
    getIncidenciasParaExportar,
    guardarRutaImagen,
    getSalonesPaginados
};