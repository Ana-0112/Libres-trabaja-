const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({

    vacanteId: String,

    emisor: String,

    receptor: String,

    texto: String,

    fecha: {
        type: Date,
        default: Date.now
    }

}, {
    collection: 'mensajes'
});

module.exports = mongoose.model('Mensaje', mensajeSchema);