require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

const app = express();

// CONFIGURACIÓN
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// GMAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
});

// MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch((err) => console.log("Error MongoDB:", err));

// MODELOS
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
}));

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String, 
    emisor: String, 
    receptor: String, 
    texto: String, 
    fecha: { type: Date, default: Date.now }
}), 'mensajes');

// === AQUÍ ELIMINÉ EL BLOQUE QUE CAUSABA EL ERROR ===

// RUTAS USUARIOS
app.post('/api/usuarios', async (req, res) => {
    try {
        const emailLimpio = req.body.email.trim().toLowerCase();
        const existe = await User.findOne({ email: emailLimpio });
        if (existe) return res.status(400).json({ error: "El usuario ya existe" });
        const nuevoUsuario = new User({ ...req.body, email: emailLimpio });
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) { res.status(500).json({ error: "Error en registro" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase(), password: password.trim() });
        if (user) {
            res.status(200).json({ rol: user.rol, nombres: user.nombre, email: user.email, verificado: user.verificado });
        } else { res.status(401).json({ error: "Credenciales incorrectas" }); }
    } catch (error) { res.status(500).json({ error: "Error en login" }); }
});

// RUTAS CHAT (CON LÓGICA DE BÚSQUEDA CORREGIDA)
app.get('/api/mensajes/:vacanteId/:emisor(.+)/:receptor(.+)', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor } = req.params;
        const emisorClean = emisor.trim().toLowerCase();
        const receptorClean = receptor.trim().toLowerCase();

        // Esta es la búsqueda que debe ir dentro de la ruta:
        const mensajesDb = await Mensaje.find({
            vacanteId: vacanteId,
            $or: [
                { emisor: emisorClean, receptor: receptorClean },
                { emisor: receptorClean, receptor: emisorClean }
            ]
        }).sort({ fecha: 1 });
        
        const chatFormateado = mensajesDb.map(m => ({
            text: m.texto, 
            emisor: m.emisor, 
            receptor: m.receptor,
            time: m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""
        }));

        res.status(200).json(chatFormateado);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener mensajes" });
    }
});

app.post('/api/mensajes/enviar', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor, text } = req.body;
        const nuevoMensaje = new Mensaje({ 
            vacanteId: vacanteId,
            emisor: emisor.trim().toLowerCase(), 
            receptor: receptor.trim().toLowerCase(), 
            texto: text 
        });
        await nuevoMensaje.save();
        res.status(201).json({ message: "Mensaje guardado" });
    } catch (error) { res.status(500).json({ error: "Error al enviar mensaje" }); }
});

// SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});