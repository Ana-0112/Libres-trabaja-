const Postulacion = require('../models/Postulacion');
const Vacante = require('../models/Vacante');
const User = require('../models/User');

const postular = async (req, res) => {

    try {

        const { vacanteId, candidatoEmail } = req.body;

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
                error: "Ya postulado"
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
            message: "Postulado"
        });

    } catch (e) {

        res.status(500).json({
            error: "Error postulación"
        });

    }

};

// Obtener postulaciones de un usuario (candidato o reclutador)
const getPostulacionesUsuario = async (req, res) => {

    try {

        const email = req.params.email.trim().toLowerCase();

        // Buscar como candidato o como reclutador
        const postulaciones = await Postulacion.find({
            $or: [
                { candidatoEmail: email },
                { reclutadorEmail: email }
            ]
        }).sort({ _id: -1 });

        res.json(postulaciones);

    } catch (e) {

        console.log("Error getPostulacionesUsuario:", e);
        res.status(500).json({
            error: "Error al obtener postulaciones"
        });

    }

};

// Obtener postulantes de una vacante
const getPostulantesVacante = async (req, res) => {

    try {

        const vacanteId = req.params.vacanteId;

        const postulaciones = await Postulacion.find({ vacanteId });

        // Obtener info adicional de cada candidato
        const postulantes = await Promise.all(
            postulaciones.map(async (p) => {
                const usuario = await User.findOne({ email: p.candidatoEmail });
                return {
                    _id: p._id,
                    nombre: p.nombreCandidato || usuario?.nombre || "Sin nombre",
                    correo: p.candidatoEmail,
                    puesto: p.puesto,
                    estado: p.estado || "Pendiente",
                    mensaje: p.mensaje,
                    entrevista: p.entrevistaFecha,
                    fotoPerfil: usuario?.fotoPerfil || null,
                    cvUrl: usuario?.cvUrl || null
                };
            })
        );

        res.json(postulantes);

    } catch (e) {

        console.log("Error getPostulantesVacante:", e);
        res.status(500).json({
            error: "Error al obtener postulantes"
        });

    }

};

// Eliminar postulación
const eliminarPostulacion = async (req, res) => {

    try {

        const { id } = req.params;

        const postulacion = await Postulacion.findById(id);

        if (!postulacion) {
            return res.status(404).json({
                error: "Postulación no encontrada"
            });
        }

        await Postulacion.findByIdAndDelete(id);

        // También remover de la lista de postulantes de la vacante
        await Vacante.findByIdAndUpdate(
            postulacion.vacanteId,
            { $pull: { postulantes: postulacion.candidatoEmail } }
        );

        res.json({ message: "Postulación eliminada" });

    } catch (e) {

        console.log("Error eliminarPostulacion:", e);
        res.status(500).json({
            error: "Error al eliminar postulación"
        });

    }

};

// Enviar mensaje a candidato (desde reclutador)
const enviarMensajeCandidato = async (req, res) => {

    try {

        const { id } = req.params;
        const { mensaje, entrevista } = req.body;

        const updateData = {};
        if (mensaje) updateData.mensaje = mensaje;
        if (entrevista) updateData.entrevistaFecha = entrevista;

        const postulacion = await Postulacion.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!postulacion) {
            return res.status(404).json({
                error: "Postulación no encontrada"
            });
        }

        res.json({ message: "Mensaje enviado", postulacion });

    } catch (e) {

        console.log("Error enviarMensajeCandidato:", e);
        res.status(500).json({
            error: "Error al enviar mensaje"
        });

    }

};

module.exports = {
    postular,
    getPostulacionesUsuario,
    getPostulantesVacante,
    eliminarPostulacion,
    enviarMensajeCandidato
};