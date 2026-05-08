require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

const app = express();

// ======================================================
// CONFIGURACIÓN
// ======================================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ======================================================
// CLOUDINARY
// ======================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ======================================================
// GMAIL
// ======================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
});

// ======================================================
// MONGODB
// ======================================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas (Base de datos: ltrabaja)"))
    .catch((err) => console.log("Error MongoDB:", err));

// ======================================================
// MODELOS (Forzados para coincidir con tu Atlas)
// ======================================================

const User = mongoose.model('User', new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: { type: String, unique: true, required: true },
    telefono: String,
    password: { type: String, required: true },
    rol: String,
    verificado: { type: Boolean, default: false },
    codigoVerificacion: String,
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" }
}), 'users');

const Vacante = mongoose.model('Vacante', new mongoose.Schema({
    empresa: String,
    puesto: String,
    sueldo: String,
    sector: String,
    ubicacion: String,
    reclutadorEmail: String,
    postulantes: { type: Array, default: [] },
    fechaCreacion: { type: Date, default: Date.now }
}), 'vacantes');

const Postulacion = mongoose.model('Postulacion', new mongoose.Schema({
    vacanteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacante' },
    candidatoEmail: String,
    reclutadorEmail: String,
    nombreCandidato: String,
    puesto: String,
    estado: { type: String, default: 'Pendiente' },
    entrevistaFecha: { type: String, default: "Pendiente" },
    ultimoMensaje: { type: String, default: 'Sin mensajes aún' },
    mensajes: [{ emisor: String, texto: String, fecha: { type: Date, default: Date.now } }]
}), 'postulacions');

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    emisor: String, receptor: String, texto: String, fecha: { type: Date, default: Date.now }
}), 'mensajes');

// ======================================================
// RUTAS USUARIOS Y PERFIL
// ======================================================
app.post('/api/usuarios', async (req, res) => {
    try {
        const existe = await User.findOne({ email: req.body.email.trim() });
        if (existe) return res.status(400).json({ error: "El usuario ya existe" });
        const nuevoUsuario = new User(req.body);
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(500).json({ error: "Error en registro" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), password: password.trim() });
        if (user) {
            res.status(200).json({ rol: user.rol, nombres: user.nombre, email: user.email, verificado: user.verificado });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en login" });
    }
});

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim() });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        res.status(200).json({ 
            nombre: user.nombre, 
            fotoPerfil: user.fotoPerfil, 
            cvUrl: user.cvUrl, 
            verificado: user.verificado 
        });
    } catch (error) {
        res.status(500).json({ error: "Error servidor" });
    }
});

app.put('/api/perfil/update', async (req, res) => {
    const { email, nombre, nombres, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        if (nombre || nombres) updateData.nombre = nombre || nombres;
        if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
        if (cvUrl) updateData.cvUrl = cvUrl;
        await User.findOneAndUpdate({ email: email.trim() }, { $set: updateData });
        res.status(200).json({ message: "Perfil actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// ======================================================
// RUTAS VACANTES (AQUÍ ESTABAN LOS CAMBIOS FALTANTES)
// ======================================================

// Crear vacante
app.post('/api/vacantes', async (req, res) => {
    try {
        const nuevaVacante = new Vacante(req.body);
        await nuevaVacante.save();
        res.status(201).json({ message: "Vacante creada" });
    } catch (error) {
        res.status(500).json({ error: "Error servidor" });
    }
});

// Obtener vacantes por email del reclutador (Para tu App)
app.get('/api/vacantes/:email', async (req, res) => {
    try {
        const emailBusqueda = req.params.email.trim().toLowerCase();
        const vacantes = await Vacante.find({ reclutadorEmail: emailBusqueda });
        res.status(200).json(vacantes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener vacantes" });
    }
});

// Obtener TODAS las vacantes (Feed candidatos)
app.get('/api/vacantes', async (req, res) => {
    try {
        const vacantes = await Vacante.find().sort({ fechaCreacion: -1 });
        res.status(200).json(vacantes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener feed" });
    }
});

// Postularse a una vacante
app.post('/api/vacantes/postular', async (req, res) => {
    try {
        const { vacanteId, candidatoEmail, nombreCandidato, puesto, reclutadorEmail } = req.body;
        const existe = await Postulacion.findOne({ vacanteId, candidatoEmail: candidatoEmail.trim() });
        if (existe) return res.status(400).json({ error: "Ya te postulaste" });
        
        const nuevaPost = new Postulacion({ vacanteId, candidatoEmail, reclutadorEmail, nombreCandidato, puesto });
        await nuevaPost.save();
        await Vacante.findByIdAndUpdate(vacanteId, { $push: { postulantes: candidatoEmail.trim() } });
        res.status(201).json({ message: "Postulación exitosa" });
    } catch (error) {
        res.status(500).json({ error: "Error al postularse" });
    }
});

// Obtener postulantes de una vacante
app.get('/api/vacantes/postulantes/:vacanteId', async (req, res) => {
    try {
        const postulaciones = await Postulacion.find({ vacanteId: req.params.vacanteId }).sort({ _id: -1 });
        const resultado = [];
        for (const post of postulaciones) {
            const usuario = await User.findOne({ email: post.candidatoEmail });
            resultado.push({
                id: post._id,
                nombre: usuario?.nombre || "Candidato",
                correo: post.candidatoEmail,
                puesto: post.puesto,
                estado: post.estado,
                entrevista: post.entrevistaFecha,
                cvUrl: usuario?.cvUrl || ""
            });
        }
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener postulantes" });
    }
});

// ======================================================
// RUTAS CHAT Y CLOUDINARY
// ======================================================

app.post('/api/mensajes/enviar', async (req, res) => {
    try {
        const { emisor, receptor, text } = req.body;
        const nuevoMensaje = new Mensaje({ emisor: emisor.trim(), receptor: receptor.trim(), texto: text });
        await nuevoMensaje.save();
        res.status(201).json({ message: "Mensaje guardado" });
    } catch (error) {
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
});

app.get('/api/mensajes/:emisor/:receptor', async (req, res) => {
    try {
        const { emisor, receptor } = req.params;
        const mensajes = await Mensaje.find({
            $or: [
                { emisor: emisor.trim(), receptor: receptor.trim() },
                { emisor: receptor.trim(), receptor: emisor.trim() }
            ]
        }).sort({ fecha: 1 });
        const chatFormateado = mensajes.map(m => ({
            text: m.texto, emisor: m.emisor, receptor: m.receptor,
            time: new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        res.status(200).json(chatFormateado);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener mensajes" });
    }
});

app.post('/api/upload', async (req, res) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(req.body.data, {
            folder: `libres_trabaja/${req.body.folder}`,
            resource_type: "auto"
        });
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        res.status(500).json({ error: "Error al subir archivo" });
    }
});

app.get('/api/vacantes/reclutador/:email', async (req, res) => {
    try {
        const emailBusqueda = req.params.email.trim().toLowerCase();
        // Buscamos solo las vacantes creadas por este correo
        const vacantes = await Vacante.find({ reclutadorEmail: emailBusqueda });
        res.status(200).json(vacantes);
    } catch (error) {
        console.error("Error al obtener vacantes del reclutador:", error);
        res.status(500).json({ error: "Error al obtener tus vacantes" });
    }
});

// En tu server.js
app.delete('/api/postulaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // MongoDB busca por _id automáticamente con findByIdAndDelete
        const resultado = await Postulacion.findByIdAndDelete(id);
        
        if (!resultado) {
            return res.status(404).json({ error: "No se encontró el registro" });
        }
        res.status(200).json({ message: "Eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});
// ======================================================
// SERVIDOR
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Libres Trabaja corriendo en puerto ${PORT}`);
});