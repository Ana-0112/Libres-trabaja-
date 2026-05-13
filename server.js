require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

// ======================================================
// FIREBASE (PROTEGIDO)
// ======================================================
let admin = null;

try {
    admin = require('firebase-admin');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });

        console.log("🔥 Firebase inicializado");
    }

} catch (e) {
    console.log("⚠️ Firebase no inicializado:", e.message);
}

// ======================================================
// APP
// ======================================================
const app = express();

// ======================================================
// MIDDLEWARE
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
// MONGODB
// ======================================================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB conectado"))
.catch(err => console.log("❌ Mongo error:", err));

// ======================================================
// MODELOS
// ======================================================

const User = mongoose.model('User', new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true },
    rol: { type: String, default: "candidato" },
    fotoPerfil: String,
    cvUrl: String,
    empresa: String,
    telefono: String,
    password: String,
    fcmToken: String
}, { collection: 'users' }));

const Vacante = mongoose.model('Vacante', new mongoose.Schema({
    empresa: String,
    puesto: String,
    sueldo: String,
    sector: String,
    ubicacion: String,
    reclutadorEmail: String,
    postulantes: { type: Array, default: [] },
    fechaCreacion: { type: Date, default: Date.now }
}, { collection: 'vacantes' }));

const Postulacion = mongoose.model('Postulacion', new mongoose.Schema({
    vacanteId: String,
    candidatoEmail: String,
    reclutadorEmail: String,
    nombreCandidato: String,
    puesto: String,
    empresa: String,
    estado: { type: String, default: "Pendiente" },
    mensaje: String,
    entrevistaFecha: String
}, { collection: 'postulaciones' }));

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String,
    emisor: String,
    receptor: String,
    texto: String,
    fecha: { type: Date, default: Date.now }
}, { collection: 'mensajes' }));

// ======================================================
// LOGIN
// ======================================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            password: password.trim()
        });

        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        res.json(user);

    } catch (e) {
        res.status(500).json({ error: "Error login" });
    }
});

// ======================================================
// PERFIL
// ======================================================
app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.params.email.trim().toLowerCase()
        });

        if (!user) return res.status(404).json({ error: "Perfil no encontrado" });

        res.json(user);

    } catch (e) {
        res.status(500).json({ error: "Error perfil" });
    }
});

// ======================================================
// UPDATE PERFIL
// ======================================================
app.put('/api/perfil/update', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { email: req.body.email.trim().toLowerCase() },
            { $set: req.body },
            { new: true }
        );

        res.json(user);

    } catch (e) {
        res.status(500).json({ error: "Error update perfil" });
    }
});

// ======================================================
// VACANTES
// ======================================================
app.post('/api/vacantes', async (req, res) => {
    try {
        const nueva = new Vacante({
            ...req.body,
            reclutadorEmail: req.body.reclutadorEmail?.trim().toLowerCase()
        });

        await nueva.save();

        res.status(201).json({ message: "Vacante creada" });

    } catch (e) {
        res.status(500).json({ error: "Error vacante" });
    }
});

app.get('/api/vacantes', async (req, res) => {
    try {
        const data = await Vacante.find().sort({ fechaCreacion: -1 });
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error vacantes" });
    }
});

app.get('/api/vacantes/reclutador/:email', async (req, res) => {
    try {
        const email = req.params.email.trim().toLowerCase();

        const data = await Vacante.find({ reclutadorEmail: email })
            .sort({ fechaCreacion: -1 });

        res.json(data);

    } catch (e) {
        res.status(500).json({ error: "Error reclutador vacantes" });
    }
});

// ======================================================
// POSTULACIONES
// ======================================================
app.post('/api/vacantes/postular', async (req, res) => {
    try {
        const { vacanteId, candidatoEmail } = req.body;

        const email = candidatoEmail.trim().toLowerCase();

        const existe = await Postulacion.findOne({ vacanteId, candidatoEmail: email });

        if (existe) return res.status(400).json({ error: "Ya postulado" });

        const vacante = await Vacante.findById(vacanteId);
        const usuario = await User.findOne({ email });

        const nueva = new Postulacion({
            ...req.body,
            candidatoEmail: email,
            reclutadorEmail: vacante?.reclutadorEmail || "",
            nombreCandidato: usuario?.nombre || ""
        });

        await nueva.save();

        await Vacante.findByIdAndUpdate(vacanteId, {
            $addToSet: { postulantes: email }
        });

        res.status(201).json({ message: "Postulado" });

    } catch (e) {
        res.status(500).json({ error: "Error postulación" });
    }
});

app.get('/api/postulaciones/usuario/:email', async (req, res) => {
    try {
        const email = req.params.email.trim().toLowerCase();

        const data = await Postulacion.find({ candidatoEmail: email });

        res.json(data);

    } catch (e) {
        res.status(500).json({ error: "Error postulaciones" });
    }
});

app.get('/api/vacantes/postulantes/:vacanteId', async (req, res) => {
    try {
        const postulaciones = await Postulacion.find({
            vacanteId: req.params.vacanteId
        });

        const resultado = await Promise.all(
            postulaciones.map(async (p) => {
                const u = await User.findOne({ email: p.candidatoEmail });

                return {
                    _id: p._id,
                    nombre: u?.nombre || "",
                    correo: p.candidatoEmail,
                    puesto: p.puesto,
                    estado: p.estado,
                    mensaje: p.mensaje,
                    entrevista: p.entrevistaFecha,
                    fotoPerfil: u?.fotoPerfil || "",
                    cvUrl: u?.cvUrl || ""
                };
            })
        );

        res.json(resultado);

    } catch (e) {
        res.status(500).json({ error: "Error postulantes" });
    }
});

// ======================================================
// CHAT
// ======================================================
app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor } = req.params;

        const e = emisor.trim().toLowerCase();
        const r = receptor.trim().toLowerCase();

        const mensajes = await Mensaje.find({
            vacanteId,
            $or: [
                { emisor: e, receptor: r },
                { emisor: r, receptor: e }
            ]
        }).sort({ fecha: 1 });

        res.json(mensajes.map(m => ({
            texto: m.texto,
            emisor: m.emisor,
            receptor: m.receptor,
            time: m.fecha
                ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ""
        })));

    } catch (e) {
        res.status(500).json({ error: "Error chat" });
    }
});

app.post('/api/mensajes/enviar', async (req, res) => {
    try {
        const { vacanteId, emisor, receptor, texto } = req.body;

        const nuevo = new Mensaje({
            vacanteId,
            emisor: emisor.trim().toLowerCase(),
            receptor: receptor.trim().toLowerCase(),
            texto
        });

        await nuevo.save();

        // ======================================================
        // FIREBASE SAFE PUSH
        // ======================================================
        if (admin) {
            try {
                const user = await User.findOne({
                    email: receptor.trim().toLowerCase()
                });

                if (user?.fcmToken) {
                    await admin.messaging().send({
                        token: user.fcmToken,
                        notification: {
                            title: "Nuevo mensaje 💬",
                            body: texto
                        }
                    });
                }

            } catch (err) {
                console.log("Firebase push error:", err.message);
            }
        }

        res.status(201).json({ message: "Mensaje enviado" });

    } catch (e) {
        res.status(500).json({ error: "Error enviar mensaje" });
    }
});

// ======================================================
// UPLOAD
// ======================================================
app.post('/api/upload', async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.body.data, {
            folder: "libres_trabaja",
            resource_type: "auto"
        });

        res.json({ url: result.secure_url });

    } catch (e) {
        res.status(500).json({ error: "Error upload" });
    }
});

// ======================================================
// SERVER
// ======================================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(` Servidor activo en puerto ${PORT}`);
});