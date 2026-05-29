const incidenciaModel = require('../models/incidenciaModel');

// Obtener salones de un edificio
async function getSalones(req, res) {
    try {
        const edificioId = req.query.edificio_id;
        if (!edificioId) {
            return res.status(400).json({ error: 'Se requiere edificio_id' });
        }
        const salones = await incidenciaModel.getSalonesByEdificio(edificioId);
        res.json(salones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener salones' });
    }
}

// Crear reporte de incidencia
async function createIncidencia(req, res) {
    try {
        const { descripcion, usuario_id, salon_id } = req.body;
        if (!descripcion || !usuario_id || !salon_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const newId = await incidenciaModel.createIncidencia(descripcion, usuario_id, salon_id);
        res.status(201).json({ id: newId, mensaje: 'Incidencia reportada con éxito' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear incidencia' });
    }
}

// Obtener todas las incidencias (con filtro opcional)
async function getIncidencias(req, res) {
    try {
        const estado = req.query.estado;
        const incidencias = await incidenciaModel.getIncidencias(estado);
        res.json(incidencias);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener incidencias' });
    }
}

// Cambiar estado de incidencia
async function updateEstado(req, res) {
    try {
        const id = req.params.id;
        const { estado } = req.body;
        if (!['Pendiente', 'En Proceso', 'Resuelto'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        const success = await incidenciaModel.updateEstadoIncidencia(id, estado);
        if (success) {
            res.json({ mensaje: 'Estado actualizado' });
        } else {
            res.status(404).json({ error: 'Incidencia no encontrada' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
}

// Obtener estadísticas (GROUP BY edificio, estado)
async function getEstadisticas(req, res) {
    try {
        const stats = await incidenciaModel.getEstadisticas();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
}

// CRUD Edificios
async function listEdificios(req, res) {
    try {
        const edificios = await incidenciaModel.getEdificios();
        res.json(edificios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function addEdificio(req, res) {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
        const id = await incidenciaModel.createEdificio(nombre);
        res.status(201).json({ id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function editEdificio(req, res) {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const success = await incidenciaModel.updateEdificio(id, nombre);
        if (success) res.json({ mensaje: 'Edificio actualizado' });
        else res.status(404).json({ error: 'No encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function removeEdificio(req, res) {
    try {
        const { id } = req.params;
        const success = await incidenciaModel.deleteEdificio(id);
        if (success) res.json({ mensaje: 'Edificio eliminado' });
        else res.status(404).json({ error: 'No encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Listar usuarios
async function listUsuarios(req, res) {
    try {
        const usuarios = await incidenciaModel.getUsuarios();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ========== CRUD SALONES ==========
async function listSalones(req, res) {
    try {
        const salones = await incidenciaModel.getAllSalones();
        res.json(salones);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function addSalon(req, res) {
    try {
        const { nombre, edificio_id } = req.body;
        if (!nombre || !edificio_id) return res.status(400).json({ error: 'Faltan datos' });
        const id = await incidenciaModel.createSalon(nombre, edificio_id);
        res.status(201).json({ id, nombre, edificio_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function editSalon(req, res) {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const success = await incidenciaModel.updateSalon(id, nombre);
        if (success) res.json({ mensaje: 'Salón actualizado' });
        else res.status(404).json({ error: 'No encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function removeSalon(req, res) {
    try {
        const { id } = req.params;
        const success = await incidenciaModel.deleteSalon(id);
        if (success) res.json({ mensaje: 'Salón eliminado' });
        else res.status(404).json({ error: 'No encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getSalones,
    createIncidencia,
    getIncidencias,
    updateEstado,
    getEstadisticas,
    listEdificios,
    addEdificio,
    editEdificio,
    removeEdificio,
    listUsuarios,
    // Nuevas:
    listSalones,
    addSalon,
    editSalon,
    removeSalon
};