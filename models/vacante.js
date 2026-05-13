const mongoose = require('mongoose');

const vacanteSchema = new mongoose.Schema({

    empresa: String,

    puesto: String,

    sueldo: String,

    sector: String,

    ubicacion: String,

    reclutadorEmail: String,

    postulantes: {
        type: Array,
        default: []
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }

}, {
    collection: 'vacantes'
});

module.exports = mongoose.model('Vacante', vacanteSchema);