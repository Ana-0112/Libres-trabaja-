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
// OBTENER TODAS LAS VACANTES
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
// VACANTES DEL RECLUTADOR
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
// ELIMINAR VACANTE
// ======================================================

app.delete('/api/vacantes/:id', async (req, res) => {
    try {
        const result = await Vacante.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ message: "Vacante no encontrada" });
        }

        res.status(200).json({
            message: "Vacante eliminada"
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});
// ==========================================================
// ELIMINAR POSTULACIÓN (CANDIDATO)
// ==========================================

app.delete('/api/postulaciones/:id', async (req, res) => {
    try {
        // Buscamos la postulación por el ID enviado desde la app
        const postulacionEliminada = await Postulacion.findByIdAndDelete(req.params.id);

        if (!postulacionEliminada) {
            return res.status(404).json({ 
                message: "La postulación no existe o ya fue eliminada" 
            });
        }

        res.status(200).json({
            message: "Postulación retirada con éxito"
        });
    } catch (e) {
        console.error("Error al eliminar postulación:", e);
        res.status(500).json({ 
            message: "Hubo un error en el servidor al intentar eliminar" 
        });
    }
});
// ======================================================
// ACTUALIZAR VACANTE
// ======================================================

app.put('/api/vacantes/:id', async (req, res) => {

    try {

        await Vacante.findByIdAndUpdate(
            req.params.id,
            req.body
        );

        res.status(200).json({
            message: "Vacante actualizada"
        });

    } catch (e) {

        console.log("ERROR UPDATE VACANTE:", e);

        res.status(500).json({
            error: "Error actualizando vacante"
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
// POSTULACIONES DEL CANDIDATO
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

                const usuario =
                    await User.findOne({
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

                    mensaje:
                        post.mensaje || "",

                    entrevista:
                        post.entrevistaFecha || "",

                    fotoPerfil:
                        usuario?.fotoPerfil || "",

                    cvUrl:
                        usuario?.cvUrl || ""

                };

            })

        );

        res.status(200).json(resultado);

    } catch (e) {

        console.log("ERROR POSTULANTES:", e);

        res.status(500).json({
            error: "Error postulantes"
        });

    }

});

// ======================================================
// ELIMINAR POSTULANTE
// ======================================================

app.delete('/api/postulaciones/:id', async (req, res) => {

    try {

        await Postulacion.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            message: "Postulante eliminado"
        });

    } catch (e) {

        console.log("ERROR ELIMINAR POSTULANTE:", e);

        res.status(500).json({
            error: "Error eliminando postulante"
        });

    }

});

// ======================================================
// CHAT OBTENER MENSAJES
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

        res.status(200).json(

            mensajes.map(m => ({

                texto: m.texto,

                emisor: m.emisor,

                receptor: m.receptor,

                time:
                    m.fecha
                    ? new Date(m.fecha)
                        .toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    : ""

            }))

        );

    } catch (e) {

        console.log("ERROR CHAT GET:", e);

        res.status(500).json({
            error: "Error chat"
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

    console.log(`🚀 Servidor activo puerto ${PORT}`);

});