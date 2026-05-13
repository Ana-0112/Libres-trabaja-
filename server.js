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
// MODELOS
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
    // TOKEN FIREBASE
    // ======================================================

    fcmToken: {
        type: String,
        default: ""
    }

}), 'users');

const Vacante = mongoose.model('Vacante', new mongoose.Schema({

    empresa: {
        type: String,
        default: ""
    },

    puesto: {
        type: String,
        default: ""
    },

    sueldo: {
        type: String,
        default: ""
    },

    sector: {
        type: String,
        default: ""
    },

    ubicacion: {
        type: String,
        default: ""
    },

    reclutadorEmail: {
        type: String,
        default: ""
    },

    postulantes: {
        type: Array,
        default: []
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }

}), 'vacantes');

const Postulacion = mongoose.model('Postulacion', new mongoose.Schema({

    vacanteId: {
        type: String,
        default: ""
    },

    candidatoEmail: {
        type: String,
        default: ""
    },

    reclutadorEmail: {
        type: String,
        default: ""
    },

    nombreCandidato: {
        type: String,
        default: ""
    },

    puesto: {
        type: String,
        default: ""
    },

    empresa: {
        type: String,
        default: ""
    },

    estado: {
        type: String,
        default: "Pendiente"
    },

    mensaje: {
        type: String,
        default: ""
    },

    entrevistaFecha: {
        type: String,
        default: ""
    }

}), 'postulaciones');

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

    console.log("TOKEN RECIBIDO:", req.body);

    try {

        const { email, fcmToken } = req.body;

        const actualizado = await User.findOneAndUpdate(

            {
                email: email.trim().toLowerCase()
            },

            {
                $set: {
                    fcmToken: fcmToken
                }
            },

            {
                new: true
            }
        );

        res.status(200).json({
            message: "FCM token guardado",
            user: actualizado
        });

    } catch (e) {

        console.log("ERROR FCM:", e);

        res.status(500).json({
            error: "Error guardando token"
        });

    }

});

// ======================================================
// CREAR VACANTE
// ======================================================

app.post('/api/vacantes', async (req, res) => {

    try {

        const nueva = new Vacante({

            ...req.body,

            reclutadorEmail:
                req.body.reclutadorEmail
                .trim()
                .toLowerCase()

        });

        await nueva.save();

        res.status(201).json({
            message: "Vacante creada"
        });

    } catch (e) {

        console.log("ERROR CREAR VACANTE:", e);

        res.status(500).json({
            error: "Error creando vacante"
        });

    }

});

// ======================================================
// OBTENER VACANTES
// ======================================================

app.get('/api/vacantes', async (req, res) => {

    try {

        const vacantes = await Vacante.find()
        .sort({
            fechaCreacion: -1
        });

        res.status(200).json(vacantes);

    } catch (e) {

        console.log("ERROR VACANTES:", e);

        res.status(500).json({
            error: "Error vacantes"
        });

    }

});

// ======================================================
// VACANTES RECLUTADOR
// ======================================================

app.get('/api/vacantes/reclutador/:email', async (req, res) => {

    try {

        const email =
            req.params.email
            .trim()
            .toLowerCase();

        const vacantes = await Vacante.find({
            reclutadorEmail: email
        }).sort({
            fechaCreacion: -1
        });

        res.status(200).json(vacantes);

    } catch (e) {

        console.log("ERROR VACANTES RECLUTADOR:", e);

        res.status(500).json({
            error: "Error vacantes reclutador"
        });

    }

});

// ======================================================
// POSTULARSE
// ======================================================

app.post('/api/vacantes/postular', async (req, res) => {

    try {

        const {
            vacanteId,
            candidatoEmail
        } = req.body;

        const email =
            candidatoEmail
            .trim()
            .toLowerCase();

        const existe = await Postulacion.findOne({

            vacanteId,

            candidatoEmail: email

        });

        if (existe) {

            return res.status(400).json({
                error: "Ya te postulaste"
            });

        }

        const vacante =
            await Vacante.findById(vacanteId);

        const usuario =
            await User.findOne({
                email
            });

        const nueva = new Postulacion({

            ...req.body,

            candidatoEmail: email,

            reclutadorEmail:
                vacante?.reclutadorEmail || "",

            nombreCandidato:
                usuario?.nombre || ""

        });

        await nueva.save();

        await Vacante.findByIdAndUpdate(

            vacanteId,

            {
                $addToSet: {
                    postulantes: email
                }
            }

        );

        res.status(201).json({
            message: "Postulación exitosa"
        });

    } catch (e) {

        console.log("ERROR POSTULACIÓN:", e);

        res.status(500).json({
            error: "Error postulación"
        });

    }

});

// ======================================================
// POSTULACIONES DEL USUARIO
// ======================================================

app.get('/api/postulaciones/usuario/:email', async (req, res) => {

    try {

        const email =
            req.params.email
            .trim()
            .toLowerCase();

        const postulaciones =
            await Postulacion.find({
                candidatoEmail: email
            });

        res.status(200).json(postulaciones);

    } catch (e) {

        console.log("ERROR POSTULACIONES:", e);

        res.status(500).json({
            error: "Error postulaciones"
        });

    }

});

// ======================================================
// OBTENER MENSAJES CHAT
// ======================================================

app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {

    try {

        const {
            vacanteId,
            emisor,
            receptor
        } = req.params;

        const e =
            emisor.trim().toLowerCase();

        const r =
            receptor.trim().toLowerCase();

        const mensajes = await Mensaje.find({

            vacanteId,

            $or: [

                {
                    emisor: e,
                    receptor: r
                },

                {
                    emisor: r,
                    receptor: e
                }

            ]

        }).sort({
            fecha: 1
        });

        res.status(200).json(mensajes);

    } catch (e) {

        console.log("ERROR CHAT:", e);

        res.status(500).json({
            error: "Error chat"
        });

    }

});

// ======================================================
// ENVIAR MENSAJE
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

        const receptorUser = await User.findOne({

            email: receptor.trim().toLowerCase()

        });

        console.log("TOKEN RECEPTOR:");

        console.log(receptorUser?.fcmToken);

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
// UPLOAD CLOUDINARY
// ======================================================

app.post('/api/upload', async (req, res) => {

    try {

        const result =
            await cloudinary.uploader.upload(

                req.body.data,

                {
                    folder: "libres_trabaja",
                    resource_type: "auto"
                }

            );

        res.status(200).json({
            url: result.secure_url
        });

    } catch (e) {

        console.log("ERROR UPLOAD:", e);

        res.status(500).json({
            error: "Error upload"
        });

    }

});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Servidor activo puerto ${PORT}`);

});