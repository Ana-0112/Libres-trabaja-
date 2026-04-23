require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Conexión a MongoDB usando la variable de entorno
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: { type: String, unique: true, required: true },
    telefono: String,
    password: { type: String, required: true },
    rol: String,
    nombreEmpresa: String,
    ubicacion: String,
    verificado: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

// Ruta de Registro
app.post('/api/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        console.log("✅ Nuevo usuario registrado:", req.body.email);
        res.status(201).send({ message: "Registro exitoso en la nube" });
    } catch (error) {
        console.error("❌ Error al guardar:", error.message);
        res.status(400).send({ error: "No se pudo guardar el usuario. El correo podría estar duplicado." });
    }
});

// Ruta de Login
app.post('/api/login', async (req, res) => {
    console.log("Intentando login con:", req.body);
    const { email, password } = req.body;

    try {
        // Usamos trim() para limpiar espacios accidentales del teclado Android
        const user = await User.findOne({ 
            email: email.trim(), 
            password: password.trim() 
        });
        
        if (user) {
            res.status(200).send({ 
                message: "Login exitoso", 
                rol: user.rol,
                nombre: user.nombre 
            });
        } else {
            res.status(401).send({ error: "Correo o contraseña incorrectos" });
        }
    } catch (error) {
        console.error("❌ Error en servidor:", error);
        res.status(500).send({ error: "Error interno del servidor" });
    }
});

// NUEVA RUTA: Obtener perfil por email
app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim() });
        if (user) {
            res.status(200).send({
                nombres: user.nombre,       // Mapeamos 'nombre' a 'nombres' para Android
                apellidos: user.apellidos,
                email: user.email,
                telefono: user.telefono,
                empresa: user.nombreEmpresa, // Mapeamos 'nombreEmpresa' a 'empresa'
                rol: user.rol
            });
        } else {
            res.status(404).send({ error: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error en el servidor" });
    }
});


// Configuración del Puerto para Render o Local
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});