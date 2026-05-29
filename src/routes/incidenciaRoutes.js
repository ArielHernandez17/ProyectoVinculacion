const express = require('express');
const router = express.Router();
const incidenciaController = require('../controllers/incidenciaController');

// Endpoints públicos (sin autenticación compleja)
router.get('/salones', incidenciaController.getSalones);
router.post('/incidencias', incidenciaController.createIncidencia);
router.get('/incidencias', incidenciaController.getIncidencias);
router.put('/incidencias/:id/estado', incidenciaController.updateEstado);
router.get('/estadisticas', incidenciaController.getEstadisticas);

// CRUD edificios
router.get('/edificios', incidenciaController.listEdificios);
router.post('/edificios', incidenciaController.addEdificio);
router.put('/edificios/:id', incidenciaController.editEdificio);
router.delete('/edificios/:id', incidenciaController.removeEdificio);

// CRUD Salones (para admin)
router.get('/salones/todos', incidenciaController.listSalones);
router.post('/salones', incidenciaController.addSalon);
router.put('/salones/:id', incidenciaController.editSalon);
router.delete('/salones/:id', incidenciaController.removeSalon);

// Usuarios
router.get('/usuarios', incidenciaController.listUsuarios);

module.exports = router;