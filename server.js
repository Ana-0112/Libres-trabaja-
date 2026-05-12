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

// CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas (Base de datos: ltrabaja)"))
    .catch((err) => console.log("Error MongoDB:", err));

// ======================================================
// MODELOS
// ======================================================

const User = mongoose.model('User', new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true, required: true },
    telefono: String,
    password: { type: String, required: true },
    rol: String,
    verificado: { type: Boolean, default: false },
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" },
    empresa: { type: String, default: "" },
    ubicacion: { type: String, default: "" },
    fotosEmpresa: { type: [String], default: ["", "", ""] }
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
    empresa: String,
    estado: { type: String, default: 'Pendiente' },
    entrevistaFecha: { type: String, default: "Pendiente" }
}), 'postulaciones');

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String, 
    emisor: String, 
    receptor: String, 
    texto: String, 
    fecha: { type: Date, default: Date.now }
}), 'mensajes');

// ======================================================
// RUTAS DE PERFIL Y LOGIN
// ======================================================

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase(), password: password.trim() });
        if (user) {
            res.status(200).json({ rol: user.rol, nombres: user.nombre, email: user.email, verificado: user.verificado });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (error) { res.status(500).json({ error: "Error en login" }); }
});

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim().toLowerCase() });
        if (!user) return res.status(404).json({ error: "No encontrado" });
        res.status(200).json(user);
    } catch (error) { res.status(500).json({ error: "Error servidor" }); }
});

app.put('/api/perfil/update', async (req, res) => {
    try {
        const actualizado = await User.findOneAndUpdate(
            { email: req.body.email.trim().toLowerCase() }, 
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(actualizado);
    } catch (error) { res.status(500).json({ error: "Error al actualizar" }); }
});

// ======================================================
// RUTAS DE VACANTES
// ======================================================

app.get('/api/vacantes', async (req, res) => {
    try {
        const vacantes = await Vacante.find().sort({ fechaCreacion: -1 });
        res.status(200).json(vacantes);
    } catch (error) { res.status(500).json({ error: "Error al obtener vacantes" }); }
});

app.post('/api/vacantes', async (req, res) => {
    try {
        const nueva = new Vacante({ ...req.body, reclutadorEmail: req.body.reclutadorEmail.trim().toLowerCase() });
        await nueva.save();
        res.status(201).json({ message: "Vacante creada" });
    } catch (error) { res.status(500).json({ error: "Error al crear vacante" }); }
});

app.get('/api/vacantes/reclutador/:email', async (req, res) => {
    try {
        const vacantes = await Vacante.find({ reclutadorEmail: req.params.email.trim().toLowerCase() });
        res.status(200).json(vacantes);
    } catch (error) { res.status(500).json({ error: "Error al buscar vacantes" }); }
});

// ======================================================
// RUTAS DE POSTULACIONES
// ======================================================

app.post('/api/vacantes/postular', async (req, res) => {
    try {
        const { vacanteId, candidatoEmail } = req.body;
        const emailLimpio = candidatoEmail.trim().toLowerCase();
        
        const existe = await Postulacion.findOne({ vacanteId, candidatoEmail: emailLimpio });
        if (existe) return res.status(400).json({ error: "Ya te postulaste" });

        const nuevaPost = new Postulacion({ ...req.body, candidatoEmail: emailLimpio });
        await nuevaPost.save();

        await Vacante.findByIdAndUpdate(vacanteId, { $addToSet: { postulantes: emailLimpio } });
        res.status(201).json({ message: "Postulación exitosa" });
    } catch (error) { res.status(500).json({ error: "Error al postular" }); }
});

app.get('/api/postulaciones/usuario/:email', async (req, res) => {
    try {
        const post = await Postulacion.find({ candidatoEmail: req.params.email.trim().toLowerCase() });
        res.status(200).json(post);
    } catch (error) { res.status(500).json({ error: "Error al obtener postulaciones" }); }
});

// ======================================================
// RUTAS DE CHAT (CORREGIDAS)
// ======================================================

app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor } = req.params;
        const eClean = emisor.trim().toLowerCase();
        const rClean = receptor.trim().toLowerCase();

        const mensajes = await Mensaje.find({
            vacanteId,
            $or: [
                { emisor: eClean, receptor: rClean }, 
                { emisor: rClean, receptor: eClean }
            ]
        }).sort({ fecha: 1 });
        
        res.status(200).json(mensajes.map(m => ({
            text: m.texto, 
            emisor: m.emisor, 
            receptor: m.receptor,
            time: m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""
        })));
    } catch (error) { 
        console.error("Error chat GET:", error);
        res.status(500).json({ error: "Error al cargar mensajes" }); 
    }
});

app.post('/api/mensajes/enviar', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor, texto } = req.body;
        
        if (!texto || !emisor || !receptor) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const nuevoMensaje = new Mensaje({ 
            vacanteId,
            emisor: emisor.trim().toLowerCase(), 
            receptor: receptor.trim().toLowerCase(), 
            texto: texto 
        });

        await nuevoMensaje.save();
        res.status(201).json({ message: "Mensaje guardado correctamente" });
    } catch (error) { 
        console.error("Error chat POST:", error);
        res.status(500).json({ error: "Error al guardar el mensaje" }); 
    }
});

// ======================================================
// OTROS SERVICIOS (Cloudinary)
// ======================================================

app.post('/api/upload', async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.body.data, {
            folder: `libres_trabaja/${req.body.folder}`,
            resource_type: "auto"
        });
        res.status(200).json({ url: result.secure_url });
    } catch (error) { res.status(500).json({ error: "Error subida" }); }
});

// SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Libres Trabaja corriendo en puerto ${PORT}`);
});