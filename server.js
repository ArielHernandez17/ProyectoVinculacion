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

// Rutas
const incidenciaRoutes = require('./src/routes/incidenciaRoutes');
const authRoutes = require('./src/routes/authRoutes');

app.use('/api', incidenciaRoutes);
app.use('/api', authRoutes);

// Servir las vistas HTML
app.get('/', (req, res) => res.redirect('/views/login.html'));
app.get('/views/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, 'src/views', page));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});