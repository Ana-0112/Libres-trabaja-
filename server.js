require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

// ======================================================
// CONFIG
// ======================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
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
    console.log("✅ MongoDB conectado");
})
.catch((err) => {
    console.log("❌ Error Mongo:", err);
});

// ======================================================
// MODELOS
// ======================================================

const User = mongoose.model('User', new mongoose.Schema({

    nombre: String,

    email: {
        type: String,
        unique: true
    },

    rol: String,

    fotoPerfil: {
        type: String,
        default: ""
    },

    cvUrl: {
        type: String,
        default: ""
    },

    empresa: String,

    password: {
        type: String,
        required: true
    }

}), 'users');

const Vacante = mongoose.model('Vacante', new mongoose.Schema({

    empresa: String,

    puesto: String,

    sueldo: String,

    reclutadorEmail: String,

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

    vacanteId: String,

    candidatoEmail: String,

    reclutadorEmail: String,

    nombreCandidato: String,

    puesto: String,

    empresa: String,

    estado: {
        type: String,
        default: "Pendiente"
    }

}), 'postulaciones');

const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({

    vacanteId: String,

    emisor: String,

    receptor: String,

    texto: String,

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

        console.log(e);

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

        res.status(200).json(user);

    } catch (e) {

        res.status(500).json({
            error: "Error perfil"
        });

    }

});

// ======================================================
// CREAR VACANTE
// ======================================================

app.post('/api/vacantes', async (req, res) => {

    try {

        const nueva = new Vacante(req.body);

        await nueva.save();

        res.status(201).json({
            message: "Vacante creada"
        });

    } catch (e) {

        console.log(e);

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
        .sort({ fechaCreacion: -1 });

        res.status(200).json(vacantes);

    } catch (e) {

        res.status(500).json({
            error: "Error vacantes"
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

        const existe = await Postulacion.findOne({
            vacanteId,
            candidatoEmail
        });

        if (existe) {

            return res.status(400).json({
                error: "Ya postulado"
            });

        }

        const vacante = await Vacante.findById(vacanteId);

        const nueva = new Postulacion({

            ...req.body,

            reclutadorEmail:
                vacante.reclutadorEmail

        });

        await nueva.save();

        await Vacante.findByIdAndUpdate(
            vacanteId,
            {
                $addToSet: {
                    postulantes: candidatoEmail
                }
            }
        );

        res.status(201).json({
            message: "Postulación exitosa"
        });

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error postulación"
        });

    }

});

// ======================================================
// VER POSTULANTES
// ======================================================

app.get('/api/vacantes/postulantes/:vacanteId', async (req, res) => {

    try {

        const postulaciones =
            await Postulacion.find({
                vacanteId: req.params.vacanteId
            });

        const resultado = await Promise.all(

            postulaciones.map(async (post) => {

                const usuario = await User.findOne({
                    email: post.candidatoEmail
                });

                return {

                    _id: post._id,

                    nombre:
                        usuario?.nombre || "",

                    correo:
                        post.candidatoEmail || "",

                    puesto:
                        post.puesto || "",

                    estado:
                        post.estado || "",

                    fotoPerfil:
                        usuario?.fotoPerfil || "",

                    cvUrl:
                        usuario?.cvUrl || ""

                };

            })

        );

        res.status(200).json(resultado);

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error postulantes"
        });

    }

});

// ======================================================
// CHAT GET
// ======================================================

app.get('/api/mensajes/:vacanteId/:emisor/:receptor', async (req, res) => {

    try {

        const {
            vacanteId,
            emisor,
            receptor
        } = req.params;

        const mensajes = await Mensaje.find({

            vacanteId,

            $or: [

                {
                    emisor,
                    receptor
                },

                {
                    emisor: receptor,
                    receptor: emisor
                }

            ]

        }).sort({ fecha: 1 });

        res.status(200).json(

            mensajes.map(m => ({

                texto: m.texto,

                emisor: m.emisor,

                receptor: m.receptor,

                time: m.fecha
                    ? new Date(m.fecha)
                        .toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    : ""

            }))

        );

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error chat"
        });

    }

});

// ======================================================
// CHAT ENVIAR
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

            emisor,

            receptor,

            texto

        });

        await nuevo.save();

        res.status(201).json({
            message: "Mensaje enviado"
        });

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error enviar mensaje"
        });

    }

});

// ======================================================
// UPLOAD
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

        console.log(e);

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

    console.log(` Servidor activo puerto ${PORT}`);

});