require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const vacanteRoutes = require('./routes/vacanteRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

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

app.get('/', (req, res) => {

    res.send('API funcionando 🚀');

});

// ROUTES

app.use('/api/users', userRoutes);

app.use('/api/vacantes', vacanteRoutes);

app.use('/api/mensajes', mensajeRoutes);

app.use('/api/upload', uploadRoutes);

// SERVER

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(` Servidor activo en puerto ${PORT}`);

});