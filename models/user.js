const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    nombre: String,

    apellidos: String,

    email: {
        type: String,
        unique: true
    },

    telefono: String,

    password: String,

    rol: {
        type: String,
        default: "candidato"
    },

    fotoPerfil: String,

    cvUrl: String,

    empresa: String,

    ubicacion: String,

    fotosEmpresa: [String],

    fcmToken: {
        type: String,
        default: ""
    }

}, {
    collection: 'users'
});

module.exports = mongoose.model('User', userSchema);