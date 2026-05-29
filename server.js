const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src/public')));

// Importar rutas
const incidenciaRoutes = require('./src/routes/incidenciaRoutes');
const authRoutes = require('./src/routes/authRoutes');   // ← Importante

// Usar rutas
app.use('/api', incidenciaRoutes);
app.use('/api', authRoutes);   // ← Aquí se monta /api/login

// Servir vistas
app.get('/', (req, res) => res.redirect('/views/login.html'));
app.get('/views/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views', req.params.page));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});