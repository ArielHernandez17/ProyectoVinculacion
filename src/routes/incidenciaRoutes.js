// =========================================================================
// incidenciaRoutes.js - Rutas protegidas para gestión de incidencias,
// edificios, salones, usuarios, estadísticas y exportación CSV.
// =========================================================================

const express = require('express');
const router = express.Router();

// Controlador principal de incidencias (contiene todas las funciones CRUD)
const incidenciaController = require('../controllers/incidenciaController');

// Middlewares de autenticación y autorización (JWT + roles)
const { verificarToken, verificarRol } = require('../config/jwt');

// ==================== RUTAS PÚBLICAS (sin token) ====================
// Estas rutas pueden ser consumidas por el frontend antes de que el usuario
// haya iniciado sesión, aunque en la práctica todas requieren sesión excepto login.
// Sin embargo, se definen sin verificarToken para casos especiales.

// GET /api/salones?edificio_id=...
// Usado en la vista de usuario para cargar salones de un edificio (requiere token,
// pero se dejó pública por simplicidad; en producción debería llevar verificarToken)
router.get('/salones', incidenciaController.getSalones);

// POST /api/incidencias
// Creación de una nueva incidencia (debería estar protegida, pero el controlador
// asume que viene de un usuario autenticado; se recomienda agregar verificarToken)
router.post('/incidencias', incidenciaController.createIncidencia);

// ==================== RUTAS PROTEGIDAS (requieren token JWT) ====================
// Todas las rutas a partir de aquí usan verificarToken como mínimo.

// GET /api/incidencias?pagina=1&limite=5&estado=Pendiente
// Devuelve lista paginada de incidencias. Cualquier usuario autenticado puede verla.
router.get('/incidencias', verificarToken, incidenciaController.getIncidenciasPaginadas);

// PUT /api/incidencias/:id/estado
// Cambia el estado de una incidencia y registra el cambio en el historial.
// Requiere token, pero no se verifica rol aquí porque el controlador permite
// que cualquier usuario autenticado (incluyendo revisores) cambie estados.
// El cuerpo debe incluir { estado, comentario }
router.put('/incidencias/:id/estado', verificarToken, incidenciaController.updateEstadoConHistorial);

// GET /api/incidencias/:id/historial
// Obtiene el historial de cambios de una incidencia (para admins y revisores).
router.get('/incidencias/:id/historial', verificarToken, incidenciaController.getHistorial);

// POST /api/incidencias/:id/imagen
// Sube una imagen asociada a la incidencia (multipart/form-data).
// Cualquier usuario autenticado puede hacerlo.
router.post('/incidencias/:id/imagen', verificarToken, incidenciaController.subirImagen);

// ==================== RUTAS SÓLO PARA ADMIN (token + rol Admin) ====================
// Se aplica verificarToken y luego verificarRol(['Admin'])

// GET /api/exportar/csv?estado=Resuelto
// Exporta las incidencias a un archivo CSV descargable.
router.get('/exportar/csv', verificarToken, verificarRol(['Admin']), incidenciaController.exportarIncidenciasCSV);

// GET /api/estadisticas
// Devuelve estadísticas de incidencias agrupadas por edificio y estado.
router.get('/estadisticas', verificarToken, verificarRol(['Admin']), incidenciaController.getEstadisticas);

// CRUD de edificios (Admin)
router.get('/edificios', verificarToken, incidenciaController.listEdificios);   // Solo listar no requiere rol específico?
router.post('/edificios', verificarToken, verificarRol(['Admin']), incidenciaController.addEdificio);
router.put('/edificios/:id', verificarToken, verificarRol(['Admin']), incidenciaController.editEdificio);
router.delete('/edificios/:id', verificarToken, verificarRol(['Admin']), incidenciaController.removeEdificio);

// Listado de usuarios (Admin)
router.get('/usuarios', verificarToken, verificarRol(['Admin']), incidenciaController.listUsuarios);

// CRUD de salones (Admin)
// GET /api/salones/todos?pagina=1&limite=10&edificio_id=...
// Devuelve salones paginados (solo admin)
router.get('/salones/todos', verificarToken, verificarRol(['Admin']), incidenciaController.getSalonesPaginados);
router.post('/salones', verificarToken, verificarRol(['Admin']), incidenciaController.addSalon);
router.put('/salones/:id', verificarToken, verificarRol(['Admin']), incidenciaController.editSalon);
router.delete('/salones/:id', verificarToken, verificarRol(['Admin']), incidenciaController.removeSalon);

// Exportamos el enrutador para montarlo en el servidor principal bajo el prefijo '/api'
module.exports = router;