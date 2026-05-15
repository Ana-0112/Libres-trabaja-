require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const vacanteRoutes = require('./routes/vacanteRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const postulacionRoutes = require('./routes/postulacionRoutes');

const app = express();

// MIDDLEWARE

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({

    limit: '50mb',
    extended: true

}));

app.use(cors());

// DB

connectDB();

// ROUTES

// Health check para Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend funcionando' });
});

app.use('/api/users', userRoutes);

app.use('/api/vacantes', vacanteRoutes);

app.use('/api/mensajes', mensajeRoutes);

app.use('/api/upload', uploadRoutes);

app.use('/api/postulaciones', postulacionRoutes);

// SERVER

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(` Servidor activo en puerto ${PORT}`);

});