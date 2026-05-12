require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas (ltrabaja)"))
    .catch((err) => console.log("Error MongoDB:", err));

// MODELOS
const User = mongoose.model('User', new mongoose.Schema({
    nombre: String, email: { type: String, unique: true }, rol: String, fotoPerfil: String, cvUrl: String, empresa: String, password: { type: String, required: true }
}), 'users');

const Vacante = mongoose.model('Vacante', new mongoose.Schema({
    empresa: String, puesto: String, sueldo: String, reclutadorEmail: String, postulantes: Array, fechaCreacion: { type: Date, default: Date.now }
}), 'vacantes');

const Postulacion = mongoose.model('Postulacion', new mongoose.Schema({
    vacanteId: String, candidatoEmail: String, reclutadorEmail: String, nombreCandidato: String, puesto: String, empresa: String, estado: { type: String, default: 'Pendiente' }
}), 'postulaciones');

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String, emisor: String, receptor: String, texto: String, fecha: { type: Date, default: Date.now }
}), 'mensajes');

// RUTAS LOGIN Y PERFIL
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase(), password: password.trim() });
        if (user) res.status(200).json(user);
        else res.status(401).json({ error: "No encontrado" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim().toLowerCase() });
        res.status(200).json(user);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// RUTAS VACANTES Y POSTULACIONES
app.get('/api/vacantes', async (req, res) => {
    const v = await Vacante.find().sort({ fechaCreacion: -1 });
    res.json(v);
});

app.get('/api/postulaciones/reclutador/:email', async (req, res) => {
    const p = await Postulacion.find({ reclutadorEmail: req.params.email.trim().toLowerCase() });
    res.json(p);
});

// RUTAS CHAT (SINCRONIZADAS CON ANDROID)
app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor } = req.params;
        const e = emisor.trim().toLowerCase();
        const r = receptor.trim().toLowerCase();

        const msgs = await Mensaje.find({
            vacanteId,
            $or: [{ emisor: e, receptor: r }, { emisor: r, receptor: e }]
        }).sort({ fecha: 1 });

        res.status(200).json(msgs.map(m => ({
            text: m.texto, emisor: m.emisor, receptor: m.receptor,
            time: m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""
        })));
    } catch (e) { res.status(500).json({ error: "Error chat" }); }
});

app.post('/api/mensajes/enviar', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor, texto, text } = req.body;
        const contenido = texto || text; // Soporta ambos nombres de campo

        const nuevo = new Mensaje({
            vacanteId,
            emisor: emisor.trim().toLowerCase(),
            receptor: receptor.trim().toLowerCase(),
            texto: contenido
        });
        await nuevo.save();
        res.status(201).json({ message: "Mensaje guardado" });
    } catch (e) { res.status(500).json({ error: "Error al enviar" }); }
});

app.post('/api/upload', async (req, res) => {
    try {
        const r = await cloudinary.uploader.upload(req.body.data, { folder: "libres_trabaja", resource_type: "auto" });
        res.json({ url: r.secure_url });
    } catch (e) { res.status(500).json({ error: "Error upload" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Puerto: ${PORT}`));