require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Configuración de límites para peticiones (por si acaso envías metadatos extensos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// --- CONEXIÓN A BASE DE DATOS ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión:", err));

// --- MODELOS DE DATOS ---

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
    cvUrl: { type: String, default: "" } // Aquí se guardará el link de Firebase
});
const User = mongoose.model('User', UserSchema);

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
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), password: password.trim() });
        if (user) {
            res.status(200).send({ 
                message: "Login exitoso", 
                rol: user.rol,
                nombres: user.nombre,
                apellidos: user.apellidos,
                email: user.email,
                telefono: user.telefono,
                empresa: user.nombreEmpresa,
                verificado: user.verificado,
                fotoPerfil: user.fotoPerfil,
                cvUrl: user.cvUrl
            });
        } else {
            res.status(401).send({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error interno" });
    }
});

// Enviar Código de Verificación
app.post('/api/enviar-codigo-email', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const emailTrim = email.trim();
        await User.findOneAndUpdate({ email: emailTrim }, { codigoVerificacion: codigo });
        
        const mailOptions = {
            from: `"Libres Trabaja" <${process.env.EMAIL_USER}>`,
            to: emailTrim,
            subject: 'Código de Verificación - Libres Trabaja',
            html: `
                <div style="font-family: sans-serif; text-align: center; border: 1px solid #008080; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #008080;">Verificación de Cuenta</h2>
                    <p>Hola, tu código para activar tu perfil en <strong>Libres Trabaja</strong> es:</p>
                    <h1 style="background: #f4f4f4; display: inline-block; padding: 10px; letter-spacing: 5px; color: #333;">${codigo}</h1>
                    <p>Si no solicitaste este código, puedes ignorar este correo.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Código enviado con éxito' });
    } catch (error) {
        console.error("Error enviando mail:", error);
        res.status(500).json({ error: 'Error al enviar el correo' });
    }
});

// Verificar Código
app.post('/api/verificar-codigo', async (req, res) => {
    const { email, codigo } = req.body; 
    try {
        const user = await User.findOne({ email: email.trim() });
        if (user && user.codigoVerificacion === codigo) {
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

// Actualizar Perfil (Optimizado para URLs de Firebase)
app.put('/api/perfil/update', async (req, res) => {
    const { email, nombre, telefono, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (telefono) updateData.telefono = telefono;
        if (fotoPerfil !== undefined) updateData.fotoPerfil = fotoPerfil; 
        if (cvUrl !== undefined) updateData.cvUrl = cvUrl;

        const usuarioActualizado = await User.findOneAndUpdate(
            { email: email.trim() },
            { $set: updateData },
            { new: true }
        );

        if (!usuarioActualizado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Actualizado con éxito", user: usuarioActualizado });
    } catch (error) {
        console.error("Error en update:", error);
        res.status(500).json({ message: "Error al actualizar en Atlas" });
    }
});

// Obtener Perfil Completo
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
                verificado: user.verificado,
                fotoPerfil: user.fotoPerfil,
                cvUrl: user.cvUrl
            });
        } else {
            res.status(404).send({ error: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error en el servidor" });
    }
});

// Crear Vacante
app.post('/api/vacantes', async (req, res) => {
    try {
        const nuevaVacante = new Vacante(req.body);
        await nuevaVacante.save();
        res.status(201).send({ message: "Vacante creada exitosamente" });
    } catch (error) {
        res.status(400).send({ error: "No se pudo crear la vacante" });
    }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});