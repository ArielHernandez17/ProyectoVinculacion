const incidenciaModel = require('../models/incidenciaModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== FUNCIONES ORIGINALES ==========
async function getSalones(req, res) {
    try {
        const edificioId = req.query.edificio_id;
        if (!edificioId) return res.status(400).json({ error: 'Se requiere edificio_id' });
        const salones = await incidenciaModel.getSalonesByEdificio(edificioId);
        res.json(salones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener salones' });
    }
}

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

// ========== NUEVAS FUNCIONES PARA MEJORAS ==========
async function getIncidenciasPaginadas(req, res) {
    try {
        const estado = req.query.estado || null;
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 5;
        const resultado = await incidenciaModel.getIncidenciasPaginadas(estado, pagina, limite);
        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener incidencias paginadas' });
    }
}

async function updateEstadoConHistorial(req, res) {
    try {
        const id = req.params.id;
        const { estado, comentario } = req.body;
        if (!['Pendiente', 'En Proceso', 'Resuelto'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        const usuarioId = req.usuario.id;
        const success = await incidenciaModel.updateEstadoIncidenciaConHistorial(id, estado, comentario || null, usuarioId);
        if (success) {
            res.json({ mensaje: 'Estado actualizado y registrado en historial' });
        } else {
            res.status(404).json({ error: 'Incidencia no encontrada' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

async function getHistorial(req, res) {
    try {
        const id = req.params.id;
        const historial = await incidenciaModel.obtenerHistorial(id);
        res.json(historial);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
}

async function exportarIncidenciasCSV(req, res) {
    try {
        const estado = req.query.estado || null;
        const incidencias = await incidenciaModel.getIncidenciasParaExportar(estado);
        const json2csv = require('json2csv').parse;
        const fields = ['id', 'descripcion', 'estado', 'comentario', 'fecha_creacion', 'usuario', 'edificio', 'salon'];
        const csv = json2csv(incidencias, { fields });
        res.header('Content-Type', 'text/csv');
        res.attachment(`incidencias_${Date.now()}.csv`);
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al exportar CSV' });
    }
}

// Configuración de multer para imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './src/public/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }).single('imagen');

async function subirImagen(req, res) {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });
        const incidenciaId = req.params.id;
        const rutaRelativa = '/uploads/' + req.file.filename;
        try {
            await incidenciaModel.guardarRutaImagen(incidenciaId, rutaRelativa);
            res.json({ mensaje: 'Imagen subida correctamente', ruta: rutaRelativa });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al guardar la imagen' });
        }
    });
}

async function getSalonesPaginados(req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 10;
        const edificioId = req.query.edificio_id || null;
        const resultado = await incidenciaModel.getSalonesPaginados(pagina, limite, edificioId);
        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener salones paginados' });
    }
}

// ========== FUNCIONES EXISTENTES (CRUD, etc.) ==========
async function getEstadisticas(req, res) {
    try {
        const stats = await incidenciaModel.getEstadisticas();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

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

async function listUsuarios(req, res) {
    try {
        const usuarios = await incidenciaModel.getUsuarios();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

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

// ========== EXPORTAR TODAS ==========
module.exports = {
    getSalones,
    createIncidencia,
    getIncidenciasPaginadas,
    updateEstadoConHistorial,
    getHistorial,
    exportarIncidenciasCSV,
    subirImagen,
    getSalonesPaginados,
    getEstadisticas,
    listEdificios,
    addEdificio,
    editEdificio,
    removeEdificio,
    listUsuarios,
    listSalones,
    addSalon,
    editSalon,
    removeSalon
};