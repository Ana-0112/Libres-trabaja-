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
// MODELOS
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
    estado: { type: String, default: 'Pendiente' },
    entrevistaFecha: { type: String, default: "Pendiente" },
    ultimoMensaje: { type: String, default: 'Sin mensajes aún' },
    mensajes: [{ emisor: String, texto: String, fecha: { type: Date, default: Date.now } }]
}), 'postulacions');

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String, 
    emisor: String, 
    receptor: String, 
    texto: String, 
    fecha: { type: Date, default: Date.now }
}), 'mensajes');

// ======================================================
// RUTAS USUARIOS Y PERFIL
// ======================================================

app.post('/api/usuarios', async (req, res) => {
    try {
        const emailLimpio = req.body.email.trim().toLowerCase();
        const existe = await User.findOne({ email: emailLimpio });
        if (existe) return res.status(400).json({ error: "El usuario ya existe" });
        
        const nuevoUsuario = new User({ ...req.body, email: emailLimpio });
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(500).json({ error: "Error en registro" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase(), password: password.trim() });
        if (user) {
            res.status(200).json({ 
                rol: user.rol, 
                nombres: user.nombre, 
                email: user.email, 
                verificado: user.verificado 
            });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en login" });
    }
});

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim().toLowerCase() });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        
        res.status(200).json({ 
            nombres: user.nombre,
            telefono: user.telefono,
            fotoPerfil: user.fotoPerfil, 
            cvUrl: user.cvUrl, 
            verificado: user.verificado,
            empresa: user.empresa,
            ubicacion: user.ubicacion,
            fotosEmpresa: user.fotosEmpresa
        });
    } catch (error) {
        res.status(500).json({ error: "Error servidor" });
    }
});

app.put('/api/perfil/update', async (req, res) => {
    const { email, nombre, nombres, telefono, fotoPerfil, cvUrl, empresa, ubicacion, fotosEmpresa } = req.body;
    try {
        const updateData = {};
        if (nombre || nombres) updateData.nombre = nombre || nombres;
        if (telefono) updateData.telefono = telefono;
        if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
        if (cvUrl) updateData.cvUrl = cvUrl;
        if (empresa) updateData.empresa = empresa;
        if (ubicacion) updateData.ubicacion = ubicacion;
        if (fotosEmpresa) updateData.fotosEmpresa = fotosEmpresa;

        const actualizado = await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() }, 
            { $set: updateData },
            { new: true }
        );
        
        if (!actualizado) return res.status(404).json({ error: "Usuario no encontrado" });
        res.status(200).json({ message: "Perfil actualizado", user: actualizado });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// ======================================================
// RUTAS VACANTES Y POSTULACIONES
// ======================================================

app.post('/api/vacantes/postular', async (req, res) => {
    try {
        const { vacanteId, candidatoEmail, nombreCandidato, puesto, reclutadorEmail } = req.body;
        const emailLimpio = candidatoEmail.trim().toLowerCase();

        if (!mongoose.Types.ObjectId.isValid(vacanteId)) {
            return res.status(400).json({ error: "ID de vacante no válido" });
        }

        const existe = await Postulacion.findOne({ vacanteId, candidatoEmail: emailLimpio });
        if (existe) return res.status(400).json({ error: "Ya te postulaste" });
        
        const nuevaPost = new Postulacion({ 
            vacanteId, 
            candidatoEmail: emailLimpio, 
            reclutadorEmail: reclutadorEmail.trim().toLowerCase(), 
            nombreCandidato, 
            puesto 
        });

        await nuevaPost.save();

        await Vacante.findByIdAndUpdate(
            vacanteId, 
            { $push: { postulantes: emailLimpio } }
        );

        res.status(201).json({ message: "Postulación exitosa" });
    } catch (error) {
        console.error("Error en postulación:", error);
        res.status(500).json({ error: "Error interno al postularse" });
    }
});

app.get('/api/vacantes/postulantes/:vacanteId', async (req, res) => {
    try {
        const { vacanteId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(vacanteId)) {
            return res.status(400).json({ error: "ID de vacante inválido" });
        }

        const postulaciones = await Postulacion.find({ vacanteId }).sort({ _id: -1 });
        
        const resultado = [];
        for (const post of postulaciones) {
            const usuario = await User.findOne({ email: post.candidatoEmail });
            resultado.push({
                _id: post._id,
                nombre: usuario?.nombre || post.nombreCandidato || "Candidato",
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

// ... (Resto de rutas como /api/vacantes GET, PUT, DELETE se mantienen igual)
app.get('/api/vacantes', async (req, res) => {
    try {
        const vacantes = await Vacante.find().sort({ fechaCreacion: -1 });
        res.status(200).json(vacantes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener feed" });
    }
});

app.post('/api/vacantes', async (req, res) => {
    try {
        const data = { ...req.body, reclutadorEmail: req.body.reclutadorEmail.trim().toLowerCase() };
        const nuevaVacante = new Vacante(data);
        await nuevaVacante.save();
        res.status(201).json({ message: "Vacante creada" });
    } catch (error) {
        res.status(500).json({ error: "Error servidor" });
    }
});

// ======================================================
// RUTAS CHAT
// ======================================================

app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor } = req.params;
        const mensajes = await Mensaje.find({
            vacanteId: vacanteId,
            $or: [
                { emisor: emisor.trim().toLowerCase(), receptor: receptor.trim().toLowerCase() },
                { emisor: receptor.trim().toLowerCase(), receptor: emisor.trim().toLowerCase() }
            ]
        }).sort({ fecha: 1 });
        
        const chatFormateado = mensajes.map(m => ({
            text: m.texto, 
            emisor: m.emisor, 
            receptor: m.receptor,
            time: new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    } catch (error) {
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
});

// ======================================================
// OTROS SERVICIOS Y ELIMINACIÓN
// ======================================================

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
        const vacantes = await Vacante.find({ reclutadorEmail: emailBusqueda });
        res.status(200).json(vacantes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener tus vacantes" });
    }
});

app.delete('/api/postulaciones/:id', async (req, res) => {
    try {
        await Postulacion.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.delete('/api/vacantes/:id', async (req, res) => {
    try {
        await Vacante.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Vacante eliminada con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la vacante" });
    }
});

// ======================================================
// SERVIDOR
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Libres Trabaja corriendo en puerto ${PORT}`);
});