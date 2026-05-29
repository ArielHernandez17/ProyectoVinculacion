const express = require('express');
const router = express.Router();
const incidenciaController = require('../controllers/incidenciaController');
const { verificarToken, verificarRol } = require('../config/jwt');

// Rutas públicas (no requieren token)
router.get('/salones', incidenciaController.getSalones);
router.post('/incidencias', incidenciaController.createIncidencia);

// Rutas protegidas (requieren token)
router.get('/incidencias', verificarToken, incidenciaController.getIncidenciasPaginadas);
router.put('/incidencias/:id/estado', verificarToken, incidenciaController.updateEstadoConHistorial);
router.get('/incidencias/:id/historial', verificarToken, incidenciaController.getHistorial);
router.post('/incidencias/:id/imagen', verificarToken, incidenciaController.subirImagen);
router.get('/exportar/csv', verificarToken, verificarRol(['Admin']), incidenciaController.exportarIncidenciasCSV);
router.get('/estadisticas', verificarToken, verificarRol(['Admin']), incidenciaController.getEstadisticas);

// CRUD edificios (solo admin)
router.get('/edificios', verificarToken, incidenciaController.listEdificios);
router.post('/edificios', verificarToken, verificarRol(['Admin']), incidenciaController.addEdificio);
router.put('/edificios/:id', verificarToken, verificarRol(['Admin']), incidenciaController.editEdificio);
router.delete('/edificios/:id', verificarToken, verificarRol(['Admin']), incidenciaController.removeEdificio);

// Usuarios (solo admin)
router.get('/usuarios', verificarToken, verificarRol(['Admin']), incidenciaController.listUsuarios);

// CRUD Salones (solo admin)
router.get('/salones/todos', verificarToken, verificarRol(['Admin']), incidenciaController.getSalonesPaginados);
router.post('/salones', verificarToken, verificarRol(['Admin']), incidenciaController.addSalon);
router.put('/salones/:id', verificarToken, verificarRol(['Admin']), incidenciaController.editSalon);
router.delete('/salones/:id', verificarToken, verificarRol(['Admin']), incidenciaController.removeSalon);

module.exports = router;