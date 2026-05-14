const mongoose = require('mongoose');

const postulacionSchema = new mongoose.Schema({

    vacanteId: String,

    candidatoEmail: String,

    reclutadorEmail: String,

    nombreCandidato: String,

    puesto: String,

    empresa: String,

    estado: {
        type: String,
        default: "Pendiente"
    },

    mensaje: String,

    entrevistaFecha: String

}, {
    collection: 'postulaciones'
});

module.exports = mongoose.model('Postulacion', postulacionSchema);