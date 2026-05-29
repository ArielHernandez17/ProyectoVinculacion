// =========================================================================
// authRoutes.js - Rutas de autenticación (login/registro automático)
// =========================================================================

const express = require('express');
const router = express.Router();               // Creamos un enrutador de Express
const authController = require('../controllers/authController');  // Controlador de autenticación

// Ruta POST /api/login
// No requiere autenticación previa (es pública)
// Recibe { correo, nombre, rol } en el body
// Crea o actualiza el usuario en BD y devuelve un JWT
router.post('/login', authController.login);

// Exportamos el enrutador para que sea montado en el servidor principal (server.js)
module.exports = router;