const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());                     // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear formularios URL-encoded
app.use(express.static(path.join(__dirname, 'src/public'))); // Servir archivos estáticos (CSS, JS, imágenes)

// Importar rutas
const incidenciaRoutes = require('./src/routes/incidenciaRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Montar rutas bajo /api
app.use('/api', incidenciaRoutes);
app.use('/api', authRoutes);                 // Incluye POST /api/login

// Servir vistas HTML
app.get('/', (req, res) => res.redirect('/views/login.html'));
app.get('/views/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views', req.params.page));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});