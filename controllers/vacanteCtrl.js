const path = require('path');
const Vacante = require(path.join(__dirname, '..', 'models', 'vacante'));

const crearVacante = async (req, res) => {
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
};

const getVacantes = async (req, res) => {
    try {
        const data = await Vacante.find().sort({ fechaCreacion: -1 });
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error vacantes" });
    }
};

const getVacantesReclutador = async (req, res) => {
    try {
        const email = req.params.email.trim().toLowerCase();
        const data = await Vacante.find({ reclutadorEmail: email });
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error reclutador" });
    }
};

const eliminarVacante = async (req, res) => {
    try {
        const { id } = req.params;
        const vacante = await Vacante.findByIdAndDelete(id);
        if (!vacante) {
            return res.status(404).json({ error: "Vacante no encontrada" });
        }
        res.json({ message: "Vacante eliminada" });
    } catch (e) {
        res.status(500).json({ error: "Error eliminar vacante" });
    }
};

const actualizarVacante = async (req, res) => {
    try {
        const { id } = req.params;
        const vacante = await Vacante.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!vacante) {
            return res.status(404).json({ error: "Vacante no encontrada" });
        }
        res.json(vacante);
    } catch (e) {
        res.status(500).json({ error: "Error actualizar vacante" });
    }
};

const getVacantesFeed = async (req, res) => {
    try {
        const data = await Vacante.find().sort({ fechaCreacion: -1 });
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error vacantes feed" });
    }
};

const getPostulantesVacante = async (req, res) => {
    try {
        const { vacanteId } = req.params;
        const Postulacion = require(path.join(__dirname, '..', 'models', 'postulacion'));
        const User = require(path.join(__dirname, '..', 'models', 'user'));
        
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
        res.status(500).json({ error: "Error obtener postulantes" });
    }
};

module.exports = {
    crearVacante,
    getVacantes,
    getVacantesReclutador,
    eliminarVacante,
    actualizarVacante,
    getVacantesFeed,
    getPostulantesVacante
};