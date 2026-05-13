require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// ======================================================
// FIREBASE ADMIN
// ======================================================
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});

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

// USERS
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

// MENSAJES
const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({
    vacanteId: String,
    emisor: String,
    receptor: String,
    texto: String,
    fecha: { type: Date, default: Date.now },
    leido: { type: Boolean, default: false }
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

        if (!user) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }

        res.json(user);

    } catch (e) {
        res.status(500).json({ error: "Error login" });
    }
});

// ======================================================
// REGISTRO
// ======================================================
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol, empresa, telefono } = req.body;

        const existe = await User.findOne({ email: email.trim().toLowerCase() });

        if (existe) {
            return res.status(400).json({ error: "Usuario ya existe" });
        }

        const nuevo = new User({
            nombre,
            email: email.trim().toLowerCase(),
            password,
            rol,
            empresa,
            telefono
        });

        await nuevo.save();

        res.status(201).json(nuevo);

    } catch (e) {
        res.status(500).json({ error: "Error registro" });
    }
});

// ======================================================
// GUARDAR FCM TOKEN
// ======================================================
app.put('/api/users/fcm-token', async (req, res) => {
    try {
        const { email, fcmToken } = req.body;

        const user = await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { $set: { fcmToken } },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json({ message: "Token guardado", user });

    } catch (e) {
        res.status(500).json({ error: "Error token" });
    }
});

// ======================================================
// OBTENER MENSAJES (CHAT)
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
        }).sort({ fecha: 1 }).limit(200);

        res.json(mensajes);

    } catch (e) {
        res.status(500).json({ error: "Error chat" });
    }
});

// ======================================================
// ENVIAR MENSAJE + FIREBASE PUSH
// ======================================================
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

        // ============================
        // BUSCAR RECEPTOR
        // ============================
        const receptorUser = await User.findOne({
            email: receptor.trim().toLowerCase()
        });

        // ============================
        // PUSH NOTIFICATION
        // ============================
        if (receptorUser?.fcmToken) {
            await admin.messaging().send({
                token: receptorUser.fcmToken,
                notification: {
                    title: "Nuevo mensaje 💬",
                    body: texto
                },
                data: {
                    vacanteId,
                    emisor,
                    receptor,
                    texto
                }
            });
        }

        res.status(201).json({ message: "Mensaje enviado", data: nuevo });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Error enviar mensaje" });
    }
});

// ======================================================
// SUBIR ARCHIVOS CLOUDINARY
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
    console.log(`Server running on port ${PORT}`);
});