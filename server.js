require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONEXIÓN A BASE DE DATOS ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión:", err));

// --- MODELOS DE DATOS ---

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
    verificado: { type: Boolean, default: false },
    codigoVerificacion: String,
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);

// Modelo de Vacante
const VacanteSchema = new mongoose.Schema({
    empresa: String,
    puesto: String,
    sueldo: String,
    sector: String,
    reclutadorEmail: String,
    postulantes: [{ 
        emailCandidato: String, 
        nombreCandidato: String,
        status: { type: String, default: 'Nuevo' }
    }]
});
const Vacante = mongoose.model('Vacante', VacanteSchema);

// --- CONFIGURACIÓN DE NODEMAILER ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- RUTAS ---

// Registro
app.post('/api/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send({ message: "Registro exitoso" });
    } catch (error) {
        res.status(400).send({ error: "Error al registrar: el correo podría ya existir." });
    }
});

// Login
// Login corregido
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), password: password.trim() });
        if (user) {
            res.status(200).send({ 
                message: "Login exitoso", 
                rol: user.rol,        // Enviamos 'rol'
                email: user.email,    // ¡IMPORTANTE! Enviamos el email
                nombre: user.nombre,
                verificado: user.verificado 
            });
        } else {
            res.status(401).send({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error interno" });
    }
});

// Enviar Código
app.post('/api/enviar-codigo-email', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        await User.findOneAndUpdate({ email: email.trim() }, { codigoVerificacion: codigo });
        const mailOptions = {
            from: `"Libres Trabaja" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código de Verificación - Libres Trabaja',
            html: `
                <div style="font-family: sans-serif; text-align: center; border: 1px solid #008080; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #008080;">Verificación de Cuenta</h2>
                    <p>Hola, tu código para activar tu perfil es:</p>
                    <h1 style="background: #f4f4f4; display: inline-block; padding: 10px; letter-spacing: 5px;">${codigo}</h1>
                    <p>No compartas este código con nadie.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Código enviado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar el correo' });
    }
});

// Verificar Código
app.post('/api/verificar-codigo', async (req, res) => {
    const { email, codigoIngresado } = req.body;
    try {
        const user = await User.findOne({ email: email.trim() });
        if (user && user.codigoVerificacion === codigoIngresado) {
            user.verificado = true;
            user.codigoVerificacion = null; 
            await user.save();
            res.status(200).json({ message: "Cuenta verificada correctamente" });
        } else {
            res.status(400).json({ error: "Código incorrecto" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al verificar" });
    }
});

// Crear Vacante (Corregido de router a app)
app.post('/api/vacantes', async (req, res) => {
    try {
        const nuevaVacante = new Vacante(req.body);
        await nuevaVacante.save();
        res.status(201).send({ message: "Vacante creada exitosamente" });
    } catch (error) {
        res.status(400).send({ error: "No se pudo crear la vacante" });
    }
});

// Obtener Perfil
app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim() });
        if (user) {
            res.status(200).send({
                nombres: user.nombre,
                apellidos: user.apellidos,
                email: user.email,
                telefono: user.telefono,
                empresa: user.nombreEmpresa,
                rol: user.rol,
                verificado: user.verificado
            });
        } else {
            res.status(404).send({ error: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error en el servidor" });
    }
});

// Actualizar Perfil (Corregido de router a app y de Usuario a User)
app.put('/api/perfil/update', async (req, res) => {
    const { email, telefono, fotoPerfil, curriculumUrl } = req.body;
    try {
        const usuarioActualizado = await User.findOneAndUpdate(
            { email: email },
            { 
                $set: { 
                    telefono: telefono,
                    fotoPerfil: fotoPerfil,
                    cvUrl: curriculumUrl // Cambiado para coincidir con el Schema
                } 
            },
            { new: true }
        );
        res.status(200).json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar Atlas" });
    }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});