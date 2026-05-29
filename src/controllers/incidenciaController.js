// Controlador: incidenciaController.js
// Maneja toda la lógica de negocio relacionada con incidencias: creación, listado paginado,
// historial de cambios, exportación CSV, subida de imágenes, y CRUD de edificios/salones/usuarios.

const incidenciaModel = require('../models/incidenciaModel');
const multer = require('multer');        // Middleware para manejo de uploads de archivos
const path = require('path');             // Para trabajar con rutas de archivos
const fs = require('fs');                 // Para verificar/crear directorios

// ==================== FUNCIONES ORIGINALES (básicas) ====================

// Obtener salones de un edificio específico (sin paginación, usado en selects)
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

// Crear una nueva incidencia (usuario reporta desde el frontend)
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

// ==================== NUEVAS FUNCIONES PARA MEJORAS (paginación, historial, exportación) ====================

// Obtener incidencias con paginación y filtro opcional por estado
async function getIncidenciasPaginadas(req, res) {
    try {
        const estado = req.query.estado || null;          // 'Pendiente', 'En Proceso', 'Resuelto', o null
        const pagina = parseInt(req.query.pagina) || 1;   // Página actual (por defecto 1)
        const limite = parseInt(req.query.limite) || 5;   // Registros por página (defecto 5)
        const resultado = await incidenciaModel.getIncidenciasPaginadas(estado, pagina, limite);
        res.json(resultado);  // Devuelve { data: [], total, pagina, totalPaginas }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener incidencias paginadas' });
    }
}

// Actualizar el estado de una incidencia y registrar el cambio en el historial
// Se espera: { estado, comentario (opcional) } en el body
async function updateEstadoConHistorial(req, res) {
    try {
        const id = req.params.id;
        const { estado, comentario } = req.body;

        // Validar que el estado sea uno de los permitidos
        if (!['Pendiente', 'En Proceso', 'Resuelto'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        // El usuario que realiza el cambio se obtiene del token (previamente verificado por middleware)
        const usuarioId = req.usuario.id;

        const success = await incidenciaModel.updateEstadoIncidenciaConHistorial(
            id, estado, comentario || null, usuarioId
        );

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

// Obtener el historial de cambios de una incidencia específica
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

// Exportar incidencias a CSV (con filtro opcional por estado)
async function exportarIncidenciasCSV(req, res) {
    try {
        const estado = req.query.estado || null;
        // Obtener datos planos desde el modelo
        const incidencias = await incidenciaModel.getIncidenciasParaExportar(estado);

        // Importar json2csv dinámicamente (solo cuando se usa esta función)
        const json2csv = require('json2csv').parse;

        // Definir el orden de las columnas en el CSV
        const fields = ['id', 'descripcion', 'estado', 'comentario', 'fecha_creacion', 'usuario', 'edificio', 'salon'];
        const csv = json2csv(incidencias, { fields });

        // Configurar headers para descarga de archivo
        res.header('Content-Type', 'text/csv');
        res.attachment(`incidencias_${Date.now()}.csv`);
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al exportar CSV' });
    }
}

// ==================== CONFIGURACIÓN DE MULTER PARA SUBIR IMÁGENES ====================

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ruta donde se guardarán las imágenes (carpeta pública accesible desde el frontend)
        const dir = './src/public/uploads';
        // Crear la carpeta recursivamente si no existe
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre único: timestamp + número aleatorio + extensión original
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

// Middleware de multer: acepta un solo archivo con campo 'imagen', límite 5MB
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }).single('imagen');

// Endpoint para subir una imagen asociada a una incidencia existente
async function subirImagen(req, res) {
    // Ejecutar el middleware de multer dentro del controlador para manejar errores personalizados
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });

        const incidenciaId = req.params.id;
        // Ruta relativa que se guardará en la BD (para servir la imagen estáticamente)
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

// Obtener salones paginados (con filtro opcional por edificio) - útil para listas largas
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

// ==================== FUNCIONES CRUD PARA EDIFICIOS, SALONES Y USUARIOS ====================

// Estadísticas generales (total incidencias por estado, etc.)
async function getEstadisticas(req, res) {
    try {
        const stats = await incidenciaModel.getEstadisticas();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Listar todos los edificios
async function listEdificios(req, res) {
    try {
        const edificios = await incidenciaModel.getEdificios();
        res.json(edificios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Crear un nuevo edificio (solo admin)
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

// Editar nombre de edificio existente
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

// Eliminar edificio (solo si no tiene salones asociados, la BD debería validar)
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

// Listar todos los usuarios (para asignar roles o mostrar en reportes)
async function listUsuarios(req, res) {
    try {
        const usuarios = await incidenciaModel.getUsuarios();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Listar todos los salones (sin filtro, versión simple)
async function listSalones(req, res) {
    try {
        const salones = await incidenciaModel.getAllSalones();
        res.json(salones);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Crear un nuevo salón asociado a un edificio
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

// Editar nombre de un salón (solo nombre, no se cambia de edificio)
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

// Eliminar salón
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

// ==================== EXPORTACIÓN DE TODAS LAS FUNCIONES ====================
// Se exportan todas para que las rutas puedan usarlas según los endpoints
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