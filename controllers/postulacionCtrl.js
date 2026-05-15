const path = require('path');
const Postulacion = require(path.join(__dirname, '..', 'models', 'postulacion'));
const Vacante = require(path.join(__dirname, '..', 'models', 'vacante'));
const User = require(path.join(__dirname, '..', 'models', 'user'));

const posting = async (req, res) => {

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

// Funciones adicionales para las rutas

const getPostulacionesUsuario = async (req, res) => {
    try {
        const email = req.params.email.trim().toLowerCase();
        const postulaciones = await Postulacion.find({
            $or: [
                { candidatoEmail: email },
                { reclutadorEmail: email }
            ]
        }).sort({ _id: -1 });
        res.json(postulaciones);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener postulaciones" });
    }
};

const getPostulantesVacante = async (req, res) => {
    try {
        const vacanteId = req.params.vacanteId;
        const postulaciones = await Postulacion.find({ vacanteId });
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
        res.status(500).json({ error: "Error al obtener postulantes" });
    }
};

const eliminarPostulacion = async (req, res) => {
    try {
        const { id } = req.params;
        const postulacion = await Postulacion.findById(id);
        if (!postulacion) {
            return res.status(404).json({ error: "Postulación no encontrada" });
        }
        await Postulacion.findByIdAndDelete(id);
        await Vacante.findByIdAndUpdate(
            postulacion.vacanteId,
            { $pull: { postulantes: postulacion.candidatoEmail } }
        );
        res.json({ message: "Postulación eliminada" });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar postulación" });
    }
};

const enviarMensajeCandidato = async (req, res) => {
    try {
        const { id } = req.params;
        const { mensaje, entrevista } = req.body;
        const updateData = {};
        if (mensaje) updateData.mensaje = mensaje;
        if (entrevista) updateData.entrevistaFecha = entrevista;
        const postulacion = await Postulacion.findByIdAndUpdate(id, updateData, { new: true });
        if (!postulacion) {
            return res.status(404).json({ error: "Postulación no encontrada" });
        }
        res.json({ message: "Mensaje enviado", postulacion });
    } catch (e) {
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
};

module.exports = {
    posting,
    getPostulacionesUsuario,
    getPostulantesVacante,
    eliminarPostulacion,
    enviarMensajeCandidato
};