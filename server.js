require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

// ======================================================
// CONFIGURACIÓN
// ======================================================

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

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

.then(() => {

    console.log("✅ MongoDB conectado correctamente");

})

.catch((err) => {

    console.log("❌ Error MongoDB:", err);

});

// ======================================================
// MODELO USER
// ======================================================

const User = mongoose.model('User', new mongoose.Schema({

    nombre: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        unique: true,
        required: true
    },

    rol: {
        type: String,
        default: "candidato"
    },

    fotoPerfil: {
        type: String,
        default: ""
    },

    cvUrl: {
        type: String,
        default: ""
    },

    empresa: {
        type: String,
        default: ""
    },

    telefono: {
        type: String,
        default: ""
    },

    password: {
        type: String,
        required: true
    },

    // ======================================================
    // NUEVO CAMPO FCM TOKEN
    // ======================================================

    fcmToken: {
        type: String,
        default: ""
    }

}), 'users');

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

            return res.status(401).json({
                error: "Usuario no encontrado"
            });

        }

        res.status(200).json(user);

    } catch (e) {

        console.log("ERROR LOGIN:", e);

        res.status(500).json({
            error: "Error login"
        });

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

        if (!user) {

            return res.status(404).json({
                error: "Perfil no encontrado"
            });

        }

        res.status(200).json(user);

    } catch (e) {

        console.log("ERROR PERFIL:", e);

        res.status(500).json({
            error: "Error perfil"
        });

    }

});

// ======================================================
// ACTUALIZAR PERFIL
// ======================================================

app.put('/api/perfil/update', async (req, res) => {

    try {

        const actualizado =
            await User.findOneAndUpdate(

                {
                    email: req.body.email
                        .trim()
                        .toLowerCase()
                },

                {
                    $set: req.body
                },

                {
                    new: true
                }

            );

        res.status(200).json(actualizado);

    } catch (e) {

        console.log("ERROR UPDATE PERFIL:", e);

        res.status(500).json({
            error: "Error actualizando perfil"
        });

    }

});

// ======================================================
// GUARDAR FCM TOKEN
// ======================================================

app.put('/api/users/fcm-token', async (req, res) => {

    try {

        const {
            email,
            fcmToken
        } = req.body;

        if (!email || !fcmToken) {

            return res.status(400).json({
                error: "Email y token requeridos"
            });

        }

        const actualizado = await User.findOneAndUpdate(

            {
                email: email.trim().toLowerCase()
            },

            {
                $set: {
                    fcmToken
                }
            },

            {
                new: true
            }

        );

        if (!actualizado) {

            return res.status(404).json({
                error: "Usuario no encontrado"
            });

        }

        res.status(200).json({
            message: "FCM token guardado",
            user: actualizado
        });

    } catch (e) {

        console.log("ERROR FCM TOKEN:", e);

        res.status(500).json({
            error: "Error guardando token"
        });

    }

});

// ======================================================
// CHAT ENVIAR MENSAJE
// ======================================================

app.post('/api/mensajes/enviar', async (req, res) => {

    try {

        const {
            vacanteId,
            emisor,
            receptor,
            texto
        } = req.body;

        const nuevo = new Mensaje({

            vacanteId,

            emisor:
                emisor.trim().toLowerCase(),

            receptor:
                receptor.trim().toLowerCase(),

            texto

        });

        await nuevo.save();

        // ======================================================
        // OBTENER TOKEN DEL RECEPTOR
        // ======================================================

        const receptorUser = await User.findOne({

            email: receptor.trim().toLowerCase()

        });

        console.log("TOKEN RECEPTOR:", receptorUser?.fcmToken);

        // Aquí luego mandarás la notificación push

        res.status(201).json({
            message: "Mensaje enviado"
        });

    } catch (e) {

        console.log("ERROR ENVIAR MENSAJE:", e);

        res.status(500).json({
            error: "Error enviar mensaje"
        });

    }

});

// ======================================================
// MODELO MENSAJES
// ======================================================

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({

    vacanteId: {
        type: String,
        default: ""
    },

    emisor: {
        type: String,
        default: ""
    },

    receptor: {
        type: String,
        default: ""
    },

    texto: {
        type: String,
        default: ""
    },

    fecha: {
        type: Date,
        default: Date.now
    }

}), 'mensajes');

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Servidor activo puerto ${PORT}`);

});